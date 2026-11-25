import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Briefcase,
  CreditCard,
  HelpCircle,
  Layers,
  LifeBuoy,
  MessageSquarePlus,
  Palette,
  PhoneCall,
  PlusCircle,
  Printer,
  QrCode,
  Settings,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RouteId, WorkspacePageId } from '../../types/domain';

interface RelatedActionCard {
  id: string;
  route: RouteId;
  params?: {
    itemId?: string;
    designId?: string;
    groupId?: string;
    groupType?: 'org' | 'shared';
    tab?: string;
  };
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: React.FC<{ className?: string }>;
}

export const SmartRelatedServices: React.FC<{
  currentPage: WorkspacePageId;
  contextItemId?: string;
  contextDesignId?: string;
  contextGroupId?: string;
  contextGroupType?: 'org' | 'shared';
}> = ({
  currentPage,
  contextItemId,
  contextDesignId,
  contextGroupId,
  contextGroupType,
}) => {
  const { lang, navigate, isRtl, selectedItemId, selectedDesignId } = useApp();
  const effectiveItemId = contextItemId || selectedItemId;
  const effectiveDesignId = contextDesignId || selectedDesignId;

  const catalog: Record<WorkspacePageId, RelatedActionCard[]> = {
    dashboard: [
      {
        id: 'add-item',
        route: 'add-item',
        titleAr: 'إضافة غرض جديد',
        titleEn: 'Register New Item',
        descAr: 'اربط غرضًا بكود QR فريد وغلاف ذكي في خطوات واضحة.',
        descEn: 'Register a belonging with a unique QR code and smart cover.',
        icon: PlusCircle,
      },
      {
        id: 'groups',
        route: 'groups',
        titleAr: 'إدارة المجموعات',
        titleEn: 'Manage Groups',
        descAr: 'نظّم مقتنياتك أو فعّل رمز QR مشترك للمجموعة.',
        descEn: 'Organize items or configure a Shared QR Group.',
        icon: Layers,
      },
      {
        id: 'print-studio',
        route: 'print-studio',
        params: effectiveItemId ? { itemId: effectiveItemId } : undefined,
        titleAr: 'استوديو الطباعة',
        titleEn: 'Print Studio',
        descAr: 'صمّم وجهّز ملصق QR بدقة 300 DPI جاهزة للطباعة.',
        descEn: 'Configure a 300 DPI print-ready QR tag for your items.',
        icon: Printer,
      },
      {
        id: 'contact-methods',
        route: 'contact-methods',
        titleAr: 'طرق التواصل المركزية',
        titleEn: 'Central Contact Methods',
        descAr: 'أدر قنوات التواصل المرتبطة بجميع أغراضك من مكان واحد.',
        descEn: 'Manage reusable contact channels across all items.',
        icon: PhoneCall,
      },
    ],
    'my-items': [
      {
        id: 'add-item',
        route: 'add-item',
        titleAr: 'تسجيل غرض إضافي',
        titleEn: 'Add New Item',
        descAr: 'أضف غرضًا جديدًا واختر قالبه وطرق تواصله.',
        descEn: 'Create an item with template and contact preferences.',
        icon: PlusCircle,
      },
      {
        id: 'groups',
        route: 'groups',
        titleAr: 'تنظيم في مجموعات',
        titleEn: 'Organize in Groups',
        descAr: 'صنّف الأغراض في مجموعات تنظيمية أو مجموعات QR المشترك.',
        descEn: 'Assign items to Organizational or Shared QR groups.',
        icon: Layers,
      },
      {
        id: 'qr-manager',
        route: 'qr-manager',
        titleAr: 'مركز رموز QR',
        titleEn: 'QR Code Manager',
        descAr: 'تحكم في حالة رموز QR الفردية والمشتركة ومعاينتها.',
        descEn: 'Manage active individual and shared QR badges.',
        icon: QrCode,
      },
      {
        id: 'print-studio',
        route: 'print-studio',
        params: effectiveItemId ? { itemId: effectiveItemId } : undefined,
        titleAr: 'طباعة ملصق',
        titleEn: 'Print Tag Label',
        descAr: 'اطبع بطاقة الغرض من استوديو الطباعة التفاعلي.',
        descEn: 'Export high-resolution print sheets in Print Studio.',
        icon: Printer,
      },
    ],
    'add-item': [
      {
        id: 'design-library',
        route: 'design-library',
        titleAr: 'مكتبة الـ 58 قالبًا',
        titleEn: '58-Template Library',
        descAr: 'تصفح جميع القوالب المجانية والاحترافية قبل الاختيار.',
        descEn: 'Explore all 58 printable tag templates before binding.',
        icon: Palette,
      },
      {
        id: 'contact-methods',
        route: 'contact-methods',
        titleAr: 'إعداد وسائل التواصل',
        titleEn: 'Setup Contact Channels',
        descAr: 'أضف أو حدّث رقمًا أو رابط تواصل ليظهر في الخيارات.',
        descEn: 'Add or update numbers and links for instant item linking.',
        icon: PhoneCall,
      },
      {
        id: 'groups',
        route: 'groups',
        titleAr: 'المجموعات التنظيمية',
        titleEn: 'Groups Directory',
        descAr: 'أنشئ مجموعة لربط الغرض بها أثناء التسجيل.',
        descEn: 'Create a group to organize your upcoming items.',
        icon: Layers,
      },
    ],
    'item-details': [
      {
        id: 'qr-preview',
        route: 'qr-preview',
        params: effectiveItemId ? { itemId: effectiveItemId } : undefined,
        titleAr: 'معاينة رمز QR',
        titleEn: 'Inspect QR Tag',
        descAr: 'اعرض رمز QR الحالي وتحقق من صفحة الاسترداد العامة.',
        descEn: 'View QR badge status and test public recovery preview.',
        icon: QrCode,
      },
      {
        id: 'print-studio',
        route: 'print-studio',
        params: effectiveItemId ? { itemId: effectiveItemId } : undefined,
        titleAr: 'فتح في استوديو الطباعة',
        titleEn: 'Open in Print Studio',
        descAr: 'خصص العبارات والمقاس وتأكد من فحص الجاهزية قبل الطباعة.',
        descEn: 'Customize callout, dimensions, and run preflight checks.',
        icon: Printer,
      },
      {
        id: 'contact-methods',
        route: 'contact-methods',
        titleAr: 'تعديل قنوات التواصل',
        titleEn: 'Manage Contact Methods',
        descAr: 'أي تعديل في طرق التواصل ينعكس على هذا الغرض مباشرة.',
        descEn: 'Updates to central contacts propagate directly to this item.',
        icon: PhoneCall,
      },
      {
        id: 'privacy-security',
        route: 'privacy-security',
        titleAr: 'إعدادات الخصوصية والأمان',
        titleEn: 'Privacy & Security Hub',
        descAr: 'راجع سياسات إخفاء المدينة والبيانات الشخصية لجميع أغراضك.',
        descEn: 'Review coarse-city and PII-free settings across your account.',
        icon: Shield,
      },
    ],
    groups: [
      {
        id: 'my-items',
        route: 'my-items',
        titleAr: 'قائمة أغراضي',
        titleEn: 'My Items List',
        descAr: 'استعرض جميع المقتنيات وافصل أو انقل بين المجموعات.',
        descEn: 'View all registered items and adjust group assignments.',
        icon: Briefcase,
      },
      {
        id: 'qr-manager',
        route: 'qr-manager',
        titleAr: 'إدارة رموز QR',
        titleEn: 'QR Code Manager',
        descAr: 'راقب الرموز الفردية الموقوفة تلقائيًا عند تفعيل QR المشترك.',
        descEn: 'Monitor individual QRs paused while linked to Shared QR.',
        icon: QrCode,
      },
      {
        id: 'analytics',
        route: 'analytics',
        titleAr: 'تحليلات أداء المجموعات',
        titleEn: 'Group Analytics',
        descAr: 'قارن مرات المسح والتفاعل للمجموعات المشتركة والتنظيمية.',
        descEn: 'Compare scans across Shared QR and Organizational groups.',
        icon: BarChart3,
      },
    ],
    'shared-qr-groups': [
      {
        id: 'groups',
        route: 'groups',
        titleAr: 'مركز المجموعات الموحد',
        titleEn: 'Unified Groups Hub',
        descAr: 'تنقّل بين المجموعات التنظيمية ومجموعات QR المشترك بسهولة.',
        descEn: 'Switch between Organizational and Shared QR groups.',
        icon: Layers,
      },
      {
        id: 'qr-manager',
        route: 'qr-manager',
        titleAr: 'إدارة رموز QR',
        titleEn: 'QR Code Manager',
        descAr: 'أعد تفعيل الرمز الفردي لأي غرض عند فصله من المجموعة.',
        descEn: 'Restore individual QRs cleanly when items leave a group.',
        icon: QrCode,
      },
      {
        id: 'analytics',
        route: 'analytics',
        titleAr: 'إحصائيات المسح',
        titleEn: 'Scan Analytics',
        descAr: 'تابع مرات مسح كل مجموعة QR مشتركة بالأرقام الحقيقية.',
        descEn: 'Track genuine scan metrics per Shared QR group.',
        icon: BarChart3,
      },
    ],
    'group-details': [
      {
        id: 'groups',
        route: 'groups',
        params: contextGroupType ? { tab: contextGroupType } : undefined,
        titleAr: 'العودة لكل المجموعات',
        titleEn: 'All Groups Hub',
        descAr: 'تصفح أو أنشئ مجموعة تنظيمية أو مجموعة QR مشترك جديدة.',
        descEn: 'Browse or create organizational and shared QR groups.',
        icon: Layers,
      },
      {
        id: 'my-items',
        route: 'my-items',
        titleAr: 'إدارة الأغراض',
        titleEn: 'Manage Items',
        descAr: 'افتح تفاصيل أي غرض أو عدّل حالة التفعيل والخصوصية.',
        descEn: 'Inspect item details, cover images, and privacy flags.',
        icon: Briefcase,
      },
      {
        id: 'print-studio',
        route: 'print-studio',
        params: effectiveItemId ? { itemId: effectiveItemId } : undefined,
        titleAr: 'استوديو الطباعة',
        titleEn: 'Print Studio',
        descAr: 'طباعة ملصقات QR للأغراض الفردية بجودة إنتاجية.',
        descEn: 'Prepare production-ready QR print tags.',
        icon: Printer,
      },
    ],
    'qr-manager': [
      {
        id: 'print-studio',
        route: 'print-studio',
        params: effectiveItemId ? { itemId: effectiveItemId } : undefined,
        titleAr: 'استوديو الطباعة',
        titleEn: 'Print Studio',
        descAr: 'تخصيص الملصق والتحقق من جاهزية الطباعة بدقة 300 DPI.',
        descEn: 'Customize label and verify 300 DPI print readiness.',
        icon: Printer,
      },
      {
        id: 'groups',
        route: 'groups',
        params: { tab: 'shared' },
        titleAr: 'مجموعات QR المشترك',
        titleEn: 'Shared QR Groups',
        descAr: 'أنشئ رمز QR واحدًا يجمع عدة مقتنيات دون تعارض.',
        descEn: 'Manage conflict-free multi-item Shared QR codes.',
        icon: Layers,
      },
      {
        id: 'analytics',
        route: 'analytics',
        titleAr: 'إحصائيات المسح',
        titleEn: 'Scan Analytics',
        descAr: 'حلّل المسحات والتنبيهات الواردة من صفحات الاسترداد.',
        descEn: 'Analyze genuine scans and recovery alerts.',
        icon: BarChart3,
      },
    ],
    'qr-preview': [
      {
        id: 'print-studio',
        route: 'print-studio',
        params: effectiveItemId ? { itemId: effectiveItemId } : undefined,
        titleAr: 'تخصيص وطباعة الملصق',
        titleEn: 'Customize & Print Tag',
        descAr: 'انتقل مباشرة إلى استوديو الطباعة لهذا الغرض.',
        descEn: 'Jump directly into Print Studio bound to this item.',
        icon: Printer,
      },
      {
        id: 'item-details',
        route: 'item-details',
        params: effectiveItemId ? { itemId: effectiveItemId } : undefined,
        titleAr: 'تعديل بيانات الغرض',
        titleEn: 'Edit Item Details',
        descAr: 'حدث الوصف أو الغلاف أو القنوات الظاهرة للمكتشف.',
        descEn: 'Update cover, note, or contact methods for this item.',
        icon: Briefcase,
      },
      {
        id: 'qr-manager',
        route: 'qr-manager',
        titleAr: 'كافة رموز QR',
        titleEn: 'All QR Codes',
        descAr: 'اعرض كل رموز الحساب الفردية والمشتركة في جدول واحد.',
        descEn: 'Manage all individual and shared QR codes.',
        icon: QrCode,
      },
    ],
    'design-library': [
      {
        id: 'template-details',
        route: 'template-details',
        params: effectiveDesignId ? { designId: effectiveDesignId } : undefined,
        titleAr: 'تفاصيل القالب المحدد',
        titleEn: 'Inspect Template Details',
        descAr: 'استعرض صور العرض الأربع ومواصفات القص والطباعة الكاملة.',
        descEn: 'Review all 4 showcase views and print specifications.',
        icon: Sparkles,
      },
      {
        id: 'print-studio',
        route: 'print-studio',
        params: {
          ...(effectiveDesignId ? { designId: effectiveDesignId } : {}),
          ...(effectiveItemId ? { itemId: effectiveItemId } : {}),
        },
        titleAr: 'تجربة في استوديو الطباعة',
        titleEn: 'Launch Print Studio',
        descAr: 'اربط القالب بغرضك وعاين النتيجة قبل الشراء أو الطباعة.',
        descEn: 'Bind your item QR and run print preflight checks.',
        icon: Printer,
      },
      {
        id: 'my-purchases',
        route: 'my-purchases',
        titleAr: 'مشترياتي وتراخيصي',
        titleEn: 'My Licenses & Orders',
        descAr: 'راجع القوالب المملوكة وحالة طلبات الترقية والشراء.',
        descEn: 'Check owned template licenses and order approvals.',
        icon: CreditCard,
      },
    ],
    'template-details': [
      {
        id: 'print-studio',
        route: 'print-studio',
        params: {
          ...(effectiveDesignId ? { designId: effectiveDesignId } : {}),
          ...(effectiveItemId ? { itemId: effectiveItemId } : {}),
        },
        titleAr: 'فتح القالب في استوديو الطباعة',
        titleEn: 'Open in Print Studio',
        descAr: 'خصص النص المسموح واربط رمز QR الحقيقي وصدّر للطباعة.',
        descEn: 'Bind an item QR and export print-ready output.',
        icon: Printer,
      },
      {
        id: 'add-item',
        route: 'add-item',
        params: effectiveDesignId ? { designId: effectiveDesignId } : undefined,
        titleAr: 'إنشاء غرض بهذا القالب',
        titleEn: 'Use for New Item',
        descAr: 'ابدأ تسجيل غرض جديد مع تحديد هذا القالب تلقائيًا.',
        descEn: 'Start registering a new item pre-bound to this template.',
        icon: PlusCircle,
      },
      {
        id: 'design-library',
        route: 'design-library',
        titleAr: 'العودة لمكتبة القوالب',
        titleEn: 'Back to Template Library',
        descAr: 'قارن بين الـ 58 قالبًا وابحث بالتصنيف أو الملكية.',
        descEn: 'Filter and compare all 58 templates by ownership or tier.',
        icon: Palette,
      },
    ],
    'print-studio': [
      {
        id: 'design-library',
        route: 'design-library',
        titleAr: 'اختيار قالب آخر',
        titleEn: 'Browse Templates',
        descAr: 'استكشف الـ 58 قالبًا في المكتبة وبدّل التصميم فورًا.',
        descEn: 'Switch between 58 free and premium templates instantly.',
        icon: Palette,
      },
      {
        id: 'qr-manager',
        route: 'qr-manager',
        titleAr: 'إدارة حالة رموز QR',
        titleEn: 'Manage QR Status',
        descAr: 'تحقق من حالة تفعيل الغرض إذا أوقف فحص الجاهزية التصدير.',
        descEn: 'Restore or verify active individual QR status if blocked.',
        icon: QrCode,
      },
      {
        id: 'plans',
        route: 'plans',
        titleAr: 'ترقية الباقة للطباعة الكاملة',
        titleEn: 'Upgrade for Full Library',
        descAr: 'افتح القوالب المدفوعة وميزات التصدير الإنتاجية.',
        descEn: 'Unlock paid templates and production export licenses.',
        icon: CreditCard,
      },
    ],
    analytics: [
      {
        id: 'qr-manager',
        route: 'qr-manager',
        titleAr: 'إدارة رموز QR',
        titleEn: 'QR Code Manager',
        descAr: 'تحكم سريع في رموز الأغراض الأعلى مسحًا.',
        descEn: 'Manage your most-scanned individual and shared QRs.',
        icon: QrCode,
      },
      {
        id: 'notifications',
        route: 'notifications',
        titleAr: 'مركز الإشعارات',
        titleEn: 'Notification Center',
        descAr: 'راجع الرسائل الواردة وبلاغات العثور على المقتنيات.',
        descEn: 'Review incoming finder alerts and recovery reports.',
        icon: Bell,
      },
      {
        id: 'groups',
        route: 'groups',
        titleAr: 'تحليل المجموعات',
        titleEn: 'Inspect Groups',
        descAr: 'عرض تفاصيل المجموعات التنظيمية والمشتركة.',
        descEn: 'Open group management and visibility controls.',
        icon: Layers,
      },
    ],
    activity: [
      {
        id: 'analytics',
        route: 'analytics',
        titleAr: 'الرسوم البيانية والإحصائيات',
        titleEn: 'Visual Analytics',
        descAr: 'اطلع على توزيع المسح والتقارير الزمنية والتصدير CSV.',
        descEn: 'Explore timeframe scan metrics and CSV export.',
        icon: BarChart3,
      },
      {
        id: 'notifications',
        route: 'notifications',
        titleAr: 'التنبيهات الواردة',
        titleEn: 'Notifications',
        descAr: 'تحقق من إشعارات المسح والرسائل الجديدة.',
        descEn: 'View scan notifications and finder messages.',
        icon: Bell,
      },
    ],
    plans: [
      {
        id: 'my-purchases',
        route: 'my-purchases',
        titleAr: 'طلبات الدفع والتراخيص',
        titleEn: 'Orders & Licenses',
        descAr: 'تابع حالة التحويلات البنكية والتراخيص الصادرة لحسابك.',
        descEn: 'Track pending bank transfers and issued licenses.',
        icon: CreditCard,
      },
      {
        id: 'design-library',
        route: 'design-library',
        titleAr: 'القوالب المتاحة لباقتك',
        titleEn: 'Templates Unlocked by Plan',
        descAr: 'شاهد القوالب التي تفتحها كل باقة داخل المكتبة.',
        descEn: 'Preview which library templates unlock per plan.',
        icon: Palette,
      },
      {
        id: 'support-tickets',
        route: 'support-tickets',
        titleAr: 'تذاكر الفوترة والدعم',
        titleEn: 'Billing Support Tickets',
        descAr: 'تواصل مباشرة مع فريق الدعم بخصوص طلبات الترقية.',
        descEn: 'Open a billing ticket for transfer or invoice help.',
        icon: MessageSquarePlus,
      },
    ],
    'my-purchases': [
      {
        id: 'plans',
        route: 'plans',
        titleAr: 'الباقات والاشتراكات',
        titleEn: 'Plans & Upgrades',
        descAr: 'قارن باقات Starter وPlus وPremium وPro بمدة 1 أو 3 أو 12 شهرًا.',
        descEn: 'Compare 1m, 3m, and 12m subscription tiers.',
        icon: CreditCard,
      },
      {
        id: 'print-studio',
        route: 'print-studio',
        titleAr: 'طباعة القوالب المملوكة',
        titleEn: 'Print Owned Templates',
        descAr: 'افتح أي قالب مرخّص في استوديو الطباعة مباشرة.',
        descEn: 'Launch Print Studio with your licensed templates.',
        icon: Printer,
      },
    ],
    'contact-methods': [
      {
        id: 'my-items',
        route: 'my-items',
        titleAr: 'ربط القنوات بأغراضك',
        titleEn: 'Link to Your Items',
        descAr: 'افتح أي غرض لاختيار قنوات التواصل الظاهرة للمكتشف.',
        descEn: 'Select which channels appear on each registered item.',
        icon: Briefcase,
      },
      {
        id: 'privacy-security',
        route: 'privacy-security',
        titleAr: 'ضوابط الخصوصية',
        titleEn: 'Privacy Controls',
        descAr: 'فعّل وضع الوسيط المجهول لحماية هويتك عند الاسترداد.',
        descEn: 'Configure Anonymous Relay and finder-note requirements.',
        icon: Shield,
      },
      {
        id: 'plans',
        route: 'plans',
        titleAr: 'حدود وسائل التواصل حسب الباقة',
        titleEn: 'Channel Quota by Plan',
        descAr: 'تحقق من عدد القنوات المسموح به في باقتك الحالية.',
        descEn: 'Upgrade to expand simultaneous active channels per item.',
        icon: CreditCard,
      },
    ],
    profile: [
      {
        id: 'contact-methods',
        route: 'contact-methods',
        titleAr: 'دليل طرق التواصل',
        titleEn: 'Contact Directory',
        descAr: 'أدر الهاتف وواتساب وتيليجرام وفيسبوك والروابط المخصصة.',
        descEn: 'Manage reusable Phone, WhatsApp, Telegram, and links.',
        icon: PhoneCall,
      },
      {
        id: 'privacy-security',
        route: 'privacy-security',
        titleAr: 'الأمان وكلمة المرور',
        titleEn: 'Security & Password',
        descAr: 'حدث كلمة المرور أو ربط حساب Google بأمان.',
        descEn: 'Manage password authentication and Google sign-in link.',
        icon: Shield,
      },
      {
        id: 'settings',
        route: 'settings',
        titleAr: 'الإعدادات العامة',
        titleEn: 'General Settings',
        descAr: 'تحكم في المظهر الداكن/الفاتح ولغة الواجهة والتنبيهات.',
        descEn: 'Configure language, Midnight Teal theme, and alert toggles.',
        icon: Settings,
      },
    ],
    settings: [
      {
        id: 'privacy-security',
        route: 'privacy-security',
        titleAr: 'مركز الخصوصية والأمان',
        titleEn: 'Privacy & Security Hub',
        descAr: 'إدارة خصوصية كل غرض وحماية رمز QR من البيانات الشخصية.',
        descEn: 'Per-item privacy matrix and PII-free QR verification.',
        icon: Shield,
      },
      {
        id: 'notifications',
        route: 'notifications',
        titleAr: 'تفضيلات الإشعارات',
        titleEn: 'Notification Preferences',
        descAr: 'خصّص تنبيهات المسح والرسائل والاسترداد والاشتراكات.',
        descEn: 'Manage QR scan, finder message, and subscription alerts.',
        icon: Bell,
      },
      {
        id: 'profile',
        route: 'profile',
        titleAr: 'الملف الشخصي',
        titleEn: 'User Profile',
        descAr: 'عدّل الاسم والصورة الشخصية والدولة واللغة المفضلة.',
        descEn: 'Update display name, avatar, country, and default language.',
        icon: User,
      },
    ],
    'privacy-security': [
      {
        id: 'contact-methods',
        route: 'contact-methods',
        titleAr: 'طرق التواصل المختارة',
        titleEn: 'Contact Methods',
        descAr: 'راجع القنوات المكشوفة للمكتشف مقابل الوسيط المجهول.',
        descEn: 'Audit visible finder contact methods vs anonymous relay.',
        icon: PhoneCall,
      },
      {
        id: 'my-items',
        route: 'my-items',
        titleAr: 'حالة الأغراض والأرشفة',
        titleEn: 'Items & Archiving',
        descAr: 'أرشف أو أوقف أي غرض مؤقتًا دون فقدان بياناته.',
        descEn: 'Pause or archive items without losing historical data.',
        icon: Briefcase,
      },
      {
        id: 'settings',
        route: 'settings',
        titleAr: 'الإعدادات العامة',
        titleEn: 'General Settings',
        descAr: 'ضبط لغة النظام والمظهر وتنبيهات البريد وواتساب.',
        descEn: 'Adjust app language, theme, and alert channels.',
        icon: Settings,
      },
    ],
    notifications: [
      {
        id: 'analytics',
        route: 'analytics',
        titleAr: 'تحليلات المسح والتفاعل',
        titleEn: 'Scan Analytics',
        descAr: 'شاهد تفاصيل التفاعل الزمني وأكثر الأغراض مسحًا.',
        descEn: 'Explore scan trends and top-performing items.',
        icon: BarChart3,
      },
      {
        id: 'settings',
        route: 'settings',
        titleAr: 'ضبط التنبيهات',
        titleEn: 'Alert Preferences',
        descAr: 'اختر أنواع الإشعارات الفورية التي ترغب باستلامها.',
        descEn: 'Enable or mute alert categories anytime.',
        icon: Settings,
      },
      {
        id: 'my-items',
        route: 'my-items',
        titleAr: 'متابعة الأغراض المفقودة',
        titleEn: 'Check Item Statuses',
        descAr: 'حدث حالة الغرض إلى «تمت استعادته» عند عودته بأمان.',
        descEn: 'Update lost items to Recovered once safely returned.',
        icon: Briefcase,
      },
    ],
    support: [
      {
        id: 'support-faq',
        route: 'support-faq',
        titleAr: 'الأسئلة الشائعة',
        titleEn: 'Workspace FAQ',
        descAr: 'إجابات سريعة حول QR المشترك، الطباعة، والأغلفة الذكية.',
        descEn: 'Quick answers about Shared QR, Print Studio, and AI Covers.',
        icon: HelpCircle,
      },
      {
        id: 'support-tickets',
        route: 'support-tickets',
        titleAr: 'فتح ومتابعة التذاكر',
        titleEn: 'Support Tickets',
        descAr: 'أنشئ تذكرة جديدة وارفق صورًا وتابع الردود الحية.',
        descEn: 'Create tickets, upload screenshots, and track live replies.',
        icon: MessageSquarePlus,
      },
      {
        id: 'privacy-security',
        route: 'privacy-security',
        titleAr: 'أمان الحساب',
        titleEn: 'Account Security',
        descAr: 'راجع سياسات الحماية واستعادة كلمات المرور.',
        descEn: 'Review account security and password settings.',
        icon: Shield,
      },
    ],
    'support-faq': [
      {
        id: 'support-tickets',
        route: 'support-tickets',
        titleAr: 'لم تجد إجابتك؟ افتح تذكرة',
        titleEn: 'Open a Support Ticket',
        descAr: 'أرسل استفسارك مباشرة إلى فريق FindIt QR مع المرفقات.',
        descEn: 'Submit your issue with screenshot attachments to support.',
        icon: MessageSquarePlus,
      },
      {
        id: 'support',
        route: 'support',
        titleAr: 'دليل الاستخدام والمقالات',
        titleEn: 'Help Guides & Articles',
        descAr: 'تصفح أدلة التشغيل التفصيلية لجميع أدوات المنصة.',
        descEn: 'Read step-by-step usage guides across all features.',
        icon: LifeBuoy,
      },
    ],
    'support-tickets': [
      {
        id: 'support-faq',
        route: 'support-faq',
        titleAr: 'الأسئلة الشائعة',
        titleEn: 'Check FAQ First',
        descAr: 'تصفح الحلول الفورية لأكثر الاستفسارات شيوعًا.',
        descEn: 'Browse quick solutions to the most common questions.',
        icon: HelpCircle,
      },
      {
        id: 'support',
        route: 'support',
        titleAr: 'مركز المساعدة',
        titleEn: 'Help Center',
        descAr: 'ارجع إلى الأدلة الإرشادية وقنوات التواصل المعتمدة.',
        descEn: 'Return to help articles and official support channels.',
        icon: LifeBuoy,
      },
      {
        id: 'my-purchases',
        route: 'my-purchases',
        titleAr: 'مراجعة الطلبات والفواتير',
        titleEn: 'Orders & Invoices',
        descAr: 'تحقق من رقم الطلب أو الحوالة قبل فتح تذكرة مالية.',
        descEn: 'Check your order reference number for billing inquiries.',
        icon: CreditCard,
      },
    ],
  };

  const actions = catalog[currentPage] || catalog.dashboard;
  if (!actions || actions.length === 0) return null;

  return (
    <section
      aria-label={lang === 'ar' ? 'الخدمات والمحطات المرتبطة' : 'Contextual Related Services'}
      data-testid="smart-related-services"
      className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-5 sm:p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0F9D8E]/10 dark:bg-[#19B5A5]/15 flex items-center justify-center text-[#0F9D8E] dark:text-[#19B5A5]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#0B1320] dark:text-white">
              {lang === 'ar' ? 'الخطوات والخدمات المرتبطة' : 'Related Services & Next Actions'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? 'اختصارات ذكية مرتبطة بسياق الصفحة الحالية لتسريع عملك.'
                : 'Contextual shortcuts tailored to your current workspace view.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {actions.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => navigate(card.route, card.params)}
              className="group text-start p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#0B1320]/70 hover:border-[#19B5A5] dark:hover:border-[#19B5A5] hover:bg-white dark:hover:bg-[#14233A] transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#14233A] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#0F9D8E] dark:text-[#19B5A5] group-hover:bg-[#0F9D8E] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                {isRtl ? (
                  <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-[#0F9D8E] dark:group-hover:text-[#19B5A5] transition-colors" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F9D8E] dark:group-hover:text-[#19B5A5] transition-colors" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0B1320] dark:text-white group-hover:text-[#0F9D8E] dark:group-hover:text-[#19B5A5] transition-colors">
                  {lang === 'ar' ? card.titleAr : card.titleEn}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {lang === 'ar' ? card.descAr : card.descEn}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
