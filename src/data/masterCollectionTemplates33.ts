import { PrintMaterialFinish, QrFormatType, TagDesignTemplate, TagShapeSilhouette } from '../types/domain';
import {
  MASTER_COLLECTION_SPECS,
  MasterSilhouetteKind,
  MasterTemplateSpec,
} from '../utils/masterCollectionProduction';

const SILHOUETTE_TO_TAG_SHAPE: Record<MasterSilhouetteKind, TagShapeSilhouette> = {
  rounded_rect: 'smart_card',
  laptop_tag: 'tech_chamfer_plate',
  anime_diecut: 'dome_sticker',
  scalloped_plaque: 'explorer_scallop',
  cat_head: 'cat_silhouette',
  wide_hexagon: 'tech_hexagon',
  squircle: 'jelly_cushion',
  dog_bone: 'pet_medal',
  butterfly: 'flora_scallop',
  star_five: 'orbit_crest',
  luggage_tag: 'luggage_loop',
  fluffy_cloud: 'cloud_scallop',
  gamepad: 'arcade_controller',
  dslr_camera: 'tech_chamfer_plate',
  shield_crest: 'royal_shield',
};

const SILHOUETTE_LABELS: Record<MasterSilhouetteKind, { ar: string; en: string }> = {
  rounded_rect: {
    ar: 'قصة بطاقة فاخرة بزوايا مستديرة وإطار مقصوص نظيف',
    en: 'Rounded Luxury Card Die-Cut Silhouette',
  },
  laptop_tag: {
    ar: 'قصة لابتوب مفتوح مخصصة لمعدات التقنية',
    en: 'Open Laptop Contoured Die-Cut Silhouette',
  },
  anime_diecut: {
    ar: 'قصة ملصق أنمي حرة بإطار أبيض نظيف',
    en: 'Custom Contoured Anime Die-Cut Silhouette with White Border',
  },
  scalloped_plaque: {
    ar: 'قصة لوحة كلاسيكية متموجة الحواف',
    en: 'Scalloped Heritage Plaque Die-Cut Silhouette',
  },
  cat_head: {
    ar: 'قصة رأس قطة بأذنين ناعمتين للحيوانات الأليفة',
    en: 'Die-Cut Cat-Head Pet Tag Silhouette',
  },
  wide_hexagon: {
    ar: 'قصة سداسية هندسية فاخرة',
    en: 'Wide Hexagonal Luxury Crest Die-Cut Silhouette',
  },
  squircle: {
    ar: 'قصة مربع فخم بزوايا منحنية ناعمة',
    en: 'Minimalist Luxury Squircle Die-Cut Silhouette',
  },
  dog_bone: {
    ar: 'قصة عظمة كلب للحيوانات الأليفة',
    en: 'Die-Cut Dog-Bone Pet Tag Silhouette',
  },
  butterfly: {
    ar: 'قصة فراشة بأجنحة متناظرة للأطفال',
    en: 'Symmetric Butterfly Wings Die-Cut Silhouette',
  },
  star_five: {
    ar: 'قصة نجمة خماسية للأطفال والمدرسة',
    en: 'Five-Pointed Star Kids Die-Cut Silhouette',
  },
  luggage_tag: {
    ar: 'قصة بطاقة أمتعة وسفر بحافة جلدية مخيطة',
    en: 'Contoured Stitched Luggage Tag Die-Cut Silhouette',
  },
  fluffy_cloud: {
    ar: 'قصة غيمة سماوية مرحة للحقائب المدرسية',
    en: 'Fluffy Cloud Backpack Die-Cut Silhouette',
  },
  gamepad: {
    ar: 'قصة يد تحكم ألعاب احترافية',
    en: 'Ergonomic Gaming Controller Die-Cut Silhouette',
  },
  dslr_camera: {
    ar: 'قصة كاميرا DSLR احترافية لمعدات التصوير',
    en: 'Contoured DSLR Camera Body Die-Cut Silhouette',
  },
  shield_crest: {
    ar: 'قصة درع حماية متناظر',
    en: 'Protective Shield Crest Die-Cut Silhouette',
  },
};

function resolveCategory(spec: MasterTemplateSpec): QrFormatType {
  if (spec.silhouette === 'luggage_tag') return 'luggage_tag';
  if (spec.silhouette === 'cat_head' || spec.silhouette === 'dog_bone') return 'pet_medal';
  if (spec.domainCategory === 'business' && spec.silhouette === 'rounded_rect') return 'metal_plate';
  return 'sticker';
}

function resolveDefaultMaterial(spec: MasterTemplateSpec): PrintMaterialFinish {
  if (spec.domainCategory === 'travel') return 'waterproof_vinyl';
  if (spec.domainCategory === 'pets') return 'textured_outdoor_vinyl';
  if (spec.domainCategory === 'business') return 'brushed_polyester';
  return 'soft_matte_foil';
}

function buildMasterTemplate(spec: MasterTemplateSpec): TagDesignTemplate {
  const silhouetteLabel = SILHOUETTE_LABELS[spec.silhouette];
  const defaultMat = resolveDefaultMaterial(spec);
  const numLabel = String(spec.index).padStart(2, '0');
  const isNew = spec.origin === 'new_original';

  const featuresAr: string[] = [
    'شعار FindIt QR الرسمي ومساحة QR بيضاء صافية مخصصة للإدراج الديناميكي في ملفات الطباعة',
    `مقاس طباعة قياسي ${spec.widthMm} × ${spec.heightMm} مم بدقة 300 DPI مع هامش Bleed +3 مم ومنطقة أمان -3 مم`,
    'فصل تام بين معاينة المنتج للمتجر (1200×900) وملفات الطباعة الاحترافية (Editable SVG + Print-Ready SVG + 300 DPI PNG)',
  ];
  const featuresEn: string[] = [
    'Official FindIt QR branding with a clean blank #FFFFFF dynamic QR zone in all editable and print-ready files',
    `Calibrated ${spec.widthMm} × ${spec.heightMm} mm trim artboard at 300 DPI with +3 mm bleed, -3 mm safe margin & CutContour`,
    'Strict separation between customer studio previews (1200×900) and production print files (SVG + 300 DPI PNG)',
  ];

  if (spec.requiresIpVerification) {
    featuresAr.push('تنبيه حقوق الملكية: يتطلب التحقق من الحقوق والترخيص التجاري قبل إعادة البيع التجاري');
    featuresEn.push('Commercial IP Notice: Third-party character/franchise rights verification required prior to commercial resale');
  }

  const recommendedMap: Record<MasterTemplateSpec['domainCategory'], { ar: string[]; en: string[] }> = {
    travel: {
      ar: ['حقائب السفر والمقصورة', 'حافظات جوازات السفر', 'حقائب الرحلات والعمل'],
      en: ['Cabin & Checked Suitcases', 'Passport Folios & Travel Packs', 'Backpacks & Gear Cases'],
    },
    pets: {
      ar: ['أطواق وميداليات الحيوانات الأليفة', 'أقفاص نقل القطط والكلاب', 'علب الطعام والدفاتر البيطرية'],
      en: ['Pet Collars & ID Tags', 'Cat & Dog Travel Carriers', 'Vet Records & Food Containers'],
    },
    family: {
      ar: ['الحقائب المدرسية وصناديق الطعام', 'المطارات والدفاتر المدرسية', 'أجهزة الأطفال اللوحية'],
      en: ['School Backpacks & Lunchboxes', 'Water Bottles & Notebooks', 'Kids Tablets & Daily Gear'],
    },
    business: {
      ar: ['حقائب رجال الأعمال والحقائب الطبية', 'أجهزة اللابتوب ومعدات الشركات', 'الأصول المؤسسية والمستلزمات الهامة'],
      en: ['Executive Briefcases & Priority Kits', 'Company Laptops & Field Gear', 'Corporate Assets & Medical Cases'],
    },
    personal: {
      ar: ['أجهزة اللابتوب والهواتف والكاميرات', 'سماعات الرأس ومفاتيح السيارات', 'الأكواب الحرارية والدفاتر الشخصية'],
      en: ['Laptops, Cameras & Gaming Consoles', 'Headphones & Car Keychains', 'Tumblers, Journals & Everyday Carry'],
    },
    anime_cartoon: {
      ar: ['حقائب الظهر والمدرسة والجامعة', 'أجهزة الألعاب واللابتوب والتابلت', 'المطارات والدفاتر والمقتنيات الشخصية'],
      en: ['School & Campus Backpacks', 'Gaming Consoles, Laptops & Tablets', 'Bottles, Journals & Personal Gear'],
    },
  };

  const rec = recommendedMap[spec.domainCategory];

  return {
    id: spec.id,
    slug: spec.filePrefix,
    titleAr: spec.titleAr,
    titleEn: spec.titleEn,
    subtitleAr: spec.subtitleAr,
    subtitleEn: spec.subtitleEn,
    category: resolveCategory(spec),
    domainCategory: spec.domainCategory,
    templateScope: spec.templateScope,
    shapeSilhouette: SILHOUETTE_TO_TAG_SHAPE[spec.silhouette],
    specialtyBadgeAr: isNew
      ? `مجموعة ماستر #${numLabel} · مبتكر جديد`
      : spec.requiresIpVerification
      ? `مجموعة ماستر #${numLabel} · أنمي (يتطلب تحقق IP)`
      : `مجموعة ماستر #${numLabel} · إصدار أصلي`,
    specialtyBadgeEn: isNew
      ? `Master #${numLabel} · New Original`
      : spec.requiresIpVerification
      ? `Master #${numLabel} · Anime (IP Check Req.)`
      : `Master #${numLabel} · Reference Edition`,
    materialAr: 'فينيل طباعة احترافي مقاوم للماء والخدش بدقة 300 DPI',
    materialEn: '300 DPI Waterproof Scratch-Resistant Commercial Vinyl',
    dimensionsMm: `${spec.widthMm} × ${spec.heightMm} mm`,
    weatherproofRating: '300 DPI · IP68 Waterproof Vinyl',
    primaryHex: spec.primaryHex,
    secondaryHex: spec.secondaryHex,
    badgeColorHex: spec.badgeColorHex,
    priceSar: spec.priceSar,
    priceUsd: spec.priceUsd,
    includedInTier: spec.priceSar >= 45 ? 'premium' : 'plus',
    isPilotShowcase: true,
    defaultCalloutText: spec.arabicMessage,
    pilotConceptAr: spec.unresolvedNotesAr
      ? `${spec.subtitleAr} — ملاحظة مرجعية: ${spec.unresolvedNotesAr}`
      : spec.subtitleAr,
    pilotConceptEn: spec.subtitleEn,
    visualIdentityAr: `${silhouetteLabel.ar} (${spec.widthMm} × ${spec.heightMm} مم) · الرسالة العربية: «${spec.arabicMessage}».`,
    visualIdentityEn: `${silhouetteLabel.en} (${spec.widthMm} × ${spec.heightMm} mm) · English copy: "${spec.englishMessage}".`,
    featuresAr,
    featuresEn,
    recommendedForAr: rec.ar,
    recommendedForEn: rec.en,
    printSpecs: {
      trimWidthMm: spec.widthMm,
      trimHeightMm: spec.heightMm,
      bleedMm: 3,
      safeMarginMm: 3,
      dpi: 300,
      colorSpace: 'CMYK Print-Safe (sRGB Preview)',
      dieCutShapeAr: silhouetteLabel.ar,
      dieCutShapeEn: silhouetteLabel.en,
      availableSizesMm: [`${spec.widthMm} × ${spec.heightMm} mm (المقاس الإنتاجي المعتمد 3:2)`],
      defaultMaterial: defaultMat,
      recommendedMaterials: [
        {
          id: defaultMat,
          nameAr: 'فينيل مطفي مقاوم للماء وعالي التباين',
          nameEn: 'High-Contrast Waterproof Matte Vinyl',
          notesAr: 'يحافظ على حدة الألوان والتفاصيل الدقيقة ويمنع انعكاس الضوء فوق كود QR.',
          notesEn: 'Preserves rich illustration detail and eliminates glare across the dynamic QR zone.',
        },
        {
          id: 'glossy_vinyl',
          nameAr: 'فينيل لامع مقاوم للأشعة UV',
          nameEn: 'UV-Protected Gloss Vinyl',
          notesAr: 'يبرز الإضاءات المعدنية والرسوم الكرتونية والملونة بحماية طويلة الأمد.',
          notesEn: 'Enhances metallic highlights and vibrant artwork with long-term UV lamination.',
        },
      ],
    },
    status: 'published',
    isFree: false,
    isFeatured: isNew || spec.index <= 8,
    isCoreProtected: true,
    purchaseMode: 'both',
    customizationMode: 'mixed',
    allowEditAfterSave: true,
    maxCopies: 0,
    tags: [
      'master-collection',
      spec.origin === 'new_original' ? 'new-original' : 'reference-edition',
      spec.domainCategory,
      spec.silhouette,
      ...(spec.requiresIpVerification ? ['ip-verification-required', 'anime'] : ['commercial-ready']),
    ],
    licenseTypeId: spec.domainCategory === 'business' ? 'lic-commercial-standard' : 'lic-personal-standard',
    originalDesignUrl: `/assets/master-collection/editable/${spec.filePrefix}.editable.svg`,
    printFileUrl: `/assets/master-collection/print-ready/${spec.filePrefix}.print-ready.svg`,
    previewImages: [`/assets/master-collection/previews/${spec.filePrefix}.preview.png`],
    salesCount: 0,
    usageCount: 0,
  };
}

export const MASTER_COLLECTION_TEMPLATES_33: TagDesignTemplate[] =
  MASTER_COLLECTION_SPECS.map(buildMasterTemplate);
