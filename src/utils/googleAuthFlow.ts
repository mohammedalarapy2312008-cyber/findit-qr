import { Language } from '../types/domain';

export type GoogleAuthStrategy = 'redirect' | 'popup';

export interface LocationLike {
  protocol?: string;
  hostname?: string;
  host?: string;
  origin?: string;
  pathname?: string;
}

export interface PendingGoogleRedirectState {
  startedAt: number;
  returnPath: string;
  preferredLanguage: Language;
}

export interface MappedGoogleAuthError {
  errorCode: string;
  messageAr: string;
  messageEn: string;
}

export const PENDING_GOOGLE_REDIRECT_STORAGE_KEY = 'finditqr_google_redirect_state';
export const PENDING_GOOGLE_REDIRECT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Determines whether the current HTTPS origin can safely serve as Firebase Auth's
 * same-origin authDomain by proxying `/__/auth/*` and `/__/firebase/init.json`.
 *
 * Local HTTP origins (localhost / 127.0.0.1) intentionally return false because
 * Google OAuth rejects unregistered `http://localhost:.../\_\_/auth/handler` URIs.
 */
export function shouldUseSameOriginAuthProxy(
  loc: LocationLike | null | undefined
): boolean {
  if (!loc || loc.protocol !== 'https:') return false;
  const host = (loc.hostname || '').trim().toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    return false;
  }
  return (
    host.endsWith('.run.app') ||
    host.endsWith('.firebaseapp.com') ||
    host.endsWith('.web.app') ||
    host.endsWith('.ai.studio')
  );
}

/**
 * Resolves the effective Firebase `authDomain`.
 * Uses the canonical `configuredAuthDomain` (`*.firebaseapp.com`) by default so
 * `signInWithPopup` works reliably on AI Studio preview/Cloud Run hosts whose
 * JavaScript origins are allowlisted without requiring manual OAuth redirect URI
 * registration for every ephemeral `.run.app` hostname.
 */
export function resolveFirebaseAuthDomain(
  _loc: LocationLike | null | undefined,
  configuredAuthDomain: string
): string {
  return configuredAuthDomain;
}

/**
 * Safely detects if the app is rendered inside an iframe (e.g. AI Studio preview pane).
 * Google blocks loading `accounts.google.com` inside iframes (`X-Frame-Options: DENY`),
 * so top-level navigation (`signInWithRedirect`) must only run when NOT embedded.
 */
export function isEmbeddedInIframe(
  win: { self?: unknown; top?: unknown } | null | undefined
): boolean {
  if (!win) return false;
  try {
    return win.self !== win.top;
  } catch {
    // Accessing cross-origin window.top throws SecurityError -> definitely inside an iframe.
    return true;
  }
}

/**
 * Chooses the most reliable Google Auth strategy for the current runtime environment.
 * Always prefers `popup` with canonical Firebase `authDomain` so it works inside both
 * AI Studio iframes, top-level `.run.app` preview URLs, and localhost without hitting
 * unregistered redirect_uri errors or infinite redirect loops.
 */
export function chooseGoogleAuthStrategy(_params: {
  location: LocationLike | null | undefined;
  isEmbeddedIframe: boolean;
}): GoogleAuthStrategy {
  return 'popup';
}

export function isPendingGoogleRedirectFresh(
  state: PendingGoogleRedirectState | null | undefined,
  nowMs = Date.now(),
  ttlMs = PENDING_GOOGLE_REDIRECT_TTL_MS
): boolean {
  if (!state || typeof state.startedAt !== 'number' || !Number.isFinite(state.startedAt)) {
    return false;
  }
  const age = nowMs - state.startedAt;
  return age >= -10_000 && age <= ttlMs;
}

export function savePendingGoogleRedirect(
  state: PendingGoogleRedirectState,
  storage?: Pick<Storage, 'setItem'> | null
): void {
  const target =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.sessionStorage
      : null;
  if (!target) return;
  try {
    target.setItem(PENDING_GOOGLE_REDIRECT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore restricted storage environments gracefully
  }
}

export function readPendingGoogleRedirect(
  storage?: Pick<Storage, 'getItem' | 'removeItem'> | null,
  nowMs = Date.now()
): PendingGoogleRedirectState | null {
  const target =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.sessionStorage
      : null;
  if (!target) return null;
  try {
    const raw = target.getItem(PENDING_GOOGLE_REDIRECT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingGoogleRedirectState>;
    if (
      typeof parsed.startedAt !== 'number' ||
      typeof parsed.returnPath !== 'string'
    ) {
      target.removeItem(PENDING_GOOGLE_REDIRECT_STORAGE_KEY);
      return null;
    }
    const normalized: PendingGoogleRedirectState = {
      startedAt: parsed.startedAt,
      returnPath: parsed.returnPath,
      preferredLanguage: parsed.preferredLanguage === 'en' ? 'en' : 'ar',
    };
    if (!isPendingGoogleRedirectFresh(normalized, nowMs)) {
      target.removeItem(PENDING_GOOGLE_REDIRECT_STORAGE_KEY);
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

export function clearPendingGoogleRedirect(
  storage?: Pick<Storage, 'removeItem'> | null
): void {
  const target =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.sessionStorage
      : null;
  if (!target) return;
  try {
    target.removeItem(PENDING_GOOGLE_REDIRECT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Checks whether a Firebase client `User`'s `metadata.lastSignInTime` was genuinely
 * produced by the current sign-in attempt (allowing a small clock-skew buffer) so we
 * never accidentally authenticate a cancelled attempt using a stale cached Firebase user.
 */
export function isFreshFirebaseSignIn(
  lastSignInTime: string | undefined | null,
  attemptStartedAtMs: number,
  clockSkewBufferMs = 20_000
): boolean {
  if (!lastSignInTime) return false;
  const signedInMs = Date.parse(lastSignInTime);
  if (!Number.isFinite(signedInMs)) return false;
  return signedInMs >= attemptStartedAtMs - clockSkewBufferMs;
}

export function mapFirebaseGoogleAuthError(
  err: unknown,
  host: string,
  strategy: GoogleAuthStrategy
): MappedGoogleAuthError {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';

  if (code === 'auth/unauthorized-domain') {
    return {
      errorCode: 'auth/unauthorized-domain',
      messageAr: `نطاق المعاينة الحالي (${host}) غير مضاف بعد في قائمة النطاقات المصرح بها (Authorized domains) داخل إعدادات Firebase Authentication للمشروع. يرجى إضافة النطاق (${host}) في Firebase Console > Authentication > Settings > Authorized domains، أو تسجيل الدخول بالبريد وكلمة المرور.`,
      messageEn: `Current domain (${host}) is not yet listed in Firebase Authentication Authorized Domains. Add (${host}) under Firebase Console > Authentication > Settings > Authorized domains, or sign in with Email & Password.`,
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      errorCode: 'auth/popup-blocked',
      messageAr:
        'قام المتصفح بحظر نافذة Google المنبثقة. يرجى السماح بالنوافذ المنبثقة أو فتح التطبيق في تبويب مستقل والمحاولة مجددًا.',
      messageEn:
        'The browser blocked the Google Sign-In popup. Please allow popups or open the app in a dedicated browser tab and try again.',
    };
  }

  if (code === 'auth/redirect-cancelled-by-user') {
    return {
      errorCode: 'auth/redirect-cancelled-by-user',
      messageAr: 'تم إلغاء تسجيل الدخول بحساب Google قبل إتمامه. يمكنك المحاولة مرة أخرى في أي وقت.',
      messageEn: 'Google Sign-In was cancelled before completing. You can try again anytime.',
    };
  }

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return {
      errorCode: 'auth/popup-closed-by-user',
      messageAr:
        strategy === 'popup'
          ? 'لم تكتمل جلسة نافذة Google المنبثقة أو تم إغلاقها قبل استلام التصريح. إذا كنت تستخدم المعاينة المضمّنة أو متصفح الهاتف، افتح التطبيق في تبويب مستقل لاستخدام التحويل المباشر الآمن.'
          : 'تم إلغاء نافذة تسجيل الدخول بحساب Google قبل إتمام العملية.',
      messageEn:
        strategy === 'popup'
          ? 'The Google Sign-In popup closed before authentication completed. If you are inside an embedded preview or mobile browser, open the app in a full browser tab to use direct Google Redirect sign-in.'
          : 'Google Sign-In was closed before completing authentication.',
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      errorCode: 'auth/operation-not-allowed',
      messageAr:
        'مزود تسجيل الدخول عبر Google غير مفعل في Firebase Console. يرجى تفعيل Google في Authentication > Sign-in method.',
      messageEn:
        'Google Sign-In provider is not enabled in Firebase Console (Authentication > Sign-in method).',
    };
  }

  if (code === 'auth/web-storage-unsupported') {
    return {
      errorCode: 'auth/web-storage-unsupported',
      messageAr:
        'المتصفح يعطّل تخزين الجلسات المطلوب لإتمام تسجيل الدخول عبر Google. يرجى تفعيل ملفات تعريف الارتباط والتخزين المؤقت ثم المحاولة مجددًا.',
      messageEn:
        'Browser storage required for Google Sign-In is disabled. Please enable cookies/web storage and try again.',
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      errorCode: 'auth/network-request-failed',
      messageAr: 'تعذر الاتصال بخوادم Google للمصادقة. يرجى التحقق من اتصال الإنترنت والمحاولة مجددًا.',
      messageEn: 'Network error while contacting Google authentication servers. Please check your connection and try again.',
    };
  }

  return {
    errorCode: code || 'GOOGLE_AUTH_ERROR',
    messageAr:
      'تعذر إتمام تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى أو استخدام البريد الإلكتروني وكلمة المرور.',
    messageEn:
      'Could not complete Google Sign-In. Please try again or sign in with Email & Password.',
  };
}
