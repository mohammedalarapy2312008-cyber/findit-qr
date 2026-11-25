import React from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ContactMethodType } from '../../types/domain';
import { CONTACT_METHOD_META, ensureProfileContactMethods } from '../../utils/contactMethodsLogic';

interface ContactMethodsSelectorProps {
  selectedMethodIds: string[];
  anonymousRelayOnly: boolean;
  onChange: (next: { selectedMethodIds: string[]; anonymousRelayOnly: boolean }) => void;
}

const METHOD_ICON: Record<ContactMethodType, React.FC<{ className?: string }>> = {
  phone: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  telegram: Send,
  facebook: Globe,
  custom_link: ExternalLink,
};

export const ContactMethodsSelector: React.FC<ContactMethodsSelectorProps> = ({
  selectedMethodIds,
  anonymousRelayOnly,
  onChange,
}) => {
  const { lang, profile, navigate } = useApp();
  const methods = ensureProfileContactMethods(profile);
  const activeMethods = methods.filter((m) => m.isActive);
  const limit = profile.contactMethodsLimit || 2;
  const effectiveSelected = selectedMethodIds.filter((id) =>
    activeMethods.some((m) => m.id === id)
  );
  const quotaReached = !anonymousRelayOnly && effectiveSelected.length >= limit;

  const toggleMethod = (id: string) => {
    if (anonymousRelayOnly) return;
    if (effectiveSelected.includes(id)) {
      onChange({
        selectedMethodIds: effectiveSelected.filter((x) => x !== id),
        anonymousRelayOnly: false,
      });
    } else {
      if (effectiveSelected.length >= limit) return;
      onChange({
        selectedMethodIds: [...effectiveSelected, id],
        anonymousRelayOnly: false,
      });
    }
  };

  return (
    <div
      data-testid="contact-methods-selector"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#0B1320]/80 p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-extrabold text-[#0B1320] dark:text-white">
            {lang === 'ar'
              ? 'طرق التواصل المسموح عرضها لمن يعثر على هذا الغرض'
              : 'Approved Finder Contact Channels for This Item'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'ar'
              ? 'اختر من دليلك المركزي — لا تُضمَّن أي بيانات شخصية داخل كود QR نفسه.'
              : 'Choose from your central contact directory — zero PII is stored inside the QR code.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white dark:bg-[#14233A] border border-slate-200 dark:border-slate-700 text-[#0F9D8E] dark:text-[#19B5A5]">
            {anonymousRelayOnly
              ? lang === 'ar'
                ? 'وضع الوسيط فقط'
                : 'Relay Only'
              : `${effectiveSelected.length}/${limit}`}
          </span>
          <button
            type="button"
            onClick={() => navigate('contact-methods')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#14233A] text-xs font-bold text-[#0B1320] dark:text-white hover:border-[#0F9D8E] transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#0F9D8E]" />
            <span>{lang === 'ar' ? 'إدارة الدليل' : 'Manage Directory'}</span>
          </button>
        </div>
      </div>

      {/* Anonymous Relay Mode Toggle */}
      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#19B5A5]/30 bg-white dark:bg-[#0E192B] cursor-pointer">
        <input
          type="checkbox"
          checked={anonymousRelayOnly}
          onChange={(e) =>
            onChange({
              selectedMethodIds: e.target.checked ? [] : effectiveSelected,
              anonymousRelayOnly: e.target.checked,
            })
          }
          className="mt-1 accent-[#0F9D8E]"
        />
        <div className="flex-1">
          <div className="text-xs font-extrabold text-[#0B1320] dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0F9D8E] dark:text-[#19B5A5]" />
            <span>
              {lang === 'ar'
                ? 'الوسيط الآمن فقط (إخفاء جميع قنوات التواصل المباشرة)'
                : 'Anonymous Relay Only (Hide All Direct Contact Channels)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'ar'
              ? 'يتواصل المكتشف عبر نموذج الرسائل الآمن داخل الصفحة العامة فقط دون إظهار أي رقم أو رابط.'
              : 'Finders can only reach you through the built-in relay form without seeing any phone, email, or link.'}
          </p>
        </div>
      </label>

      {/* Account Central Methods Grid */}
      {!anonymousRelayOnly && (
        <>
          {activeMethods.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E192B] flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {lang === 'ar'
                  ? 'لا توجد وسائل تواصل مفعّلة في حسابك بعد. أضف وسيلة أو فعّل الوضع المجهول.'
                  : 'No active contact methods found in your central directory yet. Add one or use Anonymous Relay.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('contact-methods')}
                className="px-3 py-1.5 rounded-lg bg-[#0F9D8E] text-white text-xs font-bold"
              >
                {lang === 'ar' ? 'إضافة وسيلة تواصل' : 'Add Contact Method'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeMethods.map((method) => {
                const Icon = METHOD_ICON[method.type] || ExternalLink;
                const selected = effectiveSelected.includes(method.id);
                const disabled = !selected && quotaReached;
                const meta = CONTACT_METHOD_META[method.type];

                return (
                  <button
                    key={method.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleMethod(method.id)}
                    className={`text-start p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                      selected
                        ? 'border-[#0F9D8E] bg-[#0F9D8E]/10 dark:bg-[#19B5A5]/15'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0E192B]'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#19B5A5]'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          selected
                            ? 'bg-[#0F9D8E] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1320] dark:text-white truncate">
                          {method.label}{' '}
                          <span className="text-[10px] font-medium text-slate-400">
                            ({lang === 'ar' ? meta.labelAr : meta.labelEn})
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate" dir="ltr">
                          {method.value}
                        </div>
                      </div>
                    </div>
                    {selected && (
                      <CheckCircle2 className="w-4 h-4 text-[#0F9D8E] dark:text-[#19B5A5] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {quotaReached && (
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              {lang === 'ar'
                ? `وصلت إلى الحد الأقصى للقنوات في باقة ${profile.plan} (${limit} وسائل لكل غرض). ألغِ تحديد وسيلة لاختيار أخرى.`
                : `Reached plan limit for ${profile.plan} (${limit} active channels per item). Deselect one to swap.`}
            </p>
          )}
        </>
      )}
    </div>
  );
};
