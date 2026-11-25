import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  LayoutGrid,
  Lock,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTemplateShowcaseMedia } from '../../data/pilotShowcaseMedia';
import { TagDesignTemplate } from '../../types/domain';
import { canAccessTemplateByPlanOrPurchase } from '../../utils/adminLogic';
import {
  isTemplateFree,
  sortCatalogTemplates,
} from '../../utils/templateDiscovery';
import {
  DOMAIN_CATEGORY_LABEL_MAP,
  getIssuedPurchasedTemplateIdSet,
  getTemplateOwnershipStatus,
} from '../../utils/templateLibraryAudit';
import { composeItemTemplateDesignSvg } from '../../utils/templateQrCompositor';
import { CheckoutModal } from './CheckoutModal';

interface ItemTemplateCarouselProps {
  selectedDesignId: string;
  onSelectDesign: (designId: string) => void;
  onOpenFullLibrary: () => void;
  onInspectDetails?: (designId: string) => void;
  previewSeed?: string;
}

const CARDS_PER_PAGE = 3;

export const ItemTemplateCarousel: React.FC<ItemTemplateCarouselProps> = ({
  selectedDesignId,
  onSelectDesign,
  onOpenFullLibrary,
  onInspectDetails,
  previewSeed = 'FQR-PREVIEW',
}) => {
  const { lang, designs, profile, issuedLicenses } = useApp();
  const [pageIdx, setPageIdx] = useState(0);
  const [previewTemplate, setPreviewTemplate] = useState<TagDesignTemplate | null>(null);
  const [checkoutTemplate, setCheckoutTemplate] = useState<TagDesignTemplate | null>(null);

  const purchasedTemplateIds = useMemo(
    () => getIssuedPurchasedTemplateIdSet(issuedLicenses),
    [issuedLicenses]
  );

  const orderedTemplates = useMemo(() => {
    const published = designs.filter((d) => !d.status || d.status === 'published');
    const sorted = sortCatalogTemplates(published, 'featured');
    return [...sorted].sort((a, b) => {
      if (a.id === selectedDesignId) return -1;
      if (b.id === selectedDesignId) return 1;
      const aUnlocked = canAccessTemplateByPlanOrPurchase({
        template: a,
        userPlan: profile.plan,
        purchasedTemplateIds,
      });
      const bUnlocked = canAccessTemplateByPlanOrPurchase({
        template: b,
        userPlan: profile.plan,
        purchasedTemplateIds,
      });
      if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
      return 0;
    });
  }, [designs, selectedDesignId, profile.plan, purchasedTemplateIds]);

  const totalPages = Math.max(1, Math.ceil(orderedTemplates.length / CARDS_PER_PAGE));
  const safePageIdx = Math.min(pageIdx, totalPages - 1);
  const visibleSlice = orderedTemplates.slice(
    safePageIdx * CARDS_PER_PAGE,
    safePageIdx * CARDS_PER_PAGE + CARDS_PER_PAGE
  );

  const selectedTemplate = useMemo(
    () => orderedTemplates.find((d) => d.id === selectedDesignId) ?? orderedTemplates[0],
    [orderedTemplates, selectedDesignId]
  );

  const previewComposite = useMemo(() => {
    if (!previewTemplate) return null;
    return composeItemTemplateDesignSvg({
      design: previewTemplate,
      codeSerial: previewSeed || 'FQR-2026-DEMO',
      mode: 'clean',
    });
  }, [previewTemplate, previewSeed]);

  const PrevIcon = lang === 'ar' ? ArrowRight : ArrowLeft;
  const NextIcon = lang === 'ar' ? ArrowLeft : ArrowRight;

  const handlePrev = () => {
    setPageIdx((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNext = () => {
    setPageIdx((prev) => (prev + 1) % totalPages);
  };

  return (
    <div className="space-y-4" data-testid="item-template-carousel">
      {/* Header & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-[#17243A] dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB] dark:text-[#19B5A5]" />
            <span>
              {lang === 'ar'
                ? '٣. اختيار قالب الملصق من مكتبة FindIt QR'
                : '3. Choose Sticker Template from FindIt QR Library'}
            </span>
          </h2>
          {selectedTemplate && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'ar' ? 'القالب المعتمد حاليًا: ' : 'Selected Template: '}
              <strong className="text-[#17243A] dark:text-white">
                {lang === 'ar' ? selectedTemplate.titleAr : selectedTemplate.titleEn}
              </strong>
              {' · '}
              <span dir="ltr" className="font-mono text-[11px]">
                {selectedTemplate.dimensionsMm}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] p-1">
            <button
              type="button"
              data-testid="carousel-prev-btn"
              onClick={handlePrev}
              aria-label={lang === 'ar' ? 'القوالب السابقة' : 'Previous templates'}
              className="w-8 h-8 rounded-lg bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 text-[#17243A] dark:text-white flex items-center justify-center hover:border-[#2563EB] transition-colors"
            >
              <PrevIcon className="w-4 h-4" />
            </button>
            <span
              data-testid="carousel-page-indicator"
              className="px-2 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums"
              dir="ltr"
            >
              {safePageIdx + 1} / {totalPages}
            </span>
            <button
              type="button"
              data-testid="carousel-next-btn"
              onClick={handleNext}
              aria-label={lang === 'ar' ? 'القوالب التالية' : 'Next templates'}
              className="w-8 h-8 rounded-lg bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 text-[#17243A] dark:text-white flex items-center justify-center hover:border-[#2563EB] transition-colors"
            >
              <NextIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            data-testid="browse-more-templates-btn"
            onClick={onOpenFullLibrary}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#17243A] dark:bg-[#19B5A5] hover:bg-[#2563EB] dark:hover:bg-teal-400 text-white dark:text-[#070D17] text-xs font-extrabold transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>
              {lang === 'ar' ? 'عرض المزيد من القوالب' : 'Browse More Templates'}
            </span>
          </button>
        </div>
      </div>

      {/* 3-Card Carousel Stage */}
      <div
        data-testid="carousel-cards-grid"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {visibleSlice.map((tpl) => {
          const isSelected = tpl.id === selectedDesignId;
          const isFree = isTemplateFree(tpl);
          const ownership = getTemplateOwnershipStatus({
            template: tpl,
            userPlan: profile.plan,
            purchasedTemplateIds,
          });
          const isUnlocked = ownership !== 'locked';
          const showcaseMedia = getTemplateShowcaseMedia(tpl.id);
          const imageUrl =
            tpl.showcaseGallery?.mockup3dUrl ||
            tpl.showcaseGallery?.onProductUrl ||
            showcaseMedia?.cardLifestyleUrl ||
            tpl.showcaseGallery?.lifestyleUrl ||
            '';
          const domainMeta = DOMAIN_CATEGORY_LABEL_MAP[tpl.domainCategory || 'personal'];

          return (
            <article
              key={tpl.id}
              data-testid={`carousel-card-${tpl.id}`}
              data-selected={isSelected ? 'true' : 'false'}
              className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all bg-white dark:bg-[#0B1424] ${
                isSelected
                  ? 'border-[#2563EB] ring-2 ring-[#2563EB]/25 dark:border-[#19B5A5] dark:ring-[#19B5A5]/25'
                  : 'border-slate-200 dark:border-slate-800 hover:border-[#2563EB]/60'
              }`}
            >
              <div>
                {/* Real Showcase Image Stage (Zero Placeholder Icons) */}
                <div className="relative aspect-[4/3] w-full bg-[#EFECE6] dark:bg-[#070D17] overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={lang === 'ar' ? tpl.titleAr : tpl.titleEn}
                    loading="lazy"
                    className="w-full h-full object-contain transition-transform duration-300 hover:scale-[1.02]"
                  />

                  <button
                    type="button"
                    data-testid={`carousel-preview-${tpl.id}`}
                    onClick={() => setPreviewTemplate(tpl)}
                    aria-label={
                      lang === 'ar'
                        ? `معاينة قالب ${tpl.titleAr}`
                        : `Preview template ${tpl.titleEn}`
                    }
                    className="absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-white/92 dark:bg-[#0F1A2B]/92 border border-slate-200 dark:border-slate-700 text-[#17243A] dark:text-white flex items-center justify-center hover:text-[#2563EB] dark:hover:text-[#19B5A5] shadow-sm transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {isSelected && (
                    <div className="absolute bottom-2.5 end-2.5 w-7 h-7 rounded-full bg-[#2563EB] dark:bg-[#19B5A5] text-white dark:text-[#070D17] flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Unboxed Clean Copy: Category · Ownership · Pricing */}
                <div className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                      {domainMeta ? domainMeta[lang] : ''}
                    </span>
                    <span
                      className={`shrink-0 tabular-nums ${
                        ownership === 'free'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : ownership === 'locked'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-[#0F9D8E] dark:text-[#19B5A5]'
                      }`}
                    >
                      {ownership === 'free'
                        ? lang === 'ar'
                          ? 'مجاني'
                          : 'Free'
                        : ownership === 'purchased'
                        ? lang === 'ar'
                          ? 'مملوك برخصة'
                          : 'Owned'
                        : ownership === 'included_in_plan'
                        ? lang === 'ar'
                          ? `مملوك (${profile.plan})`
                          : `Owned (${profile.plan})`
                        : lang === 'ar'
                        ? `مدفوع · ${tpl.priceSar} ر.س`
                        : `Paid · $${tpl.priceUsd}`}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-[#17243A] dark:text-white line-clamp-1">
                    {lang === 'ar' ? tpl.titleAr : tpl.titleEn}
                  </h3>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {isFree
                      ? lang === 'ar'
                        ? 'متاح فورًا مجانًا'
                        : 'Ready immediately · Free'
                      : lang === 'ar'
                      ? tpl.subtitleAr
                      : tpl.subtitleEn}
                  </p>
                </div>
              </div>

              <div className="px-3.5 pb-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                {isUnlocked ? (
                  <button
                    type="button"
                    data-testid={`carousel-select-${tpl.id}`}
                    onClick={() => onSelectDesign(tpl.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-colors ${
                      isSelected
                        ? 'bg-[#2563EB] dark:bg-[#19B5A5] text-white dark:text-[#070D17]'
                        : 'bg-[#F4F7FB] dark:bg-[#070D17] text-[#17243A] dark:text-slate-100 hover:bg-[#2563EB] hover:text-white'
                    }`}
                  >
                    {isSelected
                      ? lang === 'ar'
                        ? 'القالب المختار'
                        : 'Selected'
                      : lang === 'ar'
                      ? 'اختيار القالب'
                      : 'Select'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCheckoutTemplate(tpl)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 hover:bg-amber-100 transition-colors inline-flex items-center justify-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    <span>{lang === 'ar' ? 'شراء وفتح' : 'Unlock'}</span>
                  </button>
                )}

                {onInspectDetails && (
                  <button
                    type="button"
                    onClick={() => onInspectDetails(tpl.id)}
                    className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-[#2563EB]"
                  >
                    {lang === 'ar' ? 'التفاصيل' : 'Specs'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Live QR Composition Quick Preview Modal */}
      {previewTemplate && previewComposite && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'ar' ? previewTemplate.titleAr : previewTemplate.titleEn}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-[#17243A] dark:text-white">
                  {lang === 'ar' ? previewTemplate.titleAr : previewTemplate.titleEn}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'ar' ? previewTemplate.subtitleAr : previewTemplate.subtitleEn}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                aria-label={lang === 'ar' ? 'إغلاق المعاينة' : 'Close preview'}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-[#17243A] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-center max-h-[340px] overflow-hidden">
                <div
                  className="w-full max-w-[420px] [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[300px] [&>svg]:mx-auto"
                  dangerouslySetInnerHTML={{ __html: previewComposite.svgMarkup }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                  <p>
                    {lang === 'ar'
                      ? 'معاينة حية لتركيب كود QR الحقيقي داخل القالب قبل الاعتماد.'
                      : 'Live preview with real ISO-18004 QR composited inside the template.'}
                  </p>
                  <p className="text-[11px] font-mono" dir="ltr">
                    {previewTemplate.dimensionsMm} · {previewTemplate.weatherproofRating}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onInspectDetails && (
                    <button
                      type="button"
                      onClick={() => {
                        const id = previewTemplate.id;
                        setPreviewTemplate(null);
                        onInspectDetails(id);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                    >
                      {lang === 'ar' ? 'صفحة تفاصيل القالب' : 'Full Template Page'}
                    </button>
                  )}

                  {canAccessTemplateByPlanOrPurchase({
                    template: previewTemplate,
                    userPlan: profile.plan,
                    purchasedTemplateIds,
                  }) ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectDesign(previewTemplate.id);
                        setPreviewTemplate(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {lang === 'ar' ? 'اعتماد هذا القالب للغرض' : 'Select This Template'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const target = previewTemplate;
                        setPreviewTemplate(null);
                        setCheckoutTemplate(target);
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#070D17] text-xs font-bold transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      <span>
                        {lang === 'ar'
                          ? `شراء القالب (${previewTemplate.priceSar} ر.س)`
                          : `Unlock ($${previewTemplate.priceUsd})`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {checkoutTemplate && (
        <CheckoutModal
          isOpen={Boolean(checkoutTemplate)}
          orderType="template_purchase"
          template={checkoutTemplate}
          onClose={() => setCheckoutTemplate(null)}
        />
      )}
    </div>
  );
};
