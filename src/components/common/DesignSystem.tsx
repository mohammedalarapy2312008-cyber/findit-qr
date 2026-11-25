import React from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import { ItemStatus, Language } from '../../types/domain';

export const SectionHeader: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'start' | 'center';
  action?: React.ReactNode;
}> = ({ eyebrow, title, subtitle, align = 'start', action }) => (
  <div
    className={`flex flex-col ${
      action ? 'md:flex-row md:items-end justify-between gap-6' : 'gap-2.5'
    } ${align === 'center' ? 'items-center text-center mx-auto max-w-3xl' : ''}`}
  >
    <div className="space-y-2 max-w-3xl">
      {eyebrow && (
        <p className="text-xs font-extrabold tracking-wider uppercase text-[#2563EB] dark:text-[#19B5A5]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white tracking-tight text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const SurfaceCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}> = ({ children, className = '', elevated = false }) => (
  <div
    className={`rounded-2xl border transition-colors ${
      elevated
        ? 'bg-white dark:bg-[#152338] border-slate-200 dark:border-slate-700/70 shadow-sm'
        : 'bg-white dark:bg-[#0F1A2B] border-slate-200 dark:border-slate-800/90'
    } ${className}`}
  >
    {children}
  </div>
);

export const SemanticStatusText: React.FC<{
  status: ItemStatus;
  lang: Language;
  label: string;
}> = ({ status, label }) => {
  const iconClass = 'w-3.5 h-3.5 shrink-0';
  if (status === 'Lost') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#E05D38] dark:text-[#FF8A65]">
        <AlertTriangle className={iconClass} />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'Found' || status === 'Recovered') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0F9D8E] dark:text-[#19B5A5]">
        <CheckCircle2 className={iconClass} />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'Archived') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
        <Archive className={iconClass} />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2563EB] dark:text-[#60A5FA]">
      <ShieldCheck className={iconClass} />
      <span>{label}</span>
    </span>
  );
};

export const IllustrativeShowcaseNotice: React.FC<{
  lang: Language;
  className?: string;
}> = ({ lang, className = '' }) => (
  <div
    className={`inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 ${className}`}
  >
    <Compass className="w-3.5 h-3.5 text-[#19B5A5] shrink-0" />
    <span>
      {lang === 'ar'
        ? 'معاينة توضيحية تفاعلية (بيانات نموذجية للعرض العام)'
        : 'Interactive Illustrative Preview (Public Showcase Sample)'}
    </span>
  </div>
);
