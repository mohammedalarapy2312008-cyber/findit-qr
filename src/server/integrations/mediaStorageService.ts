import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { MediaAssetVisibility, StoredMediaAssetRecord } from '../../types/domain';
import { DatabaseSchema } from '../dbSchema';
import { PermanentStorageDriver } from './cloudStorageAdapter';

export const ALLOWED_MEDIA_FOLDERS = ['originals', 'covers', 'avatars', 'tickets'] as const;
export type AllowedMediaFolder = (typeof ALLOWED_MEDIA_FOLDERS)[number];

export const ALLOWED_MEDIA_FOLDER_SET = new Set<string>(ALLOWED_MEDIA_FOLDERS);

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const MAX_MEDIA_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const MIME_TO_EXT: Record<AllowedImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/**
 * Verifies real binary magic bytes so disguised non-image payloads cannot bypass MIME headers.
 */
export function detectImageMimeFromMagicBytes(buffer: Buffer): AllowedImageMime | null {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

export function resolveMediaRoot(customRoot?: string): string {
  return path.resolve(customRoot || path.join(process.cwd(), '.data', 'media'));
}

export function getDefaultFolderVisibility(folder: AllowedMediaFolder): MediaAssetVisibility {
  if (folder === 'tickets' || folder === 'originals') {
    return 'private';
  }
  return 'public';
}

export function buildMediaAssetKey(folder: AllowedMediaFolder, filename: string): string {
  return `${folder}/${filename}`;
}

export function ensureMediaFolder(mediaRoot: string, folder: AllowedMediaFolder): string {
  if (!ALLOWED_MEDIA_FOLDER_SET.has(folder)) {
    throw new Error('INVALID_MEDIA_FOLDER');
  }
  const dir = path.resolve(mediaRoot, folder);
  if (!dir.startsWith(mediaRoot + path.sep)) {
    throw new Error('INVALID_MEDIA_FOLDER');
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Persistent media manifest alongside files so asset ownership & visibility metadata
 * survives server restarts even independently of the main DB file.
 */
function resolveManifestPath(mediaRoot: string): string {
  return path.resolve(mediaRoot, 'manifest.json');
}

export function readMediaManifest(mediaRoot?: string): Record<string, StoredMediaAssetRecord> {
  try {
    const root = resolveMediaRoot(mediaRoot);
    const manifestPath = resolveManifestPath(root);
    if (!fs.existsSync(manifestPath)) return {};
    const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, StoredMediaAssetRecord>;
    }
  } catch {
    // ignore corrupted manifest
  }
  return {};
}

export function persistMediaManifestRecord(
  record: StoredMediaAssetRecord,
  mediaRoot?: string
): void {
  try {
    const root = resolveMediaRoot(mediaRoot);
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
    const manifestPath = resolveManifestPath(root);
    const existing = readMediaManifest(root);
    existing[record.id] = record;
    const tmpPath = `${manifestPath}.${process.pid}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(existing, null, 2), 'utf8');
    fs.renameSync(tmpPath, manifestPath);
  } catch {
    // Non-fatal; primary metadata also lives in db.mediaAssets
  }
}

export function removeMediaManifestRecord(assetId: string, mediaRoot?: string): void {
  try {
    const root = resolveMediaRoot(mediaRoot);
    const manifestPath = resolveManifestPath(root);
    if (!fs.existsSync(manifestPath)) return;
    const existing = readMediaManifest(root);
    if (!(assetId in existing)) return;
    delete existing[assetId];
    const tmpPath = `${manifestPath}.${process.pid}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(existing, null, 2), 'utf8');
    fs.renameSync(tmpPath, manifestPath);
  } catch {
    // Non-fatal
  }
}

export function deleteLocalMediaFileAndManifest(params: {
  mediaRoot?: string;
  folder: AllowedMediaFolder;
  filename: string;
}): { ok: true; deletedLocal: boolean } | { ok: false; status: number; errorCode: string } {
  const folder = params.folder;
  const filename = (params.filename || '').trim();
  if (!ALLOWED_MEDIA_FOLDER_SET.has(folder) || !/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(filename)) {
    return { ok: false, status: 400, errorCode: 'INVALID_MEDIA_PATH' };
  }

  const root = resolveMediaRoot(params.mediaRoot);
  const folderDir = path.resolve(root, folder);
  const fullPath = path.resolve(folderDir, filename);
  if (!fullPath.startsWith(folderDir + path.sep)) {
    return { ok: false, status: 400, errorCode: 'INVALID_MEDIA_PATH' };
  }

  let deletedLocal = false;
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    deletedLocal = true;
  }
  removeMediaManifestRecord(buildMediaAssetKey(folder, filename), root);
  return { ok: true, deletedLocal };
}

export interface StoredMediaFileResult {
  ok: true;
  url: string;
  folder: AllowedMediaFolder;
  filename: string;
  mimeType: AllowedImageMime;
  sizeBytes: number;
  buffer: Buffer;
  storageDriver: PermanentStorageDriver;
}

export interface StoredMediaErrorResult {
  ok: false;
  status: number;
  errorCode:
    | 'INVALID_IMAGE_FORMAT'
    | 'INVALID_IMAGE_SIGNATURE'
    | 'FILE_TOO_LARGE'
    | 'INVALID_PATH'
    | 'MEDIA_WRITE_FAILED';
  messageAr: string;
  messageEn: string;
}

export function storeBase64ImageToMedia(params: {
  mediaRoot?: string;
  folder: string;
  dataUrl: string;
  prefix?: string;
}): StoredMediaFileResult | StoredMediaErrorResult {
  const folder: AllowedMediaFolder = ALLOWED_MEDIA_FOLDER_SET.has(params.folder)
    ? (params.folder as AllowedMediaFolder)
    : 'originals';

  const trimmed = typeof params.dataUrl === 'string' ? params.dataUrl.trim() : '';
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(trimmed);
  if (!match) {
    return {
      ok: false,
      status: 400,
      errorCode: 'INVALID_IMAGE_FORMAT',
      messageAr: 'يرجى رفع صورة صالحة بصيغة JPG أو PNG أو WebP.',
      messageEn: 'Please upload a valid JPG, PNG, or WebP image.',
    };
  }

  const declaredMime = match[1] as AllowedImageMime;
  const base64Payload = match[2].replace(/\s+/g, '');
  const buffer = Buffer.from(base64Payload, 'base64');

  if (buffer.length === 0 || buffer.length > MAX_MEDIA_UPLOAD_BYTES) {
    return {
      ok: false,
      status: 413,
      errorCode: 'FILE_TOO_LARGE',
      messageAr: 'الحد الأقصى لحجم الصورة هو 5 ميجابايت.',
      messageEn: 'Maximum image size is 5 MB.',
    };
  }

  const detectedMime = detectImageMimeFromMagicBytes(buffer);
  if (!detectedMime || detectedMime !== declaredMime) {
    return {
      ok: false,
      status: 400,
      errorCode: 'INVALID_IMAGE_SIGNATURE',
      messageAr: 'محتوى الملف لا يطابق توقيع صورة صالحة (JPG / PNG / WebP).',
      messageEn: 'Uploaded file binary signature does not match a valid JPG, PNG, or WebP image.',
    };
  }

  return writeImageBufferToMedia({
    mediaRoot: params.mediaRoot,
    folder,
    buffer,
    mimeType: detectedMime,
    prefix: params.prefix,
  });
}

export function writeImageBufferToMedia(params: {
  mediaRoot?: string;
  folder: AllowedMediaFolder;
  buffer: Buffer;
  mimeType: AllowedImageMime;
  prefix?: string;
}): StoredMediaFileResult | StoredMediaErrorResult {
  if (params.buffer.length === 0 || params.buffer.length > MAX_MEDIA_UPLOAD_BYTES) {
    return {
      ok: false,
      status: 413,
      errorCode: 'FILE_TOO_LARGE',
      messageAr: 'الحد الأقصى لحجم الصورة هو 5 ميجابايت.',
      messageEn: 'Maximum image size is 5 MB.',
    };
  }

  const mediaRoot = resolveMediaRoot(params.mediaRoot);
  const ext = MIME_TO_EXT[params.mimeType] || 'png';
  const safePrefix = (params.prefix || params.folder.slice(0, 3)).replace(/[^a-zA-Z0-9_-]/g, '');

  try {
    const targetDir = ensureMediaFolder(mediaRoot, params.folder);
    const filename = `${safePrefix}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const fullPath = path.resolve(targetDir, filename);
    if (!fullPath.startsWith(targetDir + path.sep)) {
      return {
        ok: false,
        status: 400,
        errorCode: 'INVALID_PATH',
        messageAr: 'مسار حفظ الملف غير صالح.',
        messageEn: 'Invalid file storage path.',
      };
    }

    fs.writeFileSync(fullPath, params.buffer);
    return {
      ok: true,
      url: `/api/media/${params.folder}/${filename}`,
      folder: params.folder,
      filename,
      mimeType: params.mimeType,
      sizeBytes: params.buffer.length,
      buffer: params.buffer,
      storageDriver: 'local_persistent',
    };
  } catch {
    return {
      ok: false,
      status: 500,
      errorCode: 'MEDIA_WRITE_FAILED',
      messageAr: 'تعذر حفظ الملف على الخادم.',
      messageEn: 'Failed to store uploaded media file.',
    };
  }
}

export function resolveSafeMediaReadPath(params: {
  mediaRoot?: string;
  folder: string;
  filename: string;
}): { ok: true; fullPath: string; contentType: string; folder: AllowedMediaFolder; filename: string } | { ok: false; status: number; errorCode: string } {
  const folder = (params.folder || '').trim();
  const filename = (params.filename || '').trim();

  if (!ALLOWED_MEDIA_FOLDER_SET.has(folder) || !/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(filename)) {
    return { ok: false, status: 400, errorCode: 'INVALID_MEDIA_PATH' };
  }

  const mediaRoot = resolveMediaRoot(params.mediaRoot);
  const folderDir = path.resolve(mediaRoot, folder);
  const fullPath = path.resolve(folderDir, filename);

  if (!fullPath.startsWith(folderDir + path.sep) || !fs.existsSync(fullPath)) {
    return { ok: false, status: 404, errorCode: 'MEDIA_NOT_FOUND' };
  }

  const ext = path.extname(fullPath).toLowerCase();
  return {
    ok: true,
    fullPath,
    contentType: EXT_TO_MIME[ext] || 'application/octet-stream',
    folder: folder as AllowedMediaFolder,
    filename,
  };
}

/**
 * Checks whether a media URL is actively published as the visible cover of a public-facing
 * item or active Shared QR group. Unassigned or hidden original photos stay strictly private.
 */
export function isMediaUrlActivelyPublished(url: string, db: DatabaseSchema): boolean {
  const cleanUrl = url.trim();
  if (!cleanUrl) return false;

  for (const item of Object.values(db.items || {})) {
    if (item.status === 'Archived' || item.moderationFlag === 'restricted') {
      continue;
    }
    const privacy = item.privacySettings;
    if (privacy && (privacy.publicPageEnabled === false || privacy.showImage === false)) {
      continue;
    }
    if (item.coverUrl === cleanUrl || item.imageUrl === cleanUrl) {
      return true;
    }
  }

  for (const sharedGroup of Object.values(db.sharedQrGroups || {})) {
    if (!sharedGroup.isActive) continue;
    if (sharedGroup.coverUrl === cleanUrl) {
      return true;
    }
  }

  return false;
}

export interface MediaAccessDecision {
  allowed: boolean;
  isPublicCacheable: boolean;
  status?: 401 | 403;
  errorCode?: 'UNAUTHENTICATED_MEDIA_ACCESS' | 'FORBIDDEN_MEDIA_ACCESS';
}

/**
 * Enforces per-asset authorization for uploaded user media:
 * - `tickets`: Strictly private (owner or platform admin only).
 * - `originals`: Owner or admin always allowed; public/third-party allowed ONLY if actively
 *   published as the visible cover of an active public item or active Shared QR group.
 * - `covers` & `avatars`: Public read unless explicitly marked private.
 */
export function evaluateMediaAccess(params: {
  folder: AllowedMediaFolder;
  filename: string;
  url: string;
  record?: StoredMediaAssetRecord | null;
  callerUid?: string | null;
  callerIsAdmin?: boolean;
  db: DatabaseSchema;
}): MediaAccessDecision {
  const { folder, url, record, callerUid, callerIsAdmin, db } = params;

  const isOwner = Boolean(callerUid && record?.ownerUid && record.ownerUid === callerUid);
  if (callerIsAdmin || isOwner) {
    const isPublic =
      folder === 'covers' || folder === 'avatars' || record?.visibility === 'public';
    return { allowed: true, isPublicCacheable: isPublic };
  }

  // Support ticket attachments are ALWAYS private (owner or admin only)
  if (folder === 'tickets') {
    return callerUid
      ? { allowed: false, isPublicCacheable: false, status: 403, errorCode: 'FORBIDDEN_MEDIA_ACCESS' }
      : { allowed: false, isPublicCacheable: false, status: 401, errorCode: 'UNAUTHENTICATED_MEDIA_ACCESS' };
  }

  // Original personal photos stay private unless explicitly marked public OR actively published as a visible public cover
  if (folder === 'originals') {
    if (record?.visibility === 'public' || isMediaUrlActivelyPublished(url, db)) {
      return { allowed: true, isPublicCacheable: false };
    }
    return callerUid
      ? { allowed: false, isPublicCacheable: false, status: 403, errorCode: 'FORBIDDEN_MEDIA_ACCESS' }
      : { allowed: false, isPublicCacheable: false, status: 401, errorCode: 'UNAUTHENTICATED_MEDIA_ACCESS' };
  }

  // Public covers & avatars (unless explicitly restricted to private)
  if (record?.visibility === 'private') {
    return callerUid
      ? { allowed: false, isPublicCacheable: false, status: 403, errorCode: 'FORBIDDEN_MEDIA_ACCESS' }
      : { allowed: false, isPublicCacheable: false, status: 401, errorCode: 'UNAUTHENTICATED_MEDIA_ACCESS' };
  }

  return { allowed: true, isPublicCacheable: true };
}
