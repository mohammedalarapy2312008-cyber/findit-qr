import { TagDesignTemplate } from '../types/domain';

/**
 * Batch 02 — Seven Newly Integrated Printable Templates (alongside 10 retained pilots = 17 active total).
 * Visual-content-matched to confirmed designs:
 *   1. Mono Mark (Minimal / Monochrome Hex)
 *   2. Pocket Orbit (Space / Cosmic Waving Astronaut & Rocket)
 *   3. Astro Buddy (Space / Cosmic Thumbs-Up Astronaut on Moon — Clean No-Hole Cutline)
 *   4. Campus Bloom (Lifestyle / Illustrated Scallop)
 *   5. Game Mode (Gaming / Neon Controller — Clean No-Hole Cutline)
 *   6. Purrfect Tag (Cat-Inspired / Playful — Clean No-Hole Cutline)
 *   7. Retro Explorer (Vintage / Travel World Map Scallop)
 * Street Pulse is intentionally excluded for a future batch.
 */

export const MONO_MARK_TEMPLATE: TagDesignTemplate = {
  id: 'pilot-mono-mark',
  slug: 'mono-mark-minimal-label',
  titleAr: 'Mono Mark — الشعار الأحادي البسيط',
  titleEn: 'Mono Mark — Minimal Monochrome Hex Label',
  subtitleAr:
    'تصميم سداسي نظيف وعصري يمزج الكحلي الداكن والأبيض الصافي مع لمسة عنبرية ذهبية حادة وأشرطة هندسية مائلة ووضوح فائق.',
  subtitleEn:
    'Crisp minimalist hexagonal recovery label pairing deep navy ink, crisp architectural white planes, and bold amber highlights with bilingual contact hierarchy.',
  category: 'sticker',
  domainCategory: 'personal',
  templateScope: 'general',
  shapeSilhouette: 'mono_hexagon',
  specialtyBadgeAr: 'دفعة 02 · بسيط / أحادي',
  specialtyBadgeEn: 'Batch 02 · Minimal Monochrome',
  materialAr: 'فينيل مطفي حريري عالي التباين أو بوليستر للأجهزة اليومية',
  materialEn: 'High-Contrast Soft-Touch Matte Vinyl or Brushed Polymer',
  dimensionsMm: '64 × 74 mm',
  weatherproofRating: '300 DPI · Crisp Matte Vinyl',
  primaryHex: '#0D1B2A',
  secondaryHex: '#F8FAFC',
  badgeColorHex: '#FFB800',
  priceSar: 39,
  priceUsd: 10,
  includedInTier: 'plus',
  isPilotShowcase: true,
  pilotArtStyle: 'mono_mark',
  defaultCalloutText: 'Scan to Contact the Owner',
  pilotConceptAr:
    'هوية أحادية نظيفة بقصة سداسية مستديرة الأركان مع شرائط قطرية داكنة وعنبرية، وأيقونة هاتف ذكي دقيقة، وشريط عربي عنبري أسفل التصميم — قالب طباعة مسطح 100٪ بدون أي ثقوب.',
  pilotConceptEn:
    'Architectural rounded-hexagon badge accented with diagonal navy/amber speed ribbons, minimalist scan-phone glyph, isolated white QR pad, and high-visibility amber Arabic pill — flat standalone print artwork.',
  visualIdentityAr:
    'قصة سداسية ناعمة (64 × 74 مم)؛ كحلي داكن (#0D1B2A)، أبيض معماري (#F8FAFC)، وعنبري (#FFB800) مع خطوط ثنائية اللغة واضحة.',
  visualIdentityEn:
    'Soft-corner hexagon contour (64 × 74 mm); Ink Navy (#0D1B2A), Architectural White (#F8FAFC), Signal Amber (#FFB800), and dual-language EN/AR contact lockup.',
  featuresAr: [
    'تصميم بسيط راقٍ بأشرطة مائلة نظيفة وإطار مزدوج مع أيقونة مسح الهاتف الدقيقة',
    'تباين فائق لكود QR بالأسود والعنبري على قاعدة بيضاء صافية بدقة طباعة 300 DPI',
    'طبقات متجهية قابلة للتعديل بالكامل مع مزامنة الألوان الثلاثة والنص العربي والإنجليزي',
  ],
  featuresEn: [
    'Crisp minimal geometry combining diagonal side ribbons, clean white field, and phone-scan icon lockup',
    'High-contrast dual-bracket QR frame on pure white paper stock engineered for 300 DPI production',
    'Editable SVG layers and synchronized live color, bilingual copy, and 3D Studio inspection',
  ],
  recommendedForAr: [
    'أجهزة اللابتوب والهواتف والتابلت',
    'دفاتر العمل والمذكرات اليومية',
    'المحافظ الإلكترونية والشواحن',
    'حقائب الظهر الحضرية البسيطة',
  ],
  recommendedForEn: [
    'Laptops, Smartphones & Tablets',
    'Minimalist Work Notebooks & Cases',
    'Power Banks, SSDs & Tech Pouches',
    'Everyday Urban Carry Bags',
  ],
  printSpecs: {
    trimWidthMm: 64,
    trimHeightMm: 74,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    colorSpace: 'CMYK Print-Safe (sRGB Preview)',
    dieCutShapeAr: 'سداسي متوازن مستدير الأركان بدون ثقوب',
    dieCutShapeEn: 'Rounded Architectural Hexagon Die-Cut (No Holes)',
    availableSizesMm: [
      '64 × 74 mm (المقاس المعتمد للتصميم)',
      '50 × 58 mm (مضغوط للهواتف والأجهزة)',
      '78 × 90 mm (كبير للحقائب واللابتوب)',
    ],
    defaultMaterial: 'soft_matte_foil',
    recommendedMaterials: [
      {
        id: 'soft_matte_foil',
        nameAr: 'فينيل مطفي ناعم الملمس (Soft-Touch Matte)',
        nameEn: 'Soft-Touch Matte Laminated Vinyl',
        notesAr: 'يحافظ على نقاء الأبيض وعمق الكحلي بدون لمعان يعيق مسح الكود.',
        notesEn: 'Keeps architectural whites and deep navy inks glare-free.',
      },
      {
        id: 'brushed_polyester',
        nameAr: 'بوليستر صناعي مطفي للأجهزة',
        nameEn: 'Brushed Industrial Polyester',
        notesAr: 'مناسب لهياكل اللابتوب والأجهزة المعدنية المعرضة للاستخدام اليومي.',
        notesEn: 'Suited for daily-use anodized laptop lids and electronics.',
      },
    ],
  },
  isFeatured: true,
  customizationMode: 'full',
  tags: ['batch-02', 'mono-mark', 'minimal', 'monochrome', 'tech', 'bilingual'],
  licenseTypeId: 'lic-personal-standard',
  salesCount: 0,
  usageCount: 0,
};

export const POCKET_ORBIT_TEMPLATE: TagDesignTemplate = {
  id: 'pilot-pocket-orbit',
  slug: 'pocket-orbit-space-label',
  titleAr: 'Pocket Orbit — مدار الجيب الفضائي',
  titleEn: 'Pocket Orbit — Cosmic Explorer Label',
  subtitleAr:
    'ملصق فضائي مبهج يتصدره رائد فضاء يلوّح بالتحية فوق شعار FindIt QR البرتقالي، مع كوكب زحل البنفسجي وصاروخ منطلق بمدار سماوي متوهج.',
  subtitleEn:
    'Playful cosmic die-cut label crowned by a waving astronaut silhouette, ringed purple planet, launching rocket arc, starry navy void, and cyan perimeter.',
  category: 'sticker',
  domainCategory: 'family',
  templateScope: 'general',
  shapeSilhouette: 'orbit_crest',
  specialtyBadgeAr: 'دفعة 02 · فضائي / كوني',
  specialtyBadgeEn: 'Batch 02 · Space & Cosmic',
  materialAr: 'فينيل لامع أو مطفي مقاوم للماء والغسيل (UV Space Vinyl)',
  materialEn: 'Waterproof UV Gloss or Matte Vinyl',
  dimensionsMm: '70 × 76 mm',
  weatherproofRating: '300 DPI · Waterproof Cosmic Vinyl',
  primaryHex: '#06133D',
  secondaryHex: '#00E5FF',
  badgeColorHex: '#FF7A00',
  priceSar: 42,
  priceUsd: 11,
  includedInTier: 'plus',
  isPilotShowcase: true,
  pilotArtStyle: 'pocket_orbit',
  defaultCalloutText: 'Scan to Contact the Owner',
  pilotConceptAr:
    'قصة مخصصة مقتبسة من مدار الفضاء تتبع خوذة رائد الفضاء الملوّح في الأعلى ومسار الصاروخ الجانبي، محاطة بإطار سيان مضيء وكود QR حقيقي ورسالتين واضحتين بالعربية والإنجليزية.',
  pilotConceptEn:
    'Custom die-cut cosmic crest tracing the waving astronaut helmet crown and sweeping orbital rocket trail over a deep navy starry field — clean flat print artwork with zero hardware.',
  visualIdentityAr:
    'قصة مدار فضائي (70 × 76 مم)؛ كحلي فلكي (#06133D)، حدود سيان (#00E5FF)، برتقالي صاروخي (#FF7A00)، كوكب بنفسجي وأصفر ذهبي.',
  visualIdentityEn:
    'Orbital crest die-cut (70 × 76 mm); Deep Cosmos Navy (#06133D), Electric Cyan (#00E5FF), Rocket Orange (#FF7A00), and Starlight Gold.',
  featuresAr: [
    'رائد فضاء ملوّح في الأعلى، كوكب بنفسجي ذو حلقة، صاروخ منطلِق بمدار منحني، وقمر في القاع',
    'كود QR قياسي محمي بزوايا سيان وأيقونة اتصال بالهاتف أمام الرسالة الإنجليزية والكبسولة الصفراء العربية',
    'تصميم نظيف جاهز للطباعة 300 DPI دون أي ثقوب أو سلاسل معدنية',
  ],
  featuresEn: [
    'Waving astronaut illustration, purple Saturn planet, launching orbital rocket trail, and moon crescent',
    'High-contrast white QR stage framed by cyan corner brackets above bilingual EN white pill & AR yellow pill',
    'Standalone printable artwork calibrated at 300 DPI with +3mm Bleed and zero hardware holes',
  ],
  recommendedForAr: [
    'حقائب المدرسة والجامعة والأنشطة',
    'زجاجات المياه وحافظات الآيباد',
    'أجهزة الألعاب المحمولة والسماعات',
    'حقائب الرحلات والمستكشفين الصغار',
  ],
  recommendedForEn: [
    'Backpacks, Tablets & School Gear',
    'Reusable Water Bottles & Lunchboxes',
    'Gaming Handhelds & Audio Cases',
    'Family Travel Organizers',
  ],
  printSpecs: {
    trimWidthMm: 70,
    trimHeightMm: 76,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    colorSpace: 'CMYK Print-Safe (sRGB Preview)',
    dieCutShapeAr: 'قصة مدار فضائي تحاكي قوس الخوذة ومسار الصاروخ بدون ثقوب',
    dieCutShapeEn: 'Contoured Cosmic Orbit Crest Die-Cut (No Holes)',
    availableSizesMm: [
      '70 × 76 mm (المقاس المعتمد للتصميم)',
      '55 × 60 mm (مناسب للعبوات والأجهزة)',
      '84 × 92 mm (كبير للحقائب)',
    ],
    defaultMaterial: 'glossy_vinyl',
    recommendedMaterials: [
      {
        id: 'glossy_vinyl',
        nameAr: 'فينيل لامع مقاوم للماء UV Gloss',
        nameEn: 'Washable UV Gloss Vinyl',
        notesAr: 'يبرز لمعان النجوم والصاروخ وإطار السيان المحيط بالملصق.',
        notesEn: 'Amplifies deep space ink richness and cyan/orange accents.',
      },
      {
        id: 'waterproof_vinyl',
        nameAr: 'فينيل مطفي مضاد للانعكاس',
        nameEn: 'Anti-Glare Matte Vinyl',
        notesAr: 'يمنح وضوحًا فائقًا لكود QR تحت إضاءة الفصول والمطارات.',
        notesEn: 'Eliminates glare over the central QR stage indoors.',
      },
    ],
  },
  isFeatured: true,
  customizationMode: 'full',
  tags: ['batch-02', 'pocket-orbit', 'cosmic', 'space', 'astronaut', 'playful', 'bilingual'],
  licenseTypeId: 'lic-personal-standard',
  salesCount: 0,
  usageCount: 0,
};

export const ASTRO_BUDDY_TEMPLATE: TagDesignTemplate = {
  id: 'pilot-astro-buddy',
  slug: 'astro-buddy-cosmic-label',
  titleAr: 'Astro Buddy — رفيق الفضاء الكوني',
  titleEn: 'Astro Buddy — Moon Astronaut Label',
  subtitleAr:
    'قالب فضائي ثانٍ مستقل ومتميز: رائد فضاء جالس على قمر بنفسجي يرفع إبهامه بالتحية، وكوكب أزرق بحلقة ذهبية وسحب سديم مضيئة — نظيف للطباعة بدون ثقب تعليق.',
  subtitleEn:
    'Distinct second cosmic template featuring a thumbs-up astronaut seated on a purple moon orb, blue Saturn crest, soaring yellow-nose rocket, and nebula clouds — clean hole-free printable cut.',
  category: 'sticker',
  domainCategory: 'family',
  templateScope: 'general',
  shapeSilhouette: 'astro_emblem',
  specialtyBadgeAr: 'دفعة 02 · فضائي مستقل / بدون ثقب',
  specialtyBadgeEn: 'Batch 02 · Space & Cosmic (No Hole)',
  materialAr: 'فينيل مقاوم للماء والغسيل بألوان سديم عميقة',
  materialEn: 'Waterproof UV Gloss or Soft Matte Vinyl',
  dimensionsMm: '70 × 76 mm',
  weatherproofRating: '300 DPI · Clean Hole-Free Cutline',
  primaryHex: '#100C42',
  secondaryHex: '#3B82F6',
  badgeColorHex: '#FFD000',
  priceSar: 42,
  priceUsd: 11,
  includedInTier: 'plus',
  isPilotShowcase: true,
  pilotArtStyle: 'astro_buddy',
  defaultCalloutText: 'Scan to Contact the Owner',
  pilotConceptAr:
    'نسخة طباعة محسّنة ومستقلة تمامًا باسم Astro Buddy: أُزيل ثقب الميدالية العلوي بالكامل مع الحفاظ على روعة القمر البنفسجي ورائد الفضاء وكوكب زحل الأزرق والصاروخ والسديم الملون.',
  pilotConceptEn:
    'Dedicated clean printable label preserving the thumbs-up astronaut on the purple moon, blue ringed planet, yellow-nose rocket, and glowing nebula clouds — with the top keyring hole cleanly removed.',
  visualIdentityAr:
    'قصة شعار فضائي مستدير القمة والسحاب (70 × 76 مم — بدون ثقب)؛ نيلي كوني (#100C42)، أزرق سماوي (#3B82F6)، وأصفر ذهبي (#FFD000).',
  visualIdentityEn:
    'Clean dome-and-nebula cosmic emblem contour (70 × 76 mm — zero punch holes); Deep Space Indigo (#100C42), Nebula Blue (#3B82F6), and Solar Gold (#FFD000).',
  featuresAr: [
    'شخصية مستقلة 100٪ عن Pocket Orbit: رائد فضاء مبتهج فوق قمر بفوهات، كوكب أزرق، وسديم سفلي متدرج',
    'خلو تام من ثقوب المفاتيح في خط القص CutContour والعمل الفني لتقديم ملصق احترافي نظيف',
    'تخصيص حي للألوان والنصين الإنجليزي والعربي وكود QR حقيقي بملفات 300 DPI',
  ],
  featuresEn: [
    'Independent illustration distinct from Pocket Orbit: thumbs-up moon astronaut, blue Saturn, yellow rocket, and bottom nebula clouds',
    'Verified print correction: physical keychain punch-hole completely removed from SVG artwork and CutContour',
    'Full live customization for Primary, Nebula Blue, Gold Accent, EN/AR text, and real ISO QR',
  ],
  recommendedForAr: [
    'حقائب الأطفال والأندية العلمية',
    'أجهزة اللابتوب والآيباد',
    'زجاجات المياه وعلب الطعام',
    'صناديق الأدوات والمعدات التعليمية',
  ],
  recommendedForEn: [
    'STEM Gear & School Backpacks',
    'Laptops, Tablets & Gaming Consoles',
    'Bottles, Thermoses & Lunch Gear',
    'Astronomy & Hobby Kits',
  ],
  printSpecs: {
    trimWidthMm: 70,
    trimHeightMm: 76,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    colorSpace: 'CMYK Print-Safe (sRGB Preview)',
    dieCutShapeAr: 'شارة كونية منحنية بسديم سفلي بدون ثقب علوي (Clean Hole-Free Cut)',
    dieCutShapeEn: 'Contoured Cosmic Nebula Die-Cut (No Keychain Hole)',
    availableSizesMm: [
      '70 × 76 mm (المقاس المعتمد للتصميم)',
      '56 × 61 mm (متوسط للأجهزة والزجاجات)',
      '88 × 95 mm (كبير للحقائب)',
    ],
    defaultMaterial: 'glossy_vinyl',
    recommendedMaterials: [
      {
        id: 'glossy_vinyl',
        nameAr: 'فينيل لامع UV Gloss للألوان الكونية',
        nameEn: 'Washable UV Gloss Vinyl',
        notesAr: 'يعزز تدرجات النيلي والبنفسجي ولمعان الكواكب.',
        notesEn: 'Enhances indigo nebula contrast and bright yellow planet rings.',
      },
      {
        id: 'soft_matte_foil',
        nameAr: 'فينيل مطفي ناعم مضاد للتوهج',
        nameEn: 'Soft-Touch Matte Vinyl',
        notesAr: 'قراءة كاميرا سريعة لكود QR دون أي انعكاس ضوئي.',
        notesEn: 'Zero-glare scanning clarity for bright rooms.',
      },
    ],
  },
  isFeatured: true,
  customizationMode: 'full',
  tags: ['batch-02', 'astro-buddy', 'cosmic', 'space', 'astronaut', 'playful', 'bilingual'],
  licenseTypeId: 'lic-personal-standard',
  salesCount: 0,
  usageCount: 0,
};

export const CAMPUS_BLOOM_TEMPLATE: TagDesignTemplate = {
  id: 'pilot-campus-bloom',
  slug: 'campus-bloom-lifestyle-label',
  titleAr: 'Campus Bloom — إزهار الحياة الجامعية',
  titleEn: 'Campus Bloom — Illustrated Lifestyle Label',
  subtitleAr:
    'تصميم دافئ وحيوي للحياة اليومية والدراسة بقصة غيمة متموجة تجمع الحقيبة المدرسية والدفتر والقلم وكوب القهوة والسماعات والأزهار المبهجة.',
  subtitleEn:
    'Warm illustrated everyday lifestyle & campus sticker featuring a backpack, spiral notebook & pen, coffee mug, headphones, and pastel florals on scalloped cream stock.',
  category: 'sticker',
  domainCategory: 'family',
  templateScope: 'general',
  shapeSilhouette: 'campus_cloud',
  specialtyBadgeAr: 'دفعة 02 · حياة يومية / جامعي',
  specialtyBadgeEn: 'Batch 02 · Lifestyle & Campus',
  materialAr: 'فينيل مطفي دافئ أو فينيل مقاوم للماء للحقائب والأكواب',
  materialEn: 'Soft-Touch Matte or Waterproof Lifestyle Vinyl',
  dimensionsMm: '74 × 80 mm',
  weatherproofRating: '300 DPI · Splashproof Lifestyle Vinyl',
  primaryHex: '#007B83',
  secondaryHex: '#FAF4E6',
  badgeColorHex: '#F48FB1',
  priceSar: 42,
  priceUsd: 11,
  includedInTier: 'plus',
  isPilotShowcase: true,
  pilotArtStyle: 'campus_bloom',
  defaultCalloutText: 'Scan to Contact the Owner',
  pilotConceptAr:
    'ملصق مصوّر دافئ يجمع أدوات الدراسة والعمل اليومي (الحقيبة، دفتر الملاحظات، القلم، القهوة، السماعات اللاسلكية، وأزهار الباستيل) داخل إطار متموج بكريمي دافئ وحدود تركواز عميق.',
  pilotConceptEn:
    'Inviting scalloped cream badge illustrated with daily campus & desk companions—teal backpack, spiral notebook, iced coffee cup, pastel headphones, and blooming florals around a crisp QR zone.',
  visualIdentityAr:
    'قصة سحابة متموجة ناعمة (74 × 80 مم)؛ تركواز جامعي (#007B83)، كريمي دافئ (#FAF4E6)، ووردي باستيل (#F48FB1).',
  visualIdentityEn:
    'Soft scalloped cloud contour (74 × 80 mm); Deep Campus Teal (#007B83), Warm Parchment Cream (#FAF4E6), and Pastel Blossom Pink (#F48FB1).',
  featuresAr: [
    'رسومات متجهية أصلية لأسلوب الحياة الجامعي: حقيبة ظهر، دفتر، كوب قهوة، سماعات، وأغصان وأزهار لطيفة',
    'منطقة مسح QR بيضاء محمية ولافتتان مبهجتان بالإنجليزية والعربية لسرعة التواصل',
    'نظيف 100٪ للطباعة الرقمية دون ثقوب أو حبال تعليق',
  ],
  featuresEn: [
    'Original lifestyle vector illustrations including backpack, spiral journal, coffee cup, headphones, and blooms',
    'Protected crisp white QR box paired with sage & blush EN/AR contact banners',
    '100% standalone printable artwork calibrated at 300 DPI with zero hardware',
  ],
  recommendedForAr: [
    'حقائب الجامعة واللابتوب',
    'الأكواب الحرارية ودفاتر المحاضرات',
    'حافظات السماعات والأجهزة اللوحية',
    'مستلزمات المكتب والدراسة اليومية',
  ],
  recommendedForEn: [
    'Campus Backpacks & Tote Bags',
    'Tumblers, Laptops & Bullet Journals',
    'Headphone Cases & Study Kits',
    'Everyday Office & Commute Carry',
  ],
  printSpecs: {
    trimWidthMm: 74,
    trimHeightMm: 80,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    colorSpace: 'CMYK Print-Safe (sRGB Preview)',
    dieCutShapeAr: 'قصة غيمة ناعمة متموجة متناظرة بدون ثقوب',
    dieCutShapeEn: 'Gentle Scalloped Lifestyle Die-Cut (No Holes)',
    availableSizesMm: [
      '74 × 80 mm (المقاس المعتمد للتصميم)',
      '58 × 63 mm (متوسط للأكواب والدفاتر)',
      '88 × 95 mm (كبير لحقائب الظهر)',
    ],
    defaultMaterial: 'soft_matte_foil',
    recommendedMaterials: [
      {
        id: 'soft_matte_foil',
        nameAr: 'فينيل مطفي حريري دافئ (Soft-Touch Matte)',
        nameEn: 'Soft-Touch Matte Vinyl',
        notesAr: 'يبرز طابع القرطاسية الدافئ ورسومات القهوة والدفاتر.',
        notesEn: 'Enhances stationery warmth and pastel illustration tones.',
      },
      {
        id: 'waterproof_vinyl',
        nameAr: 'فينيل مقاوم للماء للأكواب والحافظات',
        nameEn: 'Waterproof Tumbler & Gear Vinyl',
        notesAr: 'يتحمل غسيل الأكواب الحرارية والاستخدام اليومي في الحرم الجامعي.',
        notesEn: 'Built to handle daily spills, bottles, and commute wear.',
      },
    ],
  },
  isFeatured: true,
  customizationMode: 'full',
  tags: ['batch-02', 'campus-bloom', 'lifestyle', 'botanical', 'nature', 'bilingual'],
  licenseTypeId: 'lic-personal-standard',
  salesCount: 0,
  usageCount: 0,
};

export const GAME_MODE_TEMPLATE: TagDesignTemplate = {
  id: 'pilot-game-mode',
  slug: 'game-mode-arcade-label',
  titleAr: 'Game Mode — وضع اللعب النيوني',
  titleEn: 'Game Mode — Neon Gaming Controller Label',
  subtitleAr:
    'قالب ألعاب جريء بقصة يد تحكم وسماعات نيون بألوان السيان والوردي الكهربائي والأصفر مع أزرار △ ○ × □ وموجة برق — نظيف للطباعة بدون ثقب تعليق.',
  subtitleEn:
    'Bold neon arcade die-cut shaped like a gaming controller & headset with D-pad, action buttons, pixel invader, and lightning motifs — clean hole-free printable cut.',
  category: 'sticker',
  domainCategory: 'personal',
  templateScope: 'specialized',
  shapeSilhouette: 'arcade_controller',
  specialtyBadgeAr: 'دفعة 02 · ألعاب نيون / بدون ثقب',
  specialtyBadgeEn: 'Batch 02 · Gaming Neon (No Hole)',
  materialAr: 'فينيل تقني مطفي أو لامع لأجهزة الألعاب والسماعات',
  materialEn: 'Tech Matte or High-Contrast UV Gloss Vinyl',
  dimensionsMm: '76 × 72 mm',
  weatherproofRating: '300 DPI · Clean Hole-Free Cutline',
  primaryHex: '#120E2C',
  secondaryHex: '#00E5FF',
  badgeColorHex: '#FF2E93',
  priceSar: 45,
  priceUsd: 12,
  includedInTier: 'plus',
  isPilotShowcase: true,
  pilotArtStyle: 'game_mode',
  defaultCalloutText: 'Scan to Contact the Owner',
  pilotConceptAr:
    'تصميم ألعاب احترافي يتبع انحناءات ذراع التحكم وسماعة الرأس مع D-Pad وأزرار الأكشن ووحش البكسل وشعاع البرق؛ أُزيل منه ثقب الميدالية العلوي ليصبح ملصق طباعة مسطح صافي.',
  pilotConceptEn:
    'Contoured gamepad silhouette packed with neon cyan/magenta rim glow, tactile D-pad, △ ○ × □ action buttons, pixel invader, and lightning bolt — keyring punch-hole cleanly removed for sticker production.',
  visualIdentityAr:
    'قصة يد تحكم وسماعة (76 × 72 مم — بدون ثقب)؛ بنفسجي ليلي (#120E2C)، نيون سيان (#00E5FF)، وماجنتا نيون (#FF2E93).',
  visualIdentityEn:
    'Ergonomic controller-crest contour (76 × 72 mm — zero punch holes); Arcade Midnight (#120E2C), Electric Cyan (#00E5FF), and Neon Magenta (#FF2E93).',
  featuresAr: [
    'تفاصيل ألعاب أصيلة: أزرار △○×□، D-Pad، كائن بكسل كلاسيكي، وصاعقة برق نيون فوق شبكة خلفية تقنية',
    'خلو تام من أي ثقوب علوية أو حلقات تعليق في ملف العمل الفني وخط القص CutContour',
    'حاوية QR بيضاء مضيئة التباين لضمان قراءة فورية للكود فوق الخلفية الداكنة',
  ],
  featuresEn: [
    'Authentic gaming details: glowing D-pad, △○×□ face buttons, retro pixel sprite, and electric lightning accent',
    'Verified print correction: physical top keychain hole removed from artwork and die-cut path',
    'Isolated crisp white QR stage guarantees reliable scanning against the dark neon backdrop',
  ],
  recommendedForAr: [
    'أجهزة Nintendo Switch وSteam Deck',
    'حقائب البلايستيشن وإكس بوكس وأذرع التحكم',
    'سماعات الألعاب وأجهزة اللابتوب',
    'حافظات الهاردسك والعتاد التقني',
  ],
  recommendedForEn: [
    'Steam Deck, Switch & Handheld Consoles',
    'Controller Cases & Gaming Backpacks',
    'Gaming Headsets & Laptops',
    'LAN Tournament Bags & Accessories',
  ],
  printSpecs: {
    trimWidthMm: 76,
    trimHeightMm: 72,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    colorSpace: 'CMYK Print-Safe (sRGB Preview)',
    dieCutShapeAr: 'قصة يد تحكم وسماعات ألعاب بدون ثقب علوي (Clean Hole-Free Cut)',
    dieCutShapeEn: 'Contoured Gaming Controller Die-Cut (No Keychain Hole)',
    availableSizesMm: [
      '76 × 72 mm (المقاس المعتمد للتصميم)',
      '60 × 57 mm (مناسب لأذرع التحكم والأجهزة)',
      '92 × 87 mm (كبير لحقائب الأجهزة)',
    ],
    defaultMaterial: 'brushed_polyester',
    recommendedMaterials: [
      {
        id: 'brushed_polyester',
        nameAr: 'بوليستر تقني مطفي مقاوم للحرارة والخدوش',
        nameEn: 'Tech Matte Polyester Stock',
        notesAr: 'مناسب لأجهزة الألعاب المحمولة وحافظات اللابتوب.',
        notesEn: 'Resists grip wear, heat, and scuffs on gaming shells.',
      },
      {
        id: 'glossy_vinyl',
        nameAr: 'فينيل نيون لامع عالي التشبع',
        nameEn: 'High-Saturation Gloss Vinyl',
        notesAr: 'يبرز إشراقة السيان والماجنتا النيوني بأقصى درجة.',
        notesEn: 'Maximizes neon cyan and hot magenta color pop.',
      },
    ],
  },
  isFeatured: true,
  customizationMode: 'full',
  tags: ['batch-02', 'game-mode', 'gaming', 'playful', 'tech', 'bilingual'],
  licenseTypeId: 'lic-personal-standard',
  salesCount: 0,
  usageCount: 0,
};

export const PURRFECT_TAG_TEMPLATE: TagDesignTemplate = {
  id: 'pilot-purrfect-tag',
  slug: 'purrfect-tag-cat-label',
  titleAr: 'Purrfect Tag — بطاقة القط المرحة',
  titleEn: 'Purrfect Tag — Playful Cat Silhouette Label',
  subtitleAr:
    'تصميم قطط لطيف بقصة رأس قطة بأذنين بارزتين (بدون ثقب تعليق) يضم قطة بنفسجية غامزة وكرة خيوط وردية على شكل قلب وآثار أقدام لطيفة.',
  subtitleEn:
    'Charming cat-head die-cut label featuring a winking lavender kitty, pink yarn-ball heart loop, toe-bean paw prints, and pastel contact pills — clean hole-free printable cut.',
  category: 'pet_medal',
  domainCategory: 'pets',
  templateScope: 'specialized',
  shapeSilhouette: 'cat_silhouette',
  specialtyBadgeAr: 'دفعة 02 · حيوانات أليفة / بدون ثقب',
  specialtyBadgeEn: 'Batch 02 · Pets & Cat Lovers (No Hole)',
  materialAr: 'فينيل خارجي فائق التحمل مقاوم للماء والخدوش',
  materialEn: 'Heavy-Duty Waterproof Outdoor Vinyl',
  dimensionsMm: '72 × 74 mm',
  weatherproofRating: '300 DPI · Clean Hole-Free Cutline',
  primaryHex: '#6D28D9',
  secondaryHex: '#FFF6F0',
  badgeColorHex: '#FB7185',
  priceSar: 42,
  priceUsd: 11,
  includedInTier: 'plus',
  isPilotShowcase: true,
  pilotArtStyle: 'purrfect_tag',
  defaultCalloutText: 'Scan to Contact the Owner',
  pilotConceptAr:
    'قالب طباعة نظيف للقطط ومحبيها بقصة أذني قطة ناعمتين — أُزيل منه ثقب الميدالية العلوي تمامًا ليصبح ملصقًا صافيًا مثاليًا لصناديق تنقل القطط وأطباق الطعام والمفكرات.',
  pilotConceptEn:
    'Playful cat-head silhouette with winking lavender kitty, pink yarn heart trail, and paw prints — punch-hole completely removed so the print contour stays crisp and clean for carriers, bowls, and notebooks.',
  visualIdentityAr:
    'قصة رأس قطة بأذنين (72 × 74 مم — بدون ثقب)؛ بنفسجي برقوقي (#6D28D9)، كريمي دافئ (#FFF6F0)، ووردي مرجاني (#FB7185).',
  visualIdentityEn:
    'Cat-ear silhouette contour (72 × 74 mm — zero punch holes); Berry Plum (#6D28D9), Warm Cream (#FFF6F0), and Playful Coral Pink (#FB7185).',
  featuresAr: [
    'شخصية قطة بنفسجية غامزة على اليسار، كرة صوف وردية ترسم قلبًا على اليمين، وآثار مخالب ناعمة',
    'تحسين طباعي مؤكد: إزالة ثقب التعليق العلوي بالكامل من الرسم وخط القص CutContour',
    'كود QR واضح وعالي التباين مع تخصيص مباشر للألوان والنصين الإنجليزي والعربي',
  ],
  featuresEn: [
    'Winking lavender kitty peeking left, pink yarn-ball heart loop right, and playful paw accents',
    'Verified print correction: physical top keychain punch-hole removed cleanly from contour & SVG artwork',
    'Synchronized live colorways, bilingual copy editing, and 300 DPI Print & 3D Studio assets',
  ],
  recommendedForAr: [
    'صناديق وحقائب تنقل القطط',
    'علب الطعام والسجلات البيطرية',
    'محافظ بطاقات الأطواق المغلفة',
    'دفاتر ومحافظ محبي القطط',
  ],
  recommendedForEn: [
    'Cat Travel Carriers & Vet Folders',
    'Pet Food Canisters & Treat Jars',
    'Waterproof Laminated Collar Pouches',
    'Notebooks, Totes & Laptops',
  ],
  printSpecs: {
    trimWidthMm: 72,
    trimHeightMm: 74,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    colorSpace: 'CMYK Print-Safe (sRGB Preview)',
    dieCutShapeAr: 'قصة رأس قطة بأذنين بارزتين بدون ثقب علوي (Clean Hole-Free Cut)',
    dieCutShapeEn: 'Contoured Cat-Head Die-Cut (No Keychain Hole)',
    availableSizesMm: [
      '72 × 74 mm (المقاس المعتمد للتصميم)',
      '45 × 46 mm (مناسب لأغلفة الأطواق)',
      '88 × 90 mm (كبير لصناديق النقل)',
    ],
    defaultMaterial: 'textured_outdoor_vinyl',
    recommendedMaterials: [
      {
        id: 'textured_outdoor_vinyl',
        nameAr: 'فينيل خارجي فائق التحمل مقاوم للماء',
        nameEn: 'Heavy-Duty Outdoor Waterproof Vinyl',
        notesAr: 'يحافظ على تفاصيل القطة وألوانها الزاهية على أقفاص التنقل.',
        notesEn: 'Built to resist carrier scuffs, moisture, and outdoor cleaning.',
      },
      {
        id: 'glossy_vinyl',
        nameAr: 'فينيل لامع قابل للغسل',
        nameEn: 'Washable UV Gloss Vinyl',
        notesAr: 'رائع على أوعية الطعام وعلب المكافآت القابلة للمسح.',
        notesEn: 'Wipes clean effortlessly on canisters and bottles.',
      },
    ],
  },
  isFeatured: true,
  customizationMode: 'full',
  tags: ['batch-02', 'purrfect-tag', 'pets', 'cat', 'playful', 'bilingual'],
  licenseTypeId: 'lic-personal-standard',
  salesCount: 0,
  usageCount: 0,
};

export const RETRO_EXPLORER_TEMPLATE: TagDesignTemplate = {
  id: 'pilot-retro-explorer',
  slug: 'retro-explorer-travel-label',
  titleAr: 'Retro Explorer — مستكشف الرحلات الكلاسيكي',
  titleEn: 'Retro Explorer — Vintage Travel Map Label',
  subtitleAr:
    'تصميم سفر تراثي بقصة طابع متموج يجمع خريطة العالم العتيقة والبوصلة وحقيبة جلدية كلاسيكية وكاميرا فيلم وصورة للأهرامات.',
  subtitleEn:
    'Scalloped vintage expedition seal illustrated with antique world-map contours, compass rose, Giza-stamped leather suitcase, film camera, and travel polaroid.',
  category: 'luggage_tag',
  domainCategory: 'travel',
  templateScope: 'specialized',
  shapeSilhouette: 'explorer_scallop',
  specialtyBadgeAr: 'دفعة 02 · سفر عتيق / رحلات',
  specialtyBadgeEn: 'Batch 02 · Vintage Explorer',
  materialAr: 'فينيل سفر مطفي دافئ مقاوم للرطوبة والاحتكاك',
  materialEn: 'Waterproof Matte Travel Vinyl',
  dimensionsMm: '76 × 78 mm',
  weatherproofRating: '300 DPI · Vintage Travel Vinyl',
  primaryHex: '#7C4A21',
  secondaryHex: '#F7ECD7',
  badgeColorHex: '#C2410C',
  priceSar: 45,
  priceUsd: 12,
  includedInTier: 'plus',
  isPilotShowcase: true,
  pilotArtStyle: 'retro_explorer',
  defaultCalloutText: 'Scan to Contact the Owner',
  pilotConceptAr:
    'ختم سفر عتيق بقصة متموجة تبرز ورق الرق القديم وخريطة القارات وخط طيران منقط وبوصلة وحقيبة سفر جلدية وكاميرا بولارويد — عمل فني مطبوع صافي بدون أي ثقوب.',
  pilotConceptEn:
    'Scalloped vintage explorer stamp blending warm parchment world-map graphics, dotted flight arc, compass rose, stitched leather suitcase, and retro camera — standalone flat printable artwork.',
  visualIdentityAr:
    'قصة طابع سفر متموج (76 × 78 مم)؛ بني جلدي عتيق (#7C4A21)، رق قديم (#F7ECD7)، وتيراكوتا برتقالي (#C2410C).',
  visualIdentityEn:
    'Scalloped vintage stamp contour (76 × 78 mm); Saddle Leather Brown (#7C4A21), Antique Parchment (#F7ECD7), and Passport Terracotta (#C2410C).',
  featuresAr: [
    'خريطة عالم عتيقة، بوصلة كلاسيكية، مسار طائرة متقطع، حقيبة سفر جلدية، وكاميرا وصورة تذكارية',
    'منطقة QR معزولة بإطار بني دافئ مع لافتات عتيقة لرسالتي التواصل الإنجليزية والعربية',
    'جاهز للطباعة بدقة 300 DPI مع +3mm Bleed وخط قص CutContour متموج بدون ثقوب',
  ],
  featuresEn: [
    'Antique world-map texture, compass rose, dotted airplane arc, vintage leather suitcase, and camera polaroid',
    'High-contrast framed QR box paired with parchment EN/AR contact banners',
    'Pre-press 300 DPI Print SVG/PNG and 3D Studio sync with scalloped die-cut contour (no hardware)',
  ],
  recommendedForAr: [
    'حقائب السفر والرحلات الطويلة',
    'حقائب الكاميرات والعدسات والتصوير',
    'حافظات جوازات السفر ودفاتر الرحلات',
    'صناديق التخييم والاستكشاف',
  ],
  recommendedForEn: [
    'Expedition Luggage & Travel Suitcases',
    'Camera Bags & Field Photography Kits',
    'Passport Folios & Travel Journals',
    'Camping & Overland Containers',
  ],
  printSpecs: {
    trimWidthMm: 76,
    trimHeightMm: 78,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 300,
    colorSpace: 'CMYK Print-Safe (sRGB Preview)',
    dieCutShapeAr: 'طابع سفر متموج كلاسيكي بـ 12 انحناءة بدون ثقوب',
    dieCutShapeEn: '12-Lobe Scalloped Vintage Explorer Die-Cut (No Holes)',
    availableSizesMm: [
      '76 × 78 mm (المقاس المعتمد للتصميم)',
      '60 × 62 mm (مناسب لحافظات الجواز والكاميرات)',
      '92 × 95 mm (كبير لحقائب الشحن)',
    ],
    defaultMaterial: 'soft_matte_foil',
    recommendedMaterials: [
      {
        id: 'soft_matte_foil',
        nameAr: 'فينيل مطفي ناعم بطابع الرق الكلاسيكي',
        nameEn: 'Soft-Touch Matte Vintage Vinyl',
        notesAr: 'يبرز ملمس الورق العتيق وألوان الجلود والأختام بدون لمعان.',
        notesEn: 'Amplifies parchment warmth and vintage leather color tones.',
      },
      {
        id: 'waterproof_vinyl',
        nameAr: 'فينيل سفر مقاوم للماء والاحتكاك',
        nameEn: 'Waterproof Matte Travel Vinyl',
        notesAr: 'مثالي لحقائب الشحن وصناديق المعدات المعرضة للأمطار.',
        notesEn: 'Protects luggage labels through baggage transit and rain.',
      },
    ],
  },
  isFeatured: true,
  customizationMode: 'full',
  tags: ['batch-02', 'retro-explorer', 'vintage', 'travel', 'explorer', 'bilingual'],
  licenseTypeId: 'lic-personal-standard',
  salesCount: 0,
  usageCount: 0,
};

export const BATCH_02_NEW_TEMPLATES: TagDesignTemplate[] = [
  MONO_MARK_TEMPLATE,
  POCKET_ORBIT_TEMPLATE,
  ASTRO_BUDDY_TEMPLATE,
  CAMPUS_BLOOM_TEMPLATE,
  GAME_MODE_TEMPLATE,
  PURRFECT_TAG_TEMPLATE,
  RETRO_EXPLORER_TEMPLATE,
];
