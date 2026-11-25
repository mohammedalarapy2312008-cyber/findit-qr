import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileImage,
  Minus,
  Plus,
  Printer,
  Scissors,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RegisteredItem, TagDesignTemplate } from '../../types/domain';
import {
  triggerPrintReadyPngDownload,
  triggerSvgStringDownload,
} from '../../utils/pilotLabelArtwork';
import {
  BatchPrintQueueItem,
  buildBatchPrintSheetSvg,
  computeBatchPrintSheetLayout,
  PRINT_PAPER_FORMATS,
  PrintPaperFormat,
} from '../../utils/printSheetLayout';
import {
  CompositedOutputMode,
  inlineExternalSvgImages,
} from '../../utils/templateQrCompositor';

interface BatchPrintStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItemIds: string[];
  titleOverrideAr?: string;
  titleOverrideEn?: string;
}

export const BatchPrintStudioModal: React.FC<BatchPrintStudioModalProps> = ({
  isOpen,
  onClose,
  initialItemIds,
  titleOverrideAr,
  titleOverrideEn,
}) => {
  const { lang, items, designs, groups, showToast } = useApp();

  const [copiesMap, setCopiesMap] = useState<Record<string, number>>({});
  const [paperFormat, setPaperFormat] = useState<PrintPaperFormat>('A4');
  const [outputMode, setOutputMode] = useState<CompositedOutputMode>('clean');
  const [scalePercent, setScalePercent] = useState<number>(100);
  const [showCutMarks, setShowCutMarks] = useState<boolean>(true);
  const [showItemLabels, setShowItemLabels] = useState<boolean>(true);
  const [activePageIdx, setActivePageIdx] = useState<number>(0);
  const [exportingType, setExportingType] = useState<'svg' | 'png' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const seed: Record<string, number> = {};
    const targetIds =
      initialItemIds.length > 0
        ? initialItemIds
        : items.filter((i) => i.status !== 'Archived').map((i) => i.id);
    for (const id of targetIds) {
      seed[id] = 1;
    }
    setCopiesMap(seed);
    setActivePageIdx(0);
  }, [isOpen, initialItemIds, items]);

  const queue: BatchPrintQueueItem[] = useMemo(() => {
    const out: BatchPrintQueueItem[] = [];
    for (const item of items) {
      const copies = copiesMap[item.id] || 0;
      if (copies <= 0) continue;
      const design: TagDesignTemplate =
        designs.find((d) => d.id === item.designId) ?? designs[0];
      if (!design) continue;
      out.push({ item, design, copies });
    }
    return out;
  }, [items, designs, copiesMap]);

  const sheetPlan = useMemo(
    () =>
      computeBatchPrintSheetLayout({
        queue,
        paperFormat,
        mode: outputMode,
        scalePercent,
      }),
    [queue, paperFormat, outputMode, scalePercent]
  );

  const safePageIdx = Math.min(activePageIdx, Math.max(0, sheetPlan.pages.length - 1));
  const activePagePlacements = sheetPlan.pages[safePageIdx] || [];

  const activePageSvg = useMemo(
    () =>
      buildBatchPrintSheetSvg({
        pagePlacements: activePagePlacements,
        paper: sheetPlan.paper,
        showCutMarks,
        showItemLabels,
        pageNumber: safePageIdx + 1,
        totalPages: Math.max(1, sheetPlan.pages.length),
      }),
    [activePagePlacements, sheetPlan.paper, sheetPlan.pages.length, safePageIdx, showCutMarks, showItemLabels]
  );

  const allPagesSvgList = useMemo(
    () =>
      sheetPlan.pages.map((placements, idx) =>
        buildBatchPrintSheetSvg({
          pagePlacements: placements,
          paper: sheetPlan.paper,
          showCutMarks,
          showItemLabels,
          pageNumber: idx + 1,
          totalPages: sheetPlan.pages.length,
        })
      ),
    [sheetPlan, showCutMarks, showItemLabels]
  );

  if (!isOpen) return null;

  const updateItemCopies = (itemId: string, delta: number) => {
    setCopiesMap((prev) => {
      const nextVal = Math.max(0, Math.min(12, (prev[itemId] || 0) + delta));
      return { ...prev, [itemId]: nextVal };
    });
    setActivePageIdx(0);
  };

  const applyQuickGroup = (groupId: string) => {
    const next: Record<string, number> = {};
    for (const item of items) {
      if (groupId === '__all_active__' && item.status !== 'Archived') {
        next[item.id] = 1;
      } else if (item.groupId === groupId) {
        next[item.id] = 1;
      }
    }
    setCopiesMap(next);
    setActivePageIdx(0);
  };

  const handleDownloadSheetSvg = async () => {
    if (exportingType || activePagePlacements.length === 0) return;
    setExportingType('svg');
    try {
      const selfContained = await inlineExternalSvgImages(activePageSvg);
      triggerSvgStringDownload(
        selfContained,
        `finditqr-print-sheet-${paperFormat.toLowerCase()}-p${safePageIdx + 1}.svg`
      );
      showToast(
        'success',
        lang === 'ar' ? 'تم تنزيل ورقة الطباعة SVG' : 'Print Sheet SVG Downloaded',
        lang === 'ar'
          ? `صفحة ${safePageIdx + 1} (${activePagePlacements.length} ملصق بمقاس ${paperFormat}).`
          : `Page ${safePageIdx + 1} (${activePagePlacements.length} stickers, ${paperFormat}).`
      );
    } finally {
      setExportingType(null);
    }
  };

  const handleDownloadSheetPng = async () => {
    if (exportingType || activePagePlacements.length === 0) return;
    setExportingType('png');
    try {
      const selfContained = await inlineExternalSvgImages(activePageSvg);
      // 150-300 DPI calibrated sheet pixel dimensions (A4 2480x3508 max safe canvas edge)
      const widthPx = Math.round(sheetPlan.paper.widthMm * 10);
      const heightPx = Math.round(sheetPlan.paper.heightMm * 10);
      await triggerPrintReadyPngDownload(
        selfContained,
        `finditqr-print-sheet-${paperFormat.toLowerCase()}-p${safePageIdx + 1}.png`,
        widthPx,
        heightPx
      );
      showToast(
        'success',
        lang === 'ar' ? 'تم تصدير ورقة الطباعة PNG' : 'High-Res Print Sheet PNG Exported',
        lang === 'ar'
          ? `جاهزة للطباعة بمقاس ${paperFormat} ودقة عالية.`
          : `Ready to print on ${paperFormat} paper.`
      );
    } finally {
      setExportingType(null);
    }
  };

  const handleBrowserPrint = () => {
    if (activePagePlacements.length === 0) return;
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        data-testid="batch-print-studio-modal"
        aria-label={
          titleOverrideEn || (lang === 'ar' ? 'استوديو الطباعة الجماعية' : 'Batch Print Studio')
        }
        className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 print:hidden"
      >
        <div className="w-full max-w-6xl max-h-[92vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#17243A] dark:text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#2563EB] dark:text-[#19B5A5]" />
                <span>
                  {lang === 'ar'
                    ? titleOverrideAr || 'نظام الطباعة الفردية والجماعية (A4 / Letter)'
                    : titleOverrideEn || 'Individual & Batch Sticker Print Studio'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {lang === 'ar'
                  ? `المحدد للطباعة: ${sheetPlan.totalStickers} ملصق عبر ${Math.max(1, sheetPlan.pages.length)} صفحة ${paperFormat} — كل ملصق مدمج بكود QR الحقيقي للغرض`
                  : `Queued: ${sheetPlan.totalStickers} sticker(s) across ${Math.max(1, sheetPlan.pages.length)} ${paperFormat} page(s) — each with its real item QR`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={lang === 'ar' ? 'إغلاق استوديو الطباعة' : 'Close Print Studio'}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-[#17243A] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main Split Body */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
            {/* Left Sidebar: Item Queue & Sheet Settings */}
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-e border-slate-200 dark:border-slate-800 p-5 space-y-5 overflow-y-auto">
              {/* Quick Group Loaders */}
              <div className="space-y-2">
                <span className="block text-xs font-extrabold text-[#17243A] dark:text-white">
                  {lang === 'ar' ? 'تحميل سريع للطباعة:' : 'Quick Load Items / Groups:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyQuickGroup('__all_active__')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-[#2563EB]"
                  >
                    {lang === 'ar' ? 'كل الأغراض النشطة' : 'All Active Items'}
                  </button>
                  {groups.map((grp) => (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => applyQuickGroup(grp.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-[#2563EB]"
                    >
                      {grp.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items + Copy Count List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#17243A] dark:text-white">
                  <span>{lang === 'ar' ? 'الأغراض وعدد النسخ:' : 'Items & Sticker Copies:'}</span>
                  <span className="text-slate-400 font-mono tabular-nums">{items.length}</span>
                </div>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pe-1">
                  {items.map((it: RegisteredItem) => {
                    const count = copiesMap[it.id] || 0;
                    const tpl = designs.find((d) => d.id === it.designId) ?? designs[0];
                    return (
                      <div
                        key={it.id}
                        data-testid={`batch-item-row-${it.id}`}
                        className={`rounded-xl border p-2.5 flex items-center justify-between gap-2 transition-colors ${
                          count > 0
                            ? 'border-[#2563EB] bg-[#2563EB]/5 dark:bg-[#19B5A5]/10'
                            : 'border-slate-200 dark:border-slate-800 bg-[#F4F7FB]/50 dark:bg-[#070D17]/50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#17243A] dark:text-white truncate">
                            {it.name || (lang === 'ar' ? it.nameAr : it.nameEn)}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 truncate">
                            {it.codeSerial} · {lang === 'ar' ? tpl?.titleAr : tpl?.titleEn}
                          </p>
                          {it.qrMode && it.qrMode !== 'individual' && (
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 truncate mt-0.5">
                              {it.qrMode === 'shared'
                                ? lang === 'ar'
                                  ? `QR مشترك (${it.sharedQrGroupName || 'مجموعة'}) — الفردي متوقف`
                                  : `Shared QR (${it.sharedQrGroupName || 'Group'}) — Individual paused`
                                : lang === 'ar'
                                ? 'غير مرتبط بكود QR نشط'
                                : 'No active QR assigned'}
                            </p>
                          )}
                        </div>

                        <div className="inline-flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            aria-label={lang === 'ar' ? `تقليل نسخ ${it.name}` : `Decrease ${it.name}`}
                            onClick={() => updateItemCopies(it.id, -1)}
                            className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] flex items-center justify-center text-xs font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-mono text-xs font-extrabold tabular-nums">
                            {count}
                          </span>
                          <button
                            type="button"
                            aria-label={lang === 'ar' ? `زيادة نسخ ${it.name}` : `Increase ${it.name}`}
                            onClick={() => updateItemCopies(it.id, 1)}
                            className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] flex items-center justify-center text-xs font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Paper & Print Options */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      {lang === 'ar' ? 'مقاس الورق' : 'Paper Size'}
                    </label>
                    <select
                      value={paperFormat}
                      onChange={(e) => setPaperFormat(e.target.value as PrintPaperFormat)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs font-bold"
                    >
                      {(Object.keys(PRINT_PAPER_FORMATS) as PrintPaperFormat[]).map((fmt) => (
                        <option key={fmt} value={fmt}>
                          {lang === 'ar'
                            ? PRINT_PAPER_FORMATS[fmt].labelAr
                            : PRINT_PAPER_FORMATS[fmt].labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      {lang === 'ar' ? 'مقياس الطباعة' : 'Print Scale'}
                    </label>
                    <select
                      value={scalePercent}
                      onChange={(e) => setScalePercent(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs font-bold"
                    >
                      <option value={85}>{lang === 'ar' ? '٨٥٪ (مكثّف)' : '85% Compact'}</option>
                      <option value={100}>{lang === 'ar' ? '١٠٠٪ (المقاس الأصلي مم)' : '100% Exact mm'}</option>
                      <option value={110}>{lang === 'ar' ? '١١٠٪ (مكبّر)' : '110% Large'}</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] p-1">
                    <button
                      type="button"
                      onClick={() => setOutputMode('clean')}
                      className={`px-2.5 py-1 rounded-lg font-bold ${
                        outputMode === 'clean' ? 'bg-[#2563EB] text-white' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {lang === 'ar' ? 'قص نظيف' : 'Clean Trim'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutputMode('print')}
                      className={`px-2.5 py-1 rounded-lg font-bold ${
                        outputMode === 'print' ? 'bg-[#2563EB] text-white' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {lang === 'ar' ? 'مع امتداد Bleed' : 'With Bleed'}
                    </button>
                  </div>

                  <label className="inline-flex items-center gap-1.5 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCutMarks}
                      onChange={(e) => setShowCutMarks(e.target.checked)}
                    />
                    <Scissors className="w-3.5 h-3.5 text-rose-500" />
                    <span>{lang === 'ar' ? 'علامات القص' : 'Cut Marks'}</span>
                  </label>

                  <label className="inline-flex items-center gap-1.5 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showItemLabels}
                      onChange={(e) => setShowItemLabels(e.target.checked)}
                    />
                    <span>{lang === 'ar' ? 'الرقم التسلسلي' : 'Serial Captions'}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Main Stage: Calibrated A4 Print Sheet Live Preview */}
            <div className="lg:col-span-7 bg-[#F4F7FB] dark:bg-[#070D17] p-5 sm:p-6 flex flex-col justify-between gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#17243A] dark:text-white">
                  {lang === 'ar'
                    ? `معاينة ورقة الطباعة (${paperFormat})`
                    : `Live Printable Sheet (${paperFormat})`}
                </span>
                {sheetPlan.pages.length > 1 && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold">
                    <button
                      type="button"
                      disabled={safePageIdx === 0}
                      onClick={() => setActivePageIdx((p) => Math.max(0, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] disabled:opacity-40"
                    >
                      {lang === 'ar' ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                    </button>
                    <span className="font-mono tabular-nums" dir="ltr">
                      {safePageIdx + 1} / {sheetPlan.pages.length}
                    </span>
                    <button
                      type="button"
                      disabled={safePageIdx >= sheetPlan.pages.length - 1}
                      onClick={() =>
                        setActivePageIdx((p) => Math.min(sheetPlan.pages.length - 1, p + 1))
                      }
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] disabled:opacity-40"
                    >
                      {lang === 'ar' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 flex items-center justify-center">
                {sheetPlan.totalStickers === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-2 max-w-sm">
                    <p className="text-sm font-bold text-[#17243A] dark:text-white">
                      {lang === 'ar'
                        ? 'اختر غرضًا واحدًا على الأقل للطباعة'
                        : 'Select at least 1 item copy to preview'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {lang === 'ar'
                        ? 'استخدم أزرار (+) بجانب أي غرض لإدراج ملصقه داخل ورقة الطباعة.'
                        : 'Use (+) beside any item on the left to queue its sticker onto the sheet.'}
                    </p>
                  </div>
                ) : (
                  <div
                    data-testid="batch-print-sheet-preview"
                    className="w-full max-w-[410px] aspect-[210/297] rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden p-1 [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: activePageSvg }}
                  />
                )}
              </div>

              {/* Footer Export & Direct Print Action Row */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  data-testid="batch-download-svg-btn"
                  disabled={sheetPlan.totalStickers === 0 || exportingType !== null}
                  onClick={() => void handleDownloadSheetSvg()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] text-xs font-bold disabled:opacity-45"
                >
                  <Download className="w-4 h-4 text-[#2563EB]" />
                  <span>{lang === 'ar' ? 'تنزيل ورقة SVG' : 'Download Sheet SVG'}</span>
                </button>

                <button
                  type="button"
                  data-testid="batch-download-png-btn"
                  disabled={sheetPlan.totalStickers === 0 || exportingType !== null}
                  onClick={() => void handleDownloadSheetPng()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#19B5A5] hover:bg-teal-400 text-[#070D17] text-xs font-extrabold disabled:opacity-45"
                >
                  <FileImage className="w-4 h-4" />
                  <span>
                    {exportingType === 'png'
                      ? lang === 'ar'
                        ? 'جارٍ التصدير...'
                        : 'Exporting...'
                      : lang === 'ar'
                      ? 'تصدير ورقة PNG للطباعة'
                      : 'Export Print PNG'}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="batch-browser-print-btn"
                  disabled={sheetPlan.totalStickers === 0}
                  onClick={handleBrowserPrint}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold disabled:opacity-45"
                >
                  <Printer className="w-4 h-4" />
                  <span>
                    {lang === 'ar'
                      ? `طباعة فورية (${sheetPlan.pages.length})`
                      : `Print Now (${sheetPlan.pages.length})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Hidden-On-Screen / Visible-On-Print Portal */}
      {typeof document !== 'undefined' &&
        allPagesSvgList.length > 0 &&
        createPortal(
          <div id="findit-print-sheet-portal" aria-hidden="true">
            {allPagesSvgList.map((pageSvg, idx) => (
              <div
                key={`print-page-${idx}`}
                className="findit-print-page"
                dangerouslySetInnerHTML={{ __html: pageSvg }}
              />
            ))}
          </div>,
          document.body
        )}
    </>
  );
};
