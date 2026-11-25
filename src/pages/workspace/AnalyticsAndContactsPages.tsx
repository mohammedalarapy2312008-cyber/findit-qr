import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Download,
  Edit3,
  ExternalLink,
  Globe,
  KeyRound,
  Link2,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  QrCode,
  Send,
  Shield,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { SmartRelatedServices } from '../../components/workspace/SmartRelatedServices';
import { useApp } from '../../context/AppContext';
import { firebaseServiceLayer } from '../../services/firebase/services';
import { userAppApi } from '../../services/userAppApi';
import { AccountContactMethod, ContactMethodType } from '../../types/domain';
import {
  CONTACT_METHOD_META,
  countItemsUsingContactMethod,
  ensureProfileContactMethods,
  validateContactMethodInput,
} from '../../utils/contactMethodsLogic';
import { buildQrRecoveryUrl, resolveItemPrivacySettings } from '../../utils/qrLogic';
import {
  AnalyticsTimeframe,
  buildAnalyticsCsvReport,
  computeWorkspaceAnalytics,
} from '../../utils/workspaceAnalytics';

export const AnalyticsPage: React.FC<{ defaultTab?: 'overview' | 'activity' }> = ({
  defaultTab = 'overview',
}) => {
  const { lang, items, groups, sharedQrGroups, finderMessages, activityLogs, selectedTab } =
    useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>(
    selectedTab === 'activity' ? 'activity' : defaultTab
  );
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('30d');
  const [serverSummary, setServerSummary] = useState<ReturnType<
    typeof computeWorkspaceAnalytics
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    void userAppApi
      .getWorkspaceAnalytics(timeframe)
      .then((res) => {
        if (!cancelled && res.ok && res.analytics) {
          setServerSummary(res.analytics);
        }
      })
      .catch(() => {
        // Retain live local computation smoothly
      });
    return () => {
      cancelled = true;
    };
  }, [timeframe, items.length, sharedQrGroups.length, finderMessages.length]);

  const localSummary = useMemo(
    () =>
      computeWorkspaceAnalytics({
        items,
        groups,
        sharedQrGroups,
        messages: finderMessages,
        activities: activityLogs,
        timeframe,
      }),
    [items, groups, sharedQrGroups, finderMessages, activityLogs, timeframe]
  );

  const summary = serverSummary && serverSummary.timeframe === timeframe ? serverSummary : localSummary;

  const handleExportCsv = () => {
    const csv = buildAnalyticsCsvReport(summary);
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finditqr-analytics-${timeframe}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const maxDayEvents = Math.max(
    1,
    ...summary.dailyActivitySeries.map((d) => d.eventsCount + d.messagesCount)
  );

  return (
    <div className="space-y-6" data-testid="analytics-page">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF] text-xs font-bold">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الإحصائيات والتحليلات الحقيقية' : 'Real Workspace Analytics'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white mt-2">
            {lang === 'ar'
              ? 'الأداء الفعلي لرموز QR والاسترداد'
              : 'Genuine QR Scan & Recovery Analytics'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            {lang === 'ar'
              ? 'جميع الأرقام من سجلات حسابك الفعلية فقط — مع إظهار المدينة التقريبية عند السماح بها دون أي تتبع GPS.'
              : 'Strictly genuine account metrics only — coarse city distribution when enabled with zero GPS tracking.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-[#F7FAFC] dark:bg-[#0B1320] border border-slate-200 dark:border-slate-800">
            {(['7d', '30d', '90d', 'all'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                data-testid={`analytics-tf-${tf}`}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  timeframe === tf
                    ? 'bg-[#0F9D8E] text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tf === '7d'
                  ? lang === 'ar'
                    ? '٧ أيام'
                    : '7D'
                  : tf === '30d'
                  ? lang === 'ar'
                    ? '٣٠ يومًا'
                    : '30D'
                  : tf === '90d'
                  ? lang === 'ar'
                    ? '٩٠ يومًا'
                    : '90D'
                  : lang === 'ar'
                  ? 'الكل'
                  : 'All'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            data-testid="analytics-export-csv-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#14233A] text-xs font-bold hover:border-[#0F9D8E]"
          >
            <Download className="w-3.5 h-3.5 text-[#0F9D8E]" />
            <span>{lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Overview vs Activity Log Switch */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border ${
            activeTab === 'overview'
              ? 'bg-[#0F9D8E] text-white border-[#0F9D8E]'
              : 'bg-white dark:bg-[#0E192B] border-slate-200 dark:border-slate-800'
          }`}
        >
          {lang === 'ar' ? 'الملخص والرسوم البيانية' : 'Metrics Overview'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border ${
            activeTab === 'activity'
              ? 'bg-[#0F9D8E] text-white border-[#0F9D8E]'
              : 'bg-white dark:bg-[#0E192B] border-slate-200 dark:border-slate-800'
          }`}
        >
          {lang === 'ar'
            ? `سجل النشاط الكامل (${activityLogs.length})`
            : `Activity Log (${activityLogs.length})`}
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                labelAr: 'إجمالي مسحات QR',
                labelEn: 'Total QR Scans',
                value: summary.totalCombinedScans,
              },
              {
                labelAr: 'مسحات QR المشترك',
                labelEn: 'Shared QR Scans',
                value: summary.totalSharedGroupScans,
              },
              {
                labelAr: 'رسائل المكتشفين',
                labelEn: 'Finder Messages',
                value: summary.finderMessagesInPeriod,
              },
              {
                labelAr: 'بلاغات العثور',
                labelEn: 'Found Reports',
                value: summary.foundReportsInPeriod,
              },
              {
                labelAr: 'أغراض مستردة',
                labelEn: 'Recovered Items',
                value: summary.recoveredItemsCount,
              },
            ].map((kpi) => (
              <div
                key={kpi.labelEn}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-4 space-y-1"
              >
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'ar' ? kpi.labelAr : kpi.labelEn}
                </p>
                <p className="text-2xl font-extrabold font-mono tabular-nums text-[#0B1320] dark:text-white">
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Daily Bar Chart */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-4">
              <h2 className="text-sm font-extrabold text-[#0B1320] dark:text-white">
                {lang === 'ar'
                  ? 'حركة النشاط والرسائل اليومية'
                  : 'Daily Activity & Finder Messages'}
              </h2>
              {summary.dailyActivitySeries.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  {lang === 'ar'
                    ? 'لا توجد أحداث مسجلة ضمن هذه الفترة الزمنية بعد.'
                    : 'No recorded activity events in this timeframe yet.'}
                </p>
              ) : (
                <div className="flex items-end gap-2 h-44 pt-4">
                  {summary.dailyActivitySeries.map((day) => {
                    const total = day.eventsCount + day.messagesCount;
                    const heightPct = Math.max(12, Math.round((total / maxDayEvents) * 100));
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-500">{total}</span>
                        <div className="w-full bg-[#F7FAFC] dark:bg-[#0B1320] rounded-t-lg h-28 flex items-end">
                          <div
                            className="w-full rounded-t-lg bg-[#0F9D8E] dark:bg-[#19B5A5] transition-all"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {day.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Coarse City Distribution (Privacy-Safe) */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#0B1320] dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0F9D8E]" />
                  <span>{lang === 'ar' ? 'التوزيع التقريبي بالمدينة' : 'Coarse City Breakdown'}</span>
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0F9D8E]/10 text-[#0F9D8E]">
                  {lang === 'ar' ? 'بدون GPS' : 'No GPS'}
                </span>
              </div>

              {summary.coarseCityDistribution.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  {lang === 'ar'
                    ? 'لا توجد مدن مفعّلة للعرض في أغراضك حاليًا.'
                    : 'No coarse cities currently enabled on your items.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {summary.coarseCityDistribution.map((entry) => (
                    <div
                      key={entry.city}
                      className="p-3 rounded-xl bg-[#F7FAFC] dark:bg-[#0B1320] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-[#0B1320] dark:text-white">{entry.city}</span>
                      <span className="font-mono text-slate-500">
                        {entry.itemsCount} {lang === 'ar' ? 'أغراض' : 'items'} · {entry.scansCount}{' '}
                        {lang === 'ar' ? 'مسحة' : 'scans'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Items Table */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#0B1320] dark:text-white">
                {lang === 'ar' ? 'أداء الأغراض الفردية' : 'Per-Item Scan Performance'}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead className="bg-[#F7FAFC] dark:bg-[#0B1320] text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-4 text-start">{lang === 'ar' ? 'الغرض' : 'Item'}</th>
                    <th className="py-3 px-4 text-start">QR</th>
                    <th className="py-3 px-4 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="py-3 px-4 text-end">{lang === 'ar' ? 'المسحات' : 'Scans'}</th>
                    <th className="py-3 px-4 text-end">{lang === 'ar' ? 'الرسائل' : 'Messages'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {summary.topItems.map((it) => (
                    <tr key={it.id}>
                      <td className="py-3 px-4 font-bold text-[#0B1320] dark:text-white">
                        {it.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#0F9D8E]" dir="ltr">
                        {it.codeSerial}
                      </td>
                      <td className="py-3 px-4 text-xs">{it.status}</td>
                      <td className="py-3 px-4 text-end font-mono font-bold">{it.scans}</td>
                      <td className="py-3 px-4 text-end font-mono">{it.messagesCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-3">
          {activityLogs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              {lang === 'ar' ? 'لا يوجد سجل نشاط بعد.' : 'No activity recorded yet.'}
            </p>
          ) : (
            activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-[#F7FAFC] dark:bg-[#0B1320] border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <Activity className="w-4 h-4 text-[#0F9D8E] mt-1 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-[#0B1320] dark:text-white">
                      {lang === 'ar' ? log.titleAr : log.titleEn}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {lang === 'ar' ? log.detailAr : log.detailEn}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {log.timestamp.replace('T', ' ').slice(0, 16)}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      <SmartRelatedServices currentPage="analytics" />
    </div>
  );
};

const ICON_BY_TYPE: Record<ContactMethodType, React.FC<{ className?: string }>> = {
  phone: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  telegram: Send,
  facebook: Globe,
  custom_link: ExternalLink,
};

export const ContactMethodsPage: React.FC = () => {
  const {
    lang,
    profile,
    items,
    showToast,
    requestConfirm,
    createContactMethodInSession,
    updateContactMethodInSession,
    deleteContactMethodInSession,
  } = useApp();

  const methods = useMemo(() => ensureProfileContactMethods(profile), [profile]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<ContactMethodType>('whatsapp');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setType('whatsapp');
    setLabel('');
    setValue('');
    setIsPrimary(false);
    setFormError('');
  };

  const handleEditStart = (m: AccountContactMethod) => {
    setEditingId(m.id);
    setType(m.type);
    setLabel(m.label);
    setValue(m.value);
    setIsPrimary(Boolean(m.isPrimary));
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateContactMethodInput({ type, label, value });
    if (!check.valid) {
      setFormError(
        lang === 'ar'
          ? 'يرجى التحقق من صحة التسمية وصيغة وسيلة التواصل (مثال: رابط يبدأ بـ https:// للروابط المخصصة).'
          : 'Please check label length and contact value format (custom links must start with https://).'
      );
      return;
    }
    setFormError('');
    setSaving(true);
    if (editingId) {
      const ok = await updateContactMethodInSession(editingId, {
        type,
        label: label.trim(),
        value: value.trim(),
        isPrimary,
      });
      if (ok) resetForm();
    } else {
      const created = await createContactMethodInSession({
        type,
        label: label.trim(),
        value: value.trim(),
        isActive: true,
        isPrimary,
      });
      if (created) resetForm();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6" data-testid="contact-methods-page">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF] text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الدليل المركزي لطرق التواصل' : 'Central Contact Directory'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white">
            {lang === 'ar' ? 'إدارة طرق التواصل المركزية' : 'Central Contact Methods'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            {lang === 'ar'
              ? `أضف وحدّث أرقامك وروابطك هنا مرة واحدة؛ فينعكس أي تعديل تلقائيًا على جميع الأغراض المرتبطة (الحد النشط لكل غرض في باقة ${profile.plan}: ${profile.contactMethodsLimit}).`
              : `Manage your phone, WhatsApp, email, Telegram, Facebook, and custom links centrally — updates propagate live to all linked items (active cap per item on ${profile.plan}: ${profile.contactMethodsLimit}).`}
          </p>
        </div>
      </div>

      {/* Add / Edit Contact Method Form */}
      <form
        onSubmit={handleSubmit}
        data-testid="contact-method-form"
        className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-4"
      >
        <h2 className="text-sm font-extrabold text-[#0B1320] dark:text-white">
          {editingId
            ? lang === 'ar'
              ? 'تعديل وسيلة التواصل'
              : 'Update Contact Method'
            : lang === 'ar'
            ? 'إضافة وسيلة تواصل جديدة للدليل'
            : 'Add New Contact Method'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="cm-type-select"
              className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
            >
              {lang === 'ar' ? 'نوع القناة' : 'Channel Type'}
            </label>
            <select
              id="cm-type-select"
              data-testid="cm-type-select"
              value={type}
              onChange={(e) => setType(e.target.value as ContactMethodType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
            >
              {(Object.keys(CONTACT_METHOD_META) as ContactMethodType[]).map((k) => (
                <option key={k} value={k}>
                  {lang === 'ar' ? CONTACT_METHOD_META[k].labelAr : CONTACT_METHOD_META[k].labelEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="cm-label-input"
              className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
            >
              {lang === 'ar' ? 'اسم وصفي للوسيلة *' : 'Display Label *'}
            </label>
            <input
              id="cm-label-input"
              data-testid="cm-label-input"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: واتساب الطوارئ أو صفحة فيسبوك' : 'e.g., Travel WhatsApp'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="cm-value-input"
              className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
            >
              {lang === 'ar' ? 'الرقم أو الرابط أو الحساب *' : 'Phone / Handle / URL *'}
            </label>
            <input
              id="cm-value-input"
              data-testid="cm-value-input"
              type="text"
              dir="ltr"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? CONTACT_METHOD_META[type].placeholderAr
                  : CONTACT_METHOD_META[type].placeholderEn
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="accent-[#0F9D8E]"
            />
            <span>{lang === 'ar' ? 'تعيين كوسيلة رئيسية' : 'Mark as Primary Channel'}</span>
          </label>

          <div className="flex items-center gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                {lang === 'ar' ? 'إلغاء التعديل' : 'Cancel Edit'}
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              data-testid="cm-submit-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] text-white text-xs sm:text-sm font-bold disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              <span>
                {editingId
                  ? lang === 'ar'
                    ? 'حفظ التعديلات على كل الأغراض'
                    : 'Save Live Updates'
                  : lang === 'ar'
                  ? 'إضافة للدليل المركزي'
                  : 'Add to Directory'}
              </span>
            </button>
          </div>
        </div>

        {formError && (
          <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-400">
            {formError}
          </p>
        )}
      </form>

      {/* Saved Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((method) => {
          const Icon = ICON_BY_TYPE[method.type] || ExternalLink;
          const linkedCount = countItemsUsingContactMethod(method.id, items);
          const meta = CONTACT_METHOD_META[method.type];
          return (
            <div
              key={method.id}
              data-testid={`contact-method-card-${method.id}`}
              className={`rounded-2xl border p-5 space-y-4 transition-colors ${
                method.isActive
                  ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B]'
                  : 'border-slate-200/70 dark:border-slate-800/60 bg-slate-50 dark:bg-[#0B1320] opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-extrabold text-[#0B1320] dark:text-white truncate">
                        {method.label}
                      </h3>
                      {method.isPrimary && (
                        <span className="px-1.5 py-0.5 rounded bg-[#0F9D8E]/15 text-[#0F9D8E] text-[10px] font-bold">
                          {lang === 'ar' ? 'رئيسي' : 'Primary'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {lang === 'ar' ? meta.labelAr : meta.labelEn}
                    </p>
                  </div>
                </div>

                <label className="inline-flex items-center gap-1.5 text-[11px] font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={method.isActive}
                    onChange={(e) =>
                      void updateContactMethodInSession(method.id, { isActive: e.target.checked })
                    }
                    className="accent-[#0F9D8E]"
                  />
                  <span>{method.isActive ? (lang === 'ar' ? 'نشط' : 'On') : lang === 'ar' ? 'معطل' : 'Off'}</span>
                </label>
              </div>

              <p className="text-xs font-mono text-[#0B1320] dark:text-slate-200 break-all" dir="ltr">
                {method.value}
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {lang === 'ar'
                    ? `مرتبط بـ ${linkedCount} غرض`
                    : `Linked to ${linkedCount} item(s)`}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleEditStart(method)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#0F9D8E]"
                    aria-label={lang === 'ar' ? 'تعديل' : 'Edit'}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      requestConfirm({
                        title: lang === 'ar' ? 'حذف وسيلة التواصل' : 'Delete Contact Method',
                        description:
                          lang === 'ar'
                            ? `هل تريد حذف «${method.label}»؟ سيتم فصلها تلقائيًا عن ${linkedCount} غرض.`
                            : `Delete "${method.label}"? It will be unlinked from ${linkedCount} item(s).`,
                        confirmLabel: lang === 'ar' ? 'حذف' : 'Delete',
                        variant: 'danger',
                        onConfirm: () => {
                          void deleteContactMethodInSession(method.id).then((ok) => {
                            if (ok && editingId === method.id) resetForm();
                          });
                        },
                      })
                    }
                    className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400"
                    aria-label={lang === 'ar' ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <SmartRelatedServices currentPage="contact-methods" />
    </div>
  );
};

export const WorkspacePrivacySecurityPage: React.FC = () => {
  const {
    lang,
    profile,
    settings,
    items,
    updateSettingsInSession,
    updateItemDetailsInSession,
    setAccountPassword,
    linkGoogleAccount,
  } = useApp();

  const [localSettings, setLocalSettings] = useState(settings);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordFormError, setPasswordFormError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [showLinkGoogleForm, setShowLinkGoogleForm] = useState(false);
  const [linkGooglePassword, setLinkGooglePassword] = useState('');
  const [linkGoogleError, setLinkGoogleError] = useState('');
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const hasPasswordMethod =
    profile.hasPassword ?? (profile.authProviders ? profile.authProviders.includes('password') : true);
  const hasGoogleMethod =
    profile.hasGoogle ?? (profile.authProviders ? profile.authProviders.includes('google') : false);

  const sampleUrl = items[0] ? buildQrRecoveryUrl(items[0].codeSerial) : buildQrRecoveryUrl('FND-SAMPLE');

  const handleSaveGlobalPrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettingsInSession(localSettings);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFormError('');
    if (newPassword.length < 8) {
      setPasswordFormError(
        lang === 'ar'
          ? 'كلمة المرور الجديدة يجب أن تكون ٨ أحرف على الأقل.'
          : 'New password must be at least 8 characters.'
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFormError(
        lang === 'ar' ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.'
      );
      return;
    }
    setSavingPassword(true);
    try {
      let googleIdToken: string | undefined;
      if (!hasPasswordMethod) {
        const tokenRes = await firebaseServiceLayer.getFreshGoogleIdToken();
        if (!tokenRes.ok || !tokenRes.data?.idToken) {
          setPasswordFormError(
            lang === 'ar'
              ? tokenRes.messageAr || 'تعذر التحقق عبر Google.'
              : tokenRes.messageEn || 'Could not verify with Google.'
          );
          return;
        }
        googleIdToken = tokenRes.data.idToken;
      }
      const res = await setAccountPassword({
        newPassword,
        ...(hasPasswordMethod ? { currentPassword } : { googleIdToken }),
      });
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLinkGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkGoogleError('');
    if (!linkGooglePassword) {
      setLinkGoogleError(
        lang === 'ar' ? 'أدخل كلمة المرور الحالية أولًا.' : 'Enter your current password.'
      );
      return;
    }
    setLinkingGoogle(true);
    try {
      const tokenRes = await firebaseServiceLayer.getFreshGoogleIdToken();
      if (!tokenRes.ok || !tokenRes.data?.idToken) {
        setLinkGoogleError(lang === 'ar' ? tokenRes.messageAr : tokenRes.messageEn);
        return;
      }
      const res = await linkGoogleAccount(linkGooglePassword, tokenRes.data.idToken);
      if (res.ok) {
        setLinkGooglePassword('');
        setShowLinkGoogleForm(false);
      }
    } finally {
      setLinkingGoogle(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="workspace-privacy-security-page">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF] text-xs font-bold">
          <Shield className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'مركز الخصوصية والأمان' : 'Privacy & Security Hub'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white mt-2">
          {lang === 'ar' ? 'الخصوصية والتحكم بالبيانات والأمان' : 'Privacy, PII Protection & Security'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          {lang === 'ar'
            ? 'تحقق من خلو رمز QR من أي بيانات شخصية، وأدر سياسات الخصوصية لكل غرض، وطرق أمان الدخول لحسابك.'
            : 'Verify PII-free QR payloads, toggle per-item public visibility flags, and secure your sign-in methods.'}
        </p>
      </div>

      {/* PII-Free Verification Card */}
      <div className="rounded-3xl border border-[#0F9D8E]/30 bg-[#0F9D8E]/5 dark:bg-[#19B5A5]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <QrCode className="w-6 h-6 text-[#0F9D8E] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-extrabold text-[#0B1320] dark:text-white">
              {lang === 'ar'
                ? 'ترميز QR خالٍ تمامًا من البيانات الشخصية (Zero-PII QR Payload)'
                : 'Zero-PII Inside Every QR Code'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {lang === 'ar'
                ? 'لا يحتوي كود QR المطبوع على اسمك أو رقمك أو موقعك — بل رابط استرداد مشفر فقط:'
                : 'Your printed QR never holds your name, phone, or location — only this clean lookup URL:'}
            </p>
            <p className="text-xs font-mono text-[#0F9D8E] dark:text-[#2DD4BF] mt-1" dir="ltr">
              {sampleUrl}
            </p>
          </div>
        </div>
      </div>

      {/* Global Privacy Defaults */}
      <form
        onSubmit={handleSaveGlobalPrivacy}
        className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-4"
      >
        <h2 className="text-sm font-extrabold text-[#0B1320] dark:text-white">
          {lang === 'ar' ? 'السياسات الافتراضية للحساب' : 'Global Account Privacy Defaults'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
          {[
            {
              key: 'defaultAnonymousMode' as const,
              ar: 'تفعيل الوسيط المجهول افتراضيًا للأغراض الجديدة',
              en: 'Default new items to Anonymous Relay mode',
            },
            {
              key: 'autoLockQrAfterRecovery' as const,
              ar: 'إيقاف رمز QR تلقائيًا بعد استرداد الغرض',
              en: 'Auto-pause QR tag once item is marked Recovered',
            },
            {
              key: 'requireFinderNoteBeforeContact' as const,
              ar: 'طلب رسالة مختصرة من المكتشف قبل الإرسال',
              en: 'Require brief finder note before relay message',
            },
            {
              key: 'ShareCoarseLocationOnScan' as const,
              ar: 'إظهار اسم المدينة التقريبية فقط (بدون GPS)',
              en: 'Show coarse city label only (zero GPS)',
            },
          ].map((opt) => (
            <label
              key={opt.key}
              className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#0B1320] cursor-pointer"
            >
              <span className="font-semibold">{lang === 'ar' ? opt.ar : opt.en}</span>
              <input
                type="checkbox"
                checked={Boolean(localSettings[opt.key])}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, [opt.key]: e.target.checked })
                }
                className="accent-[#0F9D8E]"
              />
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            data-testid="btn-save-global-privacy"
            className="px-5 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] text-white text-xs sm:text-sm font-bold"
          >
            {lang === 'ar' ? 'حفظ سياسات الخصوصية' : 'Save Privacy Defaults'}
          </button>
        </div>
      </form>

      {/* Per-Item Quick Privacy Matrix */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-[#0B1320] dark:text-white">
            {lang === 'ar' ? 'ضوابط الخصوصية لكل غرض مسجل' : 'Per-Item Privacy Controls'}
          </h2>
        </div>
        {items.length === 0 ? (
          <p className="p-6 text-xs text-slate-500 text-center">
            {lang === 'ar' ? 'لا توجد أغراض مسجلة بعد.' : 'No registered items yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#F7FAFC] dark:bg-[#0B1320] text-slate-500 font-bold">
                <tr>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'الغرض' : 'Item'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'ar' ? 'الصفحة العامة' : 'Public Page'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'ar' ? 'الصورة' : 'Photo'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'ar' ? 'المدينة' : 'City'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'ar' ? 'الرسائل' : 'Messages'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {items.map((it) => {
                  const p = resolveItemPrivacySettings(it);
                  return (
                    <tr key={it.id}>
                      <td className="py-3 px-4 font-bold text-[#0B1320] dark:text-white">
                        {it.name || it.nameAr}
                      </td>
                      {(
                        [
                          'publicPageEnabled',
                          'showImage',
                          'showCity',
                          'allowFinderMessages',
                        ] as const
                      ).map((flag) => (
                        <td key={flag} className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            aria-label={`${it.name} ${flag}`}
                            checked={p[flag]}
                            onChange={(e) =>
                              void updateItemDetailsInSession(it.id, {
                                privacySettings: { ...p, [flag]: e.target.checked },
                              })
                            }
                            className="accent-[#0F9D8E]"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password & Google Auth Security */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-[#0B1320] dark:text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#0F9D8E]" />
            <span>{lang === 'ar' ? 'أمان تسجيل الدخول وكلمة المرور' : 'Account Auth & Password'}</span>
          </h2>
          {!hasGoogleMethod && (
            <button
              type="button"
              onClick={() => setShowLinkGoogleForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F9D8E] text-white text-xs font-bold"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'ربط حساب Google' : 'Link Google Account'}</span>
            </button>
          )}
          {hasGoogleMethod && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'Google مرتبط' : 'Google Linked'}</span>
            </span>
          )}
        </div>

        {!hasGoogleMethod && showLinkGoogleForm && (
          <form onSubmit={handleLinkGoogle} className="p-4 rounded-2xl bg-[#F7FAFC] dark:bg-[#0B1320] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                dir="ltr"
                value={linkGooglePassword}
                onChange={(e) => setLinkGooglePassword(e.target.value)}
                placeholder={lang === 'ar' ? 'كلمة المرور الحالية' : 'Current password'}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E192B] text-sm"
              />
              <button
                type="submit"
                disabled={linkingGoogle}
                className="px-4 py-2 rounded-xl bg-[#0F9D8E] text-white text-xs font-bold"
              >
                {linkingGoogle ? '...' : lang === 'ar' ? 'تأكيد وربط' : 'Verify & Link'}
              </button>
            </div>
            {linkGoogleError && <p className="text-xs text-red-600">{linkGoogleError}</p>}
          </form>
        )}

        <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          {hasPasswordMethod && (
            <div>
              <label htmlFor="ps-curr-pw" className="block text-xs font-bold text-slate-500 mb-1">
                {lang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
              </label>
              <input
                id="ps-curr-pw"
                type="password"
                dir="ltr"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
              />
            </div>
          )}
          <div>
            <label htmlFor="ps-new-pw" className="block text-xs font-bold text-slate-500 mb-1">
              {lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
            </label>
            <input
              id="ps-new-pw"
              type="password"
              dir="ltr"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
            />
          </div>
          <div>
            <label htmlFor="ps-confirm-pw" className="block text-xs font-bold text-slate-500 mb-1">
              {lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
            </label>
            <input
              id="ps-confirm-pw"
              type="password"
              dir="ltr"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
            />
          </div>
          <div className="sm:col-span-3 flex items-center justify-between gap-3">
            {passwordFormError ? (
              <p className="text-xs font-bold text-red-600">{passwordFormError}</p>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0B1320] dark:bg-[#19B5A5] text-white dark:text-[#070D17] text-xs font-bold"
            >
              {savingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{lang === 'ar' ? 'حفظ كلمة المرور' : 'Save Password'}</span>
            </button>
          </div>
        </form>
      </div>

      <SmartRelatedServices currentPage="privacy-security" />
    </div>
  );
};
