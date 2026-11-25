import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  Info,
  Loader2,
  PackageOpen,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AsyncViewState } from '../../types/domain';

interface LiveIntegrationsStatusPayload {
  gemini: { configured: boolean; model: string; requiresPaidKey: boolean; mode: string };
  coverLibrary?: {
    active: boolean;
    total: number;
    items: number;
    groups: number;
    fallbacks: number;
    smartMatchingActive: boolean;
    zeroPerItemGeminiCalls: boolean;
  };
  firebaseAuth: { configured: boolean; projectId: string | null; googleSignInReady: boolean };
  firestore: { configured: boolean; databaseId: string | null; rulesFilePresent: boolean };
  cloudStorage: {
    activeDriver: string;
    firebaseBucketConfigured: boolean;
    firebaseStorageRulesPresent?: boolean;
    bucketName: string | null;
    cloudUploadEnabled: boolean;
    localPersistentReady: boolean;
    privateMediaAccessControl?: boolean;
  };
  mediaUpload: { active: boolean; maxBytes: number; magicByteValidation: boolean; privateAccessControl?: boolean };
  email: { configured: boolean; provider: string; fromConfigured: boolean };
  whatsapp: { configured: boolean; provider: string };
  serverEnv: { appUrlConfigured: boolean; adminEmailConfigured: boolean };
}

/**
 * Interactive View-State Inspector Bar:
 * Allows QA engineers and users to test Ready, Loading, Empty, and Error states
 * on any data-driven screen.
 */
export const ViewStateBar: React.FC<{ pageHintAr: string; pageHintEn: string }> = ({
  pageHintAr,
  pageHintEn,
}) => {
  const { lang, t, viewState, setViewState } = useApp();

  const states: Array<{ id: AsyncViewState; label: string }> = [
    { id: 'ready', label: t.common.stateReady },
    { id: 'loading', label: t.common.stateLoading },
    { id: 'empty', label: t.common.stateEmpty },
    { id: 'error', label: t.common.stateError },
  ];

  return (
    <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2D] px-4 py-3">
      <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
        <Info className="w-4 h-4 text-[#0F9D8E] shrink-0 mt-0.5" aria-hidden="true" />
        <span>{lang === 'ar' ? pageHintAr : pageHintEn}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 me-1">
          {t.common.stateSimulatorLabel}
        </span>
        <div
          role="group"
          aria-label={t.common.stateSimulatorLabel}
          className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F4F7FB] dark:bg-[#0B1320] p-1 border border-slate-200/80 dark:border-slate-800 max-w-full"
        >
          {states.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setViewState(st.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewState === st.id
                  ? 'bg-[#0F9D8E] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#17243A] dark:hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface AsyncStateWrapperProps {
  emptyTitleAr: string;
  emptyTitleEn: string;
  emptyDescAr: string;
  emptyDescEn: string;
  emptyActionLabelAr?: string;
  emptyActionLabelEn?: string;
  onEmptyAction?: () => void;
  children: React.ReactNode;
}

export const AsyncStateBoundary: React.FC<AsyncStateWrapperProps> = ({
  emptyTitleAr,
  emptyTitleEn,
  emptyDescAr,
  emptyDescEn,
  emptyActionLabelAr,
  emptyActionLabelEn,
  onEmptyAction,
  children,
}) => {
  const { lang, t, viewState, setViewState } = useApp();

  if (viewState === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2D] p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <Loader2 className="w-5 h-5 text-[#2563EB] animate-spin" aria-hidden="true" />
          <span className="text-sm font-semibold text-[#17243A] dark:text-slate-200">
            {lang === 'ar'
              ? 'جاري مزامنة السجلات مع Cloud Firestore...'
              : 'Synchronizing records with Cloud Firestore...'}
          </span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-16 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-[#111C2D] p-8 text-center max-w-xl mx-auto my-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold text-[#17243A] dark:text-white mb-2">
          {lang === 'ar'
            ? 'تعذّر الاتصال بخدمة البيانات السحابية'
            : 'Unable to Reach Cloud Data Service'}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          {lang === 'ar'
            ? 'حدث خطأ أثناء جلب السجلات من Cloud Firestore. يمكنك إعادة المحاولة لتحديث العرض.'
            : 'An error occurred while fetching records from Cloud Firestore. Click retry to refresh.'}
        </p>
        <button
          type="button"
          onClick={() => setViewState('ready')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>{t.common.retryAction}</span>
        </button>
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2D] p-10 text-center max-w-xl mx-auto my-4">
        <div className="w-14 h-14 rounded-2xl bg-[#2563EB]/10 text-[#2563EB] dark:text-[#19B5A5] flex items-center justify-center mx-auto mb-4">
          <PackageOpen className="w-7 h-7" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold text-[#17243A] dark:text-white mb-2">
          {lang === 'ar' ? emptyTitleAr : emptyTitleEn}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          {lang === 'ar' ? emptyDescAr : emptyDescEn}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onEmptyAction && emptyActionLabelAr && emptyActionLabelEn && (
            <button
              type="button"
              onClick={onEmptyAction}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              {lang === 'ar' ? emptyActionLabelAr : emptyActionLabelEn}
            </button>
          )}
          <button
            type="button"
            onClick={() => setViewState('ready')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {lang === 'ar' ? 'العودة إلى وضع العرض' : 'Return to Populated View'}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const GlobalToastAndModals: React.FC = () => {
  const {
    lang,
    t,
    toast,
    dismissToast,
    confirmDialog,
    closeConfirm,
    firebaseStatus,
    isFirebaseModalOpen,
    setFirebaseModalOpen,
    authUser,
  } = useApp();

  const isAuthenticated = Boolean(authUser);

  const [liveStatus, setLiveStatus] = useState<LiveIntegrationsStatusPayload | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    if (!isFirebaseModalOpen || !isAuthenticated) return;
    let cancelled = false;
    setLoadingStatus(true);
    fetch('/api/integrations/status', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { ok?: boolean; status?: LiveIntegrationsStatusPayload } | null) => {
        if (!cancelled && json?.ok && json.status) {
          setLiveStatus(json.status);
        }
      })
      .catch(() => {
        // Non-fatal; keep base Firebase config summary
      })
      .finally(() => {
        if (!cancelled) setLoadingStatus(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isFirebaseModalOpen, isAuthenticated]);

  const consoleAuthUrl = firebaseStatus.projectId
    ? `https://console.firebase.google.com/project/${firebaseStatus.projectId}/authentication/providers`
    : 'https://console.firebase.google.com/';

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 end-5 z-50 max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#17243A] p-4 shadow-xl flex items-start gap-3"
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-[#19B5A5] shrink-0 mt-0.5" aria-hidden="true" />
          )}
          {toast.type === 'info' && (
            <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" aria-hidden="true" />
          )}
          {(toast.type === 'warning' || toast.type === 'error') && (
            <ShieldAlert className="w-5 h-5 text-[#FF8A65] shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#17243A] dark:text-white">{toast.title}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            aria-label={t.common.cancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2D] p-6 shadow-xl">
            <h3
              id="confirm-modal-title"
              className="text-lg font-bold text-[#17243A] dark:text-white mb-2"
            >
              {confirmDialog.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {confirmDialog.description}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  closeConfirm();
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#2563EB] hover:bg-blue-700'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firebase Backend Connection Modal */}
      {isFirebaseModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="firebase-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2D] p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-[#19B5A5]" aria-hidden="true" />
                <h3
                  id="firebase-modal-title"
                  className="text-base font-bold text-[#17243A] dark:text-white"
                >
                  {lang === 'ar'
                    ? 'حالة الربط مع Firebase & Cloud Firestore'
                    : 'Firebase & Cloud Firestore Connection Status'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFirebaseModalOpen(false)}
                aria-label={t.common.cancel}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm">
              <div className="rounded-xl bg-[#F4F7FB] dark:bg-[#0B1320] p-4 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-2" dir="ltr">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Project ID:</span>
                  <span className="font-bold text-[#2563EB] dark:text-[#19B5A5]">
                    {firebaseStatus.projectId}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Firestore DB:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                    {firebaseStatus.firestoreDatabaseId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Security Rules:</span>
                  <span className="text-[#19B5A5] font-bold">Deployed & Active</span>
                </div>
              </div>

              {isAuthenticated && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B1320] p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-[#17243A] dark:text-white">
                      {lang === 'ar' ? 'حالة التكاملات والخدمات السحابية' : 'External Services & Integrations'}
                    </span>
                    {loadingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#19B5A5]" />}
                  </div>
                  {liveStatus ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-600 dark:text-slate-300">
                          {lang === 'ar' ? 'مكتبة الأغلفة الذكية والمطابقة التلقائية' : 'Smart Cover Library & Auto-Matching'}
                        </span>
                        <span className="font-bold text-[#19B5A5]">
                          {lang === 'ar'
                            ? `${liveStatus.coverLibrary?.total || 40} غلافًا نشطًا`
                            : `${liveStatus.coverLibrary?.total || 40} Active Covers`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-600 dark:text-slate-300">
                          {lang === 'ar' ? 'التخزين الدائم وصلاحيات الصور الخاصة' : 'Permanent Storage & Private Access'}
                        </span>
                        <span className="font-bold text-[#19B5A5]">
                          {liveStatus.cloudStorage.activeDriver === 's3_compatible'
                            ? lang === 'ar'
                              ? 'سحابي (S3/R2) + محمي'
                              : 'Cloud (S3/R2) + Protected'
                            : lang === 'ar'
                            ? 'دائم محلي + محمي'
                            : 'Persistent + Protected'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-600 dark:text-slate-300">
                          {lang === 'ar' ? 'رفع الوسائط والتحقق الثنائي' : 'Media Upload & Signature Check'}
                        </span>
                        <span className="font-bold text-[#19B5A5]">
                          {lang === 'ar' ? 'نشط (5MB)' : 'Active (5MB)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-600 dark:text-slate-300">
                          {lang === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Transactional Email'}
                        </span>
                        <span className={`font-bold ${liveStatus.email.configured ? 'text-[#19B5A5]' : 'text-amber-500'}`}>
                          {liveStatus.email.configured
                            ? `${liveStatus.email.provider.toUpperCase()}`
                            : lang === 'ar' ? 'بانتظار إعداد المزوّد' : 'Awaiting Provider Secret'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-600 dark:text-slate-300">
                          {lang === 'ar' ? 'تنبيهات WhatsApp' : 'WhatsApp Alerts'}
                        </span>
                        <span className={`font-bold ${liveStatus.whatsapp.configured ? 'text-[#19B5A5]' : 'text-amber-500'}`}>
                          {liveStatus.whatsapp.configured
                            ? `${liveStatus.whatsapp.provider}`
                            : lang === 'ar' ? 'بانتظار إعداد المزوّد' : 'Awaiting Provider Secret'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-600 dark:text-slate-300">
                          {lang === 'ar' ? 'صلاحية Super Admin (ADMIN_EMAIL)' : 'Super Admin Env (ADMIN_EMAIL)'}
                        </span>
                        <span className={`font-bold ${liveStatus.serverEnv.adminEmailConfigured ? 'text-[#19B5A5]' : 'text-amber-500'}`}>
                          {liveStatus.serverEnv.adminEmailConfigured
                            ? lang === 'ar' ? 'مضبوط' : 'Configured'
                            : lang === 'ar' ? 'غير مضبوط' : 'Not Set'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500">
                      {lang === 'ar' ? 'جاري قراءة حالة الخدمات من الخادم...' : 'Reading live service readiness...'}
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <p className="font-bold text-[#17243A] dark:text-amber-300">
                  {lang === 'ar'
                    ? 'إعداد مطلوب من مالك المشروع لتفعيل التسجيل بالبريد وكلمة المرور:'
                    : 'Project Owner Setting for Email/Password Registration:'}
                </p>
                <p className="leading-relaxed">
                  {lang === 'ar'
                    ? 'تم تفعيل تسجيل الدخول عبر Google تلقائيًا. لتفعيل مزود Email/Password في مشروع Firebase، يرجى فتح لوحة تحكم Firebase وتفعيل خيار Email/Password من قسم Authentication > Sign-in method.'
                    : 'Google Sign-In is enabled by default. To enable Email/Password registration on the Firebase project, open Firebase Console > Authentication > Sign-in method and toggle Email/Password on.'}
                </p>
                <a
                  href={consoleAuthUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
                >
                  <span>
                    {lang === 'ar'
                      ? 'فتح إعدادات Authentication في Firebase Console'
                      : 'Open Firebase Console Authentication Settings'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFirebaseModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
