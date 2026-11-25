import atelierCardLifestyleImg from '../assets/images/atelier_crest_card_lifestyle_1794962637336.jpg';
import atelierHeroLuggageImg from '../assets/images/atelier_crest_hero_luggage_1794962654575.jpg';
import atelierMacroDetailImg from '../assets/images/atelier_crest_macro_detail_1794962637281.jpg';
import { MASTER_COLLECTION_SPECS } from '../utils/masterCollectionProduction';
import {
  getShowcaseGalleryUrlsForSlug,
  LIBRARY_SHOWCASE_REGISTRY,
  type RealProductSceneKey,
  type LifestyleSceneKey,
} from './libraryShowcaseRegistry';
import { BATCH_01_NEW_TEMPLATES } from './batch01Designs';
import { BATCH_02_NEW_TEMPLATES } from './batch02Designs';
import { BATCH_02_STICKER_TEMPLATES_8 } from './batch02StickerTemplates8';
import { MASTER_COLLECTION_TEMPLATES_33 } from './masterCollectionTemplates33';
import { PEBBLE_POP_TEMPLATE } from './pebblePopDesign';
import { PILOT_FIVE_TAG_DESIGNS } from './pilotDesigns5';

export interface TemplateLifestyleSlide {
  id: string;
  imageUrl: string;
  captionAr: string;
  captionEn: string;
  objectTypeAr: string;
  objectTypeEn: string;
  altAr: string;
  altEn: string;
}

export interface TemplateShowcaseMedia {
  hasLifestylePhotography: boolean;
  cardLifestyleUrl?: string;
  cardLifestyleAltAr?: string;
  cardLifestyleAltEn?: string;
  lifestyleSlides: TemplateLifestyleSlide[];
  macroDetailUrl?: string;
  macroDetailAltAr?: string;
  macroDetailAltEn?: string;
  missingAssetNoteAr?: string;
  missingAssetNoteEn?: string;
  designStoryAr: string;
  designStoryEn: string;
  finishNotesAr: string;
  finishNotesEn: string;
  whatsIncludedAr: string[];
  whatsIncludedEn: string[];
}

export const PILOT_SHOWCASE_MEDIA: Record<string, TemplateShowcaseMedia> = {
  'pilot-atelier-personal': {
    hasLifestylePhotography: true,
    cardLifestyleUrl: atelierCardLifestyleImg,
    cardLifestyleAltAr: 'ملصق Atelier Crest المطبوع مطبقاً على حافظة سفر جلدية فاخرة فوق طاولة حجر ترافرتين',
    cardLifestyleAltEn: 'Atelier Crest printable QR sticker applied to a pebble-grain leather travel folio on travertine stone',
    lifestyleSlides: [
      {
        id: 'luggage-anodized',
        imageUrl: atelierHeroLuggageImg,
        captionAr: 'ملصق Atelier Crest على حقيبة سفر معدنية داكنة مع حزام جلد طبيعي',
        captionEn: 'Applied on an anodized matte-black cabin suitcase beside stitched saddle leather',
        objectTypeAr: 'حقيبة مقصورة معدنية وجلد طبيعي',
        objectTypeEn: 'Anodized Cabin Luggage & Saddle Strap',
        altAr: 'معاينة واقعية لملصق Atelier Crest مطبق على حقيبة سفر سوداء غير لامعة',
        altEn: 'Atelier Crest flat printable decal adhered cleanly to a matte-black ribbed carry-on suitcase',
      },
      {
        id: 'leather-folio',
        imageUrl: atelierCardLifestyleImg,
        captionAr: 'ملصق Atelier Crest على دفتر وحافظة جلدية بنقشة الحبيبات الدقيقة',
        captionEn: 'Applied on an espresso pebble-grain leather travel journal with fountain pen',
        objectTypeAr: 'حافظة ودفتر جلد يومي',
        objectTypeEn: 'Espresso Leather Travel Journal',
        altAr: 'ملصق Atelier Crest مطبق على زاوية دفتر جلد طبيعي داكن على سطح حجري دافئ',
        altEn: 'Atelier Crest matte obsidian and gold QR label applied on a dark espresso leather notebook',
      },
    ],
    macroDetailUrl: atelierMacroDetailImg,
    macroDetailAltAr: 'لقطة ماكرو قريبة تبرز ملمس الفينيل المطفي والحدود الذهبية ووضوح منطقة رمز QR',
    macroDetailAltEn: 'Macro detail showing soft-touch matte laminate texture, mitered gold lines, and high-contrast QR zone',
    designStoryAr:
      'صُمم قالب Atelier Crest ليمنح المتعلقات الشخصية الراقية — من حقائب المقصورة والحافظات الجلدية إلى دفاتر العمل وأغلفة الأجهزة — هوية استرجاع هادئة تشبه أختام الأتيليه الكلاسيكية. يجمع القالب بين عمق الأوبسيديان الداكن ولمعان الحبر الذهبي الشمباني في تصميم ملصق مسطح قابل للطباعة يحافظ على منطقة مسح عاجية عالية الوضوح مع بصمة FindIt QR مدمجة بأناقة خارج نطاق الكود.',
    designStoryEn:
      'Atelier Crest brings the quiet poise of private leathercraft and bespoke stationery seals into a modern digital QR recovery label. Pairing deep obsidian slate with restrained champagne-gold mitered geometry, it frames a warm alabaster scan stage with generous quiet zone clearance and an understated FindIt QR signature engraved outside the matrix.',
    finishNotesAr:
      'أفضل نتيجة طباعة على فينيل مطفي ناعم الملمس (Soft-Touch Matte Laminate) بسماكة 90 ميكرون لامتصاص انعكاسات الإضاءة المباشرة أثناء المسح بالكاميرا، مع قابلية الطباعة على الفينيل الشفاف مدعومًا بأساس أبيض تحت الكود.',
    finishNotesEn:
      'Engineered for 90-micron Soft-Touch Matte laminated vinyl to eliminate glare under overhead lighting and sharpen dark-on-ivory contrast. Also compatible with clear vinyl stocks backed by a white QR underbase.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (SVG بطبقات منظمة: الخلفية، الإطار، الشعار، النصوص، QR، وخط القص)',
      'ملف الطباعة النهائي (Print-Ready SVG 300 DPI) مع Bleed +3mm، منطقة الأمان -3mm، وخط CutContour الوردي',
      'صورة طباعة عالية الكثافة (300 DPI PNG) مضبوطة على المقاس المليمتري الفعلي 64 × 42 مم',
      'أداة تخصيص فورية متزامنة 1:1 مع المعاينة ثلاثية الأبعاد قبل التنزيل أو الطباعة',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg with named layers: Background, Artwork, Typography, QR Code, Cutline)',
      'Pre-Press Print-Ready File (.svg) calibrated with +3mm Bleed, -3mm Safe Margin, crop marks, and magenta CutContour',
      'High-Resolution 300 DPI Print Raster (.png) scaled accurately to 64 × 42 mm trim dimensions',
      '1:1 Live Customization Studio syncing callout text, serial code, colorway, and substrate finish across 3D and Print',
    ],
  },
  'pilot-voyager-travel': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'فتحة الصور الواقعية جاهزة — لم تُرفق بعد صور فوتوغرافية لحقائب السفر لهذا القالب؛ تُعرض حاليًا معاينة استوديو 3D وملف الطباعة الفعلي فقط.',
    missingAssetNoteEn:
      'Photography slot ready — bespoke luggage photography is not yet attached for this template; 3D Studio mockup and Print-Ready sheet are live.',
    designStoryAr:
      'تصميم مستوحى من ملصقات الشحن الجوي الكلاسيكية وبطاقات الصعود للطائرات مع حواف جانبية مثقوبة ولمسة طابع البريد الجوي، مخصص لحقائب السفر، صناديق المعدات، وحافظات جوازات السفر.',
    designStoryEn:
      'Inspired by mid-century aviation dispatch tags and priority boarding passes, combining perforated ticket-notch die-cuts with high-contrast cobalt and vermilion inks.',
    finishNotesAr:
      'يناسب الفينيل المقاوم للماء والخدوش أو البوليستر اللاصق للأسطح الصلبة ومنظمات السفر.',
    finishNotesEn:
      'Ideal on waterproof satin travel vinyl or scuff-resistant laminate engineered for hardshell luggage.',
    whatsIncludedAr: [
      'ملف SVG قابل للتعديل كامل الطبقات',
      'ملف طباعة 300 DPI SVG + PNG بمقاس 92 × 56 مم',
      'معاينة 3D متزامنة 1:1 مع التخصيص',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg)',
      'Print-Ready 300 DPI SVG + PNG at 92 × 56 mm',
      'Synchronized 3D Studio Mockup',
    ],
  },
  'pilot-kids-safetag': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'فتحة الصور الواقعية جاهزة — لم تُرفق بعد صور حقائب الأطفال والعبوات المدرسية لهذا القالب؛ تُعرض حاليًا معاينة استوديو 3D وملف الطباعة الفعلي.',
    missingAssetNoteEn:
      'Photography slot ready — school bag and bottle lifestyle photos are pending; live 3D Studio mockup and Print-Ready sheet are active.',
    designStoryAr:
      'ملصق ودود ومبهج بقصة غيمة مرسومة وشمس مبتسمة تمنح أطفال المدارس وأدواتهم ملصق استرجاع يسهل تمييزه فورًا.',
    designStoryEn:
      'Friendly sculpted cloud die-cut with an illustrated sun crest crafted for school backpacks, lunchboxes, and reusable water bottles.',
    finishNotesAr:
      'موصى به على الفينيل اللامع القابل للغسل والمقاوم لغسالة الأطباق (Washable UV Gloss).',
    finishNotesEn:
      'Recommended on washable UV gloss laminate vinyl suited for daily bottle rinsing.',
    whatsIncludedAr: [
      'ملف SVG قابل للتعديل كامل الطبقات',
      'ملف طباعة 300 DPI SVG + PNG بمقاس 60 × 60 مم',
      'معاينة 3D متزامنة 1:1 مع التخصيص',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg)',
      'Print-Ready 300 DPI SVG + PNG at 60 × 60 mm',
      'Synchronized 3D Studio Mockup',
    ],
  },
  'pilot-pet-guardian': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'فتحة الصور الواقعية جاهزة — لم تُرفق بعد صور فوتوغرافية لحافظات وأطواق الحيوانات الأليفة؛ تُعرض معاينة 3D وملف الطباعة الفعلي.',
    missingAssetNoteEn:
      'Photography slot ready — pet carrier and collar-pack photography not yet added; live 3D Studio mockup and Print-Ready file active.',
    designStoryAr:
      'ملصق درعي دافئ بحواف درعية مرنة مخصص لحافظات نقل الحيوانات الأليفة وعلب الطعام ومحافظ بطاقات الطوارئ البيطرية.',
    designStoryEn:
      'Protective botanical pine and warm sand shield die-cut engineered for pet travel carriers, treat canisters, and medical folders.',
    finishNotesAr:
      'موصى به على الفينيل الخارجي عالي التحمل والمقاوم للرطوبة والأشعة فوق البنفسجية.',
    finishNotesEn:
      'Recommended on heavy-duty weatherproof matte outdoor vinyl.',
    whatsIncludedAr: [
      'ملف SVG قابل للتعديل كامل الطبقات',
      'ملف طباعة 300 DPI SVG + PNG بمقاس 54 × 58 مم',
      'معاينة 3D متزامنة 1:1 مع التخصيص',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg)',
      'Print-Ready 300 DPI SVG + PNG at 54 × 58 mm',
      'Synchronized 3D Studio Mockup',
    ],
  },
  'pilot-business-asset': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'فتحة الصور الواقعية جاهزة — لم تُرفق بعد صور أصول الشركات وأجهزة العمل؛ تُعرض معاينة 3D وملف الطباعة الصناعي الفعلي.',
    missingAssetNoteEn:
      'Photography slot ready — enterprise workstation photography not yet supplied; 3D Studio mockup and industrial Pre-Press file are live.',
    designStoryAr:
      'ملصق أصول مؤسسي بشطفة زاوية هندسية وشبكة دقيقة مصمم لإدارة أجهزة اللابتوب والكاميرات والمعدات الميدانية.',
    designStoryEn:
      'Precision industrial nameplate graphic with chamfered telemetry corner and micro-grid typography for fleet laptops, cameras, and field tools.',
    finishNotesAr:
      'موصى به على خامات البوليستر الصناعي المصقول (Brushed Polyester) المقاوم للمذيبات والتآكل.',
    finishNotesEn:
      'Engineered for brushed industrial polyester stock with strong solvent and abrasion resistance.',
    whatsIncludedAr: [
      'ملف SVG قابل للتعديل كامل الطبقات',
      'ملف طباعة 300 DPI SVG + PNG بمقاس 84 × 38 مم',
      'معاينة 3D متزامنة 1:1 مع التخصيص',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg)',
      'Print-Ready 300 DPI SVG + PNG at 84 × 38 mm',
      'Synchronized 3D Studio Mockup',
    ],
  },
  'pilot-pebble-pop': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'القالب رقم #2 (Pebble Pop) — يركز على العمل الفني النقي الجاهز للطباعة دون خلفيات تصويرية أو ثقوب؛ يمكنك فحص الطبقات، تخصيص الألوان والنص، وفتح استوديو 3D أو معاينة الطباعة.',
    missingAssetNoteEn:
      'Template #2 (Pebble Pop) — focused strictly on clean printable artwork without hardware or lifestyle scenes; inspect live vector artwork, 3D Studio extrusion, and Print-Ready 300 DPI exports.',
    designStoryAr:
      'تنفيذ دقيق للتصميم المعتمد لملصق Pebble Pop بقصة حصوة عضوية عمودية صافية دون ثقوب أو حلقات، تجمع بين الكريمي الدافئ والأمواج التركوازية والبرتقالية والشمس الصفراء وشعار FindIt QR مع رسالتين واضحتين للتواصل بالإنجليزية والعربية.',
    designStoryEn:
      'Faithful implementation of the approved Pebble Pop vertical pebble design—combining a warm cream base, teal canopy & corner wave, vivid orange accents & confetti dashes, yellow sun, FindIt QR pin mark, crisp white QR container, and bilingual contact copy.',
    finishNotesAr:
      'مثالي على الفينيل المطفي ناعم الملمس (Soft-Touch Matte) أو الفينيل المقاوم للماء لإبراز دفء الدرجات الكريمية وتباين الكود الأسود فوق المربع الأبيض.',
    finishNotesEn:
      'Recommended on 90-micron Soft-Touch Matte laminate or waterproof satin vinyl to keep warm cream, teal, and orange vibrant while ensuring high-contrast ISO QR scanning.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (SVG بطبقات منظمة: الخلفية، الأشكال التركوازية، اللمسات البرتقالية والشمس، الشعار، حاوية QR، كود QR، النصوص، وخط القص)',
      'ملف الطباعة النهائي (Print-Ready SVG 300 DPI) بمقاس 58 × 68 مم مع Bleed +3mm، منطقة أمان -3mm، وخط CutContour عضوي',
      'ملف PNG عالي الدقة (300 DPI) مستخرج مباشرةً من العمل الفني النظيف وكود QR الحقيقي دون خلفيات تصويرية',
      'تكامل كامل مع التخصيص المباشر (الألوان الثلاثة، النص، ومحتوى QR) واستوديو 3D المطابق للشكل',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg with separated Background, Teal Shapes, Orange Accents & Yellow Sun, Brand Logo, QR Stage, Real QR, Bilingual Copy, and Cutline)',
      'Pre-Press Print-Ready File (.svg) calibrated at 58 × 68 mm with +3mm Bleed, -3mm Safe Margin, and organic Pebble CutContour',
      'High-Resolution 300 DPI Print PNG exported at true physical dimensions with clean printable background',
      'Live Editor Integration syncing Teal, Cream, Orange Accent, Printed Copy, and dynamic ISO-18004 QR across Previews, 3D Studio, and Exports',
    ],
  },
  'pilot-metro-ticket': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'دفعة 01 (Metro Ticket) — عمل فني نظيف جاهز للطباعة دون ثقوب أو حبال تعليق؛ استعرض المعاينة المتجهية أو استوديو 3D أو ملف الطباعة 300 DPI.',
    missingAssetNoteEn:
      'Batch 01 (Metro Ticket) — clean printable vector artwork free of hardware or holes; inspect Detail View, interactive 3D Studio extrusion, and 300 DPI Print exports.',
    designStoryAr:
      'تذكرة سفر كلاسيكية بقصة مثقوبة الحواف تجمع بين شرائط البريد الجوي الكحلية والحمراء وختم السفر وأفق الأهرامات وبرج القاهرة مع شمس ذهبية، وإطار QR مركزي واضح للطباعة الاحترافية.',
    designStoryEn:
      'Vintage notched travel-ticket recovery label combining navy and red airmail stripes, a flight trail, circular TRAVEL ITEM postmark, Cairo landmark horizon at dusk, and a crisp high-contrast QR stage.',
    finishNotesAr:
      'يناسب الفينيل المطفي المقاوم للماء والخدوش لحقائب المقصورة وجوازات السفر.',
    finishNotesEn:
      'Printed on waterproof matte travel vinyl or soft-touch laminate to handle airport transit while staying glare-free under scanners.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (SVG بطبقات منظمة ومنفصلة)',
      'ملف الطباعة النهائي (Print-Ready SVG 300 DPI) بمقاس 58 × 88 مم مع Bleed +3mm وخط CutContour',
      'صورة طباعة 300 DPI PNG صافية بدون خلفيات تصويرية أو ثقوب',
      'مزامنة التخصيص الحي للألوان والنصوص الإنجليزية والعربية وكود QR الفعلي',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg with organized semantic <g> layers)',
      'Pre-Press Print-Ready SVG at 58 × 88 mm with +3mm Bleed, -3mm Safe Margin, and Notched Ticket CutContour',
      'High-Resolution 300 DPI Print PNG rendered directly from clean printable artwork',
      'Live Editor Sync across Navy/Cream/Red colors, English & Arabic copy, and dynamic ISO-18004 QR',
    ],
  },
  'pilot-jelly-cube': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'دفعة 01 (Jelly Cube) — قالب طباعة مسطح ونظيف تمامًا (بدون ثقب أو رباط تعليق)؛ معاينة التفاصيل واستوديو 3D وملفات 300 DPI متاحة مباشرة.',
    missingAssetNoteEn:
      'Batch 01 (Jelly Cube) — clean standalone printable artwork with cords/holes removed; inspect Detail, 3D Studio, and Print-Ready 300 DPI exports.',
    designStoryAr:
      'تصميم عصري مبهج مستوحى من الجيلي اللامع بألوان البنفسجي والوردي والسيان والأصفر، يضم رموز اللعب والسماعات ونجمة مبتسمة وكبسولات نصية عالية الوضوح، محرّرًا بالكامل كملصق قابل للطباعة بدون ثقوب.',
    designStoryEn:
      'Vibrant glossy jelly-inspired label blending electric violet, pop pink, sky cyan, and sunny yellow highlights with gaming & audio vector motifs, smiling star character, and bilingual callout pills.',
    finishNotesAr:
      'أفضل نتيجة على فينيل لامع مقاوم للأشعة UV Gloss أو ساتان مقاوم للماء لحافظات الأجهزة والزجاجات.',
    finishNotesEn:
      'Recommended on UV Gloss vinyl laminate to amplify vibrant gradient gloss, or waterproof satin vinyl for glare-controlled scanning.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (SVG بطبقات منظمة كاملة)',
      'ملف الطباعة النهائي (Print-Ready SVG 300 DPI) بمقاس 70 × 70 مم مع Bleed +3mm وخط CutContour',
      'ملف 300 DPI PNG نظيف تمامًا بدون خيوط أو حلقات أو خلفيات تصويرية',
      'مزامنة 1:1 مع المحرر (الألوان الثلاثة، النصوص العربية والإنجليزية، ومحتوى QR)',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg with separated artwork, highlights, pill banners, QR, and cutline)',
      'Pre-Press Print-Ready SVG at 70 × 70 mm with +3mm Bleed, -3mm Safe Margin, and Jelly Cushion CutContour',
      'High-Resolution 300 DPI Print PNG free of hardware, cords, holes, or lifestyle backgrounds',
      'Live 1:1 Sync across Primary/Secondary/Accent colors, bilingual text, and real QR records',
    ],
  },
  'pilot-hexa-pulse': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'دفعة 01 (Hexa Pulse) — قالب تقني سداسي جاهز للطباعة الصافية (بدون حلقة معدنية أو مشبك)؛ يمكنك فحصه في استوديو 3D ومعاينة الطباعة 300 DPI.',
    missingAssetNoteEn:
      'Batch 01 (Hexa Pulse) — clean geometric tech artwork free of grommets or carabiners; inspect interactive 3D Studio, Detail view, and 300 DPI Print files.',
    designStoryAr:
      'درع سداسي هندسي للأجهزة الذكية ومعدات العمل يرتكز على خلفية كحلية داكنة وإطار سيان نيوني مع مسارات دوائر إلكترونية وشبكة سداسية وشرائط تحذير صفراء وأيقونات أجهزة وموجة نبض.',
    designStoryEn:
      'Futuristic hexagonal tech nameplate grounded in deep navy, electric cyan rim circuits, honeycomb lattice, yellow caution bars, gadget iconography, and lower pulse wave over an isolated white QR stage.',
    finishNotesAr:
      'موصى به على البوليستر الصناعي المصقول أو الفينيل المطفي الداكن لأجهزة اللابتوب وحقائب الكاميرات.',
    finishNotesEn:
      'Engineered for brushed industrial polyester or anti-glare matte dark vinyl on laptops, camera cases, and tech gear.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (SVG بطبقات هندسية منظمة)',
      'ملف الطباعة النهائي (Print-Ready SVG 300 DPI) بمقاس 70 × 80 مم مع قصة سداسية CutContour',
      'ملف 300 DPI PNG عالي الدقة ونقي تمامًا للطباعة الفورية',
      'تخصيص فوري للألوان التقنية الثلاثة والنص العربي والإنجليزي ورمز QR الفعلي',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg with separated hex base, circuits, icons, tech banners, QR, and cutline)',
      'Pre-Press Print-Ready SVG at 70 × 80 mm with +3mm Bleed, -3mm Safe Margin, and Hexagonal CutContour',
      'High-Resolution 300 DPI Print PNG free of rings, metal grommets, or clips',
      'Live Editor Integration syncing Deep Navy, Cyan, Yellow, bilingual text, and real ISO-18004 QR',
    ],
  },
  'pilot-flora-loop': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'دفعة 01 (Flora Loop) — تصميم نباتي زهري نظيف للطباعة الصافية (بدون ثقب نحاسي أو خيط خيش)؛ متاح للاستعراض في 3D ومعاينة الطباعة 300 DPI.',
    missingAssetNoteEn:
      'Batch 01 (Flora Loop) — standalone botanical printable label with twine/grommets removed; inspect Detail, 3D Studio, and 300 DPI Print assets.',
    designStoryAr:
      'قالب زهري مستوحى من الطبيعة بقصة متموجة متناظرة يجمع بين الكريمي الدافئ والأخضر الغابي وزهور الكركديه الوردية وأوراق المونستيرا والفراشة مع شعار FindIt QR ولافتتين للنصوص العربية والإنجليزية.',
    designStoryEn:
      'Graceful scalloped botanical label combining warm cream stock, forest-green framing, layered pink hibiscus blooms, monstera & sprig foliage, butterfly accent, and clean bilingual banners.',
    finishNotesAr:
      'مثالي على الفينيل المطفي الحريري أو الورق النباتي المقاوم للماء لإبراز رقة التفاصيل الزهرية وتباين كود QR.',
    finishNotesEn:
      'Best printed on Soft-Touch Matte laminate or waterproof botanical vinyl to preserve delicate petal shading and clean QR readability.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (SVG بطبقات نباتية منفصلة ومنظمة)',
      'ملف الطباعة النهائي (Print-Ready SVG 300 DPI) بمقاس 72 × 78 مم مع قصة زهرية CutContour',
      'ملف 300 DPI PNG نظيف للطباعة الاحترافية بدون خيوط أو ثقوب',
      'تحكم مباشر بالألوان الأساسية والنص العربي والإنجليزي وكود QR الحقيقي',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg with separated foliage, blossoms, banners, brand mark, QR, and cutline)',
      'Pre-Press Print-Ready SVG at 72 × 78 mm with +3mm Bleed, -3mm Safe Margin, and Scalloped Floral CutContour',
      'High-Resolution 300 DPI Print PNG free of twine, grommets, or lifestyle staging',
      'Live Editor Integration syncing Forest Green, Cream Base, Blossom Pink, bilingual copy, and dynamic QR',
    ],
  },
  'pilot-mono-mark': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'دفعة 02 (Mono Mark) — عمل فني أحادي نظيف جاهز للطباعة الصافية؛ استعرض المعاينة المتجهية أو استوديو 3D أو ملف الطباعة 300 DPI.',
    missingAssetNoteEn:
      'Batch 02 (Mono Mark) — clean minimalist printable vector artwork; inspect Detail View, 3D Studio extrusion, and 300 DPI Print files.',
    designStoryAr:
      'بطاقة سداسية مستديرة الأركان بطابع معماري أحادي تجمع الكحلي العميق والأبيض الصافي مع أشرطة عنبرية مائلة وأيقونة مسح الهاتف الدقيقة لسهولة القراءة السريعة.',
    designStoryEn:
      'Clean architectural rounded hexagon combining deep ink navy, bright white planes, diagonal amber/navy ribbons, and a minimalist phone-scan icon beside crisp bilingual recovery copy.',
    finishNotesAr:
      'موصى به على الفينيل المطفي الحريري أو البوليستر الصناعي لأجهزة اللابتوب والمحافظ.',
    finishNotesEn:
      'Recommended on soft-touch matte laminated vinyl or brushed polyester for laptops and daily carry.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (SVG بطبقات منظمة)',
      'ملف الطباعة النهائي (Print-Ready SVG 300 DPI) بمقاس 64 × 74 مم مع قصة سداسية CutContour',
      'ملف 300 DPI PNG نظيف تمامًا بدون ثقوب أو سلاسل',
      'مزامنة التخصيص الحي للألوان الثلاثة والنصوص الإنجليزية والعربية وكود QR',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg with semantic layer groups)',
      'Pre-Press Print-Ready SVG at 64 × 74 mm with +3mm Bleed, -3mm Safe Margin, and Rounded Hex CutContour',
      'High-Resolution 300 DPI Print PNG with zero physical hardware',
      'Live Editor Sync across Primary, Background, Amber Accent, bilingual copy, and dynamic QR',
    ],
  },
  'pilot-pocket-orbit': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'دفعة 02 (Pocket Orbit) — ملصق فضائي كوني نظيف للطباعة (بدون ثقب أو رباط)؛ معاينة 3D وملفات الطباعة 300 DPI متاحة مباشرة.',
    missingAssetNoteEn:
      'Batch 02 (Pocket Orbit) — clean standalone cosmic printable artwork; inspect Detail, 3D Studio, and 300 DPI Print files.',
    designStoryAr:
      'قالب فضائي مبهج يتصدره رائد فضاء يلوّح بيده فوق شعار FindIt QR البرتقالي، مع كوكب زحل البنفسجي، وصاروخ منطلق بمدار مضيء، وإطار سيان متوهج.',
    designStoryEn:
      'Starry deep-space die-cut label crowned by a waving astronaut, purple Saturn planet, blasting rocket orbit ring, moon crest, cyan border, and high-contrast bilingual pills.',
    finishNotesAr:
      'أفضل نتيجة على الفينيل اللامع المقاوم للماء أو المطفي المضاد للتوهج.',
    finishNotesEn:
      'Recommended on waterproof UV gloss vinyl or anti-glare matte stock for vibrant space colors.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (SVG بطبقات فضائية منفصلة)',
      'ملف الطباعة النهائي 300 DPI بمقاس 70 × 76 مم مع قصة مدار مخصصة CutContour',
      'ملف 300 DPI PNG صافي للطباعة الفورية',
      'مزامنة كاملة للألوان والنصوص الثنائية اللغة ورابط QR',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg with separated cosmic artwork & QR layers)',
      'Pre-Press Print-Ready SVG at 70 × 76 mm with +3mm Bleed and Cosmic Orbit CutContour',
      'High-Resolution 300 DPI Print PNG ready for die-cut production',
      'Live 1:1 customization across colors, English/Arabic copy, and live QR record',
    ],
  },
  'pilot-astro-buddy': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'دفعة 02 (Astro Buddy) — قالب فضائي ثانٍ مستقل بنسخة طباعة صافية أُزيل منها ثقب التعليق العلوي؛ معاينة 3D وملفات 300 DPI متاحة.',
    missingAssetNoteEn:
      'Batch 02 (Astro Buddy) — independent second space template with top keychain punch-hole cleanly removed from artwork and CutContour.',
    designStoryAr:
      'تم اعتماد Astro Buddy كقالب فضائي مستقل يضم رائد الفضاء الجالس على القمر البنفسجي بإشارة الإعجاب، وكوكب أزرق ذو حلقة ذهبية، وصاروخ برأس أصفر وسديم مضيء، مع إزالة ثقب التعليق العلوي بالكامل.',
    designStoryEn:
      'Registered separately as Astro Buddy featuring the thumbs-up astronaut seated on a cratered purple moon, blue ringed planet, yellow-nose rocket, and colorful bottom nebula clouds—engineered cleanly with no keychain hole.',
    finishNotesAr:
      'مناسب للفينيل اللامع المقاوم للماء أو المطفي ناعم الملمس لحقائب المدرسة والأجهزة.',
    finishNotesEn:
      'Great on washable UV gloss or soft-touch matte vinyl for school backpacks, laptops, and bottles.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي SVG بدون ثقب تعليق علوي (طبقات منظمة كاملة)',
      'ملف الطباعة النهائي 300 DPI بمقاس 70 × 76 مم مع خط قص CutContour صافٍ',
      'ملف 300 DPI PNG للطباعة الاحترافية المباشرة',
      'تخصيص حي للألوان والنصين الإنجليزي والعربي ورمز QR',
    ],
    whatsIncludedEn: [
      'Hole-free Layered Editable Source Vector (.svg)',
      'Pre-Press Print-Ready SVG at 70 × 76 mm with clean Hole-Free CutContour',
      'High-Resolution 300 DPI Print PNG',
      'Synchronized live color, bilingual copy, and ISO-18004 QR customization',
    ],
  },
  'pilot-campus-bloom': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'دفعة 02 (Campus Bloom) — قالب حياة يومية مصوّر وجاهز للطباعة الصافية؛ معاينة 3D وملفات 300 DPI متاحة.',
    missingAssetNoteEn:
      'Batch 02 (Campus Bloom) — standalone illustrated campus & lifestyle printable label; inspect Detail, 3D Studio, and 300 DPI exports.',
    designStoryAr:
      'لوحة يومية مصوّرة بقصة سحابة كريمية دافئة وإطار تركوازي عميق، تحيط بها الحقيبة المدرسية والدفتر الحلزوني والقلم وكوب القهوة والسماعات والأزهار المشرقة.',
    designStoryEn:
      'Scalloped parchment & deep-teal lifestyle badge bringing together a backpack, spiral journal & pen, coffee mug, pastel headphones, and cheerful floral sprigs around a crisp QR zone.',
    finishNotesAr:
      'مثالي على الفينيل المطفي ناعم الملمس أو المقاوم للماء لحقائب الجامعة والأكواب.',
    finishNotesEn:
      'Ideal on soft-touch matte or waterproof tumbler vinyl for laptops, notebooks, and bottles.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (SVG كامل الطبقات)',
      'ملف الطباعة النهائي 300 DPI بمقاس 74 × 80 مم مع قصة غيمة متموجة CutContour',
      'ملف 300 DPI PNG صافي للطباعة الفورية',
      'تخصيص متزامن للألوان والنصوص الإنجليزية والعربية وكود QR',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg)',
      'Pre-Press Print-Ready SVG at 74 × 80 mm with Scalloped Cloud CutContour',
      'High-Resolution 300 DPI Print PNG',
      'Live Editor Sync for colors, bilingual callouts, and dynamic QR',
    ],
  },
  'pilot-game-mode': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'دفعة 02 (Game Mode) — قالب ألعاب نيون بنسخة طباعة صافية أُزيل منها ثقب التعليق العلوي بالكامل؛ استوديو 3D وملفات 300 DPI متاحة.',
    missingAssetNoteEn:
      'Batch 02 (Game Mode) — clean hole-free gaming controller printable label; inspect 3D Studio and 300 DPI Print files.',
    designStoryAr:
      'قصة يد تحكم وسماعات ألعاب نابضة بالنيون الأزرق السماوي والماجنتا مع D-Pad وأزرار △ ○ × □ ووحش البكسل وشعاع البرق؛ نُفّذت بدون ثقب تعليق علوي لطباعة ملصق مثالية.',
    designStoryEn:
      'Contoured neon gamepad & headset crest packed with D-pad, glowing action buttons, pixel invader, and lightning bolts—with the physical keychain hole removed cleanly for sticker printing.',
    finishNotesAr:
      'يُنصح بالطباعة على البوليستر التقني أو الفينيل اللامع لأجهزة الألعاب المحمولة.',
    finishNotesEn:
      'Printed cleanly on matte tech polyester or UV gloss vinyl for handheld consoles and cases.',
    whatsIncludedAr: [
      'ملف SVG قابل للتعديل بدون ثقوب علوية في الرسم أو خط القص',
      'ملف طباعة نهائي 300 DPI بمقاس 76 × 72 مم مع قصة يد تحكم CutContour',
      'ملف 300 DPI PNG للطباعة المباشرة',
      'تخصيص كامل للألوان النيونية والنصوص الثنائية اللغة وQR',
    ],
    whatsIncludedEn: [
      'Hole-free Layered Editable Source Vector (.svg)',
      'Pre-Press Print-Ready SVG at 76 × 72 mm with Controller Die-Cut Contour',
      'High-Resolution 300 DPI Print PNG',
      'Live customization for neon ink channels, bilingual copy, and ISO QR',
    ],
  },
  'pilot-purrfect-tag': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'دفعة 02 (Purrfect Tag) — بطاقة قطط لطيفة بنسخة طباعة صافية أُزيل منها ثقب التعليق العلوي؛ استوديو 3D وملفات 300 DPI متاحة.',
    missingAssetNoteEn:
      'Batch 02 (Purrfect Tag) — clean hole-free cat-head printable label; top keychain hole removed from artwork and die-cut.',
    designStoryAr:
      'تصميم مرح بقصة رأس قطة بأذنين ناعمتين خالٍ تمامًا من ثقوب التعليق؛ يضم قطة بنفسجية غامزة وكرة خيوط وردية ترسم قلبًا وآثار أقدام لطيفة.',
    designStoryEn:
      'Contoured cat-head sticker silhouette with a winking lavender cat, pink yarn-ball heart loop, and playful paw prints—engineered cleanly with the keychain punch-hole removed.',
    finishNotesAr:
      'يناسب الفينيل الخارجي المقاوم للماء لأقفاص تنقل القطط وعلب الطعام والأطواق المغلفة.',
    finishNotesEn:
      'Recommended on waterproof outdoor vinyl for cat carriers, food canisters, and notebooks.',
    whatsIncludedAr: [
      'ملف SVG قابل للتعديل بدون ثقب تعليق علوي (طبقات متكاملة)',
      'ملف طباعة 300 DPI بمقاس 72 × 74 مم بقصة أذني قطة CutContour نظيفة',
      'ملف 300 DPI PNG للطباعة الصافية',
      'تخصيص حي للألوان والنص العربي والإنجليزي وكود QR',
    ],
    whatsIncludedEn: [
      'Hole-free Layered Editable Source Vector (.svg)',
      'Pre-Press Print-Ready SVG at 72 × 74 mm with Clean Cat-Ear CutContour',
      'High-Resolution 300 DPI Print PNG',
      'Synchronized live colorways, bilingual copy, and dynamic QR',
    ],
  },
  'pilot-retro-explorer': {
    hasLifestylePhotography: false,
    lifestyleSlides: [],
    missingAssetNoteAr:
      'دفعة 02 (Retro Explorer) — طابع سفر تراثي متموج نظيف وجاهز للطباعة 300 DPI؛ معاينة 3D متاحة مباشرة.',
    missingAssetNoteEn:
      'Batch 02 (Retro Explorer) — standalone scalloped vintage travel label ready for 300 DPI printing and 3D Studio inspection.',
    designStoryAr:
      'ختم سفر عتيق بقصة متموجة تجمع خريطة العالم على ورق الرق القديم والبوصلة الكلاسيكية والطائرة وحقيبة السفر الجلدية وكاميرا وصورة الأهرامات.',
    designStoryEn:
      '12-lobe scalloped expedition stamp combining vintage parchment world-map graphics, dotted airplane flight path, compass rose, Giza-badged suitcase, and camera polaroid.',
    finishNotesAr:
      'رائع على الفينيل المطفي ناعم الملمس أو فينيل السفر المقاوم للرطوبة.',
    finishNotesEn:
      'Best printed on soft-touch matte vintage vinyl or waterproof luggage laminate.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (SVG كامل الطبقات)',
      'ملف طباعة 300 DPI بمقاس 76 × 78 مم بقصة متموجة CutContour',
      'ملف 300 DPI PNG نظيف للطباعة الفورية',
      'تخصيص حي لألوان الجلد والرق والتيراكوتا والنصوص ورمز QR',
    ],
    whatsIncludedEn: [
      'Layered Editable Source Vector (.svg)',
      'Pre-Press Print-Ready SVG at 76 × 78 mm with Scalloped Explorer CutContour',
      'High-Resolution 300 DPI Print PNG',
      'Live Editor Integration syncing brown/parchment/terracotta tones, EN/AR copy, and QR',
    ],
  },
  'pilot-neon-velocity': {
    hasLifestylePhotography: true,
    cardLifestyleUrl: '/assets/batch02/previews/01-neon-velocity.preview.png',
    cardLifestyleAltAr: 'ملصق Neon Velocity المستقبلي بشعار FindIt QR الرسمي ومساحة QR بيضاء نظيفة',
    cardLifestyleAltEn: 'Neon Velocity cyberpunk automotive sticker preview with official FindIt QR logo and blank 34×34 mm QR zone',
    lifestyleSlides: [
      {
        id: 'neon-velocity-preview',
        imageUrl: '/assets/batch02/previews/01-neon-velocity.preview.png',
        captionAr: 'معاينة استوديو احترافية لملصق Neon Velocity بحواف مقصوصة بدقة وإضاءة ناعمة (1200×900)',
        captionEn: 'Clean studio product preview of Neon Velocity die-cut vinyl sticker (1200×900 · 4:3)',
        objectTypeAr: 'معاينة المنتج النهائي',
        objectTypeEn: 'Studio Product Preview',
        altAr: 'ملصق Neon Velocity بشعار FindIt QR ومساحة QR بيضاء ورسالة لقيت حاجة؟ خلّينا نوصلها لصاحبها..',
        altEn: 'Neon Velocity die-cut sticker studio product preview with blank white QR placeholder',
      },
    ],
    macroDetailUrl: '/assets/batch02/previews/01-neon-velocity.preview.png',
    macroDetailAltAr: 'تفاصيل معاينة المنتج لملصق Neon Velocity وتفاصيل الطباعة الفينيلية',
    macroDetailAltEn: 'Neon Velocity studio product detail inspection',
    designStoryAr:
      'ملصق نيون مستقبلي يجمع سيارة رياضية وأفق مدينة مضيء وسماعات رأس ومسارات ضوئية بالسيان والماجنتا مع شعار FindIt QR الرسمي ومساحة QR بيضاء 34×34 مم ونداء «امسح هنا» ورسالة «لقيت حاجة؟ خلّينا نوصلها لصاحبها..».',
    designStoryEn:
      'Futuristic cyberpunk automotive die-cut sticker featuring a sports car, neon city skyline, glowing headphones, light trails, official FindIt QR logo, 34×34 mm blank white QR zone, and "امسح هنا" CTA.',
    finishNotesAr:
      'مثالي للطباعة على الفينيل المقاوم للماء أو المطفي الناعم لحقائب اللابتوب والخوذات ومعدات الألعاب.',
    finishNotesEn:
      'Engineered for high-contrast waterproof vinyl or anti-glare soft-matte laminate.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (Editable Source SVG بطبقات منظمة)',
      'ملف الطباعة النهائي 300 DPI (Print-Ready SVG) بمقاس 74 × 82 مم مع 3mm Bleed وخط قص CutContour',
      'ملف طباعة نقطي مسطح بدقة 300 DPI PNG منفصل تمامًا عن معاينة المنتج',
      'مساحة QR بيضاء صافية 34×34 مم مع منطقة هدوء 3 مم جاهزة لإدراج الكود الديناميكي',
    ],
    whatsIncludedEn: [
      'Layered Editable Source SVG with 7 organized production layers',
      'Pre-Press Print-Ready SVG at 74 × 82 mm with +3mm Bleed, -3mm Safe Zone & CutContour',
      'Flat 300 DPI Print PNG separated from customer studio previews',
      'Dedicated 34 × 34 mm blank white QR placeholder with 3 mm quiet zone',
    ],
  },
  'pilot-cloudy-days': {
    hasLifestylePhotography: true,
    cardLifestyleUrl: '/assets/batch02/previews/02-cloudy-days.preview.png',
    cardLifestyleAltAr: 'ملصق Cloudy Days السماوي اللطيف بشعار FindIt QR الرسمي ومساحة QR بيضاء نظيفة',
    cardLifestyleAltEn: 'Cloudy Days cute sky pastel sticker preview with official FindIt QR logo and blank 34×34 mm QR zone',
    lifestyleSlides: [
      {
        id: 'cloudy-days-preview',
        imageUrl: '/assets/batch02/previews/02-cloudy-days.preview.png',
        captionAr: 'معاينة استوديو احترافية لملصق Cloudy Days بقصة السحاب المموجة وإضاءة ناعمة (1200×900)',
        captionEn: 'Clean studio product preview of Cloudy Days cloud-scalloped vinyl sticker (1200×900 · 4:3)',
        objectTypeAr: 'معاينة المنتج النهائي',
        objectTypeEn: 'Studio Product Preview',
        altAr: 'ملصق Cloudy Days بشعار FindIt QR ومساحة QR بيضاء ورسالة لقيتني؟ ساعدني أرجع لصاحبي!',
        altEn: 'Cloudy Days die-cut sticker studio product preview with blank white QR placeholder',
      },
    ],
    macroDetailUrl: '/assets/batch02/previews/02-cloudy-days.preview.png',
    macroDetailAltAr: 'تفاصيل معاينة المنتج لملصق Cloudy Days وألوان الباستيل الناعمة',
    macroDetailAltEn: 'Cloudy Days studio product detail inspection',
    designStoryAr:
      'ملصق باستيل سماوي لطيف يجمع الغيوم المبتسمة وقوس قزح ومنطاد الهواء الساخن والهلال والنجوم مع شعار FindIt QR الرسمي ومساحة QR بيضاء 34×34 مم ونداء «امسح هنا» ورسالة «لقيتني؟ ساعدني أرجع لصاحبي!».',
    designStoryEn:
      'Cute pastel sky illustration featuring smiling clouds, a pastel rainbow, hot-air balloon, crescent moon, stars, official FindIt QR logo, 34×34 mm blank white QR zone, and "امسح هنا" CTA.',
    finishNotesAr:
      'يناسب الفينيل المطفي الناعم المقاوم للماء والغسيل لحقائب المدرسة وصناديق الطعام.',
    finishNotesEn:
      'Recommended on washable soft-touch matte vinyl for kids and family items.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (Editable Source SVG بطبقات منظمة)',
      'ملف الطباعة النهائي 300 DPI (Print-Ready SVG) بمقاس 76 × 76 مم مع 3mm Bleed وخط قص CutContour',
      'ملف طباعة نقطي مسطح بدقة 300 DPI PNG منفصل تمامًا عن معاينة المنتج',
      'مساحة QR بيضاء صافية 34×34 مم مع منطقة هدوء 3 مم',
    ],
    whatsIncludedEn: [
      'Layered Editable Source SVG with 7 organized production layers',
      'Pre-Press Print-Ready SVG at 76 × 76 mm with +3mm Bleed, -3mm Safe Zone & CutContour',
      'Flat 300 DPI Print PNG separated from customer studio previews',
      'Dedicated 34 × 34 mm blank white QR placeholder with 3 mm quiet zone',
    ],
  },
  'pilot-urban-riot': {
    hasLifestylePhotography: true,
    cardLifestyleUrl: '/assets/batch02/previews/03-urban-riot.preview.png',
    cardLifestyleAltAr: 'ملصق Urban Riot المستوحى من فن الشارع والجرافيتي بشعار FindIt QR ومساحة QR بيضاء',
    cardLifestyleAltEn: 'Urban Riot street-art graffiti sticker preview with official FindIt QR logo and blank 34×34 mm QR zone',
    lifestyleSlides: [
      {
        id: 'urban-riot-preview',
        imageUrl: '/assets/batch02/previews/03-urban-riot.preview.png',
        captionAr: 'معاينة استوديو احترافية لملصق Urban Riot بتصميم جرافيتي الشارع وقصة حرة (1200×900)',
        captionEn: 'Clean studio product preview of Urban Riot street-art vinyl sticker (1200×900 · 4:3)',
        objectTypeAr: 'معاينة المنتج النهائي',
        objectTypeEn: 'Studio Product Preview',
        altAr: 'ملصق Urban Riot بشعار FindIt QR ومساحة QR بيضاء ورسالة لقيت الغرض؟ ساعد في إرجاعه لصاحبه!',
        altEn: 'Urban Riot die-cut sticker studio product preview with blank white QR placeholder',
      },
    ],
    macroDetailUrl: '/assets/batch02/previews/03-urban-riot.preview.png',
    macroDetailAltAr: 'تفاصيل معاينة المنتج لملصق Urban Riot الجرافيتي',
    macroDetailAltEn: 'Urban Riot studio product detail inspection',
    designStoryAr:
      'ملصق جرافيتي حضري يجمع عبوة الرش ولوح التزلج والسماعات والتاج والأسهم وبقع الطلاء مع شعار FindIt QR الرسمي ومساحة QR بيضاء 34×34 مم ونداء «امسح هنا» والرسالة المعتمدة «لقيت الغرض؟ ساعد في إرجاعه لصاحبه!».',
    designStoryEn:
      'Street-art graffiti composition with spray paint can, skateboard, headphones, crown, arrows, official FindIt QR logo, 34×34 mm blank white QR zone, "امسح هنا" CTA, and "لقيت الغرض؟ ساعد في إرجاعه لصاحبه!".',
    finishNotesAr:
      'مصمم للفينيل الخارجي المتين المقاوم للخدش والاحتكاك على ألواح التزلج والخوذات واللابتوب.',
    finishNotesEn:
      'Built for heavy-duty outdoor street vinyl on skateboards, helmets, and daily carry.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (Editable Source SVG بطبقات منظمة)',
      'ملف الطباعة النهائي 300 DPI (Print-Ready SVG) بمقاس 76 × 78 مم مع 3mm Bleed وخط قص CutContour',
      'ملف طباعة نقطي مسطح بدقة 300 DPI PNG منفصل تمامًا عن معاينة المنتج',
      'مساحة QR بيضاء صافية 34×34 مم مع منطقة هدوء 3 مم',
    ],
    whatsIncludedEn: [
      'Layered Editable Source SVG with 7 organized production layers',
      'Pre-Press Print-Ready SVG at 76 × 78 mm with +3mm Bleed, -3mm Safe Zone & CutContour',
      'Flat 300 DPI Print PNG separated from customer studio previews',
      'Dedicated 34 × 34 mm blank white QR placeholder with 3 mm quiet zone',
    ],
  },
  'pilot-ocean-wonders': {
    hasLifestylePhotography: true,
    cardLifestyleUrl: '/assets/batch02/previews/04-ocean-wonders.preview.png',
    cardLifestyleAltAr: 'ملصق Ocean Wonders البحري بشعار FindIt QR الرسمي ومساحة QR بيضاء نظيفة',
    cardLifestyleAltEn: 'Ocean Wonders marine underwater sticker preview with official FindIt QR logo and blank 34×34 mm QR zone',
    lifestyleSlides: [
      {
        id: 'ocean-wonders-preview',
        imageUrl: '/assets/batch02/previews/04-ocean-wonders.preview.png',
        captionAr: 'معاينة استوديو احترافية لملصق Ocean Wonders البحري بقصة أمواج عضوية (1200×900)',
        captionEn: 'Clean studio product preview of Ocean Wonders marine vinyl sticker (1200×900 · 4:3)',
        objectTypeAr: 'معاينة المنتج النهائي',
        objectTypeEn: 'Studio Product Preview',
        altAr: 'ملصق Ocean Wonders بشعار FindIt QR ومساحة QR بيضاء ورسالة لقيت حاجة؟ خلّينا نرجّعها لصاحبها!',
        altEn: 'Ocean Wonders die-cut sticker studio product preview with blank white QR placeholder',
      },
    ],
    macroDetailUrl: '/assets/batch02/previews/04-ocean-wonders.preview.png',
    macroDetailAltAr: 'تفاصيل معاينة المنتج لملصق Ocean Wonders البحري',
    macroDetailAltEn: 'Ocean Wonders studio product detail inspection',
    designStoryAr:
      'ملصق عالم البحار يضم سلحفاة بحرية وأسماكًا ملونة وشعابًا مرجانية وأصدافًا وفقاعات وأمواجًا ناعمة مع شعار FindIt QR الرسمي ومساحة QR بيضاء 34×34 مم ونداء «امسح هنا» ورسالة «لقيت حاجة؟ خلّينا نرجّعها لصاحبها!».',
    designStoryEn:
      'Underwater marine world die-cut sticker featuring a sea turtle, colorful fish, coral reefs, seashells, bubbles, official FindIt QR logo, 34×34 mm blank white QR zone, and "امسح هنا" CTA.',
    finishNotesAr:
      'موصى به على الفينيل البحري المقاوم للماء والرطوبة لمعدات السفر والشاطئ والمطارات.',
    finishNotesEn:
      'Ideal on marine-grade waterproof vinyl for travel luggage, bottles, and beach gear.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (Editable Source SVG بطبقات منظمة)',
      'ملف الطباعة النهائي 300 DPI (Print-Ready SVG) بمقاس 76 × 78 مم مع 3mm Bleed وخط قص CutContour',
      'ملف طباعة نقطي مسطح بدقة 300 DPI PNG منفصل تمامًا عن معاينة المنتج',
      'مساحة QR بيضاء صافية 34×34 مم مع منطقة هدوء 3 مم',
    ],
    whatsIncludedEn: [
      'Layered Editable Source SVG with 7 organized production layers',
      'Pre-Press Print-Ready SVG at 76 × 78 mm with +3mm Bleed, -3mm Safe Zone & CutContour',
      'Flat 300 DPI Print PNG separated from customer studio previews',
      'Dedicated 34 × 34 mm blank white QR placeholder with 3 mm quiet zone',
    ],
  },
  'pilot-pixel-quest': {
    hasLifestylePhotography: true,
    cardLifestyleUrl: '/assets/batch02/previews/05-pixel-quest.preview.png',
    cardLifestyleAltAr: 'ملصق Pixel Quest لألعاب البكسل الكلاسيكية بشعار FindIt QR ومساحة QR بيضاء',
    cardLifestyleAltEn: 'Pixel Quest retro pixel-art gaming sticker preview with official FindIt QR logo and blank 34×34 mm QR zone',
    lifestyleSlides: [
      {
        id: 'pixel-quest-preview',
        imageUrl: '/assets/batch02/previews/05-pixel-quest.preview.png',
        captionAr: 'معاينة استوديو احترافية لملصق Pixel Quest بقصة أركيد متدرجة (1200×900)',
        captionEn: 'Clean studio product preview of Pixel Quest retro arcade vinyl sticker (1200×900 · 4:3)',
        objectTypeAr: 'معاينة المنتج النهائي',
        objectTypeEn: 'Studio Product Preview',
        altAr: 'ملصق Pixel Quest بشعار FindIt QR ومساحة QR بيضاء ورسالة لقيت الغرض؟ ساعد في إرجاعه لصاحبه!',
        altEn: 'Pixel Quest die-cut sticker studio product preview with blank white QR placeholder',
      },
    ],
    macroDetailUrl: '/assets/batch02/previews/05-pixel-quest.preview.png',
    macroDetailAltAr: 'تفاصيل معاينة المنتج لملصق Pixel Quest الكلاسيكي',
    macroDetailAltEn: 'Pixel Quest studio product detail inspection',
    designStoryAr:
      'ملصق ألعاب بكسل ريترو يضم بطل مغامرات ويد تحكم وصندوق كنز وعملات ذهبية وقلوب طاقة مع شعار FindIt QR الرسمي ومساحة QR بيضاء 34×34 مم ونداء «امسح هنا» والرسالة المعتمدة «لقيت الغرض؟ ساعد في إرجاعه لصاحبه!».',
    designStoryEn:
      'Retro pixel-art gaming sticker featuring a pixel adventurer, controller, treasure chest, coins, hearts, official FindIt QR logo, 34×34 mm blank white QR zone, "امسح هنا" CTA, and "لقيت الغرض؟ ساعد في إرجاعه لصاحبه!".',
    finishNotesAr:
      'مثالي على الفينيل المطفي الناعم للأجهزة الإلكترونية وأجهزة الألعاب المحمولة.',
    finishNotesEn:
      'Best on crisp-edge soft-touch matte vinyl for gaming consoles, laptops, and controllers.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (Editable Source SVG بطبقات منظمة)',
      'ملف الطباعة النهائي 300 DPI (Print-Ready SVG) بمقاس 74 × 78 مم مع 3mm Bleed وخط قص CutContour',
      'ملف طباعة نقطي مسطح بدقة 300 DPI PNG منفصل تمامًا عن معاينة المنتج',
      'مساحة QR بيضاء صافية 34×34 مم مع منطقة هدوء 3 مم',
    ],
    whatsIncludedEn: [
      'Layered Editable Source SVG with 7 organized production layers',
      'Pre-Press Print-Ready SVG at 74 × 78 mm with +3mm Bleed, -3mm Safe Zone & CutContour',
      'Flat 300 DPI Print PNG separated from customer studio previews',
      'Dedicated 34 × 34 mm blank white QR placeholder with 3 mm quiet zone',
    ],
  },
  'pilot-candy-clouds': {
    hasLifestylePhotography: true,
    cardLifestyleUrl: '/assets/batch02/previews/06-candy-clouds.preview.png',
    cardLifestyleAltAr: 'ملصق Candy Clouds المبهج بعالم الحلويات وشعار FindIt QR ومساحة QR بيضاء',
    cardLifestyleAltEn: 'Candy Clouds cute dessert sticker preview with official FindIt QR logo and blank 34×34 mm QR zone',
    lifestyleSlides: [
      {
        id: 'candy-clouds-preview',
        imageUrl: '/assets/batch02/previews/06-candy-clouds.preview.png',
        captionAr: 'معاينة استوديو احترافية لملصق Candy Clouds بقصة مموجة مرحة (1200×900)',
        captionEn: 'Clean studio product preview of Candy Clouds scalloped dessert vinyl sticker (1200×900 · 4:3)',
        objectTypeAr: 'معاينة المنتج النهائي',
        objectTypeEn: 'Studio Product Preview',
        altAr: 'ملصق Candy Clouds بشعار FindIt QR ومساحة QR بيضاء ورسالة لقيتني؟ رجّعني لصاحبي وخليه يفرح!',
        altEn: 'Candy Clouds die-cut sticker studio product preview with blank white QR placeholder',
      },
    ],
    macroDetailUrl: '/assets/batch02/previews/06-candy-clouds.preview.png',
    macroDetailAltAr: 'تفاصيل معاينة المنتج لملصق Candy Clouds المبهج',
    macroDetailAltEn: 'Candy Clouds studio product detail inspection',
    designStoryAr:
      'ملصق حلويات مبهج يضم الدونات والكب كيك والماكرون والمصاصات والرشات السكرية مع شعار FindIt QR الرسمي ومساحة QR بيضاء 34×34 مم ونداء «امسح هنا» ورسالة «لقيتني؟ رجّعني لصاحبي وخليه يفرح!».',
    designStoryEn:
      'Sweet dessert illustration featuring glazed donuts, cupcakes, macarons, swirl lollipops, sprinkles, official FindIt QR logo, 34×34 mm blank white QR zone, and "امسح هنا" CTA.',
    finishNotesAr:
      'مناسب للفينيل المقاوم للماء والغسيل لصناديق الطعام والمطارات والحقائب المدرسية.',
    finishNotesEn:
      'Ideal on washable waterproof vinyl for lunchboxes, tumblers, and school bags.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (Editable Source SVG بطبقات منظمة)',
      'ملف الطباعة النهائي 300 DPI (Print-Ready SVG) بمقاس 78 × 78 مم مع 3mm Bleed وخط قص CutContour',
      'ملف طباعة نقطي مسطح بدقة 300 DPI PNG منفصل تمامًا عن معاينة المنتج',
      'مساحة QR بيضاء صافية 34×34 مم مع منطقة هدوء 3 مم',
    ],
    whatsIncludedEn: [
      'Layered Editable Source SVG with 7 organized production layers',
      'Pre-Press Print-Ready SVG at 78 × 78 mm with +3mm Bleed, -3mm Safe Zone & CutContour',
      'Flat 300 DPI Print PNG separated from customer studio previews',
      'Dedicated 34 × 34 mm blank white QR placeholder with 3 mm quiet zone',
    ],
  },
  'pilot-botanical-journey': {
    hasLifestylePhotography: true,
    cardLifestyleUrl: '/assets/batch02/previews/07-botanical-journey.preview.png',
    cardLifestyleAltAr: 'ملصق Botanical Journey النباتي الاستكشافي بشعار FindIt QR ومساحة QR بيضاء',
    cardLifestyleAltEn: 'Botanical Journey nature exploration sticker preview with official FindIt QR logo and blank 34×34 mm QR zone',
    lifestyleSlides: [
      {
        id: 'botanical-journey-preview',
        imageUrl: '/assets/batch02/previews/07-botanical-journey.preview.png',
        captionAr: 'معاينة استوديو احترافية لملصق Botanical Journey بقصة نباتية عضوية (1200×900)',
        captionEn: 'Clean studio product preview of Botanical Journey editorial botanical vinyl sticker (1200×900 · 4:3)',
        objectTypeAr: 'معاينة المنتج النهائي',
        objectTypeEn: 'Studio Product Preview',
        altAr: 'ملصق Botanical Journey بشعار FindIt QR ومساحة QR بيضاء ورسالة لقيت الغرض؟ ساعد في إرجاعه لصاحبه!',
        altEn: 'Botanical Journey die-cut sticker studio product preview with blank white QR placeholder',
      },
    ],
    macroDetailUrl: '/assets/batch02/previews/07-botanical-journey.preview.png',
    macroDetailAltAr: 'تفاصيل معاينة المنتج لملصق Botanical Journey النباتي',
    macroDetailAltEn: 'Botanical Journey studio product detail inspection',
    designStoryAr:
      'ملصق نباتي استكشافي يجمع الأوراق الاستوائية والأغصان والزهور وبوصلة الرحلات بألوان المريمية والغابات والبيج الدافئ مع شعار FindIt QR الرسمي ومساحة QR بيضاء 34×34 مم ونداء «امسح هنا» والرسالة المعتمدة «لقيت الغرض؟ ساعد في إرجاعه لصاحبه!».',
    designStoryEn:
      'Botanical nature exploration sticker featuring tropical leaves, botanical flowers, vines, explorer compass motif, official FindIt QR logo, 34×34 mm blank white QR zone, "امسح هنا" CTA, and "لقيت الغرض؟ ساعد في إرجاعه لصاحبه!".',
    finishNotesAr:
      'يبرز بأناقة على الفينيل المطفي الناعم ذي الملمس الورقي أو الفينيل المقاوم للماء لمعدات السفر.',
    finishNotesEn:
      'Recommended on artisanal soft-matte botanical vinyl or weatherproof travel stock.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (Editable Source SVG بطبقات منظمة)',
      'ملف الطباعة النهائي 300 DPI (Print-Ready SVG) بمقاس 74 × 80 مم مع 3mm Bleed وخط قص CutContour',
      'ملف طباعة نقطي مسطح بدقة 300 DPI PNG منفصل تمامًا عن معاينة المنتج',
      'مساحة QR بيضاء صافية 34×34 مم مع منطقة هدوء 3 مم',
    ],
    whatsIncludedEn: [
      'Layered Editable Source SVG with 7 organized production layers',
      'Pre-Press Print-Ready SVG at 74 × 80 mm with +3mm Bleed, -3mm Safe Zone & CutContour',
      'Flat 300 DPI Print PNG separated from customer studio previews',
      'Dedicated 34 × 34 mm blank white QR placeholder with 3 mm quiet zone',
    ],
  },
  'pilot-royal-signature': {
    hasLifestylePhotography: true,
    cardLifestyleUrl: '/assets/batch02/previews/08-royal-signature.preview.png',
    cardLifestyleAltAr: 'ملصق Royal Signature الملكي الفاخر بشعار FindIt QR ومساحة QR بيضاء',
    cardLifestyleAltEn: 'Royal Signature luxury royal emblem sticker preview with official FindIt QR logo and blank 34×34 mm QR zone',
    lifestyleSlides: [
      {
        id: 'royal-signature-preview',
        imageUrl: '/assets/batch02/previews/08-royal-signature.preview.png',
        captionAr: 'معاينة استوديو احترافية لملصق Royal Signature بقصة الدرع الملكي الفاخر (1200×900)',
        captionEn: 'Clean studio product preview of Royal Signature luxury crest vinyl sticker (1200×900 · 4:3)',
        objectTypeAr: 'معاينة المنتج النهائي',
        objectTypeEn: 'Studio Product Preview',
        altAr: 'ملصق Royal Signature بشعار FindIt QR ومساحة QR بيضاء ورسالة لقيت هذا الغرض؟ ساعد في إعادته لصاحبه!',
        altEn: 'Royal Signature die-cut sticker studio product preview with blank white QR placeholder',
      },
    ],
    macroDetailUrl: '/assets/batch02/previews/08-royal-signature.preview.png',
    macroDetailAltAr: 'تفاصيل معاينة المنتج لملصق Royal Signature الملكي الفاخر',
    macroDetailAltEn: 'Royal Signature studio product detail inspection',
    designStoryAr:
      'درع ملكي فاخر يتوسطه تاج ذهبي وأكاليل غار وزخارف هندسية دقيقة بالكحلي الملكي والذهبي والعاجي مع شعار FindIt QR الرسمي ومساحة QR بيضاء 34×34 مم ونداء «امسح هنا» والرسالة المعتمدة «لقيت هذا الغرض؟ ساعد في إعادته لصاحبه!».',
    designStoryEn:
      'Luxury royal emblem die-cut sticker with gold crown, laurel wreaths, shield framing, geometric filigree, official FindIt QR logo, 34×34 mm blank white QR zone, "امسح هنا" CTA, and "لقيت هذا الغرض؟ ساعد في إعادته لصاحبه!".',
    finishNotesAr:
      'مثالي على الفينيل المطفي الملكي الناعم لحقائب رجال الأعمال والأجهزة والمقتنيات الفاخرة.',
    finishNotesEn:
      'Best on executive soft-touch matte vinyl for luxury luggage, briefcases, and hardware.',
    whatsIncludedAr: [
      'ملف التصميم الأصلي القابل للتعديل (Editable Source SVG بطبقات منظمة)',
      'ملف الطباعة النهائي 300 DPI (Print-Ready SVG) بمقاس 72 × 84 مم مع 3mm Bleed وخط قص CutContour',
      'ملف طباعة نقطي مسطح بدقة 300 DPI PNG منفصل تمامًا عن معاينة المنتج',
      'مساحة QR بيضاء صافية 34×34 مم مع منطقة هدوء 3 مم',
    ],
    whatsIncludedEn: [
      'Layered Editable Source SVG with 7 organized production layers',
      'Pre-Press Print-Ready SVG at 72 × 84 mm with +3mm Bleed, -3mm Safe Zone & CutContour',
      'Flat 300 DPI Print PNG separated from customer studio previews',
      'Dedicated 34 × 34 mm blank white QR placeholder with 3 mm quiet zone',
    ],
  },
  ...Object.fromEntries(
    MASTER_COLLECTION_SPECS.map((spec) => {
      const previewUrl = `/assets/master-collection/previews/${spec.filePrefix}.preview.png`;
      const mediaEntry: TemplateShowcaseMedia = {
        hasLifestylePhotography: true,
        cardLifestyleUrl: previewUrl,
        cardLifestyleAltAr: `معاينة استوديو لملصق ${spec.titleAr} بشعار FindIt QR الرسمي`,
        cardLifestyleAltEn: `Studio product preview for ${spec.titleEn} with official FindIt QR branding`,
        lifestyleSlides: [
          {
            id: `${spec.filePrefix}-preview`,
            imageUrl: previewUrl,
            captionAr: `معاينة المنتج النهائية (1200×900) لملصق ${spec.titleAr} — منفصلة بالكامل عن ملفات الطباعة 300 DPI`,
            captionEn: `Clean customer studio preview (1200×900 · 4:3) for ${spec.titleEn} — strictly separated from 300 DPI print sheets`,
            objectTypeAr: spec.origin === 'new_original' ? 'قالب مبتكر جديد · معاينة المنتج' : 'إصدار مرجعي مطابق · معاينة المنتج',
            objectTypeEn: spec.origin === 'new_original' ? 'New Original Edition · Product Preview' : 'Reference Edition · Product Preview',
            altAr: `${spec.titleAr} — ${spec.arabicMessage}`,
            altEn: `${spec.titleEn} — ${spec.englishMessage}`,
          },
        ],
        macroDetailUrl: previewUrl,
        macroDetailAltAr: `فحص تفاصيل الطباعة لملصق ${spec.titleAr}`,
        macroDetailAltEn: `Detail inspection of ${spec.titleEn}`,
        designStoryAr: spec.unresolvedNotesAr
          ? `${spec.subtitleAr} (${spec.unresolvedNotesAr})`
          : spec.subtitleAr,
        designStoryEn: spec.subtitleEn,
        finishNotesAr:
          'موصى بالطباعة على فينيل مطفي مقاوم للماء والخدش (300 DPI) مع الحفاظ على مساحة QR البيضاء الصافية لإدراج رمز المستخدم الديناميكي.',
        finishNotesEn:
          'Engineered for 300 DPI waterproof matte or UV-gloss laminated vinyl with a pure #FFFFFF dynamic QR placement zone.',
        whatsIncludedAr: [
          `ملف التصميم الأصلي القابل للتعديل (Editable Source SVG بمقاس ${spec.widthMm} × ${spec.heightMm} مم بمساحة QR بيضاء فارغة)`,
          `ملف الطباعة النهائي 300 DPI (Print-Ready SVG) مع Bleed +3mm، منطقة أمان -3mm، وعلامات القص CutContour`,
          'صورة طباعة مسطحة بدقة 300 DPI PNG (1063 × 709 بكسل) بمساحة QR بيضاء جاهزة للدمج الديناميكي',
          'معاينة منتج احترافية منفصلة للمتجر بدقة 1200 × 900 بكسل بدون أي خطوط قص أو إرشادات طباعة',
        ],
        whatsIncludedEn: [
          `Layered Editable Source SVG (${spec.widthMm} × ${spec.heightMm} mm with blank #FFFFFF dynamic QR zone)`,
          `Pre-Press Print-Ready SVG calibrated at 300 DPI with +3 mm bleed, -3 mm safe margin, crop marks & #EC008C CutContour`,
          'Flat 300 DPI Print PNG (1063 × 709 px) with clean blank white dynamic QR placement area',
          'Dedicated 1200 × 900 customer studio product preview strictly separated from technical print files',
        ],
      };
      return [spec.id, mediaEntry];
    })
  ),
};

const PRODUCT_SCENE_META: Record<
  RealProductSceneKey,
  { objAr: string; objEn: string; capAr: string; capEn: string }
> = {
  luggage: {
    objAr: 'حقيبة سفر صلبة',
    objEn: 'Hard-Shell Carry-On Suitcase',
    capAr: 'عرض تطبيقي واقعي للملصق على حقيبة سفر صلبة بإضاءة طبيعية ومنظور حقيقي (كود QR تجريبي للعرض)',
    capEn: 'Applied in true perspective on a matte navy hard-shell carry-on suitcase (demo QR for display)',
  },
  laptop: {
    objAr: 'جهاز لابتوب ومكتب عمل',
    objEn: 'Anodized Aluminum Laptop',
    capAr: 'عرض تطبيقي واقعي للملصق على غطاء لابتوب معدني فوق مكتب خشبي (كود QR تجريبي للعرض)',
    capEn: 'Applied in natural perspective on a space-gray aluminum laptop lid (demo QR for display)',
  },
  briefcase: {
    objAr: 'حقيبة جلدية تنفيذية',
    objEn: 'Executive Leather Briefcase',
    capAr: 'عرض تطبيقي واقعي للملصق على حقيبة جلدية فاخرة لرجال الأعمال (كود QR تجريبي للعرض)',
    capEn: 'Applied cleanly on an espresso leather executive briefcase flap (demo QR for display)',
  },
  backpack: {
    objAr: 'حقيبة ظهر يومية ومدرسية',
    objEn: 'Woven Canvas Backpack',
    capAr: 'عرض تطبيقي واقعي للملصق على جيب حقيبة ظهر قماشية للاستخدام اليومي (كود QR تجريبي للعرض)',
    capEn: 'Applied cleanly on the front pocket of a daily woven canvas backpack (demo QR for display)',
  },
  pet_collar: {
    objAr: 'مستلزمات وطوق حيوانات أليفة',
    objEn: 'Leather Pet Collar & Carrier',
    capAr: 'عرض واقعي للملصق بجانب طوق جلد طبيعي وحاملة حيوانات أليفة (كود QR تجريبي للعرض)',
    capEn: 'Presented beside a crafted leather pet collar and carrier on honed limestone (demo QR for display)',
  },
  camera_case: {
    objAr: 'حقيبة كاميرا ومعدات تقنية',
    objEn: 'Hard-Shell Camera & Gear Case',
    capAr: 'عرض تطبيقي واقعي للملصق على حقيبة معدات وكاميرا صلبة مقاومة للصدمات (كود QR تجريبي للعرض)',
    capEn: 'Mounted on the recessed lid of a matte graphite camera & field gear case (demo QR for display)',
  },
};

const LIFESTYLE_SCENE_META: Record<
  LifestyleSceneKey,
  { objAr: string; objEn: string; capAr: string; capEn: string }
> = {
  cafe_carry: {
    objAr: 'استخدام يومي — مقهى وعمل',
    objEn: 'Daily Carry — Sunlit Café',
    capAr: 'لقطة استخدام واقعية على دفتر يومي في مقهى مشمس تبرز سهولة المسح والوضوح في الحياة اليومية',
    capEn: 'Real-world sunlit café lifestyle view applied on a cream daily journal for instant scannability',
  },
  airport_lounge: {
    objAr: 'استخدام واقعي — صالة المطار',
    objEn: 'Travel Lifestyle — Airport Lounge',
    capAr: 'لقطة سفر واقعية في صالة المغادرة تبرز وضوح الملصق ورمز الاسترجاع أثناء التنقل والرحلات',
    capEn: 'Golden-hour airport lounge lifestyle scene showing real-world visibility during transit',
  },
};

const ACTIVE_CATALOG_META = new Map<string, { slug: string; titleAr: string; titleEn: string }>(
  [
    ...MASTER_COLLECTION_TEMPLATES_33,
    ...PILOT_FIVE_TAG_DESIGNS,
    PEBBLE_POP_TEMPLATE,
    ...BATCH_01_NEW_TEMPLATES,
    ...BATCH_02_NEW_TEMPLATES,
    ...BATCH_02_STICKER_TEMPLATES_8,
  ].map((t) => [t.id, { slug: t.slug, titleAr: t.titleAr, titleEn: t.titleEn }])
);

// Enrich all 58 active templates with their unified 4-shot realistic presentation suite
// while preserving Atelier Crest's bespoke editorial photography + adding its 3D product mockup.
for (const [designId, reg] of Object.entries(LIBRARY_SHOWCASE_REGISTRY)) {
  const base = PILOT_SHOWCASE_MEDIA[designId];
  const meta = ACTIVE_CATALOG_META.get(designId);
  if (!base || !meta) continue;

  const gallery = getShowcaseGalleryUrlsForSlug(meta.slug);
  const prodMeta = PRODUCT_SCENE_META[reg.productScene];
  const lifeMeta = LIFESTYLE_SCENE_META[reg.lifestyleScene];

  if (reg.preserveAtelierPhotos) {
    PILOT_SHOWCASE_MEDIA[designId] = {
      ...base,
      hasLifestylePhotography: true,
      missingAssetNoteAr: undefined,
      missingAssetNoteEn: undefined,
      cardLifestyleUrl: atelierCardLifestyleImg,
      macroDetailUrl: atelierMacroDetailImg,
      lifestyleSlides: [
        {
          id: 'mockup-3d',
          imageUrl: gallery.mockup3dUrl,
          captionAr: `عرض ثلاثي الأبعاد للملصق (${meta.titleAr}) بحواف مقصوصة بدقة وإضاءة استوديو ناعمة`,
          captionEn: `3D studio product mockup of ${meta.titleEn} showing die-cut thickness and soft studio lighting`,
          objectTypeAr: 'عرض 3D للمنتج',
          objectTypeEn: '3D Product Mockup',
          altAr: `صورة عرض ثلاثية الأبعاد لقالب ${meta.titleAr}`,
          altEn: `3D studio product mockup of ${meta.titleEn}`,
        },
        base.lifestyleSlides[0],
        {
          id: 'closeup-macro',
          imageUrl: atelierMacroDetailImg,
          captionAr: 'لقطة ماكرو قريبة تبرز ملمس الفينيل المطفي، الخطوط الذهبية، ووضوح رمز QR التجريبي',
          captionEn: 'Macro close-up highlighting soft-touch matte laminate texture, gold framing, and demo QR clarity',
          objectTypeAr: 'صورة مقربة للتفاصيل',
          objectTypeEn: 'Macro Material Close-up',
          altAr: base.macroDetailAltAr || `صورة مقربة لتفاصيل قالب ${meta.titleAr}`,
          altEn: base.macroDetailAltEn || `Macro detail of ${meta.titleEn}`,
        },
        base.lifestyleSlides[1],
      ],
    };
    continue;
  }

  PILOT_SHOWCASE_MEDIA[designId] = {
    ...base,
    hasLifestylePhotography: true,
    missingAssetNoteAr: undefined,
    missingAssetNoteEn: undefined,
    cardLifestyleUrl: gallery.mockup3dUrl,
    cardLifestyleAltAr: `عرض منتج ثلاثي الأبعاد لقالب ${meta.titleAr} بشعار FindIt QR الرسمي`,
    cardLifestyleAltEn: `3D studio product preview of ${meta.titleEn} with official FindIt QR branding`,
    macroDetailUrl: gallery.closeupUrl,
    macroDetailAltAr: `صورة مقربة (Close-up) تبرز جودة الطباعة، التفاصيل، ورمز QR التجريبي لقالب ${meta.titleAr}`,
    macroDetailAltEn: `Macro close-up highlighting print texture, typography, and demo QR clarity for ${meta.titleEn}`,
    lifestyleSlides: [
      {
        id: 'mockup-3d',
        imageUrl: gallery.mockup3dUrl,
        captionAr: `صورة عرض ثلاثية الأبعاد (3D Product Mockup) تبرز القصة المخصصة والسماكة الفينيلية لقالب ${meta.titleAr}`,
        captionEn: `3D studio product mockup showcasing the die-cut silhouette and matte vinyl edge of ${meta.titleEn}`,
        objectTypeAr: 'عرض 3D للمنتج',
        objectTypeEn: '3D Product Mockup',
        altAr: `صورة ثلاثية الأبعاد لقالب ${meta.titleAr}`,
        altEn: `3D product mockup of ${meta.titleEn}`,
      },
      {
        id: 'on-product',
        imageUrl: gallery.onProductUrl,
        captionAr: prodMeta.capAr,
        captionEn: prodMeta.capEn,
        objectTypeAr: prodMeta.objAr,
        objectTypeEn: prodMeta.objEn,
        altAr: `قالب ${meta.titleAr} مطبّق على ${prodMeta.objAr}`,
        altEn: `${meta.titleEn} applied on ${prodMeta.objEn}`,
      },
      {
        id: 'closeup-macro',
        imageUrl: gallery.closeupUrl,
        captionAr: `لقطة ماكرو مقربة تبرز ملمس الخامة، حدة الطباعة، ووضوح رمز QR التجريبي لقالب ${meta.titleAr}`,
        captionEn: `Macro close-up inspecting vinyl surface grain, crisp typography, die-cut edge, and demo QR on ${meta.titleEn}`,
        objectTypeAr: 'صورة مقربة للتفاصيل',
        objectTypeEn: 'Macro Material Close-up',
        altAr: `لقطة مقربة لتفاصيل قالب ${meta.titleAr}`,
        altEn: `Macro detail close-up of ${meta.titleEn}`,
      },
      {
        id: 'lifestyle',
        imageUrl: gallery.lifestyleUrl,
        captionAr: lifeMeta.capAr,
        captionEn: lifeMeta.capEn,
        objectTypeAr: lifeMeta.objAr,
        objectTypeEn: lifeMeta.objEn,
        altAr: `استخدام واقعي لقالب ${meta.titleAr} — ${lifeMeta.objAr}`,
        altEn: `Real-world lifestyle view of ${meta.titleEn} — ${lifeMeta.objEn}`,
      },
    ],
  };
}

export function getTemplateShowcaseMedia(designId: string): TemplateShowcaseMedia | null {
  return PILOT_SHOWCASE_MEDIA[designId] || null;
}
