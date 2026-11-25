import { TagDesignTemplate } from '../types/domain';

/**
 * Pebble Pop (Template #2) — Faithful implementation of the approved visual reference.
 * Vertical organic pebble silhouette (58 × 68 mm) featuring Warm Cream base (#FFF3DF),
 * Primary Teal canopy/bottom wave (#009BA8), Vivid Orange patches & sprinkles (#FF7A00),
 * Yellow Sun & FindIt QR pin badge (#FFC800), isolated white QR frame, and bilingual copy.
 * Pure printable artwork only (no holes, rings, clips, or physical hardware).
 */
export const PEBBLE_POP_TEMPLATE: TagDesignTemplate = {
  id: 'pilot-pebble-pop',
  slug: 'pebble-pop-organic-label',
  titleAr: 'Pebble Pop — ملصق عضوي مبهج للممتلكات',
  titleEn: 'Pebble Pop — Organic Soft Printable Label',
  subtitleAr:
    'ملصق رقمي قابل للطباعة بشكل حصوة عضوية ناعمة يجمع بين الكريمي الدافئ والتركوازي والبرتقالي والشمس الصفراء، مع رسالة تواصل ثنائية اللغة ورمز QR حقيقي.',
  subtitleEn:
    'Playful organic pebble printable QR label pairing a warm cream base, teal waves, orange accents, a yellow sun illustration, FindIt QR pin badge, and bilingual owner-contact copy.',
  category: 'sticker',
  domainCategory: 'personal',
  templateScope: 'general',
  shapeSilhouette: 'organic_pebble',
  specialtyBadgeAr: 'قالب معتمد #2 · Personal Items',
  specialtyBadgeEn: 'Template #2 · Personal Items',
  materialAr: 'فينيل مطفي ناعم الملمس (Soft-Touch Matte) أو فينيل مقاوم للماء',
  materialEn: 'Soft-Touch Matte Laminate Vinyl or Waterproof Satin Stock',
  dimensionsMm: '58 × 68 mm',
  weatherproofRating: '300 DPI · Soft-Touch Matte Vinyl',
  primaryHex: '#009BA8',
  secondaryHex: '#FFF3DF',
  badgeColorHex: '#FF7A00',
  priceSar: 39,
  priceUsd: 10,
  includedInTier: 'plus',
  isPilotShowcase: true,
  pilotArtStyle: 'pebble_pop',
  defaultCalloutText: 'Scan to Contact the Owner',
  pilotConceptAr:
    'تنفيذ مطابق للتصميم المعتمد لملصق Pebble Pop بأبعاده العضوية العمودية وخلفية الكريمي الدافئ والأمواج التركوازية والبرتقالية والشمس الصفراء، دون أي ثقوب أو إضافات معدنية — جاهز للتخصيص والطباعة الصافية.',
  pilotConceptEn:
    'Faithful production build of the approved Pebble Pop vertical pebble layout—clean printable artwork free of holes, rings, or hardware—ready for color customization, bilingual copy editing, and 300 DPI print export.',
  visualIdentityAr:
    'قصة حصوة عضوية عمودية (58 × 68 مم)؛ خلفية كريمية (#FFF3DF)، أمواج تركوازية (#009BA8)، لمسات برتقالية (#FF7A00)، شمس صفراء وشارة FindIt QR، وإطار QR أبيض نقي.',
  visualIdentityEn:
    'Vertical organic pebble die-cut (58 × 68 mm); Warm Cream (#FFF3DF), Primary Teal (#009BA8), Orange Accents (#FF7A00), Sunny Gold (#FFC800), crisp white QR pad, and bilingual EN/AR callout.',
  featuresAr: [
    'مطابقة بصرية دقيقة للتصميم المعتمد: شمس صفراء، شعار FindIt QR، رذاذ برتقالي مرح، وعبارتا التواصل بالإنجليزية والعربية',
    'طبقات متجهية منظمة وقابلة للتعديل بالكامل في ملف المصدر SVG (الخلفية، الأشكال التركوازية، اللمسات البرتقالية والشمس، الشعار، حاوية QR، كود QR، النصوص، وخط القص)',
    'تخصيص حي للألوان الثلاثة والنص ومحتوى كود QR مع تطابق 1:1 بين المحرر ومعاينة 3D وملف الطباعة 300 DPI SVG وPNG',
  ],
  featuresEn: [
    'Exact faithful reproduction of the approved Pebble Pop visual reference (cream base, teal canopy & wave, orange patches & confetti dashes, yellow sun, FindIt QR pin, and EN/AR text)',
    'Structured editable SVG source with separated semantic vector layers (no holes, rings, or photographic backgrounds)',
    'Live customization of Primary Teal, Cream, Orange Accent, English & Arabic copy, and dynamic real ISO-18004 QR synced across Preview, 3D Studio, Print SVG, and 300 DPI PNG',
  ],
  recommendedForAr: [
    'زجاجات المياه وحافظات الأجهزة',
    'الدفاتر والحقائب المدرسية واليومية',
    'صناديق الأدوات والأغراض الشخصية',
    'حقائب السفر اليدوية والملحقات',
  ],
  recommendedForEn: [
    'Water Bottles & Daily Pouches',
    'Notebooks, School Bags & Tech Cases',
    'Everyday Carry & Personal Gear',
    'Travel Organizers & Lunchboxes',
  ],
  printSpecs: {
    trimWidthMm: 58,
    trimHeightMm: 68,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    colorSpace: 'CMYK Print-Safe (sRGB Preview)',
    dieCutShapeAr: 'قصة حصوة عضوية ناعمة بدون ثقوب (Organic Pebble Die-Cut)',
    dieCutShapeEn: 'Clean Organic Pebble Contour Die-Cut (No Holes or Hardware)',
    availableSizesMm: [
      '58 × 68 mm (المقاس المعتمد للتصميم)',
      '46 × 54 mm (مضغوط للأجهزة والحافظات)',
      '72 × 84 mm (كبير للزجاجات والحقائب)',
    ],
    defaultMaterial: 'soft_matte_foil',
    recommendedMaterials: [
      {
        id: 'soft_matte_foil',
        nameAr: 'فينيل مطفي ناعم الملمس (Soft-Touch Matte)',
        nameEn: 'Soft-Touch Matte Laminated Vinyl',
        notesAr: 'يحافظ على دفء الكريمي وإشراق التركواز والبرتقالي مع امتصاص اللمعان لقراءة مثالية للرمز.',
        notesEn: 'Preserves warm cream and vivid teal/orange contrast with a glare-free matte surface.',
      },
      {
        id: 'waterproof_vinyl',
        nameAr: 'فينيل مقاوم للماء والغسيل (Waterproof Satin Vinyl)',
        nameEn: 'Waterproof Satin Adhesive Vinyl',
        notesAr: 'مثالي لزجاجات المياه والحقائب اليومية مع ثبات لوني عالٍ ومقاومة للماء.',
        notesEn: 'Waterproof laminated vinyl ideal for water bottles, school gear, and travel organizers.',
      },
    ],
  },
  isFeatured: true,
  customizationMode: 'full',
  tags: ['pilot', 'pebble-pop', 'template-2', 'organic-sticker', 'bilingual'],
  licenseTypeId: 'lic-personal-standard',
  salesCount: 0,
  usageCount: 0,
};
