import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileImage,
  Layers,
  Lock,
  Printer,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { BatchPrintStudioModal } from '../../components/common/BatchPrintStudioModal';
import { CheckoutModal } from '../../components/common/CheckoutModal';
import { TemplateDetailShowcase } from '../../components/common/TemplateDetailShowcase';
import { SmartRelatedServices } from '../../components/workspace/SmartRelatedServices';
import { useApp } from '../../context/AppContext';
import {
  buildPilotCleanTrimSvg,
  buildPilotPrintReadySvg,
  triggerPrintReadyPngDownload,
  triggerSvgStringDownload,
} from '../../utils/pilotLabelArtwork';
import { evaluatePrintReadiness, PrintStudioSettings } from '../../utils/printStudioLogic';
import { buildQrRecoveryUrl } from '../../utils/qrLogic';
import {
  getIssuedPurchasedTemplateIdSet,
  getTemplateOwnershipStatus,
} from '../../utils/templateLibraryAudit';
import { composeItemTemplateDesignSvg } from '../../utils/templateQrCompositor';

export const WorkspaceTemplateDetailsPage: React.FC = () => {
  const {
    lang,
    theme,
    designs,
    selectedDesignId,
    selectedItemId,
    profile,
    issuedLicenses,
    favoriteTemplateIds,
    platformSettings,
    itemDraftTemplateReturnActive,
    pendingItemDraft,
    navigate,
    showToast,
    toggleFavoriteTemplateInSession,
    selectTemplateForPendingItemDraft,
  } = useApp();

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const selectedTemplate = useMemo(
    () => designs.find((d) => d.id === selectedDesignId) ?? designs[0],
    [designs, selectedDesignId]
  );

  const purchasedIds = useMemo(
    () => getIssuedPurchasedTemplateIdSet(issuedLicenses),
    [issuedLicenses]
  );

  const ownershipStatus = useMemo(
    () =>
      selectedTemplate
        ? getTemplateOwnershipStatus({
            template: selectedTemplate,
            userPlan: profile.plan,
            purchasedTemplateIds: purchasedIds,
          })
        : 'free',
    [selectedTemplate, profile.plan, purchasedIds]
  );

  if (!selectedTemplate) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="workspace-template-details-page">
      <div className="rounded-2xl border border-[#19B5A5]/30 bg-[#0F9D8E]/5 dark:bg-[#19B5A5]/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs sm:text-sm font-bold text-[#0B1320] dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0F9D8E]" />
          <span>
            {lang === 'ar'
              ? `معاينة القالب المعتمد: ${selectedTemplate.titleAr}`
              : `Inspecting Template: ${selectedTemplate.titleEn}`}
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            navigate('print-studio', {
              designId: selectedTemplate.id,
              ...(selectedItemId ? { itemId: selectedItemId } : {}),
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] text-white text-xs font-bold transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>{lang === 'ar' ? 'فتح في استوديو الطباعة' : 'Open in Print Studio'}</span>
        </button>
      </div>

      <TemplateDetailShowcase
        design={selectedTemplate}
        lang={lang}
        darkTheme={theme === 'dark'}
        isFavorite={favoriteTemplateIds.includes(selectedTemplate.id)}
        showFavorites={platformSettings.enableTemplateFavorites}
        ownershipStatus={ownershipStatus}
        userPlanLabel={profile.plan}
        draftReturnActive={Boolean(itemDraftTemplateReturnActive && pendingItemDraft)}
        onToggleFavorite={() => void toggleFavoriteTemplateInSession(selectedTemplate.id)}
        onPurchase={() => setCheckoutOpen(true)}
        onUseDesign={() => {
          if (itemDraftTemplateReturnActive && pendingItemDraft) {
            selectTemplateForPendingItemDraft(selectedTemplate.id, true);
          } else {
            navigate('add-item', { designId: selectedTemplate.id });
          }
        }}
        onBackToStore={() => navigate('design-library')}
        onOpenLibrary={() => navigate('design-library')}
        onViewPurchases={() => navigate('my-purchases')}
        onNotify={(type, title, desc) => showToast(type, title, desc)}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        orderType="template_purchase"
        template={selectedTemplate}
      />

      <SmartRelatedServices
        currentPage="template-details"
        contextDesignId={selectedTemplate.id}
        contextItemId={selectedItemId}
      />
    </div>
  );
};

export const PrintStudioPage: React.FC = () => {
  const {
    lang,
    t,
    items,
    designs,
    profile,
    issuedLicenses,
    selectedItemId,
    selectedDesignId,
    navigate,
    showToast,
  } = useApp();

  const [boundItemId, setBoundItemId] = useState<string>(
    selectedItemId || items[0]?.id || ''
  );
  const [boundDesignId, setBoundDesignId] = useState<string>(
    selectedDesignId || designs[0]?.id || ''
  );
  const [templateFilter, setTemplateFilter] = useState<'all' | 'free' | 'owned'>('all');
  const [studioSettings, setStudioSettings] = useState<PrintStudioSettings>({
    customCalloutText: lang === 'ar' ? 'امسح الكود للتواصل' : 'SCAN TO RETURN',
    customSubLabel: 'FindIt QR Verified',
    backgroundTintHex: '#FFFFFF',
    showFrameLayer: true,
    showCalloutLayer: true,
    showSerialLayer: true,
    qrZoneLocked: true,
    dpi: 300,
    bleedMm: 3,
    widthMm: 64,
    heightMm: 42,
    paperFormat: 'single',
  });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);

  useEffect(() => {
    if (selectedItemId && items.some((i) => i.id === selectedItemId)) {
      setBoundItemId(selectedItemId);
    } else if (!boundItemId && items[0]) {
      setBoundItemId(items[0].id);
    }
  }, [selectedItemId, items]);

  useEffect(() => {
    if (selectedDesignId && designs.some((d) => d.id === selectedDesignId)) {
      setBoundDesignId(selectedDesignId);
    } else if (!boundDesignId && designs[0]) {
      setBoundDesignId(designs[0].id);
    }
  }, [selectedDesignId, designs]);

  const boundItem = useMemo(
    () => items.find((i) => i.id === boundItemId) ?? items[0] ?? null,
    [items, boundItemId]
  );

  const boundTemplate = useMemo(
    () => designs.find((d) => d.id === boundDesignId) ?? designs[0] ?? null,
    [designs, boundDesignId]
  );

  useEffect(() => {
    if (boundTemplate) {
      setStudioSettings((prev) => ({
        ...prev,
        widthMm: boundTemplate.printSpecs?.trimWidthMm ?? 64,
        heightMm: boundTemplate.printSpecs?.trimHeightMm ?? 42,
        bleedMm: boundTemplate.printSpecs?.bleedMm ?? 3,
        customCalloutText:
          boundTemplate.defaultCalloutText ||
          (lang === 'ar' ? 'امسح الكود للتواصل' : 'SCAN TO RETURN'),
      }));
    }
  }, [boundTemplate?.id]);

  const purchasedIds = useMemo(
    () => getIssuedPurchasedTemplateIdSet(issuedLicenses),
    [issuedLicenses]
  );

  const filteredDesigns = useMemo(() => {
    return designs.filter((tpl) => {
      if ((tpl.status || 'published') !== 'published') return false;
      const own = getTemplateOwnershipStatus({
        template: tpl,
        userPlan: profile.plan,
        purchasedTemplateIds: purchasedIds,
      });
      if (templateFilter === 'free') return own === 'free';
      if (templateFilter === 'owned') return own !== 'locked';
      return true;
    });
  }, [designs, templateFilter, profile.plan, purchasedIds]);

  const preflight = useMemo(
    () =>
      evaluatePrintReadiness({
        item: boundItem,
        template: boundTemplate,
        settings: studioSettings,
        userPlan: profile.plan,
        purchasedTemplateIds: purchasedIds,
      }),
    [boundItem, boundTemplate, studioSettings, profile.plan, purchasedIds]
  );

  const previewResult = useMemo(() => {
    if (!boundTemplate) return null;
    const serial = boundItem?.codeSerial || 'FND-PREVIEW';
    if (
      boundTemplate.isPilotShowcase &&
      !boundTemplate.printFileUrl?.startsWith('/assets/')
    ) {
      const svgMarkup = studioSettings.showFrameLayer
        ? buildPilotPrintReadySvg(boundTemplate, {
            calloutText: studioSettings.showCalloutLayer
              ? studioSettings.customCalloutText
              : '',
            customSubLabel: studioSettings.showSerialLayer
              ? studioSettings.customSubLabel || serial
              : '',
            serialCode: serial,
            showPrintGuides: studioSettings.bleedMm > 0,
          })
        : buildPilotCleanTrimSvg(boundTemplate, {
            calloutText: studioSettings.showCalloutLayer
              ? studioSettings.customCalloutText
              : '',
            customSubLabel: studioSettings.showSerialLayer
              ? studioSettings.customSubLabel || serial
              : '',
            serialCode: serial,
          });
      return {
        svgMarkup,
        recoveryUrl: buildQrRecoveryUrl(serial),
      };
    }

    const composited = composeItemTemplateDesignSvg({
      design: boundTemplate,
      codeSerial: serial,
      mode: 'print',
    });
    return {
      svgMarkup: composited.svgMarkup,
      recoveryUrl: composited.recoveryUrl,
    };
  }, [boundTemplate, boundItem, studioSettings]);

  const handleExportSvg = () => {
    if (!preflight.canExportProduction || !previewResult || !boundTemplate) return;
    const filename = `finditqr-${boundItem?.codeSerial || 'tag'}-${boundTemplate.slug}.svg`;
    triggerSvgStringDownload(previewResult.svgMarkup, filename);
    showToast(
      'success',
      lang === 'ar' ? 'تم تصدير ملف الطباعة SVG' : 'Production SVG Exported',
      filename
    );
  };

  const handleExportPng = async () => {
    if (!preflight.canExportProduction || !previewResult || !boundTemplate) return;
    setExportingPng(true);
    try {
      const filename = `finditqr-${boundItem?.codeSerial || 'tag'}-${studioSettings.dpi}dpi.png`;
      await triggerPrintReadyPngDownload(
        previewResult.svgMarkup,
        filename,
        studioSettings.widthMm,
        studioSettings.heightMm,
        studioSettings.dpi
      );
      showToast(
        'success',
        lang === 'ar' ? 'تم تصدير ملف PNG للطباعة' : 'Print-Ready PNG Exported',
        filename
      );
    } catch {
      showToast(
        'error',
        lang === 'ar' ? 'تعذر تصدير PNG' : 'PNG Export Failed',
        lang === 'ar'
          ? 'حدث خطأ أثناء تحويل التصميم إلى صورة عالية الدقة.'
          : 'Could not render high-DPI PNG output.'
      );
    } finally {
      setExportingPng(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="print-studio-page">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F9D8E]/10 dark:bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#2DD4BF] text-xs font-bold">
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'استوديو الطباعة التفاعلي' : 'Interactive Print Studio'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white">
            {lang === 'ar'
              ? 'إعداد وفحص جاهزية الطباعة'
              : 'Tag Customization & Print Preflight'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {lang === 'ar'
              ? 'اربط القالب بغرضك النشط واضبط العبارات والمقاسات مع قفل منطقة أمان QR لمنع أي خطأ مطبعي.'
              : 'Bind a template to an active item, tune callout layers & print size, and validate preflight readiness before export.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!preflight.canExportProduction || !boundItem}
            onClick={() => setBatchModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-xs font-bold disabled:opacity-50"
          >
            <Layers className="w-4 h-4 text-[#0F9D8E]" />
            <span>{lang === 'ar' ? 'ورقة طباعة جماعية (A4)' : 'Multi-Label Sheet (A4)'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('design-library')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
          >
            {lang === 'ar' ? 'مكتبة القوالب' : '58-Template Library'}
          </button>
        </div>
      </div>

      {/* Main Split Editor + Canvas */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Controls Column */}
        <div className="xl:col-span-5 space-y-5">
          {/* 1. Binding Selectors */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-5 space-y-4">
            <h2 className="text-sm font-extrabold text-[#0B1320] dark:text-white">
              {lang === 'ar' ? '١. ربط الغرض والقالب' : '1. Bind Item & Template'}
            </h2>

            <div>
              <label
                htmlFor="studio-item-select"
                className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
              >
                {lang === 'ar' ? 'الغرض المراد ربطه برمز QR' : 'Bound Item QR'}
              </label>
              <select
                id="studio-item-select"
                data-testid="studio-item-select"
                value={boundItem?.id || ''}
                onChange={(e) => setBoundItemId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
              >
                {items.length === 0 ? (
                  <option value="">
                    {lang === 'ar' ? 'لا توجد أغراض مسجلة' : 'No registered items'}
                  </option>
                ) : (
                  items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name || it.nameAr} · {it.codeSerial} (
                      {it.qrMode === 'shared'
                        ? lang === 'ar'
                          ? 'QR مشترك'
                          : 'Shared QR'
                        : t.statuses[it.status]}
                      )
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="studio-template-select"
                  className="text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  {lang === 'ar' ? 'قالب الملصق' : 'Tag Template'}
                </label>
                <div className="flex gap-1">
                  {(['all', 'free', 'owned'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setTemplateFilter(f)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        templateFilter === f
                          ? 'bg-[#0F9D8E] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {f === 'all'
                        ? lang === 'ar'
                          ? 'الكل'
                          : 'All'
                        : f === 'free'
                        ? lang === 'ar'
                          ? 'مجاني'
                          : 'Free'
                        : lang === 'ar'
                        ? 'متاح لي'
                        : 'Unlocked'}
                    </button>
                  ))}
                </div>
              </div>
              <select
                id="studio-template-select"
                data-testid="studio-template-select"
                value={boundTemplate?.id || ''}
                onChange={(e) => setBoundDesignId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
              >
                {filteredDesigns.map((tpl) => {
                  const status = getTemplateOwnershipStatus({
                    template: tpl,
                    userPlan: profile.plan,
                    purchasedTemplateIds: purchasedIds,
                  });
                  return (
                    <option key={tpl.id} value={tpl.id}>
                      {lang === 'ar' ? tpl.titleAr : tpl.titleEn} (
                      {status === 'locked'
                        ? `${tpl.priceSar} SAR`
                        : status === 'free'
                        ? lang === 'ar'
                          ? 'مجاني'
                          : 'Free'
                        : lang === 'ar'
                        ? 'مملوك/مشمول'
                        : 'Owned'}
                      )
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* 2. Allowed Design Customization & Layer Controls */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-5 space-y-4">
            <h2 className="text-sm font-extrabold text-[#0B1320] dark:text-white">
              {lang === 'ar' ? '٢. التخصيص والطبقات والمقاس' : '2. Allowed Customization & Print Size'}
            </h2>

            <div>
              <label
                htmlFor="studio-callout-input"
                className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
              >
                {lang === 'ar' ? 'نص العبارة على الملصق (بحد أقصى ٤٢ حرفًا)' : 'Sticker Callout Text (max 42 chars)'}
              </label>
              <input
                id="studio-callout-input"
                type="text"
                value={studioSettings.customCalloutText}
                onChange={(e) =>
                  setStudioSettings({ ...studioSettings, customCalloutText: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="studio-sublabel-input"
                className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
              >
                {lang === 'ar' ? 'سطر فرعي / تعريف الملصق' : 'Secondary Sub-label'}
              </label>
              <input
                id="studio-sublabel-input"
                type="text"
                value={studioSettings.customSubLabel}
                onChange={(e) =>
                  setStudioSettings({ ...studioSettings, customSubLabel: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="studio-width-mm"
                  className="block text-[11px] font-bold text-slate-500 mb-1"
                >
                  {lang === 'ar' ? 'العرض (mm)' : 'Width (mm)'}
                </label>
                <input
                  id="studio-width-mm"
                  type="number"
                  min={15}
                  max={200}
                  value={studioSettings.widthMm}
                  onChange={(e) =>
                    setStudioSettings({
                      ...studioSettings,
                      widthMm: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-xs font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="studio-height-mm"
                  className="block text-[11px] font-bold text-slate-500 mb-1"
                >
                  {lang === 'ar' ? 'الارتفاع (mm)' : 'Height (mm)'}
                </label>
                <input
                  id="studio-height-mm"
                  type="number"
                  min={15}
                  max={200}
                  value={studioSettings.heightMm}
                  onChange={(e) =>
                    setStudioSettings({
                      ...studioSettings,
                      heightMm: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-xs font-mono"
                />
              </div>

              <div className="col-span-2">
                <label
                  htmlFor="studio-dpi-select"
                  className="block text-[11px] font-bold text-slate-500 mb-1"
                >
                  {lang === 'ar' ? 'دقة الطباعة (DPI)' : 'Print Resolution (DPI)'}
                </label>
                <select
                  id="studio-dpi-select"
                  data-testid="studio-dpi-select"
                  value={studioSettings.dpi}
                  onChange={(e) =>
                    setStudioSettings({
                      ...studioSettings,
                      dpi: Number(e.target.value) as 150 | 300 | 600,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-xs font-mono"
                >
                  <option value={150}>150 DPI (Low)</option>
                  <option value={300}>300 DPI (Pro)</option>
                  <option value={600}>600 DPI (Ultra)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F7FAFC] dark:bg-[#0B1320] cursor-pointer">
                <span className="font-bold flex items-center gap-1.5">
                  {studioSettings.qrZoneLocked ? (
                    <Lock className="w-3.5 h-3.5 text-[#0F9D8E]" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-red-500" />
                  )}
                  <span>
                    {lang === 'ar'
                      ? 'قفل منطقة أمان QR والهامش الهادئ (إلزامي للطباعة)'
                      : 'Lock QR Quiet-Zone Safety (Required for Export)'}
                  </span>
                </span>
                <input
                  type="checkbox"
                  data-testid="studio-qr-lock-toggle"
                  checked={studioSettings.qrZoneLocked}
                  onChange={(e) =>
                    setStudioSettings({ ...studioSettings, qrZoneLocked: e.target.checked })
                  }
                  className="accent-[#0F9D8E]"
                />
              </label>

              <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F7FAFC] dark:bg-[#0B1320] cursor-pointer">
                <span className="font-semibold">
                  {lang === 'ar' ? 'إظهار هوامش وحدود القص (Bleed & Cut)' : 'Show Print Bleed & Trim Layer'}
                </span>
                <input
                  type="checkbox"
                  checked={studioSettings.showFrameLayer}
                  onChange={(e) =>
                    setStudioSettings({ ...studioSettings, showFrameLayer: e.target.checked })
                  }
                  className="accent-[#0F9D8E]"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Live Interactive Preview & Preflight Gate */}
        <div className="xl:col-span-7 space-y-5">
          {/* Interactive Canvas */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                {lang === 'ar' ? 'معاينة التجهيز الحي للطباعة' : 'Live Print Production Canvas'}
              </span>
              {boundItem && (
                <span className="text-xs font-mono text-[#0F9D8E] dark:text-[#2DD4BF] font-bold" dir="ltr">
                  {boundItem.codeSerial} → {previewResult?.recoveryUrl}
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#070D17] p-6 flex items-center justify-center min-h-[280px]">
              {previewResult ? (
                <div
                  className="w-full max-w-md flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[300px]"
                  dangerouslySetInnerHTML={{ __html: previewResult.svgMarkup }}
                />
              ) : (
                <p className="text-xs text-slate-500">
                  {lang === 'ar' ? 'اختر قالبًا للمعاينة' : 'Select a template to preview'}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="studio-export-svg-btn"
                  disabled={!preflight.canExportProduction}
                  onClick={handleExportSvg}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تصدير ملف طباعة SVG' : 'Export Print SVG'}</span>
                </button>

                <button
                  type="button"
                  data-testid="studio-export-png-btn"
                  disabled={!preflight.canExportProduction || exportingPng}
                  onClick={() => void handleExportPng()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#0F9D8E] text-[#0F9D8E] dark:text-[#2DD4BF] disabled:opacity-45 disabled:cursor-not-allowed text-xs sm:text-sm font-bold transition-colors"
                >
                  <FileImage className="w-4 h-4" />
                  <span>
                    {exportingPng
                      ? '...'
                      : `${lang === 'ar' ? 'تصدير PNG' : 'Export PNG'} (${studioSettings.dpi} DPI)`}
                  </span>
                </button>
              </div>

              {boundTemplate && !preflight.hasOwnershipAccess && (
                <button
                  type="button"
                  data-testid="studio-purchase-template-btn"
                  onClick={() => setCheckoutOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1320] dark:bg-white text-white dark:text-[#0B1320] text-xs font-bold"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {lang === 'ar'
                      ? `شراء الترخيص (${boundTemplate.priceSar} ر.س)`
                      : `Purchase License (${boundTemplate.priceSar} SAR)`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Print Readiness Preflight Panel */}
          <div
            data-testid="print-preflight-panel"
            className={`rounded-3xl border p-5 space-y-3 ${
              preflight.canExportProduction
                ? 'border-[#0F9D8E]/40 bg-[#0F9D8E]/5 dark:bg-[#19B5A5]/10'
                : 'border-red-300 dark:border-red-800 bg-red-50/70 dark:bg-red-950/20'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold text-[#0B1320] dark:text-white flex items-center gap-2">
                {preflight.canExportProduction ? (
                  <ShieldCheck className="w-5 h-5 text-[#0F9D8E]" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
                <span>
                  {lang === 'ar'
                    ? 'تقرير فحص جاهزية الطباعة (Print Readiness Preflight)'
                    : 'Print Readiness Preflight Check'}
                </span>
              </h2>
              <span
                data-testid="preflight-status-badge"
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  preflight.canExportProduction
                    ? 'bg-[#0F9D8E] text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {preflight.canExportProduction
                  ? lang === 'ar'
                    ? 'جاهز للتصدير الإنتاجي'
                    : 'Ready for Export'
                  : lang === 'ar'
                  ? `التصدير موقوف (${preflight.errorCount} أخطاء)`
                  : `Export Blocked (${preflight.errorCount} errors)`}
              </span>
            </div>

            <div className="space-y-2">
              {preflight.issues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 rounded-xl bg-white/90 dark:bg-[#0B1320]/80 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-xs"
                >
                  {issue.severity === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#0F9D8E] shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        issue.severity === 'error' ? 'text-red-500' : 'text-amber-500'
                      }`}
                    />
                  )}
                  <div>
                    <p className="font-bold text-[#0B1320] dark:text-white">
                      {lang === 'ar' ? issue.titleAr : issue.titleEn}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                      {lang === 'ar' ? issue.detailAr : issue.detailEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {boundTemplate && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          orderType="template_purchase"
          template={boundTemplate}
        />
      )}

      <BatchPrintStudioModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        initialItemIds={boundItem ? [boundItem.id] : []}
      />

      <SmartRelatedServices
        currentPage="print-studio"
        contextItemId={boundItem?.id}
        contextDesignId={boundTemplate?.id}
      />
    </div>
  );
};
