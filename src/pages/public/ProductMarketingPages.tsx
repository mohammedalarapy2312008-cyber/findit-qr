import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Check,
  Eye,
  FolderKanban,
  Globe2,
  Heart,
  Key,
  Laptop,
  Layers,
  Lock,
  Luggage,
  PawPrint,
  Printer,
  QrCode,
  Search,
  Shield,
  ShoppingBag,
  Sliders,
  Smartphone,
  UserPlus,
} from 'lucide-react';
import { TagProductPreview } from '../../components/brand/TagProductPreview';
import { CheckoutModal } from '../../components/common/CheckoutModal';
import { PilotCard3dPreview } from '../../components/common/PilotCard3dPreview';
import { TemplateDetailShowcase } from '../../components/common/TemplateDetailShowcase';
import { TemplateShowcaseCard } from '../../components/common/TemplateShowcaseCard';
import {
  MidnightCtaBand,
  PageHeroBand,
} from '../../components/marketing/MarketingPrimitives';
import { getTemplateShowcaseMedia } from '../../data/pilotShowcaseMedia';
import { useApp } from '../../context/AppContext';
import { VISUAL_ASSETS } from '../../data/foundationCatalog';
import {
  BILLING_DURATION_OPTIONS,
  BillingDurationId,
} from '../../data/plansCatalog';
import {
  ManagedPlanDefinition,
  TagDesignTemplate,
  TemplateDomainCategory,
  TemplateScope,
} from '../../types/domain';
import {
  getActiveCatalogTemplates,
  REORGANIZED_DOMAIN_CATEGORIES,
  STYLE_DISCOVERY_CLUSTERS,
  StyleClusterId,
  summarizeActiveCatalogBreakdown,
  TemplateIpFilter,
  TemplatePriceFilter,
  TemplateSortBy,
} from '../../utils/templateDiscovery';
import {
  filterAndSortLibraryTemplates,
  getIssuedPurchasedTemplateIdSet,
  getTemplateOwnershipStatus,
  summarizeLibraryOwnership,
  TemplateOwnershipFilter,
} from '../../utils/templateLibraryAudit';

export const HowItWorksPage: React.FC = () => {
  const { lang, isRtl, navigate, authUser, designs } = useApp();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const activeCount = useMemo(() => getActiveCatalogTemplates(designs).length, [designs]);

  const stages = [
    {
      step: '01',
      icon: UserPlus,
      titleAr: 'إنشاء حسابك في FindIt QR',
      titleEn: 'Create Your FindIt QR Account',
      descAr:
        'سجّل مجانًا بالبريد الإلكتروني أو عبر حساب Google خلال لحظات، لتحصل فورًا على مساحة تحكم خاصة تدير منها جميع مقتنياتك وأكوادك ورسائل المكتشفين.',
      descEn:
        'Register free via email or Google in seconds to access your private workspace for managing belongings, QR codes, and recovery alerts.',
      outcomeAr: 'تبدأ بالباقة المجانية (غرضان نشطان) مع إمكانية الترقية لاحقًا في أي وقت.',
      outcomeEn: 'Start on Starter / Free (2 active items) and upgrade anytime as needed.',
    },
    {
      step: '02',
      icon: FolderKanban,
      titleAr: 'إضافة المقتنيات وضبط الخصوصية',
      titleEn: 'Add Your Belongings & Set Privacy Controls',
      descAr:
        'أضف بيانات كل غرض (الاسم، الفئة، رسالة الإرشاد للمكتشف، وصورة أو مجموعة تنظيمية اختيارية)، ثم اختر بالضبط قنوات التواصل المسموح بظهورها أو فعّل وضع الوسيط المجهول.',
      descEn:
        'Add item details (title, category, finder instructions, and optional folder group), then select exact contact channels or enable Anonymous Relay.',
      outcomeAr: 'يمكنك تحديث القنوات أو تغيير حالة الغرض إلى «مفقود» عن بُعد في أي لحظة.',
      outcomeEn: 'Edit channels or flip an item to Lost remotely anytime.',
    },
    {
      step: '03',
      icon: QrCode,
      titleAr: 'إنشاء رمز QR وربطه بالغرض أو المجموعة',
      titleEn: 'Generate & Bind Your Individual or Shared QR',
      descAr:
        'يولّد النظام رمز QR قياسيًا (ISO/IEC 18004) مرتبطًا بصفحة الاسترداد الفريدة للغرض، كما يمكنك ربط عدة أغراض برمز QR مشترك واحد لحقائب السفر أو مقتنيات العائلة.',
      descEn:
        'The platform generates a permanent ISO/IEC 18004 QR code linked to your item recovery URL, or lets you group multiple items under one Shared QR code.',
      outcomeAr: 'الرمز لا يحتوي على بياناتك الشخصية داخله؛ بل يوجه لصفحة خاضعة لإعداداتك.',
      outcomeEn: 'The QR matrix stores zero personal data—only your controlled recovery route.',
    },
    {
      step: '04',
      icon: Printer,
      titleAr: 'اختيار القالب وطباعة الملصق وتثبيته',
      titleEn: 'Pick a Template, Print & Apply Your Tag',
      descAr:
        `اختر التصميم الملائم لغرضك من مكتبة تضم ${activeCount} قالبًا معتمدًا (ملصقات أجهزة، بطاقات أمتعة، ميداليات مفاتيح، أو لوحات معدات)، وصدّر ملف الطباعة الجاهز بدقة عالية لتثبيته على الغرض.`,
      descEn:
        `Choose from ${activeCount} curated templates (device stickers, luggage tags, key fobs, or asset plates) and export print-ready files for clean application.`,
      outcomeAr: 'ملفات طباعة دقيقة ومعاينة فورية مع دمج رمز QR الخاص بك تلقائيًا.',
      outcomeEn: 'Print-ready exports with your real item QR composited automatically.',
    },
    {
      step: '05',
      icon: Smartphone,
      titleAr: 'تجربة الشخص الذي يعثر على الغرض',
      titleEn: 'Effortless Finder Scan & Safe Return',
      descAr:
        'عندما يجد شخص غرضك، يوجه كاميرا هاتفه إلى الرمز دون تثبيت أي تطبيق أو تسجيل حساب. تفتح صفحة الاسترداد بالعربية والإنجليزية ليرى تعليماتك ويتواصل معك أو يرسل رسالة فورية.',
      descEn:
        'When someone finds your item, they scan the tag with their native phone camera—zero app or sign-up needed. Your bilingual recovery page opens immediately to reach you.',
      outcomeAr: 'يُوثّق المسح في سجل النشاط ويصلك تنبيه فوري داخل لوحة التحكم.',
      outcomeEn: 'Every scan and finder message triggers an instant alert in your dashboard.',
    },
  ];

  return (
    <div>
      <PageHeroBand
        eyebrow={lang === 'ar' ? 'كيف تعمل المنصة؟' : 'HOW IT WORKS'}
        title={
          lang === 'ar'
            ? 'خمس خطوات واضحة تحوّل أي غرض مفقود إلى عودة آمنة'
            : 'Five Clear Steps From Tagging Your Gear to Safe Return'
        }
        subtitle={
          lang === 'ar'
            ? 'صممنا تجربة FindIt QR لتكون بسيطة لك في الإدارة وفورية للشخص الذي يعثر على غرضك — بدون بطاريات، بدون تطبيقات للمكتشف، وبخصوصية كاملة.'
            : 'FindIt QR removes friction for both you and whoever finds your belonging—no batteries, no finder app installs, and complete privacy control.'
        }
        imageSrc={VISUAL_ASSETS.howItWorks3d}
        imageAlt={
          lang === 'ar'
            ? 'مشهد ثلاثي الأبعاد لهاتف ذكي يمسح رمز FindIt QR المثبت على حقيبة سفر'
            : '3D Midnight Teal studio scene of a smartphone scanning a QR recovery tag on a navy backpack'
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate(authUser ? 'dashboard' : 'register')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] dark:bg-[#19B5A5] dark:hover:bg-[#14A394] text-white dark:text-[#07101D] font-extrabold text-sm transition-colors whitespace-nowrap"
            >
              <span>{authUser ? (lang === 'ar' ? 'فتح لوحة التحكم' : 'Open Dashboard') : (lang === 'ar' ? 'ابدأ مجانًا' : 'Start Free')}</span>
              <ArrowIcon className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigate('found-item')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#111E33] border border-slate-300 dark:border-slate-700 hover:border-[#19B5A5] text-[#0B1320] dark:text-white font-bold text-sm transition-colors whitespace-nowrap"
            >
              <QrCode className="w-4 h-4 text-[#0F9D8E] dark:text-[#2DD4BF]" aria-hidden="true" />
              <span>{lang === 'ar' ? 'جرّب معاينة صفحة المكتشف' : 'Try Live Finder Preview'}</span>
            </button>
          </>
        }
      />

      {/* 5 Stages Structured Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stages.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.step}
                className="findit-card-hover rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0E192B] p-6 sm:p-7 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#0B1320] dark:bg-[#19B5A5]/15 text-[#2DD4BF] font-mono font-bold text-sm tabular-nums">
                      {st.step}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#14233A] text-[#0F9D8E] dark:text-[#2DD4BF] flex items-center justify-center">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                  </div>
                  <h2 className="text-lg font-bold text-[#0B1320] dark:text-white">
                    {lang === 'ar' ? st.titleAr : st.titleEn}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {lang === 'ar' ? st.descAr : st.descEn}
                  </p>
                </div>
                <p className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-[#0F9D8E] dark:text-[#2DD4BF]">
                  {lang === 'ar' ? st.outcomeAr : st.outcomeEn}
                </p>
              </div>
            );
          })}

          {/* Companion Action Card to Complete 3x2 Symmetry */}
          <div className="rounded-2xl border border-[#19B5A5]/40 bg-[#0B1320] text-white p-6 sm:p-7 flex flex-col justify-between">
            <div className="space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#2DD4BF]">
                {lang === 'ar' ? 'تجربة عملية فورية' : 'LIVE SIMULATION'}
              </p>
              <h2 className="text-xl font-extrabold">
                {lang === 'ar'
                  ? 'شاهد بنفسك ما يراه الشخص عند مسح الرمز'
                  : 'Inspect the Exact Finder Screen Right Now'}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {lang === 'ar'
                  ? 'افتح صفحة العثور التفاعلية أو تصفح مكتبة القوالب لترى كيف يظهر الغرض وقنوات التواصل المحمية.'
                  : 'Open the interactive recovery page or explore our print-ready template library before creating your account.'}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => navigate('found-item')}
                className="px-4 py-2.5 rounded-xl bg-[#19B5A5] hover:bg-[#14A394] text-[#07101D] font-extrabold text-xs transition-colors"
              >
                {lang === 'ar' ? 'معاينة صفحة الاسترداد' : 'Open Finder Preview'}
              </button>
              <button
                type="button"
                onClick={() => navigate('design-store')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
              >
                {lang === 'ar' ? 'مكتبة القوالب' : 'Template Library'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <MidnightCtaBand
        eyebrow={lang === 'ar' ? 'الخطوة التالية' : 'NEXT STEP'}
        title={
          lang === 'ar'
            ? 'هل ترغب في التعرف على كافة المميزات التفصيلية للمنصة؟'
            : 'Want to Explore Every Feature Built Into FindIt QR?'
        }
        subtitle={
          lang === 'ar'
            ? 'تعرّف على إدارة المجموعات، مجموعات QR المشتركة، الإحصائيات، وإعدادات الخصوصية المتقدمة.'
            : 'Explore item groups, Shared QR kits, scan activity logs, and granular privacy controls.'
        }
        primaryLabel={lang === 'ar' ? 'استعرض المميزات' : 'Explore Features'}
        primaryRoute="features"
        secondaryLabel={lang === 'ar' ? 'ابدأ مجانًا' : 'Start Free'}
        secondaryRoute="register"
      />
    </div>
  );
};

export const FeaturesPage: React.FC = () => {
  const { lang, navigate, authUser, designs } = useApp();
  const activeCount = useMemo(() => getActiveCatalogTemplates(designs).length, [designs]);

  const capabilities = [
    {
      icon: Sliders,
      titleAr: 'إدارة الأغراض والمقتنيات بمرونة',
      titleEn: 'Complete Item Lifecycle Management',
      descAr:
        'سجّل كل غرض باسمه ووصفه وتصنيفه وتعليمات الاسترداد الخاصة به. بدّل حالته في الوقت الفعلي بين (نشط، مفقود، تم العثور عليه، تمت استعادته، أو مؤرشف) دون المساس ببقية أغراضك.',
      descEn:
        'Register each item with title, category, description, and custom recovery instructions. Switch status live between Active, Lost, Found, Recovered, or Archived anytime.',
      highlightsAr: ['الأغراض المؤرشفة لا تستهلك حد الباقة النشط', 'دعم إضافة مكافأة تقديرية اختيارية'],
      highlightsEn: ['Archived items never consume active quota', 'Optional appreciation reward banner'],
    },
    {
      icon: FolderKanban,
      titleAr: 'المجموعات التنظيمية ومجموعات QR المشتركة',
      titleEn: 'Organizational Folders & Shared QR Groups',
      descAr:
        'رتّب مقتنياتك في مجموعات تنظيمية واضحة (مثل: السفر، العمل، العائلة)، وأنشئ مجموعات QR مشتركة لربط عدة أغراض برمز QR واحد مع التحكم المستقل بإظهار أو إخفاء كل غرض داخل المجموعة.',
      descEn:
        'Organize items into custom folders (Travel, Work, Family) and create Shared QR Groups that bind multiple items to one QR tag with independent per-item visibility toggles.',
      highlightsAr: ['صفحة عرض مخصصة لمجموعة QR المشتركة', 'إمكانية استعادة الرمز الفردي لأي غرض فورًا'],
      highlightsEn: ['Dedicated Shared QR recovery page', 'Restore individual item QR anytime'],
    },
    {
      icon: QrCode,
      titleAr: 'إدارة رموز QR القياسية والطباعة',
      titleEn: 'ISO 18004 QR Management & Print Export',
      descAr:
        `رموز QR قياسية عالية الدقة قابلة للمسح السريع، مرتبطة بمكتبة تضم ${activeCount} قالب تصميم جاهز للتخصيص والطباعة الفردية أو الجماعية (A4) بصيغ متجهية عالية الجودة.`,
      descEn:
        `Authentic ISO/IEC 18004 scannable QR codes paired with ${activeCount} customizable templates supporting single and batch A4 print-ready vector exports.`,
      highlightsAr: ['تصدير SVG متجهي وملفات طباعة 300 DPI', 'تحديث بيانات الغرض دون إعادة طباعة الملصق'],
      highlightsEn: ['Vector SVG & 300 DPI print output', 'Update item details without reprinting'],
    },
    {
      icon: Globe2,
      titleAr: 'صفحات استرداد ثنائية اللغة بدون تطبيق',
      titleEn: 'Zero-App Bilingual Recovery Pages',
      descAr:
        'عند مسح أي رمز، تفتح صفحة استرداد سريعة ومصممة للجوال تدعم العربية (RTL) والإنجليزية (LTR)، تعرض رسالة المالك وقنوات التواصل المصرح بها ونموذج بلاغ «عثرت على هذا الغرض».',
      descEn:
        'Scanning opens a fast mobile recovery screen in Arabic (RTL) and English (LTR) displaying owner notes, approved contact buttons, and an instant "I Found This Item" form.',
      highlightsAr: ['لا يتطلب تسجيل دخول أو تحميل تطبيق للمكتشف', 'أزرار تواصل مباشرة سريعة الاستجابة'],
      highlightsEn: ['No finder login or app installation', 'Direct one-tap approved contact actions'],
    },
    {
      icon: BarChart3,
      titleAr: 'الإحصائيات وسجل المسح والتنبيهات الفورية',
      titleEn: 'Scan Statistics, Activity Logs & Alerts',
      descAr:
        'راقب عدد عمليات المسح وتوقيتها وسجل الأنشطة من لوحة التحكم، واستقبل تنبيهات فورية ورسائل المكتشفين في مركز الإشعارات لمتابعة كل حالة استرداد أولًا بأول.',
      descEn:
        'Track scan counts, timestamps, and activity timelines from your dashboard while receiving instant finder messages and notifications in one inbox.',
      highlightsAr: ['سجل نشاط زمني واضح لكل عملية مسح وتعديل', 'إدارة حالة رسائل المكتشفين داخل الحساب'],
      highlightsEn: ['Chronological activity & scan timeline', 'Built-in finder message inbox'],
    },
    {
      icon: Lock,
      titleAr: 'الخصوصية والتحكم الكامل بالبيانات',
      titleEn: 'Granular Privacy & Security Controls',
      descAr:
        'اختر القنوات الظاهرة لكل غرض على حدة، أو فعّل وضع الوسيط المجهول لإخفاء رقم هاتفك تمامًا، مع إمكانية إيقاف الرمز أو أرشفته في أي لحظة بعزل كامل لحسابك.',
      descEn:
        'Configure visible channels per item, enable Anonymous Relay to hide personal phone numbers completely, and pause or archive codes immediately with strict account isolation.',
      highlightsAr: ['لا بيانات شخصية مخزنة داخل مصفوفة QR', 'تحقق خادمي صارم من ملكية الحساب والبيانات'],
      highlightsEn: ['Zero PII stored inside QR matrix', 'Server-verified account ownership isolation'],
    },
  ];

  return (
    <div>
      <PageHeroBand
        eyebrow={lang === 'ar' ? 'مميزات المنصة' : 'PLATFORM FEATURES'}
        title={
          lang === 'ar'
            ? 'أدوات متكاملة لإدارة مقتنياتك ورموز QR بوضوح وأمان'
            : 'Purpose-Built Features for Smart Property Protection & Recovery'
        }
        subtitle={
          lang === 'ar'
            ? 'من تنظيم الأغراض ومجموعات QR المشتركة إلى صفحات الاسترداد والتنبيهات والخصوصية — كل ميزة في FindIt QR مصممة لتعمل بانسجام في المواقف الواقعية.'
            : 'From item organization and Shared QR kits to bilingual recovery pages, alerts, and strict privacy—every capability works together seamlessly.'
        }
        imageSrc={VISUAL_ASSETS.features3d}
        imageAlt={
          lang === 'ar'
            ? 'عرض ثلاثي الأبعاد لمنظومة مقتنيات ورموز QR الفردية والمشتركة في FindIt QR'
            : '3D isometric Midnight Teal showcase of organized belongings linked with individual and shared QR recovery tags'
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate(authUser ? 'dashboard' : 'register')}
              className="px-6 py-3 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] dark:bg-[#19B5A5] dark:hover:bg-[#14A394] text-white dark:text-[#07101D] font-extrabold text-sm transition-colors whitespace-nowrap"
            >
              {authUser
                ? lang === 'ar'
                  ? 'فتح لوحة التحكم'
                  : 'Open Dashboard'
                : lang === 'ar'
                ? 'ابدأ مجانًا'
                : 'Start Free'}
            </button>
            <button
              type="button"
              onClick={() => navigate('design-store')}
              className="px-5 py-3 rounded-xl bg-white dark:bg-[#111E33] border border-slate-300 dark:border-slate-700 hover:border-[#19B5A5] text-[#0B1320] dark:text-white font-bold text-sm transition-colors whitespace-nowrap"
            >
              {lang === 'ar' ? 'تصفح مكتبة القوالب' : 'Browse Template Library'}
            </button>
          </>
        }
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="findit-card-hover rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0E192B] p-6 sm:p-7 flex flex-col justify-between gap-6"
              >
                <div className="space-y-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#2DD4BF] flex items-center justify-center">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-bold text-[#0B1320] dark:text-white">
                    {lang === 'ar' ? cap.titleAr : cap.titleEn}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {lang === 'ar' ? cap.descAr : cap.descEn}
                  </p>
                </div>

                <ul className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {(lang === 'ar' ? cap.highlightsAr : cap.highlightsEn).map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#19B5A5] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <MidnightCtaBand
        eyebrow={lang === 'ar' ? 'حماية ومرونة' : 'PRIVACY & PLANS'}
        title={
          lang === 'ar'
            ? 'اطّلع على تفاصيل الخصوصية أو قارن الباقات المعتمدة'
            : 'Explore Our Privacy Architecture or Compare Official Plans'
        }
        subtitle={
          lang === 'ar'
            ? 'تعرّف على كيفية حماية بياناتك بدقة أو اختر الباقة المناسبة لعدد مقتنياتك.'
            : 'See exactly how your contact details stay protected or pick the right plan tier for your items.'
        }
        primaryLabel={lang === 'ar' ? 'مقارنة الباقات' : 'Compare Plans'}
        primaryRoute="pricing"
        secondaryLabel={lang === 'ar' ? 'الخصوصية والأمان' : 'Privacy & Security'}
        secondaryRoute="privacy"
      />
    </div>
  );
};

export const UseCasesPage: React.FC = () => {
  const { lang, navigate } = useApp();
  const [activeSegment, setActiveSegment] = useState<'all' | 'personal' | 'commercial'>('all');

  const cases = [
    {
      segment: 'personal' as const,
      icon: Luggage,
      titleAr: 'المسافرون وحقائب الطيران الدولية',
      titleEn: 'International Travelers & Checked Luggage',
      scenarioAr:
        'عند تأخر الحقيبة أو اختلاطها في صالة المطار، يمسح موظف المطار أو المسافر بطاقة Voyager 3D ليتواصل معك فورًا عبر واتساب أينما كنت.',
      scenarioEn:
        'If a bag is delayed or misplaced at baggage claim, airport staff or fellow travelers scan the Voyager 3D loop to message your WhatsApp immediately.',
      recommendedTemplateAr: 'بطاقة Voyager 3D المقاومة للماء والصدمات',
      recommendedTemplateEn: 'Voyager 3D Smart Luggage Loop',
    },
    {
      segment: 'personal' as const,
      icon: Laptop,
      titleAr: 'الطلاب، المستقلون، والأجهزة المحمولة',
      titleEn: 'Students, Freelancers & Portable Electronics',
      scenarioAr:
        'نسيان الحاسوب المحمول أو السماعات أو الكاميرا في مقهى أو قاعة محاضرات؛ ملصق Nano Shield النحيف يمكّن من يعثر عليه من إعادته لك في نفس اليوم.',
      scenarioEn:
        'Left a MacBook, tablet, or camera bag at a coworking space or lecture hall? The Nano Shield dome sticker enables same-day recovery.',
      recommendedTemplateAr: 'ملصق إيبوكسي Nano Shield للأجهزة',
      recommendedTemplateEn: 'Nano Shield 3D Epoxy Device Sticker',
    },
    {
      segment: 'personal' as const,
      icon: Key,
      titleAr: 'مفاتيح السيارات والمنازل',
      titleEn: 'Car Fobs & House Keyrings',
      scenarioAr:
        'حماية مفاتيح السيارة المكلفة عبر ميدالية Coral KeyFob مع تفعيل «الوسيط المجهول» حتى لا يعرف المكتشف عنوان منزلك في حال ضياع المفاتيح.',
      scenarioEn:
        'Protect expensive smart car keys with Coral KeyFob while keeping Anonymous Relay active so your home address is never revealed.',
      recommendedTemplateAr: 'ميدالية Coral KeyFob المحفورة بالليزر',
      recommendedTemplateEn: 'Coral KeyFob Laser-Engraved Metal Tag',
    },
    {
      segment: 'personal' as const,
      icon: PawPrint,
      titleAr: 'الحيوانات الأليفة',
      titleEn: 'Pets & Companion Animals',
      scenarioAr:
        'قلادة Pet Guardian الدائرية المزودة بإطار سيليكون صامت تعرض لمن يعثر على حيوانك الأليف أرقام التواصل وأي ملاحظات صحية أو بيطرية هامة.',
      scenarioEn:
        'Silent silicone-rimmed Pet Guardian collar medal displays owner contact channels plus vital veterinary or dietary notes.',
      recommendedTemplateAr: 'قلادة طوق Pet Guardian',
      recommendedTemplateEn: 'Pet Guardian Collar QR Medal',
    },
    {
      segment: 'commercial' as const,
      icon: Building2,
      titleAr: 'عهد الموظفين وأسطول تقنية المعلومات للشركات',
      titleEn: 'Corporate IT Fleets & Employee Hardware',
      scenarioAr:
        'ترقيم مئات الحواسيب والأجهزة اللوحية للشركة بحيث يوجّه مسح الكود المكتشف مباشرة إلى مكتب دعم تقنية المعلومات مع رقم الأصل التسلسلي.',
      scenarioEn:
        'Tag corporate laptops and tablets so any external scan routes directly to your IT Helpdesk with the exact asset serial number.',
      recommendedTemplateAr: 'لوحة أصول الشركات Enterprise Asset Shield',
      recommendedTemplateEn: 'Enterprise Asset Shield QR Plate',
    },
  ];

  const filtered = cases.filter(
    (c) => activeSegment === 'all' || c.segment === activeSegment
  );

  return (
    <div className="py-12 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#2563EB] dark:text-[#19B5A5]">
            {lang === 'ar' ? 'تطبيقات واقعية' : 'REAL-WORLD APPLICATIONS'}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17243A] dark:text-white text-balance">
            {lang === 'ar'
              ? 'حالات استخدام مصممة للأفراد والعائلات والشركات'
              : 'Use Cases Across Personal Life, Travel, and Enterprise Asset Management'}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {lang === 'ar'
              ? 'سواء كنت تحمي حقيبة سفرك الشخصية أو تدير عهد الأجهزة في شركتك، توفر FindIt QR القالب وإعدادات الخصوصية الملائمة.'
              : 'Whether safeguarding personal travel gear or managing commercial equipment fleets, FindIt QR adapts to your scenario.'}
          </p>

          <div className="pt-2 inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800">
            {[
              { id: 'all' as const, ar: 'جميع الاستخدامات', en: 'All Scenarios' },
              { id: 'personal' as const, ar: 'الأفراد والعائلات', en: 'Personal & Family' },
              { id: 'commercial' as const, ar: 'الشركات والأعمال', en: 'Commercial & B2B' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSegment(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  activeSegment === tab.id
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#17243A] dark:hover:text-white'
                }`}
              >
                {lang === 'ar' ? tab.ar : tab.en}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] shadow-lg">
            <img
              src={VISUAL_ASSETS.useCases3d}
              alt={lang === 'ar' ? 'حالات استخدام FindIt QR' : 'FindIt QR Use Cases 3D'}
              referrerPolicy="no-referrer"
              className="w-full h-72 object-cover"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 sm:p-8 flex flex-col justify-between findit-card-hover"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#19B5A5] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#17243A] dark:text-white">
                  {lang === 'ar' ? item.titleAr : item.titleEn}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                  {lang === 'ar' ? item.scenarioAr : item.scenarioEn}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {lang === 'ar' ? item.recommendedTemplateAr : item.recommendedTemplateEn}
                </span>
                <button
                  type="button"
                  onClick={() => navigate('design-store')}
                  className="font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline whitespace-nowrap shrink-0"
                >
                  {lang === 'ar' ? 'عرض القوالب' : 'View Templates'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function formatManagedPlanDurationPrice(
  plan: ManagedPlanDefinition,
  duration: BillingDurationId,
  lang: 'ar' | 'en',
  currency: 'SAR' | 'USD'
): { primaryPrice: string; periodNote: string } {
  const totalSar =
    duration === '3m' ? plan.quarterlySar : duration === '12m' ? plan.yearlySar : plan.monthlySar;
  const totalUsd =
    duration === '3m' ? plan.quarterlyUsd : duration === '12m' ? plan.yearlyUsd : plan.monthlyUsd;

  if (totalSar === 0 && totalUsd === 0) {
    return {
      primaryPrice: lang === 'ar' ? '٠ ر.س / مجانًا' : '$0 / Free',
      periodNote: lang === 'ar' ? 'خطة أساسية مجانية' : 'Free starter tier',
    };
  }

  const primaryPrice =
    currency === 'USD'
      ? `$${totalUsd}`
      : lang === 'ar'
      ? `${totalSar} ر.س`
      : `${totalSar} SAR ($${totalUsd})`;

  const periodNote =
    duration === '1m'
      ? lang === 'ar'
        ? 'لمدة شهر واحد'
        : 'per 1 month'
      : duration === '3m'
      ? lang === 'ar'
        ? `إجمالي لمدة ٣ أشهر (${plan.monthlySar} ر.س/شهر)`
        : `total for 3 months`
      : lang === 'ar'
      ? `إجمالي لمدة ١٢ شهرًا (${plan.monthlySar} ر.س/شهر)`
      : `total for 12 months`;

  return { primaryPrice, periodNote };
}

export const PricingPage: React.FC = () => {
  const { lang, navigate, authUser, plans, platformSettings } = useApp();
  const [billingDuration, setBillingDuration] = useState<BillingDurationId>('1m');
  const [checkoutPlan, setCheckoutPlan] = useState<ManagedPlanDefinition | null>(null);

  const activePlans = useMemo(
    () => plans.filter((p) => p.isActive !== false),
    [plans]
  );

  return (
    <div>
      <section className="relative overflow-hidden findit-hero-grid border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F9D8E] dark:text-[#2DD4BF]">
                {lang === 'ar' ? 'الباقات والأسعار المعتمدة' : 'OFFICIAL PLANS & PRICING'}
              </p>
              <h1
                style={{ fontSize: 'clamp(2rem, 3.6vw, 3.1rem)' }}
                className="font-extrabold text-[#0B1320] dark:text-white leading-[1.15] text-balance"
              >
                {lang === 'ar'
                  ? 'أربع باقات واضحة: Starter / Free و Plus و Premium و Pro'
                  : 'Four Clear Plans: Starter / Free, Plus, Premium, and Pro'}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'ar'
                  ? 'أسعار موحّدة ومدد مرنة (شهر واحد، ٣ أشهر، ١٢ شهرًا) مع تطبيق الحدود الفعلية للأغراض النشطة ووسائل التواصل داخل الحساب.'
                  : 'Unified pricing across the entire platform for 1 Month, 3 Months, and 12 Months, enforced directly inside your account workspace.'}
              </p>
            </div>

            {/* Canonical 1m / 3m / 12m Duration Switcher */}
            <div
              role="group"
              aria-label={lang === 'ar' ? 'مدة الاشتراك' : 'Plan Duration'}
              className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-white dark:bg-[#0E192B] border border-slate-200 dark:border-slate-800 shrink-0"
            >
              {BILLING_DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`pricing-duration-${opt.id}`}
                  onClick={() => setBillingDuration(opt.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    billingDuration === opt.id
                      ? 'bg-[#0F9D8E] dark:bg-[#19B5A5] text-white dark:text-[#07101D]'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#0B1320] dark:hover:text-white'
                  }`}
                >
                  {lang === 'ar' ? opt.labelAr : opt.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="py-12 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Live Canonical Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activePlans.map((plan) => {
            const priceInfo = formatManagedPlanDurationPrice(
              plan,
              billingDuration,
              lang,
              platformSettings.defaultCurrency || 'SAR'
            );
            const isFreeTier = plan.monthlySar === 0 && plan.monthlyUsd === 0;
            return (
              <div
                key={plan.id}
                data-testid={`pricing-card-${plan.id}`}
                className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between border findit-card-hover ${
                  plan.featured
                    ? 'border-2 border-[#0F9D8E] dark:border-[#19B5A5] bg-white dark:bg-[#112238] shadow-lg shadow-[#19B5A5]/10'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E192B]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#0F9D8E] dark:text-[#2DD4BF]">
                      {lang === 'ar' ? plan.audienceAr : plan.audienceEn}
                    </p>
                    {plan.featured && (
                      <span className="text-[11px] font-extrabold text-[#0F9D8E] dark:text-[#2DD4BF]">
                        {lang === 'ar' ? 'الأكثر اختيارًا' : 'Most Popular'}
                      </span>
                    )}
                  </div>

                  <h2
                    dir="ltr"
                    className="text-xl font-extrabold text-[#0B1320] dark:text-white mt-2 text-start"
                  >
                    {lang === 'ar' ? plan.nameAr : plan.nameEn}
                  </h2>

                  <div className="mt-4 flex flex-col gap-1">
                    <span
                      className={`text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white whitespace-nowrap tabular-nums ${
                        lang === 'en' ? 'font-mono' : 'font-sans'
                      }`}
                    >
                      {priceInfo.primaryPrice}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {priceInfo.periodNote}
                    </span>
                  </div>

                  {/* Canonical Quota Highlight */}
                  <div className="mt-4 p-3 rounded-xl bg-[#F7FAFC] dark:bg-[#08101E] border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-2 text-center">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {lang === 'ar' ? 'الأغراض النشطة' : 'Active Items'}
                      </span>
                      <span className="font-mono font-extrabold text-sm text-[#0B1320] dark:text-white tabular-nums">
                        {plan.maxActiveItems}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {lang === 'ar' ? 'وسائل التواصل' : 'Channels'}
                      </span>
                      <span className="font-mono font-extrabold text-sm text-[#0F9D8E] dark:text-[#2DD4BF] tabular-nums">
                        {plan.maxContactMethods}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {(lang === 'ar' ? plan.featuresAr : plan.featuresEn).map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#19B5A5] shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isFreeTier) {
                      navigate(authUser ? 'dashboard' : 'register');
                    } else if (authUser) {
                      setCheckoutPlan(plan);
                    } else {
                      navigate('register');
                    }
                  }}
                  className={`mt-7 w-full py-3 px-4 rounded-xl font-bold text-sm transition-colors ${
                    plan.featured
                      ? 'bg-[#0F9D8E] hover:bg-[#0D8A7D] dark:bg-[#19B5A5] dark:hover:bg-[#14A394] text-white dark:text-[#07101D]'
                      : 'bg-[#F7FAFC] dark:bg-[#14233A] border border-slate-200 dark:border-slate-700 text-[#0B1320] dark:text-white hover:border-[#19B5A5]'
                  }`}
                >
                  {isFreeTier
                    ? lang === 'ar'
                      ? 'ابدأ مجانًا الآن'
                      : 'Start Free Now'
                    : authUser
                    ? lang === 'ar'
                      ? 'طلب الاشتراك / الترقية'
                      : 'Subscribe / Upgrade'
                    : lang === 'ar'
                    ? 'أنشئ حسابًا للبدء'
                    : 'Create Account'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Unified Comparison Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-extrabold text-[#0B1320] dark:text-white">
              {lang === 'ar' ? 'جدول مقارنة الحدود والخصائص' : 'Plan Limits & Capabilities Matrix'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7FAFC] dark:bg-[#08101E] text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-5 text-start">
                    {lang === 'ar' ? 'الميزة / الحد' : 'Feature / Limit'}
                  </th>
                  {activePlans.map((p) => (
                    <th key={p.id} className="py-3.5 px-4 text-center font-mono">
                      {p.nameEn}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs sm:text-sm">
                <tr>
                  <td className="py-3.5 px-5 font-bold text-[#0B1320] dark:text-white">
                    {lang === 'ar' ? 'الحد الأقصى للأغراض النشطة' : 'Max Active Items'}
                  </td>
                  {activePlans.map((p) => (
                    <td
                      key={p.id}
                      className="py-3.5 px-4 text-center font-mono font-bold text-[#0F9D8E] dark:text-[#2DD4BF] tabular-nums"
                    >
                      {p.maxActiveItems}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-bold text-[#0B1320] dark:text-white">
                    {lang === 'ar'
                      ? 'وسائل التواصل لكل غرض'
                      : 'Direct Contact Channels per Item'}
                  </td>
                  {activePlans.map((p) => (
                    <td key={p.id} className="py-3.5 px-4 text-center font-mono font-bold tabular-nums">
                      {p.maxContactMethods}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-bold text-[#0B1320] dark:text-white">
                    {lang === 'ar'
                      ? 'الأرشيف لا يستهلك الحد النشط'
                      : 'Archived Items Excluded from Quota'}
                  </td>
                  {activePlans.map((p) => (
                    <td key={p.id} className="py-3.5 px-4 text-center">
                      <Check className="w-4 h-4 text-[#19B5A5] mx-auto" aria-hidden="true" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-bold text-[#0B1320] dark:text-white">
                    {lang === 'ar' ? 'تصدير كود QR بصيغة SVG للطباعة' : 'Print-Ready SVG QR Export'}
                  </td>
                  {activePlans.map((p) => (
                    <td key={p.id} className="py-3.5 px-4 text-center">
                      <Check className="w-4 h-4 text-[#19B5A5] mx-auto" aria-hidden="true" />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Enterprise Note (Without Inventing Pricing) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#0B1320] dark:text-white">
              {lang === 'ar'
                ? 'هل تحتاج إلى نطاق مؤسسي يتجاوز باقة Pro؟'
                : 'Need Custom Volume Beyond the Pro Tier?'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {lang === 'ar'
                ? 'تواصل معنا عبر مكتب الدعم لتنسيق المتطلبات الخاصة بالفرق الكبيرة أو التراخيص الموسعة.'
                : 'Contact our support desk directly to discuss custom quotas or extended organizational licensing.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('contact')}
            className="px-5 py-2.5 rounded-xl bg-[#0B1320] dark:bg-[#19B5A5] text-white dark:text-[#07101D] font-bold text-xs sm:text-sm whitespace-nowrap shrink-0"
          >
            {lang === 'ar' ? 'تواصل مع الدعم' : 'Contact Support'}
          </button>
        </div>

        <CheckoutModal
          isOpen={Boolean(checkoutPlan)}
          onClose={() => setCheckoutPlan(null)}
          orderType="subscription_upgrade"
          plan={checkoutPlan || undefined}
          defaultDuration={billingDuration}
        />
      </div>
    </div>
  );
};

export const DesignStorePage: React.FC = () => {
  const {
    lang,
    theme,
    authUser,
    profile,
    issuedLicenses,
    designs,
    navigate,
    favoriteTemplateIds,
    toggleFavoriteTemplateInSession,
    platformSettings,
    itemDraftTemplateReturnActive,
    selectTemplateForPendingItemDraft,
  } = useApp();
  const [selectedDomain, setSelectedDomain] = useState<'all' | TemplateDomainCategory>('all');
  const [selectedScope, setSelectedScope] = useState<'all' | TemplateScope>('all');
  const [selectedStyle, setSelectedStyle] = useState<StyleClusterId>('all');
  const [priceFilter, setPriceFilter] = useState<TemplatePriceFilter>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<TemplateOwnershipFilter>('all');
  const [ipFilter, setIpFilter] = useState<TemplateIpFilter>('all');
  const [sortBy, setSortBy] = useState<TemplateSortBy>('featured');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutTemplate, setCheckoutTemplate] = useState<TagDesignTemplate | null>(null);
  const [heroSpotIdx, setHeroSpotIdx] = useState(0);

  const purchasedTemplateIds = useMemo(
    () => getIssuedPurchasedTemplateIdSet(issuedLicenses),
    [issuedLicenses]
  );

  const visibleDesigns = useMemo(() => getActiveCatalogTemplates(designs), [designs]);
  const breakdown = useMemo(() => summarizeActiveCatalogBreakdown(designs), [designs]);
  const ownershipStats = useMemo(
    () =>
      summarizeLibraryOwnership({
        templates: designs,
        userPlan: profile.plan,
        purchasedTemplateIds,
      }),
    [designs, profile.plan, purchasedTemplateIds]
  );

  const pilotShowcaseDesigns = useMemo(
    () => visibleDesigns.filter((d) => Boolean(d.isPilotShowcase)),
    [visibleDesigns]
  );
  const safeSpotIdx = pilotShowcaseDesigns.length > 0 ? heroSpotIdx % pilotShowcaseDesigns.length : 0;
  const heroSpotlightDesign = pilotShowcaseDesigns[safeSpotIdx] || visibleDesigns[0];
  const heroSpotlightMedia = heroSpotlightDesign
    ? getTemplateShowcaseMedia(heroSpotlightDesign.id)
    : null;

  const filteredDesigns = useMemo(
    () =>
      filterAndSortLibraryTemplates(designs, {
        domain: selectedDomain,
        scope: selectedScope,
        styleCluster: selectedStyle,
        priceFilter,
        ownershipFilter,
        userPlan: profile.plan,
        purchasedTemplateIds,
        ipFilter,
        favoritesOnly,
        favoriteIds: favoriteTemplateIds,
        searchQuery,
        sortBy,
      }),
    [
      designs,
      selectedDomain,
      selectedScope,
      selectedStyle,
      priceFilter,
      ownershipFilter,
      profile.plan,
      purchasedTemplateIds,
      ipFilter,
      sortBy,
      favoritesOnly,
      favoriteTemplateIds,
      searchQuery,
    ]
  );

  const filteredPilotDesigns = useMemo(
    () => filteredDesigns.filter((d) => Boolean(d.isPilotShowcase)),
    [filteredDesigns]
  );

  const filteredArchiveDesigns = useMemo(
    () => filteredDesigns.filter((d) => !d.isPilotShowcase),
    [filteredDesigns]
  );

  const totalMatchedCount = filteredDesigns.length;

  if (platformSettings.enableDesignStore === false) {
    return (
      <div className="py-16 max-w-3xl mx-auto px-4 text-center space-y-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-10 space-y-3">
          <h1 className="text-2xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'متجر التصاميم متوقف مؤقتًا للصيانة' : 'Design Store Temporarily Paused'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {lang === 'ar'
              ? 'يمكنك متابعة استخدام قوالب أغراضك الحالية من لوحة المستخدم.'
              : 'You can continue managing your existing items and QR codes in the Workspace.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Storefront Header: Commercial Printable QR Labels Positioning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F9D8E] dark:text-[#2DD4BF]">
            {lang === 'ar'
              ? `مكتبة تصميمات ملصقات QR القابلة للطباعة · ${visibleDesigns.length} تصميمًا معتمدًا`
              : `PRINTABLE QR LABEL DESIGN LIBRARY · ${visibleDesigns.length} CURATED DESIGNS`}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1320] dark:text-white text-balance">
            {lang === 'ar'
              ? 'تصميمات رقمية احترافية لملصقات QR الجاهزة للتخصيص والطباعة'
              : 'Commercial Printable & Customizable QR Label Designs'}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {lang === 'ar'
              ? 'منتجات رقمية مصممة للطباعة على الفينيل المقاوم للماء والخامات المطفية واللامعة — كل تصميم يأتي بثلاثة أصول متطابقة ١:١ (ملف تحريري + ملف طباعة 300 DPI + معاينة استوديو 3D واقعية).'
              : 'Digital label products engineered for adhesive vinyl, matte laminates, washable glossy stock, and industrial polyester—each with 3 synchronized 1:1 assets (Editable Vector, 300 DPI Print File, and interactive 3D Studio Mockup).'}
          </p>

          {/* 5 Storefront Discovery Domain Categories */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            {REORGANIZED_DOMAIN_CATEGORIES.map((cat) => {
              const count =
                cat.id === 'all' ? breakdown.activeTotal : breakdown.byDomain[cat.id];
              return (
                <button
                  key={cat.id}
                  type="button"
                  data-testid={`store-domain-${cat.id}`}
                  onClick={() => setSelectedDomain(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                    selectedDomain === cat.id
                      ? 'bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17]'
                      : 'bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#19B5A5]'
                  }`}
                >
                  <span>{lang === 'ar' ? cat.ar : cat.en}</span>
                  <span className="font-mono text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5">
          {heroSpotlightDesign ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#EFECE6] dark:bg-[#0B1322] shadow-xl">
              <button
                type="button"
                onClick={() => navigate('design-details', { designId: heroSpotlightDesign.id })}
                aria-label={
                  lang === 'ar'
                    ? `استكشاف ${heroSpotlightDesign.titleAr}`
                    : `Explore ${heroSpotlightDesign.titleEn}`
                }
                className="block w-full aspect-[4/3] relative overflow-hidden group text-start"
              >
                {heroSpotlightMedia?.hasLifestylePhotography &&
                (heroSpotlightMedia.lifestyleSlides[1] || heroSpotlightMedia.lifestyleSlides[0]) ? (
                  <img
                    src={
                      (heroSpotlightMedia.lifestyleSlides[1] || heroSpotlightMedia.lifestyleSlides[0])
                        .imageUrl
                    }
                    alt={
                      lang === 'ar'
                        ? (heroSpotlightMedia.lifestyleSlides[1] || heroSpotlightMedia.lifestyleSlides[0])
                            .altAr
                        : (heroSpotlightMedia.lifestyleSlides[1] || heroSpotlightMedia.lifestyleSlides[0])
                            .altEn
                    }
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <PilotCard3dPreview
                    design={heroSpotlightDesign}
                    darkTheme={theme === 'dark'}
                    viewAngle="hero"
                  />
                )}
              </button>
              <div className="p-4 bg-white dark:bg-[#0F1A2B] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#17243A] dark:text-white truncate">
                    {lang === 'ar' ? heroSpotlightDesign.titleAr : heroSpotlightDesign.titleEn}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {lang === 'ar'
                      ? 'عرض تطبيقي واقعي · 4 صور معاينة لكل قالب'
                      : 'Real-Product Showcase · 4 Views Per Template'}
                  </p>
                </div>
                {pilotShowcaseDesigns.length > 1 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      aria-label={lang === 'ar' ? 'التصميم السابق' : 'Previous Spotlight'}
                      onClick={() =>
                        setHeroSpotIdx((prev) =>
                          (prev - 1 + pilotShowcaseDesigns.length) % pilotShowcaseDesigns.length
                        )
                      }
                      className="w-7 h-7 rounded-lg bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center hover:border-[#19B5A5]"
                    >
                      {lang === 'ar' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                    </button>
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-300 tabular-nums px-1">
                      {safeSpotIdx + 1} / {pilotShowcaseDesigns.length}
                    </span>
                    <button
                      type="button"
                      aria-label={lang === 'ar' ? 'التصميم التالي' : 'Next Spotlight'}
                      onClick={() =>
                        setHeroSpotIdx((prev) => (prev + 1) % pilotShowcaseDesigns.length)
                      }
                      className="w-7 h-7 rounded-lg bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center hover:border-[#19B5A5]"
                    >
                      {lang === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Scope, Style Discovery & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              {
                id: 'all' as const,
                ar: `الكل (${breakdown.activeTotal})`,
                en: `All (${breakdown.activeTotal})`,
              },
              {
                id: 'general' as const,
                ar: `عام (${breakdown.byScope.general})`,
                en: `General (${breakdown.byScope.general})`,
              },
              {
                id: 'specialized' as const,
                ar: `متخصص (${breakdown.byScope.specialized})`,
                en: `Specialized (${breakdown.byScope.specialized})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`store-scope-${tab.id}`}
                onClick={() => setSelectedScope(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 ${
                  selectedScope === tab.id
                    ? 'bg-[#19B5A5] text-[#070D17]'
                    : 'bg-[#F4F7FB] dark:bg-[#070D17] text-slate-600 dark:text-slate-300'
                }`}
              >
                {lang === 'ar' ? tab.ar : tab.en}
              </button>
            ))}

            <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:inline-block" />

            {STYLE_DISCOVERY_CLUSTERS.map((cluster) => {
              const count =
                cluster.id === 'all'
                  ? breakdown.activeTotal
                  : breakdown.byStyleCluster[cluster.id];
              return (
                <button
                  key={cluster.id}
                  type="button"
                  data-testid={`store-style-${cluster.id}`}
                  onClick={() => setSelectedStyle(cluster.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                    selectedStyle === cluster.id
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#F4F7FB] dark:bg-[#070D17] text-slate-600 dark:text-slate-300 hover:border-[#2563EB]'
                  }`}
                >
                  {lang === 'ar' ? cluster.ar : cluster.en}{' '}
                  <span className="font-mono text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {/* Ownership Filter when Signed In or Draft Active */}
            {authUser && (
              <div
                role="group"
                aria-label={lang === 'ar' ? 'تصفية حسب الملكية' : 'Ownership filter'}
                className="inline-flex items-center p-1 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
              >
                {(
                  [
                    { id: 'all' as const, ar: 'الكل', en: 'All' },
                    {
                      id: 'owned' as const,
                      ar: `مملوكة لي (${ownershipStats.ownedCount})`,
                      en: `Owned (${ownershipStats.ownedCount})`,
                    },
                    {
                      id: 'unowned' as const,
                      ar: `غير مملوكة (${ownershipStats.unownedCount})`,
                      en: `Not Owned (${ownershipStats.unownedCount})`,
                    },
                  ] as const
                ).map((own) => (
                  <button
                    key={own.id}
                    type="button"
                    data-testid={`store-ownership-${own.id}`}
                    onClick={() => setOwnershipFilter(own.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors whitespace-nowrap ${
                      ownershipFilter === own.id
                        ? 'bg-[#2563EB] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'ar' ? own.ar : own.en}
                  </button>
                ))}
              </div>
            )}

            {/* Free vs Premium Pricing Filter */}
            <div
              role="group"
              aria-label={lang === 'ar' ? 'تصفية حسب السعر' : 'Filter by tier'}
              className="inline-flex items-center p-1 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-700"
            >
              {(
                [
                  { id: 'all' as const, ar: 'الكل', en: 'All' },
                  { id: 'free' as const, ar: `مجاني (${breakdown.freeTotal})`, en: `Free (${breakdown.freeTotal})` },
                  { id: 'premium' as const, ar: `مميز (${breakdown.premiumTotal})`, en: `Premium (${breakdown.premiumTotal})` },
                ] as const
              ).map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  data-testid={`store-price-${tier.id}`}
                  onClick={() => setPriceFilter(tier.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors whitespace-nowrap ${
                    priceFilter === tier.id
                      ? 'bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17]'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {lang === 'ar' ? tier.ar : tier.en}
                </button>
              ))}
            </div>

            {platformSettings.enableTemplateFavorites !== false && (
              <button
                type="button"
                onClick={() => setFavoritesOnly((prev) => !prev)}
                className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition-colors ${
                  favoritesOnly
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-[#F4F7FB] dark:bg-[#070D17] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
                <span>
                  {lang === 'ar'
                    ? `المفضلة (${favoriteTemplateIds.length})`
                    : `Favorites (${favoriteTemplateIds.length})`}
                </span>
              </button>
            )}

            {/* Sort Selector */}
            <select
              aria-label={lang === 'ar' ? 'ترتيب التصاميم' : 'Sort designs'}
              data-testid="store-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TemplateSortBy)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs font-bold text-[#17243A] dark:text-white"
            >
              <option value="featured">{lang === 'ar' ? 'ترتيب: المميزة أولاً' : 'Sort: Featured'}</option>
              <option value="popular">{lang === 'ar' ? 'ترتيب: الأكثر استخدامًا' : 'Sort: Most Popular'}</option>
              <option value="newest">{lang === 'ar' ? 'ترتيب: الأحدث' : 'Sort: Newest'}</option>
              <option value="price_asc">{lang === 'ar' ? 'ترتيب: الأقل سعرًا' : 'Sort: Price Low–High'}</option>
            </select>

            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute top-2.5 start-3.5" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث باسم التصميم أو النمط...' : 'Search designs, styles, or tags...'}
                aria-label={lang === 'ar' ? 'ابحث في القوالب' : 'Search templates'}
                className="w-full ps-10 pe-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Dedicated Anime & Cartoon Commercial Clearance Strip when Anime & Cartoon tab is active */}
        {selectedDomain === 'anime_cartoon' && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              {lang === 'ar'
                ? 'قسم الأنمي والكرتون يضم تصاميم كرتونية وألعاب أصلية 100% جاهزة للتجارة، إلى جانب تصاميم أنمي مرجعية تتطلب التحقق من الحقوق التجارية قبل البيع.'
                : 'Anime & Cartoon includes 100% original commercial cartoon/gaming designs plus reference anime editions flagged for commercial IP verification.'}
            </p>
            <div className="inline-flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                data-testid="store-ip-all"
                onClick={() => setIpFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  ipFilter === 'all'
                    ? 'bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17]'
                    : 'bg-[#F4F7FB] dark:bg-[#070D17] text-slate-600 dark:text-slate-300'
                }`}
              >
                {lang === 'ar' ? 'عرض كل القسم' : 'All in Section'}
              </button>
              <button
                type="button"
                data-testid="store-ip-original"
                onClick={() => setIpFilter('original_only')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  ipFilter === 'original_only'
                    ? 'bg-[#0F9D8E] text-white'
                    : 'bg-[#F4F7FB] dark:bg-[#070D17] text-slate-600 dark:text-slate-300'
                }`}
              >
                {lang === 'ar' ? 'أصلية تجارية ١٠٠٪ فقط' : '100% Original Commercial Only'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span data-testid="store-results-counter">
          {lang === 'ar'
            ? `يتم عرض ${totalMatchedCount} من أصل ${visibleDesigns.length} تصميم ملصق نشط · ${breakdown.freeTotal} مجانية و ${breakdown.premiumTotal} مميزة`
            : `Showing ${totalMatchedCount} of ${visibleDesigns.length} active printable designs · ${breakdown.freeTotal} Free & ${breakdown.premiumTotal} Premium`}
        </span>
        <span className="text-[11px]">
          {lang === 'ar'
            ? 'جميع صور العرض تستخدم كود QR تجريبيًا منفصلًا عن ملف الطباعة الصافي'
            : 'All showcase images use a Demo QR strictly separated from clean blank print files'}
        </span>
      </div>

      {totalMatchedCount === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-10 text-center space-y-3">
          <p className="text-base font-bold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'لا توجد تصاميم مطابقة للبحث الحالي' : 'No matching label designs found'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedDomain('all');
              setSelectedScope('all');
              setSelectedStyle('all');
              setPriceFilter('all');
              setIpFilter('all');
              setSortBy('featured');
              setFavoritesOnly(false);
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold"
          >
            {lang === 'ar' ? 'إعادة ضبط وعرض جميع التصاميم' : 'Reset & Show All Designs'}
          </button>
        </div>
      ) : (
        <div className="space-y-14">
          {/* SECTION 1: Curated Active Printable Label Collection */}
          {filteredPilotDesigns.length > 0 && (
            <section
              aria-labelledby="pilot-showcase-heading"
              data-testid="pilot-collection-section"
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F9D8E] dark:text-[#19B5A5]">
                    {lang === 'ar'
                      ? `المجموعة المعتمدة · ${filteredPilotDesigns.length} تصميمًا تجاريًا جاهزًا للطباعة`
                      : `CURATED CATALOG · ${filteredPilotDesigns.length} BESPOKE PRINTABLE LABEL PRODUCTS`}
                  </p>
                  <h2
                    id="pilot-showcase-heading"
                    className="text-2xl font-extrabold text-[#17243A] dark:text-white"
                  >
                    {lang === 'ar'
                      ? 'تصاميم ملصقات قابلة للتخصيص والطباعة الاحترافية'
                      : 'Printable & Customizable Label Collection'}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'ar'
                    ? 'معاينة ثلاثية الأبعاد متزامنة ١:١ مع ملف الطباعة 300 DPI'
                    : 'Interactive 3D previews synced 1:1 with exact 300 DPI Print files'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPilotDesigns.map((design) => {
                  const ownership = authUser
                    ? getTemplateOwnershipStatus({
                        template: design,
                        userPlan: profile.plan,
                        purchasedTemplateIds,
                      })
                    : undefined;
                  return (
                    <TemplateShowcaseCard
                      key={design.id}
                      design={design}
                      lang={lang}
                      darkTheme={theme === 'dark'}
                      isFavorite={favoriteTemplateIds.includes(design.id)}
                      showFavorites={platformSettings.enableTemplateFavorites !== false}
                      ownershipStatus={ownership}
                      ownershipPlanLabel={profile.plan}
                      selectLabel={
                        itemDraftTemplateReturnActive
                          ? lang === 'ar'
                            ? 'اختيار والعودة'
                            : 'Select & Return'
                          : lang === 'ar'
                          ? 'استخدام'
                          : 'Use'
                      }
                      onToggleFavorite={(id) => void toggleFavoriteTemplateInSession(id)}
                      onExplore={(id) => navigate('design-details', { designId: id })}
                      onUnlock={() => setCheckoutTemplate(design)}
                      onSelectDesign={(id) => {
                        if (ownership === 'locked') {
                          setCheckoutTemplate(design);
                          return;
                        }
                        if (itemDraftTemplateReturnActive) {
                          selectTemplateForPendingItemDraft(id, true);
                        } else {
                          navigate('add-item', { designId: id });
                        }
                      }}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 2: Additional Standard Published Templates (only if any custom non-pilot template is published) */}
          {filteredArchiveDesigns.length > 0 && (
            <section aria-labelledby="archive-catalog-heading" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    {lang === 'ar'
                      ? 'قوالب قياسية منشورة إضافية'
                      : 'ADDITIONAL PUBLISHED TEMPLATES'}
                  </p>
                  <h2
                    id="archive-catalog-heading"
                    className="text-xl font-extrabold text-[#17243A] dark:text-white"
                  >
                    {lang === 'ar'
                      ? `القوالب القياسية الإضافية (${filteredArchiveDesigns.length})`
                      : `Standard Templates (${filteredArchiveDesigns.length})`}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArchiveDesigns.map((design) => {
                  const isFav = favoriteTemplateIds.includes(design.id);
                  const isFreeTpl = design.isFree || design.priceSar === 0;
                  return (
                    <div
                      key={design.id}
                      data-testid={`design-card-${design.id}`}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 flex flex-col justify-between findit-card-hover"
                    >
                      <div>
                        <div className="relative rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] p-5 flex items-center justify-center border border-slate-200/70 dark:border-slate-800 mb-5 min-h-[210px]">
                          {platformSettings.enableTemplateFavorites !== false && (
                            <button
                              type="button"
                              aria-label={
                                lang === 'ar'
                                  ? `حفظ ${design.titleAr} في المفضلة`
                                  : `Favorite ${design.titleEn}`
                              }
                              onClick={() => void toggleFavoriteTemplateInSession(design.id)}
                              className={`absolute top-2.5 end-2.5 p-2 rounded-xl border transition-colors ${
                                isFav
                                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-500'
                                  : 'bg-white/90 dark:bg-[#0F1A2B]/90 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                            </button>
                          )}
                          <TagProductPreview
                            seed={design.slug}
                            primaryHex={design.primaryHex}
                            secondaryHex={design.secondaryHex}
                            badgeColorHex={design.badgeColorHex}
                            silhouette={design.shapeSilhouette}
                            badgeText="SCAN TO RETURN"
                            size="sm"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>
                            {design.dimensionsMm} · {design.weatherproofRating}
                          </span>
                          <span
                            className={`font-sans font-extrabold ${
                              design.templateScope === 'specialized'
                                ? 'text-[#E05D38] dark:text-[#FF8A65]'
                                : 'text-[#0F9D8E] dark:text-[#19B5A5]'
                            }`}
                          >
                            {design.templateScope === 'specialized'
                              ? lang === 'ar'
                                ? design.specialtyBadgeAr || 'قالب متخصص'
                                : design.specialtyBadgeEn || 'Specialized'
                              : lang === 'ar'
                              ? 'قالب عام'
                              : 'General'}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-[#17243A] dark:text-white mt-2">
                          {lang === 'ar' ? design.titleAr : design.titleEn}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                          {lang === 'ar' ? design.subtitleAr : design.subtitleEn}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="font-mono font-extrabold text-sm text-[#2563EB] dark:text-[#19B5A5] tabular-nums">
                          {isFreeTpl
                            ? lang === 'ar'
                              ? 'مجاني'
                              : 'Free'
                            : lang === 'ar'
                            ? `${design.priceSar} ر.س`
                            : `$${design.priceUsd}`}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate('design-details', { designId: design.id })}
                            className="px-3 py-2 rounded-xl bg-[#17243A] dark:bg-slate-800 hover:bg-[#2563EB] text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                          >
                            {lang === 'ar' ? 'المعاينة' : 'Inspect'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCheckoutTemplate(design)}
                            className="px-3 py-2 rounded-xl bg-[#19B5A5] hover:bg-teal-400 text-[#070D17] text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>
                              {isFreeTpl ? (lang === 'ar' ? 'ترخيص' : 'Claim') : lang === 'ar' ? 'شراء' : 'Buy'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('add-item', { designId: design.id })}
                            className="px-3 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                          >
                            {lang === 'ar' ? 'استخدام' : 'Use'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      <CheckoutModal
        isOpen={Boolean(checkoutTemplate)}
        onClose={() => setCheckoutTemplate(null)}
        orderType="template_purchase"
        template={checkoutTemplate || undefined}
      />
    </div>
  );
};

export const DesignDetailsPage: React.FC = () => {
  const {
    lang,
    theme,
    authUser,
    profile,
    issuedLicenses,
    designs,
    selectedDesignId,
    navigate,
    showToast,
    favoriteTemplateIds,
    toggleFavoriteTemplateInSession,
    platformSettings,
    itemDraftTemplateReturnActive,
    selectTemplateForPendingItemDraft,
  } = useApp();
  const design = designs.find((d) => d.id === selectedDesignId) ?? designs[0];
  const [showCheckout, setShowCheckout] = useState(false);

  const purchasedTemplateIds = useMemo(
    () => getIssuedPurchasedTemplateIdSet(issuedLicenses),
    [issuedLicenses]
  );

  const ownershipStatus = authUser
    ? getTemplateOwnershipStatus({
        template: design,
        userPlan: profile.plan,
        purchasedTemplateIds,
      })
    : undefined;

  return (
    <>
      <TemplateDetailShowcase
        design={design}
        lang={lang}
        darkTheme={theme === 'dark'}
        isFavorite={favoriteTemplateIds.includes(design.id)}
        showFavorites={platformSettings.enableTemplateFavorites !== false}
        ownershipStatus={ownershipStatus}
        userPlanLabel={profile.plan}
        draftReturnActive={itemDraftTemplateReturnActive}
        onToggleFavorite={() => void toggleFavoriteTemplateInSession(design.id)}
        onPurchase={() => setShowCheckout(true)}
        onUseDesign={() => {
          const isLockedPaid =
            !(design.isFree || design.priceSar === 0) &&
            (ownershipStatus === 'locked' || !authUser);
          if (isLockedPaid) {
            setShowCheckout(true);
            return;
          }
          if (itemDraftTemplateReturnActive) {
            selectTemplateForPendingItemDraft(design.id, true);
            showToast(
              'success',
              lang === 'ar' ? 'تم اختيار التصميم' : 'Design Selected',
              lang === 'ar'
                ? 'تم تحديث القالب وإعادتك لنموذج الغرض مع الاحتفاظ بكافة بياناتك.'
                : 'Updated template and returned to your item form with all fields intact.'
            );
            return;
          }
          showToast(
            'success',
            lang === 'ar' ? 'تم اختيار التصميم' : 'Design Selected',
            lang === 'ar'
              ? 'تم توجيهك لصفحة إضافة غرض جديد مع ربط هذا التصميم تلقائيًا.'
              : 'Redirected to Add New Item with this design pre-selected.'
          );
          navigate('add-item', { designId: design.id });
        }}
        onBackToStore={() =>
          navigate(itemDraftTemplateReturnActive ? 'design-library' : 'design-store')
        }
        onOpenLibrary={() => navigate('design-library')}
        onViewPurchases={() => navigate('my-purchases')}
        onNotify={(type, title, desc) => showToast(type, title, desc)}
      />

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        orderType="template_purchase"
        template={design}
      />
    </>
  );
};
