import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Edit3,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminApi, ApiRequestError } from '../../services/adminApi';
import {
  ManagedOrderStatus,
  ManagedPlanDefinition,
  ManagedPurchaseOrder,
  SubscriptionRecord,
} from '../../types/domain';

export const AdminPlansView: React.FC<{
  onRequireReauth: (retryAction?: () => Promise<void>) => void;
}> = ({ onRequireReauth }) => {
  const { lang, showToast, refreshCatalog } = useApp();
  const [plans, setPlans] = useState<ManagedPlanDefinition[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<ManagedPlanDefinition> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPlans();
      setPlans(res.plans || []);
      setSubscriptions(res.subscriptions || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id && plans.some((p) => p.id === editing.id)) {
        await adminApi.updatePlan(editing.id, editing);
      } else {
        await adminApi.createPlan(editing);
      }
      showToast(
        'success',
        lang === 'ar' ? 'تم حفظ الباقة' : 'Plan Saved',
        editing.nameEn || editing.nameAr || ''
      );
      setEditing(null);
      await load();
      await refreshCatalog();
    } catch (err) {
      if (err instanceof ApiRequestError && err.isReauthRequired) {
        onRequireReauth(async () => {
          if (editing.id && plans.some((p) => p.id === editing.id)) {
            await adminApi.updatePlan(editing.id, editing);
          } else {
            await adminApi.createPlan(editing);
          }
          setEditing(null);
          await load();
          await refreshCatalog();
        });
      } else {
        showToast(
          'error',
          lang === 'ar' ? 'تعذر الحفظ' : 'Plan Save Failed',
          err instanceof ApiRequestError ? err.messageEn : 'Error saving plan.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'الباقات والاشتراكات' : 'Plans & Subscriptions'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar'
              ? 'إدارة أسعار وفترات (1 / 3 / 12 شهرًا) وحدود الباقات وتفعيل الاشتراكات.'
              : 'Manage pricing across 1m/3m/12m cycles, active item quotas, and active subscriptions.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setEditing({
              id: '',
              quotaTier: 'Business',
              nameAr: 'باقة الأعمال',
              nameEn: 'Business Fleet',
              audienceAr: 'للمؤسسات والشركات',
              audienceEn: 'For corporate asset fleets',
              monthlySar: 149,
              monthlyUsd: 39,
              quarterlySar: 399,
              quarterlyUsd: 105,
              yearlySar: 1390,
              yearlyUsd: 369,
              maxActiveItems: 100,
              maxContactMethods: 7,
              maxTemplateCopies: 50,
              includedTemplatesScope: 'all_templates',
              allowCustomBranding: true,
              allowSvgExport: true,
              isActive: true,
            })
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'إنشاء باقة جديدة' : 'Create New Plan'}</span>
        </button>
      </div>

      {loading && plans.length === 0 ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#17243A] dark:text-white">
                    {lang === 'ar' ? p.nameAr : p.nameEn}
                  </h3>
                  <span className="font-mono text-[11px] text-slate-400">
                    Tier: {p.quotaTier} {p.isCoreFree ? '· Core Free' : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing({ ...p })}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-[#2563EB]"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 font-mono tabular-nums pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">1 mo:</span>
                  <strong>
                    {p.monthlySar} SAR / ${p.monthlyUsd}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">3 mo:</span>
                  <strong>
                    {p.quarterlySar} SAR / ${p.quarterlyUsd}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">12 mo:</span>
                  <strong>
                    {p.yearlySar} SAR / ${p.yearlyUsd}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span>Items: {p.maxActiveItems}</span>
                <span>Channels: {p.maxContactMethods}</span>
                <span>Copies: {p.maxTemplateCopies}</span>
                <span>{p.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Subscriptions Table */}
      <div className="rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar'
              ? `سجل الاشتراكات (${subscriptions.length})`
              : `Subscriptions Ledger (${subscriptions.length})`}
          </h2>
          <button
            type="button"
            onClick={() => void load()}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-500">
            {lang === 'ar' ? 'لا توجد اشتراكات مدفوعة مسجلة بعد.' : 'No paid subscriptions recorded yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-[#0B1424] text-slate-500">
                <tr>
                  <th className="py-2.5 px-4 text-start">User</th>
                  <th className="py-2.5 px-4 text-start">Plan</th>
                  <th className="py-2.5 px-4 text-start">Duration</th>
                  <th className="py-2.5 px-4 text-start">Status</th>
                  <th className="py-2.5 px-4 text-start">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="py-2.5 px-4 font-mono" dir="ltr">
                      {sub.userEmail}
                    </td>
                    <td className="py-2.5 px-4 font-bold">
                      {plans.find((p) => p.id === sub.planId)?.nameEn || sub.quotaTier}
                    </td>
                    <td className="py-2.5 px-4 font-mono">{sub.durationMonths} mo</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-bold">
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono">{sub.expiresAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-[#17243A] dark:text-white">
                {editing.id
                  ? lang === 'ar'
                    ? `تعديل الباقة (${editing.nameAr})`
                    : `Edit Plan (${editing.nameEn})`
                  : lang === 'ar'
                  ? 'إنشاء باقة جديدة'
                  : 'Create Plan'}
              </h3>
              <button type="button" onClick={() => setEditing(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Name (AR)</label>
                <input
                  type="text"
                  required
                  value={editing.nameAr || ''}
                  onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Name (EN)</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={editing.nameEn || ''}
                  onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Monthly (SAR / USD)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    value={editing.monthlySar ?? 0}
                    onChange={(e) => setEditing({ ...editing, monthlySar: Number(e.target.value) })}
                    className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                  />
                  <input
                    type="number"
                    min={0}
                    value={editing.monthlyUsd ?? 0}
                    onChange={(e) => setEditing({ ...editing, monthlyUsd: Number(e.target.value) })}
                    className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">3-Month (SAR / USD)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    value={editing.quarterlySar ?? 0}
                    onChange={(e) =>
                      setEditing({ ...editing, quarterlySar: Number(e.target.value) })
                    }
                    className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                  />
                  <input
                    type="number"
                    min={0}
                    value={editing.quarterlyUsd ?? 0}
                    onChange={(e) =>
                      setEditing({ ...editing, quarterlyUsd: Number(e.target.value) })
                    }
                    className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">12-Month (SAR / USD)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    value={editing.yearlySar ?? 0}
                    onChange={(e) => setEditing({ ...editing, yearlySar: Number(e.target.value) })}
                    className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                  />
                  <input
                    type="number"
                    min={0}
                    value={editing.yearlyUsd ?? 0}
                    onChange={(e) => setEditing({ ...editing, yearlyUsd: Number(e.target.value) })}
                    className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Max Active Items / Contact Channels</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={1}
                    value={editing.maxActiveItems ?? 2}
                    onChange={(e) =>
                      setEditing({ ...editing, maxActiveItems: Number(e.target.value) })
                    }
                    className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                  />
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={editing.maxContactMethods ?? 2}
                    onChange={(e) =>
                      setEditing({ ...editing, maxContactMethods: Number(e.target.value) })
                    }
                    className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#2563EB] text-white font-bold"
              >
                {saving
                  ? lang === 'ar'
                    ? 'جاري الحفظ...'
                    : 'Saving...'
                  : lang === 'ar'
                  ? 'حفظ وتحديث الحسابات'
                  : 'Save & Sync Quota'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export const AdminFinanceView: React.FC<{
  onRequireReauth: (retryAction?: () => Promise<void>) => void;
}> = ({ onRequireReauth }) => {
  const { lang, showToast } = useApp();
  const [orders, setOrders] = useState<ManagedPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | ManagedOrderStatus>('all');
  const [reviewingOrder, setReviewingOrder] = useState<ManagedPurchaseOrder | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOrders();
      setOrders(res.orders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleReview = async (
    order: ManagedPurchaseOrder,
    decision: 'approve' | 'reject' | 'refund'
  ) => {
    setBusy(true);
    try {
      await adminApi.reviewOrder(order.id, {
        decision,
        reason: decisionReason || `Manual verification (${decision})`,
      });
      showToast(
        'success',
        lang === 'ar' ? 'تم تنفيذ القرار المالي' : 'Order Reviewed',
        `${order.orderNumber} -> ${decision}`
      );
      setReviewingOrder(null);
      setDecisionReason('');
      await load();
    } catch (err) {
      if (err instanceof ApiRequestError && err.isReauthRequired) {
        onRequireReauth(() => handleReview(order, decision));
      } else {
        showToast(
          'error',
          lang === 'ar' ? 'تعذر مراجعة الطلب' : 'Review Failed',
          err instanceof ApiRequestError
            ? lang === 'ar'
              ? err.messageAr
              : err.messageEn
            : 'Error reviewing order.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const totals = useMemo(() => {
    const approved = orders.filter((o) => o.status === 'approved');
    const pending = orders.filter((o) => o.status === 'pending_review').length;
    const revSar = approved.reduce((sum, o) => sum + (o.amountSar || 0), 0);
    const revUsd = approved.reduce((sum, o) => sum + (o.amountUsd || 0), 0);
    return { approvedCount: approved.length, pending, revSar, revUsd };
  }, [orders]);

  const filtered = useMemo(
    () =>
      statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter),
    [orders, statusFilter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'المالية ومراجعة الحوالات اليدوية' : 'Finance & Manual Payments'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar'
              ? 'لا يتم اعتماد أي طلب مدفوع أو تفعيل ترخيص/باقة إلا بعد المراجعة الإدارية الصريحة.'
              : 'Paid orders never auto-complete without explicit admin verification of transfer proof.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{lang === 'ar' ? 'تحديث' : 'Refresh'}</span>
        </button>
      </div>

      {/* Finance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500">
            {lang === 'ar' ? 'الإيرادات المعتمدة' : 'Approved Revenue'}
          </span>
          <div className="text-2xl font-extrabold font-mono text-emerald-600 mt-1">
            {totals.revSar.toLocaleString()} SAR
          </div>
          <p className="text-xs font-mono text-slate-400">${totals.revUsd.toLocaleString()} USD</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500">
            {lang === 'ar' ? 'بانتظار التأكيد اليدوي' : 'Pending Review'}
          </span>
          <div className="text-2xl font-extrabold font-mono text-amber-600 mt-1">
            {totals.pending}
          </div>
          <p className="text-xs text-slate-400">
            {lang === 'ar' ? 'طلبات تحتاج فحص الإيصال' : 'Orders awaiting verification'}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500">
            {lang === 'ar' ? 'إجمالي الطلبات المعتمدة' : 'Approved Orders'}
          </span>
          <div className="text-2xl font-extrabold font-mono text-[#17243A] dark:text-white mt-1">
            {totals.approvedCount} / {orders.length}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending_review', 'approved', 'rejected', 'refunded'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
              statusFilter === st
                ? 'bg-[#17243A] dark:bg-[#2563EB] text-white border-transparent'
                : 'bg-white dark:bg-[#0F1A2B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-500">
            {lang === 'ar' ? 'لا توجد طلبات ضمن هذا الفلتر.' : 'No orders matching filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-[#0B1424] border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-3 px-4 text-start">Order #</th>
                  <th className="py-3 px-4 text-start">Customer</th>
                  <th className="py-3 px-4 text-start">Item / Plan</th>
                  <th className="py-3 px-4 text-start">Total</th>
                  <th className="py-3 px-4 text-start">Transfer Ref</th>
                  <th className="py-3 px-4 text-start">Status</th>
                  <th className="py-3 px-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((ord) => (
                  <tr key={ord.id}>
                    <td className="py-3 px-4 font-mono font-bold">{ord.orderNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold">{ord.userName}</div>
                      <div className="text-[11px] font-mono text-slate-500" dir="ltr">
                        {ord.userEmail}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">
                        {lang === 'ar' ? ord.titleAr : ord.titleEn}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{ord.orderType}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {ord.amountSar} SAR (${ord.amountUsd})
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {ord.transferReference || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          ord.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-700'
                            : ord.status === 'pending_review'
                            ? 'bg-amber-500/15 text-amber-700'
                            : 'bg-red-500/15 text-red-700'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingOrder(ord);
                          setDecisionReason(ord.decisionReason || '');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#2563EB]/10 text-[#2563EB] font-bold hover:bg-[#2563EB] hover:text-white"
                      >
                        {lang === 'ar' ? 'مراجعة' : 'Review'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Order Modal */}
      {reviewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-[#17243A] dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#2563EB]" />
                <span>{reviewingOrder.orderNumber}</span>
              </h3>
              <button type="button" onClick={() => setReviewingOrder(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-800 space-y-1.5">
              <p>
                <strong>Customer:</strong> {reviewingOrder.userName} ({reviewingOrder.userEmail})
              </p>
              <p>
                <strong>Target:</strong>{' '}
                {lang === 'ar' ? reviewingOrder.titleAr : reviewingOrder.titleEn}
              </p>
              <p>
                <strong>Amount:</strong>{' '}
                <span className="font-mono font-bold">
                  {reviewingOrder.amountSar} SAR / ${reviewingOrder.amountUsd} USD
                </span>
              </p>
              <p>
                <strong>Transfer Reference:</strong>{' '}
                <span className="font-mono">{reviewingOrder.transferReference || 'None'}</span>
              </p>
              {reviewingOrder.paymentProofUrl && (
                <p>
                  <strong>Proof URL:</strong>{' '}
                  <a
                    href={reviewingOrder.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#2563EB] underline"
                  >
                    <span>Open Receipt</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              )}
              {reviewingOrder.paymentNotes && (
                <p>
                  <strong>Customer Notes:</strong> {reviewingOrder.paymentNotes}
                </p>
              )}
              {reviewingOrder.reviewedByEmail && (
                <p className="text-slate-500 pt-1">
                  Reviewed by {reviewingOrder.reviewedByEmail} at {reviewingOrder.reviewedAt}
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold mb-1">
                {lang === 'ar' ? 'ملاحظة / سبب القرار المالي' : 'Review Decision Reason'}
              </label>
              <input
                type="text"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="e.g. Bank receipt matched in AlRajhi statement"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {reviewingOrder.status === 'pending_review' && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleReview(reviewingOrder, 'reject')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white font-bold"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'رفض الدفع' : 'Reject'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleReview(reviewingOrder, 'approve')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'تأكيد واعتماد الطلب' : 'Confirm & Approve'}</span>
                  </button>
                </>
              )}
              {reviewingOrder.status === 'approved' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleReview(reviewingOrder, 'refund')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'استرداد وإلغاء التفعيل' : 'Mark Refunded & Revoke'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
