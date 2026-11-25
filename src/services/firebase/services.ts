import {
  Auth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User as FirebaseClientUser,
} from 'firebase/auth';
import {
  ActivityLogEntry,
  AdminPermissionKey,
  FinderMessageEntry,
  FinderMessageStatus,
  FinderPublicPayload,
  FirebaseConfigRequirements,
  ItemCategory,
  ItemGroup,
  ItemPrivacySettings,
  ItemStatus,
  Language,
  NewItemDraft,
  NotificationEntry,
  RegisteredItem,
  ServiceResult,
  SharedQrGroup,
  SharedQrPublicPayload,
  UserProfile,
  UserRole,
  WorkspaceSettings,
} from '../../types/domain';
import {
  chooseGoogleAuthStrategy,
  clearPendingGoogleRedirect,
  isEmbeddedInIframe,
  isFreshFirebaseSignIn,
  mapFirebaseGoogleAuthError,
  MappedGoogleAuthError,
  readPendingGoogleRedirect,
  savePendingGoogleRedirect,
} from '../../utils/googleAuthFlow';
import { getFirebaseClients, getFirebaseConfigStatus } from './config';

export interface GoogleRedirectUiState {
  isPending: boolean;
  error: MappedGoogleAuthError | null;
  completedMessage: { ar: string; en: string } | null;
}

export interface AuthenticatedSessionUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
  role?: UserRole;
  adminPermissions?: AdminPermissionKey[];
  isQaSandbox?: boolean;
}

interface WorkspaceSnapshotPayload {
  ok: boolean;
  sessionToken?: string;
  profile: UserProfile;
  settings?: WorkspaceSettings;
  items: RegisteredItem[];
  groups?: ItemGroup[];
  sharedQrGroups?: SharedQrGroup[];
  messages: FinderMessageEntry[];
  notifications: NotificationEntry[];
  activities: ActivityLogEntry[];
}

const SESSION_TOKEN_KEY = 'finditqr_session_token';

export function getSessionToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(SESSION_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function setSessionToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.localStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {
    // ignore storage quota/iframe restrictions; HttpOnly cookie remains active
  }
}

export function authHeaders(): Record<string, string> {
  const token = getSessionToken();
  return token
    ? {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    : {
        'Content-Type': 'application/json',
      };
}

type AuthListener = (user: AuthenticatedSessionUser | null) => void;
type GoogleRedirectListener = (state: GoogleRedirectUiState) => void;
const authListeners = new Set<AuthListener>();
const googleRedirectListeners = new Set<GoogleRedirectListener>();
let currentAuthUser: AuthenticatedSessionUser | null = null;
let lastWorkspaceSnapshot: WorkspaceSnapshotPayload | null = null;
let inflightSessionRestore: Promise<void> | null = null;
let inFlightGoogleSignIn: Promise<ServiceResult<UserProfile>> | null = null;
let initialAuthResolved = false;

let googleRedirectState: GoogleRedirectUiState = {
  isPending: Boolean(readPendingGoogleRedirect()),
  error: null,
  completedMessage: null,
};

function emitGoogleRedirectState(partial: Partial<GoogleRedirectUiState>): void {
  googleRedirectState = {
    ...googleRedirectState,
    ...partial,
  };
  const snapshot = { ...googleRedirectState };
  googleRedirectListeners.forEach((cb) => cb(snapshot));
}

function isGoogleFirebaseUser(user: FirebaseClientUser | null | undefined): boolean {
  if (!user) return false;
  return user.providerData.some((p) => p.providerId === 'google.com');
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
}

async function waitForFreshFirebaseGoogleUser(
  authInstance: Auth,
  attemptStartedAtMs: number,
  timeoutMs = 1800
): Promise<FirebaseClientUser | null> {
  const existing = authInstance.currentUser;
  if (
    existing &&
    isGoogleFirebaseUser(existing) &&
    isFreshFirebaseSignIn(existing.metadata?.lastSignInTime, attemptStartedAtMs)
  ) {
    return existing;
  }

  return new Promise<FirebaseClientUser | null>((resolve) => {
    let settled = false;
    let unsub: (() => void) | null = null;
    const finish = (user: FirebaseClientUser | null) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (unsub) {
        try {
          unsub();
        } catch {
          // ignore
        }
      }
      resolve(user);
    };

    const timer = setTimeout(() => {
      const lateUser = authInstance.currentUser;
      if (
        lateUser &&
        isGoogleFirebaseUser(lateUser) &&
        isFreshFirebaseSignIn(lateUser.metadata?.lastSignInTime, attemptStartedAtMs)
      ) {
        finish(lateUser);
      } else {
        finish(null);
      }
    }, timeoutMs);

    unsub = onAuthStateChanged(authInstance, (candidate) => {
      if (
        candidate &&
        isGoogleFirebaseUser(candidate) &&
        isFreshFirebaseSignIn(candidate.metadata?.lastSignInTime, attemptStartedAtMs)
      ) {
        finish(candidate);
      }
    });
  });
}

async function restoreBackendSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'GET',
      headers: authHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        setSessionToken('');
      }
      return false;
    }
    const payload = (await res.json()) as WorkspaceSnapshotPayload & {
      authenticated?: boolean;
    };
    if (payload.ok && payload.authenticated !== false && payload.profile) {
      if (payload.sessionToken) {
        setSessionToken(payload.sessionToken);
      }
      lastWorkspaceSnapshot = payload;
      emitAuthState(buildAuthUserFromProfile(payload.profile));
      notifyDataSubscribers(payload);
      return true;
    }
    setSessionToken('');
    return false;
  } catch {
    // Do not delete localStorage token on transient network error
    return false;
  }
}

interface DataSubscriber {
  uid: string;
  onProfile: (profile: UserProfile) => void;
  onSettings?: (settings: WorkspaceSettings) => void;
  onItems: (items: RegisteredItem[]) => void;
  onGroups?: (groups: ItemGroup[]) => void;
  onSharedQrGroups?: (sharedQrGroups: SharedQrGroup[]) => void;
  onActivities: (activities: ActivityLogEntry[]) => void;
  onMessages?: (messages: FinderMessageEntry[]) => void;
  onNotifications?: (notifications: NotificationEntry[]) => void;
  onError?: (err: unknown) => void;
}

const dataSubscribers = new Set<DataSubscriber>();

function buildAuthUserFromProfile(profile: UserProfile): AuthenticatedSessionUser {
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    emailVerified: profile.emailVerified,
    role: profile.role,
    adminPermissions: profile.adminPermissions,
  };
}

function emitAuthState(user: AuthenticatedSessionUser | null): void {
  initialAuthResolved = true;
  currentAuthUser = user;
  if (!user) {
    lastWorkspaceSnapshot = null;
  }
  authListeners.forEach((cb) => cb(user));
}

function notifyDataSubscribers(data: WorkspaceSnapshotPayload): void {
  lastWorkspaceSnapshot = data;
  dataSubscribers.forEach((sub) => {
    if (sub.uid === data.profile.uid) {
      sub.onProfile(data.profile);
      if (data.settings) sub.onSettings?.(data.settings);
      sub.onItems(data.items);
      sub.onGroups?.(Array.isArray(data.groups) ? data.groups : []);
      sub.onSharedQrGroups?.(Array.isArray(data.sharedQrGroups) ? data.sharedQrGroups : []);
      sub.onActivities(data.activities);
      sub.onMessages?.(data.messages);
      sub.onNotifications?.(data.notifications);
    }
  });
}

async function fetchWorkspaceWithRetry(): Promise<Response> {
  try {
    const res = await fetch('/api/workspace', {
      method: 'GET',
      headers: authHeaders(),
      credentials: 'include',
    });
    if (res.status >= 500) {
      await new Promise((r) => setTimeout(r, 450));
      return fetch('/api/workspace', {
        method: 'GET',
        headers: authHeaders(),
        credentials: 'include',
      });
    }
    return res;
  } catch {
    await new Promise((r) => setTimeout(r, 450));
    return fetch('/api/workspace', {
      method: 'GET',
      headers: authHeaders(),
      credentials: 'include',
    });
  }
}

async function refreshWorkspaceForSubscribers(): Promise<void> {
  try {
    const res = await fetchWorkspaceWithRetry();
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        setSessionToken('');
        emitAuthState(null);
      }
      return;
    }
    const data = (await res.json()) as WorkspaceSnapshotPayload;
    if (!data.ok || !data.profile) return;

    if (data.sessionToken) {
      setSessionToken(data.sessionToken);
    }

    const updatedAuthUser = buildAuthUserFromProfile(data.profile);
    if (
      !currentAuthUser ||
      currentAuthUser.uid !== updatedAuthUser.uid ||
      currentAuthUser.role !== updatedAuthUser.role ||
      currentAuthUser.emailVerified !== updatedAuthUser.emailVerified ||
      currentAuthUser.displayName !== updatedAuthUser.displayName
    ) {
      emitAuthState(updatedAuthUser);
    }

    notifyDataSubscribers(data);
  } catch (err) {
    dataSubscribers.forEach((sub) => sub.onError?.(err));
  }
}

export function enableQaSandboxForTesting(): void {
  // Kept for backward compatibility; backend environment works natively without sandbox fallback.
}

export const firebaseServiceLayer = {
  getDiagnostics(): FirebaseConfigRequirements {
    return getFirebaseConfigStatus();
  },

  subscribeToGoogleRedirectState(callback: GoogleRedirectListener): () => void {
    googleRedirectListeners.add(callback);
    callback({ ...googleRedirectState });
    return () => {
      googleRedirectListeners.delete(callback);
    };
  },

  clearGoogleRedirectError(): void {
    if (googleRedirectState.error) {
      emitGoogleRedirectState({ error: null });
    }
  },

  consumeGoogleRedirectCompletedMessage(): void {
    if (googleRedirectState.completedMessage) {
      emitGoogleRedirectState({ completedMessage: null });
    }
  },

  subscribeToAuthChanges(callback: (user: AuthenticatedSessionUser | null) => void): () => void {
    authListeners.add(callback);

    if (currentAuthUser) {
      callback(currentAuthUser);
    } else if (initialAuthResolved && !inflightSessionRestore) {
      callback(null);
    } else if (!inflightSessionRestore) {
      inflightSessionRestore = (async () => {
        const pending = readPendingGoogleRedirect();
        const host = typeof window !== 'undefined' ? window.location.hostname : 'preview-domain';
        const status = getFirebaseConfigStatus();

        const completeFirebaseGoogleUser = async (
          firebaseUser: FirebaseClientUser,
          preferredLanguage: Language
        ): Promise<boolean> => {
          try {
            const idToken = await firebaseUser.getIdToken();
            const res = await firebaseServiceLayer.signInWithGoogleIdToken(
              idToken,
              preferredLanguage
            );
            if (res.ok) {
              emitGoogleRedirectState({
                isPending: false,
                error: null,
                completedMessage: { ar: res.messageAr, en: res.messageEn },
              });
              return true;
            }
            emitGoogleRedirectState({
              isPending: false,
              error: {
                errorCode: res.errorCode || 'GOOGLE_AUTH_FAILED',
                messageAr: res.messageAr,
                messageEn: res.messageEn,
              },
              completedMessage: null,
            });
            return false;
          } catch (exchangeErr) {
            emitGoogleRedirectState({
              isPending: false,
              error: mapFirebaseGoogleAuthError(exchangeErr, host, 'redirect'),
              completedMessage: null,
            });
            return false;
          }
        };

        if (pending && status.isConfigured) {
          emitGoogleRedirectState({ isPending: true, error: null });
          const instances = getFirebaseClients();
          try {
            const redirectResult = await withTimeout(
              getRedirectResult(instances.auth),
              15_000,
              null
            );

            if (redirectResult?.user) {
              clearPendingGoogleRedirect();
              const ok = await completeFirebaseGoogleUser(
                redirectResult.user,
                pending.preferredLanguage
              );
              if (ok) return;
              const restored = await restoreBackendSession();
              if (!restored) emitAuthState(null);
              return;
            }

            // Defensive fallback if Firebase hydrated currentUser via onAuthStateChanged
            const freshUser = await waitForFreshFirebaseGoogleUser(
              instances.auth,
              pending.startedAt,
              1800
            );
            clearPendingGoogleRedirect();

            if (freshUser) {
              const ok = await completeFirebaseGoogleUser(freshUser, pending.preferredLanguage);
              if (ok) return;
            } else {
              const restored = await restoreBackendSession();
              if (restored) {
                emitGoogleRedirectState({ isPending: false, error: null });
                return;
              }
              emitGoogleRedirectState({
                isPending: false,
                error: mapFirebaseGoogleAuthError(
                  { code: 'auth/redirect-cancelled-by-user' },
                  host,
                  'redirect'
                ),
                completedMessage: null,
              });
              emitAuthState(null);
              return;
            }

            const restored = await restoreBackendSession();
            if (!restored) emitAuthState(null);
            return;
          } catch (redirectErr) {
            clearPendingGoogleRedirect();
            emitGoogleRedirectState({
              isPending: false,
              error: mapFirebaseGoogleAuthError(redirectErr, host, 'redirect'),
              completedMessage: null,
            });
            const restored = await restoreBackendSession();
            if (!restored) emitAuthState(null);
            return;
          }
        }

        // Standard load (no pending redirect marker in sessionStorage):
        // 1. Restore existing backend session first (fast path for email/password & active sessions)
        const restored = await restoreBackendSession();
        if (restored) {
          emitGoogleRedirectState({ isPending: false });
          return;
        }

        // 2. If unauthenticated, still check getRedirectResult briefly in case sessionStorage
        //    was cleared by a strict browser during the Google OAuth round-trip.
        if (status.isConfigured) {
          try {
            const instances = getFirebaseClients();
            const strayResult = await withTimeout(
              getRedirectResult(instances.auth),
              3_000,
              null
            );
            if (strayResult?.user) {
              const ok = await completeFirebaseGoogleUser(strayResult.user, 'ar');
              if (ok) return;
            }
          } catch (err) {
            emitGoogleRedirectState({
              isPending: false,
              error: mapFirebaseGoogleAuthError(err, host, 'redirect'),
              completedMessage: null,
            });
          }
        }

        emitGoogleRedirectState({ isPending: false });
        emitAuthState(null);
      })().finally(() => {
        inflightSessionRestore = null;
      });
    }

    return () => {
      authListeners.delete(callback);
    };
  },

  subscribeToUserData(
    uid: string,
    _isQaSandbox: boolean,
    callbacks: {
      onProfile: (profile: UserProfile) => void;
      onSettings?: (settings: WorkspaceSettings) => void;
      onItems: (items: RegisteredItem[]) => void;
      onGroups?: (groups: ItemGroup[]) => void;
      onSharedQrGroups?: (sharedQrGroups: SharedQrGroup[]) => void;
      onActivities: (activities: ActivityLogEntry[]) => void;
      onMessages?: (messages: FinderMessageEntry[]) => void;
      onNotifications?: (notifications: NotificationEntry[]) => void;
      onError?: (err: unknown) => void;
    }
  ): () => void {
    const sub: DataSubscriber = {
      uid,
      ...callbacks,
    };
    dataSubscribers.add(sub);

    // Immediately hydrate from cached workspace snapshot if matching uid
    if (lastWorkspaceSnapshot && lastWorkspaceSnapshot.profile.uid === uid) {
      sub.onProfile(lastWorkspaceSnapshot.profile);
      if (lastWorkspaceSnapshot.settings) sub.onSettings?.(lastWorkspaceSnapshot.settings);
      sub.onItems(lastWorkspaceSnapshot.items);
      sub.onGroups?.(Array.isArray(lastWorkspaceSnapshot.groups) ? lastWorkspaceSnapshot.groups : []);
      sub.onSharedQrGroups?.(
        Array.isArray(lastWorkspaceSnapshot.sharedQrGroups)
          ? lastWorkspaceSnapshot.sharedQrGroups
          : []
      );
      sub.onActivities(lastWorkspaceSnapshot.activities);
      sub.onMessages?.(lastWorkspaceSnapshot.messages);
      sub.onNotifications?.(lastWorkspaceSnapshot.notifications);
    }

    void refreshWorkspaceForSubscribers();

    return () => {
      dataSubscribers.delete(sub);
    };
  },

  async refreshWorkspace(): Promise<void> {
    await refreshWorkspaceForSubscribers();
  },

  async registerWithEmail(params: {
    fullName: string;
    email: string;
    password: string;
    country?: string;
    preferredLanguage?: Language;
  }): Promise<ServiceResult<UserProfile>> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        token?: string;
        restoredExisting?: boolean;
        profile?: UserProfile;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };

      if (!res.ok || !payload.ok || !payload.token || !payload.profile) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'REGISTER_FAILED',
          messageAr: payload.messageAr || 'تعذر إنشاء الحساب.',
          messageEn: payload.messageEn || 'Could not create account.',
        };
      }

      setSessionToken(payload.token);
      emitAuthState(buildAuthUserFromProfile(payload.profile));
      await refreshWorkspaceForSubscribers();

      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.profile,
        messageAr: payload.restoredExisting
          ? 'تم التعرف على حسابك السابق واستعادة جميع أغراضك وبياناتك بنجاح!'
          : 'تم إنشاء الحساب وتفعيل الباقة المجانية (غرضان نشطان) بنجاح.',
        messageEn: payload.restoredExisting
          ? 'Existing account recognized — all your items and data have been restored!'
          : 'Account created and Free Plan (2 active items) activated.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'حدث خطأ في الاتصال بالخادم.',
        messageEn: 'Network error while connecting to server.',
      };
    }
  },

  async signInWithEmail(
    email: string,
    password: string
  ): Promise<ServiceResult<{ email: string }>> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        token?: string;
        profile?: UserProfile;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };

      if (!res.ok || !payload.ok || !payload.token || !payload.profile) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'auth/invalid-credential',
          messageAr: payload.messageAr || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
          messageEn: payload.messageEn || 'Invalid email address or password.',
        };
      }

      setSessionToken(payload.token);
      emitAuthState(buildAuthUserFromProfile(payload.profile));
      await refreshWorkspaceForSubscribers();

      return {
        ok: true,
        mode: 'firebase_live',
        data: { email: payload.profile.email },
        messageAr: 'تم تسجيل الدخول واستعادة بيانات حسابك بنجاح.',
        messageEn: 'Signed in and restored your account workspace.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'حدث خطأ في الاتصال بالخادم.',
        messageEn: 'Network error while connecting to server.',
      };
    }
  },

  async signInWithGoogleIdToken(
    idToken: string,
    preferredLanguage: Language = 'ar'
  ): Promise<ServiceResult<UserProfile>> {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken, preferredLanguage }),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        token?: string;
        isExistingUser?: boolean;
        profile?: UserProfile;
        errorCode?: string;
        pendingLinkToken?: string;
        email?: string;
        messageAr?: string;
        messageEn?: string;
      };

      if (res.status === 409 && payload.errorCode === 'LINK_ACCOUNT_REQUIRED' && payload.pendingLinkToken) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: 'LINK_ACCOUNT_REQUIRED',
          pendingLink: {
            pendingLinkToken: payload.pendingLinkToken,
            email: payload.email || '',
          },
          messageAr:
            payload.messageAr ||
            'يوجد حساب مسجل مسبقًا بهذا البريد بكلمة مرور. أدخل كلمة مرور حسابك لتأكيد الملكية وربط Google بنفس الحساب.',
          messageEn:
            payload.messageEn ||
            'An account with this email already exists using a password. Enter your password to verify ownership and link Google to the same account.',
        };
      }

      if (!res.ok || !payload.ok || !payload.token || !payload.profile) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'GOOGLE_AUTH_FAILED',
          messageAr: payload.messageAr || 'تعذر التحقق من حساب Google.',
          messageEn: payload.messageEn || 'Failed to verify Google account.',
        };
      }

      setSessionToken(payload.token);
      emitAuthState(buildAuthUserFromProfile(payload.profile));
      await refreshWorkspaceForSubscribers();

      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.profile,
        messageAr: payload.isExistingUser
          ? 'تم تسجيل الدخول عبر Google واستعادة حسابك وبياناتك بنجاح.'
          : 'تم إنشاء حسابك وتفعيله عبر Google بنجاح.',
        messageEn: payload.isExistingUser
          ? 'Signed in with Google and restored your existing account and data.'
          : 'Created and activated your account with Google.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'حدث خطأ في الاتصال بالخادم أثناء التحقق من حساب Google.',
        messageEn: 'Network error while verifying Google account with server.',
      };
    }
  },

  async getFreshGoogleIdToken(): Promise<ServiceResult<{ idToken: string; email: string }>> {
    const status = getFirebaseConfigStatus();
    if (!status.isConfigured) {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'FIREBASE_CONFIG_MISSING',
        messageAr: 'إعدادات Firebase غير مكتملة.',
        messageEn: 'Firebase configuration is incomplete.',
      };
    }
    const instances = getFirebaseClients();
    const host = typeof window !== 'undefined' ? window.location.hostname : 'preview-domain';
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const credential = await signInWithPopup(instances.auth, provider);
      const idToken = await credential.user.getIdToken(true);
      return {
        ok: true,
        mode: 'firebase_live',
        data: { idToken, email: credential.user.email || '' },
        messageAr: 'تم التحقق من هوية Google بنجاح.',
        messageEn: 'Google identity verified.',
      };
    } catch (err: unknown) {
      const mapped = mapFirebaseGoogleAuthError(err, host, 'popup');
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: mapped.errorCode,
        messageAr: mapped.messageAr,
        messageEn: mapped.messageEn,
      };
    }
  },

  async signInWithGoogle(
    preferredLanguage: Language = 'ar'
  ): Promise<ServiceResult<UserProfile>> {
    if (inFlightGoogleSignIn) {
      return inFlightGoogleSignIn;
    }

    const run = async (): Promise<ServiceResult<UserProfile>> => {
      emitGoogleRedirectState({ error: null });

      const status = getFirebaseConfigStatus();
      if (!status.isConfigured) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: 'FIREBASE_CONFIG_MISSING',
          messageAr:
            'إعدادات Firebase Google Auth غير مكتملة في ملف التكوين. يرجى مراجعة إعدادات المشروع.',
          messageEn:
            'Firebase Google Auth configuration is incomplete. Please check project settings.',
        };
      }

      const instances = getFirebaseClients();
      const host = typeof window !== 'undefined' ? window.location.hostname : 'preview-domain';
      const strategy = chooseGoogleAuthStrategy({
        location: typeof window !== 'undefined' ? window.location : null,
        isEmbeddedIframe: isEmbeddedInIframe(typeof window !== 'undefined' ? window : null),
      });

      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({ prompt: 'select_account' });

      // CRITICAL: Do NOT call `await signOut(instances.auth)` before `signInWithPopup`,
      // because awaiting an async call before opening the popup breaks the browser's
      // synchronous user-gesture requirement and causes popups to be blocked/closed.

      if (strategy === 'redirect') {
        try {
          savePendingGoogleRedirect({
            startedAt: Date.now(),
            returnPath:
              typeof window !== 'undefined' ? window.location.pathname || '/login' : '/login',
            preferredLanguage,
          });
          emitGoogleRedirectState({ isPending: true, error: null, completedMessage: null });
          await signInWithRedirect(instances.auth, provider);
          return {
            ok: true,
            mode: 'firebase_live',
            errorCode: 'REDIRECT_IN_PROGRESS',
            messageAr: 'جاري التحويل إلى Google لإتمام تسجيل الدخول...',
            messageEn: 'Redirecting to Google to complete sign-in...',
          };
        } catch (err: unknown) {
          clearPendingGoogleRedirect();
          emitGoogleRedirectState({ isPending: false });
          const mapped = mapFirebaseGoogleAuthError(err, host, 'redirect');
          return {
            ok: false,
            mode: 'firebase_live',
            errorCode: mapped.errorCode,
            messageAr: mapped.messageAr,
            messageEn: mapped.messageEn,
          };
        }
      }

      const attemptStartedAt = Date.now();
      try {
        const credential = await signInWithPopup(instances.auth, provider);
        const idToken = await credential.user.getIdToken(true);
        return await this.signInWithGoogleIdToken(idToken, preferredLanguage);
      } catch (err: unknown) {
        const code =
          err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';

        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          const recoveredUser = await waitForFreshFirebaseGoogleUser(
            instances.auth,
            attemptStartedAt,
            2500
          );
          if (recoveredUser) {
            try {
              const idToken = await recoveredUser.getIdToken(true);
              return await this.signInWithGoogleIdToken(idToken, preferredLanguage);
            } catch {
              // Fall through to mapped error
            }
          }
        }

        const mapped = mapFirebaseGoogleAuthError(err, host, 'popup');
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: mapped.errorCode,
          messageAr: mapped.messageAr,
          messageEn: mapped.messageEn,
        };
      }
    };

    inFlightGoogleSignIn = run().finally(() => {
      inFlightGoogleSignIn = null;
    });
    return inFlightGoogleSignIn;
  },

  async confirmGoogleAccountLinkWithPassword(
    pendingLinkToken: string,
    password: string
  ): Promise<ServiceResult<UserProfile>> {
    try {
      const res = await fetch('/api/auth/link/confirm-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pendingLinkToken, password }),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        token?: string;
        profile?: UserProfile;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.token || !payload.profile) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'LINK_CONFIRM_FAILED',
          messageAr: payload.messageAr || 'تعذر تأكيد كلمة المرور وربط حساب Google.',
          messageEn: payload.messageEn || 'Could not verify password and link Google account.',
        };
      }
      setSessionToken(payload.token);
      emitAuthState(buildAuthUserFromProfile(payload.profile));
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.profile,
        messageAr:
          payload.messageAr ||
          'تم التحقق من ملكية الحساب وربط Google بحسابك بنجاح دون إنشاء حساب مكرر.',
        messageEn:
          payload.messageEn ||
          'Ownership verified! Google is now linked to your existing account.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'حدث خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async setPasswordForCurrentAccount(params: {
    newPassword: string;
    currentPassword?: string;
    googleIdToken?: string;
  }): Promise<ServiceResult<UserProfile>> {
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(params),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        profile?: UserProfile;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.profile) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'SET_PASSWORD_FAILED',
          messageAr: payload.messageAr || 'تعذر تعيين أو تحديث كلمة المرور.',
          messageEn: payload.messageEn || 'Could not set or update password.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.profile,
        messageAr:
          payload.messageAr ||
          'تم حفظ كلمة المرور على حسابك بنجاح! يمكنك الآن الدخول بالبريد وكلمة المرور أو عبر Google.',
        messageEn:
          payload.messageEn ||
          'Password saved on your account! You can now sign in with Email & Password or Google.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'حدث خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async linkGoogleToCurrentAccount(
    password: string,
    idToken: string
  ): Promise<ServiceResult<UserProfile>> {
    try {
      const res = await fetch('/api/auth/link-google', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ password, idToken }),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        profile?: UserProfile;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.profile) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'LINK_GOOGLE_FAILED',
          messageAr: payload.messageAr || 'تعذر ربط حساب Google.',
          messageEn: payload.messageEn || 'Could not link Google account.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.profile,
        messageAr: payload.messageAr || 'تم ربط حساب Google بحسابك بنجاح.',
        messageEn: payload.messageEn || 'Google account linked successfully.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'حدث خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async verifyPasswordResetToken(
    token: string
  ): Promise<ServiceResult<{ maskedEmail: string }>> {
    try {
      const res = await fetch(
        `/api/auth/reset-password/verify?token=${encodeURIComponent(token)}`,
        { method: 'GET', credentials: 'include' }
      );
      const payload = (await res.json()) as {
        ok: boolean;
        maskedEmail?: string;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'RESET_TOKEN_INVALID',
          messageAr: payload.messageAr || 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية.',
          messageEn: payload.messageEn || 'This password reset link is invalid or has expired.',
        };
      }
      return {
        ok: true,
        mode: 'firebase_live',
        data: { maskedEmail: payload.maskedEmail || '' },
        messageAr: 'الرابط صالح. يمكنك تعيين كلمة مرور جديدة الآن.',
        messageEn: 'Reset link verified. You can set a new password now.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'حدث خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<ServiceResult<null>> {
    try {
      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, newPassword }),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'RESET_CONFIRM_FAILED',
          messageAr: payload.messageAr || 'تعذر إعادة تعيين كلمة المرور.',
          messageEn: payload.messageEn || 'Could not reset password.',
        };
      }
      return {
        ok: true,
        mode: 'firebase_live',
        data: null,
        messageAr:
          payload.messageAr ||
          'تم تحديث كلمة المرور بنجاح وإغلاق جميع الجلسات السابقة. يمكنك تسجيل الدخول الآن.',
        messageEn:
          payload.messageEn ||
          'Password updated and previous sessions revoked. You can sign in now.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'حدث خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async sendPasswordReset(email: string): Promise<ServiceResult<{ email: string }>> {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        email?: string;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'RESET_FAILED',
          messageAr: payload.messageAr || 'تعذر إرسال رابط استعادة كلمة المرور.',
          messageEn: payload.messageEn || 'Could not send password reset link.',
        };
      }
      return {
        ok: true,
        mode: 'firebase_live',
        data: { email: payload.email || email },
        messageAr: payload.messageAr || 'تمت معالجة طلب استعادة كلمة المرور.',
        messageEn: payload.messageEn || 'Password reset request processed.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'حدث خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async resendVerificationEmail(): Promise<ServiceResult<null>> {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
      });
      if (!res.ok) {
        return {
          ok: false,
          mode: 'firebase_live',
          messageAr: 'تعذر تحديث حالة التحقق من البريد.',
          messageEn: 'Failed to verify email.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: null,
        messageAr: 'تم تأكيد البريد الإلكتروني وتحديث حالة الحساب بنجاح.',
        messageEn: 'Email verified and account status updated.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        messageAr: 'تعذر تحديث حالة التحقق من البريد.',
        messageEn: 'Failed to verify email.',
      };
    }
  },

  async signOutUser(): Promise<void> {
    clearPendingGoogleRedirect();
    emitGoogleRedirectState({ isPending: false, error: null, completedMessage: null });
    try {
      const instances = getFirebaseClients();
      if (instances.auth?.currentUser) {
        await signOut(instances.auth).catch(() => {});
      }
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
      });
    } finally {
      setSessionToken('');
      emitAuthState(null);
    }
  },

  async createItem(
    _uid: string,
    draft: NewItemDraft,
    _currentProfile: UserProfile
  ): Promise<ServiceResult<RegisteredItem>> {
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(draft),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        item?: RegisteredItem;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.item) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'CREATE_ITEM_FAILED',
          messageAr:
            payload.messageAr ||
            'تعذر إضافة الغرض. تحقق من حد الباقة المجانية (غرضان نشطان فقط).',
          messageEn:
            payload.messageEn ||
            'Could not create item. Check your Free Plan quota (max 2 active items).',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.item,
        messageAr: 'تم حفظ الغرض وتوليد كود QR الفريد بنجاح.',
        messageEn: 'Item saved and unique QR code generated.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async createGroup(
    name: string,
    colorHex = '#0F9D8E',
    extra?: {
      description?: string;
      coverUrl?: string;
      coverSource?: ItemGroup['coverSource'];
      originalImages?: string[];
    }
  ): Promise<ServiceResult<ItemGroup>> {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ name, colorHex, ...(extra || {}) }),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        group?: ItemGroup;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.group) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'CREATE_GROUP_FAILED',
          messageAr: payload.messageAr || 'تعذر إنشاء المجموعة.',
          messageEn: payload.messageEn || 'Could not create item group.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.group,
        messageAr: 'تم إنشاء المجموعة بنجاح.',
        messageEn: 'Item group created successfully.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async updateGroup(
    groupId: string,
    updates: {
      name?: string;
      description?: string;
      colorHex?: string;
      coverUrl?: string;
      coverSource?: ItemGroup['coverSource'];
      originalImages?: string[];
    }
  ): Promise<ServiceResult<ItemGroup>> {
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}`, {
        method: 'PATCH',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        group?: ItemGroup;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.group) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'UPDATE_GROUP_FAILED',
          messageAr: payload.messageAr || 'تعذر تحديث المجموعة.',
          messageEn: payload.messageEn || 'Could not update item group.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.group,
        messageAr: 'تم تحديث المجموعة بنجاح.',
        messageEn: 'Item group updated successfully.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async deleteGroup(groupId: string): Promise<ServiceResult<null>> {
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      });
      const payload = (await res.json()) as { ok: boolean; errorCode?: string };
      if (!res.ok || !payload.ok) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'DELETE_GROUP_FAILED',
          messageAr: 'تعذر حذف المجموعة.',
          messageEn: 'Could not delete item group.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: null,
        messageAr: 'تم حذف المجموعة بنجاح مع الإبقاء على أغراضك.',
        messageEn: 'Group deleted safely while keeping all your items.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async updateItemDetails(
    _uid: string,
    existingItem: RegisteredItem,
    updates: {
      name: string;
      description: string;
      category: ItemCategory;
      groupId?: string | null;
      imageUrl: string;
      coverUrl?: string;
      coverSource?: RegisteredItem['coverSource'];
      originalImages?: string[];
      selectedContactMethodIds?: string[];
      status: ItemStatus;
      recoveryInstructions: string;
      city: string;
      designId: string;
      contactChannels: RegisteredItem['contactChannels'];
      privacySettings?: Partial<ItemPrivacySettings>;
    },
    _currentProfile: UserProfile
  ): Promise<ServiceResult<RegisteredItem>> {
    try {
      const res = await fetch(`/api/items/${encodeURIComponent(existingItem.id)}`, {
        method: 'PATCH',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        item?: RegisteredItem;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.item) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'UPDATE_FAILED',
          messageAr: payload.messageAr || 'تعذر تحديث بيانات الغرض.',
          messageEn: payload.messageEn || 'Could not update item details.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.item,
        messageAr: 'تم حفظ تعديلات الغرض بنجاح مع بقاء رابط QR ثابتًا.',
        messageEn: 'Item updated successfully with immutable QR link.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async archiveItem(
    _uid: string,
    item: RegisteredItem,
    _currentProfile: UserProfile
  ): Promise<ServiceResult<null>> {
    try {
      const res = await fetch(`/api/items/${encodeURIComponent(item.id)}/archive`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
      });
      const payload = (await res.json()) as {
        ok: boolean;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'ARCHIVE_FAILED',
          messageAr: payload.messageAr || 'تعذر أرشفة الغرض.',
          messageEn: payload.messageEn || 'Could not archive item.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: null,
        messageAr:
          'تمت أرشفة الغرض بنجاح وتفريغ خانة ضمن حد الباقة المجانية (الأغراض المؤرشفة لا تستهلك الحد).',
        messageEn:
          'Item archived and Free Plan active slot freed (archived items do not count toward quota).',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async reactivateItem(
    _uid: string,
    item: RegisteredItem,
    _currentProfile: UserProfile
  ): Promise<ServiceResult<null>> {
    try {
      const res = await fetch(`/api/items/${encodeURIComponent(item.id)}/reactivate`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
      });
      const payload = (await res.json()) as {
        ok: boolean;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'QUOTA_LIMIT_REACHED',
          messageAr:
            payload.messageAr ||
            'لا يمكن إعادة تفعيل الغرض لأنك وصلت إلى الحد الأقصى للباقة المجانية (غرضان نشطان).',
          messageEn:
            payload.messageEn ||
            'Cannot reactivate item: Free Plan limit of 2 active items reached.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: null,
        messageAr: 'تمت إعادة تفعيل الغرض بنجاح.',
        messageEn: 'Item reactivated successfully.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async deleteItem(
    _uid: string,
    item: RegisteredItem,
    _currentProfile: UserProfile
  ): Promise<ServiceResult<{ deletedId: string }>> {
    try {
      const res = await fetch(`/api/items/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      });
      const payload = (await res.json()) as {
        ok: boolean;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'DELETE_FAILED',
          messageAr: payload.messageAr || 'تعذر حذف الغرض.',
          messageEn: payload.messageEn || 'Could not delete item.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: { deletedId: item.id },
        messageAr: 'تم حذف الغرض نهائيًا بنجاح.',
        messageEn: 'Item permanently deleted.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async updateProfileRecord(profile: UserProfile): Promise<ServiceResult<UserProfile>> {
    try {
      const safeBody = {
        displayName: profile.displayName,
        country: profile.country,
        preferredLanguage: profile.preferredLanguage,
        photoURL: profile.photoURL,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        telegram: profile.telegram,
      };
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(safeBody),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        profile?: UserProfile;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.profile) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'PROFILE_UPDATE_FAILED',
          messageAr: payload.messageAr || 'تعذر حفظ تعديلات الملف الشخصي.',
          messageEn: payload.messageEn || 'Could not save profile changes.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.profile,
        messageAr: 'تم تحديث بيانات الملف الشخصي بنجاح.',
        messageEn: 'Profile updated successfully.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async updateSettingsRecord(
    settings: WorkspaceSettings
  ): Promise<ServiceResult<WorkspaceSettings>> {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        settings?: WorkspaceSettings;
      };
      if (!res.ok || !payload.ok || !payload.settings) {
        return {
          ok: false,
          mode: 'firebase_live',
          messageAr: 'تعذر حفظ تفضيلات الخصوصية على الخادم.',
          messageEn: 'Could not persist privacy preferences.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.settings,
        messageAr: 'تم حفظ إعدادات الخصوصية والتنبيهات بنجاح.',
        messageEn: 'Saved privacy and alert preferences.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  // ---------------------------------------------------------------------------
  // PHASE 3: PUBLIC QR RECOVERY, INTERNAL MESSAGING & FOUND REPORTS
  // ---------------------------------------------------------------------------
  async fetchPublicQrPayload(codeOrId: string): Promise<ServiceResult<FinderPublicPayload>> {
    try {
      const res = await fetch(`/api/public/qr/${encodeURIComponent(codeOrId)}`);
      const data = (await res.json()) as {
        ok: boolean;
        payload?: FinderPublicPayload;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !data.ok || !data.payload) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: data.errorCode || 'QR_NOT_FOUND',
          messageAr: data.messageAr || 'لم يتم العثور على غرض مرتبط بهذا الكود.',
          messageEn: data.messageEn || 'No registered item found for this QR code.',
        };
      }
      return {
        ok: true,
        mode: 'firebase_live',
        data: data.payload,
        messageAr: 'تم جلب بيانات صفحة الاستعادة بنجاح.',
        messageEn: 'Fetched public recovery page payload.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'تعذر الاتصال بالخادم.',
        messageEn: 'Failed to connect to server.',
      };
    }
  },

  async submitPublicFinderMessage(
    codeOrId: string,
    input: {
      message: string;
      senderContact?: string;
      senderName?: string;
      honeypot?: string;
    }
  ): Promise<ServiceResult<FinderMessageEntry>> {
    try {
      const res = await fetch(`/api/public/qr/${encodeURIComponent(codeOrId)}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as {
        ok: boolean;
        entry?: FinderMessageEntry;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !data.ok || !data.entry) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: data.errorCode || 'MESSAGE_FAILED',
          messageAr: data.messageAr || 'تعذر إرسال الرسالة.',
          messageEn: data.messageEn || 'Could not send message.',
        };
      }
      if (currentAuthUser) {
        await refreshWorkspaceForSubscribers();
      }
      return {
        ok: true,
        mode: 'firebase_live',
        data: data.entry,
        messageAr: data.messageAr || 'تم إرسال رسالتك إلى صاحب الغرض بنجاح!',
        messageEn: data.messageEn || 'Your message has been delivered to the item owner!',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'حدث خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async submitPublicFoundReport(
    codeOrId: string
  ): Promise<ServiceResult<{ reportId: string; welcomeAr: string; welcomeEn: string }>> {
    try {
      const res = await fetch(`/api/public/qr/${encodeURIComponent(codeOrId)}/found-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = (await res.json()) as {
        ok: boolean;
        reportId?: string;
        welcomeAr?: string;
        welcomeEn?: string;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !data.ok || !data.reportId) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: data.errorCode || 'REPORT_FAILED',
          messageAr: data.messageAr || 'تم تسجيل بلاغ العثور مسبقًا.',
          messageEn: data.messageEn || 'Found report was already submitted.',
        };
      }
      if (currentAuthUser) {
        await refreshWorkspaceForSubscribers();
      }
      return {
        ok: true,
        mode: 'firebase_live',
        data: {
          reportId: data.reportId,
          welcomeAr: data.welcomeAr || 'شكرًا لأمانتك! تم إشعار صاحب الغرض فورًا.',
          welcomeEn: data.welcomeEn || 'Thank you! The item owner has been notified immediately.',
        },
        messageAr: data.welcomeAr || 'تم تسجيل بلاغ العثور وإشعار صاحب الغرض.',
        messageEn: data.welcomeEn || 'Found report recorded and owner notified.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'حدث خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async updateFinderMessageStatus(
    messageId: string,
    status: FinderMessageStatus
  ): Promise<ServiceResult<FinderMessageEntry>> {
    try {
      const res = await fetch(`/api/messages/${encodeURIComponent(messageId)}`, {
        method: 'PATCH',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { ok: boolean; message?: FinderMessageEntry };
      if (res.ok && data.ok && data.message) {
        await refreshWorkspaceForSubscribers();
        return {
          ok: true,
          mode: 'firebase_live',
          data: data.message,
          messageAr: 'تم تحديث حالة الرسالة.',
          messageEn: 'Message status updated.',
        };
      }
      return {
        ok: false,
        mode: 'firebase_live',
        messageAr: 'تعذر تحديث حالة الرسالة.',
        messageEn: 'Failed to update message status.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        messageAr: 'خطأ في الاتصال.',
        messageEn: 'Network error.',
      };
    }
  },

  async markNotificationReadOnServer(notifId: string): Promise<void> {
    await fetch(`/api/notifications/${encodeURIComponent(notifId)}/read`, {
      method: 'PATCH',
      headers: authHeaders(),
      credentials: 'include',
    });
    await refreshWorkspaceForSubscribers();
  },

  async markAllNotificationsReadOnServer(): Promise<void> {
    await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
    });
    await refreshWorkspaceForSubscribers();
  },

  async clearNotificationsOnServer(): Promise<void> {
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: authHeaders(),
      credentials: 'include',
    });
    await refreshWorkspaceForSubscribers();
  },

  // ---------------------------------------------------------------------------
  // INDEPENDENT SHARED QR GROUPS (مجموعات QR المشترك)
  // ---------------------------------------------------------------------------
  async createSharedQrGroup(input: {
    name: string;
    description?: string;
    items?: Array<{ itemId: string; isVisible?: boolean }>;
    coverUrl?: string;
    coverSource?: SharedQrGroup['coverSource'];
    originalImages?: string[];
  }): Promise<ServiceResult<SharedQrGroup>> {
    try {
      const res = await fetch('/api/shared-qr-groups', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(input),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        sharedQrGroup?: SharedQrGroup;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.sharedQrGroup) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'CREATE_SHARED_GROUP_FAILED',
          messageAr: payload.messageAr || 'تعذر إنشاء مجموعة QR المشترك.',
          messageEn: payload.messageEn || 'Could not create shared QR group.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.sharedQrGroup,
        messageAr: 'تم إنشاء مجموعة QR المشترك وتوليد رمزها الموحّد بنجاح.',
        messageEn: 'Shared QR group created and unique shared code generated.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async updateSharedQrGroup(
    groupId: string,
    updates: {
      name?: string;
      description?: string;
      isActive?: boolean;
      items?: Array<{ itemId: string; isVisible?: boolean }>;
      coverUrl?: string;
      coverSource?: SharedQrGroup['coverSource'];
      originalImages?: string[];
    }
  ): Promise<ServiceResult<SharedQrGroup>> {
    try {
      const res = await fetch(`/api/shared-qr-groups/${encodeURIComponent(groupId)}`, {
        method: 'PATCH',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        sharedQrGroup?: SharedQrGroup;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.sharedQrGroup) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'UPDATE_SHARED_GROUP_FAILED',
          messageAr: payload.messageAr || 'تعذر تحديث مجموعة QR المشترك.',
          messageEn: payload.messageEn || 'Could not update shared QR group.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.sharedQrGroup,
        messageAr: 'تم تحديث مجموعة QR المشترك مع الحفاظ على ثبات رمز QR.',
        messageEn: 'Shared QR group updated while keeping the shared QR code unchanged.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async addItemToSharedQrGroup(
    groupId: string,
    itemId: string,
    isVisible = true
  ): Promise<ServiceResult<SharedQrGroup>> {
    try {
      const res = await fetch(`/api/shared-qr-groups/${encodeURIComponent(groupId)}/items`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ itemId, isVisible }),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        sharedQrGroup?: SharedQrGroup;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.sharedQrGroup) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'ADD_SHARED_ITEM_FAILED',
          messageAr: payload.messageAr || 'تعذر ربط الغرض بمجموعة QR المشترك.',
          messageEn: payload.messageEn || 'Could not link item to shared QR group.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.sharedQrGroup,
        messageAr:
          'تم ربط الغرض بمجموعة QR المشترك وإيقاف رمزه الفردي مؤقتًا منعًا لأي تعارض (دون حذف بياناته).',
        messageEn:
          'Item linked to shared QR group; its individual QR is now paused to prevent conflict (data preserved).',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async setSharedQrGroupItemVisibility(
    groupId: string,
    itemId: string,
    isVisible: boolean
  ): Promise<ServiceResult<SharedQrGroup>> {
    try {
      const res = await fetch(
        `/api/shared-qr-groups/${encodeURIComponent(groupId)}/items/${encodeURIComponent(itemId)}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          credentials: 'include',
          body: JSON.stringify({ isVisible }),
        }
      );
      const payload = (await res.json()) as {
        ok: boolean;
        sharedQrGroup?: SharedQrGroup;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.sharedQrGroup) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'VISIBILITY_UPDATE_FAILED',
          messageAr: payload.messageAr || 'تعذر تحديث حالة ظهور الغرض.',
          messageEn: payload.messageEn || 'Could not update item visibility.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.sharedQrGroup,
        messageAr: isVisible
          ? 'أصبح الغرض ظاهرًا في صفحة QR المشتركة.'
          : 'تم إخفاء الغرض من صفحة QR المشتركة (يظل مرتبطًا بالمجموعة).',
        messageEn: isVisible
          ? 'Item is now visible on the shared QR page.'
          : 'Item hidden from the shared QR page (remains linked to this group).',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async removeItemFromSharedQrGroup(
    groupId: string,
    itemId: string
  ): Promise<ServiceResult<SharedQrGroup>> {
    try {
      const res = await fetch(
        `/api/shared-qr-groups/${encodeURIComponent(groupId)}/items/${encodeURIComponent(itemId)}`,
        {
          method: 'DELETE',
          headers: authHeaders(),
          credentials: 'include',
        }
      );
      const payload = (await res.json()) as {
        ok: boolean;
        sharedQrGroup?: SharedQrGroup;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.sharedQrGroup) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'REMOVE_SHARED_ITEM_FAILED',
          messageAr: payload.messageAr || 'تعذر إزالة الغرض من المجموعة.',
          messageEn: payload.messageEn || 'Could not remove item from shared QR group.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.sharedQrGroup,
        messageAr:
          'تم فصل الغرض من مجموعة QR المشترك وإعادة تفعيل رمزه الفردي الأصلي بنجاح.',
        messageEn:
          'Item unlinked from shared QR group and its original individual QR has been restored.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async restoreItemIndividualQr(itemId: string): Promise<ServiceResult<RegisteredItem>> {
    try {
      const res = await fetch(
        `/api/items/${encodeURIComponent(itemId)}/restore-individual-qr`,
        {
          method: 'POST',
          headers: authHeaders(),
          credentials: 'include',
        }
      );
      const payload = (await res.json()) as {
        ok: boolean;
        item?: RegisteredItem;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok || !payload.item) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'RESTORE_INDIVIDUAL_QR_FAILED',
          messageAr: payload.messageAr || 'تعذر إعادة تفعيل رمز QR الفردي.',
          messageEn: payload.messageEn || 'Could not restore individual QR code.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: payload.item,
        messageAr:
          payload.messageAr || 'تمت إعادة تفعيل رمز QR الفردي الأصلي للغرض بنجاح.',
        messageEn:
          payload.messageEn || 'Original individual QR code has been restored for this item.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async deleteSharedQrGroup(
    groupId: string,
    restoreIndividual = false
  ): Promise<ServiceResult<{ affectedItemIds: string[] }>> {
    try {
      const qs = restoreIndividual ? '?restoreIndividual=true' : '';
      const res = await fetch(
        `/api/shared-qr-groups/${encodeURIComponent(groupId)}${qs}`,
        {
          method: 'DELETE',
          headers: authHeaders(),
          credentials: 'include',
        }
      );
      const payload = (await res.json()) as {
        ok: boolean;
        affectedItemIds?: string[];
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !payload.ok) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: payload.errorCode || 'DELETE_SHARED_GROUP_FAILED',
          messageAr: payload.messageAr || 'تعذر حذف مجموعة QR المشترك.',
          messageEn: payload.messageEn || 'Could not delete shared QR group.',
        };
      }
      await refreshWorkspaceForSubscribers();
      return {
        ok: true,
        mode: 'firebase_live',
        data: { affectedItemIds: payload.affectedItemIds || [] },
        messageAr: restoreIndividual
          ? 'تم حذف مجموعة QR المشترك وإعادة تفعيل أكواد QR الفردية الأصلية لجميع الأغراض.'
          : 'تم حذف مجموعة QR المشترك مع الحفاظ على جميع أغراضك (بدون QR نشط حتى تختار إعادة تفعيل QR الفردي أو ربطها بمجموعة جديدة).',
        messageEn: restoreIndividual
          ? 'Shared QR group deleted and original individual QR codes restored for all linked items.'
          : 'Shared QR group deleted safely; all items are preserved as unassigned until you restore individual QR or link a new group.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async fetchPublicSharedQrGroup(
    shareCode: string,
    options?: { preview?: boolean }
  ): Promise<ServiceResult<SharedQrPublicPayload>> {
    try {
      const qs = options?.preview ? '?preview=1' : '';
      const res = await fetch(`/api/public/shared-qr/${encodeURIComponent(shareCode)}${qs}`);
      const data = (await res.json()) as {
        ok: boolean;
        payload?: SharedQrPublicPayload;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !data.ok || !data.payload) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: data.errorCode || 'SHARED_QR_NOT_FOUND',
          messageAr: data.messageAr || 'لم يتم العثور على مجموعة QR المشترك المطلوبة.',
          messageEn: data.messageEn || 'Shared QR group was not found.',
        };
      }
      return {
        ok: true,
        mode: 'firebase_live',
        data: data.payload,
        messageAr: 'تم جلب بيانات صفحة الاسترداد المشتركة.',
        messageEn: 'Loaded shared QR recovery page.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'تعذر الاتصال بالخادم.',
        messageEn: 'Failed to connect to server.',
      };
    }
  },

  async submitPublicSharedQrMessage(
    shareCode: string,
    itemId: string,
    input: {
      message: string;
      senderContact?: string;
      senderName?: string;
      honeypot?: string;
    }
  ): Promise<ServiceResult<FinderMessageEntry>> {
    try {
      const res = await fetch(
        `/api/public/shared-qr/${encodeURIComponent(shareCode)}/items/${encodeURIComponent(itemId)}/message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      const data = (await res.json()) as {
        ok: boolean;
        entry?: FinderMessageEntry;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !data.ok || !data.entry) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: data.errorCode || 'MESSAGE_FAILED',
          messageAr: data.messageAr || 'تعذر إرسال الرسالة.',
          messageEn: data.messageEn || 'Could not send message.',
        };
      }
      if (currentAuthUser) {
        await refreshWorkspaceForSubscribers();
      }
      return {
        ok: true,
        mode: 'firebase_live',
        data: data.entry,
        messageAr: data.messageAr || 'تم إرسال رسالتك إلى صاحب الغرض بنجاح!',
        messageEn: data.messageEn || 'Your message has been delivered to the item owner!',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'حدث خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },

  async submitPublicSharedQrFoundReport(
    shareCode: string,
    itemId: string
  ): Promise<ServiceResult<{ reportId: string; welcomeAr: string; welcomeEn: string }>> {
    try {
      const res = await fetch(
        `/api/public/shared-qr/${encodeURIComponent(shareCode)}/items/${encodeURIComponent(itemId)}/found-report`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const data = (await res.json()) as {
        ok: boolean;
        reportId?: string;
        welcomeAr?: string;
        welcomeEn?: string;
        errorCode?: string;
        messageAr?: string;
        messageEn?: string;
      };
      if (!res.ok || !data.ok || !data.reportId) {
        return {
          ok: false,
          mode: 'firebase_live',
          errorCode: data.errorCode || 'REPORT_FAILED',
          messageAr: data.messageAr || 'تعذر تسجيل بلاغ العثور.',
          messageEn: data.messageEn || 'Could not record found report.',
        };
      }
      if (currentAuthUser) {
        await refreshWorkspaceForSubscribers();
      }
      return {
        ok: true,
        mode: 'firebase_live',
        data: {
          reportId: data.reportId,
          welcomeAr: data.welcomeAr || 'شكرًا لأمانتك! تم إشعار صاحب الغرض فورًا.',
          welcomeEn: data.welcomeEn || 'Thank you! The item owner has been notified immediately.',
        },
        messageAr: data.welcomeAr || 'تم تسجيل بلاغ العثور وإشعار صاحب الغرض.',
        messageEn: data.welcomeEn || 'Found report recorded and owner notified.',
      };
    } catch {
      return {
        ok: false,
        mode: 'firebase_live',
        errorCode: 'NETWORK_ERROR',
        messageAr: 'حدث خطأ في الاتصال بالخادم.',
        messageEn: 'Network error.',
      };
    }
  },
};
