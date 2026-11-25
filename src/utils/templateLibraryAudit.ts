import {
  TagDesignTemplate,
  TemplateDomainCategory,
  UserPlanTier,
} from '../types/domain';
import { canAccessTemplateByPlanOrPurchase } from './adminLogic';
import {
  buildPilotCleanTrimSvg,
  buildPilotEditableSvg,
  buildPilotPrintReadySvg,
} from './pilotLabelArtwork';
import {
  CatalogFilterCriteria,
  filterCatalogTemplates,
  getActiveCatalogTemplates,
  isTemplateFree,
  sortCatalogTemplates,
  TemplateSortBy,
} from './templateDiscovery';
import { composeItemTemplateDesignSvg } from './templateQrCompositor';

export type TemplateAuditClassification =
  | 'complete'
  | 'needs_showcase'
  | 'needs_file_fix'
  | 'needs_qr_calibration'
  | 'needs_print_review';

export type TemplateOwnershipFilter = 'all' | 'owned' | 'unowned';

export type TemplateOwnershipStatus = 'free' | 'included_in_plan' | 'purchased' | 'locked';

export interface TemplateAuditResult {
  id: string;
  slug: string;
  titleEn: string;
  architecture: 'master33' | 'batch02' | 'pilot_vector';
  classification: TemplateAuditClassification;
  issues: string[];
  checks: {
    hasValidEditableSvg: boolean;
    hasValidPrintSvg: boolean;
    hasValidCleanSvg: boolean;
    hasDimensions: boolean;
    hasPrintSpecs: boolean;
    hasFourShowcaseAssets: boolean;
    hasBlankQrZoneInSource: boolean;
    hasWorkingRealQrComposition: boolean;
  };
}

export interface CatalogAuditReport {
  totalActive: number;
  freeCount: number;
  paidCount: number;
  summary: Record<TemplateAuditClassification, number>;
  items: TemplateAuditResult[];
}

export function getTemplateOwnershipStatus(params: {
  template: TagDesignTemplate;
  userPlan: UserPlanTier;
  purchasedTemplateIds: ReadonlySet<string>;
}): TemplateOwnershipStatus {
  const { template, userPlan, purchasedTemplateIds } = params;
  if (isTemplateFree(template)) {
    return 'free';
  }
  if (purchasedTemplateIds.has(template.id)) {
    return 'purchased';
  }
  if (
    canAccessTemplateByPlanOrPurchase({
      template,
      userPlan,
      purchasedTemplateIds,
    })
  ) {
    return 'included_in_plan';
  }
  return 'locked';
}

export function getIssuedPurchasedTemplateIdSet(
  issuedLicenses: ReadonlyArray<{
    templateId: string;
    status: string;
    expiresAt?: string | null;
  }>,
  nowMs: number = Date.now()
): Set<string> {
  const set = new Set<string>();
  for (const lic of issuedLicenses) {
    if (lic.status !== 'active') continue;
    if (lic.expiresAt && Date.parse(lic.expiresAt) <= nowMs) continue;
    set.add(lic.templateId);
  }
  return set;
}

export interface LibraryOwnershipFilterCriteria extends CatalogFilterCriteria {
  ownershipFilter?: TemplateOwnershipFilter;
  userPlan: UserPlanTier;
  purchasedTemplateIds: ReadonlySet<string>;
}

export function filterAndSortLibraryTemplates(
  templates: TagDesignTemplate[],
  criteria: LibraryOwnershipFilterCriteria
): TagDesignTemplate[] {
  const {
    ownershipFilter = 'all',
    userPlan,
    purchasedTemplateIds,
    sortBy = 'featured',
    ...baseCriteria
  } = criteria;

  const baseFiltered = filterCatalogTemplates(templates, baseCriteria);
  const byOwnership =
    ownershipFilter === 'all'
      ? baseFiltered
      : baseFiltered.filter((tpl) => {
          const unlocked = canAccessTemplateByPlanOrPurchase({
            template: tpl,
            userPlan,
            purchasedTemplateIds,
          });
          return ownershipFilter === 'owned' ? unlocked : !unlocked;
        });

  return sortCatalogTemplates(byOwnership, sortBy as TemplateSortBy);
}

export function summarizeLibraryOwnership(params: {
  templates: TagDesignTemplate[];
  userPlan: UserPlanTier;
  purchasedTemplateIds: ReadonlySet<string>;
}): { ownedCount: number; unownedCount: number; freeCount: number; paidCount: number } {
  const active = getActiveCatalogTemplates(params.templates);
  let ownedCount = 0;
  let freeCount = 0;
  for (const tpl of active) {
    if (isTemplateFree(tpl)) freeCount += 1;
    if (
      canAccessTemplateByPlanOrPurchase({
        template: tpl,
        userPlan: params.userPlan,
        purchasedTemplateIds: params.purchasedTemplateIds,
      })
    ) {
      ownedCount += 1;
    }
  }
  return {
    ownedCount,
    unownedCount: active.length - ownedCount,
    freeCount,
    paidCount: active.length - freeCount,
  };
}

/**
 * Pure audit of a single published FindIt QR template across SVG source, print file,
 * dimensions, showcase imagery slots, blank source QR zone, and real-QR composition.
 * Optional `verifyAssetExists` callback lets Node/CI tests verify on-disk asset files.
 */
export function auditSingleTemplate(
  template: TagDesignTemplate,
  verifyAssetExists?: (publicRelativeUrl: string) => boolean
): TemplateAuditResult {
  const issues: string[] = [];

  const editableSvg = buildPilotEditableSvg(template);
  const printSvg = buildPilotPrintReadySvg(template);
  const cleanSvg = buildPilotCleanTrimSvg(template);

  const compClean = composeItemTemplateDesignSvg({
    design: template,
    codeSerial: 'FIQ-AUDIT-01',
    mode: 'clean',
  });
  const compPrint = composeItemTemplateDesignSvg({
    design: template,
    codeSerial: 'FIQ-AUDIT-01',
    mode: 'print',
  });

  const hasValidEditableSvg =
    editableSvg.includes('<svg') && editableSvg.includes('</svg>');
  const hasValidPrintSvg =
    printSvg.includes('<svg') && printSvg.includes('</svg>');
  const hasValidCleanSvg =
    cleanSvg.includes('<svg') && cleanSvg.includes('</svg>');

  const hasDimensions = Boolean(template.dimensionsMm && template.dimensionsMm.trim().length > 0);
  const hasPrintSpecs = Boolean(
    template.printSpecs &&
      template.printSpecs.trimWidthMm > 0 &&
      template.printSpecs.trimHeightMm > 0
  );

  const gallery = template.showcaseGallery;
  const galleryUrls = [
    gallery?.mockup3dUrl,
    gallery?.onProductUrl,
    gallery?.closeupUrl,
    gallery?.lifestyleUrl,
  ];
  const hasAllShowcaseUrls = galleryUrls.every(
    (u) => typeof u === 'string' && u.trim().length > 0
  );
  const allShowcaseFilesExist =
    !verifyAssetExists ||
    galleryUrls.every((u) => (u ? verifyAssetExists(u) : false));
  const hasFourShowcaseAssets = hasAllShowcaseUrls && allShowcaseFilesExist;

  const hasBlankQrZoneInSource = !editableSvg.includes('data-qr-modules');
  const hasWorkingRealQrComposition =
    compClean.svgMarkup.includes('<svg') &&
    compPrint.svgMarkup.includes('<svg') &&
    compClean.qrEncodedPayload.includes('/found/FIQ-AUDIT-01');

  let classification: TemplateAuditClassification = 'complete';

  if (!hasValidEditableSvg || !hasValidCleanSvg) {
    issues.push('Invalid editable/clean vector SVG');
    classification = 'needs_file_fix';
  }
  if (!hasValidPrintSvg || !hasDimensions || !hasPrintSpecs) {
    issues.push('Print file or verified physical specifications incomplete');
    if (classification === 'complete') classification = 'needs_print_review';
  }
  if (!hasBlankQrZoneInSource || !hasWorkingRealQrComposition) {
    issues.push('QR placement zone calibration or blank separation check failed');
    if (classification === 'complete') classification = 'needs_qr_calibration';
  }
  if (!hasFourShowcaseAssets) {
    issues.push('One or more 4-shot product showcase mockups missing');
    if (classification === 'complete') classification = 'needs_showcase';
  }

  return {
    id: template.id,
    slug: template.slug,
    titleEn: template.titleEn,
    architecture: compClean.architecture,
    classification,
    issues,
    checks: {
      hasValidEditableSvg,
      hasValidPrintSvg,
      hasValidCleanSvg,
      hasDimensions,
      hasPrintSpecs,
      hasFourShowcaseAssets,
      hasBlankQrZoneInSource,
      hasWorkingRealQrComposition,
    },
  };
}

export function auditTemplateLibraryCatalog(
  templates: TagDesignTemplate[],
  verifyAssetExists?: (publicRelativeUrl: string) => boolean
): CatalogAuditReport {
  const active = getActiveCatalogTemplates(templates);
  const summary: Record<TemplateAuditClassification, number> = {
    complete: 0,
    needs_showcase: 0,
    needs_file_fix: 0,
    needs_qr_calibration: 0,
    needs_print_review: 0,
  };

  let freeCount = 0;
  const items: TemplateAuditResult[] = [];

  for (const tpl of active) {
    if (isTemplateFree(tpl)) freeCount += 1;
    const res = auditSingleTemplate(tpl, verifyAssetExists);
    summary[res.classification] += 1;
    items.push(res);
  }

  return {
    totalActive: active.length,
    freeCount,
    paidCount: active.length - freeCount,
    summary,
    items,
  };
}

export function getRealTemplatePrintSpecsSummary(
  template: TagDesignTemplate,
  lang: 'ar' | 'en'
): Array<{ label: string; value: string }> {
  const specs: Array<{ label: string; value: string }> = [];
  if (template.dimensionsMm) {
    specs.push({
      label: lang === 'ar' ? 'الأبعاد الفعلية' : 'Trim Dimensions',
      value: template.dimensionsMm,
    });
  }
  if (template.printSpecs) {
    specs.push({
      label: lang === 'ar' ? 'امتداد القص (Bleed)' : 'Bleed Margin',
      value: `+${template.printSpecs.bleedMm} mm`,
    });
    specs.push({
      label: lang === 'ar' ? 'منطقة الأمان' : 'Safe Zone',
      value: `${template.printSpecs.safeMarginMm} mm`,
    });
    specs.push({
      label: lang === 'ar' ? 'الدقة المعتمدة' : 'Print Resolution',
      value: `${template.printSpecs.dpi} DPI`,
    });
    specs.push({
      label: lang === 'ar' ? 'فضاء الألوان' : 'Color Space',
      value: template.printSpecs.colorSpace,
    });
    specs.push({
      label: lang === 'ar' ? 'شكل القص' : 'Die-Cut Profile',
      value: lang === 'ar' ? template.printSpecs.dieCutShapeAr : template.printSpecs.dieCutShapeEn,
    });
  }
  if (template.weatherproofRating) {
    specs.push({
      label: lang === 'ar' ? 'مقاومة العوامل' : 'Durability Rating',
      value: template.weatherproofRating,
    });
  }
  const availableFormats: string[] = ['SVG', '300 DPI PNG'];
  if (template.originalDesignUrl) availableFormats.push('Editable Source SVG');
  if (template.printFileUrl) availableFormats.push('Pre-Press Print SVG');
  specs.push({
    label: lang === 'ar' ? 'ملفات التصدير الفعلية' : 'Available Export Files',
    value: Array.from(new Set(availableFormats)).join(' · '),
  });
  return specs;
}

export const DOMAIN_CATEGORY_LABEL_MAP: Record<TemplateDomainCategory, { ar: string; en: string }> = {
  personal: { ar: 'الممتلكات الشخصية', en: 'Personal Items' },
  travel: { ar: 'السفر والأمتعة', en: 'Travel & Luggage' },
  family: { ar: 'العائلة والأطفال', en: 'Family & Kids' },
  pets: { ar: 'الحيوانات الأليفة', en: 'Pets' },
  business: { ar: 'الشركات والأعمال', en: 'Businesses' },
  anime_cartoon: { ar: 'الأنمي والكرتون', en: 'Anime & Cartoon' },
};
