import React, { useEffect, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCog,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminApi, ApiRequestError } from '../../services/adminApi';
import {
  ALL_ADMIN_PERMISSIONS,
  AdminAuditLogEntry,
  AdminDashboardAnalytics,
  AdminPermissionKey,
  AdminSessionSummary,
  ManagedFaqEntry,
  PlatformSettings,
  SecurityLoginLog,
  UnauthorizedAccessEvent,
  UserRole,
} from '../../types/domain';

export const AdminReportsView: React.FC = () => {
  const { lang, showToast } = useApp();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [analytics, setAnalytics] = useState<AdminDashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (p = period) => {
    setLoading(true);
    try {
      const res = await adminApi.getReports(p);
      setAnalytics(res.analytics);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(period);
  }, [period]);

  const handleExport = async (scope: 'users' | 'orders') => {
    try {
      const csv = await adminApi.downloadReportCsv(scope);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finditqr-${scope}-report.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast('success', lang === 'ar' ? 'تم تصدير الملف' : 'CSV Exported', link.download);
    } catch (err) {
      showToast(
        'error',
        'Export Failed',
        err instanceof ApiRequestError ? err.messageEn : 'Could not export CSV.'
      );
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'التقارير والتحليلات وتصدير CSV' : 'Reports & CSV Exports'}
          </h1>
          <p className="text-slate-500">
            {lang === 'ar'
              ? 'تقارير فعلية مبنية على سجلات المستخدمين والطلبات والتصاميم في قاعدة البيانات.'
              : 'Real server-side aggregations across users, items, templates, and approved revenue.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | '90d' | 'all')}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 font-bold"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          <button
            type="button"
            onClick={() => void handleExport('users')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#17243A] text-white font-bold"
          >
            <Download className="w-3.5 h-3.5 text-[#19B5A5]" />
            <span>{lang === 'ar' ? 'تصدير المستخدمين CSV' : 'Export Users CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleExport('orders')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] text-white font-bold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تصدير المبيعات CSV' : 'Export Orders CSV'}</span>
          </button>
        </div>
      </div>

      {loading && !analytics ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
        </div>
      ) : (
        analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-3">
              <h2 className="text-sm font-extrabold">
                {lang === 'ar' ? 'تقرير أداء الباقات' : 'Plan Adoption Summary'}
              </h2>
              {analytics.planDistribution.map((p) => (
                <div key={p.plan} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold">{p.plan}</span>
                  <span className="font-mono font-bold">{p.usersCount} accounts</span>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-3">
              <h2 className="text-sm font-extrabold">
                {lang === 'ar' ? 'ملخص الإيرادات والأغراض' : 'Revenue & Asset Protection Summary'}
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>Confirmed Revenue (SAR)</span>
                  <strong className="font-mono">{analytics.totals.revenueSar} SAR</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>Confirmed Revenue (USD)</span>
                  <strong className="font-mono">${analytics.totals.revenueUsd} USD</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>Total QR Scans</span>
                  <strong className="font-mono">{analytics.totals.totalScans}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Open Support Tickets & Orders</span>
                  <strong className="font-mono">
                    {analytics.totals.openSupportTickets} open · {analytics.totals.approvedOrders}/{analytics.totals.totalOrders} orders
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export const AdminSettingsView: React.FC<{
  onRequireReauth: (retryAction?: () => Promise<void>) => void;
}> = ({ onRequireReauth }) => {
  const { lang, showToast, refreshCatalog } = useApp();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettings();
      setSettings(res.settings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await adminApi.updateSettings(settings);
      setSettings(res.settings);
      await refreshCatalog();
      showToast(
        'success',
        lang === 'ar' ? 'تم حفظ الإعدادات' : 'Platform Settings Saved',
        ''
      );
    } catch (err) {
      if (err instanceof ApiRequestError && err.isReauthRequired) {
        onRequireReauth(handleSave);
      } else {
        showToast(
          'error',
          'Save Failed',
          err instanceof ApiRequestError ? err.messageEn : 'Failed to save settings.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  const addFaq = () => {
    const next: ManagedFaqEntry = {
      id: `faq-${Date.now()}`,
      questionAr: 'سؤال جديد',
      questionEn: 'New FAQ Question',
      answerAr: 'الإجابة هنا...',
      answerEn: 'Answer here...',
      isPublished: true,
    };
    setSettings({ ...settings, faqs: [...settings.faqs, next] });
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'إعدادات المنصة والأسئلة الشائعة' : 'Platform Settings & FAQ Editor'}
          </h1>
          <p className="text-slate-500">
            {lang === 'ar'
              ? 'الهوية، العملة الافتراضية، مفاتيح الأمان، وإدارة صفحة الأسئلة الشائعة.'
              : 'Branding, default currency, security windows, feature flags, and live FAQ content.'}
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : lang === 'ar' ? 'حفظ التغييرات' : 'Save Platform Settings'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-sm font-extrabold">
            {lang === 'ar' ? 'الهوية والأسواق والعملة' : 'Identity, Currency & Support'}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Platform Name</label>
              <input
                type="text"
                value={settings.platformNameEn}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platformNameEn: e.target.value,
                    platformNameAr: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Default Currency</label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultCurrency: e.target.value === 'USD' ? 'USD' : 'SAR',
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="SAR">SAR (ريال سعودي)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">Support Email</label>
              <input
                type="email"
                dir="ltr"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Support Phone</label>
              <input
                type="text"
                dir="ltr"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Bank Transfer Instructions (AR)</label>
            <textarea
              rows={2}
              value={settings.bankTransferInstructionsAr}
              onChange={(e) =>
                setSettings({ ...settings, bankTransferInstructionsAr: e.target.value })
              }
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Bank Transfer Instructions (EN)</label>
            <textarea
              rows={2}
              dir="ltr"
              value={settings.bankTransferInstructionsEn}
              onChange={(e) =>
                setSettings({ ...settings, bankTransferInstructionsEn: e.target.value })
              }
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-sm font-extrabold">
            {lang === 'ar' ? 'تبديلات الميزات وضوابط الأمان' : 'Feature Flags & Security Limits'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(
              [
                ['enablePublicRegistration', 'Public Registration'],
                ['enableDesignStore', 'Design Store'],
                ['enableManualBankTransfer', 'Manual Bank Transfer'],
                ['enableZipTemplateImport', 'ZIP Template Import'],
                ['enableTemplateFavorites', 'Template Favorites'],
                ['enableReportProblemButton', 'Report a Problem CTA'],
                ['maintenanceMode', 'Maintenance Mode'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-800 font-bold"
              >
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings[key])}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                />
              </label>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <div>
              <label className="block font-bold mb-1">Session TTL (h)</label>
              <input
                type="number"
                min={1}
                value={settings.sessionTtlHours}
                onChange={(e) =>
                  setSettings({ ...settings, sessionTtlHours: Number(e.target.value) })
                }
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Re-Auth (min)</label>
              <input
                type="number"
                min={5}
                value={settings.reauthWindowMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, reauthWindowMinutes: Number(e.target.value) })
                }
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Max Login Tries</label>
              <input
                type="number"
                min={3}
                value={settings.maxLoginAttemptsPerWindow}
                onChange={(e) =>
                  setSettings({ ...settings, maxLoginAttemptsPerWindow: Number(e.target.value) })
                }
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live FAQ Editor */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold">
            {lang === 'ar' ? 'إدارة الأسئلة الشائعة (/faq)' : 'FAQ Content Manager (/faq)'}
          </h2>
          <button
            type="button"
            onClick={addFaq}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add FAQ</span>
          </button>
        </div>

        <div className="space-y-3">
          {settings.faqs.map((faq, idx) => (
            <div
              key={faq.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-slate-400">#{idx + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 font-bold">
                    <input
                      type="checkbox"
                      checked={faq.isPublished}
                      onChange={(e) => {
                        const next = [...settings.faqs];
                        next[idx] = { ...faq, isPublished: e.target.checked };
                        setSettings({ ...settings, faqs: next });
                      }}
                    />
                    <span>Published</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        faqs: settings.faqs.filter((f) => f.id !== faq.id),
                      })
                    }
                    className="text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={faq.questionAr}
                  onChange={(e) => {
                    const next = [...settings.faqs];
                    next[idx] = { ...faq, questionAr: e.target.value };
                    setSettings({ ...settings, faqs: next });
                  }}
                  placeholder="السؤال (عربي)"
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 font-bold"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={faq.questionEn}
                  onChange={(e) => {
                    const next = [...settings.faqs];
                    next[idx] = { ...faq, questionEn: e.target.value };
                    setSettings({ ...settings, faqs: next });
                  }}
                  placeholder="Question (EN)"
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 font-bold"
                />
                <textarea
                  rows={2}
                  value={faq.answerAr}
                  onChange={(e) => {
                    const next = [...settings.faqs];
                    next[idx] = { ...faq, answerAr: e.target.value };
                    setSettings({ ...settings, faqs: next });
                  }}
                  className="p-2 rounded-lg bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700"
                />
                <textarea
                  rows={2}
                  dir="ltr"
                  value={faq.answerEn}
                  onChange={(e) => {
                    const next = [...settings.faqs];
                    next[idx] = { ...faq, answerEn: e.target.value };
                    setSettings({ ...settings, faqs: next });
                  }}
                  className="p-2 rounded-lg bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AdminSecurityView: React.FC<{
  onRequireReauth: (retryAction?: () => Promise<void>) => void;
  currentRole: UserRole;
}> = ({ onRequireReauth, currentRole }) => {
  const { lang, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<
    Array<{
      uid: string;
      email: string;
      displayName: string;
      role: UserRole;
      adminPermissions: AdminPermissionKey[];
      accountStatus: 'active' | 'suspended';
    }>
  >([]);
  const [sessions, setSessions] = useState<AdminSessionSummary[]>([]);
  const [loginLogs, setLoginLogs] = useState<SecurityLoginLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<UnauthorizedAccessEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);

  const [staffEmail, setStaffEmail] = useState('');
  const [staffPerms, setStaffPerms] = useState<AdminPermissionKey[]>(['dashboard', 'support']);
  const [savingStaff, setSavingStaff] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSecurity();
      setStaff(res.staffAndAdmins || []);
      setSessions(res.sessions || []);
      setLoginLogs(res.loginLogs || []);
      setSecurityEvents(res.securityEvents || []);
      setAuditLogs(res.auditLogs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    setStaffPerms(['dashboard', 'support']);
  }, []);

  const assignStaff = async (
    email: string,
    role: 'staff_admin' | 'user',
    permissions: AdminPermissionKey[]
  ) => {
    setSavingStaff(true);
    try {
      await adminApi.updateStaffRbac({ email, role, permissions });
      showToast('success', lang === 'ar' ? 'تم تحديث الصلاحيات' : 'RBAC Updated', email);
      setStaffEmail('');
      await load();
    } catch (err) {
      if (err instanceof ApiRequestError && err.isReauthRequired) {
        onRequireReauth(() => assignStaff(email, role, permissions));
      } else {
        showToast(
          'error',
          'RBAC Error',
          err instanceof ApiRequestError ? err.messageEn : 'Failed to update staff role.'
        );
      }
    } finally {
      setSavingStaff(false);
    }
  };

  const revokeSession = async (tokenHash: string) => {
    try {
      await adminApi.revokeSession(tokenHash);
      showToast('info', lang === 'ar' ? 'تم إنهاء الجلسة' : 'Session Revoked', tokenHash.slice(0, 12));
      await load();
    } catch (err) {
      if (err instanceof ApiRequestError && err.isReauthRequired) {
        onRequireReauth(() => revokeSession(tokenHash));
      } else {
        showToast(
          'error',
          'Error',
          err instanceof ApiRequestError ? err.messageEn : 'Failed to revoke session.'
        );
      }
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar'
              ? 'الأمان وصلاحيات الطاقم وسجل المراجعة'
              : 'Security, Staff RBAC & Audit Logs'}
          </h1>
          <p className="text-slate-500">
            {lang === 'ar'
              ? 'إدارة موظفي الإدارة، إنهاء الجلسات عن بعد، وكشف محاولات الوصول غير المصرح بها.'
              : 'Manage Staff Admin RBAC, revoke active sessions, inspect security alerts, and audit changes.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{lang === 'ar' ? 'تحديث' : 'Refresh'}</span>
        </button>
      </div>

      {/* Staff RBAC Assignment (Super Admin only) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-sm font-extrabold flex items-center gap-2">
          <UserCog className="w-4 h-4 text-[#2563EB]" />
          <span>{lang === 'ar' ? 'صلاحيات الموظفين (Staff RBAC)' : 'Admin Authority & Staff RBAC'}</span>
        </h2>

        {currentRole === 'super_admin' && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap gap-2">
              <input
                type="email"
                dir="ltr"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="registered.user@company.com"
                className="flex-1 min-w-[220px] px-3 py-2 rounded-xl bg-white dark:bg-[#0F1A2B] border border-slate-300 dark:border-slate-700"
              />
              <button
                type="button"
                disabled={savingStaff || !staffEmail}
                onClick={() => void assignStaff(staffEmail, 'staff_admin', staffPerms)}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold disabled:opacity-50"
              >
                {lang === 'ar' ? 'تعيين / تحديث كموظف إدارة' : 'Grant Staff Admin Permissions'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {ALL_ADMIN_PERMISSIONS.map((perm) => {
                const checked = staffPerms.includes(perm);
                return (
                  <label
                    key={perm}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono cursor-pointer ${
                      checked
                        ? 'bg-[#2563EB]/15 border-[#2563EB] text-[#2563EB] dark:text-[#19B5A5]'
                        : 'bg-white dark:bg-[#0F1A2B] border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setStaffPerms((prev) =>
                          prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
                        )
                      }
                    />
                    <span>{perm}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {staff.map((s) => (
            <div key={s.uid} className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-[#17243A] dark:text-white">
                  {s.displayName}{' '}
                  <span className="font-mono text-[#2563EB]">({s.role})</span>
                </p>
                <p className="font-mono text-slate-500" dir="ltr">
                  {s.email}
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {s.adminPermissions.join(', ')}
                </p>
              </div>
              {currentRole === 'super_admin' && s.role === 'staff_admin' && (
                <button
                  type="button"
                  onClick={() => void assignStaff(s.email, 'user', [])}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 font-bold"
                >
                  {lang === 'ar' ? 'سحب صلاحيات الإدارة' : 'Revoke Admin Role'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 font-extrabold flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#19B5A5]" />
          <span>{lang === 'ar' ? `الجلسات النشطة (${sessions.length})` : `Active Sessions (${sessions.length})`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead className="bg-slate-50 dark:bg-[#0B1424] text-slate-500">
              <tr>
                <th className="py-2.5 px-4 text-start">Email</th>
                <th className="py-2.5 px-4 text-start">Role</th>
                <th className="py-2.5 px-4 text-start">Token Hash</th>
                <th className="py-2.5 px-4 text-start">Last Used</th>
                <th className="py-2.5 px-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.map((sess) => (
                <tr key={sess.tokenHash}>
                  <td className="py-2.5 px-4 font-mono" dir="ltr">
                    {sess.email}
                  </td>
                  <td className="py-2.5 px-4 font-bold">{sess.role}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-400">{sess.tokenHashPrefix}...</td>
                  <td className="py-2.5 px-4 font-mono">{sess.lastUsedAt.slice(0, 16).replace('T', ' ')}</td>
                  <td className="py-2.5 px-4 text-end">
                    <button
                      type="button"
                      onClick={() => void revokeSession(sess.tokenHash)}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 font-bold"
                    >
                      {lang === 'ar' ? 'إنهاء الجلسة' : 'Revoke'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Events & Login Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-sm font-extrabold flex items-center gap-2 text-red-600 dark:text-red-400">
            <ShieldAlert className="w-4 h-4" />
            <span>
              {lang === 'ar'
                ? `محاولات الوصول غير المصرح (${securityEvents.length})`
                : `Unauthorized Security Events (${securityEvents.length})`}
            </span>
          </h2>
          {securityEvents.length === 0 ? (
            <p className="text-slate-400 py-4">No unauthorized attempts recorded.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {securityEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
                >
                  <div className="flex justify-between font-mono font-bold">
                    <span>{ev.reasonCode}</span>
                    <span>{ev.createdAt.slice(0, 16).replace('T', ' ')}</span>
                  </div>
                  <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {ev.method} {ev.path} · {ev.email || 'anonymous'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-sm font-extrabold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#19B5A5]" />
            <span>{lang === 'ar' ? `سجل محاولات الدخول (${loginLogs.length})` : `Login History (${loginLogs.length})`}</span>
          </h2>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {loginLogs.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 font-mono text-[11px]"
              >
                <span className={l.success ? 'text-emerald-600' : 'text-red-600'}>
                  {l.success ? 'OK' : 'FAIL'} · {l.email}
                </span>
                <span className="text-slate-400">{l.createdAt.slice(0, 16).replace('T', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Immutable Audit Log */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-3">
        <h2 className="text-sm font-extrabold">
          {lang === 'ar'
            ? `سجل المراجعة غير القابل للتعديل (${auditLogs.length})`
            : `Immutable Admin Audit Trail (${auditLogs.length})`}
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-3 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#17243A] dark:text-white">
                  {lang === 'ar' ? log.summaryAr : log.summaryEn}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {log.createdAt.slice(0, 19).replace('T', ' ')}
                </span>
              </div>
              <p className="font-mono text-[11px] text-slate-500">
                Actor: {log.actorEmail} ({log.actorRole}) · Action: {log.action} · Target: {log.targetType}/{log.targetId}
              </p>
              {(log.beforeSnapshot !== undefined || log.afterSnapshot !== undefined) && (
                <details className="text-[11px] font-mono text-slate-500 pt-1">
                  <summary className="cursor-pointer text-[#2563EB]">Before / After Snapshot</summary>
                  <pre className="mt-1 p-2 rounded-lg bg-slate-50 dark:bg-[#070D17] overflow-x-auto">
                    {JSON.stringify({ before: log.beforeSnapshot, after: log.afterSnapshot }, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
