import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Globe,
  KeyRound,
  Lock,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminApi, AdminBootstrapStatusResponse, ApiRequestError } from '../../services/adminApi';
import { firebaseServiceLayer } from '../../services/firebase/services';
import { FindItLogo } from '../../components/brand/FindItLogo';

export const AdminReauthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const { lang, showToast, profile } = useApp();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const hasPassword = profile.hasPassword !== false;
  const hasGoogle = Boolean(profile.hasGoogle);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await adminApi.reauthAdmin({ password });
      showToast(
        'success',
        lang === 'ar' ? 'تم تأكيد الهوية' : 'Identity Re-Verified',
        lang === 'ar'
          ? `تم فتح نافذة العمليات الحساسة لمدة ${res.reauthWindowMinutes} دقيقة.`
          : `Sensitive action window unlocked for ${res.reauthWindowMinutes} minutes.`
      );
      setPassword('');
      onSuccess();
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : lang === 'ar'
          ? 'كلمة المرور غير صحيحة.'
          : 'Invalid password.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleReauth = async () => {
    setErrorMsg('');
    setGoogleSubmitting(true);
    try {
      const tokenRes = await firebaseServiceLayer.getFreshGoogleIdToken();
      if (!tokenRes.ok || !tokenRes.data?.idToken) {
        setErrorMsg(lang === 'ar' ? tokenRes.messageAr : tokenRes.messageEn);
        return;
      }
      const res = await adminApi.reauthAdmin({ googleIdToken: tokenRes.data.idToken });
      showToast(
        'success',
        lang === 'ar' ? 'تم تأكيد الهوية عبر Google' : 'Identity Re-Verified via Google',
        lang === 'ar'
          ? `تم فتح نافذة العمليات الحساسة لمدة ${res.reauthWindowMinutes} دقيقة.`
          : `Sensitive action window unlocked for ${res.reauthWindowMinutes} minutes.`
      );
      onSuccess();
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : lang === 'ar'
          ? 'تعذر إعادة التحقق عبر Google.'
          : 'Google re-verification failed.';
      setErrorMsg(msg);
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#17243A] dark:text-white">
              {lang === 'ar' ? 'إعادة تأكيد الهوية للعمليات الحساسة' : 'Sensitive Action Re-Authentication'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {lang === 'ar'
                ? 'لإتمام هذا الإجراء الحساس (المالية، الباقات، الصلاحيات، الحذف، أو التعليق)، يرجى إعادة التحقق من هويتك.'
                : 'To execute this sensitive operation (finance, plans, RBAC, deletion, or suspension), re-verify your identity.'}
            </p>
          </div>
        </div>

        {(hasGoogle || !hasPassword) && (
          <div className="space-y-2">
            <button
              type="button"
              disabled={googleSubmitting || submitting}
              onClick={() => void handleGoogleReauth()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#19B5A5] hover:bg-teal-500 disabled:opacity-60 text-[#070D17] text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
            >
              {googleSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
              <span>
                {lang === 'ar'
                  ? 'إعادة التحقق الفوري عبر حساب Google'
                  : 'Re-Verify Instantly with Google'}
              </span>
            </button>
            {!hasPassword && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                {lang === 'ar'
                  ? 'حسابك يعتمد حاليًا على Google. يمكنك أيضًا تعيين كلمة مرور إدارية من صفحة الملف الشخصي.'
                  : 'Your account currently uses Google Sign-In. You can also set a password in Profile Settings.'}
              </p>
            )}
          </div>
        )}

        {hasPassword && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {hasGoogle && (
              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                <span className="shrink mx-3 text-[11px] text-slate-400">
                  {lang === 'ar' ? 'أو بكلمة المرور' : 'OR WITH PASSWORD'}
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
              </label>
              <input
                type="password"
                required
                autoFocus={!hasGoogle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 text-sm text-[#17243A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={submitting || googleSubmitting || !password}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'ar' ? 'تأكيد والمتابعة' : 'Verify & Continue'}</span>
              </button>
            </div>
          </form>
        )}

        {!hasPassword && (
          <>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-semibold">
                {errorMsg}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const AdminAuthGate: React.FC<{
  status: AdminBootstrapStatusResponse | null;
  loading: boolean;
  onRefreshStatus: () => Promise<void>;
}> = ({ status, loading, onRefreshStatus }) => {
  const {
    lang,
    navigate,
    loginWithEmail,
    loginWithGoogle,
    logoutUser,
    showToast,
    authUser,
    refreshWorkspaceAll,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [claimPassword, setClaimPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [gateError, setGateError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError('');
    setBusy(true);
    try {
      const res = await loginWithEmail(email.trim(), password);
      if (!res.ok) {
        setGateError(lang === 'ar' ? res.messageAr : res.messageEn);
      } else {
        await onRefreshStatus();
        navigate('admin');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setGateError('');
    setBusy(true);
    try {
      const res = await loginWithGoogle();
      if (res.errorCode === 'REDIRECT_IN_PROGRESS') return;
      if (!res.ok) {
        setGateError(lang === 'ar' ? res.messageAr : res.messageEn);
      } else {
        await onRefreshStatus();
        navigate('admin');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError('');
    setBusy(true);
    try {
      const res = await adminApi.bootstrapSuperAdmin(claimPassword);
      showToast(
        'success',
        lang === 'ar' ? 'تم تفعيل المدير الرئيسي' : 'Super Admin Activated',
        lang === 'ar' ? res.messageAr : res.messageEn
      );
      setClaimPassword('');
      await refreshWorkspaceAll();
      await onRefreshStatus();
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : lang === 'ar'
          ? 'تعذر تفعيل الصلاحية.'
          : 'Bootstrap failed.';
      setGateError(msg);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070D17] text-white">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Loader2 className="w-5 h-5 text-[#19B5A5] animate-spin" />
          <span>
            {lang === 'ar'
              ? 'جاري التحقق من صلاحيات لوحة الإدارة...'
              : 'Verifying Super Admin authority...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#070D17] text-slate-100">
      <div className="w-full max-w-lg rounded-2xl bg-[#0B1424] border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <FindItLogo variant="full" size="md" inverted />
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-[11px] font-mono text-[#19B5A5]">
            <Lock className="w-3 h-3" />
            /admin
          </span>
        </div>

        {/* Case 1: ADMIN_EMAIL not configured AND no super admin bound yet */}
        {!status.adminEmailConfigured && !status.superAdminBound && !status.authenticated && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-2 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Terminal className="w-4 h-4" />
              <span>
                {lang === 'ar'
                  ? 'متغير البيئة ADMIN_EMAIL غير مضبوط في الخادم'
                  : 'ADMIN_EMAIL Server Variable Not Configured'}
              </span>
            </div>
            <p className="leading-relaxed">
              {lang === 'ar'
                ? 'لتفعيل حساب المدير الرئيسي الأول بدون أي بيانات افتراضية مكشوفة، عيّن متغير ADMIN_EMAIL في بيئة الخادم إلى البريد المعتمد ثم أعد تشغيل الخادم.'
                : 'To activate the sole Super Admin safely without hardcoded defaults, set ADMIN_EMAIL in the server environment to your verified email and restart the server.'}
            </p>
          </div>
        )}

        {/* Case 2: Unauthenticated -> Admin Sign In */}
        {!status.authenticated && (
          <div className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h1 className="text-lg font-extrabold text-white">
                  {lang === 'ar' ? 'بوابة الإدارة المركزية — تسجيل الدخول' : 'Central Admin Portal Sign-In'}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'ar'
                    ? 'سجّل الدخول بالحساب المصرح له (Super Admin أو موظف إدارة مخوّل) عبر البريد وكلمة المرور أو حساب Google.'
                    : 'Sign in with your authorized Super Admin or Staff Admin account via Email & Password or Google.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {lang === 'ar' ? 'البريد الإلكتروني الإداري' : 'Admin Email'}
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D17] border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#19B5A5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D17] border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#19B5A5]"
                />
              </div>

              {gateError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 font-semibold">
                  {gateError}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{lang === 'ar' ? 'التحقق والدخول للوحة الإدارة' : 'Authenticate Admin Session'}</span>
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800" />
              <span className="shrink mx-3 text-[11px] text-slate-400">
                {lang === 'ar' ? 'أو دخول المالك عبر Google' : 'OR OWNER SIGN-IN VIA GOOGLE'}
              </span>
              <div className="flex-grow border-t border-slate-800" />
            </div>

            <button
              type="button"
              disabled={busy}
              data-testid="admin-google-signin-btn"
              onClick={() => void handleGoogleAdminLogin()}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-[#070D17] hover:border-[#19B5A5] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#19B5A5]" />
              ) : (
                <Globe className="w-4 h-4 text-[#19B5A5]" />
              )}
              <span>
                {lang === 'ar'
                  ? 'الدخول بحساب Google الإداري'
                  : 'Sign In with Google Admin Account'}
              </span>
            </button>
          </div>
        )}

        {/* Case 3: Authenticated user matches ADMIN_EMAIL, needs bootstrap claim */}
        {status.authenticated &&
          status.currentUserMatchesAdminEmail &&
          status.role !== 'super_admin' && (
            <form onSubmit={handleBootstrap} className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {lang === 'ar'
                      ? 'تم التطابق مع ADMIN_EMAIL'
                      : 'Verified Match With Server ADMIN_EMAIL'}
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80">
                  {lang === 'ar'
                    ? `الحساب المسجل (${authUser?.email}) مخوّل لتفعيل صلاحية المدير الرئيسي الوحيد (Super Admin). أكد كلمة مرورك لإتمام الربط وفتح لوحة الإدارة.`
                    : `Your signed-in account (${authUser?.email}) is authorized to bind the sole Super Admin authority. Confirm your password to complete activation.`}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {lang === 'ar' ? 'تأكيد كلمة مرور الحساب' : 'Confirm Account Password'}
                </label>
                <input
                  type="password"
                  required
                  value={claimPassword}
                  onChange={(e) => setClaimPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D17] border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#19B5A5]"
                />
              </div>

              {gateError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 font-semibold">
                  {gateError}
                </div>
              )}

              <button
                type="submit"
                disabled={busy || !claimPassword}
                className="w-full py-2.5 px-4 rounded-xl bg-[#19B5A5] hover:bg-teal-500 text-[#070D17] text-sm font-extrabold flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {lang === 'ar' ? 'تفعيل صلاحية Super Admin والدخول' : 'Claim Super Admin & Enter'}
                </span>
              </button>
            </form>
          )}

        {/* Case 4: Authenticated regular user (403 Access Denied) */}
        {status.authenticated &&
          !(status.currentUserMatchesAdminEmail && status.role !== 'super_admin') &&
          status.role !== 'super_admin' &&
          status.role !== 'staff_admin' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 space-y-2">
                <div className="flex items-center gap-2 text-red-300 font-extrabold text-sm">
                  <ShieldAlert className="w-5 h-5" />
                  <span>
                    {lang === 'ar' ? 'تم رفض الوصول — غير مصرح (403)' : 'Access Denied — Forbidden (403)'}
                  </span>
                </div>
                <p className="text-xs text-red-200/90 leading-relaxed">
                  {lang === 'ar'
                    ? `الحساب الحالي (${authUser?.email}) لا يملك صلاحية Super Admin أو Staff Admin. محاولات الوصول غير المصرح بها يتم تسجيلها في سجل الأمان.`
                    : `Account (${authUser?.email}) does not hold Super Admin or Staff Admin permissions. Unauthorized access attempts are recorded in the security audit trail.`}
                </p>
                {!status.adminEmailConfigured && (
                  <p className="text-[11px] text-amber-300 pt-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? 'ملاحظة: متغير ADMIN_EMAIL غير مهيأ على الخادم حاليًا.'
                        : 'Note: ADMIN_EMAIL is currently not configured on the server.'}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('dashboard')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
                >
                  {lang === 'ar' ? 'العودة للوحة حسابي' : 'Go to My Workspace'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logoutUser();
                    await onRefreshStatus();
                  }}
                  className="py-2.5 px-4 rounded-xl border border-red-800 text-red-300 hover:bg-red-950/60 text-xs font-bold"
                >
                  {lang === 'ar' ? 'تبديل الحساب' : 'Switch Account'}
                </button>
              </div>
            </div>
          )}

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'العودة إلى FindIt QR' : 'Back to FindIt QR'}</span>
          </button>
          <span className="font-mono text-[11px]">Zero-Trust Server RBAC</span>
        </div>
      </div>
    </div>
  );
};
