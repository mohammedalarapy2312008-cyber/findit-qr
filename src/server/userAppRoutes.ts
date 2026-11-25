import crypto from 'crypto';
import type { Express, Request, Response, NextFunction } from 'express';
import {
  COVER_LIBRARY_CATALOG,
  FALLBACK_LIBRARY_COVERS,
  GROUP_LIBRARY_COVERS,
  ITEM_LIBRARY_COVERS,
} from '../data/coverLibraryCatalog';
import {
  AccountContactMethod,
  ContactMethodType,
  ItemCategory,
  StoredMediaAssetRecord,
  SupportTicket,
  SupportTicketAttachment,
  SupportTicketReply,
  UserProfile,
} from '../types/domain';
import {
  matchSmartCover,
  searchCoverLibrary,
} from '../utils/aiCoverLogic';
import {
  ensureProfileContactMethods,
  normalizeContactMethodValue,
  validateContactMethodInput,
} from '../utils/contactMethodsLogic';
import { isSafeMediaOrHttpsUrl } from '../utils/qrLogic';
import { AnalyticsTimeframe, computeWorkspaceAnalytics } from '../utils/workspaceAnalytics';
import { DatabaseSchema, StoredUserRecord } from './dbSchema';
import {
  CloudStorageOverrides,
  deleteObjectFromCloudStorage,
  executeLocalToCloudMigration,
  fetchBufferFromCloudStorage,
  getPermanentStorageStatus,
  mirrorBufferToCloudStorage,
  planLocalToCloudMigration,
  verifyCloudStorageRoundtrip,
} from './integrations/cloudStorageAdapter';
import {
  buildSupportTicketEmail,
  EmailServiceOverrides,
  sendTransactionalEmail,
} from './integrations/emailService';
import {
  ALLOWED_MEDIA_FOLDER_SET,
  AllowedMediaFolder,
  buildMediaAssetKey,
  deleteLocalMediaFileAndManifest,
  evaluateMediaAccess,
  getDefaultFolderVisibility,
  persistMediaManifestRecord,
  readMediaManifest,
  resolveMediaRoot,
  resolveSafeMediaReadPath,
  storeBase64ImageToMedia,
} from './integrations/mediaStorageService';

interface AuthenticatedServerRequest extends Request {
  user?: StoredUserRecord;
}

export function registerUserAppRoutes(deps: {
  app: Express;
  db: DatabaseSchema;
  saveDatabase: () => void;
  requireAuth: (req: AuthenticatedServerRequest, res: Response, next: NextFunction) => void;
  resolveOptionalAuthUser?: (req: Request) => { user: StoredUserRecord; isAdmin: boolean } | null;
  decorateProfileAuthority: (userRec: StoredUserRecord) => UserProfile;
  recordUserActivity: (
    uid: string,
    actionType:
      | 'item_updated'
      | 'profile_updated'
      | 'privacy_updated',
    titleAr: string,
    titleEn: string,
    detailAr: string,
    detailEn: string,
    itemId?: string
  ) => void;
  mediaRoot?: string;
  emailOverrides?: EmailServiceOverrides;
  cloudStorageOverrides?: CloudStorageOverrides;
}) {
  const {
    app,
    db,
    saveDatabase,
    requireAuth,
    resolveOptionalAuthUser,
    decorateProfileAuthority,
    recordUserActivity,
    mediaRoot,
    emailOverrides,
    cloudStorageOverrides,
  } = deps;

  if (!db.mediaAssets) {
    db.mediaAssets = {};
  }

  // Hydrate mediaAssets from persistent manifest on startup without overwriting existing DB entries
  const manifestAssets = readMediaManifest(mediaRoot);
  for (const [assetId, manifestRecord] of Object.entries(manifestAssets)) {
    if (!db.mediaAssets[assetId]) {
      db.mediaAssets[assetId] = manifestRecord;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. PERMANENT MEDIA STORAGE (CLOUDFLARE R2 + LOCAL FALLBACK + ACCESS CONTROL)
  // ---------------------------------------------------------------------------
  app.post('/api/media/upload', requireAuth, async (req: AuthenticatedServerRequest, res: Response) => {
    const userRec = req.user!;
    const body = (req.body || {}) as {
      folder?: string;
      dataUrl?: string;
      fileName?: string;
    };

    const stored = storeBase64ImageToMedia({
      mediaRoot,
      folder: typeof body.folder === 'string' ? body.folder : 'originals',
      dataUrl: typeof body.dataUrl === 'string' ? body.dataUrl : '',
    });

    if (!stored.ok) {
      res.status(stored.status).json({
        ok: false,
        errorCode: stored.errorCode,
        messageAr: stored.messageAr,
        messageEn: stored.messageEn,
      });
      return;
    }

    const assetId = buildMediaAssetKey(stored.folder, stored.filename);
    const cloudObjectKey = `users/${userRec.uid}/${stored.folder}/${stored.filename}`;
    const cloudMirror = await mirrorBufferToCloudStorage({
      objectKey: cloudObjectKey,
      buffer: stored.buffer,
      contentType: stored.mimeType,
      env: cloudStorageOverrides?.env,
      fetchImpl: cloudStorageOverrides?.fetchImpl,
    });

    const visibility = getDefaultFolderVisibility(stored.folder);
    const cleanFileName =
      typeof body.fileName === 'string' && body.fileName.trim()
        ? body.fileName.trim().slice(0, 120)
        : stored.filename;

    const nowIso = new Date().toISOString();
    const record: StoredMediaAssetRecord = {
      id: assetId,
      ownerUid: userRec.uid,
      folder: stored.folder,
      filename: stored.filename,
      url: stored.url,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      visibility,
      storageDriver: cloudMirror.mirrored ? 's3_compatible' : 'local_persistent',
      cloudKey: cloudMirror.cloudKey,
      originalName: cleanFileName,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (!db.mediaAssets) db.mediaAssets = {};
    db.mediaAssets[assetId] = record;
    persistMediaManifestRecord(record, mediaRoot);
    saveDatabase();

    res.status(201).json({
      ok: true,
      url: stored.url,
      folder: stored.folder,
      visibility: record.visibility,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      storageDriver: record.storageDriver,
      cloudMirrored: cloudMirror.mirrored,
      name: cleanFileName,
    });
  });

  app.get('/api/media/my-assets', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const uid = req.user!.uid;
    const assets = Object.values(db.mediaAssets || {})
      .filter((a) => a.ownerUid === uid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json({
      ok: true,
      assets,
      storage: getPermanentStorageStatus({ env: cloudStorageOverrides?.env }),
    });
  });

  app.delete('/api/media/:folder/:filename', requireAuth, async (req: AuthenticatedServerRequest, res: Response) => {
    const folderParam = (req.params.folder || '').trim();
    const filenameParam = (req.params.filename || '').trim();

    if (
      !ALLOWED_MEDIA_FOLDER_SET.has(folderParam) ||
      !/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(filenameParam)
    ) {
      res.status(400).json({ ok: false, errorCode: 'INVALID_MEDIA_PATH' });
      return;
    }

    const folder = folderParam as AllowedMediaFolder;
    const assetId = buildMediaAssetKey(folder, filenameParam);
    const url = `/api/media/${folder}/${filenameParam}`;
    const record = db.mediaAssets?.[assetId] || readMediaManifest(mediaRoot)[assetId] || null;
    const callerAuth = resolveOptionalAuthUser ? resolveOptionalAuthUser(req) : null;
    const callerUid = req.user!.uid;
    const callerIsAdmin = Boolean(callerAuth?.isAdmin);

    if (!record) {
      res.status(404).json({ ok: false, errorCode: 'MEDIA_NOT_FOUND' });
      return;
    }
    if (record.ownerUid !== callerUid && !callerIsAdmin) {
      res.status(403).json({
        ok: false,
        errorCode: 'FORBIDDEN_MEDIA_DELETE',
        messageAr: 'غير مصرح لك بحذف هذا الملف.',
        messageEn: 'Access denied: only the file owner or admin can delete this media file.',
      });
      return;
    }

    let deletedCloud = false;
    if (record.cloudKey) {
      const cloudDel = await deleteObjectFromCloudStorage({
        objectKey: record.cloudKey,
        env: cloudStorageOverrides?.env,
        fetchImpl: cloudStorageOverrides?.fetchImpl,
      });
      deletedCloud = cloudDel.deleted;
    }

    const localDel = deleteLocalMediaFileAndManifest({
      mediaRoot,
      folder,
      filename: filenameParam,
    });
    if (!localDel.ok) {
      res.status(localDel.status).json({ ok: false, errorCode: localDel.errorCode });
      return;
    }

    if (db.mediaAssets && assetId in db.mediaAssets) {
      delete db.mediaAssets[assetId];
    }

    // Safely detach removed original photo URL from owner's originalImages arrays without deleting items
    for (const item of Object.values(db.items || {})) {
      if (item.ownerUid !== record.ownerUid) continue;
      if (Array.isArray(item.originalImages) && item.originalImages.includes(url)) {
        item.originalImages = item.originalImages.filter((u) => u !== url);
      }
    }
    for (const grp of Object.values(db.groups || {})) {
      if (grp.ownerUid !== record.ownerUid) continue;
      if (Array.isArray(grp.originalImages) && grp.originalImages.includes(url)) {
        grp.originalImages = grp.originalImages.filter((u) => u !== url);
      }
    }

    saveDatabase();
    res.json({
      ok: true,
      deleted: true,
      deletedLocal: localDel.deletedLocal,
      deletedCloud,
      url,
    });
  });

  // Admin-only Cloudflare R2 diagnostics & non-destructive migration controls
  app.post('/api/storage/r2/verify', requireAuth, async (req: AuthenticatedServerRequest, res: Response) => {
    const caller = resolveOptionalAuthUser ? resolveOptionalAuthUser(req) : null;
    if (!caller?.isAdmin) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_ADMIN_ONLY' });
      return;
    }
    const report = await verifyCloudStorageRoundtrip(cloudStorageOverrides);
    res.status(report.ok ? 200 : report.configured ? 502 : 200).json({
      ok: report.ok,
      report,
    });
  });

  app.get('/api/storage/r2/migration-plan', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const caller = resolveOptionalAuthUser ? resolveOptionalAuthUser(req) : null;
    if (!caller?.isAdmin) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_ADMIN_ONLY' });
      return;
    }
    const plan = planLocalToCloudMigration({
      mediaRoot: resolveMediaRoot(mediaRoot),
      db,
      manifestRecords: readMediaManifest(mediaRoot),
      env: cloudStorageOverrides?.env,
    });
    res.json({ ok: true, plan });
  });

  app.post('/api/storage/r2/migrate', requireAuth, async (req: AuthenticatedServerRequest, res: Response) => {
    const caller = resolveOptionalAuthUser ? resolveOptionalAuthUser(req) : null;
    if (!caller?.isAdmin) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_ADMIN_ONLY' });
      return;
    }
    const body = (req.body || {}) as { dryRun?: boolean; confirmMigration?: boolean };
    const result = await executeLocalToCloudMigration({
      mediaRoot: resolveMediaRoot(mediaRoot),
      db,
      manifestRecords: readMediaManifest(mediaRoot),
      persistRecord: (rec) => persistMediaManifestRecord(rec, mediaRoot),
      saveDatabase,
      dryRun: body.dryRun !== false,
      confirmMigration: body.confirmMigration === true,
      overrides: cloudStorageOverrides,
    });
    res.status(result.ok ? 200 : 400).json({ ok: result.ok, migration: result });
  });

  app.get('/api/media/:folder/:filename', async (req: Request, res: Response) => {
    const folderParam = (req.params.folder || '').trim();
    const filenameParam = (req.params.filename || '').trim();

    if (
      !ALLOWED_MEDIA_FOLDER_SET.has(folderParam) ||
      !/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(filenameParam)
    ) {
      res.status(400).json({ ok: false, errorCode: 'INVALID_MEDIA_PATH' });
      return;
    }

    const folder = folderParam as AllowedMediaFolder;
    const assetId = buildMediaAssetKey(folder, filenameParam);
    const url = `/api/media/${folder}/${filenameParam}`;
    const record = db.mediaAssets?.[assetId] || readMediaManifest(mediaRoot)[assetId] || null;
    const caller = resolveOptionalAuthUser ? resolveOptionalAuthUser(req) : null;

    const resolved = resolveSafeMediaReadPath({
      mediaRoot,
      folder,
      filename: filenameParam,
    });

    if (!record && !resolved.ok && caller) {
      res.status(404).json({ ok: false, errorCode: 'MEDIA_NOT_FOUND' });
      return;
    }

    const access = evaluateMediaAccess({
      folder,
      filename: filenameParam,
      url,
      record,
      callerUid: caller?.user.uid || null,
      callerIsAdmin: Boolean(caller?.isAdmin),
      db,
    });

    if (!access.allowed) {
      res.status(access.status || 403).json({
        ok: false,
        errorCode: access.errorCode || 'FORBIDDEN_MEDIA_ACCESS',
        messageAr:
          access.status === 401
            ? 'هذا الملف خاص ويتطلب تسجيل الدخول بحساب المالك للوصول إليه.'
            : 'غير مصرح لك بالوصول إلى هذا الملف الخاص.',
        messageEn:
          access.status === 401
            ? 'This file is private. Sign in as the owner to access it.'
            : 'Access denied to this private user file.',
      });
      return;
    }

    const cacheControl = access.isPublicCacheable
      ? 'public, max-age=31536000, immutable'
      : 'private, no-store';

    if (resolved.ok) {
      res.setHeader('Content-Type', resolved.contentType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', cacheControl);
      res.sendFile(resolved.fullPath);
      return;
    }

    // Permanent cloud fallback/primary retrieval from Cloudflare R2 when local copy is absent
    if (record?.cloudKey) {
      const remote = await fetchBufferFromCloudStorage({
        objectKey: record.cloudKey,
        env: cloudStorageOverrides?.env,
        fetchImpl: cloudStorageOverrides?.fetchImpl,
      });
      if (remote.ok) {
        res.setHeader('Content-Type', record.mimeType || remote.contentType);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', cacheControl);
        res.send(remote.buffer);
        return;
      }
    }

    res.status(resolved.status).json({ ok: false, errorCode: resolved.errorCode });
  });

  // ---------------------------------------------------------------------------
  // 2. CURATED 40-COVER LIBRARY & SMART MATCHING ENGINE (ZERO GEMINI CALLS PER ITEM)
  // ---------------------------------------------------------------------------
  app.get('/api/covers/library', (req: Request, res: Response) => {
    const rawScope = typeof req.query.scope === 'string' ? req.query.scope.trim() : 'all';
    const scope: 'item' | 'group' | 'fallback' | 'all' =
      rawScope === 'item' || rawScope === 'group' || rawScope === 'fallback' ? rawScope : 'all';
    const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
    const rawCategory =
      typeof req.query.category === 'string' ? req.query.category.trim().slice(0, 40) : 'all';
    const validCategories = new Set<string>([
      'all',
      'electronics',
      'bags',
      'keys',
      'documents',
      'pets',
      'vehicles',
      'commercial',
    ]);
    const category = (validCategories.has(rawCategory) ? rawCategory : 'all') as
      | ItemCategory
      | 'all';

    const covers = searchCoverLibrary({
      scope,
      query,
      category,
    });

    res.json({
      ok: true,
      counts: {
        total: COVER_LIBRARY_CATALOG.length,
        items: ITEM_LIBRARY_COVERS.length,
        groups: GROUP_LIBRARY_COVERS.length,
        fallbacks: FALLBACK_LIBRARY_COVERS.length,
      },
      covers,
    });
  });

  app.post('/api/covers/match', (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      entityType?: 'item' | 'org_group' | 'shared_group';
      name?: string;
      category?: ItemCategory;
      description?: string;
      childItemNames?: string[];
      childItemCategories?: ItemCategory[];
    };

    const entityType: 'item' | 'org_group' | 'shared_group' =
      body.entityType === 'org_group' || body.entityType === 'shared_group'
        ? body.entityType
        : 'item';

    const result = matchSmartCover({
      entityType,
      name: typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '',
      category: body.category,
      description: typeof body.description === 'string' ? body.description.trim().slice(0, 240) : '',
      childItemNames: Array.isArray(body.childItemNames)
        ? body.childItemNames.filter((x) => typeof x === 'string').slice(0, 20)
        : undefined,
      childCategories: Array.isArray(body.childItemCategories)
        ? body.childItemCategories.slice(0, 20)
        : undefined,
    });

    res.json({
      ok: true,
      coverUrl: result.coverUrl,
      coverSource: result.coverSource,
      matchedCover: result.cover,
      alternatives: result.alternatives,
      score: result.score,
      matchedKeyword: result.matchedKeyword,
    });
  });

  // Backward-compatible smart cover endpoint — uses instant curated library matching (no Gemini per-item billing)
  app.post('/api/ai-covers/generate', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const body = (req.body || {}) as {
      entityType?: 'item' | 'org_group' | 'shared_group';
      name?: string;
      category?: ItemCategory;
      description?: string;
      childItemNames?: string[];
      childItemCategories?: ItemCategory[];
    };

    const entityType: 'item' | 'org_group' | 'shared_group' =
      body.entityType === 'org_group' || body.entityType === 'shared_group'
        ? body.entityType
        : 'item';
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';

    if (name.length < 2) {
      res.status(400).json({
        ok: false,
        errorCode: 'COVER_NAME_REQUIRED',
        messageAr: 'أدخل اسم الغرض أو المجموعة أولًا لاختيار غلاف مناسب تلقائيًا.',
        messageEn: 'Enter an item or group name first to auto-match a tailored cover.',
      });
      return;
    }

    const matched = matchSmartCover({
      entityType,
      name,
      category: body.category,
      description: typeof body.description === 'string' ? body.description.trim().slice(0, 200) : '',
      childItemNames: Array.isArray(body.childItemNames)
        ? body.childItemNames.filter((x) => typeof x === 'string').slice(0, 20)
        : undefined,
      childCategories: Array.isArray(body.childItemCategories)
        ? body.childItemCategories.slice(0, 20)
        : undefined,
    });

    const isMatched = matched.coverSource === 'library_matched';
    res.json({
      ok: true,
      mode: matched.coverSource,
      coverSource: matched.coverSource,
      coverUrl: matched.coverUrl,
      matchedCover: matched.cover,
      alternatives: matched.alternatives,
      score: matched.score,
      matchedKeyword: matched.matchedKeyword,
      messageAr: isMatched
        ? `تم اختيار غلاف «${matched.cover.nameAr}» تلقائيًا من مكتبة الأغلفة الذكية.`
        : `تم تعيين غلاف احتياطي متناسق من هوية Midnight Teal («${matched.cover.nameAr}»).`,
      messageEn: isMatched
        ? `Automatically matched "${matched.cover.nameEn}" from the curated smart cover library.`
        : `Applied a Midnight Teal fallback cover ("${matched.cover.nameEn}").`,
    });
  });

  // ---------------------------------------------------------------------------
  // 3. CENTRALIZED ACCOUNT CONTACT METHODS CRUD
  // ---------------------------------------------------------------------------
  app.get('/api/contact-methods', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const userRec = req.user!;
    const methods = ensureProfileContactMethods(userRec.profile);
    if (!Array.isArray(userRec.profile.contactMethods)) {
      userRec.profile.contactMethods = methods;
      saveDatabase();
    }
    res.json({
      ok: true,
      contactMethods: methods,
      contactMethodsLimit: userRec.profile.contactMethodsLimit || 2,
    });
  });

  app.post('/api/contact-methods', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const userRec = req.user!;
    const body = (req.body || {}) as {
      type?: ContactMethodType;
      label?: string;
      value?: string;
      isActive?: boolean;
      isPrimary?: boolean;
    };

    const validation = validateContactMethodInput(body);
    if (!validation.valid) {
      res.status(400).json({
        ok: false,
        errorCode: Object.values(validation.errors)[0] || 'INVALID_CONTACT_METHOD',
        errors: validation.errors,
        messageAr: 'يرجى التحقق من نوع وسيلة التواصل والاسم والقيمة المدخلة.',
        messageEn: 'Please verify the contact method type, label, and value.',
      });
      return;
    }

    const existingList = ensureProfileContactMethods(userRec.profile);
    if (existingList.length >= 20) {
      res.status(400).json({
        ok: false,
        errorCode: 'CONTACT_DIRECTORY_FULL',
        messageAr: 'الحد الأقصى لوسائل التواصل المحفوظة في الحساب هو 20 وسيلة.',
        messageEn: 'Maximum 20 saved contact methods per account.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const methodType = body.type as ContactMethodType;
    const normalizedVal = normalizeContactMethodValue(methodType, body.value!.trim());
    const newMethod: AccountContactMethod = {
      id: `cm-${crypto.randomBytes(5).toString('hex')}`,
      type: methodType,
      label: body.label!.trim(),
      value: normalizedVal,
      isActive: body.isActive !== false,
      isPrimary: Boolean(body.isPrimary),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    userRec.profile.contactMethods = [...existingList, newMethod];
    // Sync primary legacy fields when applicable
    if (methodType === 'phone' && !userRec.profile.phone) userRec.profile.phone = normalizedVal;
    if (methodType === 'whatsapp' && !userRec.profile.whatsapp) userRec.profile.whatsapp = normalizedVal;
    if (methodType === 'telegram' && !userRec.profile.telegram) userRec.profile.telegram = normalizedVal;
    userRec.profile.updatedAt = nowIso;

    recordUserActivity(
      userRec.uid,
      'profile_updated',
      `إضافة وسيلة تواصل: ${newMethod.label}`,
      `Added Contact Method: ${newMethod.label}`,
      'تم حفظ وسيلة التواصل في الدليل المركزي للحساب.',
      'Saved contact method to account central directory.'
    );
    saveDatabase();

    res.status(201).json({
      ok: true,
      method: newMethod,
      contactMethods: userRec.profile.contactMethods,
      profile: decorateProfileAuthority(userRec),
    });
  });

  app.patch('/api/contact-methods/:id', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const userRec = req.user!;
    const methodId = req.params.id;
    const list = ensureProfileContactMethods(userRec.profile);
    const idx = list.findIndex((m) => m.id === methodId);
    if (idx === -1) {
      res.status(404).json({
        ok: false,
        errorCode: 'CONTACT_METHOD_NOT_FOUND',
        messageAr: 'وسيلة التواصل غير موجودة.',
        messageEn: 'Contact method not found.',
      });
      return;
    }

    const current = list[idx];
    const body = (req.body || {}) as Partial<{
      type: ContactMethodType;
      label: string;
      value: string;
      isActive: boolean;
      isPrimary: boolean;
    }>;

    const nextType = body.type || current.type;
    const nextLabel = typeof body.label === 'string' ? body.label.trim() : current.label;
    const nextRawVal = typeof body.value === 'string' ? body.value.trim() : current.value;
    const validation = validateContactMethodInput({
      type: nextType,
      label: nextLabel,
      value: nextRawVal,
    });
    if (!validation.valid) {
      res.status(400).json({
        ok: false,
        errorCode: Object.values(validation.errors)[0] || 'INVALID_CONTACT_METHOD',
        errors: validation.errors,
        messageAr: 'يرجى التحقق من صحة بيانات وسيلة التواصل.',
        messageEn: 'Please verify updated contact method fields.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedMethod: AccountContactMethod = {
      ...current,
      type: nextType,
      label: nextLabel,
      value: normalizeContactMethodValue(nextType, nextRawVal),
      isActive: typeof body.isActive === 'boolean' ? body.isActive : current.isActive,
      isPrimary: typeof body.isPrimary === 'boolean' ? body.isPrimary : current.isPrimary,
      updatedAt: nowIso,
    };

    const nextList = [...list];
    nextList[idx] = updatedMethod;
    userRec.profile.contactMethods = nextList;
    userRec.profile.updatedAt = nowIso;

    // Synchronize denormalized fallback contact values on items referencing this method ID
    for (const item of Object.values(db.items)) {
      if (item.ownerUid !== userRec.uid) continue;
      const linkedIds =
        item.selectedContactMethodIds || item.contactChannels?.selectedMethodIds || [];
      if (!linkedIds.includes(methodId)) continue;
      if (updatedMethod.type === 'phone') {
        item.contactChannels.customPhone = updatedMethod.isActive ? updatedMethod.value : '';
        item.contactChannels.showPhone = updatedMethod.isActive;
      } else if (updatedMethod.type === 'whatsapp') {
        item.contactChannels.customWhatsapp = updatedMethod.isActive ? updatedMethod.value : '';
        item.contactChannels.showWhatsapp = updatedMethod.isActive;
      } else if (updatedMethod.type === 'email') {
        item.contactChannels.customEmail = updatedMethod.isActive ? updatedMethod.value : '';
        item.contactChannels.showEmail = updatedMethod.isActive;
      } else if (updatedMethod.type === 'telegram') {
        item.contactChannels.customTelegram = updatedMethod.isActive ? updatedMethod.value : '';
        item.contactChannels.showTelegram = updatedMethod.isActive;
      }
      item.updatedAt = nowIso;
    }

    saveDatabase();
    res.json({
      ok: true,
      method: updatedMethod,
      contactMethods: userRec.profile.contactMethods,
      profile: decorateProfileAuthority(userRec),
    });
  });

  app.delete('/api/contact-methods/:id', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const userRec = req.user!;
    const methodId = req.params.id;
    const list = ensureProfileContactMethods(userRec.profile);
    if (!list.some((m) => m.id === methodId)) {
      res.status(404).json({ ok: false, errorCode: 'CONTACT_METHOD_NOT_FOUND' });
      return;
    }

    const nowIso = new Date().toISOString();
    userRec.profile.contactMethods = list.filter((m) => m.id !== methodId);
    userRec.profile.updatedAt = nowIso;

    for (const item of Object.values(db.items)) {
      if (item.ownerUid !== userRec.uid) continue;
      if (Array.isArray(item.selectedContactMethodIds)) {
        item.selectedContactMethodIds = item.selectedContactMethodIds.filter((id) => id !== methodId);
      }
      if (Array.isArray(item.contactChannels?.selectedMethodIds)) {
        item.contactChannels.selectedMethodIds = item.contactChannels.selectedMethodIds.filter(
          (id) => id !== methodId
        );
      }
    }

    saveDatabase();
    res.json({
      ok: true,
      contactMethods: userRec.profile.contactMethods,
      profile: decorateProfileAuthority(userRec),
    });
  });

  // ---------------------------------------------------------------------------
  // 4. WORKSPACE SUPPORT TICKETS (CREATE, LIST, USER REPLIES + ATTACHMENTS)
  // ---------------------------------------------------------------------------
  app.get('/api/workspace/tickets', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const userRec = req.user!;
    const uid = userRec.uid;
    const email = (userRec.email || '').toLowerCase();
    const tickets = Object.values(db.supportTickets || {})
      .filter((tk) => tk.userId === uid || tk.requesterEmail.toLowerCase() === email)
      .map((tk) => ({
        ...tk,
        replies: (tk.replies || []).filter((r) => !r.isInternalNote),
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    res.json({ ok: true, tickets });
  });

  app.post('/api/workspace/tickets', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const userRec = req.user!;
    const body = (req.body || {}) as {
      subject?: string;
      description?: string;
      category?: SupportTicket['category'];
      priority?: SupportTicket['priority'];
      relatedItemSerial?: string;
      attachments?: SupportTicketAttachment[];
    };

    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';

    if (subject.length < 3 || subject.length > 140) {
      res.status(400).json({
        ok: false,
        errorCode: 'INVALID_TICKET_SUBJECT',
        messageAr: 'يرجى إدخال عنوان واضح للتذكرة (من 3 إلى 140 حرفًا).',
        messageEn: 'Please provide a ticket subject between 3 and 140 characters.',
      });
      return;
    }
    if (description.length < 10 || description.length > 2000) {
      res.status(400).json({
        ok: false,
        errorCode: 'INVALID_TICKET_DESCRIPTION',
        messageAr: 'يرجى كتابة وصف كافٍ للمشكلة (10 أحرف على الأقل).',
        messageEn: 'Please provide a ticket description of at least 10 characters.',
      });
      return;
    }

    const validCategories = new Set(['general', 'technical', 'billing', 'abuse_report', 'enterprise', 'designs']);
    const validPriorities = new Set(['low', 'medium', 'high', 'urgent']);
    const category =
      body.category && validCategories.has(body.category) ? body.category : 'technical';
    const priority =
      body.priority && validPriorities.has(body.priority) ? body.priority : 'medium';

    const safeAttachments: SupportTicketAttachment[] = Array.isArray(body.attachments)
      ? body.attachments
          .filter((a) => a && typeof a.url === 'string' && isSafeMediaOrHttpsUrl(a.url, 400))
          .slice(0, 4)
          .map((a) => ({
            id: `att-${crypto.randomBytes(4).toString('hex')}`,
            name: (typeof a.name === 'string' ? a.name.trim() : 'Attachment').slice(0, 100),
            url: a.url.trim(),
            mimeType: typeof a.mimeType === 'string' ? a.mimeType.slice(0, 60) : undefined,
            sizeBytes: typeof a.sizeBytes === 'number' ? a.sizeBytes : undefined,
          }))
      : [];

    const nowIso = new Date().toISOString();
    const id = `tkt-${crypto.randomBytes(5).toString('hex')}`;
    const ticket: SupportTicket = {
      id,
      ticketNumber: `SUP-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: userRec.uid,
      requesterName: userRec.profile.displayName || userRec.email,
      requesterEmail: userRec.email,
      category,
      priority,
      status: 'open',
      subject,
      description,
      relatedItemSerial:
        typeof body.relatedItemSerial === 'string'
          ? body.relatedItemSerial.trim().slice(0, 40)
          : undefined,
      attachments: safeAttachments,
      replies: [],
      createdAt: nowIso,
      updatedAt: nowIso,
      closedAt: null,
    };

    if (!db.supportTickets) db.supportTickets = {};
    db.supportTickets[id] = ticket;
    saveDatabase();

    void sendTransactionalEmail(
      buildSupportTicketEmail({
        to: userRec.email,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        eventType: 'created',
        messageSnippet: ticket.description.slice(0, 280),
      }),
      emailOverrides
    ).catch(() => {
      // Non-blocking email notification
    });

    res.status(201).json({
      ok: true,
      ticket,
      messageAr: `تم إنشاء تذكرة الدعم بنجاح برقم ${ticket.ticketNumber}.`,
      messageEn: `Support ticket ${ticket.ticketNumber} created successfully.`,
    });
  });

  app.post('/api/workspace/tickets/:id/reply', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const userRec = req.user!;
    const ticketId = req.params.id;
    const existing = db.supportTickets?.[ticketId];
    if (!existing) {
      res.status(404).json({ ok: false, errorCode: 'TICKET_NOT_FOUND' });
      return;
    }
    const isOwner =
      existing.userId === userRec.uid ||
      existing.requesterEmail.toLowerCase() === userRec.email.toLowerCase();
    if (!isOwner) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_NOT_OWNER' });
      return;
    }

    const body = (req.body || {}) as {
      message?: string;
      attachments?: SupportTicketAttachment[];
    };
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (message.length < 2 || message.length > 2000) {
      res.status(400).json({
        ok: false,
        errorCode: 'INVALID_REPLY_MESSAGE',
        messageAr: 'يرجى كتابة نص الرد.',
        messageEn: 'Please write a reply message.',
      });
      return;
    }

    const safeAttachments: SupportTicketAttachment[] = Array.isArray(body.attachments)
      ? body.attachments
          .filter((a) => a && typeof a.url === 'string' && isSafeMediaOrHttpsUrl(a.url, 400))
          .slice(0, 3)
          .map((a) => ({
            id: `att-${crypto.randomBytes(4).toString('hex')}`,
            name: (typeof a.name === 'string' ? a.name.trim() : 'Attachment').slice(0, 100),
            url: a.url.trim(),
            mimeType: typeof a.mimeType === 'string' ? a.mimeType.slice(0, 60) : undefined,
            sizeBytes: typeof a.sizeBytes === 'number' ? a.sizeBytes : undefined,
          }))
      : [];

    const nowIso = new Date().toISOString();
    const reply: SupportTicketReply = {
      id: `rep-${crypto.randomBytes(4).toString('hex')}`,
      authorUid: userRec.uid,
      authorName: userRec.profile.displayName || userRec.email,
      authorRole: 'user',
      message,
      attachments: safeAttachments.length > 0 ? safeAttachments : undefined,
      isInternalNote: false,
      createdAt: nowIso,
    };

    existing.replies = [...(existing.replies || []), reply];
    if (existing.status === 'waiting_user' || existing.status === 'resolved') {
      existing.status = 'open';
    }
    existing.updatedAt = nowIso;
    saveDatabase();

    void sendTransactionalEmail(
      buildSupportTicketEmail({
        to: existing.requesterEmail,
        ticketNumber: existing.ticketNumber,
        subject: existing.subject,
        eventType: 'reply',
        messageSnippet: message.slice(0, 280),
      }),
      emailOverrides
    ).catch(() => {
      // Non-blocking email notification
    });

    res.json({
      ok: true,
      ticket: {
        ...existing,
        replies: existing.replies.filter((r) => !r.isInternalNote),
      },
    });
  });

  // ---------------------------------------------------------------------------
  // 5. WORKSPACE REAL-DATA ANALYTICS ENDPOINT
  // ---------------------------------------------------------------------------
  app.get('/api/workspace/analytics', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const uid = req.user!.uid;
    const rawPeriod = typeof req.query.period === 'string' ? req.query.period : '30d';
    const timeframe: AnalyticsTimeframe =
      rawPeriod === '7d' || rawPeriod === '30d' || rawPeriod === '90d' || rawPeriod === 'all'
        ? rawPeriod
        : '30d';

    const items = Object.values(db.items || {}).filter((i) => i.ownerUid === uid);
    const groups = Object.values(db.groups || {}).filter((g) => g.ownerUid === uid);
    const sharedQrGroups = Object.values(db.sharedQrGroups || {}).filter(
      (g) => g.ownerUid === uid
    );
    const messages = Object.values(db.messages || {}).filter((m) => m.ownerUid === uid);
    const activities = Object.values(db.activities || {}).filter((a) => a.ownerUid === uid);

    const summary = computeWorkspaceAnalytics({
      items,
      groups,
      sharedQrGroups,
      messages,
      activities,
      timeframe,
    });

    res.json({ ok: true, analytics: summary });
  });
}
