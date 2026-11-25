import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_REGISTERED_ITEMS,
  INITIAL_USER_PROFILE,
  INITIAL_WORKSPACE_SETTINGS,
} from './src/data/foundationCatalog';
import {
  ActivityLogEntry,
  DEFAULT_ITEM_PRIVACY_SETTINGS,
  FinderMessageEntry,
  FinderMessageStatus,
  ItemCategory,
  ItemGroup,
  ItemPrivacySettings,
  ItemStatus,
  Language,
  NewItemDraft,
  NotificationEntry,
  PLAN_QUOTA_SPECS,
  RegisteredItem,
  SharedQrGroup,
  UserPlanTier,
  UserProfile,
  WorkspaceSettings,
} from './src/types/domain';
import {
  buildFinderPublicView,
  canAddOrReactivateItem,
  countEnabledContactMethods,
  createUniqueSerialCode,
  isSafeMediaOrHttpsUrl,
  resolveItemPrivacySettings,
  validateFinderMessageInput,
  validateItemDraft,
  validateItemUpdate,
  validateProfileUpdate,
} from './src/utils/qrLogic';
import {
  buildSharedQrPublicPayload,
  createUniqueSharedQrCode,
  normalizeSharedQrGroupItems,
  validateSharedQrGroupInput,
} from './src/utils/sharedQrLogic';

import {
  canAccessTemplateByPlanOrPurchase,
  isSuperAdminEmailMatch,
  normalizeConfiguredAdminEmail,
  resolveEffectivePermissions,
  resolveEffectiveRole,
} from './src/utils/adminLogic';
import {
  auditAndNormalizeQrIntegrity,
  decorateItemQrModeMetadata,
  evaluateIndividualQrAvailability,
  findConflictingSharedGroup,
} from './src/utils/qrModeRules';
import { DatabaseSchema, StoredSessionRecord, StoredUserRecord } from './src/server/dbSchema';
import { ensureDatabaseAdminDefaults } from './src/server/adminDefaults';
import { registerAdminAndCommerceRoutes } from './src/server/adminRoutes';
import { registerUserAppRoutes } from './src/server/userAppRoutes';
import { matchSmartCover } from './src/utils/aiCoverLogic';
import {
  buildEmailVerificationEmail,
  buildFinderMessageEmail,
  buildFoundReportEmail,
  buildPasswordResetEmail,
  EmailServiceOverrides,
  sendTransactionalEmail,
} from './src/server/integrations/emailService';
import { buildIntegrationsHealthSnapshot } from './src/server/integrations/integrationStatus';
import {
  normalizeWhatsAppPhone,
  sendWhatsAppAlert,
  WhatsAppServiceOverrides,
} from './src/server/integrations/whatsappService';
import { CloudStorageOverrides } from './src/server/integrations/cloudStorageAdapter';
import { ensureProfileContactMethods } from './src/utils/contactMethodsLogic';
import { resolveFirebaseAuthDomain } from './src/utils/googleAuthFlow';

export type { StoredUserRecord, StoredSessionRecord, DatabaseSchema };

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function hashSessionToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function isSessionExpired(session: StoredSessionRecord, nowMs = Date.now()): boolean {
  const expiresMs = Date.parse(session.expiresAt);
  return !Number.isFinite(expiresMs) || nowMs >= expiresMs;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length === 0 || bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}


export interface VerifiedGoogleIdentity {
  googleUid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
}

interface ServerAppOptions {
  dbFilePath?: string;
  mediaRoot?: string;
  disableVite?: boolean;
  disableAuthRateLimit?: boolean;
  sessionTtlMs?: number;
  adminEmail?: string;
  verifyGoogleIdToken?: (idToken: string) => Promise<VerifiedGoogleIdentity | null>;
  onPasswordResetTokenIssued?: (info: { email: string; uid: string; rawToken: string }) => void;
  onEmailVerificationTokenIssued?: (info: { email: string; uid: string; rawToken: string }) => void;
  emailOverrides?: EmailServiceOverrides;
  whatsappOverrides?: WhatsAppServiceOverrides;
  cloudStorageOverrides?: CloudStorageOverrides;
}

interface AuthenticatedRequest extends Request {
  user?: StoredUserRecord;
  session?: StoredSessionRecord;
  tokenHash?: string;
  rawToken?: string;
}

const SESSION_COOKIE_NAME = 'finditqr_session';

interface FirebasePublicConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function loadFirebasePublicConfig(): FirebasePublicConfig {
  const empty: FirebasePublicConfig = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  };
  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as Partial<FirebasePublicConfig>;
      return {
        apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : '',
        authDomain: typeof parsed.authDomain === 'string' ? parsed.authDomain.trim() : '',
        projectId: typeof parsed.projectId === 'string' ? parsed.projectId.trim() : '',
        storageBucket: typeof parsed.storageBucket === 'string' ? parsed.storageBucket.trim() : '',
        messagingSenderId:
          typeof parsed.messagingSenderId === 'string' ? parsed.messagingSenderId.trim() : '',
        appId: typeof parsed.appId === 'string' ? parsed.appId.trim() : '',
      };
    }
  } catch {
    // ignore
  }
  return empty;
}

const FIREBASE_PUBLIC_CONFIG = loadFirebasePublicConfig();
const FIREBASE_API_KEY = FIREBASE_PUBLIC_CONFIG.apiKey;
const FIREBASE_AUTH_DOMAIN = FIREBASE_PUBLIC_CONFIG.authDomain;

async function readRawRequestBody(req: Request, maxBytes = 256 * 1024): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buf.length;
      if (total > maxBytes) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function createServerApp(options: ServerAppOptions = {}): Promise<{
  app: Express;
  db: DatabaseSchema;
  saveDatabase: () => void;
}> {
  const resolvedDbFile =
    options.dbFilePath || path.resolve(process.cwd(), '.data', 'finditqr-db.json');
  const resolvedDataDir = path.dirname(resolvedDbFile);
  const effectiveSessionTtlMs = options.sessionTtlMs ?? SESSION_TTL_MS;

  const configuredAdminEmail = normalizeConfiguredAdminEmail(
    options.adminEmail !== undefined ? options.adminEmail : process.env.ADMIN_EMAIL
  );

  function loadDatabase(): { db: DatabaseSchema; migrated: boolean } {
    let migrated = false;
    try {
      if (!fs.existsSync(resolvedDataDir)) {
        fs.mkdirSync(resolvedDataDir, { recursive: true });
      }
      if (fs.existsSync(resolvedDbFile)) {
        const raw = fs.readFileSync(resolvedDbFile, 'utf8');
        const parsed = JSON.parse(raw) as Partial<DatabaseSchema> & {
          sessions?: Record<string, string | StoredSessionRecord>;
        };

        const nowMs = Date.now();
        const nowIso = new Date(nowMs).toISOString();
        const migratedSessions: Record<string, StoredSessionRecord> = {};

        for (const [key, val] of Object.entries(parsed.sessions || {})) {
          if (typeof val === 'string') {
            migratedSessions[hashSessionToken(key)] = {
              uid: val,
              createdAt: nowIso,
              expiresAt: new Date(nowMs + effectiveSessionTtlMs).toISOString(),
              lastUsedAt: nowIso,
            };
            migrated = true;
          } else if (val && typeof val === 'object' && typeof val.uid === 'string') {
            if (!isSessionExpired(val, nowMs)) {
              migratedSessions[key] = val;
            } else {
              migrated = true;
            }
          }
        }

        const baseDb = {
          ...(parsed as DatabaseSchema),
          users: parsed.users || {},
          sessions: migratedSessions,
          passwordResetTokens: parsed.passwordResetTokens || {},
          pendingAccountLinks: parsed.pendingAccountLinks || {},
          emailVerificationTokens: parsed.emailVerificationTokens || {},
          items: parsed.items || {},
          groups: parsed.groups || {},
          sharedQrGroups: parsed.sharedQrGroups || {},
          messages: parsed.messages || {},
          notifications: parsed.notifications || {},
          activities: parsed.activities || {},
          mediaAssets: parsed.mediaAssets || {},
        } as DatabaseSchema;

        const defaultsAdded = ensureDatabaseAdminDefaults(baseDb);
        if (defaultsAdded) migrated = true;

        const integrity = auditAndNormalizeQrIntegrity(baseDb.items, baseDb.sharedQrGroups || {});
        if (integrity.normalizedCount > 0) {
          migrated = true;
        }
        if (integrity.issues.length > 0) {
          console.warn(
            `[FindIt QR Integrity Audit] Detected ${integrity.issues.length} QR metadata issue(s):`,
            integrity.issues.slice(0, 10)
          );
        }

        return {
          db: baseDb,
          migrated,
        };
      }
    } catch (err) {
      console.error('Failed to read database file, initializing clean store:', err);
    }
    const freshDb = {
      users: {},
      sessions: {},
      passwordResetTokens: {},
      pendingAccountLinks: {},
      emailVerificationTokens: {},
      items: {},
      groups: {},
      sharedQrGroups: {},
      messages: {},
      notifications: {},
      activities: {},
      mediaAssets: {},
    } as DatabaseSchema;
    ensureDatabaseAdminDefaults(freshDb);
    return {
      db: freshDb,
      migrated: true,
    };
  }

  const { db, migrated } = loadDatabase();

  function enforceAuthoritativePlanLimits(userRec: StoredUserRecord): void {
    // Reconcile expired subscriptions so expired paid tiers revert cleanly to Free/active tier
    const nowMs = Date.now();
    const userSubs = Object.values(db.subscriptions || {}).filter((s) => s.userId === userRec.uid);
    let expiredAny = false;
    for (const sub of userSubs) {
      if (sub.status === 'active' && sub.expiresAt && Date.parse(sub.expiresAt) <= nowMs) {
        sub.status = 'expired';
        sub.updatedAt = new Date(nowMs).toISOString();
        expiredAny = true;
      }
    }
    if (expiredAny) {
      const remainingActive = userSubs
        .filter((s) => s.status === 'active' && (!s.expiresAt || Date.parse(s.expiresAt) > nowMs))
        .sort((a, b) => (b.expiresAt || '').localeCompare(a.expiresAt || ''));
      userRec.profile.plan = remainingActive[0]?.quotaTier || 'Free';
    }

    const validPlan: UserPlanTier =
      userRec.profile.plan && PLAN_QUOTA_SPECS[userRec.profile.plan]
        ? userRec.profile.plan
        : 'Free';
    const dynamicPlan = Object.values(db.plans || {}).find((p) => p.quotaTier === validPlan);
    const fallbackSpec = PLAN_QUOTA_SPECS[validPlan];
    userRec.profile.plan = validPlan;
    userRec.profile.activeItemsLimit = dynamicPlan
      ? dynamicPlan.maxActiveItems
      : fallbackSpec.maxActiveItems;
    userRec.profile.contactMethodsLimit = dynamicPlan
      ? dynamicPlan.maxContactMethods
      : fallbackSpec.maxContactMethods;
  }

  function decorateProfileAuthority(userRec: StoredUserRecord): UserProfile {
    enforceAuthoritativePlanLimits(userRec);
    const effectiveRole = resolveEffectiveRole(
      userRec.profile.role,
      userRec.email,
      configuredAdminEmail,
      Boolean(userRec.profile.emailVerified)
    );
    const effectivePermissions = resolveEffectivePermissions(
      effectiveRole,
      userRec.profile.adminPermissions
    );
    userRec.profile.role = effectiveRole;
    userRec.profile.adminPermissions = effectivePermissions;

    const providers = new Set<'password' | 'google'>(userRec.authProviders || []);
    if (userRec.passwordHash) providers.add('password');
    if (userRec.googleUid) providers.add('google');
    const authProviders = Array.from(providers);

    const contactMethods = ensureProfileContactMethods(userRec.profile);
    userRec.profile.contactMethods = contactMethods;

    return {
      ...userRec.profile,
      role: effectiveRole,
      adminPermissions: effectivePermissions,
      authProviders,
      hasPassword: Boolean(userRec.passwordHash),
      hasGoogle: Boolean(userRec.googleUid),
      contactMethods,
    };
  }

  for (const userRec of Object.values(db.users)) {
    // Normalize stored email and synchronize role authority
    userRec.email = (userRec.email || '').trim().toLowerCase();
    userRec.profile.email = userRec.email;
    decorateProfileAuthority(userRec);
  }

  function saveDatabase(): void {
    try {
      if (!fs.existsSync(resolvedDataDir)) {
        fs.mkdirSync(resolvedDataDir, { recursive: true });
      }
      const tmpFile = `${resolvedDbFile}.${process.pid}.${Date.now()}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
      fs.renameSync(tmpFile, resolvedDbFile);
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  if (migrated) {
    saveDatabase();
  }

  function pruneExpiredSessions(): boolean {
    const nowMs = Date.now();
    let changed = false;
    for (const [tokenHash, session] of Object.entries(db.sessions)) {
      if (isSessionExpired(session, nowMs) || !db.users[session.uid]) {
        delete db.sessions[tokenHash];
        changed = true;
      }
    }
    return changed;
  }

  function issueSession(uid: string): string {
    pruneExpiredSessions();
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashSessionToken(rawToken);
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    db.sessions[tokenHash] = {
      uid,
      createdAt: nowIso,
      expiresAt: new Date(nowMs + effectiveSessionTtlMs).toISOString(),
      lastUsedAt: nowIso,
    };
    return rawToken;
  }

  function generateUniqueSerialCode(): string {
    const existingSerials: string[] = [];
    for (const item of Object.values(db.items)) {
      if (item.codeSerial) existingSerials.push(item.codeSerial);
    }
    for (const item of INITIAL_REGISTERED_ITEMS) {
      if (item.codeSerial) existingSerials.push(item.codeSerial);
    }
    return createUniqueSerialCode(existingSerials, (max) => crypto.randomInt(max));
  }

  function recomputeUserActiveCount(uid: string): number {
    const userRec = db.users[uid];
    if (!userRec) return 0;
    enforceAuthoritativePlanLimits(userRec);
    const count = Object.values(db.items).filter(
      (item) => item.ownerUid === uid && item.status !== 'Archived'
    ).length;
    userRec.profile.activeItemsCount = count;
    return count;
  }

  function recordUserActivity(
    uid: string,
    actionType: ActivityLogEntry['actionType'],
    titleAr: string,
    titleEn: string,
    detailAr: string,
    detailEn: string,
    itemId?: string,
    actorAr = 'صاحب الحساب',
    actorEn = 'Account Owner'
  ): ActivityLogEntry {
    const id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();
    const entry: ActivityLogEntry = {
      id,
      ownerUid: uid,
      actionType,
      titleAr,
      titleEn,
      detailAr,
      detailEn,
      actorAr,
      actorEn,
      locationAr: 'FindIt QR Cloud',
      locationEn: 'FindIt QR Cloud',
      timestamp: nowIso.replace('T', ' ').slice(0, 16),
      itemId,
    };
    db.activities[id] = entry;
    return entry;
  }

  function recordUserNotification(
    uid: string,
    type: NotificationEntry['type'],
    severity: NotificationEntry['severity'],
    titleAr: string,
    titleEn: string,
    bodyAr: string,
    bodyEn: string,
    relatedItemId?: string,
    relatedMessageId?: string,
    senderContact?: string
  ): NotificationEntry {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();
    const notif: NotificationEntry = {
      id,
      ownerUid: uid,
      type,
      severity,
      titleAr,
      titleEn,
      bodyAr,
      bodyEn,
      timestamp: nowIso.replace('T', ' ').slice(0, 16),
      isRead: false,
      relatedItemId,
      relatedMessageId,
      senderContact,
      };
    db.notifications[id] = notif;
    return notif;
  }

  // Anti-spam cooldown tracker in memory (key -> timestamp ms)
  const rateLimitMap = new Map<string, number>();
  // Sliding window auth rate-limiter (key -> timestamps ms[])
  const authWindowMap = new Map<string, number[]>();

  function checkSlidingWindowRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): boolean {
    if (options.disableAuthRateLimit) return true;
    const now = Date.now();
    const timestamps = (authWindowMap.get(key) || []).filter((t) => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
      authWindowMap.set(key, timestamps);
      return false;
    }
    timestamps.push(now);
    authWindowMap.set(key, timestamps);
    if (authWindowMap.size > 2000) {
      for (const [k, list] of authWindowMap.entries()) {
        if (list.every((t) => now - t >= windowMs)) {
          authWindowMap.delete(k);
        }
      }
    }
    return true;
  }

  function clearSlidingWindowRateLimit(key: string): void {
    authWindowMap.delete(key);
  }

  function isSlidingWindowRateLimited(
    key: string,
    maxRequests: number,
    windowMs: number
  ): boolean {
    if (options.disableAuthRateLimit) return false;
    const now = Date.now();
    const timestamps = (authWindowMap.get(key) || []).filter((t) => now - t < windowMs);
    authWindowMap.set(key, timestamps);
    return timestamps.length >= maxRequests;
  }

  function recordSlidingWindowAttempt(key: string, windowMs: number): void {
    if (options.disableAuthRateLimit) return;
    const now = Date.now();
    const timestamps = (authWindowMap.get(key) || []).filter((t) => now - t < windowMs);
    timestamps.push(now);
    authWindowMap.set(key, timestamps);
  }

  function extractTokenFromRequest(req: Request): string {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const bearer = authHeader.slice(7).trim();
      if (bearer && bearer.length >= 16) {
        return bearer;
      }
    }
    const cookieHeader = req.headers.cookie || '';
    if (cookieHeader) {
      const parts = cookieHeader.split(';');
      for (const part of parts) {
        const [rawName, ...rest] = part.trim().split('=');
        if (rawName === SESSION_COOKIE_NAME && rest.length > 0) {
          try {
            const val = decodeURIComponent(rest.join('=').trim());
            if (val && val.length >= 16) {
              return val;
            }
          } catch {
            // ignore malformed cookie
          }
        }
      }
    }
    return '';
  }

  function setSessionCookie(res: Response, req: Request, rawToken: string): void {
    const isSecure =
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      process.env.NODE_ENV === 'production';
    const maxAgeSec = Math.max(60, Math.floor(effectiveSessionTtlMs / 1000));
    const sameSiteAttr = isSecure ? 'SameSite=None; Secure; Partitioned' : 'SameSite=Lax';
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(rawToken)}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; ${sameSiteAttr}`
    );
  }

  function clearSessionCookie(res: Response, req: Request): void {
    const isSecure =
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      process.env.NODE_ENV === 'production';
    const sameSiteAttr = isSecure ? 'SameSite=None; Secure; Partitioned' : 'SameSite=Lax';
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; ${sameSiteAttr}`
    );
  }

  async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleIdentity | null> {
    if (!idToken || typeof idToken !== 'string' || idToken.trim().length < 20) {
      return null;
    }
    if (options.verifyGoogleIdToken) {
      return options.verifyGoogleIdToken(idToken.trim());
    }
    if (!FIREBASE_API_KEY) {
      return null;
    }
    try {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: idToken.trim() }),
        }
      );
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as {
        users?: Array<{
          localId?: string;
          email?: string;
          emailVerified?: boolean;
          displayName?: string;
          photoUrl?: string;
          providerUserInfo?: Array<{
            providerId?: string;
            federatedId?: string;
            email?: string;
            displayName?: string;
            photoUrl?: string;
          }>;
        }>;
      };
      const userInfo = Array.isArray(data.users) ? data.users[0] : undefined;
      if (!userInfo || !userInfo.localId || !userInfo.email) {
        return null;
      }
      const googleProvider = (userInfo.providerUserInfo || []).find(
        (p) => p.providerId === 'google.com'
      );
      const email = (googleProvider?.email || userInfo.email).trim().toLowerCase();
      const emailVerified = Boolean(userInfo.emailVerified || googleProvider);
      if (!email || !emailVerified) {
        return null;
      }
      return {
        googleUid: userInfo.localId,
        email,
        emailVerified: true,
        displayName: userInfo.displayName || googleProvider?.displayName || email.split('@')[0],
        photoURL: userInfo.photoUrl || googleProvider?.photoUrl || '',
      };
    } catch {
      return null;
    }
  }

  async function verifyFirebasePasswordFallback(
    email: string,
    password: string
  ): Promise<{ localId: string; email: string; displayName?: string; emailVerified?: boolean } | null> {
    if (
      !FIREBASE_API_KEY ||
      options.verifyGoogleIdToken ||
      email.endsWith('.test') ||
      email.endsWith('@finditqr.com')
    ) {
      return null;
    }
    try {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
        }
      );
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as {
        localId?: string;
        email?: string;
        displayName?: string;
        registered?: boolean;
      };
      if (!data.localId || !data.email) {
        return null;
      }
      return {
        localId: data.localId,
        email: data.email.trim().toLowerCase(),
        displayName: data.displayName,
      };
    } catch {
      return null;
    }
  }

  function resolveOptionalAuthUser(
    req: Request
  ): { user: StoredUserRecord; isAdmin: boolean } | null {
    const token = extractTokenFromRequest(req);
    if (!token || token.length < 16) return null;
    const tokenHash = hashSessionToken(token);
    const session = db.sessions[tokenHash];
    if (!session || isSessionExpired(session, Date.now())) return null;
    const userRec = db.users[session.uid];
    if (!userRec || userRec.profile.accountStatus === 'suspended') return null;
    const effectiveRole = resolveEffectiveRole(
      userRec.profile.role,
      userRec.email,
      configuredAdminEmail,
      Boolean(userRec.profile.emailVerified)
    );
    const isAdmin =
      isSuperAdminEmailMatch(userRec.email, configuredAdminEmail) ||
      effectiveRole === 'super_admin' ||
      effectiveRole === 'staff_admin';
    return { user: userRec, isAdmin };
  }

  function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const token = extractTokenFromRequest(req);
    if (!token || token.length < 16) {
      res.status(401).json({
        ok: false,
        errorCode: 'UNAUTHENTICATED',
        messageAr: 'يرجى تسجيل الدخول للوصول إلى هذه الخدمة.',
        messageEn: 'Please sign in to access this resource.',
      });
      return;
    }

    const tokenHash = hashSessionToken(token);
    const session = db.sessions[tokenHash];
    if (!session) {
      clearSessionCookie(res, req);
      res.status(401).json({
        ok: false,
        errorCode: 'UNAUTHENTICATED',
        messageAr: 'يرجى تسجيل الدخول للوصول إلى هذه الخدمة.',
        messageEn: 'Please sign in to access this resource.',
      });
      return;
    }

    const nowMs = Date.now();
    if (isSessionExpired(session, nowMs)) {
      delete db.sessions[tokenHash];
      saveDatabase();
      clearSessionCookie(res, req);
      res.status(401).json({
        ok: false,
        errorCode: 'SESSION_EXPIRED',
        messageAr: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجددًا.',
        messageEn: 'Session expired. Please sign in again.',
      });
      return;
    }

    const userRec = db.users[session.uid];
    if (!userRec) {
      delete db.sessions[tokenHash];
      saveDatabase();
      clearSessionCookie(res, req);
      res.status(401).json({
        ok: false,
        errorCode: 'SESSION_INVALID',
        messageAr: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجددًا.',
        messageEn: 'Session invalid. Please sign in again.',
      });
      return;
    }

    if (userRec.profile.accountStatus === 'suspended') {
      delete db.sessions[tokenHash];
      saveDatabase();
      clearSessionCookie(res, req);
      res.status(403).json({
        ok: false,
        errorCode: 'ACCOUNT_SUSPENDED',
        messageAr: 'تم إيقاف هذا الحساب مؤقتًا من قِبل الإدارة.',
        messageEn: 'This account has been suspended by platform administration.',
      });
      return;
    }

    const lastUsedMs = Date.parse(session.lastUsedAt);
    if (!Number.isFinite(lastUsedMs) || nowMs - lastUsedMs > 60_000) {
      const nowIso = new Date(nowMs).toISOString();
      session.lastUsedAt = nowIso;
      userRec.profile.lastActiveAt = nowIso;
      saveDatabase();
    }

    enforceAuthoritativePlanLimits(userRec);
    req.user = userRec;
    req.session = session;
    req.tokenHash = tokenHash;
    req.rawToken = token;
    next();
  }

  const app = express();
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.path.startsWith('/__/auth/')) {
      res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    } else {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    }
    next();
  });

  // CSRF Origin enforcement for cookie-authenticated state-changing API routes
  app.use('/api', (req, res, next) => {
    const method = (req.method || 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      next();
      return;
    }
    const authHeader = req.headers.authorization || '';
    const hasBearer = authHeader.startsWith('Bearer ') && authHeader.length > 20;
    const cookieHeader = req.headers.cookie || '';
    const hasSessionCookie = cookieHeader.includes(`${SESSION_COOKIE_NAME}=`);
    const originHeader = typeof req.headers.origin === 'string' ? req.headers.origin.trim() : '';

    if (hasSessionCookie && !hasBearer && originHeader) {
      try {
        const originUrl = new URL(originHeader);
        const forwardedHost = String(req.headers['x-forwarded-host'] || '')
          .split(',')[0]
          .trim()
          .toLowerCase();
        const hostHeader = (forwardedHost || String(req.get('host') || '').trim()).toLowerCase();
        if (hostHeader && originUrl.host.toLowerCase() !== hostHeader) {
          res.status(403).json({
            ok: false,
            errorCode: 'CSRF_ORIGIN_MISMATCH',
            messageAr: 'تم رفض الطلب لحماية الجلسة من الطلبات عبر النطاقات.',
            messageEn: 'Request blocked by cross-origin session protection.',
          });
          return;
        }
      } catch {
        res.status(403).json({
          ok: false,
          errorCode: 'CSRF_INVALID_ORIGIN',
          messageAr: 'مصدر الطلب غير صالح.',
          messageEn: 'Invalid request origin.',
        });
        return;
      }
    }
    next();
  });

  // ---------------------------------------------------------------------------
  // 0. SAME-ORIGIN FIREBASE AUTH HANDLER & INIT PROXY
  //    Eliminates cross-origin third-party storage partitioning & COOP opener
  //    severance for both signInWithRedirect and signInWithPopup on HTTPS hosts.
  // ---------------------------------------------------------------------------
  app.get('/__/firebase/init.json', (req: Request, res: Response) => {
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
      .split(',')[0]
      .trim()
      .toLowerCase();
    const isHttps = forwardedProto === 'https' || req.protocol === 'https' || req.secure;
    const forwardedHost = String(req.headers['x-forwarded-host'] || '')
      .split(',')[0]
      .trim();
    const rawHostHeader = forwardedHost || String(req.get('host') || req.hostname || '').trim();
    const hostname = rawHostHeader.split(':')[0].toLowerCase();
    const effectiveAuthDomain = resolveFirebaseAuthDomain(
      {
        protocol: isHttps ? 'https:' : 'http:',
        hostname,
        host: rawHostHeader || hostname,
      },
      FIREBASE_AUTH_DOMAIN
    );

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      apiKey: FIREBASE_PUBLIC_CONFIG.apiKey,
      authDomain: effectiveAuthDomain,
      projectId: FIREBASE_PUBLIC_CONFIG.projectId,
      storageBucket: FIREBASE_PUBLIC_CONFIG.storageBucket,
      messagingSenderId: FIREBASE_PUBLIC_CONFIG.messagingSenderId,
      appId: FIREBASE_PUBLIC_CONFIG.appId,
    });
  });

  app.use('/__/auth', async (req: Request, res: Response) => {
    if (!FIREBASE_AUTH_DOMAIN) {
      res.status(503).json({
        ok: false,
        errorCode: 'FIREBASE_AUTH_DOMAIN_MISSING',
        messageEn: 'Firebase authDomain is not configured on the server.',
      });
      return;
    }

    const expectedOrigin = `https://${FIREBASE_AUTH_DOMAIN}`;
    let upstreamUrl: URL;
    try {
      upstreamUrl = new URL(req.originalUrl, expectedOrigin);
    } catch {
      res.status(400).send('Invalid auth proxy path.');
      return;
    }

    if (
      upstreamUrl.origin !== expectedOrigin ||
      !upstreamUrl.pathname.startsWith('/__/auth/') ||
      upstreamUrl.pathname.includes('..') ||
      upstreamUrl.pathname.includes('\\')
    ) {
      res.status(400).send('Forbidden auth proxy path.');
      return;
    }

    try {
      const method = (req.method || 'GET').toUpperCase();
      const forwardHeaders: Record<string, string> = {};
      for (const headerName of ['accept', 'accept-language', 'content-type', 'cookie', 'user-agent']) {
        const value = req.headers[headerName];
        if (typeof value === 'string' && value.trim()) {
          forwardHeaders[headerName] = value;
        }
      }

      let rawBody: Buffer | undefined;
      if (method !== 'GET' && method !== 'HEAD') {
        rawBody = await readRawRequestBody(req);
      }

      const upstreamRes = await fetch(upstreamUrl.toString(), {
        method,
        headers: forwardHeaders,
        body: rawBody && rawBody.length > 0 ? new Uint8Array(rawBody) : undefined,
        redirect: 'manual',
      });

      res.status(upstreamRes.status);
      const passthroughHeaders = [
        'content-type',
        'cache-control',
        'vary',
        'location',
        'etag',
        'last-modified',
      ];
      for (const name of passthroughHeaders) {
        const val = upstreamRes.headers.get(name);
        if (val) {
          res.setHeader(name, val);
        }
      }

      const getSetCookie = (
        upstreamRes.headers as Headers & { getSetCookie?: () => string[] }
      ).getSetCookie;
      if (typeof getSetCookie === 'function') {
        const cookies = getSetCookie.call(upstreamRes.headers);
        if (cookies.length > 0) {
          res.setHeader('set-cookie', cookies);
        }
      }

      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');

      const responseBuffer = Buffer.from(await upstreamRes.arrayBuffer());
      res.send(responseBuffer);
    } catch (err) {
      console.error('Firebase /__/auth proxy error:', err);
      res.status(502).send('Failed to reach Firebase Authentication handler.');
    }
  });

  app.use(express.json({ limit: '8mb' }));

  // ---------------------------------------------------------------------------
  // 1. AUTHENTICATION & SESSION ENDPOINTS
  // ---------------------------------------------------------------------------
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const clientIp = req.ip || 'local';
    if (!checkSlidingWindowRateLimit(`auth:register:${clientIp}`, 15, 15 * 60_000)) {
      res.status(429).json({
        ok: false,
        errorCode: 'RATE_LIMITED',
        messageAr: 'محاولات تسجيل كثيرة في وقت قصير. يرجى المحاولة لاحقًا.',
        messageEn: 'Too many registration attempts. Please try again later.',
      });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const fullName = typeof body.fullName === 'string' ? body.fullName : '';
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const country = typeof body.country === 'string' ? body.country : '';
    const preferredLanguage: Language = body.preferredLanguage === 'en' ? 'en' : 'ar';

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();
    const trimmedCountry = country.trim();

    if (
      !normalizedEmail ||
      normalizedEmail.length > 254 ||
      !EMAIL_REGEX.test(normalizedEmail)
    ) {
      res.status(400).json({
        ok: false,
        errorCode: 'INVALID_EMAIL',
        messageAr: 'يرجى إدخال بريد إلكتروني صحيح.',
        messageEn: 'Please enter a valid email address.',
      });
      return;
    }

    if (!password || password.length < 8 || password.length > 128) {
      res.status(400).json({
        ok: false,
        errorCode: 'PASSWORD_TOO_SHORT',
        messageAr: 'يجب أن تتراوح كلمة المرور بين ٨ و١٢٨ خانة.',
        messageEn: 'Password must be between 8 and 128 characters long.',
      });
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 80) {
      res.status(400).json({
        ok: false,
        errorCode: 'FULL_NAME_REQUIRED',
        messageAr: 'يرجى إدخال الاسم الكامل (بين حرفين و٨٠ حرفًا).',
        messageEn: 'Please enter your full name (2 to 80 characters).',
      });
      return;
    }

    if (trimmedCountry.length > 80) {
      res.status(400).json({
        ok: false,
        errorCode: 'COUNTRY_TOO_LONG',
        messageAr: 'يجب ألا يتجاوز اسم الدولة ٨٠ حرفًا.',
        messageEn: 'Country name must be 80 characters or fewer.',
      });
      return;
    }

    const existingUser = Object.values(db.users).find(
      (u) => (u.email || '').trim().toLowerCase() === normalizedEmail
    );
    if (existingUser) {
      if (existingUser.profile.accountStatus === 'suspended') {
        res.status(403).json({
          ok: false,
          errorCode: 'ACCOUNT_SUSPENDED',
          messageAr: 'تم إيقاف هذا الحساب مؤقتًا. يرجى التواصل مع الدعم الفني.',
          messageEn: 'This account is suspended. Please contact support.',
        });
        return;
      }

      // If existing account has a password and the submitted password matches it,
      // seamlessly restore the existing account and all its items/QR/data instead of failing!
      if (existingUser.passwordHash && existingUser.passwordSalt) {
        const candidateHash = hashPassword(password, existingUser.passwordSalt);
        if (timingSafeEqualHex(candidateHash, existingUser.passwordHash)) {
          recomputeUserActiveCount(existingUser.uid);
          const nowIso = new Date().toISOString();
          existingUser.profile.lastActiveAt = nowIso;
          if (trimmedCountry && !existingUser.profile.country) {
            existingUser.profile.country = trimmedCountry;
          }
          const token = issueSession(existingUser.uid);
          setSessionCookie(res, req, token);
          db.loginLogs.unshift({
            id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
            email: normalizedEmail,
            uid: existingUser.uid,
            success: true,
            reasonCode: 'ACCOUNT_RESTORED_ON_REGISTER',
            portal: isSuperAdminEmailMatch(existingUser.email, configuredAdminEmail)
              ? 'admin'
              : 'user',
            ip: clientIp,
            createdAt: nowIso,
          });
          if (db.loginLogs.length > 500) db.loginLogs.length = 500;
          saveDatabase();
          res.status(200).json({
            ok: true,
            token,
            restoredExisting: true,
            profile: decorateProfileAuthority(existingUser),
          });
          return;
        }
      }

      if (existingUser.googleUid && !existingUser.passwordHash) {
        res.status(409).json({
          ok: false,
          errorCode: 'auth/account-exists-with-google',
          messageAr:
            'هذا البريد الإلكتروني مرتبط بحساب Google. يرجى الضغط على «المتابعة باستخدام Google» لاستعادة حسابك وبياناتك.',
          messageEn:
            'This email is linked to Google Sign-In. Please click "Continue with Google" to restore your account and data.',
        });
        return;
      }

      res.status(409).json({
        ok: false,
        errorCode: 'auth/email-already-in-use',
        messageAr:
          'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بكلمة المرور الخاصة بحسابك لاستعادة أغراضك وبياناتك.',
        messageEn:
          'This email address is already registered. Please sign in with your account password to restore your items and data.',
      });
      return;
    }

    const uid = `usr-${crypto.randomBytes(8).toString('hex')}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const nowIso = new Date().toISOString();
    const freeSpec = PLAN_QUOTA_SPECS.Free;

    const profile: UserProfile = {
      ...INITIAL_USER_PROFILE,
      uid,
      displayName: trimmedName,
      displayNameAr: trimmedName,
      displayNameEn: trimmedName,
      email: normalizedEmail,
      photoURL: '',
      country: trimmedCountry,
      preferredLanguage,
      defaultLanguage: preferredLanguage,
      plan: 'Free',
      accountStatus: 'active',
      activeItemsCount: 0,
      activeItemsLimit: freeSpec.maxActiveItems,
      contactMethodsLimit: freeSpec.maxContactMethods,
      lastQuotaItemId: '',
      createdAt: nowIso,
      updatedAt: nowIso,
      lastActiveAt: nowIso,
      joinedAt: nowIso.slice(0, 10),
      emailVerified: false,
      role: 'user',
      adminPermissions: [],
    };

    db.users[uid] = {
      uid,
      email: normalizedEmail,
      passwordSalt: salt,
      passwordHash,
      authProviders: ['password'],
      profile,
      settings: { ...INITIAL_WORKSPACE_SETTINGS },
    };

    const token = issueSession(uid);
    setSessionCookie(res, req, token);

    recordUserActivity(
      uid,
      'profile_updated',
      'إنشاء الحساب وتفعيل الباقة المجانية',
      'Account Created & Free Plan Activated',
      'تم تفعيل حسابك بحد غرضين نشطين ووسيلتي تواصل في الباقة المجانية.',
      'Your account is active with 2 active items and 2 contact methods on the Free plan.'
    );

    saveDatabase();

    res.status(201).json({
      ok: true,
      token,
      profile: decorateProfileAuthority(db.users[uid]),
    });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const normalizedEmail = email.trim().toLowerCase();

    const clientIp = req.ip || 'local';
    const rateKey = `auth:login:${clientIp}:${normalizedEmail}`;
    if (isSlidingWindowRateLimited(rateKey, 10, 5 * 60_000)) {
      res.status(429).json({
        ok: false,
        errorCode: 'RATE_LIMITED',
        messageAr: 'تم تجاوز الحد المسموح لمحاولات تسجيل الدخول الفاشلة. يرجى الانتظار ٥ دقائق.',
        messageEn: 'Too many failed login attempts. Please wait 5 minutes before trying again.',
      });
      return;
    }

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail) || !password) {
      recordSlidingWindowAttempt(rateKey, 5 * 60_000);
      res.status(401).json({
        ok: false,
        errorCode: 'auth/invalid-credential',
        messageAr: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        messageEn: 'Invalid email address or password.',
      });
      return;
    }

    let userRec = Object.values(db.users).find(
      (u) => (u.email || '').trim().toLowerCase() === normalizedEmail
    );

    let passwordVerified = false;
    if (userRec && userRec.passwordHash && userRec.passwordSalt) {
      const computedHash = hashPassword(password, userRec.passwordSalt);
      passwordVerified = timingSafeEqualHex(computedHash, userRec.passwordHash);
    }

    // Fallback: Check Firebase Auth Identity Toolkit if user had a legacy Firebase Auth account
    if (!passwordVerified) {
      const fbVerified = await verifyFirebasePasswordFallback(normalizedEmail, password);
      if (fbVerified) {
        const newSalt = crypto.randomBytes(16).toString('hex');
        const newHash = hashPassword(password, newSalt);
        const nowIso = new Date().toISOString();

        if (userRec) {
          userRec.passwordSalt = newSalt;
          userRec.passwordHash = newHash;
          const providers = new Set(userRec.authProviders || []);
          providers.add('password');
          userRec.authProviders = Array.from(providers);
          userRec.profile.updatedAt = nowIso;
          passwordVerified = true;
        } else {
          const cleanId = fbVerified.localId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
          const uid =
            cleanId && !db.users[`usr-${cleanId}`]
              ? `usr-${cleanId}`
              : `usr-${crypto.randomBytes(8).toString('hex')}`;
          const displayName = fbVerified.displayName || normalizedEmail.split('@')[0];
          const freeSpec = PLAN_QUOTA_SPECS.Free;
          const profile: UserProfile = {
            ...INITIAL_USER_PROFILE,
            uid,
            displayName,
            displayNameAr: displayName,
            displayNameEn: displayName,
            email: normalizedEmail,
            photoURL: '',
            country: '',
            preferredLanguage: 'ar',
            defaultLanguage: 'ar',
            plan: 'Free',
            accountStatus: 'active',
            activeItemsCount: 0,
            activeItemsLimit: freeSpec.maxActiveItems,
            contactMethodsLimit: freeSpec.maxContactMethods,
            lastQuotaItemId: '',
            createdAt: nowIso,
            updatedAt: nowIso,
            lastActiveAt: nowIso,
            joinedAt: nowIso.slice(0, 10),
            emailVerified: Boolean(fbVerified.emailVerified),
            role: 'user',
            adminPermissions: [],
          };
          userRec = {
            uid,
            email: normalizedEmail,
            passwordSalt: newSalt,
            passwordHash: newHash,
            googleUid: fbVerified.localId,
            authProviders: ['password'],
            profile,
            settings: { ...INITIAL_WORKSPACE_SETTINGS },
          };
          db.users[uid] = userRec;
          passwordVerified = true;
        }
      }
    }

    if (!userRec) {
      recordSlidingWindowAttempt(rateKey, 5 * 60_000);
      db.loginLogs.unshift({
        id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        email: normalizedEmail,
        success: false,
        reasonCode: 'INVALID_EMAIL_OR_PASSWORD',
        portal: 'user',
        ip: clientIp,
        createdAt: new Date().toISOString(),
      });
      saveDatabase();
      res.status(401).json({
        ok: false,
        errorCode: 'auth/invalid-credential',
        messageAr: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        messageEn: 'Invalid email address or password.',
      });
      return;
    }

    if (!passwordVerified) {
      recordSlidingWindowAttempt(rateKey, 5 * 60_000);
      const isGoogleOnly = Boolean(userRec.googleUid && !userRec.passwordHash);
      db.loginLogs.unshift({
        id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        email: normalizedEmail,
        uid: userRec.uid,
        success: false,
        reasonCode: isGoogleOnly ? 'GOOGLE_ACCOUNT_NO_PASSWORD' : 'INVALID_EMAIL_OR_PASSWORD',
        portal: 'user',
        ip: clientIp,
        createdAt: new Date().toISOString(),
      });
      saveDatabase();
      res.status(401).json({
        ok: false,
        errorCode: isGoogleOnly ? 'auth/account-exists-with-google' : 'auth/invalid-credential',
        messageAr: isGoogleOnly
          ? 'هذا الحساب مسجل عبر Google. يرجى تسجيل الدخول باستخدام زر Google.'
          : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        messageEn: isGoogleOnly
          ? 'This account uses Google Sign-In. Please sign in using the Google button.'
          : 'Invalid email address or password.',
      });
      return;
    }

    if (userRec.profile.accountStatus === 'suspended') {
      db.loginLogs.unshift({
        id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        email: normalizedEmail,
        uid: userRec.uid,
        success: false,
        reasonCode: 'ACCOUNT_SUSPENDED',
        portal: 'user',
        ip: clientIp,
        createdAt: new Date().toISOString(),
      });
      saveDatabase();
      res.status(403).json({
        ok: false,
        errorCode: 'ACCOUNT_SUSPENDED',
        messageAr: 'تم إيقاف هذا الحساب مؤقتًا. يرجى التواصل مع الدعم الفني.',
        messageEn: 'This account is suspended. Please contact support.',
      });
      return;
    }

    clearSlidingWindowRateLimit(rateKey);
    recomputeUserActiveCount(userRec.uid);
    userRec.profile.lastActiveAt = new Date().toISOString();
    const token = issueSession(userRec.uid);
    setSessionCookie(res, req, token);
    db.loginLogs.unshift({
      id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      email: normalizedEmail,
      uid: userRec.uid,
      success: true,
      reasonCode: 'LOGIN_SUCCESS',
      portal: isSuperAdminEmailMatch(userRec.email, configuredAdminEmail) ? 'admin' : 'user',
      ip: clientIp,
      createdAt: new Date().toISOString(),
    });
    if (db.loginLogs.length > 500) db.loginLogs.length = 500;
    saveDatabase();

    res.json({
      ok: true,
      token,
      profile: decorateProfileAuthority(userRec),
    });
  });

  app.post('/api/auth/google', async (req: Request, res: Response) => {
    const clientIp = req.ip || 'local';
    if (!checkSlidingWindowRateLimit(`auth:google:${clientIp}`, 20, 5 * 60_000)) {
      res.status(429).json({
        ok: false,
        errorCode: 'RATE_LIMITED',
        messageAr: 'محاولات كثيرة لتسجيل الدخول. يرجى الانتظار قليلًا.',
        messageEn: 'Too many sign-in attempts. Please wait a moment.',
      });
      return;
    }

    const body = (req.body || {}) as { idToken?: string; preferredLanguage?: string };
    const idToken = typeof body.idToken === 'string' ? body.idToken.trim() : '';
    const preferredLanguage: Language = body.preferredLanguage === 'en' ? 'en' : 'ar';

    if (!idToken) {
      res.status(400).json({
        ok: false,
        errorCode: 'MISSING_GOOGLE_ID_TOKEN',
        messageAr: 'رمز مصادقة Google غير متوفر. يرجى إعادة المحاولة.',
        messageEn: 'Missing Google authentication token. Please try again.',
      });
      return;
    }

    const verified = await verifyGoogleIdToken(idToken);
    if (!verified || !verified.email || !verified.emailVerified || !verified.googleUid) {
      db.loginLogs.unshift({
        id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        email: verified?.email || 'unknown@google',
        success: false,
        reasonCode: 'INVALID_GOOGLE_ID_TOKEN',
        portal: 'user',
        ip: clientIp,
        createdAt: new Date().toISOString(),
      });
      saveDatabase();
      res.status(401).json({
        ok: false,
        errorCode: 'INVALID_GOOGLE_TOKEN',
        messageAr: 'تعذر التحقق من جلسة Google أو أن البريد غير موثق.',
        messageEn: 'Could not verify Google authentication token or email is unverified.',
      });
      return;
    }

    const normalizedEmail = verified.email.trim().toLowerCase();
    const nowIso = new Date().toISOString();

    // Find existing user by verified googleUid first, then by normalized email
    const matchedByGoogleUid = Object.values(db.users).find(
      (u) => u.googleUid && u.googleUid === verified.googleUid
    );
    const matchedByEmail = !matchedByGoogleUid
      ? Object.values(db.users).find(
          (u) => (u.email || '').trim().toLowerCase() === normalizedEmail
        )
      : undefined;

    // Ownership verification rule: NEVER auto-merge a Google sign-in into an existing
    // password-only account solely by email similarity without verifying ownership of the password account.
    if (matchedByEmail && matchedByEmail.passwordHash && !matchedByEmail.googleUid) {
      if (matchedByEmail.profile.accountStatus === 'suspended') {
        res.status(403).json({
          ok: false,
          errorCode: 'ACCOUNT_SUSPENDED',
          messageAr: 'تم إيقاف هذا الحساب مؤقتًا. يرجى التواصل مع الدعم الفني.',
          messageEn: 'This account is suspended. Please contact support.',
        });
        return;
      }

      if (!db.pendingAccountLinks) db.pendingAccountLinks = {};
      const nowMs = Date.now();
      for (const [key, rec] of Object.entries(db.pendingAccountLinks)) {
        if (Date.parse(rec.expiresAt) <= nowMs || rec.targetUid === matchedByEmail.uid) {
          delete db.pendingAccountLinks[key];
        }
      }
      const rawLinkToken = crypto.randomBytes(32).toString('hex');
      const linkTokenHash = hashSessionToken(rawLinkToken);
      db.pendingAccountLinks[linkTokenHash] = {
        tokenHash: linkTokenHash,
        targetUid: matchedByEmail.uid,
        email: normalizedEmail,
        googleUid: verified.googleUid,
        displayName: (verified.displayName || '').slice(0, 80),
        photoURL:
          verified.photoURL && verified.photoURL.startsWith('https://') ? verified.photoURL : '',
        createdAt: nowIso,
        expiresAt: new Date(nowMs + 15 * 60 * 1000).toISOString(),
      };
      saveDatabase();

      res.status(409).json({
        ok: false,
        errorCode: 'LINK_ACCOUNT_REQUIRED',
        email: normalizedEmail,
        pendingLinkToken: rawLinkToken,
        messageAr:
          'يوجد حساب مسجل مسبقًا بهذا البريد الإلكتروني بكلمة مرور. لحماية حسابك وتوحيده في حساب واحد دون تكرار، أدخل كلمة مرور حسابك مرة واحدة لتأكيد الملكية وربط Google بنفس الحساب.',
        messageEn:
          'An account with this email already exists using a password. To securely link Google to that exact same account without creating a duplicate, confirm your existing account password once.',
      });
      return;
    }

    let userRec = matchedByGoogleUid || matchedByEmail;
    let isExistingUser = false;

    if (userRec) {
      isExistingUser = true;
      if (userRec.profile.accountStatus === 'suspended') {
        db.loginLogs.unshift({
          id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          email: normalizedEmail,
          uid: userRec.uid,
          success: false,
          reasonCode: 'ACCOUNT_SUSPENDED',
          portal: 'user',
          ip: clientIp,
          createdAt: nowIso,
        });
        saveDatabase();
        res.status(403).json({
          ok: false,
          errorCode: 'ACCOUNT_SUSPENDED',
          messageAr: 'تم إيقاف هذا الحساب مؤقتًا. يرجى التواصل مع الدعم الفني.',
          messageEn: 'This account is suspended. Please contact support.',
        });
        return;
      }

      userRec.googleUid = verified.googleUid;
      userRec.email = normalizedEmail;
      userRec.profile.email = normalizedEmail;
      userRec.profile.emailVerified = true;
      const providers = new Set<'password' | 'google'>(userRec.authProviders || []);
      if (userRec.passwordHash) providers.add('password');
      providers.add('google');
      userRec.authProviders = Array.from(providers);

      if (
        verified.photoURL &&
        verified.photoURL.startsWith('https://') &&
        !userRec.profile.photoURL
      ) {
        userRec.profile.photoURL = verified.photoURL;
      }
      userRec.profile.lastActiveAt = nowIso;
      userRec.profile.updatedAt = nowIso;
      recomputeUserActiveCount(userRec.uid);
    } else {
      const cleanGoogleId = verified.googleUid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      const uid =
        cleanGoogleId && !db.users[`usr-${cleanGoogleId}`]
          ? `usr-${cleanGoogleId}`
          : `usr-${crypto.randomBytes(8).toString('hex')}`;
      const displayName = (verified.displayName || normalizedEmail.split('@')[0]).slice(0, 80);
      const freeSpec = PLAN_QUOTA_SPECS.Free;

      const profile: UserProfile = {
        ...INITIAL_USER_PROFILE,
        uid,
        displayName,
        displayNameAr: displayName,
        displayNameEn: displayName,
        email: normalizedEmail,
        photoURL:
          verified.photoURL && verified.photoURL.startsWith('https://') ? verified.photoURL : '',
        country: '',
        preferredLanguage,
        defaultLanguage: preferredLanguage,
        plan: 'Free',
        accountStatus: 'active',
        activeItemsCount: 0,
        activeItemsLimit: freeSpec.maxActiveItems,
        contactMethodsLimit: freeSpec.maxContactMethods,
        lastQuotaItemId: '',
        createdAt: nowIso,
        updatedAt: nowIso,
        lastActiveAt: nowIso,
        joinedAt: nowIso.slice(0, 10),
        emailVerified: true,
        role: 'user',
        adminPermissions: [],
      };

      userRec = {
        uid,
        email: normalizedEmail,
        passwordSalt: '',
        passwordHash: '',
        googleUid: verified.googleUid,
        authProviders: ['google'],
        profile,
        settings: { ...INITIAL_WORKSPACE_SETTINGS },
      };
      db.users[uid] = userRec;

      recordUserActivity(
        uid,
        'profile_updated',
        'إنشاء الحساب عبر Google وتفعيل الباقة المجانية',
        'Account Created via Google & Free Plan Activated',
        'تم تفعيل حسابك الموثق عبر Google بحد غرضين نشطين ووسيلتي تواصل في الباقة المجانية.',
        'Your verified Google account is active with 2 active items and 2 contact methods on the Free plan.'
      );
    }

    const token = issueSession(userRec.uid);
    setSessionCookie(res, req, token);

    const decoratedProfile = decorateProfileAuthority(userRec);
    db.loginLogs.unshift({
      id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      email: normalizedEmail,
      uid: userRec.uid,
      success: true,
      reasonCode: isExistingUser ? 'GOOGLE_LOGIN_EXISTING' : 'GOOGLE_LOGIN_NEW',
      portal: decoratedProfile.role === 'super_admin' || decoratedProfile.role === 'staff_admin' ? 'admin' : 'user',
      ip: clientIp,
      createdAt: nowIso,
    });
    if (db.loginLogs.length > 500) db.loginLogs.length = 500;
    saveDatabase();

    res.json({
      ok: true,
      token,
      isExistingUser,
      profile: decoratedProfile,
    });
  });

  // Confirm ownership of an existing password account to complete linking Google (same UID, zero duplication)
  app.post('/api/auth/link/confirm-password', (req: Request, res: Response) => {
    const clientIp = req.ip || 'local';
    if (!checkSlidingWindowRateLimit(`auth:link-confirm:${clientIp}`, 10, 10 * 60_000)) {
      res.status(429).json({
        ok: false,
        errorCode: 'RATE_LIMITED',
        messageAr: 'محاولات كثيرة لتأكيد ربط الحساب. يرجى الانتظار قليلًا.',
        messageEn: 'Too many account link attempts. Please wait a few minutes.',
      });
      return;
    }

    const body = (req.body || {}) as { pendingLinkToken?: unknown; password?: unknown };
    const rawToken = typeof body.pendingLinkToken === 'string' ? body.pendingLinkToken.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!rawToken || !password) {
      res.status(400).json({
        ok: false,
        errorCode: 'MISSING_LINK_CREDENTIALS',
        messageAr: 'يرجى إدخال كلمة مرور حسابك لتأكيد الملكية وربط Google.',
        messageEn: 'Please enter your account password to verify ownership and link Google.',
      });
      return;
    }

    const tokenHash = hashSessionToken(rawToken);
    const pending = db.pendingAccountLinks?.[tokenHash];
    if (!pending || Date.parse(pending.expiresAt) <= Date.now()) {
      if (pending && db.pendingAccountLinks) {
        delete db.pendingAccountLinks[tokenHash];
        saveDatabase();
      }
      res.status(400).json({
        ok: false,
        errorCode: 'LINK_TOKEN_EXPIRED',
        messageAr: 'انتهت صلاحية جلسة ربط Google. يرجى الضغط على «المتابعة باستخدام Google» مجددًا.',
        messageEn: 'The Google account link session expired. Please click "Continue with Google" again.',
      });
      return;
    }

    const userRec = db.users[pending.targetUid];
    if (!userRec || !userRec.passwordHash || !userRec.passwordSalt) {
      res.status(404).json({ ok: false, errorCode: 'ACCOUNT_NOT_FOUND' });
      return;
    }

    const computedHash = hashPassword(password, userRec.passwordSalt);
    if (!timingSafeEqualHex(computedHash, userRec.passwordHash)) {
      res.status(401).json({
        ok: false,
        errorCode: 'INVALID_PASSWORD',
        messageAr: 'كلمة المرور غير صحيحة. لا يمكن ربط Google قبل التحقق من ملكية الحساب.',
        messageEn: 'Incorrect password. Google cannot be linked until account ownership is verified.',
      });
      return;
    }

    // Ensure googleUid isn't already bound to a different UID
    const otherGoogleOwner = Object.values(db.users).find(
      (u) => u.uid !== userRec.uid && u.googleUid === pending.googleUid
    );
    if (otherGoogleOwner) {
      res.status(409).json({
        ok: false,
        errorCode: 'GOOGLE_ACCOUNT_ALREADY_LINKED_TO_OTHER_USER',
        messageAr: 'حساب Google هذا مرتبط بالفعل بحساب آخر.',
        messageEn: 'This Google account is already linked to another user.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    userRec.googleUid = pending.googleUid;
    userRec.profile.emailVerified = true;
    if (pending.photoURL && !userRec.profile.photoURL) {
      userRec.profile.photoURL = pending.photoURL;
    }
    const providers = new Set<'password' | 'google'>(userRec.authProviders || []);
    providers.add('password');
    providers.add('google');
    userRec.authProviders = Array.from(providers);
    userRec.profile.updatedAt = nowIso;
    userRec.profile.lastActiveAt = nowIso;

    delete db.pendingAccountLinks![tokenHash];
    recomputeUserActiveCount(userRec.uid);
    const sessionToken = issueSession(userRec.uid);
    setSessionCookie(res, req, sessionToken);

    recordUserActivity(
      userRec.uid,
      'profile_updated',
      'ربط حساب Google بالحساب الحالي',
      'Linked Google Sign-In to Existing Account',
      'تم التحقق من الملكية وربط تسجيل الدخول عبر Google بنفس الحساب دون أي تكرار للبيانات.',
      'Verified ownership and linked Google Sign-In to the same account with zero data duplication.'
    );
    saveDatabase();

    res.json({
      ok: true,
      token: sessionToken,
      linked: true,
      isExistingUser: true,
      profile: decorateProfileAuthority(userRec),
      messageAr: 'تم التحقق من ملكية الحساب وربط Google بنجاح! يمكنك الآن الدخول بأي من الطريقتين.',
      messageEn: 'Account ownership verified and Google linked! You can now sign in with either method.',
    });
  });

  // Authenticated Google-first (or dual) user sets/updates password on the SAME account (UID preserved)
  app.post('/api/auth/set-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const userRec = req.user!;
    const body = (req.body || {}) as {
      newPassword?: unknown;
      currentPassword?: unknown;
      googleIdToken?: unknown;
    };
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const googleIdToken = typeof body.googleIdToken === 'string' ? body.googleIdToken.trim() : '';

    if (!newPassword || newPassword.length < 8 || newPassword.length > 128) {
      res.status(400).json({
        ok: false,
        errorCode: 'PASSWORD_TOO_SHORT',
        messageAr: 'يجب أن تتراوح كلمة المرور الجديدة بين ٨ و١٢٨ خانة.',
        messageEn: 'New password must be between 8 and 128 characters long.',
      });
      return;
    }

    let ownershipVerified = false;

    if (userRec.passwordHash && userRec.passwordSalt && currentPassword) {
      const hash = hashPassword(currentPassword, userRec.passwordSalt);
      ownershipVerified = timingSafeEqualHex(hash, userRec.passwordHash);
    }

    if (!ownershipVerified && googleIdToken) {
      const verified = await verifyGoogleIdToken(googleIdToken);
      if (
        verified &&
        verified.emailVerified &&
        ((userRec.googleUid && verified.googleUid === userRec.googleUid) ||
          verified.email.trim().toLowerCase() === userRec.email.trim().toLowerCase())
      ) {
        ownershipVerified = true;
      }
    }

    if (!ownershipVerified) {
      res.status(403).json({
        ok: false,
        errorCode: 'REAUTH_PROOF_REQUIRED',
        messageAr: userRec.passwordHash
          ? 'يرجى إدخال كلمة المرور الحالية أو إعادة التحقق عبر Google لتغيير كلمة المرور.'
          : 'لحماية حسابك، يرجى إعادة التحقق السريع عبر Google قبل تعيين كلمة مرور جديدة للحساب.',
        messageEn: userRec.passwordHash
          ? 'Please confirm your current password or re-verify with Google before changing your password.'
          : 'For your security, please re-verify with Google before setting a password on this account.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const newSalt = crypto.randomBytes(16).toString('hex');
    userRec.passwordSalt = newSalt;
    userRec.passwordHash = hashPassword(newPassword, newSalt);
    const providers = new Set<'password' | 'google'>(userRec.authProviders || []);
    if (userRec.googleUid) providers.add('google');
    providers.add('password');
    userRec.authProviders = Array.from(providers);
    userRec.profile.updatedAt = nowIso;

    // Revoke all OTHER sessions for this user while keeping the current active session
    for (const [tokenHash, sess] of Object.entries(db.sessions)) {
      if (sess.uid === userRec.uid && tokenHash !== req.tokenHash) {
        delete db.sessions[tokenHash];
      }
    }

    recordUserActivity(
      userRec.uid,
      'profile_updated',
      'تعيين / تحديث كلمة مرور الحساب',
      'Account Password Set / Updated',
      'تم تعيين كلمة مرور على نفس الحساب مع الحفاظ على كافة الأغراض والصلاحيات.',
      'Password configured on the same account while preserving all items and permissions.'
    );
    saveDatabase();

    res.json({
      ok: true,
      profile: decorateProfileAuthority(userRec),
      messageAr: 'تم تعيين كلمة المرور بنجاح على حسابك! يمكنك الآن تسجيل الدخول بالبريد وكلمة المرور أو عبر Google.',
      messageEn: 'Password saved on your account! You can now sign in with Email & Password or Google.',
    });
  });

  // Authenticated Email/Password user links Google to the SAME account after ownership verification
  app.post('/api/auth/link-google', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const userRec = req.user!;
    const body = (req.body || {}) as { password?: unknown; idToken?: unknown };
    const password = typeof body.password === 'string' ? body.password : '';
    const idToken = typeof body.idToken === 'string' ? body.idToken.trim() : '';

    if (!idToken) {
      res.status(400).json({
        ok: false,
        errorCode: 'MISSING_GOOGLE_ID_TOKEN',
        messageAr: 'يرجى إتمام التحقق من حساب Google أولًا.',
        messageEn: 'Please complete Google verification first.',
      });
      return;
    }

    if (userRec.passwordHash && userRec.passwordSalt) {
      if (!password || !timingSafeEqualHex(hashPassword(password, userRec.passwordSalt), userRec.passwordHash)) {
        res.status(401).json({
          ok: false,
          errorCode: 'INVALID_PASSWORD',
          messageAr: 'يرجى إدخال كلمة مرور حسابك الحالية لتأكيد ملكية الحساب قبل ربط Google.',
          messageEn: 'Please enter your current password to verify account ownership before linking Google.',
        });
        return;
      }
    }

    const verified = await verifyGoogleIdToken(idToken);
    if (!verified || !verified.email || !verified.emailVerified || !verified.googleUid) {
      res.status(401).json({
        ok: false,
        errorCode: 'INVALID_GOOGLE_TOKEN',
        messageAr: 'تعذر التحقق من حساب Google أو أن البريد غير موثق.',
        messageEn: 'Could not verify the Google account or its email is unverified.',
      });
      return;
    }

    if (verified.email.trim().toLowerCase() !== userRec.email.trim().toLowerCase()) {
      res.status(409).json({
        ok: false,
        errorCode: 'EMAIL_MISMATCH_FOR_LINK',
        messageAr:
          'بريد Google المختار لا يطابق البريد الإلكتروني المسجل لهذا الحساب. اختر نفس البريد الإلكتروني لإتمام الربط.',
        messageEn:
          'The selected Google email does not match this account email. Please choose the matching Google email.',
      });
      return;
    }

    const conflictUser = Object.values(db.users).find(
      (u) => u.uid !== userRec.uid && u.googleUid === verified.googleUid
    );
    if (conflictUser) {
      res.status(409).json({
        ok: false,
        errorCode: 'GOOGLE_ACCOUNT_ALREADY_LINKED_TO_OTHER_USER',
        messageAr: 'حساب Google هذا مرتبط بالفعل بحساب آخر.',
        messageEn: 'This Google account is already linked to another user.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    userRec.googleUid = verified.googleUid;
    userRec.profile.emailVerified = true;
    if (verified.photoURL && verified.photoURL.startsWith('https://') && !userRec.profile.photoURL) {
      userRec.profile.photoURL = verified.photoURL;
    }
    const providers = new Set<'password' | 'google'>(userRec.authProviders || []);
    if (userRec.passwordHash) providers.add('password');
    providers.add('google');
    userRec.authProviders = Array.from(providers);
    userRec.profile.updatedAt = nowIso;

    recordUserActivity(
      userRec.uid,
      'profile_updated',
      'ربط حساب Google بالحساب',
      'Google Sign-In Linked to Account',
      'تم ربط حساب Google بنجاح مع الإبقاء على نفس معرف الحساب وكافة البيانات.',
      'Linked Google Sign-In successfully while preserving the exact same account UID and data.'
    );
    saveDatabase();

    res.json({
      ok: true,
      profile: decorateProfileAuthority(userRec),
      messageAr: 'تم ربط حساب Google بحسابك بنجاح!',
      messageEn: 'Google Sign-In has been linked to your account!',
    });
  });

  app.post('/api/auth/logout', (req: AuthenticatedRequest, res: Response) => {
    const token = extractTokenFromRequest(req);
    if (token) {
      const tokenHash = hashSessionToken(token);
      if (db.sessions[tokenHash]) {
        delete db.sessions[tokenHash];
        saveDatabase();
      }
    }
    clearSessionCookie(res, req);
    res.json({ ok: true });
  });

  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    const clientIp = req.ip || 'local';
    if (!checkSlidingWindowRateLimit(`auth:reset:${clientIp}`, 5, 15 * 60_000)) {
      res.status(429).json({
        ok: false,
        errorCode: 'RATE_LIMITED',
        messageAr: 'تم إرسال طلبات كثيرة لإعادة التعيين. يرجى الانتظار قليلًا.',
        messageEn: 'Too many password reset requests. Please try again later.',
      });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email : '';
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail.length > 254 || !EMAIL_REGEX.test(normalizedEmail)) {
      res.status(400).json({
        ok: false,
        errorCode: 'INVALID_EMAIL',
        messageAr: 'يرجى إدخال بريد إلكتروني صحيح.',
        messageEn: 'Please enter a valid email address.',
      });
      return;
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const userRec = Object.values(db.users).find(
      (u) => (u.email || '').trim().toLowerCase() === normalizedEmail
    );

    if (userRec && userRec.profile.accountStatus !== 'suspended') {
      if (!db.passwordResetTokens) db.passwordResetTokens = {};
      // Prune expired tokens & invalidate prior unused reset tokens for this user
      for (const [key, rec] of Object.entries(db.passwordResetTokens)) {
        if (Date.parse(rec.expiresAt) <= nowMs || rec.uid === userRec.uid) {
          delete db.passwordResetTokens[key];
        }
      }
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashSessionToken(rawToken);
      db.passwordResetTokens[tokenHash] = {
        tokenHash,
        uid: userRec.uid,
        email: normalizedEmail,
        createdAt: nowIso,
        expiresAt: new Date(nowMs + 30 * 60 * 1000).toISOString(), // 30 min TTL
        usedAt: null,
      };
      saveDatabase();
      options.onPasswordResetTokenIssued?.({
        email: normalizedEmail,
        uid: userRec.uid,
        rawToken,
      });

      // Dispatch transactional reset email via configured server provider (Resend / SendGrid / SMTP)
      void sendTransactionalEmail(
        buildPasswordResetEmail({
          to: normalizedEmail,
          rawToken,
        }),
        options.emailOverrides
      ).catch(() => {
        // Non-fatal; response stays non-enumerating
      });

      // Best-effort Firebase Auth password reset email (never alter HTTP response to prevent enumeration)
      if (FIREBASE_API_KEY && !normalizedEmail.endsWith('.test')) {
        try {
          await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestType: 'PASSWORD_RESET',
                email: normalizedEmail,
              }),
            }
          );
        } catch {
          // Non-fatal; response stays non-enumerating
        }
      }
    }

    // Strict anti-enumeration: identical response regardless of whether email exists or uses Google-only
    res.json({
      ok: true,
      email: normalizedEmail,
      messageAr:
        'إذا كان هذا البريد مسجلًا لدينا، فقد تم إنشاء طلب استعادة كلمة المرور بصلاحية ٣٠ دقيقة وإرسال التعليمات. إذا كان حسابك مرتبطًا بـ Google فيمكنك أيضًا الدخول عبر Google وتعيين كلمة مرور جديدة من إعدادات الأمان.',
      messageEn:
        'If an account exists for this email, a 30-minute password reset request has been issued with instructions. If your account is linked to Google, you can also sign in with Google and set a password in Account Security.',
    });
  });

  app.get('/api/auth/reset-password/verify', (req: Request, res: Response) => {
    const rawToken = typeof req.query.token === 'string' ? req.query.token.trim() : '';
    if (!rawToken || rawToken.length < 32) {
      res.status(400).json({
        ok: false,
        valid: false,
        errorCode: 'RESET_TOKEN_INVALID',
        messageAr: 'رابط إعادة تعيين كلمة المرور غير صالح.',
        messageEn: 'Password reset link is invalid.',
      });
      return;
    }

    const tokenHash = hashSessionToken(rawToken);
    const record = db.passwordResetTokens?.[tokenHash];
    if (!record) {
      res.status(400).json({
        ok: false,
        valid: false,
        errorCode: 'RESET_TOKEN_INVALID',
        messageAr: 'رابط إعادة تعيين كلمة المرور غير صالح أو تم استبداله.',
        messageEn: 'Password reset link is invalid or has been replaced.',
      });
      return;
    }
    if (record.usedAt) {
      res.status(400).json({
        ok: false,
        valid: false,
        errorCode: 'RESET_TOKEN_USED',
        messageAr: 'تم استخدام رابط إعادة تعيين كلمة المرور هذا مسبقًا. يرجى طلب رابط جديد.',
        messageEn: 'This password reset link has already been used. Please request a new link.',
      });
      return;
    }
    if (Date.parse(record.expiresAt) <= Date.now()) {
      res.status(400).json({
        ok: false,
        valid: false,
        errorCode: 'RESET_TOKEN_EXPIRED',
        messageAr: 'انتهت صلاحية رابط إعادة تعيين كلمة المرور. يرجى طلب رابط جديد.',
        messageEn: 'This password reset link has expired. Please request a new link.',
      });
      return;
    }

    res.json({
      ok: true,
      valid: true,
      expiresAt: record.expiresAt,
    });
  });

  app.post('/api/auth/reset-password/confirm', (req: Request, res: Response) => {
    const clientIp = req.ip || 'local';
    if (!checkSlidingWindowRateLimit(`auth:reset-confirm:${clientIp}`, 10, 15 * 60_000)) {
      res.status(429).json({
        ok: false,
        errorCode: 'RATE_LIMITED',
        messageAr: 'محاولات كثيرة لتأكيد إعادة تعيين كلمة المرور. يرجى الانتظار قليلًا.',
        messageEn: 'Too many password reset confirmation attempts. Please wait briefly.',
      });
      return;
    }

    const body = (req.body || {}) as { token?: unknown; newPassword?: unknown };
    const rawToken = typeof body.token === 'string' ? body.token.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!rawToken || rawToken.length < 32) {
      res.status(400).json({
        ok: false,
        errorCode: 'RESET_TOKEN_INVALID',
        messageAr: 'رمز إعادة التعيين غير صالح.',
        messageEn: 'Invalid password reset token.',
      });
      return;
    }

    if (!newPassword || newPassword.length < 8 || newPassword.length > 128) {
      res.status(400).json({
        ok: false,
        errorCode: 'PASSWORD_TOO_SHORT',
        messageAr: 'يجب أن تتراوح كلمة المرور الجديدة بين ٨ و١٢٨ خانة.',
        messageEn: 'New password must be between 8 and 128 characters long.',
      });
      return;
    }

    const tokenHash = hashSessionToken(rawToken);
    const record = db.passwordResetTokens?.[tokenHash];
    if (!record) {
      res.status(400).json({
        ok: false,
        errorCode: 'RESET_TOKEN_INVALID',
        messageAr: 'رابط إعادة تعيين كلمة المرور غير صالح.',
        messageEn: 'Password reset link is invalid.',
      });
      return;
    }
    if (record.usedAt) {
      res.status(400).json({
        ok: false,
        errorCode: 'RESET_TOKEN_USED',
        messageAr: 'تم استخدام هذا الرابط مسبقًا. يرجى طلب رابط جديد.',
        messageEn: 'This reset link has already been used. Please request a new one.',
      });
      return;
    }
    if (Date.parse(record.expiresAt) <= Date.now()) {
      res.status(400).json({
        ok: false,
        errorCode: 'RESET_TOKEN_EXPIRED',
        messageAr: 'انتهت صلاحية رابط إعادة التعيين. يرجى طلب رابط جديد.',
        messageEn: 'This reset link has expired. Please request a new one.',
      });
      return;
    }

    const userRec = db.users[record.uid];
    if (!userRec || userRec.profile.accountStatus === 'suspended') {
      res.status(403).json({
        ok: false,
        errorCode: 'ACCOUNT_UNAVAILABLE',
        messageAr: 'لا يمكن إتمام إعادة التعيين لهذا الحساب حاليًا.',
        messageEn: 'Password reset cannot be completed for this account.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const newSalt = crypto.randomBytes(16).toString('hex');
    userRec.passwordSalt = newSalt;
    userRec.passwordHash = hashPassword(newPassword, newSalt);
    const providers = new Set<'password' | 'google'>(userRec.authProviders || []);
    if (userRec.googleUid) providers.add('google');
    providers.add('password');
    userRec.authProviders = Array.from(providers);
    userRec.profile.updatedAt = nowIso;

    // Single-use invalidation
    record.usedAt = nowIso;

    // Revoke ALL active sessions for this user on password reset
    for (const [sHash, sess] of Object.entries(db.sessions)) {
      if (sess.uid === userRec.uid) {
        delete db.sessions[sHash];
      }
    }

    recordUserActivity(
      userRec.uid,
      'profile_updated',
      'إعادة تعيين كلمة المرور بنجاح',
      'Password Reset Completed',
      'تم تحديث كلمة المرور عبر رابط الاستعادة وإنهاء جميع الجلسات السابقة لحماية الحساب.',
      'Password updated via recovery link and all prior sessions were revoked for security.'
    );
    saveDatabase();

    res.json({
      ok: true,
      messageAr: 'تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
      messageEn: 'Your password has been updated! You can now sign in with your new password.',
    });
  });

  // Hardened Email Verification: NEVER blindly flip emailVerified without verification proof
  app.post('/api/auth/verify-email', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const userRec = req.user!;
    if (userRec.profile.emailVerified) {
      res.json({
        ok: true,
        verified: true,
        profile: decorateProfileAuthority(userRec),
        messageAr: 'بريدك الإلكتروني مؤكد بالفعل.',
        messageEn: 'Your email address is already verified.',
      });
      return;
    }

    const body = (req.body || {}) as { token?: unknown; idToken?: unknown };
    const rawToken = typeof body.token === 'string' ? body.token.trim() : '';
    const idToken = typeof body.idToken === 'string' ? body.idToken.trim() : '';

    if (idToken) {
      const verified = await verifyGoogleIdToken(idToken);
      if (
        verified &&
        verified.emailVerified &&
        verified.email.trim().toLowerCase() === userRec.email.trim().toLowerCase()
      ) {
        userRec.profile.emailVerified = true;
        userRec.profile.updatedAt = new Date().toISOString();
        saveDatabase();
        res.json({
          ok: true,
          verified: true,
          profile: decorateProfileAuthority(userRec),
          messageAr: 'تم تأكيد بريدك الإلكتروني بنجاح عبر هوية Google الموثقة.',
          messageEn: 'Your email has been verified via your verified Google identity.',
        });
        return;
      }
      res.status(400).json({
        ok: false,
        errorCode: 'INVALID_VERIFICATION_PROOF',
        messageAr: 'تعذر التحقق من البريد الإلكتروني باستخدام الرمز المقدم.',
        messageEn: 'Could not verify email with the provided identity proof.',
      });
      return;
    }

    if (rawToken) {
      const tokenHash = hashSessionToken(rawToken);
      const record = db.emailVerificationTokens?.[tokenHash];
      if (
        !record ||
        record.uid !== userRec.uid ||
        record.usedAt ||
        Date.parse(record.expiresAt) <= Date.now()
      ) {
        res.status(400).json({
          ok: false,
          errorCode: 'VERIFICATION_TOKEN_INVALID_OR_EXPIRED',
          messageAr: 'رمز التحقق من البريد غير صالح أو منتهي الصلاحية.',
          messageEn: 'Email verification token is invalid or expired.',
        });
        return;
      }
      const nowIso = new Date().toISOString();
      record.usedAt = nowIso;
      userRec.profile.emailVerified = true;
      userRec.profile.updatedAt = nowIso;
      saveDatabase();
      res.json({
        ok: true,
        verified: true,
        profile: decorateProfileAuthority(userRec),
        messageAr: 'تم تأكيد بريدك الإلكتروني بنجاح.',
        messageEn: 'Your email address has been verified.',
      });
      return;
    }

    // Issue a verification token without marking verified until confirmed
    if (!db.emailVerificationTokens) db.emailVerificationTokens = {};
    const nowMs = Date.now();
    const rawVerifyToken = crypto.randomBytes(24).toString('hex');
    const verifyHash = hashSessionToken(rawVerifyToken);
    db.emailVerificationTokens[verifyHash] = {
      tokenHash: verifyHash,
      uid: userRec.uid,
      email: userRec.email,
      createdAt: new Date(nowMs).toISOString(),
      expiresAt: new Date(nowMs + 30 * 60 * 1000).toISOString(),
      usedAt: null,
    };
    saveDatabase();
    options.onEmailVerificationTokenIssued?.({
      email: userRec.email,
      uid: userRec.uid,
      rawToken: rawVerifyToken,
    });

    const emailDispatch = await sendTransactionalEmail(
      buildEmailVerificationEmail({
        to: userRec.email,
        rawToken: rawVerifyToken,
      }),
      options.emailOverrides
    );

    res.json({
      ok: true,
      verified: false,
      pendingVerification: true,
      emailDelivered: emailDispatch.sent,
      emailProvider: emailDispatch.provider,
      profile: decorateProfileAuthority(userRec),
      messageAr: emailDispatch.sent
        ? 'تم إرسال رابط ورمز التحقق إلى بريدك الإلكتروني بنجاح (صالح لمدة ٣٠ دقيقة).'
        : 'تم إنشاء طلب التحقق من البريد الإلكتروني. إذا كان بريدك على Google يمكنك أيضًا ربط حساب Google لتأكيد البريد فورًا.',
      messageEn: emailDispatch.sent
        ? 'Verification link and token have been sent to your email address (valid for 30 minutes).'
        : 'Verification request issued. If this is a Google email, you can also link Google Sign-In to verify immediately.',
    });
  });

  // ---------------------------------------------------------------------------
  // 2. WORKSPACE SNAPSHOT & PROFILE ENDPOINTS (Authenticated & Isolated)
  // ---------------------------------------------------------------------------
  function getDecoratedUserItems(uid: string): RegisteredItem[] {
    const sharedGroupsMap = db.sharedQrGroups || {};
    return Object.values(db.items)
      .filter((item) => item.ownerUid === uid)
      .map((item) => decorateItemQrModeMetadata(item, sharedGroupsMap))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  app.get('/api/auth/session', (req: Request, res: Response) => {
    const token = extractTokenFromRequest(req);
    if (!token || token.length < 16) {
      res.json({ ok: true, authenticated: false, profile: null });
      return;
    }

    const tokenHash = hashSessionToken(token);
    const session = db.sessions[tokenHash];
    if (!session) {
      clearSessionCookie(res, req);
      res.json({ ok: true, authenticated: false, profile: null });
      return;
    }

    const nowMs = Date.now();
    if (isSessionExpired(session, nowMs)) {
      delete db.sessions[tokenHash];
      saveDatabase();
      clearSessionCookie(res, req);
      res.json({ ok: true, authenticated: false, profile: null, errorCode: 'SESSION_EXPIRED' });
      return;
    }

    const userRec = db.users[session.uid];
    if (!userRec || userRec.profile.accountStatus === 'suspended') {
      delete db.sessions[tokenHash];
      saveDatabase();
      clearSessionCookie(res, req);
      res.json({ ok: true, authenticated: false, profile: null });
      return;
    }

    const lastUsedMs = Date.parse(session.lastUsedAt);
    if (!Number.isFinite(lastUsedMs) || nowMs - lastUsedMs > 60_000) {
      const nowIso = new Date(nowMs).toISOString();
      session.lastUsedAt = nowIso;
      userRec.profile.lastActiveAt = nowIso;
      saveDatabase();
    }

    recomputeUserActiveCount(userRec.uid);
    const uid = userRec.uid;
    res.json({
      ok: true,
      authenticated: true,
      sessionToken: token,
      profile: decorateProfileAuthority(userRec),
      settings: userRec.settings || INITIAL_WORKSPACE_SETTINGS,
      items: getDecoratedUserItems(uid),
      groups: Object.values(db.groups || {})
        .filter((g) => g.ownerUid === uid)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      sharedQrGroups: Object.values(db.sharedQrGroups || {})
        .filter((g) => g.ownerUid === uid)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      messages: Object.values(db.messages)
        .filter((msg) => msg.ownerUid === uid)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      notifications: Object.values(db.notifications)
        .filter((n) => n.ownerUid === uid)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
      activities: Object.values(db.activities)
        .filter((act) => act.ownerUid === uid)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    });
  });

  app.get('/api/workspace', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    recomputeUserActiveCount(uid);

    const userItems = getDecoratedUserItems(uid);

    const userGroups = Object.values(db.groups || {})
      .filter((g) => g.ownerUid === uid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const userSharedQrGroups = Object.values(db.sharedQrGroups || {})
      .filter((g) => g.ownerUid === uid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const userMessages = Object.values(db.messages)
      .filter((msg) => msg.ownerUid === uid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const userNotifications = Object.values(db.notifications)
      .filter((n) => n.ownerUid === uid)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const userActivities = Object.values(db.activities)
      .filter((act) => act.ownerUid === uid)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    res.json({
      ok: true,
      sessionToken: req.rawToken || undefined,
      profile: decorateProfileAuthority(req.user!),
      settings: req.user!.settings || INITIAL_WORKSPACE_SETTINGS,
      items: userItems,
      groups: userGroups,
      sharedQrGroups: userSharedQrGroups,
      messages: userMessages,
      notifications: userNotifications,
      activities: userActivities,
    });
  });

  app.patch('/api/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userRec = req.user!;
    const current = userRec.settings || INITIAL_WORKSPACE_SETTINGS;
    const body = (req.body || {}) as Partial<WorkspaceSettings>;

    const updated: WorkspaceSettings = {
      instantEmailAlerts:
        typeof body.instantEmailAlerts === 'boolean'
          ? body.instantEmailAlerts
          : current.instantEmailAlerts,
      whatsappScanAlerts:
        typeof body.whatsappScanAlerts === 'boolean'
          ? body.whatsappScanAlerts
          : current.whatsappScanAlerts,
      requireFinderNoteBeforeContact:
        typeof body.requireFinderNoteBeforeContact === 'boolean'
          ? body.requireFinderNoteBeforeContact
          : current.requireFinderNoteBeforeContact,
      ShareCoarseLocationOnScan:
        typeof body.ShareCoarseLocationOnScan === 'boolean'
          ? body.ShareCoarseLocationOnScan
          : current.ShareCoarseLocationOnScan,
      defaultAnonymousMode:
        typeof body.defaultAnonymousMode === 'boolean'
          ? body.defaultAnonymousMode
          : current.defaultAnonymousMode,
      autoLockQrAfterRecovery:
        typeof body.autoLockQrAfterRecovery === 'boolean'
          ? body.autoLockQrAfterRecovery
          : current.autoLockQrAfterRecovery,
      notifyOnQrScan:
        typeof body.notifyOnQrScan === 'boolean'
          ? body.notifyOnQrScan
          : current.notifyOnQrScan ?? true,
      notifyOnFinderMessage:
        typeof body.notifyOnFinderMessage === 'boolean'
          ? body.notifyOnFinderMessage
          : current.notifyOnFinderMessage ?? true,
      notifyOnRecovery:
        typeof body.notifyOnRecovery === 'boolean'
          ? body.notifyOnRecovery
          : current.notifyOnRecovery ?? true,
      notifyOnSubscription:
        typeof body.notifyOnSubscription === 'boolean'
          ? body.notifyOnSubscription
          : current.notifyOnSubscription ?? true,
      notifyOnSystemUpdates:
        typeof body.notifyOnSystemUpdates === 'boolean'
          ? body.notifyOnSystemUpdates
          : current.notifyOnSystemUpdates ?? true,
    };

    userRec.settings = updated;
    saveDatabase();
    res.json({ ok: true, settings: updated });
  });

  app.patch('/api/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userRec = req.user!;
    const body = (req.body || {}) as Record<string, unknown>;

    const candidateUpdate = {
      displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
      country: typeof body.country === 'string' ? body.country : undefined,
      preferredLanguage:
        body.preferredLanguage !== undefined ? String(body.preferredLanguage) : undefined,
      photoURL: body.photoURL !== undefined ? (body.photoURL as string) : undefined,
      phone: body.phone !== undefined ? (body.phone as string) : undefined,
      whatsapp: body.whatsapp !== undefined ? (body.whatsapp as string) : undefined,
      telegram: body.telegram !== undefined ? (body.telegram as string) : undefined,
    };

    const check = validateProfileUpdate(candidateUpdate);
    if (!check.valid) {
      const firstErr = Object.values(check.errors)[0] || 'INVALID_PROFILE_INPUT';
      res.status(400).json({
        ok: false,
        errorCode: firstErr,
        errors: check.errors,
        messageAr:
          firstErr === 'INVALID_PHOTO_URL'
            ? 'يرجى إدخال رابط صورة صحيح يبدأ بـ https:// أو تركه فارغًا.'
            : 'يرجى التحقق من صحة حقول الملف الشخصي.',
        messageEn:
          firstErr === 'INVALID_PHOTO_URL'
            ? 'Please enter a valid https:// photo URL or leave it blank.'
            : 'Please check your profile input fields.',
      });
      return;
    }

    // SECURITY FIX: plan, activeItemsLimit, contactMethodsLimit, uid, emailVerified, and accountStatus
    // are strictly server-authoritative and NEVER accepted from client input via PATCH /api/profile.
    enforceAuthoritativePlanLimits(userRec);
    const serverPlanSpec = PLAN_QUOTA_SPECS[userRec.profile.plan];

    const nextName =
      candidateUpdate.displayName !== undefined
        ? candidateUpdate.displayName.trim()
        : userRec.profile.displayName;

    userRec.profile = {
      ...userRec.profile,
      displayName: nextName,
      displayNameAr: nextName,
      displayNameEn: nextName,
      country:
        candidateUpdate.country !== undefined
          ? candidateUpdate.country.trim()
          : userRec.profile.country,
      preferredLanguage:
        body.preferredLanguage === 'en' || body.preferredLanguage === 'ar'
          ? body.preferredLanguage
          : userRec.profile.preferredLanguage,
      photoURL:
        candidateUpdate.photoURL !== undefined
          ? candidateUpdate.photoURL.trim()
          : userRec.profile.photoURL,
      phone:
        candidateUpdate.phone !== undefined
          ? candidateUpdate.phone.trim()
          : userRec.profile.phone,
      whatsapp:
        candidateUpdate.whatsapp !== undefined
          ? candidateUpdate.whatsapp.trim()
          : userRec.profile.whatsapp,
      telegram:
        candidateUpdate.telegram !== undefined
          ? candidateUpdate.telegram.trim()
          : userRec.profile.telegram,
      plan: userRec.profile.plan,
      activeItemsLimit: serverPlanSpec.maxActiveItems,
      contactMethodsLimit: serverPlanSpec.maxContactMethods,
      updatedAt: new Date().toISOString(),
    };

    recomputeUserActiveCount(userRec.uid);
    recordUserActivity(
      userRec.uid,
      'profile_updated',
      'تحديث الملف الشخصي',
      'Updated User Profile',
      'تم حفظ تعديلات الملف الشخصي وبيانات التواصل بنجاح.',
      'Saved profile details and default contact preferences.'
    );
    saveDatabase();

    res.json({
      ok: true,
      profile: decorateProfileAuthority(userRec),
    });
  });

  // ---------------------------------------------------------------------------
  // 2B. ITEM GROUPS CRUD ENDPOINTS (Authenticated & Strictly User-Isolated)
  // ---------------------------------------------------------------------------
  function getUserPurchasedTemplateIds(uid: string): Set<string> {
    const purchased = new Set<string>();
    const nowMs = Date.now();
    for (const lic of Object.values(db.issuedLicenses || {})) {
      if (lic.userId !== uid || lic.status !== 'active') continue;
      if (lic.expiresAt && Date.parse(lic.expiresAt) <= nowMs) continue;
      purchased.add(lic.templateId);
    }
    return purchased;
  }

  function verifyTemplateAccessForUser(
    designId: string,
    userRec: StoredUserRecord
  ): { allowed: boolean; templateTitleAr?: string; templateTitleEn?: string } {
    const tpl = db.templates?.[designId];
    if (!tpl) {
      return {
        allowed: false,
        templateTitleAr: designId,
        templateTitleEn: designId,
      };
    }
    if (tpl.status === 'archived') {
      return {
        allowed: true,
        templateTitleAr: tpl.titleAr,
        templateTitleEn: tpl.titleEn,
      };
    }
    const purchasedIds = getUserPurchasedTemplateIds(userRec.uid);
    const allowed = canAccessTemplateByPlanOrPurchase({
      template: tpl,
      userPlan: userRec.profile.plan,
      purchasedTemplateIds: purchasedIds,
    });
    return {
      allowed,
      templateTitleAr: tpl.titleAr,
      templateTitleEn: tpl.titleEn,
    };
  }

  function sanitizePrivacyPatch(
    base: ItemPrivacySettings,
    patch?: Partial<ItemPrivacySettings>
  ): ItemPrivacySettings {
    if (!patch || typeof patch !== 'object') return base;
    return {
      publicPageEnabled:
        typeof patch.publicPageEnabled === 'boolean'
          ? patch.publicPageEnabled
          : base.publicPageEnabled,
      showDescription:
        typeof patch.showDescription === 'boolean'
          ? patch.showDescription
          : base.showDescription,
      showImage:
        typeof patch.showImage === 'boolean' ? patch.showImage : base.showImage,
      showCity:
        typeof patch.showCity === 'boolean' ? patch.showCity : base.showCity,
      allowFinderMessages:
        typeof patch.allowFinderMessages === 'boolean'
          ? patch.allowFinderMessages
          : base.allowFinderMessages,
      allowFoundReports:
        typeof patch.allowFoundReports === 'boolean'
          ? patch.allowFoundReports
          : base.allowFoundReports,
    };
  }

  app.get('/api/groups', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const groups = Object.values(db.groups || {})
      .filter((g) => g.ownerUid === uid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ ok: true, groups });
  });

  app.post('/api/groups', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const body = (req.body || {}) as {
      name?: string;
      description?: string;
      colorHex?: string;
      coverUrl?: string;
      coverSource?: ItemGroup['coverSource'];
      originalImages?: string[];
    };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 2 || name.length > 60) {
      res.status(400).json({
        ok: false,
        errorCode: 'INVALID_GROUP_NAME',
        messageAr: 'يرجى إدخال اسم مجموعة بين حرفين و ٦٠ حرفًا.',
        messageEn: 'Please provide a group name between 2 and 60 characters.',
      });
      return;
    }
    const rawColor = typeof body.colorHex === 'string' ? body.colorHex.trim() : '';
    const colorHex = /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : '#0F9D8E';
    const cleanCoverUrl =
      typeof body.coverUrl === 'string' && isSafeMediaOrHttpsUrl(body.coverUrl.trim(), 500)
        ? body.coverUrl.trim()
        : '';
    const cleanOriginals = Array.isArray(body.originalImages)
      ? body.originalImages
          .filter((u) => typeof u === 'string' && isSafeMediaOrHttpsUrl(u.trim(), 500) && u.trim())
          .map((u) => u.trim())
          .slice(0, 8)
      : [];
    const groupDesc = typeof body.description === 'string' ? body.description.trim().slice(0, 240) : '';
    const autoGroupMatch =
      !cleanCoverUrl && cleanOriginals.length === 0
        ? matchSmartCover({
            entityType: 'org_group',
            name,
            description: groupDesc,
          })
        : null;
    const effectiveGroupCover =
      cleanCoverUrl || cleanOriginals[0] || autoGroupMatch?.coverUrl || undefined;
    const effectiveGroupCoverSource =
      body.coverSource ||
      (cleanCoverUrl
        ? 'user_selected'
        : cleanOriginals.length > 0
        ? 'auto_selected'
        : autoGroupMatch?.coverSource);

    const nowIso = new Date().toISOString();
    const groupId = `grp-${crypto.randomBytes(5).toString('hex')}`;
    const group: ItemGroup = {
      id: groupId,
      ownerUid: uid,
      name,
      description: groupDesc,
      colorHex,
      coverUrl: effectiveGroupCover,
      coverSource: effectiveGroupCoverSource,
      originalImages: cleanOriginals.length > 0 ? cleanOriginals : undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    if (!db.groups) db.groups = {};
    db.groups[groupId] = group;
    saveDatabase();
    res.status(201).json({ ok: true, group });
  });

  app.patch('/api/groups/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const groupId = req.params.id;
    const existing = db.groups?.[groupId];
    if (!existing) {
      res.status(404).json({ ok: false, errorCode: 'GROUP_NOT_FOUND' });
      return;
    }
    if (existing.ownerUid !== uid) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_NOT_OWNER' });
      return;
    }
    const body = (req.body || {}) as {
      name?: string;
      description?: string;
      colorHex?: string;
      coverUrl?: string;
      coverSource?: ItemGroup['coverSource'];
      originalImages?: string[];
    };
    const nextName =
      typeof body.name === 'string' && body.name.trim()
        ? body.name.trim()
        : existing.name;
    if (nextName.length < 2 || nextName.length > 60) {
      res.status(400).json({
        ok: false,
        errorCode: 'INVALID_GROUP_NAME',
        messageAr: 'يرجى إدخال اسم مجموعة بين حرفين و ٦٠ حرفًا.',
        messageEn: 'Please provide a group name between 2 and 60 characters.',
      });
      return;
    }
    const rawColor = typeof body.colorHex === 'string' ? body.colorHex.trim() : '';
    const nextColor = /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : existing.colorHex;
    const nextCoverUrl =
      body.coverUrl !== undefined
        ? typeof body.coverUrl === 'string' && isSafeMediaOrHttpsUrl(body.coverUrl.trim(), 500)
          ? body.coverUrl.trim()
          : existing.coverUrl
        : existing.coverUrl;
    const nextOriginalImages =
      Array.isArray(body.originalImages)
        ? body.originalImages
            .filter((u) => typeof u === 'string' && isSafeMediaOrHttpsUrl(u.trim(), 500) && u.trim())
            .map((u) => u.trim())
            .slice(0, 8)
        : existing.originalImages;
    const nowIso = new Date().toISOString();
    const updated: ItemGroup = {
      ...existing,
      name: nextName,
      description:
        typeof body.description === 'string'
          ? body.description.trim().slice(0, 240)
          : existing.description,
      colorHex: nextColor,
      coverUrl: nextCoverUrl || undefined,
      coverSource: body.coverSource || existing.coverSource,
      originalImages: nextOriginalImages,
      updatedAt: nowIso,
    };
    db.groups![groupId] = updated;
    // Synchronize denormalized groupName on owner's items
    for (const item of Object.values(db.items)) {
      if (item.ownerUid === uid && item.groupId === groupId) {
        item.groupName = nextName;
      }
    }
    saveDatabase();
    res.json({ ok: true, group: updated });
  });

  app.delete('/api/groups/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const groupId = req.params.id;
    const existing = db.groups?.[groupId];
    if (!existing) {
      res.status(404).json({ ok: false, errorCode: 'GROUP_NOT_FOUND' });
      return;
    }
    if (existing.ownerUid !== uid) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_NOT_OWNER' });
      return;
    }
    delete db.groups![groupId];
    for (const item of Object.values(db.items)) {
      if (item.ownerUid === uid && item.groupId === groupId) {
        item.groupId = null;
        item.groupName = null;
      }
    }
    saveDatabase();
    res.json({ ok: true });
  });

  // ---------------------------------------------------------------------------
  // 2B. SHARED QR GROUPS (INDEPENDENT FROM ORGANIZATIONAL GROUPS & INDIVIDUAL QR)
  // ---------------------------------------------------------------------------
  app.get('/api/shared-qr-groups', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const sharedQrGroups = Object.values(db.sharedQrGroups || {})
      .filter((g) => g.ownerUid === uid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ ok: true, sharedQrGroups });
  });

  app.post('/api/shared-qr-groups', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const body = (req.body || {}) as {
      name?: unknown;
      description?: unknown;
      items?: Array<{ itemId: string; isVisible?: boolean }>;
      isActive?: unknown;
      coverUrl?: unknown;
      coverSource?: SharedQrGroup['coverSource'];
      originalImages?: unknown;
    };

    const validation = validateSharedQrGroupInput({
      name: body.name,
      description: body.description,
    });
    if (!validation.valid) {
      res.status(400).json({
        ok: false,
        errorCode: Object.values(validation.errors)[0] || 'INVALID_SHARED_GROUP',
        messageAr: 'يرجى إدخال اسم مجموعة مشترك بين حرفين و ٨٠ حرفًا.',
        messageEn: 'Please provide a shared group name between 2 and 80 characters.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const normalizedItems = normalizeSharedQrGroupItems(rawItems, uid, db.items, nowIso);
    if (!normalizedItems.valid) {
      res.status(403).json({
        ok: false,
        errorCode: 'FORBIDDEN_ITEM_NOT_OWNED',
        messageAr: 'لا يمكن ربط غرض غير مملوك لحسابك داخل مجموعة QR المشتركة.',
        messageEn: 'Cannot link an item that does not belong to your account.',
      });
      return;
    }

    if (!db.sharedQrGroups) db.sharedQrGroups = {};

    // Strict Non-Conflict Check: an item cannot belong to two Shared QR Groups simultaneously
    const allExistingGroups = Object.values(db.sharedQrGroups);
    for (const entry of normalizedItems.items) {
      const conflict = findConflictingSharedGroup(entry.itemId, allExistingGroups);
      if (conflict) {
        const conflictItem = db.items[entry.itemId];
        res.status(409).json({
          ok: false,
          errorCode: 'ITEM_ALREADY_IN_SHARED_GROUP',
          conflictingGroupId: conflict.id,
          conflictingGroupName: conflict.name,
          itemId: entry.itemId,
          messageAr: `الغرض «${conflictItem?.name || entry.itemId}» مرتبط بالفعل بمجموعة QR مشترك أخرى (${conflict.name}). أزله منها أولًا لمنع تعارض أكواد QR.`,
          messageEn: `Item "${conflictItem?.name || entry.itemId}" is already linked to another Shared QR Group (${conflict.name}). Unlink it first to prevent QR conflicts.`,
        });
        return;
      }
    }

    const existingShareCodes = new Set(
      Object.values(db.sharedQrGroups).map((g) => g.shareCode.toUpperCase())
    );
    const shareCode = createUniqueSharedQrCode(existingShareCodes);
    const groupId = `sqrg-${crypto.randomBytes(6).toString('hex')}`;
    const cleanName = String(body.name).trim();
    const cleanDesc = typeof body.description === 'string' ? body.description.trim() : '';
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : true;
    const cleanCoverUrl =
      typeof body.coverUrl === 'string' && isSafeMediaOrHttpsUrl(body.coverUrl.trim(), 500)
        ? body.coverUrl.trim()
        : '';
    const cleanOriginals = Array.isArray(body.originalImages)
      ? body.originalImages
          .filter((u) => typeof u === 'string' && isSafeMediaOrHttpsUrl(u.trim(), 500) && u.trim())
          .map((u) => u.trim())
          .slice(0, 8)
      : [];

    const childItemNames: string[] = [];
    const childItemCategories: ItemCategory[] = [];
    for (const entry of normalizedItems.items) {
      const child = db.items[entry.itemId];
      if (child) {
        childItemNames.push(child.name);
        if (child.category) childItemCategories.push(child.category);
      }
    }
    const autoSharedMatch =
      !cleanCoverUrl && cleanOriginals.length === 0
        ? matchSmartCover({
            entityType: 'shared_group',
            name: cleanName,
            description: cleanDesc,
            childItemNames,
            childCategories: childItemCategories,
          })
        : null;
    const effectiveSharedCover =
      cleanCoverUrl || cleanOriginals[0] || autoSharedMatch?.coverUrl || undefined;
    const effectiveSharedCoverSource =
      body.coverSource ||
      (cleanCoverUrl
        ? 'user_selected'
        : cleanOriginals.length > 0
        ? 'auto_selected'
        : autoSharedMatch?.coverSource);

    const sharedGroup: SharedQrGroup = {
      id: groupId,
      ownerUid: uid,
      name: cleanName,
      description: cleanDesc,
      shareCode,
      isActive,
      items: normalizedItems.items,
      coverUrl: effectiveSharedCover,
      coverSource: effectiveSharedCoverSource,
      originalImages: cleanOriginals.length > 0 ? cleanOriginals : undefined,
      totalScans: 0,
      lastScanAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.sharedQrGroups[groupId] = sharedGroup;

    // Transition linked items to 'shared' mode (temporarily pausing their Individual QR while preserving codeSerial)
    for (const entry of sharedGroup.items) {
      const targetItem = db.items[entry.itemId];
      if (targetItem) {
        targetItem.qrMode = 'shared';
        targetItem.sharedQrGroupId = groupId;
        targetItem.sharedQrGroupName = cleanName;
        targetItem.sharedQrGroupPaused = !isActive;
        targetItem.updatedAt = nowIso;
      }
    }

    recordUserActivity(
      uid,
      'shared_group_created',
      `إنشاء مجموعة QR مشترك: ${cleanName}`,
      `Created Shared QR Group: ${cleanName}`,
      `تم إنشاء مجموعة QR مشترك (${shareCode}) وربط ${sharedGroup.items.length} غرض/أغراض بوضع QR المشترك (مع إيقاف QR الفردي مؤقتًا دون حذف بياناتها).`,
      `Created Shared QR Group (${shareCode}) with ${sharedGroup.items.length} item(s) switched to Shared QR mode (individual QRs paused safely without deletion).`
    );

    saveDatabase();
    res.status(201).json({ ok: true, sharedQrGroup: sharedGroup });
  });

  app.patch('/api/shared-qr-groups/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const groupId = req.params.id;
    const existing = db.sharedQrGroups?.[groupId];

    if (!existing) {
      res.status(404).json({ ok: false, errorCode: 'SHARED_GROUP_NOT_FOUND' });
      return;
    }
    if (existing.ownerUid !== uid) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_NOT_OWNER' });
      return;
    }

    const body = (req.body || {}) as {
      name?: unknown;
      description?: unknown;
      isActive?: unknown;
      items?: Array<{ itemId: string; isVisible?: boolean; addedAt?: string }>;
      coverUrl?: unknown;
      coverSource?: SharedQrGroup['coverSource'];
      originalImages?: unknown;
    };

    const nextName =
      typeof body.name === 'string' ? body.name.trim() : existing.name;
    const nextDescription =
      typeof body.description === 'string' ? body.description.trim() : existing.description || '';

    const validation = validateSharedQrGroupInput({
      name: nextName,
      description: nextDescription,
    });
    if (!validation.valid) {
      res.status(400).json({
        ok: false,
        errorCode: Object.values(validation.errors)[0] || 'INVALID_SHARED_GROUP',
        messageAr: 'يرجى إدخال اسم مجموعة مشترك بين حرفين و ٨٠ حرفًا.',
        messageEn: 'Please provide a shared group name between 2 and 80 characters.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const nextIsActive = typeof body.isActive === 'boolean' ? body.isActive : existing.isActive;
    let nextItems = existing.items;
    if (Array.isArray(body.items)) {
      const existingAddedAt = new Map(existing.items.map((e) => [e.itemId, e.addedAt]));
      const mergedRaw = body.items.map((entry) => ({
        ...entry,
        addedAt: existingAddedAt.get(entry.itemId) || entry.addedAt || nowIso,
      }));
      const normalized = normalizeSharedQrGroupItems(mergedRaw, uid, db.items, nowIso);
      if (!normalized.valid) {
        res.status(403).json({
          ok: false,
          errorCode: 'FORBIDDEN_ITEM_NOT_OWNED',
          messageAr: 'لا يمكن ربط غرض غير مملوك لحسابك.',
          messageEn: 'Cannot link an item that does not belong to your account.',
        });
        return;
      }
      // Strict Non-Conflict Check
      const allGroups = Object.values(db.sharedQrGroups || {});
      for (const entry of normalized.items) {
        const conflict = findConflictingSharedGroup(entry.itemId, allGroups, groupId);
        if (conflict) {
          const conflictItem = db.items[entry.itemId];
          res.status(409).json({
            ok: false,
            errorCode: 'ITEM_ALREADY_IN_SHARED_GROUP',
            conflictingGroupId: conflict.id,
            conflictingGroupName: conflict.name,
            itemId: entry.itemId,
            messageAr: `الغرض «${conflictItem?.name || entry.itemId}» مرتبط بالفعل بمجموعة QR مشترك أخرى (${conflict.name}).`,
            messageEn: `Item "${conflictItem?.name || entry.itemId}" is already linked to another Shared QR Group (${conflict.name}).`,
          });
          return;
        }
      }
      nextItems = normalized.items;
    }

    const prevItemIds = new Set(existing.items.map((e) => e.itemId));
    const nextItemIds = new Set(nextItems.map((e) => e.itemId));

    // Items removed during update return cleanly to 'individual' mode keeping their original codeSerial
    for (const removedId of prevItemIds) {
      if (!nextItemIds.has(removedId)) {
        const removedItem = db.items[removedId];
        if (removedItem && removedItem.sharedQrGroupId === groupId) {
          removedItem.qrMode = 'individual';
          removedItem.sharedQrGroupId = null;
          removedItem.sharedQrGroupName = null;
          removedItem.sharedQrGroupPaused = false;
          removedItem.updatedAt = nowIso;
        }
      }
    }

    // Items remaining/added stay in 'shared' mode; pausing a group NEVER silently reactivates individual QR
    for (const entry of nextItems) {
      const targetItem = db.items[entry.itemId];
      if (targetItem) {
        targetItem.qrMode = 'shared';
        targetItem.sharedQrGroupId = groupId;
        targetItem.sharedQrGroupName = nextName;
        targetItem.sharedQrGroupPaused = !nextIsActive;
        targetItem.updatedAt = nowIso;
      }
    }

    const nextCoverUrl =
      body.coverUrl !== undefined
        ? typeof body.coverUrl === 'string' && isSafeMediaOrHttpsUrl(body.coverUrl.trim(), 500)
          ? body.coverUrl.trim()
          : existing.coverUrl
        : existing.coverUrl;
    const nextOriginalImages =
      Array.isArray(body.originalImages)
        ? body.originalImages
            .filter((u) => typeof u === 'string' && isSafeMediaOrHttpsUrl(u.trim(), 500) && u.trim())
            .map((u) => u.trim())
            .slice(0, 8)
        : existing.originalImages;

    // Never allow client to mutate shareCode, ownerUid, or id
    const updated: SharedQrGroup = {
      ...existing,
      name: nextName,
      description: nextDescription,
      isActive: nextIsActive,
      items: nextItems,
      coverUrl: nextCoverUrl || undefined,
      coverSource: body.coverSource || existing.coverSource,
      originalImages: nextOriginalImages,
      updatedAt: nowIso,
    };

    db.sharedQrGroups![groupId] = updated;

    recordUserActivity(
      uid,
      'shared_group_updated',
      `تحديث مجموعة QR المشترك: ${updated.name}`,
      `Updated Shared QR Group: ${updated.name}`,
      !nextIsActive && existing.isActive
        ? `تم إيقاف مجموعة QR المشترك (${updated.shareCode}) مؤقتًا. تبقى الأغراض المرتبطة موقوفة مؤقتًا دون تفعيل تلقائي لـ QR الفردي حتى يختار المالك.`
        : `تم تحديث إعدادات المجموعة المشتركة (${updated.shareCode}) مع الحفاظ على نفس كود QR المشترك.`,
      !nextIsActive && existing.isActive
        ? `Paused Shared QR Group (${updated.shareCode}). Linked items remain paused without auto-reactivating individual QRs until the owner chooses.`
        : `Updated shared QR group (${updated.shareCode}) while preserving the same shared QR code.`
    );

    saveDatabase();
    res.json({ ok: true, sharedQrGroup: updated });
  });

  app.post('/api/shared-qr-groups/:id/items', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const groupId = req.params.id;
    const existing = db.sharedQrGroups?.[groupId];

    if (!existing) {
      res.status(404).json({ ok: false, errorCode: 'SHARED_GROUP_NOT_FOUND' });
      return;
    }
    if (existing.ownerUid !== uid) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_NOT_OWNER' });
      return;
    }

    const body = (req.body || {}) as { itemId?: unknown; isVisible?: unknown };
    const itemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';
    const item = db.items[itemId];
    if (!item || item.ownerUid !== uid) {
      res.status(403).json({
        ok: false,
        errorCode: 'FORBIDDEN_ITEM_NOT_OWNED',
        messageAr: 'الغرض غير موجود أو غير مملوك لحسابك.',
        messageEn: 'Item not found or does not belong to your account.',
      });
      return;
    }

    // Atomic Non-Conflict Check (synchronous read-check-write)
    const conflict = findConflictingSharedGroup(
      itemId,
      Object.values(db.sharedQrGroups || {}),
      groupId
    );
    if (conflict) {
      res.status(409).json({
        ok: false,
        errorCode: 'ITEM_ALREADY_IN_SHARED_GROUP',
        conflictingGroupId: conflict.id,
        conflictingGroupName: conflict.name,
        messageAr: `هذا الغرض مرتبط بالفعل بمجموعة QR مشترك أخرى (${conflict.name}). أزله منها أولًا قبل إضافته هنا.`,
        messageEn: `This item is already linked to another Shared QR Group (${conflict.name}). Unlink it first before adding it here.`,
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const isVisible = typeof body.isVisible === 'boolean' ? body.isVisible : true;
    const existingEntry = existing.items.find((e) => e.itemId === itemId);

    const nextItems = existingEntry
      ? existing.items.map((e) => (e.itemId === itemId ? { ...e, isVisible } : e))
      : [...existing.items, { itemId, isVisible, addedAt: nowIso }];

    const updated: SharedQrGroup = {
      ...existing,
      items: nextItems,
      updatedAt: nowIso,
    };

    db.sharedQrGroups![groupId] = updated;

    // Switch item to 'shared' mode (individual QR temporarily paused, original codeSerial preserved)
    item.qrMode = 'shared';
    item.sharedQrGroupId = groupId;
    item.sharedQrGroupName = existing.name;
    item.sharedQrGroupPaused = !existing.isActive;
    item.updatedAt = nowIso;

    saveDatabase();
    res.status(existingEntry ? 200 : 201).json({ ok: true, sharedQrGroup: updated, item });
  });

  app.patch('/api/shared-qr-groups/:id/items/:itemId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const { id: groupId, itemId } = req.params;
    const existing = db.sharedQrGroups?.[groupId];

    if (!existing) {
      res.status(404).json({ ok: false, errorCode: 'SHARED_GROUP_NOT_FOUND' });
      return;
    }
    if (existing.ownerUid !== uid) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_NOT_OWNER' });
      return;
    }

    const entry = existing.items.find((e) => e.itemId === itemId);
    if (!entry) {
      res.status(404).json({ ok: false, errorCode: 'ITEM_NOT_IN_SHARED_GROUP' });
      return;
    }

    const body = (req.body || {}) as { isVisible?: unknown };
    if (typeof body.isVisible !== 'boolean') {
      res.status(400).json({ ok: false, errorCode: 'INVALID_VISIBILITY_VALUE' });
      return;
    }

    const nowIso = new Date().toISOString();
    const updated: SharedQrGroup = {
      ...existing,
      items: existing.items.map((e) =>
        e.itemId === itemId ? { ...e, isVisible: body.isVisible as boolean } : e
      ),
      updatedAt: nowIso,
    };

    db.sharedQrGroups![groupId] = updated;
    saveDatabase();
    res.json({ ok: true, sharedQrGroup: updated });
  });

  app.delete('/api/shared-qr-groups/:id/items/:itemId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const { id: groupId, itemId } = req.params;
    const existing = db.sharedQrGroups?.[groupId];

    if (!existing) {
      res.status(404).json({ ok: false, errorCode: 'SHARED_GROUP_NOT_FOUND' });
      return;
    }
    if (existing.ownerUid !== uid) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_NOT_OWNER' });
      return;
    }

    // Removing from Shared QR Group NEVER deletes the item or its original codeSerial;
    // returns it cleanly to Individual QR mode (reactivating its original codeSerial) unless restoreIndividual=false.
    const restoreIndividual = req.query.restoreIndividual !== 'false';
    const nowIso = new Date().toISOString();
    const updated: SharedQrGroup = {
      ...existing,
      items: existing.items.filter((e) => e.itemId !== itemId),
      updatedAt: nowIso,
    };

    db.sharedQrGroups![groupId] = updated;

    const item = db.items[itemId];
    if (item && item.ownerUid === uid) {
      item.qrMode = restoreIndividual ? 'individual' : 'unassigned';
      item.sharedQrGroupId = null;
      item.sharedQrGroupName = null;
      item.sharedQrGroupPaused = false;
      item.updatedAt = nowIso;
      recordUserActivity(
        uid,
        'item_qr_mode_changed',
        restoreIndividual
          ? `فك ربط الغرض وإعادة تفعيل QR الفردي: ${item.name}`
          : `فك ربط الغرض من المجموعة المشتركة: ${item.name}`,
        restoreIndividual
          ? `Unlinked & Restored Individual QR: ${item.name}`
          : `Unlinked from Shared Group: ${item.name}`,
        restoreIndividual
          ? `تمت إزالة الغرض من المجموعة المشتركة وإعادة تفعيل كود QR الفردي الأصلي (${item.codeSerial}) دون أي تغيير على الكود.`
          : `تمت إزالة الغرض من المجموعة المشتركة بانتظار قرارك لإعادة تفعيل QR الفردي (${item.codeSerial}).`,
        restoreIndividual
          ? `Removed item from Shared QR Group and reactivated its original individual QR (${item.codeSerial}).`
          : `Removed item from Shared QR Group awaiting your confirmation to restore individual QR (${item.codeSerial}).`,
        item.id
      );
    }

    saveDatabase();
    res.json({ ok: true, sharedQrGroup: updated, item: item || null });
  });

  app.delete('/api/shared-qr-groups/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const groupId = req.params.id;
    const existing = db.sharedQrGroups?.[groupId];

    if (!existing) {
      res.status(404).json({ ok: false, errorCode: 'SHARED_GROUP_NOT_FOUND' });
      return;
    }
    if (existing.ownerUid !== uid) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_NOT_OWNER' });
      return;
    }

    const restoreIndividual = req.query.restoreIndividual === 'true';
    const deletedName = existing.name;
    const deletedShareCode = existing.shareCode;
    const nowIso = new Date().toISOString();
    const affectedItemIds: string[] = [];

    // Deleting a Shared QR Group NEVER deletes items or their original codeSerials.
    // Affected items transition to 'unassigned' (or 'individual' if user explicitly chose restoreIndividual=true)
    // so no item is ever left in a broken or ambiguous state.
    for (const entry of existing.items || []) {
      const targetItem = db.items[entry.itemId];
      if (targetItem && targetItem.ownerUid === uid) {
        targetItem.qrMode = restoreIndividual ? 'individual' : 'unassigned';
        targetItem.sharedQrGroupId = null;
        targetItem.sharedQrGroupName = null;
        targetItem.sharedQrGroupPaused = false;
        targetItem.updatedAt = nowIso;
        affectedItemIds.push(targetItem.id);
      }
    }

    delete db.sharedQrGroups![groupId];

    recordUserActivity(
      uid,
      'shared_group_deleted',
      `حذف مجموعة QR المشترك: ${deletedName}`,
      `Deleted Shared QR Group: ${deletedName}`,
      restoreIndividual
        ? `تم حذف مجموعة QR المشترك (${deletedShareCode}) وإعادة تفعيل أكواد QR الفردية الأصلية لـ ${affectedItemIds.length} غرض/أغراض.`
        : `تم حذف مجموعة QR المشترك (${deletedShareCode}) فقط؛ جميع الأغراض (${affectedItemIds.length}) محفوظة وسليمة وبانتظار اختيارك لإعادة تفعيل QR الفردي لها.`,
      restoreIndividual
        ? `Deleted Shared QR Group (${deletedShareCode}) and restored original individual QRs for ${affectedItemIds.length} item(s).`
        : `Deleted Shared QR Group (${deletedShareCode}) only; all ${affectedItemIds.length} item(s) remain intact awaiting your choice to restore individual QRs.`
    );

    saveDatabase();
    res.json({ ok: true, affectedItemIds, restoredIndividual: restoreIndividual });
  });

  // Explicit owner action: Return an item from Shared (paused or active) or Unassigned state back to Individual QR mode
  app.post('/api/items/:id/restore-individual-qr', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const itemId = req.params.id;
    const item = db.items[itemId];

    if (!item) {
      res.status(404).json({ ok: false, errorCode: 'ITEM_NOT_FOUND' });
      return;
    }
    if (item.ownerUid !== uid) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_NOT_OWNER' });
      return;
    }

    const nowIso = new Date().toISOString();
    // Unlink from any holding Shared QR Group so dual-active conflict can NEVER occur
    for (const grp of Object.values(db.sharedQrGroups || {})) {
      if (grp.ownerUid === uid && grp.items.some((e) => e.itemId === itemId)) {
        grp.items = grp.items.filter((e) => e.itemId !== itemId);
        grp.updatedAt = nowIso;
      }
    }

    item.qrMode = 'individual';
    item.sharedQrGroupId = null;
    item.sharedQrGroupName = null;
    item.sharedQrGroupPaused = false;
    item.updatedAt = nowIso;

    recordUserActivity(
      uid,
      'item_qr_mode_changed',
      `إعادة تفعيل QR الفردي: ${item.name}`,
      `Restored Individual QR: ${item.name}`,
      `تمت إعادة تفعيل كود QR الفردي الأصلي (${item.codeSerial}) دون إنشاء كود جديد أو فقدان السجل.`,
      `Reactivated original individual QR code (${item.codeSerial}) without creating a new code or losing history.`,
      item.id
    );

    saveDatabase();
    res.json({
      ok: true,
      item: decorateItemQrModeMetadata(item, db.sharedQrGroups || {}),
      messageAr: `تمت إعادة تفعيل كود QR الفردي الأصلي (${item.codeSerial}) بنجاح.`,
      messageEn: `Original individual QR code (${item.codeSerial}) has been reactivated.`,
    });
  });

  // ---------------------------------------------------------------------------
  // 3. ITEMS MANAGEMENT & STRICT QUOTA ENFORCEMENT ENDPOINTS
  // ---------------------------------------------------------------------------
  app.get('/api/items/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const item = db.items[req.params.id];
    if (!item) {
      res.status(404).json({
        ok: false,
        errorCode: 'ITEM_NOT_FOUND',
        messageAr: 'الغرض المطلوب غير موجود.',
        messageEn: 'Requested item not found.',
      });
      return;
    }
    if (item.ownerUid !== req.user!.uid) {
      res.status(403).json({
        ok: false,
        errorCode: 'FORBIDDEN_NOT_OWNER',
        messageAr: 'غير مصرح لك بالوصول إلى غرض يخص مستخدمًا آخر.',
        messageEn: 'Access denied: You do not own this item.',
      });
      return;
    }
    res.json({ ok: true, item });
  });

  app.post('/api/items', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userRec = req.user!;
    const uid = userRec.uid;
    const draft = (req.body || {}) as NewItemDraft;

    const currentActive = recomputeUserActiveCount(uid);
    const activeLimit = userRec.profile.activeItemsLimit;
    const contactLimit = userRec.profile.contactMethodsLimit || 2;

    if (!canAddOrReactivateItem(currentActive, activeLimit)) {
      res.status(403).json({
        ok: false,
        errorCode: 'QUOTA_LIMIT_REACHED',
        messageAr:
          'لقد وصلت إلى الحد الأقصى للباقة المجانية (غرضان نشطان فقط). يرجى أرشفة أحد أغراضك النشطة لإضافة غرض جديد.',
        messageEn:
          'Free Plan limit reached (maximum 2 active items). Archive an existing active item to add a new one.',
      });
      return;
    }

    const validation = validateItemDraft(draft, {
      activeItemsCount: currentActive,
      activeItemsLimit: activeLimit,
      contactMethodsLimit: contactLimit,
    });

    if (!validation.valid) {
      const firstErrKey = Object.values(validation.errors)[0] || 'VALIDATION_FAILED';
      res.status(400).json({
        ok: false,
        errorCode: firstErrKey,
        errors: validation.errors,
        messageAr:
          firstErrKey === 'CONTACT_LIMIT_EXCEEDED'
            ? `تسمح باقتك الحالية (${userRec.profile.plan}) بتفعيل ${contactLimit} وسائل تواصل كحد أقصى.`
            : firstErrKey === 'INVALID_IMAGE_URL'
            ? 'يرجى إدخال رابط صورة صحيح يبدأ بـ https:// أو تركه فارغًا.'
            : 'يرجى التحقق من صحة الحقول المطلوبة.',
        messageEn:
          firstErrKey === 'CONTACT_LIMIT_EXCEEDED'
            ? `Your current plan (${userRec.profile.plan}) allows up to ${contactLimit} direct contact methods.`
            : firstErrKey === 'INVALID_IMAGE_URL'
            ? 'Please enter a valid https:// image URL or leave it blank.'
            : 'Please check the required item fields.',
      });
      return;
    }

    const resolvedDesignId =
      typeof draft.designId === 'string' && draft.designId.trim()
        ? draft.designId.trim()
        : 'master-04-heritage-compass';

    const templateAccess = verifyTemplateAccessForUser(resolvedDesignId, userRec);
    if (!templateAccess.allowed) {
      res.status(403).json({
        ok: false,
        errorCode: 'TEMPLATE_ACCESS_DENIED',
        messageAr: `القالب المختار (${templateAccess.templateTitleAr || resolvedDesignId}) مدفوع ولا يتبع باقتك الحالية. يرجى اختيار قالب مجاني أو شراء القالب/ترقية الباقة أولًا.`,
        messageEn: `The selected template (${templateAccess.templateTitleEn || resolvedDesignId}) requires a purchase or plan upgrade. Please pick a free template or unlock it first.`,
      });
      return;
    }

    let resolvedGroupId: string | null = null;
    let resolvedGroupName: string | null = null;
    if (typeof draft.groupId === 'string' && draft.groupId.trim()) {
      const candidateGroup = db.groups?.[draft.groupId.trim()];
      if (!candidateGroup) {
        res.status(404).json({
          ok: false,
          errorCode: 'GROUP_NOT_FOUND',
          messageAr: 'المجموعة المختارة غير موجودة.',
          messageEn: 'Selected item group was not found.',
        });
        return;
      }
      if (candidateGroup.ownerUid !== uid) {
        res.status(403).json({
          ok: false,
          errorCode: 'FORBIDDEN_GROUP',
          messageAr: 'غير مصرح لك بربط الغرض بمجموعة تخص مستخدمًا آخر.',
          messageEn: 'Access denied: Cannot assign item to another user’s group.',
        });
        return;
      }
      resolvedGroupId = candidateGroup.id;
      resolvedGroupName = candidateGroup.name;
    }

    const itemId = `item-${crypto.randomBytes(6).toString('hex')}`;
    const codeSerial = generateUniqueSerialCode();
    const nowIso = new Date().toISOString();
    const name = draft.name.trim();
    const desc = typeof draft.description === 'string' ? draft.description.trim() : '';
    const instructions = draft.finderNote.trim();
    const city = (typeof draft.city === 'string' && draft.city.trim()) || 'الرياض';
    const privacySettings = sanitizePrivacyPatch(
      DEFAULT_ITEM_PRIVACY_SETTINGS,
      draft.privacySettings
    );

    const cleanOriginalImages = Array.isArray(draft.originalImages)
      ? draft.originalImages
          .filter((u) => typeof u === 'string' && isSafeMediaOrHttpsUrl(u.trim(), 500) && u.trim())
          .map((u) => u.trim())
          .slice(0, 8)
      : [];
    const cleanCoverUrl =
      typeof draft.coverUrl === 'string' && isSafeMediaOrHttpsUrl(draft.coverUrl.trim(), 500)
        ? draft.coverUrl.trim()
        : '';
    const cleanImageUrl =
      typeof draft.imageUrl === 'string' && isSafeMediaOrHttpsUrl(draft.imageUrl.trim(), 500)
        ? draft.imageUrl.trim()
        : '';
    const autoItemMatch =
      !cleanCoverUrl && !cleanImageUrl && cleanOriginalImages.length === 0
        ? matchSmartCover({
            entityType: 'item',
            name,
            category: draft.category,
            description: desc,
          })
        : null;
    const effectiveDisplayImg =
      cleanCoverUrl || cleanImageUrl || cleanOriginalImages[0] || autoItemMatch?.coverUrl || '';
    const effectiveItemCoverSource =
      draft.coverSource ||
      (cleanCoverUrl || cleanImageUrl
        ? 'user_selected'
        : cleanOriginalImages.length > 0
        ? 'auto_selected'
        : autoItemMatch?.coverSource);
    const cleanSelectedMethodIds = Array.isArray(draft.selectedContactMethodIds)
      ? Array.from(
          new Set(draft.selectedContactMethodIds.filter((id) => typeof id === 'string' && id.trim()))
        ).slice(0, contactLimit)
      : [];

    const newItem: RegisteredItem = {
      id: itemId,
      ownerUid: uid,
      qrId: `qr-${itemId}`,
      codeSerial,
      name,
      nameAr: name,
      nameEn: name,
      category: draft.category,
      groupId: resolvedGroupId,
      groupName: resolvedGroupName,
      imageUrl: effectiveDisplayImg,
      coverUrl: effectiveDisplayImg || undefined,
      coverSource: effectiveItemCoverSource,
      originalImages: cleanOriginalImages.length > 0 ? cleanOriginalImages : undefined,
      selectedContactMethodIds:
        cleanSelectedMethodIds.length > 0 ? cleanSelectedMethodIds : undefined,
      status: 'Active',
      description: desc,
      descriptionAr: desc,
      descriptionEn: desc,
      recoveryInstructions: instructions,
      finderNoteAr: instructions,
      finderNoteEn: instructions,
      rewardOffered: Boolean(draft.rewardOffered),
      rewardAmountTextAr:
        typeof draft.rewardAmountText === 'string' ? draft.rewardAmountText.trim() : '',
      rewardAmountTextEn:
        typeof draft.rewardAmountText === 'string' ? draft.rewardAmountText.trim() : '',
      city,
      cityAr: city,
      cityEn: city,
      totalScans: 0,
      lastScanAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      designId: resolvedDesignId,
      contactChannels: {
        showPhone: Boolean(draft.showPhone),
        showWhatsapp: Boolean(draft.showWhatsapp),
        showEmail: Boolean(draft.showEmail),
        showTelegram: Boolean(draft.showTelegram),
        anonymousRelayOnly: Boolean(draft.anonymousRelayOnly),
        customPhone: typeof draft.customPhone === 'string' ? draft.customPhone.trim() : '',
        customWhatsapp:
          typeof draft.customWhatsapp === 'string' ? draft.customWhatsapp.trim() : '',
        customEmail: typeof draft.customEmail === 'string' ? draft.customEmail.trim() : '',
        customTelegram:
          typeof draft.customTelegram === 'string' ? draft.customTelegram.trim() : '',
        selectedMethodIds:
          cleanSelectedMethodIds.length > 0 ? cleanSelectedMethodIds : undefined,
      },
      privacySettings,
      qrMode: 'individual',
      sharedQrGroupId: null,
      sharedQrGroupName: null,
      sharedQrGroupPaused: false,
    };

    db.items[itemId] = newItem;
    if (db.templates?.[resolvedDesignId]) {
      db.templates[resolvedDesignId].usageCount =
        (db.templates[resolvedDesignId].usageCount || 0) + 1;
    }
    recomputeUserActiveCount(uid);
    userRec.profile.lastQuotaItemId = itemId;
    userRec.profile.updatedAt = nowIso;

    recordUserActivity(
      uid,
      'item_created',
      `إضافة غرض جديد: ${name}`,
      `Added New Item: ${name}`,
      `تم تسجيل الغرض بالكود الفريد (${codeSerial}). الأغراض النشطة: ${userRec.profile.activeItemsCount}/${userRec.profile.activeItemsLimit}.`,
      `Registered item with unique code (${codeSerial}). Active quota: ${userRec.profile.activeItemsCount}/${userRec.profile.activeItemsLimit}.`,
      itemId
    );

    saveDatabase();

    res.status(201).json({
      ok: true,
      item: newItem,
      profile: decorateProfileAuthority(userRec),
    });
  });

  app.patch('/api/items/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userRec = req.user!;
    const uid = userRec.uid;
    const itemId = req.params.id;
    const existing = db.items[itemId];

    if (!existing) {
      res.status(404).json({
        ok: false,
        errorCode: 'ITEM_NOT_FOUND',
        messageAr: 'الغرض المطلوب غير موجود.',
        messageEn: 'Requested item not found.',
      });
      return;
    }

    if (existing.ownerUid !== uid) {
      res.status(403).json({
        ok: false,
        errorCode: 'FORBIDDEN_NOT_OWNER',
        messageAr: 'غير مصرح لك بتعديل غرض يخص مستخدمًا آخر.',
        messageEn: 'Access denied: You cannot modify another user’s item.',
      });
      return;
    }

    const updates = (req.body || {}) as Partial<{
      name: string;
      description: string;
      category: ItemCategory;
      groupId: string | null;
      imageUrl: string;
      coverUrl: string;
      coverSource: RegisteredItem['coverSource'];
      originalImages: string[];
      selectedContactMethodIds: string[];
      status: ItemStatus;
      recoveryInstructions: string;
      city: string;
      designId: string;
      contactChannels: RegisteredItem['contactChannels'];
      privacySettings: Partial<ItemPrivacySettings>;
    }>;

    const maxMethods = userRec.profile.contactMethodsLimit || 2;
    const check = validateItemUpdate(updates, maxMethods);
    if (!check.valid) {
      const firstErr = Object.values(check.errors)[0] || 'VALIDATION_FAILED';
      const statusCode = 400;
      res.status(statusCode).json({
        ok: false,
        errorCode: firstErr,
        errors: check.errors,
        messageAr:
          firstErr === 'CONTACT_LIMIT_EXCEEDED'
            ? `تسمح باقتك الحالية (${userRec.profile.plan}) بتفعيل ${maxMethods} وسائل تواصل كحد أقصى.`
            : firstErr === 'INVALID_IMAGE_URL'
            ? 'يرجى إدخال رابط صورة صحيح يبدأ بـ https:// أو تركه فارغًا.'
            : 'يرجى التحقق من صحة البيانات المدخلة.',
        messageEn:
          firstErr === 'CONTACT_LIMIT_EXCEEDED'
            ? `Your current plan (${userRec.profile.plan}) allows up to ${maxMethods} direct contact methods.`
            : firstErr === 'INVALID_IMAGE_URL'
            ? 'Please enter a valid https:// image URL or leave it blank.'
            : 'Please verify the updated item fields.',
      });
      return;
    }

    const nextDesignId =
      updates.designId !== undefined && updates.designId.trim()
        ? updates.designId.trim()
        : existing.designId;

    if (nextDesignId !== existing.designId) {
      const templateAccess = verifyTemplateAccessForUser(nextDesignId, userRec);
      if (!templateAccess.allowed) {
        res.status(403).json({
          ok: false,
          errorCode: 'TEMPLATE_ACCESS_DENIED',
          messageAr: `القالب المختار (${templateAccess.templateTitleAr || nextDesignId}) مدفوع وغير متاح لباقتك الحالية. يرجى اختيار قالب مجاني أو ترقية الباقة/شراء القالب.`,
          messageEn: `The selected template (${templateAccess.templateTitleEn || nextDesignId}) is locked for your current plan. Choose a free template or purchase/upgrade first.`,
        });
        return;
      }
    }

    let nextGroupId: string | null = existing.groupId ?? null;
    let nextGroupName: string | null = existing.groupName ?? null;
    if (updates.groupId !== undefined) {
      if (!updates.groupId || !updates.groupId.trim()) {
        nextGroupId = null;
        nextGroupName = null;
      } else {
        const candidateGroup = db.groups?.[updates.groupId.trim()];
        if (!candidateGroup) {
          res.status(404).json({
            ok: false,
            errorCode: 'GROUP_NOT_FOUND',
            messageAr: 'المجموعة المختارة غير موجودة.',
            messageEn: 'Selected item group was not found.',
          });
          return;
        }
        if (candidateGroup.ownerUid !== uid) {
          res.status(403).json({
            ok: false,
            errorCode: 'FORBIDDEN_GROUP',
            messageAr: 'غير مصرح لك باستخدام مجموعة مستخدم آخر.',
            messageEn: 'Access denied: You do not own the selected group.',
          });
          return;
        }
        nextGroupId = candidateGroup.id;
        nextGroupName = candidateGroup.name;
      }
    }

    const targetStatus: ItemStatus = updates.status || existing.status;

    // Prevent bypassing the active-item quota when unarchiving via PATCH
    if (existing.status === 'Archived' && targetStatus !== 'Archived') {
      const currentActive = recomputeUserActiveCount(uid);
      if (!canAddOrReactivateItem(currentActive, userRec.profile.activeItemsLimit)) {
        res.status(403).json({
          ok: false,
          errorCode: 'QUOTA_LIMIT_REACHED',
          messageAr:
            'لا يمكن إعادة تفعيل هذا الغرض لأنك وصلت إلى الحد الأقصى للباقة المجانية (غرضان نشطان).',
          messageEn:
            'Cannot reactivate this item because you have reached the Free Plan limit (2 active items).',
        });
        return;
      }
    }

    const nextSelectedMethodIds = Array.isArray(updates.selectedContactMethodIds)
      ? Array.from(
          new Set(updates.selectedContactMethodIds.filter((id) => typeof id === 'string' && id.trim()))
        ).slice(0, maxMethods)
      : Array.isArray(updates.contactChannels?.selectedMethodIds)
      ? Array.from(
          new Set(updates.contactChannels.selectedMethodIds.filter((id) => typeof id === 'string' && id.trim()))
        ).slice(0, maxMethods)
      : existing.selectedContactMethodIds;

    const sanitizedChannels: RegisteredItem['contactChannels'] = updates.contactChannels
      ? {
          showPhone: Boolean(updates.contactChannels.showPhone),
          showWhatsapp: Boolean(updates.contactChannels.showWhatsapp),
          showEmail: Boolean(updates.contactChannels.showEmail),
          showTelegram: Boolean(updates.contactChannels.showTelegram),
          anonymousRelayOnly: Boolean(updates.contactChannels.anonymousRelayOnly),
          customPhone:
            typeof updates.contactChannels.customPhone === 'string'
              ? updates.contactChannels.customPhone.trim()
              : existing.contactChannels.customPhone,
          customWhatsapp:
            typeof updates.contactChannels.customWhatsapp === 'string'
              ? updates.contactChannels.customWhatsapp.trim()
              : existing.contactChannels.customWhatsapp,
          customEmail:
            typeof updates.contactChannels.customEmail === 'string'
              ? updates.contactChannels.customEmail.trim()
              : existing.contactChannels.customEmail,
          customTelegram:
            typeof updates.contactChannels.customTelegram === 'string'
              ? updates.contactChannels.customTelegram.trim()
              : existing.contactChannels.customTelegram,
          selectedMethodIds: nextSelectedMethodIds,
        }
      : {
          ...existing.contactChannels,
          selectedMethodIds: nextSelectedMethodIds,
        };

    const enabledMethods = countEnabledContactMethods({
      ...sanitizedChannels,
      selectedContactMethodIds: nextSelectedMethodIds,
    });
    if (enabledMethods > maxMethods) {
      res.status(400).json({
        ok: false,
        errorCode: 'CONTACT_LIMIT_EXCEEDED',
        messageAr: `تسمح باقتك الحالية (${userRec.profile.plan}) بتفعيل ${maxMethods} وسائل تواصل كحد أقصى.`,
        messageEn: `Your current plan (${userRec.profile.plan}) allows up to ${maxMethods} direct contact methods.`,
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const nextName =
      updates.name !== undefined ? updates.name.trim() : existing.name;
    const nextDesc =
      updates.description !== undefined ? updates.description.trim() : existing.description;
    const nextInst =
      updates.recoveryInstructions !== undefined
        ? updates.recoveryInstructions.trim()
        : existing.recoveryInstructions;
    const nextCity = updates.city !== undefined ? updates.city.trim() : existing.city;
    const nextPrivacy = sanitizePrivacyPatch(
      resolveItemPrivacySettings(existing),
      updates.privacySettings
    );

    const nextOriginalImages = Array.isArray(updates.originalImages)
      ? updates.originalImages
          .filter((u) => typeof u === 'string' && isSafeMediaOrHttpsUrl(u.trim(), 500) && u.trim())
          .map((u) => u.trim())
          .slice(0, 8)
      : existing.originalImages;
    const nextCoverUrl =
      updates.coverUrl !== undefined
        ? typeof updates.coverUrl === 'string' && isSafeMediaOrHttpsUrl(updates.coverUrl.trim(), 500)
          ? updates.coverUrl.trim()
          : existing.coverUrl
        : updates.imageUrl !== undefined
        ? updates.imageUrl.trim()
        : existing.coverUrl;
    const nextDisplayImage =
      nextCoverUrl || (updates.imageUrl !== undefined ? updates.imageUrl.trim() : existing.imageUrl);

    // Note: id, ownerUid, qrId, and codeSerial are strictly immutable!
    const updatedItem: RegisteredItem = {
      ...existing,
      id: existing.id,
      ownerUid: existing.ownerUid,
      qrId: existing.qrId,
      codeSerial: existing.codeSerial,
      name: nextName,
      nameAr: nextName,
      nameEn: nextName,
      category: updates.category || existing.category,
      groupId: nextGroupId,
      groupName: nextGroupName,
      imageUrl: nextDisplayImage,
      coverUrl: nextCoverUrl || undefined,
      coverSource: updates.coverSource || existing.coverSource,
      originalImages: nextOriginalImages,
      selectedContactMethodIds: nextSelectedMethodIds,
      status: targetStatus,
      description: nextDesc,
      descriptionAr: nextDesc,
      descriptionEn: nextDesc,
      recoveryInstructions: nextInst,
      finderNoteAr: nextInst,
      finderNoteEn: nextInst,
      city: nextCity,
      cityAr: nextCity,
      cityEn: nextCity,
      designId: nextDesignId,
      contactChannels: sanitizedChannels,
      privacySettings: nextPrivacy,
      updatedAt: nowIso,
    };

    db.items[itemId] = updatedItem;
    if (nextDesignId !== existing.designId && db.templates?.[nextDesignId]) {
      db.templates[nextDesignId].usageCount =
        (db.templates[nextDesignId].usageCount || 0) + 1;
    }
    recomputeUserActiveCount(uid);
    userRec.profile.updatedAt = nowIso;

    recordUserActivity(
      uid,
      existing.status !== targetStatus && targetStatus === 'Archived'
        ? 'item_archived'
        : 'item_updated',
      `تحديث بيانات الغرض: ${nextName}`,
      `Updated Item: ${nextName}`,
      `تم تحديث الغرض (${existing.codeSerial}) — الحالة الحالية: ${targetStatus} مع بقاء رابط QR ثابتًا.`,
      `Updated item (${existing.codeSerial}) — current status: ${targetStatus} with immutable QR link.`,
      itemId
    );

    saveDatabase();

    res.json({
      ok: true,
      item: updatedItem,
      profile: decorateProfileAuthority(userRec),
    });
  });

  app.post('/api/items/:id/archive', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userRec = req.user!;
    const uid = userRec.uid;
    const itemId = req.params.id;
    const existing = db.items[itemId];

    if (!existing) {
      res.status(404).json({ ok: false, errorCode: 'ITEM_NOT_FOUND' });
      return;
    }
    if (existing.ownerUid !== uid) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_NOT_OWNER' });
      return;
    }

    const nowIso = new Date().toISOString();
    existing.status = 'Archived';
    existing.updatedAt = nowIso;
    recomputeUserActiveCount(uid);
    userRec.profile.lastQuotaItemId = itemId;
    userRec.profile.updatedAt = nowIso;

    recordUserActivity(
      uid,
      'item_archived',
      `أرشفة الغرض: ${existing.name}`,
      `Archived Item: ${existing.name}`,
      `تم نقل الغرض (${existing.codeSerial}) إلى الأرشيف وتفريغ خانة في حد الباقة المجانية (${userRec.profile.activeItemsCount}/${userRec.profile.activeItemsLimit}).`,
      `Archived item (${existing.codeSerial}). Active quota is now ${userRec.profile.activeItemsCount}/${userRec.profile.activeItemsLimit}.`,
      itemId
    );

    saveDatabase();
    res.json({ ok: true, item: existing, profile: decorateProfileAuthority(userRec) });
  });

  app.post('/api/items/:id/reactivate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userRec = req.user!;
    const uid = userRec.uid;
    const itemId = req.params.id;
    const existing = db.items[itemId];

    if (!existing) {
      res.status(404).json({ ok: false, errorCode: 'ITEM_NOT_FOUND' });
      return;
    }
    if (existing.ownerUid !== uid) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_NOT_OWNER' });
      return;
    }

    if (existing.status !== 'Archived') {
      recomputeUserActiveCount(uid);
      res.json({ ok: true, item: existing, profile: decorateProfileAuthority(userRec) });
      return;
    }

    const currentActive = recomputeUserActiveCount(uid);
    if (!canAddOrReactivateItem(currentActive, userRec.profile.activeItemsLimit)) {
      res.status(403).json({
        ok: false,
        errorCode: 'QUOTA_LIMIT_REACHED',
        messageAr:
          'لا يمكن إعادة تفعيل هذا الغرض لأنك وصلت إلى الحد الأقصى للباقة المجانية (غرضان نشطان).',
        messageEn:
          'Cannot reactivate this item because you have reached the Free Plan limit (2 active items).',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    existing.status = 'Active';
    existing.updatedAt = nowIso;
    recomputeUserActiveCount(uid);
    userRec.profile.lastQuotaItemId = itemId;
    userRec.profile.updatedAt = nowIso;

    recordUserActivity(
      uid,
      'item_reactivated',
      `إعادة تفعيل الغرض: ${existing.name}`,
      `Reactivated Item: ${existing.name}`,
      `تم إعادة تفعيل الغرض (${existing.codeSerial}) بنجاح (${userRec.profile.activeItemsCount}/${userRec.profile.activeItemsLimit}).`,
      `Reactivated item (${existing.codeSerial}) (${userRec.profile.activeItemsCount}/${userRec.profile.activeItemsLimit}).`,
      itemId
    );

    saveDatabase();
    res.json({ ok: true, item: existing, profile: decorateProfileAuthority(userRec) });
  });

  app.delete('/api/items/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const userRec = req.user!;
    const uid = userRec.uid;
    const itemId = req.params.id;
    const existing = db.items[itemId];

    if (!existing) {
      res.status(404).json({ ok: false, errorCode: 'ITEM_NOT_FOUND' });
      return;
    }
    if (existing.ownerUid !== uid) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_NOT_OWNER' });
      return;
    }

    const deletedName = existing.name;
    const deletedSerial = existing.codeSerial;
    delete db.items[itemId];
    // Cascade-clean associated finder messages so orphaned records don't linger
    for (const [msgId, msg] of Object.entries(db.messages)) {
      if (msg.itemId === itemId) {
        delete db.messages[msgId];
      }
    }
    // Remove deleted item reference from owner's Shared QR Groups without altering their shareCode
    for (const sharedGroup of Object.values(db.sharedQrGroups || {})) {
      if (sharedGroup.ownerUid === uid && sharedGroup.items.some((e) => e.itemId === itemId)) {
        sharedGroup.items = sharedGroup.items.filter((e) => e.itemId !== itemId);
        sharedGroup.updatedAt = new Date().toISOString();
      }
    }
    recomputeUserActiveCount(uid);
    userRec.profile.updatedAt = new Date().toISOString();

    recordUserActivity(
      uid,
      'item_deleted',
      `حذف الغرض: ${deletedName}`,
      `Deleted Item: ${deletedName}`,
      `تم حذف الغرض (${deletedSerial}) نهائيًا من قاعدة البيانات وإلغاء صفحة الاستعادة العامة المرتبطة به.`,
      `Permanently deleted item (${deletedSerial}) from the database and revoked its public recovery page.`
    );

    saveDatabase();
    res.json({ ok: true, profile: decorateProfileAuthority(userRec) });
  });

  // ---------------------------------------------------------------------------
  // 4. PUBLIC UNAUTHENTICATED QR RECOVERY, FINDER MESSAGES & FOUND REPORTS
  // ---------------------------------------------------------------------------
  function findItemByCodeOrId(codeOrId: string): RegisteredItem | undefined {
    const normalized = (codeOrId || '').trim();
    if (!normalized) return undefined;
    if (db.items[normalized]) {
      return db.items[normalized];
    }
    const bySerial = Object.values(db.items).find(
      (i) => i.codeSerial.toUpperCase() === normalized.toUpperCase()
    );
    if (bySerial) return bySerial;

    return INITIAL_REGISTERED_ITEMS.find(
      (i) => i.id === normalized || i.codeSerial.toUpperCase() === normalized.toUpperCase()
    );
  }

  app.get('/api/public/qr/:codeOrId', (req: Request, res: Response) => {
    const item = findItemByCodeOrId(req.params.codeOrId);
    if (!item) {
      res.status(404).json({
        ok: false,
        errorCode: 'QR_NOT_FOUND',
        messageAr: 'لم يتم العثور على غرض مرتبط بهذا الكود.',
        messageEn: 'No registered item found for this QR code.',
      });
      return;
    }

    const storedItem = db.items[item.id];
    if (storedItem && storedItem.moderationFlag === 'restricted') {
      res.status(403).json({
        ok: false,
        errorCode: 'ITEM_RESTRICTED_BY_MODERATION',
        messageAr: 'تم إيقاف عرض صفحة هذا الكود مؤقتًا لمخالفة سياسة المنصة.',
        messageEn: 'This QR recovery page has been temporarily restricted for policy review.',
      });
      return;
    }

    const decoratedItem = storedItem
      ? decorateItemQrModeMetadata(storedItem, db.sharedQrGroups || {})
      : item;
    const availability = evaluateIndividualQrAvailability(decoratedItem);

    if (storedItem && availability.active && req.query.preview !== '1') {
      storedItem.totalScans = (storedItem.totalScans || 0) + 1;
      storedItem.lastScanAt = new Date().toISOString();
      saveDatabase();
    }

    const ownerRec = decoratedItem.ownerUid ? db.users[decoratedItem.ownerUid] : undefined;
    const publicPayload = buildFinderPublicView(decoratedItem, undefined, {
      ownerContactMethods: ownerRec ? ensureProfileContactMethods(ownerRec.profile) : undefined,
      contactMethodsLimit: ownerRec?.profile.contactMethodsLimit,
    });
    res.json({
      ok: true,
      payload: publicPayload,
    });
  });

  function resolveOwnerWhatsAppTarget(userRec: StoredUserRecord): string {
    const methods = ensureProfileContactMethods(userRec.profile);
    const activeWa = methods.find((m) => m.type === 'whatsapp' && m.isActive && m.value.trim());
    const raw = activeWa?.value || userRec.profile.whatsapp || '';
    return normalizeWhatsAppPhone(raw);
  }

  function dispatchExternalRecoveryAlerts(params: {
    ownerUid: string;
    item: RegisteredItem;
    eventType: 'found_report' | 'finder_message';
    senderName?: string;
    senderContact?: string;
    message?: string;
    sharedGroupName?: string;
  }) {
    const ownerRec = db.users[params.ownerUid];
    if (!ownerRec) return;

    const settings = ownerRec.settings || INITIAL_WORKSPACE_SETTINGS;
    const privacy = resolveItemPrivacySettings(params.item);

    const allowEmailForEvent =
      settings.instantEmailAlerts !== false &&
      (params.eventType === 'found_report'
        ? settings.notifyOnRecovery !== false && privacy.allowFoundReports !== false
        : settings.notifyOnFinderMessage !== false && privacy.allowFinderMessages !== false);

    if (allowEmailForEvent && ownerRec.email) {
      const emailPayload =
        params.eventType === 'found_report'
          ? buildFoundReportEmail({
              to: ownerRec.email,
              itemName: params.item.name,
              codeSerial: params.item.codeSerial,
              sharedGroupName: params.sharedGroupName,
            })
          : buildFinderMessageEmail({
              to: ownerRec.email,
              itemName: params.item.name,
              codeSerial: params.item.codeSerial,
              senderName: params.senderName || 'Item Finder',
              senderContact: params.senderContact,
              message: params.message || '',
              sharedGroupName: params.sharedGroupName,
            });

      void sendTransactionalEmail(emailPayload, options.emailOverrides).catch(() => {
        // Non-blocking external email notification
      });
    }

    if (settings.whatsappScanAlerts === true) {
      const waTarget = resolveOwnerWhatsAppTarget(ownerRec);
      if (waTarget) {
        const bodyText =
          params.eventType === 'found_report'
            ? `FindIt QR — بلاغ عثور فوري\nتم مسح الكود (${params.item.codeSerial}) والضغط على «عثرت على هذا الغرض» للغرض: ${params.item.name}${params.sharedGroupName ? ` (${params.sharedGroupName})` : ''}.`
            : `FindIt QR — رسالة جديدة حول «${params.item.name}» (${params.item.codeSerial})\nالمرسل: ${params.senderName || 'مكتشف الغرض'}\nالرسالة: ${params.message || ''}${params.senderContact ? `\nالتواصل: ${params.senderContact}` : ''}`;

        void sendWhatsAppAlert(
          {
            toPhone: waTarget,
            bodyText,
            templateParams: [
              params.item.name,
              params.item.codeSerial,
              params.eventType === 'found_report'
                ? 'Found Report'
                : (params.message || '').slice(0, 120),
            ],
          },
          options.whatsappOverrides
        ).catch(() => {
          // Non-blocking external WhatsApp alert
        });
      }
    }
  }

  app.post('/api/public/qr/:codeOrId/message', (req: Request, res: Response) => {
    const item = findItemByCodeOrId(req.params.codeOrId);
    if (!item) {
      res.status(404).json({
        ok: false,
        errorCode: 'QR_NOT_FOUND',
        messageAr: 'لم يتم العثور على الغرض المرتبط بهذا الكود.',
        messageEn: 'No registered item found for this QR code.',
      });
      return;
    }

    const storedItem = db.items[item.id];
    const decoratedItem = storedItem
      ? decorateItemQrModeMetadata(storedItem, db.sharedQrGroups || {})
      : item;

    if (decoratedItem.moderationFlag === 'restricted') {
      res.status(403).json({
        ok: false,
        errorCode: 'ITEM_RESTRICTED_BY_MODERATION',
        messageAr: 'تم تقييد هذا الكود مؤقتًا من إدارة المنصة ولا يستقبل رسائل.',
        messageEn: 'This QR tag is temporarily restricted and not accepting messages.',
      });
      return;
    }

    if (decoratedItem.status === 'Archived') {
      res.status(403).json({
        ok: false,
        errorCode: 'ITEM_ARCHIVED',
        messageAr: 'هذا الغرض مؤرشف حاليًا من قِبل صاحبه ولا يستقبل رسائل جديدة.',
        messageEn: 'This item is currently archived by its owner and not accepting messages.',
      });
      return;
    }

    const availability = evaluateIndividualQrAvailability(decoratedItem);
    if (!availability.active && (availability.reason === 'shared_mode' || availability.reason === 'shared_group_paused' || availability.reason === 'unassigned_from_shared')) {
      res.status(403).json({
        ok: false,
        errorCode:
          availability.reason === 'unassigned_from_shared'
            ? 'INDIVIDUAL_QR_INACTIVE_UNASSIGNED'
            : 'INDIVIDUAL_QR_INACTIVE_SHARED_MODE',
        messageAr:
          availability.reason === 'unassigned_from_shared'
            ? 'رمز QR الفردي لهذا الغرض غير نشط حاليًا بانتظار إعادة تفعيله من المالك.'
            : 'هذا الغرض يعمل حاليًا ضمن مجموعة QR مشترك، لذلك تم إيقاف كود QR الفردي مؤقتًا لمنع التعارض.',
        messageEn:
          availability.reason === 'unassigned_from_shared'
            ? 'This item’s individual QR is currently inactive awaiting owner reactivation.'
            : 'This item is currently managed by a Shared QR Group, so its individual QR is temporarily inactive to prevent conflicts.',
      });
      return;
    }

    const msgPrivacy = resolveItemPrivacySettings(decoratedItem);
    if (!msgPrivacy.publicPageEnabled) {
      res.status(403).json({
        ok: false,
        errorCode: 'PUBLIC_PAGE_PAUSED',
        messageAr: 'أوقف صاحب الغرض الصفحة العامة مؤقتًا ولا يستقبل رسائل حاليًا.',
        messageEn: 'The owner has paused this public recovery page and is not accepting messages.',
      });
      return;
    }
    if (!msgPrivacy.allowFinderMessages) {
      res.status(403).json({
        ok: false,
        errorCode: 'FINDER_MESSAGES_DISABLED',
        messageAr: 'أوقف صاحب الغرض استقبال الرسائل عبر النموذج الداخلي لهذا الغرض.',
        messageEn: 'The item owner has disabled internal finder messages for this item.',
      });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const message = typeof body.message === 'string' ? body.message : '';
    const senderContact = typeof body.senderContact === 'string' ? body.senderContact : '';
    const senderName = typeof body.senderName === 'string' ? body.senderName : '';
    const honeypot = typeof body.honeypot === 'string' ? body.honeypot : '';

    const check = validateFinderMessageInput({ message, senderContact, honeypot });
    if (!check.valid) {
      res.status(400).json({
        ok: false,
        errorCode: Object.values(check.errors)[0] || 'INVALID_MESSAGE',
        messageAr: 'يرجى كتابة رسالة واضحة (٥ أحرف على الأقل) لصاحب الغرض.',
        messageEn: 'Please write a clear message (at least 5 characters) for the item owner.',
      });
      return;
    }

    const trimmedMessage = message.trim();
    const trimmedContact = senderContact.trim();
    const trimmedSenderName = senderName.trim().slice(0, 80) || 'مكتشف الغرض (Finder)';

    const clientIp = req.ip || 'local';
    const dedupeKey = `msg:${clientIp}:${item.id}:${trimmedMessage.toLowerCase()}`;
    const cooldownKey = `cooldown:msg:${clientIp}:${item.id}`;
    const nowMs = Date.now();

    const lastIdentical = rateLimitMap.get(dedupeKey) || 0;
    const lastAny = rateLimitMap.get(cooldownKey) || 0;
    if (nowMs - lastIdentical < 120_000 || nowMs - lastAny < 10_000) {
      res.status(429).json({
        ok: false,
        errorCode: 'DUPLICATE_OR_RATE_LIMITED_MESSAGE',
        messageAr:
          'تم إرسال رسالتك بالفعل! يرجى الانتظار قليلًا قبل إرسال رسالة أخرى لمنع الرسائل المكررة.',
        messageEn:
          'Your message was already sent! Please wait briefly before sending another message.',
      });
      return;
    }

    rateLimitMap.set(dedupeKey, nowMs);
    rateLimitMap.set(cooldownKey, nowMs);

    const msgId = `msg-${crypto.randomBytes(6).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const finderMsg: FinderMessageEntry = {
      id: msgId,
      itemId: item.id,
      codeSerial: item.codeSerial,
      itemName: item.name,
      ownerUid: item.ownerUid,
      message: trimmedMessage,
      senderContact: trimmedContact,
      senderName: trimmedSenderName,
      createdAt: nowIso,
      status: 'unread',
      type: 'message',
    };

    db.messages[msgId] = finderMsg;

    if (db.items[item.id]) {
      db.items[item.id].totalScans += 1;
      db.items[item.id].lastScanAt = nowIso;
    }

    if (db.users[item.ownerUid]) {
      recordUserNotification(
        item.ownerUid,
        'finder_message',
        'urgent',
        `رسالة جديدة بخصوص: ${item.name} (${item.codeSerial})`,
        `New Finder Message for: ${item.name} (${item.codeSerial})`,
        `${trimmedMessage}${trimmedContact ? ` — وسيلة تواصل المرسل: ${trimmedContact}` : ''}`,
        `${trimmedMessage}${trimmedContact ? ` — Sender contact: ${trimmedContact}` : ''}`,
        item.id,
        msgId,
        trimmedContact
      );

      recordUserActivity(
        item.ownerUid,
        'finder_message',
        `استلام رسالة من مكتشف الغرض (${item.codeSerial})`,
        `Received Finder Message (${item.codeSerial})`,
        `الرسالة: "${trimmedMessage}" ${trimmedContact ? `(${trimmedContact})` : ''}`,
        `Message: "${trimmedMessage}" ${trimmedContact ? `(${trimmedContact})` : ''}`,
        item.id,
        trimmedSenderName,
        trimmedSenderName
      );
    }

    saveDatabase();

    dispatchExternalRecoveryAlerts({
      ownerUid: item.ownerUid,
      item: decoratedItem,
      eventType: 'finder_message',
      senderName: trimmedSenderName,
      senderContact: trimmedContact,
      message: trimmedMessage,
    });

    res.status(201).json({
      ok: true,
      entry: {
        id: finderMsg.id,
        itemId: finderMsg.itemId,
        codeSerial: finderMsg.codeSerial,
        createdAt: finderMsg.createdAt,
        status: finderMsg.status,
        type: finderMsg.type,
      },
      messageAr: 'تم إرسال رسالتك إلى صاحب الغرض بنجاح! شكرًا لأمانتك.',
      messageEn: 'Your message has been delivered to the item owner! Thank you for your honesty.',
    });
  });

  app.post('/api/public/qr/:codeOrId/found-report', (req: Request, res: Response) => {
    const item = findItemByCodeOrId(req.params.codeOrId);
    if (!item) {
      res.status(404).json({
        ok: false,
        errorCode: 'QR_NOT_FOUND',
        messageAr: 'لم يتم العثور على الغرض المرتبط بهذا الكود.',
        messageEn: 'No registered item found for this QR code.',
      });
      return;
    }

    const storedItem = db.items[item.id];
    const decoratedItem = storedItem
      ? decorateItemQrModeMetadata(storedItem, db.sharedQrGroups || {})
      : item;

    if (decoratedItem.moderationFlag === 'restricted') {
      res.status(403).json({
        ok: false,
        errorCode: 'ITEM_RESTRICTED_BY_MODERATION',
        messageAr: 'تم تقييد هذا الكود مؤقتًا من إدارة المنصة.',
        messageEn: 'This QR tag is temporarily restricted by platform moderation.',
      });
      return;
    }

    if (decoratedItem.status === 'Archived') {
      res.status(403).json({
        ok: false,
        errorCode: 'ITEM_ARCHIVED',
        messageAr: 'هذا الغرض مؤرشف حاليًا من قِبل صاحبه.',
        messageEn: 'This item is currently archived by its owner.',
      });
      return;
    }

    const availability = evaluateIndividualQrAvailability(decoratedItem);
    if (!availability.active && (availability.reason === 'shared_mode' || availability.reason === 'shared_group_paused' || availability.reason === 'unassigned_from_shared')) {
      res.status(403).json({
        ok: false,
        errorCode:
          availability.reason === 'unassigned_from_shared'
            ? 'INDIVIDUAL_QR_INACTIVE_UNASSIGNED'
            : 'INDIVIDUAL_QR_INACTIVE_SHARED_MODE',
        messageAr:
          availability.reason === 'unassigned_from_shared'
            ? 'رمز QR الفردي لهذا الغرض غير نشط حاليًا بانتظار إعادة تفعيله من المالك.'
            : 'هذا الغرض يعمل حاليًا ضمن مجموعة QR مشترك، لذلك تم إيقاف كود QR الفردي مؤقتًا.',
        messageEn:
          availability.reason === 'unassigned_from_shared'
            ? 'This item’s individual QR is currently inactive awaiting owner reactivation.'
            : 'This item is currently managed by a Shared QR Group, so its individual QR is temporarily inactive.',
      });
      return;
    }

    const reportPrivacy = resolveItemPrivacySettings(decoratedItem);
    if (!reportPrivacy.publicPageEnabled) {
      res.status(403).json({
        ok: false,
        errorCode: 'PUBLIC_PAGE_PAUSED',
        messageAr: 'أوقف صاحب الغرض الصفحة العامة مؤقتًا.',
        messageEn: 'The owner has temporarily paused this public recovery page.',
      });
      return;
    }
    if (!reportPrivacy.allowFoundReports) {
      res.status(403).json({
        ok: false,
        errorCode: 'FOUND_REPORTS_DISABLED',
        messageAr: 'أوقف صاحب الغرض تنبيهات العثور السريع لهذا الغرض.',
        messageEn: 'The owner has disabled quick found-item alerts for this item.',
      });
      return;
    }

    const clientIp = req.ip || 'local';
    const reportCooldownKey = `found-report:${clientIp}:${item.id}`;
    const nowMs = Date.now();
    const lastReport = rateLimitMap.get(reportCooldownKey) || 0;

    if (nowMs - lastReport < 30_000) {
      res.status(429).json({
        ok: false,
        errorCode: 'DUPLICATE_FOUND_REPORT',
        messageAr: 'تم تسجيل بلاغ العثور على هذا الغرض بالفعل وإشعار صاحبه! شكرًا جزيلًا لك.',
        messageEn: 'Found report already recorded and owner notified! Thank you so much.',
      });
      return;
    }

    rateLimitMap.set(reportCooldownKey, nowMs);

    const reportId = `fnd-${crypto.randomBytes(6).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const reportEntry: FinderMessageEntry = {
      id: reportId,
      itemId: item.id,
      codeSerial: item.codeSerial,
      itemName: item.name,
      ownerUid: item.ownerUid,
      message: 'قام شخص بمسح الكود والضغط على زر «عثرت على هذا الغرض».',
      senderContact: '',
      senderName: 'بلاغ عثور فوري (QR Scan)',
      createdAt: nowIso,
      status: 'unread',
      type: 'found_report',
    };

    db.messages[reportId] = reportEntry;

    if (db.items[item.id]) {
      db.items[item.id].totalScans += 1;
      db.items[item.id].lastScanAt = nowIso;
    }

    if (db.users[item.ownerUid]) {
      recordUserNotification(
        item.ownerUid,
        'found_report',
        'urgent',
        `بلاغ عاجل: «عثرت على هذا الغرض» — ${item.name}`,
        `Urgent Found Report: "${item.name}" (${item.codeSerial})`,
        `قام شخص بمسح كود (${item.codeSerial}) والضغط على زر «عثرت على هذا الغرض». تفقد وسائل التواصل أو الرسائل الواردة.`,
        `Someone scanned (${item.codeSerial}) and clicked "I Found This Item". Check your messages and contact channels.`,
        item.id,
        reportId
      );

      recordUserActivity(
        item.ownerUid,
        'found_report',
        `بلاغ عثور على الغرض: ${item.name} (${item.codeSerial})`,
        `Found Item Report Triggered: ${item.name} (${item.codeSerial})`,
        'تم الضغط على زر «عثرت على هذا الغرض» في صفحة الاستعادة العامة.',
        'Finder clicked "I Found This Item" on the public QR recovery page.',
        item.id,
        'مكتشف الغرض',
        'Item Finder'
      );
    }

    saveDatabase();

    dispatchExternalRecoveryAlerts({
      ownerUid: item.ownerUid,
      item: decoratedItem,
      eventType: 'found_report',
    });

    res.status(201).json({
      ok: true,
      reportId,
      welcomeAr:
        'شكرًا جزيلًا لأمانتك ومبادرتك الكريمة! تم إرسال إشعار فوري لصاحب الغرض بأنه قد تم العثور عليه. يمكنك الآن التواصل معه مباشرة عبر القنوات الموضحة أدناه أو ترك رسالة سريعة له.',
      welcomeEn:
        'Thank you so much for your honesty! An urgent notification has been sent to the item owner. You can now reach them via the approved channels below or leave a quick message.',
    });
  });

  // ---------------------------------------------------------------------------
  // 4B. PUBLIC UNAUTHENTICATED SHARED QR GROUP RECOVERY & ITEM-SPECIFIC ACTIONS
  // ---------------------------------------------------------------------------
  function findSharedGroupByCodeOrId(codeOrId: string): SharedQrGroup | undefined {
    const normalized = (codeOrId || '').trim();
    if (!normalized) return undefined;
    if (db.sharedQrGroups?.[normalized]) {
      return db.sharedQrGroups[normalized];
    }
    return Object.values(db.sharedQrGroups || {}).find(
      (g) => g.shareCode.toUpperCase() === normalized.toUpperCase()
    );
  }

  function resolveVisibleSharedGroupItem(
    shareCode: string,
    itemId: string
  ):
    | { ok: true; group: SharedQrGroup; item: RegisteredItem }
    | { ok: false; status: number; errorCode: string; messageAr: string; messageEn: string } {
    const group = findSharedGroupByCodeOrId(shareCode);
    if (!group) {
      return {
        ok: false,
        status: 404,
        errorCode: 'SHARED_QR_NOT_FOUND',
        messageAr: 'لم يتم العثور على مجموعة QR المشتركة المطلوبة.',
        messageEn: 'Shared QR group not found.',
      };
    }
    if (!group.isActive) {
      return {
        ok: false,
        status: 403,
        errorCode: 'SHARED_QR_PAUSED',
        messageAr: 'أوقف صاحب المجموعة كود QR المشترك مؤقتًا.',
        messageEn: 'This shared QR group is currently paused by its owner.',
      };
    }
    const membership = group.items.find((e) => e.itemId === itemId);
    if (!membership || !membership.isVisible) {
      return {
        ok: false,
        status: 404,
        errorCode: 'ITEM_NOT_VISIBLE_IN_SHARED_GROUP',
        messageAr: 'هذا الغرض غير ظاهر حاليًا في صفحة المجموعة المشتركة.',
        messageEn: 'This item is not currently visible on the shared group page.',
      };
    }
    const item = db.items[itemId];
    if (!item || item.ownerUid !== group.ownerUid || item.status === 'Archived' || item.moderationFlag === 'restricted') {
      return {
        ok: false,
        status: 404,
        errorCode: 'ITEM_NOT_AVAILABLE',
        messageAr: 'هذا الغرض غير متاح حاليًا.',
        messageEn: 'This item is not currently available.',
      };
    }
    const privacy = resolveItemPrivacySettings(item);
    if (!privacy.publicPageEnabled) {
      return {
        ok: false,
        status: 403,
        errorCode: 'PUBLIC_PAGE_PAUSED',
        messageAr: 'أوقف صاحب الغرض الصفحة العامة لهذا الغرض مؤقتًا.',
        messageEn: 'The owner has paused public access for this item.',
      };
    }
    return { ok: true, group, item };
  }

  app.get('/api/public/shared-qr/:shareCode', (req: Request, res: Response) => {
    const group = findSharedGroupByCodeOrId(req.params.shareCode);
    if (!group) {
      res.status(404).json({
        ok: false,
        errorCode: 'SHARED_QR_NOT_FOUND',
        messageAr: 'لم يتم العثور على مجموعة مرتبطة بهذا الكود المشترك.',
        messageEn: 'No shared group found for this QR code.',
      });
      return;
    }

    if (req.query.preview !== '1' && group.isActive) {
      group.totalScans = (group.totalScans || 0) + 1;
      group.lastScanAt = new Date().toISOString();
      saveDatabase();
    }

    const ownerRec = db.users[group.ownerUid];
    const payload = buildSharedQrPublicPayload(group, db.items, {
      ownerContactMethods: ownerRec ? ensureProfileContactMethods(ownerRec.profile) : undefined,
      contactMethodsLimit: ownerRec?.profile.contactMethodsLimit,
    });
    res.json({ ok: true, payload });
  });

  app.post('/api/public/shared-qr/:shareCode/items/:itemId/message', (req: Request, res: Response) => {
    const resolved = resolveVisibleSharedGroupItem(req.params.shareCode, req.params.itemId);
    if (!resolved.ok) {
      res.status(resolved.status).json({
        ok: false,
        errorCode: resolved.errorCode,
        messageAr: resolved.messageAr,
        messageEn: resolved.messageEn,
      });
      return;
    }

    const { group, item } = resolved;
    const msgPrivacy = resolveItemPrivacySettings(item);
    if (!msgPrivacy.allowFinderMessages) {
      res.status(403).json({
        ok: false,
        errorCode: 'FINDER_MESSAGES_DISABLED',
        messageAr: 'أوقف صاحب الغرض استقبال الرسائل عبر النموذج الداخلي لهذا الغرض.',
        messageEn: 'The item owner has disabled internal finder messages for this item.',
      });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const message = typeof body.message === 'string' ? body.message : '';
    const senderContact = typeof body.senderContact === 'string' ? body.senderContact : '';
    const senderName = typeof body.senderName === 'string' ? body.senderName : '';
    const honeypot = typeof body.honeypot === 'string' ? body.honeypot : '';

    const check = validateFinderMessageInput({ message, senderContact, honeypot });
    if (!check.valid) {
      res.status(400).json({
        ok: false,
        errorCode: Object.values(check.errors)[0] || 'INVALID_MESSAGE',
        messageAr: 'يرجى كتابة رسالة واضحة (٥ أحرف على الأقل) لصاحب الغرض.',
        messageEn: 'Please write a clear message (at least 5 characters) for the item owner.',
      });
      return;
    }

    const trimmedMessage = message.trim();
    const trimmedContact = senderContact.trim();
    const trimmedSenderName = senderName.trim().slice(0, 80) || 'مكتشف الغرض (Shared QR)';

    const clientIp = req.ip || 'local';
    const cooldownKey = `cooldown:shared-msg:${clientIp}:${group.id}:${item.id}`;
    const nowMs = Date.now();
    const lastSent = rateLimitMap.get(cooldownKey) || 0;
    if (nowMs - lastSent < 10_000) {
      res.status(429).json({
        ok: false,
        errorCode: 'RATE_LIMITED',
        messageAr: 'يرجى الانتظار بضع ثوانٍ قبل إرسال رسالة جديدة.',
        messageEn: 'Please wait a few seconds before sending another message.',
      });
      return;
    }
    rateLimitMap.set(cooldownKey, nowMs);

    const msgId = `msg-${crypto.randomBytes(6).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const entry: FinderMessageEntry = {
      id: msgId,
      itemId: item.id,
      codeSerial: item.codeSerial,
      itemName: item.name,
      ownerUid: item.ownerUid,
      message: trimmedMessage,
      senderContact: trimmedContact,
      senderName: trimmedSenderName,
      createdAt: nowIso,
      status: 'unread',
      type: 'message',
    };
    db.messages[msgId] = entry;

    if (db.users[item.ownerUid]) {
      recordUserNotification(
        item.ownerUid,
        'finder_message',
        'urgent',
        `رسالة عبر QR المشترك (${group.name}) — ${item.name}`,
        `Shared QR Message (${group.name}) — ${item.name}`,
        trimmedContact
          ? `الرسالة: «${trimmedMessage}» · تواصل المكتشف: ${trimmedContact}`
          : `الرسالة: «${trimmedMessage}»`,
        trimmedContact
          ? `Message: "${trimmedMessage}" · Finder contact: ${trimmedContact}`
          : `Message: "${trimmedMessage}"`,
        item.id,
        msgId,
        trimmedContact
      );

      recordUserActivity(
        item.ownerUid,
        'finder_message',
        `رسالة مكتشف عبر المجموعة المشتركة (${group.name}): ${item.name}`,
        `Finder Message via Shared Group (${group.name}): ${item.name}`,
        `وصلت رسالة من مكتشف الغرض عبر كود QR المشترك (${group.shareCode}).`,
        `Finder submitted a message through Shared QR (${group.shareCode}).`,
        item.id,
        trimmedSenderName,
        trimmedSenderName
      );
    }

    saveDatabase();

    dispatchExternalRecoveryAlerts({
      ownerUid: item.ownerUid,
      item,
      eventType: 'finder_message',
      senderName: trimmedSenderName,
      senderContact: trimmedContact,
      message: trimmedMessage,
      sharedGroupName: group.name,
    });

    res.status(201).json({
      ok: true,
      entry: {
        id: entry.id,
        itemId: entry.itemId,
        createdAt: entry.createdAt,
        status: entry.status,
        type: entry.type,
      },
      messageAr: 'تم إرسال رسالتك إلى صاحب الغرض بنجاح. شكرًا لأمانتك!',
      messageEn: 'Your message has been delivered to the item owner. Thank you!',
    });
  });

  app.post('/api/public/shared-qr/:shareCode/items/:itemId/found-report', (req: Request, res: Response) => {
    const resolved = resolveVisibleSharedGroupItem(req.params.shareCode, req.params.itemId);
    if (!resolved.ok) {
      res.status(resolved.status).json({
        ok: false,
        errorCode: resolved.errorCode,
        messageAr: resolved.messageAr,
        messageEn: resolved.messageEn,
      });
      return;
    }

    const { group, item } = resolved;
    const reportPrivacy = resolveItemPrivacySettings(item);
    if (!reportPrivacy.allowFoundReports) {
      res.status(403).json({
        ok: false,
        errorCode: 'FOUND_REPORTS_DISABLED',
        messageAr: 'أوقف صاحب الغرض تنبيهات العثور السريع لهذا الغرض.',
        messageEn: 'The owner has disabled quick found-item alerts for this item.',
      });
      return;
    }

    const clientIp = req.ip || 'local';
    const cooldownKey = `shared-found-report:${clientIp}:${group.id}:${item.id}`;
    const nowMs = Date.now();
    const lastReport = rateLimitMap.get(cooldownKey) || 0;
    if (nowMs - lastReport < 30_000) {
      res.status(429).json({
        ok: false,
        errorCode: 'DUPLICATE_FOUND_REPORT',
        messageAr: 'تم تسجيل بلاغ العثور على هذا الغرض بالفعل وإشعار صاحبه! شكرًا جزيلًا لك.',
        messageEn: 'Found report already recorded and owner notified! Thank you so much.',
      });
      return;
    }
    rateLimitMap.set(cooldownKey, nowMs);

    const reportId = `fnd-${crypto.randomBytes(6).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const reportEntry: FinderMessageEntry = {
      id: reportId,
      itemId: item.id,
      codeSerial: item.codeSerial,
      itemName: item.name,
      ownerUid: item.ownerUid,
      message: `قام شخص بمسح كود QR المشترك (${group.name}) والإبلاغ عن العثور على هذا الغرض.`,
      senderContact: '',
      senderName: 'بلاغ عثور عبر QR مشترك',
      createdAt: nowIso,
      status: 'unread',
      type: 'found_report',
    };
    db.messages[reportId] = reportEntry;

    if (db.users[item.ownerUid]) {
      recordUserNotification(
        item.ownerUid,
        'found_report',
        'urgent',
        `بلاغ عاجل عبر QR المشترك (${group.name}) — ${item.name}`,
        `Urgent Shared QR Found Report (${group.name}) — ${item.name}`,
        `قام شخص بمسح كود QR المشترك (${group.shareCode}) واختيار الغرض «${item.name}» للإبلاغ عن العثور عليه.`,
        `Someone scanned Shared QR (${group.shareCode}) and reported finding "${item.name}".`,
        item.id,
        reportId
      );

      recordUserActivity(
        item.ownerUid,
        'found_report',
        `بلاغ عثور عبر المجموعة المشتركة (${group.name}): ${item.name}`,
        `Found Report via Shared Group (${group.name}): ${item.name}`,
        `تم الضغط على زر «عثرت على هذا الغرض» عبر كود QR المشترك (${group.shareCode}).`,
        `Finder clicked "I Found This Item" via Shared QR (${group.shareCode}).`,
        item.id,
        'مكتشف الغرض',
        'Item Finder'
      );
    }

    saveDatabase();

    dispatchExternalRecoveryAlerts({
      ownerUid: item.ownerUid,
      item,
      eventType: 'found_report',
      sharedGroupName: group.name,
    });

    res.status(201).json({
      ok: true,
      reportId,
      welcomeAr:
        'شكرًا جزيلًا لأمانتك! تم إشعار صاحب الغرض فورًا بأنه تم العثور عليه. يمكنك الآن التواصل معه عبر القنوات المسموح بها لهذا الغرض أو إرسال رسالة سريعة.',
      welcomeEn:
        'Thank you for your honesty! The owner has been notified immediately. You can now reach them via the approved channels for this item or leave a quick message.',
    });
  });

  // ---------------------------------------------------------------------------
  // 5. OWNER MESSAGES & NOTIFICATIONS MANAGEMENT ENDPOINTS
  // ---------------------------------------------------------------------------
  app.patch('/api/messages/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    const msg = db.messages[req.params.id];
    if (!msg) {
      res.status(404).json({ ok: false, errorCode: 'MESSAGE_NOT_FOUND' });
      return;
    }
    if (msg.ownerUid !== uid) {
      res.status(403).json({ ok: false, errorCode: 'FORBIDDEN_NOT_OWNER' });
      return;
    }
    const { status } = (req.body || {}) as { status?: FinderMessageStatus };
    if (status === 'read' || status === 'unread' || status === 'archived') {
      msg.status = status;
    }
    saveDatabase();
    res.json({ ok: true, message: msg });
  });

  app.patch(
    '/api/notifications/:id/read',
    requireAuth,
    (req: AuthenticatedRequest, res: Response) => {
      const uid = req.user!.uid;
      const notif = db.notifications[req.params.id];
      if (!notif || notif.ownerUid !== uid) {
        res.status(404).json({ ok: false });
        return;
      }
      notif.isRead = true;
      saveDatabase();
      res.json({ ok: true, notification: notif });
    }
  );

  app.post(
    '/api/notifications/read-all',
    requireAuth,
    (req: AuthenticatedRequest, res: Response) => {
      const uid = req.user!.uid;
      for (const notif of Object.values(db.notifications)) {
        if (notif.ownerUid === uid) {
          notif.isRead = true;
        }
      }
      saveDatabase();
      res.json({ ok: true });
    }
  );

  app.delete('/api/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;
    for (const [id, notif] of Object.entries(db.notifications)) {
      if (notif.ownerUid === uid) {
        delete db.notifications[id];
      }
    }
    saveDatabase();
    res.json({ ok: true });
  });

  // ---------------------------------------------------------------------------
  // 5B. SUPER ADMIN, COMMERCE, LICENSES, PLANS, SUPPORT & AUDIT ROUTES
  // ---------------------------------------------------------------------------
  registerAdminAndCommerceRoutes({
    app,
    db,
    saveDatabase,
    configuredAdminEmail,
    requireAuth,
    hashPassword,
    timingSafeEqualHex,
    enforceAuthoritativePlanLimits,
    recomputeUserActiveCount,
    recordUserActivity,
    recordUserNotification,
    issueSession,
    hashSessionToken,
    extractTokenFromRequest,
    verifyGoogleIdToken,
  });

  app.get('/api/integrations/status', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
    const status = buildIntegrationsHealthSnapshot({
      configuredAdminEmail,
      env: options.cloudStorageOverrides?.env,
    });
    res.json({ ok: true, status });
  });

  // Curated 40-cover static library served cleanly in dev, prod, and automated test servers
  const curatedCoversDir = path.resolve(process.cwd(), 'public', 'assets', 'covers-library');
  if (fs.existsSync(curatedCoversDir)) {
    app.use(
      '/assets/covers-library',
      express.static(curatedCoversDir, {
        maxAge: '365d',
        immutable: true,
        setHeaders: (res) => {
          res.setHeader('X-Content-Type-Options', 'nosniff');
        },
      })
    );
  }

  registerUserAppRoutes({
    app,
    db,
    saveDatabase,
    requireAuth,
    resolveOptionalAuthUser,
    decorateProfileAuthority,
    recordUserActivity,
    mediaRoot: options.mediaRoot,
    emailOverrides: options.emailOverrides,
    cloudStorageOverrides: options.cloudStorageOverrides,
  });

  // Safe JSON error handler for malformed JSON bodies or unhandled API errors (never leaks stack traces)
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    if (req.path.startsWith('/api/')) {
      const status =
        err && typeof err === 'object' && 'status' in err && typeof (err as { status: unknown }).status === 'number'
          ? (err as { status: number }).status
          : 400;
      res.status(status >= 400 && status < 600 ? status : 500).json({
        ok: false,
        errorCode: status === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
        messageAr: status === 400 ? 'صيغة الطلب غير صالحة.' : 'حدث خطأ داخلي في الخادم.',
        messageEn: status === 400 ? 'Invalid request payload.' : 'Internal server error.',
      });
      return;
    }
    next(err);
  });

  // ---------------------------------------------------------------------------
  // 6. VITE MIDDLEWARE IN DEV / STATIC ASSETS IN PROD
  // ---------------------------------------------------------------------------
  if (!options.disableVite) {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.resolve(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  return { app, db, saveDatabase };
}

export async function startServer() {
  const { app } = await createServerApp();
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FindIt QR Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

const isExecutedDirectly =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isExecutedDirectly) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
