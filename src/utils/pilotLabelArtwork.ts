import { PilotArtStyle, PrintMaterialFinish, TagDesignTemplate } from '../types/domain';
import { buildQrRecoveryUrl, generateQrMatrix } from './qrLogic';
import {
  buildBatch02DesignLayers,
  getBatch02DieCutPath,
  getBatch02DieCutPolygonMm,
  getBatch02SpecByArtStyle,
} from './batch02StickerProduction';
import {
  buildMasterCleanStickerSvg,
  buildMasterEditableSvg,
  buildMasterPrintReadySvg,
  getMasterSpecById,
} from './masterCollectionProduction';

export interface PilotLabelRenderOptions {
  calloutText?: string;
  customSubLabel?: string;
  serialCode?: string;
  primaryHex?: string;
  secondaryHex?: string;
  accentHex?: string;
  materialFinish?: PrintMaterialFinish;
  showPrintGuides?: boolean;
  scalePxPerMm?: number;
}

export interface Point2D {
  x: number;
  y: number;
}

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function resolvePilotArtStyle(design: Pick<TagDesignTemplate, 'id' | 'pilotArtStyle' | 'shapeSilhouette'>): PilotArtStyle {
  if (design.pilotArtStyle) return design.pilotArtStyle;
  if (design.shapeSilhouette === 'ticket_notch') return 'voyager_stamp';
  if (design.shapeSilhouette === 'cloud_crest') return 'kiddo_buddy';
  if (design.shapeSilhouette === 'collar_shield') return 'paw_guard';
  if (design.shapeSilhouette === 'tech_chamfer_plate') return 'progrid_iso';
  if (design.shapeSilhouette === 'organic_pebble') return 'pebble_pop';
  if (design.shapeSilhouette === 'metro_ticket') return 'metro_ticket';
  if (design.shapeSilhouette === 'jelly_cushion') return 'jelly_cube';
  if (design.shapeSilhouette === 'tech_hexagon') return 'hexa_pulse';
  if (design.shapeSilhouette === 'flora_scallop') return 'flora_loop';
  if (design.shapeSilhouette === 'mono_hexagon') return 'mono_mark';
  if (design.shapeSilhouette === 'orbit_crest') return 'pocket_orbit';
  if (design.shapeSilhouette === 'astro_emblem') return 'astro_buddy';
  if (design.shapeSilhouette === 'campus_cloud') return 'campus_bloom';
  if (design.shapeSilhouette === 'arcade_controller') return 'game_mode';
  if (design.shapeSilhouette === 'cat_silhouette') return 'purrfect_tag';
  if (design.shapeSilhouette === 'explorer_scallop') return 'retro_explorer';
  if (design.shapeSilhouette === 'neon_angular') return 'neon_velocity';
  if (design.shapeSilhouette === 'cloud_scallop') return 'cloudy_days';
  if (design.shapeSilhouette === 'street_graffiti') return 'urban_riot';
  if (design.shapeSilhouette === 'ocean_wave') return 'ocean_wonders';
  if (design.shapeSilhouette === 'pixel_arcade') return 'pixel_quest';
  if (design.shapeSilhouette === 'candy_scallop') return 'candy_clouds';
  if (design.shapeSilhouette === 'botanical_leaf') return 'botanical_journey';
  if (design.shapeSilhouette === 'royal_shield') return 'royal_signature';
  return 'atelier_crest';
}

export function getPilotTrimDimensionsMm(design: TagDesignTemplate): {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMarginMm: number;
} {
  return {
    widthMm: design.printSpecs?.trimWidthMm ?? 64,
    heightMm: design.printSpecs?.trimHeightMm ?? 42,
    bleedMm: design.printSpecs?.bleedMm ?? 3,
    safeMarginMm: design.printSpecs?.safeMarginMm ?? 3,
  };
}

/**
 * Generates exact closed SVG path data in millimeters inside local [0..w, 0..h] trim coordinates.
 * Also provides sampled polygon points so Three.js ExtrudeGeometry matches the SVG die-cut 1:1.
 */
export function getDieCutContourSvgPath(style: PilotArtStyle, w: number, h: number): string {
  if (style === 'atelier_crest') {
    const c = 5.2;
    return `M ${c} 0 L ${w - c} 0 L ${w} ${c} L ${w} ${h - c} L ${w - c} ${h} L ${c} ${h} L 0 ${h - c} L 0 ${c} Z`;
  }

  if (style === 'voyager_stamp') {
    const r = 3.5;
    const ny = h / 2;
    const nr = 3.6;
    return [
      `M ${r} 0`,
      `L ${w - r} 0`,
      `Q ${w} 0 ${w} ${r}`,
      `L ${w} ${ny - nr}`,
      `A ${nr} ${nr} 0 0 0 ${w} ${ny + nr}`,
      `L ${w} ${h - r}`,
      `Q ${w} ${h} ${w - r} ${h}`,
      `L ${r} ${h}`,
      `Q 0 ${h} 0 ${h - r}`,
      `L 0 ${ny + nr}`,
      `A ${nr} ${nr} 0 0 0 0 ${ny - nr}`,
      `L 0 ${r}`,
      `Q 0 0 ${r} 0 Z`,
    ].join(' ');
  }

  if (style === 'kiddo_buddy') {
    // Sculpted cloud crest with friendly top crown & wavy rounded badge corners
    const cx = w / 2;
    return [
      `M ${w * 0.22} ${h * 0.14}`,
      `Q ${cx} -${h * 0.03} ${w * 0.78} ${h * 0.14}`,
      `Q ${w * 0.99} ${h * 0.14} ${w * 0.96} ${h * 0.42}`,
      `Q ${w * 1.02} ${h * 0.72} ${w * 0.86} ${h * 0.88}`,
      `Q ${w * 0.74} ${h} ${cx} ${h * 0.98}`,
      `Q ${w * 0.26} ${h} ${w * 0.14} ${h * 0.88}`,
      `Q -${w * 0.02} ${h * 0.72} ${w * 0.04} ${h * 0.42}`,
      `Q ${w * 0.01} ${h * 0.14} ${w * 0.22} ${h * 0.14} Z`,
    ].join(' ');
  }

  if (style === 'paw_guard') {
    const cx = w / 2;
    return [
      `M ${cx} 0.5`,
      `Q ${w * 0.85} 0.5 ${w * 0.96} ${h * 0.14}`,
      `Q ${w} ${h * 0.48} ${w * 0.88} ${h * 0.76}`,
      `Q ${w * 0.72} ${h * 0.96} ${cx} ${h - 0.5}`,
      `Q ${w * 0.28} ${h * 0.96} ${w * 0.12} ${h * 0.76}`,
      `Q 0 ${h * 0.48} ${w * 0.04} ${h * 0.14}`,
      `Q ${w * 0.15} 0.5 ${cx} 0.5 Z`,
    ].join(' ');
  }

  if (style === 'pebble_pop') {
    const segs = getPebblePopSegments(w, h);
    const fmt = (pt: [number, number]) => `${pt[0].toFixed(3)} ${pt[1].toFixed(3)}`;
    return [
      `M ${fmt(segs[0].p0)}`,
      ...segs.map((s) => `C ${fmt(s.c1)}, ${fmt(s.c2)}, ${fmt(s.p1)}`),
      'Z',
    ].join(' ');
  }

  if (style === 'metro_ticket') {
    const c = 4.6;
    const topR = 5.2;
    const sr = 2.6;
    const ny = h * 0.285;
    const cx = w / 2;
    return [
      `M ${c} 0`,
      `L ${cx - topR} 0`,
      `A ${topR} ${topR} 0 0 0 ${cx + topR} 0`,
      `L ${w - c} 0`,
      `A ${c} ${c} 0 0 0 ${w} ${c}`,
      `L ${w} ${ny - sr}`,
      `A ${sr} ${sr} 0 0 0 ${w} ${ny + sr}`,
      `L ${w} ${h - c}`,
      `A ${c} ${c} 0 0 0 ${w - c} ${h}`,
      `L ${cx + topR} ${h}`,
      `A ${topR} ${topR} 0 0 0 ${cx - topR} ${h}`,
      `L ${c} ${h}`,
      `A ${c} ${c} 0 0 0 0 ${h - c}`,
      `L 0 ${ny + sr}`,
      `A ${sr} ${sr} 0 0 0 0 ${ny - sr}`,
      `L 0 ${c}`,
      `A ${c} ${c} 0 0 0 ${c} 0 Z`,
    ].join(' ');
  }

  if (style === 'jelly_cube') {
    const segs = getJellyCubeSegments(w, h);
    const fmt = (pt: [number, number]) => `${pt[0].toFixed(3)} ${pt[1].toFixed(3)}`;
    return [
      `M ${fmt(segs[0].p0)}`,
      ...segs.map((s) => `C ${fmt(s.c1)}, ${fmt(s.c2)}, ${fmt(s.p1)}`),
      'Z',
    ].join(' ');
  }

  if (style === 'hexa_pulse') {
    return buildRoundedPolygonPath(getHexaPulseVertices(w, h), 2.8);
  }

  if (style === 'flora_loop') {
    const segs = getFloraLoopSegments(w, h);
    const fmt = (pt: [number, number]) => `${pt[0].toFixed(3)} ${pt[1].toFixed(3)}`;
    return [
      `M ${fmt(segs[0].p0)}`,
      ...segs.map((s) => `C ${fmt(s.c1)}, ${fmt(s.c2)}, ${fmt(s.p1)}`),
      'Z',
    ].join(' ');
  }

  if (style === 'mono_mark') {
    return buildRoundedPolygonPath(getMonoMarkVertices(w, h), 3.4);
  }

  if (style === 'pocket_orbit') {
    const segs = getPocketOrbitSegments(w, h);
    const fmt = (pt: [number, number]) => `${pt[0].toFixed(3)} ${pt[1].toFixed(3)}`;
    return [
      `M ${fmt(segs[0].p0)}`,
      ...segs.map((s) => `C ${fmt(s.c1)}, ${fmt(s.c2)}, ${fmt(s.p1)}`),
      'Z',
    ].join(' ');
  }

  if (style === 'astro_buddy') {
    const segs = getAstroBuddySegments(w, h);
    const fmt = (pt: [number, number]) => `${pt[0].toFixed(3)} ${pt[1].toFixed(3)}`;
    return [
      `M ${fmt(segs[0].p0)}`,
      ...segs.map((s) => `C ${fmt(s.c1)}, ${fmt(s.c2)}, ${fmt(s.p1)}`),
      'Z',
    ].join(' ');
  }

  if (style === 'campus_bloom') {
    const segs = getCampusBloomSegments(w, h);
    const fmt = (pt: [number, number]) => `${pt[0].toFixed(3)} ${pt[1].toFixed(3)}`;
    return [
      `M ${fmt(segs[0].p0)}`,
      ...segs.map((s) => `C ${fmt(s.c1)}, ${fmt(s.c2)}, ${fmt(s.p1)}`),
      'Z',
    ].join(' ');
  }

  if (style === 'game_mode') {
    const segs = getGameModeSegments(w, h);
    const fmt = (pt: [number, number]) => `${pt[0].toFixed(3)} ${pt[1].toFixed(3)}`;
    return [
      `M ${fmt(segs[0].p0)}`,
      ...segs.map((s) => `C ${fmt(s.c1)}, ${fmt(s.c2)}, ${fmt(s.p1)}`),
      'Z',
    ].join(' ');
  }

  if (style === 'purrfect_tag') {
    const segs = getPurrfectTagSegments(w, h);
    const fmt = (pt: [number, number]) => `${pt[0].toFixed(3)} ${pt[1].toFixed(3)}`;
    return [
      `M ${fmt(segs[0].p0)}`,
      ...segs.map((s) => `C ${fmt(s.c1)}, ${fmt(s.c2)}, ${fmt(s.p1)}`),
      'Z',
    ].join(' ');
  }

  if (style === 'retro_explorer') {
    const segs = getRetroExplorerSegments(w, h);
    const fmt = (pt: [number, number]) => `${pt[0].toFixed(3)} ${pt[1].toFixed(3)}`;
    return [
      `M ${fmt(segs[0].p0)}`,
      ...segs.map((s) => `C ${fmt(s.c1)}, ${fmt(s.c2)}, ${fmt(s.p1)}`),
      'Z',
    ].join(' ');
  }

  const batch02Spec = getBatch02SpecByArtStyle(style);
  if (batch02Spec) {
    return getBatch02DieCutPath(batch02Spec.id, w, h);
  }

  // progrid_iso: Technical plate with sharp chamfer top-right and tight radius corners elsewhere
  const ch = 6.5;
  const cr = 2.2;
  return [
    `M ${cr} 0`,
    `L ${w - ch} 0`,
    `L ${w} ${ch}`,
    `L ${w} ${h - cr}`,
    `Q ${w} ${h} ${w - cr} ${h}`,
    `L ${cr} ${h}`,
    `Q 0 ${h} 0 ${h - cr}`,
    `L 0 ${cr}`,
    `Q 0 0 ${cr} 0 Z`,
  ].join(' ');
}

/**
 * Computes closed 2D outline polygon points in centered millimeter coordinates
 * (X right, Y up) so Three.js ExtrudeGeometry + UV projection align 1:1 with the trim artboard.
 */
export function getDieCutContourPolygonMm(style: PilotArtStyle, w: number, h: number): Point2D[] {
  const hw = w / 2;
  const hh = h / 2;
  const toCentered = (xMm: number, yMm: number): Point2D => ({
    x: xMm - hw,
    y: hh - yMm, // Flip SVG Y-down to Three.js Y-up
  });

  if (style === 'atelier_crest') {
    const c = 5.2;
    return [
      toCentered(c, 0),
      toCentered(w - c, 0),
      toCentered(w, c),
      toCentered(w, h - c),
      toCentered(w - c, h),
      toCentered(c, h),
      toCentered(0, h - c),
      toCentered(0, c),
    ];
  }

  if (style === 'progrid_iso') {
    const ch = 6.5;
    const pts: Point2D[] = [];
    const cr = 2.2;
    // top-left rounded
    for (let i = 0; i <= 5; i++) {
      const a = Math.PI + (Math.PI / 2) * (i / 5);
      pts.push(toCentered(cr + Math.cos(a) * cr, cr + Math.sin(a) * cr));
    }
    pts.push(toCentered(w - ch, 0));
    pts.push(toCentered(w, ch));
    // bottom-right rounded
    for (let i = 0; i <= 5; i++) {
      const a = (Math.PI / 2) * (i / 5);
      pts.push(toCentered(w - cr + Math.cos(a) * cr, h - cr + Math.sin(a) * cr));
    }
    // bottom-left rounded
    for (let i = 0; i <= 5; i++) {
      const a = Math.PI / 2 + (Math.PI / 2) * (i / 5);
      pts.push(toCentered(cr + Math.cos(a) * cr, h - cr + Math.sin(a) * cr));
    }
    return pts;
  }

  if (style === 'voyager_stamp') {
    const pts: Point2D[] = [];
    const r = 3.5;
    const ny = h / 2;
    const nr = 3.6;
    // top-left
    for (let i = 0; i <= 5; i++) {
      const a = Math.PI + (Math.PI / 2) * (i / 5);
      pts.push(toCentered(r + Math.cos(a) * r, r + Math.sin(a) * r));
    }
    // top-right
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + (Math.PI / 2) * (i / 5);
      pts.push(toCentered(w - r + Math.cos(a) * r, r + Math.sin(a) * r));
    }
    // right semicircle notch (inward)
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 - Math.PI * (i / 10);
      pts.push(toCentered(w + Math.cos(a) * nr, ny + Math.sin(a) * nr));
    }
    // bottom-right
    for (let i = 0; i <= 5; i++) {
      const a = (Math.PI / 2) * (i / 5);
      pts.push(toCentered(w - r + Math.cos(a) * r, h - r + Math.sin(a) * r));
    }
    // bottom-left
    for (let i = 0; i <= 5; i++) {
      const a = Math.PI / 2 + (Math.PI / 2) * (i / 5);
      pts.push(toCentered(r + Math.cos(a) * r, h - r + Math.sin(a) * r));
    }
    // left semicircle notch (inward)
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI / 2 - Math.PI * (i / 10);
      pts.push(toCentered(Math.cos(a) * nr, ny + Math.sin(a) * nr));
    }
    return pts;
  }

  // Smooth quadratic sampling helper for cloud_crest & paw_guard
  const sampleQuad = (p0: [number, number], c: [number, number], p1: [number, number], steps = 10) => {
    const out: Point2D[] = [];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const x = mt * mt * p0[0] + 2 * mt * t * c[0] + t * t * p1[0];
      const y = mt * mt * p0[1] + 2 * mt * t * c[1] + t * t * p1[1];
      out.push(toCentered(x, y));
    }
    return out;
  };

  if (style === 'kiddo_buddy') {
    const cx = w / 2;
    return [
      toCentered(w * 0.22, h * 0.14),
      ...sampleQuad([w * 0.22, h * 0.14], [cx, -h * 0.03], [w * 0.78, h * 0.14], 12),
      ...sampleQuad([w * 0.78, h * 0.14], [w * 0.99, h * 0.14], [w * 0.96, h * 0.42], 10),
      ...sampleQuad([w * 0.96, h * 0.42], [w * 1.02, h * 0.72], [w * 0.86, h * 0.88], 10),
      ...sampleQuad([w * 0.86, h * 0.88], [w * 0.74, h], [cx, h * 0.98], 10),
      ...sampleQuad([cx, h * 0.98], [w * 0.26, h], [w * 0.14, h * 0.88], 10),
      ...sampleQuad([w * 0.14, h * 0.88], [-w * 0.02, h * 0.72], [w * 0.04, h * 0.42], 10),
      ...sampleQuad([w * 0.04, h * 0.42], [w * 0.01, h * 0.14], [w * 0.22, h * 0.14], 10),
    ];
  }

  if (style === 'pebble_pop') {
    const sampleCubic = (
      p0: [number, number],
      c1: [number, number],
      c2: [number, number],
      p1: [number, number],
      steps = 14
    ) => {
      const out: Point2D[] = [];
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        const x =
          mt * mt * mt * p0[0] +
          3 * mt * mt * t * c1[0] +
          3 * mt * t * t * c2[0] +
          t * t * t * p1[0];
        const y =
          mt * mt * mt * p0[1] +
          3 * mt * mt * t * c1[1] +
          3 * mt * t * t * c2[1] +
          t * t * t * p1[1];
        out.push(toCentered(x, y));
      }
      return out;
    };

    const segs = getPebblePopSegments(w, h);
    return [
      toCentered(segs[0].p0[0], segs[0].p0[1]),
      ...segs.flatMap((s) => sampleCubic(s.p0, s.c1, s.c2, s.p1, 14)),
    ];
  }

  if (style === 'metro_ticket') {
    const pts: Point2D[] = [];
    const c = 4.6;
    const topR = 5.2;
    const sr = 2.6;
    const ny = h * 0.285;
    const cx = w / 2;
    const sampleArc = (ax: number, ay: number, r: number, a0: number, a1: number, steps = 8) => {
      for (let i = 0; i <= steps; i++) {
        const a = a0 + (a1 - a0) * (i / steps);
        pts.push(toCentered(ax + Math.cos(a) * r, ay + Math.sin(a) * r));
      }
    };
    pts.push(toCentered(c, 0));
    sampleArc(cx, 0, topR, Math.PI, 0, 10);
    sampleArc(w, 0, c, Math.PI, Math.PI / 2, 7);
    sampleArc(w, ny, sr, -Math.PI / 2, -Math.PI * 1.5, 9);
    sampleArc(w, h, c, -Math.PI / 2, -Math.PI, 7);
    sampleArc(cx, h, topR, 0, -Math.PI, 10);
    sampleArc(0, h, c, 0, -Math.PI / 2, 7);
    sampleArc(0, ny, sr, Math.PI / 2, -Math.PI / 2, 9);
    sampleArc(0, 0, c, Math.PI / 2, 0, 7);
    return pts;
  }

  if (
    style === 'jelly_cube' ||
    style === 'flora_loop' ||
    style === 'pocket_orbit' ||
    style === 'astro_buddy' ||
    style === 'campus_bloom' ||
    style === 'game_mode' ||
    style === 'purrfect_tag' ||
    style === 'retro_explorer'
  ) {
    const sampleCubic = (
      p0: [number, number],
      c1: [number, number],
      c2: [number, number],
      p1: [number, number],
      steps = 12
    ) => {
      const out: Point2D[] = [];
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        const x =
          mt * mt * mt * p0[0] +
          3 * mt * mt * t * c1[0] +
          3 * mt * t * t * c2[0] +
          t * t * t * p1[0];
        const y =
          mt * mt * mt * p0[1] +
          3 * mt * mt * t * c1[1] +
          3 * mt * t * t * c2[1] +
          t * t * t * p1[1];
        out.push(toCentered(x, y));
      }
      return out;
    };
    const segs =
      style === 'jelly_cube'
        ? getJellyCubeSegments(w, h)
        : style === 'flora_loop'
        ? getFloraLoopSegments(w, h)
        : style === 'pocket_orbit'
        ? getPocketOrbitSegments(w, h)
        : style === 'astro_buddy'
        ? getAstroBuddySegments(w, h)
        : style === 'campus_bloom'
        ? getCampusBloomSegments(w, h)
        : style === 'game_mode'
        ? getGameModeSegments(w, h)
        : style === 'purrfect_tag'
        ? getPurrfectTagSegments(w, h)
        : getRetroExplorerSegments(w, h);
    return [
      toCentered(segs[0].p0[0], segs[0].p0[1]),
      ...segs.flatMap((s) => sampleCubic(s.p0, s.c1, s.c2, s.p1, 12)),
    ];
  }

  if (style === 'hexa_pulse' || style === 'mono_mark') {
    const verts = style === 'mono_mark' ? getMonoMarkVertices(w, h) : getHexaPulseVertices(w, h);
    const pts: Point2D[] = [];
    const r = style === 'mono_mark' ? 3.4 : 2.8;
    const n = verts.length;
    for (let i = 0; i < n; i++) {
      const prev = verts[(i - 1 + n) % n];
      const curr = verts[i];
      const next = verts[(i + 1) % n];
      const dx1 = prev[0] - curr[0];
      const dy1 = prev[1] - curr[1];
      const dx2 = next[0] - curr[0];
      const dy2 = next[1] - curr[1];
      const len1 = Math.hypot(dx1, dy1) || 1;
      const len2 = Math.hypot(dx2, dy2) || 1;
      const pA: [number, number] = [curr[0] + (dx1 / len1) * r, curr[1] + (dy1 / len1) * r];
      const pB: [number, number] = [curr[0] + (dx2 / len2) * r, curr[1] + (dy2 / len2) * r];
      pts.push(toCentered(pA[0], pA[1]));
      const mid = sampleQuad(pA, curr, pB, 5);
      pts.push(...mid);
    }
    return pts;
  }

  const batch02Spec = getBatch02SpecByArtStyle(style);
  if (batch02Spec) {
    return getBatch02DieCutPolygonMm(batch02Spec.id, w, h);
  }

  // paw_guard shield contour
  const cx = w / 2;
  return [
    toCentered(cx, 0.5),
    ...sampleQuad([cx, 0.5], [w * 0.85, 0.5], [w * 0.96, h * 0.14], 10),
    ...sampleQuad([w * 0.96, h * 0.14], [w, h * 0.48], [w * 0.88, h * 0.76], 10),
    ...sampleQuad([w * 0.88, h * 0.76], [w * 0.72, h * 0.96], [cx, h - 0.5], 10),
    ...sampleQuad([cx, h - 0.5], [w * 0.28, h * 0.96], [w * 0.12, h * 0.76], 10),
    ...sampleQuad([w * 0.12, h * 0.76], [0, h * 0.48], [w * 0.04, h * 0.14], 10),
    ...sampleQuad([w * 0.04, h * 0.14], [w * 0.15, 0.5], [cx, 0.5], 10),
  ];
}

function renderQrModulesSvg(params: {
  payloadUrl: string;
  x: number;
  y: number;
  size: number;
  darkColor: string;
  finderColor: string;
  centerDotColor: string;
  bgColor?: string;
  cornerRadius?: number;
}): string {
  const {
    payloadUrl,
    x,
    y,
    size,
    darkColor,
    finderColor,
    centerDotColor,
    bgColor = '#FFFFFF',
    cornerRadius = 1.6,
  } = params;
  const matrix = generateQrMatrix(payloadUrl, undefined, 'M');
  const grid = matrix.length;
  const quiet = Math.max(1.5, size * 0.075);
  const inner = size - quiet * 2;
  const cell = inner / grid;
  const rects: string[] = [];

  rects.push(
    `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${size.toFixed(2)}" height="${size.toFixed(2)}" rx="${cornerRadius}" fill="${bgColor}" />`
  );

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      if (!matrix[r][c]) continue;
      const isFinder =
        (r < 7 && c < 7) || (r < 7 && c >= grid - 7) || (r >= grid - 7 && c < 7);
      const isCenter =
        (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
        (r >= 2 && r <= 4 && c >= grid - 5 && c <= grid - 3) ||
        (r >= grid - 5 && r <= grid - 3 && c >= 2 && c <= 4);

      const fill = isCenter ? centerDotColor : isFinder ? finderColor : darkColor;
      const rx = isFinder ? 0.14 : 0.08;
      rects.push(
        `<rect x="${(x + quiet + c * cell).toFixed(3)}" y="${(y + quiet + r * cell).toFixed(3)}" width="${(cell + 0.03).toFixed(3)}" height="${(cell + 0.03).toFixed(3)}" rx="${rx}" fill="${fill}" />`
      );
    }
  }
  return rects.join('');
}

/**
 * Subtle FindIt QR Signature Lockup derived from the brand's official rounded squircle pin silhouette.
 * Always positioned cleanly outside QR white quiet zones so camera decoding remains crisp.
 */
export function buildFindItSignatureSvg(params: {
  x: number;
  y: number;
  inkColor: string;
  opacity?: number;
  centered?: boolean;
  includeWordmark?: boolean;
}): string {
  const {
    x,
    y,
    inkColor,
    opacity = 0.82,
    centered = true,
    includeWordmark = true,
  } = params;
  const wordmarkOffset = centered ? -6.3 : 0;
  return `
    <g id="brand-signature" data-brand-signature="findit-qr" transform="translate(${(x + wordmarkOffset).toFixed(2)}, ${y.toFixed(2)})" opacity="${opacity}">
      <!-- Miniature FindIt QR Pin Seal (2.1mm height) -->
      <g transform="translate(0, -1.65)">
        <rect x="0" y="0" width="2.0" height="2.0" rx="0.45" fill="none" stroke="${inkColor}" stroke-width="0.24" />
        <path d="M 1.0 0.38 C 0.72 0.38 0.5 0.6 0.5 0.88 C 0.5 1.24 1.0 1.66 1.0 1.66 C 1.0 1.66 1.5 1.24 1.5 0.88 C 1.5 0.6 1.28 0.38 1.0 0.38 Z" fill="${inkColor}" />
        <circle cx="1.0" cy="0.88" r="0.22" fill="#FFFFFF" opacity="0.85" />
      </g>
      ${
        includeWordmark
          ? `<text x="2.65" y="-0.15" fill="${inkColor}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="1.28" font-weight="800" letter-spacing="0.26">FINDIT QR</text>`
          : ''
      }
    </g>`;
}

function getPebblePopSegments(w: number, h: number): Array<{
  p0: [number, number];
  c1: [number, number];
  c2: [number, number];
  p1: [number, number];
}> {
  return [
    {
      p0: [w * 0.700, h * 0.018],
      c1: [w * 0.565, h * 0.014],
      c2: [w * 0.505, h * 0.108],
      p1: [w * 0.360, h * 0.132],
    },
    {
      p0: [w * 0.360, h * 0.132],
      c1: [w * 0.220, h * 0.155],
      c2: [w * 0.105, h * 0.255],
      p1: [w * 0.045, h * 0.385],
    },
    {
      p0: [w * 0.045, h * 0.385],
      c1: [w * 0.005, h * 0.475],
      c2: [w * 0.002, h * 0.665],
      p1: [w * 0.115, h * 0.810],
    },
    {
      p0: [w * 0.115, h * 0.810],
      c1: [w * 0.235, h * 0.960],
      c2: [w * 0.435, h * 0.998],
      p1: [w * 0.620, h * 0.985],
    },
    {
      p0: [w * 0.620, h * 0.985],
      c1: [w * 0.855, h * 0.965],
      c2: [w * 0.992, h * 0.835],
      p1: [w * 0.978, h * 0.655],
    },
    {
      p0: [w * 0.978, h * 0.655],
      c1: [w * 0.968, h * 0.525],
      c2: [w * 0.888, h * 0.445],
      p1: [w * 0.888, h * 0.365],
    },
    {
      p0: [w * 0.888, h * 0.365],
      c1: [w * 0.888, h * 0.275],
      c2: [w * 0.855, h * 0.025],
      p1: [w * 0.700, h * 0.018],
    },
  ];
}

function getJellyCubeSegments(w: number, h: number): Array<{
  p0: [number, number];
  c1: [number, number];
  c2: [number, number];
  p1: [number, number];
}> {
  // Playful 4-lobe soft jelly cushion contour (70 x 70 mm, zero holes/cords)
  return [
    {
      p0: [w * 0.500, h * 0.055],
      c1: [w * 0.630, h * 0.055],
      c2: [w * 0.720, h * 0.012],
      p1: [w * 0.835, h * 0.042],
    },
    {
      p0: [w * 0.835, h * 0.042],
      c1: [w * 0.955, h * 0.075],
      c2: [w * 0.992, h * 0.215],
      p1: [w * 0.955, h * 0.365],
    },
    {
      p0: [w * 0.955, h * 0.365],
      c1: [w * 0.930, h * 0.465],
      c2: [w * 0.992, h * 0.605],
      p1: [w * 0.962, h * 0.745],
    },
    {
      p0: [w * 0.962, h * 0.745],
      c1: [w * 0.928, h * 0.905],
      c2: [w * 0.785, h * 0.978],
      p1: [w * 0.615, h * 0.958],
    },
    {
      p0: [w * 0.615, h * 0.958],
      c1: [w * 0.525, h * 0.945],
      c2: [w * 0.455, h * 0.948],
      p1: [w * 0.355, h * 0.965],
    },
    {
      p0: [w * 0.355, h * 0.965],
      c1: [w * 0.165, h * 0.992],
      c2: [w * 0.032, h * 0.895],
      p1: [w * 0.025, h * 0.705],
    },
    {
      p0: [w * 0.025, h * 0.705],
      c1: [w * 0.020, h * 0.585],
      c2: [w * 0.068, h * 0.465],
      p1: [w * 0.035, h * 0.335],
    },
    {
      p0: [w * 0.035, h * 0.335],
      c1: [w * 0.005, h * 0.195],
      c2: [w * 0.072, h * 0.045],
      p1: [w * 0.225, h * 0.022],
    },
    {
      p0: [w * 0.225, h * 0.022],
      c1: [w * 0.355, h * 0.005],
      c2: [w * 0.410, h * 0.055],
      p1: [w * 0.500, h * 0.055],
    },
  ];
}

function getHexaPulseVertices(w: number, h: number): Array<[number, number]> {
  return [
    [w * 0.5, 1.0],
    [w - 1.2, h * 0.255],
    [w - 1.2, h * 0.745],
    [w * 0.5, h - 1.0],
    [1.2, h * 0.745],
    [1.2, h * 0.255],
  ];
}

function buildRoundedPolygonPath(verts: Array<[number, number]>, r: number): string {
  const n = verts.length;
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const prev = verts[(i - 1 + n) % n];
    const curr = verts[i];
    const next = verts[(i + 1) % n];
    const dx1 = prev[0] - curr[0];
    const dy1 = prev[1] - curr[1];
    const dx2 = next[0] - curr[0];
    const dy2 = next[1] - curr[1];
    const len1 = Math.hypot(dx1, dy1) || 1;
    const len2 = Math.hypot(dx2, dy2) || 1;
    const pA: [number, number] = [curr[0] + (dx1 / len1) * r, curr[1] + (dy1 / len1) * r];
    const pB: [number, number] = [curr[0] + (dx2 / len2) * r, curr[1] + (dy2 / len2) * r];
    if (i === 0) parts.push(`M ${pA[0].toFixed(3)} ${pA[1].toFixed(3)}`);
    else parts.push(`L ${pA[0].toFixed(3)} ${pA[1].toFixed(3)}`);
    parts.push(`Q ${curr[0].toFixed(3)} ${curr[1].toFixed(3)} ${pB[0].toFixed(3)} ${pB[1].toFixed(3)}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

function getFloraLoopSegments(w: number, h: number): Array<{
  p0: [number, number];
  c1: [number, number];
  c2: [number, number];
  p1: [number, number];
}> {
  // Symmetrical 10-lobe scalloped botanical frame (72 x 78 mm, clean top crest without grommet/twine)
  return [
    {
      p0: [w * 0.500, h * 0.025],
      c1: [w * 0.635, h * 0.025],
      c2: [w * 0.725, h * 0.078],
      p1: [w * 0.745, h * 0.142],
    },
    {
      p0: [w * 0.745, h * 0.142],
      c1: [w * 0.855, h * 0.155],
      c2: [w * 0.945, h * 0.240],
      p1: [w * 0.905, h * 0.355],
    },
    {
      p0: [w * 0.905, h * 0.355],
      c1: [w * 0.992, h * 0.425],
      c2: [w * 0.995, h * 0.565],
      p1: [w * 0.922, h * 0.642],
    },
    {
      p0: [w * 0.922, h * 0.642],
      c1: [w * 0.968, h * 0.755],
      c2: [w * 0.892, h * 0.885],
      p1: [w * 0.745, h * 0.895],
    },
    {
      p0: [w * 0.745, h * 0.895],
      c1: [w * 0.675, h * 0.975],
      c2: [w * 0.585, h * 0.982],
      p1: [w * 0.500, h * 0.955],
    },
    {
      p0: [w * 0.500, h * 0.955],
      c1: [w * 0.415, h * 0.982],
      c2: [w * 0.325, h * 0.975],
      p1: [w * 0.255, h * 0.895],
    },
    {
      p0: [w * 0.255, h * 0.895],
      c1: [w * 0.108, h * 0.885],
      c2: [w * 0.032, h * 0.755],
      p1: [w * 0.078, h * 0.642],
    },
    {
      p0: [w * 0.078, h * 0.642],
      c1: [w * 0.005, h * 0.565],
      c2: [w * 0.008, h * 0.425],
      p1: [w * 0.095, h * 0.355],
    },
    {
      p0: [w * 0.095, h * 0.355],
      c1: [w * 0.055, h * 0.240],
      c2: [w * 0.145, h * 0.155],
      p1: [w * 0.255, h * 0.142],
    },
    {
      p0: [w * 0.255, h * 0.142],
      c1: [w * 0.275, h * 0.078],
      c2: [w * 0.365, h * 0.025],
      p1: [w * 0.500, h * 0.025],
    },
  ];
}

type CubicSegment = {
  p0: [number, number];
  c1: [number, number];
  c2: [number, number];
  p1: [number, number];
};

function getMonoMarkVertices(w: number, h: number): Array<[number, number]> {
  return [
    [w * 0.5, 1.2],
    [w - 1.4, h * 0.255],
    [w - 1.4, h * 0.745],
    [w * 0.5, h - 1.2],
    [1.4, h * 0.745],
    [1.4, h * 0.255],
  ];
}

function getPocketOrbitSegments(w: number, h: number): CubicSegment[] {
  // Contoured cosmic orbit crest tracing waving astronaut crown + right rocket orbit (clean no-hole edge)
  return [
    { p0: [w * 0.405, h * 0.024], c1: [w * 0.525, h * 0.022], c2: [w * 0.555, h * 0.105], p1: [w * 0.655, h * 0.165] },
    { p0: [w * 0.655, h * 0.165], c1: [w * 0.785, h * 0.235], c2: [w * 0.968, h * 0.285], p1: [w * 0.975, h * 0.415] },
    { p0: [w * 0.975, h * 0.415], c1: [w * 0.985, h * 0.545], c2: [w * 0.935, h * 0.745], p1: [w * 0.805, h * 0.875] },
    { p0: [w * 0.805, h * 0.875], c1: [w * 0.685, h * 0.978], c2: [w * 0.565, h * 0.985], p1: [w * 0.495, h * 0.982] },
    { p0: [w * 0.495, h * 0.982], c1: [w * 0.365, h * 0.982], c2: [w * 0.215, h * 0.945], p1: [w * 0.125, h * 0.835] },
    { p0: [w * 0.125, h * 0.835], c1: [w * 0.015, h * 0.705], c2: [w * 0.012, h * 0.555], p1: [w * 0.065, h * 0.425] },
    { p0: [w * 0.065, h * 0.425], c1: [w * 0.112, h * 0.315], c2: [w * 0.145, h * 0.225], p1: [w * 0.215, h * 0.135] },
    { p0: [w * 0.215, h * 0.135], c1: [w * 0.265, h * 0.042], c2: [w * 0.335, h * 0.025], p1: [w * 0.405, h * 0.024] },
  ];
}

function getAstroBuddySegments(w: number, h: number): CubicSegment[] {
  // Smooth clean top dome (strictly zero physical punch tab or hole) + Saturn right bump + moon & nebula base
  return [
    { p0: [w * 0.500, h * 0.042], c1: [w * 0.615, h * 0.042], c2: [w * 0.715, h * 0.055], p1: [w * 0.795, h * 0.095] },
    { p0: [w * 0.795, h * 0.095], c1: [w * 0.925, h * 0.155], c2: [w * 0.978, h * 0.295], p1: [w * 0.968, h * 0.455] },
    { p0: [w * 0.968, h * 0.455], c1: [w * 0.962, h * 0.605], c2: [w * 0.945, h * 0.765], p1: [w * 0.825, h * 0.895] },
    { p0: [w * 0.825, h * 0.895], c1: [w * 0.715, h * 0.985], c2: [w * 0.585, h * 0.988], p1: [w * 0.500, h * 0.985] },
    { p0: [w * 0.500, h * 0.985], c1: [w * 0.415, h * 0.988], c2: [w * 0.265, h * 0.985], p1: [w * 0.165, h * 0.895] },
    { p0: [w * 0.165, h * 0.895], c1: [w * 0.035, h * 0.775], c2: [w * 0.015, h * 0.595], p1: [w * 0.025, h * 0.445] },
    { p0: [w * 0.025, h * 0.445], c1: [w * 0.035, h * 0.275], c2: [w * 0.115, h * 0.125], p1: [w * 0.245, h * 0.075] },
    { p0: [w * 0.245, h * 0.075], c1: [w * 0.335, h * 0.045], c2: [w * 0.415, h * 0.042], p1: [w * 0.500, h * 0.042] },
  ];
}

function getCampusBloomSegments(w: number, h: number): CubicSegment[] {
  // Soft symmetrical 10-lobe scalloped lifestyle cloud silhouette (clean no-hole print cut)
  return getFloraLoopSegments(w, h);
}

function getGameModeSegments(w: number, h: number): CubicSegment[] {
  // Ergonomic arcade controller & domed headset silhouette (strictly clean top bridge, zero punch hole)
  return [
    { p0: [w * 0.500, h * 0.045], c1: [w * 0.675, h * 0.045], c2: [w * 0.825, h * 0.095], p1: [w * 0.905, h * 0.235] },
    { p0: [w * 0.905, h * 0.235], c1: [w * 0.975, h * 0.355], c2: [w * 0.988, h * 0.565], p1: [w * 0.952, h * 0.765] },
    { p0: [w * 0.952, h * 0.765], c1: [w * 0.918, h * 0.945], c2: [w * 0.805, h * 0.985], p1: [w * 0.705, h * 0.935] },
    { p0: [w * 0.705, h * 0.935], c1: [w * 0.615, h * 0.892], c2: [w * 0.565, h * 0.885], p1: [w * 0.500, h * 0.885] },
    { p0: [w * 0.500, h * 0.885], c1: [w * 0.435, h * 0.885], c2: [w * 0.385, h * 0.892], p1: [w * 0.295, h * 0.935] },
    { p0: [w * 0.295, h * 0.935], c1: [w * 0.195, h * 0.985], c2: [w * 0.082, h * 0.945], p1: [w * 0.048, h * 0.765] },
    { p0: [w * 0.048, h * 0.765], c1: [w * 0.012, h * 0.565], c2: [w * 0.025, h * 0.355], p1: [w * 0.095, h * 0.235] },
    { p0: [w * 0.095, h * 0.235], c1: [w * 0.175, h * 0.095], c2: [w * 0.325, h * 0.045], p1: [w * 0.500, h * 0.045] },
  ];
}

function getPurrfectTagSegments(w: number, h: number): CubicSegment[] {
  // Playful cat-head contour with symmetrical soft ears and smooth center forehead (strictly zero top punch hole)
  return [
    { p0: [w * 0.500, h * 0.155], c1: [w * 0.585, h * 0.155], c2: [w * 0.635, h * 0.085], p1: [w * 0.735, h * 0.028] },
    { p0: [w * 0.735, h * 0.028], c1: [w * 0.825, h * 0.008], c2: [w * 0.915, h * 0.135], p1: [w * 0.905, h * 0.295] },
    { p0: [w * 0.905, h * 0.295], c1: [w * 0.988, h * 0.445], c2: [w * 0.988, h * 0.685], p1: [w * 0.875, h * 0.845] },
    { p0: [w * 0.875, h * 0.845], c1: [w * 0.765, h * 0.975], c2: [w * 0.615, h * 0.985], p1: [w * 0.500, h * 0.982] },
    { p0: [w * 0.500, h * 0.982], c1: [w * 0.385, h * 0.985], c2: [w * 0.235, h * 0.975], p1: [w * 0.125, h * 0.845] },
    { p0: [w * 0.125, h * 0.845], c1: [w * 0.012, h * 0.685], c2: [w * 0.012, h * 0.445], p1: [w * 0.095, h * 0.295] },
    { p0: [w * 0.095, h * 0.295], c1: [w * 0.085, h * 0.135], c2: [w * 0.175, h * 0.008], p1: [w * 0.265, h * 0.028] },
    { p0: [w * 0.265, h * 0.028], c1: [w * 0.365, h * 0.085], c2: [w * 0.415, h * 0.155], p1: [w * 0.500, h * 0.155] },
  ];
}

function getRetroExplorerSegments(w: number, h: number): CubicSegment[] {
  // 12-lobe symmetrical vintage explorer stamp silhouette (clean no-hole print edge)
  const segs: CubicSegment[] = [];
  const cx = w / 2;
  const cy = h / 2;
  const rx = w * 0.465;
  const ry = h * 0.465;
  const lobes = 12;
  for (let i = 0; i < lobes; i++) {
    const a0 = -Math.PI / 2 + (Math.PI * 2 * i) / lobes;
    const a1 = -Math.PI / 2 + (Math.PI * 2 * (i + 1)) / lobes;
    const am = (a0 + a1) / 2;
    const p0: [number, number] = [cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry];
    const p1: [number, number] = [cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry];
    const bulgeR = 1.11;
    const c1: [number, number] = [
      cx + Math.cos(a0 + (am - a0) * 0.62) * rx * bulgeR,
      cy + Math.sin(a0 + (am - a0) * 0.62) * ry * bulgeR,
    ];
    const c2: [number, number] = [
      cx + Math.cos(a1 - (a1 - am) * 0.62) * rx * bulgeR,
      cy + Math.sin(a1 - (a1 - am) * 0.62) * ry * bulgeR,
    ];
    segs.push({ p0, c1, c2, p1 });
  }
  return segs;
}

function splitCenteredTwoLines(text: string, preferredMaxSingleLine = 16): [string, string] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return ['', ''];
  if (clean.length <= preferredMaxSingleLine) return [clean, ''];
  const words = clean.split(' ');
  if (words.length < 2) return [clean, ''];

  let bestLeft = clean;
  let bestRight = '';
  let bestScore = Number.POSITIVE_INFINITY;

  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(' ');
    const right = words.slice(i).join(' ');
    const score = Math.abs(left.length - right.length) + (left.length < right.length ? 4 : 0);
    if (score < bestScore) {
      bestScore = score;
      bestLeft = left;
      bestRight = right;
    }
  }

  return [bestLeft, bestRight];
}

function buildCoreIllustrationLayers(
  design: TagDesignTemplate,
  options: PilotLabelRenderOptions = {}
): {
  w: number;
  h: number;
  bleedMm: number;
  safeMarginMm: number;
  style: PilotArtStyle;
  serial: string;
  cutPath: string;
  backgroundLayer: string;
  artworkLayer: string;
  decorativeLayer?: string;
  accentLayer?: string;
  brandLogoLayer?: string;
  qrContainerLayer?: string;
  borderLayer?: string;
  typographyLayer: string;
  qrLayer: string;
} {
  const style = resolvePilotArtStyle(design);
  const { widthMm: w, heightMm: h, bleedMm, safeMarginMm } = getPilotTrimDimensionsMm(design);
  const primary = options.primaryHex || design.primaryHex;
  const secondary = options.secondaryHex || design.secondaryHex;
  const accent = options.accentHex || design.badgeColorHex;
  const callout = escapeXml((options.calloutText || design.defaultCalloutText || 'SCAN TO RETURN').trim().slice(0, 36));
  const serial = escapeXml((options.serialCode || `FQR-${design.slug.slice(0, 5).toUpperCase()}-01`).trim());
  const subLabel = escapeXml((options.customSubLabel || 'FINDIT QR · RECOVERY TAG').trim());
  const qrPayload = buildQrRecoveryUrl(options.serialCode || design.slug);
  const cutPath = getDieCutContourSvgPath(style, w, h);
  const isTransparentStock = options.materialFinish === 'transparent_vinyl';

  // Full bleed canvas extents (-bleed .. w+bleed)
  const bx = -bleedMm;
  const by = -bleedMm;
  const bw = w + bleedMm * 2;
  const bh = h + bleedMm * 2;

  const batch02Spec = getBatch02SpecByArtStyle(style);
  if (batch02Spec) {
    const layers = buildBatch02DesignLayers(batch02Spec);
    const borderLayer = `<path d="${cutPath}" fill="none" stroke="#FFFFFF" stroke-width="3.0" stroke-linejoin="round" />`;
    return {
      w,
      h,
      bleedMm,
      safeMarginMm,
      style,
      serial,
      cutPath,
      backgroundLayer: `${layers.defsExtra ? `<defs>${layers.defsExtra}</defs>` : ''}${layers.backgroundLayer}`,
      artworkLayer: '',
      decorativeLayer: layers.decorativeLayer,
      accentLayer: '',
      brandLogoLayer: layers.brandLogoLayer,
      qrContainerLayer: layers.qrContainerLayer,
      borderLayer,
      typographyLayer: layers.typographyLayer,
      qrLayer: '',
    };
  }

  if (style === 'atelier_crest') {
    const bgFill = isTransparentStock ? 'rgba(20,25,35,0.12)' : primary;
    const backgroundLayer = `
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${bgFill}" />
      ${isTransparentStock ? '' : `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#atelier-grad)" opacity="0.92" />`}
    `;
    const artworkLayer = `
      <rect x="2.8" y="2.8" width="${w - 5.6}" height="${h - 5.6}" rx="2.4" fill="none" stroke="${accent}" stroke-width="0.34" opacity="0.88" />
      <rect x="3.9" y="3.9" width="${w - 7.8}" height="${h - 7.8}" rx="1.8" fill="none" stroke="${accent}" stroke-width="0.16" opacity="0.48" />
      <!-- Precision Corner Rosette Ticks -->
      <path d="M 6.5 2.8 L 6.5 5.2 M 2.8 6.5 L 5.2 6.5 M ${w - 6.5} 2.8 L ${w - 6.5} 5.2 M ${w - 2.8} 6.5 L ${w - 5.2} 6.5" stroke="${accent}" stroke-width="0.3" />
      <path d="M 6.5 ${h - 2.8} L 6.5 ${h - 5.2} M 2.8 ${h - 6.5} L 5.2 ${h - 6.5} M ${w - 6.5} ${h - 2.8} L ${w - 6.5} ${h - 5.2} M ${w - 2.8} ${h - 6.5} L ${w - 5.2} ${h - 6.5}" stroke="${accent}" stroke-width="0.3" />
      <!-- Monogram Compass Emblem on Left -->
      <g transform="translate(13.5, 13.5)">
        <circle cx="0" cy="0" r="6.2" fill="none" stroke="${accent}" stroke-width="0.38" />
        <circle cx="0" cy="0" r="4.9" fill="none" stroke="${accent}" stroke-width="0.16" stroke-dasharray="0.9 0.7" />
        <path d="M 0 -4.1 L 1.1 -1.1 L 4.1 0 L 1.1 1.1 L 0 4.1 L -1.1 1.1 L -4.1 0 L -1.1 -1.1 Z" fill="${accent}" />
        <circle cx="0" cy="0" r="1.25" fill="${primary}" />
      </g>
      <line x1="6.4" y1="22.8" x2="31.5" y2="22.8" stroke="${accent}" stroke-width="0.24" opacity="0.7" />
      <!-- Right Warm Alabaster QR Stage (elevated slightly to leave engraved footer signature room) -->
      <rect x="35.2" y="5.0" width="23.4" height="29.0" rx="2.4" fill="#F7F3EB" stroke="${accent}" stroke-width="0.4" />
    `;
    const brandMark = buildFindItSignatureSvg({
      x: 46.9,
      y: 36.85,
      inkColor: accent,
      opacity: 0.85,
      centered: true,
    });
    const typographyLayer = `
      <text x="6.4" y="27.2" fill="${accent}" font-family="Georgia, 'Times New Roman', serif" font-size="2.65" font-weight="700" letter-spacing="0.28">ATELIER CREST</text>
      <text x="6.4" y="31.1" fill="#E8E4DA" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="1.9" font-weight="600" letter-spacing="0.22">${callout}</text>
      <text x="6.4" y="35.8" fill="#9CA3AF" font-family="monospace" font-size="1.8" font-weight="700" letter-spacing="0.18">${serial}</text>
      <text x="46.9" y="32.2" text-anchor="middle" fill="#151A24" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="1.65" font-weight="800" letter-spacing="0.26">SCAN TO RETURN</text>
      ${brandMark}
    `;
    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: 37.5,
      y: 6.7,
      size: 18.8,
      darkColor: '#151A24',
      finderColor: '#151A24',
      centerDotColor: accent,
      bgColor: '#FFFFFF',
      cornerRadius: 1.4,
    });
    return { w, h, bleedMm, safeMarginMm, style, serial, cutPath, backgroundLayer, artworkLayer, typographyLayer, qrLayer };
  }

  if (style === 'voyager_stamp') {
    const cream = isTransparentStock ? 'rgba(250,247,240,0.86)' : '#FAF7F0';
    const stripes: string[] = [];
    for (let sx = -4; sx < w + 8; sx += 7.5) {
      stripes.push(
        `<polygon points="${sx},-3 ${sx + 3.8},-3 ${sx + 1.5},4.2 ${sx - 2.3},4.2" fill="${primary}" />`
      );
      stripes.push(
        `<polygon points="${sx + 3.8},-3 ${sx + 7.5},-3 ${sx + 5.2},4.2 ${sx + 1.5},4.2" fill="${accent}" />`
      );
      stripes.push(
        `<polygon points="${sx},${h - 4.2} ${sx + 3.8},${h - 4.2} ${sx + 1.5},${h + 3} ${sx - 2.3},${h + 3}" fill="${accent}" />`
      );
      stripes.push(
        `<polygon points="${sx + 3.8},${h - 4.2} ${sx + 7.5},${h - 4.2} ${sx + 5.2},${h + 3} ${sx + 1.5},${h + 3}" fill="${primary}" />`
      );
    }

    const backgroundLayer = `
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${cream}" />
      <g opacity="0.92">${stripes.join('')}</g>
    `;
    const artworkLayer = `
      <!-- Subtle Latitude & Compass Watermark on Left Body -->
      <g transform="translate(27, 29)" opacity="0.16" stroke="${primary}" fill="none">
        <circle cx="0" cy="0" r="14.5" stroke-width="0.35" />
        <circle cx="0" cy="0" r="10.2" stroke-width="0.25" stroke-dasharray="1.2 1" />
        <line x1="-17" y1="0" x2="17" y2="0" stroke-width="0.25" />
        <line x1="0" y1="-17" x2="0" y2="17" stroke-width="0.25" />
        <path d="M 0 -13 L 2.2 -2.2 L 13 0 L 2.2 2.2 L 0 13 L -2.2 2.2 L -13 0 L -2.2 -2.2 Z" fill="${primary}" opacity="0.5" />
      </g>
      <!-- Cobalt Header Ribbon -->
      <rect x="4.8" y="6.8" width="44.5" height="9.2" rx="1.6" fill="${primary}" />
      <!-- Dashed Boarding Stub Tear Divider -->
      <line x1="52.6" y1="5.8" x2="52.6" y2="${h - 5.8}" stroke="${primary}" stroke-width="0.35" stroke-dasharray="1.3 1.1" opacity="0.65" />
      <!-- Red Airmail Stamp Accent Circle -->
      <g transform="translate(43.5, 38.5) rotate(-14)" opacity="0.82">
        <circle cx="0" cy="0" r="6.8" fill="none" stroke="${accent}" stroke-width="0.45" />
        <circle cx="0" cy="0" r="5.3" fill="none" stroke="${accent}" stroke-width="0.22" stroke-dasharray="0.8 0.5" />
        <text x="0" y="-0.6" text-anchor="middle" fill="${accent}" font-family="'Plus Jakarta Sans', sans-serif" font-size="1.65" font-weight="800">PRIORITY</text>
        <text x="0" y="1.7" text-anchor="middle" fill="${accent}" font-family="'Plus Jakarta Sans', sans-serif" font-size="1.45" font-weight="700">RETURN</text>
      </g>
      <!-- Right QR Passport Box -->
      <rect x="55.6" y="7.5" width="29.4" height="38.5" rx="2.2" fill="#FFFFFF" stroke="${primary}" stroke-width="0.45" />
    `;
    const brandMark = buildFindItSignatureSvg({
      x: 70.3,
      y: 49.6,
      inkColor: primary,
      opacity: 0.78,
      centered: true,
    });
    const typographyLayer = `
      <text x="7.4" y="12.6" fill="#FFFFFF" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="3.45" font-weight="800" letter-spacing="0.45">VOYAGER DISPATCH</text>
      <text x="5.4" y="21.4" fill="${accent}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="2.35" font-weight="800" letter-spacing="0.25">${callout}</text>
      <text x="5.4" y="25.6" fill="#1E293B" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="2.1" font-weight="600">${subLabel}</text>
      <text x="5.4" y="34.2" fill="#475569" font-family="monospace" font-size="2.05" font-weight="700">SERIAL // ${serial}</text>
      <text x="5.4" y="38.2" fill="#64748B" font-family="monospace" font-size="1.65">ROUTE · INTL RECOVERY PASS</text>
      <text x="70.3" y="43.5" text-anchor="middle" fill="${primary}" font-family="monospace" font-size="1.75" font-weight="800" letter-spacing="0.2">SCAN BAGGAGE ID</text>
      ${brandMark}
    `;
    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: 57.5,
      y: 9.2,
      size: 25.6,
      darkColor: '#0F172A',
      finderColor: primary,
      centerDotColor: accent,
      bgColor: '#FFFFFF',
      cornerRadius: 1.4,
    });
    return { w, h, bleedMm, safeMarginMm, style, serial, cutPath, backgroundLayer, artworkLayer, typographyLayer, qrLayer };
  }

  if (style === 'kiddo_buddy') {
    const sky = isTransparentStock ? 'rgba(14,165,233,0.16)' : primary;
    const backgroundLayer = `
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${sky}" />
      <!-- Friendly Sunbeams Radiating Behind Mascot -->
      <g transform="translate(${w / 2}, 15.5)" opacity="0.22">
        <path d="M 0 -22 L 4 -8 L -4 -8 Z M 16 -16 L 8 -4 L 2 -8 Z M -16 -16 L -2 -8 L -8 -4 Z M 22 0 L 8 4 L 8 -4 Z M -22 0 L -8 -4 L -8 4 Z" fill="#FFFFFF" />
      </g>
    `;
    const artworkLayer = `
      <!-- Soft Cloud Base Belly -->
      <path d="M -3 34 Q 10 26 24 32 Q 38 25 63 34 L 63 63 L -3 63 Z" fill="#FFFFFF" opacity="0.96" />
      <!-- Dotted Rainbow Dashed Rim -->
      <rect x="4.5" y="13.5" width="${w - 9}" height="${h - 17.5}" rx="12" fill="none" stroke="#FFFFFF" stroke-width="0.45" stroke-dasharray="1.4 1.1" opacity="0.7" />
      <!-- Cute Smiling Sun Mascot -->
      <g transform="translate(30, 10.5)">
        <circle cx="0" cy="0" r="6.6" fill="${secondary}" stroke="#FFFFFF" stroke-width="0.7" />
        <circle cx="-2.1" cy="-0.8" r="0.65" fill="#1E293B" />
        <circle cx="2.1" cy="-0.8" r="0.65" fill="#1E293B" />
        <circle cx="-3.4" cy="0.8" r="0.85" fill="${accent}" opacity="0.55" />
        <circle cx="3.4" cy="0.8" r="0.85" fill="${accent}" opacity="0.55" />
        <path d="M -1.9 1.3 Q 0 3.1 1.9 1.3" fill="none" stroke="#1E293B" stroke-width="0.55" stroke-linecap="round" />
      </g>
      <!-- Four-point Vector Stars -->
      <path d="M 11 16 L 12 18.2 L 14.2 19.2 L 12 20.2 L 11 22.4 L 10 20.2 L 7.8 19.2 L 10 18.2 Z" fill="${secondary}" />
      <path d="M 49 15 L 49.8 16.9 L 51.7 17.7 L 49.8 18.5 L 49 20.4 L 48.2 18.5 L 46.3 17.7 L 48.2 16.9 Z" fill="${secondary}" />
      <!-- Crisp Protected QR White Frame -->
      <rect x="16.5" y="18.8" width="27" height="27" rx="3.2" fill="#FFFFFF" stroke="${primary}" stroke-width="0.65" />
      <!-- Warm Coral Bottom Callout Ribbon -->
      <rect x="9.5" y="48.2" width="41" height="7.4" rx="3.7" fill="${accent}" />
    `;
    const brandMark = buildFindItSignatureSvg({
      x: 30,
      y: 47.4,
      inkColor: primary,
      opacity: 0.72,
      centered: true,
    });
    const typographyLayer = `
      <text x="30" y="53.0" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Cairo', sans-serif" font-size="2.65" font-weight="800" letter-spacing="0.22">${callout}</text>
      <text x="30" y="58.0" text-anchor="middle" fill="${primary}" font-family="monospace" font-size="1.65" font-weight="800">${serial}</text>
      ${brandMark}
    `;
    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: 18.1,
      y: 20.4,
      size: 23.8,
      darkColor: '#0F172A',
      finderColor: primary,
      centerDotColor: accent,
      bgColor: '#FFFFFF',
      cornerRadius: 1.8,
    });
    return { w, h, bleedMm, safeMarginMm, style, serial, cutPath, backgroundLayer, artworkLayer, typographyLayer, qrLayer };
  }

  if (style === 'paw_guard') {
    const shell = isTransparentStock ? 'rgba(15,82,67,0.18)' : primary;
    const sand = secondary || '#F3E7D3';
    const backgroundLayer = `
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${shell}" />
    `;
    const artworkLayer = `
      <!-- Inner Stitched Biscuit Sand Shield -->
      <path d="M 27 4.2 Q 44.5 4.2 49.4 10.6 Q 51.2 28.5 45.4 43.2 Q 37.8 53.2 27 54.4 Q 16.2 53.2 8.6 43.2 Q 2.8 28.5 4.6 10.6 Q 9.5 4.2 27 4.2 Z" fill="${sand}" />
      <path d="M 27 5.6 Q 43.2 5.6 47.9 11.4 Q 49.5 28.4 44.1 42.1 Q 37.2 51.6 27 52.8 Q 16.8 51.6 9.9 42.1 Q 4.5 28.4 6.1 11.4 Q 10.8 5.6 27 5.6 Z" fill="none" stroke="${accent}" stroke-width="0.4" stroke-dasharray="1.3 0.9" />
      <!-- Vector Paw Emblem at Crest Top -->
      <g transform="translate(27, 12.2)" fill="${primary}">
        <ellipse cx="0" cy="1.8" rx="3.1" ry="2.3" />
        <ellipse cx="-3.4" cy="-1.2" rx="1.15" ry="1.45" transform="rotate(-18 -3.4 -1.2)" />
        <ellipse cx="-1.2" cy="-2.7" rx="1.1" ry="1.5" transform="rotate(-6 -1.2 -2.7)" />
        <ellipse cx="1.2" cy="-2.7" rx="1.1" ry="1.5" transform="rotate(6 1.2 -2.7)" />
        <ellipse cx="3.4" cy="-1.2" rx="1.15" ry="1.45" transform="rotate(18 3.4 -1.2)" />
      </g>
      <!-- Terracotta Alert Banner -->
      <rect x="8.5" y="17.2" width="37" height="5.2" rx="1.8" fill="${accent}" />
      <!-- Crisp White Protected QR Scan Pad -->
      <rect x="14.2" y="24.0" width="25.6" height="25.6" rx="2.6" fill="#FFFFFF" stroke="${primary}" stroke-width="0.55" />
    `;
    const brandMark = buildFindItSignatureSvg({
      x: 27,
      y: 53.9,
      inkColor: '#FFFFFF',
      opacity: 0.78,
      centered: true,
    });
    const typographyLayer = `
      <text x="27" y="20.6" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="2.1" font-weight="800" letter-spacing="0.16">${callout}</text>
      <text x="27" y="51.4" text-anchor="middle" fill="${primary}" font-family="monospace" font-size="1.65" font-weight="800">${serial}</text>
      ${brandMark}
    `;
    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: 15.8,
      y: 25.6,
      size: 22.4,
      darkColor: '#0F172A',
      finderColor: primary,
      centerDotColor: accent,
      bgColor: '#FFFFFF',
      cornerRadius: 1.5,
    });
    return { w, h, bleedMm, safeMarginMm, style, serial, cutPath, backgroundLayer, artworkLayer, typographyLayer, qrLayer };
  }

  if (style === 'pebble_pop') {
    const teal = primary || '#009BA8';
    const cream = secondary || '#FFF3DF';
    const orange = accent || '#FF7A00';
    const inkNavy = '#0E1C2F';
    const sunYellow = '#FFC800';

    const rawEnglish = (options.calloutText ?? 'Scan to Contact the Owner').trim();
    const rawArabic = (options.customSubLabel ?? 'امسح الرمز للتواصل مع المالك').trim();
    const [enLine1, enLine2] = splitCenteredTwoLines(rawEnglish, 16);
    const [arLine1, arLine2] = splitCenteredTwoLines(rawArabic, 16);

    const enFontSize = rawEnglish.length > 28 ? 2.15 : 2.55;
    const arFontSize = rawArabic.length > 32 ? 2.25 : 2.65;

    const backgroundLayer = `
      <!-- Warm Cream Organic Pebble Base (Bleed-Safe) -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${isTransparentStock ? 'rgba(255,243,223,0.92)' : cream}" />
    `;

    const decorativeLayer = `
      <!-- Top Teal Canopy Wave (leaving thin delicate cream upper-left rim as in approved reference) -->
      <path d="M ${(w * 0.048).toFixed(3)} ${(h * 0.392).toFixed(3)}
               C ${(w * 0.032).toFixed(3)} ${(h * 0.295).toFixed(3)}, ${(w * 0.185).toFixed(3)} ${(h * 0.185).toFixed(3)}, ${(w * 0.395).toFixed(3)} ${(h * 0.160).toFixed(3)}
               C ${(w * 0.535).toFixed(3)} ${(h * 0.145).toFixed(3)}, ${(w * 0.580).toFixed(3)} ${(h * 0.028).toFixed(3)}, ${(w * 0.705).toFixed(3)} ${(h * 0.022).toFixed(3)}
               L ${(w + bleedMm).toFixed(3)} ${by}
               L ${(w + bleedMm).toFixed(3)} ${(h * 0.605).toFixed(3)}
               L ${(w * 0.962).toFixed(3)} ${(h * 0.578).toFixed(3)}
               C ${(w * 0.915).toFixed(3)} ${(h * 0.520).toFixed(3)}, ${(w * 0.822).toFixed(3)} ${(h * 0.415).toFixed(3)}, ${(w * 0.768).toFixed(3)} ${(h * 0.278).toFixed(3)}
               C ${(w * 0.720).toFixed(3)} ${(h * 0.195).toFixed(3)}, ${(w * 0.555).toFixed(3)} ${(h * 0.195).toFixed(3)}, ${(w * 0.425).toFixed(3)} ${(h * 0.196).toFixed(3)}
               C ${(w * 0.270).toFixed(3)} ${(h * 0.198).toFixed(3)}, ${(w * 0.165).toFixed(3)} ${(h * 0.285).toFixed(3)}, ${(w * 0.048).toFixed(3)} ${(h * 0.392).toFixed(3)} Z"
            fill="${teal}" />

      <!-- Bottom-Left Teal Organic Wave -->
      <path d="M ${bx} ${(h * 0.635).toFixed(3)}
               L ${(w * 0.052).toFixed(3)} ${(h * 0.648).toFixed(3)}
               C ${(w * 0.155).toFixed(3)} ${(h * 0.715).toFixed(3)}, ${(w * 0.268).toFixed(3)} ${(h * 0.765).toFixed(3)}, ${(w * 0.318).toFixed(3)} ${(h * 0.868).toFixed(3)}
               C ${(w * 0.350).toFixed(3)} ${(h * 0.935).toFixed(3)}, ${(w * 0.388).toFixed(3)} ${(h * 0.975).toFixed(3)}, ${(w * 0.422).toFixed(3)} ${(h + bleedMm).toFixed(3)}
               L ${bx} ${(h + bleedMm).toFixed(3)} Z"
            fill="${teal}" />
    `;

    // Sun center & 7 pill-shaped radial rays cleanly inside top-right teal canopy
    const sunX = w * 0.728;
    const sunY = h * 0.155;
    const sunR = w * 0.043;
    const rayConfigs = [
      { angle: -80, dist: 4.55, len: 2.8, thick: 1.25 },
      { angle: -34, dist: 4.45, len: 2.75, thick: 1.25 },
      { angle: 12, dist: 4.5, len: 2.8, thick: 1.25 },
      { angle: 62, dist: 4.45, len: 2.75, thick: 1.25 },
      { angle: 142, dist: 3.35, len: 1.75, thick: 1.25 }, // Short ray tucked inside teal arch
      { angle: -165, dist: 4.5, len: 2.8, thick: 1.25 },
      { angle: -122, dist: 4.55, len: 2.85, thick: 1.25 },
    ];
    const sunRaysSvg = rayConfigs
      .map(
        (r) =>
          `<rect x="${(r.dist - r.len / 2).toFixed(2)}" y="${(-r.thick / 2).toFixed(2)}" width="${r.len}" height="${r.thick}" rx="${(r.thick / 2).toFixed(2)}" fill="${sunYellow}" transform="translate(${sunX.toFixed(2)}, ${sunY.toFixed(2)}) rotate(${r.angle})" />`
      )
      .join('');

    // Left confetti orange pill sprinkles (staggered 2-3-3 diagonal cluster)
    const leftConfetti = [
      [w * 0.174, h * 0.526, -21, 1.35, 3.3],
      [w * 0.232, h * 0.506, -21, 1.35, 3.3],
      [w * 0.148, h * 0.602, -23, 1.35, 3.25],
      [w * 0.205, h * 0.583, -22, 1.35, 3.25],
      [w * 0.260, h * 0.565, -21, 1.35, 3.25],
      [w * 0.160, h * 0.668, -23, 1.35, 2.75],
      [w * 0.205, h * 0.653, -22, 1.35, 2.75],
      [w * 0.252, h * 0.635, -22, 1.35, 2.75],
    ];
    const leftConfettiSvg = leftConfetti
      .map(
        ([cx, cy, ang, pw, ph]) =>
          `<rect x="${(-pw / 2).toFixed(2)}" y="${(-ph / 2).toFixed(2)}" width="${pw}" height="${ph}" rx="${(pw / 2).toFixed(2)}" fill="${orange}" transform="translate(${cx.toFixed(2)}, ${cy.toFixed(2)}) rotate(${ang})" />`
      )
      .join('');

    // Right orange dynamic dashes (3 angled pills)
    const rightDashes = [
      [w * 0.794, h * 0.556, 42, 1.4, 4.3],
      [w * 0.768, h * 0.630, 36, 1.4, 6.2],
      [w * 0.818, h * 0.642, 44, 1.35, 3.8],
    ];
    const rightDashesSvg = rightDashes
      .map(
        ([cx, cy, ang, pw, ph]) =>
          `<rect x="${(-pw / 2).toFixed(2)}" y="${(-ph / 2).toFixed(2)}" width="${pw}" height="${ph}" rx="${(pw / 2).toFixed(2)}" fill="${orange}" transform="translate(${cx.toFixed(2)}, ${cy.toFixed(2)}) rotate(${ang})" />`
      )
      .join('');

    const accentLayer = `
      <!-- Mid-Left Orange Organic Patch -->
      <path d="M ${bx} ${(h * 0.382).toFixed(3)}
               L ${(w * 0.058).toFixed(3)} ${(h * 0.386).toFixed(3)}
               C ${(w * 0.118).toFixed(3)} ${(h * 0.460).toFixed(3)}, ${(w * 0.125).toFixed(3)} ${(h * 0.585).toFixed(3)}, ${(w * 0.068).toFixed(3)} ${(h * 0.672).toFixed(3)}
               L ${bx} ${(h * 0.678).toFixed(3)} Z"
            fill="${orange}" />

      <!-- Bottom-Right Orange Swoop Patch -->
      <path d="M ${(w * 0.406).toFixed(3)} ${(h + bleedMm).toFixed(3)}
               L ${(w * 0.415).toFixed(3)} ${(h * 0.985).toFixed(3)}
               C ${(w * 0.480).toFixed(3)} ${(h * 0.905).toFixed(3)}, ${(w * 0.635).toFixed(3)} ${(h * 0.865).toFixed(3)}, ${(w * 0.722).toFixed(3)} ${(h * 0.758).toFixed(3)}
               C ${(w * 0.798).toFixed(3)} ${(h * 0.662).toFixed(3)}, ${(w * 0.920).toFixed(3)} ${(h * 0.668).toFixed(3)}, ${(w + bleedMm).toFixed(3)} ${(h * 0.688).toFixed(3)}
               L ${(w + bleedMm).toFixed(3)} ${(h + bleedMm).toFixed(3)} Z"
            fill="${orange}" />

      <!-- Sunny Yellow Sun Illustration (Top-Right Teal Canopy) -->
      <g id="pebble-yellow-sun">
        <circle cx="${sunX.toFixed(2)}" cy="${sunY.toFixed(2)}" r="${sunR.toFixed(2)}" fill="${sunYellow}" />
        ${sunRaysSvg}
      </g>

      <!-- Playful Orange Confetti & Motion Accents -->
      ${leftConfettiSvg}
      ${rightDashesSvg}
    `;

    // FindIt + Yellow Teardrop QR Badge Header Logo
    const pinX = w * 0.628;
    const pinY = h * 0.274;
    const brandLogoLayer = `
      <g id="pebble-findit-logo" data-brand-signature="findit-qr">
        <text x="${(w * 0.436).toFixed(2)}" y="${(h * 0.296).toFixed(2)}" text-anchor="middle" fill="${inkNavy}" font-family="'Plus Jakarta Sans', 'Outfit', 'Arial Black', Arial, sans-serif" font-size="4.85" font-weight="900" letter-spacing="-0.22">FindIt</text>
        <g transform="translate(${pinX.toFixed(2)}, ${pinY.toFixed(2)})">
          <path d="M 0 -3.25 C 2.0 -3.25, 3.35 -1.8, 3.35 0.1 C 3.35 1.85, 1.25 3.35, 0 4.35 C -1.25 3.35, -3.35 1.85, -3.35 0.1 C -3.35 -1.8, -2.0 -3.25, 0 -3.25 Z" fill="${sunYellow}" />
          <text x="0" y="1.05" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="2.75" font-weight="900" letter-spacing="0.06">QR</text>
        </g>
      </g>
    `;

    const qrBoxW = w * 0.39;
    const qrBoxX = (w - qrBoxW) / 2;
    const qrBoxY = h * 0.330;
    const qrContainerLayer = `
      <!-- Clean Pure-White Rounded QR Placement Frame -->
      <rect x="${qrBoxX.toFixed(2)}" y="${qrBoxY.toFixed(2)}" width="${qrBoxW.toFixed(2)}" height="${qrBoxW.toFixed(2)}" rx="2.0" fill="#FFFFFF" />
    `;

    const enY1 = h * 0.696;
    const enY2 = h * 0.734;
    const arY1 = h * 0.800;
    const arY2 = h * 0.844;

    const typographyLayer = `
      <!-- Editable English Message -->
      ${
        enLine2
          ? `<text x="${(w / 2).toFixed(2)}" y="${enY1.toFixed(2)}" text-anchor="middle" fill="${inkNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800" letter-spacing="-0.06">${escapeXml(enLine1)}</text>
             <text x="${(w / 2).toFixed(2)}" y="${enY2.toFixed(2)}" text-anchor="middle" fill="${inkNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800" letter-spacing="-0.06">${escapeXml(enLine2)}</text>`
          : `<text x="${(w / 2).toFixed(2)}" y="${((enY1 + enY2) / 2).toFixed(2)}" text-anchor="middle" fill="${inkNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800" letter-spacing="-0.06">${escapeXml(enLine1)}</text>`
      }
      <!-- Editable Arabic Message -->
      ${
        arLine1
          ? arLine2
            ? `<text x="${(w / 2).toFixed(2)}" y="${arY1.toFixed(2)}" dir="rtl" text-anchor="middle" fill="${inkNavy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>
               <text x="${(w / 2).toFixed(2)}" y="${arY2.toFixed(2)}" dir="rtl" text-anchor="middle" fill="${inkNavy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine2)}</text>`
            : `<text x="${(w / 2).toFixed(2)}" y="${((arY1 + arY2) / 2).toFixed(2)}" dir="rtl" text-anchor="middle" fill="${inkNavy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>`
          : ''
      }
    `;

    const qrInset = 1.45;
    const qrSize = qrBoxW - qrInset * 2;
    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: Number((qrBoxX + qrInset).toFixed(2)),
      y: Number((qrBoxY + qrInset).toFixed(2)),
      size: Number(qrSize.toFixed(2)),
      darkColor: '#0B121C',
      finderColor: '#0B121C',
      centerDotColor: '#0B121C',
      bgColor: '#FFFFFF',
      cornerRadius: 0.8,
    });

    return {
      w,
      h,
      bleedMm,
      safeMarginMm,
      style,
      serial,
      cutPath,
      backgroundLayer,
      artworkLayer: '',
      decorativeLayer,
      accentLayer,
      brandLogoLayer,
      qrContainerLayer,
      typographyLayer,
      qrLayer,
    };
  }

  if (style === 'metro_ticket') {
    const navy = primary || '#0D2B52';
    const cream = secondary || '#F9E7C8';
    const red = accent || '#D84040';
    const goldSun = '#F4B43A';

    const rawEnglish = (options.calloutText ?? 'Scan to Contact the Owner').trim();
    const rawArabic = (options.customSubLabel ?? 'امسح الرمز للتواصل مع المالك').trim();
    const [enLine1, enLine2] = splitCenteredTwoLines(rawEnglish, 16);
    const [arLine1, arLine2] = splitCenteredTwoLines(rawArabic, 16);
    const enFontSize = rawEnglish.length > 28 ? 2.25 : 2.75;
    const arFontSize = rawArabic.length > 32 ? 2.35 : 2.85;

    const backgroundLayer = `
      <!-- Retro Cream Travel Ticket Parchment (Bleed-Safe) -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${isTransparentStock ? 'rgba(249,231,200,0.92)' : cream}" />
      <!-- Subtle Horizontal Aged Ticket Paper Fiber Lines -->
      <g stroke="${navy}" stroke-width="0.08" opacity="0.06">
        <line x1="0" y1="18" x2="${w}" y2="18" />
        <line x1="0" y1="36" x2="${w}" y2="36" />
        <line x1="0" y1="54" x2="${w}" y2="54" />
        <line x1="0" y1="72" x2="${w}" y2="72" />
      </g>
    `;

    // Diagonal airmail border stripes across top and upper/lower side strips
    const airmailStripes: string[] = [];
    for (let sx = 4; sx < w - 4; sx += 9.2) {
      airmailStripes.push(
        `<polygon points="${sx.toFixed(2)},3.6 ${(sx + 3.8).toFixed(2)},3.6 ${(sx + 0.8).toFixed(2)},7.6 ${(sx - 3.0).toFixed(2)},7.6" fill="${red}" />`
      );
      airmailStripes.push(
        `<polygon points="${(sx + 4.6).toFixed(2)},3.6 ${(sx + 8.4).toFixed(2)},3.6 ${(sx + 5.4).toFixed(2)},7.6 ${(sx + 1.6).toFixed(2)},7.6" fill="${navy}" />`
      );
    }
    const sideStripeBlocks = [11.0, 17.5, 24.0, 56.0, 62.5, 69.0].map((sy, idx) => {
      const col = idx % 2 === 0 ? navy : red;
      return `
        <polygon points="3.6,${sy} 6.4,${sy - 2.6} 6.4,${sy + 0.6} 3.6,${sy + 3.2}" fill="${col}" />
        <polygon points="${w - 6.4},${sy + 0.6} ${w - 3.6},${sy - 2.0} ${w - 3.6},${sy + 1.2} ${w - 6.4},${sy + 3.8}" fill="${col}" />
      `;
    });

    const borderLayer = `
      <!-- Outer Ticket Navy/Red Rim & Dashed Inner Stitch -->
      <rect x="${bx}" y="-3" width="${bw}" height="5.5" fill="${navy}" />
      <rect x="-3" y="-3" width="5.5" height="${h * 0.82}" fill="${navy}" />
      <rect x="${w - 2.5}" y="-3" width="5.5" height="${h * 0.82}" fill="${navy}" />
      <rect x="-3" y="${h * 0.78}" width="5.5" height="${h * 0.28}" fill="${red}" />
      <rect x="${w - 2.5}" y="${h * 0.78}" width="5.5" height="${h * 0.28}" fill="${red}" />
      <rect x="${bx}" y="${h - 2.6}" width="${bw}" height="6" fill="${red}" />
      <g opacity="0.92">${airmailStripes.join('')}${sideStripeBlocks.join('')}</g>
      <rect x="3.5" y="3.5" width="${w - 7.0}" height="${h - 7.0}" rx="2.0" fill="none" stroke="${navy}" stroke-width="0.32" stroke-dasharray="1.35 1.05" opacity="0.82" />
    `;

    const decorativeLayer = `
      <!-- Top-Left Jet Airplane + Dashed Flight Loop Trail -->
      <path d="M 0.8 31.0 C 5.5 28.0, 8.2 21.5, 5.2 19.2 C 3.4 17.8, 3.0 21.2, 5.8 22.0 C 8.4 22.7, 9.2 18.8, 7.6 15.8 C 6.6 14.0, 8.4 12.2, 11.2 11.4"
            fill="none" stroke="${navy}" stroke-width="0.36" stroke-dasharray="1.15 0.9" />
      <g transform="translate(12.2, 11.2) rotate(-28)" fill="${navy}">
        <path d="M -2.2 0 L 0.2 -0.55 L 1.2 -2.4 L 1.9 -2.4 L 1.5 -0.45 L 2.7 -0.45 L 3.3 -1.2 L 3.7 -1.2 L 3.3 0 L 3.7 1.2 L 3.3 1.2 L 2.7 0.45 L 1.5 0.45 L 1.9 2.4 L 1.2 2.4 L 0.2 0.55 Z" />
      </g>

      <!-- Left Circular TRAVEL ITEM Stamp + Wavy Postmark Lines -->
      <g id="metro-travel-stamp" transform="translate(8.4, 38.8) rotate(-13)">
        <circle cx="0" cy="0" r="6.1" fill="none" stroke="${red}" stroke-width="0.45" />
        <circle cx="0" cy="0" r="5.1" fill="none" stroke="${red}" stroke-width="0.18" />
        <path d="M -3.2 -2.6 L -1.5 -2.6 M 1.5 -2.6 L 3.2 -2.6" stroke="${red}" stroke-width="0.22" />
        <path d="M -0.8 -2.8 L 0.9 -2.8 L 0.1 -3.8 Z" fill="${red}" />
        <text x="0" y="-0.3" text-anchor="middle" fill="${red}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="1.55" font-weight="900" letter-spacing="0.08">TRAVEL</text>
        <text x="0" y="1.65" text-anchor="middle" fill="${red}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="1.55" font-weight="900" letter-spacing="0.08">ITEM</text>
        <text x="0" y="3.35" text-anchor="middle" fill="${red}" font-family="Arial, sans-serif" font-size="1.1">★★★</text>
      </g>
      <g fill="none" stroke="${red}" stroke-width="0.26" opacity="0.88">
        <path d="M 3.5 46.8 Q 6.2 48.2 9.0 46.8 T 14.5 46.8" />
        <path d="M 3.5 48.3 Q 6.2 49.7 9.0 48.3 T 14.5 48.3" />
        <path d="M 3.5 49.8 Q 6.2 51.2 9.0 49.8 T 14.5 49.8" />
      </g>

      <!-- Bottom Travel Horizon (Mosque, Pyramids, Sun, Cairo Tower & Palm Trees) -->
      <g id="metro-skyline">
        <!-- Setting Amber Sun -->
        <circle cx="33.8" cy="76.2" r="5.2" fill="${goldSun}" />
        <!-- Left Mosque & Old City Skyline -->
        <path d="M 2.5 82.8 L 2.5 78.8 L 4.5 78.8 L 4.5 76.2 L 5.6 76.2 L 5.6 78.8 L 7.4 78.8 L 7.4 74.6 L 8.0 73.2 L 8.6 74.6 L 8.6 78.2 L 10.6 78.2 L 10.6 77.0 C 10.6 75.5, 13.8 75.5, 13.8 77.0 L 13.8 78.2 L 16.0 78.2 L 16.0 74.5 L 16.6 73.1 L 17.2 74.5 L 17.2 79.2 L 19.8 79.2 L 19.8 82.8 Z" fill="${navy}" />
        <rect x="11.5" y="79.2" width="1.4" height="2.4" rx="0.7" fill="${cream}" />
        <!-- Two Desert Pyramids -->
        <polygon points="18.0,82.8 25.8,73.5 32.8,82.8" fill="${goldSun}" stroke="${cream}" stroke-width="0.28" />
        <polygon points="25.8,73.5 29.2,82.8 32.8,82.8" fill="${navy}" opacity="0.78" />
        <polygon points="27.2,82.8 33.4,75.4 39.2,82.8" fill="${goldSun}" stroke="${cream}" stroke-width="0.28" />
        <polygon points="33.4,75.4 36.2,82.8 39.2,82.8" fill="${navy}" opacity="0.72" />
        <!-- Right Cairo Tower & Palm Silhouettes -->
        <path d="M 41.2 82.8 L 41.2 80.2 L 43.2 80.2 L 43.2 74.2 L 43.8 71.0 L 44.2 65.5 L 44.8 62.8 L 45.4 65.5 L 45.8 71.0 L 46.4 74.2 L 46.4 80.2 L 48.2 80.2 L 48.2 78.5 L 55.5 78.5 L 55.5 82.8 Z" fill="${navy}" />
        <!-- Palm Leaf Silhouette -->
        <path d="M 51.0 82.6 L 51.4 76.2 M 51.2 76.2 Q 48.8 75.2 47.6 76.8 M 51.2 76.2 Q 49.4 74.0 47.8 74.5 M 51.2 76.2 Q 53.6 74.2 55.0 75.5 M 51.2 76.2 Q 53.8 75.8 54.6 77.6"
              fill="none" stroke="${navy}" stroke-width="0.45" stroke-linecap="round" />
        <!-- Birds & Horizon Waterlines -->
        <path d="M 10.8 71.6 Q 11.4 71.0 11.9 71.8 Q 12.4 71.0 13.0 71.6" fill="none" stroke="${navy}" stroke-width="0.28" />
        <path d="M 39.8 72.8 Q 40.3 72.1 40.9 72.9 Q 41.4 72.1 42.0 72.7" fill="none" stroke="${navy}" stroke-width="0.28" />
        <line x1="3.5" y1="83.1" x2="54.5" y2="83.1" stroke="${navy}" stroke-width="0.55" />
        <line x1="12.0" y1="84.2" x2="46.0" y2="84.2" stroke="${navy}" stroke-width="0.32" opacity="0.65" />
      </g>
    `;

    const accentLayer = `
      <!-- Right Flat Printed Red Baggage Motif (Clean vector badge) -->
      <g transform="translate(49.2, 39.5) rotate(11)">
        <path d="M -3.3 -4.6 L -1.8 -6.2 L 1.8 -6.2 L 3.3 -4.6 L 3.3 5.4 Q 3.3 6.2 2.4 6.2 L -2.4 6.2 Q -3.3 6.2 -3.3 5.4 Z" fill="${red}" />
        <rect x="-2.0" y="-2.2" width="4.0" height="5.2" rx="0.7" fill="#FFFFFF" />
        <rect x="-1.0" y="-3.2" width="2.0" height="1.1" rx="0.3" fill="none" stroke="#FFFFFF" stroke-width="0.4" />
        <line x1="-0.8" y1="-1.2" x2="-0.8" y2="2.0" stroke="${red}" stroke-width="0.35" />
        <line x1="0.8" y1="-1.2" x2="0.8" y2="2.0" stroke="${red}" stroke-width="0.35" />
      </g>
      <!-- Tapered Red Divider Between English & Arabic Copy -->
      <polygon points="15.0,60.1 43.0,60.1 40.0,60.55 18.0,60.55" fill="${red}" />
    `;

    const brandLogoLayer = `
      <g id="metro-findit-logo" data-brand-signature="findit-qr">
        <text x="22.8" y="16.8" text-anchor="middle" fill="${navy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="4.65" font-weight="900" letter-spacing="-0.18">FindIt</text>
        <g transform="translate(35.0, 14.2)">
          <path d="M 0 -3.2 C 2.1 -3.2, 3.35 -1.7, 3.35 0.15 C 3.35 1.85, 1.25 3.3, 0 4.25 C -1.25 3.3, -3.35 1.85, -3.35 0.15 C -3.35 -1.7, -2.1 -3.2, 0 -3.2 Z" fill="${red}" />
          <text x="0" y="1.0" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="2.65" font-weight="900">QR</text>
        </g>
        <!-- Three Sunburst Amber Rays Next to QR Badge -->
        <rect x="39.8" y="11.2" width="2.1" height="0.78" rx="0.39" fill="${goldSun}" transform="rotate(-34 40.8 11.6)" />
        <rect x="40.5" y="14.0" width="2.4" height="0.78" rx="0.39" fill="${goldSun}" />
        <rect x="39.8" y="16.8" width="2.1" height="0.78" rx="0.39" fill="${goldSun}" transform="rotate(34 40.8 17.2)" />
      </g>
    `;

    const qrBoxW = 28.4;
    const qrBoxX = (w - qrBoxW) / 2;
    const qrBoxY = 20.6;
    const qrContainerLayer = `
      <!-- Framed White Ticket QR Stage with Corner Brackets -->
      <rect x="${(qrBoxX - 0.9).toFixed(2)}" y="${(qrBoxY - 0.9).toFixed(2)}" width="${(qrBoxW + 1.8).toFixed(2)}" height="${(qrBoxW + 1.8).toFixed(2)}" rx="4.2" fill="#FFFFFF" stroke="${navy}" stroke-width="0.65" />
      <path d="M ${(qrBoxX + 1.2).toFixed(2)} ${(qrBoxY + 5.2).toFixed(2)} L ${(qrBoxX + 1.2).toFixed(2)} ${(qrBoxY + 2.4).toFixed(2)} Q ${(qrBoxX + 1.2).toFixed(2)} ${(qrBoxY + 1.2).toFixed(2)} ${(qrBoxX + 2.4).toFixed(2)} ${(qrBoxY + 1.2).toFixed(2)} L ${(qrBoxX + 5.2).toFixed(2)} ${(qrBoxY + 1.2).toFixed(2)}" fill="none" stroke="${red}" stroke-width="0.6" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.2).toFixed(2)} ${(qrBoxY + 1.2).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.4).toFixed(2)} ${(qrBoxY + 1.2).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.2).toFixed(2)} ${(qrBoxY + 1.2).toFixed(2)} ${(qrBoxX + qrBoxW - 1.2).toFixed(2)} ${(qrBoxY + 2.4).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.2).toFixed(2)} ${(qrBoxY + 5.2).toFixed(2)}" fill="none" stroke="${red}" stroke-width="0.6" stroke-linecap="round" />
      <path d="M ${(qrBoxX + 1.2).toFixed(2)} ${(qrBoxY + qrBoxW - 5.2).toFixed(2)} L ${(qrBoxX + 1.2).toFixed(2)} ${(qrBoxY + qrBoxW - 2.4).toFixed(2)} Q ${(qrBoxX + 1.2).toFixed(2)} ${(qrBoxY + qrBoxW - 1.2).toFixed(2)} ${(qrBoxX + 2.4).toFixed(2)} ${(qrBoxY + qrBoxW - 1.2).toFixed(2)} L ${(qrBoxX + 5.2).toFixed(2)} ${(qrBoxY + qrBoxW - 1.2).toFixed(2)}" fill="none" stroke="${red}" stroke-width="0.6" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.2).toFixed(2)} ${(qrBoxY + qrBoxW - 1.2).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.4).toFixed(2)} ${(qrBoxY + qrBoxW - 1.2).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.2).toFixed(2)} ${(qrBoxY + qrBoxW - 1.2).toFixed(2)} ${(qrBoxX + qrBoxW - 1.2).toFixed(2)} ${(qrBoxY + qrBoxW - 2.4).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.2).toFixed(2)} ${(qrBoxY + qrBoxW - 5.2).toFixed(2)}" fill="none" stroke="${red}" stroke-width="0.6" stroke-linecap="round" />
    `;

    const typographyLayer = `
      ${
        enLine2
          ? `<text x="${(w / 2).toFixed(2)}" y="54.2" text-anchor="middle" fill="${navy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800" letter-spacing="-0.05">${escapeXml(enLine1)}</text>
             <text x="${(w / 2).toFixed(2)}" y="57.7" text-anchor="middle" fill="${navy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800" letter-spacing="-0.05">${escapeXml(enLine2)}</text>`
          : `<text x="${(w / 2).toFixed(2)}" y="56.2" text-anchor="middle" fill="${navy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800" letter-spacing="-0.05">${escapeXml(enLine1)}</text>`
      }
      ${
        arLine1
          ? arLine2
            ? `<text x="${(w / 2).toFixed(2)}" y="64.0" dir="rtl" text-anchor="middle" fill="${navy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>
               <text x="${(w / 2).toFixed(2)}" y="67.7" dir="rtl" text-anchor="middle" fill="${navy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine2)}</text>`
            : `<text x="${(w / 2).toFixed(2)}" y="65.8" dir="rtl" text-anchor="middle" fill="${navy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>`
          : ''
      }
    `;

    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: Number((qrBoxX + 2.0).toFixed(2)),
      y: Number((qrBoxY + 2.0).toFixed(2)),
      size: Number((qrBoxW - 4.0).toFixed(2)),
      darkColor: '#0B121C',
      finderColor: '#0B121C',
      centerDotColor: '#0B121C',
      bgColor: '#FFFFFF',
      cornerRadius: 0.8,
    });

    return {
      w,
      h,
      bleedMm,
      safeMarginMm,
      style,
      serial,
      cutPath,
      backgroundLayer,
      artworkLayer: '',
      decorativeLayer,
      accentLayer,
      brandLogoLayer,
      qrContainerLayer,
      borderLayer,
      typographyLayer,
      qrLayer,
    };
  }

  if (style === 'jelly_cube') {
    const violet = primary || '#7B2FF7';
    const pink = secondary || '#FF4DB8';
    const cyan = accent || '#00D4FF';
    const yellow = '#FFD53D';
    const inkNavy = '#0E1C2F';

    const rawEnglish = (options.calloutText ?? 'Scan to Contact the Owner').trim();
    const rawArabic = (options.customSubLabel ?? 'امسح الرمز للتواصل مع المالك').trim();
    const [enLine1, enLine2] = splitCenteredTwoLines(rawEnglish, 16);
    const [arLine1, arLine2] = splitCenteredTwoLines(rawArabic, 16);
    const enFontSize = rawEnglish.length > 28 ? 2.1 : 2.5;
    const arFontSize = rawArabic.length > 32 ? 2.25 : 2.65;

    const backgroundLayer = `
      <!-- Glossy Candy Jelly Gradient Base (Bleed-Safe) -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${isTransparentStock ? 'rgba(123,47,247,0.85)' : 'url(#jelly-base-grad)'}" />
      <!-- Overlapping Translucent Cyan & Violet Jelly Lobes -->
      <ellipse cx="${(w * 0.82).toFixed(2)}" cy="${(h * 0.24).toFixed(2)}" rx="24" ry="20" fill="${cyan}" opacity="0.52" />
      <ellipse cx="${(w * 0.16).toFixed(2)}" cy="${(h * 0.78).toFixed(2)}" rx="24" ry="20" fill="${cyan}" opacity="0.58" />
      <ellipse cx="${(w * 0.78).toFixed(2)}" cy="${(h * 0.76).toFixed(2)}" rx="26" ry="22" fill="${pink}" opacity="0.72" />
      <ellipse cx="${(w * 0.20).toFixed(2)}" cy="${(h * 0.20).toFixed(2)}" rx="22" ry="18" fill="${violet}" opacity="0.55" />
    `;

    const decorativeLayer = `
      <!-- Translucent Frosted Top Header Lobe -->
      <rect x="13.5" y="7.8" width="43.0" height="10.8" rx="5.4" fill="#FFFFFF" opacity="0.34" />
      <!-- Crisp White Vector Specular Gloss Highlights (Zero SVG Blur Filters) -->
      <path d="M 10.5 11.2 C 13.0 6.5, 19.5 4.8, 22.8 6.4 C 24.4 7.2, 23.0 9.4, 19.2 9.4 C 15.2 9.4, 12.2 12.5, 10.5 11.2 Z" fill="#FFFFFF" opacity="0.78" />
      <path d="M 55.5 5.2 C 59.5 5.8, 62.5 8.5, 62.0 10.4 C 61.4 12.2, 58.5 9.8, 55.5 8.2 Z" fill="#FFFFFF" opacity="0.65" />
      <path d="M 60.2 50.5 C 62.5 53.5, 61.5 60.5, 58.2 62.5 C 56.5 63.5, 55.8 61.0, 57.5 57.5 C 58.8 54.8, 58.5 52.0, 60.2 50.5 Z" fill="#FFFFFF" opacity="0.68" />
      <circle cx="8.2" cy="14.2" r="0.9" fill="#FFFFFF" opacity="0.82" />
      <circle cx="9.8" cy="29.0" r="0.85" fill="#FFFFFF" opacity="0.75" />
      <!-- Bottom-Left Shaded Cyan Jelly Sphere Bubble -->
      <g id="jelly-cyan-bubble" transform="translate(10.5, 49.5)">
        <circle cx="0" cy="0" r="4.6" fill="url(#jelly-bubble-grad)" opacity="0.92" />
        <ellipse cx="-1.3" cy="-1.6" rx="1.6" ry="0.9" transform="rotate(-32 -1.3 -1.6)" fill="#FFFFFF" opacity="0.88" />
      </g>
    `;

    const accentLayer = `
      <!-- Yellow 4-Point Sparkle Stars (Upper Left) -->
      <path d="M 11.8 14.8 Q 12.2 17.8 14.8 18.2 Q 12.2 18.6 11.8 21.6 Q 11.4 18.6 8.8 18.2 Q 11.4 17.8 11.8 14.8 Z" fill="${yellow}" />
      <path d="M 14.8 20.6 Q 15.0 21.8 16.2 22.0 Q 15.0 22.2 14.8 23.4 Q 14.6 22.2 13.4 22.0 Q 14.6 21.8 14.8 20.6 Z" fill="${yellow}" />
      <!-- White Vector Gamepad Motif (Mid Left) -->
      <g transform="translate(10.2, 36.2) rotate(-20)">
        <path d="M -4.2 -1.5 Q -5.6 -1.5 -5.8 1.6 Q -5.9 3.6 -4.4 3.6 Q -3.0 3.6 -2.2 1.8 L 2.2 1.8 Q 3.0 3.6 4.4 3.6 Q 5.9 3.6 5.8 1.6 Q 5.6 -1.5 4.2 -1.5 Z" fill="none" stroke="#FFFFFF" stroke-width="0.9" stroke-linejoin="round" />
        <path d="M -3.5 0.2 H -1.9 M -2.7 -0.6 V 1.0" stroke="#FFFFFF" stroke-width="0.65" stroke-linecap="round" />
        <circle cx="2.5" cy="0.0" r="0.45" fill="#FFFFFF" />
        <circle cx="3.6" cy="0.7" r="0.45" fill="#FFFFFF" />
      </g>
      <!-- White Vector Headphones + 2 Yellow Motion Dashes (Mid Right) -->
      <g transform="translate(59.2, 29.8) rotate(14)">
        <path d="M -3.8 1.6 V -0.4 A 3.8 3.8 0 0 1 3.8 -0.4 V 1.6" fill="none" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round" />
        <rect x="-4.5" y="0.4" width="1.5" height="3.2" rx="0.7" fill="#FFFFFF" />
        <rect x="3.0" y="0.4" width="1.5" height="3.2" rx="0.7" fill="#FFFFFF" />
      </g>
      <rect x="57.0" y="34.8" width="1.05" height="3.2" rx="0.52" fill="${yellow}" transform="rotate(24 57.5 36.4)" />
      <rect x="60.4" y="36.2" width="1.05" height="2.6" rx="0.52" fill="${yellow}" transform="rotate(38 60.9 37.5)" />
      <!-- Cute Smiling Yellow Star Mascot (Lower Right) -->
      <g id="jelly-smiling-star" transform="translate(58.4, 46.2) rotate(10)">
        <path d="M 0 -5.6 L 1.6 -2.1 L 5.4 -1.6 L 2.6 1.0 L 3.3 4.8 L 0 3.0 L -3.3 4.8 L -2.6 1.0 L -5.4 -1.6 L -1.6 -2.1 Z" fill="${yellow}" stroke="#FFFFFF" stroke-width="0.45" stroke-linejoin="round" />
        <circle cx="-1.3" cy="-0.3" r="0.45" fill="#2A1042" />
        <circle cx="1.3" cy="-0.3" r="0.45" fill="#2A1042" />
        <circle cx="-2.1" cy="0.5" r="0.55" fill="${pink}" opacity="0.75" />
        <circle cx="2.1" cy="0.5" r="0.55" fill="${pink}" opacity="0.75" />
        <path d="M -1.0 0.7 Q 0 1.7 1.0 0.7" fill="none" stroke="#2A1042" stroke-width="0.45" stroke-linecap="round" />
      </g>
      <!-- Left Three Yellow Sparkle Fan Dashes Next to Arabic Pill -->
      <rect x="11.2" y="57.4" width="2.4" height="0.95" rx="0.48" fill="${yellow}" transform="rotate(18 12.4 57.8)" />
      <rect x="10.4" y="60.0" width="2.7" height="0.95" rx="0.48" fill="${yellow}" transform="rotate(-6 11.7 60.5)" />
      <rect x="11.6" y="62.6" width="2.4" height="0.95" rx="0.48" fill="${yellow}" transform="rotate(-26 12.8 63.1)" />
    `;

    const brandLogoLayer = `
      <g id="jelly-findit-logo" data-brand-signature="findit-qr">
        <text x="27.2" y="15.0" text-anchor="middle" fill="${inkNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="4.85" font-weight="900" letter-spacing="-0.18">FindIt</text>
        <g transform="translate(39.4, 12.8)">
          <path d="M 0 -3.2 C 2.1 -3.2, 3.35 -1.7, 3.35 0.15 C 3.35 1.85, 1.25 3.3, 0 4.25 C -1.25 3.3, -3.35 1.85, -3.35 0.15 C -3.35 -1.7, -2.1 -3.2, 0 -3.2 Z" fill="${pink}" />
          <text x="0" y="1.0" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="2.65" font-weight="900">QR</text>
        </g>
        <rect x="44.4" y="9.8" width="2.5" height="0.9" rx="0.45" fill="${yellow}" transform="rotate(-32 45.6 10.2)" />
        <rect x="45.2" y="12.6" width="2.8" height="0.9" rx="0.45" fill="${yellow}" />
        <rect x="44.4" y="15.4" width="2.5" height="0.9" rx="0.45" fill="${yellow}" transform="rotate(32 45.6 15.8)" />
      </g>
    `;

    const qrBoxW = 26.8;
    const qrBoxX = (w - qrBoxW) / 2;
    const qrBoxY = 20.4;
    const qrContainerLayer = `
      <!-- Soft Rounded White Jelly QR Stage with Dual Cyan & Purple Corner Brackets -->
      <rect x="${qrBoxX.toFixed(2)}" y="${qrBoxY.toFixed(2)}" width="${qrBoxW.toFixed(2)}" height="${qrBoxW.toFixed(2)}" rx="3.4" fill="#FFFFFF" />
      <path d="M ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY + 5.2).toFixed(2)} L ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY + 2.3).toFixed(2)} Q ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)} ${(qrBoxX + 2.3).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)} L ${(qrBoxX + 5.2).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)}" fill="none" stroke="${cyan}" stroke-width="0.65" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.2).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.3).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)} ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY + 2.3).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY + 5.2).toFixed(2)}" fill="none" stroke="${violet}" stroke-width="0.65" stroke-linecap="round" />
      <path d="M ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 5.2).toFixed(2)} L ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 2.3).toFixed(2)} Q ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)} ${(qrBoxX + 2.3).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)} L ${(qrBoxX + 5.2).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)}" fill="none" stroke="${cyan}" stroke-width="0.65" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.2).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.3).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)} ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 2.3).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 5.2).toFixed(2)}" fill="none" stroke="${violet}" stroke-width="0.65" stroke-linecap="round" />
    `;

    const typographyLayer = `
      <!-- White Pill For English Message -->
      <rect x="14.5" y="49.3" width="41.0" height="7.4" rx="3.7" fill="#FFFFFF" />
      ${
        enLine2
          ? `<text x="35.0" y="52.4" text-anchor="middle" fill="${inkNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800" letter-spacing="-0.05">${escapeXml(enLine1)}</text>
             <text x="35.0" y="55.4" text-anchor="middle" fill="${inkNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800" letter-spacing="-0.05">${escapeXml(enLine2)}</text>`
          : `<text x="35.0" y="53.9" text-anchor="middle" fill="${inkNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800" letter-spacing="-0.05">${escapeXml(enLine1)}</text>`
      }
      <!-- Soft Blush Pink Pill For Arabic Message -->
      <rect x="16.2" y="57.7" width="37.6" height="7.4" rx="3.7" fill="#FFE6F4" />
      ${
        arLine1
          ? arLine2
            ? `<text x="35.0" y="60.9" dir="rtl" text-anchor="middle" fill="#2A1042" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>
               <text x="35.0" y="64.0" dir="rtl" text-anchor="middle" fill="#2A1042" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine2)}</text>`
            : `<text x="35.0" y="62.4" dir="rtl" text-anchor="middle" fill="#2A1042" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>`
          : ''
      }
    `;

    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: Number((qrBoxX + 1.9).toFixed(2)),
      y: Number((qrBoxY + 1.9).toFixed(2)),
      size: Number((qrBoxW - 3.8).toFixed(2)),
      darkColor: '#0B121C',
      finderColor: '#0B121C',
      centerDotColor: '#0B121C',
      bgColor: '#FFFFFF',
      cornerRadius: 0.8,
    });

    return {
      w,
      h,
      bleedMm,
      safeMarginMm,
      style,
      serial,
      cutPath,
      backgroundLayer,
      artworkLayer: '',
      decorativeLayer,
      accentLayer,
      brandLogoLayer,
      qrContainerLayer,
      typographyLayer,
      qrLayer,
    };
  }

  if (style === 'hexa_pulse') {
    const deepNavy = primary || '#0B1B3B';
    const cyan = secondary || '#00E5FF';
    const yellow = accent || '#FFD600';
    const slate = '#7A8A9A';

    const rawEnglish = (options.calloutText ?? 'Scan to Contact the Owner').trim();
    const rawArabic = (options.customSubLabel ?? 'امسح الرمز للتواصل مع المالك').trim();
    const [enLine1, enLine2] = splitCenteredTwoLines(rawEnglish, 16);
    const [arLine1, arLine2] = splitCenteredTwoLines(rawArabic, 16);
    const enFontSize = rawEnglish.length > 28 ? 2.1 : 2.55;
    const arFontSize = rawArabic.length > 32 ? 2.3 : 2.75;

    // Inner hexagonal paths (beveled double-frame matching futuristic tech geometry)
    const innerHex = buildRoundedPolygonPath(
      [
        [w * 0.5, 4.2],
        [w - 4.0, h * 0.27],
        [w - 4.0, h * 0.73],
        [w * 0.5, h - 4.2],
        [4.0, h * 0.73],
        [4.0, h * 0.27],
      ],
      2.2
    );

    const backgroundLayer = `
      <!-- Deep Tech Navy Hex Base (Bleed-Safe) -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${isTransparentStock ? 'rgba(11,27,59,0.92)' : deepNavy}" />
      <circle cx="${(w * 0.5).toFixed(2)}" cy="${(h * 0.38).toFixed(2)}" r="34" fill="url(#hexa-core-glow)" />
    `;

    // Honeycomb micro-hex lattice generator for top-right & bottom-left sectors
    const hexCell = (cx: number, cy: number, r = 1.65) => {
      const pts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
      }
      return `<polygon points="${pts.join(' ')}" />`;
    };
    const honeycombCells: string[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const offsetX = row % 2 === 0 ? 0 : 1.5;
        honeycombCells.push(hexCell(49.5 + col * 3.1 + offsetX, 17.5 + row * 2.7, 1.55));
        honeycombCells.push(hexCell(5.5 + col * 3.1 + offsetX, 55.2 + row * 2.7, 1.55));
      }
    }

    const borderLayer = `
      <!-- Double Cyan Neon Bevel Frame -->
      <path d="${innerHex}" fill="none" stroke="${cyan}" stroke-width="0.9" opacity="0.92" />
      <path d="${innerHex}" fill="none" stroke="#FFFFFF" stroke-width="0.22" opacity="0.5" />
      <!-- Yellow Beveled Corner Chevrons (Top-Left, Lower-Left, Lower-Right) -->
      <polygon points="4.2,24.8 18.8,14.5 19.6,15.6 5.0,25.9" fill="${yellow}" />
      <polygon points="4.4,54.2 12.2,60.6 11.4,61.6 3.6,55.2" fill="${yellow}" />
      <polygon points="65.6,54.2 57.8,60.6 58.6,61.6 66.4,55.2" fill="${yellow}" />
    `;

    const decorativeLayer = `
      <!-- Honeycomb Tech Mesh -->
      <g fill="none" stroke="${cyan}" stroke-width="0.22" opacity="0.28">${honeycombCells.join('')}</g>
      <!-- Circuit Traces & Node Dots -->
      <g fill="none" stroke="${yellow}" stroke-width="0.34">
        <polyline points="48.5,24.2 52.5,24.2 55.8,21.2 63.5,21.2" />
        <polyline points="5.2,37.8 14.5,37.8 18.0,34.8 21.5,34.8" />
      </g>
      <circle cx="48.5" cy="24.2" r="0.65" fill="${yellow}" />
      <circle cx="5.2" cy="37.8" r="0.65" fill="${yellow}" />
      <!-- Top-Left 3 Diagonal Cyan Bars & Side Hazard Yellow Stripes -->
      <g fill="${cyan}">
        <polygon points="15.0,22.4 17.2,22.4 15.8,24.4 13.6,24.4" />
        <polygon points="18.2,22.4 20.4,22.4 19.0,24.4 16.8,24.4" />
        <polygon points="21.4,22.4 23.6,22.4 22.2,24.4 20.0,24.4" />
      </g>
      <g fill="${yellow}">
        ${[0, 1, 2, 3, 4]
          .map(
            (i) =>
              `<polygon points="${(5.2 + i * 2.1).toFixed(1)},40.6 ${(6.4 + i * 2.1).toFixed(1)},40.6 ${(5.2 + i * 2.1).toFixed(1)},42.8 ${(4.0 + i * 2.1).toFixed(1)},42.8" />`
          )
          .join('')}
        ${[0, 1, 2, 3, 4]
          .map(
            (i) =>
              `<polygon points="${(54.2 + i * 2.1).toFixed(1)},45.6 ${(55.4 + i * 2.1).toFixed(1)},45.6 ${(54.2 + i * 2.1).toFixed(1)},47.8 ${(53.0 + i * 2.1).toFixed(1)},47.8" />`
          )
          .join('')}
      </g>
    `;

    const accentLayer = `
      <!-- Tech Peripheral Vector Icons (Headphones, Laptop, Smartphone, USB Plug) -->
      <!-- Headphones Left -->
      <g transform="translate(12.2, 31.2)" fill="none" stroke="${cyan}" stroke-width="0.65" stroke-linecap="round">
        <path d="M -3.4 1.6 V -0.4 A 3.4 3.4 0 0 1 3.4 -0.4 V 1.6" />
        <rect x="-4.1" y="0.3" width="1.4" height="3.1" rx="0.6" fill="${cyan}" stroke="none" />
        <rect x="2.7" y="0.3" width="1.4" height="3.1" rx="0.6" fill="${cyan}" stroke="none" />
      </g>
      <!-- Laptop Left -->
      <g transform="translate(12.4, 48.2)" fill="none" stroke="${cyan}" stroke-width="0.55" stroke-linejoin="round">
        <rect x="-3.4" y="-2.5" width="6.8" height="4.2" rx="0.4" />
        <polygon points="-4.6,2.8 4.6,2.8 3.6,1.8 -3.6,1.8" fill="${cyan}" stroke="none" opacity="0.85" />
      </g>
      <!-- Smartphone Right -->
      <g transform="translate(57.8, 35.8) rotate(12)" fill="none" stroke="${cyan}" stroke-width="0.55">
        <rect x="-2.6" y="-4.3" width="5.2" height="8.6" rx="0.8" fill="${deepNavy}" />
        <rect x="-2.0" y="-3.2" width="4.0" height="6.1" rx="0.3" stroke-width="0.32" />
        <circle cx="0" cy="3.6" r="0.32" fill="${cyan}" stroke="none" />
      </g>
      <!-- USB Cable Right -->
      <g transform="translate(58.0, 54.4)" fill="none" stroke="${cyan}" stroke-width="0.55" stroke-linecap="round">
        <rect x="-1.2" y="-3.6" width="2.4" height="1.8" rx="0.2" />
        <rect x="-1.6" y="-1.8" width="3.2" height="3.2" rx="0.4" fill="${cyan}" stroke="none" />
        <path d="M 0 1.4 C 0 3.2, 0.9 4.2, 0.2 5.8" />
      </g>
      <!-- Bottom ECG Heartbeat Pulse Waveform -->
      <polyline id="hexa-ecg-pulse" points="26.0,70.2 31.6,70.2 32.8,68.2 34.1,72.4 35.5,66.8 36.9,72.2 38.2,69.1 39.2,70.2 44.0,70.2"
                fill="none" stroke="${cyan}" stroke-width="0.65" stroke-linecap="round" stroke-linejoin="round" />
      <line x1="16.0" y1="67.5" x2="22.0" y2="67.5" stroke="${slate}" stroke-width="0.3" opacity="0.6" />
      <line x1="48.0" y1="67.5" x2="54.0" y2="67.5" stroke="${slate}" stroke-width="0.3" opacity="0.6" />
    `;

    const brandLogoLayer = `
      <g id="hexa-findit-logo" data-brand-signature="findit-qr">
        <text x="27.2" y="19.6" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="4.85" font-weight="900" font-style="italic" letter-spacing="-0.15">FindIt</text>
        <g transform="translate(40.2, 17.5)">
          <path d="M -3.3 -2.6 H 2.8 Q 3.6 -2.6 3.6 -1.8 V 1.6 Q 3.6 2.4 2.8 2.4 H -0.2 L -2.2 4.1 V 2.4 H -3.3 Q -4.1 2.4 -4.1 1.6 V -1.8 Q -4.1 -2.6 -3.3 -2.6 Z" fill="${yellow}" />
          <text x="-0.2" y="0.95" text-anchor="middle" fill="${deepNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="2.6" font-weight="900">QR</text>
        </g>
      </g>
    `;

    const qrBoxW = 26.8;
    const qrBoxX = (w - qrBoxW) / 2;
    const qrBoxY = 23.0;
    const qrContainerLayer = `
      <!-- High-Contrast White Tech QR Pad with Segmented Cyber Corner Brackets -->
      <rect x="${qrBoxX.toFixed(2)}" y="${qrBoxY.toFixed(2)}" width="${qrBoxW.toFixed(2)}" height="${qrBoxW.toFixed(2)}" rx="2.6" fill="#FFFFFF" />
      <path d="M ${(qrBoxX - 1.1).toFixed(2)} ${(qrBoxY + 5.6).toFixed(2)} L ${(qrBoxX - 1.1).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} Q ${(qrBoxX - 1.1).toFixed(2)} ${(qrBoxY - 1.1).toFixed(2)} ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY - 1.1).toFixed(2)} L ${(qrBoxX + 5.6).toFixed(2)} ${(qrBoxY - 1.1).toFixed(2)}" fill="none" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.6).toFixed(2)} ${(qrBoxY - 1.1).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY - 1.1).toFixed(2)} Q ${(qrBoxX + qrBoxW + 1.1).toFixed(2)} ${(qrBoxY - 1.1).toFixed(2)} ${(qrBoxX + qrBoxW + 1.1).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW + 1.1).toFixed(2)} ${(qrBoxY + 5.6).toFixed(2)}" fill="none" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round" />
      <path d="M ${(qrBoxX - 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 5.6).toFixed(2)} L ${(qrBoxX - 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} Q ${(qrBoxX - 1.1).toFixed(2)} ${(qrBoxY + qrBoxW + 1.1).toFixed(2)} ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW + 1.1).toFixed(2)} L ${(qrBoxX + 5.6).toFixed(2)} ${(qrBoxY + qrBoxW + 1.1).toFixed(2)}" fill="none" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.6).toFixed(2)} ${(qrBoxY + qrBoxW + 1.1).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW + 1.1).toFixed(2)} Q ${(qrBoxX + qrBoxW + 1.1).toFixed(2)} ${(qrBoxY + qrBoxW + 1.1).toFixed(2)} ${(qrBoxX + qrBoxW + 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW + 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 5.6).toFixed(2)}" fill="none" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round" />
    `;

    const enHexBanner = `M 16.5 51.2 L 53.5 51.2 L 56.2 54.6 L 53.5 58.0 L 16.5 58.0 L 13.8 54.6 Z`;
    const arHexBanner = `M 19.2 59.3 L 50.8 59.3 L 53.2 62.7 L 50.8 66.1 L 19.2 66.1 L 16.8 62.7 Z`;

    const typographyLayer = `
      <!-- Cyan-Bordered Hex Banner for English Text -->
      <path d="${enHexBanner}" fill="${deepNavy}" stroke="${cyan}" stroke-width="0.62" />
      ${
        enLine2
          ? `<text x="35.0" y="53.95" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800" font-style="italic">${escapeXml(enLine1)}</text>
             <text x="35.0" y="56.85" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800" font-style="italic">${escapeXml(enLine2)}</text>`
          : `<text x="35.0" y="55.4" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800" font-style="italic">${escapeXml(enLine1)}</text>`
      }
      <!-- Solid Yellow Hex Banner for Arabic Text -->
      <path d="${arHexBanner}" fill="${yellow}" />
      ${
        arLine1
          ? arLine2
            ? `<text x="35.0" y="62.2" dir="rtl" text-anchor="middle" fill="${deepNavy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>
               <text x="35.0" y="65.2" dir="rtl" text-anchor="middle" fill="${deepNavy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine2)}</text>`
            : `<text x="35.0" y="63.7" dir="rtl" text-anchor="middle" fill="${deepNavy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>`
          : ''
      }
    `;

    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: Number((qrBoxX + 1.8).toFixed(2)),
      y: Number((qrBoxY + 1.8).toFixed(2)),
      size: Number((qrBoxW - 3.6).toFixed(2)),
      darkColor: '#0B121C',
      finderColor: '#0B121C',
      centerDotColor: '#0B121C',
      bgColor: '#FFFFFF',
      cornerRadius: 0.7,
    });

    return {
      w,
      h,
      bleedMm,
      safeMarginMm,
      style,
      serial,
      cutPath,
      backgroundLayer,
      artworkLayer: '',
      decorativeLayer,
      accentLayer,
      brandLogoLayer,
      qrContainerLayer,
      borderLayer,
      typographyLayer,
      qrLayer,
    };
  }

  if (style === 'flora_loop') {
    const forestGreen = primary || '#0F6B4B';
    const cream = secondary || '#FFF6E6';
    const hibiscusPink = accent || '#F48FB1';
    const leafGreen = '#8BC34A';
    const badgeYellow = '#FFC800';

    const rawEnglish = (options.calloutText ?? 'Scan to Contact the Owner').trim();
    const rawArabic = (options.customSubLabel ?? 'امسح الرمز للتواصل مع المالك').trim();
    const [enLine1, enLine2] = splitCenteredTwoLines(rawEnglish, 16);
    const [arLine1, arLine2] = splitCenteredTwoLines(rawArabic, 16);
    const enFontSize = rawEnglish.length > 28 ? 2.15 : 2.55;
    const arFontSize = rawArabic.length > 32 ? 2.3 : 2.75;

    const innerSegs = getFloraLoopSegments(w - 5.2, h - 5.2);
    const fmtShift = (pt: [number, number]) => `${(pt[0] + 2.6).toFixed(3)} ${(pt[1] + 2.6).toFixed(3)}`;
    const innerBotanicalPath = [
      `M ${fmtShift(innerSegs[0].p0)}`,
      ...innerSegs.map((s) => `C ${fmtShift(s.c1)}, ${fmtShift(s.c2)}, ${fmtShift(s.p1)}`),
      'Z',
    ].join(' ');

    const hibiscusFlower = (cx: number, cy: number, scale: number, rotDeg: number) => {
      const petals = [0, 72, 144, 216, 288]
        .map(
          (ang) =>
            `<path d="M 0 0 C -2.8 -3.6, -2.5 -7.8, 0 -8.2 C 2.5 -7.8, 2.8 -3.6, 0 0 Z" fill="${hibiscusPink}" stroke="#E75C8D" stroke-width="0.22" transform="rotate(${ang})" />
             <path d="M 0 -0.6 L 0 -5.6" stroke="#E75C8D" stroke-width="0.2" opacity="0.6" transform="rotate(${ang})" />`
        )
        .join('');
      return `
        <g transform="translate(${cx.toFixed(2)}, ${cy.toFixed(2)}) rotate(${rotDeg}) scale(${scale})">
          ${petals}
          <circle cx="0" cy="0" r="1.35" fill="#F06292" />
          <path d="M 0 0 Q 1.6 -2.2 2.8 -4.0" fill="none" stroke="#FFC107" stroke-width="0.45" stroke-linecap="round" />
          <circle cx="2.9" cy="-4.1" r="0.55" fill="#FFD54F" />
          <circle cx="2.1" cy="-3.3" r="0.4" fill="#FFD54F" />
        </g>`;
    };

    const leafPair = (x: number, y: number, ang: number, scale = 1) => `
      <g transform="translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${ang}) scale(${scale})">
        <path d="M 0 0 C -1.4 -1.8, -1.3 -4.6, 0 -5.6 C 1.3 -4.6, 1.4 -1.8, 0 0 Z" fill="${leafGreen}" stroke="${forestGreen}" stroke-width="0.24" />
        <line x1="0" y1="0" x2="0" y2="-4.6" stroke="${forestGreen}" stroke-width="0.18" />
      </g>`;

    const backgroundLayer = `
      <!-- Warm Cream Botanical Label Base (Bleed-Safe) -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${isTransparentStock ? 'rgba(255,246,230,0.92)' : cream}" />
    `;

    const borderLayer = `
      <!-- Symmetrical Scalloped Forest-Green Inner Frame -->
      <path d="${innerBotanicalPath}" fill="none" stroke="${forestGreen}" stroke-width="0.55" opacity="0.92" />
    `;

    const decorativeLayer = `
      <!-- Top Gentle Leaf Sprig (Clean Standalone Botanical Crest) -->
      <path d="M 27.0 9.6 Q 36.0 7.2 44.5 10.6" fill="none" stroke="${forestGreen}" stroke-width="0.38" />
      ${leafPair(30.5, 9.2, -45, 0.9)}
      ${leafPair(36.0, 8.6, 35, 1.0)}
      ${leafPair(41.2, 9.8, 65, 0.9)}
      <!-- Upper-Left Greenery Cluster -->
      <path d="M 8.5 22.0 Q 11.5 14.0 18.0 11.5" fill="none" stroke="${forestGreen}" stroke-width="0.45" />
      ${leafPair(11.0, 15.2, -32, 1.45)}
      ${leafPair(14.5, 13.5, 14, 1.3)}
      ${leafPair(18.5, 14.8, 52, 0.95)}
      <!-- Mid-Left Trailing Sprig -->
      <path d="M 9.8 39.2 Q 7.8 45.8 9.2 52.8" fill="none" stroke="${forestGreen}" stroke-width="0.38" />
      ${leafPair(8.8, 43.2, -40, 0.95)}
      ${leafPair(8.4, 47.4, -55, 0.9)}
      ${leafPair(11.4, 45.0, 40, 0.85)}
      <!-- Bottom Greenery Garland -->
      <path d="M 16.5 67.5 Q 24.5 70.5 34.0 69.8 Q 43.5 70.5 52.0 65.5" fill="none" stroke="${forestGreen}" stroke-width="0.42" />
      ${leafPair(22.5, 69.2, -68, 1.25)}
      ${leafPair(28.5, 70.0, -82, 1.15)}
      ${leafPair(43.5, 68.5, 48, 0.95)}
      ${leafPair(48.8, 66.2, 36, 0.95)}
      <!-- Monstera Split Leaf on Right Margin -->
      <g transform="translate(59.8, 45.2) rotate(-14)">
        <path d="M 0 -7.2 C 4.8 -7.2, 7.2 -3.4, 6.8 1.4 C 6.4 5.2, 3.2 7.2, 0 6.8 C -3.2 7.2, -6.4 5.2, -6.8 1.4 C -7.2 -3.4, -4.8 -7.2, 0 -7.2 Z" fill="${forestGreen}" />
        <path d="M -5.8 -1.8 L -1.8 -0.8 M -6.0 1.4 L -1.8 1.6 M 5.8 -1.8 L 1.8 -0.8 M 6.0 1.4 L 1.8 1.6" stroke="${cream}" stroke-width="0.95" stroke-linecap="round" />
        <line x1="0" y1="-5.8" x2="0" y2="5.8" stroke="${leafGreen}" stroke-width="0.4" />
      </g>
      <!-- Upper-Right Botanical Twig -->
      <path d="M 55.2 38.5 Q 58.2 34.5 57.0 30.8" fill="none" stroke="${forestGreen}" stroke-width="0.35" />
      ${leafPair(56.5, 34.5, -24, 0.85)}
      ${leafPair(58.4, 35.8, 32, 0.85)}
      <!-- Delicate Butterfly Motif (Upper Right) -->
      <g id="flora-butterfly" transform="translate(55.4, 26.8) rotate(-22)">
        <ellipse cx="-2.1" cy="-1.2" rx="2.3" ry="1.5" fill="#FF9E6D" stroke="${forestGreen}" stroke-width="0.22" />
        <ellipse cx="2.1" cy="-1.2" rx="2.3" ry="1.5" fill="#FF9E6D" stroke="${forestGreen}" stroke-width="0.22" />
        <ellipse cx="-1.6" cy="1.1" rx="1.6" ry="1.15" fill="${hibiscusPink}" stroke="${forestGreen}" stroke-width="0.22" />
        <ellipse cx="1.6" cy="1.1" rx="1.6" ry="1.15" fill="${hibiscusPink}" stroke="${forestGreen}" stroke-width="0.22" />
        <line x1="0" y1="-2.2" x2="0" y2="2.2" stroke="${forestGreen}" stroke-width="0.55" stroke-linecap="round" />
      </g>
    `;

    const accentLayer = `
      <!-- Layered Pink Hibiscus Flowers on Left Edge -->
      ${hibiscusFlower(12.2, 24.5, 0.92, -16)}
      ${hibiscusFlower(18.6, 17.5, 0.56, 22)}
      ${hibiscusFlower(13.8, 57.5, 0.88, 12)}
    `;

    const brandLogoLayer = `
      <g id="flora-findit-logo" data-brand-signature="findit-qr">
        <text x="27.5" y="20.4" text-anchor="middle" fill="${forestGreen}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="4.7" font-weight="900" letter-spacing="-0.18">FindIt</text>
        <g transform="translate(39.8, 18.4)">
          <path d="M -3.3 -2.6 H 2.8 Q 3.6 -2.6 3.6 -1.8 V 1.6 Q 3.6 2.4 2.8 2.4 H -0.2 L -2.2 4.1 V 2.4 H -3.3 Q -4.1 2.4 -4.1 1.6 V -1.8 Q -4.1 -2.6 -3.3 -2.6 Z" fill="${badgeYellow}" />
          <text x="-0.2" y="0.95" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="2.6" font-weight="900">QR</text>
        </g>
        <rect x="44.8" y="15.4" width="2.4" height="0.85" rx="0.42" fill="${badgeYellow}" transform="rotate(-32 46.0 15.8)" />
        <rect x="45.6" y="18.2" width="2.7" height="0.85" rx="0.42" fill="${badgeYellow}" />
        <rect x="44.8" y="21.0" width="2.4" height="0.85" rx="0.42" fill="${badgeYellow}" transform="rotate(32 46.0 21.4)" />
      </g>
    `;

    const qrBoxW = 26.8;
    const qrBoxX = (w - qrBoxW) / 2;
    const qrBoxY = 23.4;
    const qrContainerLayer = `
      <!-- Clean White Botanical QR Stage with Forest-Green Brackets -->
      <rect x="${qrBoxX.toFixed(2)}" y="${qrBoxY.toFixed(2)}" width="${qrBoxW.toFixed(2)}" height="${qrBoxW.toFixed(2)}" rx="2.8" fill="#FFFFFF" stroke="#E2DBC8" stroke-width="0.35" />
      <path d="M ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY + 5.2).toFixed(2)} L ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY + 2.2).toFixed(2)} Q ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)} ${(qrBoxX + 2.2).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)} L ${(qrBoxX + 5.2).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)}" fill="none" stroke="${forestGreen}" stroke-width="0.65" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.2).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.2).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)} ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY + 2.2).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY + 5.2).toFixed(2)}" fill="none" stroke="${forestGreen}" stroke-width="0.65" stroke-linecap="round" />
      <path d="M ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 5.2).toFixed(2)} L ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 2.2).toFixed(2)} Q ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)} ${(qrBoxX + 2.2).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)} L ${(qrBoxX + 5.2).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)}" fill="none" stroke="${forestGreen}" stroke-width="0.65" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.2).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.2).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)} ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 2.2).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 5.2).toFixed(2)}" fill="none" stroke="${forestGreen}" stroke-width="0.65" stroke-linecap="round" />
    `;

    const typographyLayer = `
      <!-- Light Leaf-Green Botanical Banner (English Copy) -->
      <path d="M 18.0 51.6 L 54.0 51.6 Q 55.2 55.1 54.0 58.6 L 18.0 58.6 Q 16.8 55.1 18.0 51.6 Z" fill="#D5E8B3" />
      ${leafPair(19.2, 56.2, -45, 0.55)}
      ${leafPair(52.8, 56.2, 45, 0.55)}
      ${
        enLine2
          ? `<text x="36.0" y="54.5" text-anchor="middle" fill="${forestGreen}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>
             <text x="36.0" y="57.4" text-anchor="middle" fill="${forestGreen}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine2)}</text>`
          : `<text x="36.0" y="55.9" text-anchor="middle" fill="${forestGreen}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>`
      }
      <!-- Soft Blush Petal Banner (Arabic Copy) -->
      <path d="M 20.5 59.8 L 51.5 59.8 Q 52.8 63.3 51.5 66.8 L 20.5 66.8 Q 19.2 63.3 20.5 59.8 Z" fill="#FCE2D4" />
      ${
        arLine1
          ? arLine2
            ? `<text x="36.0" y="62.7" dir="rtl" text-anchor="middle" fill="${forestGreen}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>
               <text x="36.0" y="65.7" dir="rtl" text-anchor="middle" fill="${forestGreen}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine2)}</text>`
            : `<text x="36.0" y="64.2" dir="rtl" text-anchor="middle" fill="${forestGreen}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>`
          : ''
      }
    `;

    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: Number((qrBoxX + 1.8).toFixed(2)),
      y: Number((qrBoxY + 1.8).toFixed(2)),
      size: Number((qrBoxW - 3.6).toFixed(2)),
      darkColor: '#0B121C',
      finderColor: '#0B121C',
      centerDotColor: '#0B121C',
      bgColor: '#FFFFFF',
      cornerRadius: 0.7,
    });

    return {
      w,
      h,
      bleedMm,
      safeMarginMm,
      style,
      serial,
      cutPath,
      backgroundLayer,
      artworkLayer: '',
      decorativeLayer,
      accentLayer,
      brandLogoLayer,
      qrContainerLayer,
      borderLayer,
      typographyLayer,
      qrLayer,
    };
  }

  if (style === 'mono_mark') {
    const inkNavy = primary || '#0D1B2A';
    const pureWhite = secondary || '#F8FAFC';
    const amber = accent || '#FFB800';

    const rawEnglish = (options.calloutText ?? 'Scan to Contact the Owner').trim();
    const rawArabic = (options.customSubLabel ?? 'امسح الرمز للتواصل مع المالك').trim();
    const [enLine1, enLine2] = splitCenteredTwoLines(rawEnglish, 16);
    const [arLine1, arLine2] = splitCenteredTwoLines(rawArabic, 16);
    const enFontSize = rawEnglish.length > 28 ? 2.15 : 2.5;
    const arFontSize = rawArabic.length > 32 ? 2.25 : 2.65;

    const innerHex = buildRoundedPolygonPath(
      [
        [w * 0.5, 4.3],
        [w - 4.4, h * 0.268],
        [w - 4.4, h * 0.732],
        [w * 0.5, h - 4.3],
        [4.4, h * 0.732],
        [4.4, h * 0.268],
      ],
      2.6
    );

    const backgroundLayer = `
      <!-- Ink Navy Bleed Base with Crisp Architectural White Inner Hex -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${isTransparentStock ? 'rgba(13,27,42,0.88)' : inkNavy}" />
      <path d="${innerHex}" fill="${pureWhite}" />
    `;

    const decorativeLayer = `
      <!-- Subtle Architectural Diagonal Hairlines -->
      <g stroke="#CBD5E1" stroke-width="0.42" opacity="0.34">
        <line x1="6" y1="26" x2="26" y2="10" />
        <line x1="8" y1="33" x2="35" y2="11" />
        <line x1="12" y1="60" x2="54" y2="24" />
        <line x1="22" y1="64" x2="58" y2="33" />
      </g>
      <!-- Diagonal Geometric Ribbons (Upper Right, Left Mid, Right Lower) -->
      <polygon points="34.0,0 41.2,0 56.5,14.8 49.0,14.8" fill="${amber}" />
      <polygon points="41.2,0 46.8,0 60.5,13.5 56.5,14.8" fill="${inkNavy}" />
      <polygon points="2.5,41.8 18.2,28.5 18.2,32.2 2.5,45.5" fill="${amber}" />
      <polygon points="2.5,45.5 18.2,32.2 18.2,37.8 2.5,51.2" fill="${inkNavy}" />
      <polygon points="46.8,44.2 61.5,31.5 61.5,37.2 46.8,49.8" fill="${inkNavy}" />
      <polygon points="46.8,49.8 61.5,37.2 61.5,41.5 46.8,54.2" fill="${amber}" />
    `;

    const accentLayer = `
      <!-- Signature 3 Amber Rays Beside FindIt QR Bubble -->
      <rect x="44.2" y="13.2" width="2.4" height="0.88" rx="0.44" fill="${amber}" transform="rotate(-34 45.4 13.6)" />
      <rect x="44.9" y="15.8" width="2.6" height="0.88" rx="0.44" fill="${amber}" />
      <rect x="44.2" y="18.4" width="2.4" height="0.88" rx="0.44" fill="${amber}" transform="rotate(34 45.4 18.8)" />
    `;

    const brandLogoLayer = `
      <g id="mono-findit-logo" data-brand-signature="findit-qr">
        <text x="26.0" y="18.2" text-anchor="middle" fill="${inkNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="4.7" font-weight="900" letter-spacing="-0.18">FindIt</text>
        <g transform="translate(38.6, 16.2)">
          <path d="M -3.4 -2.7 H 2.9 Q 3.8 -2.7 3.8 -1.8 V 1.6 Q 3.8 2.5 2.9 2.5 H -0.2 L -2.3 4.2 V 2.5 H -3.4 Q -4.3 2.5 -4.3 1.6 V -1.8 Q -4.3 -2.7 -3.4 -2.7 Z" fill="${amber}" />
          <text x="-0.2" y="0.95" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="2.65" font-weight="900">QR</text>
        </g>
      </g>
    `;

    const qrBoxW = 25.0;
    const qrBoxX = (w - qrBoxW) / 2;
    const qrBoxY = 21.8;
    const qrContainerLayer = `
      <!-- Clean White QR Pad with Dual-Tone Navy & Amber Rounded Corner Brackets -->
      <rect x="${qrBoxX.toFixed(2)}" y="${qrBoxY.toFixed(2)}" width="${qrBoxW.toFixed(2)}" height="${qrBoxW.toFixed(2)}" rx="2.4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="0.32" />
      <path d="M ${(qrBoxX - 1.1).toFixed(2)} ${(qrBoxY + 5.2).toFixed(2)} L ${(qrBoxX - 1.1).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)} Q ${(qrBoxX - 1.1).toFixed(2)} ${(qrBoxY - 1.1).toFixed(2)} ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY - 1.1).toFixed(2)} L ${(qrBoxX + 5.2).toFixed(2)} ${(qrBoxY - 1.1).toFixed(2)}" fill="none" stroke="${inkNavy}" stroke-width="0.82" stroke-linecap="round" />
      <path d="M ${(qrBoxX - 0.3).toFixed(2)} ${(qrBoxY + 4.4).toFixed(2)} L ${(qrBoxX - 0.3).toFixed(2)} ${(qrBoxY + 1.3).toFixed(2)} Q ${(qrBoxX - 0.3).toFixed(2)} ${(qrBoxY - 0.3).toFixed(2)} ${(qrBoxX + 1.3).toFixed(2)} ${(qrBoxY - 0.3).toFixed(2)} L ${(qrBoxX + 4.4).toFixed(2)} ${(qrBoxY - 0.3).toFixed(2)}" fill="none" stroke="${amber}" stroke-width="0.62" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.2).toFixed(2)} ${(qrBoxY - 1.1).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY - 1.1).toFixed(2)} Q ${(qrBoxX + qrBoxW + 1.1).toFixed(2)} ${(qrBoxY - 1.1).toFixed(2)} ${(qrBoxX + qrBoxW + 1.1).toFixed(2)} ${(qrBoxY + 1.1).toFixed(2)} L ${(qrBoxX + qrBoxW + 1.1).toFixed(2)} ${(qrBoxY + 5.2).toFixed(2)}" fill="none" stroke="${inkNavy}" stroke-width="0.82" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 4.4).toFixed(2)} ${(qrBoxY - 0.3).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.3).toFixed(2)} ${(qrBoxY - 0.3).toFixed(2)} Q ${(qrBoxX + qrBoxW + 0.3).toFixed(2)} ${(qrBoxY - 0.3).toFixed(2)} ${(qrBoxX + qrBoxW + 0.3).toFixed(2)} ${(qrBoxY + 1.3).toFixed(2)} L ${(qrBoxX + qrBoxW + 0.3).toFixed(2)} ${(qrBoxY + 4.4).toFixed(2)}" fill="none" stroke="${amber}" stroke-width="0.62" stroke-linecap="round" />
      <path d="M ${(qrBoxX - 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 5.2).toFixed(2)} L ${(qrBoxX - 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)} Q ${(qrBoxX - 1.1).toFixed(2)} ${(qrBoxY + qrBoxW + 1.1).toFixed(2)} ${(qrBoxX + 1.1).toFixed(2)} ${(qrBoxY + qrBoxW + 1.1).toFixed(2)} L ${(qrBoxX + 5.2).toFixed(2)} ${(qrBoxY + qrBoxW + 1.1).toFixed(2)}" fill="none" stroke="${inkNavy}" stroke-width="0.82" stroke-linecap="round" />
      <path d="M ${(qrBoxX - 0.3).toFixed(2)} ${(qrBoxY + qrBoxW - 4.4).toFixed(2)} L ${(qrBoxX - 0.3).toFixed(2)} ${(qrBoxY + qrBoxW - 1.3).toFixed(2)} Q ${(qrBoxX - 0.3).toFixed(2)} ${(qrBoxY + qrBoxW + 0.3).toFixed(2)} ${(qrBoxX + 1.3).toFixed(2)} ${(qrBoxY + qrBoxW + 0.3).toFixed(2)} L ${(qrBoxX + 4.4).toFixed(2)} ${(qrBoxY + qrBoxW + 0.3).toFixed(2)}" fill="none" stroke="${amber}" stroke-width="0.62" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.2).toFixed(2)} ${(qrBoxY + qrBoxW + 1.1).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.1).toFixed(2)} ${(qrBoxY + qrBoxW + 1.1).toFixed(2)} Q ${(qrBoxX + qrBoxW + 1.1).toFixed(2)} ${(qrBoxY + qrBoxW + 1.1).toFixed(2)} ${(qrBoxX + qrBoxW + 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 1.1).toFixed(2)} L ${(qrBoxX + qrBoxW + 1.1).toFixed(2)} ${(qrBoxY + qrBoxW - 5.2).toFixed(2)}" fill="none" stroke="${inkNavy}" stroke-width="0.82" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 4.4).toFixed(2)} ${(qrBoxY + qrBoxW + 0.3).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.3).toFixed(2)} ${(qrBoxY + qrBoxW + 0.3).toFixed(2)} Q ${(qrBoxX + qrBoxW + 0.3).toFixed(2)} ${(qrBoxY + qrBoxW + 0.3).toFixed(2)} ${(qrBoxX + qrBoxW + 0.3).toFixed(2)} ${(qrBoxY + qrBoxW - 1.3).toFixed(2)} L ${(qrBoxX + qrBoxW + 0.3).toFixed(2)} ${(qrBoxY + qrBoxW - 4.4).toFixed(2)}" fill="none" stroke="${amber}" stroke-width="0.62" stroke-linecap="round" />
    `;

    const borderLayer = `
      <!-- Clean Outer Rim Line -->
      <path d="${innerHex}" fill="none" stroke="#FFFFFF" stroke-width="0.55" opacity="0.92" />
    `;

    const typographyLayer = `
      <!-- Minimalist Phone Scan Icon + Divider + English Lockup -->
      <g id="mono-phone-scan-icon" transform="translate(17.5, 52.3)">
        <rect x="-2.1" y="-3.2" width="4.2" height="6.4" rx="0.7" fill="${inkNavy}" />
        <rect x="-1.4" y="-2.2" width="2.8" height="4.0" rx="0.2" fill="#FFFFFF" />
        <path d="M -0.8 -1.4 H -0.2 M 0.8 -1.4 H 0.2 M -0.8 0.8 H -0.2 M 0.8 0.8 H 0.2" stroke="${inkNavy}" stroke-width="0.32" stroke-linecap="round" />
        <line x1="-1.0" y1="-0.3" x2="1.0" y2="-0.3" stroke="${inkNavy}" stroke-width="0.28" />
        <circle cx="0" cy="2.55" r="0.28" fill="#FFFFFF" />
      </g>
      <line x1="21.4" y1="49.2" x2="21.4" y2="55.4" stroke="${inkNavy}" stroke-width="0.4" />
      ${
        enLine2
          ? `<text x="35.6" y="51.6" text-anchor="middle" fill="${inkNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>
             <text x="35.6" y="54.6" text-anchor="middle" fill="${inkNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine2)}</text>`
          : `<text x="35.6" y="53.1" text-anchor="middle" fill="${inkNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>`
      }
      <!-- Bold Signal Amber Arabic Pill -->
      <rect x="14.5" y="57.2" width="35.0" height="7.4" rx="3.7" fill="${amber}" />
      ${
        arLine1
          ? arLine2
            ? `<text x="32.0" y="60.3" dir="rtl" text-anchor="middle" fill="${inkNavy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>
               <text x="32.0" y="63.3" dir="rtl" text-anchor="middle" fill="${inkNavy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine2)}</text>`
            : `<text x="32.0" y="61.8" dir="rtl" text-anchor="middle" fill="${inkNavy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>`
          : ''
      }
    `;

    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: Number((qrBoxX + 1.65).toFixed(2)),
      y: Number((qrBoxY + 1.65).toFixed(2)),
      size: Number((qrBoxW - 3.3).toFixed(2)),
      darkColor: '#0B121C',
      finderColor: '#0B121C',
      centerDotColor: '#0B121C',
      bgColor: '#FFFFFF',
      cornerRadius: 0.7,
    });

    return {
      w,
      h,
      bleedMm,
      safeMarginMm,
      style,
      serial,
      cutPath,
      backgroundLayer,
      artworkLayer: '',
      decorativeLayer,
      accentLayer,
      brandLogoLayer,
      qrContainerLayer,
      borderLayer,
      typographyLayer,
      qrLayer,
    };
  }

  if (style === 'pocket_orbit') {
    const spaceNavy = primary || '#06133D';
    const cyan = secondary || '#00E5FF';
    const rocketOrange = accent || '#FF7A00';
    const starYellow = '#FFD23F';

    const rawEnglish = (options.calloutText ?? 'Scan to Contact the Owner').trim();
    const rawArabic = (options.customSubLabel ?? 'امسح الرمز للتواصل مع المالك').trim();
    const [enLine1, enLine2] = splitCenteredTwoLines(rawEnglish, 16);
    const [arLine1, arLine2] = splitCenteredTwoLines(rawArabic, 16);
    const enFontSize = rawEnglish.length > 28 ? 2.1 : 2.45;
    const arFontSize = rawArabic.length > 32 ? 2.25 : 2.65;

    const fourStar = (cx: number, cy: number, r: number, color: string) =>
      `<path d="M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z" fill="${color}" />`;

    const backgroundLayer = `
      <!-- Deep Cosmic Space Navy Base -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${isTransparentStock ? 'rgba(6,19,61,0.92)' : spaceNavy}" />
      <circle cx="${(w * 0.5).toFixed(2)}" cy="${(h * 0.45).toFixed(2)}" r="34" fill="url(#orbit-space-grad)" />
    `;

    const decorativeLayer = `
      <!-- Sweeping Golden Cream Orbital Ring Wrapping Behind Rocket & Planet -->
      <path d="M 4.5 41.5 C 8.5 52.5, 58.5 48.5, 63.5 32.5 C 66.2 24.5, 57.5 22.0, 48.0 24.5" fill="none" stroke="#FFF3D1" stroke-width="1.35" opacity="0.92" />
      <path d="M 4.5 41.5 C 8.5 52.5, 58.5 48.5, 63.5 32.5" fill="none" stroke="#F59E0B" stroke-width="0.45" opacity="0.7" />
      <!-- Starlight Sparkles -->
      ${fourStar(14.5, 29.0, 2.2, starYellow)}
      ${fourStar(54.2, 54.0, 2.2, starYellow)}
      ${fourStar(41.5, 7.2, 1.5, '#FFFFFF')}
      ${fourStar(19.5, 36.8, 1.25, '#FFFFFF')}
      ${fourStar(51.8, 60.5, 1.45, '#FFFFFF')}
      <circle cx="49.5" cy="10.2" r="0.38" fill="#FFFFFF" opacity="0.85" />
      <circle cx="10.8" cy="24.2" r="0.42" fill="${starYellow}" opacity="0.85" />
      <circle cx="60.5" cy="48.5" r="0.38" fill="#FFFFFF" opacity="0.85" />
      <!-- Bottom Cratered Blue-Purple Moon Horizon -->
      <g id="orbit-bottom-moon">
        <ellipse cx="35.0" cy="73.6" rx="11.2" ry="6.2" fill="#4C63B6" />
        <ellipse cx="35.0" cy="74.4" rx="9.8" ry="5.2" fill="#3B4F9E" />
        <circle cx="29.6" cy="71.4" r="1.2" fill="#2A3A7E" />
        <circle cx="34.2" cy="70.2" r="1.5" fill="#2A3A7E" />
        <circle cx="39.8" cy="71.8" r="1.05" fill="#2A3A7E" />
      </g>
    `;

    const accentLayer = `
      <!-- Top-Left Waving Pocket Orbit Astronaut -->
      <g id="pocket-orbit-astronaut" transform="translate(24.8, 10.6) rotate(-10)">
        <!-- Waving Right Arm & Hand -->
        <path d="M 4.4 2.4 C 6.6 1.8, 8.2 0.2, 9.2 -1.2" fill="none" stroke="#FFFFFF" stroke-width="2.1" stroke-linecap="round" />
        <circle cx="9.6" cy="-1.6" r="1.05" fill="#FFFFFF" />
        <!-- Left Arm -->
        <path d="M -4.2 3.8 C -6.4 5.2, -7.8 6.8, -8.5 8.4" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" />
        <!-- Rounded Space Suit Body & Backpack -->
        <rect x="-4.5" y="2.0" width="9.0" height="4.8" rx="2.4" fill="#E2E8F0" />
        <!-- Helmet -->
        <ellipse cx="0" cy="-1.4" rx="5.3" ry="4.9" fill="#FFFFFF" stroke="#94A3B8" stroke-width="0.35" />
        <ellipse cx="-5.1" cy="-1.2" rx="0.9" ry="1.6" fill="#CBD5E1" />
        <ellipse cx="0.2" cy="-1.2" rx="3.9" ry="3.3" fill="#071A4B" stroke="${cyan}" stroke-width="0.32" />
        <path d="M -2.2 -2.6 Q -0.6 -3.8 1.5 -3.1" fill="none" stroke="#38BDF8" stroke-width="0.55" stroke-linecap="round" opacity="0.85" />
      </g>
      <!-- Lower-Left Ringed Purple Planet -->
      <g transform="translate(15.2, 48.2)">
        <circle cx="0" cy="0" r="4.1" fill="#7E3AF2" />
        <circle cx="-1.3" cy="-1.3" r="1.2" fill="#A855F7" opacity="0.65" />
        <ellipse cx="0" cy="0.2" rx="6.4" ry="1.4" transform="rotate(-18)" fill="none" stroke="${starYellow}" stroke-width="0.95" />
      </g>
      <!-- Right Launching White/Orange-Nose Rocket -->
      <g id="orbit-rocket" transform="translate(55.4, 31.2) rotate(36)">
        <!-- Exhaust Flame -->
        <path d="M -1.5 4.2 C -1.8 7.4, -0.4 9.5, 0 11.2 C 0.4 9.5, 1.8 7.4, 1.5 4.2 Z" fill="${rocketOrange}" />
        <path d="M -0.8 4.2 C -0.8 6.5, 0 8.2, 0 8.2 C 0 8.2, 0.8 6.5, 0.8 4.2 Z" fill="${starYellow}" />
        <!-- Fins -->
        <path d="M -2.2 1.8 L -4.4 4.4 L -1.6 3.8 Z" fill="#EF4444" />
        <path d="M 2.2 1.8 L 4.4 4.4 L 1.6 3.8 Z" fill="#EF4444" />
        <!-- Rocket Fuselage -->
        <path d="M 0 -5.8 C 2.4 -3.2, 2.7 1.4, 1.8 4.2 L -1.8 4.2 C -2.7 1.4, -2.4 -3.2, 0 -5.8 Z" fill="#F8FAFC" />
        <path d="M 0 -5.8 C 1.2 -4.5, 1.8 -3.0, 2.0 -2.0 L -2.0 -2.0 C -1.8 -3.0, -1.2 -4.5, 0 -5.8 Z" fill="#EF4444" />
        <circle cx="0" cy="0.1" r="1.35" fill="#1E3A8A" stroke="${cyan}" stroke-width="0.35" />
      </g>
    `;

    const brandLogoLayer = `
      <g id="orbit-findit-logo" data-brand-signature="findit-qr">
        <text x="27.8" y="21.5" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="4.65" font-weight="900" letter-spacing="-0.16">FindIt</text>
        <g transform="translate(40.2, 19.6)">
          <path d="M -3.3 -2.6 H 2.8 Q 3.6 -2.6 3.6 -1.8 V 1.6 Q 3.6 2.4 2.8 2.4 H -0.2 L -2.2 4.1 V 2.4 H -3.3 Q -4.1 2.4 -4.1 1.6 V -1.8 Q -4.1 -2.6 -3.3 -2.6 Z" fill="${rocketOrange}" />
          <text x="-0.2" y="0.95" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="2.6" font-weight="900">QR</text>
        </g>
        <rect x="45.6" y="16.4" width="2.4" height="0.88" rx="0.44" fill="${starYellow}" transform="rotate(-34 46.8 16.8)" />
        <rect x="46.4" y="19.1" width="2.6" height="0.88" rx="0.44" fill="${starYellow}" />
        <rect x="45.6" y="21.8" width="2.4" height="0.88" rx="0.44" fill="${starYellow}" transform="rotate(34 46.8 22.2)" />
      </g>
    `;

    const qrBoxW = 24.4;
    const qrBoxX = (w - qrBoxW) / 2;
    const qrBoxY = 24.8;
    const qrContainerLayer = `
      <!-- Clean White Cosmic QR Frame with Electric Cyan Corner Brackets -->
      <rect x="${qrBoxX.toFixed(2)}" y="${qrBoxY.toFixed(2)}" width="${qrBoxW.toFixed(2)}" height="${qrBoxW.toFixed(2)}" rx="2.6" fill="#FFFFFF" />
      <path d="M ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 5.0).toFixed(2)} L ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 2.0).toFixed(2)} Q ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} ${(qrBoxX + 2.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} L ${(qrBoxX + 5.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)}" fill="none" stroke="${cyan}" stroke-width="0.72" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 2.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 5.0).toFixed(2)}" fill="none" stroke="${cyan}" stroke-width="0.72" stroke-linecap="round" />
      <path d="M ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 5.0).toFixed(2)} L ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 2.0).toFixed(2)} Q ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} ${(qrBoxX + 2.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} L ${(qrBoxX + 5.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)}" fill="none" stroke="${cyan}" stroke-width="0.72" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 2.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 5.0).toFixed(2)}" fill="none" stroke="${cyan}" stroke-width="0.72" stroke-linecap="round" />
    `;

    const borderLayer = `
      <!-- Glowing Electric Cyan Inner Crest Frame -->
      <path d="${cutPath}" fill="none" stroke="${cyan}" stroke-width="1.35" opacity="0.92" />
    `;

    const typographyLayer = `
      <!-- White Pill: Phone Scan Icon + English Copy -->
      <rect x="17.2" y="50.6" width="35.6" height="7.4" rx="3.7" fill="#FFFFFF" />
      <rect x="19.6" y="52.0" width="4.4" height="4.6" rx="1.1" fill="${spaceNavy}" />
      <path d="M 21.0 53.2 C 20.8 54.4, 21.8 55.4, 22.8 55.2" fill="none" stroke="#FFFFFF" stroke-width="0.48" stroke-linecap="round" />
      ${
        enLine2
          ? `<text x="38.2" y="53.6" text-anchor="middle" fill="${spaceNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>
             <text x="38.2" y="56.5" text-anchor="middle" fill="${spaceNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine2)}</text>`
          : `<text x="38.2" y="55.1" text-anchor="middle" fill="${spaceNavy}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>`
      }
      <!-- Starlight Gold Arabic Pill -->
      <rect x="19.2" y="59.0" width="31.6" height="7.2" rx="3.6" fill="${starYellow}" />
      ${
        arLine1
          ? arLine2
            ? `<text x="35.0" y="62.0" dir="rtl" text-anchor="middle" fill="${spaceNavy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>
               <text x="35.0" y="65.0" dir="rtl" text-anchor="middle" fill="${spaceNavy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine2)}</text>`
            : `<text x="35.0" y="63.5" dir="rtl" text-anchor="middle" fill="${spaceNavy}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>`
          : ''
      }
    `;

    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: Number((qrBoxX + 1.65).toFixed(2)),
      y: Number((qrBoxY + 1.65).toFixed(2)),
      size: Number((qrBoxW - 3.3).toFixed(2)),
      darkColor: '#0B121C',
      finderColor: '#0B121C',
      centerDotColor: '#0B121C',
      bgColor: '#FFFFFF',
      cornerRadius: 0.7,
    });

    return {
      w,
      h,
      bleedMm,
      safeMarginMm,
      style,
      serial,
      cutPath,
      backgroundLayer,
      artworkLayer: '',
      decorativeLayer,
      accentLayer,
      brandLogoLayer,
      qrContainerLayer,
      borderLayer,
      typographyLayer,
      qrLayer,
    };
  }

  if (style === 'astro_buddy') {
    const indigo = primary || '#100C42';
    const nebulaBlue = secondary || '#3B82F6';
    const solarGold = accent || '#FFD000';

    const rawEnglish = (options.calloutText ?? 'Scan to Contact the Owner').trim();
    const rawArabic = (options.customSubLabel ?? 'امسح الرمز للتواصل مع المالك').trim();
    const [enLine1, enLine2] = splitCenteredTwoLines(rawEnglish, 16);
    const [arLine1, arLine2] = splitCenteredTwoLines(rawArabic, 16);
    const enFontSize = rawEnglish.length > 28 ? 2.1 : 2.45;
    const arFontSize = rawArabic.length > 32 ? 2.25 : 2.65;

    const fourStar = (cx: number, cy: number, r: number, color: string) =>
      `<path d="M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z" fill="${color}" />`;

    const backgroundLayer = `
      <!-- Deep Indigo Nebula Base (Clean Solid Top Crest, Zero Hardware Holes) -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${isTransparentStock ? 'rgba(16,12,66,0.92)' : indigo}" />
      <circle cx="${(w * 0.5).toFixed(2)}" cy="${(h * 0.44).toFixed(2)}" r="34" fill="url(#astro-indigo-grad)" />
    `;

    const decorativeLayer = `
      <!-- Diagonal Orbital Trajectory Arc -->
      <path d="M 5.8 54.5 C 18.5 64.5, 58.0 54.5, 65.5 34.5" fill="none" stroke="${nebulaBlue}" stroke-width="1.2" opacity="0.88" />
      <path d="M 7.2 55.8 C 19.5 63.8, 56.2 54.5, 63.8 35.5" fill="none" stroke="#FFFFFF" stroke-width="0.45" opacity="0.78" />
      <!-- Bottom Glowing Nebula Cloud Banks -->
      <g id="astro-nebula-clouds">
        <path d="M 10.5 73.5 C 11.5 67.8, 17.5 66.2, 22.8 68.5 C 26.2 64.2, 34.5 64.5, 38.2 68.5 C 43.2 65.5, 52.5 66.8, 57.5 72.5 L 57.5 78.0 L 10.5 78.0 Z" fill="${nebulaBlue}" opacity="0.88" />
        <path d="M 18.5 75.0 C 21.5 70.0, 28.5 69.2, 33.8 71.8 C 38.8 68.2, 48.2 69.5, 52.8 74.5 Z" fill="#8B5CF6" opacity="0.82" />
      </g>
      <!-- Four-Point Starlight Accents -->
      ${fourStar(17.5, 19.2, 2.0, solarGold)}
      ${fourStar(26.2, 10.4, 2.2, solarGold)}
      ${fourStar(55.8, 24.8, 1.85, solarGold)}
      ${fourStar(58.5, 55.2, 1.35, '#FFFFFF')}
      <circle cx="13.5" cy="61.2" r="1.15" fill="${solarGold}" />
      <circle cx="57.2" cy="43.8" r="1.25" fill="${solarGold}" />
    `;

    const accentLayer = `
      <!-- Top-Right Blue Ringed Saturn Planet -->
      <g id="astro-blue-saturn" transform="translate(47.2, 10.2)">
        <circle cx="0" cy="0" r="5.1" fill="${nebulaBlue}" />
        <path d="M -3.8 -1.8 Q 0 -3.2 3.8 -1.8" fill="none" stroke="#93C5FD" stroke-width="0.95" opacity="0.7" />
        <ellipse cx="0" cy="0.3" rx="8.8" ry="2.0" transform="rotate(-14)" fill="none" stroke="${solarGold}" stroke-width="1.25" />
      </g>
      <!-- Lower-Left Cratered Purple Moon -->
      <g id="astro-purple-moon" transform="translate(13.8, 49.0)">
        <circle cx="0" cy="0" r="9.4" fill="url(#astro-moon-grad)" />
        <circle cx="-3.8" cy="-2.2" r="1.8" fill="#4338CA" opacity="0.65" />
        <circle cx="2.5" cy="1.8" r="2.2" fill="#4338CA" opacity="0.65" />
        <circle cx="-1.5" cy="4.4" r="1.35" fill="#4338CA" opacity="0.65" />
        <circle cx="4.8" cy="-3.4" r="1.15" fill="#4338CA" opacity="0.65" />
      </g>
      <!-- Thumbs-Up Seated Astronaut on Purple Moon -->
      <g id="astro-buddy-astronaut" transform="translate(13.8, 35.6)">
        <!-- Oxygen Pack & Yellow Trim -->
        <rect x="-4.4" y="0.5" width="2.4" height="5.4" rx="1.1" fill="${solarGold}" />
        <!-- Spacesuit Torso w/ Yellow QR Chest Badge -->
        <rect x="-3.4" y="1.2" width="6.8" height="6.2" rx="2.0" fill="#F8FAFC" stroke="#1E1B4B" stroke-width="0.35" />
        <rect x="-1.5" y="2.8" width="3.0" height="2.4" rx="0.5" fill="${solarGold}" />
        <text x="0" y="4.5" text-anchor="middle" fill="#1E1B4B" font-family="Arial, sans-serif" font-size="1.45" font-weight="900">QR</text>
        <!-- Thumbs-Up Right Hand -->
        <path d="M 3.2 3.2 L 5.6 2.0 L 5.6 0.4" fill="none" stroke="#F8FAFC" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Legs Seated on Moon Rim -->
        <ellipse cx="-2.4" cy="7.6" rx="1.8" ry="1.1" fill="#E2E8F0" />
        <ellipse cx="2.4" cy="7.6" rx="1.8" ry="1.1" fill="#E2E8F0" />
        <!-- Helmet -->
        <ellipse cx="0" cy="-2.4" rx="4.4" ry="4.1" fill="#FFFFFF" stroke="#94A3B8" stroke-width="0.35" />
        <ellipse cx="0.5" cy="-2.3" rx="3.2" ry="2.7" fill="#091540" stroke="${nebulaBlue}" stroke-width="0.3" />
        <path d="M -1.4 -3.4 Q 0 -4.2 1.6 -3.6" fill="none" stroke="#60A5FA" stroke-width="0.45" stroke-linecap="round" />
      </g>
      <!-- Right Yellow-Nose White Rocket -->
      <g id="astro-yellow-rocket" transform="translate(55.4, 34.4) rotate(36)">
        <path d="M -1.5 4.4 C -1.8 7.6, -0.4 9.8, 0 11.4 C 0.4 9.8, 1.8 7.6, 1.5 4.4 Z" fill="#F97316" />
        <path d="M -0.8 4.4 C -0.8 6.8, 0 8.4, 0 8.4 C 0 8.4, 0.8 6.8, 0.8 4.4 Z" fill="${solarGold}" />
        <path d="M -2.2 1.8 L -4.4 4.4 L -1.6 3.8 Z" fill="${solarGold}" />
        <path d="M 2.2 1.8 L 4.4 4.4 L 1.6 3.8 Z" fill="${solarGold}" />
        <path d="M 0 -5.8 C 2.4 -3.2, 2.7 1.4, 1.8 4.4 L -1.8 4.4 C -2.7 1.4, -2.4 -3.2, 0 -5.8 Z" fill="#F8FAFC" />
        <path d="M 0 -5.8 C 1.2 -4.5, 1.8 -3.0, 2.0 -2.0 L -2.0 -2.0 C -1.8 -3.0, -1.2 -4.5, 0 -5.8 Z" fill="${solarGold}" />
        <circle cx="0" cy="0.2" r="1.35" fill="${nebulaBlue}" stroke="#E2E8F0" stroke-width="0.35" />
      </g>
    `;

    const brandLogoLayer = `
      <g id="astro-findit-logo" data-brand-signature="findit-qr">
        <text x="27.2" y="20.2" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="4.65" font-weight="900" letter-spacing="-0.16">FindIt</text>
        <g transform="translate(39.6, 18.2)">
          <path d="M -3.3 -2.6 H 2.8 Q 3.6 -2.6 3.6 -1.8 V 1.6 Q 3.6 2.4 2.8 2.4 H -0.2 L -2.2 4.1 V 2.4 H -3.3 Q -4.1 2.4 -4.1 1.6 V -1.8 Q -4.1 -2.6 -3.3 -2.6 Z" fill="${solarGold}" />
          <text x="-0.2" y="0.95" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="2.6" font-weight="900">QR</text>
        </g>
        <rect x="44.8" y="15.0" width="2.4" height="0.88" rx="0.44" fill="${solarGold}" transform="rotate(-34 46.0 15.4)" />
        <rect x="45.6" y="17.7" width="2.6" height="0.88" rx="0.44" fill="${solarGold}" />
        <rect x="44.8" y="20.4" width="2.4" height="0.88" rx="0.44" fill="${solarGold}" transform="rotate(34 46.0 20.8)" />
      </g>
    `;

    const qrBoxW = 24.4;
    const qrBoxX = (w - qrBoxW) / 2;
    const qrBoxY = 23.4;
    const qrContainerLayer = `
      <!-- Clean White QR Pad with Gold Corner Brackets -->
      <rect x="${qrBoxX.toFixed(2)}" y="${qrBoxY.toFixed(2)}" width="${qrBoxW.toFixed(2)}" height="${qrBoxW.toFixed(2)}" rx="2.6" fill="#FFFFFF" />
      <path d="M ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 5.0).toFixed(2)} L ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 2.0).toFixed(2)} Q ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} ${(qrBoxX + 2.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} L ${(qrBoxX + 5.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)}" fill="none" stroke="${solarGold}" stroke-width="0.72" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 2.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 5.0).toFixed(2)}" fill="none" stroke="${solarGold}" stroke-width="0.72" stroke-linecap="round" />
      <path d="M ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 5.0).toFixed(2)} L ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 2.0).toFixed(2)} Q ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} ${(qrBoxX + 2.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} L ${(qrBoxX + 5.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)}" fill="none" stroke="${solarGold}" stroke-width="0.72" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 2.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 5.0).toFixed(2)}" fill="none" stroke="${solarGold}" stroke-width="0.72" stroke-linecap="round" />
    `;

    const borderLayer = `
      <!-- Clean Outer Sticker Rim (Hole-Free Top Arch) -->
      <path d="${cutPath}" fill="none" stroke="#FFFFFF" stroke-width="1.35" opacity="0.92" />
    `;

    const typographyLayer = `
      <!-- White Pill: Phone Scan Icon + Divider + English Lockup -->
      <rect x="16.2" y="49.4" width="37.6" height="7.4" rx="3.7" fill="#FFFFFF" />
      <g transform="translate(21.4, 53.1)">
        <rect x="-1.8" y="-2.7" width="3.6" height="5.4" rx="0.6" fill="${indigo}" />
        <rect x="-1.2" y="-1.8" width="2.4" height="3.2" fill="#FFFFFF" />
        <line x1="2.9" y1="-2.3" x2="2.9" y2="2.3" stroke="${indigo}" stroke-width="0.35" />
      </g>
      ${
        enLine2
          ? `<text x="38.2" y="52.4" text-anchor="middle" fill="${indigo}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>
             <text x="38.2" y="55.3" text-anchor="middle" fill="${indigo}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine2)}</text>`
          : `<text x="38.2" y="53.9" text-anchor="middle" fill="${indigo}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>`
      }
      <!-- Gold Arabic Contact Pill -->
      <rect x="18.2" y="57.8" width="33.6" height="7.2" rx="3.6" fill="${solarGold}" />
      ${
        arLine1
          ? arLine2
            ? `<text x="35.0" y="60.8" dir="rtl" text-anchor="middle" fill="${indigo}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>
               <text x="35.0" y="63.8" dir="rtl" text-anchor="middle" fill="${indigo}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine2)}</text>`
            : `<text x="35.0" y="62.3" dir="rtl" text-anchor="middle" fill="${indigo}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>`
          : ''
      }
    `;

    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: Number((qrBoxX + 1.65).toFixed(2)),
      y: Number((qrBoxY + 1.65).toFixed(2)),
      size: Number((qrBoxW - 3.3).toFixed(2)),
      darkColor: '#0B121C',
      finderColor: '#0B121C',
      centerDotColor: '#0B121C',
      bgColor: '#FFFFFF',
      cornerRadius: 0.7,
    });

    return {
      w,
      h,
      bleedMm,
      safeMarginMm,
      style,
      serial,
      cutPath,
      backgroundLayer,
      artworkLayer: '',
      decorativeLayer,
      accentLayer,
      brandLogoLayer,
      qrContainerLayer,
      borderLayer,
      typographyLayer,
      qrLayer,
    };
  }

  if (style === 'campus_bloom') {
    const campusTeal = primary || '#007B83';
    const parchmentCream = secondary || '#FAF4E6';
    const blossomPink = accent || '#F48FB1';
    const leafSage = '#68B684';

    const rawEnglish = (options.calloutText ?? 'Scan to Contact the Owner').trim();
    const rawArabic = (options.customSubLabel ?? 'امسح الرمز للتواصل مع المالك').trim();
    const [enLine1, enLine2] = splitCenteredTwoLines(rawEnglish, 16);
    const [arLine1, arLine2] = splitCenteredTwoLines(rawArabic, 16);
    const enFontSize = rawEnglish.length > 28 ? 2.1 : 2.5;
    const arFontSize = rawArabic.length > 32 ? 2.25 : 2.65;

    const innerSegs = getCampusBloomSegments(w - 5.2, h - 5.2);
    const fmtShift = (pt: [number, number]) => `${(pt[0] + 2.6).toFixed(3)} ${(pt[1] + 2.6).toFixed(3)}`;
    const innerCloudPath = [
      `M ${fmtShift(innerSegs[0].p0)}`,
      ...innerSegs.map((s) => `C ${fmtShift(s.c1)}, ${fmtShift(s.c2)}, ${fmtShift(s.p1)}`),
      'Z',
    ].join(' ');

    const smallFlower = (cx: number, cy: number, r: number, color: string) => {
      const petals = [0, 72, 144, 216, 288]
        .map(
          (ang) =>
            `<ellipse cx="0" cy="${(-r * 0.95).toFixed(2)}" rx="${(r * 0.55).toFixed(2)}" ry="${(r * 0.85).toFixed(2)}" fill="${color}" transform="rotate(${ang})" />`
        )
        .join('');
      return `<g transform="translate(${cx.toFixed(2)}, ${cy.toFixed(2)})">${petals}<circle cx="0" cy="0" r="${(r * 0.45).toFixed(2)}" fill="#FBBF24" /></g>`;
    };

    const backgroundLayer = `
      <!-- Warm Campus Parchment Base -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${isTransparentStock ? 'rgba(250,244,230,0.92)' : parchmentCream}" />
    `;

    const borderLayer = `
      <path d="${innerCloudPath}" fill="none" stroke="${campusTeal}" stroke-width="0.65" opacity="0.92" />
      <path d="${innerCloudPath}" fill="none" stroke="${blossomPink}" stroke-width="0.28" stroke-dasharray="1.4 1.0" opacity="0.7" />
    `;

    const decorativeLayer = `
      <!-- Pastel Botanical Sprigs & Florals -->
      <path d="M 11.5 28.0 Q 9.5 34.5 11.2 40.5" fill="none" stroke="${leafSage}" stroke-width="0.45" />
      <ellipse cx="9.6" cy="32.2" rx="1.2" ry="2.2" transform="rotate(-35 9.6 32.2)" fill="${leafSage}" />
      <ellipse cx="12.5" cy="36.2" rx="1.1" ry="2.0" transform="rotate(32 12.5 36.2)" fill="${leafSage}" />
      ${smallFlower(12.2, 27.2, 2.2, blossomPink)}
      ${smallFlower(61.5, 58.2, 2.3, blossomPink)}
      ${smallFlower(15.2, 62.5, 2.0, '#A855F7')}
    `;

    const accentLayer = `
      <!-- Top-Left Teal Campus Backpack -->
      <g id="campus-backpack" transform="translate(13.8, 17.8) rotate(-8)">
        <path d="M -2.2 -3.8 C -2.2 -5.4, 2.2 -5.4, 2.2 -3.8" fill="none" stroke="${campusTeal}" stroke-width="0.85" />
        <rect x="-4.0" y="-3.8" width="8.0" height="8.8" rx="2.2" fill="${campusTeal}" />
        <rect x="-2.8" y="-0.2" width="5.6" height="3.8" rx="1.1" fill="#2DD4BF" />
        <line x1="-2.2" y1="0.8" x2="2.2" y2="0.8" stroke="#FFFFFF" stroke-width="0.4" />
      </g>
      <!-- Top-Right Spiral Notebook & Pen -->
      <g id="campus-notebook" transform="translate(59.8, 19.2) rotate(10)">
        <rect x="-3.8" y="-4.6" width="7.6" height="9.2" rx="0.9" fill="#FFFBEB" stroke="${campusTeal}" stroke-width="0.45" />
        <rect x="-3.8" y="-4.6" width="1.8" height="9.2" rx="0.4" fill="${blossomPink}" />
        <line x1="-0.8" y1="-2.2" x2="2.4" y2="-2.2" stroke="${campusTeal}" stroke-width="0.35" />
        <line x1="-0.8" y1="0" x2="2.4" y2="0" stroke="${campusTeal}" stroke-width="0.35" />
        <line x1="-0.8" y1="2.2" x2="1.8" y2="2.2" stroke="${campusTeal}" stroke-width="0.35" />
        <rect x="4.6" y="-4.0" width="1.1" height="7.4" rx="0.4" fill="${campusTeal}" />
      </g>
      <!-- Mid-Left Warm Coffee Mug with Steam -->
      <g id="campus-coffee-mug" transform="translate(11.8, 49.2)">
        <path d="M -1.4 -4.5 Q -1.8 -5.8 -1.0 -6.8 M 0.8 -4.5 Q 0.4 -5.8 1.2 -6.8" fill="none" stroke="${campusTeal}" stroke-width="0.38" stroke-linecap="round" />
        <path d="M 3.0 -1.8 C 4.8 -1.8, 4.8 1.4, 3.0 1.4" fill="none" stroke="${blossomPink}" stroke-width="0.85" />
        <rect x="-3.2" y="-3.2" width="6.4" height="6.4" rx="1.1" fill="${blossomPink}" />
        <rect x="-2.4" y="-1.8" width="4.8" height="3.2" rx="0.5" fill="#FFFFFF" opacity="0.85" />
      </g>
      <!-- Mid-Right Wireless Headphones -->
      <g id="campus-headphones" transform="translate(61.5, 43.2) rotate(12)">
        <path d="M -3.8 1.8 V -0.8 A 3.8 3.8 0 0 1 3.8 -0.8 V 1.8" fill="none" stroke="#8B5CF6" stroke-width="1.1" stroke-linecap="round" />
        <rect x="-4.6" y="0.6" width="1.8" height="3.4" rx="0.8" fill="${campusTeal}" />
        <rect x="2.8" y="0.6" width="1.8" height="3.4" rx="0.8" fill="${campusTeal}" />
      </g>
    `;

    const brandLogoLayer = `
      <g id="campus-findit-logo" data-brand-signature="findit-qr">
        <text x="29.0" y="20.4" text-anchor="middle" fill="${campusTeal}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="4.7" font-weight="900" letter-spacing="-0.16">FindIt</text>
        <g transform="translate(41.4, 18.4)">
          <path d="M -3.3 -2.6 H 2.8 Q 3.6 -2.6 3.6 -1.8 V 1.6 Q 3.6 2.4 2.8 2.4 H -0.2 L -2.2 4.1 V 2.4 H -3.3 Q -4.1 2.4 -4.1 1.6 V -1.8 Q -4.1 -2.6 -3.3 -2.6 Z" fill="${blossomPink}" />
          <text x="-0.2" y="0.95" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="2.6" font-weight="900">QR</text>
        </g>
      </g>
    `;

    const qrBoxW = 26.2;
    const qrBoxX = (w - qrBoxW) / 2;
    const qrBoxY = 23.6;
    const qrContainerLayer = `
      <rect x="${qrBoxX.toFixed(2)}" y="${qrBoxY.toFixed(2)}" width="${qrBoxW.toFixed(2)}" height="${qrBoxW.toFixed(2)}" rx="2.6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="0.35" />
      <path d="M ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 5.2).toFixed(2)} L ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 2.0).toFixed(2)} Q ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} ${(qrBoxX + 2.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} L ${(qrBoxX + 5.2).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)}" fill="none" stroke="${campusTeal}" stroke-width="0.7" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.2).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 2.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 5.2).toFixed(2)}" fill="none" stroke="${campusTeal}" stroke-width="0.7" stroke-linecap="round" />
      <path d="M ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 5.2).toFixed(2)} L ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 2.0).toFixed(2)} Q ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} ${(qrBoxX + 2.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} L ${(qrBoxX + 5.2).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)}" fill="none" stroke="${campusTeal}" stroke-width="0.7" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.2).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 2.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 5.2).toFixed(2)}" fill="none" stroke="${campusTeal}" stroke-width="0.7" stroke-linecap="round" />
    `;

    const typographyLayer = `
      <rect x="18.2" y="52.0" width="37.6" height="7.4" rx="3.7" fill="#D1FAE5" />
      ${
        enLine2
          ? `<text x="37.0" y="55.0" text-anchor="middle" fill="${campusTeal}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>
             <text x="37.0" y="57.9" text-anchor="middle" fill="${campusTeal}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine2)}</text>`
          : `<text x="37.0" y="56.5" text-anchor="middle" fill="${campusTeal}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>`
      }
      <rect x="20.2" y="60.4" width="33.6" height="7.4" rx="3.7" fill="#FCE7F3" />
      ${
        arLine1
          ? arLine2
            ? `<text x="37.0" y="63.4" dir="rtl" text-anchor="middle" fill="${campusTeal}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>
               <text x="37.0" y="66.4" dir="rtl" text-anchor="middle" fill="${campusTeal}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine2)}</text>`
            : `<text x="37.0" y="64.9" dir="rtl" text-anchor="middle" fill="${campusTeal}" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>`
          : ''
      }
    `;

    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: Number((qrBoxX + 1.75).toFixed(2)),
      y: Number((qrBoxY + 1.75).toFixed(2)),
      size: Number((qrBoxW - 3.5).toFixed(2)),
      darkColor: '#0B121C',
      finderColor: '#0B121C',
      centerDotColor: '#0B121C',
      bgColor: '#FFFFFF',
      cornerRadius: 0.7,
    });

    return {
      w,
      h,
      bleedMm,
      safeMarginMm,
      style,
      serial,
      cutPath,
      backgroundLayer,
      artworkLayer: '',
      decorativeLayer,
      accentLayer,
      brandLogoLayer,
      qrContainerLayer,
      borderLayer,
      typographyLayer,
      qrLayer,
    };
  }

  if (style === 'game_mode') {
    const midnight = primary || '#120E2C';
    const neonCyan = secondary || '#00E5FF';
    const neonMagenta = accent || '#FF2E93';
    const neonYellow = '#FFD600';

    const rawEnglish = (options.calloutText ?? 'Scan to Contact the Owner').trim();
    const rawArabic = (options.customSubLabel ?? 'امسح الرمز للتواصل مع المالك').trim();
    const [enLine1, enLine2] = splitCenteredTwoLines(rawEnglish, 16);
    const [arLine1, arLine2] = splitCenteredTwoLines(rawArabic, 16);
    const enFontSize = rawEnglish.length > 28 ? 2.05 : 2.35;
    const arFontSize = rawArabic.length > 32 ? 2.2 : 2.55;

    const backgroundLayer = `
      <!-- Arcade Midnight Base (Clean Hole-Free Headset & Controller Silhouette) -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${isTransparentStock ? 'rgba(18,14,44,0.92)' : midnight}" />
      <circle cx="${(w * 0.5).toFixed(2)}" cy="${(h * 0.45).toFixed(2)}" r="34" fill="url(#game-neon-grad)" />
    `;

    const decorativeLayer = `
      <!-- Subtle Retro Arcade Perspective Grid -->
      <g stroke="${neonCyan}" stroke-width="0.16" opacity="0.18">
        <line x1="6" y1="18" x2="70" y2="18" />
        <line x1="4" y1="30" x2="72" y2="30" />
        <line x1="4" y1="42" x2="72" y2="42" />
        <line x1="6" y1="54" x2="70" y2="54" />
        <line x1="16" y1="6" x2="16" y2="66" />
        <line x1="60" y1="6" x2="60" y2="66" />
      </g>
    `;

    const accentLayer = `
      <!-- Left Tactile D-Pad + Retro Pixel Invader -->
      <g id="game-dpad" transform="translate(13.8, 34.5)">
        <rect x="-1.7" y="-4.6" width="3.4" height="9.2" rx="0.8" fill="#1E1B4B" stroke="${neonCyan}" stroke-width="0.45" />
        <rect x="-4.6" y="-1.7" width="9.2" height="3.4" rx="0.8" fill="#1E1B4B" stroke="${neonCyan}" stroke-width="0.45" />
        <circle cx="0" cy="0" r="1.15" fill="${neonMagenta}" />
      </g>
      <g id="game-pixel-invader" transform="translate(13.8, 49.5)" fill="${neonYellow}">
        <rect x="-2.4" y="-1.2" width="4.8" height="2.4" />
        <rect x="-3.6" y="-0.2" width="7.2" height="1.6" />
        <rect x="-2.4" y="-2.2" width="1.0" height="1.0" />
        <rect x="1.4" y="-2.2" width="1.0" height="1.0" />
        <rect x="-1.6" y="-0.6" width="0.8" height="0.8" fill="${midnight}" />
        <rect x="0.8" y="-0.6" width="0.8" height="0.8" fill="${midnight}" />
      </g>
      <!-- Right PlayStation-Style Action Buttons & Neon Lightning Bolt -->
      <g id="game-action-buttons" transform="translate(62.2, 34.5)">
        <circle cx="0" cy="-3.4" r="1.5" fill="none" stroke="#10B981" stroke-width="0.55" />
        <polygon points="0,-4.4 -1.0,-2.6 1.0,-2.6" fill="none" stroke="#10B981" stroke-width="0.4" />
        <circle cx="3.4" cy="0" r="1.5" fill="none" stroke="${neonMagenta}" stroke-width="0.55" />
        <circle cx="0" cy="3.4" r="1.5" fill="none" stroke="${neonCyan}" stroke-width="0.55" />
        <circle cx="-3.4" cy="0" r="1.5" fill="none" stroke="${neonYellow}" stroke-width="0.55" />
        <rect x="-4.2" y="-0.8" width="1.6" height="1.6" fill="none" stroke="${neonYellow}" stroke-width="0.38" />
      </g>
      <polygon id="game-lightning" points="61.5,45.2 64.2,45.2 62.6,48.6 64.8,48.6 60.4,54.2 61.6,50.2 59.6,50.2" fill="${neonYellow}" />
    `;

    const brandLogoLayer = `
      <g id="game-findit-logo" data-brand-signature="findit-qr">
        <text x="29.8" y="15.8" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="4.7" font-weight="900" letter-spacing="-0.16">FindIt</text>
        <g transform="translate(42.4, 13.8)">
          <path d="M -3.3 -2.6 H 2.8 Q 3.6 -2.6 3.6 -1.8 V 1.6 Q 3.6 2.4 2.8 2.4 H -0.2 L -2.2 4.1 V 2.4 H -3.3 Q -4.1 2.4 -4.1 1.6 V -1.8 Q -4.1 -2.6 -3.3 -2.6 Z" fill="${neonMagenta}" />
          <text x="-0.2" y="0.95" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="2.6" font-weight="900">QR</text>
        </g>
        <rect x="47.6" y="10.8" width="2.3" height="0.85" rx="0.42" fill="${neonCyan}" transform="rotate(-34 48.7 11.2)" />
        <rect x="48.3" y="13.4" width="2.5" height="0.85" rx="0.42" fill="${neonCyan}" />
        <rect x="47.6" y="16.0" width="2.3" height="0.85" rx="0.42" fill="${neonCyan}" transform="rotate(34 48.7 16.4)" />
      </g>
    `;

    const qrBoxW = 24.6;
    const qrBoxX = (w - qrBoxW) / 2;
    const qrBoxY = 18.8;
    const qrContainerLayer = `
      <rect x="${qrBoxX.toFixed(2)}" y="${qrBoxY.toFixed(2)}" width="${qrBoxW.toFixed(2)}" height="${qrBoxW.toFixed(2)}" rx="2.4" fill="#FFFFFF" />
      <path d="M ${(qrBoxX - 1.0).toFixed(2)} ${(qrBoxY + 5.2).toFixed(2)} L ${(qrBoxX - 1.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} Q ${(qrBoxX - 1.0).toFixed(2)} ${(qrBoxY - 1.0).toFixed(2)} ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY - 1.0).toFixed(2)} L ${(qrBoxX + 5.2).toFixed(2)} ${(qrBoxY - 1.0).toFixed(2)}" fill="none" stroke="${neonCyan}" stroke-width="0.75" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.2).toFixed(2)} ${(qrBoxY - 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY - 1.0).toFixed(2)} Q ${(qrBoxX + qrBoxW + 1.0).toFixed(2)} ${(qrBoxY - 1.0).toFixed(2)} ${(qrBoxX + qrBoxW + 1.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW + 1.0).toFixed(2)} ${(qrBoxY + 5.2).toFixed(2)}" fill="none" stroke="${neonMagenta}" stroke-width="0.75" stroke-linecap="round" />
      <path d="M ${(qrBoxX - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 5.2).toFixed(2)} L ${(qrBoxX - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} Q ${(qrBoxX - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW + 1.0).toFixed(2)} ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW + 1.0).toFixed(2)} L ${(qrBoxX + 5.2).toFixed(2)} ${(qrBoxY + qrBoxW + 1.0).toFixed(2)}" fill="none" stroke="${neonMagenta}" stroke-width="0.75" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.2).toFixed(2)} ${(qrBoxY + qrBoxW + 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW + 1.0).toFixed(2)} Q ${(qrBoxX + qrBoxW + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW + 1.0).toFixed(2)} ${(qrBoxX + qrBoxW + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 5.2).toFixed(2)}" fill="none" stroke="${neonCyan}" stroke-width="0.75" stroke-linecap="round" />
    `;

    const borderLayer = `
      <path d="${cutPath}" fill="none" stroke="${neonCyan}" stroke-width="1.35" opacity="0.92" />
    `;

    const typographyLayer = `
      <rect x="20.2" y="45.2" width="35.6" height="7.0" rx="3.5" fill="${midnight}" stroke="${neonCyan}" stroke-width="0.6" />
      ${
        enLine2
          ? `<text x="38.0" y="48.1" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>
             <text x="38.0" y="50.9" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine2)}</text>`
          : `<text x="38.0" y="49.5" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>`
      }
      <rect x="21.8" y="53.4" width="32.4" height="7.0" rx="3.5" fill="${neonMagenta}" />
      ${
        arLine1
          ? arLine2
            ? `<text x="38.0" y="56.3" dir="rtl" text-anchor="middle" fill="#FFFFFF" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>
               <text x="38.0" y="59.2" dir="rtl" text-anchor="middle" fill="#FFFFFF" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine2)}</text>`
            : `<text x="38.0" y="57.7" dir="rtl" text-anchor="middle" fill="#FFFFFF" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>`
          : ''
      }
    `;

    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: Number((qrBoxX + 1.65).toFixed(2)),
      y: Number((qrBoxY + 1.65).toFixed(2)),
      size: Number((qrBoxW - 3.3).toFixed(2)),
      darkColor: '#0B121C',
      finderColor: '#0B121C',
      centerDotColor: '#0B121C',
      bgColor: '#FFFFFF',
      cornerRadius: 0.7,
    });

    return {
      w,
      h,
      bleedMm,
      safeMarginMm,
      style,
      serial,
      cutPath,
      backgroundLayer,
      artworkLayer: '',
      decorativeLayer,
      accentLayer,
      brandLogoLayer,
      qrContainerLayer,
      borderLayer,
      typographyLayer,
      qrLayer,
    };
  }

  if (style === 'purrfect_tag') {
    const plum = primary || '#6D28D9';
    const cream = secondary || '#FFF6F0';
    const coralPink = accent || '#FB7185';

    const rawEnglish = (options.calloutText ?? 'Scan to Contact the Owner').trim();
    const rawArabic = (options.customSubLabel ?? 'امسح الرمز للتواصل مع المالك').trim();
    const [enLine1, enLine2] = splitCenteredTwoLines(rawEnglish, 16);
    const [arLine1, arLine2] = splitCenteredTwoLines(rawArabic, 16);
    const enFontSize = rawEnglish.length > 28 ? 2.1 : 2.45;
    const arFontSize = rawArabic.length > 32 ? 2.25 : 2.65;

    const backgroundLayer = `
      <!-- Warm Cream Cat-Silhouette Base (Clean Top Ears & Smooth Forehead, Zero Holes) -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${isTransparentStock ? 'rgba(255,246,240,0.92)' : cream}" />
    `;

    const borderLayer = `
      <!-- Outer Berry Plum Rim & Soft Inner Ear Triangles -->
      <path d="${cutPath}" fill="none" stroke="${plum}" stroke-width="1.65" opacity="0.94" />
      <polygon points="15.2,17.2 19.8,6.2 25.4,13.5" fill="${coralPink}" opacity="0.88" />
      <polygon points="56.8,17.2 52.2,6.2 46.6,13.5" fill="${coralPink}" opacity="0.88" />
    `;

    const decorativeLayer = `
      <!-- Delicate Toe-Bean Paw Prints -->
      <g transform="translate(14.5, 58.5) rotate(-15)" fill="${plum}" opacity="0.24">
        <ellipse cx="0" cy="1.2" rx="1.7" ry="1.3" />
        <circle cx="-1.8" cy="-0.8" r="0.58" />
        <circle cx="-0.6" cy="-1.5" r="0.58" />
        <circle cx="0.6" cy="-1.5" r="0.58" />
        <circle cx="1.8" cy="-0.8" r="0.58" />
      </g>
      <g transform="translate(57.8, 57.2) rotate(18)" fill="${coralPink}" opacity="0.34">
        <ellipse cx="0" cy="1.2" rx="1.6" ry="1.2" />
        <circle cx="-1.7" cy="-0.8" r="0.55" />
        <circle cx="-0.6" cy="-1.4" r="0.55" />
        <circle cx="0.6" cy="-1.4" r="0.55" />
        <circle cx="1.7" cy="-0.8" r="0.55" />
      </g>
    `;

    const accentLayer = `
      <!-- Left Winking Lavender Kitty -->
      <g id="purrfect-winking-kitty" transform="translate(12.2, 37.8)">
        <polygon points="-4.2,-2.2 -5.0,-6.4 -1.4,-3.8" fill="#A78BFA" />
        <polygon points="1.4,-3.8 5.0,-6.4 4.2,-2.2" fill="#A78BFA" />
        <ellipse cx="0" cy="0" rx="5.2" ry="4.5" fill="#C4B5FD" stroke="${plum}" stroke-width="0.45" />
        <!-- Winking Eye Left, Open Eye Right -->
        <path d="M -3.0 -0.6 Q -1.8 -1.8 -0.6 -0.6" fill="none" stroke="${plum}" stroke-width="0.55" stroke-linecap="round" />
        <circle cx="2.0" cy="-0.8" r="0.72" fill="${plum}" />
        <circle cx="2.2" cy="-1.0" r="0.22" fill="#FFFFFF" />
        <!-- Cute Pink Nose & Whiskers -->
        <polygon points="0,0.4 -0.65,-0.2 0.65,-0.2" fill="${coralPink}" />
        <line x1="-3.5" y1="0.8" x2="-6.2" y2="0.4" stroke="${plum}" stroke-width="0.32" />
        <line x1="-3.5" y1="1.6" x2="-6.2" y2="2.0" stroke="${plum}" stroke-width="0.32" />
      </g>
      <!-- Right Pink Yarn-Ball Forming a Heart -->
      <g id="purrfect-yarn-heart" transform="translate(59.6, 39.2)">
        <path d="M -0.5 -5.8 C -3.8 -8.5, -5.8 -4.8, -0.5 -2.2 C 4.8 -4.8, 2.8 -8.5, -0.5 -5.8 Z" fill="none" stroke="${coralPink}" stroke-width="0.65" />
        <circle cx="0" cy="0" r="4.2" fill="${coralPink}" />
        <path d="M -3.2 -1.2 Q 0 -3.0 3.2 -0.8 M -3.5 1.2 Q 0 -0.8 3.5 1.4 M -1.8 -3.4 Q 1.0 0 -1.2 3.6" fill="none" stroke="#FFF1F2" stroke-width="0.42" stroke-linecap="round" />
      </g>
    `;

    const brandLogoLayer = `
      <g id="purrfect-findit-logo" data-brand-signature="findit-qr">
        <text x="27.8" y="19.5" text-anchor="middle" fill="${plum}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="4.6" font-weight="900" letter-spacing="-0.16">FindIt</text>
        <g transform="translate(40.2, 17.5)">
          <path d="M -3.3 -2.6 H 2.8 Q 3.6 -2.6 3.6 -1.8 V 1.6 Q 3.6 2.4 2.8 2.4 H -0.2 L -2.2 4.1 V 2.4 H -3.3 Q -4.1 2.4 -4.1 1.6 V -1.8 Q -4.1 -2.6 -3.3 -2.6 Z" fill="${coralPink}" />
          <text x="-0.2" y="0.95" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="2.6" font-weight="900">QR</text>
        </g>
      </g>
    `;

    const qrBoxW = 24.8;
    const qrBoxX = (w - qrBoxW) / 2;
    const qrBoxY = 22.8;
    const qrContainerLayer = `
      <rect x="${qrBoxX.toFixed(2)}" y="${qrBoxY.toFixed(2)}" width="${qrBoxW.toFixed(2)}" height="${qrBoxW.toFixed(2)}" rx="2.6" fill="#FFFFFF" stroke="#E9D5FF" stroke-width="0.4" />
      <path d="M ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 5.0).toFixed(2)} L ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 2.0).toFixed(2)} Q ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} ${(qrBoxX + 2.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} L ${(qrBoxX + 5.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)}" fill="none" stroke="${plum}" stroke-width="0.7" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 2.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 5.0).toFixed(2)}" fill="none" stroke="${coralPink}" stroke-width="0.7" stroke-linecap="round" />
      <path d="M ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 5.0).toFixed(2)} L ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 2.0).toFixed(2)} Q ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} ${(qrBoxX + 2.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} L ${(qrBoxX + 5.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)}" fill="none" stroke="${coralPink}" stroke-width="0.7" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 2.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 5.0).toFixed(2)}" fill="none" stroke="${plum}" stroke-width="0.7" stroke-linecap="round" />
    `;

    const typographyLayer = `
      <rect x="17.8" y="49.4" width="36.4" height="7.2" rx="3.6" fill="#FFFFFF" stroke="${plum}" stroke-width="0.45" />
      ${
        enLine2
          ? `<text x="36.0" y="52.4" text-anchor="middle" fill="${plum}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>
             <text x="36.0" y="55.3" text-anchor="middle" fill="${plum}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine2)}</text>`
          : `<text x="36.0" y="53.9" text-anchor="middle" fill="${plum}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>`
      }
      <rect x="19.6" y="57.8" width="32.8" height="7.2" rx="3.6" fill="${coralPink}" />
      ${
        arLine1
          ? arLine2
            ? `<text x="36.0" y="60.8" dir="rtl" text-anchor="middle" fill="#FFFFFF" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>
               <text x="36.0" y="63.8" dir="rtl" text-anchor="middle" fill="#FFFFFF" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine2)}</text>`
            : `<text x="36.0" y="62.3" dir="rtl" text-anchor="middle" fill="#FFFFFF" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>`
          : ''
      }
    `;

    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: Number((qrBoxX + 1.65).toFixed(2)),
      y: Number((qrBoxY + 1.65).toFixed(2)),
      size: Number((qrBoxW - 3.3).toFixed(2)),
      darkColor: '#0B121C',
      finderColor: '#0B121C',
      centerDotColor: '#0B121C',
      bgColor: '#FFFFFF',
      cornerRadius: 0.7,
    });

    return {
      w,
      h,
      bleedMm,
      safeMarginMm,
      style,
      serial,
      cutPath,
      backgroundLayer,
      artworkLayer: '',
      decorativeLayer,
      accentLayer,
      brandLogoLayer,
      qrContainerLayer,
      borderLayer,
      typographyLayer,
      qrLayer,
    };
  }

  if (style === 'retro_explorer') {
    const saddleBrown = primary || '#7C4A21';
    const parchment = secondary || '#F7ECD7';
    const terracotta = accent || '#C2410C';

    const rawEnglish = (options.calloutText ?? 'Scan to Contact the Owner').trim();
    const rawArabic = (options.customSubLabel ?? 'امسح الرمز للتواصل مع المالك').trim();
    const [enLine1, enLine2] = splitCenteredTwoLines(rawEnglish, 16);
    const [arLine1, arLine2] = splitCenteredTwoLines(rawArabic, 16);
    const enFontSize = rawEnglish.length > 28 ? 2.1 : 2.45;
    const arFontSize = rawArabic.length > 32 ? 2.25 : 2.65;

    const innerSegs = getRetroExplorerSegments(w - 5.2, h - 5.2);
    const fmtShift = (pt: [number, number]) => `${(pt[0] + 2.6).toFixed(3)} ${(pt[1] + 2.6).toFixed(3)}`;
    const innerStampPath = [
      `M ${fmtShift(innerSegs[0].p0)}`,
      ...innerSegs.map((s) => `C ${fmtShift(s.c1)}, ${fmtShift(s.c2)}, ${fmtShift(s.p1)}`),
      'Z',
    ].join(' ');

    const backgroundLayer = `
      <!-- Warm Antique Parchment Stamp Base -->
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${isTransparentStock ? 'rgba(247,236,215,0.92)' : parchment}" />
    `;

    const borderLayer = `
      <path d="${innerStampPath}" fill="none" stroke="${saddleBrown}" stroke-width="0.72" opacity="0.92" />
      <path d="${innerStampPath}" fill="none" stroke="${terracotta}" stroke-width="0.28" stroke-dasharray="1.3 0.9" opacity="0.72" />
    `;

    const decorativeLayer = `
      <!-- Faint Antique World Map Graticule & Continents -->
      <g opacity="0.16" stroke="${saddleBrown}" fill="${saddleBrown}">
        <circle cx="38" cy="39" r="24" fill="none" stroke-width="0.35" />
        <ellipse cx="38" cy="39" rx="14" ry="24" fill="none" stroke-width="0.25" />
        <line x1="14" y1="39" x2="62" y2="39" stroke-width="0.25" />
        <path d="M 18 28 Q 25 22 30 28 Q 26 36 20 34 Z" opacity="0.35" />
        <path d="M 45 25 Q 54 22 59 30 Q 52 38 46 33 Z" opacity="0.35" />
      </g>
      <!-- Dotted Vintage Airplane Arc -->
      <path d="M 14.5 14.5 Q 38.0 5.5 60.5 15.5" fill="none" stroke="${terracotta}" stroke-width="0.4" stroke-dasharray="1.2 1.0" />
      <polygon points="61.8,15.6 58.6,14.2 59.4,15.8 58.4,17.2" fill="${terracotta}" />
    `;

    const accentLayer = `
      <!-- Upper-Left Compass Rose -->
      <g id="explorer-compass-rose" transform="translate(14.5, 22.0)">
        <circle cx="0" cy="0" r="5.2" fill="#FFFDF7" stroke="${saddleBrown}" stroke-width="0.45" />
        <path d="M 0 -4.2 L 1.0 -1.0 L 4.2 0 L 1.0 1.0 L 0 4.2 L -1.0 1.0 L -4.2 0 L -1.0 -1.0 Z" fill="${terracotta}" />
        <circle cx="0" cy="0" r="1.0" fill="${saddleBrown}" />
      </g>
      <!-- Mid-Left Stitched Leather Suitcase -->
      <g id="explorer-suitcase" transform="translate(13.2, 46.5) rotate(-6)">
        <path d="M -1.8 -3.6 V -5.0 H 1.8 V -3.6" fill="none" stroke="${saddleBrown}" stroke-width="0.6" />
        <rect x="-4.5" y="-3.6" width="9.0" height="7.0" rx="1.1" fill="${saddleBrown}" />
        <line x1="-2.2" y1="-3.6" x2="-2.2" y2="3.4" stroke="#F59E0B" stroke-width="0.7" />
        <line x1="2.2" y1="-3.6" x2="2.2" y2="3.4" stroke="#F59E0B" stroke-width="0.7" />
        <polygon points="0,-1.4 -1.4,1.2 1.4,1.2" fill="${terracotta}" />
      </g>
      <!-- Mid-Right Vintage Camera & Pyramid Polaroid -->
      <g id="explorer-camera" transform="translate(62.2, 34.5) rotate(8)">
        <rect x="-4.2" y="-2.6" width="8.4" height="5.4" rx="0.9" fill="${saddleBrown}" />
        <rect x="-1.8" y="-3.8" width="3.6" height="1.2" rx="0.3" fill="${terracotta}" />
        <circle cx="0" cy="0.2" r="1.8" fill="#FFFDF7" stroke="${terracotta}" stroke-width="0.5" />
        <circle cx="0" cy="0.2" r="0.9" fill="#1E293B" />
      </g>
      <g id="explorer-polaroid" transform="translate(61.5, 49.0) rotate(-10)">
        <rect x="-4.0" y="-4.6" width="8.0" height="9.2" rx="0.5" fill="#FFFFFF" stroke="${saddleBrown}" stroke-width="0.35" />
        <rect x="-3.1" y="-3.6" width="6.2" height="5.4" fill="#FDE68A" />
        <polygon points="-2.5,1.8 -0.2,-2.2 2.2,1.8" fill="${terracotta}" />
      </g>
    `;

    const brandLogoLayer = `
      <g id="explorer-findit-logo" data-brand-signature="findit-qr">
        <text x="30.2" y="19.6" text-anchor="middle" fill="${saddleBrown}" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="4.65" font-weight="900" letter-spacing="-0.16">FindIt</text>
        <g transform="translate(42.8, 17.6)">
          <path d="M -3.3 -2.6 H 2.8 Q 3.6 -2.6 3.6 -1.8 V 1.6 Q 3.6 2.4 2.8 2.4 H -0.2 L -2.2 4.1 V 2.4 H -3.3 Q -4.1 2.4 -4.1 1.6 V -1.8 Q -4.1 -2.6 -3.3 -2.6 Z" fill="${terracotta}" />
          <text x="-0.2" y="0.95" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Outfit', Arial, sans-serif" font-size="2.6" font-weight="900">QR</text>
        </g>
      </g>
    `;

    const qrBoxW = 25.8;
    const qrBoxX = (w - qrBoxW) / 2;
    const qrBoxY = 23.0;
    const qrContainerLayer = `
      <rect x="${qrBoxX.toFixed(2)}" y="${qrBoxY.toFixed(2)}" width="${qrBoxW.toFixed(2)}" height="${qrBoxW.toFixed(2)}" rx="2.4" fill="#FFFFFF" stroke="${saddleBrown}" stroke-width="0.45" />
      <path d="M ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 5.0).toFixed(2)} L ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 2.0).toFixed(2)} Q ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} ${(qrBoxX + 2.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} L ${(qrBoxX + 5.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)}" fill="none" stroke="${saddleBrown}" stroke-width="0.68" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 1.0).toFixed(2)} ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 2.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + 5.0).toFixed(2)}" fill="none" stroke="${saddleBrown}" stroke-width="0.68" stroke-linecap="round" />
      <path d="M ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 5.0).toFixed(2)} L ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 2.0).toFixed(2)} Q ${(qrBoxX + 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} ${(qrBoxX + 2.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} L ${(qrBoxX + 5.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)}" fill="none" stroke="${saddleBrown}" stroke-width="0.68" stroke-linecap="round" />
      <path d="M ${(qrBoxX + qrBoxW - 5.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 2.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} Q ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 1.0).toFixed(2)} ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 2.0).toFixed(2)} L ${(qrBoxX + qrBoxW - 1.0).toFixed(2)} ${(qrBoxY + qrBoxW - 5.0).toFixed(2)}" fill="none" stroke="${saddleBrown}" stroke-width="0.68" stroke-linecap="round" />
    `;

    const typographyLayer = `
      <rect x="19.2" y="50.8" width="37.6" height="7.4" rx="2.0" fill="#FFFFFF" stroke="${saddleBrown}" stroke-width="0.45" />
      ${
        enLine2
          ? `<text x="38.0" y="53.8" text-anchor="middle" fill="${saddleBrown}" font-family="Georgia, 'Times New Roman', serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>
             <text x="38.0" y="56.7" text-anchor="middle" fill="${saddleBrown}" font-family="Georgia, 'Times New Roman', serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine2)}</text>`
          : `<text x="38.0" y="55.3" text-anchor="middle" fill="${saddleBrown}" font-family="Georgia, 'Times New Roman', serif" font-size="${enFontSize}" font-weight="800">${escapeXml(enLine1)}</text>`
      }
      <rect x="21.0" y="59.4" width="34.0" height="7.4" rx="2.2" fill="${terracotta}" />
      ${
        arLine1
          ? arLine2
            ? `<text x="38.0" y="62.4" dir="rtl" text-anchor="middle" fill="#FFFFFF" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>
               <text x="38.0" y="65.4" dir="rtl" text-anchor="middle" fill="#FFFFFF" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine2)}</text>`
            : `<text x="38.0" y="63.9" dir="rtl" text-anchor="middle" fill="#FFFFFF" font-family="'Cairo', 'Noto Sans Arabic', 'Tahoma', Arial, sans-serif" font-size="${arFontSize}" font-weight="800">${escapeXml(arLine1)}</text>`
          : ''
      }
    `;

    const qrLayer = renderQrModulesSvg({
      payloadUrl: qrPayload,
      x: Number((qrBoxX + 1.75).toFixed(2)),
      y: Number((qrBoxY + 1.75).toFixed(2)),
      size: Number((qrBoxW - 3.5).toFixed(2)),
      darkColor: '#0B121C',
      finderColor: '#0B121C',
      centerDotColor: '#0B121C',
      bgColor: '#FFFFFF',
      cornerRadius: 0.7,
    });

    return {
      w,
      h,
      bleedMm,
      safeMarginMm,
      style,
      serial,
      cutPath,
      backgroundLayer,
      artworkLayer: '',
      decorativeLayer,
      accentLayer,
      brandLogoLayer,
      qrContainerLayer,
      borderLayer,
      typographyLayer,
      qrLayer,
    };
  }

  // progrid_iso: Industrial Nameplate Asset Label (84 × 38 mm)
  const slateBg = isTransparentStock ? 'rgba(232,237,245,0.85)' : secondary;
  const hazards: string[] = [];
  for (let hy = -6; hy < h + 6; hy += 4.2) {
    hazards.push(
      `<polygon points="-3,${hy} 7,${hy - 4.2} 7,${hy - 2.1} -3,${hy + 2.1}" fill="${accent}" />`
    );
  }
  const backgroundLayer = `
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${slateBg}" />
    <!-- Subtle Engineering Micro-Grid -->
    <g stroke="#94A3B8" stroke-width="0.12" opacity="0.32">
      <line x1="12" y1="0" x2="12" y2="${h}" />
      <line x1="24" y1="0" x2="24" y2="${h}" />
      <line x1="36" y1="0" x2="36" y2="${h}" />
      <line x1="48" y1="0" x2="48" y2="${h}" />
      <line x1="0" y1="12" x2="${w}" y2="12" />
      <line x1="0" y1="24" x2="${w}" y2="24" />
    </g>
    <!-- Left Hazard Warning Band -->
    <rect x="-3" y="-3" width="9.8" height="${h + 6}" fill="${primary}" />
    <g clip-path="url(#progrid-hazard-clip)">${hazards.join('')}</g>
  `;
  const artworkLayer = `
    <!-- Titanium Header Strip -->
    <rect x="6.8" y="-3" width="${w - 3.8}" height="12.2" fill="${primary}" />
    <!-- Precision Border & Reticle Ticks -->
    <rect x="8.8" y="11.2" width="41.2" height="23.2" rx="1.4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="0.35" />
    <rect x="10.2" y="12.8" width="2.2" height="2.2" fill="${accent}" />
    <line x1="10.2" y1="22.8" x2="48" y2="22.8" stroke="#E2E8F0" stroke-width="0.3" />
    <!-- Right Isolated ISO QR Box -->
    <rect x="52.4" y="10.6" width="26.4" height="24.2" rx="1.6" fill="#FFFFFF" stroke="${primary}" stroke-width="0.5" />
    <!-- Corner Target Brackets on QR Stage -->
    <path d="M 54.4 13.8 L 54.4 12.2 L 56 12.2 M 76.8 13.8 L 76.8 12.2 L 75.2 12.2" fill="none" stroke="${accent}" stroke-width="0.35" />
  `;
  const brandMark = buildFindItSignatureSvg({
    x: 75.6,
    y: 6.4,
    inkColor: '#FFFFFF',
    opacity: 0.85,
    centered: true,
    includeWordmark: false,
  });
  const typographyLayer = `
    <text x="10.4" y="6.2" fill="#FFFFFF" font-family="monospace" font-size="3.05" font-weight="800" letter-spacing="0.4">FINDIT QR // ASSET CONTROL</text>
    <text x="13.8" y="14.7" fill="${primary}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="1.52" font-weight="800" letter-spacing="0.06">${callout}</text>
    <text x="10.4" y="19.6" fill="#475569" font-family="monospace" font-size="1.75" font-weight="700">UID // ${serial}</text>
    <text x="10.4" y="27.2" fill="#0F172A" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="1.85" font-weight="700">${subLabel}</text>
    <text x="10.4" y="31.5" fill="#64748B" font-family="monospace" font-size="1.55">ISO-18004 · 300 DPI · POLYESTER</text>
    ${brandMark}
  `;
  const qrLayer = renderQrModulesSvg({
    payloadUrl: qrPayload,
    x: 54.6,
    y: 11.9,
    size: 21.8,
    darkColor: '#0F172A',
    finderColor: primary,
    centerDotColor: accent,
    bgColor: '#FFFFFF',
    cornerRadius: 1.0,
  });

  return { w, h, bleedMm, safeMarginMm, style, serial, cutPath, backgroundLayer, artworkLayer, typographyLayer, qrLayer };
}

function buildSharedArtworkDefs(params: {
  primary: string;
  secondary: string;
  accent: string;
  h: number;
}): string {
  const { primary, secondary, accent, h } = params;
  return `
    <linearGradient id="atelier-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}" />
      <stop offset="100%" stop-color="${secondary}" />
    </linearGradient>
    <linearGradient id="jelly-base-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}" />
      <stop offset="52%" stop-color="${secondary}" />
      <stop offset="100%" stop-color="${accent}" />
    </linearGradient>
    <radialGradient id="jelly-bubble-grad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
      <stop offset="45%" stop-color="${accent}" stop-opacity="0.92" />
      <stop offset="100%" stop-color="${primary}" stop-opacity="0.95" />
    </radialGradient>
    <radialGradient id="hexa-core-glow" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="${secondary}" stop-opacity="0.22" />
      <stop offset="100%" stop-color="${primary}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="pebble-soft-aura" cx="25%" cy="20%" r="75%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.45" />
      <stop offset="100%" stop-color="${primary}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="orbit-space-grad" cx="50%" cy="42%" r="65%">
      <stop offset="0%" stop-color="${secondary}" stop-opacity="0.20" />
      <stop offset="100%" stop-color="${primary}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="astro-indigo-grad" cx="50%" cy="44%" r="68%">
      <stop offset="0%" stop-color="${secondary}" stop-opacity="0.26" />
      <stop offset="100%" stop-color="${primary}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="astro-moon-grad" x1="20%" y1="15%" x2="85%" y2="85%">
      <stop offset="0%" stop-color="#A78BFA" />
      <stop offset="55%" stop-color="#6D5CE7" />
      <stop offset="100%" stop-color="#4338CA" />
    </linearGradient>
    <radialGradient id="game-neon-grad" cx="50%" cy="45%" r="68%">
      <stop offset="0%" stop-color="${secondary}" stop-opacity="0.22" />
      <stop offset="60%" stop-color="${accent}" stop-opacity="0.14" />
      <stop offset="100%" stop-color="${primary}" stop-opacity="0" />
    </radialGradient>
    <clipPath id="progrid-hazard-clip">
      <rect x="-3" y="-3" width="9.8" height="${h + 6}" />
    </clipPath>`;
}

/**
 * ASSET 1: Original Editable Design (.svg) with semantic vector layers (<g id="layer-...">).
 */
export function buildPilotEditableSvg(
  design: TagDesignTemplate,
  options: PilotLabelRenderOptions = {}
): string {
  const masterSpec = getMasterSpecById(design.id);
  if (masterSpec) {
    return buildMasterEditableSvg(masterSpec);
  }
  const {
    w,
    h,
    style,
    serial,
    cutPath,
    backgroundLayer,
    artworkLayer,
    decorativeLayer,
    accentLayer,
    brandLogoLayer,
    qrContainerLayer,
    borderLayer,
    typographyLayer,
    qrLayer,
  } = buildCoreIllustrationLayers(design, options);

  const primary = options.primaryHex || design.primaryHex;
  const secondary = options.secondaryHex || design.secondaryHex;
  const accent = options.accentHex || design.badgeColorHex;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" data-asset-type="editable-source" data-design-id="${escapeXml(design.id)}" data-style="${style}" data-serial="${serial}">
  <defs>
    ${buildSharedArtworkDefs({ primary, secondary, accent, h })}
    <clipPath id="label-trim-clip">
      <path d="${cutPath}" />
    </clipPath>
  </defs>
  <g clip-path="url(#label-trim-clip)">
    <g id="layer-background">${backgroundLayer}</g>
    ${decorativeLayer ? `<g id="layer-decorative-shapes">${decorativeLayer}</g>` : ''}
    ${accentLayer ? `<g id="layer-accent-graphics">${accentLayer}</g>` : ''}
    ${brandLogoLayer ? `<g id="layer-brand-logo">${brandLogoLayer}</g>` : ''}
    ${artworkLayer ? `<g id="layer-artwork">${artworkLayer}</g>` : ''}
    ${qrContainerLayer ? `<g id="layer-qr-container">${qrContainerLayer}</g>` : ''}
    ${borderLayer ? `<g id="layer-border-outline">${borderLayer}</g>` : ''}
    <g id="layer-typography">${typographyLayer}</g>
    <g id="layer-qr-code">${qrLayer}</g>
  </g>
  <g id="layer-cutline">
    <path d="${cutPath}" fill="none" stroke="#EC008C" stroke-width="0.32" stroke-dasharray="1.4 0.9" />
  </g>
</svg>`;
}

/**
 * ASSET 2: Final Print-Ready File (.svg)
 * Includes full 3mm Bleed extension, 3mm Safe Margin guides, Magenta Die-Cut CutContour,
 * Corner Crop Marks, Registration Targets, 300 DPI metadata slug, and REAL scannable QR code.
 */
export function buildPilotPrintReadySvg(
  design: TagDesignTemplate,
  options: PilotLabelRenderOptions = {}
): string {
  const masterSpec = getMasterSpecById(design.id);
  if (masterSpec) {
    return buildMasterPrintReadySvg(masterSpec, undefined, {
      includeRealQr: false,
      showGuides: options.showPrintGuides !== false,
    });
  }
  const {
    w,
    h,
    bleedMm,
    safeMarginMm,
    style,
    serial,
    cutPath,
    backgroundLayer,
    artworkLayer,
    decorativeLayer,
    accentLayer,
    brandLogoLayer,
    qrContainerLayer,
    borderLayer,
    typographyLayer,
    qrLayer,
  } = buildCoreIllustrationLayers(design, options);

  const primary = options.primaryHex || design.primaryHex;
  const secondary = options.secondaryHex || design.secondaryHex;
  const accent = options.accentHex || design.badgeColorHex;
  const showGuides = options.showPrintGuides !== false;
  const outerPad = showGuides ? 8.5 : bleedMm;
  const vbX = -outerPad;
  const vbY = -outerPad;
  const vbW = w + outerPad * 2;
  const vbH = h + outerPad * 2 + (showGuides ? 5.5 : 0);

  const guidesSvg = showGuides
    ? `
    <!-- Bleed Box (3mm outside trim) -->
    <rect x="${-bleedMm}" y="${-bleedMm}" width="${w + bleedMm * 2}" height="${h + bleedMm * 2}" fill="none" stroke="#06B6D4" stroke-width="0.22" stroke-dasharray="1.5 1.0" />
    <!-- Safe Content Margin (3mm inside trim) -->
    <rect x="${safeMarginMm}" y="${safeMarginMm}" width="${w - safeMarginMm * 2}" height="${h - safeMarginMm * 2}" fill="none" stroke="#10B981" stroke-width="0.2" stroke-dasharray="1.1 0.9" />
    <!-- Die-Cut Contour Line (CMYK Magenta CutContour) -->
    <path d="${cutPath}" fill="none" stroke="#EC008C" stroke-width="0.35" stroke-dasharray="1.8 1.0" />
    <!-- Corner Trim Crop Marks -->
    <g stroke="#0F172A" stroke-width="0.28">
      <line x1="-6.8" y1="0" x2="-3.6" y2="0" /><line x1="0" y1="-6.8" x2="0" y2="-3.6" />
      <line x1="${w + 3.6}" y1="0" x2="${w + 6.8}" y2="0" /><line x1="${w}" y1="-6.8" x2="${w}" y2="-3.6" />
      <line x1="-6.8" y1="${h}" x2="-3.6" y2="${h}" /><line x1="0" y1="${h + 3.6}" x2="0" y2="${h + 6.8}" />
      <line x1="${w + 3.6}" y1="${h}" x2="${w + 6.8}" y2="${h}" /><line x1="${w}" y1="${h + 3.6}" x2="${w}" y2="${h + 6.8}" />
    </g>
    <!-- Print Production Spec Footer -->
    <text x="${w / 2}" y="${h + 6.9}" text-anchor="middle" fill="#334155" font-family="monospace" font-size="1.45" font-weight="700">
      TRIM ${w}x${h}mm | BLEED +${bleedMm}mm | SAFE -${safeMarginMm}mm | CUTCONTOUR | 300 DPI
    </text>`
    : `<path d="${cutPath}" fill="none" stroke="#EC008C" stroke-width="0.25" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${vbW}mm" height="${vbH}mm" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" data-asset-type="print-ready" data-design-id="${escapeXml(design.id)}" data-style="${style}" data-serial="${serial}" data-dpi="300">
  <defs>
    ${buildSharedArtworkDefs({ primary, secondary, accent, h })}
    <clipPath id="bleed-clip">
      <rect x="${-bleedMm}" y="${-bleedMm}" width="${w + bleedMm * 2}" height="${h + bleedMm * 2}" />
    </clipPath>
  </defs>
  <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="#FFFFFF" />
  <g clip-path="url(#bleed-clip)">
    ${backgroundLayer}
    ${decorativeLayer || ''}
    ${accentLayer || ''}
    ${brandLogoLayer || ''}
    ${artworkLayer || ''}
    ${qrContainerLayer || ''}
    ${borderLayer || ''}
    ${typographyLayer}
    ${qrLayer}
  </g>
  ${guidesSvg}
</svg>`;
}

/**
 * SINGLE SOURCE OF TRUTH SURFACE TEXTURE SVG (used exclusively to wrap onto 3D Mockup Geometry).
 * Renders the EXACT Final Print-Ready Artwork cropped edge-to-edge on [0..w, 0..h] without print guide marks,
 * guaranteeing 100% 1:1 visual parity between Print-Ready File and 3D Mockups.
 */
export function buildPilot3dTextureSurfaceSvg(
  design: TagDesignTemplate,
  options: PilotLabelRenderOptions = {}
): string {
  const masterSpec = getMasterSpecById(design.id);
  if (masterSpec) {
    return buildMasterCleanStickerSvg(masterSpec, undefined, {
      includeRealQr: true,
      qrPayload: buildQrRecoveryUrl(options.serialCode || design.slug),
    });
  }
  const {
    w,
    h,
    serial,
    backgroundLayer,
    artworkLayer,
    decorativeLayer,
    accentLayer,
    brandLogoLayer,
    qrContainerLayer,
    borderLayer,
    typographyLayer,
    qrLayer,
  } = buildCoreIllustrationLayers(design, options);
  const primary = options.primaryHex || design.primaryHex;
  const secondary = options.secondaryHex || design.secondaryHex;
  const accent = options.accentHex || design.badgeColorHex;
  const pxScale = options.scalePxPerMm ?? 12;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w * pxScale)}" height="${Math.round(h * pxScale)}" viewBox="0 0 ${w} ${h}" data-serial="${serial}">
  <defs>
    ${buildSharedArtworkDefs({ primary, secondary, accent, h })}
  </defs>
  ${backgroundLayer}
  ${decorativeLayer || ''}
  ${accentLayer || ''}
  ${brandLogoLayer || ''}
  ${artworkLayer || ''}
  ${qrContainerLayer || ''}
  ${borderLayer || ''}
  ${typographyLayer}
  ${qrLayer}
</svg>`;
}

/**
 * Clean Die-Cut Artwork SVG for Detail & Macro Inspection (clipped to the exact label silhouette without print guides).
 */
export function buildPilotCleanTrimSvg(
  design: TagDesignTemplate,
  options: PilotLabelRenderOptions = {}
): string {
  const masterSpec = getMasterSpecById(design.id);
  if (masterSpec) {
    return buildMasterCleanStickerSvg(masterSpec, undefined, {
      includeRealQr: true,
      qrPayload: buildQrRecoveryUrl(options.serialCode || design.slug),
    });
  }
  const {
    w,
    h,
    serial,
    cutPath,
    backgroundLayer,
    artworkLayer,
    decorativeLayer,
    accentLayer,
    brandLogoLayer,
    qrContainerLayer,
    borderLayer,
    typographyLayer,
    qrLayer,
  } = buildCoreIllustrationLayers(design, options);
  const primary = options.primaryHex || design.primaryHex;
  const secondary = options.secondaryHex || design.secondaryHex;
  const accent = options.accentHex || design.badgeColorHex;
  const pxScale = options.scalePxPerMm ?? 12;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w * pxScale)}" height="${Math.round(h * pxScale)}" viewBox="0 0 ${w} ${h}" data-serial="${serial}">
  <defs>
    ${buildSharedArtworkDefs({ primary, secondary, accent, h })}
    <clipPath id="label-trim-clip">
      <path d="${cutPath}" />
    </clipPath>
  </defs>
  <g clip-path="url(#label-trim-clip)">
    ${backgroundLayer}
    ${decorativeLayer || ''}
    ${accentLayer || ''}
    ${brandLogoLayer || ''}
    ${artworkLayer || ''}
    ${qrContainerLayer || ''}
    ${borderLayer || ''}
    ${typographyLayer}
    ${qrLayer}
  </g>
</svg>`;
}

export function triggerSvgStringDownload(svgMarkup: string, filename: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svgMarkup}`], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function triggerPrintReadyPngDownload(
  svgMarkup: string,
  filename: string,
  widthMm: number,
  heightMm: number,
  dpi = 300
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  // True 300 DPI pixel formula: mm / 25.4 * dpi
  const pxW = Math.round((widthMm / 25.4) * dpi);
  const pxH = Math.round((heightMm / 25.4) * dpi);
  const img = new Image();
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('SVG_RASTER_FAILED'));
      img.src = svgUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = pxW;
    canvas.height = pxH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, pxW, pxH);
    ctx.drawImage(img, 0, 0, pxW, pxH);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );
    if (!pngBlob) return false;
    const dlUrl = URL.createObjectURL(pngBlob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(dlUrl);
    return true;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
