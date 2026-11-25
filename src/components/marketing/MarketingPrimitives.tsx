import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RouteId } from '../../types/domain';

interface PageHeroBandProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageSrc?: string;
  imageAlt?: string;
  imageAspect?: 'video' | '4/3';
  actions?: React.ReactNode;
}

/**
 * Shared Midnight Teal architectural hero header for secondary marketing pages.
 * Strictly Light + Dark paired, zero decorative pills, clean asymmetric composition.
 */
export const PageHeroBand: React.FC<PageHeroBandProps> = ({
  eyebrow,
  title,
  subtitle,
  imageSrc,
  imageAlt,
  imageAspect = 'video',
  actions,
}) => {
  return (
    <section className="relative overflow-hidden findit-hero-grid border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {imageSrc ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F9D8E] dark:text-[#2DD4BF]">
                {eyebrow}
              </p>
              <h1
                style={{ fontSize: 'clamp(2rem, 3.6vw, 3.1rem)' }}
                className="font-extrabold text-[#0B1320] dark:text-white leading-[1.15] tracking-tight text-balance"
              >
                {title}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                {subtitle}
              </p>
              {actions && <div className="pt-2 flex flex-wrap items-center gap-3">{actions}</div>}
            </div>

            <div className="lg:col-span-6">
              <MidnightMediaFrame
                src={imageSrc}
                alt={imageAlt || title}
                aspect={imageAspect}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl space-y-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F9D8E] dark:text-[#2DD4BF]">
              {eyebrow}
            </p>
            <h1
              style={{ fontSize: 'clamp(2rem, 3.6vw, 3.1rem)' }}
              className="font-extrabold text-[#0B1320] dark:text-white leading-[1.15] tracking-tight text-balance"
            >
              {title}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {subtitle}
            </p>
            {actions && <div className="pt-2 flex flex-wrap items-center gap-3">{actions}</div>}
          </div>
        )}
      </div>
    </section>
  );
};

interface MidnightMediaFrameProps {
  src: string;
  alt: string;
  aspect?: 'video' | '4/3';
  caption?: string;
}

export const MidnightMediaFrame: React.FC<MidnightMediaFrameProps> = ({
  src,
  alt,
  aspect = 'video',
  caption,
}) => {
  const aspectClass = aspect === '4/3' ? 'aspect-[4/3]' : 'aspect-video';
  return (
    <figure className="rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-[#0B1320] shadow-xl shadow-slate-900/10 dark:shadow-black/40">
      <div className={`${aspectClass} w-full overflow-hidden bg-[#0B1320]`}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>
      {caption && (
        <figcaption className="px-5 py-3.5 text-xs font-semibold text-slate-300 border-t border-slate-800/80 bg-[#0B1320]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

interface MidnightCtaBandProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryRoute: RouteId;
  secondaryLabel?: string;
  secondaryRoute?: RouteId;
}

export const MidnightCtaBand: React.FC<MidnightCtaBandProps> = ({
  eyebrow,
  title,
  subtitle,
  primaryLabel,
  primaryRoute,
  secondaryLabel,
  secondaryRoute,
}) => {
  const { isRtl, navigate } = useApp();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-[#0B1320] dark:bg-[#0D1A2D] border border-slate-800/90 px-6 py-10 sm:px-12 sm:py-14 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -end-24 w-72 h-72 rounded-full bg-[#19B5A5]/15 blur-3xl"
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            {eyebrow && (
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#2DD4BF]">
                {eyebrow}
              </p>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate(primaryRoute)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#19B5A5] hover:bg-[#14A394] text-[#07101D] font-extrabold text-sm transition-colors whitespace-nowrap shrink-0"
            >
              <span>{primaryLabel}</span>
              <ArrowIcon className="w-4 h-4" aria-hidden="true" />
            </button>
            {secondaryLabel && secondaryRoute && (
              <button
                type="button"
                onClick={() => navigate(secondaryRoute)}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-700 text-white font-bold text-sm transition-colors whitespace-nowrap shrink-0"
              >
                <span>{secondaryLabel}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
