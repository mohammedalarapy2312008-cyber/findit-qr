import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Heart } from 'lucide-react';
import { TagDesignTemplate } from '../../types/domain';
import { getTemplateShowcaseMedia } from '../../data/pilotShowcaseMedia';
import { TemplateOwnershipStatus } from '../../utils/templateLibraryAudit';
import { PilotCard3dPreview } from './PilotCard3dPreview';

interface TemplateShowcaseCardProps {
  design: TagDesignTemplate;
  lang: 'ar' | 'en';
  darkTheme: boolean;
  isFavorite: boolean;
  showFavorites?: boolean;
  ownershipStatus?: TemplateOwnershipStatus;
  ownershipPlanLabel?: string;
  selectLabel?: string;
  onToggleFavorite: (designId: string) => void;
  onExplore: (designId: string) => void;
  onSelectDesign?: (designId: string) => void;
  onUnlock?: (designId: string) => void;
}

const DOMAIN_LABELS: Record<string, { ar: string; en: string }> = {
  personal: { ar: 'ممتلكات شخصية', en: 'Personal Items' },
  travel: { ar: 'السفر والأمتعة', en: 'Travel & Luggage' },
  family: { ar: 'العائلة والأطفال', en: 'Family & Kids' },
  pets: { ar: 'الحيوانات الأليفة', en: 'Pets' },
  business: { ar: 'الشركات والأصول', en: 'Businesses' },
  anime_cartoon: { ar: 'الأنمي والكرتون', en: 'Anime & Cartoon' },
};

const QUICK_SHOT_LABELS = [
  { ar: '3D', en: '3D' },
  { ar: 'منتج', en: 'Product' },
  { ar: 'مقربة', en: 'Macro' },
  { ar: 'واقعي', en: 'Lifestyle' },
];

/**
 * Editorial Commercial Product Showcase Card.
 * Large 4:3 imagery with interactive 4-shot quick-preview switcher right on the card,
 * unboxed zero-pill metadata line, clean hierarchy, and single Explore CTA.
 */
export const TemplateShowcaseCard: React.FC<TemplateShowcaseCardProps> = ({
  design,
  lang,
  darkTheme,
  isFavorite,
  showFavorites = true,
  ownershipStatus,
  ownershipPlanLabel,
  selectLabel,
  onToggleFavorite,
  onExplore,
  onSelectDesign,
  onUnlock,
}) => {
  const media = getTemplateShowcaseMedia(design.id);
  const slides = media?.lifestyleSlides || [];
  const [activeShotIdx, setActiveShotIdx] = useState(0);

  const isFreeTpl = design.isFree || design.priceSar === 0;
  const domainKey = design.domainCategory || 'personal';
  const categoryText =
    DOMAIN_LABELS[domainKey]?.[lang] ||
    (lang === 'ar' ? 'تصميم قابل للطباعة' : 'Printable Design');
  const subCatText = lang === 'ar' ? design.subCategoryAr : design.subCategoryEn;
  const ExploreArrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  const activeSlide = slides[activeShotIdx] || slides[0];
  const displayUrl =
    activeSlide?.imageUrl ||
    media?.cardLifestyleUrl ||
    design.showcaseGallery?.mockup3dUrl ||
    design.showcaseGallery?.onProductUrl ||
    '';
  const displayAlt = activeSlide
    ? lang === 'ar'
      ? activeSlide.altAr
      : activeSlide.altEn
    : lang === 'ar'
    ? media?.cardLifestyleAltAr || design.titleAr
    : media?.cardLifestyleAltEn || design.titleEn;

  const ownershipLabel =
    ownershipStatus === 'free'
      ? lang === 'ar'
        ? 'مجاني'
        : 'Free'
      : ownershipStatus === 'purchased'
      ? lang === 'ar'
        ? 'مملوك برخصة'
        : 'Purchased'
      : ownershipStatus === 'included_in_plan'
      ? lang === 'ar'
        ? `مملوك (${ownershipPlanLabel || 'الباقة'})`
        : `Owned (${ownershipPlanLabel || 'Plan'})`
      : ownershipStatus === 'locked'
      ? lang === 'ar'
        ? 'غير مملوك بعد'
        : 'Not Purchased'
      : isFreeTpl
      ? lang === 'ar'
        ? 'باقة البداية'
        : 'Starter'
      : lang === 'ar'
      ? 'رخصة طباعة'
      : 'Print License';

  return (
    <article
      data-testid={`design-card-${design.id}`}
      className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-[0_18px_40px_-15px_rgba(15,23,42,0.12)]"
    >
      <div>
        {/* Large 4:3 Product Visual Stage + Quick 4-Shot Preview Switcher */}
        <div className="relative aspect-[4/3] w-full bg-[#EFECE6] dark:bg-[#0B1322] overflow-hidden">
          {showFavorites && (
            <button
              type="button"
              data-testid={`favorite-btn-${design.id}`}
              aria-label={
                lang === 'ar'
                  ? `حفظ ${design.titleAr} في المفضلة`
                  : `Favorite ${design.titleEn}`
              }
              onClick={() => onToggleFavorite(design.id)}
              className={`absolute top-3 end-3 z-20 w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
                isFavorite
                  ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                  : 'bg-white/90 dark:bg-[#0F1A2B]/90 border-slate-200/90 dark:border-slate-700 text-slate-500 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}

          {displayUrl ? (
            <button
              type="button"
              onClick={() => onExplore(design.id)}
              aria-label={
                lang === 'ar'
                  ? `معاينة ${design.titleAr}`
                  : `Preview ${design.titleEn}`
              }
              className="block w-full h-full text-start focus:outline-none"
            >
              <img
                src={displayUrl}
                alt={displayAlt}
                loading="lazy"
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onExplore(design.id)}
              aria-label={
                lang === 'ar'
                  ? `معاينة ${design.titleAr}`
                  : `Preview ${design.titleEn}`
              }
              className="relative block w-full h-full focus:outline-none"
            >
              <PilotCard3dPreview
                design={design}
                darkTheme={darkTheme}
                viewAngle="hero"
              />
            </button>
          )}

          {/* Quick Multi-Shot Switcher on Card (allows inspecting 3D / Product / Macro / Lifestyle before entering details) */}
          {slides.length > 1 && (
            <div
              role="group"
              aria-label={
                lang === 'ar' ? 'تبديل زاوية المعاينة' : 'Switch preview angle'
              }
              className="absolute bottom-2.5 inset-x-2.5 z-20 flex items-center justify-center"
            >
              <div className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-white/92 dark:bg-[#0F1A2B]/92 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
                {slides.slice(0, 4).map((slide, idx) => {
                  const lbl = QUICK_SHOT_LABELS[idx] || {
                    ar: `${idx + 1}`,
                    en: `${idx + 1}`,
                  };
                  const isActive = activeShotIdx === idx;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      data-testid={`card-shot-${design.id}-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveShotIdx(idx);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17]'
                          : 'text-slate-600 dark:text-slate-300 hover:text-[#17243A] dark:hover:text-white'
                      }`}
                    >
                      {lang === 'ar' ? lbl.ar : lbl.en}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Clean Uncluttered Editorial Copy (Zero-Pill Metadata Line) */}
        <div className="p-5 pb-4 space-y-1.5">
          <p className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-slate-400 truncate">
            <span>{categoryText}</span>
            {subCatText ? <span> · {subCatText}</span> : null}
            {design.requiresIpVerification ? (
              <span className="text-amber-600 dark:text-amber-400">
                {' '}
                · {lang === 'ar' ? 'مرجعي (فحص حقوق)' : 'Ref · IP Check'}
              </span>
            ) : null}
          </p>

          <h3 className="text-base sm:text-lg font-extrabold text-[#17243A] dark:text-white leading-snug line-clamp-1">
            {lang === 'ar' ? design.titleAr : design.titleEn}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-1">
            {lang === 'ar' ? design.subtitleAr : design.subtitleEn}
          </p>
        </div>
      </div>

      {/* Price, Ownership Status & Clear Action Row */}
      <div className="px-5 pb-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2.5">
        <div className="flex items-baseline gap-2 min-w-0">
          <span
            className={`font-extrabold text-base tabular-nums ${
              isFreeTpl
                ? 'text-[#0F9D8E] dark:text-[#19B5A5]'
                : 'text-[#17243A] dark:text-white'
            }`}
          >
            {isFreeTpl
              ? lang === 'ar'
                ? 'مجاني'
                : 'Free'
              : lang === 'ar'
              ? `${design.priceSar} ر.س`
              : `$${design.priceUsd}`}
          </span>
          <span
            className={`text-[11px] font-bold truncate ${
              ownershipStatus === 'purchased' || ownershipStatus === 'included_in_plan'
                ? 'text-[#0F9D8E] dark:text-[#19B5A5]'
                : ownershipStatus === 'locked'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {ownershipLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onSelectDesign && ownershipStatus !== 'locked' && (
            <button
              type="button"
              data-testid={`store-select-${design.id}`}
              onClick={() => onSelectDesign(design.id)}
              className="px-3 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-extrabold transition-colors whitespace-nowrap"
            >
              {selectLabel || (lang === 'ar' ? 'اختيار' : 'Select')}
            </button>
          )}
          {onUnlock && ownershipStatus === 'locked' && (
            <button
              type="button"
              data-testid={`store-unlock-${design.id}`}
              onClick={() => onUnlock(design.id)}
              className="px-3 py-2.5 rounded-xl bg-[#19B5A5] hover:bg-teal-400 text-[#070D17] text-xs font-extrabold transition-colors whitespace-nowrap"
            >
              {lang === 'ar' ? 'شراء' : 'Unlock'}
            </button>
          )}
          <button
            type="button"
            data-testid={`inspect-design-${design.id}`}
            onClick={() => onExplore(design.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#17243A] dark:bg-[#19B5A5] hover:bg-[#2563EB] dark:hover:bg-teal-400 text-white dark:text-[#070D17] text-xs font-extrabold transition-colors whitespace-nowrap"
          >
            <span>{lang === 'ar' ? 'استكشاف' : 'Explore'}</span>
            <ExploreArrow className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
