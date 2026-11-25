import { RegisteredItem, TagDesignTemplate } from '../types/domain';
import { getPilotTrimDimensionsMm } from './pilotLabelArtwork';
import {
  CompositedOutputMode,
  composeItemTemplateDesignSvg,
} from './templateQrCompositor';

export type PrintPaperFormat = 'A4' | 'Letter';

export interface PaperDimensionsMm {
  id: PrintPaperFormat;
  labelAr: string;
  labelEn: string;
  widthMm: number;
  heightMm: number;
}

export const PRINT_PAPER_FORMATS: Record<PrintPaperFormat, PaperDimensionsMm> = {
  A4: {
    id: 'A4',
    labelAr: 'A4 قياسي (210 × 297 مم)',
    labelEn: 'Standard A4 (210 × 297 mm)',
    widthMm: 210,
    heightMm: 297,
  },
  Letter: {
    id: 'Letter',
    labelAr: 'US Letter (215.9 × 279.4 مم)',
    labelEn: 'US Letter (215.9 × 279.4 mm)',
    widthMm: 215.9,
    heightMm: 279.4,
  },
};

export interface BatchPrintQueueItem {
  item: RegisteredItem;
  design: TagDesignTemplate;
  copies: number;
}

export interface StickerPlacementMm {
  placementId: string;
  pageIndex: number;
  copyIndex: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  item: RegisteredItem;
  design: TagDesignTemplate;
  svgMarkup: string;
  recoveryUrl: string;
}

export interface BatchPrintSheetPlan {
  paper: PaperDimensionsMm;
  mode: CompositedOutputMode;
  scaleFactor: number;
  totalStickers: number;
  pages: StickerPlacementMm[][];
}

/**
 * Parses nominal trim dimensions (in mm) directly from template metadata,
 * falling back cleanly to getPilotTrimDimensionsMm if formatted differently.
 */
export function parseTemplateDimensionsMm(
  design: TagDesignTemplate,
  mode: CompositedOutputMode = 'clean'
): { widthMm: number; heightMm: number; bleedMm: number } {
  const fromPilot = getPilotTrimDimensionsMm(design);
  let widthMm = fromPilot.widthMm;
  let heightMm = fromPilot.heightMm;
  const bleedMm = mode === 'print' ? fromPilot.bleedMm || 3 : 0;

  if (design.printSpecs?.trimWidthMm && design.printSpecs?.trimHeightMm) {
    widthMm = design.printSpecs.trimWidthMm;
    heightMm = design.printSpecs.trimHeightMm;
  } else if (design.dimensionsMm) {
    const match = design.dimensionsMm.match(/(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)/);
    if (match) {
      widthMm = Number(match[1]) || widthMm;
      heightMm = Number(match[2]) || heightMm;
    }
  }

  return {
    widthMm: widthMm + bleedMm * 2,
    heightMm: heightMm + bleedMm * 2,
    bleedMm,
  };
}

/**
 * Computes a collision-free shelf-packed millimeter layout across one or more A4/Letter sheets
 * so items with varying sticker sizes (circle, card, luggage loop, etc.) never overlap.
 */
export function computeBatchPrintSheetLayout(params: {
  queue: BatchPrintQueueItem[];
  paperFormat?: PrintPaperFormat;
  mode?: CompositedOutputMode;
  scalePercent?: number;
  pageMarginMm?: number;
  gapMm?: number;
  labelReserveMm?: number;
  baseOrigin?: string;
}): BatchPrintSheetPlan {
  const {
    queue,
    paperFormat = 'A4',
    mode = 'clean',
    scalePercent = 100,
    pageMarginMm = 10,
    gapMm = 7,
    labelReserveMm = 6,
    baseOrigin,
  } = params;

  const paper = PRINT_PAPER_FORMATS[paperFormat];
  const scaleFactor = Math.max(0.5, Math.min(1.5, scalePercent / 100));
  const usableWidth = paper.widthMm - pageMarginMm * 2;
  const usableHeight = paper.heightMm - pageMarginMm * 2;

  const expandedUnits: Array<{
    item: RegisteredItem;
    design: TagDesignTemplate;
    copyIndex: number;
    widthMm: number;
    heightMm: number;
    bleedMm: number;
    svgMarkup: string;
    recoveryUrl: string;
  }> = [];

  for (const entry of queue) {
    const count = Math.max(0, Math.min(20, Math.floor(entry.copies)));
    if (count === 0) continue;

    const dims = parseTemplateDimensionsMm(entry.design, mode);
    const composed = composeItemTemplateDesignSvg({
      design: entry.design,
      codeSerial: entry.item.codeSerial,
      mode,
      baseOrigin,
    });

    const wMm = Math.min(usableWidth, Number((dims.widthMm * scaleFactor).toFixed(2)));
    const hMm = Math.min(
      usableHeight - labelReserveMm,
      Number((dims.heightMm * scaleFactor).toFixed(2))
    );

    for (let c = 1; c <= count; c++) {
      expandedUnits.push({
        item: entry.item,
        design: entry.design,
        copyIndex: c,
        widthMm: wMm,
        heightMm: hMm,
        bleedMm: dims.bleedMm,
        svgMarkup: composed.svgMarkup,
        recoveryUrl: composed.recoveryUrl,
      });
    }
  }

  const pages: StickerPlacementMm[][] = [];
  let currentPage: StickerPlacementMm[] = [];
  let cursorX = pageMarginMm;
  let cursorY = pageMarginMm;
  let rowMaxHeight = 0;

  for (const unit of expandedUnits) {
    const cellTotalHeight = unit.heightMm + labelReserveMm;

    if (
      currentPage.length > 0 &&
      cursorX + unit.widthMm > pageMarginMm + usableWidth + 0.01
    ) {
      cursorX = pageMarginMm;
      cursorY += rowMaxHeight + gapMm;
      rowMaxHeight = 0;
    }

    if (
      currentPage.length > 0 &&
      cursorY + cellTotalHeight > pageMarginMm + usableHeight + 0.01
    ) {
      pages.push(currentPage);
      currentPage = [];
      cursorX = pageMarginMm;
      cursorY = pageMarginMm;
      rowMaxHeight = 0;
    }

    const pageIndex = pages.length;
    currentPage.push({
      placementId: `${unit.item.id}__copy_${unit.copyIndex}_p${pageIndex}`,
      pageIndex,
      copyIndex: unit.copyIndex,
      xMm: Number(cursorX.toFixed(2)),
      yMm: Number(cursorY.toFixed(2)),
      widthMm: unit.widthMm,
      heightMm: unit.heightMm,
      bleedMm: unit.bleedMm,
      item: unit.item,
      design: unit.design,
      svgMarkup: unit.svgMarkup,
      recoveryUrl: unit.recoveryUrl,
    });

    cursorX += unit.widthMm + gapMm;
    if (cellTotalHeight > rowMaxHeight) {
      rowMaxHeight = cellTotalHeight;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return {
    paper,
    mode,
    scaleFactor,
    totalStickers: expandedUnits.length,
    pages,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Rewrites internal SVG defs IDs inside an individual sticker SVG so multiple
 * stickers embedded on one composite A4 sheet never suffer from gradient/clipPath ID collisions.
 */
export function scopeNestedSvgIds(svgMarkup: string, prefix: string): string {
  const ids = new Set<string>();
  const idMatches = svgMarkup.matchAll(/\bid="([^"]+)"/g);
  for (const m of idMatches) {
    if (m[1]) ids.add(m[1]);
  }
  let scoped = svgMarkup;
  for (const id of ids) {
    const safePrefix = `${prefix}_${id}`;
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    scoped = scoped
      .replace(new RegExp(`id="${escapedId}"`, 'g'), `id="${safePrefix}"`)
      .replace(new RegExp(`url\\(#${escapedId}\\)`, 'g'), `url(#${safePrefix})`)
      .replace(new RegExp(`href="#${escapedId}"`, 'g'), `href="#${safePrefix}"`);
  }
  return scoped;
}

function injectNestedSvgGeometry(
  svgMarkup: string,
  xMm: number,
  yMm: number,
  widthMm: number,
  heightMm: number
): string {
  const viewBoxMatch = svgMarkup.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${widthMm} ${heightMm}`;
  const cleaned = svgMarkup.replace(/<\?xml[^>]*\?>/i, '').trim();
  return cleaned.replace(
    /<svg\b([^>]*)>/i,
    (_full, attrs: string) => {
      const strippedAttrs = attrs
        .replace(/\s(x|y|width|height|viewBox)="[^"]*"/gi, '')
        .trim();
      return `<svg x="${xMm}" y="${yMm}" width="${widthMm}" height="${heightMm}" viewBox="${viewBox}" ${strippedAttrs}>`;
    }
  );
}

/**
 * Builds a physical-millimeter calibrated composite print sheet SVG (e.g. A4 210x297mm)
 * containing every placed sticker with its own item-specific ISO-18004 QR code.
 */
export function buildBatchPrintSheetSvg(params: {
  pagePlacements: StickerPlacementMm[];
  paper: PaperDimensionsMm;
  showCutMarks?: boolean;
  showItemLabels?: boolean;
  pageNumber?: number;
  totalPages?: number;
}): string {
  const {
    pagePlacements,
    paper,
    showCutMarks = true,
    showItemLabels = true,
    pageNumber = 1,
    totalPages = 1,
  } = params;

  const stickerFragments: string[] = [];

  for (let idx = 0; idx < pagePlacements.length; idx++) {
    const p = pagePlacements[idx];
    const scoped = scopeNestedSvgIds(p.svgMarkup, `s${idx}`);
    const nested = injectNestedSvgGeometry(scoped, p.xMm, p.yMm, p.widthMm, p.heightMm);

    let cropMarks = '';
    if (showCutMarks) {
      const m = 1.8;
      const x1 = p.xMm.toFixed(2);
      const y1 = p.yMm.toFixed(2);
      const x2 = (p.xMm + p.widthMm).toFixed(2);
      const y2 = (p.yMm + p.heightMm).toFixed(2);
      cropMarks = `
        <rect x="${x1}" y="${y1}" width="${p.widthMm.toFixed(2)}" height="${p.heightMm.toFixed(2)}" fill="none" stroke="#EC4899" stroke-width="0.22" stroke-dasharray="1.4 1.2" opacity="0.65"/>
        <path d="M${(p.xMm - m).toFixed(2)},${y1} H${(p.xMm + 1).toFixed(2)} M${x1},${(p.yMm - m).toFixed(2)} V${(p.yMm + 1).toFixed(2)}
                 M${(p.xMm + p.widthMm - 1).toFixed(2)},${y1} H${(p.xMm + p.widthMm + m).toFixed(2)} M${x2},${(p.yMm - m).toFixed(2)} V${(p.yMm + 1).toFixed(2)}
                 M${(p.xMm - m).toFixed(2)},${y2} H${(p.xMm + 1).toFixed(2)} M${x1},${(p.yMm + p.heightMm - 1).toFixed(2)} V${(p.yMm + p.heightMm + m).toFixed(2)}
                 M${(p.xMm + p.widthMm - 1).toFixed(2)},${y2} H${(p.xMm + p.widthMm + m).toFixed(2)} M${x2},${(p.yMm + p.heightMm - 1).toFixed(2)} V${(p.yMm + p.heightMm + m).toFixed(2)}"
              stroke="#64748B" stroke-width="0.25" fill="none"/>`;
    }

    let itemCaption = '';
    if (showItemLabels) {
      const labelText = `${p.item.codeSerial} · ${(p.item.name || p.item.nameEn || '').slice(0, 22)}`;
      itemCaption = `<text x="${(p.xMm + p.widthMm / 2).toFixed(2)}" y="${(p.yMm + p.heightMm + 3.8).toFixed(2)}" text-anchor="middle" direction="ltr" unicode-bidi="plaintext" font-family="ui-monospace, monospace" font-size="2.5" fill="#475569">${escapeXml(labelText)}</text>`;
    }

    stickerFragments.push(
      `<g id="placed-sticker-${idx}" data-item-serial="${escapeXml(p.item.codeSerial)}" data-recovery-url="${escapeXml(p.recoveryUrl)}">${nested}${cropMarks}${itemCaption}</g>`
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${paper.widthMm}mm" height="${paper.heightMm}mm" viewBox="0 0 ${paper.widthMm} ${paper.heightMm}">
  <rect x="0" y="0" width="${paper.widthMm}" height="${paper.heightMm}" fill="#FFFFFF"/>
  <text x="10" y="${(paper.heightMm - 4).toFixed(2)}" text-anchor="start" direction="ltr" unicode-bidi="plaintext" font-family="ui-monospace, monospace" font-size="2.6" fill="#64748B">FindIt QR Print Sheet · ${paper.id} · Page ${pageNumber}/${totalPages} · ${pagePlacements.length} Sticker(s)</text>
  ${stickerFragments.join('\n  ')}
</svg>`;
}
