import { TagDesignTemplate } from '../types/domain';

/**
 * Batch 01 — Four New Distinct Printable Templates (alongside verified Pebble Pop #2).
 * Every template is pure printable artwork ONLY (no holes, rings, grommets, cords, clips, or lifestyle mockups).
 */

export const METRO_TICKET_TEMPLATE: TagDesignTemplate = {
  id: 'pilot-metro-ticket',
  slug: 'metro-ticket-travel-label',
  titleAr: 'Metro Ticket — تذكرة السفر الكلاسيكية',
  titleEn: 'Metro Ticket — Vintage Travel Label',
  subtitleAr:
    'تصميم مستوحى من تذاكر السفر الكلاسيكية والبريد الجوي بالكحلي والأحمر والكريمي مع أفق أهرامات الجيزة وبرج القاهرة، ورمز QR حقيقي عالي التباين.',
  subtitleEn:
    'Retro notched travel-ticket QR label combining navy & red airmail stripes, a Cairo travel skyline stamp, FindIt QR pin mark, and bilingual owner recovery copy.',
  category: 'luggage_tag',
  domainCategory: 'travel',
  templateScope: 'specialized',
  shapeSilhouette: 'metro_ticket',
  specialtyBadgeAr: 'دفعة 01 · تذكرة سفر',
  specialtyBadgeEn: 'Batch 01 · Travel Ticket',
  materialAr: 'فينيل سفر مطفي مقاوم للماء والخدوش (Waterproof Travel Vinyl)',
  materialEn: 'Waterproof Matte Travel Vinyl or Luggage Laminate Stock',
  dimensionsMm: '58 × 88 mm',
  weatherproofRating: '300 DPI · Waterproof Travel Vinyl',
  primaryHex: '#0D2B52',
  secondaryHex: '#F9E7C8',
  badgeColorHex: '#D84040',
  priceSar: 42,
  priceUsd: 11,
  includedInTier: 'plus',
  isPilotShowcase: true,
  pilotArtStyle: 'metro_ticket',
  defaultCalloutText: 'Scan to Contact the Owner',
  pilotConceptAr:
    'تصميم تذكرة سفر مقصوصة بأركان وثنيات تذاكر كلاسيكية وإطار بريد جوي مائل مع طائرة وختم TRAVEL ITEM وأفق سياحي في الأسفل — عمل فني نظيف للطباعة فقط دون ثقوب أو خيوط.',
  pilotConceptEn:
    'Authentic retro notched travel-ticket label pairing cream parchment, navy & red airmail border stripes, dispatch stamp, printed baggage tag icon, and sunset pyramid skyline — zero physical hardware or holes.',
  visualIdentityAr:
    'قصة تذكرة سفر (58 × 88 مم)؛ كحلي داكن (#0D2B52)، أحمر بريدي (#D84040)، كريمي عتيق (#F9E7C8)، وشمس ذهبية (#F4B43A) مع نصوص عربية وإنجليزية.',
  visualIdentityEn:
    'Notched retro ticket die-cut (58 × 88 mm); Travel Navy (#0D2B52), Airmail Red (#D84040), Vintage Cream (#F9E7C8), Amber Sun (#F4B43A), and bilingual EN/AR typography.',
  featuresAr: [
    'هوية تذكرة سفر متكاملة: زوايا مقصوصة، ثنيات جانبية، شرائط البريد الجوي المائلة، طائرة وختم سفر وأفق الأهرامات وبرج القاهرة',
    'طبقات متجهية منظمة وقابلة للتعديل في ملف المصدر SVG دون أي ثقوب أو حلقات أو خيوط تعليق',
    'تخصيص حي للألوان الثلاثة (الكحلي، الكريمي، الأحمر) والنصين الإنجليزي والعربي ورمز QR الفعلي بدقة طباعة 300 DPI',
  ],
  featuresEn: [
    'Distinctive vintage travel-ticket identity with concave corners, side ticket notches, airmail border stripes, dispatch postmark, and Cairo skyline silhouette',
    'Clean printable vector artwork packaged with separated Editable SVG layers (no holes, cords, or hardware)',
    'Synchronized live color, bilingual copy, and ISO-18004 QR customization across 3D Studio, Print SVG, and 300 DPI PNG',
  ],
  recommendedForAr: [
    'حقائب السفر والمقصورة',
    'حافظات جوازات السفر ووثائق الرحلات',
    'حقائب الكاميرات والرحلات الجوية',
    'صناديق الشحن والأمتعة العائلية',
  ],
  recommendedForEn: [
    'Cabin Suitcases & Checked Luggage',
    'Passport Folios & Travel Pouches',
    'Expedition Gear & Camera Cases',
    'Backpacks & Airport Carry-Ons',
  ],
  printSpecs: {
    trimWidthMm: 58,
    trimHeightMm: 88,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    colorSpace: 'CMYK Print-Safe (sRGB Preview)',
    dieCutShapeAr: 'قصة تذكرة سفر بثنيات جانبية وزوايا مقوسة للداخل بدون ثقوب',
    dieCutShapeEn: 'Notched Retro Ticket Die-Cut Contour (No Holes or Hardware)',
    availableSizesMm: [
      '58 × 88 mm (المقاس المعتمد للتصميم)',
      '50 × 76 mm (مناسب لحافظات الجواز)',
      '70 × 106 mm (كبير لحقائب الشحن)',
    ],
    defaultMaterial: 'waterproof_vinyl',
    recommendedMaterials: [
      {
        id: 'waterproof_vinyl',
        nameAr: 'فينيل سفر مطفي مقاوم للماء والخدوش',
        nameEn: 'Waterproof Matte Travel Vinyl',
        notesAr: 'يحمي الخطوط البريدية وألوان الكريمي والكحلي من الرطوبة والاحتكاك أثناء السفر.',
        notesEn: 'Resists moisture, baggage handling abrasion, and UV fading during travel.',
      },
      {
        id: 'soft_matte_foil',
        nameAr: 'فينيل مطفي ناعم الملمس (Soft-Touch Matte)',
        nameEn: 'Soft-Touch Matte Laminate',
        notesAr: 'ملمس ورقي فاخر يبرز الطابع العتيق للتذكرة دون لمعان يعيق مسح الكود.',
        notesEn: 'Paper-like matte tactile finish highlighting the retro ticket aesthetic without glare.',
      },
    ],
  },
  isFeatured: true,
  customizationMode: 'full',
  tags: ['batch-01', 'metro-ticket', 'travel', 'vintage-ticket', 'bilingual'],
  licenseTypeId: 'lic-personal-standard',
  salesCount: 0,
  usageCount: 0,
};

export const JELLY_CUBE_TEMPLATE: TagDesignTemplate = {
  id: 'pilot-jelly-cube',
  slug: 'jelly-cube-soft-label',
  titleAr: 'Jelly Cube — مكعب الجيلي المرن',
  titleEn: 'Jelly Cube — Glossy Playful Label',
  subtitleAr:
    'تصميم شبابي مبهج بقصة ناعمة مستوحاة من مكعبات الجيلي الشفافة بتدرجات البنفسجي والوردي والسيان واللمعات المرسومة مع نجمة مبتسمة.',
  subtitleEn:
    'Playful glossy jelly-inspired printable QR label blending vibrant violet, pink, cyan, and sunny yellow highlights with soft pill typography.',
  category: 'sticker',
  domainCategory: 'personal',
  templateScope: 'general',
  shapeSilhouette: 'jelly_cushion',
  specialtyBadgeAr: 'دفعة 01 · شبابي / عام',
  specialtyBadgeEn: 'Batch 01 · Youth & General',
  materialAr: 'فينيل لامع مقاوم للأشعة والغسيل (UV Gloss Jelly Vinyl)',
  materialEn: 'High-Gloss UV Vinyl Laminate',
  dimensionsMm: '70 × 70 mm',
  weatherproofRating: '300 DPI · UV Gloss Vinyl',
  primaryHex: '#7B2FF7',
  secondaryHex: '#FF4DB8',
  badgeColorHex: '#00D4FF',
  priceSar: 39,
  priceUsd: 10,
  includedInTier: 'plus',
  isPilotShowcase: true,
  pilotArtStyle: 'jelly_cube',
  defaultCalloutText: 'Scan to Contact the Owner',
  pilotConceptAr:
    'عمل فني لامع ومبهج على شكل وسادة جيلي رباعية الانحناءات بلمسات سماعات ويد تحكم ونجمة صفراء ضاحكة، نظيف تمامًا للطباعة بدون أي فتحات أو حبال تعليق.',
  pilotConceptEn:
    'Glossy vector jelly cushion silhouette featuring soft translucent highlights, gaming & music vector icons, smiling yellow star, and isolated white QR pad — pure printable artwork with no cords or holes.',
  visualIdentityAr:
    'قصة وسادة جيلي مرنة (70 × 70 مم)؛ بنفسجي (#7B2FF7)، وردي حيوي (#FF4DB8)، سماوي سيان (#00D4FF)، وأصفر مشرق (#FFD53D).',
  visualIdentityEn:
    'Soft 4-lobe jelly cushion die-cut (70 × 70 mm); Electric Violet (#7B2FF7), Pop Pink (#FF4DB8), Sky Cyan (#00D4FF), and Sunny Yellow (#FFD53D).',
  featuresAr: [
    'تدرجات جيلي زاهية ولمسات إضاءة متجهية ناعمة مع رموز ترفيهية ونجمة مبتسمة وكبسولات نصية عالية الوضوح',
    'إزالة كاملة لأي حبال أو خرز أو ثقوب تعليق — قالب طباعة مسطح 100٪ ومطابق لمواصفات القص الرقمي',
    'تخصيص فوري للألوان الثلاثة والنص الثنائي اللغة ورابط QR الفعلي في جميع وضعيات العرض والتصدير',
  ],
  featuresEn: [
    'Expressive jelly gradients, glossy vector specular highlights, playful icon motifs, and bilingual pill banners',
    '100% standalone printable artwork (strictly free of cords, beads, holes, or hanging hardware)',
    'Real-time customization of Primary Violet, Pop Pink, Cyan Accent, English & Arabic copy, and live QR content',
  ],
  recommendedForAr: [
    'أجهزة الألعاب المحمولة والسماعات',
    'زجاجات المياه وحقائب الجامعة',
    'الدفاتر والأجهزة اللوحية',
    'حافظات الشواحن والملحقات اليومية',
  ],
  recommendedForEn: [
    'Handheld Consoles & Headphones',
    'Water Bottles & Campus Backpacks',
    'Tablets, Notebooks & Cases',
    'Everyday Tech & Youth Gear',
  ],
  printSpecs: {
    trimWidthMm: 70,
    trimHeightMm: 70,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    colorSpace: 'CMYK Print-Safe (sRGB Preview)',
    dieCutShapeAr: 'قصة وسادة جيلي عضوية رباعية التموج بدون ثقوب',
    dieCutShapeEn: 'Soft 4-Lobe Jelly Cushion Die-Cut (No Holes or Hardware)',
    availableSizesMm: [
      '70 × 70 mm (المقاس المعتمد للتصميم)',
      '55 × 55 mm (متوسط للأجهزة والسماعات)',
      '85 × 85 mm (كبير للحقائب واللابتوب)',
    ],
    defaultMaterial: 'glossy_vinyl',
    recommendedMaterials: [
      {
        id: 'glossy_vinyl',
        nameAr: 'فينيل لامع مقاوم للغسيل UV Gloss',
        nameEn: 'Washable UV Gloss Vinyl',
        notesAr: 'يعزز المظهر الجيلي الزجاجي والألوان المتدرجة مع حماية ضد الخدوش والماء.',
        notesEn: 'Amplifies glossy depth and candy gradient saturation with waterproof UV protection.',
      },
      {
        id: 'waterproof_vinyl',
        nameAr: 'فينيل ساتان مقاوم للماء',
        nameEn: 'Waterproof Satin Vinyl',
        notesAr: 'خيار متوازن يقلل انعكاس الضوء حول الكود مع الحفاظ على حيوية التدرجات.',
        notesEn: 'Balanced satin stock that minimizes glare over the QR scan zone.',
      },
    ],
  },
  isFeatured: true,
  customizationMode: 'full',
  tags: ['batch-01', 'jelly-cube', 'youth', 'glossy-sticker', 'bilingual'],
  licenseTypeId: 'lic-personal-standard',
  salesCount: 0,
  usageCount: 0,
};

export const HEXA_PULSE_TEMPLATE: TagDesignTemplate = {
  id: 'pilot-hexa-pulse',
  slug: 'hexa-pulse-tech-label',
  titleAr: 'Hexa Pulse — النبض السداسي التقني',
  titleEn: 'Hexa Pulse — Geometric Tech Label',
  subtitleAr:
    'تصميم هندسي مستقبلي بشكل سداسي حاد بأرضية كحلية داكنة وتوهج سيان نيوني وأصفر تقني مع أيقونات أجهزة وموجة نبض رقمية.',
  subtitleEn:
    'Futuristic hexagonal die-cut label with deep navy foundation, electric cyan circuit geometry, high-contrast yellow accents, and gadget iconography.',
  category: 'sticker',
  domainCategory: 'business',
  templateScope: 'specialized',
  shapeSilhouette: 'tech_hexagon',
  specialtyBadgeAr: 'دفعة 01 · تقني / أجهزة',
  specialtyBadgeEn: 'Batch 01 · Tech & Gadgets',
  materialAr: 'بوليستر صناعي مطفي مقاوم للمذيبات والخدش (Brushed Polyester)',
  materialEn: 'Brushed Industrial Polyester or Heavy-Duty Tech Vinyl',
  dimensionsMm: '70 × 80 mm',
  weatherproofRating: '300 DPI · Tech-Grade Vinyl / Polyester',
  primaryHex: '#0B1B3B',
  secondaryHex: '#00E5FF',
  badgeColorHex: '#FFD600',
  priceSar: 45,
  priceUsd: 12,
  includedInTier: 'plus',
  isPilotShowcase: true,
  pilotArtStyle: 'hexa_pulse',
  defaultCalloutText: 'Scan to Contact the Owner',
  pilotConceptAr:
    'تصميم سداسي هندسي مخصص للأجهزة الذكية ومعدات العمل والتصوير؛ يتميز بمسارات دوائر إلكترونية وشبكة سداسية وشرائط تحذير صفراء وموجة نبض بالسيان دون أي حلقات أو فتحات معدنية.',
  pilotConceptEn:
    'Vertical hexagonal tech nameplate featuring beveled cyan rim circuits, honeycomb micro-mesh, caution hash stripes, peripheral icons, and waveform graphic — engineered cleanly as flat printable artwork without hardware.',
  visualIdentityAr:
    'قصة سداسية هندسية (70 × 80 مم)؛ كحلي عميق (#0B1B3B)، سيان تقني (#00E5FF)، أصفر نبضي (#FFD600)، ورمادي صلب (#7A8A9A).',
  visualIdentityEn:
    'Crisp vertical hexagon die-cut (70 × 80 mm); Deep Navy (#0B1B3B), Electric Cyan (#00E5FF), Signal Yellow (#FFD600), and Cool Slate (#7A8A9A).',
  featuresAr: [
    'هوية هندسية تقنية حادة: مسارات دوائر إلكترونية، شبكة سداسية، أشرطة تحذير صفراء، وأيقونات سماعات ولابتوب وهاتف وUSB',
    'تباين فائق لكود QR الأبيض المعزول بزوايا تقنية مقطوعة على خلفية داكنة مع نصوص إنجليزية وعربية واضحة',
    'جاهز للطباعة الصافية 300 DPI (بدون حلقات معدنية أو ثقوب) مع طبقات متجهية منظمة وتخصيص كامل',
  ],
  featuresEn: [
    'Sharp hexagonal tech architecture featuring circuit traces, honeycomb patterns, caution bars, gadget vectors, and ECG pulse',
    'High-contrast isolated white QR pad framed with segmented tech corner brackets over a deep navy base',
    'Clean printable output (no metal grommets or clips) with separated SVG layers and live color/copy editing',
  ],
  recommendedForAr: [
    'أجهزة اللابتوب والكمبيوتر المحمول',
    'حقائب الكاميرات والدرون والمعدات',
    'الأقراص الصلبة ومحطات الشحن',
    'الأجهزة المؤسسية وعهدة المهندسين',
  ],
  recommendedForEn: [
    'Laptops & Engineering Workstations',
    'Drone Cases, Cameras & Audio Kits',
    'External SSDs & Power Stations',
    'Corporate Tech Assets & Gadgets',
  ],
  printSpecs: {
    trimWidthMm: 70,
    trimHeightMm: 80,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    colorSpace: 'CMYK Print-Safe (sRGB Preview)',
    dieCutShapeAr: 'قصة سداسية هندسية عمودية بزوايا مشطوفة بدقة بدون ثقوب',
    dieCutShapeEn: 'Pointed Vertical Hexagon Die-Cut (No Holes or Hardware)',
    availableSizesMm: [
      '70 × 80 mm (المقاس المعتمد للتصميم)',
      '56 × 64 mm (مناسب للهواتف والأقراص)',
      '84 × 96 mm (كبير لحقائب المعدات)',
    ],
    defaultMaterial: 'brushed_polyester',
    recommendedMaterials: [
      {
        id: 'brushed_polyester',
        nameAr: 'بوليستر صناعي مقاوم للحرارة والخدش',
        nameEn: 'Brushed Industrial Polyester',
        notesAr: 'مناسب لأغلفة اللابتوب وأجهزة العمل بفضل مقاومته العالية للحرارة والمذيبات.',
        notesEn: 'Ideal for laptop shells and electronics housings with strong heat and scuff resistance.',
      },
      {
        id: 'soft_matte_foil',
        nameAr: 'فينيل مطفي داكن مضاد للانعكاس',
        nameEn: 'Anti-Glare Matte Dark Vinyl',
        notesAr: 'يعمّق اللون الكحلي الداكن ويجعل السيان والأصفر أكثر بروزًا.',
        notesEn: 'Deepens dark navy ink density while keeping cyan and yellow razor sharp.',
      },
    ],
  },
  isFeatured: true,
  customizationMode: 'full',
  tags: ['batch-01', 'hexa-pulse', 'tech', 'hexagon', 'bilingual'],
  licenseTypeId: 'lic-commercial-standard',
  salesCount: 0,
  usageCount: 0,
};

export const FLORA_LOOP_TEMPLATE: TagDesignTemplate = {
  id: 'pilot-flora-loop',
  slug: 'flora-loop-botanical-label',
  titleAr: 'Flora Loop — الطوق النباتي الزهري',
  titleEn: 'Flora Loop — Botanical Floral Label',
  subtitleAr:
    'تصميم نباتي أنيق بقصة زهرية متموجة تجمع بين الكريمي الدافئ والأخضر الغابي وزهور الكركديه الوردية والفراشة وأوراق المونستيرا.',
  subtitleEn:
    'Nature-inspired scalloped floral die-cut label featuring warm cream, forest & leaf greens, pink hibiscus blossoms, a butterfly, and clean bilingual banners.',
  category: 'sticker',
  domainCategory: 'family',
  templateScope: 'general',
  shapeSilhouette: 'flora_scallop',
  specialtyBadgeAr: 'دفعة 01 · طبيعي / عام',
  specialtyBadgeEn: 'Batch 01 · Nature & Family',
  materialAr: 'فينيل مطفي حريري أو مقاوم للماء للطباعة النباتية عالية الدقة',
  materialEn: 'Soft-Touch Matte or Waterproof Botanical Vinyl',
  dimensionsMm: '72 × 78 mm',
  weatherproofRating: '300 DPI · Botanical Matte Vinyl',
  primaryHex: '#0F6B4B',
  secondaryHex: '#FFF6E6',
  badgeColorHex: '#F48FB1',
  priceSar: 42,
  priceUsd: 11,
  includedInTier: 'plus',
  isPilotShowcase: true,
  pilotArtStyle: 'flora_loop',
  defaultCalloutText: 'Scan to Contact the Owner',
  pilotConceptAr:
    'ملصق نباتي رقيق بقصة تموجات متناظرة تزينه زهور الكركديه الوردية وأوراق المونستيرا وفراشة وشعار FindIt QR باللون الأخضر الغابي — مصمم كعمل فني مطبوع صافٍ بدون ثقوب أو حبال خيش.',
  pilotConceptEn:
    'Symmetrical scalloped floral label adorned with layered hibiscus blooms, monstera & sprig foliage, delicate butterfly vector, and green-bordered QR frame — pure flat printable artwork with zero grommets or twine.',
  visualIdentityAr:
    'قصة زهرية متموجة (72 × 78 مم)؛ أخضر غابي (#0F6B4B)، كريمي عاجي (#FFF6E6)، وردي زهري (#F48FB1)، وأخضر أوراق (#8BC34A).',
  visualIdentityEn:
    'Scalloped botanical contour die-cut (72 × 78 mm); Forest Green (#0F6B4B), Warm Cream (#FFF6E6), Hibiscus Pink (#F48FB1), and Leaf Green (#8BC34A).',
  featuresAr: [
    'زخرفة نباتية غنية ومتوازنة: زهور الكركديه الوردية، أوراق غصنية، ورقة مونستيرا، وفراشة مرسومة بدقة متجهية عالية',
    'خلو تام من أي حبال أو ثقوب نحاسية — حواف مقصوصة بدقة CutContour جاهزة للطباعة الاحترافية',
    'تحكم مباشر بالألوان الأساسية والنص العربي والإنجليزي مع مزامنة 1:1 بين المحرر واستوديو 3D وملفات 300 DPI',
  ],
  featuresEn: [
    'Detailed botanical vector composition with layered pink hibiscus blooms, leafy sprigs, monstera leaf, and butterfly motif',
    'Strictly clean printable die-cut without grommets or twine rope, ready for professional vinyl or matte paper cutting',
    'Full editor sync for Forest Green, Cream Base, Blossom Pink, bilingual copy, and dynamic real ISO-18004 QR',
  ],
  recommendedForAr: [
    'دفاتر اليوميات والكتب والمقتنيات الشخصية',
    'حقائب العائلة والأمتعة الراقية',
    'حافظات النظارات والمستلزمات اليومية',
    'أدوات الحدائق والرحلات والنزهات',
  ],
  recommendedForEn: [
    'Journals, Books & Stationery Folios',
    'Family Bags, Totes & Organizers',
    'Eyewear Cases & Daily Essentials',
    'Picnic Baskets & Travel Gear',
  ],
  printSpecs: {
    trimWidthMm: 72,
    trimHeightMm: 78,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    colorSpace: 'CMYK Print-Safe (sRGB Preview)',
    dieCutShapeAr: 'قصة زهرية متموجة متناظرة (Scalloped Floral Die-Cut) بدون ثقوب',
    dieCutShapeEn: 'Symmetrical Scalloped Botanical Die-Cut (No Holes or Hardware)',
    availableSizesMm: [
      '72 × 78 mm (المقاس المعتمد للتصميم)',
      '58 × 63 mm (متوسط للدفاتر والحافظات)',
      '86 × 94 mm (كبير للحقائب والمنظمات)',
    ],
    defaultMaterial: 'soft_matte_foil',
    recommendedMaterials: [
      {
        id: 'soft_matte_foil',
        nameAr: 'فينيل مطفي حريري دافئ (Soft-Touch Matte)',
        nameEn: 'Soft-Touch Matte Botanical Vinyl',
        notesAr: 'يبرز ملمس الورق النباتي الدافئ ونعومة الزهور الوردية دون انعكاسات.',
        notesEn: 'Lends an artisanal stationery feel to warm cream and hibiscus pink tones.',
      },
      {
        id: 'waterproof_vinyl',
        nameAr: 'فينيل مطفي مقاوم للماء والرطوبة',
        nameEn: 'Waterproof Matte Vinyl',
        notesAr: 'مثالي لحقائب اليد وزجاجات المياه والمقتنيات المعرضة للاستخدام اليومي.',
        notesEn: 'Ideal for daily-carry bags and reusable bottles needing moisture durability.',
      },
    ],
  },
  isFeatured: true,
  customizationMode: 'full',
  tags: ['batch-01', 'flora-loop', 'botanical', 'floral', 'bilingual'],
  licenseTypeId: 'lic-personal-standard',
  salesCount: 0,
  usageCount: 0,
};

export const BATCH_01_NEW_TEMPLATES: TagDesignTemplate[] = [
  METRO_TICKET_TEMPLATE,
  JELLY_CUBE_TEMPLATE,
  HEXA_PULSE_TEMPLATE,
  FLORA_LOOP_TEMPLATE,
];
