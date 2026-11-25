import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Compass,
  Download,
  ExternalLink,
  Flag,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  QrCode,
  Send,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  downloadQrSvgMarkup,
  FindItLogo,
  QrCodeVector,
} from '../../components/brand/FindItLogo';
import { TagProductPreview } from '../../components/brand/TagProductPreview';
import { IllustrativeShowcaseNotice } from '../../components/common/DesignSystem';
import {
  MidnightCtaBand,
  PageHeroBand,
} from '../../components/marketing/MarketingPrimitives';
import { useApp } from '../../context/AppContext';
import { VISUAL_ASSETS } from '../../data/foundationCatalog';
import { adminApi, ApiRequestError } from '../../services/adminApi';
import { Language } from '../../types/domain';
import { isRealConfiguredPhone } from '../../utils/publicSiteRoutes';
import {
  buildFinderPublicView,
  validateAuthForm,
  validateContactForm,
} from '../../utils/qrLogic';

export const AboutPage: React.FC = () => {
  const { lang, navigate } = useApp();

  const visionMission = [
    {
      labelAr: 'الرؤية',
      labelEn: 'OUR VISION',
      titleAr: 'جعل استرداد المفقودات تجربة فورية وآمنة في كل مكان',
      titleEn: 'Making Lost Property Recovery Instant and Private Everywhere',
      descAr:
        'نطمح لأن يصبح لكل غرض ثمين أو مهم هوية رقمية ذكية ومحايدة تحفظ خصوصية صاحبه وتختصر المسافة بين العثور على الغرض وعودته إلى مالكه في دقائق.',
      descEn:
        'We envision a world where every valued belonging carries a privacy-preserving digital identity that turns accidental loss into a fast, effortless return.',
    },
    {
      labelAr: 'الرسالة',
      labelEn: 'OUR MISSION',
      titleAr: 'تمكين الأفراد والفرق من حماية مقتنياتهم دون تعقيد تقني',
      titleEn: 'Empowering Individuals and Teams With Zero-Friction Protection',
      descAr:
        'تقديم منصة متكاملة تجمع بين رموز QR القياسية، مكتبة القوالب القابلة للطباعة، مجموعات QR المشتركة، وضوابط الخصوصية المرنة التي تعمل عبر أي كاميرا هاتف ذكي.',
      descEn:
        'Deliver an integrated platform uniting ISO QR tags, print-ready templates, Shared QR groups, and granular privacy rules that work natively on every smartphone.',
    },
  ];

  const problemAndValue = [
    {
      icon: AlertCircle,
      titleAr: 'المشكلة التي تعالجها المنصة',
      titleEn: 'The Real-World Problem We Solve',
      descAr:
        'كتابة اسمك ورقم هاتفك مباشرة على بطاقة الحقيبة أو المفاتيح تكشف بياناتك الشخصية لكل من يمر بجانبها، بينما ترك المقتنيات بلا تعريف يجعل من شبه المستحيل على شخص أمين الوصول إليك عند فقدانها.',
      descEn:
        'Writing your personal phone number on a luggage tag exposes your identity to strangers, while leaving belongings untagged gives honest finders no way to reach you.',
    },
    {
      icon: ShieldCheck,
      titleAr: 'القيمة التي تقدمها FindIt QR',
      titleEn: 'The Value FindIt QR Delivers',
      descAr:
        'نستبدل البطاقات الورقية المكشوفة بهوية QR سحابية تديرها بنفسك: تتحكم في القنوات الظاهرة، تتلقى تنبيهات المسح ورسائل المكتشفين، وتحدّث بياناتك في أي وقت دون إعادة طباعة الملصق.',
      descEn:
        'We replace exposed paper tags with a dynamic QR identity you control: pick visible channels or Anonymous Relay, receive scan alerts, and update details anytime without reprinting.',
    },
    {
      icon: Compass,
      titleAr: 'مصممة للأفراد والعائلات والشركات',
      titleEn: 'Built for Personal Carry, Families & Teams',
      descAr:
        'سواء كنت تحمي حاسوبك وحقيبة سفرك، أو تنظم مقتنيات العائلة عبر مجموعات QR المشتركة، أو تدير أصول وعهد فريق العمل، تتوسع المنصة معك عبر باقات واضحة ومكتبة قوالب احترافية.',
      descEn:
        'Whether protecting a daily laptop, organizing family travel sets under Shared QR groups, or managing commercial hardware fleets, FindIt QR scales cleanly with clear plans.',
    },
  ];

  return (
    <div>
      <PageHeroBand
        eyebrow={lang === 'ar' ? 'عن منصة FINDIT QR' : 'ABOUT FINDIT QR'}
        title={
          lang === 'ar'
            ? 'نبني الجسر الأسرع والأكثر خصوصية بين المفقودات وأصحابها'
            : 'Building the Safest Bridge Between Lost Belongings and Their Owners'
        }
        subtitle={
          lang === 'ar'
            ? 'FindIt QR منصة رقمية ذكية لحماية المقتنيات الشخصية ومعدات العمل عبر رموز QR قياسية، تجمع بين سهولة المسح للمكتشف والتحكم الكامل في الخصوصية للمالك.'
            : 'FindIt QR is a smart QR property protection and recovery platform designed to make returning lost items effortless for finders and strictly private for owners.'
        }
        imageSrc={VISUAL_ASSETS.hero3d}
        imageAlt={
          lang === 'ar'
            ? 'مجسم ثلاثي الأبعاد يعرض منظومة مقتنيات محمية برموز FindIt QR'
            : '3D Midnight Teal studio showcase of belongings protected by FindIt QR'
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('how-it-works')}
              className="px-6 py-3 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] dark:bg-[#19B5A5] dark:hover:bg-[#14A394] text-white dark:text-[#07101D] font-extrabold text-sm transition-colors whitespace-nowrap"
            >
              {lang === 'ar' ? 'اكتشف كيف تعمل المنصة' : 'See How It Works'}
            </button>
            <button
              type="button"
              onClick={() => navigate('contact')}
              className="px-5 py-3 rounded-xl bg-white dark:bg-[#111E33] border border-slate-300 dark:border-slate-700 hover:border-[#19B5A5] text-[#0B1320] dark:text-white font-bold text-sm transition-colors whitespace-nowrap"
            >
              {lang === 'ar' ? 'الدعم والتواصل' : 'Contact Support'}
            </button>
          </>
        }
      />

      {/* Vision & Mission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visionMission.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0E192B] p-7 sm:p-9 space-y-3.5"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F9D8E] dark:text-[#2DD4BF]">
                {lang === 'ar' ? item.labelAr : item.labelEn}
              </p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1320] dark:text-white">
                {lang === 'ar' ? item.titleAr : item.titleEn}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'ar' ? item.descAr : item.descEn}
              </p>
            </div>
          ))}
        </div>

        {/* Problem Solved & Value Delivered */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problemAndValue.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="findit-card-hover rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0E192B] p-6 sm:p-7 space-y-3.5"
              >
                <div className="w-11 h-11 rounded-xl bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#2DD4BF] flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1320] dark:text-white">
                  {lang === 'ar' ? p.titleAr : p.titleEn}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'ar' ? p.descAr : p.descEn}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <MidnightCtaBand
        eyebrow={lang === 'ar' ? 'ابدأ رحلتك' : 'START PROTECTING'}
        title={
          lang === 'ar'
            ? 'جهّز أول رمز QR لمقتنياتك مجانًا خلال دقائق'
            : 'Create Your First Protected QR Tag Free in Minutes'
        }
        subtitle={
          lang === 'ar'
            ? 'جرّب المنصة مجانًا أو تواصل معنا لأي استفسار يتعلق بالأفراد أو الشركات.'
            : 'Get started on our free Starter plan or contact our team with any personal or business question.'
        }
        primaryLabel={lang === 'ar' ? 'إنشاء حساب مجاني' : 'Create Free Account'}
        primaryRoute="register"
        secondaryLabel={lang === 'ar' ? 'تصفح مكتبة القوالب' : 'Browse Template Library'}
        secondaryRoute="design-store"
      />
    </div>
  );
};

export const FaqPage: React.FC = () => {
  const { lang, navigate, platformSettings } = useApp();
  const [openKey, setOpenKey] = useState<string>('faq-0');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const curatedFaqs = [
    {
      id: 'scan-app',
      cat: 'usage',
      qAr: 'هل يحتاج الشخص الذي يعثر على غرضي إلى تحميل تطبيق أو إنشاء حساب؟',
      qEn: 'Does the person who finds my item need to install an app or create an account?',
      aAr: 'إطلاقًا. يكفي توجيه كاميرا أي هاتف ذكي نحو رمز QR لتفتح صفحة الاسترداد مباشرة في المتصفح باللغتين العربية والإنجليزية خلال ثوانٍ.',
      aEn: 'Not at all. Pointing any iOS or Android smartphone camera at the QR code opens your bilingual recovery page directly in the browser within seconds.',
    },
    {
      id: 'privacy-hide',
      cat: 'privacy',
      qAr: 'كيف تحمي FindIt QR رقم هاتفي وبياناتي الشخصية؟',
      qEn: 'How does FindIt QR protect my phone number and personal data?',
      aAr: 'لا يحتوي رمز QR على بياناتك الشخصية؛ أنت تختار لكل غرض القنوات المسموح بظهورها (هاتف، واتساب، بريد، أو تيليجرام)، أو تفعّل وضع «الوسيط الآمن المجهول» لاستقبال رسالة من المكتشف داخل حسابك دون إظهار أي رقم.',
      aEn: 'The QR code never encodes personal data. For each item you pick visible channels or enable Anonymous Relay Only so finders can message you through the platform without seeing your number.',
    },
    {
      id: 'shared-qr',
      cat: 'features',
      qAr: 'ما الفرق بين المجموعات التنظيمية ومجموعات QR المشتركة؟',
      qEn: 'What is the difference between organizational folders and Shared QR Groups?',
      aAr: 'المجموعات التنظيمية تُستخدم لترتيب أغراضك داخل لوحة التحكم فقط، بينما تتيح «مجموعات QR المشتركة» ربط عدة مقتنيات برمز QR واحد مع إمكانية إظهار أو إخفاء كل غرض داخل الصفحة المشتركة على حدة.',
      aEn: 'Folders help organize items inside your dashboard, while Shared QR Groups bind multiple belongings to one single QR code with independent per-item visibility switches.',
    },
    {
      id: 'pause-archive',
      cat: 'privacy',
      qAr: 'ماذا يحدث عند إيقاف رمز QR مؤقتًا أو أرشفة الغرض؟',
      qEn: 'What happens when I pause a QR code or archive an item?',
      aAr: 'يتوقف عرض قنوات التواصل العامة فورًا عند المسح، كما أن أرشفة الغرض تحرر مقعده من حد الأغراض النشطة في باقتك مع الاحتفاظ بسجله لاستعادته لاحقًا.',
      aEn: 'Public contact channels are hidden immediately upon scanning, and archiving frees that slot from your active plan quota while keeping the record saved.',
    },
    {
      id: 'templates-print',
      cat: 'library',
      qAr: 'كيف تعمل مكتبة القوالب والطباعة؟',
      qEn: 'How do the Template Library and print exports work?',
      aAr: 'تضم المكتبة قوالب مجانية ومدفوعة مصنفة حسب نوع الغرض. بعد اختيار القالب وتخصيص غرضك، يدمج النظام رمز QR الخاص بك بدقة عالية جاهزة للطباعة الفردية أو طباعة عدة ملصقات في صفحة A4.',
      aEn: 'The library offers free and paid templates organized by item category. Once linked to your item, FindIt QR composites your real scannable QR code for single or batch A4 printing.',
    },
    {
      id: 'plans-starter',
      cat: 'plans',
      qAr: 'ما الذي تشمله الباقة المجانية Starter / Free؟',
      qEn: 'What is included in the Starter / Free plan?',
      aAr: 'تمنحك الباقة المجانية حتى غرضين نشطين (الأرشيف لا يُحتسب ضمن الحد)، ووسيلتي تواصل مباشرتين لكل غرض، ورموز QR قياسية دائمة، وصفحة استرداد ثنائية اللغة، مع إمكانية الترقية لاحقًا إلى Plus أو Premium أو Pro.',
      aEn: 'Starter / Free includes up to 2 active items (archived items excluded), up to 2 direct contact channels per item, permanent ISO QR codes, and bilingual recovery pages, with upgrade paths to Plus, Premium, and Pro.',
    },
    {
      id: 'no-battery',
      cat: 'usage',
      qAr: 'هل تحتاج ملصقات FindIt QR إلى بطارية أو شحن؟',
      qEn: 'Do FindIt QR tags need batteries or charging?',
      aAr: 'لا تحتاج لأي بطارية أو شحن؛ يعمل الرمز المطبوع باستمرار وبشكل دائم، ويكفي أن يتوفر اتصال إنترنت على هاتف الشخص الذي يقوم بمسح الرمز.',
      aEn: 'Never. Printed or engraved QR tags work indefinitely without batteries; only the scanning smartphone needs a normal internet connection.',
    },
  ];

  // Merge any additional admin-published FAQs without duplicating existing questions
  const adminExtras =
    platformSettings.faqs && platformSettings.faqs.length > 0
      ? platformSettings.faqs
          .filter((f) => f.isPublished !== false)
          .filter(
            (af) =>
              !curatedFaqs.some(
                (cf) =>
                  cf.qAr.trim() === af.questionAr.trim() ||
                  cf.qEn.trim().toLowerCase() === af.questionEn.trim().toLowerCase()
              )
          )
          .map((f) => ({
            id: f.id,
            cat: 'usage',
            qAr: f.questionAr,
            qEn: f.questionEn,
            aAr: f.answerAr,
            aEn: f.answerEn,
          }))
      : [];

  const allFaqs = [...curatedFaqs, ...adminExtras];

  const categories = [
    { id: 'all', ar: 'جميع الأسئلة', en: 'All Questions' },
    { id: 'usage', ar: 'الاستخدام والمسح', en: 'Usage & Scanning' },
    { id: 'privacy', ar: 'الخصوصية والأمان', en: 'Privacy & Security' },
    { id: 'features', ar: 'المجموعات وQR المشترك', en: 'Groups & Shared QR' },
    { id: 'library', ar: 'القوالب والطباعة', en: 'Library & Printing' },
    { id: 'plans', ar: 'الباقات والحدود', en: 'Plans & Quotas' },
  ];

  const visibleFaqs =
    activeCategory === 'all'
      ? allFaqs
      : allFaqs.filter((item) => item.cat === activeCategory);

  return (
    <div>
      <PageHeroBand
        eyebrow={lang === 'ar' ? 'مركز المعرفة' : 'KNOWLEDGE BASE'}
        title={
          lang === 'ar'
            ? 'الأسئلة الشائعة حول FindIt QR'
            : 'Frequently Asked Questions'
        }
        subtitle={
          lang === 'ar'
            ? 'إجابات مباشرة وواضحة حول كيفية عمل الرموز، حماية الخصوصية، مكتبة القوالب، المجموعات المشتركة، والباقات.'
            : 'Direct, transparent answers covering scanning, privacy rules, template printing, Shared QR groups, and plans.'
        }
      />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-[#0F9D8E] dark:bg-[#19B5A5] text-white dark:text-[#07101D]'
                  : 'bg-white dark:bg-[#0E192B] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#19B5A5]'
              }`}
            >
              {lang === 'ar' ? cat.ar : cat.en}
            </button>
          ))}
        </div>

        {/* Accessible Accordion */}
        <div className="space-y-3">
          {visibleFaqs.map((faq, idx) => {
            const key = `faq-${idx}`;
            const isOpen = openKey === key;
            return (
              <div
                key={faq.id || key}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0E192B] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? '' : key)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-4.5 text-start flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#0B1320] dark:text-white hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <span>{lang === 'ar' ? faq.qAr : faq.qEn}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[#0F9D8E] dark:text-[#2DD4BF]' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                    {lang === 'ar' ? faq.aAr : faq.aEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#0B1320] dark:text-white">
              {lang === 'ar' ? 'لم تجد إجابة لسؤالك؟' : 'Still have a specific question?'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? 'أرسل استفسارك مباشرة عبر صفحة الدعم والتواصل وسيتابعه فريقنا.'
                : 'Send your inquiry through our Support Desk and our team will review it.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('contact')}
            className="px-5 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] dark:bg-[#19B5A5] dark:hover:bg-[#14A394] text-white dark:text-[#07101D] text-xs font-extrabold transition-colors whitespace-nowrap shrink-0"
          >
            {lang === 'ar' ? 'تواصل مع الدعم' : 'Contact Support'}
          </button>
        </div>
      </section>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { lang, t, showToast, platformSettings, authUser, navigate } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<'general' | 'enterprise' | 'designs' | 'technical' | 'billing'>('general');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [submitError, setSubmitError] = useState('');

  const hasRealPhone = isRealConfiguredPhone(platformSettings.supportPhone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const check = validateContactForm({ name, email, topic, message });
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await adminApi.submitPublicSupportTicket({
        name: name.trim(),
        email: email.trim(),
        subject: `${topic.toUpperCase()} Inquiry from ${name.trim()}`,
        message: message.trim(),
        category: topic,
        userId: authUser?.uid,
      });
      setTicketNumber(res.ticket.ticketNumber);
      showToast(
        'success',
        lang === 'ar' ? 'تم استلام رسالتك' : 'Inquiry Submitted',
        lang === 'ar' ? res.messageAr : res.messageEn
      );
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : lang === 'ar'
          ? 'تعذر إرسال التذكرة حاليًا.'
          : 'Could not submit inquiry right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeroBand
        eyebrow={lang === 'ar' ? 'الدعم والتواصل' : 'SUPPORT & CONTACT'}
        title={
          lang === 'ar'
            ? 'كيف يمكننا مساعدتك اليوم؟'
            : 'How Can Our Support Team Help You?'
        }
        subtitle={
          lang === 'ar'
            ? 'أرسل استفسارك الفني أو طلبك المتعلق بالباقات أو القوالب مباشرة إلى مكتب الدعم في المنصة، وسيتم توثيقه برقم تذكرة مرجعي للمتابعة.'
            : 'Submit technical support questions, billing inquiries, or template requests directly into our platform support desk with a tracked reference number.'
        }
      />

      <div className="py-12 lg:py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Real Configured Channels Only */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0E192B] p-6 text-sm">
              <h2 className="text-base font-extrabold text-[#0B1320] dark:text-white">
                {lang === 'ar' ? 'قنوات الدعم المتاحة' : 'Available Support Channels'}
              </h2>

              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-[#0F9D8E] dark:text-[#2DD4BF] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold text-[#0B1320] dark:text-white">
                    {lang === 'ar' ? 'تذاكر الدعم المباشرة في المنصة' : 'In-Platform Support Ticket Desk'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 leading-relaxed">
                    {lang === 'ar'
                      ? 'استخدم النموذج المقابل لإنشاء تذكرة دعم موثقة برقم مرجعي تصل مباشرة لفريق الدعم.'
                      : 'Use the form alongside to create a tracked support ticket routed directly to our support desk.'}
                  </p>
                </div>
              </div>

              {platformSettings.supportEmail && (
                <div className="flex items-start gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Mail className="w-5 h-5 text-[#0F9D8E] dark:text-[#2DD4BF] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-[#0B1320] dark:text-white">
                      {lang === 'ar' ? 'البريد الإلكتروني للدعم' : 'Support Email'}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 font-mono text-xs mt-0.5" dir="ltr">
                      {platformSettings.supportEmail}
                    </p>
                  </div>
                </div>
              )}

              {hasRealPhone && (
                <div className="flex items-start gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Phone className="w-5 h-5 text-[#0F9D8E] dark:text-[#2DD4BF] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-[#0B1320] dark:text-white">
                      {lang === 'ar' ? 'هاتف الدعم' : 'Support Phone'}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 font-mono text-xs mt-0.5" dir="ltr">
                      {platformSettings.supportPhone}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <MapPin className="w-5 h-5 text-[#0F9D8E] dark:text-[#2DD4BF] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold text-[#0B1320] dark:text-white">
                    {lang === 'ar' ? 'نطاق الخدمة' : 'Service Coverage'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                    {lang === 'ar'
                      ? platformSettings.marketRegionAr || 'خدمة رقمية عالمية باللغتين العربية والإنجليزية'
                      : platformSettings.marketRegionEn || 'Global cloud service supporting Arabic & English'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0E192B] p-6 space-y-3">
              <p className="text-sm font-bold text-[#0B1320] dark:text-white">
                {lang === 'ar' ? 'هل تبحث عن إجابة سريعة؟' : 'Looking for a Quick Answer?'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'ar'
                  ? 'راجع صفحة الأسئلة الشائعة أو صفحة الخصوصية والأمان لمعرفة تفاصيل الحساب والرموز والطباعة.'
                  : 'Check our FAQ or Privacy & Security pages for instant details on tags, privacy rules, and printing.'}
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => navigate('faq')}
                  className="text-xs font-bold text-[#0F9D8E] dark:text-[#2DD4BF] hover:underline"
                >
                  {lang === 'ar' ? 'الأسئلة الشائعة' : 'View FAQ'}
                </button>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => navigate('privacy')}
                  className="text-xs font-bold text-[#0F9D8E] dark:text-[#2DD4BF] hover:underline"
                >
                  {lang === 'ar' ? 'الخصوصية والأمان' : 'Privacy & Security'}
                </button>
              </div>
            </div>
          </div>

          {/* Live Support Ticket Form */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0E192B] p-6 sm:p-8">
            {ticketNumber ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#2DD4BF] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                </div>
                <p className="font-mono text-xs font-bold text-[#0F9D8E] dark:text-[#2DD4BF]">
                  {ticketNumber}
                </p>
                <h2 className="text-xl font-bold text-[#0B1320] dark:text-white">
                  {lang === 'ar' ? 'تم استلام وتوثيق تذكرة الدعم!' : 'Support Ticket Created!'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  {lang === 'ar'
                    ? `تم تسجيل رسالتك باسم (${name}) برقم مرجعي ${ticketNumber} وسيتابعها فريق الدعم.`
                    : `Recorded your message from (${name}) under reference ${ticketNumber}. Our support desk will review it shortly.`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTicketNumber('');
                    setName('');
                    setEmail('');
                    setMessage('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0F9D8E] dark:bg-[#19B5A5] text-white dark:text-[#07101D] text-xs font-extrabold"
                >
                  {lang === 'ar' ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
                {submitError && (
                  <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-400">
                    {submitError}
                  </p>
                )}
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-bold text-[#0B1320] dark:text-slate-200 mb-1.5"
                  >
                    {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#08101E] text-sm text-[#0B1320] dark:text-white focus:outline-none focus:border-[#19B5A5]"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {t.validation[errors.name as keyof typeof t.validation]}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-bold text-[#0B1320] dark:text-slate-200 mb-1.5"
                  >
                    {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#08101E] text-sm text-[#0B1320] dark:text-white focus:outline-none focus:border-[#19B5A5]"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {t.validation[errors.email as keyof typeof t.validation]}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-topic"
                    className="block text-xs font-bold text-[#0B1320] dark:text-slate-200 mb-1.5"
                  >
                    {lang === 'ar' ? 'موضوع الرسالة' : 'Inquiry Topic'}
                  </label>
                  <select
                    id="contact-topic"
                    value={topic}
                    onChange={(e) =>
                      setTopic(
                        e.target.value as 'general' | 'enterprise' | 'designs' | 'technical' | 'billing'
                      )
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#08101E] text-sm text-[#0B1320] dark:text-white focus:outline-none focus:border-[#19B5A5]"
                  >
                    <option value="general">
                      {lang === 'ar' ? 'استفسار عام حول المنصة' : 'General Platform Inquiry'}
                    </option>
                    <option value="technical">
                      {lang === 'ar' ? 'دعم فني ومشكلة حساب' : 'Technical Support'}
                    </option>
                    <option value="billing">
                      {lang === 'ar' ? 'استفسارات الفواتير والاشتراكات' : 'Billing & Subscriptions'}
                    </option>
                    <option value="enterprise">
                      {lang === 'ar' ? 'طلبات الشركات وإدارة الأصول' : 'Enterprise & Commercial Assets'}
                    </option>
                    <option value="designs">
                      {lang === 'ar' ? 'تخصيص قوالب وتصاميم QR' : 'Custom QR Tag Designs'}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-bold text-[#0B1320] dark:text-slate-200 mb-1.5"
                  >
                    {lang === 'ar' ? 'تفاصيل الرسالة' : 'Message Details'}
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      lang === 'ar'
                        ? 'اكتب رسالتك أو تفاصيل احتياجك هنا...'
                        : 'Write your message or requirements here...'
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#08101E] text-sm text-[#0B1320] dark:text-white focus:outline-none focus:border-[#19B5A5]"
                  />
                  {errors.message && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {t.validation[errors.message as keyof typeof t.validation]}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-5 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] dark:bg-[#19B5A5] dark:hover:bg-[#14A394] text-white dark:text-[#07101D] font-extrabold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{lang === 'ar' ? 'إرسال الرسالة' : 'Submit Inquiry'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const {
    lang,
    t,
    navigate,
    loginWithEmail,
    loginWithGoogle,
    confirmGoogleLinkWithPassword,
    sendPasswordReset,
    activateQaSandbox,
    firebaseStatus,
    setFirebaseModalOpen,
    isGoogleRedirectPending,
    googleRedirectError,
    clearGoogleRedirectError,
  } = useApp();

  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return window.sessionStorage.getItem('finditqr_prefill_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Ownership-verified Google Account Linking
  const [pendingLink, setPendingLink] = useState<{
    pendingLinkToken: string;
    email: string;
  } | null>(null);
  const [linkPassword, setLinkPassword] = useState('');

  // Password Reset Mode
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const consoleAuthUrl = firebaseStatus.projectId
    ? `https://console.firebase.google.com/project/${firebaseStatus.projectId}/authentication/providers`
    : 'https://console.firebase.google.com/';
  const consoleSettingsUrl = firebaseStatus.projectId
    ? `https://console.firebase.google.com/project/${firebaseStatus.projectId}/authentication/settings`
    : 'https://console.firebase.google.com/';

  const isBusy = submitting || isGoogleRedirectPending;
  const effectiveAuthError =
    authError ||
    (googleRedirectError
      ? lang === 'ar'
        ? googleRedirectError.messageAr
        : googleRedirectError.messageEn
      : '');
  const effectiveErrorCode = errorCode || googleRedirectError?.errorCode || '';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setErrorCode('');
    setPendingLink(null);
    clearGoogleRedirectError();
    const check = validateAuthForm({ email, password }, 'login');
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const res = await loginWithEmail(email, password);
    setSubmitting(false);
    if (!res.ok) {
      setAuthError(lang === 'ar' ? res.messageAr : res.messageEn);
      setErrorCode(res.errorCode || '');
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setErrorCode('');
    setPendingLink(null);
    clearGoogleRedirectError();
    setSubmitting(true);
    const res = await loginWithGoogle();
    if (res.errorCode === 'REDIRECT_IN_PROGRESS') {
      return;
    }
    setSubmitting(false);
    if (!res.ok) {
      if (res.errorCode === 'LINK_ACCOUNT_REQUIRED' && res.pendingLink) {
        setPendingLink(res.pendingLink);
        setLinkPassword('');
        return;
      }
      setAuthError(lang === 'ar' ? res.messageAr : res.messageEn);
      setErrorCode(res.errorCode || '');
    }
  };

  const handleConfirmAccountLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLink || !linkPassword) return;
    setAuthError('');
    setSubmitting(true);
    const res = await confirmGoogleLinkWithPassword(pendingLink.pendingLinkToken, linkPassword);
    setSubmitting(false);
    if (!res.ok) {
      setAuthError(lang === 'ar' ? res.messageAr : res.messageEn);
      setErrorCode(res.errorCode || '');
    } else {
      setPendingLink(null);
      setLinkPassword('');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setResetMessage('');
    clearGoogleRedirectError();
    const check = validateAuthForm({ email: resetEmail }, 'reset');
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const res = await sendPasswordReset(resetEmail);
    setSubmitting(false);
    if (res.ok) {
      setResetMessage(lang === 'ar' ? res.messageAr : res.messageEn);
    } else {
      setAuthError(lang === 'ar' ? res.messageAr : res.messageEn);
      setErrorCode(res.errorCode || '');
    }
  };

  return (
    <div className="py-12 lg:py-20 max-w-md mx-auto px-4 sm:px-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 sm:p-8 space-y-6 shadow-xl shadow-black/5 dark:shadow-black/25">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <FindItLogo variant="icon" size="md" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#17243A] dark:text-white">
            {isResetMode
              ? lang === 'ar'
                ? 'إعادة تعيين كلمة المرور'
                : 'Reset Your Password'
              : lang === 'ar'
              ? 'تسجيل الدخول إلى FindIt QR'
              : 'Sign In to FindIt QR'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isResetMode
              ? lang === 'ar'
                ? 'أدخل بريدك الإلكتروني لإرسال تعليمات استعادة كلمة المرور'
                : 'Enter your registered email to receive password reset instructions'
              : lang === 'ar'
              ? 'أدخل بريدك الإلكتروني للوصول إلى مساحة التحكم في الوضع الفاتح الهادئ'
              : 'Enter your credentials to open your clean light-mode property workspace'}
          </p>
        </div>

        {effectiveAuthError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300 space-y-2.5"
          >
            <p className="font-bold leading-relaxed">{effectiveAuthError}</p>
            {effectiveErrorCode === 'auth/account-exists-with-google' && (
              <div className="pt-2 border-t border-red-200/80 dark:border-red-900/50">
                <button
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                  className="px-3.5 py-2 rounded-lg bg-[#2563EB] text-white font-bold text-xs hover:bg-blue-600 inline-flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'ar'
                      ? 'تسجيل الدخول الآن باستخدام Google'
                      : 'Sign In Now with Google'}
                  </span>
                </button>
              </div>
            )}
            {effectiveErrorCode === 'auth/unauthorized-domain' && (
              <div className="pt-2 border-t border-red-200/80 dark:border-red-900/50 space-y-2">
                <a
                  href={consoleSettingsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
                >
                  <span>
                    {lang === 'ar'
                      ? 'فتح إعدادات النطاقات المصرح بها (Authorized domains) في Firebase'
                      : 'Open Firebase Authorized Domains Settings'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
            {effectiveErrorCode === 'auth/operation-not-allowed' && (
              <div className="pt-2 border-t border-red-200/80 dark:border-red-900/50 space-y-2">
                <a
                  href={consoleAuthUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
                >
                  <span>
                    {lang === 'ar'
                      ? 'فتح Firebase Console لتفعيل مزود المصادقة'
                      : 'Open Firebase Console to enable Auth Provider'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      activateQaSandbox();
                      setAuthError('');
                      setErrorCode('');
                      clearGoogleRedirectError();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#17243A] text-white font-bold text-xs hover:bg-slate-800"
                  >
                    {lang === 'ar'
                      ? 'تفعيل وضع الاختبار الفوري للحسابات والأغراض'
                      : 'Activate Instant QA Verification Mode'}
                  </button>
                </div>
              </div>
            )}
            {(effectiveErrorCode === 'auth/popup-closed-by-user' ||
              effectiveErrorCode === 'auth/popup-blocked' ||
              effectiveErrorCode === 'auth/network-request-failed') && (
              <div className="pt-2 border-t border-red-200/80 dark:border-red-900/50">
                <button
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                  className="px-3.5 py-2 rounded-lg bg-[#2563EB] text-white font-bold text-xs hover:bg-blue-600 inline-flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'ar' ? 'إعادة المحاولة عبر Google' : 'Retry Google Sign-In'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {pendingLink && (
          <form
            onSubmit={handleConfirmAccountLink}
            data-testid="google-link-confirm-form"
            className="rounded-xl border-2 border-[#2563EB] bg-[#2563EB]/5 dark:bg-[#2563EB]/10 p-4 space-y-3"
          >
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-[#17243A] dark:text-white">
                {lang === 'ar'
                  ? 'تأكيد ملكية الحساب لربط Google'
                  : 'Verify Account Ownership to Link Google'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'ar'
                  ? `يوجد حساب مسجل مسبقًا بالبريد (${pendingLink.email}) باستخدام كلمة مرور. أدخل كلمة مرورك الحالية لتأكيد ملكية الحساب وربط Google بنفس الحساب دون تكرار.`
                  : `An account already exists for (${pendingLink.email}) using a password. Enter your existing password to verify ownership and link Google to the same account.`}
              </p>
            </div>
            <input
              type="password"
              required
              dir="ltr"
              value={linkPassword}
              onChange={(e) => setLinkPassword(e.target.value)}
              placeholder={lang === 'ar' ? 'كلمة مرور حسابك الحالية' : 'Your existing account password'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D17] text-sm"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting || !linkPassword}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#2563EB] hover:bg-blue-600 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'ar' ? 'تأكيد وربط Google بالحساب' : 'Confirm & Link Google'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingLink(null);
                  setLinkPassword('');
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        )}

        {isResetMode ? (
          <form onSubmit={handlePasswordReset} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
              >
                {lang === 'ar' ? 'البريد الإلكتروني المسجل' : 'Registered Email Address'}
              </label>
              <input
                id="reset-email"
                type="email"
                dir="ltr"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
              />
              {errors.email && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {t.validation[errors.email as keyof typeof t.validation]}
                </p>
              )}
            </div>

            {resetMessage && (
              <div className="rounded-xl border border-[#19B5A5] bg-[#19B5A5]/15 p-3.5 text-xs font-bold text-[#17243A] dark:text-white">
                {resetMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-600 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <KeyRound className="w-4 h-4" />
              <span>
                {lang === 'ar'
                  ? 'إرسال رابط استعادة كلمة المرور'
                  : 'Send Password Reset Link'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                setResetMessage('');
                setAuthError('');
                setErrors({});
              }}
              className="w-full py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline"
            >
              {lang === 'ar' ? '← العودة إلى تسجيل الدخول' : '← Back to Sign In'}
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
                >
                  {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  id="login-email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                />
                {errors.email && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {t.validation[errors.email as keyof typeof t.validation]}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-[#17243A] dark:text-slate-200"
                  >
                    {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setResetEmail(email);
                      setAuthError('');
                      setErrors({});
                    }}
                    className="text-xs font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
                  >
                    {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </button>
                </div>
                <input
                  id="login-password"
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                />
                {errors.password && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {t.validation[errors.password as keyof typeof t.validation]}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-600 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{t.nav.login}</span>
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              <span className="shrink mx-3 text-xs text-slate-400">
                {lang === 'ar' ? 'أو المتابعة عبر' : 'OR CONTINUE WITH'}
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            <button
              type="button"
              disabled={isBusy}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] hover:border-[#2563EB] disabled:opacity-60 text-[#17243A] dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {isGoogleRedirectPending || submitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
              ) : (
                <Globe className="w-4 h-4 text-[#2563EB]" />
              )}
              <span>
                {isGoogleRedirectPending
                  ? lang === 'ar'
                    ? 'جاري إتمام تسجيل الدخول عبر Google...'
                    : 'Completing Google Sign-In...'
                  : lang === 'ar'
                  ? 'تسجيل الدخول باستخدام Google'
                  : 'Sign In with Google'}
              </span>
            </button>
          </>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 text-center text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            {lang === 'ar' ? 'ليس لديك حساب بعد؟ ' : "Don't have an account yet? "}
            <button
              type="button"
              onClick={() => navigate('register')}
              className="font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
            >
              {t.nav.register}
            </button>
          </p>
          <button
            type="button"
            onClick={() => setFirebaseModalOpen(true)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
          >
            {t.common.configureFirebaseBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const {
    lang,
    t,
    navigate,
    registerWithEmail,
    loginWithGoogle,
    confirmGoogleLinkWithPassword,
    activateQaSandbox,
    firebaseStatus,
    isGoogleRedirectPending,
    googleRedirectError,
    clearGoogleRedirectError,
  } = useApp();

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(lang);
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return window.sessionStorage.getItem('finditqr_prefill_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingLink, setPendingLink] = useState<{
    pendingLinkToken: string;
    email: string;
  } | null>(null);
  const [linkPassword, setLinkPassword] = useState('');

  const consoleAuthUrl = firebaseStatus.projectId
    ? `https://console.firebase.google.com/project/${firebaseStatus.projectId}/authentication/providers`
    : 'https://console.firebase.google.com/';
  const consoleSettingsUrl = firebaseStatus.projectId
    ? `https://console.firebase.google.com/project/${firebaseStatus.projectId}/authentication/settings`
    : 'https://console.firebase.google.com/';

  const isBusy = submitting || isGoogleRedirectPending;
  const effectiveAuthError =
    authError ||
    (googleRedirectError
      ? lang === 'ar'
        ? googleRedirectError.messageAr
        : googleRedirectError.messageEn
      : '');
  const effectiveErrorCode = errorCode || googleRedirectError?.errorCode || '';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setErrorCode('');
    setPendingLink(null);
    clearGoogleRedirectError();
    const check = validateAuthForm(
      { fullName, country, email, password, acceptTerms },
      'register'
    );
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const res = await registerWithEmail({
      fullName,
      email,
      password,
      country,
      preferredLanguage,
    });
    setSubmitting(false);
    if (!res.ok) {
      setAuthError(lang === 'ar' ? res.messageAr : res.messageEn);
      setErrorCode(res.errorCode || '');
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setErrorCode('');
    setPendingLink(null);
    clearGoogleRedirectError();
    setSubmitting(true);
    const res = await loginWithGoogle();
    if (res.errorCode === 'REDIRECT_IN_PROGRESS') {
      return;
    }
    setSubmitting(false);
    if (!res.ok) {
      if (res.errorCode === 'LINK_ACCOUNT_REQUIRED' && res.pendingLink) {
        setPendingLink(res.pendingLink);
        setLinkPassword('');
        return;
      }
      setAuthError(lang === 'ar' ? res.messageAr : res.messageEn);
      setErrorCode(res.errorCode || '');
    }
  };

  const handleConfirmAccountLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLink || !linkPassword) return;
    setAuthError('');
    setSubmitting(true);
    const res = await confirmGoogleLinkWithPassword(pendingLink.pendingLinkToken, linkPassword);
    setSubmitting(false);
    if (!res.ok) {
      setAuthError(lang === 'ar' ? res.messageAr : res.messageEn);
      setErrorCode(res.errorCode || '');
    } else {
      setPendingLink(null);
      setLinkPassword('');
    }
  };

  return (
    <div className="py-12 lg:py-20 max-w-md mx-auto px-4 sm:px-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 sm:p-8 space-y-6 shadow-xl shadow-black/5 dark:shadow-black/25">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <FindItLogo variant="icon" size="md" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'إنشاء حساب مجاني' : 'Create Your Free Account'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {lang === 'ar'
              ? 'ابدأ بباقة Starter / Free (غرضان نشطان + وسيلتا تواصل) وخصّص أكواد QR الخاصة بك'
              : 'Start on Starter / Free (2 active items + 2 channels) and generate standard ISO QR tags'}
          </p>
        </div>

        {effectiveAuthError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300 space-y-2.5"
          >
            <p className="font-bold leading-relaxed">{effectiveAuthError}</p>
            {effectiveErrorCode === 'auth/email-already-in-use' && (
              <div className="pt-2 border-t border-red-200/80 dark:border-red-900/50 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.sessionStorage.setItem('finditqr_prefill_email', email.trim());
                    } catch {
                      // ignore
                    }
                    navigate('login');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#2563EB] text-white font-bold text-xs hover:bg-blue-600"
                >
                  {lang === 'ar'
                    ? 'تسجيل الدخول بهذا البريد لاستعادة حسابك وبياناتك ←'
                    : 'Sign in with this email to restore your account & data →'}
                </button>
              </div>
            )}
            {effectiveErrorCode === 'auth/account-exists-with-google' && (
              <div className="pt-2 border-t border-red-200/80 dark:border-red-900/50">
                <button
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                  className="px-3.5 py-2 rounded-lg bg-[#2563EB] text-white font-bold text-xs hover:bg-blue-600 inline-flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'ar'
                      ? 'المتابعة باستخدام Google لاستعادة حسابك'
                      : 'Continue with Google to restore your account'}
                  </span>
                </button>
              </div>
            )}
            {effectiveErrorCode === 'auth/unauthorized-domain' && (
              <div className="pt-2 border-t border-red-200/80 dark:border-red-900/50 space-y-2">
                <a
                  href={consoleSettingsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
                >
                  <span>
                    {lang === 'ar'
                      ? 'فتح إعدادات النطاقات المصرح بها (Authorized domains) في Firebase'
                      : 'Open Firebase Authorized Domains Settings'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
            {effectiveErrorCode === 'auth/operation-not-allowed' && (
              <div className="pt-2 border-t border-red-200/80 dark:border-red-900/50 space-y-2">
                <a
                  href={consoleAuthUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
                >
                  <span>
                    {lang === 'ar'
                      ? 'فتح Firebase Console لتفعيل Email/Password'
                      : 'Open Firebase Console to enable Email/Password'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      activateQaSandbox();
                      setAuthError('');
                      setErrorCode('');
                      clearGoogleRedirectError();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#17243A] text-white font-bold text-xs hover:bg-slate-800"
                  >
                    {lang === 'ar'
                      ? 'تفعيل وضع الاختبار الفوري للحسابات والأغراض'
                      : 'Activate Instant QA Verification Mode'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {pendingLink && (
          <form
            onSubmit={handleConfirmAccountLink}
            data-testid="google-link-confirm-form"
            className="rounded-xl border-2 border-[#2563EB] bg-[#2563EB]/5 dark:bg-[#2563EB]/10 p-4 space-y-3"
          >
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-[#17243A] dark:text-white">
                {lang === 'ar'
                  ? 'تأكيد ملكية الحساب لربط Google'
                  : 'Verify Account Ownership to Link Google'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'ar'
                  ? `الحساب (${pendingLink.email}) مسجل مسبقًا بكلمة مرور. أدخل كلمة المرور لتأكيد الملكية وربط Google بنفس الحساب.`
                  : `Account (${pendingLink.email}) already exists with a password. Enter your password to verify ownership and link Google to the same account.`}
              </p>
            </div>
            <input
              type="password"
              required
              dir="ltr"
              value={linkPassword}
              onChange={(e) => setLinkPassword(e.target.value)}
              placeholder={lang === 'ar' ? 'كلمة مرور حسابك الحالية' : 'Existing account password'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D17] text-sm"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting || !linkPassword}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#2563EB] hover:bg-blue-600 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'ar' ? 'تأكيد وربط Google' : 'Confirm & Link Google'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingLink(null);
                  setLinkPassword('');
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        )}

        <form onSubmit={handleRegister} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="reg-name"
              className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
            >
              {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
            </label>
            <input
              id="reg-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={lang === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {t.validation[errors.fullName as keyof typeof t.validation]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="reg-country"
                className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
              >
                {lang === 'ar' ? 'الدولة' : 'Country'}
              </label>
              <input
                id="reg-country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder={
                  lang === 'ar' ? 'مثال: السعودية، الإمارات، مصر...' : 'e.g., UK, USA, UAE...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
              />
              {errors.country && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {t.validation[errors.country as keyof typeof t.validation]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-lang"
                className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
              >
                {lang === 'ar' ? 'اللغة المفضلة' : 'Preferred Language'}
              </label>
              <select
                id="reg-lang"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as Language)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
              >
                <option value="ar">العربية (الافتراضية)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
            >
              {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <input
              id="reg-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
            />
            {errors.email && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {t.validation[errors.email as keyof typeof t.validation]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
            >
              {lang === 'ar' ? 'كلمة المرور (٨ خانات على الأقل)' : 'Password (min. 8 characters)'}
            </label>
            <input
              id="reg-password"
              type="password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
            />
            {errors.password && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {t.validation[errors.password as keyof typeof t.validation]}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#2563EB]"
              />
              <span>
                {lang === 'ar'
                  ? 'أوافق على شروط الخدمة وسياسة الخصوصية لمنصة FindIt QR.'
                  : 'I agree to the FindIt QR Terms of Service and Privacy Policy.'}
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {t.validation[errors.acceptTerms as keyof typeof t.validation]}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-600 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{t.common.createFreeAccount}</span>
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          <span className="shrink mx-3 text-xs text-slate-400">
            {lang === 'ar' ? 'أو التسجيل السريع عبر' : 'OR SIGN UP WITH'}
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        </div>

        <button
          type="button"
          disabled={isBusy}
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] hover:border-[#2563EB] disabled:opacity-60 text-[#17243A] dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {isGoogleRedirectPending || submitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
          ) : (
            <Globe className="w-4 h-4 text-[#2563EB]" />
          )}
          <span>
            {isGoogleRedirectPending
              ? lang === 'ar'
                ? 'جاري إتمام تسجيل الدخول عبر Google...'
                : 'Completing Google Sign-In...'
              : lang === 'ar'
              ? 'المتابعة باستخدام حساب Google'
              : 'Continue with Google'}
          </span>
        </button>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-300">
          {lang === 'ar' ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
          <button
            type="button"
            onClick={() => navigate('login')}
            className="font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
          >
            {t.nav.login}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const { lang, navigate, verifyPasswordResetToken, confirmPasswordReset } = useApp();

  const tokenFromUrl =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('token') || ''
      : '';

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let active = true;
    if (!tokenFromUrl) {
      setChecking(false);
      setTokenValid(false);
      setTokenError(
        lang === 'ar'
          ? 'رابط إعادة تعيين كلمة المرور غير مكتمل أو مفقود. اطلب رابطًا جديدًا من صفحة تسجيل الدخول.'
          : 'The password reset link is missing or incomplete. Please request a new link from the Sign In page.'
      );
      return;
    }
    setChecking(true);
    void verifyPasswordResetToken(tokenFromUrl).then((res) => {
      if (!active) return;
      setChecking(false);
      if (res.ok && res.data) {
        setTokenValid(true);
        setMaskedEmail(res.data.maskedEmail);
        setTokenError('');
      } else {
        setTokenValid(false);
        setTokenError(lang === 'ar' ? res.messageAr : res.messageEn);
      }
    });
    return () => {
      active = false;
    };
  }, [tokenFromUrl, lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (newPassword.length < 8) {
      setFormError(
        lang === 'ar'
          ? 'يجب أن تتكون كلمة المرور الجديدة من ٨ أحرف على الأقل.'
          : 'New password must be at least 8 characters long.'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError(
        lang === 'ar'
          ? 'تأكيد كلمة المرور غير مطابق لكلمة المرور الجديدة.'
          : 'Password confirmation does not match.'
      );
      return;
    }
    setSubmitting(true);
    const res = await confirmPasswordReset(tokenFromUrl, newPassword);
    setSubmitting(false);
    if (res.ok) {
      setCompleted(true);
    } else {
      setFormError(lang === 'ar' ? res.messageAr : res.messageEn);
    }
  };

  return (
    <div className="py-12 lg:py-20 max-w-md mx-auto px-4 sm:px-6">
      <div
        data-testid="reset-password-card"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 sm:p-8 space-y-6 shadow-xl shadow-black/5 dark:shadow-black/25"
      >
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <FindItLogo variant="icon" size="md" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set a New Password'}
          </h1>
          {maskedEmail && tokenValid && !completed && (
            <p className="text-xs font-mono text-[#2563EB] dark:text-[#19B5A5]" dir="ltr">
              {maskedEmail}
            </p>
          )}
        </div>

        {checking ? (
          <div className="py-8 flex flex-col items-center gap-3 text-xs font-bold text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
            <span>
              {lang === 'ar'
                ? 'جاري التحقق من صلاحية رابط إعادة التعيين...'
                : 'Verifying password reset link...'}
            </span>
          </div>
        ) : completed ? (
          <div data-testid="reset-password-success" className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#19B5A5]/15 text-[#19B5A5] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#17243A] dark:text-white">
              {lang === 'ar'
                ? 'تم تحديث كلمة المرور بنجاح وإغلاق جميع الجلسات السابقة!'
                : 'Your password has been updated and all previous sessions were signed out!'}
            </p>
            <button
              type="button"
              onClick={() => navigate('login')}
              className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-sm"
            >
              {lang === 'ar' ? 'الانتقال إلى تسجيل الدخول' : 'Proceed to Sign In'}
            </button>
          </div>
        ) : !tokenValid ? (
          <div data-testid="reset-password-invalid" className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-300 leading-relaxed">
              {tokenError}
            </p>
            <button
              type="button"
              onClick={() => navigate('login')}
              className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-sm"
            >
              {lang === 'ar' ? 'العودة إلى تسجيل الدخول لطلب رابط جديد' : 'Back to Sign In to Request New Link'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="new-reset-password"
                className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
              >
                {lang === 'ar' ? 'كلمة المرور الجديدة (٨ خانات على الأقل)' : 'New Password (min. 8 chars)'}
              </label>
              <input
                id="new-reset-password"
                type="password"
                dir="ltr"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-reset-password"
                className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
              >
                {lang === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
              </label>
              <input
                id="confirm-reset-password"
                type="password"
                dir="ltr"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
              />
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-700 dark:text-red-300"
              >
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-600 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>{lang === 'ar' ? 'حفظ كلمة المرور الجديدة' : 'Save New Password'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/**
 * Public Found Item Resolution Page (`صفحة العثور على غرض`):
 * Represents what a finder sees when scanning a FindIt QR tag without logging in.
 */
export const FoundItemPage: React.FC = () => {
  const {
    lang,
    t,
    items,
    showcaseItems,
    qrRecords,
    designs,
    selectedItemId,
    selectedCodeSerial,
    authUser,
    platformSettings,
    navigate,
    showToast,
  } = useApp();

  const itemPool = items.length > 0 ? items : showcaseItems;
  const isShowingPublicShowcase = items.length === 0;
  const hasExplicitTarget = Boolean(selectedCodeSerial || selectedItemId);
  const initialLookupKey =
    selectedCodeSerial || selectedItemId || itemPool[0]?.codeSerial || itemPool[0]?.id || '';

  const [lookupKey, setLookupKey] = useState<string>(initialLookupKey);
  const [remotePayload, setRemotePayload] = useState<
    ReturnType<typeof buildFinderPublicView> | null
  >(null);
  const [loadingQr, setLoadingQr] = useState<boolean>(Boolean(initialLookupKey));
  const [notFoundCode, setNotFoundCode] = useState<string>('');
  const [lookupError, setLookupError] = useState<string>('');

  // «عثرت على هذا الغرض» ("I Found This Item") state
  const [foundReportSent, setFoundReportSent] = useState<boolean>(false);
  const [foundWelcomeMsg, setFoundWelcomeMsg] = useState<string>('');
  const [reportingFound, setReportingFound] = useState<boolean>(false);

  // Internal Finder Message Form state
  const [finderName, setFinderName] = useState<string>('');
  const [finderMessage, setFinderMessage] = useState<string>('');
  const [finderContact, setFinderContact] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');
  const [relaySent, setRelaySent] = useState<boolean>(false);
  const [relayError, setRelayError] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  // Problem / Abuse Report Form state
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [reportName, setReportName] = useState<string>('');
  const [reportEmail, setReportEmail] = useState<string>('');
  const [reportMsg, setReportMsg] = useState<string>('');
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);
  const [reportTicket, setReportTicket] = useState<string>('');

  const svgDownloadRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (selectedCodeSerial) {
      setLookupKey(selectedCodeSerial);
    } else if (selectedItemId) {
      setLookupKey(selectedItemId);
    }
  }, [selectedCodeSerial, selectedItemId]);

  useEffect(() => {
    if (!lookupKey) {
      setLoadingQr(false);
      setRemotePayload(null);
      setNotFoundCode('');
      setLookupError('');
      return;
    }
    let active = true;
    setLoadingQr(true);
    setNotFoundCode('');
    setLookupError('');
    setRemotePayload(null);

    import('../../services/firebase/services').then(({ firebaseServiceLayer }) => {
      firebaseServiceLayer.fetchPublicQrPayload(lookupKey).then((res) => {
        if (!active) return;
        setLoadingQr(false);
        if (res.ok && res.data) {
          setRemotePayload(res.data);
          setNotFoundCode('');
          setLookupError('');
        } else if (res.errorCode === 'QR_NOT_FOUND') {
          setRemotePayload(null);
          setNotFoundCode(lookupKey);
        } else if (res.errorCode === 'ITEM_RESTRICTED_BY_MODERATION') {
          setRemotePayload(null);
          setLookupError(
            lang === 'ar'
              ? res.messageAr || 'تم تقييد عرض هذا الكود مؤقتًا من إدارة المنصة.'
              : res.messageEn || 'This QR tag is temporarily restricted by platform moderation.'
          );
        } else {
          const exactOwnMatch = items.find(
            (i) =>
              i.id === lookupKey ||
              i.codeSerial.toUpperCase() === lookupKey.toUpperCase()
          );
          if (exactOwnMatch) {
            const linkedQr = qrRecords.find((q) => q.linkedItemId === exactOwnMatch.id);
            setRemotePayload(buildFinderPublicView(exactOwnMatch, linkedQr));
          } else {
            setRemotePayload(null);
            setLookupError(
              lang === 'ar'
                ? res.messageAr || 'تعذر التحقق من كود QR حاليًا.'
                : res.messageEn || 'Could not verify this QR code right now.'
            );
          }
        }
      });
    });
    return () => {
      active = false;
    };
  }, [lookupKey, items, qrRecords, lang]);

  const matchedItemForDesign = itemPool.find(
    (i) =>
      i.id === remotePayload?.itemId ||
      i.codeSerial.toUpperCase() === (remotePayload?.serialNumber || '').toUpperCase()
  );
  const matchedDesign =
    designs.find((d) => d.id === (remotePayload?.designId || matchedItemForDesign?.designId)) ??
    designs[0];
  const publicView = remotePayload;

  const handleFoundItemClick = async () => {
    if (!publicView || reportingFound) return;
    setReportingFound(true);
    const { firebaseServiceLayer } = await import('../../services/firebase/services');
    const res = await firebaseServiceLayer.submitPublicFoundReport(publicView.serialNumber);
    setReportingFound(false);

    setFoundReportSent(true);
    setFoundWelcomeMsg(
      res.ok && res.data
        ? lang === 'ar'
          ? res.data.welcomeAr
          : res.data.welcomeEn
        : lang === 'ar'
        ? res.messageAr
        : res.messageEn
    );

    showToast(
      res.ok ? 'success' : 'info',
      lang === 'ar' ? 'تم تسجيل بلاغ العثور' : 'Found Item Reported',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
  };

  const handleRelaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicView || sendingMessage) return;

    if (!finderMessage.trim() || finderMessage.trim().length < 5) {
      setRelayError(
        lang === 'ar'
          ? 'يرجى كتابة رسالة قصيرة (٥ أحرف على الأقل) توضح مكان وجود الغرض أو طريقة التسليم.'
          : 'Please enter a short message (at least 5 characters) describing where the item is.'
      );
      return;
    }

    setRelayError('');
    setSendingMessage(true);
    const { firebaseServiceLayer } = await import('../../services/firebase/services');
    const res = await firebaseServiceLayer.submitPublicFinderMessage(
      publicView.serialNumber,
      {
        message: finderMessage,
        senderContact: finderContact,
        senderName: finderName,
        honeypot,
      }
    );
    setSendingMessage(false);

    if (!res.ok) {
      setRelayError(lang === 'ar' ? res.messageAr : res.messageEn);
      return;
    }

    setRelaySent(true);
    showToast(
      'success',
      lang === 'ar' ? 'تم إرسال الرسالة لصاحب الغرض' : 'Message Sent to Owner',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
  };

  if (loadingQr && !publicView) {
    return (
      <div className="py-16 max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-10 space-y-3">
          <Loader2 className="w-8 h-8 text-[#2563EB] dark:text-[#19B5A5] animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'جارٍ التحقق من كود QR...' : 'Verifying QR code...'}
          </p>
          {lookupKey && (
            <p className="text-xs font-mono text-slate-400" dir="ltr">
              {lookupKey}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (notFoundCode || lookupError || !publicView) {
    return (
      <div className="py-14 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          data-testid="qr-not-found-state"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-8 sm:p-10 text-center space-y-5 shadow-xl shadow-black/5 dark:shadow-black/25"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-mono font-bold text-red-600 dark:text-red-400" dir="ltr">
              {notFoundCode ? `QR_NOT_FOUND · ${notFoundCode}` : 'QR_LOOKUP_UNAVAILABLE'}
            </p>
            <h1 className="text-2xl font-extrabold text-[#17243A] dark:text-white">
              {notFoundCode
                ? lang === 'ar'
                  ? 'هذا الكود غير مسجل أو لم يعد متاحًا'
                  : 'QR Code Not Found or No Longer Registered'
                : lang === 'ar'
                ? 'تعذر تحميل بيانات الكود'
                : 'Unable to Load QR Code'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
              {notFoundCode
                ? lang === 'ar'
                  ? `لم نتمكن من العثور على أي غرض مسجل مرتبط بالرمز (${notFoundCode}). تأكد من قراءة الكود بشكل صحيح أو تواصل مع صاحب الغرض.`
                  : `No registered item matches the serial code (${notFoundCode}). Please verify the code or check that it has not been removed.`
                : lookupError}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs sm:text-sm font-bold transition-colors"
            >
              {lang === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home'}
            </button>
            {showcaseItems[0] && (
              <button
                type="button"
                onClick={() => {
                  setNotFoundCode('');
                  setLookupError('');
                  setRelaySent(false);
                  setRelayError('');
                  setFoundReportSent(false);
                  setFoundWelcomeMsg('');
                  navigate('found-item', { codeSerial: showcaseItems[0].codeSerial });
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-[#17243A] dark:text-white hover:border-[#19B5A5] transition-colors"
              >
                {lang === 'ar' ? 'معاينة مثال توضيحي' : 'Preview Showcase Tag'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 lg:py-14 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Switcher Bar only shown in generic /found preview mode (never on a specific item's recovery link) */}
      {!hasExplicitTarget && itemPool.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#17243A] dark:text-slate-200">
              <QrCode className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'صفحة الاستعادة العامة (تعمل بدون تسجيل دخول عبر الرابط الفريد لكل غرض):'
                  : 'Public QR Recovery Page (Works without sign-in via unique item link):'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {itemPool.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => {
                    setRelaySent(false);
                    setRelayError('');
                    setFoundReportSent(false);
                    setFoundWelcomeMsg('');
                    navigate('found-item', { codeSerial: it.codeSerial });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                    publicView.serialNumber === it.codeSerial
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#F4F7FB] dark:bg-[#070D17] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {it.codeSerial}
                </button>
              ))}
            </div>
          </div>
          {isShowingPublicShowcase && <IllustrativeShowcaseNotice lang={lang} />}
        </div>
      )}

      {/* Main Finder Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/25">
        <div className="bg-[#0B1424] text-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800">
          <div className="space-y-1.5">
            <p
              data-testid="qr-public-serial"
              className="text-xs font-mono text-[#19B5A5] font-bold tabular-nums"
            >
              FINDIT QR VERIFIED TAG · {publicView.serialNumber}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              {lang === 'ar' ? publicView.itemNameAr : publicView.itemNameEn}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {t.statuses[publicView.status]}
              {(lang === 'ar' ? publicView.cityAr : publicView.cityEn) && (
                <>
                  {' · '}
                  <span data-testid="qr-public-city">
                    {lang === 'ar' ? publicView.cityAr : publicView.cityEn}
                  </span>
                </>
              )}
            </p>
            <p className="text-[11px] font-mono text-slate-400" dir="ltr">
              /found/{publicView.serialNumber}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  downloadQrSvgMarkup(
                    svgDownloadRef.current,
                    `finditqr-${publicView.serialNumber}`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#19B5A5]" />
                <span>{lang === 'ar' ? 'تنزيل كود SVG' : 'Download QR SVG'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 self-center md:self-auto">
            <div className="hidden sm:block">
              <TagProductPreview
                seed={publicView.serialNumber}
                primaryHex={matchedDesign.primaryHex}
                secondaryHex={matchedDesign.secondaryHex}
                badgeColorHex={matchedDesign.badgeColorHex}
                silhouette={matchedDesign.shapeSilhouette}
                serialPreview={publicView.serialNumber}
                badgeText="SCAN TO RETURN"
                size="sm"
              />
            </div>
            <div className="bg-white p-2 rounded-2xl shrink-0">
              <QrCodeVector
                svgRef={svgDownloadRef}
                seed={publicView.serialNumber}
                primaryColor="#2563EB"
                accentColor="#FF8A65"
                size={96}
              />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {loadingQr && (
            <p className="text-xs text-slate-400">
              {lang === 'ar' ? 'جارٍ التحقق من حالة الكود...' : 'Verifying QR code status...'}
            </p>
          )}

          {/* Prominent «عثرت على هذا الغرض» ("I Found This Item") Action Section */}
          {publicView.isContactEnabled && publicView.allowFoundReports !== false && (
            <div className="rounded-2xl border-2 border-[#19B5A5] bg-[#19B5A5]/10 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#17243A] dark:text-white">
                    {lang === 'ar'
                      ? 'هل عثرت على هذا الغرض الآن؟'
                      : 'Did You Just Find This Belonging?'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {lang === 'ar'
                      ? 'اضغط على الزر لإرسال إشعار فوري لصاحب الغرض وإظهار خطوات التسليم السريعة دون الحاجة لإنشاء حساب.'
                      : 'Click the button to immediately notify the owner and view quick return instructions without creating an account.'}
                  </p>
                </div>

                <button
                  type="button"
                  data-testid="btn-found-this-item"
                  disabled={reportingFound}
                  onClick={handleFoundItemClick}
                  className="px-6 py-3.5 rounded-xl bg-[#19B5A5] hover:bg-teal-400 text-[#070D17] font-extrabold text-sm sm:text-base shrink-0 transition-colors cursor-pointer"
                >
                  {reportingFound
                    ? lang === 'ar'
                      ? 'جارٍ إشعار المالك...'
                      : 'Notifying Owner...'
                    : lang === 'ar'
                    ? 'عثرت على هذا الغرض'
                    : 'I Found This Item'}
                </button>
              </div>

              {foundReportSent && (
                <div
                  data-testid="found-welcome-banner"
                  className="rounded-xl bg-white dark:bg-[#070D17] border border-[#19B5A5] p-4 space-y-2"
                >
                  <p className="text-sm font-bold text-[#17243A] dark:text-[#19B5A5]">
                    {lang === 'ar'
                      ? 'أهلًا بك وشكرًا لأمانتك! تم إشعار صاحب الغرض بنجاح'
                      : 'Welcome & Thank You for Your Honesty! Owner Notified'}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {foundWelcomeMsg}
                  </p>
                </div>
              )}
            </div>
          )}

          {publicView.isPublicPageActive && publicView.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-[#070D17] flex justify-center p-3">
              <img
                src={publicView.imageUrl}
                alt={lang === 'ar' ? publicView.itemNameAr : publicView.itemNameEn}
                data-testid="qr-public-image"
                className="max-h-56 w-auto rounded-lg object-contain"
              />
            </div>
          )}

          {publicView.isPublicPageActive &&
            (lang === 'ar' ? publicView.descriptionAr : publicView.descriptionEn) && (
              <div
                data-testid="qr-public-description"
                className="rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] p-4 border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'ar' ? 'وصف الغرض:' : 'Item Description:'}
                </h2>
                <p className="text-sm text-[#17243A] dark:text-slate-200 leading-relaxed">
                  {lang === 'ar' ? publicView.descriptionAr : publicView.descriptionEn}
                </p>
              </div>
            )}

          {publicView.rewardOffered && (
            <div className="rounded-xl bg-[#FFD166]/25 dark:bg-[#FFD166]/15 border border-[#FFD166] p-4 flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-[#17243A] dark:text-[#FFD166] shrink-0" />
              <p className="text-sm font-bold text-[#17243A] dark:text-[#FFD166]">
                {lang === 'ar'
                  ? `مكافأة تقديرية معلنة من المالك: ${publicView.rewardAmountTextAr}`
                  : `Owner Appreciation Reward Offered: ${publicView.rewardAmountTextEn}`}
              </p>
            </div>
          )}

          {publicView.isPublicPageActive && (
            <div className="rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] p-5 border border-slate-200 dark:border-slate-800 space-y-2">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'تعليمات ورسالة صاحب الغرض إليك:'
                  : 'Instructions from the Item Owner:'}
              </h2>
              <p className="text-sm sm:text-base text-[#17243A] dark:text-white leading-relaxed font-medium">
                {lang === 'ar' ? publicView.finderNoteAr : publicView.finderNoteEn}
              </p>
            </div>
          )}

          {!publicView.isContactEnabled ? (
            <div
              data-testid="qr-public-paused-notice"
              className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-5 flex items-start gap-3 text-sm text-amber-900 dark:text-amber-200"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {publicView.inactiveReason === 'shared_mode'
                    ? lang === 'ar'
                      ? 'رمز QR الفردي غير نشط حاليًا لأن الغرض مرتبط بمجموعة QR مشترك'
                      : 'Individual QR Inactive — Item Managed via Shared QR Group'
                    : publicView.inactiveReason === 'shared_group_paused'
                    ? lang === 'ar'
                      ? 'رمز QR الفردي متوقف لأن المجموعة المشتركة المرتبط بها الغرض موقوفة مؤقتًا'
                      : 'Item Currently Paused Under Its Shared QR Group'
                    : publicView.inactiveReason === 'unassigned_from_shared'
                    ? lang === 'ar'
                      ? 'رمز QR الفردي غير مفعل حاليًا بعد حذف المجموعة المشتركة'
                      : 'Individual QR Currently Inactive After Shared Group Removal'
                    : publicView.status === 'Archived'
                    ? lang === 'ar'
                      ? 'هذا الغرض مؤرشف حاليًا من قِبل المالك'
                      : 'This Item Tag is Currently Archived by the Owner'
                    : lang === 'ar'
                    ? 'تم إيقاف الصفحة العامة مؤقتًا من قِبل صاحب الغرض'
                    : 'Public Recovery Page Temporarily Paused by Owner'}
                </p>
                <p className="text-xs mt-1">
                  {publicView.inactiveReason === 'shared_mode'
                    ? lang === 'ar'
                      ? 'يعمل هذا الغرض حاليًا عبر ملصق QR المشترك الخاص بمجموعته منعًا لازدواج أو تعارض رموز QR. يرجى مسح ملصق QR المشترك إن وُجد.'
                      : 'This item is currently active under its Shared QR Group tag to avoid conflicting QR states. Please scan the group’s shared QR tag if available.'
                    : publicView.inactiveReason === 'shared_group_paused'
                    ? lang === 'ar'
                      ? 'أوقف صاحب الغرض المجموعة المشتركة مؤقتًا، ولا يتم إظهار قنوات التواصل حتى يعيد تفعيل المجموعة أو إعادة تفعيل QR الفردي.'
                      : 'The owner paused this item’s Shared QR Group. Contact details stay hidden until the owner resumes the group or restores individual QR.'
                    : publicView.inactiveReason === 'unassigned_from_shared'
                    ? lang === 'ar'
                      ? 'توقفت المجموعة المشتركة السابقة لهذا الغرض، ولم يُعد المالك تفعيل الرمز الفردي بعد.'
                      : 'This item’s previous Shared QR Group was removed and the owner has not re-activated its individual QR yet.'
                    : publicView.status === 'Archived'
                    ? lang === 'ar'
                      ? 'أوقف المالك عرض قنوات التواصل حاليًا لأن الغرض مؤرشف أو في حوزته.'
                      : 'The owner has archived public contact channels while the item is in their possession.'
                    : lang === 'ar'
                    ? 'اختار صاحب الغرض إخفاء بيانات التواصل والرسائل مؤقتًا عبر إعدادات الخصوصية.'
                    : 'The item owner has temporarily hidden contact details and finder messaging via privacy settings.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {!publicView.anonymousRelayOnly && (
                <div className="space-y-3" data-testid="approved-contact-channels">
                  <h2 className="text-sm font-bold text-[#17243A] dark:text-white">
                    {lang === 'ar'
                      ? 'وسائل التواصل المباشر التي وافق صاحب الغرض على إظهارها:'
                      : 'Owner-Approved Direct Contact Channels:'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {publicView.visibleChannels.whatsapp && (
                      <a
                        data-testid="channel-whatsapp"
                        href={`https://wa.me/${publicView.visibleChannels.whatsapp.replace(
                          /[^0-9]/g,
                          ''
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#19B5A5] text-[#070D17] font-bold text-sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span dir="ltr">WhatsApp: {publicView.visibleChannels.whatsapp}</span>
                      </a>
                    )}
                    {publicView.visibleChannels.phone && (
                      <a
                        data-testid="channel-phone"
                        href={`tel:${publicView.visibleChannels.phone}`}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2563EB] text-white font-bold text-sm"
                      >
                        <Phone className="w-4 h-4" />
                        <span dir="ltr">{publicView.visibleChannels.phone}</span>
                      </a>
                    )}
                    {publicView.visibleChannels.email && (
                      <a
                        data-testid="channel-email"
                        href={`mailto:${publicView.visibleChannels.email}`}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-[#17243A] dark:text-white font-bold text-sm"
                      >
                        <Mail className="w-4 h-4 text-[#2563EB]" />
                        <span dir="ltr">{publicView.visibleChannels.email}</span>
                      </a>
                    )}
                    {publicView.visibleChannels.telegram && (
                      <a
                        data-testid="channel-telegram"
                        href={`https://t.me/${publicView.visibleChannels.telegram.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#0F9D8E]/40 bg-[#0F9D8E]/10 text-[#0B1320] dark:text-white font-bold text-sm"
                      >
                        <MessageCircle className="w-4 h-4 text-[#0F9D8E]" />
                        <span dir="ltr">Telegram: {publicView.visibleChannels.telegram}</span>
                      </a>
                    )}
                    {publicView.visibleChannels.facebook &&
                      /^https:\/\/[a-z0-9.-]+/i.test(publicView.visibleChannels.facebook) && (
                        <a
                          data-testid="channel-facebook"
                          href={publicView.visibleChannels.facebook}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E192B] text-[#0B1320] dark:text-white font-bold text-sm"
                        >
                          <Globe className="w-4 h-4 text-[#0F9D8E]" />
                          <span dir="ltr">Facebook</span>
                        </a>
                      )}
                    {Array.isArray(publicView.visibleChannels.customLinks) &&
                      publicView.visibleChannels.customLinks
                        .filter((lnk) => /^https:\/\/[a-z0-9.-]+/i.test(lnk.value))
                        .map((lnk) => (
                          <a
                            key={lnk.id}
                            data-testid={`channel-custom-${lnk.id}`}
                            href={lnk.value}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E192B] text-[#0B1320] dark:text-white font-bold text-sm"
                          >
                            <ExternalLink className="w-4 h-4 text-[#0F9D8E]" />
                            <span className="truncate">{lnk.label}</span>
                          </a>
                        ))}
                  </div>
                </div>
              )}

              {/* Internal Finder Message Form */}
              {publicView.allowFinderMessages !== false && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-[#19B5A5]" />
                  <h3 className="text-sm font-bold text-[#17243A] dark:text-white">
                    {lang === 'ar'
                      ? 'نموذج التواصل الداخلي مع صاحب الغرض (دون الحاجة لإنشاء حساب)'
                      : 'Internal Message Form to Item Owner (No Account Required)'}
                  </h3>
                </div>

                {relaySent ? (
                  <div
                    data-testid="finder-message-success"
                    className="rounded-xl bg-[#19B5A5]/15 border border-[#19B5A5] p-4 text-sm text-[#17243A] dark:text-white flex items-center justify-between gap-4"
                  >
                    <span>
                      {lang === 'ar'
                        ? 'تم إرسال رسالتك إلى حساب صاحب الغرض بنجاح! شكرًا لأمانتك.'
                        : 'Your message has been delivered to the item owner’s account! Thank you.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRelaySent(false);
                        setFinderMessage('');
                      }}
                      className="text-xs font-bold underline shrink-0"
                    >
                      {lang === 'ar' ? 'إرسال رسالة أخرى' : 'Send another message'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRelaySubmit} noValidate className="space-y-3">
                    <input
                      type="text"
                      name="websiteUrl"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      className="hidden"
                      aria-hidden="true"
                    />

                    <div>
                      <label
                        htmlFor="finder-message-input"
                        className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
                      >
                        {lang === 'ar' ? 'الرسالة الموجهة لصاحب الغرض *' : 'Message to Owner *'}
                      </label>
                      <textarea
                        id="finder-message-input"
                        rows={3}
                        value={finderMessage}
                        onChange={(e) => setFinderMessage(e.target.value)}
                        placeholder={
                          lang === 'ar'
                            ? 'اكتب أين وجدت الغرض أو كيف يمكن لصاحب الغرض استلامه...'
                            : 'Describe where you found the item or how the owner can pick it up...'
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="finder-contact-input"
                          className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
                        >
                          {lang === 'ar'
                            ? 'وسيلة تواصل اختيارية للمرسل (هاتف / واتساب / بريد)'
                            : 'Optional Sender Contact Info (Phone / Email)'}
                        </label>
                        <input
                          id="finder-contact-input"
                          type="text"
                          value={finderContact}
                          onChange={(e) => setFinderContact(e.target.value)}
                          placeholder={
                            lang === 'ar'
                              ? 'رقم هاتف أو بريد للتواصل (اختياري)'
                              : 'Phone or email (optional)'
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="finder-name-input"
                          className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
                        >
                          {lang === 'ar' ? 'اسمك (اختياري)' : 'Your Name (Optional)'}
                        </label>
                        <input
                          id="finder-name-input"
                          type="text"
                          value={finderName}
                          onChange={(e) => setFinderName(e.target.value)}
                          placeholder={lang === 'ar' ? 'فاعل خير' : 'Good Samaritan'}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                        />
                      </div>
                    </div>

                    {relayError && (
                      <p
                        role="alert"
                        className="text-xs font-bold text-red-600 dark:text-red-400"
                      >
                        {relayError}
                      </p>
                    )}

                    <button
                      type="submit"
                      id="finder-message-submit"
                      disabled={sendingMessage}
                      className="px-5 py-2.5 rounded-xl bg-[#17243A] dark:bg-[#2563EB] text-white text-xs sm:text-sm font-bold disabled:opacity-50"
                    >
                      {sendingMessage
                        ? lang === 'ar'
                          ? 'جارٍ الإرسال...'
                          : 'Sending...'
                        : lang === 'ar'
                        ? 'إرسال الرسالة لصاحب الغرض'
                        : 'Send Message to Owner'}
                    </button>
                  </form>
                )}
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {platformSettings.enableReportProblemButton !== false && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? 'هل واجهت مشكلة تقنية أو تود الإبلاغ عن إساءة استخدام لهذا الكود؟'
                : 'Having a technical issue or need to report abuse for this tag?'}
            </span>
            <button
              type="button"
              data-testid="btn-report-problem"
              onClick={() => setReportOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#17243A] dark:text-white hover:border-red-500"
            >
              <Flag className="w-3.5 h-3.5 text-amber-500" />
              <span>{lang === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report a Problem'}</span>
            </button>
          </div>

          {reportOpen && (
            reportTicket ? (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {lang === 'ar'
                  ? `تم تسجيل البلاغ بنجاح برقم التذكرة: ${reportTicket}`
                  : `Report recorded cleanly under ticket ${reportTicket}.`}
              </p>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!reportMsg.trim() || !reportEmail.trim()) return;
                  setReportSubmitting(true);
                  try {
                    const res = await adminApi.submitPublicSupportTicket({
                      name: reportName.trim() || 'Finder',
                      email: reportEmail.trim(),
                      subject: `Tag Issue Report: ${publicView.serialNumber}`,
                      message: reportMsg.trim(),
                      category: 'abuse_report',
                      relatedItemSerial: publicView.serialNumber,
                      userId: authUser?.uid,
                    });
                    setReportTicket(res.ticket.ticketNumber);
                    showToast(
                      'success',
                      lang === 'ar' ? 'تم إرسال البلاغ' : 'Report Submitted',
                      res.ticket.ticketNumber
                    );
                  } catch (err) {
                    showToast(
                      'error',
                      lang === 'ar' ? 'تعذر الإرسال' : 'Failed',
                      err instanceof ApiRequestError
                        ? lang === 'ar'
                          ? err.messageAr
                          : err.messageEn
                        : 'Failed to submit report.'
                    );
                  } finally {
                    setReportSubmitting(false);
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs"
              >
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'اسمك (اختياري)' : 'Your Name (Optional)'}
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17]"
                />
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="your-email@example.com *"
                  value={reportEmail}
                  onChange={(e) => setReportEmail(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17]"
                />
                <textarea
                  rows={2}
                  required
                  placeholder={lang === 'ar' ? 'وصف المشكلة *' : 'Describe the problem *'}
                  value={reportMsg}
                  onChange={(e) => setReportMsg(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17]"
                />
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold disabled:opacity-50"
                  >
                    {reportSubmitting ? '...' : lang === 'ar' ? 'إرسال البلاغ للإدارة' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      )}

      {authUser && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate('item-details', { itemId: publicView.itemId })}
            className="text-xs font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
          >
            {lang === 'ar'
              ? 'انتقل إلى إعدادات هذا الغرض في لوحة المستخدم لتعديل القنوات الظاهرة ←'
              : 'Open this item in User Workspace to modify visible contact channels →'}
          </button>
        </div>
      )}
    </div>
  );
};
