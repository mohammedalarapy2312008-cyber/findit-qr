import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  FolderKanban,
  Layers,
  Lock,
  QrCode,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import {
  MidnightCtaBand,
  MidnightMediaFrame,
} from '../../components/marketing/MarketingPrimitives';
import { useApp } from '../../context/AppContext';
import { VISUAL_ASSETS } from '../../data/foundationCatalog';
import { getTemplateShowcaseMedia } from '../../data/pilotShowcaseMedia';
import {
  BILLING_DURATION_OPTIONS,
  BillingDurationId,
} from '../../data/plansCatalog';
import { ManagedPlanDefinition } from '../../types/domain';
import { getActiveCatalogTemplates } from '../../utils/templateDiscovery';

function formatHomePlanPrice(
  plan: ManagedPlanDefinition,
  duration: BillingDurationId,
  lang: 'ar' | 'en',
  currency: 'SAR' | 'USD'
): { primary: string; note: string } {
  const sar =
    duration === '3m' ? plan.quarterlySar : duration === '12m' ? plan.yearlySar : plan.monthlySar;
  const usd =
    duration === '3m' ? plan.quarterlyUsd : duration === '12m' ? plan.yearlyUsd : plan.monthlyUsd;

  if (sar === 0 && usd === 0) {
    return {
      primary: lang === 'ar' ? 'مجانًا' : '$0 / Free',
      note: lang === 'ar' ? 'للأفراد والتجربة الأساسية' : 'Free starter tier',
    };
  }

  const primary =
    currency === 'USD'
      ? `$${usd}`
      : lang === 'ar'
      ? `${sar} ر.س`
      : `${sar} SAR`;

  const note =
    duration === '1m'
      ? lang === 'ar'
        ? 'لمدة شهر واحد'
        : 'per 1 month'
      : duration === '3m'
      ? lang === 'ar'
        ? 'لمدة ٣ أشهر'
        : 'for 3 months'
      : lang === 'ar'
      ? 'لمدة ١٢ شهرًا'
      : 'for 12 months';

  return { primary, note };
}

function formatArabicQuotaItemLabel(count: number): string {
  if (count === 1) return 'غرض نشط واحد';
  if (count === 2) return 'غرضان نشطان';
  if (count >= 3 && count <= 10) return `حتى ${count} أغراض نشطة`;
  return `حتى ${count} غرضًا نشطًا`;
}

function formatArabicQuotaChannelLabel(count: number): string {
  if (count === 1) return 'وسيلة تواصل واحدة لكل غرض';
  if (count === 2) return 'وسيلتا تواصل لكل غرض';
  if (count >= 3 && count <= 10) return `حتى ${count} وسائل تواصل لكل غرض`;
  return `حتى ${count} وسيلة تواصل لكل غرض`;
}

export const HomePage: React.FC = () => {
  const { lang, isRtl, navigate, authUser, designs, plans, platformSettings } = useApp();
  const [billingDuration, setBillingDuration] = useState<BillingDurationId>('1m');
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const activeTemplates = useMemo(() => getActiveCatalogTemplates(designs), [designs]);
  const featuredTemplates = useMemo(() => {
    const withMedia = activeTemplates.filter((tpl) => {
      const media = getTemplateShowcaseMedia(tpl.id);
      return Boolean(media?.hasLifestylePhotography && media.lifestyleSlides.length > 0);
    });
    const pool = withMedia.length >= 4 ? withMedia : activeTemplates;
    return pool.slice(0, 4);
  }, [activeTemplates]);

  const activePlans = useMemo(
    () => plans.filter((p) => p.isActive !== false),
    [plans]
  );

  const quickSteps = [
    {
      num: '01',
      titleAr: 'سجّل مقتنياتك وخصص خصوصيتك',
      titleEn: 'Register Items & Set Privacy Rules',
      descAr: 'أضف الغرض وحدد القنوات المسموح بظهورها للمكتشف أو فعّل الوسيط المجهول.',
      descEn: 'Add your item and pick exact visible contact channels or Anonymous Relay.',
    },
    {
      num: '02',
      titleAr: 'اربط الرمز واطبع الملصق المناسب',
      titleEn: 'Link Your QR & Print a Ready Tag',
      descAr: 'ولّد رمز QR قياسيًا فرديًا أو مشتركًا، واختر قالب الطباعة من مكتبة القوالب.',
      descEn: 'Generate an individual or shared ISO QR code and select a print-ready template.',
    },
    {
      num: '03',
      titleAr: 'مسح فوري واسترداد آمن بدون تطبيق',
      titleEn: 'Instant Browser Scan & Safe Return',
      descAr: 'يمسح المكتشف الرمز بكاميرا هاتفه لتفتح صفحة الاسترداد ويصلك تنبيه فوري.',
      descEn: 'Finders scan with any phone camera—no app needed—to alert and contact you safely.',
    },
  ];

  const featureHighlights = [
    {
      icon: FolderKanban,
      titleAr: 'إدارة الأغراض والمجموعات',
      titleEn: 'Items & Shared QR Groups',
      descAr: 'نظّم مقتنياتك بسهولة واربط عدة أغراض برمز QR مشترك واحد مع تحكم مستقل بإظهار كل غرض.',
      descEn: 'Organize belongings into folders or link multiple items to a single Shared QR with per-item visibility.',
    },
    {
      icon: QrCode,
      titleAr: 'رموز QR دائمة وقابلة للإدارة',
      titleEn: 'Dynamic ISO QR Control',
      descAr: 'حدّث رسالتك أو قنوات تواصلك أو أوقف الرمز مؤقتًا عن بُعد دون الحاجة لإعادة طباعة الملصق.',
      descEn: 'Update recovery notes, toggle channels, or pause a code remotely without reprinting the tag.',
    },
    {
      icon: Bell,
      titleAr: 'صفحات استرداد وتنبيهات فورية',
      titleEn: 'Bilingual Recovery & Alerts',
      descAr: 'صفحات استرداد بالعربية والإنجليزية تعمل في المتصفح مع سجل مسح وإشعارات مباشرة في لوحة التحكم.',
      descEn: 'Arabic & English browser recovery screens backed by scan logs and real-time notifications.',
    },
    {
      icon: Lock,
      titleAr: 'خصوصية مصممة للتحكم الكامل',
      titleEn: 'Owner-Controlled Privacy',
      descAr: 'لا بيانات شخصية داخل الرمز نفسه، مع خيار الوسيط المجهول وإخفاء الأرقام بنقرة واحدة.',
      descEn: 'Zero personal data inside the QR matrix itself, with Anonymous Relay and one-click hide.',
    },
  ];

  return (
    <div>
      {/* 1. Hero Section — Midnight Teal Architectural Split */}
      <section className="relative overflow-hidden findit-hero-grid border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F9D8E] dark:text-[#2DD4BF]">
                {lang === 'ar'
                  ? 'حماية واسترداد ذكي للمقتنيات · FINDIT QR'
                  : 'SMART QR PROPERTY RECOVERY · FINDIT QR'}
              </p>

              <h1
                style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}
                className="font-extrabold text-[#0B1320] dark:text-white leading-[1.14] tracking-tight text-balance"
              >
                {lang === 'ar'
                  ? 'اربط مقتنياتك برمز QR ذكي يعيدها إليك بأمان وخصوصية.'
                  : 'Tag Your Belongings With Smart QR Codes Built for Safe, Private Return.'}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                {lang === 'ar'
                  ? 'أنشئ رموز QR فردية أو مشتركة لحقائبك وأجهزتك ومفاتيحك وأصول عملك. عند مسح الرمز بأي هاتف، تفتح صفحة استرداد فورية بدون تطبيق ومع تحكم كامل فيما يراه المكتشف.'
                  : 'Create individual or shared QR tags for bags, devices, keys, and team equipment. Any smartphone camera opens a bilingual recovery page with zero app required and complete privacy control.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => navigate(authUser ? 'dashboard' : 'register')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] dark:bg-[#19B5A5] dark:hover:bg-[#14A394] text-white dark:text-[#07101D] font-extrabold text-sm sm:text-base transition-colors whitespace-nowrap shrink-0 shadow-md shadow-[#19B5A5]/20"
                >
                  <span>
                    {authUser
                      ? lang === 'ar'
                        ? 'الانتقال إلى لوحة التحكم'
                        : 'Open Dashboard'
                      : lang === 'ar'
                      ? 'ابدأ مجانًا الآن'
                      : 'Start Free Now'}
                  </span>
                  <ArrowIcon className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('how-it-works')}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white dark:bg-[#111E33] border border-slate-300 dark:border-slate-700 hover:border-[#19B5A5] text-[#0B1320] dark:text-slate-100 font-bold text-sm sm:text-base transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{lang === 'ar' ? 'كيف تعمل المنصة؟' : 'See How It Works'}</span>
                </button>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>
                  {lang === 'ar' ? 'يعمل بكاميرا أي هاتف بدون تطبيق' : 'Works with any phone camera'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {lang === 'ar'
                    ? `${activeTemplates.length} قالب طباعة معتمد`
                    : `${activeTemplates.length} Print-Ready Templates`}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {lang === 'ar' ? 'عربي RTL وإنجليزي LTR' : 'Full Arabic & English Support'}
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <MidnightMediaFrame
                src={VISUAL_ASSETS.hero3d}
                alt={
                  lang === 'ar'
                    ? 'مشهد ثلاثي الأبعاد لمقتنيات يومية تشمل حقيبة سفر وحاسوبًا وميدالية مفاتيح مزودة برموز FindIt QR'
                    : '3D studio scene of Midnight Teal travel luggage, laptop, and leather key fob equipped with smart FindIt QR recovery tags'
                }
                caption={
                  lang === 'ar'
                    ? 'ملصقات وميداليات QR قياسية مصممة للأجهزة، حقائب السفر، المفاتيح، وأصول الفرق.'
                    : 'ISO-grade smart QR labels and tags engineered for luggage, laptops, keys, and team equipment.'
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Brief How It Works Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F9D8E] dark:text-[#2DD4BF]">
              {lang === 'ar' ? 'طريقة العمل بإيجاز' : 'HOW IT WORKS'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white text-balance">
              {lang === 'ar'
                ? 'من التسجيل إلى استرداد المفقود في ثلاث خطوات واضحة'
                : 'From Setup to Safe Recovery in Three Clear Steps'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate('how-it-works')}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0F9D8E] dark:text-[#2DD4BF] hover:underline whitespace-nowrap shrink-0"
          >
            <span>{lang === 'ar' ? 'استعرض الدليل الكامل' : 'Explore Full Workflow'}</span>
            <ArrowIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickSteps.map((step) => (
            <div
              key={step.num}
              className="findit-card-hover rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0E192B] p-6 sm:p-7 space-y-3"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#0B1320] dark:bg-[#19B5A5]/15 text-[#2DD4BF] font-mono font-bold text-sm tabular-nums">
                {step.num}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#0B1320] dark:text-white">
                {lang === 'ar' ? step.titleAr : step.titleEn}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'ar' ? step.descAr : step.descEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Brief Features Preview */}
      <section className="bg-white dark:bg-[#0A1322] border-y border-slate-200/80 dark:border-slate-800/80 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F9D8E] dark:text-[#2DD4BF]">
                {lang === 'ar' ? 'أبرز المميزات' : 'CORE CAPABILITIES'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white text-balance">
                {lang === 'ar'
                  ? 'كل ما تحتاجه لإدارة مقتنياتك ورموز QR من مكان واحد'
                  : 'Everything You Need to Protect Belongings and Control QR Access'}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate('features')}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0F9D8E] dark:text-[#2DD4BF] hover:underline whitespace-nowrap shrink-0"
            >
              <span>{lang === 'ar' ? 'اطّلع على جميع المميزات' : 'View All Features'}</span>
              <ArrowIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureHighlights.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="findit-card-hover rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-[#F7FAFC] dark:bg-[#0E192B] p-6 space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#2DD4BF] flex items-center justify-center">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-[#0B1320] dark:text-white">
                    {lang === 'ar' ? feat.titleAr : feat.titleEn}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {lang === 'ar' ? feat.descAr : feat.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Template Library Preview (Connected Directly to Live Active Catalog) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F9D8E] dark:text-[#2DD4BF]">
              {lang === 'ar' ? 'مكتبة القوالب الجاهزة للطباعة' : 'TEMPLATE LIBRARY PREVIEW'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white text-balance">
              {lang === 'ar'
                ? `${activeTemplates.length} قالب تصميم احترافي للملصقات والبطاقات الذكية`
                : `${activeTemplates.length} Curated Print-Ready QR Tag Templates`}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              {lang === 'ar'
                ? 'تصاميم مجانية ومدفوعة مقسّمة حسب نوع الغرض، مع معاينات واقعية وملفات جاهزة للطباعة.'
                : 'Free and premium templates tailored by item type, complete with realistic mockups and print-ready exports.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('design-store')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1320] dark:bg-[#19B5A5] text-white dark:text-[#07101D] font-bold text-sm hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
          >
            <Layers className="w-4 h-4" aria-hidden="true" />
            <span>{lang === 'ar' ? 'استكشف المكتبة الكاملة' : 'Browse Full Library'}</span>
            <ArrowIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTemplates.map((tpl) => {
            const media = getTemplateShowcaseMedia(tpl.id);
            const thumb =
              media?.cardLifestyleUrl ||
              media?.lifestyleSlides[0]?.imageUrl ||
              tpl.showcaseGallery?.mockup3dUrl ||
              VISUAL_ASSETS.hero3d;
            const isFree = tpl.isFree === true || tpl.priceSar === 0;
            const subtitleText =
              lang === 'ar'
                ? tpl.subtitleAr ||
                  tpl.materialAr ||
                  (Array.isArray(tpl.recommendedForAr) ? tpl.recommendedForAr.slice(0, 2).join(' · ') : '')
                : tpl.subtitleEn ||
                  tpl.materialEn ||
                  (Array.isArray(tpl.recommendedForEn) ? tpl.recommendedForEn.slice(0, 2).join(' · ') : '');
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => navigate('design-details', { designId: tpl.id })}
                className="group text-start findit-card-hover rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0E192B] flex flex-col"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-[#0A1322]">
                  <img
                    src={thumb}
                    alt={lang === 'ar' ? tpl.titleAr : tpl.titleEn}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#0B1320] dark:text-white line-clamp-1">
                      {lang === 'ar' ? tpl.titleAr : tpl.titleEn}
                    </h3>
                    {subtitleText && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {subtitleText}
                      </p>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                    <span className="text-[#0F9D8E] dark:text-[#2DD4BF] tabular-nums">
                      {isFree
                        ? lang === 'ar'
                          ? 'مجاني'
                          : 'Free'
                        : lang === 'ar'
                        ? `${tpl.priceSar} ر.س`
                        : `$${tpl.priceUsd}`}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 group-hover:text-[#0F9D8E] dark:group-hover:text-[#2DD4BF] transition-colors">
                      {lang === 'ar' ? 'معاينة القالب' : 'Preview'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Concise Pricing Preview (Canonical Project Plans Only) */}
      <section className="bg-white dark:bg-[#0A1322] border-y border-slate-200/80 dark:border-slate-800/80 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F9D8E] dark:text-[#2DD4BF]">
                {lang === 'ar' ? 'نظرة سريعة على الباقات' : 'PLANS OVERVIEW'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white text-balance">
                {lang === 'ar'
                  ? 'ابدأ مجانًا وتوسع مع نمو مقتنياتك'
                  : 'Start Free and Scale as Your Protected Items Grow'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div
                role="group"
                aria-label={lang === 'ar' ? 'مدة الاشتراك' : 'Subscription Duration'}
                className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F7FAFC] dark:bg-[#0E192B] border border-slate-200 dark:border-slate-800"
              >
                {BILLING_DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBillingDuration(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                      billingDuration === opt.id
                        ? 'bg-[#0F9D8E] dark:bg-[#19B5A5] text-white dark:text-[#07101D]'
                        : 'text-slate-600 dark:text-slate-300 hover:text-[#0B1320] dark:hover:text-white'
                    }`}
                  >
                    {lang === 'ar' ? opt.labelAr : opt.labelEn}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate('pricing')}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0F9D8E] dark:text-[#2DD4BF] hover:underline whitespace-nowrap"
              >
                <span>{lang === 'ar' ? 'مقارنة جميع الباقات' : 'Full Plan Comparison'}</span>
                <ArrowIcon className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activePlans.map((plan) => {
              const price = formatHomePlanPrice(
                plan,
                billingDuration,
                lang,
                platformSettings.defaultCurrency || 'SAR'
              );
              const isFree = plan.monthlySar === 0 && plan.monthlyUsd === 0;
              return (
                <div
                  key={plan.id}
                  className={`findit-card-hover rounded-2xl p-6 flex flex-col justify-between border ${
                    plan.featured
                      ? 'border-2 border-[#0F9D8E] dark:border-[#19B5A5] bg-[#F7FAFC] dark:bg-[#102036]'
                      : 'border-slate-200/90 dark:border-slate-800 bg-[#F7FAFC]/70 dark:bg-[#0E192B]'
                  }`}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-[#0F9D8E] dark:text-[#2DD4BF]">
                        {lang === 'ar' ? plan.audienceAr : plan.audienceEn}
                      </p>
                      <h3 dir="ltr" className="text-lg font-extrabold text-[#0B1320] dark:text-white mt-1 text-start">
                        {lang === 'ar' ? plan.nameAr : plan.nameEn}
                      </h3>
                    </div>

                    <div>
                      <p className="text-2xl font-extrabold text-[#0B1320] dark:text-white tabular-nums">
                        {price.primary}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {price.note}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <p className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#19B5A5] shrink-0" aria-hidden="true" />
                        <span className="tabular-nums">
                          {lang === 'ar'
                            ? formatArabicQuotaItemLabel(plan.maxActiveItems)
                            : `Up to ${plan.maxActiveItems} active items`}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#19B5A5] shrink-0" aria-hidden="true" />
                        <span className="tabular-nums">
                          {lang === 'ar'
                            ? formatArabicQuotaChannelLabel(plan.maxContactMethods)
                            : `Up to ${plan.maxContactMethods} contact channels`}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(isFree ? 'register' : 'pricing')}
                    className={`mt-6 w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-colors ${
                      plan.featured
                        ? 'bg-[#0F9D8E] hover:bg-[#0D8A7D] dark:bg-[#19B5A5] dark:hover:bg-[#14A394] text-white dark:text-[#07101D]'
                        : 'bg-white dark:bg-[#14233A] border border-slate-200 dark:border-slate-700 text-[#0B1320] dark:text-white hover:border-[#19B5A5]'
                    }`}
                  >
                    {isFree
                      ? lang === 'ar'
                        ? 'ابدأ مجانًا'
                        : 'Start Free'
                      : lang === 'ar'
                      ? 'تفاصيل الباقة'
                      : 'View Plan Details'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Privacy & Trust Teaser Linking to /privacy, /about, /faq */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 sm:p-10">
          <div className="lg:col-span-5">
            <MidnightMediaFrame
              src={VISUAL_ASSETS.privacy3d}
              alt={
                lang === 'ar'
                  ? 'تصميم ثلاثي الأبعاد يعبر عن الخصوصية والتحكم بالبيانات في FindIt QR'
                  : '3D Midnight Teal privacy shield visual representing owner-controlled contact privacy'
              }
              aspect="4/3"
            />
          </div>
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F9D8E] dark:text-[#2DD4BF]">
              {lang === 'ar' ? 'الخصوصية أولًا بالتصميم' : 'PRIVACY BY DESIGN'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white text-balance">
              {lang === 'ar'
                ? 'أنت تقرر بالضبط ما يظهر لمن يمسح الرمز'
                : 'You Decide Exactly What Any Finder Can See'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'ar'
                ? 'رمز QR المطبوع لا يحتوي على رقم هاتفك أو عنوانك؛ بل يرتبط بإعدادات الخصوصية في حسابك لتبديل القنوات أو تفعيل الوسيط المجهول أو إيقاف الرمز في أي وقت.'
                : 'Your physical tag never embeds your phone number or address. It resolves dynamically to your account privacy rules so you can toggle channels, use Anonymous Relay, or pause scanning anytime.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#19B5A5] shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm font-semibold text-[#0B1320] dark:text-slate-200">
                  {lang === 'ar'
                    ? 'إخفاء كامل لرقم الهاتف عند اختيار الوسيط المجهول'
                    : 'Hide phone numbers via Anonymous Relay'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Sliders className="w-5 h-5 text-[#19B5A5] shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm font-semibold text-[#0B1320] dark:text-slate-200">
                  {lang === 'ar'
                    ? 'إيقاف وأرشفة فورية لأي غرض بنقرة واحدة'
                    : 'Instant one-click pause & archiving'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('privacy')}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0F9D8E] dark:text-[#2DD4BF] hover:underline"
              >
                <span>{lang === 'ar' ? 'اعرف المزيد عن الخصوصية والأمان' : 'Explore Privacy & Security'}</span>
                <ArrowIcon className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>
              <button
                type="button"
                onClick={() => navigate('about')}
                className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-[#0F9D8E] dark:hover:text-[#2DD4BF] transition-colors"
              >
                {lang === 'ar' ? 'عن المنصة' : 'About FindIt QR'}
              </button>
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>
              <button
                type="button"
                onClick={() => navigate('faq')}
                className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-[#0F9D8E] dark:hover:text-[#2DD4BF] transition-colors"
              >
                {lang === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final Conversion CTA */}
      <MidnightCtaBand
        eyebrow={lang === 'ar' ? 'ابدأ اليوم' : 'GET STARTED TODAY'}
        title={
          lang === 'ar'
            ? 'احمِ مقتنياتك المهمة اليوم بحساب مجاني في FindIt QR'
            : 'Protect Your Essential Belongings Today With a Free FindIt QR Account'
        }
        subtitle={
          lang === 'ar'
            ? 'سجّل خلال ثوانٍ، أنشئ أول رمز QR، أو جرّب معاينة صفحة الاسترداد التي يراها من يعثر على غرضك.'
            : 'Sign up in seconds, generate your first ISO QR tag, or preview the exact browser screen a finder sees.'
        }
        primaryLabel={authUser ? (lang === 'ar' ? 'فتح لوحة التحكم' : 'Open Dashboard') : (lang === 'ar' ? 'إنشاء حساب مجاني' : 'Create Free Account')}
        primaryRoute={authUser ? 'dashboard' : 'register'}
        secondaryLabel={lang === 'ar' ? 'معاينة تجربة المسح' : 'Try Finder Scan Preview'}
        secondaryRoute="found-item"
      />
    </div>
  );
};
