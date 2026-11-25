import React, { useMemo, useState } from 'react';
import {
  Box,
  CheckCircle2,
  Download,
  Eye,
  FileCode2,
  Layers,
  Palette,
  Printer,
  Sliders,
} from 'lucide-react';
import { PrintMaterialFinish, TagDesignTemplate } from '../../types/domain';
import {
  buildPilotEditableSvg,
  buildPilotPrintReadySvg,
  getPilotTrimDimensionsMm,
  PilotLabelRenderOptions,
  triggerPrintReadyPngDownload,
  triggerSvgStringDownload,
} from '../../utils/pilotLabelArtwork';
import { Label3DMockupStage } from './Label3DMockupStage';

type InspectorAssetTab = 'mockup_3d' | 'print_ready' | 'editable_source';

interface PilotProductInspectorProps {
  design: TagDesignTemplate;
  lang: 'ar' | 'en';
  darkTheme?: boolean;
  onNotify?: (type: 'success' | 'info', title: string, desc: string) => void;
}

const FINISH_LABELS: Record<PrintMaterialFinish, { ar: string; en: string }> = {
  soft_matte_foil: { ar: 'فينيل مطفي حريري + رقائق دافئة', en: 'Soft-Touch Matte + Foil Look' },
  waterproof_vinyl: { ar: 'فينيل مطفي مقاوم للماء والاحتكاك', en: 'Waterproof Matte Vinyl' },
  glossy_vinyl: { ar: 'فينيل لامع قابل للغسل UV', en: 'Washable UV Gloss Vinyl' },
  textured_outdoor_vinyl: { ar: 'فينيل خارجي فائق التحمل', en: 'Heavy-Duty Outdoor Vinyl' },
  brushed_polyester: { ar: 'بوليستر صناعي مطفي مقاوم للمذيبات', en: 'Brushed Industrial Polyester' },
  transparent_vinyl: { ar: 'فينيل شفاف لاصق + أساس أبيض للكود', en: 'Transparent Vinyl Stock' },
};

export const PilotProductInspector: React.FC<PilotProductInspectorProps> = ({
  design,
  lang,
  darkTheme = false,
  onNotify,
}) => {
  const isBilingualBatchStyle =
    design.pilotArtStyle === 'pebble_pop' ||
    design.pilotArtStyle === 'metro_ticket' ||
    design.pilotArtStyle === 'jelly_cube' ||
    design.pilotArtStyle === 'hexa_pulse' ||
    design.pilotArtStyle === 'flora_loop' ||
    design.pilotArtStyle === 'mono_mark' ||
    design.pilotArtStyle === 'pocket_orbit' ||
    design.pilotArtStyle === 'astro_buddy' ||
    design.pilotArtStyle === 'campus_bloom' ||
    design.pilotArtStyle === 'game_mode' ||
    design.pilotArtStyle === 'purrfect_tag' ||
    design.pilotArtStyle === 'retro_explorer';

  const [activeTab, setActiveTab] = useState<InspectorAssetTab>('mockup_3d');
  const [calloutText, setCalloutText] = useState(design.defaultCalloutText || 'SCAN TO RETURN');
  const [customSubLabel, setCustomSubLabel] = useState(
    isBilingualBatchStyle
      ? 'امسح الرمز للتواصل مع المالك'
      : 'FINDIT QR · RECOVERY TAG'
  );
  const [serialCode, setSerialCode] = useState(
    `FQR-${design.slug.slice(0, 5).toUpperCase()}-2026`
  );
  const [primaryHex, setPrimaryHex] = useState(design.primaryHex);
  const [secondaryHex, setSecondaryHex] = useState(design.secondaryHex);
  const [accentHex, setAccentHex] = useState(design.badgeColorHex);
  const [materialFinish, setMaterialFinish] = useState<PrintMaterialFinish>(
    design.printSpecs?.defaultMaterial || 'waterproof_vinyl'
  );
  const [showPrintGuides, setShowPrintGuides] = useState(true);
  const [exportingPng, setExportingPng] = useState(false);

  // Sync defaults when user switches between pilot designs
  React.useEffect(() => {
    setCalloutText(design.defaultCalloutText || 'SCAN TO RETURN');
    setCustomSubLabel(
      isBilingualBatchStyle
        ? 'امسح الرمز للتواصل مع المالك'
        : 'FINDIT QR · RECOVERY TAG'
    );
    setPrimaryHex(design.primaryHex);
    setSecondaryHex(design.secondaryHex);
    setAccentHex(design.badgeColorHex);
    setSerialCode(`FQR-${design.slug.slice(0, 5).toUpperCase()}-2026`);
    setMaterialFinish(design.printSpecs?.defaultMaterial || 'waterproof_vinyl');
  }, [design.id, design.pilotArtStyle, design.defaultCalloutText, design.primaryHex, design.secondaryHex, design.badgeColorHex, design.slug, design.printSpecs?.defaultMaterial, isBilingualBatchStyle]);

  const renderOptions: PilotLabelRenderOptions = useMemo(
    () => ({
      calloutText,
      customSubLabel,
      serialCode,
      primaryHex,
      secondaryHex,
      accentHex,
      materialFinish,
      showPrintGuides,
    }),
    [
      calloutText,
      customSubLabel,
      serialCode,
      primaryHex,
      secondaryHex,
      accentHex,
      materialFinish,
      showPrintGuides,
    ]
  );

  const editableSvg = useMemo(
    () => buildPilotEditableSvg(design, renderOptions),
    [design, renderOptions]
  );
  const printReadySvg = useMemo(
    () => buildPilotPrintReadySvg(design, renderOptions),
    [design, renderOptions]
  );

  const dims = useMemo(() => getPilotTrimDimensionsMm(design), [design]);

  const printReadyDataUri = useMemo(
    () => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(printReadySvg)}`,
    [printReadySvg]
  );
  const editableDataUri = useMemo(
    () => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(editableSvg)}`,
    [editableSvg]
  );

  const handleDownloadEditable = () => {
    triggerSvgStringDownload(editableSvg, `${design.slug}-editable-source.svg`);
    onNotify?.(
      'success',
      lang === 'ar' ? 'تم تنزيل ملف التصميم الأصلي' : 'Editable Source SVG Downloaded',
      lang === 'ar'
        ? 'الملف يحتوي على طبقات متجهية منظمة (Background, Artwork, Typography, QR Code, Cutline).'
        : 'Vector SVG contains structured editable groups (<g id="layer-...">).'
    );
  };

  const handleDownloadPrintSvg = () => {
    const cleanPrintSvg = buildPilotPrintReadySvg(design, {
      ...renderOptions,
      showPrintGuides: true,
    });
    triggerSvgStringDownload(cleanPrintSvg, `${design.slug}-print-ready-300dpi.svg`);
    onNotify?.(
      'success',
      lang === 'ar' ? 'تم تنزيل ملف الطباعة النهائي' : 'Print-Ready SVG Downloaded',
      lang === 'ar'
        ? `مضبوط بالمليمتر (${dims.widthMm}×${dims.heightMm}mm) مع 3mm Bleed وخط قص CutContour.`
        : `Calibrated at ${dims.widthMm}×${dims.heightMm}mm with 3mm bleed & magenta CutContour.`
    );
  };

  const handleDownloadPrintPng = async () => {
    setExportingPng(true);
    try {
      const sheetW = dims.widthMm + (showPrintGuides ? 17 : dims.bleedMm * 2);
      const sheetH = dims.heightMm + (showPrintGuides ? 22.5 : dims.bleedMm * 2);
      await triggerPrintReadyPngDownload(
        printReadySvg,
        `${design.slug}-300dpi.png`,
        sheetW,
        sheetH,
        300
      );
      onNotify?.(
        'success',
        lang === 'ar' ? 'تم تصدير صورة 300 DPI للطباعة' : '300 DPI Print PNG Downloaded',
        lang === 'ar'
          ? 'صورة طباعة عالية الدقة مطابقة لملف الطباعة ورمز QR الحقيقي.'
          : 'High-resolution raster exported at exact millimeter 300 DPI scale.'
      );
    } finally {
      setExportingPng(false);
    }
  };

  const paletteSwatches = [
    design.primaryHex,
    '#151A24',
    '#1D4ED8',
    '#0EA5E9',
    '#0F5243',
    '#1B2432',
    '#7C2D12',
  ].filter((v, idx, arr) => arr.indexOf(v) === idx);

  return (
    <div className="space-y-5">
      {/* 3-Asset Navigation Switcher */}
      <div
        role="tablist"
        aria-label={lang === 'ar' ? 'أصول التصميم الثلاثة' : 'Three Required Design Assets'}
        className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1.5 rounded-xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800"
      >
        {(
          [
            {
              id: 'mockup_3d' as const,
              icon: Box,
              ar: '1. معاينة 3D',
              en: '1. 3D Mockup',
            },
            {
              id: 'print_ready' as const,
              icon: Printer,
              ar: '2. ملف الطباعة',
              en: '2. Print File',
            },
            {
              id: 'editable_source' as const,
              icon: FileCode2,
              ar: '3. ملف التعديل',
              en: '3. Editable SVG',
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`asset-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 py-2.5 rounded-lg text-[11px] sm:text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'ar' ? tab.ar : tab.en}</span>
            </button>
          );
        })}
      </div>

      {/* Asset Stage */}
      {activeTab === 'mockup_3d' && (
        <div className="space-y-3" data-testid="panel-mockup-3d">
          <Label3DMockupStage
            design={design}
            renderOptions={renderOptions}
            darkTheme={darkTheme}
            lang={lang}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 px-1">
            <span>
              {lang === 'ar'
                ? 'اسحب للتدوير · نسيج السطح مستخرج مباشرة من ملف الطباعة'
                : 'Drag to orbit · Surface texture derived 1:1 from Print-Ready artwork'}
            </span>
            <span dir="ltr" className="font-mono font-bold text-[#0F9D8E] dark:text-[#19B5A5]">
              {dims.widthMm}×{dims.heightMm}mm · {FINISH_LABELS[materialFinish][lang]}
            </span>
          </div>
        </div>
      )}

      {activeTab === 'print_ready' && (
        <div className="space-y-4" data-testid="panel-print-ready">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white p-4 sm:p-6 flex flex-col items-center justify-center min-h-[340px]">
            <img
              src={printReadyDataUri}
              alt={`${design.titleEn} print-ready sheet`}
              className="max-h-[300px] w-auto object-contain"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrintGuides}
                onChange={(e) => setShowPrintGuides(e.target.checked)}
                className="rounded border-slate-300 text-[#19B5A5] focus:ring-[#19B5A5]"
              />
              <Eye className="w-3.5 h-3.5 text-[#19B5A5]" />
              <span>
                {lang === 'ar'
                  ? 'إظهار دلائل الطباعة (Bleed + Safe + CutContour)'
                  : 'Show Bleed (3mm), Safe Zone & CutContour Guides'}
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="download-print-svg-btn"
                onClick={handleDownloadPrintSvg}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#17243A] dark:bg-slate-800 hover:bg-[#2563EB] text-white text-xs font-bold transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تنزيل الطباعة SVG' : 'Print-Ready SVG'}</span>
              </button>
              <button
                type="button"
                data-testid="download-print-png-btn"
                disabled={exportingPng}
                onClick={() => void handleDownloadPrintPng()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#19B5A5] hover:bg-teal-400 text-[#070D17] text-xs font-extrabold transition-colors whitespace-nowrap disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {exportingPng
                    ? lang === 'ar'
                      ? 'جارٍ التصدير...'
                      : 'Exporting...'
                    : lang === 'ar'
                    ? 'تصدير 300 DPI PNG'
                    : 'Export 300 DPI PNG'}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-white dark:bg-[#0F1A2B] p-3 rounded-xl border border-slate-200 dark:border-slate-800 tabular-nums">
            <div>
              <span className="text-slate-400 block">{lang === 'ar' ? 'القص النهائي' : 'TRIM SIZE'}</span>
              <span dir="ltr" className="inline-block font-bold text-[#17243A] dark:text-white">
                {dims.widthMm} × {dims.heightMm} mm
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">{lang === 'ar' ? 'الهامش الزائد' : 'BLEED'}</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">+{dims.bleedMm} mm</span>
            </div>
            <div>
              <span className="text-slate-400 block">{lang === 'ar' ? 'المنطقة الآمنة' : 'SAFE ZONE'}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">-{dims.safeMarginMm} mm</span>
            </div>
            <div>
              <span className="text-slate-400 block">{lang === 'ar' ? 'معيار QR' : 'ISO QR'}</span>
              <span className="font-bold text-[#17243A] dark:text-white">ECC M · 300 DPI</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'editable_source' && (
        <div className="space-y-4" data-testid="panel-editable-source">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] dark:bg-[repeating-conic-gradient(#0f172a_0%_25%,#1e293b_0%_50%)] [background-size:20px_20px] p-5 flex items-center justify-center min-h-[290px]">
            <img
              src={editableDataUri}
              alt={`${design.titleEn} editable vector artwork`}
              className="max-h-[240px] w-auto object-contain drop-shadow-md"
            />
          </div>

          {/* Vector Layer Structure Inventory */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#17243A] dark:text-white inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#19B5A5]" />
                <span>
                  {lang === 'ar' ? 'هيكل طبقات ملف المتجهات الأصلي (SVG)' : 'Structured Editable Vector Layers'}
                </span>
              </span>
              <button
                type="button"
                data-testid="download-editable-svg-btn"
                onClick={handleDownloadEditable}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تنزيل المصدر القابل للتعديل' : 'Download Editable SVG'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-300">
              {[
                { id: 'layer-cutline', labelAr: 'خط القص الرقمي CutContour', labelEn: 'Die-Cut Contour Stroke' },
                { id: 'layer-background', labelAr: 'طبقة الخلفية والخامة', labelEn: 'Full-Bleed Substrate Base' },
                { id: 'layer-artwork', labelAr: 'طبقة الرسوم والتفاصيل', labelEn: 'Custom Vector Illustrations' },
                { id: 'layer-typography', labelAr: 'طبقة النصوص والتسلسل', labelEn: 'Editable Headlines & Serial' },
                { id: 'layer-qr-code', labelAr: 'طبقة كود QR ISO-18004', labelEn: 'Scannable ISO-18004 QR Group' },
              ].map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#F4F7FB] dark:bg-[#070D17]"
                >
                  <span className="text-[#19B5A5] font-bold">#{l.id}</span>
                  <span className="font-sans text-[11px] truncate">
                    {lang === 'ar' ? l.labelAr : l.labelEn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Synchronized Customization Controls (updates Editable Source + Print File + 3D Mockup together!) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-[#17243A] dark:text-white inline-flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#19B5A5]" />
            <span>
              {lang === 'ar'
                ? 'تخصيص التصميم والخامة (يتزامن فورًا مع 3D وملف الطباعة)'
                : 'Live Customization & Substrate Finish (Syncs All 3 Assets)'}
            </span>
          </span>
          <span className="text-[11px] font-bold text-[#0F9D8E] dark:text-[#19B5A5] inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'متزامن 1:1' : 'Synced 1:1'}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="pilot-callout-input"
              className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
            >
              {lang === 'ar' ? 'عبارة التنبيه على الملصق:' : 'Label Callout Text:'}
            </label>
            <input
              id="pilot-callout-input"
              type="text"
              maxLength={28}
              value={calloutText}
              onChange={(e) => setCalloutText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs font-mono text-[#17243A] dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="pilot-serial-input"
              className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
            >
              {lang === 'ar' ? 'الرقم التسلسلي ورابط QR:' : 'Serial Code & QR Target:'}
            </label>
            <input
              id="pilot-serial-input"
              type="text"
              maxLength={22}
              value={serialCode}
              onChange={(e) => setSerialCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs font-mono text-[#17243A] dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div>
            <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 inline-flex items-center gap-1">
              <Palette className="w-3 h-3" />
              <span>{lang === 'ar' ? 'لون التصميم الرئيسي:' : 'Primary Ink Colorway:'}</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {paletteSwatches.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={`Color ${hex}`}
                  onClick={() => setPrimaryHex(hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    primaryHex === hex
                      ? 'border-[#19B5A5] scale-110 ring-2 ring-[#19B5A5]/40'
                      : 'border-white dark:border-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="pilot-substrate-select"
              className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
            >
              {lang === 'ar' ? 'خامة الطباعة المقترحة (تغيّر ملمس 3D):' : 'Print Substrate Finish (3D Material):'}
            </label>
            <select
              id="pilot-substrate-select"
              value={materialFinish}
              onChange={(e) => setMaterialFinish(e.target.value as PrintMaterialFinish)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs font-semibold text-[#17243A] dark:text-white"
            >
              {(Object.keys(FINISH_LABELS) as PrintMaterialFinish[]).map((fin) => (
                <option key={fin} value={fin}>
                  {FINISH_LABELS[fin][lang]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(design.pilotArtStyle === 'progrid_iso' ||
          design.pilotArtStyle === 'voyager_stamp' ||
          isBilingualBatchStyle) ? (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="pilot-sublabel-input"
                className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
              >
                {isBilingualBatchStyle
                  ? lang === 'ar'
                    ? 'الرسالة العربية (Arabic Message):'
                    : 'Arabic Message:'
                  : lang === 'ar'
                  ? 'تسمية الجهة أو التصنيف:'
                  : 'Asset / Owner Classification:'}
              </label>
              <input
                id="pilot-sublabel-input"
                type="text"
                maxLength={44}
                dir={isBilingualBatchStyle ? 'rtl' : undefined}
                value={customSubLabel}
                onChange={(e) => setCustomSubLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs font-mono text-[#17243A] dark:text-white"
              />
            </div>

            {isBilingualBatchStyle && (
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <label className="inline-flex items-center gap-1.5">
                  <span>{lang === 'ar' ? 'اللون الثانوي:' : 'Secondary:'}</span>
                  <input
                    type="color"
                    value={secondaryHex}
                    onChange={(e) => setSecondaryHex(e.target.value)}
                    className="w-6 h-5 p-0 border border-slate-300 dark:border-slate-700 rounded cursor-pointer bg-transparent"
                  />
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <span>{lang === 'ar' ? 'لون التمييز:' : 'Accent:'}</span>
                  <input
                    type="color"
                    value={accentHex}
                    onChange={(e) => setAccentHex(e.target.value)}
                    className="w-6 h-5 p-0 border border-slate-300 dark:border-slate-700 rounded cursor-pointer bg-transparent"
                  />
                </label>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
