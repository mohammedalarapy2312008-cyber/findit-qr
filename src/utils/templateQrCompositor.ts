import { TagDesignTemplate, UserPlanTier } from '../types/domain';
import { canAccessTemplateByPlanOrPurchase } from './adminLogic';
import {
  buildBatch02CleanStickerSvg,
  buildBatch02PrintReadySvg,
  getBatch02SpecByArtStyle,
} from './batch02StickerProduction';
import {
  buildMasterCleanStickerSvg,
  buildMasterPrintReadySvg,
  getMasterSpecById,
} from './masterCollectionProduction';
import {
  buildPilotCleanTrimSvg,
  buildPilotPrintReadySvg,
  triggerPrintReadyPngDownload,
  triggerSvgStringDownload,
} from './pilotLabelArtwork';
import { buildQrRecoveryUrl, generateQrMatrix } from './qrLogic';
import { isTemplateFree } from './templateDiscovery';

export type CompositedOutputMode = 'clean' | 'print';

export interface CompositedItemDesignResult {
  svgMarkup: string;
  recoveryUrl: string;
  architecture: 'master33' | 'batch02' | 'pilot_vector';
  widthPx: number;
  heightPx: number;
  qrEncodedPayload: string;
}

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Renders a crisp ISO/IEC 18004 QR matrix SVG group centered inside an exact
 * target bounding box (in mm or px) with a clean white quiet zone.
 */
export function buildIsoQrOverlayGroup(params: {
  payload: string;
  x: number;
  y: number;
  size: number;
  quietZone: number;
  fgColor?: string;
  bgColor?: string;
  cornerRadius?: number;
  groupId?: string;
}): string {
  const {
    payload,
    x,
    y,
    size,
    quietZone,
    fgColor = '#0A101D',
    bgColor = '#FFFFFF',
    cornerRadius = 0,
    groupId = 'findit-item-dynamic-qr',
  } = params;

  const matrix = generateQrMatrix(payload, undefined, 'M');
  const count = matrix.length;
  const innerSize = Math.max(4, size - quietZone * 2);
  const cell = innerSize / count;
  const startX = x + quietZone;
  const startY = y + quietZone;

  const rects: string[] = [];
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        const rx = (startX + c * cell).toFixed(3);
        const ry = (startY + r * cell).toFixed(3);
        const rw = (cell + 0.025).toFixed(3);
        rects.push(`<rect x="${rx}" y="${ry}" width="${rw}" height="${rw}" fill="${fgColor}"/>`);
      }
    }
  }

  return `<g id="${groupId}" data-qr-payload="${escapeXmlAttr(payload)}" data-qr-modules="${count}">
    <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${size.toFixed(2)}" height="${size.toFixed(2)}" rx="${cornerRadius.toFixed(2)}" fill="${bgColor}"/>
    ${rects.join('')}
  </g>`;
}

/**
 * Composites a genuine item-specific ISO-18004 QR code (encoding ONLY the public
 * recovery URL `/found/<codeSerial>`) directly into the selected FindIt QR template's
 * dedicated QR placement area without modifying any original template asset on disk.
 */
export function composeItemTemplateDesignSvg(params: {
  design: TagDesignTemplate;
  codeSerial: string;
  mode?: CompositedOutputMode;
  baseOrigin?: string;
  embeddedArtworkDataUri?: string;
}): CompositedItemDesignResult {
  const { design, codeSerial, mode = 'clean', baseOrigin, embeddedArtworkDataUri } = params;
  const recoveryUrl = buildQrRecoveryUrl(codeSerial, baseOrigin);

  // 1. Master Collection (33 commercial sticker templates)
  const masterSpec = getMasterSpecById(design.id) || getMasterSpecById(design.slug || '');
  if (masterSpec) {
    const svgMarkup =
      mode === 'print'
        ? buildMasterPrintReadySvg(masterSpec, embeddedArtworkDataUri, {
            includeRealQr: true,
            qrPayload: recoveryUrl,
            showGuides: false,
          })
        : buildMasterCleanStickerSvg(masterSpec, embeddedArtworkDataUri, {
            includeRealQr: true,
            qrPayload: recoveryUrl,
          });
    return {
      svgMarkup,
      recoveryUrl,
      architecture: 'master33',
      widthPx: Math.round(masterSpec.widthMm * 12),
      heightPx: Math.round(masterSpec.heightMm * 12),
      qrEncodedPayload: recoveryUrl,
    };
  }

  // 2. Batch 02 Commercial Stickers (8 die-cut sticker templates with exact 34x34mm QR zone)
  const batch02Spec =
    getBatch02SpecByArtStyle(design.id) ||
    getBatch02SpecByArtStyle(design.pilotArtStyle || '') ||
    getBatch02SpecByArtStyle(design.slug || '');
  if (batch02Spec) {
    const baseSvg =
      mode === 'print'
        ? buildBatch02PrintReadySvg(batch02Spec)
        : buildBatch02CleanStickerSvg(batch02Spec);

    const qrOffset = mode === 'print' ? 3 : 0; // Print SVG adds 3mm bleed offset
    const qrOverlay = buildIsoQrOverlayGroup({
      payload: recoveryUrl,
      x: batch02Spec.qrZoneMm.x + qrOffset,
      y: batch02Spec.qrZoneMm.y + qrOffset,
      size: batch02Spec.qrZoneMm.size,
      quietZone: batch02Spec.qrZoneMm.quietZoneMm,
      cornerRadius: 2.2,
      fgColor: '#0A101D',
      bgColor: '#FFFFFF',
      groupId: 'findit-item-dynamic-qr',
    });

    // Inject right after the designated blank QR placement rectangle
    const qrAnchorRegex = /(<rect\s+id="qr-dynamic-placement-area"[^>]*\/>)/;
    const svgMarkup = qrAnchorRegex.test(baseSvg)
      ? baseSvg.replace(qrAnchorRegex, `$1\n    ${qrOverlay}`)
      : baseSvg.replace('</svg>', `  ${qrOverlay}\n</svg>`);

    const scalePxPerMm = 12; // ~300 DPI
    return {
      svgMarkup,
      recoveryUrl,
      architecture: 'batch02',
      widthPx: Math.round((batch02Spec.widthMm + qrOffset * 2) * scalePxPerMm),
      heightPx: Math.round((batch02Spec.heightMm + qrOffset * 2) * scalePxPerMm),
      qrEncodedPayload: recoveryUrl,
    };
  }

  // 3. Pilot / Pebble Pop / Batch 01 Vector Templates & Legacy Fallback
  const svgMarkup =
    mode === 'print'
      ? buildPilotPrintReadySvg(design, {
          serialCode: codeSerial,
          showPrintGuides: false,
          scalePxPerMm: 12,
        })
      : buildPilotCleanTrimSvg(design, {
          serialCode: codeSerial,
          scalePxPerMm: 12,
        });

  const widthMatch = svgMarkup.match(/width="(\d+)"/);
  const heightMatch = svgMarkup.match(/height="(\d+)"/);
  return {
    svgMarkup,
    recoveryUrl,
    architecture: 'pilot_vector',
    widthPx: widthMatch ? Number(widthMatch[1]) : 1020,
    heightPx: heightMatch ? Number(heightMatch[1]) : 648,
    qrEncodedPayload: recoveryUrl,
  };
}

/**
 * Fetches any relative `/assets/...` or `http(s)` `<image href="...">` tags inside an SVG
 * and replaces them with inline Base64 data URIs so the exported SVG & 300 DPI PNG are
 * 100% self-contained and render cleanly offline.
 */
export async function inlineExternalSvgImages(svgMarkup: string): Promise<string> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return svgMarkup;
  }

  const hrefRegex = /(<image[^>]+(?:xlink:)?href=")([^"]+)(")/g;
  const matches = Array.from(svgMarkup.matchAll(hrefRegex));
  if (matches.length === 0) return svgMarkup;

  const uniqueUrls = Array.from(
    new Set(
      matches
        .map((m) => m[2])
        .filter((url) => url && !url.startsWith('data:'))
    )
  );

  if (uniqueUrls.length === 0) return svgMarkup;

  const resolvedMap = new Map<string, string>();
  await Promise.all(
    uniqueUrls.map(async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('READ_FAILED'));
          reader.readAsDataURL(blob);
        });
        if (dataUri) {
          resolvedMap.set(url, dataUri);
        }
      } catch {
        // Keep original URL if fetch fails
      }
    })
  );

  if (resolvedMap.size === 0) return svgMarkup;

  return svgMarkup.replace(hrefRegex, (full, prefix: string, url: string, suffix: string) => {
    const inlined = resolvedMap.get(url);
    return inlined ? `${prefix}${inlined}${suffix}` : full;
  });
}

/**
 * Exports the final composited Item Design (Template + Item's Real ISO-18004 QR)
 * as a self-contained downloadable SVG file.
 */
export async function downloadCompositedItemSvg(params: {
  design: TagDesignTemplate;
  codeSerial: string;
  mode?: CompositedOutputMode;
}): Promise<boolean> {
  const { design, codeSerial, mode = 'clean' } = params;
  const composed = composeItemTemplateDesignSvg({ design, codeSerial, mode });
  const selfContained = await inlineExternalSvgImages(composed.svgMarkup);
  const safeSlug = (design.slug || design.id).replace(/[^a-zA-Z0-9_-]/g, '-');
  const suffix = mode === 'print' ? 'print' : 'final';
  triggerSvgStringDownload(selfContained, `finditqr-${codeSerial}-${safeSlug}-${suffix}`);
  return true;
}

/**
 * Exports the final composited Item Design (Template + Item's Real ISO-18004 QR)
 * as a high-resolution 300 DPI PNG file suitable for printing.
 */
export async function downloadCompositedItemPng(params: {
  design: TagDesignTemplate;
  codeSerial: string;
  mode?: CompositedOutputMode;
}): Promise<boolean> {
  const { design, codeSerial, mode = 'clean' } = params;
  const composed = composeItemTemplateDesignSvg({ design, codeSerial, mode });
  const selfContained = await inlineExternalSvgImages(composed.svgMarkup);
  const safeSlug = (design.slug || design.id).replace(/[^a-zA-Z0-9_-]/g, '-');
  const suffix = mode === 'print' ? 'print-300dpi' : 'final-hd';
  // Ensure at least 1400px on the longest edge for crisp 300 DPI printing
  const maxDim = Math.max(composed.widthPx, composed.heightPx, 1);
  const scale = maxDim < 1400 ? 1400 / maxDim : 1;
  return triggerPrintReadyPngDownload(
    selfContained,
    `finditqr-${codeSerial}-${safeSlug}-${suffix}`,
    Math.round(composed.widthPx * scale),
    Math.round(composed.heightPx * scale)
  );
}

/**
 * Picks a safe default unlocked template ID for the current user (preferring
 * published Free templates for Free/Starter accounts so item creation never
 * defaults to a locked paid template).
 */
export function getDefaultUnlockedTemplateId(
  designs: TagDesignTemplate[],
  userPlan: UserPlanTier,
  purchasedTemplateIds: ReadonlySet<string>
): string {
  const published = designs.filter((d) => !d.status || d.status === 'published');
  const firstFree = published.find((d) => isTemplateFree(d));
  if (firstFree) return firstFree.id;

  const firstAccessible = published.find((d) =>
    canAccessTemplateByPlanOrPurchase({
      template: d,
      userPlan,
      purchasedTemplateIds,
    })
  );
  return firstAccessible?.id || published[0]?.id || designs[0]?.id || 'master-01-voyager-executive';
}
