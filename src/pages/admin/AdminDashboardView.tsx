import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CreditCard,
  FileCheck,
  Loader2,
  Package,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminApi, ApiRequestError } from '../../services/adminApi';
import { AdminDashboardAnalytics } from '../../types/domain';

export const AdminDashboardView: React.FC<{
  onJumpSection: (section: string) => void;
}> = ({ onJumpSection }) => {
  const { lang } = useApp();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<AdminDashboardAnalytics | null>(null);

  const load = async (p = period) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getDashboard(p);
      setData(res.analytics);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : lang === 'ar'
          ? 'تعذر تحميل مؤشرات لوحة التحكم.'
          : 'Failed to load dashboard metrics.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(period);
  }, [period]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
        <span>{lang === 'ar' ? 'جاري تحميل إحصاءات المنصة...' : 'Loading live platform telemetry...'}</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 space-y-3">
        <p className="text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
        <button
          type="button"
          onClick={() => void load(period)}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
        >
          {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { totals } = data;
  const kpiCards = [
    {
      label: lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users',
      value: totals.totalUsers,
      sub:
        lang === 'ar'
          ? `نشط ${totals.activeUsers} · معلق ${totals.suspendedUsers}`
          : `${totals.activeUsers} active · ${totals.suspendedUsers} suspended`,
      icon: Users,
      tone: 'text-[#2563EB] bg-blue-500/10',
    },
    {
      label: lang === 'ar' ? 'حسابات جديدة (الفترة)' : 'New Users (Period)',
      value: totals.newUsersInPeriod,
      sub: period.toUpperCase(),
      icon: ShieldCheck,
      tone: 'text-emerald-600 bg-emerald-500/10',
    },
    {
      label: lang === 'ar' ? 'الأغراض المسجلة' : 'Registered Items',
      value: totals.totalItems,
      sub:
        lang === 'ar'
          ? `QR نشط ${totals.activeQrCodes} · متوقف ${totals.pausedQrCodes}`
          : `${totals.activeQrCodes} active QR · ${totals.pausedQrCodes} paused`,
      icon: Package,
      tone: 'text-indigo-600 bg-indigo-500/10',
    },
    {
      label: lang === 'ar' ? 'عمليات مسح QR' : 'Total QR Scans',
      value: totals.totalScans,
      sub: lang === 'ar' ? 'إجمالي المسوحات المسجلة' : 'Cumulative real scans',
      icon: ScanLine,
      tone: 'text-[#19B5A5] bg-teal-500/10',
    },
    {
      label: lang === 'ar' ? 'القوالب المنشورة' : 'Published Templates',
      value: totals.publishedTemplates,
      sub:
        lang === 'ar'
          ? `مسودة ${totals.draftTemplates} · مؤرشف ${totals.archivedTemplates}`
          : `${totals.draftTemplates} draft · ${totals.archivedTemplates} archived`,
      icon: QrCode,
      tone: 'text-violet-600 bg-violet-500/10',
    },
    {
      label: lang === 'ar' ? 'الطلبات والمدفوعات' : 'Orders / Approved',
      value: `${totals.approvedOrders} / ${totals.totalOrders}`,
      sub:
        lang === 'ar'
          ? `بانتظار التأكيد: ${totals.pendingReviewOrders}`
          : `Pending review: ${totals.pendingReviewOrders}`,
      icon: ShoppingBag,
      tone: 'text-amber-600 bg-amber-500/10',
    },
    {
      label: lang === 'ar' ? 'الإيرادات المؤكدة (ر.س)' : 'Confirmed Revenue (SAR)',
      value: `${totals.revenueSar.toLocaleString()} SAR`,
      sub: `$${totals.revenueUsd.toLocaleString()} USD`,
      icon: CreditCard,
      tone: 'text-emerald-600 bg-emerald-500/10',
    },
    {
      label: lang === 'ar' ? 'الاشتراكات النشطة' : 'Active Subscriptions',
      value: totals.activeSubscriptions,
      sub:
        lang === 'ar'
          ? `منتهي: ${totals.expiredSubscriptions} · تذاكر مفتوحة: ${totals.openSupportTickets}`
          : `${totals.expiredSubscriptions} expired · ${totals.openSupportTickets} open tickets`,
      icon: FileCheck,
      tone: 'text-sky-600 bg-sky-500/10',
    },
  ];

  const maxPlanCount = Math.max(1, ...data.planDistribution.map((b) => b.usersCount));
  const maxTplUsage = Math.max(
    1,
    ...data.topTemplates.map((t) => Math.max(t.usageCount, t.salesCount))
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'لوحة المؤشرات المركزية' : 'Executive Overview'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'ar'
              ? 'جميع الأرقام مستخلصة لحظيًا من قاعدة البيانات الفعلية.'
              : 'All metrics aggregated directly from live platform records.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 p-1">
            {(['7d', '30d', '90d', 'all'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  period === p
                    ? 'bg-[#17243A] dark:bg-[#2563EB] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#17243A] dark:hover:text-white'
                }`}
              >
                {p === 'all'
                  ? lang === 'ar'
                    ? 'الكل'
                    : 'All'
                  : p.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void load(period)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#2563EB]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{lang === 'ar' ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Pending Manual Review Banner */}
      {totals.pendingReviewOrders > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
              {lang === 'ar'
                ? `يوجد ${totals.pendingReviewOrders} طلب تحويل بنكي بانتظار المراجعة والاعتماد المالي.`
                : `${totals.pendingReviewOrders} manual bank transfer order(s) awaiting payment confirmation.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onJumpSection('finance')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
          >
            {lang === 'ar' ? 'مراجعة المدفوعات' : 'Review Orders'}
          </button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="p-4 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.tone}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-[#17243A] dark:text-white">
                {card.value}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts: Plan Distribution & Top Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'توزيع الحسابات حسب الباقة' : 'Accounts by Subscription Plan'}
          </h2>
          {data.planDistribution.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {lang === 'ar' ? 'لا توجد حسابات مسجلة بعد.' : 'No accounts registered yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {data.planDistribution.map((item) => {
                const pct = Math.round((item.usersCount / maxPlanCount) * 100);
                return (
                  <div key={item.plan} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-200">{item.plan}</span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {item.usersCount}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2563EB]"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'القوالب الأعلى استخدامًا ومبيعًا' : 'Top Performing Tag Templates'}
          </h2>
          {data.topTemplates.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {lang === 'ar' ? 'لا توجد قوالب مسجلة بعد.' : 'No templates registered yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {data.topTemplates.map((tpl) => {
                const metric = Math.max(tpl.usageCount, tpl.salesCount);
                const pct = Math.round((metric / maxTplUsage) * 100);
                return (
                  <div key={tpl.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold gap-2">
                      <span className="text-slate-700 dark:text-slate-200 truncate">
                        {lang === 'ar' ? tpl.titleAr : tpl.titleEn}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {tpl.usageCount} uses · {tpl.salesCount} sales
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#19B5A5]"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Audit Logs & User Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#17243A] dark:text-white">
              {lang === 'ar' ? 'أحدث العمليات الإدارية (Audit)' : 'Recent Admin Audit Events'}
            </h2>
            <button
              type="button"
              onClick={() => onJumpSection('security')}
              className="text-xs font-bold text-[#2563EB] hover:underline"
            >
              {lang === 'ar' ? 'السجل الكامل' : 'Full Log'}
            </button>
          </div>
          {data.recentAdminLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {lang === 'ar' ? 'لا توجد عمليات إدارية مسجلة بعد.' : 'No admin audit records yet.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentAdminLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-[#17243A] dark:text-slate-100 truncate">
                      {lang === 'ar' ? log.summaryAr : log.summaryEn}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {log.actorEmail} · {log.action}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                    {log.createdAt.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#17243A] dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#19B5A5]" />
              <span>{lang === 'ar' ? 'أحدث أنشطة المستخدمين' : 'Recent User Activity'}</span>
            </h2>
          </div>
          {data.recentUserActivities.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {lang === 'ar' ? 'لا توجد أنشطة مستخدمين مسجلة بعد.' : 'No user activity logged yet.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentUserActivities.slice(0, 8).map((act) => (
                <div key={act.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-[#17243A] dark:text-slate-100 truncate">
                      {lang === 'ar' ? act.titleAr : act.titleEn}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {lang === 'ar' ? act.detailAr : act.detailEn}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                    {act.timestamp.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
