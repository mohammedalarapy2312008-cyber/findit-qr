import {
  TagDesignTemplate,
  TemplateDomainCategory,
  TemplateScope,
} from '../types/domain';

export type StyleClusterId =
  | 'all'
  | 'anime_cartoon'
  | 'minimal'
  | 'playful'
  | 'cosmic'
  | 'vintage'
  | 'nature';

export type TemplatePriceFilter = 'all' | 'free' | 'premium';
export type TemplateSortBy = 'featured' | 'popular' | 'newest' | 'price_asc';
export type TemplateIpFilter = 'all' | 'original_only';

export interface DomainCategoryMeta {
  id: 'all' | TemplateDomainCategory;
  ar: string;
  en: string;
  shortAr: string;
  shortEn: string;
}

export interface StyleClusterMeta {
  id: StyleClusterId;
  ar: string;
  en: string;
  matchTags: string[];
}

export const REORGANIZED_DOMAIN_CATEGORIES: readonly DomainCategoryMeta[] = [
  { id: 'all', ar: 'كل الفئات', en: 'All Categories', shortAr: 'الكل', shortEn: 'All' },
  { id: 'personal', ar: 'الممتلكات الشخصية', en: 'Personal Items', shortAr: 'شخصية', shortEn: 'Personal' },
  { id: 'travel', ar: 'السفر والأمتعة', en: 'Travel & Luggage', shortAr: 'السفر', shortEn: 'Travel' },
  { id: 'family', ar: 'العائلة والأطفال', en: 'Family & Kids', shortAr: 'العائلة', shortEn: 'Family' },
  { id: 'pets', ar: 'الحيوانات الأليفة', en: 'Pets', shortAr: 'الأليفة', shortEn: 'Pets' },
  { id: 'business', ar: 'الشركات والأعمال', en: 'Businesses', shortAr: 'الأعمال', shortEn: 'Business' },
  { id: 'anime_cartoon', ar: 'الأنمي والكرتون', en: 'Anime & Cartoon', shortAr: 'أنمي وكرتون', shortEn: 'Anime & Cartoon' },
] as const;

export const STYLE_DISCOVERY_CLUSTERS: readonly StyleClusterMeta[] = [
  {
    id: 'all',
    ar: 'كل الأساليب',
    en: 'All Styles',
    matchTags: [],
  },
  {
    id: 'anime_cartoon',
    ar: 'أنمي وكرتون وخيال',
    en: 'Anime & Cartoon',
    matchTags: ['anime', 'cartoon', 'manga', 'character', 'shonen', 'kawaii', 'arcade', 'pixel-art', 'gaming'],
  },
  {
    id: 'minimal',
    ar: 'بسيط وتقني وفاخر',
    en: 'Minimal & Luxury',
    matchTags: [
      'minimal',
      'monochrome',
      'tech',
      'hexagon',
      'industrial-decal',
      'luxury-editorial',
      'luxury',
      'royal',
      'cyberpunk',
      'neon',
      'corporate',
    ],
  },
  {
    id: 'playful',
    ar: 'مرح وألعاب وشبابي',
    en: 'Playful & Youth',
    matchTags: [
      'playful',
      'gaming',
      'youth',
      'pebble-pop',
      'jelly-cube',
      'kids',
      'cat',
      'graffiti',
      'street-art',
      'pixel-art',
      'sweets',
      'desserts',
      'cute',
      'pastel',
    ],
  },
  {
    id: 'cosmic',
    ar: 'الفضاء والمغامرة',
    en: 'Space & Cosmic',
    matchTags: ['cosmic', 'space', 'astronaut'],
  },
  {
    id: 'vintage',
    ar: 'كلاسيكي وسفر ومعالم',
    en: 'Travel & Heritage',
    matchTags: ['vintage', 'travel', 'vintage-ticket', 'aviation-ticket', 'explorer', 'heritage', 'luggage'],
  },
  {
    id: 'nature',
    ar: 'نباتي وحيوانات أليفة',
    en: 'Botanical & Pets',
    matchTags: ['botanical', 'floral', 'nature', 'pets', 'cat', 'lifestyle', 'marine', 'sea', 'turtle', 'sakura'],
  },
] as const;

export function getActiveCatalogTemplates(templates: TagDesignTemplate[]): TagDesignTemplate[] {
  return templates.filter((t) => (t.status || 'published') === 'published');
}

export function getArchivedCatalogTemplates(templates: TagDesignTemplate[]): TagDesignTemplate[] {
  return templates.filter((t) => t.status === 'archived');
}

export function getTemplateDomainSet(template: TagDesignTemplate): Set<TemplateDomainCategory> {
  const set = new Set<TemplateDomainCategory>();
  set.add(template.domainCategory || 'personal');
  for (const sec of template.secondaryDomains || []) {
    set.add(sec);
  }
  return set;
}

export function matchesDomainCategory(
  template: TagDesignTemplate,
  domain: 'all' | TemplateDomainCategory
): boolean {
  if (domain === 'all') return true;
  return getTemplateDomainSet(template).has(domain);
}

export function matchesStyleCluster(template: TagDesignTemplate, clusterId: StyleClusterId): boolean {
  if (clusterId === 'all') return true;
  const cluster = STYLE_DISCOVERY_CLUSTERS.find((c) => c.id === clusterId);
  if (!cluster) return true;
  const tags = new Set((template.tags || []).map((t) => t.toLowerCase()));
  if (cluster.matchTags.some((tag) => tags.has(tag))) return true;
  const domains = getTemplateDomainSet(template);
  if (clusterId === 'anime_cartoon' && domains.has('anime_cartoon')) return true;
  if (clusterId === 'nature' && domains.has('pets')) return true;
  if (clusterId === 'vintage' && domains.has('travel')) return true;
  return false;
}

export interface CatalogFilterCriteria {
  domain?: 'all' | TemplateDomainCategory;
  scope?: 'all' | TemplateScope;
  styleCluster?: StyleClusterId;
  priceFilter?: TemplatePriceFilter;
  ipFilter?: TemplateIpFilter;
  sortBy?: TemplateSortBy;
  favoritesOnly?: boolean;
  favoriteIds?: ReadonlyArray<string>;
  searchQuery?: string;
}

export function isTemplateFree(template: TagDesignTemplate): boolean {
  return Boolean(template.isFree || template.priceSar === 0 || template.includedInTier === 'free');
}

export function sortCatalogTemplates(
  templates: TagDesignTemplate[],
  sortBy: TemplateSortBy = 'featured'
): TagDesignTemplate[] {
  const copy = [...templates];
  switch (sortBy) {
    case 'popular':
      return copy.sort(
        (a, b) =>
          (b.usageCount || 0) + (b.salesCount || 0) * 3 - ((a.usageCount || 0) + (a.salesCount || 0) * 3)
      );
    case 'newest':
      return copy.sort((a, b) => {
        const dateB = Date.parse(b.publishedAt || b.createdAt || '2026-01-01');
        const dateA = Date.parse(a.publishedAt || a.createdAt || '2026-01-01');
        return dateB - dateA;
      });
    case 'price_asc':
      return copy.sort((a, b) => {
        const priceA = isTemplateFree(a) ? 0 : a.priceSar;
        const priceB = isTemplateFree(b) ? 0 : b.priceSar;
        if (priceA !== priceB) return priceA - priceB;
        return (b.usageCount || 0) - (a.usageCount || 0);
      });
    case 'featured':
    default:
      return copy.sort((a, b) => {
        const featDiff = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
        if (featDiff !== 0) return featDiff;
        const freeDiff = Number(isTemplateFree(b)) - Number(isTemplateFree(a));
        if (freeDiff !== 0) return freeDiff;
        return (b.usageCount || 0) - (a.usageCount || 0);
      });
  }
}

export function filterCatalogTemplates(
  templates: TagDesignTemplate[],
  criteria: CatalogFilterCriteria = {}
): TagDesignTemplate[] {
  const {
    domain = 'all',
    scope = 'all',
    styleCluster = 'all',
    priceFilter = 'all',
    ipFilter = 'all',
    sortBy,
    favoritesOnly = false,
    favoriteIds = [],
    searchQuery = '',
  } = criteria;

  const active = getActiveCatalogTemplates(templates);
  const q = searchQuery.trim().toLowerCase();

  const filtered = active.filter((d) => {
    const dScope = d.templateScope || 'general';
    if (!matchesDomainCategory(d, domain)) return false;
    if (scope !== 'all' && dScope !== scope) return false;
    if (!matchesStyleCluster(d, styleCluster)) return false;
    if (priceFilter === 'free' && !isTemplateFree(d)) return false;
    if (priceFilter === 'premium' && isTemplateFree(d)) return false;
    if (ipFilter === 'original_only' && d.requiresIpVerification) return false;
    if (favoritesOnly && !favoriteIds.includes(d.id)) return false;
    if (!q) return true;
    const searchable = [
      d.titleAr,
      d.titleEn,
      d.subtitleAr,
      d.subtitleEn,
      d.subCategoryAr || '',
      d.subCategoryEn || '',
      d.materialAr,
      d.materialEn,
      d.pilotConceptAr || '',
      d.pilotConceptEn || '',
      d.specialtyBadgeAr || '',
      d.specialtyBadgeEn || '',
      ...(d.tags || []),
    ]
      .join(' ')
      .toLowerCase();
    return searchable.includes(q);
  });

  return sortBy ? sortCatalogTemplates(filtered, sortBy) : filtered;
}

export function summarizeActiveCatalogBreakdown(templates: TagDesignTemplate[]): {
  activeTotal: number;
  archivedTotal: number;
  freeTotal: number;
  premiumTotal: number;
  originalCommercialTotal: number;
  ipReviewRequiredTotal: number;
  byDomain: Record<TemplateDomainCategory, number>;
  byScope: Record<TemplateScope, number>;
  byStyleCluster: Record<Exclude<StyleClusterId, 'all'>, number>;
} {
  const active = getActiveCatalogTemplates(templates);
  const archived = getArchivedCatalogTemplates(templates);
  const byDomain: Record<TemplateDomainCategory, number> = {
    personal: 0,
    travel: 0,
    family: 0,
    pets: 0,
    business: 0,
    anime_cartoon: 0,
  };
  const byScope: Record<TemplateScope, number> = {
    general: 0,
    specialized: 0,
  };
  const byStyleCluster: Record<Exclude<StyleClusterId, 'all'>, number> = {
    anime_cartoon: 0,
    minimal: 0,
    playful: 0,
    cosmic: 0,
    vintage: 0,
    nature: 0,
  };

  let freeTotal = 0;
  let ipReviewRequiredTotal = 0;

  for (const t of active) {
    if (isTemplateFree(t)) freeTotal += 1;
    if (t.requiresIpVerification) ipReviewRequiredTotal += 1;
    const domains = getTemplateDomainSet(t);
    for (const dom of domains) {
      byDomain[dom] = (byDomain[dom] || 0) + 1;
    }
    const sc = t.templateScope || 'general';
    byScope[sc] = (byScope[sc] || 0) + 1;
    for (const styleKey of Object.keys(byStyleCluster) as Array<Exclude<StyleClusterId, 'all'>>) {
      if (matchesStyleCluster(t, styleKey)) {
        byStyleCluster[styleKey] += 1;
      }
    }
  }

  return {
    activeTotal: active.length,
    archivedTotal: archived.length,
    freeTotal,
    premiumTotal: active.length - freeTotal,
    originalCommercialTotal: active.length - ipReviewRequiredTotal,
    ipReviewRequiredTotal,
    byDomain,
    byScope,
    byStyleCluster,
  };
}
