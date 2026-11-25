export type Batch02StickerId =
  | 'neon-velocity'
  | 'cloudy-days'
  | 'urban-riot'
  | 'ocean-wonders'
  | 'pixel-quest'
  | 'candy-clouds'
  | 'botanical-journey'
  | 'royal-signature';

export interface Batch02StickerSpec {
  order: number;
  id: Batch02StickerId;
  filePrefix: string;
  internalNameEn: string;
  conceptEn: string;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMarginMm: number;
  dpi: number;
  scanCtaAr: 'امسح هنا';
  arabicMessage: string;
  artworkPublicUrl: string;
  palette: {
    primaryHex: string;
    secondaryHex: string;
    accentHex: string;
    highlightHex: string;
    textHex: string;
  };
  qrZoneMm: {
    x: number;
    y: number;
    size: number;
    quietZoneMm: number;
  };
  signatureElementIds: string[];
}

export interface Batch02BuildOptions {
  /** Override artwork image href (e.g., base64 data URI for 100% self-contained downloadable SVGs). */
  artworkHref?: string;
}

export const BATCH_02_STICKER_SPECS: Batch02StickerSpec[] = [
  {
    order: 1,
    id: 'neon-velocity',
    filePrefix: '01-neon-velocity',
    internalNameEn: 'Neon Velocity',
    conceptEn: 'Futuristic automotive / Neon Cyberpunk',
    widthMm: 74,
    heightMm: 82,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    scanCtaAr: 'امسح هنا',
    arabicMessage: 'لقيت حاجة؟ خلّينا نوصلها لصاحبها..',
    artworkPublicUrl: '/assets/batch02/artwork/01-neon-velocity.art.jpg',
    palette: {
      primaryHex: '#070B19',
      secondaryHex: '#00F0FF',
      accentHex: '#FF1E9A',
      highlightHex: '#7C3AED',
      textHex: '#FFFFFF',
    },
    qrZoneMm: { x: 20, y: 16.5, size: 34, quietZoneMm: 3 },
    signatureElementIds: [
      'nv-city-skyline',
      'nv-light-trails',
      'nv-neon-headphones',
      'nv-sports-car',
    ],
  },
  {
    order: 2,
    id: 'cloudy-days',
    filePrefix: '02-cloudy-days',
    internalNameEn: 'Cloudy Days',
    conceptEn: 'Cute sky / Pastel illustration',
    widthMm: 76,
    heightMm: 76,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    scanCtaAr: 'امسح هنا',
    arabicMessage: 'لقيتني؟ ساعدني أرجع لصاحبي!',
    artworkPublicUrl: '/assets/batch02/artwork/02-cloudy-days.art.jpg',
    palette: {
      primaryHex: '#BCE3FF',
      secondaryHex: '#C8B6FF',
      accentHex: '#FFF099',
      highlightHex: '#FFAFCC',
      textHex: '#17243A',
    },
    qrZoneMm: { x: 21, y: 16.5, size: 34, quietZoneMm: 3 },
    signatureElementIds: [
      'cd-pastel-rainbow',
      'cd-smiling-clouds',
      'cd-crescent-stars',
      'cd-hot-air-balloon',
    ],
  },
  {
    order: 3,
    id: 'urban-riot',
    filePrefix: '03-urban-riot',
    internalNameEn: 'Urban Riot',
    conceptEn: 'Street Art / Graffiti',
    widthMm: 76,
    heightMm: 78,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    scanCtaAr: 'امسح هنا',
    arabicMessage: 'لقيت الغرض؟ ساعد في إرجاعه لصاحبه!',
    artworkPublicUrl: '/assets/batch02/artwork/03-urban-riot.art.jpg',
    palette: {
      primaryHex: '#121318',
      secondaryHex: '#FF6B00',
      accentHex: '#FFE600',
      highlightHex: '#9333EA',
      textHex: '#111111',
    },
    qrZoneMm: { x: 21, y: 16.5, size: 34, quietZoneMm: 3 },
    signatureElementIds: [
      'ur-paint-splashes',
      'ur-spray-can',
      'ur-skateboard',
      'ur-street-headphones',
      'ur-graffiti-crown-arrows',
    ],
  },
  {
    order: 4,
    id: 'ocean-wonders',
    filePrefix: '04-ocean-wonders',
    internalNameEn: 'Ocean Wonders',
    conceptEn: 'Marine / Underwater world',
    widthMm: 76,
    heightMm: 78,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    scanCtaAr: 'امسح هنا',
    arabicMessage: 'لقيت حاجة؟ خلّينا نرجّعها لصاحبها!',
    artworkPublicUrl: '/assets/batch02/artwork/04-ocean-wonders.art.jpg',
    palette: {
      primaryHex: '#0A4D68',
      secondaryHex: '#05BFDB',
      accentHex: '#FF785A',
      highlightHex: '#00FFCA',
      textHex: '#FFFFFF',
    },
    qrZoneMm: { x: 21, y: 16.0, size: 34, quietZoneMm: 3 },
    signatureElementIds: [
      'ow-ocean-waves',
      'ow-sea-turtle',
      'ow-colorful-fish',
      'ow-coral-reefs',
      'ow-seashells-bubbles',
    ],
  },
  {
    order: 5,
    id: 'pixel-quest',
    filePrefix: '05-pixel-quest',
    internalNameEn: 'Pixel Quest',
    conceptEn: 'Retro Gaming / Pixel Art',
    widthMm: 74,
    heightMm: 78,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    scanCtaAr: 'امسح هنا',
    arabicMessage: 'لقيت الغرض؟ ساعد في إرجاعه لصاحبه!',
    artworkPublicUrl: '/assets/batch02/artwork/05-pixel-quest.art.jpg',
    palette: {
      primaryHex: '#0B132B',
      secondaryHex: '#00A8E8',
      accentHex: '#2EC4B6',
      highlightHex: '#7209B7',
      textHex: '#0B132B',
    },
    qrZoneMm: { x: 20, y: 16.2, size: 34, quietZoneMm: 3 },
    signatureElementIds: [
      'pq-pixel-adventurer',
      'pq-game-controller',
      'pq-treasure-chest',
      'pq-coins-platforms',
      'pq-pixel-hearts',
    ],
  },
  {
    order: 6,
    id: 'candy-clouds',
    filePrefix: '06-candy-clouds',
    internalNameEn: 'Candy Clouds',
    conceptEn: 'Cute Desserts / Sweet Illustration',
    widthMm: 78,
    heightMm: 78,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    scanCtaAr: 'امسح هنا',
    arabicMessage: 'لقيتني؟ رجّعني لصاحبي وخليه يفرح!',
    artworkPublicUrl: '/assets/batch02/artwork/06-candy-clouds.art.jpg',
    palette: {
      primaryHex: '#FFF5EC',
      secondaryHex: '#FF758F',
      accentHex: '#E63946',
      highlightHex: '#C77DFF',
      textHex: '#FFFFFF',
    },
    qrZoneMm: { x: 22, y: 15.8, size: 34, quietZoneMm: 3 },
    signatureElementIds: [
      'cc-glazed-donuts',
      'cc-frosted-cupcakes',
      'cc-french-macarons',
      'cc-swirl-lollipops',
      'cc-candies-sprinkles',
    ],
  },
  {
    order: 7,
    id: 'botanical-journey',
    filePrefix: '07-botanical-journey',
    internalNameEn: 'Botanical Journey',
    conceptEn: 'Botanical / Nature / Exploration',
    widthMm: 74,
    heightMm: 80,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    scanCtaAr: 'امسح هنا',
    arabicMessage: 'لقيت الغرض؟ ساعد في إرجاعه لصاحبه!',
    artworkPublicUrl: '/assets/batch02/artwork/07-botanical-journey.art.jpg',
    palette: {
      primaryHex: '#F7F3E8',
      secondaryHex: '#7A9A7E',
      accentHex: '#1F4E3D',
      highlightHex: '#D4B483',
      textHex: '#1F3A2E',
    },
    qrZoneMm: { x: 20, y: 15.6, size: 34, quietZoneMm: 3 },
    signatureElementIds: [
      'bj-tropical-leaves',
      'bj-botanical-flowers',
      'bj-organic-patterns',
      'bj-explorer-compass',
    ],
  },
  {
    order: 8,
    id: 'royal-signature',
    filePrefix: '08-royal-signature',
    internalNameEn: 'Royal Signature',
    conceptEn: 'Premium / Royal Elegance',
    widthMm: 72,
    heightMm: 84,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    scanCtaAr: 'امسح هنا',
    arabicMessage: 'لقيت هذا الغرض؟ ساعد في إعادته لصاحبه!',
    artworkPublicUrl: '/assets/batch02/artwork/08-royal-signature.art.jpg',
    palette: {
      primaryHex: '#091526',
      secondaryHex: '#D4AF37',
      accentHex: '#F9F6EE',
      highlightHex: '#9A7B2C',
      textHex: '#091526',
    },
    qrZoneMm: { x: 19, y: 23.4, size: 34, quietZoneMm: 3 },
    signatureElementIds: [
      'rs-gold-crown',
      'rs-laurel-wreaths',
      'rs-shield-frame',
      'rs-geometric-filigree',
    ],
  },
];

const ARABIC_FONT_STACK = "'Cairo', 'Noto Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif";
const LATIN_BRAND_FONT_STACK = "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates 8 distinct, print-safe single-subpath closed die-cut silhouettes (zero punch holes).
 */
export function getBatch02DieCutPath(id: Batch02StickerId, w: number, h: number): string {
  const cx = w / 2;
  switch (id) {
    case 'neon-velocity': {
      return [
        `M 11 1.6`,
        `L ${w - 11} 1.6`,
        `L ${w - 1.6} 11.5`,
        `L ${w - 1.6} ${h - 14.5}`,
        `L ${w - 9.5} ${h - 4.2}`,
        `L ${cx + 12} ${h - 1.5}`,
        `L ${cx - 12} ${h - 1.5}`,
        `L 9.5 ${h - 4.2}`,
        `L 1.6 ${h - 14.5}`,
        `L 1.6 11.5`,
        `Z`,
      ].join(' ');
    }
    case 'cloudy-days': {
      return [
        `M ${cx} 2.0`,
        `C ${cx + 11.5} 0.6, ${cx + 23.5} 4.2, ${w - 9.2} 12.2`,
        `C ${w - 1.2} 17.5, ${w - 0.8} 28.5, ${w - 3.6} 37.5`,
        `C ${w - 0.6} 46.8, ${w - 2.0} 58.6, ${w - 10.2} 65.8`,
        `C ${w - 17.5} 72.5, ${cx + 12.5} ${h - 1.2}, ${cx} ${h - 2.6}`,
        `C ${cx - 12.5} ${h - 1.2}, 17.5 72.5, 10.2 65.8`,
        `C 2.0 58.6, 0.6 46.8, 3.6 37.5`,
        `C 0.8 28.5, 1.2 17.5, 9.2 12.2`,
        `C ${cx - 23.5} 4.2, ${cx - 11.5} 0.6, ${cx} 2.0`,
        `Z`,
      ].join(' ');
    }
    case 'urban-riot': {
      return [
        `M 10.5 3.6`,
        `L ${cx - 10} 1.4`,
        `L ${cx + 11} 2.6`,
        `L ${w - 7.5} 1.6`,
        `L ${w - 1.4} 11.2`,
        `L ${w - 2.8} ${h * 0.44}`,
        `L ${w - 1.2} ${h - 14.5}`,
        `L ${w - 9.2} ${h - 1.6}`,
        `L ${cx + 8} ${h - 3.2}`,
        `L ${cx - 11} ${h - 1.4}`,
        `L 8.5 ${h - 2.8}`,
        `L 1.4 ${h - 13.0}`,
        `L 2.8 ${h * 0.46}`,
        `L 1.6 13.2`,
        `Z`,
      ].join(' ');
    }
    case 'ocean-wonders': {
      return [
        `M ${cx} 1.6`,
        `C ${cx + 16} 1.6, ${w - 6.5} 6.2, ${w - 2.8} 19.5`,
        `C ${w - 0.6} 30.0, ${w - 4.4} 40.5, ${w - 1.8} 52.5`,
        `C ${w - 0.6} 64.2, ${w - 8.2} ${h - 5.2}, ${cx + 15.5} ${h - 2.2}`,
        `C ${cx + 6.5} ${h - 0.6}, ${cx - 6.5} ${h - 0.6}, ${cx - 15.5} ${h - 2.2}`,
        `C 8.2 ${h - 5.2}, 0.6 64.2, 1.8 52.5`,
        `C 4.4 40.5, 0.6 30.0, 2.8 19.5`,
        `C 6.5 6.2, ${cx - 16} 1.6, ${cx} 1.6`,
        `Z`,
      ].join(' ');
    }
    case 'pixel-quest': {
      const s = 4.2;
      return [
        `M ${s * 2} 1.5`,
        `L ${w - s * 2} 1.5`,
        `L ${w - s * 2} ${1.5 + s}`,
        `L ${w - s} ${1.5 + s}`,
        `L ${w - s} ${1.5 + s * 2}`,
        `L ${w - 1.5} ${1.5 + s * 2}`,
        `L ${w - 1.5} ${h - 1.5 - s * 2}`,
        `L ${w - s} ${h - 1.5 - s * 2}`,
        `L ${w - s} ${h - 1.5 - s}`,
        `L ${w - s * 2} ${h - 1.5 - s}`,
        `L ${w - s * 2} ${h - 1.5}`,
        `L ${s * 2} ${h - 1.5}`,
        `L ${s * 2} ${h - 1.5 - s}`,
        `L ${s} ${h - 1.5 - s}`,
        `L ${s} ${h - 1.5 - s * 2}`,
        `L 1.5 ${h - 1.5 - s * 2}`,
        `L 1.5 ${1.5 + s * 2}`,
        `L ${s} ${1.5 + s * 2}`,
        `L ${s} ${1.5 + s}`,
        `L ${s * 2} ${1.5 + s}`,
        `Z`,
      ].join(' ');
    }
    case 'candy-clouds': {
      const rx = w / 2 - 2.2;
      const ry = h / 2 - 2.2;
      const cy = h / 2;
      const lobes = 16;
      const pts: string[] = [];
      for (let i = 0; i < lobes; i++) {
        const a0 = (i / lobes) * Math.PI * 2 - Math.PI / 2;
        const aMid = ((i + 0.5) / lobes) * Math.PI * 2 - Math.PI / 2;
        const a1 = ((i + 1) / lobes) * Math.PI * 2 - Math.PI / 2;
        const x0 = cx + Math.cos(a0) * (rx - 1.7);
        const y0 = cy + Math.sin(a0) * (ry - 1.7);
        const xC = cx + Math.cos(aMid) * (rx + 1.5);
        const yC = cy + Math.sin(aMid) * (ry + 1.5);
        const x1 = cx + Math.cos(a1) * (rx - 1.7);
        const y1 = cy + Math.sin(a1) * (ry - 1.7);
        if (i === 0) pts.push(`M ${x0.toFixed(2)} ${y0.toFixed(2)}`);
        pts.push(
          `C ${((x0 + xC) / 2).toFixed(2)} ${((y0 + yC) / 2).toFixed(2)}, ${((x1 + xC) / 2).toFixed(2)} ${((y1 + yC) / 2).toFixed(2)}, ${x1.toFixed(2)} ${y1.toFixed(2)}`
        );
      }
      pts.push('Z');
      return pts.join(' ');
    }
    case 'botanical-journey': {
      return [
        `M ${cx} 1.8`,
        `C ${cx + 19.5} 1.8, ${w - 3.6} 11.2, ${w - 2.0} 27.5`,
        `C ${w - 0.8} 43.0, ${w - 1.6} 58.0, ${w - 6.8} 68.8`,
        `C ${w - 12.2} 76.8, ${cx + 12.5} ${h - 1.6}, ${cx} ${h - 1.6}`,
        `C ${cx - 12.5} ${h - 1.6}, 12.2 76.8, 6.8 68.8`,
        `C 1.6 58.0, 0.8 43.0, 2.0 27.5`,
        `C 3.6 11.2, ${cx - 19.5} 1.8, ${cx} 1.8`,
        `Z`,
      ].join(' ');
    }
    case 'royal-signature': {
      return [
        `M ${cx} 1.6`,
        `C ${cx + 12.5} 1.6, ${w - 9.0} 4.2, ${w - 2.4} 9.6`,
        `L ${w - 1.8} 61.5`,
        `C ${w - 1.8} 72.8, ${cx + 14.5} 78.6, ${cx} ${h - 1.6}`,
        `C ${cx - 14.5} 78.6, 1.8 72.8, 1.8 61.5`,
        `L 2.4 9.6`,
        `C 9.0 4.2, ${cx - 12.5} 1.6, ${cx} 1.6`,
        `Z`,
      ].join(' ');
    }
  }
}

function buildOfficialFindItLogoSvg(opts: {
  cx: number;
  y: number;
  scale?: number;
  wordmarkColor: string;
  badgeFill: string;
  badgeTextColor: string;
  pinFill?: string;
  pinInnerColor?: string;
  plaque?: {
    width: number;
    height: number;
    rx: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity?: number;
  };
}): string {
  const {
    cx,
    y,
    scale = 1,
    wordmarkColor,
    badgeFill,
    badgeTextColor,
    pinFill = badgeFill,
    pinInnerColor = badgeTextColor,
    plaque,
  } = opts;

  const plaqueMarkup = plaque
    ? `<rect x="${(cx - plaque.width / 2).toFixed(2)}" y="${(y - plaque.height / 2).toFixed(2)}" width="${plaque.width}" height="${plaque.height}" rx="${plaque.rx}" fill="${plaque.fill}" fill-opacity="${plaque.opacity ?? 0.94}" stroke="${plaque.stroke}" stroke-width="${plaque.strokeWidth}" />`
    : '';

  return `
    <g id="official-findit-qr-logo" direction="ltr">
      ${plaqueMarkup}
      <g transform="translate(${cx.toFixed(2)}, ${y.toFixed(2)}) scale(${scale})">
        <g transform="translate(-14.8, -4.05)">
          <path d="M 3.1 0.1 C 1.38 0.1 0 1.48 0 3.2 C 0 5.38 2.48 7.52 3.1 8.05 C 3.72 7.52 6.2 5.38 6.2 3.2 C 6.2 1.48 4.82 0.1 3.1 0.1 Z" fill="${pinFill}" />
          <rect x="1.75" y="1.75" width="2.7" height="2.7" rx="0.45" fill="${pinInnerColor}" />
          <rect x="2.45" y="2.45" width="1.3" height="1.3" rx="0.2" fill="${pinFill}" />
        </g>
        <text x="-7.2" y="1.65" text-anchor="start" direction="ltr" unicode-bidi="isolate" fill="${wordmarkColor}" font-family="${LATIN_BRAND_FONT_STACK}" font-size="4.65" font-weight="900" letter-spacing="-0.12">FindIt</text>
        <rect x="6.7" y="-2.55" width="7.9" height="5.1" rx="1.35" fill="${badgeFill}" />
        <text x="10.65" y="1.25" text-anchor="middle" direction="ltr" unicode-bidi="isolate" fill="${badgeTextColor}" font-family="${LATIN_BRAND_FONT_STACK}" font-size="3.45" font-weight="900" letter-spacing="0.22">QR</text>
      </g>
    </g>`;
}

function buildBlankQrPlaceholderSvg(
  spec: Batch02StickerSpec,
  style: {
    frameStroke: string;
    frameStrokeWidth: number;
    outerGlowStroke?: string;
    rx: number;
    shadowColor?: string;
  }
): string {
  const { x, y, size, quietZoneMm } = spec.qrZoneMm;

  const shadowMarkup = style.shadowColor
    ? `<rect x="${(x + 0.75).toFixed(2)}" y="${(y + 0.95).toFixed(2)}" width="${size}" height="${size}" rx="${style.rx}" fill="${style.shadowColor}" fill-opacity="0.24" />`
    : '';

  const outerGlowMarkup = style.outerGlowStroke
    ? `<rect x="${(x - 1.35).toFixed(2)}" y="${(y - 1.35).toFixed(2)}" width="${(size + 2.7).toFixed(2)}" height="${(size + 2.7).toFixed(2)}" rx="${(style.rx + 0.9).toFixed(2)}" fill="none" stroke="${style.outerGlowStroke}" stroke-width="0.45" stroke-opacity="0.72" />`
    : '';

  return `
    <g id="qr-placement-wrapper" data-qr-size-mm="${size}" data-quiet-zone-mm="${quietZoneMm}">
      ${shadowMarkup}
      ${outerGlowMarkup}
      <rect id="qr-dynamic-placement-area" x="${x}" y="${y}" width="${size}" height="${size}" rx="${style.rx}" fill="#FFFFFF" stroke="${style.frameStroke}" stroke-width="${style.frameStrokeWidth}" data-qr-width-mm="${size}" data-qr-height-mm="${size}" data-quiet-zone-mm="${quietZoneMm}" />
    </g>`;
}

interface Batch02ComposedLayers {
  defsExtra: string;
  backgroundLayer: string;
  mainIllustrationLayer: string;
  decorativeElementsLayer: string;
  brandLogoLayer: string;
  qrPlaceholderLayer: string;
  arabicTextLayer: string;
}

function buildDesignLayers(spec: Batch02StickerSpec, options?: Batch02BuildOptions): Batch02ComposedLayers {
  const { widthMm: w, heightMm: h, bleedMm } = spec;
  const cx = w / 2;
  const qr = spec.qrZoneMm;
  const qrBottom = qr.y + qr.size;
  const artworkHref = options?.artworkHref || spec.artworkPublicUrl;
  const safeHref = escapeXml(artworkHref);

  const imgX = -bleedMm;
  const imgY = -bleedMm;
  const imgW = w + bleedMm * 2;
  const imgH = h + bleedMm * 2;

  switch (spec.id) {
    case 'neon-velocity': {
      const defsExtra = `
        <linearGradient id="nv-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#050814" />
          <stop offset="100%" stop-color="#0E1133" />
        </linearGradient>
        <linearGradient id="nv-cyan-mag" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00F0FF" />
          <stop offset="55%" stop-color="#7C3AED" />
          <stop offset="100%" stop-color="#FF1E9A" />
        </linearGradient>`;
      const backgroundLayer = `<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" fill="url(#nv-bg-grad)" />`;
      const mainIllustrationLayer = `
        <image id="nv-master-artwork" href="${safeHref}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" />
        <g id="nv-city-skyline" opacity="0.95" />
        <g id="nv-light-trails" opacity="0.95" />
        <g id="nv-neon-headphones" opacity="0.95" />
        <g id="nv-sports-car" opacity="0.95" />`;
      const decorativeElementsLayer = `
        <g id="nv-cyber-hud-frame" fill="none" stroke-linecap="round">
          <path d="M ${qr.x - 2.4} ${qr.y + 4.5} L ${qr.x - 2.4} ${qr.y - 2.2} L ${qr.x + 4.5} ${qr.y - 2.2}" stroke="#00F0FF" stroke-width="0.9" />
          <path d="M ${qr.x + qr.size + 2.4} ${qr.y + 4.5} L ${qr.x + qr.size + 2.4} ${qr.y - 2.2} L ${qr.x + qr.size - 4.5} ${qr.y - 2.2}" stroke="#FF1E9A" stroke-width="0.9" />
          <path d="M ${qr.x - 2.4} ${qrBottom - 4.5} L ${qr.x - 2.4} ${qrBottom + 2.2} L ${qr.x + 4.5} ${qrBottom + 2.2}" stroke="#FF1E9A" stroke-width="0.9" />
          <path d="M ${qr.x + qr.size + 2.4} ${qrBottom - 4.5} L ${qr.x + qr.size + 2.4} ${qrBottom + 2.2} L ${qr.x + qr.size - 4.5} ${qrBottom + 2.2}" stroke="#00F0FF" stroke-width="0.9" />
        </g>`;
      const brandLogoLayer = buildOfficialFindItLogoSvg({
        cx,
        y: 9.4,
        scale: 0.94,
        wordmarkColor: '#FFFFFF',
        badgeFill: '#00F0FF',
        badgeTextColor: '#070B19',
        pinFill: '#FF1E9A',
        pinInnerColor: '#FFFFFF',
        plaque: {
          width: 36.2,
          height: 8.2,
          rx: 2.2,
          fill: '#070B19',
          stroke: 'url(#nv-cyan-mag)',
          strokeWidth: 0.75,
          opacity: 0.93,
        },
      });
      const qrPlaceholderLayer = buildBlankQrPlaceholderSvg(spec, {
        frameStroke: '#00F0FF',
        frameStrokeWidth: 0.85,
        outerGlowStroke: '#FF1E9A',
        rx: 2.0,
        shadowColor: '#040712',
      });
      const arabicTextLayer = `
        <g id="nv-scan-cta">
          <path d="M ${cx - 12.2} ${qrBottom + 1.5} L ${cx + 10.6} ${qrBottom + 1.5} L ${cx + 12.4} ${qrBottom + 4.1} L ${cx + 10.6} ${qrBottom + 6.7} L ${cx - 12.2} ${qrBottom + 6.7} L ${cx - 10.6} ${qrBottom + 4.1} Z" fill="#00F0FF" stroke="#070B19" stroke-width="0.45" />
          <text x="${cx}" y="${qrBottom + 5.15}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#070B19" font-family="${ARABIC_FONT_STACK}" font-size="3.35" font-weight="900">${escapeXml(spec.scanCtaAr)}</text>
        </g>
        <g id="nv-arabic-message">
          <rect x="7.8" y="${qrBottom + 7.9}" width="${w - 15.6}" height="6.8" rx="2.0" fill="#070B19" fill-opacity="0.93" stroke="url(#nv-cyan-mag)" stroke-width="0.7" />
          <text x="${cx}" y="${qrBottom + 12.35}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#FFFFFF" font-family="${ARABIC_FONT_STACK}" font-size="2.75" font-weight="800">${escapeXml(spec.arabicMessage)}</text>
        </g>`;
      return { defsExtra, backgroundLayer, mainIllustrationLayer, decorativeElementsLayer, brandLogoLayer, qrPlaceholderLayer, arabicTextLayer };
    }

    case 'cloudy-days': {
      const defsExtra = `
        <linearGradient id="cd-sky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#BCE3FF" />
          <stop offset="100%" stop-color="#DCCEFF" />
        </linearGradient>`;
      const backgroundLayer = `<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" fill="url(#cd-sky-grad)" />`;
      const mainIllustrationLayer = `
        <image id="cd-master-artwork" href="${safeHref}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" />
        <g id="cd-pastel-rainbow" opacity="0.95" />
        <g id="cd-smiling-clouds" opacity="0.95" />
        <g id="cd-crescent-stars" opacity="0.95" />
        <g id="cd-hot-air-balloon" opacity="0.95" />`;
      const decorativeElementsLayer = `
        <g id="cd-sparkle-frame">
          <circle cx="${qr.x - 1.5}" cy="${qr.y - 1.3}" r="1.05" fill="#FFF099" stroke="#F59E0B" stroke-width="0.3" />
          <circle cx="${qr.x + qr.size + 1.5}" cy="${qr.y - 1.3}" r="1.05" fill="#FFAFCC" stroke="#EC4899" stroke-width="0.3" />
          <circle cx="${qr.x - 1.5}" cy="${qrBottom + 1.3}" r="0.95" fill="#C8B6FF" stroke="#7C3AED" stroke-width="0.3" />
          <circle cx="${qr.x + qr.size + 1.5}" cy="${qrBottom + 1.3}" r="0.95" fill="#BCE3FF" stroke="#3B82F6" stroke-width="0.3" />
        </g>`;
      const brandLogoLayer = buildOfficialFindItLogoSvg({
        cx,
        y: 10.0,
        scale: 0.91,
        wordmarkColor: '#2B3A67',
        badgeFill: '#7C65E8',
        badgeTextColor: '#FFFFFF',
        pinFill: '#FF7EA8',
        pinInnerColor: '#FFFFFF',
        plaque: {
          width: 34.5,
          height: 8.2,
          rx: 4.1,
          fill: '#FFFFFF',
          stroke: '#B39DDB',
          strokeWidth: 0.65,
          opacity: 0.95,
        },
      });
      const qrPlaceholderLayer = buildBlankQrPlaceholderSvg(spec, {
        frameStroke: '#9FA8DA',
        frameStrokeWidth: 0.8,
        outerGlowStroke: '#FFFFFF',
        rx: 3.4,
        shadowColor: '#7C65E8',
      });
      const arabicTextLayer = `
        <g id="cd-scan-cta">
          <rect x="${cx - 11.4}" y="${qrBottom + 1.5}" width="22.8" height="5.2" rx="2.6" fill="#7C65E8" stroke="#FFFFFF" stroke-width="0.55" />
          <text x="${cx}" y="${qrBottom + 5.15}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#FFFFFF" font-family="${ARABIC_FONT_STACK}" font-size="3.25" font-weight="900">${escapeXml(spec.scanCtaAr)}</text>
        </g>
        <g id="cd-arabic-message">
          <rect x="9.6" y="${qrBottom + 7.9}" width="${w - 19.2}" height="6.8" rx="3.4" fill="#FFFFFF" fill-opacity="0.96" stroke="#A78BFA" stroke-width="0.7" />
          <text x="${cx}" y="${qrBottom + 12.4}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#23315C" font-family="${ARABIC_FONT_STACK}" font-size="2.9" font-weight="800">${escapeXml(spec.arabicMessage)}</text>
        </g>`;
      return { defsExtra, backgroundLayer, mainIllustrationLayer, decorativeElementsLayer, brandLogoLayer, qrPlaceholderLayer, arabicTextLayer };
    }

    case 'urban-riot': {
      const defsExtra = `
        <linearGradient id="ur-street-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FF6B00" />
          <stop offset="100%" stop-color="#FFE600" />
        </linearGradient>`;
      const backgroundLayer = `<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" fill="#121318" />`;
      const mainIllustrationLayer = `
        <image id="ur-master-artwork" href="${safeHref}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" />
        <g id="ur-paint-splashes" opacity="0.95" />
        <g id="ur-spray-can" opacity="0.95" />
        <g id="ur-skateboard" opacity="0.95" />
        <g id="ur-street-headphones" opacity="0.95" />
        <g id="ur-graffiti-crown-arrows" opacity="0.95" />`;
      const decorativeElementsLayer = `
        <g id="ur-graffiti-frame-accents">
          <rect x="${qr.x - 1.8}" y="${qr.y - 1.8}" width="${qr.size + 3.6}" height="${qr.size + 3.6}" rx="2.0" fill="none" stroke="#FF6B00" stroke-width="0.85" />
          <path d="M ${qr.x - 2.9} ${qr.y + 6} L ${qr.x - 2.9} ${qr.y - 2.9} L ${qr.x + 6} ${qr.y - 2.9}" fill="none" stroke="#FFE600" stroke-width="1.15" />
          <path d="M ${qr.x + qr.size + 2.9} ${qrBottom - 6} L ${qr.x + qr.size + 2.9} ${qrBottom + 2.9} L ${qr.x + qr.size - 6} ${qrBottom + 2.9}" fill="none" stroke="#9333EA" stroke-width="1.15" />
        </g>`;
      const brandLogoLayer = buildOfficialFindItLogoSvg({
        cx,
        y: 9.8,
        scale: 0.94,
        wordmarkColor: '#FFFFFF',
        badgeFill: '#FFE600',
        badgeTextColor: '#111111',
        pinFill: '#FF6B00',
        pinInnerColor: '#111111',
        plaque: {
          width: 36.2,
          height: 8.2,
          rx: 1.6,
          fill: '#121318',
          stroke: '#FFE600',
          strokeWidth: 0.85,
          opacity: 0.96,
        },
      });
      const qrPlaceholderLayer = buildBlankQrPlaceholderSvg(spec, {
        frameStroke: '#121318',
        frameStrokeWidth: 0.9,
        rx: 1.4,
        shadowColor: '#000000',
      });
      const arabicTextLayer = `
        <g id="ur-scan-cta">
          <path d="M ${cx - 11.8} ${qrBottom + 1.5} L ${cx + 12.6} ${qrBottom + 1.5} L ${cx + 11.4} ${qrBottom + 6.7} L ${cx - 13.0} ${qrBottom + 6.7} Z" fill="#FFE600" stroke="#111111" stroke-width="0.65" />
          <text x="${cx}" y="${qrBottom + 5.15}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#111111" font-family="${ARABIC_FONT_STACK}" font-size="3.35" font-weight="900">${escapeXml(spec.scanCtaAr)}</text>
        </g>
        <g id="ur-arabic-message">
          <path d="M 8.2 ${qrBottom + 8.0} L ${w - 7.4} ${qrBottom + 8.0} L ${w - 8.6} ${qrBottom + 14.8} L 7.0 ${qrBottom + 14.8} Z" fill="#121318" fill-opacity="0.96" stroke="url(#ur-street-grad)" stroke-width="0.85" />
          <text x="${cx}" y="${qrBottom + 12.45}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#FFFFFF" font-family="${ARABIC_FONT_STACK}" font-size="2.7" font-weight="800">${escapeXml(spec.arabicMessage)}</text>
        </g>`;
      return { defsExtra, backgroundLayer, mainIllustrationLayer, decorativeElementsLayer, brandLogoLayer, qrPlaceholderLayer, arabicTextLayer };
    }

    case 'ocean-wonders': {
      const defsExtra = `
        <linearGradient id="ow-sea-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#05BFDB" />
          <stop offset="100%" stop-color="#0A4D68" />
        </linearGradient>`;
      const backgroundLayer = `<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" fill="url(#ow-sea-grad)" />`;
      const mainIllustrationLayer = `
        <image id="ow-master-artwork" href="${safeHref}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" />
        <g id="ow-ocean-waves" opacity="0.95" />
        <g id="ow-sea-turtle" opacity="0.95" />
        <g id="ow-colorful-fish" opacity="0.95" />
        <g id="ow-coral-reefs" opacity="0.95" />
        <g id="ow-seashells-bubbles" opacity="0.95" />`;
      const decorativeElementsLayer = `
        <g id="ow-marine-frame">
          <circle cx="${qr.x - 1.6}" cy="${qr.y - 1.3}" r="1.15" fill="#FFFFFF" fill-opacity="0.78" stroke="#00FFCA" stroke-width="0.35" />
          <circle cx="${qr.x + qr.size + 1.6}" cy="${qr.y - 1.3}" r="1.15" fill="#FFFFFF" fill-opacity="0.78" stroke="#00FFCA" stroke-width="0.35" />
          <circle cx="${qr.x + qr.size + 1.5}" cy="${qrBottom + 1.1}" r="0.9" fill="#FF785A" stroke="#FFFFFF" stroke-width="0.3" />
        </g>`;
      const brandLogoLayer = buildOfficialFindItLogoSvg({
        cx,
        y: 9.7,
        scale: 0.92,
        wordmarkColor: '#07354A',
        badgeFill: '#0A4D68',
        badgeTextColor: '#FFFFFF',
        pinFill: '#FF785A',
        pinInnerColor: '#FFFFFF',
        plaque: {
          width: 35.2,
          height: 8.2,
          rx: 4.1,
          fill: '#FFFFFF',
          stroke: '#05BFDB',
          strokeWidth: 0.7,
          opacity: 0.94,
        },
      });
      const qrPlaceholderLayer = buildBlankQrPlaceholderSvg(spec, {
        frameStroke: '#05BFDB',
        frameStrokeWidth: 0.85,
        outerGlowStroke: '#FFFFFF',
        rx: 2.8,
        shadowColor: '#042A3A',
      });
      const arabicTextLayer = `
        <g id="ow-scan-cta">
          <rect x="${cx - 11.4}" y="${qrBottom + 1.4}" width="22.8" height="5.2" rx="2.6" fill="#FF785A" stroke="#FFFFFF" stroke-width="0.55" />
          <text x="${cx}" y="${qrBottom + 5.05}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#FFFFFF" font-family="${ARABIC_FONT_STACK}" font-size="3.3" font-weight="900">${escapeXml(spec.scanCtaAr)}</text>
        </g>
        <g id="ow-arabic-message">
          <rect x="8.2" y="${qrBottom + 7.8}" width="${w - 16.4}" height="6.8" rx="3.4" fill="#07354A" fill-opacity="0.94" stroke="#00FFCA" stroke-width="0.65" />
          <text x="${cx}" y="${qrBottom + 12.25}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#FFFFFF" font-family="${ARABIC_FONT_STACK}" font-size="2.75" font-weight="800">${escapeXml(spec.arabicMessage)}</text>
        </g>`;
      return { defsExtra, backgroundLayer, mainIllustrationLayer, decorativeElementsLayer, brandLogoLayer, qrPlaceholderLayer, arabicTextLayer };
    }

    case 'pixel-quest': {
      const defsExtra = '';
      const backgroundLayer = `<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" fill="#0B132B" />`;
      const mainIllustrationLayer = `
        <image id="pq-master-artwork" href="${safeHref}" x="2.5" y="2.5" width="${w - 5}" height="${h - 5}" preserveAspectRatio="xMidYMid meet" />
        <g id="pq-pixel-adventurer" opacity="0.95" />
        <g id="pq-game-controller" opacity="0.95" />
        <g id="pq-treasure-chest" opacity="0.95" />
        <g id="pq-coins-platforms" opacity="0.95" />
        <g id="pq-pixel-hearts" opacity="0.95" />`;
      const decorativeElementsLayer = `
        <g id="pq-rpg-window-frame">
          <rect x="${qr.x - 1.9}" y="${qr.y - 1.9}" width="${qr.size + 3.8}" height="${qr.size + 3.8}" fill="none" stroke="#FFD166" stroke-width="0.85" />
          <rect x="${qr.x - 2.9}" y="${qr.y - 2.9}" width="2.2" height="2.2" fill="#2EC4B6" />
          <rect x="${qr.x + qr.size + 0.7}" y="${qr.y - 2.9}" width="2.2" height="2.2" fill="#2EC4B6" />
          <rect x="${qr.x - 2.9}" y="${qrBottom + 0.7}" width="2.2" height="2.2" fill="#2EC4B6" />
          <rect x="${qr.x + qr.size + 0.7}" y="${qrBottom + 0.7}" width="2.2" height="2.2" fill="#2EC4B6" />
        </g>`;
      const brandLogoLayer = buildOfficialFindItLogoSvg({
        cx,
        y: 9.8,
        scale: 0.92,
        wordmarkColor: '#FFFFFF',
        badgeFill: '#FFD166',
        badgeTextColor: '#0B132B',
        pinFill: '#2EC4B6',
        pinInnerColor: '#0B132B',
        plaque: {
          width: 35.2,
          height: 8.0,
          rx: 0.8,
          fill: '#0B132B',
          stroke: '#00A8E8',
          strokeWidth: 0.85,
          opacity: 0.96,
        },
      });
      const qrPlaceholderLayer = buildBlankQrPlaceholderSvg(spec, {
        frameStroke: '#00A8E8',
        frameStrokeWidth: 0.85,
        rx: 0.4,
        shadowColor: '#020617',
      });
      const arabicTextLayer = `
        <g id="pq-scan-cta">
          <rect x="${cx - 11.4}" y="${qrBottom + 1.7}" width="22.8" height="5.1" rx="0.6" fill="#2EC4B6" stroke="#0B132B" stroke-width="0.6" />
          <text x="${cx}" y="${qrBottom + 5.25}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#0B132B" font-family="${ARABIC_FONT_STACK}" font-size="3.3" font-weight="900">${escapeXml(spec.scanCtaAr)}</text>
        </g>
        <g id="pq-arabic-message">
          <rect x="7.8" y="${qrBottom + 7.9}" width="${w - 15.6}" height="6.6" rx="0.6" fill="#0B132B" fill-opacity="0.96" stroke="#FFD166" stroke-width="0.85" />
          <text x="${cx}" y="${qrBottom + 12.25}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#FFD166" font-family="${ARABIC_FONT_STACK}" font-size="2.65" font-weight="800">${escapeXml(spec.arabicMessage)}</text>
        </g>`;
      return { defsExtra, backgroundLayer, mainIllustrationLayer, decorativeElementsLayer, brandLogoLayer, qrPlaceholderLayer, arabicTextLayer };
    }

    case 'candy-clouds': {
      const defsExtra = '';
      const backgroundLayer = `<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" fill="#FFF5EC" />`;
      const mainIllustrationLayer = `
        <image id="cc-master-artwork" href="${safeHref}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" />
        <g id="cc-glazed-donuts" opacity="0.95" />
        <g id="cc-frosted-cupcakes" opacity="0.95" />
        <g id="cc-french-macarons" opacity="0.95" />
        <g id="cc-swirl-lollipops" opacity="0.95" />
        <g id="cc-candies-sprinkles" opacity="0.95" />`;
      const decorativeElementsLayer = `
        <g id="cc-patisserie-piping">
          <rect x="${qr.x - 1.7}" y="${qr.y - 1.7}" width="${qr.size + 3.4}" height="${qr.size + 3.4}" rx="3.8" fill="none" stroke="#FF758F" stroke-width="0.65" stroke-dasharray="1.8 1.2" />
        </g>`;
      const brandLogoLayer = buildOfficialFindItLogoSvg({
        cx,
        y: 9.6,
        scale: 0.90,
        wordmarkColor: '#FFFFFF',
        badgeFill: '#FFF5EC',
        badgeTextColor: '#E63946',
        pinFill: '#FFE066',
        pinInnerColor: '#E63946',
        plaque: {
          width: 34.4,
          height: 7.9,
          rx: 3.95,
          fill: '#FF5C8A',
          stroke: '#FFFFFF',
          strokeWidth: 0.75,
          opacity: 0.96,
        },
      });
      const qrPlaceholderLayer = buildBlankQrPlaceholderSvg(spec, {
        frameStroke: '#FF758F',
        frameStrokeWidth: 0.85,
        outerGlowStroke: '#FFFFFF',
        rx: 3.2,
        shadowColor: '#D6456B',
      });
      const arabicTextLayer = `
        <g id="cc-scan-cta">
          <rect x="${cx - 11.2}" y="${qrBottom + 1.4}" width="22.4" height="5.0" rx="2.5" fill="#E63946" stroke="#FFFFFF" stroke-width="0.55" />
          <text x="${cx}" y="${qrBottom + 4.95}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#FFFFFF" font-family="${ARABIC_FONT_STACK}" font-size="3.2" font-weight="900">${escapeXml(spec.scanCtaAr)}</text>
        </g>
        <g id="cc-arabic-message">
          <rect x="12.5" y="${qrBottom + 7.5}" width="${w - 25.0}" height="6.4" rx="3.2" fill="#FF5C8A" fill-opacity="0.97" stroke="#FFFFFF" stroke-width="0.7" />
          <text x="${cx}" y="${qrBottom + 11.75}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#FFFFFF" font-family="${ARABIC_FONT_STACK}" font-size="2.48" font-weight="800">${escapeXml(spec.arabicMessage)}</text>
        </g>`;
      return { defsExtra, backgroundLayer, mainIllustrationLayer, decorativeElementsLayer, brandLogoLayer, qrPlaceholderLayer, arabicTextLayer };
    }

    case 'botanical-journey': {
      const defsExtra = '';
      const backgroundLayer = `<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" fill="#F7F3E8" />`;
      const mainIllustrationLayer = `
        <image id="bj-master-artwork" href="${safeHref}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" />
        <g id="bj-tropical-leaves" opacity="0.95" />
        <g id="bj-botanical-flowers" opacity="0.95" />
        <g id="bj-organic-patterns" opacity="0.95" />
        <g id="bj-explorer-compass" opacity="0.95" />`;
      const decorativeElementsLayer = `
        <g id="bj-botanical-hairline-frame" fill="none">
          <rect x="${qr.x - 1.8}" y="${qr.y - 1.8}" width="${qr.size + 3.6}" height="${qr.size + 3.6}" rx="2.4" stroke="#B69356" stroke-width="0.55" />
          <circle cx="${qr.x - 1.8}" cy="${qr.y - 1.8}" r="0.85" fill="#1F4E3D" />
          <circle cx="${qr.x + qr.size + 1.8}" cy="${qr.y - 1.8}" r="0.85" fill="#1F4E3D" />
          <circle cx="${qr.x - 1.8}" cy="${qrBottom + 1.8}" r="0.85" fill="#1F4E3D" />
          <circle cx="${qr.x + qr.size + 1.8}" cy="${qrBottom + 1.8}" r="0.85" fill="#1F4E3D" />
        </g>`;
      const brandLogoLayer = buildOfficialFindItLogoSvg({
        cx,
        y: 9.4,
        scale: 0.90,
        wordmarkColor: '#F7F3E8',
        badgeFill: '#D4B483',
        badgeTextColor: '#1F3A2E',
        pinFill: '#D4B483',
        pinInnerColor: '#1F3A2E',
        plaque: {
          width: 34.6,
          height: 8.0,
          rx: 2.5,
          fill: '#1F4E3D',
          stroke: '#D4B483',
          strokeWidth: 0.65,
          opacity: 0.96,
        },
      });
      const qrPlaceholderLayer = buildBlankQrPlaceholderSvg(spec, {
        frameStroke: '#1F4E3D',
        frameStrokeWidth: 0.75,
        rx: 1.8,
        shadowColor: '#1F3A2E',
      });
      const arabicTextLayer = `
        <g id="bj-scan-cta">
          <rect x="${cx - 11.2}" y="${qrBottom + 1.5}" width="22.4" height="5.0" rx="1.8" fill="#1F4E3D" stroke="#D4B483" stroke-width="0.55" />
          <text x="${cx}" y="${qrBottom + 5.05}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#F7F3E8" font-family="${ARABIC_FONT_STACK}" font-size="3.2" font-weight="900">${escapeXml(spec.scanCtaAr)}</text>
        </g>
        <g id="bj-arabic-message">
          <rect x="8.8" y="${qrBottom + 7.6}" width="${w - 17.6}" height="6.4" rx="2.0" fill="#F7F3E8" fill-opacity="0.97" stroke="#1F4E3D" stroke-width="0.7" />
          <text x="${cx}" y="${qrBottom + 11.85}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#1F3A2E" font-family="${ARABIC_FONT_STACK}" font-size="2.58" font-weight="800">${escapeXml(spec.arabicMessage)}</text>
        </g>`;
      return { defsExtra, backgroundLayer, mainIllustrationLayer, decorativeElementsLayer, brandLogoLayer, qrPlaceholderLayer, arabicTextLayer };
    }

    case 'royal-signature': {
      const defsExtra = `
        <linearGradient id="rs-gold-foil" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#C9A23A" />
          <stop offset="50%" stop-color="#F2D785" />
          <stop offset="100%" stop-color="#B98E2B" />
        </linearGradient>`;
      const backgroundLayer = `<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" fill="#091526" />`;
      const mainIllustrationLayer = `
        <image id="rs-master-artwork" href="${safeHref}" x="-1.5" y="-2.5" width="${w + 3}" height="${w + 3}" preserveAspectRatio="xMidYMin slice" />
        <g id="rs-gold-crown" opacity="0.95" />
        <g id="rs-laurel-wreaths" opacity="0.95" />
        <g id="rs-shield-frame" opacity="0.95" />
        <g id="rs-geometric-filigree" opacity="0.95" />`;
      const decorativeElementsLayer = `
        <g id="rs-royal-double-frame" fill="none">
          <rect x="${qr.x - 1.6}" y="${qr.y - 1.6}" width="${qr.size + 3.2}" height="${qr.size + 3.2}" rx="1.6" stroke="url(#rs-gold-foil)" stroke-width="0.65" />
          <path d="M ${cx - 10} 75.6 L ${cx} 79.0 L ${cx + 10} 75.6" stroke="url(#rs-gold-foil)" stroke-width="0.7" />
          <circle cx="${cx}" cy="79.0" r="0.9" fill="#F2D785" />
        </g>`;
      const brandLogoLayer = buildOfficialFindItLogoSvg({
        cx,
        y: 18.7,
        scale: 0.84,
        wordmarkColor: '#F9F6EE',
        badgeFill: '#D4AF37',
        badgeTextColor: '#091526',
        pinFill: '#F2D785',
        pinInnerColor: '#091526',
        plaque: {
          width: 32.6,
          height: 6.5,
          rx: 1.5,
          fill: '#091526',
          stroke: 'url(#rs-gold-foil)',
          strokeWidth: 0.65,
          opacity: 0.94,
        },
      });
      const qrPlaceholderLayer = buildBlankQrPlaceholderSvg(spec, {
        frameStroke: '#D4AF37',
        frameStrokeWidth: 0.8,
        rx: 1.4,
        shadowColor: '#020617',
      });
      const arabicTextLayer = `
        <g id="rs-scan-cta">
          <rect x="${cx - 10.6}" y="${qrBottom + 1.4}" width="21.2" height="4.8" rx="1.3" fill="#F9F6EE" stroke="#D4AF37" stroke-width="0.65" />
          <text x="${cx}" y="${qrBottom + 4.8}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#091526" font-family="${ARABIC_FONT_STACK}" font-size="3.1" font-weight="900">${escapeXml(spec.scanCtaAr)}</text>
        </g>
        <g id="rs-arabic-message">
          <rect x="8.6" y="${qrBottom + 7.2}" width="${w - 17.2}" height="6.2" rx="1.5" fill="url(#rs-gold-foil)" stroke="#F9F6EE" stroke-width="0.5" />
          <text x="${cx}" y="${qrBottom + 11.25}" text-anchor="middle" direction="rtl" unicode-bidi="embed" fill="#091526" font-family="${ARABIC_FONT_STACK}" font-size="2.38" font-weight="900">${escapeXml(spec.arabicMessage)}</text>
        </g>`;
      return { defsExtra, backgroundLayer, mainIllustrationLayer, decorativeElementsLayer, brandLogoLayer, qrPlaceholderLayer, arabicTextLayer };
    }
  }
}

export function buildBatch02DesignLayers(spec: Batch02StickerSpec, options?: Batch02BuildOptions) {
  const layers = buildDesignLayers(spec, options);
  return {
    defsExtra: layers.defsExtra,
    backgroundLayer: layers.backgroundLayer,
    decorativeLayer: `${layers.mainIllustrationLayer}\n${layers.decorativeElementsLayer}`,
    accentLayer: layers.decorativeElementsLayer,
    brandLogoLayer: layers.brandLogoLayer,
    qrContainerLayer: layers.qrPlaceholderLayer,
    typographyLayer: layers.arabicTextLayer,
  };
}

export function getBatch02SpecByArtStyle(styleOrId: string): Batch02StickerSpec | undefined {
  const normalized = String(styleOrId || '')
    .trim()
    .toLowerCase()
    .replace(/^pilot-/, '')
    .replace(/^\d+-/, '')
    .replace(/_/g, '-');
  return BATCH_02_STICKER_SPECS.find((s) => s.id === normalized || s.filePrefix === styleOrId);
}

export function getBatch02DieCutPolygonMm(
  id: Batch02StickerId,
  w: number,
  h: number
): Array<{ x: number; y: number }> {
  const d = getBatch02DieCutPath(id, w, h);
  const hw = w / 2;
  const hh = h / 2;
  const toCentered = (xMm: number, yMm: number) => ({
    x: xMm - hw,
    y: hh - yMm,
  });

  const tokens = d
    .replace(/,/g, ' ')
    .replace(/([MLCZ])/gi, ' $1 ')
    .trim()
    .split(/\s+/);

  const pts: Array<{ x: number; y: number }> = [];
  let curX = 0;
  let curY = 0;
  let i = 0;

  while (i < tokens.length) {
    const cmd = tokens[i].toUpperCase();
    if (cmd === 'M' || cmd === 'L') {
      const x = parseFloat(tokens[i + 1]);
      const y = parseFloat(tokens[i + 2]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        curX = x;
        curY = y;
        pts.push(toCentered(x, y));
      }
      i += 3;
    } else if (cmd === 'C') {
      const x1 = parseFloat(tokens[i + 1]);
      const y1 = parseFloat(tokens[i + 2]);
      const x2 = parseFloat(tokens[i + 3]);
      const y2 = parseFloat(tokens[i + 4]);
      const x = parseFloat(tokens[i + 5]);
      const y = parseFloat(tokens[i + 6]);
      if (
        Number.isFinite(x1) &&
        Number.isFinite(y1) &&
        Number.isFinite(x2) &&
        Number.isFinite(y2) &&
        Number.isFinite(x) &&
        Number.isFinite(y)
      ) {
        const steps = 10;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const mt = 1 - t;
          const px =
            mt * mt * mt * curX +
            3 * mt * mt * t * x1 +
            3 * mt * t * t * x2 +
            t * t * t * x;
          const py =
            mt * mt * mt * curY +
            3 * mt * mt * t * y1 +
            3 * mt * t * t * y2 +
            t * t * t * y;
          pts.push(toCentered(px, py));
        }
        curX = x;
        curY = y;
      }
      i += 7;
    } else {
      i += 1;
    }
  }

  if (
    pts.length > 2 &&
    Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < 0.05
  ) {
    pts.pop();
  }
  return pts;
}

export function buildBatch02CleanStickerSvg(
  spec: Batch02StickerSpec,
  options?: Batch02BuildOptions
): string {
  const { widthMm: w, heightMm: h } = spec;
  const cutPath = getBatch02DieCutPath(spec.id, w, h);
  const layers = buildDesignLayers(spec, options);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" data-asset-type="clean-sticker-flat" data-batch="batch-02" data-design-id="${spec.id}" data-order="${spec.order}">
  <defs>
    <clipPath id="sticker-diecut-clip">
      <path d="${cutPath}" />
    </clipPath>
    ${layers.defsExtra}
  </defs>
  <g id="layer-sticker-white-border">
    <path d="${cutPath}" fill="#FFFFFF" />
  </g>
  <g id="layer-sticker-art-clipped" clip-path="url(#sticker-diecut-clip)">
    <g id="layer-background">${layers.backgroundLayer}</g>
    <g id="layer-main-illustration">${layers.mainIllustrationLayer}</g>
    <g id="layer-decorative-elements">${layers.decorativeElementsLayer}</g>
    <g id="layer-brand-logo">${layers.brandLogoLayer}</g>
    <g id="layer-qr-placeholder">${layers.qrPlaceholderLayer}</g>
    <g id="layer-arabic-text">${layers.arabicTextLayer}</g>
    <path d="${cutPath}" fill="none" stroke="#FFFFFF" stroke-width="3.0" stroke-linejoin="round" />
  </g>
</svg>`;
}

export function buildBatch02EditableSvg(
  spec: Batch02StickerSpec,
  options?: Batch02BuildOptions
): string {
  const { widthMm: w, heightMm: h } = spec;
  const cutPath = getBatch02DieCutPath(spec.id, w, h);
  const layers = buildDesignLayers(spec, options);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" data-asset-type="editable-source" data-batch="batch-02" data-design-id="${spec.id}" data-order="${spec.order}">
  <defs>
    <clipPath id="sticker-diecut-clip">
      <path d="${cutPath}" />
    </clipPath>
    ${layers.defsExtra}
  </defs>
  <g id="layer-sticker-white-border">
    <path d="${cutPath}" fill="#FFFFFF" />
  </g>
  <g id="layer-sticker-art-clipped" clip-path="url(#sticker-diecut-clip)">
    <g id="layer-background">${layers.backgroundLayer}</g>
    <g id="layer-main-illustration">${layers.mainIllustrationLayer}</g>
    <g id="layer-decorative-elements">${layers.decorativeElementsLayer}</g>
    <g id="layer-brand-logo">${layers.brandLogoLayer}</g>
    <g id="layer-qr-placeholder">${layers.qrPlaceholderLayer}</g>
    <g id="layer-arabic-text">${layers.arabicTextLayer}</g>
    <path d="${cutPath}" fill="none" stroke="#FFFFFF" stroke-width="3.0" stroke-linejoin="round" />
  </g>
  <g id="layer-die-cut-path">
    <path id="die-cut-contour-path" d="${cutPath}" fill="none" stroke="#EC008C" stroke-width="0.35" stroke-dasharray="1.6 0.9" />
  </g>
</svg>`;
}

export function buildBatch02PrintReadySvg(
  spec: Batch02StickerSpec,
  options?: Batch02BuildOptions
): string {
  const { widthMm: w, heightMm: h, bleedMm, safeMarginMm, dpi } = spec;
  const cutPath = getBatch02DieCutPath(spec.id, w, h);
  const layers = buildDesignLayers(spec, options);

  const outerPad = 8.5;
  const vbX = -outerPad;
  const vbY = -outerPad;
  const vbW = w + outerPad * 2;
  const vbH = h + outerPad * 2 + 5.5;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${vbW}mm" height="${vbH}mm" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" data-asset-type="print-ready" data-batch="batch-02" data-design-id="${spec.id}" data-order="${spec.order}" data-dpi="${dpi}" data-trim-mm="${w}x${h}" data-bleed-mm="${bleedMm}" data-safe-margin-mm="${safeMarginMm}">
  <defs>
    <clipPath id="sticker-diecut-clip">
      <path d="${cutPath}" />
    </clipPath>
    ${layers.defsExtra}
  </defs>
  <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="#FFFFFF" />
  <g id="layer-bleed-white-margin">
    <path d="${cutPath}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="${bleedMm * 2}" stroke-linejoin="round" />
  </g>
  <g id="layer-sticker-white-border">
    <path d="${cutPath}" fill="#FFFFFF" />
  </g>
  <g id="layer-sticker-art-clipped" clip-path="url(#sticker-diecut-clip)">
    <g id="layer-background">${layers.backgroundLayer}</g>
    <g id="layer-main-illustration">${layers.mainIllustrationLayer}</g>
    <g id="layer-decorative-elements">${layers.decorativeElementsLayer}</g>
    <g id="layer-brand-logo">${layers.brandLogoLayer}</g>
    <g id="layer-qr-placeholder">${layers.qrPlaceholderLayer}</g>
    <g id="layer-arabic-text">${layers.arabicTextLayer}</g>
    <path d="${cutPath}" fill="none" stroke="#FFFFFF" stroke-width="3.0" stroke-linejoin="round" />
  </g>
  <g id="layer-print-production-guides">
    <rect id="guide-bleed-box" x="${-bleedMm}" y="${-bleedMm}" width="${w + bleedMm * 2}" height="${h + bleedMm * 2}" fill="none" stroke="#06B6D4" stroke-width="0.22" stroke-dasharray="1.5 1.0" />
    <rect id="guide-safe-margin" x="${safeMarginMm}" y="${safeMarginMm}" width="${w - safeMarginMm * 2}" height="${h - safeMarginMm * 2}" fill="none" stroke="#10B981" stroke-width="0.2" stroke-dasharray="1.1 0.9" />
    <g id="layer-die-cut-path">
      <path id="die-cut-contour-path" d="${cutPath}" fill="none" stroke="#EC008C" stroke-width="0.38" stroke-dasharray="1.8 1.0" />
    </g>
    <g id="guide-crop-marks" stroke="#0F172A" stroke-width="0.28">
      <line x1="-6.8" y1="0" x2="-3.6" y2="0" /><line x1="0" y1="-6.8" x2="0" y2="-3.6" />
      <line x1="${w + 3.6}" y1="0" x2="${w + 6.8}" y2="0" /><line x1="${w}" y1="-6.8" x2="${w}" y2="-3.6" />
      <line x1="-6.8" y1="${h}" x2="-3.6" y2="${h}" /><line x1="0" y1="${h + 3.6}" x2="0" y2="${h + 6.8}" />
      <line x1="${w + 3.6}" y1="${h}" x2="${w + 6.8}" y2="${h}" /><line x1="${w}" y1="${h + 3.6}" x2="${w}" y2="${h + 6.8}" />
    </g>
    <text x="${w / 2}" y="${h + 6.8}" text-anchor="middle" fill="#334155" font-family="monospace" font-size="1.45" font-weight="700">
      TRIM ${w}x${h}mm | BLEED +${bleedMm}mm | SAFE -${safeMarginMm}mm | CUTCONTOUR | ${dpi} DPI
    </text>
  </g>
</svg>`;
}
