import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileImage,
  Printer,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RegisteredItem, TagDesignTemplate } from '../../types/domain';
import { buildQrRecoveryUrl } from '../../utils/qrLogic';
import {
  CompositedOutputMode,
  composeItemTemplateDesignSvg,
  downloadCompositedItemPng,
  downloadCompositedItemSvg,
} from '../../utils/templateQrCompositor';
import { downloadQrSvgMarkup, QrCodeVector } from '../brand/FindItLogo';
import { BatchPrintStudioModal } from './BatchPrintStudioModal';

interface ItemCompositedDesignStudioProps {
  item: RegisteredItem;
  design: TagDesignTemplate;
  compact?: boolean;
}

export const ItemCompositedDesignStudio: React.FC<ItemCompositedDesignStudioProps> = ({
  item,
  design,
  compact = false,
}) => {
  const { lang, navigate, showToast } = useApp();
  const [outputMode, setOutputMode] = useState<CompositedOutputMode>('clean');
  const [exportingType, setExportingType] = useState<'svg' | 'png' | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showIndividualPrint, setShowIndividualPrint] = useState(false);
  const standaloneQrRef = useRef<SVGSVGElement | null>(null);

  const recoveryUrl = useMemo(
    () => buildQrRecoveryUrl(item.codeSerial),
    [item.codeSerial]
  );

  const composed = useMemo(
    () =>
      composeItemTemplateDesignSvg({
        design,
        codeSerial: item.codeSerial,
        mode: outputMode,
      }),
    [design, item.codeSerial, outputMode]
  );

  const handleCopyRecoveryLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(recoveryUrl);
      }
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      showToast(
        'success',
        lang === 'ar' ? 'تم نسخ رابط الاسترداد العام' : 'Recovery Link Copied',
        recoveryUrl
      );
    } catch {
      showToast(
        'info',
        lang === 'ar' ? 'رابط الاسترداد العام' : 'Public Recovery URL',
        recoveryUrl
      );
    }
  };

  const handleDownloadCompositedSvg = async () => {
    if (exportingType) return;
    setExportingType('svg');
    try {
      const ok = await downloadCompositedItemSvg({
        design,
        codeSerial: item.codeSerial,
        mode: outputMode,
      });
      if (ok) {
        showToast(
          'success',
          lang === 'ar' ? 'تم تنزيل التصميم النهائي (SVG)' : 'Final Design SVG Downloaded',
          lang === 'ar'
            ? `تم حفظ التصميم المدمج بكود QR الفريد (${item.codeSerial}) دون تعديل القالب الأصلي.`
            : `Saved composited sticker SVG with unique QR (${item.codeSerial}).`
        );
      }
    } finally {
      setExportingType(null);
    }
  };

  const handleDownloadCompositedPng = async () => {
    if (exportingType) return;
    setExportingType('png');
    try {
      const ok = await downloadCompositedItemPng({
        design,
        codeSerial: item.codeSerial,
        mode: outputMode,
      });
      if (ok) {
        showToast(
          'success',
          lang === 'ar'
            ? 'تم تنزيل التصميم عالي الدقة (300 DPI PNG)'
            : 'Print-Ready 300 DPI PNG Downloaded',
          lang === 'ar'
            ? `ملف جاهز للطباعة بدقة عالية للغرض (${item.codeSerial}).`
            : `High-resolution print-ready PNG generated for (${item.codeSerial}).`
        );
      }
    } finally {
      setExportingType(null);
    }
  };

  const handleDownloadStandaloneQr = () => {
    if (downloadQrSvgMarkup(standaloneQrRef.current, `finditqr-code-${item.codeSerial}`)) {
      showToast(
        'success',
        lang === 'ar' ? 'تم تنزيل كود QR المستقل' : 'Standalone QR SVG Downloaded',
        lang === 'ar'
          ? `تم حفظ رمز QR القياسي (${item.codeSerial}.svg).`
          : `Saved standalone ISO QR vector (${item.codeSerial}.svg).`
      );
    }
  };

  return (
    <div
      data-testid="item-composited-design-studio"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-5 sm:p-6 space-y-5"
    >
      {/* Header + Clean/Print Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar'
              ? 'التصميم النهائي الجاهز للطباعة (القالب + كود QR الفريد)'
              : 'Final Composited Sticker Design (Template + Unique QR)'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'ar' ? design.titleAr : design.titleEn} ·{' '}
            <span className="font-mono" dir="ltr">
              {item.codeSerial}
            </span>
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] p-1 text-xs">
          <button
            type="button"
            onClick={() => setOutputMode('clean')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors ${
              outputMode === 'clean'
                ? 'bg-[#2563EB] text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {lang === 'ar' ? 'معاينة الملصق' : 'Sticker View'}
          </button>
          <button
            type="button"
            onClick={() => setOutputMode('print')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors ${
              outputMode === 'print'
                ? 'bg-[#2563EB] text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {lang === 'ar' ? 'نسخة الطباعة' : 'Print Bleed'}
          </button>
        </div>
      </div>

      {/* Shared / Unassigned QR Mode Non-Conflict Notice */}
      {item.qrMode && item.qrMode !== 'individual' && (
        <div
          data-testid="studio-qr-mode-warning"
          className="rounded-xl border border-amber-300 dark:border-amber-700/70 bg-amber-50 dark:bg-amber-950/30 p-3.5 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              {item.qrMode === 'shared'
                ? lang === 'ar'
                  ? `تنبيه: هذا الغرض مرتبط حاليًا بمجموعة QR مشترك (${item.sharedQrGroupName || 'مجموعة مشتركة'})، لذلك فإن كود QR الفردي أدناه متوقف تلقائيًا لمنع التعارض. استخدم رمز المجموعة المشتركة للطباعة أو استعد الوضع الفردي أولًا.`
                  : `Notice: This item currently uses a Shared QR Group (${item.sharedQrGroupName || 'Shared Group'}), so its individual QR code below is paused to prevent conflicts. Print the Shared QR Group code or restore Individual QR mode first.`
                : lang === 'ar'
                ? 'تنبيه: هذا الغرض غير مرتبط بكود QR نشط حاليًا. استعد الوضع الفردي أو ألحقه بمجموعة QR مشترك قبل الطباعة.'
                : 'Notice: This item is currently unassigned from any active QR code. Restore Individual QR mode or assign a Shared QR Group before printing.'}
            </span>
          </div>
          {item.qrMode === 'shared' && (
            <button
              type="button"
              onClick={() => navigate('shared-qr-groups')}
              className="px-3 py-1.5 rounded-lg bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17] text-[11px] font-extrabold whitespace-nowrap"
            >
              {lang === 'ar' ? 'فتح مجموعات QR المشترك' : 'Open Shared QR Groups'}
            </button>
          )}
        </div>
      )}

      {/* Live Composited Artwork Canvas */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-[#070D17] p-4 sm:p-6 flex flex-col items-center justify-center">
        <div
          data-testid="composited-svg-stage"
          data-architecture={composed.architecture}
          data-qr-payload={composed.qrEncodedPayload}
          className={`w-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:mx-auto [&>svg]:drop-shadow-lg ${
            compact
              ? 'max-w-[320px] [&>svg]:max-h-[260px]'
              : 'max-w-[460px] [&>svg]:max-h-[360px]'
          }`}
          dangerouslySetInnerHTML={{ __html: composed.svgMarkup }}
        />
      </div>

      {/* Public Recovery URL & Privacy Integrity Strip */}
      <div className="rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5">
        <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-[#19B5A5] shrink-0 mt-0.5" />
          <span>
            {lang === 'ar'
              ? 'يرتبط كود QR القياسي مباشرةً بصفحة الاسترداد العامة لهذا الغرض فقط، دون تضمين رقم هاتفك أو بريدك الإلكتروني داخل الكود.'
              : 'This ISO-18004 QR code encodes only the unique public recovery URL — never your private phone number or email.'}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-800">
          <code
            dir="ltr"
            data-testid="item-recovery-url"
            className="text-xs font-mono font-semibold text-[#2563EB] dark:text-[#19B5A5] break-all"
          >
            /found/{item.codeSerial}
          </code>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRecoveryLink}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] text-[11px] font-bold text-[#17243A] dark:text-white hover:border-[#2563EB]"
            >
              {copiedUrl ? (
                <Check className="w-3.5 h-3.5 text-[#19B5A5]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>
                {copiedUrl
                  ? lang === 'ar'
                    ? 'تم النسخ'
                    : 'Copied'
                  : lang === 'ar'
                  ? 'نسخ الرابط'
                  : 'Copy Link'}
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                navigate('found-item', { itemId: item.id, codeSerial: item.codeSerial })
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#19B5A5]/20 text-[#17243A] dark:text-[#19B5A5] text-[11px] font-bold hover:bg-[#19B5A5]/30"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'فتح صفحة الاسترداد' : 'Open Recovery Page'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Download & Individual Print Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <button
          type="button"
          data-testid="btn-download-composited-svg"
          disabled={exportingType !== null}
          onClick={handleDownloadCompositedSvg}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>
            {exportingType === 'svg'
              ? lang === 'ar'
                ? 'جارٍ التجهيز...'
                : 'Preparing...'
              : lang === 'ar'
              ? 'تنزيل النهائي (SVG)'
              : 'Download Final SVG'}
          </span>
        </button>

        <button
          type="button"
          data-testid="btn-download-composited-png"
          disabled={exportingType !== null}
          onClick={handleDownloadCompositedPng}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#19B5A5] hover:bg-teal-400 disabled:opacity-50 text-[#070D17] text-xs font-bold transition-colors"
        >
          <FileImage className="w-4 h-4" />
          <span>
            {exportingType === 'png'
              ? lang === 'ar'
                ? 'جارٍ التصدير...'
                : 'Exporting...'
              : lang === 'ar'
              ? '300 DPI PNG للطباعة'
              : 'Print 300 DPI PNG'}
          </span>
        </button>

        <button
          type="button"
          data-testid="btn-individual-print-studio"
          onClick={() => setShowIndividualPrint(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#17243A] dark:bg-slate-800 hover:bg-[#2563EB] text-white text-xs font-bold transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>{lang === 'ar' ? 'طباعة فردية (A4)' : 'Individual Print (A4)'}</span>
        </button>

        <button
          type="button"
          data-testid="btn-download-standalone-qr"
          onClick={handleDownloadStandaloneQr}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D17] hover:border-[#2563EB] text-[#17243A] dark:text-white text-xs font-bold transition-colors"
        >
          <QrCode className="w-4 h-4 text-[#2563EB] dark:text-[#19B5A5]" />
          <span>{lang === 'ar' ? 'كود QR مستقل (SVG)' : 'Standalone QR SVG'}</span>
        </button>
      </div>

      {/* Hidden standalone ISO QR vector used strictly for clean standalone SVG download */}
      <div className="sr-only" aria-hidden="true">
        <QrCodeVector
          svgRef={standaloneQrRef}
          seed={item.codeSerial}
          payloadUrl={recoveryUrl}
          primaryColor="#0A101D"
          accentColor={design.badgeColorHex}
          badgeText="FINDIT QR"
          size={240}
        />
      </div>

      <BatchPrintStudioModal
        isOpen={showIndividualPrint}
        onClose={() => setShowIndividualPrint(false)}
        initialItemIds={[item.id]}
        titleOverrideAr={`طباعة ملصق: ${item.name || item.nameAr}`}
        titleOverrideEn={`Print Sticker: ${item.name || item.nameEn}`}
      />
    </div>
  );
};
