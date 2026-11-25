import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileImage,
  HelpCircle,
  LifeBuoy,
  Loader2,
  Mail,
  MessageSquarePlus,
  Paperclip,
  Phone,
  Search,
  Send,
  Ticket,
} from 'lucide-react';
import { SmartRelatedServices } from '../../components/workspace/SmartRelatedServices';
import { useApp } from '../../context/AppContext';
import { userAppApi } from '../../services/userAppApi';
import { SupportTicket, SupportTicketAttachment } from '../../types/domain';
import { isRealConfiguredPhone } from '../../utils/publicSiteRoutes';

const WORKSPACE_HELP_ARTICLES = [
  {
    id: 'guide-items',
    titleAr: '١. تسجيل المقتنيات وربطها برمز QR ذكي',
    titleEn: '1. Registering Belongings & Smart Covers',
    bodyAr:
      'ابدأ بإضافة غرض جديد، ثم ارفع صورك لاختيار أفضل غلاف تلقائيًا مع الاحتفاظ بالصور الأصلية أو ولّد غلافًا ذكيًا بالهوية. لا تُخزن أي بيانات شخصية داخل كود QR.',
    bodyEn:
      'Add a new item, upload photos to auto-select the sharpest cover while keeping originals separate (or generate an AI cover). Zero personal data is stored inside the QR.',
  },
  {
    id: 'guide-shared',
    titleAr: '٢. الفرق بين المجموعات التنظيمية وQR المشترك',
    titleEn: '2. Organizational Groups vs. Shared QR',
    bodyAr:
      'المجموعة التنظيمية ترتب الأغراض داخل حسابك فقط. أما مجموعة QR المشترك فتوفر كودًا عامًا واحدًا لعدة مقتنيات وتوقف الكود الفردي مؤقتًا لمنع التعارض.',
    bodyEn:
      'Organizational groups sort items internally. Shared QR groups bind multiple belongings under one public QR code while temporarily pausing individual codes to avoid conflicts.',
  },
  {
    id: 'guide-print',
    titleAr: '٣. استوديو الطباعة وفحص الجاهزية (300 DPI)',
    titleEn: '3. Print Studio & Preflight Validation',
    bodyAr:
      'اختر أحد الـ 58 قالبًا، حدد الغرض النشط، وأبقِ منطقة أمان QR مقفلة ودقة 300 DPI على الأقل حتى يجتاز الملصق فحص الجاهزية.',
    bodyEn:
      'Select from 58 templates, bind an active item, keep QR quiet-zone lock active and DPI >= 300 so preflight clears for SVG/PNG export.',
  },
  {
    id: 'guide-contacts',
    titleAr: '٤. الدليل المركزي لطرق التواصل',
    titleEn: '4. Central Contact Directory & Live Updates',
    bodyAr:
      'أدر أرقام الهاتف وواتساب وتيليجرام وفيسبوك والروابط المخصصة من صفحة واحدة، وينعكس أي تعديل فورًا على جميع الملصقات المرتبطة دون إعادة طباعة.',
    bodyEn:
      'Maintain phone, WhatsApp, email, Telegram, Facebook, and custom links centrally — every update reflects immediately across printed tags without reprinting.',
  },
];

const CURATED_WORKSPACE_FAQS: Array<{
  id: string;
  category: 'qr' | 'shared' | 'covers' | 'billing' | 'privacy';
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
}> = [
  {
    id: 'wf-1',
    category: 'shared',
    questionAr: 'ماذا يحدث لرمز QR الفردي عند إضافة غرض إلى مجموعة QR مشترك؟',
    questionEn: 'What happens to an item individual QR when linked to a Shared QR Group?',
    answerAr:
      'يتوقف الكود الفردي مؤقتًا ولا يُحذف لمنع تعارض رمزين نشطين، ويمكنك استعادة الوضع الفردي في أي لحظة بضغطة واحدة.',
    answerEn:
      'Its individual QR is paused (never deleted) to prevent conflicting active tags, and you can restore individual mode anytime in one click.',
  },
  {
    id: 'wf-2',
    category: 'covers',
    questionAr: 'هل يحذف الغلاف الذكي (AI Cover) صوري الأصلية المرفوعة؟',
    questionEn: 'Does generating an AI Cover delete my original uploaded photos?',
    answerAr:
      'لا أبدًا. تُحفظ الصور الأصلية في حقل منفصل (originalImages) وتظل متاحة للتبديل أو الاستعادة في أي وقت.',
    answerEn:
      'No. Original uploaded photos are preserved separately inside originalImages and stay available for manual selection anytime.',
  },
  {
    id: 'wf-3',
    category: 'qr',
    questionAr: 'لماذا قد يمنعني استوديو الطباعة من تصدير ملف الإنتاج؟',
    questionEn: 'Why does Print Studio block production export sometimes?',
    answerAr:
      'يوقف فحص الجاهزية التصدير إذا كان القالب غير مملوك، أو كانت الدقة أقل من 300 DPI، أو تم فتح قفل منطقة أمان QR، أو كان الغرض مرتبطًا بـ QR مشترك.',
    answerEn:
      'Preflight blocks export if the template is unowned, DPI is below 300, QR safety lock is off, or the bound item is currently in Shared QR mode.',
  },
  {
    id: 'wf-4',
    category: 'privacy',
    questionAr: 'هل يظهر رقم هاتفي في حال تفعيل وضع الوسيط المجهول؟',
    questionEn: 'Is my phone number exposed if Anonymous Relay Only is enabled?',
    answerAr:
      'لا. في وضع الوسيط الآمن لا تظهر أي قنوات اتصال مباشرة، ويتواصل المكتشف فقط عبر نموذج الرسائل المشفر.',
    answerEn:
      'Never. When Anonymous Relay Only is enabled, all direct channels are hidden and finders communicate solely through the built-in relay form.',
  },
  {
    id: 'wf-5',
    category: 'billing',
    questionAr: 'كيف أتحقق من حالة طلب الترقية أو شراء القالب؟',
    questionEn: 'How do I track a subscription upgrade or template license order?',
    answerAr:
      'يمكنك متابعة جميع طلباتك وحالات التراخيص النشطة مباشرة من صفحة «مشترياتي» أو فتح تذكرة فوترية مع إرفاق المرجع.',
    answerEn:
      'Visit My Purchases to inspect order approval status and issued licenses, or open a billing ticket with your transfer reference.',
  },
];

export const SupportCenterPage: React.FC = () => {
  const { lang, platformSettings, navigate } = useApp();
  const [query, setQuery] = useState('');

  const realSupportPhone = isRealConfiguredPhone(platformSettings.supportPhone)
    ? platformSettings.supportPhone
    : null;

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WORKSPACE_HELP_ARTICLES;
    return WORKSPACE_HELP_ARTICLES.filter((a) =>
      `${a.titleAr} ${a.titleEn} ${a.bodyAr} ${a.bodyEn}`.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="space-y-6" data-testid="support-center-page">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF] text-xs font-bold">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'مركز الدعم والمساعدة' : 'Support & Help Center'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white">
            {lang === 'ar' ? 'دليل الاستخدام ومركز المساعدة' : 'Help Center & Usage Guides'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {lang === 'ar'
              ? 'أدلة تشغيل واضحة، إجابات سريعة، وتذاكر دعم متصلة مباشرة بفريق المنصة.'
              : 'Clear usage guides, searchable FAQs, and live support ticket tracking.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('support-faq')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
          >
            <HelpCircle className="w-4 h-4 text-[#0F9D8E]" />
            <span>{lang === 'ar' ? 'الأسئلة الشائعة' : 'Workspace FAQ'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('support-tickets')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] text-white text-xs font-bold"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'فتح أو متابعة تذكرة' : 'Open Support Ticket'}</span>
          </button>
        </div>
      </div>

      {/* Search Help Articles */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-4" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            lang === 'ar'
              ? 'ابحث في دليل الاستخدام (QR المشترك، الطباعة، الأغلفة)...'
              : 'Search help guides (Shared QR, Print Studio, Smart Covers)...'
          }
          className="w-full ps-11 pe-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] text-sm"
        />
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-2"
          >
            <div className="flex items-center gap-2 text-[#0F9D8E] dark:text-[#2DD4BF] font-extrabold text-sm">
              <BookOpen className="w-4 h-4 shrink-0" />
              <h2>{lang === 'ar' ? art.titleAr : art.titleEn}</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'ar' ? art.bodyAr : art.bodyEn}
            </p>
          </div>
        ))}
      </div>

      {/* Real Configured Official Channels */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-[#0B1320] dark:text-white">
          {lang === 'ar' ? 'قنوات الدعم الرسمية المعتمدة' : 'Official Support Channels'}
        </h2>
        <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
          {platformSettings.supportEmail && (
            <a
              href={`mailto:${platformSettings.supportEmail}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F7FAFC] dark:bg-[#0B1320] border border-slate-200 dark:border-slate-800 font-bold text-[#0F9D8E]"
            >
              <Mail className="w-4 h-4" />
              <span dir="ltr">{platformSettings.supportEmail}</span>
            </a>
          )}
          {realSupportPhone && (
            <a
              href={`tel:${realSupportPhone}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F7FAFC] dark:bg-[#0B1320] border border-slate-200 dark:border-slate-800 font-bold text-[#0F9D8E]"
            >
              <Phone className="w-4 h-4" />
              <span dir="ltr">{realSupportPhone}</span>
            </a>
          )}
        </div>
      </div>

      <SmartRelatedServices currentPage="support" />
    </div>
  );
};

export const WorkspaceFaqPage: React.FC = () => {
  const { lang, platformSettings, navigate } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'qr' | 'shared' | 'covers' | 'billing' | 'privacy'>('all');
  const [openId, setOpenId] = useState<string>('wf-1');

  const combinedFaqs = useMemo(() => {
    const adminPublished = (platformSettings.faqs || [])
      .filter((f) => f.isPublished)
      .map((f) => ({
        id: f.id,
        category: 'qr' as const,
        questionAr: f.questionAr,
        questionEn: f.questionEn,
        answerAr: f.answerAr,
        answerEn: f.answerEn,
      }));
    return [...CURATED_WORKSPACE_FAQS, ...adminPublished];
  }, [platformSettings.faqs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return combinedFaqs.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return `${item.questionAr} ${item.questionEn} ${item.answerAr} ${item.answerEn}`
        .toLowerCase()
        .includes(q);
    });
  }, [combinedFaqs, search, category]);

  return (
    <div className="space-y-6" data-testid="workspace-faq-page">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white">
            {lang === 'ar' ? 'الأسئلة الشائعة لحساب المستخدم' : 'Workspace FAQ'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            {lang === 'ar'
              ? 'إجابات تفصيلية حول تشغيل رموز QR الفردية والمشتركة، الطباعة، والأغلفة.'
              : 'Detailed answers for QR modes, Print Studio preflight, Smart Covers, and billing.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('support-tickets')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F9D8E] text-white text-xs font-bold shrink-0"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>{lang === 'ar' ? 'افتح تذكرة دعم' : 'Open a Ticket'}</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث عن سؤال...' : 'Search FAQ...'}
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'all', ar: 'الكل', en: 'All' },
              { id: 'shared', ar: 'QR المشترك', en: 'Shared QR' },
              { id: 'qr', ar: 'الطباعة وQR', en: 'QR & Print' },
              { id: 'covers', ar: 'الأغلفة', en: 'Covers' },
              { id: 'privacy', ar: 'الخصوصية', en: 'Privacy' },
              { id: 'billing', ar: 'الباقات', en: 'Billing' },
            ] as const
          ).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                category === c.id
                  ? 'bg-[#0F9D8E] text-white border-[#0F9D8E]'
                  : 'bg-white dark:bg-[#0E192B] border-slate-200 dark:border-slate-800'
              }`}
            >
              {lang === 'ar' ? c.ar : c.en}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {filtered.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] overflow-hidden"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? '' : item.id)}
                className="w-full p-4 sm:p-5 text-start flex items-center justify-between gap-3 font-bold text-sm text-[#0B1320] dark:text-white"
              >
                <span>{lang === 'ar' ? item.questionAr : item.questionEn}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-[#0F9D8E] transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                  {lang === 'ar' ? item.answerAr : item.answerEn}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SmartRelatedServices currentPage="support-faq" />
    </div>
  );
};

export const SupportTicketsPage: React.FC = () => {
  const {
    lang,
    items,
    supportTickets,
    showToast,
    refreshTicketsInSession,
    createSupportTicketInSession,
    replyToSupportTicketInSession,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | SupportTicket['status']>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [mode, setMode] = useState<'create' | 'thread'>('create');

  // Create Ticket Form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('general');
  const [priority, setPriority] = useState<SupportTicket['priority']>('medium');
  const [relatedItemSerial, setRelatedItemSerial] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<SupportTicketAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Reply Form
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<SupportTicketAttachment[]>([]);
  const [submittingReply, setSubmittingReply] = useState(false);

  const createFileRef = useRef<HTMLInputElement | null>(null);
  const replyFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void refreshTicketsInSession();
  }, []);

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return supportTickets;
    return supportTickets.filter((tk) => tk.status === statusFilter);
  }, [supportTickets, statusFilter]);

  const activeTicket = useMemo(
    () => supportTickets.find((tk) => tk.id === selectedTicketId) ?? null,
    [supportTickets, selectedTicketId]
  );

  const uploadTicketImage = async (
    file: File,
    onDone: (att: SupportTicketAttachment) => void
  ) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast(
        'warning',
        lang === 'ar' ? 'صيغة غير مدعومة' : 'Unsupported Image',
        lang === 'ar'
          ? 'يرجى اختيار صورة JPG أو PNG أو WebP.'
          : 'Please attach a JPG, PNG, or WebP image.'
      );
      return;
    }
    setUploadingFile(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('READ_ERR'));
        r.readAsDataURL(file);
      });
      const res = await userAppApi.uploadMedia({
        folder: 'tickets',
        dataUrl,
        fileName: file.name,
      });
      onDone({
        id: `att-${Date.now()}`,
        name: file.name,
        url: res.url,
        mimeType: res.mimeType,
        sizeBytes: res.sizeBytes,
      });
    } catch {
      showToast(
        'error',
        lang === 'ar' ? 'تعذر رفع المرفق' : 'Attachment Failed',
        lang === 'ar' ? 'حدث خطأ أثناء رفع الصورة.' : 'Could not upload image attachment.'
      );
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 3 || description.trim().length < 5) {
      showToast(
        'warning',
        lang === 'ar' ? 'بيانات غير مكتملة' : 'Missing Details',
        lang === 'ar'
          ? 'أدخل عنوان التذكرة ووصفًا واضحًا للمشكلة.'
          : 'Enter a clear subject and issue description.'
      );
      return;
    }
    setSubmittingTicket(true);
    const created = await createSupportTicketInSession({
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      relatedItemSerial: relatedItemSerial || undefined,
      attachments,
    });
    setSubmittingTicket(false);
    if (created) {
      setSubject('');
      setDescription('');
      setRelatedItemSerial('');
      setAttachments([]);
      setSelectedTicketId(created.id);
      setMode('thread');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    setSubmittingReply(true);
    const updated = await replyToSupportTicketInSession(activeTicket.id, {
      message: replyText.trim(),
      attachments: replyAttachments,
    });
    setSubmittingReply(false);
    if (updated) {
      setReplyText('');
      setReplyAttachments([]);
    }
  };

  return (
    <div className="space-y-6" data-testid="support-tickets-page">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF] text-xs font-bold">
            <Ticket className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تذاكر الدعم الفني' : 'Support Tickets'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white mt-2">
            {lang === 'ar' ? 'إنشاء ومتابعة تذاكر الدعم' : 'Create & Track Support Tickets'}
          </h1>
        </div>

        <button
          type="button"
          data-testid="btn-new-ticket-mode"
          onClick={() => setMode('create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] text-white text-xs sm:text-sm font-bold"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>{lang === 'ar' ? 'فتح تذكرة جديدة' : 'New Support Ticket'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'open', 'in_progress', 'waiting_user', 'resolved'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  statusFilter === st
                    ? 'bg-[#0F9D8E] text-white border-[#0F9D8E]'
                    : 'bg-white dark:bg-[#0E192B] border-slate-200 dark:border-slate-800'
                }`}
              >
                {st === 'all'
                  ? lang === 'ar'
                    ? 'الكل'
                    : 'All'
                  : st}
              </button>
            ))}
          </div>

          {filteredTickets.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 text-center text-xs text-slate-500">
              {lang === 'ar' ? 'لا توجد تذاكر في هذا التصنيف.' : 'No tickets in this filter.'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTickets.map((tk) => (
                <button
                  key={tk.id}
                  type="button"
                  data-testid={`ticket-row-${tk.id}`}
                  onClick={() => {
                    setSelectedTicketId(tk.id);
                    setMode('thread');
                  }}
                  className={`w-full text-start p-4 rounded-2xl border transition-colors ${
                    mode === 'thread' && selectedTicketId === tk.id
                      ? 'border-[#0F9D8E] bg-white dark:bg-[#0E192B] ring-1 ring-[#0F9D8E]/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono font-bold text-[#0F9D8E]">{tk.ticketNumber}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                      {tk.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#0B1320] dark:text-white mt-1 truncate">
                    {tk.subject}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {tk.createdAt.slice(0, 10)} · {tk.replies.filter((r) => !r.isInternalNote).length}{' '}
                    {lang === 'ar' ? 'ردود' : 'replies'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Detail: Create OR Conversation Thread */}
        <div className="lg:col-span-8">
          {mode === 'create' || !activeTicket ? (
            <form
              onSubmit={handleCreateSubmit}
              data-testid="create-ticket-form"
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-4"
            >
              <h2 className="text-base font-extrabold text-[#0B1320] dark:text-white">
                {lang === 'ar' ? 'إنشاء تذكرة دعم جديدة' : 'Submit New Support Ticket'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="tk-subject" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'عنوان المشكلة أو الاستفسار *' : 'Ticket Subject *'}
                  </label>
                  <input
                    id="tk-subject"
                    data-testid="tk-subject-input"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: استفسار عن طباعة قالب معين' : 'e.g., Question about sticker export'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="tk-category" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    id="tk-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SupportTicket['category'])}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
                  >
                    <option value="general">{lang === 'ar' ? 'استفسار عام' : 'General'}</option>
                    <option value="technical">{lang === 'ar' ? 'مشكلة تقنية' : 'Technical'}</option>
                    <option value="billing">{lang === 'ar' ? 'الفوترة والباقات' : 'Billing'}</option>
                    <option value="designs">{lang === 'ar' ? 'القوالب والطباعة' : 'Templates & Print'}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="tk-item" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'ربط بغرض (اختياري)' : 'Related Item (Optional)'}
                  </label>
                  <select
                    id="tk-item"
                    value={relatedItemSerial}
                    onChange={(e) => setRelatedItemSerial(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
                  >
                    <option value="">{lang === 'ar' ? 'بدون ربط بغرض' : 'None'}</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.codeSerial}>
                        {it.name || it.nameAr} ({it.codeSerial})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tk-priority" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'الأولوية' : 'Priority'}
                  </label>
                  <select
                    id="tk-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SupportTicket['priority'])}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
                  >
                    <option value="low">{lang === 'ar' ? 'منخفضة' : 'Low'}</option>
                    <option value="medium">{lang === 'ar' ? 'متوسطة' : 'Medium'}</option>
                    <option value="high">{lang === 'ar' ? 'عالية' : 'High'}</option>
                    <option value="urgent">{lang === 'ar' ? 'عاجلة' : 'Urgent'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="tk-desc" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'تفاصيل الطلب *' : 'Description *'}
                </label>
                <textarea
                  id="tk-desc"
                  data-testid="tk-desc-input"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <input
                    ref={createFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        void uploadTicketImage(f, (att) =>
                          setAttachments((prev) => [...prev, att].slice(0, 4))
                        );
                      }
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingFile}
                    onClick={() => createFileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  >
                    {uploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5 text-[#0F9D8E]" />}
                    <span>{lang === 'ar' ? 'إرفاق صورة' : 'Attach Image'}</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submittingTicket}
                  data-testid="tk-submit-btn"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] text-white text-xs sm:text-sm font-bold disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingTicket ? '...' : lang === 'ar' ? 'إرسال التذكرة' : 'Submit Ticket'}</span>
                </button>
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7FAFC] dark:bg-[#0B1320] border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <FileImage className="w-3.5 h-3.5 text-[#0F9D8E]" />
                      <span className="truncate max-w-[140px]">{att.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </form>
          ) : (
            <div
              data-testid="ticket-thread-panel"
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-mono text-xs font-bold text-[#0F9D8E]">
                    {activeTicket.ticketNumber} · {activeTicket.status}
                  </span>
                  <h2 className="text-lg font-extrabold text-[#0B1320] dark:text-white mt-1">
                    {activeTicket.subject}
                  </h2>
                </div>
                {activeTicket.relatedItemSerial && (
                  <span className="px-2.5 py-1 rounded-lg bg-[#0F9D8E]/10 text-[#0F9D8E] font-mono text-xs font-bold">
                    {activeTicket.relatedItemSerial}
                  </span>
                )}
              </div>

              {/* Initial Ticket Description */}
              <div className="p-4 rounded-2xl bg-[#F7FAFC] dark:bg-[#0B1320] border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-sm text-[#0B1320] dark:text-slate-200 whitespace-pre-wrap">
                  {activeTicket.description}
                </p>
                {activeTicket.attachments && activeTicket.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeTicket.attachments.map((att) => (
                      <img
                        key={att.id}
                        src={att.url}
                        alt={att.name}
                        className="w-24 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Replies Thread */}
              <div className="space-y-3" data-testid="ticket-replies-list">
                {activeTicket.replies
                  .filter((r) => !r.isInternalNote)
                  .map((rep) => (
                    <div
                      key={rep.id}
                      className={`p-4 rounded-2xl border space-y-2 ${
                        rep.authorRole === 'admin'
                          ? 'border-[#0F9D8E]/40 bg-[#0F9D8E]/5 dark:bg-[#19B5A5]/10'
                          : 'border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#0B1320]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-[#0B1320] dark:text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F9D8E]" />
                          <span>{rep.authorName}</span>
                        </span>
                        <span className="font-mono text-slate-400">
                          {rep.createdAt.replace('T', ' ').slice(0, 16)}
                        </span>
                      </div>
                      <p className="text-sm text-[#0B1320] dark:text-slate-200">{rep.message}</p>
                    </div>
                  ))}
              </div>

              {/* Post Reply Form */}
              <form onSubmit={handleReplySubmit} className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <textarea
                  rows={3}
                  data-testid="tk-reply-input"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={lang === 'ar' ? 'أضف ردًا أو توضيحًا جديدًا...' : 'Write a follow-up reply...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <input
                      ref={replyFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          void uploadTicketImage(f, (att) =>
                            setReplyAttachments((prev) => [...prev, att].slice(0, 4))
                          );
                        }
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => replyFileRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-[#0F9D8E]" />
                      <span>{lang === 'ar' ? 'إرفاق صورة' : 'Attach'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReply || !replyText.trim()}
                    data-testid="tk-reply-submit-btn"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F9D8E] text-white text-xs font-bold disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'إرسال الرد' : 'Send Reply'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <SmartRelatedServices currentPage="support-tickets" />
    </div>
  );
};
