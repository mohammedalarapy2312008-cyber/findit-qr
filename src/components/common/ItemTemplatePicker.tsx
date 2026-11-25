import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Eye,
  Lock,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTemplateShowcaseMedia } from '../../data/pilotShowcaseMedia';
import {
  TagDesignTemplate,
  TemplateDomainCategory,
} from '../../types/domain';
import { canAccessTemplateByPlanOrPurchase } from '../../utils/adminLogic';
import {
  filterCatalogTemplates,
  isTemplateFree,
  REORGANIZED_DOMAIN_CATEGORIES,
  sortCatalogTemplates,
} from '../../utils/templateDiscovery';
import { composeItemTemplateDesignSvg } from '../../utils/templateQrCompositor';
import { TagProductPreview } from '../brand/TagProductPreview';
import { CheckoutModal } from './CheckoutModal';

interface ItemTemplatePickerProps {
  selectedDesignId: string;
  onSelectDesign: (designId: string) => void;
  previewSeed?: string;
  compact?: boolean;
}

export const ItemTemplatePicker: React.FC<ItemTemplatePickerProps> = ({
  selectedDesignId,
  onSelectDesign,
  previewSeed = 'FQR-PREVIEW',
  compact = false,
}) => {
  const { lang, designs, profile, issuedLicenses } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<TemplateDomainCategory | 'all'>('all');
  const [pricingFilter, setPricingFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<TagDesignTemplate | null>(null);
  const [checkoutTemplate, setCheckoutTemplate] = useState<TagDesignTemplate | null>(null);
  const [showAll, setShowAll] = useState(false);

  const publishedTemplates = useMemo(
    () => designs.filter((d) => !d.status || d.status === 'published'),
    [designs]
  );

  const purchasedTemplateIds = useMemo(() => {
    const nowMs = Date.now();
    const set = new Set<string>();
    for (const lic of issuedLicenses) {
      if (lic.status !== 'active') continue;
      if (lic.expiresAt && Date.parse(lic.expiresAt) <= nowMs) continue;
      set.add(lic.templateId);
    }
    return set;
  }, [issuedLicenses]);

  const filteredTemplates = useMemo(() => {
    const filtered = filterCatalogTemplates(publishedTemplates, {
      searchQuery,
      domain: domainFilter,
      styleCluster: 'all',
      priceFilter: pricingFilter === 'paid' ? 'premium' : pricingFilter,
    });
    const sorted = sortCatalogTemplates(filtered, 'featured');
    // Keep selected or accessible templates easy to spot first when viewing "all"
    if (pricingFilter === 'all' && domainFilter === 'all' && !searchQuery.trim()) {
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
    }
    return sorted;
  }, [
    publishedTemplates,
    searchQuery,
    domainFilter,
    pricingFilter,
    lang,
    selectedDesignId,
    profile.plan,
    purchasedTemplateIds,
  ]);

  const visibleLimit = showAll ? filteredTemplates.length : compact ? 6 : 12;
  const visibleTemplates = filteredTemplates.slice(0, visibleLimit);

  const freeCount = useMemo(
    () => publishedTemplates.filter((t) => isTemplateFree(t)).length,
    [publishedTemplates]
  );
  const paidCount = publishedTemplates.length - freeCount;

  const previewComposite = useMemo(() => {
    if (!previewTemplate) return null;
    return composeItemTemplateDesignSvg({
      design: previewTemplate,
      codeSerial: previewSeed || 'FQR-2026-DEMO',
      mode: 'clean',
    });
  }, [previewTemplate, previewSeed]);

  const selectedTemplate = useMemo(
    () => designs.find((d) => d.id === selectedDesignId) ?? publishedTemplates[0],
    [designs, selectedDesignId, publishedTemplates]
  );

  return (
    <div className="space-y-4" data-testid="item-template-picker">
      {/* Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#17243A] dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB] dark:text-[#19B5A5]" />
            <span>
              {lang === 'ar'
                ? `اختر القالب من مكتبة FindIt QR (${publishedTemplates.length} قالبًا معتمدًا)`
                : `Choose Template from FindIt QR Library (${publishedTemplates.length} Templates)`}
            </span>
          </h3>
          {selectedTemplate && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'ar' ? 'القالب المختار حاليًا: ' : 'Currently Selected: '}
              <strong className="text-[#17243A] dark:text-white">
                {lang === 'ar' ? selectedTemplate.titleAr : selectedTemplate.titleEn}
              </strong>
            </p>
          )}
        </div>

        {/* Pricing quick filter */}
        <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] p-1 text-xs">
          {[
            {
              key: 'all' as const,
              ar: `الكل (${publishedTemplates.length})`,
              en: `All (${publishedTemplates.length})`,
            },
            { key: 'free' as const, ar: `مجاني (${freeCount})`, en: `Free (${freeCount})` },
            { key: 'paid' as const, ar: `مدفوع (${paidCount})`, en: `Paid (${paidCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setPricingFilter(tab.key);
                setShowAll(false);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors tabular-nums ${
                pricingFilter === tab.key
                  ? 'bg-[#2563EB] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#17243A] dark:hover:text-white'
              }`}
            >
              {lang === 'ar' ? tab.ar : tab.en}
            </button>
          ))}
        </div>
      </div>

      {/* Search + Domain Category Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowAll(false);
            }}
            aria-label={lang === 'ar' ? 'ابحث في مكتبة القوالب' : 'Search template library'}
            placeholder={
              lang === 'ar'
                ? 'ابحث بالاسم أو الأسلوب (سفر، أنمي، حيوانات، كلاسيك، تقني...)'
                : 'Search by name or style (travel, anime, pets, classic, tech...)'
            }
            className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs sm:text-sm text-[#17243A] dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={lang === 'ar' ? 'تصنيفات القوالب' : 'Template categories'}>
          {REORGANIZED_DOMAIN_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={domainFilter === cat.id}
              onClick={() => {
                setDomainFilter(cat.id);
                setShowAll(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                domainFilter === cat.id
                  ? 'bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17] border-transparent'
                  : 'bg-white dark:bg-[#070D17] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#2563EB]'
              }`}
            >
              {lang === 'ar' ? cat.ar : cat.en}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-2">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {lang === 'ar'
              ? 'لا توجد قوالب مطابقة لخيارات البحث الحالية.'
              : 'No templates match your current filter.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setDomainFilter('all');
              setPricingFilter('all');
            }}
            className="text-xs font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
          >
            {lang === 'ar' ? 'إعادة ضبط التصفية' : 'Reset Filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {visibleTemplates.map((tpl) => {
            const isSelected = tpl.id === selectedDesignId;
            const isFree = isTemplateFree(tpl);
            const isUnlocked = canAccessTemplateByPlanOrPurchase({
              template: tpl,
              userPlan: profile.plan,
              purchasedTemplateIds,
            });
            const showcaseMedia = getTemplateShowcaseMedia(tpl.id);
            const thumbUrl =
              tpl.showcaseGallery?.mockup3dUrl ||
              tpl.showcaseGallery?.onProductUrl ||
              showcaseMedia?.cardLifestyleUrl ||
              tpl.previewImages?.[0] ||
              '';

            return (
              <div
                key={tpl.id}
                data-testid={`template-card-${tpl.id}`}
                data-unlocked={isUnlocked ? 'true' : 'false'}
                className={`group rounded-xl border transition-all overflow-hidden flex flex-col bg-white dark:bg-[#0B1424] ${
                  isSelected
                    ? 'border-[#2563EB] ring-2 ring-[#2563EB]/25 dark:border-[#19B5A5] dark:ring-[#19B5A5]/25'
                    : isUnlocked
                    ? 'border-slate-200 dark:border-slate-800 hover:border-[#2563EB]/60'
                    : 'border-amber-200/80 dark:border-amber-800/50 hover:border-amber-400'
                }`}
              >
                {/* Visual Preview Area */}
                <div className="relative aspect-[4/3] bg-[#F4F7FB] dark:bg-[#070D17] flex items-center justify-center overflow-hidden p-2">
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={lang === 'ar' ? tpl.titleAr : tpl.titleEn}
                      loading="lazy"
                      className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <TagProductPreview
                      seed={tpl.slug}
                      primaryHex={tpl.primaryHex}
                      secondaryHex={tpl.secondaryHex}
                      badgeColorHex={tpl.badgeColorHex}
                      silhouette={tpl.shapeSilhouette}
                      size="sm"
                    />
                  )}

                  {/* Top status tag */}
                  <div className="absolute top-2 start-2 flex items-center gap-1">
                    {isFree ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600/95 text-white text-[10px] font-bold">
                        {lang === 'ar' ? 'مجاني' : 'Free'}
                      </span>
                    ) : isUnlocked ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#19B5A5] text-[#070D17] text-[10px] font-bold">
                        {lang === 'ar' ? 'مملوك' : 'Owned'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#17243A]/90 text-[#FFD166] text-[10px] font-bold tabular-nums">
                        <Lock className="w-2.5 h-2.5" />
                        <span>
                          {lang === 'ar' ? `${tpl.priceSar} ر.س` : `$${tpl.priceUsd}`}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Quick preview button */}
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(tpl)}
                    aria-label={
                      lang === 'ar'
                        ? `معاينة قالب ${tpl.titleAr}`
                        : `Preview template ${tpl.titleEn}`
                    }
                    className="absolute top-2 end-2 w-7 h-7 rounded-lg bg-white/90 dark:bg-[#0F1A2B]/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:text-[#2563EB] dark:hover:text-[#19B5A5] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {isSelected && (
                    <div className="absolute bottom-2 end-2 w-6 h-6 rounded-full bg-[#2563EB] dark:bg-[#19B5A5] text-white dark:text-[#070D17] flex items-center justify-center shadow">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Metadata & Action */}
                <div className="p-2.5 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#17243A] dark:text-white line-clamp-1">
                      {lang === 'ar' ? tpl.titleAr : tpl.titleEn}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {lang === 'ar' ? tpl.subtitleAr : tpl.subtitleEn}
                    </p>
                  </div>

                  {isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => onSelectDesign(tpl.id)}
                      className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-colors ${
                        isSelected
                          ? 'bg-[#2563EB] dark:bg-[#19B5A5] text-white dark:text-[#070D17]'
                          : 'bg-[#F4F7FB] dark:bg-[#070D17] text-[#17243A] dark:text-slate-200 hover:bg-[#2563EB] hover:text-white'
                      }`}
                    >
                      {isSelected
                        ? lang === 'ar'
                          ? 'تم اختيار هذا القالب'
                          : 'Selected'
                        : lang === 'ar'
                        ? 'اختيار القالب'
                        : 'Select Template'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCheckoutTemplate(tpl)}
                      className="w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors inline-flex items-center justify-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span>
                        {lang === 'ar' ? 'فتح القالب / شراء' : 'Unlock / Purchase'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show More / Less toggle */}
      {filteredTemplates.length > (compact ? 6 : 12) && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#17243A] dark:text-white hover:border-[#2563EB] transition-colors tabular-nums"
          >
            {showAll
              ? lang === 'ar'
                ? 'عرض عدد أقل'
                : 'Show Fewer Templates'
              : lang === 'ar'
              ? `عرض جميع القوالب المطابقة (${filteredTemplates.length})`
              : `Show All Matching Templates (${filteredTemplates.length})`}
          </button>
        </div>
      )}

      {/* Quick Preview Modal (with live QR compositing preview) */}
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
                      ? 'معاينة حية لتركيب كود QR قياسي داخل مساحة الكود المخصصة دون المساس بملف القالب الأصلي.'
                      : 'Live preview showing standard QR placement inside the dedicated QR area without altering the original template.'}
                  </p>
                  <p className="text-[11px] font-mono" dir="ltr">
                    {previewTemplate.dimensionsMm} · {previewTemplate.weatherproofRating}
                  </p>
                </div>

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
                      {lang === 'ar' ? 'اعتماد هذا القالب للغرض' : 'Use This Template'}
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
                        ? `فتح القالب (${previewTemplate.priceSar} ر.س)`
                        : `Unlock Template ($${previewTemplate.priceUsd})`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal for locked paid templates */}
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
