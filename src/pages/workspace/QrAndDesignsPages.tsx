import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  Heart,
  Lock,
  PauseCircle,
  PlayCircle,
  Printer,
  Search,
  ShoppingBag,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  downloadQrSvgMarkup,
  QrCodeVector,
} from '../../components/brand/FindItLogo';
import { TagProductPreview } from '../../components/brand/TagProductPreview';
import { BatchPrintStudioModal } from '../../components/common/BatchPrintStudioModal';
import { CheckoutModal } from '../../components/common/CheckoutModal';
import { ItemCompositedDesignStudio } from '../../components/common/ItemCompositedDesignStudio';
import { PilotCard3dPreview } from '../../components/common/PilotCard3dPreview';
import { AsyncStateBoundary, ViewStateBar } from '../../components/common/UiPrimitives';
import { SmartRelatedServices } from '../../components/workspace/SmartRelatedServices';
import { useApp } from '../../context/AppContext';
import { getTemplateShowcaseMedia } from '../../data/pilotShowcaseMedia';
import { adminApi, ApiRequestError } from '../../services/adminApi';
import { TagDesignTemplate, TemplateDomainCategory, TemplateScope } from '../../types/domain';
import {
  canAccessTemplateByPlanOrPurchase,
  getCustomizationCapabilities,
} from '../../utils/adminLogic';
import {
  getActiveCatalogTemplates,
  isTemplateFree,
  REORGANIZED_DOMAIN_CATEGORIES,
  STYLE_DISCOVERY_CLUSTERS,
  StyleClusterId,
  summarizeActiveCatalogBreakdown,
  TemplatePriceFilter,
  TemplateSortBy,
} from '../../utils/templateDiscovery';
import {
  DOMAIN_CATEGORY_LABEL_MAP,
  filterAndSortLibraryTemplates,
  getIssuedPurchasedTemplateIdSet,
  getTemplateOwnershipStatus,
  summarizeLibraryOwnership,
  TemplateOwnershipFilter,
} from '../../utils/templateLibraryAudit';
import { composeItemTemplateDesignSvg } from '../../utils/templateQrCompositor';

export const QrManagerPage: React.FC = () => {
  const {
    lang,
    t,
    qrRecords,
    items,
    designs,
    navigate,
    toggleQrActiveInSession,
    requestConfirm,
  } = useApp();

  const [batchPrintOpen, setBatchPrintOpen] = useState(false);
  const [batchPrintIds, setBatchPrintIds] = useState<string[]>([]);

  const openPrintForIds = (ids: string[]) => {
    setBatchPrintIds(ids);
    setBatchPrintOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white">
            {t.workspaceNav.qrManager}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {lang === 'ar'
              ? 'جدول التحكم التقني بجميع أكواد QR القياسية المرتبطة بأغراضك، مع التوقيف المؤقت والمعاينة والطباعة الجماعية.'
              : 'Technical control grid for all registered ISO QR codes with instant pause/activate switches, studio preview, and batch printing.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('print-studio')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#0F9D8E]/40 bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF] text-xs sm:text-sm font-bold hover:bg-[#0F9D8E] hover:text-white transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ar' ? 'استوديو الطباعة' : 'Print Studio'}</span>
          </button>
          <button
            type="button"
            data-testid="qr-manager-batch-print-btn"
            onClick={() =>
              openPrintForIds(items.filter((i) => i.status !== 'Archived').map((i) => i.id))
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E192B] hover:border-[#0F9D8E] text-[#0B1320] dark:text-white text-xs sm:text-sm font-bold transition-colors"
          >
            <Printer className="w-4 h-4 text-[#0F9D8E] dark:text-[#2DD4BF]" />
            <span>{lang === 'ar' ? 'طباعة جماعية (A4)' : 'Batch Print (A4)'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('add-item')}
            className="px-4 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#19B5A5] text-white dark:text-[#07101A] text-xs sm:text-sm font-extrabold"
          >
            {lang === 'ar' ? '+ تخصيص كود لغرض جديد' : '+ Bind QR to New Item'}
          </button>
        </div>
      </div>

      <ViewStateBar
        pageHintAr="يتيح مدير الأكواد التحكم في تفعيل أو إيقاف أي كود QR عن بُعد وطباعة الملصقات فرديًا أو جماعيًا دون تغيير الملصق المطبوع."
        pageHintEn="QR Manager lets you remotely pause or activate any tag and print stickers individually or in A4 batches."
      />

      <AsyncStateBoundary
        emptyTitleAr="لا توجد أكواد QR مخصصة حاليًا"
        emptyTitleEn="No Active QR Codes Assigned"
        emptyDescAr="عند إضافة غرض جديد يتم توليد سجل QR قياسي فريد له تلقائيًا."
        emptyDescEn="Adding a new item automatically provisions a unique ISO QR code record."
        emptyActionLabelAr={t.workspaceNav.addItem}
        emptyActionLabelEn={t.workspaceNav.addItem}
        onEmptyAction={() => navigate('add-item')}
      >
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-[#F4F7FB] dark:bg-[#070D17] text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 text-start">
                    {lang === 'ar' ? 'الرقم التسلسلي' : 'Serial Code'}
                  </th>
                  <th className="py-3.5 px-4 text-start">
                    {lang === 'ar' ? 'الغرض والقالب' : 'Linked Item & Template'}
                  </th>
                  <th className="py-3.5 px-4 text-start">
                    {lang === 'ar' ? 'حالة الكود' : 'Tag Status'}
                  </th>
                  <th className="py-3.5 px-4 text-end">
                    {lang === 'ar' ? 'عمليات المسح' : 'Scans'}
                  </th>
                  <th className="py-3.5 px-4 text-start">
                    {lang === 'ar' ? 'الموقع المعتاد' : 'Home Base'}
                  </th>
                  <th className="py-3.5 px-4 text-end">
                    {lang === 'ar' ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {qrRecords.map((qr) => {
                  const linkedItem = items.find((i) => i.id === qr.linkedItemId);
                  const matchedDesign =
                    designs.find((d) => d.id === linkedItem?.designId) ?? designs[0];
                  return (
                    <tr
                      key={qr.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#2563EB] dark:text-[#19B5A5] tabular-nums">
                        {qr.serialNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#17243A] dark:text-white">
                          {linkedItem
                            ? linkedItem.name || (lang === 'ar' ? linkedItem.nameAr : linkedItem.nameEn)
                            : qr.linkedItemId}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {lang === 'ar' ? matchedDesign.titleAr : matchedDesign.titleEn}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                            qr.isActive
                              ? 'text-[#0F9D8E] dark:text-[#19B5A5]'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {qr.isActive ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <PauseCircle className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {qr.isActive
                              ? lang === 'ar'
                                ? 'نشط للمسح'
                                : 'Active'
                              : lang === 'ar'
                              ? 'موقوف مؤقتًا'
                              : 'Paused'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-end font-mono font-bold tabular-nums">
                        {qr.scansCount}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {lang === 'ar'
                          ? qr.lastScannedLocationAr || '—'
                          : qr.lastScannedLocationEn || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <div className="inline-flex items-center justify-end gap-2">
                          {linkedItem && (
                            <button
                              type="button"
                              aria-label={lang === 'ar' ? `طباعة ملصق ${qr.serialNumber}` : `Print sticker ${qr.serialNumber}`}
                              onClick={() => openPrintForIds([linkedItem.id])}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              navigate('qr-preview', {
                                qrId: qr.id,
                                itemId: qr.linkedItemId,
                              })
                            }
                            className="px-3 py-1.5 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:text-[#19B5A5] text-xs font-bold hover:bg-[#2563EB] hover:text-white transition-colors"
                          >
                            {t.common.previewQr}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              requestConfirm({
                                title: qr.isActive
                                  ? lang === 'ar'
                                    ? 'إيقاف كود QR مؤقتًا'
                                    : 'Pause QR Code Temporarily'
                                  : lang === 'ar'
                                  ? 'إعادة تفعيل كود QR'
                                  : 'Reactivate QR Code',
                                description: qr.isActive
                                  ? lang === 'ar'
                                    ? `عند إيقاف الكود (${qr.serialNumber})، لن تظهر أرقام التواصل لأي شخص يمسح الملصق حتى تعيد تفعيله.`
                                    : `Pausing code (${qr.serialNumber}) hides your contact channels from anyone scanning the tag until you reactivate it.`
                                  : lang === 'ar'
                                  ? `هل ترغب في إعادة تفعيل الكود (${qr.serialNumber}) ليستقبل عمليات المسح؟`
                                  : `Reactivate code (${qr.serialNumber}) so finders can view your approved recovery channels?`,
                                confirmLabel: t.common.confirm,
                                variant: 'primary',
                                onConfirm: () => toggleQrActiveInSession(qr.id),
                              })
                            }
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                          >
                            {qr.isActive ? (
                              <span className="inline-flex items-center gap-1">
                                <PauseCircle className="w-3.5 h-3.5" />
                                {lang === 'ar' ? 'إيقاف' : 'Pause'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <PlayCircle className="w-3.5 h-3.5 text-[#19B5A5]" />
                                {lang === 'ar' ? 'تفعيل' : 'Activate'}
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </AsyncStateBoundary>

      <SmartRelatedServices currentPage="qr-manager" />

      <BatchPrintStudioModal
        isOpen={batchPrintOpen}
        onClose={() => setBatchPrintOpen(false)}
        initialItemIds={batchPrintIds}
      />
    </div>
  );
};

export const QrPreviewPage: React.FC = () => {
  const { lang, qrRecords, items, designs, selectedQrId, navigate, showToast } = useApp();
  const qr = qrRecords.find((q) => q.id === selectedQrId) ?? qrRecords[0];
  const linkedItem = items.find((i) => i.id === qr?.linkedItemId) ?? items[0];
  const linkedDesign = designs.find((d) => d.id === linkedItem?.designId) ?? designs[0];

  const [selectedColor, setSelectedColor] = useState<string>(qr?.primaryColor ?? '#2563EB');
  const [badgeLabel, setBadgeLabel] = useState<string>(
    qr?.badgeLabelEn ?? 'SCAN TO RETURN'
  );
  const svgExportRef = useRef<SVGSVGElement | null>(null);

  if (!qr || !linkedItem) return null;

  const handleDownloadSvg = () => {
    const ok = downloadQrSvgMarkup(svgExportRef.current, `finditqr-${qr.serialNumber}`);
    if (ok) {
      showToast(
        'success',
        lang === 'ar' ? 'تم تصدير ملف الكود SVG' : 'Print-Ready SVG Downloaded',
        lang === 'ar'
          ? `تم تنزيل ملف الكود القياسي (${qr.serialNumber}.svg) بدقة متجهية عالية للطباعة.`
          : `Downloaded ISO vector (${qr.serialNumber}.svg) ready for printing.`
      );
    }
  };

  const customCaps = getCustomizationCapabilities(linkedDesign.customizationMode);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('qr-manager')}
            className="text-xs font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline mb-1 block"
          >
            {lang === 'ar' ? '← العودة إلى إدارة أكواد QR' : '← Back to QR Manager'}
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'استوديو معاينة وتصدير كود QR' : 'QR Code Studio Preview & Export'}
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1 tabular-nums">
            {qr.serialNumber} · {linkedItem.name || (lang === 'ar' ? linkedItem.nameAr : linkedItem.nameEn)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              navigate('print-studio', { itemId: linkedItem.id, designId: linkedDesign.id })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#0F9D8E]/40 bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF] text-xs sm:text-sm font-bold"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ar' ? 'فتح في استوديو الطباعة' : 'Open in Print Studio'}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              navigate('found-item', { itemId: linkedItem.id, codeSerial: qr.serialNumber })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#19B5A5] text-[#070D17] text-xs sm:text-sm font-bold"
          >
            <Eye className="w-4 h-4" />
            <span>
              {lang === 'ar' ? 'محاكاة مسح هذا الكود' : 'Simulate Scanning This QR'}
            </span>
          </button>
        </div>
      </div>

      <ItemCompositedDesignStudio item={linkedItem} design={linkedDesign} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 sm:p-8">
        {/* Vector Canvas + Hardware Mockup */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center gap-6 rounded-2xl bg-[#F4F7FB] dark:bg-[#070D17] p-8 border border-slate-200 dark:border-slate-800">
          <TagProductPreview
            seed={qr.serialNumber}
            primaryHex={selectedColor}
            secondaryHex={linkedDesign.secondaryHex}
            badgeColorHex="#FF8A65"
            silhouette={linkedDesign.shapeSilhouette}
            serialPreview={qr.serialNumber}
            badgeText={badgeLabel}
            size="md"
          />

          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 w-full flex flex-col items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {lang === 'ar' ? 'ملف الطباعة المعياري (SVG)' : 'Printable ISO 18004 Vector'}
            </span>
            <QrCodeVector
              svgRef={svgExportRef}
              seed={qr.serialNumber}
              primaryColor={selectedColor}
              accentColor="#FF8A65"
              badgeText={badgeLabel}
              size={185}
            />
            <p className="mt-1 font-mono text-xs font-bold text-slate-500 tabular-nums">
              {qr.serialNumber}
            </p>
          </div>
        </div>

        {/* Customization & Real SVG Download */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#17243A] dark:text-white">
              {lang === 'ar'
                ? 'تخصيص المظهر وتنزيل الكود بدقة متجهية للطباعة'
                : 'Customize Appearance & Download Vector QR'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {lang === 'ar'
                ? 'الكود مولّد بمعيار ISO/IEC 18004 (تصحيح أخطاء M) بدون حجب لأي مربع بيانات لضمان أعلى موثوقية عند المسح بالكاميرا.'
                : 'Generated using genuine ISO/IEC 18004 (ECC Level M) matrices with zero occluded data modules for reliable camera scanning.'}
            </p>
            {!customCaps.canChangeColor && (
              <p className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {lang === 'ar'
                    ? 'سياسة القالب: التخصيص مغلق (تصميم ثابت)'
                    : 'Template Policy: Customization Locked (Fixed Design)'}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-3">
            <span className="block text-xs font-bold text-slate-500">
              {lang === 'ar' ? 'ألوان الهوية الرسمية:' : 'Official Brand Palette:'}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { hex: '#2563EB', name: 'Primary Blue' },
                { hex: '#19B5A5', name: 'Teal' },
                { hex: '#FF8A65', name: 'Coral' },
                { hex: '#17243A', name: 'Navy' },
              ].map((sw) => (
                <button
                  key={sw.hex}
                  type="button"
                  disabled={!customCaps.canChangeColor}
                  onClick={() => setSelectedColor(sw.hex)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold disabled:opacity-50 ${
                    selectedColor === sw.hex
                      ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#17243A] dark:text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: sw.hex }}
                  />
                  <span>{sw.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="qr-badge-input"
              className="block text-xs font-bold text-slate-500 mb-1.5"
            >
              {lang === 'ar' ? 'العبارة التشجيعية أسفل الكود:' : 'Bottom Callout Label:'}
            </label>
            <input
              id="qr-badge-input"
              type="text"
              maxLength={24}
              disabled={!customCaps.canChangeBadgeText}
              value={badgeLabel}
              onChange={(e) => setBadgeLabel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm disabled:opacity-55"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownloadSvg}
              data-testid="btn-download-qr-svg"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs sm:text-sm font-bold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>
                {lang === 'ar'
                  ? 'تنزيل ملف كود QR (SVG عالي الدقة)'
                  : 'Download Print-Ready QR (SVG)'}
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                navigate('print-studio', { itemId: linkedItem.id, designId: linkedDesign.id })
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold"
            >
              <Printer className="w-4 h-4 text-[#0F9D8E]" />
              <span>{lang === 'ar' ? 'تجهيز للطباعة المتقدمة' : 'Prepare in Print Studio'}</span>
            </button>
          </div>
        </div>
      </div>

      <SmartRelatedServices
        currentPage="qr-preview"
        contextItemId={linkedItem.id}
        contextDesignId={linkedDesign.id}
      />
    </div>
  );
};

export const DesignLibraryPage: React.FC = () => {
  const {
    lang,
    t,
    designs,
    profile,
    issuedLicenses,
    favoriteTemplateIds,
    toggleFavoriteTemplateInSession,
    platformSettings,
    pendingItemDraft,
    itemDraftTemplateReturnActive,
    selectTemplateForPendingItemDraft,
    navigate,
  } = useApp();
  const [selectedDomain, setSelectedDomain] = useState<'all' | TemplateDomainCategory>('all');
  const [selectedScope, setSelectedScope] = useState<'all' | TemplateScope>('all');
  const [selectedStyle, setSelectedStyle] = useState<StyleClusterId>('all');
  const [priceFilter, setPriceFilter] = useState<TemplatePriceFilter>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<TemplateOwnershipFilter>('all');
  const [sortBy, setSortBy] = useState<TemplateSortBy>('featured');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickPreviewDesign, setQuickPreviewDesign] = useState<TagDesignTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<'real_qr' | 'showcase'>('real_qr');
  const [previewShotIdx, setPreviewShotIdx] = useState<number>(0);
  const [checkoutDesign, setCheckoutDesign] = useState<TagDesignTemplate | null>(null);

  const purchasedTemplateIds = useMemo(
    () => getIssuedPurchasedTemplateIdSet(issuedLicenses),
    [issuedLicenses]
  );

  const visibleDesigns = useMemo(() => getActiveCatalogTemplates(designs), [designs]);
  const breakdown = useMemo(() => summarizeActiveCatalogBreakdown(designs), [designs]);
  const ownershipStats = useMemo(
    () =>
      summarizeLibraryOwnership({
        templates: designs,
        userPlan: profile.plan,
        purchasedTemplateIds,
      }),
    [designs, profile.plan, purchasedTemplateIds]
  );

  const filteredDesigns = useMemo(
    () =>
      filterAndSortLibraryTemplates(designs, {
        domain: selectedDomain,
        scope: selectedScope,
        styleCluster: selectedStyle,
        priceFilter,
        ownershipFilter,
        userPlan: profile.plan,
        purchasedTemplateIds,
        favoritesOnly,
        favoriteIds: favoriteTemplateIds,
        searchQuery,
        sortBy,
      }),
    [
      designs,
      selectedDomain,
      selectedScope,
      selectedStyle,
      priceFilter,
      ownershipFilter,
      profile.plan,
      purchasedTemplateIds,
      sortBy,
      favoritesOnly,
      favoriteTemplateIds,
      searchQuery,
    ]
  );

  const previewComposite = useMemo(() => {
    if (!quickPreviewDesign) return null;
    return composeItemTemplateDesignSvg({
      design: quickPreviewDesign,
      codeSerial: 'FQR-LIVE-2026',
      mode: 'clean',
    });
  }, [quickPreviewDesign]);

  const handleSelectDesignAction = (templateId: string) => {
    if (itemDraftTemplateReturnActive) {
      selectTemplateForPendingItemDraft(templateId, true);
    } else {
      navigate('add-item', { designId: templateId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Draft-Preservation Return Banner when browsing from AddItemPage */}
      {itemDraftTemplateReturnActive && pendingItemDraft && (
        <div
          data-testid="draft-return-banner"
          className="rounded-2xl border border-[#2563EB]/30 bg-[#2563EB]/8 dark:bg-[#19B5A5]/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="text-xs sm:text-sm text-[#17243A] dark:text-white">
            <span className="font-extrabold">
              {lang === 'ar'
                ? 'بيانات الغرض محفوظة أثناء التصفح: '
                : 'Item draft preserved while browsing: '}
            </span>
            <span className="font-bold text-[#2563EB] dark:text-[#19B5A5]">
              {pendingItemDraft.name?.trim() ||
                (lang === 'ar' ? 'غرض جديد قيد الإعداد' : 'New Item Draft')}
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              {lang === 'ar'
                ? ' — اختر أي قالب من المكتبة للعودة مباشرة إلى نموذجك دون فقدان أي حقل.'
                : ' — Pick any template to return straight to your form without losing any field.'}
            </span>
          </div>
          <button
            type="button"
            data-testid="return-to-draft-btn"
            onClick={() => navigate('add-item')}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0F1A2B] border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-[#17243A] dark:text-white hover:border-[#2563EB] shrink-0"
          >
            {lang === 'ar' ? 'العودة لنموذج الغرض' : 'Return to Item Form'}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white">
            {t.workspaceNav.designLibrary}{' '}
            <span className="font-mono text-base text-[#2563EB] dark:text-[#19B5A5]">
              ({visibleDesigns.length})
            </span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {lang === 'ar'
              ? 'مكتبة تضم جميع القوالب النشطة الـ ٥٨ مع تصفية حسب الملكية والتصنيف ومعاينة دمج QR الحقيقي قبل الاختيار.'
              : 'All 58 active sticker templates with ownership filtering, 7 domain categories, and live real-QR preview.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('design-store')}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] text-xs sm:text-sm font-bold shrink-0"
        >
          {lang === 'ar' ? 'فتح متجر التصاميم العام' : 'Open Public Design Store'}
        </button>
      </div>

      {/* Scope, Ownership, Price Tier, Sort & Search */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Ownership Filter Group */}
            <div
              role="group"
              aria-label={lang === 'ar' ? 'تصفية حسب الملكية' : 'Ownership Filter'}
              className="inline-flex items-center p-1 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
            >
              {(
                [
                  {
                    id: 'all' as const,
                    ar: `الكل (${breakdown.activeTotal})`,
                    en: `All (${breakdown.activeTotal})`,
                  },
                  {
                    id: 'owned' as const,
                    ar: `مملوكة لي (${ownershipStats.ownedCount})`,
                    en: `Owned (${ownershipStats.ownedCount})`,
                  },
                  {
                    id: 'unowned' as const,
                    ar: `غير مملوكة (${ownershipStats.unownedCount})`,
                    en: `Not Owned (${ownershipStats.unownedCount})`,
                  },
                ] as const
              ).map((own) => (
                <button
                  key={own.id}
                  type="button"
                  data-testid={`lib-ownership-${own.id}`}
                  onClick={() => setOwnershipFilter(own.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-colors whitespace-nowrap ${
                    ownershipFilter === own.id
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {lang === 'ar' ? own.ar : own.en}
                </button>
              ))}
            </div>

            {[
              {
                id: 'all' as const,
                ar: 'عام ومتخصص',
                en: 'All Scopes',
              },
              {
                id: 'general' as const,
                ar: `عام (${breakdown.byScope.general})`,
                en: `General (${breakdown.byScope.general})`,
              },
              {
                id: 'specialized' as const,
                ar: `متخصص (${breakdown.byScope.specialized})`,
                en: `Specialized (${breakdown.byScope.specialized})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`lib-scope-${tab.id}`}
                onClick={() => setSelectedScope(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap ${
                  selectedScope === tab.id
                    ? 'bg-[#19B5A5] text-[#070D17]'
                    : 'bg-[#F4F7FB] dark:bg-[#070D17] text-slate-600 dark:text-slate-300'
                }`}
              >
                {lang === 'ar' ? tab.ar : tab.en}
              </button>
            ))}

            {platformSettings.enableTemplateFavorites !== false && (
              <button
                type="button"
                onClick={() => setFavoritesOnly((prev) => !prev)}
                className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${
                  favoritesOnly
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-[#F4F7FB] dark:bg-[#070D17] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
                <span>
                  {lang === 'ar'
                    ? `المفضلة (${favoriteTemplateIds.length})`
                    : `Favorites (${favoriteTemplateIds.length})`}
                </span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center p-1 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-700">
              {(
                [
                  { id: 'all' as const, ar: 'الكل', en: 'All' },
                  { id: 'free' as const, ar: `مجاني (${breakdown.freeTotal})`, en: `Free (${breakdown.freeTotal})` },
                  { id: 'premium' as const, ar: `مدفوع (${breakdown.premiumTotal})`, en: `Paid (${breakdown.premiumTotal})` },
                ] as const
              ).map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  data-testid={`lib-price-${tier.id}`}
                  onClick={() => setPriceFilter(tier.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors whitespace-nowrap ${
                    priceFilter === tier.id
                      ? 'bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17]'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {lang === 'ar' ? tier.ar : tier.en}
                </button>
              ))}
            </div>

            <select
              aria-label={lang === 'ar' ? 'ترتيب القوالب' : 'Sort templates'}
              data-testid="lib-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TemplateSortBy)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs font-bold text-[#17243A] dark:text-white"
            >
              <option value="featured">{lang === 'ar' ? 'ترتيب: المميزة' : 'Sort: Featured'}</option>
              <option value="popular">{lang === 'ar' ? 'ترتيب: الأكثر استخدامًا' : 'Sort: Most Used'}</option>
              <option value="newest">{lang === 'ar' ? 'ترتيب: الأحدث' : 'Sort: Newest'}</option>
              <option value="price_asc">{lang === 'ar' ? 'ترتيب: الأقل سعرًا' : 'Sort: Price Low–High'}</option>
            </select>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute top-2.5 start-3.5" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث باسم القالب أو النمط...' : 'Search template, style, or material...'}
                className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {REORGANIZED_DOMAIN_CATEGORIES.map((cat) => {
            const count =
              cat.id === 'all' ? breakdown.activeTotal : breakdown.byDomain[cat.id];
            return (
              <button
                key={cat.id}
                type="button"
                data-testid={`lib-domain-${cat.id}`}
                onClick={() => setSelectedDomain(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 ${
                  selectedDomain === cat.id
                    ? 'bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{lang === 'ar' ? cat.ar : cat.en}</span>
                <span className="font-mono text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STYLE_DISCOVERY_CLUSTERS.map((cluster) => (
            <button
              key={cluster.id}
              type="button"
              onClick={() => setSelectedStyle(cluster.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedStyle === cluster.id
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#F4F7FB] dark:bg-[#070D17] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {lang === 'ar' ? cluster.ar : cluster.en}
            </button>
          ))}
        </div>
      </div>

      <ViewStateBar
        pageHintAr={`يتم عرض ${filteredDesigns.length} من أصل ${visibleDesigns.length} قالبًا نشطًا (${ownershipStats.ownedCount} مملوكة، ${ownershipStats.freeCount} مجانية).`}
        pageHintEn={`Showing ${filteredDesigns.length} of ${visibleDesigns.length} active templates (${ownershipStats.ownedCount} owned, ${ownershipStats.freeCount} free).`}
      />

      {filteredDesigns.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-10 text-center space-y-3">
          <p className="text-base font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'لا توجد قوالب مطابقة للتصفية الحالية' : 'No Matching Templates'}
          </p>
          <p className="text-xs text-slate-500">
            {lang === 'ar'
              ? 'أعد ضبط المرشحات لعرض كافة القوالب النشطة في المكتبة.'
              : 'Reset filters to display all 58 active templates in your library.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedDomain('all');
              setSelectedScope('all');
              setSelectedStyle('all');
              setPriceFilter('all');
              setOwnershipFilter('all');
              setFavoritesOnly(false);
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold"
          >
            {lang === 'ar' ? 'إعادة ضبط المرشحات' : 'Reset Filters'}
          </button>
        </div>
      ) : (
        <AsyncStateBoundary
          emptyTitleAr="لا توجد قوالب مطابقة"
          emptyTitleEn="No Matching Templates"
          emptyDescAr="عدّل البحث أو أزل تصفية المفضلة لعرض جميع القوالب المتاحة."
          emptyDescEn="Adjust your filters or clear favorites filter to see all available templates."
          emptyActionLabelAr={t.nav.designStore}
          emptyActionLabelEn={t.nav.designStore}
          onEmptyAction={() => navigate('design-store')}
        >
          <div
            data-testid="design-library-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredDesigns.map((d) => {
              const isFav = favoriteTemplateIds.includes(d.id);
              const ownership = getTemplateOwnershipStatus({
                template: d,
                userPlan: profile.plan,
                purchasedTemplateIds,
              });
              const isUnlocked = ownership !== 'locked';
              const isFreeTpl = isTemplateFree(d);
              const libMedia = getTemplateShowcaseMedia(d.id);
              const primaryImageUrl =
                d.showcaseGallery?.mockup3dUrl ||
                d.showcaseGallery?.onProductUrl ||
                libMedia?.cardLifestyleUrl ||
                d.showcaseGallery?.lifestyleUrl ||
                '';
              const domainMeta = DOMAIN_CATEGORY_LABEL_MAP[d.domainCategory || 'personal'];

              return (
                <article
                  key={d.id}
                  data-testid={`lib-card-${d.id}`}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] overflow-hidden flex flex-col justify-between findit-card-hover"
                >
                  <div>
                    <div className="relative aspect-[4/3] w-full bg-[#EFECE6] dark:bg-[#0B1322] overflow-hidden">
                      {platformSettings.enableTemplateFavorites !== false && (
                        <button
                          type="button"
                          aria-label={lang === 'ar' ? `حفظ ${d.titleAr}` : `Favorite ${d.titleEn}`}
                          onClick={() => void toggleFavoriteTemplateInSession(d.id)}
                          className={`absolute top-2.5 end-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                            isFav
                              ? 'bg-rose-500 border-rose-500 text-white'
                              : 'bg-white/92 dark:bg-[#0F1A2B]/92 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      )}

                      {primaryImageUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewMode('real_qr');
                            setPreviewShotIdx(0);
                            setQuickPreviewDesign(d);
                          }}
                          aria-label={lang === 'ar' ? `معاينة ${d.titleAr}` : `Preview ${d.titleEn}`}
                          className="block w-full h-full focus:outline-none"
                        >
                          <img
                            src={primaryImageUrl}
                            alt={lang === 'ar' ? d.titleAr : d.titleEn}
                            loading="lazy"
                            className="w-full h-full object-contain transition-transform duration-300 hover:scale-[1.02]"
                          />
                        </button>
                      ) : d.isPilotShowcase || d.pilotArtStyle ? (
                        <PilotCard3dPreview design={d} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4">
                          <TagProductPreview
                            seed={d.slug}
                            primaryHex={d.primaryHex}
                            secondaryHex={d.secondaryHex}
                            badgeColorHex={d.badgeColorHex}
                            silhouette={d.shapeSilhouette}
                            badgeText="FINDIT QR"
                            size="sm"
                          />
                        </div>
                      )}
                    </div>

                    <div className="p-5 pb-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-bold tabular-nums">
                        <span className="text-slate-500 dark:text-slate-400 truncate">
                          {domainMeta ? domainMeta[lang] : ''} · {d.dimensionsMm}
                        </span>
                        <span
                          data-testid={`lib-ownership-status-${d.id}`}
                          className={`shrink-0 ${
                            ownership === 'free'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : ownership === 'locked'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-[#0F9D8E] dark:text-[#19B5A5]'
                          }`}
                        >
                          {ownership === 'free'
                            ? lang === 'ar'
                              ? 'مجاني'
                              : 'Free'
                            : ownership === 'purchased'
                            ? lang === 'ar'
                              ? 'مملوك برخصة'
                              : 'Purchased'
                            : ownership === 'included_in_plan'
                            ? lang === 'ar'
                              ? `مملوك (${profile.plan})`
                              : `Owned (${profile.plan})`
                            : lang === 'ar'
                            ? `غير مملوك · ${d.priceSar} ر.س`
                            : `Locked · $${d.priceUsd}`}
                        </span>
                      </div>

                      <h2 className="text-base font-extrabold text-[#17243A] dark:text-white line-clamp-1">
                        {lang === 'ar' ? d.titleAr : d.titleEn}
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                        {lang === 'ar' ? d.subtitleAr || d.materialAr : d.subtitleEn || d.materialEn}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        data-testid={`lib-preview-${d.id}`}
                        onClick={() => {
                          setPreviewMode('real_qr');
                          setPreviewShotIdx(0);
                          setQuickPreviewDesign(d);
                        }}
                        className="text-xs font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
                      >
                        {lang === 'ar' ? 'معاينة' : 'Preview'}
                      </button>
                      <button
                        type="button"
                        data-testid={`lib-details-${d.id}`}
                        onClick={() => navigate('template-details', { designId: d.id })}
                        className="text-xs font-semibold text-slate-500 hover:text-[#0B1320] dark:hover:text-white"
                      >
                        {lang === 'ar' ? 'التفاصيل' : 'Details'}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('print-studio', { designId: d.id })}
                        className="text-xs font-semibold text-[#0F9D8E] dark:text-[#2DD4BF] hover:underline"
                      >
                        {lang === 'ar' ? 'استوديو الطباعة' : 'Print Studio'}
                      </button>
                    </div>

                    {isUnlocked ? (
                      <button
                        type="button"
                        data-testid={`lib-select-${d.id}`}
                        onClick={() => handleSelectDesignAction(d.id)}
                        className="px-3.5 py-2 rounded-xl bg-[#0F9D8E] hover:bg-[#19B5A5] text-white dark:text-[#07101A] text-xs font-extrabold transition-colors whitespace-nowrap"
                      >
                        {itemDraftTemplateReturnActive
                          ? lang === 'ar'
                            ? 'اختيار والعودة للغرض'
                            : 'Select & Return'
                          : lang === 'ar'
                          ? 'ربط بغرض جديد'
                          : 'Use for New Item'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        data-testid={`lib-unlock-${d.id}`}
                        onClick={() => setCheckoutDesign(d)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#19B5A5] hover:bg-teal-400 text-[#070D17] text-xs font-extrabold transition-colors whitespace-nowrap"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>
                          {isFreeTpl
                            ? lang === 'ar'
                              ? 'مجاني'
                              : 'Free'
                            : lang === 'ar'
                            ? `شراء (${d.priceSar} ر.س)`
                            : `Unlock ($${d.priceUsd})`}
                        </span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </AsyncStateBoundary>
      )}

      <CheckoutModal
        isOpen={Boolean(checkoutDesign)}
        onClose={() => setCheckoutDesign(null)}
        orderType="template_purchase"
        template={checkoutDesign || undefined}
      />

      {/* Enhanced Quick Preview Modal (Real-QR Composite vs 4-Shot Gallery) */}
      {quickPreviewDesign && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="lib-quick-preview-modal"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono font-bold text-[#2563EB] dark:text-[#19B5A5]">
                  {quickPreviewDesign.dimensionsMm} · {quickPreviewDesign.weatherproofRating}
                </p>
                <h3 className="text-lg font-extrabold text-[#17243A] dark:text-white mt-0.5">
                  {lang === 'ar' ? quickPreviewDesign.titleAr : quickPreviewDesign.titleEn}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'ar' ? quickPreviewDesign.subtitleAr : quickPreviewDesign.subtitleEn}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickPreviewDesign(null)}
                aria-label={t.common.cancel}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPreviewMode('real_qr')}
                className={`px-3 py-1.5 rounded-lg ${
                  previewMode === 'real_qr'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {lang === 'ar' ? 'معاينة بدمج كود QR الحقيقي' : 'Real QR Composite'}
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('showcase')}
                className={`px-3 py-1.5 rounded-lg ${
                  previewMode === 'showcase'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {lang === 'ar' ? 'صور العرض الترويجية' : 'Product Showcase'}
              </button>
            </div>

            {previewMode === 'real_qr' && previewComposite ? (
              <div className="rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] p-5 flex items-center justify-center border border-slate-200 dark:border-slate-800 max-h-[320px] overflow-hidden">
                <div
                  className="w-full max-w-[380px] [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[280px] [&>svg]:mx-auto"
                  dangerouslySetInnerHTML={{ __html: previewComposite.svgMarkup }}
                />
              </div>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const gallery = quickPreviewDesign.showcaseGallery;
                  const shots = [
                    gallery?.mockup3dUrl,
                    gallery?.onProductUrl,
                    gallery?.closeupUrl,
                    gallery?.lifestyleUrl,
                  ].filter((u): u is string => Boolean(u));
                  const activeUrl = shots[previewShotIdx] || shots[0] || '';
                  return (
                    <>
                      <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#EFECE6] dark:bg-[#070D17] border border-slate-200 dark:border-slate-800">
                        {activeUrl && (
                          <img
                            src={activeUrl}
                            alt={quickPreviewDesign.titleEn}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                      {shots.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {shots.map((url, idx) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() => setPreviewShotIdx(idx)}
                              className={`aspect-[4/3] rounded-lg overflow-hidden border-2 bg-[#EFECE6] dark:bg-[#070D17] ${
                                previewShotIdx === idx
                                  ? 'border-[#2563EB]'
                                  : 'border-slate-200 dark:border-slate-700 opacity-80'
                              }`}
                            >
                              <img src={url} alt="" className="w-full h-full object-contain" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {(lang === 'ar'
                ? quickPreviewDesign.featuresAr
                : quickPreviewDesign.featuresEn
              )
                .slice(0, 3)
                .map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#19B5A5] shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
            </ul>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  const targetId = quickPreviewDesign.id;
                  setQuickPreviewDesign(null);
                  navigate('template-details', { designId: targetId });
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                {lang === 'ar' ? 'المواصفات والملفات الكاملة' : 'Full Specs & Files'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = quickPreviewDesign.id;
                  setQuickPreviewDesign(null);
                  navigate('print-studio', { designId: targetId });
                }}
                className="px-4 py-2 rounded-xl border border-[#0F9D8E]/40 text-[#0F9D8E] dark:text-[#2DD4BF] text-xs font-bold"
              >
                {lang === 'ar' ? 'فتح في استوديو الطباعة' : 'Open in Print Studio'}
              </button>
              {canAccessTemplateByPlanOrPurchase({
                template: quickPreviewDesign,
                userPlan: profile.plan,
                purchasedTemplateIds,
              }) ? (
                <button
                  type="button"
                  onClick={() => {
                    const targetId = quickPreviewDesign.id;
                    setQuickPreviewDesign(null);
                    handleSelectDesignAction(targetId);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0F9D8E] text-white dark:text-[#07101A] text-xs font-extrabold"
                >
                  {itemDraftTemplateReturnActive
                    ? lang === 'ar'
                      ? 'اختيار والعودة للغرض'
                      : 'Select & Return to Item'
                    : lang === 'ar'
                    ? 'ربط بغرض جديد'
                    : 'Use for New Item'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const target = quickPreviewDesign;
                    setQuickPreviewDesign(null);
                    setCheckoutDesign(target);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#19B5A5] text-[#070D17] text-xs font-extrabold"
                >
                  {lang === 'ar'
                    ? `شراء القالب (${quickPreviewDesign.priceSar} ر.س)`
                    : `Unlock ($${quickPreviewDesign.priceUsd})`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <SmartRelatedServices currentPage="design-library" />
    </div>
  );
};

export const MyPurchasesPage: React.FC = () => {
  const {
    lang,
    t,
    orders,
    issuedLicenses,
    subscriptions,
    navigate,
    refreshWorkspaceAll,
    showToast,
  } = useApp();
  const [proofOrderId, setProofOrderId] = useState<string>('');
  const [proofRef, setProofRef] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofSaving, setProofSaving] = useState(false);

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofOrderId) return;
    setProofSaving(true);
    try {
      await adminApi.submitOrderProof(proofOrderId, {
        transferReference: proofRef,
        paymentProofUrl: proofUrl,
      });
      await refreshWorkspaceAll();
      setProofOrderId('');
      setProofRef('');
      setProofUrl('');
      showToast(
        'success',
        lang === 'ar' ? 'تم تحديث إثبات الدفع' : 'Payment Proof Updated',
        lang === 'ar'
          ? 'تم حفظ رقم المرجع للمراجعة من الإدارة.'
          : 'Transfer reference saved for manual review.'
      );
    } catch (err) {
      showToast(
        'error',
        lang === 'ar' ? 'تعذر التحديث' : 'Update Failed',
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : 'Could not update proof.'
      );
    } finally {
      setProofSaving(false);
    }
  };

  const downloadLicenseCertificate = (licId: string) => {
    const lic = issuedLicenses.find((l) => l.id === licId);
    if (!lic) return;
    const blob = new Blob([JSON.stringify(lic, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lic.licenseNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white">
            {t.workspaceNav.myPurchases}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {lang === 'ar'
              ? 'السجل الفعلي لطلبات الترقية، التحويلات البنكية قيد المراجعة، وشهادات التراخيص الصادرة.'
              : 'Live record of your upgrade requests, pending bank transfers, and issued template licenses.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('plans')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold shrink-0"
          >
            <span>{t.workspaceNav.plans}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('design-library')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#19B5A5] text-white dark:text-[#07101A] text-xs sm:text-sm font-extrabold shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.workspaceNav.designLibrary}</span>
          </button>
        </div>
      </div>

      {/* Subscriptions Summary */}
      {subscriptions.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 space-y-3">
          <h2 className="text-base font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'سجل الاشتراكات' : 'Subscription History'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-extrabold text-[#17243A] dark:text-white">
                    {sub.quotaTier} · {sub.durationMonths} {lang === 'ar' ? 'أشهر' : 'mo'}
                  </p>
                  <p className="font-mono text-slate-400 mt-0.5">
                    {sub.startedAt.slice(0, 10)} → {sub.expiresAt.slice(0, 10)}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    sub.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Ledger */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-[#17243A] dark:text-white">
          {lang === 'ar' ? `الطلبات والفواتير (${orders.length})` : `Orders Ledger (${orders.length})`}
        </h2>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-10 text-center space-y-3">
            <p className="text-base font-bold text-[#17243A] dark:text-white">
              {lang === 'ar' ? 'لا توجد طلبات مسجلة في حسابك بعد' : 'No Orders Recorded Yet'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {lang === 'ar'
                ? 'يمكنك طلب ترقية الباقة أو إصدار ترخيص لقالب من متجر التصاميم.'
                : 'You can request a plan upgrade or claim/purchase a template license from the Design Store.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 tabular-nums">
                      <span className="font-bold text-[#2563EB] dark:text-[#19B5A5]">
                        {ord.orderNumber}
                      </span>
                      <span>·</span>
                      <span>{ord.createdAt.slice(0, 10)}</span>
                      <span>·</span>
                      <span>
                        {lang === 'ar' ? `الكمية: ${ord.quantity}` : `Qty: ${ord.quantity}`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-sans font-bold ${
                          ord.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : ord.status === 'pending_review'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-red-500/15 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#17243A] dark:text-white">
                      {lang === 'ar' ? ord.titleAr : ord.titleEn}
                    </h3>
                    {ord.transferReference && (
                      <p className="text-xs font-mono text-slate-500">
                        REF: {ord.transferReference}
                      </p>
                    )}
                    {ord.decisionReason && (
                      <p className="text-xs text-slate-500">{ord.decisionReason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-end font-mono">
                      <span className="text-lg font-extrabold text-[#17243A] dark:text-white tabular-nums block">
                        {ord.currency === 'USD' ? `$${ord.amountUsd}` : `${ord.amountSar} ر.س`}
                      </span>
                      {ord.couponCode && (
                        <span className="text-[11px] text-[#0F9D8E]">
                          Coupon: {ord.couponCode}
                        </span>
                      )}
                    </div>
                    {ord.status === 'pending_review' && (
                      <button
                        type="button"
                        onClick={() => {
                          setProofOrderId(ord.id);
                          setProofRef(ord.transferReference || '');
                          setProofUrl(ord.paymentProofUrl || '');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تحديث الإثبات' : 'Update Proof'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {proofOrderId === ord.id && (
                  <form
                    onSubmit={handleProofSubmit}
                    className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
                  >
                    <input
                      type="text"
                      required
                      value={proofRef}
                      onChange={(e) => setProofRef(e.target.value)}
                      placeholder={lang === 'ar' ? 'رقم مرجع الحوالة' : 'Transfer Reference'}
                      className="px-3 py-2 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                    />
                    <input
                      type="url"
                      dir="ltr"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      placeholder="https://... (Receipt URL)"
                      className="px-3 py-2 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={proofSaving}
                        className="flex-1 px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold"
                      >
                        {lang === 'ar' ? 'حفظ' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setProofOrderId('')}
                        className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                      >
                        {t.common.cancel}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issued Licenses */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-[#17243A] dark:text-white">
          {lang === 'ar'
            ? `شهادات التراخيص الصادرة (${issuedLicenses.length})`
            : `Issued Licenses (${issuedLicenses.length})`}
        </h2>

        {issuedLicenses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-8 text-center text-xs text-slate-500">
            {lang === 'ar'
              ? 'تصدر شهادات التراخيص تلقائيًا عند اعتماد الطلب من الإدارة أو عند ترخيص القوالب المجانية.'
              : 'License certificates are issued automatically once an order is approved or a free template is claimed.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issuedLicenses.map((lic) => (
              <div
                key={lic.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-5 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-mono font-bold text-[#2563EB] dark:text-[#19B5A5]">
                    <FileCheck2 className="w-4 h-4" />
                    {lic.licenseNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      lic.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/15 text-red-600'
                    }`}
                  >
                    {lic.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#17243A] dark:text-white">
                    {lang === 'ar' ? lic.templateTitleAr : lic.templateTitleEn}
                  </h3>
                  <p className="text-slate-500 mt-0.5">
                    {lang === 'ar' ? lic.licenseNameAr : lic.licenseNameEn} ·{' '}
                    {lang === 'ar' ? `حتى ${lic.maxCopies} نسخ` : `Up to ${lic.maxCopies} copies`}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {lang === 'ar' ? lic.printRulesAr : lic.printRulesEn}
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-slate-400">
                    {lic.expiresAt
                      ? `${lang === 'ar' ? 'ينتهي:' : 'Expires:'} ${lic.expiresAt.slice(0, 10)}`
                      : lang === 'ar'
                      ? 'دائم'
                      : 'Perpetual'}
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadLicenseCertificate(lic.id)}
                    className="inline-flex items-center gap-1 text-[#2563EB] dark:text-[#19B5A5] font-bold hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'شهادة الترخيص' : 'Certificate'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SmartRelatedServices currentPage="my-purchases" />
    </div>
  );
};
