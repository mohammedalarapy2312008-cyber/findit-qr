import { generateQrMatrix } from './qrLogic';
import type { TemplateDomainCategory } from '../types/domain';

export type MasterCollectionId =
  | 'master-01-corporate-briefcase'
  | 'master-02-tech-laptop'
  | 'master-03-doraemon-adventure'
  | 'master-04-heritage-compass'
  | 'master-05-tabby-kitten'
  | 'master-06-cairo-giza-heritage'
  | 'master-07-golden-leaf-navy'
  | 'master-08-midnight-mountain'
  | 'master-09-golden-retriever-bone'
  | 'master-10-leather-bone-collar'
  | 'master-11-butterfly-kids'
  | 'master-12-little-explorer-star'
  | 'master-13-dubai-skyline-luggage'
  | 'master-14-paris-seine-luggage'
  | 'master-15-schoolboy-cloud'
  | 'master-16-world-traveler-luggage'
  | 'master-17-istanbul-bosphorus-luggage'
  | 'master-18-neon-gamepad-pro'
  | 'master-19-dslr-camera-pro'
  | 'master-20-kenshiro-hokuto'
  | 'master-21-goku-dragon-ball'
  | 'master-22-naruto-rasengan'
  | 'master-23-jotaro-star-platinum'
  | 'master-24-detective-conan'
  | 'master-25-hunter-gon-friends'
  | 'master-26-zoro-one-piece'
  | 'master-27-eren-attack-on-titan'
  | 'master-28-captain-tsubasa'
  | 'master-29-tanjiro-demon-slayer'
  | 'master-30-tokyo-sakura-luggage'
  | 'master-31-grand-touring-sport'
  | 'master-32-artisan-cafe-studio'
  | 'master-33-care-safety-shield';

export type MasterSilhouetteKind =
  | 'rounded_rect'
  | 'laptop_tag'
  | 'anime_diecut'
  | 'scalloped_plaque'
  | 'cat_head'
  | 'wide_hexagon'
  | 'squircle'
  | 'dog_bone'
  | 'butterfly'
  | 'star_five'
  | 'luggage_tag'
  | 'fluffy_cloud'
  | 'gamepad'
  | 'dslr_camera'
  | 'shield_crest';

export interface MasterNewOverlayConfig {
  logoVariant: 'navy_orange' | 'white_gold' | 'espresso_gold' | 'teal_gold';
  logoCenterXMm: number;
  logoCenterYMm: number;
  logoScale: number;
  arabicLine1: string;
  arabicLine2?: string;
  englishLine1: string;
  englishLine2?: string;
  textCenterXMm: number;
  arabicY1Mm: number;
  arabicY2Mm?: number;
  englishY1Mm: number;
  englishY2Mm?: number;
  arabicColor: string;
  englishColor: string;
  arabicFontSizeMm: number;
  englishFontSizeMm: number;
  textShadow?: boolean;
}

export interface MasterTemplateSpec {
  index: number;
  id: MasterCollectionId;
  filePrefix: string;
  origin: 'reference' | 'new_original';
  sourceImagePublicUrl: string;
  sourceWidthPx: number;
  sourceHeightPx: number;
  /** Exact detected inner white QR box inside the original metallic/colored QR frame (in source pixels) */
  qrBoxPx: { x: number; y: number; width: number; height: number };
  /** Corner radius of the inner white QR mask in mm */
  qrMaskRadiusMm: number;
  widthMm: number;
  heightMm: number;
  silhouette: MasterSilhouetteKind;
  domainCategory: TemplateDomainCategory;
  templateScope: 'general' | 'specialized';
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  arabicMessage: string;
  englishMessage: string;
  characterQuoteAr?: string;
  requiresIpVerification: boolean;
  unresolvedNotesAr?: string;
  primaryHex: string;
  secondaryHex: string;
  badgeColorHex: string;
  priceSar: number;
  priceUsd: number;
  newOverlay?: MasterNewOverlayConfig;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const MASTER_COLLECTION_SPECS: MasterTemplateSpec[] = [
  {
    index: 1,
    id: 'master-01-corporate-briefcase',
    filePrefix: '01-corporate-briefcase',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/a95879fb-00c4-4793-87a5-eed14aec6035_ad03be57.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 587, y: 282, width: 361, height: 326 },
    qrMaskRadiusMm: 2.2,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'rounded_rect',
    domainCategory: 'business',
    templateScope: 'specialized',
    titleAr: 'الأعمال التنفيذية — بطاقة الحقائب والشركات',
    titleEn: 'Executive Corporate Briefcase',
    subtitleAr: 'تصميم أعمال فاخر بالكحلي الملكي والذهبي وأبراج الزجاج وحقيبة الأعمال، متطابق مع المرجع الأصلي بمساحة QR ديناميكية نظيفة.',
    subtitleEn: 'Executive navy-and-gold corporate tag with briefcase emblem and glass skyline, reproduced faithfully with a clean dynamic QR zone.',
    arabicMessage: 'لو لقيت هذا الغرض، امسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found this item, please scan to contact the owner',
    requiresIpVerification: false,
    primaryHex: '#0F2544',
    secondaryHex: '#F4F5F7',
    badgeColorHex: '#D4A138',
    priceSar: 45,
    priceUsd: 12,
  },
  {
    index: 2,
    id: 'master-02-tech-laptop',
    filePrefix: '02-tech-laptop',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/94b865eb-2353-420b-af86-4058cfe898cf_806b2e29.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 655, y: 257, width: 356, height: 320 },
    qrMaskRadiusMm: 2.2,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'laptop_tag',
    domainCategory: 'personal',
    templateScope: 'specialized',
    titleAr: 'مكتب التقنية واللابتوب — بطاقة الأجهزة الذكية',
    titleEn: 'Tech Studio Laptop Tag',
    subtitleAr: 'تصميم بقصة لابتوب مفتوح مع سماعات وكاميرا وهاتف وحلقة جلدية زرقاء ومعدنية ذهبية للمعدات والأجهزة الإلكترونية.',
    subtitleEn: 'Die-cut open laptop tag with studio headphones, camera, smartphone, desk gear, and blue leather ring accent.',
    arabicMessage: 'لو لقيتني، امسح الرمز للتواصل مع صاحبي',
    englishMessage: 'If you found me please scan to contact my owner',
    requiresIpVerification: false,
    primaryHex: '#0F2C59',
    secondaryHex: '#38BDF8',
    badgeColorHex: '#F97316',
    priceSar: 42,
    priceUsd: 11,
  },
  {
    index: 3,
    id: 'master-03-doraemon-adventure',
    filePrefix: '03-doraemon-adventure',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/c11457e4-7298-4a39-af00-6acc64c5cf34_a7e26507.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 724, y: 346, width: 338, height: 309 },
    qrMaskRadiusMm: 2.4,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'anime_diecut',
    domainCategory: 'family',
    templateScope: 'specialized',
    titleAr: 'مغامرة دورايمون — ملصق الأنمي الكلاسيكي',
    titleEn: 'Doraemon Magic Adventure',
    subtitleAr: 'تصميم أنمي مبهج بشخصية دورايمون والمروحة الطائرة والباب الوردي والجرس الذهبي مع عبارة "معًا إلى مغامرة جديدة!". (يتطلب التحقق من الحقوق التجارية قبل البيع).',
    subtitleEn: 'Playful anime sticker featuring Doraemon, bamboo-copter, pink magic door, and golden bell. Commercial IP clearance required prior to resale.',
    arabicMessage: 'إذا وجدت هذا الغرض يرجى مسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found me, please scan to contact my owner',
    characterQuoteAr: 'معًا إلى مغامرة جديدة!',
    requiresIpVerification: true,
    unresolvedNotesAr: 'في الصورة المرجعية توجد علامة تنوين طفيفة فوق كلمة "إلى"؛ تم الحفاظ على الأصل بدقة مع توثيق الصيغة الصحيحة "معًا إلى مغامرة جديدة!" للطباعة التحريرية. يتطلب التحقق من حقوق الشخصية تجاريًا.',
    primaryHex: '#0284C7',
    secondaryHex: '#FACC15',
    badgeColorHex: '#EF4444',
    priceSar: 39,
    priceUsd: 10,
  },
  {
    index: 4,
    id: 'master-04-heritage-compass',
    filePrefix: '04-heritage-compass',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/a0c16eb0-68e5-49a0-b343-b02d39d251a1_7142887b.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 670, y: 261, width: 377, height: 345 },
    qrMaskRadiusMm: 2.6,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'scalloped_plaque',
    domainCategory: 'travel',
    templateScope: 'general',
    titleAr: 'البوصلة التراثية والرحالة — لوحة سفر فاخرة',
    titleEn: 'Heritage Compass & Botanical Traveler',
    subtitleAr: 'لوحة كلاسيكية بحواف متموجة بالأخضر الغابي والذهبي المعتق مع بوصلة نحاسية وخريطة عتيقة وأغصان زيتون وطائرة سفر.',
    subtitleEn: 'Scalloped forest-green and antique-gold traveler plaque with brass compass, vintage map, botanical branch, and golden plane.',
    arabicMessage: 'لو لقيت هذا الغرض امسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found this item please scan to contact the owner',
    requiresIpVerification: false,
    primaryHex: '#133A29',
    secondaryHex: '#F8EFE0',
    badgeColorHex: '#C59233',
    priceSar: 42,
    priceUsd: 11,
  },
  {
    index: 5,
    id: 'master-05-tabby-kitten',
    filePrefix: '05-tabby-kitten',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/aa58930e-15ff-4a7b-9240-6e14d8b2767b_597783fa.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 709, y: 289, width: 310, height: 282 },
    qrMaskRadiusMm: 2.0,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'cat_head',
    domainCategory: 'pets',
    templateScope: 'specialized',
    titleAr: 'بطاقة القطة الرمادية — ملصق الحيوانات الأليفة',
    titleEn: 'Tabby Kitten Purr-Tag',
    subtitleAr: 'ملصق بقصة رأس قطة بأذنين ناعمتين بإطار برقوقي وذهبي يضم قطة لطيفة بطوق وميدالية كف وقلب ذهبي.',
    subtitleEn: 'Die-cut cat-head silhouette in plum and brushed gold featuring a tabby kitten with collar charm, golden heart, and paw prints.',
    arabicMessage: 'لو لقيتني، امسح الرمز للتواصل مع صاحبي',
    englishMessage: 'If you found me please scan to contact my owner',
    requiresIpVerification: false,
    primaryHex: '#5B2547',
    secondaryHex: '#FDF1DE',
    badgeColorHex: '#D49A37',
    priceSar: 39,
    priceUsd: 10,
  },
  {
    index: 6,
    id: 'master-06-cairo-giza-heritage',
    filePrefix: '06-cairo-giza-heritage',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/6629fadb-4ef6-446e-89db-b7d626913746_1dd612cf.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 620, y: 284, width: 305, height: 291 },
    qrMaskRadiusMm: 2.0,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'wide_hexagon',
    domainCategory: 'travel',
    templateScope: 'specialized',
    titleAr: 'تراث القاهرة والأهرامات — بطاقة مصر الملكية',
    titleEn: 'Cairo & Giza Heritage Hexagon',
    subtitleAr: 'تصميم سداسي أنيق بالكحلي والذهبي والبردي يجمع أهرامات الجيزة وأبو الهول وبرج القاهرة والنيل والفلوكة وزهرة اللوتس.',
    subtitleEn: 'Hexagonal Egyptian heritage badge uniting Giza Pyramids, Sphinx, Cairo Tower, Nile felucca, and golden lotus frieze.',
    arabicMessage: 'لو لقيت هذا الغرض امسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found this item please scan to contact the owner.',
    requiresIpVerification: false,
    primaryHex: '#102A43',
    secondaryHex: '#F7E7CE',
    badgeColorHex: '#C8922D',
    priceSar: 45,
    priceUsd: 12,
  },
  {
    index: 7,
    id: 'master-07-golden-leaf-navy',
    filePrefix: '07-golden-leaf-navy',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/46b1c368-67a3-4e89-bc3d-d0cb5c9da7e3_80775a12.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 626, y: 249, width: 344, height: 333 },
    qrMaskRadiusMm: 2.6,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'squircle',
    domainCategory: 'personal',
    templateScope: 'general',
    titleAr: 'غصن الذهب والكحلي — ملصق الفخامة البسيطة',
    titleEn: 'Golden Leaf Minimalist Luxury',
    subtitleAr: 'تصميم مربع ناعم الزوايا بإطار ذهبي وأرضية كريمية مزينة بغصن أوراق ذهبي بارز وموجة كحلية أنيقة.',
    subtitleEn: 'Minimalist luxury squircle with embossed gold botanical sprig, textured cream paper, and deep navy golden wave.',
    arabicMessage: 'لو لقيت الغرض ده امسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found this item please scan to contact the owner',
    requiresIpVerification: false,
    primaryHex: '#0E2440',
    secondaryHex: '#FAF3E7',
    badgeColorHex: '#D19A36',
    priceSar: 42,
    priceUsd: 11,
  },
  {
    index: 8,
    id: 'master-08-midnight-mountain',
    filePrefix: '08-midnight-mountain',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/809e6f2f-426a-43cc-a4db-dde5341f4212_8bee9bce.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 364, y: 280, width: 380, height: 356 },
    qrMaskRadiusMm: 2.8,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'rounded_rect',
    domainCategory: 'personal',
    templateScope: 'general',
    titleAr: 'جلد منتصف الليل وأفق الجبال — بطاقة فاخرة',
    titleEn: 'Midnight Leather & Golden Horizon',
    subtitleAr: 'تصميم مقسم بشريط ذهبي انسيابي بين الجلد الكحلي المحبب ومشهد جبال الصنوبر والشمس الذهبية على خلفية عاجية.',
    subtitleEn: 'Split-panel luxury tag pairing textured midnight navy leather with a serene golden mountain and pine horizon.',
    arabicMessage: 'لو لقيت هذا الغرض امسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found this item please scan to contact the owner',
    requiresIpVerification: false,
    primaryHex: '#0A1E36',
    secondaryHex: '#F6EDE0',
    badgeColorHex: '#D9A13B',
    priceSar: 45,
    priceUsd: 12,
  },
  {
    index: 9,
    id: 'master-09-golden-retriever-bone',
    filePrefix: '09-golden-retriever-bone',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/e629549c-725f-4887-a35e-6233c7c8e759_8ea40a75.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 696, y: 292, width: 298, height: 276 },
    qrMaskRadiusMm: 2.0,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'dog_bone',
    domainCategory: 'pets',
    templateScope: 'specialized',
    titleAr: 'بطاقة عظمة الجولدن ريتريفر — حماية الحيوانات الأليفة',
    titleEn: 'Golden Retriever Bone Tag',
    subtitleAr: 'بطاقة بقصة عظمة كلب بإطار كحلي وذهبي تضم كلب جولدن ريتريفر مبتسم بطوق أزرق وشعار قلب وكف ذهبي.',
    subtitleEn: 'Die-cut dog-bone silhouette in navy and gold featuring a smiling Golden Retriever, blue collar charm, and paw-heart emblem.',
    arabicMessage: 'لو لقيتني، امسح الرمز للتواصل مع صاحبي',
    englishMessage: 'If you found me please scan to contact my owner',
    requiresIpVerification: false,
    primaryHex: '#102D57',
    secondaryHex: '#FBF3E4',
    badgeColorHex: '#D49A2A',
    priceSar: 39,
    priceUsd: 10,
  },
  {
    index: 10,
    id: 'master-10-leather-bone-collar',
    filePrefix: '10-leather-bone-collar',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/cce4e29b-22ee-4dd2-897d-703a29134efc_7fe01390.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 612, y: 280, width: 311, height: 293 },
    qrMaskRadiusMm: 2.0,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'dog_bone',
    domainCategory: 'pets',
    templateScope: 'specialized',
    titleAr: 'بطاقة العظمة الجلدية المخيطة — الأليفة الكلاسيكية',
    titleEn: 'Saddle Leather Stitched Bone Tag',
    subtitleAr: 'بطاقة عظمة كلاسيكية بإطار جلد بني مخيط يضم أثر كف بارز بقلب وطوق جلدي بميدالية عظمة ذهبية.',
    subtitleEn: 'Hand-stitched saddle leather dog-bone tag with embossed paw-heart mark and classic collared bone charm.',
    arabicMessage: 'لو لقيتني، امسح الرمز للتواصل مع صاحبي',
    englishMessage: 'If you found me please scan to contact my owner',
    requiresIpVerification: false,
    primaryHex: '#5E2C12',
    secondaryHex: '#F9EEDB',
    badgeColorHex: '#D98A1C',
    priceSar: 39,
    priceUsd: 10,
  },
  {
    index: 11,
    id: 'master-11-butterfly-kids',
    filePrefix: '11-butterfly-kids',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/70a7d8e7-ce78-4ec1-bfce-ad3a328cea31_6592dcd9.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 585, y: 315, width: 365, height: 334 },
    qrMaskRadiusMm: 2.4,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'butterfly',
    domainCategory: 'family',
    templateScope: 'specialized',
    titleAr: 'فراشة الأطفال المبهجة — ملصق البنات والمدرسة',
    titleEn: 'Happy Butterfly Kids Tag',
    subtitleAr: 'تصميم بقصة فراشة مبتسمة بأجنحة وردية وبنفسجية مخيطة تضم قوس قزح وسحابة وزهرة ونجوم ورسالة ثنائية اللغة.',
    subtitleEn: 'Die-cut smiling butterfly tag in stitched magenta and blush pink with rainbow, cloud, flower, stars, and bilingual return note.',
    arabicMessage: 'لو لقيت هذا الغرض امسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found this item please scan to contact the owner',
    requiresIpVerification: false,
    primaryHex: '#8E24AA',
    secondaryHex: '#FCE4EC',
    badgeColorHex: '#F59E0B',
    priceSar: 35,
    priceUsd: 9,
  },
  {
    index: 12,
    id: 'master-12-little-explorer-star',
    filePrefix: '12-little-explorer-star',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/d3e30ca9-054e-489b-a122-99bc60b02d9b_6d56adae.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 606, y: 316, width: 330, height: 296 },
    qrMaskRadiusMm: 2.2,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'star_five',
    domainCategory: 'family',
    templateScope: 'specialized',
    titleAr: 'نجمة المستكشف الصغير — ملصق المدرسة والأطفال',
    titleEn: 'Little Explorer Star Tag',
    subtitleAr: 'ملصق بقصة نجمة خماسية بإطار كحلي مخيط وأصفر ذهبي يضم صاروخًا وحقيبة مدرسية ونجمة مبتسمة وقوس قزح.',
    subtitleEn: 'Five-pointed star sticker with stitched navy-and-gold trim, cartoon rocket, school backpack, smiling star, and twin rainbows.',
    arabicMessage: 'لو لقيتني، امسح الرمز للتواصل مع صاحبي',
    englishMessage: 'If you found me please scan to contact my owner',
    requiresIpVerification: false,
    primaryHex: '#0F2E5C',
    secondaryHex: '#FEF9EB',
    badgeColorHex: '#F59E0B',
    priceSar: 35,
    priceUsd: 9,
  },
  {
    index: 13,
    id: 'master-13-dubai-skyline-luggage',
    filePrefix: '13-dubai-skyline-luggage',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/61614916-b8e0-45f7-82b8-687cc6b16f1e_3ad245a8.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 644, y: 275, width: 359, height: 326 },
    qrMaskRadiusMm: 2.2,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'luggage_tag',
    domainCategory: 'travel',
    templateScope: 'specialized',
    titleAr: 'بطاقة سفر دبي — أفق برج خليفة والضيافة العربية',
    titleEn: 'Dubai Skyline Luggage Tag',
    subtitleAr: 'بطاقة أمتعة جلدية مخيطة بحلقة ذهبية تجمع برج خليفة وبرج العرب والجمل والدلة والفانوس والتمور بألوان الغروب الذهبي.',
    subtitleEn: 'Stitched navy luggage tag showcasing Burj Khalifa, Burj Al Arab, desert camel, golden dallah, lantern, and dates.',
    arabicMessage: 'لو لقيتني، امسح الرمز للتواصل مع صاحبي',
    englishMessage: 'If you found me please scan to contact my owner',
    requiresIpVerification: false,
    primaryHex: '#0E2E5C',
    secondaryHex: '#38BDF8',
    badgeColorHex: '#F59E0B',
    priceSar: 45,
    priceUsd: 12,
  },
  {
    index: 14,
    id: 'master-14-paris-seine-luggage',
    filePrefix: '14-paris-seine-luggage',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/0c01fd07-7a03-4035-9729-ee3d6c04aa8d_69f7d8e6.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 648, y: 276, width: 357, height: 325 },
    qrMaskRadiusMm: 2.2,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'luggage_tag',
    domainCategory: 'travel',
    templateScope: 'specialized',
    titleAr: 'بطاقة سفر باريس — برج إيفل ونهر السين',
    titleEn: 'Paris Seine & Eiffel Luggage Tag',
    subtitleAr: 'بطاقة سفر فاخرة بإطار كحلي مخيط تجمع برج إيفل وقت الغروب ونهر السين وحقيبة جلدية بطوابع باريس والكرواسون والقهوة.',
    subtitleEn: 'Stitched navy luggage tag capturing Eiffel Tower sunset over the Seine, vintage suitcase, Paris stamps, croissant, and café latte.',
    arabicMessage: 'لو لقيتني، امسح الرمز للتواصل مع صاحبي',
    englishMessage: 'If you found me please scan to contact my owner',
    requiresIpVerification: false,
    primaryHex: '#0F2E5A',
    secondaryHex: '#F472B6',
    badgeColorHex: '#F97316',
    priceSar: 45,
    priceUsd: 12,
  },
  {
    index: 15,
    id: 'master-15-schoolboy-cloud',
    filePrefix: '15-schoolboy-cloud',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/36d071c3-6680-4bc2-9c27-1d0eff0671da_8c317ba0.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 633, y: 262, width: 333, height: 307 },
    qrMaskRadiusMm: 2.2,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'fluffy_cloud',
    domainCategory: 'family',
    templateScope: 'specialized',
    titleAr: 'غيمة شنطة المدرسة — بطاقة الطالب المرحة',
    titleEn: 'Schoolboy Cloud Backpack Tag',
    subtitleAr: 'ملصق بقصة غيمة سماوية بإطار أزرق مخيط يضم طفلًا مبتسمًا بقبعة زرقاء وهودي أصفر وحقيبة مدرسية ونجوم.',
    subtitleEn: 'Fluffy blue-stitched cloud sticker with cheerful cartoon student in cap and yellow hoodie, school backpack icon, and stars.',
    arabicMessage: 'لو لقيت شنطتي، امسح الرمز للتواصل مع صاحبها',
    englishMessage: 'If you found my bag please scan to contact the owner',
    requiresIpVerification: false,
    primaryHex: '#15549E',
    secondaryHex: '#E0F2FE',
    badgeColorHex: '#FACC15',
    priceSar: 35,
    priceUsd: 9,
  },
  {
    index: 16,
    id: 'master-16-world-traveler-luggage',
    filePrefix: '16-world-traveler-luggage',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/c21e9e2b-be4b-47ac-bf09-1d3d381e7198_ccf14492.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 649, y: 275, width: 357, height: 325 },
    qrMaskRadiusMm: 2.2,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'luggage_tag',
    domainCategory: 'travel',
    templateScope: 'specialized',
    titleAr: 'بطاقة حول العالم — الرحالة ومعالم الكوكب',
    titleEn: 'World Traveler Landmarks Luggage Tag',
    subtitleAr: 'بطاقة سفر دولية تجمع حقيبة السفر المزينة بالملصقات وجواز السفر والكاميرا وأشهر المعالم العالمية وطائرة محلقة.',
    subtitleEn: 'Global luggage tag uniting a sticker-covered suitcase, passport, vintage camera, Eiffel Tower, Colosseum, Big Ben, and Mount Fuji.',
    arabicMessage: 'لو لقيتني، امسح الرمز للتواصل مع صاحبي',
    englishMessage: 'If you found me please scan to contact my owner',
    requiresIpVerification: false,
    primaryHex: '#0F2E5C',
    secondaryHex: '#38BDF8',
    badgeColorHex: '#F97316',
    priceSar: 45,
    priceUsd: 12,
  },
  {
    index: 17,
    id: 'master-17-istanbul-bosphorus-luggage',
    filePrefix: '17-istanbul-bosphorus-luggage',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/8b8970b5-c093-4120-a561-d805d3a1efd8_ab3f81f5.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 650, y: 275, width: 357, height: 326 },
    qrMaskRadiusMm: 2.2,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'luggage_tag',
    domainCategory: 'travel',
    templateScope: 'specialized',
    titleAr: 'بطاقة سفر إسطنبول — البوسفور والجامع الأزرق',
    titleEn: 'Istanbul Bosphorus Luggage Tag',
    subtitleAr: 'بطاقة أمتعة سفر مستوحاة من إسطنبول تضم جسر البوسفور وآيا صوفيا والمصباح الفسيفسائي والشاي التركي والسميت والـتوليب.',
    subtitleEn: 'Istanbul travel tag highlighting Bosphorus Bridge, historic domes, mosaic lantern, Turkish tea, simit, ferry, and tulips.',
    arabicMessage: 'لو لقيتني، امسح الرمز للتواصل مع صاحبي',
    englishMessage: 'If you found me please scan to contact my owner',
    requiresIpVerification: false,
    primaryHex: '#0E2E5C',
    secondaryHex: '#E11D48',
    badgeColorHex: '#F97316',
    priceSar: 45,
    priceUsd: 12,
  },
  {
    index: 18,
    id: 'master-18-neon-gamepad-pro',
    filePrefix: '18-neon-gamepad-pro',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/a05782fb-b1ca-4929-b196-ce2747e2fad4_d079b379.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 589, y: 248, width: 358, height: 334 },
    qrMaskRadiusMm: 2.4,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'gamepad',
    domainCategory: 'personal',
    templateScope: 'specialized',
    titleAr: 'يد تحكم الألعاب النيونية — بطاقة اللاعبين',
    titleEn: 'Pro Neon Gamepad Controller Tag',
    subtitleAr: 'ملصق بقصة يد تحكم ألعاب احترافية بإضاءة سيان وبرتقالي نيوني وأزرار التحكم وغرفة ألعاب مظلمة للأجهزة والحقائب.',
    subtitleEn: 'Die-cut ergonomic gaming controller sticker with cyan-orange neon trims, glowing face buttons, and dark esports studio backdrop.',
    arabicMessage: 'لو لقيتني، امسح الرمز للتواصل مع صاحبي',
    englishMessage: 'If you found me please scan to contact my owner',
    requiresIpVerification: false,
    primaryHex: '#0B172E',
    secondaryHex: '#06B6D4',
    badgeColorHex: '#F97316',
    priceSar: 42,
    priceUsd: 11,
  },
  {
    index: 19,
    id: 'master-19-dslr-camera-pro',
    filePrefix: '19-dslr-camera-pro',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/2a27cc8f-7f10-4471-bd1a-b380b0235f0d_30e0e35c.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 598, y: 274, width: 408, height: 341 },
    qrMaskRadiusMm: 2.2,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'dslr_camera',
    domainCategory: 'personal',
    templateScope: 'specialized',
    titleAr: 'كاميرا المصور الاحترافي — بطاقة معدات التصوير',
    titleEn: 'Pro DSLR Camera Photographer Tag',
    subtitleAr: 'ملصق بقصة كاميرا DSLR احترافية يتوسط عدستها رمز QR بإطار برتقالي مع صور بولارويد وعدسة إضافية وخلفية جبال غروب.',
    subtitleEn: 'Die-cut DSLR camera tag framing the QR inside the central lens barrel alongside Polaroid landscapes and pro lens gear.',
    arabicMessage: 'لو لقيتني، امسح الرمز للتواصل مع صاحبي',
    englishMessage: 'If you found me please scan to contact my owner',
    requiresIpVerification: false,
    primaryHex: '#111827',
    secondaryHex: '#F59E0B',
    badgeColorHex: '#F97316',
    priceSar: 42,
    priceUsd: 11,
  },
  {
    index: 20,
    id: 'master-20-kenshiro-hokuto',
    filePrefix: '20-kenshiro-hokuto',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/d6a728b3-7611-4766-b012-ee4e7090f7c6_295db489.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 583, y: 365, width: 340, height: 323 },
    qrMaskRadiusMm: 2.2,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'anime_diecut',
    domainCategory: 'personal',
    templateScope: 'specialized',
    titleAr: 'سيف النار (كينشيرو) — ملصق الأنمي الكلاسيكي',
    titleEn: 'Fist of the North Star — Kenshiro',
    subtitleAr: 'تصميم مانغا كلاسيكي درامي بألوان غروب الصحراء وعبارة "أنتم الآن في عداد الموتى!". (يتطلب التحقق من الحقوق التجارية قبل النشر والبيع).',
    subtitleEn: 'Classic 80s ink-hatched martial-arts manga sticker with sunset wasteland scene. Commercial IP clearance required prior to resale.',
    arabicMessage: 'إذا وجدت هذا الغرض يرجى مسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found this item, please scan to contact the owner',
    characterQuoteAr: 'أنتم الآن في عداد الموتى!',
    requiresIpVerification: true,
    unresolvedNotesAr: 'الشخصية والعبارة من عمل أنمي/مانغا محمي؛ يتطلب التحقق من حقوق الاستخدام التجاري قبل البيع.',
    primaryHex: '#1E1B4B',
    secondaryHex: '#F59E0B',
    badgeColorHex: '#B91C1C',
    priceSar: 39,
    priceUsd: 10,
  },
  {
    index: 21,
    id: 'master-21-goku-dragon-ball',
    filePrefix: '21-goku-dragon-ball',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/408f71eb-897e-469d-8a9c-316f24691a94_cc7b8ec4.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 659, y: 328, width: 347, height: 330 },
    qrMaskRadiusMm: 2.4,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'anime_diecut',
    domainCategory: 'personal',
    templateScope: 'specialized',
    titleAr: 'دراغون بول (غوكو) — ملصق الطاقة والتنين',
    titleEn: 'Dragon Ball — Goku Energy Tag',
    subtitleAr: 'تصميم أنمي ديناميكي لغوكو والتنين شينرون وكرات التنين وجزيرة كامي وعبارة "قوتي تزداد مع كل تحدٍّ!". (يتطلب التحقق من الحقوق التجارية).',
    subtitleEn: 'Dynamic shonen anime sticker featuring Goku charging energy, green dragon, dragon balls, and island house. Commercial IP clearance required.',
    arabicMessage: 'إذا وجدت هذا الغرض يرجى مسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found me, please scan to contact my owner',
    characterQuoteAr: 'قوتي تزداد مع كل تحدٍّ!',
    requiresIpVerification: true,
    unresolvedNotesAr: 'الشخصيات والعناصر من سلسلة محمية بحقوق ملكية؛ يتطلب التحقق من الترخيص التجاري قبل البيع.',
    primaryHex: '#0F2557',
    secondaryHex: '#F97316',
    badgeColorHex: '#FACC15',
    priceSar: 39,
    priceUsd: 10,
  },
  {
    index: 22,
    id: 'master-22-naruto-rasengan',
    filePrefix: '22-naruto-rasengan',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/f589510e-04fe-4b95-94f0-9e6d8f3d5d95_dedf74be.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 613, y: 266, width: 361, height: 340 },
    qrMaskRadiusMm: 2.4,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'anime_diecut',
    domainCategory: 'personal',
    templateScope: 'specialized',
    titleAr: 'ناروتو (راسينغان) — ملصق النينجا والمخطوطة',
    titleEn: 'Naruto — Rasengan Scroll Tag',
    subtitleAr: 'تصميم أنمي نينجا بشخصية ناروتو وكرة الطاقة الزرقاء ومخطوطة "لن أستسلم أبدًا!" وجبل القرية. (يتطلب التحقق من الحقوق التجارية).',
    subtitleEn: 'High-energy ninja anime sticker with Rasengan spiral, kunai, village monument, and scroll quote. Commercial IP clearance required.',
    arabicMessage: 'إذا وجدت هذا الغرض يرجى مسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found me, please scan to contact my owner',
    characterQuoteAr: 'لن أستسلم أبدًا!',
    requiresIpVerification: true,
    unresolvedNotesAr: 'شخصية وعناصر أنمي محمية؛ يتطلب التحقق من حقوق الاستخدام التجاري قبل البيع.',
    primaryHex: '#0F172A',
    secondaryHex: '#F97316',
    badgeColorHex: '#38BDF8',
    priceSar: 39,
    priceUsd: 10,
  },
  {
    index: 23,
    id: 'master-23-jotaro-star-platinum',
    filePrefix: '23-jotaro-star-platinum',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/9721411a-9eb0-411b-9c24-48d6c62415a3_0dc6ec31.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 665, y: 341, width: 337, height: 326 },
    qrMaskRadiusMm: 2.4,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'anime_diecut',
    domainCategory: 'personal',
    templateScope: 'specialized',
    titleAr: 'جوجو (جوتارو) — ملصق المانغا البنفسجي',
    titleEn: 'JoJo — Jotaro & Star Platinum',
    subtitleAr: 'تصميم مانغا جريء بتظليل الحبر واللون البنفسجي والذهبي مع عبارة "ياري ياري دازه...". (يتطلب التحقق من الحقوق التجارية قبل البيع).',
    subtitleEn: 'Bold manga-ink sticker in violet and gold with dramatic action pose and comic burst quote. Commercial IP clearance required.',
    arabicMessage: 'إذا وجدت هذا الغرض يرجى مسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found this item, please scan to contact the owner',
    characterQuoteAr: 'ياري ياري دازه...',
    requiresIpVerification: true,
    unresolvedNotesAr: 'شخصيات وأسلوب أنمي محمي؛ يتطلب التحقق من الحقوق التجارية قبل النشر والبيع.',
    primaryHex: '#2E1065',
    secondaryHex: '#A855F7',
    badgeColorHex: '#FACC15',
    priceSar: 39,
    priceUsd: 10,
  },
  {
    index: 24,
    id: 'master-24-detective-conan',
    filePrefix: '24-detective-conan',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/9f7715d4-45ed-4352-a3dc-2e19d76a222a_730e5da3.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 637, y: 348, width: 343, height: 326 },
    qrMaskRadiusMm: 2.4,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'anime_diecut',
    domainCategory: 'family',
    templateScope: 'specialized',
    titleAr: 'المحقق كونان — ملصق الغموض والحقيقة',
    titleEn: 'Detective Conan — Mystery Tag',
    subtitleAr: 'تصميم أنمي بوليسي بشخصية المحقق كونان والقمر وساعة بيغ بن والعدسة المكبرة وعبارة "الحقيقة دائمًا تظهر في النهاية!". (يتطلب التحقق من الحقوق).',
    subtitleEn: 'Moonlit mystery anime sticker with Detective Conan, clocktower, magnifying glass, and evidence desk. Commercial IP clearance required.',
    arabicMessage: 'إذا وجدت هذا الغرض يرجى مسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found me, please scan to contact my owner',
    characterQuoteAr: 'الحقيقة دائمًا تظهر في النهاية!',
    requiresIpVerification: true,
    unresolvedNotesAr: 'شخصية المحقق كونان محمية بحقوق ملكية فكرية؛ يجب التحقق من الحقوق التجارية قبل البيع.',
    primaryHex: '#0F2557',
    secondaryHex: '#3B82F6',
    badgeColorHex: '#DC2626',
    priceSar: 39,
    priceUsd: 10,
  },
  {
    index: 25,
    id: 'master-25-hunter-gon-friends',
    filePrefix: '25-hunter-gon-friends',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/8da68928-7c29-46f4-9b85-4c2ecaa6345d_d6e47869.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 721, y: 385, width: 318, height: 287 },
    qrMaskRadiusMm: 2.4,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'anime_diecut',
    domainCategory: 'family',
    templateScope: 'specialized',
    titleAr: 'القناص (غون وأصدقاؤه) — ملصق المغامرة',
    titleEn: 'Hunter x Hunter — Gon & Friends',
    subtitleAr: 'تصميم أنمي مغامرات لغون وكيلوا وكورابيكا وليوريو وبطاقة الصيادين وعبارة "رحلة البحث عن الهدف لا تنتهي أبدًا!". (يتطلب التحقق من الحقوق التجارية).',
    subtitleEn: 'Adventure anime sticker showcasing Gon, Killua, Kurapika, Leorio, Hunter license, and World Tree. Commercial IP clearance required.',
    arabicMessage: 'إذا وجدت هذا الغرض يرجى مسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found me, please scan to contact my owner',
    characterQuoteAr: 'رحلة البحث عن الهدف لا تنتهي أبدًا!',
    requiresIpVerification: true,
    unresolvedNotesAr: 'تحتوي الصورة المرجعية على شعار Spacetoon في الزاوية العليا اليسرى إلى جانب شخصيات Hunter x Hunter؛ يجب التحقق من جميع حقوق العلامات والشخصيات قبل أي نشر تجاري.',
    primaryHex: '#14532D',
    secondaryHex: '#22C55E',
    badgeColorHex: '#FACC15',
    priceSar: 39,
    priceUsd: 10,
  },
  {
    index: 26,
    id: 'master-26-zoro-one-piece',
    filePrefix: '26-zoro-one-piece',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/37ad8c02-910c-4aef-9127-245831815d8c_f521e079.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 698, y: 388, width: 323, height: 297 },
    qrMaskRadiusMm: 2.4,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'anime_diecut',
    domainCategory: 'personal',
    templateScope: 'specialized',
    titleAr: 'ون بيس (زورو) — ملصق القراصنة والكنز',
    titleEn: 'One Piece — Zoro Adventure Tag',
    subtitleAr: 'تصميم أنمي بحري لزورو وسفينة القراصنة وقبعة القش وصندوق الكنز وعبارة "لا مستحيل في طريق من يصرّ على هدفه!". (يتطلب التحقق من الحقوق).',
    subtitleEn: 'Pirate adventure anime sticker featuring Zoro, sailing ship, straw hat, and treasure chest. Commercial IP clearance required.',
    arabicMessage: 'إذا وجدت هذا الغرض يرجى مسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found me, please scan to contact my owner',
    characterQuoteAr: 'لا مستحيل في طريق من يصرّ على هدفه!',
    requiresIpVerification: true,
    unresolvedNotesAr: 'شخصيات وشعارات One Piece محمية بحقوق ملكية؛ يتطلب التحقق من الترخيص التجاري قبل البيع.',
    primaryHex: '#064E3B',
    secondaryHex: '#0284C7',
    badgeColorHex: '#EAB308',
    priceSar: 39,
    priceUsd: 10,
  },
  {
    index: 27,
    id: 'master-27-eren-attack-on-titan',
    filePrefix: '27-eren-attack-on-titan',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/c8dc49b8-7325-4282-af42-7ebb21c6140d_a1ccf9a3.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 679, y: 337, width: 314, height: 298 },
    qrMaskRadiusMm: 2.4,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'anime_diecut',
    domainCategory: 'personal',
    templateScope: 'specialized',
    titleAr: 'هجوم العمالقة (إيرين) — ملصق فيلق الاستطلاع',
    titleEn: 'Attack on Titan — Eren Scouts Tag',
    subtitleAr: 'تصميم أنمي ملحمي لإيرين والعملاق الضخم وسور المدينة وعبارة "من أجل الحرية.. نقاتل حتى النهاية!". (يتطلب التحقق من الحقوق التجارية).',
    subtitleEn: 'Epic anime sticker depicting Eren, Scout Regiment, Colossal Titan, and walled city at dusk. Commercial IP clearance required.',
    arabicMessage: 'إذا وجدت هذا الغرض يرجى مسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found me, please scan to contact my owner',
    characterQuoteAr: 'من أجل الحرية.. نقاتل حتى النهاية!',
    requiresIpVerification: true,
    unresolvedNotesAr: 'شخصيات وعناصر Attack on Titan محمية بحقوق ملكية؛ يتطلب التحقق من الحقوق التجارية قبل البيع.',
    primaryHex: '#450A0A',
    secondaryHex: '#166534',
    badgeColorHex: '#DC2626',
    priceSar: 39,
    priceUsd: 10,
  },
  {
    index: 28,
    id: 'master-28-captain-tsubasa',
    filePrefix: '28-captain-tsubasa',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/ca17e518-d1b1-463f-ad3d-65f5884b4173_2f0fc4d5.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 673, y: 340, width: 330, height: 310 },
    qrMaskRadiusMm: 2.4,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'anime_diecut',
    domainCategory: 'family',
    templateScope: 'specialized',
    titleAr: 'كابتن ماجد — ملصق أبطال كرة القدم',
    titleEn: 'Captain Tsubasa — Football Spirit Tag',
    subtitleAr: 'تصميم أنمي رياضي حماسي بقميص الرقم 10 والملعب المضيء وكرة القدم والكأس الذهبي وعبارة "الفريق الحقيقي لا يستسلم أبدًا!". (يتطلب التحقق من الحقوق).',
    subtitleEn: 'Energetic football anime sticker with #10 captain, stadium lights, trophy, and team spirit quote. Commercial IP clearance required.',
    arabicMessage: 'إذا وجدت هذا الغرض يرجى مسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found me, please scan to contact my owner',
    characterQuoteAr: 'الفريق الحقيقي لا يستسلم أبدًا!',
    requiresIpVerification: true,
    unresolvedNotesAr: 'شخصية Captain Tsubasa محمية بحقوق ملكية؛ يتطلب التحقق من الترخيص التجاري قبل البيع.',
    primaryHex: '#1E3A8A',
    secondaryHex: '#2563EB',
    badgeColorHex: '#FACC15',
    priceSar: 39,
    priceUsd: 10,
  },
  {
    index: 29,
    id: 'master-29-tanjiro-demon-slayer',
    filePrefix: '29-tanjiro-demon-slayer',
    origin: 'reference',
    sourceImagePublicUrl: '/assets/aistudio/a82121ae-15c7-489d-afff-da7aaf9ba929_b9d0cdf5.png',
    sourceWidthPx: 1536,
    sourceHeightPx: 1024,
    qrBoxPx: { x: 696, y: 324, width: 342, height: 330 },
    qrMaskRadiusMm: 2.4,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'anime_diecut',
    domainCategory: 'personal',
    templateScope: 'specialized',
    titleAr: 'قاتل الشياطين (تانجيرو) — ملصق الماء والنار',
    titleEn: 'Demon Slayer — Tanjiro Flame & Water',
    subtitleAr: 'تصميم أنمي يجمع تانجيرو وتنين الماء الأزرق وألسنة اللهب وأزهار الساكورا وقناع الثعلب وعبارة "قوة الإرادة تتغلب على كل ظلام!". (يتطلب التحقق من الحقوق).',
    subtitleEn: 'Vibrant anime sticker with Tanjiro, water dragon, fire arcs, cherry blossoms, and kitsune mask. Commercial IP clearance required.',
    arabicMessage: 'إذا وجدت هذا الغرض يرجى مسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found me, please scan to contact my owner',
    characterQuoteAr: 'قوة الإرادة تتغلب على كل ظلام!',
    requiresIpVerification: true,
    unresolvedNotesAr: 'شخصية وعناصر Demon Slayer محمية بحقوق ملكية؛ يتطلب التحقق من الترخيص التجاري قبل البيع.',
    primaryHex: '#064E3B',
    secondaryHex: '#0EA5E9',
    badgeColorHex: '#DC2626',
    priceSar: 39,
    priceUsd: 10,
  },

  // ============================================================================
  // 4 BRAND-NEW ORIGINAL COMMERCIAL TEMPLATES (CREATED FOR FINDIT QR LIBRARY)
  // ============================================================================
  {
    index: 30,
    id: 'master-30-tokyo-sakura-luggage',
    filePrefix: '30-tokyo-sakura-luggage',
    origin: 'new_original',
    sourceImagePublicUrl: '/assets/master-collection/artwork/30-tokyo-sakura.art.jpg',
    sourceWidthPx: 1264,
    sourceHeightPx: 848,
    qrBoxPx: { x: 549, y: 293, width: 247, height: 261 },
    qrMaskRadiusMm: 1.8,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'luggage_tag',
    domainCategory: 'travel',
    templateScope: 'specialized',
    titleAr: 'بطاقة سفر طوكيو والساكورا — جبل فوجي (قالب مبتكر جديد)',
    titleEn: 'Tokyo Sakura Journey Luggage Tag',
    subtitleAr: 'قالب جديد مبتكر يُكمل سلسلة بطاقات العواصم: جبل فوجي وأزهار الساكورا وبوابة التوري والقطار السريع بإطار كحلي مخيط وحلقة ذهبية.',
    subtitleEn: 'Original new travel edition completing the world-city series: Mount Fuji sunrise, sakura blossoms, torii gate, bullet train, and stitched leather rim.',
    arabicMessage: 'لو لقيتني، امسح الرمز للتواصل مع صاحبي',
    englishMessage: 'If you found me, please scan to contact my owner',
    requiresIpVerification: false,
    primaryHex: '#0E2E5C',
    secondaryHex: '#F472B6',
    badgeColorHex: '#EA580C',
    priceSar: 45,
    priceUsd: 12,
    newOverlay: {
      logoVariant: 'navy_orange',
      logoCenterXMm: 48.2,
      logoCenterYMm: 16.3,
      logoScale: 0.40,
      arabicLine1: 'لو لقيتني، امسح الرمز للتواصل مع صاحبي',
      englishLine1: 'If you found me, please scan to contact my owner',
      textCenterXMm: 49.2,
      arabicY1Mm: 44.1,
      englishY1Mm: 46.8,
      arabicColor: '#FFFFFF',
      englishColor: '#FDE68A',
      arabicFontSizeMm: 2.2,
      englishFontSizeMm: 1.45,
      textShadow: true,
    },
  },
  {
    index: 31,
    id: 'master-31-grand-touring-sport',
    filePrefix: '31-grand-touring-sport',
    origin: 'new_original',
    sourceImagePublicUrl: '/assets/master-collection/artwork/31-grand-touring.art.jpg',
    sourceWidthPx: 1264,
    sourceHeightPx: 848,
    qrBoxPx: { x: 511, y: 303, width: 241, height: 241 },
    qrMaskRadiusMm: 1.8,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'wide_hexagon',
    domainCategory: 'personal',
    templateScope: 'specialized',
    titleAr: 'بطاقة السيارة الرياضية الفاخرة — درع الكربون (قالب مبتكر جديد)',
    titleEn: 'Grand Touring Sport Keytag',
    subtitleAr: 'قالب جديد مبتكر لمفاتيح السيارات والخوذات بتصميم درع ألياف الكربون والذهبي المصقول مع سيارة كوبيه قرمزية وعداد سرعة ذهبي.',
    subtitleEn: 'Original new automotive keytag crafted with woven carbon fiber, brushed gold bezel, crimson coupe silhouette, and precision dial.',
    arabicMessage: 'لو لقيت المفتاح ده، امسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found my keys, please scan to contact the owner',
    requiresIpVerification: false,
    primaryHex: '#0A1628',
    secondaryHex: '#B91C1C',
    badgeColorHex: '#D4A138',
    priceSar: 45,
    priceUsd: 12,
    newOverlay: {
      logoVariant: 'white_gold',
      logoCenterXMm: 44.5,
      logoCenterYMm: 15.2,
      logoScale: 0.34,
      arabicLine1: 'لو لقيت المفتاح ده،',
      arabicLine2: 'امسح الرمز للتواصل مع صاحبه',
      englishLine1: 'If you found my keys,',
      englishLine2: 'scan to contact the owner',
      textCenterXMm: 45.0,
      arabicY1Mm: 42.2,
      arabicY2Mm: 44.5,
      englishY1Mm: 46.4,
      englishY2Mm: 47.9,
      arabicColor: '#FFFFFF',
      englishColor: '#F3D27A',
      arabicFontSizeMm: 1.85,
      englishFontSizeMm: 1.1,
      textShadow: true,
    },
  },
  {
    index: 32,
    id: 'master-32-artisan-cafe-studio',
    filePrefix: '32-artisan-cafe-studio',
    origin: 'new_original',
    sourceImagePublicUrl: '/assets/master-collection/artwork/32-artisan-cafe.art.jpg',
    sourceWidthPx: 1264,
    sourceHeightPx: 848,
    qrBoxPx: { x: 475, y: 267, width: 313, height: 313 },
    qrMaskRadiusMm: 2.0,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'scalloped_plaque',
    domainCategory: 'personal',
    templateScope: 'general',
    titleAr: 'استوديو القهوة والدفاتر الفنية — لوحة حرفية (قالب مبتكر جديد)',
    titleEn: 'Artisan Café & Journal Plaque',
    subtitleAr: 'قالب جديد مبتكر للأكواب الحرارية والدفاتر وأجهزة الآيباد بتصميم لوحة كلاسيكية دافئة تضم فنجان لاتيه ودفترًا جلديًا وقلم حبر نحاسي.',
    subtitleEn: 'Original new lifestyle plaque for tumblers, journals, and laptops pairing latte art, roasted beans, stitched leather notebook, and brass pen.',
    arabicMessage: 'لو لقيت هذا الغرض، امسح الرمز للتواصل مع صاحبه',
    englishMessage: 'If you found this item, please scan to contact the owner',
    requiresIpVerification: false,
    primaryHex: '#3E2314',
    secondaryHex: '#FAF3E3',
    badgeColorHex: '#C59034',
    priceSar: 42,
    priceUsd: 11,
    newOverlay: {
      logoVariant: 'espresso_gold',
      logoCenterXMm: 44.6,
      logoCenterYMm: 13.4,
      logoScale: 0.43,
      arabicLine1: 'لو لقيت هذا الغرض،',
      arabicLine2: 'امسح الرمز للتواصل مع صاحبه',
      englishLine1: 'If you found this item,',
      englishLine2: 'scan to contact owner',
      textCenterXMm: 45.0,
      arabicY1Mm: 44.1,
      arabicY2Mm: 46.35,
      englishY1Mm: 50.45,
      englishY2Mm: 51.75,
      arabicColor: '#3B2113',
      englishColor: '#5C3822',
      arabicFontSizeMm: 1.92,
      englishFontSizeMm: 0.98,
      textShadow: false,
    },
  },
  {
    index: 33,
    id: 'master-33-care-safety-shield',
    filePrefix: '33-care-safety-shield',
    origin: 'new_original',
    sourceImagePublicUrl: '/assets/master-collection/artwork/33-care-shield.art.jpg',
    sourceWidthPx: 1264,
    sourceHeightPx: 848,
    qrBoxPx: { x: 508, y: 300, width: 247, height: 247 },
    qrMaskRadiusMm: 1.8,
    widthMm: 90,
    heightMm: 60,
    silhouette: 'shield_crest',
    domainCategory: 'business',
    templateScope: 'specialized',
    titleAr: 'درع العناية والحماية — بطاقة الطوارئ والمقتنيات الهامة (قالب مبتكر جديد)',
    titleEn: 'Care & Safety Shield Tag',
    subtitleAr: 'قالب جديد مبتكر للحقائب الطبية وحقائب العناية الشخصية والمعدات الحساسة بالأخضر الزمردي والذهبي مع درع قلب ونبض وبوصلة حماية.',
    subtitleEn: 'Original new protective care badge for medical kits, wellness essentials, and priority gear in emerald-teal and brushed gold.',
    arabicMessage: 'غرض مهم — امسح الرمز للتواصل فورًا مع صاحبه',
    englishMessage: 'Important item — please scan to contact the owner',
    requiresIpVerification: false,
    primaryHex: '#0B4D42',
    secondaryHex: '#F9F8F3',
    badgeColorHex: '#C99B3B',
    priceSar: 42,
    priceUsd: 11,
    newOverlay: {
      logoVariant: 'teal_gold',
      logoCenterXMm: 44.8,
      logoCenterYMm: 14.6,
      logoScale: 0.40,
      arabicLine1: 'غرض مهم — امسح الرمز',
      arabicLine2: 'للتواصل فورًا مع صاحبه',
      englishLine1: 'Important item — scan',
      englishLine2: 'to contact the owner',
      textCenterXMm: 45.0,
      arabicY1Mm: 42.3,
      arabicY2Mm: 44.8,
      englishY1Mm: 46.9,
      englishY2Mm: 48.6,
      arabicColor: '#0A3E36',
      englishColor: '#13574C',
      arabicFontSizeMm: 1.95,
      englishFontSizeMm: 1.24,
      textShadow: false,
    },
  },
];

export function getMasterSpecById(idOrSlug: string): MasterTemplateSpec | undefined {
  return MASTER_COLLECTION_SPECS.find(
    (s) => s.id === idOrSlug || s.filePrefix === idOrSlug
  );
}

/**
 * Converts source pixel QR box into exact millimeter geometry on the 90 x 60 mm artboard.
 */
export function getMasterQrZoneMm(spec: MasterTemplateSpec): {
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
  innerSquareSize: number;
} {
  const sx = spec.widthMm / spec.sourceWidthPx;
  const sy = spec.heightMm / spec.sourceHeightPx;
  // Slightly expand mask by 0.25mm only if reference image has baked QR pixels near edge,
  // while staying strictly inside the original metallic/colored border!
  const pad = spec.origin === 'reference' ? 0.12 : -0.15;
  const x = spec.qrBoxPx.x * sx - pad;
  const y = spec.qrBoxPx.y * sy - pad;
  const width = spec.qrBoxPx.width * sx + pad * 2;
  const height = spec.qrBoxPx.height * sy + pad * 2;
  const innerSquareSize = Math.min(width, height) * 0.84;
  return {
    x,
    y,
    width,
    height,
    cx: x + width / 2,
    cy: y + height / 2,
    innerSquareSize,
  };
}

/**
 * Official FindIt QR vector logo matching the exact pin + wordmark + orange/gold swoosh from the reference collection.
 */
export function buildMasterOfficialLogoSvg(cfg: MasterNewOverlayConfig): string {
  const palettes: Record<
    MasterNewOverlayConfig['logoVariant'],
    { pinFill: string; pinQr: string; findItFill: string; qrFill: string; swooshFill: string }
  > = {
    navy_orange: {
      pinFill: '#0B2347',
      pinQr: '#FACC15',
      findItFill: '#0B2347',
      qrFill: '#F97316',
      swooshFill: '#F97316',
    },
    white_gold: {
      pinFill: '#E5B44C',
      pinQr: '#0A1628',
      findItFill: '#FFFFFF',
      qrFill: '#E5B44C',
      swooshFill: '#E5B44C',
    },
    espresso_gold: {
      pinFill: '#3E2314',
      pinQr: '#F4C96B',
      findItFill: '#3E2314',
      qrFill: '#C58A28',
      swooshFill: '#C58A28',
    },
    teal_gold: {
      pinFill: '#0A443A',
      pinQr: '#F5CB69',
      findItFill: '#0A443A',
      qrFill: '#C9952E',
      swooshFill: '#C9952E',
    },
  };
  const p = palettes[cfg.logoVariant];
  return `
  <g id="official-findit-qr-logo" direction="ltr" transform="translate(${cfg.logoCenterXMm.toFixed(2)}, ${cfg.logoCenterYMm.toFixed(2)}) scale(${cfg.logoScale})">
    <!-- Teardrop Location Pin with Mini QR Mark -->
    <g transform="translate(-26.5, -6.5)">
      <path d="M 6.2 0 C 2.75 0 0 2.75 0 6.2 C 0 10.2 5.2 14.3 6.2 15.2 C 7.2 14.3 12.4 10.2 12.4 6.2 C 12.4 2.75 9.65 0 6.2 0 Z" fill="${p.pinFill}"/>
      <g transform="translate(2.55, 2.55)" fill="${p.pinQr}">
        <rect x="0" y="0" width="2.6" height="2.6" rx="0.3" fill="none" stroke="${p.pinQr}" stroke-width="0.65"/>
        <rect x="0.85" y="0.85" width="0.9" height="0.9"/>
        <rect x="4.7" y="0" width="2.6" height="2.6" rx="0.3" fill="none" stroke="${p.pinQr}" stroke-width="0.65"/>
        <rect x="5.55" y="0.85" width="0.9" height="0.9"/>
        <rect x="0" y="4.7" width="2.6" height="2.6" rx="0.3" fill="none" stroke="${p.pinQr}" stroke-width="0.65"/>
        <rect x="0.85" y="5.55" width="0.9" height="0.9"/>
        <rect x="3.5" y="3.5" width="1.1" height="1.1"/>
        <rect x="5.2" y="4.2" width="1.1" height="1.1"/>
        <rect x="4.0" y="5.8" width="1.1" height="1.1"/>
        <rect x="6.0" y="6.0" width="1.2" height="1.2"/>
      </g>
    </g>
    <!-- Official FindIt QR Wordmark (strictly LTR, guaranteed kerning gap via tspan) -->
    <text x="-12.0" y="2.8" text-anchor="start" direction="ltr" unicode-bidi="isolate"
      font-family="'Outfit', 'Plus Jakarta Sans', 'DejaVu Sans', 'Arial', sans-serif" font-weight="800" font-size="10.4" letter-spacing="-0.15"><tspan fill="${p.findItFill}">FindIt</tspan><tspan dx="1.9" fill="${p.qrFill}">QR</tspan></text>
    <!-- Signature Curved Swoosh -->
    <path d="M -8.5 6.4 Q 2.5 3.6 15.5 5.8 Q 22.5 7.2 29.0 5.4 Q 20.5 8.8 11.2 7.2 Q -0.5 5.5 -8.5 6.4 Z" fill="${p.swooshFill}"/>
  </g>`;
}

/**
 * Generates crisp ISO-18004 real scannable QR code vector rectangles centered inside a bounding box.
 */
export function buildMasterRealQrSvg(
  payload: string,
  cx: number,
  cy: number,
  sizeMm: number,
  darkColor = '#0A0D14'
): string {
  const matrix = generateQrMatrix(payload, undefined, 'M');
  const count = matrix.length;
  const cell = sizeMm / count;
  const startX = cx - sizeMm / 2;
  const startY = cy - sizeMm / 2;
  const rects: string[] = [];
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        const x = (startX + c * cell).toFixed(3);
        const y = (startY + r * cell).toFixed(3);
        const s = (cell + 0.03).toFixed(3);
        rects.push(`<rect x="${x}" y="${y}" width="${s}" height="${s}"/>`);
      }
    }
  }
  return `<g id="master-real-iso-qr" fill="${darkColor}" shape-rendering="crispEdges">${rects.join('')}</g>`;
}

/**
 * Generates clean single-subpath closed die-cut silhouettes for print CutContour and 3D Studio extrusion.
 */
export function getMasterDieCutPath(spec: MasterTemplateSpec): string {
  const w = spec.widthMm;
  const h = spec.heightMm;
  const cx = w / 2;
  switch (spec.silhouette) {
    case 'luggage_tag':
      return [
        `M 25 2.0`,
        `L ${w - 11} 2.0`,
        `C ${w - 3.5} 2.0, ${w - 1.8} 7.5, ${w - 1.8} 15.0`,
        `L ${w - 1.8} ${h - 15.0}`,
        `C ${w - 1.8} ${h - 7.5}, ${w - 3.5} ${h - 2.0}, ${w - 11} ${h - 2.0}`,
        `L 25 ${h - 2.0}`,
        `C 18 ${h - 2.0}, 11 ${h - 8.5}, 5.5 ${h * 0.62}`,
        `C 2.2 ${h * 0.56}, 2.2 ${h * 0.44}, 5.5 ${h * 0.38}`,
        `C 11 8.5, 18 2.0, 25 2.0`,
        `Z`,
      ].join(' ');
    case 'wide_hexagon':
      return [
        `M ${cx} 1.8`,
        `L ${w - 12} 14.5`,
        `C ${w - 5.5} 18.0, ${w - 2.2} 24.0, ${w - 2.2} 30.0`,
        `C ${w - 2.2} 36.0, ${w - 5.5} 42.0, ${w - 12} 45.5`,
        `L ${cx} ${h - 1.8}`,
        `L 12 45.5`,
        `C 5.5 42.0, 2.2 36.0, 2.2 30.0`,
        `C 2.2 24.0, 5.5 18.0, 12 14.5`,
        `Z`,
      ].join(' ');
    case 'scalloped_plaque':
    case 'shield_crest':
      return [
        `M 25 2.2`,
        `L ${w - 25} 2.2`,
        `C ${w - 19} 8.5, ${w - 12} 10.5, ${w - 5.5} 16.5`,
        `C ${w - 1.8} 22.5, ${w - 1.8} 37.5, ${w - 5.5} 43.5`,
        `C ${w - 12} 49.5, ${w - 19} 51.5, ${w - 25} ${h - 2.2}`,
        `L 25 ${h - 2.2}`,
        `C 19 51.5, 12 49.5, 5.5 43.5`,
        `C 1.8 37.5, 1.8 22.5, 5.5 16.5`,
        `C 12 10.5, 19 8.5, 25 2.2`,
        `Z`,
      ].join(' ');
    case 'dog_bone':
      return [
        `M 28 7.5`,
        `C 37 5.2, 53 5.2, 62 7.5`,
        `C 70 1.8, 84 3.5, 86.5 15.5`,
        `C 88.2 22.8, 84.5 27.5, 80.5 30.0`,
        `C 84.5 32.5, 88.2 37.2, 86.5 44.5`,
        `C 84 56.5, 70 58.2, 62 52.5`,
        `C 53 54.8, 37 54.8, 28 52.5`,
        `C 20 58.2, 6 56.5, 3.5 44.5`,
        `C 1.8 37.2, 5.5 32.5, 9.5 30.0`,
        `C 5.5 27.5, 1.8 22.8, 3.5 15.5`,
        `C 6 3.5, 20 1.8, 28 7.5`,
        `Z`,
      ].join(' ');
    case 'cat_head':
      return [
        `M 22 2.5`,
        `C 28 2.5, 33 6.2, 36 8.5`,
        `C 41 6.5, 49 6.5, 54 8.5`,
        `C 57 6.2, 62 2.5, 68 2.5`,
        `C 74 2.5, 76 11.0, 74 16.5`,
        `C 83 22.5, 86 35.0, 81 46.5`,
        `C 75 56.5, 60 58.2, 45 58.2`,
        `C 30 58.2, 15 56.5, 9 46.5`,
        `C 4 35.0, 7 22.5, 16 16.5`,
        `C 14 11.0, 16 2.5, 22 2.5`,
        `Z`,
      ].join(' ');
    case 'squircle':
      return [
        `M 28 2.2`,
        `L 62 2.2`,
        `C 72 2.2, 74 7.5, 74 16.0`,
        `L 74 44.0`,
        `C 74 52.5, 72 57.8, 62 57.8`,
        `L 28 57.8`,
        `C 18 57.8, 16 52.5, 16 44.0`,
        `L 16 16.0`,
        `C 16 7.5, 18 2.2, 28 2.2`,
        `Z`,
      ].join(' ');
    case 'fluffy_cloud':
      return [
        `M 45 2.0`,
        `C 55 1.8, 64 4.8, 69 10.5`,
        `C 79 11.5, 86 19.5, 86.5 30.0`,
        `C 86.8 41.5, 79 51.0, 68 53.5`,
        `C 61 57.8, 52 58.5, 45 56.5`,
        `C 38 58.5, 29 57.8, 22 53.5`,
        `C 11 51.0, 3.2 41.5, 3.5 30.0`,
        `C 4 19.5, 11 11.5, 21 10.5`,
        `C 26 4.8, 35 1.8, 45 2.0`,
        `Z`,
      ].join(' ');
    case 'star_five':
      return [
        `M 45 1.8`,
        `C 51 1.8, 55 11.5, 61 15.5`,
        `L 79 18.5`,
        `C 85 19.5, 86 25.5, 81 30.5`,
        `L 73 39.5`,
        `L 78 52.5`,
        `C 79.5 56.5, 74 58.8, 68 57.2`,
        `L 45 54.0`,
        `L 22 57.2`,
        `C 16 58.8, 10.5 56.5, 12 52.5`,
        `L 17 39.5`,
        `L 9 30.5`,
        `C 4 25.5, 5 19.5, 11 18.5`,
        `L 29 15.5`,
        `C 35 11.5, 39 1.8, 45 1.8`,
        `Z`,
      ].join(' ');
    case 'butterfly':
      return [
        `M 45 6.0`,
        `C 56 2.0, 74 1.5, 84 11.5`,
        `C 88.5 19.5, 87 30.0, 80 35.5`,
        `C 84 44.5, 77 56.5, 65 57.5`,
        `C 56 58.0, 50 53.0, 45 56.5`,
        `C 40 53.0, 34 58.0, 25 57.5`,
        `C 13 56.5, 6 44.5, 10 35.5`,
        `C 3 30.0, 1.5 19.5, 6 11.5`,
        `C 16 1.5, 34 2.0, 45 6.0`,
        `Z`,
      ].join(' ');
    case 'gamepad':
    case 'dslr_camera':
    case 'laptop_tag':
    case 'anime_diecut':
    case 'rounded_rect':
    default:
      return [
        `M 10 2.0`,
        `L ${w - 10} 2.0`,
        `C ${w - 3.5} 2.0, ${w - 2.0} 4.5, ${w - 2.0} 10.0`,
        `L ${w - 2.0} ${h - 10.0}`,
        `C ${w - 2.0} ${h - 4.5}, ${w - 3.5} ${h - 2.0}, ${w - 10} ${h - 2.0}`,
        `L 10 ${h - 2.0}`,
        `C 3.5 ${h - 2.0}, 2.0 ${h - 4.5}, 2.0 ${h - 10.0}`,
        `L 2.0 10.0`,
        `C 2.0 4.5, 3.5 2.0, 10 2.0`,
        `Z`,
      ].join(' ');
  }
}

export function getMasterDieCutPolygonMm(
  spec: MasterTemplateSpec
): Array<{ x: number; y: number }> {
  const d = getMasterDieCutPath(spec);
  const hw = spec.widthMm / 2;
  const hh = spec.heightMm / 2;
  const toCentered = (xMm: number, yMm: number) => ({ x: xMm - hw, y: hh - yMm });
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
      if ([x1, y1, x2, y2, x, y].every(Number.isFinite)) {
        const steps = 8;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const u = 1 - t;
          const px = u * u * u * curX + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x;
          const py = u * u * u * curY + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y;
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
  return pts;
}

function buildNewTemplateTypographySvg(cfg: MasterNewOverlayConfig): string {
  const arFilter = cfg.textShadow ? ' filter="url(#master-txt-shadow)"' : '';
  const arFont = `'Cairo', 'Noto Sans Arabic', 'Noto Kufi Arabic', 'Tajawal', sans-serif`;
  const ar2 = cfg.arabicLine2
    ? `<text x="${cfg.textCenterXMm.toFixed(2)}" y="${(cfg.arabicY2Mm ?? cfg.arabicY1Mm + 3.0).toFixed(2)}" text-anchor="middle" direction="rtl" unicode-bidi="embed" font-family="${arFont}" font-weight="800" font-size="${cfg.arabicFontSizeMm}" fill="${cfg.arabicColor}"${arFilter}>${escapeXml(cfg.arabicLine2)}</text>`
    : '';
  const en2 = cfg.englishLine2
    ? `<text x="${cfg.textCenterXMm.toFixed(2)}" y="${(cfg.englishY2Mm ?? cfg.englishY1Mm + 2.2).toFixed(2)}" text-anchor="middle" direction="ltr" unicode-bidi="isolate" font-family="'Plus Jakarta Sans', 'Outfit', 'Arial', sans-serif" font-weight="600" font-size="${cfg.englishFontSizeMm}" fill="${cfg.englishColor}"${arFilter}>${escapeXml(cfg.englishLine2)}</text>`
    : '';

  return `
  <g id="layer-arabic-text">
    <text x="${cfg.textCenterXMm.toFixed(2)}" y="${cfg.arabicY1Mm.toFixed(2)}" text-anchor="middle" direction="rtl" unicode-bidi="embed" font-family="${arFont}" font-weight="800" font-size="${cfg.arabicFontSizeMm}" fill="${cfg.arabicColor}"${arFilter}>${escapeXml(cfg.arabicLine1)}</text>
    ${ar2}
  </g>
  <g id="layer-english-text">
    <text x="${cfg.textCenterXMm.toFixed(2)}" y="${cfg.englishY1Mm.toFixed(2)}" text-anchor="middle" direction="ltr" unicode-bidi="isolate" font-family="'Plus Jakarta Sans', 'Outfit', 'Arial', sans-serif" font-weight="600" font-size="${cfg.englishFontSizeMm}" fill="${cfg.englishColor}"${arFilter}>${escapeXml(cfg.englishLine1)}</text>
    ${en2}
  </g>`;
}

/**
 * Shared inner layered artwork composition (90 x 60 mm artboard).
 * - For Editable & Print-Ready files: includeSampleQr = false -> completely blank pure #FFFFFF QR zone ready for dynamic QR insertion.
 * - For Customer Product Previews or customized user exports: includeSampleQr = true -> crisp real ISO-18004 FindIt QR vector code inside the exact white QR frame.
 */
function buildMasterInnerLayers(
  spec: MasterTemplateSpec,
  embeddedArtworkUri?: string,
  options?: { includeRealQr?: boolean; qrPayload?: string }
): string {
  const w = spec.widthMm;
  const h = spec.heightMm;
  const qr = getMasterQrZoneMm(spec);
  const href = embeddedArtworkUri || spec.sourceImagePublicUrl;
  const cutPath = getMasterDieCutPath(spec);

  const realQrSvg = options?.includeRealQr
    ? buildMasterRealQrSvg(
        options.qrPayload || `https://finditqr.app/r/FQR-M${String(spec.index).padStart(2, '0')}-2026`,
        qr.cx,
        qr.cy,
        qr.innerSquareSize
      )
    : '';

  const logoLayer = spec.newOverlay
    ? `<g id="layer-brand-logo">${buildMasterOfficialLogoSvg(spec.newOverlay)}</g>`
    : `<g id="layer-brand-logo" data-logo-source="preserved-in-reference-artwork"></g>`;

  const textLayer = spec.newOverlay
    ? `<g id="layer-typography">${buildNewTemplateTypographySvg(spec.newOverlay)}</g>`
    : `<g id="layer-typography" data-arabic-copy="${escapeXml(spec.arabicMessage)}" data-english-copy="${escapeXml(spec.englishMessage)}"${spec.characterQuoteAr ? ` data-character-quote-ar="${escapeXml(spec.characterQuoteAr)}"` : ''}></g>`;

  return `
  <g id="layer-master-artwork">
    <image href="${href}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
  </g>
  ${logoLayer}
  ${textLayer}
  <g id="layer-qr-placeholder">
    <rect id="qr-dynamic-placement-area"
      x="${qr.x.toFixed(3)}" y="${qr.y.toFixed(3)}"
      width="${qr.width.toFixed(3)}" height="${qr.height.toFixed(3)}"
      rx="${spec.qrMaskRadiusMm}" ry="${spec.qrMaskRadiusMm}"
      fill="#FFFFFF"
      data-quiet-zone-mm="3"
      data-qr-mode="${options?.includeRealQr ? 'live-iso-18004' : 'blank-dynamic-placeholder'}"/>
    ${realQrSvg}
  </g>
  <g id="layer-die-cut-path">
    <path d="${cutPath}" fill="none" stroke="none"/>
  </g>`;
}

/**
 * 1. Editable Source SVG (90 x 60 mm, flat layered vector with clean blank white dynamic QR placeholder).
 */
export function buildMasterEditableSvg(
  spec: MasterTemplateSpec,
  embeddedArtworkUri?: string
): string {
  const w = spec.widthMm;
  const h = spec.heightMm;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
  width="${w}mm" height="${h}mm"
  viewBox="0 0 ${w} ${h}"
  data-template-id="${spec.id}"
  data-collection="master-collection"
  data-origin="${spec.origin}"
  data-asset-type="editable-source"
  data-ip-verification-required="${spec.requiresIpVerification ? 'true' : 'false'}">
  <defs>
    <filter id="master-txt-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="0.25" stdDeviation="0.35" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  ${buildMasterInnerLayers(spec, embeddedArtworkUri, { includeRealQr: false })}
</svg>`;
}

/**
 * 2. Print-Ready 300 DPI Pre-Press SVG (90 x 60 mm trim + 3 mm bleed = 96 x 66 mm sheet,
 *    corner crop marks, cyan bleed box, emerald safe margin, magenta #EC008C CutContour, blank white QR zone).
 */
export function buildMasterPrintReadySvg(
  spec: MasterTemplateSpec,
  embeddedArtworkUri?: string,
  options?: { includeRealQr?: boolean; qrPayload?: string; showGuides?: boolean }
): string {
  const trimW = spec.widthMm;
  const trimH = spec.heightMm;
  const bleed = 3;
  const safe = 3;
  const margin = 8;
  const sheetW = trimW + (bleed + margin) * 2;
  const sheetH = trimH + (bleed + margin) * 2;
  const ox = bleed + margin;
  const oy = bleed + margin;
  const cutPath = getMasterDieCutPath(spec);
  const showGuides = options?.showGuides !== false;

  const guidesSvg = showGuides
    ? `
  <g id="layer-print-guides" fill="none">
    <!-- +3mm Bleed Box -->
    <rect id="guide-bleed-box" x="${(ox - bleed).toFixed(2)}" y="${(oy - bleed).toFixed(2)}"
      width="${(trimW + bleed * 2).toFixed(2)}" height="${(trimH + bleed * 2).toFixed(2)}"
      stroke="#06B6D4" stroke-width="0.25" stroke-dasharray="1.6 1.2"/>
    <!-- -3mm Safe Margin -->
    <rect id="guide-safe-margin" x="${(ox + safe).toFixed(2)}" y="${(oy + safe).toFixed(2)}"
      width="${(trimW - safe * 2).toFixed(2)}" height="${(trimH - safe * 2).toFixed(2)}"
      stroke="#10B981" stroke-width="0.22" stroke-dasharray="1.4 1.1"/>
    <!-- Single Closed Die-Cut CutContour (#EC008C Spot Magenta) -->
    <path id="die-cut-contour-path" transform="translate(${ox}, ${oy})"
      d="${cutPath}" fill="none" stroke="#EC008C" stroke-width="0.32"/>
    <!-- Corner Crop Marks -->
    <g id="guide-crop-marks" stroke="#0F172A" stroke-width="0.25">
      <line x1="${ox}" y1="${oy - 6}" x2="${ox}" y2="${oy - 2.5}"/>
      <line x1="${ox - 6}" y1="${oy}" x2="${ox - 2.5}" y2="${oy}"/>
      <line x1="${ox + trimW}" y1="${oy - 6}" x2="${ox + trimW}" y2="${oy - 2.5}"/>
      <line x1="${ox + trimW + 2.5}" y1="${oy}" x2="${ox + trimW + 6}" y2="${oy}"/>
      <line x1="${ox}" y1="${oy + trimH + 2.5}" x2="${ox}" y2="${oy + trimH + 6}"/>
      <line x1="${ox - 6}" y1="${oy + trimH}" x2="${ox - 2.5}" y2="${oy + trimH}"/>
      <line x1="${ox + trimW}" y1="${oy + trimH + 2.5}" x2="${ox + trimW}" y2="${oy + trimH + 6}"/>
      <line x1="${ox + trimW + 2.5}" y1="${oy + trimH}" x2="${ox + trimW + 6}" y2="${oy + trimH}"/>
    </g>
    <text x="${(sheetW / 2).toFixed(2)}" y="${(sheetH - 2.6).toFixed(2)}" text-anchor="middle"
      font-family="monospace" font-size="2.0" fill="#475569">
      TRIM: ${trimW}x${trimH}mm | BLEED +${bleed}mm | SAFE -${safe}mm | CUTCONTOUR | 300 DPI | DYNAMIC QR READY
    </text>
  </g>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
  width="${sheetW}mm" height="${sheetH}mm"
  viewBox="0 0 ${sheetW} ${sheetH}"
  data-template-id="${spec.id}"
  data-collection="master-collection"
  data-asset-type="print-ready"
  data-dpi="300"
  data-bleed-mm="${bleed}"
  data-safe-margin-mm="${safe}">
  <defs>
    <filter id="master-txt-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="0.25" stdDeviation="0.35" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect x="0" y="0" width="${sheetW}" height="${sheetH}" fill="#FFFFFF"/>
  <g transform="translate(${ox}, ${oy})">
    ${buildMasterInnerLayers(spec, embeddedArtworkUri, {
      includeRealQr: Boolean(options?.includeRealQr),
      qrPayload: options?.qrPayload,
    })}
  </g>
  ${guidesSvg}
</svg>`;
}

/**
 * 3. Clean Flat Sticker Trim SVG (used for 300 DPI Print PNGs with blank QR, or 3D Studio / Customer Preview with crisp real ISO-18004 QR).
 */
export function buildMasterCleanStickerSvg(
  spec: MasterTemplateSpec,
  embeddedArtworkUri?: string,
  options?: { includeRealQr?: boolean; qrPayload?: string }
): string {
  const w = spec.widthMm;
  const h = spec.heightMm;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
  width="${w}mm" height="${h}mm"
  viewBox="0 0 ${w} ${h}"
  data-template-id="${spec.id}"
  data-collection="master-collection"
  data-asset-type="${options?.includeRealQr ? 'studio-preview-artwork' : 'print-clean-trim'}">
  <defs>
    <filter id="master-txt-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="0.25" stdDeviation="0.35" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  ${buildMasterInnerLayers(spec, embeddedArtworkUri, options)}
</svg>`;
}
