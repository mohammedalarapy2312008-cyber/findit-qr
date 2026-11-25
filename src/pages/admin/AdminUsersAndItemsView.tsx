import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Ban,
  CheckCircle2,
  Eye,
  Flag,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminApi, ApiRequestError } from '../../services/adminApi';
import {
  ActivityLogEntry,
  AdminItemSummary,
  AdminUserSummary,
  IssuedLicense,
  ManagedPlanDefinition,
  ManagedPurchaseOrder,
  RegisteredItem,
  SubscriptionRecord,
  UserPlanTier,
  UserProfile,
} from '../../types/domain';

export const AdminUsersView: React.FC<{
  onRequireReauth: (retryAction?: () => Promise<void>) => void;
}> = ({ onRequireReauth }) => {
  const { lang, showToast } = useApp();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [plans, setPlans] = useState<ManagedPlanDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [inspectorData, setInspectorData] = useState<{
    user: UserProfile;
    items: RegisteredItem[];
    orders: ManagedPurchaseOrder[];
    subscriptions: SubscriptionRecord[];
    licenses: IssuedLicense[];
    activities: ActivityLogEntry[];
  } | null>(null);
  const [editPlan, setEditPlan] = useState<UserPlanTier>('Free');
  const [editNotes, setEditNotes] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, catRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getPublicCatalog(),
      ]);
      setUsers(uRes.users || []);
      setPlans(catRes.plans || []);
    } catch (err) {
      if (err instanceof ApiRequestError && err.isReauthRequired) {
        onRequireReauth(load);
      } else {
        showToast(
          'error',
          lang === 'ar' ? 'خطأ تحميل' : 'Load Error',
          err instanceof ApiRequestError
            ? lang === 'ar'
              ? err.messageAr
              : err.messageEn
            : 'Failed to load users.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openInspector = async (uid: string) => {
    setSelectedUid(uid);
    setInspectorLoading(true);
    try {
      const details = await adminApi.getUserDetails(uid);
      setInspectorData({
        user: details.user,
        items: details.items,
        orders: details.orders,
        subscriptions: details.subscriptions,
        licenses: details.licenses,
        activities: details.activities,
      });
      setEditPlan(details.user.plan);
      setEditNotes(details.user.adminNotes || '');
    } catch (err) {
      showToast(
        'error',
        lang === 'ar' ? 'تعذر العرض' : 'Inspector Error',
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : 'Could not load user details.'
      );
      setSelectedUid(null);
    } finally {
      setInspectorLoading(false);
    }
  };

  const applyUserUpdate = async (
    uid: string,
    payload: { accountStatus?: 'active' | 'suspended'; plan?: UserPlanTier; adminNotes?: string }
  ) => {
    setSavingUser(true);
    try {
      await adminApi.updateUser(uid, payload);
      showToast(
        'success',
        lang === 'ar' ? 'تم تحديث الحساب' : 'User Updated',
        lang === 'ar' ? 'تم حفظ التغييرات وتوثيقها في سجل المراجعة.' : 'Changes saved and audited.'
      );
      await load();
      if (selectedUid === uid) {
        await openInspector(uid);
      }
    } catch (err) {
      if (err instanceof ApiRequestError && err.isReauthRequired) {
        onRequireReauth(() => applyUserUpdate(uid, payload));
      } else {
        showToast(
          'error',
          lang === 'ar' ? 'تعذر التنفيذ' : 'Action Blocked',
          err instanceof ApiRequestError
            ? lang === 'ar'
              ? err.messageAr
              : err.messageEn
            : 'Update failed.'
        );
      }
    } finally {
      setSavingUser(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (planFilter !== 'all' && u.plan !== planFilter) return false;
      if (statusFilter !== 'all' && u.accountStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q)
      );
    });
  }, [users, query, planFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'إدارة المستخدمين' : 'Users Management'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar'
              ? `إجمالي الحسابات المسجلة: ${users.length}`
              : `Total registered accounts: ${users.length}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#2563EB]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{lang === 'ar' ? 'تحديث' : 'Refresh'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'بحث بالاسم أو البريد أو UID...'
                : 'Search by name, email, or UID...'
            }
            className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 text-xs text-[#17243A] dark:text-white"
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#17243A] dark:text-white"
        >
          <option value="all">{lang === 'ar' ? 'كل الباقات' : 'All Plans'}</option>
          <option value="Free">Starter / Free</option>
          <option value="Plus">Plus</option>
          <option value="Premium">Premium</option>
          <option value="Pro">Pro</option>
          <option value="Business">Business</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#17243A] dark:text-white"
        >
          <option value="all">{lang === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
          <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
          <option value="suspended">{lang === 'ar' ? 'معلّق' : 'Suspended'}</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            {lang === 'ar' ? 'لا يوجد مستخدمون مطابقون للبحث.' : 'No matching users found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-[#0B1424] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'المستخدم' : 'User'}
                  </th>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'الدور' : 'Role'}
                  </th>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'الباقة والحصة' : 'Plan & Quota'}
                  </th>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'الأغراض / الطلبات' : 'Items / Orders'}
                  </th>
                  <th className="py-3 px-4 text-end font-bold">
                    {lang === 'ar' ? 'إجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((u) => (
                  <tr
                    key={u.uid}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#17243A] dark:text-white">{u.displayName}</div>
                      <div className="text-[11px] text-slate-500 font-mono" dir="ltr">
                        {u.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          u.role === 'super_admin'
                            ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                            : u.role === 'staff_admin'
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <span className="font-bold text-[#17243A] dark:text-slate-200">{u.plan}</span>{' '}
                      <span className="text-slate-400">
                        ({u.activeItemsCount}/{u.activeItemsLimit})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          u.accountStatus === 'suspended'
                            ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {u.accountStatus === 'suspended'
                          ? lang === 'ar'
                            ? 'معلّق'
                            : 'Suspended'
                          : lang === 'ar'
                          ? 'نشط'
                          : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {u.totalItemsCount} / {u.totalOrdersCount}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void openInspector(u.uid)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#2563EB] hover:text-white font-bold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'فحص' : 'Inspect'}</span>
                        </button>
                        {u.role !== 'super_admin' && (
                          <button
                            type="button"
                            onClick={() =>
                              void applyUserUpdate(u.uid, {
                                accountStatus:
                                  u.accountStatus === 'suspended' ? 'active' : 'suspended',
                              })
                            }
                            className={`px-2.5 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 ${
                              u.accountStatus === 'suspended'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-red-500/15 text-red-700 dark:text-red-300'
                            }`}
                          >
                            {u.accountStatus === 'suspended' ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'تفعيل' : 'Activate'}</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'تعليق' : 'Suspend'}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Inspector Modal */}
      {selectedUid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-[#17243A] dark:text-white">
                {lang === 'ar' ? 'ملف المستخدم التفصيلي' : 'User Account Inspector'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedUid(null);
                  setInspectorData(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectorLoading || !inspectorData ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
              </div>
            ) : (
              <div className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-slate-400">{lang === 'ar' ? 'الاسم' : 'Display Name'}</p>
                    <p className="font-bold text-sm text-[#17243A] dark:text-white">
                      {inspectorData.user.displayName}
                    </p>
                    <p className="text-slate-500 font-mono mt-0.5" dir="ltr">
                      {inspectorData.user.email}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      UID: {inspectorData.user.uid}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'ar' ? 'تغيير الباقة يدويًا' : 'Manual Plan Override'}
                    </label>
                    <select
                      value={editPlan}
                      onChange={(e) => setEditPlan(e.target.value as UserPlanTier)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0F1A2B] border border-slate-300 dark:border-slate-700 font-bold"
                    >
                      {Array.from(
                        new Set(['Free', 'Plus', 'Premium', 'Pro', ...plans.map((p) => p.quotaTier)])
                      ).map((tier) => (
                        <option key={tier} value={tier}>
                          {tier}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'ar' ? 'ملاحظات إدارية داخلية' : 'Internal Admin Notes'}
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={savingUser}
                    onClick={() =>
                      void applyUserUpdate(inspectorData.user.uid, {
                        plan: editPlan,
                        adminNotes: editNotes,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold disabled:opacity-50"
                  >
                    {lang === 'ar' ? 'حفظ الباقة والملاحظات' : 'Save Plan & Notes'}
                  </button>

                  {inspectorData.user.role !== 'super_admin' && (
                    <button
                      type="button"
                      disabled={savingUser}
                      onClick={() =>
                        void applyUserUpdate(inspectorData.user.uid, {
                          accountStatus:
                            inspectorData.user.accountStatus === 'suspended'
                              ? 'active'
                              : 'suspended',
                          adminNotes: editNotes,
                        })
                      }
                      className={`px-4 py-2 rounded-xl font-bold ${
                        inspectorData.user.accountStatus === 'suspended'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {inspectorData.user.accountStatus === 'suspended'
                        ? lang === 'ar'
                          ? 'إعادة تفعيل الحساب'
                          : 'Reactivate Account'
                        : lang === 'ar'
                        ? 'تعليق الحساب وإنهاء جلساته'
                        : 'Suspend Account & Revoke Sessions'}
                    </button>
                  )}
                </div>

                {/* User Summary Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block">
                      {lang === 'ar' ? 'الأغراض' : 'Items'}
                    </span>
                    <span className="text-base font-extrabold font-mono">
                      {inspectorData.items.length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block">
                      {lang === 'ar' ? 'الطلبات' : 'Orders'}
                    </span>
                    <span className="text-base font-extrabold font-mono">
                      {inspectorData.orders.length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block">
                      {lang === 'ar' ? 'التراخيص' : 'Licenses'}
                    </span>
                    <span className="text-base font-extrabold font-mono">
                      {inspectorData.licenses.length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block">
                      {lang === 'ar' ? 'الاشتراكات' : 'Subscriptions'}
                    </span>
                    <span className="text-base font-extrabold font-mono">
                      {inspectorData.subscriptions.length}
                    </span>
                  </div>
                </div>

                {inspectorData.items.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">
                      {lang === 'ar' ? 'أغراض المستخدم وأكواد QR' : 'User Registered Items & QR'}
                    </h3>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      {inspectorData.items.map((it) => (
                        <div key={it.id} className="p-3 flex items-center justify-between gap-2">
                          <div>
                            <p className="font-bold text-[#17243A] dark:text-white">{it.name}</p>
                            <p className="text-[11px] font-mono text-slate-500">
                              {it.codeSerial} · {it.status} · {it.totalScans} scans
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                            {it.moderationFlag || 'clean'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminItemsView: React.FC<{
  onRequireReauth: (retryAction?: () => Promise<void>) => void;
}> = ({ onRequireReauth }) => {
  const { lang, navigate, showToast } = useApp();
  const [items, setItems] = useState<AdminItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [flagFilter, setFlagFilter] = useState<'all' | 'clean' | 'flagged' | 'restricted'>('all');

  const [transferTarget, setTransferTarget] = useState<AdminItemSummary | null>(null);
  const [targetEmail, setTargetEmail] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getItems();
      setItems(res.items || []);
    } catch (err) {
      showToast(
        'error',
        lang === 'ar' ? 'خطأ تحميل' : 'Load Error',
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : 'Failed to load items.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleModerate = async (
    item: AdminItemSummary,
    updates: {
      status?: RegisteredItem['status'];
      moderationFlag?: 'clean' | 'flagged' | 'restricted';
    }
  ) => {
    try {
      await adminApi.moderateItem(item.id, updates);
      showToast(
        'success',
        lang === 'ar' ? 'تم تحديث الغرض' : 'Item Moderated',
        `${item.codeSerial}`
      );
      await load();
    } catch (err) {
      showToast(
        'error',
        lang === 'ar' ? 'تعذر التنفيذ' : 'Moderation Failed',
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : 'Error updating item.'
      );
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget) return;
    setTransferBusy(true);
    try {
      await adminApi.transferItemOwner(transferTarget.id, {
        targetEmail,
        reason: transferReason || 'Admin audited ownership transfer',
      });
      showToast(
        'success',
        lang === 'ar' ? 'تم نقل الملكية' : 'Ownership Transferred',
        `${transferTarget.codeSerial} -> ${targetEmail}`
      );
      setTransferTarget(null);
      setTargetEmail('');
      setTransferReason('');
      await load();
    } catch (err) {
      if (err instanceof ApiRequestError && err.isReauthRequired) {
        onRequireReauth(handleTransfer);
      } else {
        showToast(
          'error',
          lang === 'ar' ? 'تعذر النقل' : 'Transfer Failed',
          err instanceof ApiRequestError
            ? lang === 'ar'
              ? err.messageAr
              : err.messageEn
            : 'Could not transfer ownership.'
        );
      }
    } finally {
      setTransferBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const flag = it.moderationFlag || 'clean';
      if (flagFilter !== 'all' && flag !== flagFilter) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.codeSerial.toLowerCase().includes(q) ||
        it.ownerEmail.toLowerCase().includes(q)
      );
    });
  }, [items, query, flagFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'إدارة الأغراض وأكواد QR والرقابة' : 'Items & QR Moderation'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar'
              ? 'إيقاف/استعادة أي QR، تقييد الصفحات المخالفة، ونقل الملكية الموثق.'
              : 'Pause/restore QR tags, restrict abusive public pages, and audit ownership transfers.'}
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

      <div className="p-4 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'بحث برقم السيريال (FQR-...) أو اسم الغرض أو إيميل المالك...'
                : 'Search by QR serial (FQR-...), item name, or owner email...'
            }
            className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>

        <select
          value={flagFilter}
          onChange={(e) =>
            setFlagFilter(e.target.value as 'all' | 'clean' | 'flagged' | 'restricted')
          }
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 text-xs font-semibold"
        >
          <option value="all">{lang === 'ar' ? 'كل حالات الرقابة' : 'All Moderation Flags'}</option>
          <option value="clean">{lang === 'ar' ? 'سليم (Clean)' : 'Clean'}</option>
          <option value="flagged">{lang === 'ar' ? 'معلّم للمراجعة' : 'Flagged'}</option>
          <option value="restricted">{lang === 'ar' ? 'مقيّد / محجوب' : 'Restricted'}</option>
        </select>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            {lang === 'ar' ? 'لا توجد أغراض مطابقة.' : 'No matching items.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-[#0B1424] border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'الغرض / السيريال' : 'Item / Serial'}
                  </th>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'المالك' : 'Owner'}
                  </th>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'المسوحات' : 'Scans'}
                  </th>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'الحالة والرقابة' : 'Status & Flag'}
                  </th>
                  <th className="py-3 px-4 text-end font-bold">
                    {lang === 'ar' ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => {
                  const flag = item.moderationFlag || 'clean';
                  return (
                    <tr key={item.id}>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#17243A] dark:text-white">{item.name}</div>
                        <div className="text-[11px] font-mono text-[#2563EB] dark:text-[#19B5A5]">
                          {item.codeSerial}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">{item.ownerDisplayName}</div>
                        <div className="text-[11px] font-mono text-slate-500" dir="ltr">
                          {item.ownerEmail}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums">{item.totalScans}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                            {item.status}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              flag === 'restricted'
                                ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                                : flag === 'flagged'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {flag}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate('found-item', { codeSerial: item.codeSerial })}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold hover:text-[#2563EB]"
                          >
                            {lang === 'ar' ? 'فتح الصفحة' : 'Inspect /found'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleModerate(item, {
                                status: item.status === 'Archived' ? 'Active' : 'Archived',
                              })
                            }
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold inline-flex items-center gap-1"
                          >
                            {item.status === 'Archived' ? (
                              <>
                                <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{lang === 'ar' ? 'تفعيل QR' : 'Restore QR'}</span>
                              </>
                            ) : (
                              <>
                                <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>{lang === 'ar' ? 'إيقاف QR' : 'Pause QR'}</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleModerate(item, {
                                moderationFlag: flag === 'restricted' ? 'clean' : 'restricted',
                              })
                            }
                            className={`px-2 py-1 rounded-lg font-bold inline-flex items-center gap-1 ${
                              flag === 'restricted'
                                ? 'bg-emerald-500/15 text-emerald-700'
                                : 'bg-red-500/15 text-red-700'
                            }`}
                          >
                            {flag === 'restricted' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'رفع التقييد' : 'Clear Flag'}</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'تقييد الكود' : 'Restrict'}</span>
                              </>
                            )}
                          </button>

                          {flag === 'clean' && (
                            <button
                              type="button"
                              onClick={() =>
                                void handleModerate(item, { moderationFlag: 'flagged' })
                              }
                              className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-700 font-bold inline-flex items-center gap-1"
                            >
                              <Flag className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'وسم' : 'Flag'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setTransferTarget(item)}
                            className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold inline-flex items-center gap-1"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? 'نقل الملكية' : 'Transfer'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ownership Transfer Modal */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 p-6 space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-[#17243A] dark:text-white">
              {lang === 'ar' ? 'نقل ملكية غرض وكود QR' : 'Audited Ownership Transfer'}
            </h3>
            <p className="text-slate-500">
              {transferTarget.name} (<span className="font-mono">{transferTarget.codeSerial}</span>)
            </p>
            <div>
              <label className="block font-bold mb-1">
                {lang === 'ar' ? 'البريد الإلكتروني للمالك الجديد' : 'New Owner Email'}
              </label>
              <input
                type="email"
                dir="ltr"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="new.owner@domain.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">
                {lang === 'ar' ? 'سبب النقل (يوثّق في Audit Log)' : 'Transfer Reason (Audited)'}
              </label>
              <input
                type="text"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={transferBusy || !targetEmail}
                onClick={() => void handleTransfer()}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold disabled:opacity-50"
              >
                {transferBusy
                  ? lang === 'ar'
                    ? 'جاري التنفيذ...'
                    : 'Transferring...'
                  : lang === 'ar'
                  ? 'تأكيد النقل'
                  : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
