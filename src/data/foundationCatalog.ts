import {
  ActivityLogEntry,
  NotificationEntry,
  PurchaseOrder,
  QrRecord,
  RegisteredItem,
  TagDesignTemplate,
  UserProfile,
  WorkspaceSettings,
} from '../types/domain';

import { ALL_45_TAG_DESIGNS } from './designTemplates45';
import { BATCH_01_NEW_TEMPLATES } from './batch01Designs';
import { BATCH_02_NEW_TEMPLATES } from './batch02Designs';
import { BATCH_02_STICKER_TEMPLATES_8 } from './batch02StickerTemplates8';
import { applyLibraryShowcaseRegistry } from './libraryShowcaseRegistry';
import { MASTER_COLLECTION_TEMPLATES_33 } from './masterCollectionTemplates33';
import { PEBBLE_POP_TEMPLATE } from './pebblePopDesign';
import { PILOT_FIVE_TAG_DESIGNS } from './pilotDesigns5';

export const VISUAL_ASSETS = {
  hero3d: '/src/assets/images/midnight_teal_hero_3d_1795324666661.jpg',
  howItWorks3d: '/src/assets/images/midnight_teal_scan_3d_1795324667475.jpg',
  features3d: '/src/assets/images/midnight_teal_features_3d_1795324667103.jpg',
  privacy3d: '/src/assets/images/midnight_teal_privacy_3d_1795324665313.jpg',
  useCases3d: '/src/assets/images/midnight_teal_features_3d_1795324667103.jpg',
  designStore3d: '/src/assets/images/midnight_teal_hero_3d_1795324666661.jpg',
} as const;

export const INITIAL_TAG_DESIGNS: TagDesignTemplate[] = [
  ...MASTER_COLLECTION_TEMPLATES_33.map((d) =>
    applyLibraryShowcaseRegistry({ ...d, status: 'published' as const })
  ),
  ...PILOT_FIVE_TAG_DESIGNS.map((d) =>
    applyLibraryShowcaseRegistry({ ...d, status: 'published' as const })
  ),
  applyLibraryShowcaseRegistry({ ...PEBBLE_POP_TEMPLATE, status: 'published' as const }),
  ...BATCH_01_NEW_TEMPLATES.map((d) =>
    applyLibraryShowcaseRegistry({ ...d, status: 'published' as const })
  ),
  ...BATCH_02_NEW_TEMPLATES.map((d) =>
    applyLibraryShowcaseRegistry({ ...d, status: 'published' as const })
  ),
  ...BATCH_02_STICKER_TEMPLATES_8.map((d) =>
    applyLibraryShowcaseRegistry({ ...d, status: 'published' as const })
  ),
  ...ALL_45_TAG_DESIGNS.map((d) => ({ ...d, status: 'archived' as const })),
];

/**
 * Public Marketing Showcase Examples (used ONLY on the public HomePage and Public Scan Simulator
 * when no authenticated user item is selected — never mixed into an authenticated user's account).
 */
export const INITIAL_REGISTERED_ITEMS: RegisteredItem[] = [
  {
    id: 'item-macbook-pro',
    ownerUid: 'public-showcase',
    qrId: 'qr-macbook-01',
    codeSerial: 'FQR-4810-RYD',
    name: 'حاسوب MacBook Pro 16 — العمل',
    nameAr: 'حاسوب MacBook Pro 16 — العمل',
    nameEn: 'MacBook Pro 16 — Work Workstation',
    category: 'electronics',
    imageUrl: '',
    status: 'Active',
    description: 'حاسوب محمول باللون الفضي داخل حافظة جلدية كحلية مع ملصق Nano Shield على الغطاء.',
    descriptionAr: 'حاسوب محمول باللون الفضي داخل حافظة جلدية كحلية مع ملصق Nano Shield على الغطاء.',
    descriptionEn: 'Silver laptop inside a navy leather sleeve with a Nano Shield QR sticker on the lid.',
    recoveryInstructions:
      'شكرًا لأمانتك! هذا الحاسوب يحتوي على ملفات عمل هامة. يرجى التواصل عبر واتساب أو الاتصال المباشر لتنسيق استلامه.',
    finderNoteAr:
      'شكرًا لأمانتك! هذا الحاسوب يحتوي على ملفات عمل هامة. يرجى التواصل عبر واتساب أو الاتصال المباشر لتنسيق استلامه.',
    finderNoteEn:
      'Thank you for your honesty! This laptop contains active work projects. Please reach out via WhatsApp or phone call to coordinate return.',
    rewardOffered: true,
    rewardAmountTextAr: 'مكافأة تقديرية ٣٠٠ ريال فورية عند التسليم',
    rewardAmountTextEn: '300 SAR immediate appreciation reward upon return',
    city: 'الرياض',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    totalScans: 3,
    lastScanAt: '2026-11-14 18:40',
    createdAt: '2026-09-12',
    updatedAt: '2026-11-14',
    designId: 'design-epoxy-tech',
    contactChannels: {
      showPhone: true,
      showWhatsapp: true,
      showEmail: true,
      showTelegram: false,
      anonymousRelayOnly: false,
      customPhone: '+966 55 120 9841',
      customWhatsapp: '+966 55 120 9841',
      customEmail: 'm.alarapy@finditqr-demo.com',
      customTelegram: '@m_alarapy',
    },
  },
  {
    id: 'item-travel-bag',
    ownerUid: 'public-showcase',
    qrId: 'qr-luggage-02',
    codeSerial: 'FQR-7729-JED',
    name: 'حقيبة سفر زرقاء — رحلات الطيران',
    nameAr: 'حقيبة سفر زرقاء — رحلات الطيران',
    nameEn: 'Cobalt Blue Cabin Suitcase',
    category: 'bags',
    imageUrl: '',
    status: 'Lost',
    description: 'حقيبة سفر مقاس مقصورة الطائرة باللون الأزرق الملكي مع بطاقة Voyager 3D على المقبض العلوي.',
    descriptionAr: 'حقيبة سفر مقاس مقصورة الطائرة باللون الأزرق الملكي مع بطاقة Voyager 3D على المقبض العلوي.',
    descriptionEn: 'Royal blue cabin-size hard suitcase with a Voyager 3D smart loop attached to the top handle.',
    recoveryInstructions:
      'فُقدت هذه الحقيبة في صالة القدوم. يرجى التواصل فورًا عبر واتساب أو مكتب المفقودات، وشكراً جزيلاً لتعاونكم.',
    finderNoteAr:
      'فُقدت هذه الحقيبة في صالة القدوم. يرجى التواصل فورًا عبر واتساب أو مكتب المفقودات، وشكراً جزيلاً لتعاونكم.',
    finderNoteEn:
      'Misplaced near the arrivals terminal. Please message via WhatsApp or airport lost-and-found desk.',
    rewardOffered: true,
    rewardAmountTextAr: '٢٥٠ ريال مكافأة شكر',
    rewardAmountTextEn: '250 SAR appreciation reward',
    city: 'جدة',
    cityAr: 'جدة',
    cityEn: 'Jeddah',
    totalScans: 7,
    lastScanAt: '2026-11-16 09:15',
    createdAt: '2026-10-03',
    updatedAt: '2026-11-16',
    designId: 'design-luggage-pro',
    contactChannels: {
      showPhone: true,
      showWhatsapp: true,
      showEmail: true,
      showTelegram: true,
      anonymousRelayOnly: false,
      customPhone: '+966 55 120 9841',
      customWhatsapp: '+966 55 120 9841',
      customEmail: 'm.alarapy@finditqr-demo.com',
      customTelegram: '@m_alarapy',
    },
  },
  {
    id: 'item-car-keys',
    ownerUid: 'public-showcase',
    qrId: 'qr-keys-03',
    codeSerial: 'FQR-3195-DMM',
    name: 'ميدالية مفاتيح السيارة والمنزل',
    nameAr: 'ميدالية مفاتيح السيارة والمنزل',
    nameEn: 'Car & Residence Keyring Set',
    category: 'keys',
    imageUrl: '',
    status: 'Active',
    description: 'مفتاح سيارة ذكي أسود مع ميدالية Coral KeyFob المعدنية باللون المرجاني.',
    descriptionAr: 'مفتاح سيارة ذكي أسود مع ميدالية Coral KeyFob المعدنية باللون المرجاني.',
    descriptionEn: 'Black smart key fob attached to a coral anodized metal FindIt QR keychain.',
    recoveryInstructions:
      'حفاظًا على الخصوصية، يرجى إرسال رسالة عبر النموذج الآمن أو تيليجرام لتنسيق الالتقاء في مكان عام.',
    finderNoteAr:
      'حفاظًا على الخصوصية، يرجى إرسال رسالة عبر النموذج الآمن أو تيليجرام لتنسيق الالتقاء في مكان عام.',
    finderNoteEn:
      'For security, please send a message via the anonymous relay form below to arrange pickup at a public spot.',
    rewardOffered: false,
    rewardAmountTextAr: '',
    rewardAmountTextEn: '',
    city: 'الدمام',
    cityAr: 'الدمام',
    cityEn: 'Dammam',
    totalScans: 1,
    lastScanAt: '2026-11-02 11:05',
    createdAt: '2026-10-19',
    updatedAt: '2026-11-02',
    designId: 'design-coral-keyfob',
    contactChannels: {
      showPhone: false,
      showWhatsapp: false,
      showEmail: false,
      showTelegram: true,
      anonymousRelayOnly: true,
      customPhone: '+966 55 120 9841',
      customWhatsapp: '+966 55 120 9841',
      customEmail: 'm.alarapy@finditqr-demo.com',
      customTelegram: '@m_alarapy',
    },
  },
  {
    id: 'item-camera-kit',
    ownerUid: 'public-showcase',
    qrId: 'qr-camera-04',
    codeSerial: 'FQR-6042-RUH',
    name: 'حقيبة كاميرا احترافية — قسم الإنتاج',
    nameAr: 'حقيبة كاميرا احترافية — قسم الإنتاج',
    nameEn: 'Cinema Camera Field Case — Media Unit',
    category: 'commercial',
    imageUrl: '',
    status: 'Found',
    description: 'حقيبة معدات تصوير رمادية تحمل لوحة أصول الشركات المعدنية.',
    descriptionAr: 'حقيبة معدات تصوير رمادية تحمل لوحة أصول الشركات المعدنية.',
    descriptionEn: 'Gray padded camera equipment case fitted with an Enterprise Asset Shield QR plate.',
    recoveryInstructions:
      'هذه المعدات تابعة لفريق الإنتاج الإعلامي. يرجى التواصل مع منسق المعدات لاستلامها.',
    finderNoteAr: 'هذه المعدات تابعة لفريق الإنتاج الإعلامي. يرجى التواصل مع منسق المعدات لاستلامها.',
    finderNoteEn: 'This case belongs to our media production team. Please contact the equipment coordinator.',
    rewardOffered: false,
    rewardAmountTextAr: '',
    rewardAmountTextEn: '',
    city: 'الرياض',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    totalScans: 5,
    lastScanAt: '2026-11-15 21:10',
    createdAt: '2026-08-25',
    updatedAt: '2026-11-15',
    designId: 'design-enterprise-plate',
    contactChannels: {
      showPhone: true,
      showWhatsapp: true,
      showEmail: true,
      showTelegram: false,
      anonymousRelayOnly: false,
      customPhone: '+966 11 400 8899',
      customWhatsapp: '+966 55 120 9841',
      customEmail: 'assets@finditqr-demo.com',
      customTelegram: '',
    },
  },
];

export const INITIAL_QR_RECORDS: QrRecord[] = [
  {
    id: 'qr-macbook-01',
    serialNumber: 'FQR-4810-RYD',
    linkedItemId: 'item-macbook-pro',
    formatType: 'sticker',
    primaryColor: '#19B5A5',
    accentColor: '#17243A',
    badgeLabelAr: 'امسح لإعادة الجهاز',
    badgeLabelEn: 'SCAN TO RETURN',
    isActive: true,
    scansCount: 3,
    lastScannedLocationAr: 'الرياض — واجهة الرياض للأعمال',
    lastScannedLocationEn: 'Riyadh — Business Front District',
    createdAt: '2026-09-12',
  },
  {
    id: 'qr-luggage-02',
    serialNumber: 'FQR-7729-JED',
    linkedItemId: 'item-travel-bag',
    formatType: 'luggage_tag',
    primaryColor: '#2563EB',
    accentColor: '#FFD166',
    badgeLabelAr: 'مفقود؟ امسح للتواصل',
    badgeLabelEn: 'LOST? SCAN ME',
    isActive: true,
    scansCount: 7,
    lastScannedLocationAr: 'جدة — مطار الملك عبدالعزيز الدولي',
    lastScannedLocationEn: 'Jeddah — King Abdulaziz Intl Airport',
    createdAt: '2026-10-03',
  },
  {
    id: 'qr-keys-03',
    serialNumber: 'FQR-3195-DMM',
    linkedItemId: 'item-car-keys',
    formatType: 'keychain',
    primaryColor: '#FF8A65',
    accentColor: '#17243A',
    badgeLabelAr: 'تواصل آمن مع المالك',
    badgeLabelEn: 'OWNER CONTACT',
    isActive: true,
    scansCount: 1,
    lastScannedLocationAr: 'الدمام — الكورنيش',
    lastScannedLocationEn: 'Dammam — Waterfront',
    createdAt: '2026-10-19',
  },
  {
    id: 'qr-camera-04',
    serialNumber: 'FQR-6042-RUH',
    linkedItemId: 'item-camera-kit',
    formatType: 'metal_plate',
    primaryColor: '#17243A',
    accentColor: '#19B5A5',
    badgeLabelAr: 'عهدة مسجلة — FindIt QR',
    badgeLabelEn: 'ASSET TAG — SCAN',
    isActive: true,
    scansCount: 5,
    lastScannedLocationAr: 'الرياض — حي حطين',
    lastScannedLocationEn: 'Riyadh — Hittin District',
    createdAt: '2026-08-25',
  },
];

export const INITIAL_PURCHASES: PurchaseOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-2026-0841',
    titleAr: 'حزمة بطاقات السفر الذكية Voyager 3D (٣ قطع)',
    titleEn: 'Voyager 3D Smart Luggage Loop Pack (3 Units)',
    itemType: 'physical_tag_kit',
    status: 'architecture_preview',
    amountSar: 115,
    amountUsd: 31,
    date: '2026-11-01',
    quantity: 3,
    notesAr: 'نموذج معاينة لسجل الطلبات — نظام الدفع الفعلي سيُربط في المرحلة القادمة.',
    notesEn: 'Order history architecture preview — live payment gateway will be integrated in next phase.',
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-2026-0792',
    titleAr: 'مجموعة ملصقات الإيبوكسي للأجهزة Nano Shield (٥ قطع)',
    titleEn: 'Nano Shield Epoxy Device Sticker Set (5 Units)',
    itemType: 'design_pack',
    status: 'architecture_preview',
    amountSar: 89,
    amountUsd: 24,
    date: '2026-10-14',
    quantity: 5,
    notesAr: 'قالب تصميم مخصص جاهز للربط مع خدمة الطباعة والتوليد النهائي.',
    notesEn: 'Custom design template structured for final print generation service.',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationEntry[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLogEntry[] = [];

export const INITIAL_USER_PROFILE: UserProfile = {
  uid: '',
  displayName: '',
  displayNameAr: '',
  displayNameEn: '',
  email: '',
  photoURL: '',
  country: 'المملكة العربية السعودية',
  preferredLanguage: 'ar',
  plan: 'Free',
  accountStatus: 'active',
  activeItemsCount: 0,
  activeItemsLimit: 2,
  contactMethodsLimit: 2,
  lastQuotaItemId: '',
  createdAt: '',
  updatedAt: '',
  emailVerified: false,
  phone: '',
  whatsapp: '',
  telegram: '',
  cityAr: 'الرياض، المملكة العربية السعودية',
  cityEn: 'Riyadh, Saudi Arabia',
  accountType: 'personal',
  organizationNameAr: '',
  organizationNameEn: '',
  defaultLanguage: 'ar',
  joinedAt: '',
};

export const INITIAL_WORKSPACE_SETTINGS: WorkspaceSettings = {
  instantEmailAlerts: true,
  whatsappScanAlerts: true,
  requireFinderNoteBeforeContact: false,
  ShareCoarseLocationOnScan: true,
  defaultAnonymousMode: false,
  autoLockQrAfterRecovery: true,
};
