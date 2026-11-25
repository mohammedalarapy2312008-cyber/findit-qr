import React from 'react';
import {
  EyeOff,
  Layers,
  Lock,
  PauseCircle,
  QrCode,
  ShieldCheck,
  Sliders,
  Trash2,
} from 'lucide-react';
import {
  MidnightCtaBand,
  PageHeroBand,
} from '../../components/marketing/MarketingPrimitives';
import { useApp } from '../../context/AppContext';
import { VISUAL_ASSETS } from '../../data/foundationCatalog';

export const PrivacySecurityPage: React.FC = () => {
  const { lang, navigate } = useApp();

  const coreGuarantees = [
    {
      icon: QrCode,
      titleAr: 'لا بيانات شخصية داخل رمز QR نفسه',
      titleEn: 'Zero Personal Data Encoded Inside the QR Code',
      descAr:
        'يحتوي رمز QR المطبوع على رابط الاسترداد الفريد فقط (/found/codeSerial أو /shared/codeId)، ولا يُخزّن اسمك أو رقم هاتفك أو عنوان منزلك كنص مكشوف داخل الرمز. بالتالي يستحيل قراءة بياناتك الشخصية بمجرد تصوير الملصق أو فحصه.',
      descEn:
        'Every printed QR sticker encodes only its unique recovery route (/found/codeSerial or /shared/codeId). Your name, phone number, email, and address are never embedded in the QR matrix itself.',
    },
    {
      icon: Sliders,
      titleAr: 'تحكم كامل بما يراه المكتشف لكل غرض',
      titleEn: 'Granular Per-Item Visibility Controls',
      descAr:
        'تختار بنفسك القنوات المسموح بظهورها لكل غرض بشكل مستقل: رقم الهاتف، واتساب، البريد الإلكتروني، تيليجرام، أو إخفاء جميع القنوات المباشرة والاكتفاء بنموذج التواصل الوسيط الآمن.',
      descEn:
        'For every registered item individually, you decide exactly which channels appear on the public recovery page: Phone, WhatsApp, Email, Telegram, or none at all.',
    },
    {
      icon: EyeOff,
      titleAr: 'وضع الوسيط الآمن المجهول (Anonymous Relay)',
      titleEn: 'Anonymous Relay Messaging Mode',
      descAr:
        'عند تفعيل وضع الوسيط المجهول، يمكن للشخص الذي عثر على غرضك إرسال رسالة وإشعار عثور عبر صفحة الاسترداد وتصلك فورًا في لوحة التحكم، دون أن يرى أي رقم هاتف أو بريد شخصي.',
      descEn:
        'When Anonymous Relay is enabled, finders submit a recovery message directly through the browser page to your dashboard without ever seeing your phone number or email.',
    },
    {
      icon: PauseCircle,
      titleAr: 'إيقاف فوري وأرشفة بنقرة واحدة',
      titleEn: 'Instant QR Pause & Archiving',
      descAr:
        'تستطيع إيقاف رمز QR مؤقتًا أو أرشفة الغرض في أي لحظة عندما يكون بحوزتك أو عند بيعه؛ فيتوقف عرض بيانات التواصل فورًا دون الحاجة إلى إزالة الملصق أو تغييره.',
      descEn:
        'Pause a QR tag or archive an item in one click whenever it is safely with you or no longer in use. Public contact details stop displaying immediately without touching the physical sticker.',
    },
    {
      icon: Layers,
      titleAr: 'خصوصية دقيقة داخل مجموعات QR المشتركة',
      titleEn: 'Per-Item Privacy Inside Shared QR Groups',
      descAr:
        'عند ربط عدة مقتنيات برمز QR مشترك واحد، تتحكم في إظهار أو إخفاء كل غرض داخل المجموعة بشكل منفصل، وتستطيع إعادة أي غرض إلى رمزه الفردي في أي وقت.',
      descEn:
        'When grouping multiple belongings under one Shared QR code, you control visibility for each individual item inside the group and can restore any item to its own QR anytime.',
    },
    {
      icon: Lock,
      titleAr: 'عزل تام لحسابات المستخدمين والتحقق من الملكية',
      titleEn: 'Strict Account Isolation & Ownership Verification',
      descAr:
        'كل عملية تعديل أو أرشفة أو عرض لسجل المسح والإشعارات تخضع لتحقق خادمي صارم من هوية المالك وجلسة المصادقة، مما يمنع وصول أي مستخدم إلى بيانات أو أغراض مستخدم آخر.',
      descEn:
        'Every item edit, scan log lookup, notification, and license action is verified server-side against your authenticated session, isolating every user account strictly.',
    },
  ];

  const visibilityMatrix = [
    {
      fieldAr: 'رقم الهاتف وواتساب والبريد الشخصي',
      fieldEn: 'Phone, WhatsApp & Personal Email',
      publicAr: 'مخفي افتراضيًا ما لم يفعّله المالك صراحة للغرض',
      publicEn: 'Hidden unless explicitly enabled by the owner for that item',
      ownerAr: 'تحكم وتعديل وإيقاف فوري في أي وقت',
      ownerEn: 'Full edit, toggle, or instant hide anytime',
    },
    {
      fieldAr: 'اسم الغرض ورسالة الاسترداد للمكتشف',
      fieldEn: 'Item Title & Finder Instructions',
      publicAr: 'يظهر في صفحة الاسترداد عند تفعيل الغرض',
      publicEn: 'Shown on recovery page while item is active or lost',
      ownerAr: 'قابل للتحديث الفوري دون إعادة طباعة الرمز',
      ownerEn: 'Updatable anytime without reprinting the tag',
    },
    {
      fieldAr: 'الموقع السكني أو العنوان الشخصي',
      fieldEn: 'Home Address or Private Location',
      publicAr: 'لا يُطلب ولا يُعرض على صفحة المسح أبدًا',
      publicEn: 'Never required and never exposed on public scan pages',
      ownerAr: 'المدينة اختيارية فقط لإرشاد المكتشف',
      ownerEn: 'Optional city hint only if you choose to enter it',
    },
    {
      fieldAr: 'سجل المسح ورسائل المكتشفين',
      fieldEn: 'Scan Activity & Finder Messages',
      publicAr: 'خاص بالمالك فقط — غير متاح للعامة',
      publicEn: 'Private to item owner only — never publicly accessible',
      ownerAr: 'متاح داخل لوحة التحكم الخاصة بحسابك',
      ownerEn: 'Accessible only inside your authenticated dashboard',
    },
  ];

  return (
    <div>
      <PageHeroBand
        eyebrow={lang === 'ar' ? 'الخصوصية والأمان' : 'PRIVACY & SECURITY'}
        title={
          lang === 'ar'
            ? 'استعد ممتلكاتك بسهولة دون كشف بياناتك الشخصية للغرباء'
            : 'Recover Lost Belongings Without Exposing Your Personal Identity'
        }
        subtitle={
          lang === 'ar'
            ? 'صُممت FindIt QR على مبدأ الخصوصية بالتصميم: الرمز المطبوع لا يحمل رقمك أو اسمك، وأنت من يقرر بالضبط ما يظهر للشخص الذي يمسح الكود ومتى يظهر.'
            : 'FindIt QR is built on privacy by design: your printed tag holds zero personal contact data, and you decide exactly what a finder sees and when they can reach you.'
        }
        imageSrc={VISUAL_ASSETS.privacy3d}
        imageAlt={
          lang === 'ar'
            ? 'درع أمان ثلاثي الأبعاد يمثل حماية الخصوصية والبيانات في منصة FindIt QR'
            : '3D Midnight Teal frosted glass security shield above a smart QR plate representing FindIt QR privacy architecture'
        }
        imageAspect="4/3"
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('register')}
              className="px-6 py-3 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] dark:bg-[#19B5A5] dark:hover:bg-[#14A394] text-white dark:text-[#07101D] font-extrabold text-sm transition-colors whitespace-nowrap"
            >
              {lang === 'ar' ? 'ابدأ مجانًا بأمان' : 'Start Free Securely'}
            </button>
            <button
              type="button"
              onClick={() => navigate('found-item')}
              className="px-5 py-3 rounded-xl bg-white dark:bg-[#111E33] border border-slate-300 dark:border-slate-700 hover:border-[#19B5A5] text-[#0B1320] dark:text-white font-bold text-sm transition-colors whitespace-nowrap"
            >
              {lang === 'ar' ? 'معاينة ما يراه المكتشف' : 'Preview Finder View'}
            </button>
          </>
        }
      />

      {/* 6 Security & Privacy Architecture Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 space-y-10">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F9D8E] dark:text-[#2DD4BF]">
            {lang === 'ar' ? 'ركائز الحماية' : 'PROTECTION ARCHITECTURE'}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white">
            {lang === 'ar'
              ? 'كيف نحمي حسابك وبياناتك في كل مرحلة؟'
              : 'How FindIt QR Protects Your Data at Every Step'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreGuarantees.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="findit-card-hover rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0E192B] p-6 sm:p-7 space-y-3.5"
              >
                <div className="w-11 h-11 rounded-xl bg-[#19B5A5]/12 dark:bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#2DD4BF] flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#0B1320] dark:text-white">
                  {lang === 'ar' ? item.titleAr : item.titleEn}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'ar' ? item.descAr : item.descEn}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transparent Visibility Matrix */}
      <section className="bg-white dark:bg-[#0A1322] border-y border-slate-200/80 dark:border-slate-800/80 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F9D8E] dark:text-[#2DD4BF]">
              {lang === 'ar' ? 'شفافية العرض والتحكم' : 'VISIBILITY TRANSPARENCY'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white">
              {lang === 'ar'
                ? 'ما الذي يراه المكتشف مقارنة بما تتحكم به أنت؟'
                : 'What a Finder Sees vs. What Stays Under Your Control'}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#0E192B] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100/90 dark:bg-[#08101E] text-xs font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-4 px-5 text-start">
                      {lang === 'ar' ? 'نوع البيانات' : 'Data Element'}
                    </th>
                    <th className="py-4 px-5 text-start">
                      {lang === 'ar' ? 'ما يظهر عند مسح QR' : 'Visibility Upon QR Scan'}
                    </th>
                    <th className="py-4 px-5 text-start">
                      {lang === 'ar' ? 'صلاحية المالك' : 'Owner Control'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {visibilityMatrix.map((row, idx) => (
                    <tr key={idx} className="bg-white/70 dark:bg-transparent">
                      <td className="py-4 px-5 font-bold text-[#0B1320] dark:text-white">
                        {lang === 'ar' ? row.fieldAr : row.fieldEn}
                      </td>
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                        {lang === 'ar' ? row.publicAr : row.publicEn}
                      </td>
                      <td className="py-4 px-5 font-semibold text-[#0F9D8E] dark:text-[#2DD4BF]">
                        {lang === 'ar' ? row.ownerAr : row.ownerEn}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Ownership & Deletion Right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#0E192B] p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#0B1320] dark:text-white">
                  {lang === 'ar' ? 'تحديث لحظي دون إعادة طباعة' : 'Live Updates Without Reprinting'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'ar'
                    ? 'غيّرت رقمك أو سافرت؟ عدّل قنواتك من لوحة التحكم وسينعكس التحديث فورًا على الملصقات المطبوعة سابقًا.'
                    : 'Changed your phone number or traveling abroad? Update your channels in the dashboard and every printed tag reflects it instantly.'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#0E192B] p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#0B1320] dark:text-white">
                  {lang === 'ar' ? 'ملكية كاملة لبياناتك وحذف فوري' : 'Full Ownership & Instant Deletion'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'ar'
                    ? 'بياناتك ملك لك؛ يمكنك أرشفة أو حذف أي غرض أو مجموعة QR في أي لحظة لإلغاء ربطه العام بشكل فوري.'
                    : 'Your data belongs to you. Archive or permanently delete any item or Shared QR group anytime to revoke public resolution immediately.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MidnightCtaBand
        eyebrow={lang === 'ar' ? 'جاهز لحماية مقتنياتك؟' : 'READY TO PROTECT YOUR GEAR?'}
        title={
          lang === 'ar'
            ? 'تحكّم في خصوصيتك وابدأ بإنشاء أول رمز QR خلال دقيقتين'
            : 'Stay in Control of Your Privacy and Create Your First QR Tag in Two Minutes'
        }
        subtitle={
          lang === 'ar'
            ? 'ابدأ بالباقة المجانية أو تواصل مع فريقنا إذا كانت لديك أسئلة إضافية حول الأمان.'
            : 'Start on the free Starter plan or reach our support desk if you have specific security questions.'
        }
        primaryLabel={lang === 'ar' ? 'إنشاء حساب مجاني' : 'Create Free Account'}
        primaryRoute="register"
        secondaryLabel={lang === 'ar' ? 'تواصل مع الدعم' : 'Contact Support'}
        secondaryRoute="contact"
      />
    </div>
  );
};
