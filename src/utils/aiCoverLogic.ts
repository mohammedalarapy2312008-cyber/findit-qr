import {
  COVER_LIBRARY_CATALOG,
  CoverLibraryEntry,
  CoverLibraryScope,
  FALLBACK_LIBRARY_COVERS,
  GROUP_LIBRARY_COVERS,
  ITEM_LIBRARY_COVERS,
} from '../data/coverLibraryCatalog';
import { CoverSourceType, ItemCategory } from '../types/domain';

export interface CandidateCoverImage {
  url: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  fileName?: string;
}

export interface ScoredCoverCandidate {
  url: string;
  score: number;
  reasonAr: string;
  reasonEn: string;
}

export interface SmartCoverMatchResult {
  cover: CoverLibraryEntry;
  coverUrl: string;
  coverSource: 'library_matched' | 'fallback';
  score: number;
  matchedKeyword?: string;
  reasonAr: string;
  reasonEn: string;
  alternatives: CoverLibraryEntry[];
}

/**
 * Curated Midnight Teal fallback covers mapped by category/context.
 * Points to the 40-cover internal library so item/group creation never breaks
 * and never requires per-item Gemini API calls.
 */
export const FALLBACK_COVER_BY_CATEGORY: Record<
  ItemCategory | 'org_group' | 'shared_group',
  string
> = {
  electronics: '/assets/covers-library/fallbacks/fallback-midnight-crest.svg',
  bags: '/assets/covers-library/fallbacks/fallback-teal-horizon.svg',
  keys: '/assets/covers-library/fallbacks/fallback-slate-prism.svg',
  documents: '/assets/covers-library/fallbacks/fallback-ocean-vault.svg',
  pets: '/assets/covers-library/fallbacks/fallback-aurora-tag.svg',
  vehicles: '/assets/covers-library/fallbacks/fallback-slate-prism.svg',
  commercial: '/assets/covers-library/fallbacks/fallback-ocean-vault.svg',
  org_group: '/assets/covers-library/fallbacks/fallback-teal-horizon.svg',
  shared_group: '/assets/covers-library/fallbacks/fallback-aurora-tag.svg',
};

export function getFallbackCoverUrl(
  category: ItemCategory | 'org_group' | 'shared_group'
): string {
  return (
    FALLBACK_COVER_BY_CATEGORY[category] ||
    FALLBACK_LIBRARY_COVERS[0]?.url ||
    '/assets/covers-library/fallbacks/fallback-midnight-crest.svg'
  );
}

/**
 * Normalizes Arabic and English text for accurate bilingual smart cover matching
 * (handles alef forms, taa marbuta, alef maqsura, diacritics, punctuation, and case).
 */
export function normalizeCoverQueryText(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeNormalized(normalized: string): string[] {
  if (!normalized) return [];
  return normalized.split(/\s+/).filter((t) => t.length >= 2);
}

function pickDeterministicFallback(seedText: string): CoverLibraryEntry {
  const list = FALLBACK_LIBRARY_COVERS;
  if (!seedText) return list[0];
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  return list[hash % list.length] || list[0];
}

/**
 * Matches the closest curated cover from the 40-cover internal library using
 * item/group name, category, description, and optional child items inside a group.
 * Falls back cleanly to a Midnight Teal signature cover when no strong keyword match exists.
 */
export function matchSmartCover(params: {
  entityType: 'item' | 'org_group' | 'shared_group';
  name?: string;
  category?: ItemCategory;
  description?: string;
  childItemNames?: string[];
  childCategories?: ItemCategory[];
}): SmartCoverMatchResult {
  const isGroup = params.entityType === 'org_group' || params.entityType === 'shared_group';
  const pool = isGroup ? GROUP_LIBRARY_COVERS : ITEM_LIBRARY_COVERS;

  const normName = normalizeCoverQueryText(params.name || '');
  const normDesc = normalizeCoverQueryText(params.description || '');
  const normChildren = normalizeCoverQueryText((params.childItemNames || []).join(' '));
  const nameTokens = new Set(tokenizeNormalized(normName));
  const descTokens = new Set(tokenizeNormalized(normDesc));
  const childTokens = new Set(tokenizeNormalized(normChildren));

  const scored = pool.map((entry) => {
    let score = 0;
    let bestKeyword = '';
    const allKeywords = [...entry.keywordsAr, ...entry.keywordsEn, entry.nameAr, entry.nameEn];

    for (const rawKw of allKeywords) {
      const kw = normalizeCoverQueryText(rawKw);
      if (!kw || kw.length < 2) continue;

      if (normName && (normName === kw || nameTokens.has(kw))) {
        if (score < 48) bestKeyword = rawKw;
        score += 48;
      } else if (normName && normName.includes(kw)) {
        if (score < 32) bestKeyword = rawKw;
        score += 32;
      }

      if (normDesc && (descTokens.has(kw) || normDesc.includes(kw))) {
        if (!bestKeyword) bestKeyword = rawKw;
        score += 18;
      }

      if (isGroup && normChildren && (childTokens.has(kw) || normChildren.includes(kw))) {
        if (!bestKeyword) bestKeyword = rawKw;
        score += 16;
      }
    }

    if (!isGroup && params.category && entry.category === params.category) {
      score += 14;
    }

    if (isGroup && Array.isArray(params.childCategories) && params.childCategories.length > 0) {
      const counts = new Map<ItemCategory, number>();
      for (const c of params.childCategories) {
        counts.set(c, (counts.get(c) || 0) + 1);
      }
      const dominant = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
      const groupCategoryMap: Record<ItemCategory, string> = {
        bags: 'group-travel-luggage',
        keys: 'group-home-keys',
        electronics: 'group-tech-workstation',
        documents: 'group-school-campus',
        pets: 'group-pets-care',
        vehicles: 'group-car-commute',
        commercial: 'group-office-enterprise',
      };
      if (dominant && groupCategoryMap[dominant] === entry.id) {
        score += 22;
      }
    }

    return { entry, score, bestKeyword };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  const alternatives = scored.slice(1, 7).map((s) => s.entry);

  if (top && top.score >= 20) {
    return {
      cover: top.entry,
      coverUrl: top.entry.url,
      coverSource: 'library_matched',
      score: top.score,
      matchedKeyword: top.bestKeyword || undefined,
      reasonAr: top.bestKeyword
        ? `تم اختيار «${top.entry.nameAr}» تلقائيًا لمطابقة الكلمة «${top.bestKeyword}»`
        : `تم اختيار «${top.entry.nameAr}» تلقائيًا لمناسبته لبيانات ${isGroup ? 'المجموعة' : 'الغرض'}`,
      reasonEn: top.bestKeyword
        ? `Auto-matched "${top.entry.nameEn}" based on "${top.bestKeyword}"`
        : `Auto-matched "${top.entry.nameEn}" for this ${isGroup ? 'group' : 'item'}`,
      alternatives,
    };
  }

  const fallbackCover = pickDeterministicFallback(`${params.entityType}:${normName}:${params.category || ''}`);
  return {
    cover: fallbackCover,
    coverUrl: fallbackCover.url,
    coverSource: 'fallback',
    score: top?.score || 0,
    reasonAr: `لم يوجد تطابق مباشر؛ تم تعيين غلاف Midnight Teal العام «${fallbackCover.nameAr}» ويمكنك تغييره من المكتبة في أي وقت.`,
    reasonEn: `No direct keyword match; applied Midnight Teal cover "${fallbackCover.nameEn}". You can change it anytime from the library.`,
    alternatives: scored.slice(0, 6).map((s) => s.entry),
  };
}

export function searchCoverLibrary(params: {
  scope?: CoverLibraryScope | 'all';
  query?: string;
  category?: ItemCategory | 'all';
}): CoverLibraryEntry[] {
  const scope = params.scope || 'all';
  const normQuery = normalizeCoverQueryText(params.query || '');

  return COVER_LIBRARY_CATALOG.filter((entry) => {
    if (scope !== 'all' && entry.scope !== scope) return false;
    if (params.category && params.category !== 'all' && entry.category !== params.category) {
      return false;
    }
    if (!normQuery) return true;
    const haystack = normalizeCoverQueryText(
      [entry.nameAr, entry.nameEn, entry.styleTag, ...entry.keywordsAr, ...entry.keywordsEn].join(' ')
    );
    return haystack.includes(normQuery);
  });
}

/**
 * Inspects user-uploaded photos and scores each candidate to automatically
 * pick the sharpest, best-framed cover image (favoring clean landscape/4:3 ratio
 * and strong resolution) while keeping originalImages separate from coverUrl.
 */
export function selectBestCoverFromImages(
  candidates: CandidateCoverImage[]
): ScoredCoverCandidate | null {
  const valid = candidates.filter((c) => typeof c.url === 'string' && c.url.trim().length > 0);
  if (valid.length === 0) return null;

  const scored: ScoredCoverCandidate[] = valid.map((img) => {
    let score = 50;
    const w = img.width || 0;
    const h = img.height || 0;

    if (w > 0 && h > 0) {
      const megapixels = (w * h) / 1_000_000;
      score += Math.min(25, Math.round(megapixels * 12));

      const ratio = w / h;
      if (ratio >= 1.15 && ratio <= 1.9) {
        score += 20;
      } else if (ratio >= 0.85 && ratio <= 2.2) {
        score += 10;
      } else {
        score -= 8;
      }

      if (w < 320 || h < 240) {
        score -= 20;
      }
    } else if (img.sizeBytes && img.sizeBytes > 25_000) {
      score += 8;
    }

    const lowerName = (img.fileName || img.url).toLowerCase();
    if (lowerName.includes('cover') || lowerName.includes('hero') || lowerName.includes('front')) {
      score += 6;
    }

    return {
      url: img.url.trim(),
      score,
      reasonAr:
        w >= 800 && h >= 500
          ? `أفضل دقة ونسبة عرض للغلاف (${w}×${h})`
          : 'أفضل صورة متاحة كغلاف تلقائي',
      reasonEn:
        w >= 800 && h >= 500
          ? `Best resolution & card aspect ratio (${w}×${h})`
          : 'Best available photo auto-selected as cover',
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

export function buildAiCoverPrompt(params: {
  entityType: 'item' | 'org_group' | 'shared_group';
  name: string;
  category?: ItemCategory;
  description?: string;
}): string {
  const cleanName = params.name.trim().slice(0, 80) || 'Smart Belonging';
  const categoryVisualMap: Record<ItemCategory, string> = {
    electronics: 'sleek aluminum laptop, smartphone, and wireless headphones',
    bags: 'premium navy structured travel suitcase and minimalist backpack',
    keys: 'anodized titanium keychain fob and matte leather key organizer',
    documents: 'executive dark navy leather passport holder and folio case',
    pets: 'refined matte teal pet collar with brushed silver identification tag',
    vehicles: 'modern smart car key fob on brushed metallic slate surface',
    commercial: 'organized enterprise field equipment case with precision metal tag',
  };

  if (params.entityType === 'org_group') {
    return `Clean minimalist 3D studio editorial product illustration representing an organized personal collection titled "${cleanName}", subtle deep midnight navy (#0B1320) backdrop with luminous teal (#19B5A5) rim lighting, crisp silver surfaces, architectural studio shadows, zero text, zero watermarks, 4:3 composition.`;
  }

  if (params.entityType === 'shared_group') {
    return `Clean minimalist 3D studio editorial scene representing a shared group of connected belongings titled "${cleanName}" arranged harmoniously on a matte slate pedestal, deep midnight navy (#0B1320) background, luminous teal (#19B5A5) subtle rim glow, soft diffused studio lighting, zero text, zero watermarks, 4:3 composition.`;
  }

  const subjectHint =
    (params.category && categoryVisualMap[params.category]) ||
    'modern everyday personal belonging';

  return `Ultra-clean 3D commercial studio photography of "${cleanName}" (${subjectHint}) styled in a refined Midnight Teal aesthetic with deep navy (#0B1320) studio surface, soft luminous teal (#19B5A5) rim light, brushed silver accents, shallow depth of field, centered hero framing, zero text, zero letters, zero watermarks, 4:3 composition.`;
}

export function resolveEffectiveCover(params: {
  coverUrl?: string;
  imageUrl?: string;
  originalImages?: string[];
  coverSource?: CoverSourceType;
  fallbackCategory: ItemCategory | 'org_group' | 'shared_group';
  entityName?: string;
  description?: string;
}): { url: string; source: CoverSourceType } {
  if (params.coverUrl?.trim()) {
    return {
      url: params.coverUrl.trim(),
      source: params.coverSource || 'user_selected',
    };
  }
  if (params.imageUrl?.trim()) {
    return {
      url: params.imageUrl.trim(),
      source: params.coverSource || 'user_selected',
    };
  }
  if (params.originalImages && params.originalImages.length > 0 && params.originalImages[0]?.trim()) {
    return {
      url: params.originalImages[0].trim(),
      source: 'auto_selected',
    };
  }
  if (params.entityName?.trim()) {
    const matched = matchSmartCover({
      entityType:
        params.fallbackCategory === 'org_group' || params.fallbackCategory === 'shared_group'
          ? params.fallbackCategory
          : 'item',
      name: params.entityName,
      category:
        params.fallbackCategory !== 'org_group' && params.fallbackCategory !== 'shared_group'
          ? params.fallbackCategory
          : undefined,
      description: params.description,
    });
    return {
      url: matched.coverUrl,
      source: matched.coverSource,
    };
  }
  return {
    url: getFallbackCoverUrl(params.fallbackCategory),
    source: 'fallback',
  };
}
