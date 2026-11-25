import { Language } from '../types/domain';

export interface TranslationDictionary {
  meta: {
    brandName: string;
    slogan: string;
    direction: 'rtl' | 'ltr';
    langLabel: string;
    switchLangLabel: string;
  };
  nav: {
    home: string;
    howItWorks: string;
    features: string;
    useCases: string;
    pricing: string;
    privacy: string;
    designStore: string;
    about: string;
    faq: string;
    contact: string;
    login: string;
    register: string;
    workspaceCta: string;
    foundDemoCta: string;
  };
  workspaceNav: {
    title: string;
    subtitle: string;
    dashboard: string;
    myItems: string;
    addItem: string;
    qrManager: string;
    sharedQrGroups: string;
    designLibrary: string;
    myPurchases: string;
    notifications: string;
    activity: string;
    profile: string;
    settings: string;
    plans: string;
    backToSite: string;
    foundationBadge: string;
    logout: string;
  };
  common: {
    createFreeAccount: string;
    exploreWorkspace: string;
    tryFinderScan: string;
    viewDetails: string;
    previewQr: string;
    saveChanges: string;
    cancel: string;
    confirm: string;
    deleteItem: string;
    archiveItem: string;
    reactivateItem: string;
    editItem: string;
    searchPlaceholder: string;
    allCategories: string;
    allStatuses: string;
    sortNewest: string;
    sortOldest: string;
    sortName: string;
    sortUpdated: string;
    stateSimulatorLabel: string;
    stateReady: string;
    stateLoading: string;
    stateEmpty: string;
    stateError: string;
    retryAction: string;
    darkMode: string;
    lightMode: string;
    foundationNoticeTitle: string;
    foundationNoticeDesc: string;
    firebaseReadyText: string;
    firebaseMissingText: string;
    configureFirebaseBtn: string;
  };
  categories: {
    electronics: string;
    bags: string;
    keys: string;
    documents: string;
    pets: string;
    vehicles: string;
    commercial: string;
  };
  statuses: {
    Active: string;
    Lost: string;
    Found: string;
    Recovered: string;
    Archived: string;
  };
  validation: {
    ITEM_NAME_REQUIRED: string;
    ITEM_NAME_LENGTH: string;
    ITEM_DESC_REQUIRED: string;
    ITEM_DESC_LENGTH: string;
    FINDER_NOTE_REQUIRED: string;
    AT_LEAST_ONE_CHANNEL_REQUIRED: string;
    INVALID_EMAIL_FORMAT: string;
    INVALID_IMAGE_URL: string;
    INVALID_PHOTO_URL: string;
    FINDER_NOTE_TOO_LONG: string;
    CITY_TOO_LONG: string;
    CONTACT_VALUE_TOO_LONG: string;
    REWARD_DETAIL_REQUIRED: string;
    QUOTA_LIMIT_REACHED: string;
    CONTACT_LIMIT_EXCEEDED: string;
    EMAIL_REQUIRED: string;
    INVALID_EMAIL: string;
    PASSWORD_REQUIRED: string;
    PASSWORD_TOO_SHORT: string;
    FULL_NAME_REQUIRED: string;
    COUNTRY_REQUIRED: string;
    TERMS_REQUIRED: string;
    NAME_REQUIRED: string;
    TOPIC_REQUIRED: string;
    MESSAGE_TOO_SHORT: string;
  };
  home: {
    kicker: string;
    heroTitle: string;
    heroSubtitle: string;
    primaryCta: string;
    secondaryCta: string;
    trustMetrics: Array<{ value: string; label: string; detail: string }>;
    stepsTitle: string;
    stepsSubtitle: string;
    steps: Array<{ number: string; title: string; desc: string }>;
    useCasesTitle: string;
    useCasesSubtitle: string;
    securityTitle: string;
    securitySubtitle: string;
    securityPoints: Array<{ title: string; desc: string }>;
    scanPreviewTitle: string;
    scanPreviewSubtitle: string;
    pricingSummaryTitle: string;
    pricingSummarySubtitle: string;
    faqTitle: string;
    faqSubtitle: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  ar: {
    meta: {
      brandName: 'FindIt QR',
      slogan: 'امسح. تواصل. استعد غرضك.',
      direction: 'rtl',
      langLabel: 'العربية',
      switchLangLabel: 'English',
    },
    nav: {
      home: 'الرئيسية',
      howItWorks: 'كيف تعمل؟',
      features: 'المميزات',
      useCases: 'حالات الاستخدام',
      pricing: 'الباقات',
      privacy: 'الخصوصية والأمان',
      designStore: 'مكتبة القوالب',
      about: 'عن المنصة',
      faq: 'الأسئلة الشائعة',
      contact: 'الدعم والتواصل',
      login: 'تسجيل الدخول',
      register: 'ابدأ مجانًا',
      workspaceCta: 'لوحة التحكم',
      foundDemoCta: 'معاينة المسح',
    },
    workspaceNav: {
      title: 'مساحة التحكم',
      subtitle: 'إدارة الممتلكات وأكواد QR',
      dashboard: 'لوحة المعلومات',
      myItems: 'أغراضي المسجلة',
      addItem: 'إضافة غرض جديد',
      qrManager: 'إدارة أكواد QR',
      sharedQrGroups: 'مجموعات QR المشترك',
      designLibrary: 'مكتبة التصاميم',
      myPurchases: 'مشترياتي',
      notifications: 'مركز الإشعارات',
      activity: 'سجل النشاط',
      profile: 'الملف الشخصي',
      settings: 'الإعدادات والخصوصية',
      plans: 'الباقات والترقية',
      backToSite: 'العودة للموقع التعريفي',
      foundationBadge: 'منصة FindIt QR — حماية واستعادة ذكية',
      logout: 'تسجيل الخروج',
    },
    common: {
      createFreeAccount: 'إنشاء حساب مجاني',
      exploreWorkspace: 'استعراض لوحة المستخدم',
      tryFinderScan: 'محاكاة مسح كود QR',
      viewDetails: 'عرض التفاصيل',
      previewQr: 'معاينة الكود',
      saveChanges: 'حفظ التغييرات',
      cancel: 'إلغاء',
      confirm: 'تأكيد الإجراء',
      deleteItem: 'حذف الغرض',
      archiveItem: 'أرشفة الغرض',
      reactivateItem: 'إعادة تفعيل الغرض',
      editItem: 'تعديل الغرض',
      searchPlaceholder: 'ابحث بالاسم أو الرقم التسلسلي أو المدينة...',
      allCategories: 'جميع الفئات',
      allStatuses: 'جميع الحالات',
      sortNewest: 'الأحدث أولًا',
      sortOldest: 'الأقدم أولًا',
      sortName: 'ترتيب أبجدي (الاسم)',
      sortUpdated: 'الأحدث تعديلًا',
      stateSimulatorLabel: 'معاينة حالات الواجهة:',
      stateReady: 'البيانات المعروضة',
      stateLoading: 'حالة التحميل (Loading)',
      stateEmpty: 'حالة الفراغ (Empty)',
      stateError: 'حالة الخطأ (Error)',
      retryAction: 'إعادة المحاولة',
      darkMode: 'الوضع الداكن',
      lightMode: 'الوضع الفاتح',
      foundationNoticeTitle: 'نظام FindIt QR المتكامل للأفراد والشركات',
      foundationNoticeDesc:
        'توثيق آمن للأغراض وأكواد QR القياسية، مع صفحة استعادة ثنائية اللغة ورسائل مكتشفين وتنبيهات فورية وحد باقة منضبط (غرضان نشطان مجانًا).',
      firebaseReadyText: 'جاهز للربط السحابي (Firebase)',
      firebaseMissingText: 'يعمل بقاعدة بيانات الخادم المحلية المستمرة',
      configureFirebaseBtn: 'حالة الربط السحابي',
    },
    categories: {
      electronics: 'أجهزة إلكترونية',
      bags: 'حقائب وأمتعة سفر',
      keys: 'مفاتيح وميداليات',
      documents: 'محافظ ومستندات',
      pets: 'حيوانات أليفة',
      vehicles: 'دراجات ومركبات',
      commercial: 'أصول ومعدات تجارية',
    },
    statuses: {
      Active: 'نشط',
      Lost: 'مفقود',
      Found: 'تم العثور عليه',
      Recovered: 'تمت استعادته',
      Archived: 'مؤرشف',
    },
    validation: {
      ITEM_NAME_REQUIRED: 'يرجى إدخال اسم واضح للغرض.',
      ITEM_NAME_LENGTH: 'يجب أن يتراوح اسم الغرض بين حرفين و٨٠ حرفًا.',
      ITEM_DESC_REQUIRED: 'يرجى كتابة وصف موجز للغرض يساعد في تمييزه.',
      ITEM_DESC_LENGTH: 'الوصف يجب أن يكون بين ٥ أحرف و٤٠٠ حرف.',
      FINDER_NOTE_REQUIRED: 'يرجى كتابة رسالة تظهر لمن يعثر على الغرض.',
      AT_LEAST_ONE_CHANNEL_REQUIRED:
        'يرجى تفعيل وسيلة تواصل واحدة على الأقل أو اختيار الوسيط الآمن المجهول.',
      INVALID_EMAIL_FORMAT: 'صيغة البريد الإلكتروني غير صحيحة.',
      INVALID_IMAGE_URL: 'يرجى إدخال رابط صورة صحيح يبدأ بـ https:// أو تركه فارغًا.',
      INVALID_PHOTO_URL: 'يرجى إدخال رابط صورة شخصية صحيح يبدأ بـ https:// أو تركه فارغًا.',
      FINDER_NOTE_TOO_LONG: 'يجب ألا تتجاوز تعليمات الاسترجاع ١٠٠٠ حرف.',
      CITY_TOO_LONG: 'يجب ألا يتجاوز اسم المدينة أو الدولة ٨٠ حرفًا.',
      CONTACT_VALUE_TOO_LONG: 'قيمة وسيلة التواصل طويلة جدًا.',
      REWARD_DETAIL_REQUIRED: 'يرجى تحديد قيمة أو تفاصيل المكافأة المعلنة.',
      QUOTA_LIMIT_REACHED:
        'لقد وصلت إلى الحد الأقصى للباقة المجانية (غرضان نشطان). يرجى أرشفة أحد أغراضك النشطة لإضافة أو تفعيل غرض جديد.',
      CONTACT_LIMIT_EXCEEDED:
        'تسمح باقتك الحالية بتفعيل وسيلتي تواصل مباشرتين كحد أقصى (Starter: 2، Plus: 3، Premium: 5، Pro: 7). يرجى إلغاء تحديد وسيلة إضافية.',
      EMAIL_REQUIRED: 'البريد الإلكتروني مطلوب.',
      INVALID_EMAIL: 'يرجى إدخال بريد إلكتروني صحيح.',
      PASSWORD_REQUIRED: 'كلمة المرور مطلوبة.',
      PASSWORD_TOO_SHORT: 'يجب ألا تقل كلمة المرور عن ٨ خانات.',
      FULL_NAME_REQUIRED: 'يرجى إدخال الاسم الكامل (حرفين على الأقل).',
      COUNTRY_REQUIRED: 'يرجى إدخال الدولة.',
      TERMS_REQUIRED: 'يجب الموافقة على شروط الخدمة وسياسة الخصوصية.',
      NAME_REQUIRED: 'يرجى إدخال الاسم الكامل.',
      TOPIC_REQUIRED: 'يرجى اختيار موضوع الرسالة.',
      MESSAGE_TOO_SHORT: 'يرجى كتابة تفاصيل الرسالة (١٠ أحرف على الأقل).',
    },
    home: {
      kicker: 'منصة عالمية لحماية الممتلكات الشخصية والتجارية',
      heroTitle: 'اربط أغراضك بكود QR ذكي يعيدها إليك بأمان وخصوصية.',
      heroSubtitle:
        'تمكّنك FindIt QR من إنشاء أكواد QR فريدة لمفاتيحك، حقائبك، أجهزتك، وأصول شركتك. عند مسح الكود بهاتف أي عابر، تفتح صفحة تواصل فورية تحمي هويتك وتسرّع استعادة مفقوداتك بدون الحاجة لتطبيق خاص.',
      primaryCta: 'إنشاء حساب مجاني',
      secondaryCta: 'معاينة تجربة العثور على غرض',
      trustMetrics: [
        {
          value: '٠ تطبيقات مطلوبة',
          label: 'يعمل بكاميرا أي هاتف ذكي',
          detail: 'مسح مباشر عبر المتصفح في أقل من ثانيتين',
        },
        {
          value: '١٠٠٪ تحكم بالخصوصية',
          label: 'إخفاء أو إظهار قنوات التواصل',
          detail: 'تغيير الحالة لحظيًا بين نشط ومفقود ومؤرشف',
        },
        {
          value: '٢ لغتان مدعومتان',
          label: 'واجهة عربية وإنجليزية متكاملة',
          detail: 'تجربة واضحة للمالك ولمن يعثر على الغرض حول العالم',
        },
      ],
      stepsTitle: 'كيف تعمل FindIt QR في ثلاث خطوات عملية؟',
      stepsSubtitle:
        'صممنا رحلة الاستخدام لتكون بديهية للمبتدئ وسريعة الاستجابة عند فقدان أي غرض.',
      steps: [
        {
          number: '01',
          title: 'سجّل الغرض وخصّص كود QR',
          desc: 'أضف بيانات الغرض في حسابك، واختر قنوات التواصل المسموح بظهورها (واتساب، اتصال، بريد، أو تواصل وسيط دون إظهار رقمك)، ثم اختر قالب الملصق أو الميدالية.',
        },
        {
          number: '02',
          title: 'ثبّت الملصق أو الميدالية على ممتلكاتك',
          desc: 'اطبع الكود أو اطلب ملصقات إيبوكسي وميداليات معدنية مقاومة للماء والخدش لتثبيتها على الحقائب، الحواسيب، المفاتيح، أو أطواق الحيوانات الأليفة.',
        },
        {
          number: '03',
          title: 'يمسح المكتشف الكود ويتواصل معك فورًا',
          desc: 'عندما يعثر شخص على غرضك، يوجّه كاميرا هاتفه نحو الكود فتظهر له رسالتك المخصصة ووسائل التواصل التي سمحت بها لإعادة الغرض بأمان.',
        },
      ],
      useCasesTitle: 'مصممة لحماية كل ما يهمك في حياتك اليومية وعملك',
      useCasesSubtitle:
        'تغطي المنصة الاحتياجات الفردية والعائلية بالإضافة إلى إدارة عهد ومعدات الشركات.',
      securityTitle: 'أمان وخصوصية تمنحك راحة البال الكاملة',
      securitySubtitle:
        'لا نطلب منك كتابة رقم هاتفك مطبوعًا على الحقيبة أمام الجميع؛ بياناتك تبقى خلف طبقة تحكم رقمية تديرها أنت.',
      securityPoints: [
        {
          title: 'تبديل فوري لحالة الكود',
          desc: 'يمكنك أرشفة الغرض أثناء عدم الحاجة إليه، وتفعيل وضع "مفقود" مع رسالة استعادة عند ضياعه فقط.',
        },
        {
          title: 'حماية الأرقام الشخصية',
          desc: 'اختر إظهار واتساب أو البريد فقط، أو استخدم نموذج المراسلة الوسيط دون كشف رقم هاتفك الشخصي.',
        },
        {
          title: 'سجل مسح جغرافي واضح',
          desc: 'تابع تاريخ ووقت كل عملية مسح للكود مع إمكانية استلام الموقع التقريبي الذي يشاركه المكتشف طوعًا.',
        },
      ],
      scanPreviewTitle: 'معاينة حية: ماذا يرى الشخص الذي يمسح الكود؟',
      scanPreviewSubtitle:
        'جرّب التفاعل مع شاشة المكتشف أدناه لترى كيف تظهر بيانات الغرض المفقود بوضوح واحترافية.',
      pricingSummaryTitle: 'باقات مرنة للأفراد والعائلات والشركات',
      pricingSummarySubtitle:
        'ابدأ مجانًا لتجربة النظام الأساسي، وتوسع مع نمو عدد ممتلكاتك أو أصول فريقك.',
      faqTitle: 'إجابات وافية لأبرز الأسئلة الشائعة',
      faqSubtitle:
        'كل ما تحتاج معرفته حول آلية عمل الأكواد، الخصوصية، وطرق الاستخدام.',
    },
  },
  en: {
    meta: {
      brandName: 'FindIt QR',
      slogan: 'Scan. Connect. Return.',
      direction: 'ltr',
      langLabel: 'English',
      switchLangLabel: 'العربية',
    },
    nav: {
      home: 'Home',
      howItWorks: 'How It Works',
      features: 'Features',
      useCases: 'Use Cases',
      pricing: 'Pricing',
      privacy: 'Privacy & Security',
      designStore: 'Template Library',
      about: 'About',
      faq: 'FAQ',
      contact: 'Support',
      login: 'Sign In',
      register: 'Start Free',
      workspaceCta: 'Dashboard',
      foundDemoCta: 'Scan Preview',
    },
    workspaceNav: {
      title: 'User Workspace',
      subtitle: 'Property & Smart QR Control',
      dashboard: 'Dashboard',
      myItems: 'My Items',
      addItem: 'Add New Item',
      qrManager: 'QR Manager',
      sharedQrGroups: 'Shared QR Groups',
      designLibrary: 'Design Library',
      myPurchases: 'My Purchases',
      notifications: 'Notifications',
      activity: 'Activity Log',
      profile: 'Profile',
      settings: 'Settings & Privacy',
      plans: 'Plans & Tiers',
      backToSite: 'Back to Public Website',
      foundationBadge: 'FindIt QR Cloud — Smart Asset Recovery',
      logout: 'Sign Out',
    },
    common: {
      createFreeAccount: 'Create Free Account',
      exploreWorkspace: 'Open User Workspace',
      tryFinderScan: 'Simulate QR Scan',
      viewDetails: 'View Details',
      previewQr: 'Preview QR',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      confirm: 'Confirm Action',
      deleteItem: 'Delete Item',
      archiveItem: 'Archive Item',
      reactivateItem: 'Reactivate Item',
      editItem: 'Edit Item',
      searchPlaceholder: 'Search by item name, serial code, or city...',
      allCategories: 'All Categories',
      allStatuses: 'All Statuses',
      sortNewest: 'Newest First',
      sortOldest: 'Oldest First',
      sortName: 'Alphabetical (Name)',
      sortUpdated: 'Recently Updated',
      stateSimulatorLabel: 'Inspect UI View States:',
      stateReady: 'Populated State',
      stateLoading: 'Loading State',
      stateEmpty: 'Empty State',
      stateError: 'Error State',
      retryAction: 'Retry Operation',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      foundationNoticeTitle: 'FindIt QR Integrated Recovery Platform',
      foundationNoticeDesc:
        'Full property management, standard ISO 18004 QR tags, bilingual recovery pages, finder messaging, and tier quota enforcement (2 active items free).',
      firebaseReadyText: 'Cloud Config Ready (Firebase)',
      firebaseMissingText: 'Active Server Persistence Layer',
      configureFirebaseBtn: 'Cloud Connection Info',
    },
    categories: {
      electronics: 'Electronics & Devices',
      bags: 'Luggage & Bags',
      keys: 'Keys & Fobs',
      documents: 'Wallets & Documents',
      pets: 'Pets & Collars',
      vehicles: 'Bikes & Mobility',
      commercial: 'Commercial IT Assets',
    },
    statuses: {
      Active: 'Active',
      Lost: 'Lost',
      Found: 'Found',
      Recovered: 'Recovered',
      Archived: 'Archived',
    },
    validation: {
      ITEM_NAME_REQUIRED: 'Please enter a clear item name.',
      ITEM_NAME_LENGTH: 'Item name must be between 2 and 80 characters.',
      ITEM_DESC_REQUIRED: 'Please provide a brief description to help identify the item.',
      ITEM_DESC_LENGTH: 'Description must be between 5 and 400 characters.',
      FINDER_NOTE_REQUIRED: 'Please write a message displayed to the person who finds this item.',
      AT_LEAST_ONE_CHANNEL_REQUIRED:
        'Enable at least one direct contact channel or select Anonymous Relay mode.',
      INVALID_EMAIL_FORMAT: 'Please enter a valid email address format.',
      INVALID_IMAGE_URL: 'Please enter a valid https:// image URL or leave blank.',
      INVALID_PHOTO_URL: 'Please enter a valid https:// profile photo URL or leave blank.',
      FINDER_NOTE_TOO_LONG: 'Recovery instructions must be 1000 characters or fewer.',
      CITY_TOO_LONG: 'City or country name must be 80 characters or fewer.',
      CONTACT_VALUE_TOO_LONG: 'Contact channel value is too long.',
      REWARD_DETAIL_REQUIRED: 'Please specify the offered appreciation reward details.',
      QUOTA_LIMIT_REACHED:
        'You have reached the Free Plan limit (2 active items). Archive an active item first to add or reactivate another item.',
      CONTACT_LIMIT_EXCEEDED:
        'Your current plan allows up to 2 direct contact methods (Starter: 2, Plus: 3, Premium: 5, Pro: 7). Please uncheck an extra method.',
      EMAIL_REQUIRED: 'Email address is required.',
      INVALID_EMAIL: 'Please enter a valid email address.',
      PASSWORD_REQUIRED: 'Password is required.',
      PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',
      FULL_NAME_REQUIRED: 'Please enter your full name (at least 2 characters).',
      COUNTRY_REQUIRED: 'Please enter your country.',
      TERMS_REQUIRED: 'You must accept the terms of service and privacy policy.',
      NAME_REQUIRED: 'Please enter your full name.',
      TOPIC_REQUIRED: 'Please select an inquiry topic.',
      MESSAGE_TOO_SHORT: 'Please enter at least 10 characters in your message.',
    },
    home: {
      kicker: 'Global Smart Property Protection & Recovery Platform',
      heroTitle: 'Link your belongings to unique QR tags that bring them back safely.',
      heroSubtitle:
        'FindIt QR enables individuals and teams to attach unique QR codes to keys, luggage, laptops, and commercial equipment. Anyone who finds your item simply scans the tag with their phone camera to reach your approved contact channels.',
      primaryCta: 'Create Free Account',
      secondaryCta: 'Preview Finder Scan Experience',
      trustMetrics: [
        {
          value: '0 Apps Required',
          label: 'Works with any smartphone camera',
          detail: 'Instant browser scan resolution in under 2 seconds',
        },
        {
          value: '100% Privacy Control',
          label: 'Toggle visible contact channels anytime',
          detail: 'Switch between Active, Lost, or Archived states instantly',
        },
        {
          value: '2 Native Languages',
          label: 'Full Arabic RTL & English LTR support',
          detail: 'Clear recovery instructions for finders worldwide',
        },
      ],
      stepsTitle: 'How FindIt QR Works in Three Practical Steps',
      stepsSubtitle:
        'Designed to be effortless for first-time users and dependable when an item goes missing.',
      steps: [
        {
          number: '01',
          title: 'Register Your Item & Customize Your QR',
          desc: 'Add your item details, choose which contact methods to reveal (WhatsApp, phone, email, or anonymous relay), and select a tag design.',
        },
        {
          number: '02',
          title: 'Attach the Tag or Sticker to Your Property',
          desc: 'Apply weather-resistant epoxy stickers, metal keychains, or luggage loops to backpacks, laptops, keys, cameras, or pet collars.',
        },
        {
          number: '03',
          title: 'Finder Scans & Connects Instantly',
          desc: 'When someone finds your item, scanning the QR code opens your custom recovery note and approved contact buttons without exposing hidden personal data.',
        },
      ],
      useCasesTitle: 'Built for Personal Valuables and Commercial Equipment',
      useCasesSubtitle:
        'From daily carry essentials and travel gear to corporate IT asset fleets.',
      securityTitle: 'Privacy-First Architecture You Control',
      securitySubtitle:
        'Never print your personal phone number openly on a luggage tag again. Keep your identity behind a configurable digital layer.',
      securityPoints: [
        {
          title: 'Instant Tag State Switching',
          desc: 'Archive items when not in use and switch to Lost Mode with an optional reward banner only when needed.',
        },
        {
          title: 'Selective Channel Visibility',
          desc: 'Show only WhatsApp or Telegram, or route messages through a privacy-preserving relay form.',
        },
        {
          title: 'Transparent Scan Activity Log',
          desc: 'Review timestamps and voluntary finder check-ins whenever one of your registered QR codes is scanned.',
        },
      ],
      scanPreviewTitle: 'Live Preview: What Does the Finder See Upon Scanning?',
      scanPreviewSubtitle:
        'Interact with the simulated finder screen below to inspect how owner instructions and privacy rules work.',
      pricingSummaryTitle: 'Clear Plans for Individuals, Families, and Businesses',
      pricingSummarySubtitle:
        'Start free with core QR registration and scale as your protected inventory grows.',
      faqTitle: 'Frequently Asked Questions',
      faqSubtitle:
        'Clear answers about QR durability, finder privacy, and account architecture.',
    },
  },
};
