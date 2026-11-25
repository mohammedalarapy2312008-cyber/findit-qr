import React, { useEffect, useMemo, useState } from 'react';
import {
  Info,
  Loader2,
  Megaphone,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Tag,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminApi, ApiRequestError } from '../../services/adminApi';
import {
  AnnouncementBanner,
  CouponCode,
  MarketingCampaign,
  SupportTicket,
} from '../../types/domain';

export const AdminMarketingView: React.FC = () => {
  const { lang, showToast, refreshCatalog } = useApp();
  const [announcements, setAnnouncements] = useState<AnnouncementBanner[]>([]);
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [annForm, setAnnForm] = useState({
    titleAr: '',
    titleEn: '',
    bodyAr: '',
    bodyEn: '',
    severity: 'info' as AnnouncementBanner['severity'],
    targetAudience: 'all' as AnnouncementBanner['targetAudience'],
  });

  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percent' as CouponCode['discountType'],
    discountValue: 15,
    maxUses: 100,
    appliesTo: 'all' as CouponCode['appliesTo'],
    expiresAt: '',
  });

  const [campForm, setCampForm] = useState({
    titleAr: '',
    titleEn: '',
    messageAr: '',
    messageEn: '',
    targetAudience: 'all' as MarketingCampaign['targetAudience'],
    targetUid: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getMarketing();
      setAnnouncements(res.announcements || []);
      setCoupons(res.coupons || []);
      setCampaigns(res.campaigns || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createAnnouncement(annForm);
      showToast('success', lang === 'ar' ? 'تم نشر الإعلان' : 'Announcement Published', '');
      setAnnForm({
        titleAr: '',
        titleEn: '',
        bodyAr: '',
        bodyEn: '',
        severity: 'info',
        targetAudience: 'all',
      });
      await load();
      await refreshCatalog();
    } catch (err) {
      showToast(
        'error',
        'Error',
        err instanceof ApiRequestError ? err.messageEn : 'Failed to create announcement.'
      );
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createCoupon({
        ...couponForm,
        expiresAt: couponForm.expiresAt || null,
      });
      showToast('success', lang === 'ar' ? 'تم إنشاء الكوبون' : 'Coupon Created', couponForm.code);
      setCouponForm({
        code: '',
        discountType: 'percent',
        discountValue: 15,
        maxUses: 100,
        appliesTo: 'all',
        expiresAt: '',
      });
      await load();
    } catch (err) {
      showToast(
        'error',
        'Error',
        err instanceof ApiRequestError ? err.messageEn : 'Failed to create coupon.'
      );
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.sendCampaign(campForm);
      showToast(
        'success',
        lang === 'ar' ? 'تم إرسال الإشعار الداخلي' : 'In-App Campaign Delivered',
        `Recipients: ${res.campaign.sentCount}`
      );
      setCampForm({
        titleAr: '',
        titleEn: '',
        messageAr: '',
        messageEn: '',
        targetAudience: 'all',
        targetUid: '',
      });
      await load();
    } catch (err) {
      showToast(
        'error',
        'Error',
        err instanceof ApiRequestError ? err.messageEn : 'Failed to send campaign.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-[#17243A] dark:text-white">
          {lang === 'ar' ? 'الإشعارات والتسويق والكوبونات' : 'Notifications, Banners & Coupons'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {lang === 'ar'
            ? 'إدارة بنرات الموقع، أكواد الخصم الحقيقية، وإرسال تنبيهات داخل لوحة المستخدمين.'
            : 'Manage live site announcements, checkout coupons, and targeted in-app broadcasts.'}
        </p>
      </div>

      {/* Honest Gateway Status Notice */}
      <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-200">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          {lang === 'ar'
            ? 'البث يعمل فعليًا كإشعارات داخل حسابات المستخدمين في قاعدة البيانات. بوابات البريد (SMTP) وواتساب/SMS/Push الخارجية غير مربوطة خارجيًا وتظهر حالتها بوضوح.'
            : 'Campaigns deliver as real database-backed in-app notifications. External Email SMTP, WhatsApp, SMS, and Web Push gateways require external API credentials.'}
        </span>
      </div>

      {loading && announcements.length === 0 && coupons.length === 0 ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Announcements Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-sm font-extrabold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#2563EB]" />
              <span>{lang === 'ar' ? 'بنرات الإعلانات العامة' : 'Announcement Banners'}</span>
            </h2>
            <form onSubmit={handleAddAnnouncement} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="العنوان (عربي)"
                  value={annForm.titleAr}
                  onChange={(e) => setAnnForm({ ...annForm, titleAr: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="Title (EN)"
                  value={annForm.titleEn}
                  onChange={(e) => setAnnForm({ ...annForm, titleEn: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
                />
              </div>
              <input
                type="text"
                placeholder="النص المختصر للإعلان..."
                value={annForm.bodyAr}
                onChange={(e) => setAnnForm({ ...annForm, bodyAr: e.target.value, bodyEn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={annForm.severity}
                  onChange={(e) =>
                    setAnnForm({
                      ...annForm,
                      severity: e.target.value as AnnouncementBanner['severity'],
                    })
                  }
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
                >
                  <option value="info">info</option>
                  <option value="promo">promo</option>
                  <option value="warning">warning</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'نشر بنر' : 'Publish'}</span>
                </button>
              </div>
            </form>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {announcements.map((a) => (
                <div key={a.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">{lang === 'ar' ? a.titleAr : a.titleEn}</p>
                    <p className="text-[11px] text-slate-500">{lang === 'ar' ? a.bodyAr : a.bodyEn}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        await adminApi.updateAnnouncement(a.id, { isActive: !a.isActive });
                        await load();
                        await refreshCatalog();
                      }}
                      className={`px-2 py-1 rounded font-bold ${
                        a.isActive
                          ? 'bg-emerald-500/15 text-emerald-700'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {a.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await adminApi.deleteAnnouncement(a.id);
                        await load();
                        await refreshCatalog();
                      }}
                      className="p-1 text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coupons Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-sm font-extrabold flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#19B5A5]" />
              <span>{lang === 'ar' ? 'أكواد الخصم (Coupons)' : 'Discount Coupons'}</span>
            </h2>
            <form onSubmit={handleAddCoupon} className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                dir="ltr"
                placeholder="FINDIT20"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 font-mono uppercase"
              />
              <select
                value={couponForm.discountType}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    discountType: e.target.value as CouponCode['discountType'],
                  })
                }
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
              >
                <option value="percent">% Percent</option>
                <option value="fixed_sar">SAR Fixed</option>
              </select>
              <input
                type="number"
                min={1}
                value={couponForm.discountValue}
                onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                placeholder="Value"
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 font-mono"
              />
              <input
                type="number"
                min={0}
                value={couponForm.maxUses}
                onChange={(e) => setCouponForm({ ...couponForm, maxUses: Number(e.target.value) })}
                placeholder="Max Uses"
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 font-mono"
              />
              <select
                value={couponForm.appliesTo}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    appliesTo: e.target.value as CouponCode['appliesTo'],
                  })
                }
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
              >
                <option value="all">All Orders</option>
                <option value="templates">Templates Only</option>
                <option value="plans">Plans Only</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#19B5A5] text-[#070D17] font-extrabold"
              >
                {lang === 'ar' ? 'إنشاء كوبون' : 'Create Coupon'}
              </button>
            </form>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {coupons.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-extrabold">{c.code}</span>
                    <span className="text-slate-500 ms-2">
                      ({c.discountType === 'percent' ? `${c.discountValue}%` : `${c.discountValue} SAR`} ·{' '}
                      {c.usedCount}/{c.maxUses})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await adminApi.updateCoupon(c.id, { isActive: !c.isActive });
                      await load();
                    }}
                    className={`px-2 py-1 rounded font-bold ${
                      c.isActive
                        ? 'bg-emerald-500/15 text-emerald-700'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Targeted In-App Broadcast */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-sm font-extrabold flex items-center gap-2">
              <Send className="w-4 h-4 text-[#2563EB]" />
              <span>
                {lang === 'ar'
                  ? 'إرسال إشعار داخلي لمجموعات المستخدمين'
                  : 'Targeted In-App Notification Broadcast'}
              </span>
            </h2>
            <form onSubmit={handleSendCampaign} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="عنوان الإشعار (عربي)"
                value={campForm.titleAr}
                onChange={(e) => setCampForm({ ...campForm, titleAr: e.target.value })}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                required
                dir="ltr"
                placeholder="Notification Title (EN)"
                value={campForm.titleEn}
                onChange={(e) => setCampForm({ ...campForm, titleEn: e.target.value })}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
              />
              <select
                value={campForm.targetAudience}
                onChange={(e) =>
                  setCampForm({
                    ...campForm,
                    targetAudience: e.target.value as MarketingCampaign['targetAudience'],
                  })
                }
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
              >
                <option value="all">{lang === 'ar' ? 'جميع المستخدمين' : 'All Users'}</option>
                <option value="free_users">{lang === 'ar' ? 'الباقة المجانية' : 'Free Plan Users'}</option>
                <option value="paid_users">{lang === 'ar' ? 'المشتركون المدفوعون' : 'Paid Users'}</option>
                <option value="specific_user">{lang === 'ar' ? 'مستخدم محدد' : 'Specific User'}</option>
              </select>

              {campForm.targetAudience === 'specific_user' && (
                <input
                  type="text"
                  placeholder="User Email or UID"
                  value={campForm.targetUid}
                  onChange={(e) => setCampForm({ ...campForm, targetUid: e.target.value })}
                  className="md:col-span-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
                />
              )}

              <textarea
                rows={2}
                required
                placeholder="نص الرسالة التي ستصل في صندوق إشعارات المستخدمين..."
                value={campForm.messageAr}
                onChange={(e) =>
                  setCampForm({ ...campForm, messageAr: e.target.value, messageEn: e.target.value })
                }
                className="md:col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إرسال داخل التطبيق الآن' : 'Send In-App Broadcast'}</span>
              </button>
            </form>

            {campaigns.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                {campaigns.slice(0, 5).map((cmp) => (
                  <div key={cmp.id} className="flex justify-between text-[11px] text-slate-500">
                    <span>
                      <strong>{lang === 'ar' ? cmp.titleAr : cmp.titleEn}</strong> ({cmp.targetAudience})
                    </span>
                    <span className="font-mono">
                      Delivered to {cmp.sentCount} users · {cmp.createdAt.slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminSupportView: React.FC = () => {
  const { lang, showToast } = useApp();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSupportTickets();
      setTickets(res.tickets || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateSelectedTicket = async (
    updates: Partial<SupportTicket> & { replyMessage?: string; isInternalNote?: boolean }
  ) => {
    if (!selected) return;
    try {
      const res = await adminApi.updateSupportTicket(selected.id, updates);
      setSelected(res.ticket);
      setReplyText('');
      showToast('success', lang === 'ar' ? 'تم تحديث التذكرة' : 'Ticket Updated', res.ticket.ticketNumber);
      await load();
    } catch (err) {
      showToast(
        'error',
        'Error',
        err instanceof ApiRequestError ? err.messageEn : 'Update failed.'
      );
    }
  };

  const filtered = useMemo(
    () => (statusFilter === 'all' ? tickets : tickets.filter((t) => t.status === statusFilter)),
    [tickets, statusFilter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'دعم العملاء والتذاكر والبلاغات' : 'Customer Support & Abuse Desk'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar'
              ? 'جميع تذاكر صفحة اتصل بنا وبلاغات المشكلات تصل إلى هنا وتُحفظ في قاعدة البيانات.'
              : 'All /contact inquiries and /found problem reports persist here in real time.'}
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

      <div className="flex flex-wrap gap-2">
        {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
              statusFilter === st
                ? 'bg-[#17243A] dark:bg-[#2563EB] text-white border-transparent'
                : 'bg-white dark:bg-[#0F1A2B] border-slate-200 dark:border-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* Ticket List */}
        <div className="rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-slate-400">
              {lang === 'ar' ? 'لا توجد تذاكر دعم حالية.' : 'No support tickets found.'}
            </p>
          ) : (
            filtered.map((tkt) => (
              <button
                key={tkt.id}
                type="button"
                onClick={() => setSelected(tkt)}
                className={`w-full text-start p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 space-y-1 ${
                  selected?.id === tkt.id ? 'bg-blue-50/70 dark:bg-blue-950/30' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[#2563EB]">{tkt.ticketNumber}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                    {tkt.status}
                  </span>
                </div>
                <p className="font-bold text-[#17243A] dark:text-white truncate">{tkt.subject}</p>
                <p className="text-[11px] text-slate-500">
                  {tkt.requesterName} · {tkt.category} · {tkt.priority}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Ticket Thread Inspector */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          {!selected ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
              <MessageSquare className="w-8 h-8 opacity-40" />
              <span>{lang === 'ar' ? 'اختر تذكرة لعرض التفاصيل والرد' : 'Select a ticket to inspect'}</span>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-[#2563EB] font-bold">{selected.ticketNumber}</span>
                  <h3 className="text-base font-extrabold text-[#17243A] dark:text-white">
                    {selected.subject}
                  </h3>
                  <p className="text-slate-500" dir="ltr">
                    {selected.requesterName} &lt;{selected.requesterEmail}&gt;
                    {selected.relatedItemSerial ? ` · QR: ${selected.relatedItemSerial}` : ''}
                  </p>
                </div>

                <div className="flex gap-2">
                  <select
                    value={selected.status}
                    onChange={(e) =>
                      void updateSelectedTicket({
                        status: e.target.value as SupportTicket['status'],
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    <option value="open">open</option>
                    <option value="in_progress">in_progress</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </select>
                  <select
                    value={selected.priority}
                    onChange={(e) =>
                      void updateSelectedTicket({
                        priority: e.target.value as SupportTicket['priority'],
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="urgent">urgent</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                {selected.description}
              </div>

              {selected.replies.length > 0 && (
                <div className="space-y-2">
                  {selected.replies.map((r) => (
                    <div
                      key={r.id}
                      className={`p-3 rounded-xl border ${
                        r.isInternalNote
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                          : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
                      }`}
                    >
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span>
                          {r.authorName} {r.isInternalNote ? '(Internal Note)' : '(Public Reply)'}
                        </span>
                        <span className="font-mono text-slate-400">
                          {r.createdAt.slice(0, 16).replace('T', ' ')}
                        </span>
                      </div>
                      <p>{r.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'اكتب ردًا للعميل أو ملاحظة داخلية...'
                      : 'Write a customer reply or internal note...'
                  }
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                />
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 font-bold">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                    />
                    <span>{lang === 'ar' ? 'ملاحظة داخلية للفريق فقط' : 'Internal staff note'}</span>
                  </label>
                  <button
                    type="button"
                    disabled={!replyText.trim()}
                    onClick={() =>
                      void updateSelectedTicket({
                        replyMessage: replyText,
                        isInternalNote,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold disabled:opacity-50"
                  >
                    {lang === 'ar' ? 'إرسال وحفظ' : 'Post Reply'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
