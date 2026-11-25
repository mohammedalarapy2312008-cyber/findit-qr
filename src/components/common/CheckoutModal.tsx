import React, { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Loader2, Tag, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminApi, ApiRequestError } from '../../services/adminApi';
import { BillingDurationId } from '../../data/plansCatalog';
import { ManagedPlanDefinition, TagDesignTemplate } from '../../types/domain';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderType: 'template_purchase' | 'subscription_upgrade';
  template?: TagDesignTemplate;
  plan?: ManagedPlanDefinition;
  defaultDuration?: BillingDurationId;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  orderType,
  template,
  plan,
  defaultDuration = '1m',
}) => {
  const { lang, authUser, platformSettings, showToast, navigate, refreshWorkspaceAll } = useApp();

  const [duration, setDuration] = useState<BillingDurationId>(defaultDuration);
  const [quantity, setQuantity] = useState(1);
  const [currency, setCurrency] = useState<'SAR' | 'USD'>(platformSettings.defaultCurrency || 'SAR');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<{
    code: string;
    amountSar: number;
    amountUsd: number;
    discountSar: number;
    discountUsd: number;
  } | null>(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [orderDoneNumber, setOrderDoneNumber] = useState('');
  const [orderDonePending, setOrderDonePending] = useState(true);

  useEffect(() => {
    setDuration(defaultDuration);
    setCouponDiscount(null);
    setCouponMsg('');
    setOrderDoneNumber('');
  }, [isOpen, defaultDuration, template?.id, plan?.id]);

  if (!isOpen) return null;

  const durationMonths: 1 | 3 | 12 = duration === '3m' ? 3 : duration === '12m' ? 12 : 1;

  const rawSubtotalSar =
    orderType === 'template_purchase' && template
      ? template.isFree || template.priceSar === 0
        ? 0
        : template.priceSar * quantity
      : plan
      ? durationMonths === 3
        ? plan.quarterlySar
        : durationMonths === 12
        ? plan.yearlySar
        : plan.monthlySar
      : 0;

  const rawSubtotalUsd =
    orderType === 'template_purchase' && template
      ? template.isFree || template.priceSar === 0
        ? 0
        : template.priceUsd * quantity
      : plan
      ? durationMonths === 3
        ? plan.quarterlyUsd
        : durationMonths === 12
        ? plan.yearlyUsd
        : plan.monthlyUsd
      : 0;

  const finalSar = couponDiscount ? couponDiscount.amountSar : rawSubtotalSar;
  const finalUsd = couponDiscount ? couponDiscount.amountUsd : rawSubtotalUsd;
  const isFreeCheckout = finalSar === 0 && finalUsd === 0;

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!authUser) {
      navigate('login');
      return;
    }
    setValidatingCoupon(true);
    setCouponMsg('');
    try {
      const res = await adminApi.validateCoupon({
        code: couponCode.trim(),
        subtotalSar: rawSubtotalSar,
        subtotalUsd: rawSubtotalUsd,
        scope: orderType === 'subscription_upgrade' ? 'plans' : 'templates',
      });
      setCouponDiscount({
        code: res.couponApplied,
        amountSar: res.amountSar,
        amountUsd: res.amountUsd,
        discountSar: res.discountSar,
        discountUsd: res.discountUsd,
      });
      setCouponMsg(
        lang === 'ar'
          ? `تم تطبيق الكوبون (${res.couponApplied}) بخصم ${res.discountSar} ر.س.`
          : `Coupon ${res.couponApplied} applied (-${res.discountSar} SAR / -$${res.discountUsd}).`
      );
    } catch (err) {
      setCouponDiscount(null);
      setCouponMsg(
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : 'Invalid coupon.'
      );
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      onClose();
      navigate('login');
      return;
    }
    const targetId = orderType === 'template_purchase' ? template?.id || '' : plan?.id || '';
    if (!targetId) return;

    setSubmitting(true);
    try {
      const res = await adminApi.createOrder({
        orderType,
        targetId,
        quantity,
        durationMonths,
        currency,
        couponCode: couponDiscount?.code || undefined,
        transferReference: isFreeCheckout ? undefined : transferReference,
        paymentProofUrl: isFreeCheckout ? undefined : paymentProofUrl,
        paymentNotes: isFreeCheckout ? undefined : paymentNotes,
      });
      setOrderDoneNumber(res.order.orderNumber);
      setOrderDonePending(res.order.status === 'pending_review');
      await refreshWorkspaceAll();
      showToast(
        res.order.status === 'approved' ? 'success' : 'info',
        lang === 'ar' ? 'تم تسجيل الطلب' : 'Order Recorded',
        lang === 'ar' ? res.messageAr : res.messageEn
      );
    } catch (err) {
      showToast(
        'error',
        lang === 'ar' ? 'تعذر إرسال الطلب' : 'Order Failed',
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : 'Could not submit order.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 text-xs"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-base font-extrabold text-[#17243A] dark:text-white">
              {orderType === 'template_purchase'
                ? lang === 'ar'
                  ? 'شراء أو ترخيص قالب QR'
                  : 'Template License Checkout'
                : lang === 'ar'
                ? 'طلب ترقية الباقة'
                : 'Subscription Upgrade Checkout'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderDoneNumber ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-extrabold text-[#17243A] dark:text-white">
              {orderDonePending
                ? lang === 'ar'
                  ? `تم تسجيل الطلب (${orderDoneNumber}) بانتظار المراجعة`
                  : `Order (${orderDoneNumber}) Pending Review`
                : lang === 'ar'
                ? `تم إصدار الترخيص المجاني (${orderDoneNumber})`
                : `Free License Issued (${orderDoneNumber})`}
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {orderDonePending
                ? lang === 'ar'
                  ? 'لن يُعتمد الطلب أو تتفعل الباقة حتى يتم تأكيد الحوالة يدويًا من إدارة المنصة.'
                  : 'Your order remains in pending_review until platform administration verifies your bank transfer.'
                : lang === 'ar'
                ? 'يمكنك استعراض شهادة الترخيص الآن من صفحة المشتريات والتراخيص.'
                : 'You can inspect your issued license certificate in My Purchases.'}
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('my-purchases');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white font-bold"
              >
                {lang === 'ar' ? 'عرض مشترياتي وتراخيصي' : 'View My Purchases & Licenses'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-800 space-y-1.5">
              <p className="font-extrabold text-sm text-[#17243A] dark:text-white">
                {orderType === 'template_purchase' && template
                  ? lang === 'ar'
                    ? template.titleAr
                    : template.titleEn
                  : plan
                  ? lang === 'ar'
                    ? plan.nameAr
                    : plan.nameEn
                  : ''}
              </p>
              {template && (
                <p className="text-[11px] text-slate-500">
                  {lang === 'ar'
                    ? `التخصيص: ${template.customizationMode || 'mixed'} · التعديل بعد الحفظ: ${
                        template.allowEditAfterSave ? 'مسموح' : 'مغلق افتراضيًا'
                      }`
                    : `Customization: ${template.customizationMode || 'mixed'} · Edit after save: ${
                        template.allowEditAfterSave ? 'Allowed' : 'Locked by default'
                      }`}
                </p>
              )}
            </div>

            {orderType === 'subscription_upgrade' ? (
              <div className="grid grid-cols-3 gap-2">
                {(['1m', '3m', '12m'] as BillingDurationId[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDuration(d);
                      setCouponDiscount(null);
                    }}
                    className={`py-2 rounded-xl font-bold border ${
                      duration === d
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-slate-50 dark:bg-[#070D17] border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {d === '1m'
                      ? lang === 'ar'
                        ? 'شهر واحد'
                        : '1 Month'
                      : d === '3m'
                      ? lang === 'ar'
                        ? '٣ أشهر'
                        : '3 Months'
                      : lang === 'ar'
                      ? '١٢ شهرًا'
                      : '12 Months'}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ar' ? 'الكمية / النسخ' : 'Quantity / Copies'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={template?.maxCopies || 50}
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(Math.max(1, Number(e.target.value) || 1));
                      setCouponDiscount(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ar' ? 'عملة السداد' : 'Currency'}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value === 'USD' ? 'USD' : 'SAR')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    <option value="SAR">SAR (ر.س)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Coupon Input */}
            {!isFreeCheckout && (
              <div className="space-y-1.5">
                <label className="block font-bold">
                  {lang === 'ar' ? 'كود الخصم (اختياري)' : 'Coupon Code (Optional)'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="FINDIT20"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono uppercase"
                  />
                  <button
                    type="button"
                    disabled={validatingCoupon || !couponCode.trim()}
                    onClick={() => void handleValidateCoupon()}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold inline-flex items-center gap-1"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تطبيق' : 'Apply'}</span>
                  </button>
                </div>
                {couponMsg && (
                  <p className="text-[11px] font-semibold text-[#2563EB] dark:text-[#19B5A5]">
                    {couponMsg}
                  </p>
                )}
              </div>
            )}

            {/* Manual Transfer Details when Paid */}
            {!isFreeCheckout && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
                <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed font-semibold">
                  {lang === 'ar'
                    ? platformSettings.bankTransferInstructionsAr
                    : platformSettings.bankTransferInstructionsEn}
                </p>
                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ar' ? 'رقم مرجع الحوالة البنكية *' : 'Bank Transfer Reference *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={transferReference}
                    onChange={(e) => setTransferReference(e.target.value)}
                    placeholder="e.g. TXN-9948201"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ar' ? 'رابط إثبات التحويل https:// (اختياري)' : 'Payment Receipt URL https:// (Optional)'}
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    value={paymentProofUrl}
                    onChange={(e) => setPaymentProofUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ar' ? 'ملاحظات إضافية' : 'Payment Notes'}
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block">
                  {lang === 'ar' ? 'الإجمالي المستحق' : 'Order Total'}
                </span>
                <span className="text-lg font-extrabold font-mono text-[#17243A] dark:text-white">
                  {isFreeCheckout
                    ? lang === 'ar'
                      ? 'مجاني (0 ر.س)'
                      : 'FREE ($0)'
                    : `${finalSar} SAR / $${finalUsd} USD`}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {isFreeCheckout
                    ? lang === 'ar'
                      ? 'إصدار الترخيص المجاني'
                      : 'Claim Free License'
                    : lang === 'ar'
                    ? 'إرسال طلب المراجعة'
                    : 'Submit for Review'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
