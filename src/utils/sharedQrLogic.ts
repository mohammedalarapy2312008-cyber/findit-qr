import {
  RegisteredItem,
  SharedQrGroup,
  SharedQrGroupItemEntry,
  SharedQrPublicItem,
  SharedQrPublicPayload,
  ValidationResult,
} from '../types/domain';
import { buildFinderPublicView, resolveItemPrivacySettings } from './qrLogic';

const SHARE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates an opaque, PII-free, URL-safe unique shared group code (e.g., SQR-8K4M-9P2X).
 * Uses Web Crypto / Node crypto random bytes when available to prevent predictable enumeration.
 */
export function createUniqueSharedQrCode(existingCodes: Set<string>): string {
  const randomBytes = (len: number): Uint8Array => {
    const out = new Uint8Array(len);
    if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
      globalThis.crypto.getRandomValues(out);
      return out;
    }
    for (let i = 0; i < len; i += 1) {
      out[i] = Math.floor(Math.random() * 256);
    }
    return out;
  };

  for (let attempt = 0; attempt < 32; attempt += 1) {
    const bytes = randomBytes(8);
    let partA = '';
    let partB = '';
    for (let i = 0; i < 4; i += 1) {
      partA += SHARE_CODE_ALPHABET[bytes[i] % SHARE_CODE_ALPHABET.length];
      partB += SHARE_CODE_ALPHABET[bytes[i + 4] % SHARE_CODE_ALPHABET.length];
    }
    const candidate = `SQR-${partA}-${partB}`;
    if (!existingCodes.has(candidate.toUpperCase())) {
      return candidate;
    }
  }
  const fallback = Date.now().toString(36).toUpperCase().slice(-8).padStart(8, 'X');
  return `SQR-${fallback.slice(0, 4)}-${fallback.slice(4, 8)}`;
}

/**
 * Builds the canonical public recovery URL encoded inside the Shared QR code.
 * Strictly contains ONLY the opaque shareCode — zero personal information.
 */
export function buildSharedQrRecoveryUrl(shareCode: string, origin?: string): string {
  const safeCode = encodeURIComponent(shareCode.trim());
  const resolvedOrigin =
    origin !== undefined
      ? origin
      : typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://finditqr.app';
  const base = resolvedOrigin.replace(/\/+$/, '');
  return `${base}/shared/${safeCode}`;
}

export function validateSharedQrGroupInput(input: {
  name?: unknown;
  description?: unknown;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';

  if (name.length < 2 || name.length > 80) {
    errors.name = 'INVALID_SHARED_GROUP_NAME';
  }
  if (description.length > 240) {
    errors.description = 'INVALID_SHARED_GROUP_DESCRIPTION';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Deduplicates and normalizes membership entries for a Shared QR Group while
 * preserving existing addedAt timestamps and validating ownership against itemsById.
 */
export function normalizeSharedQrGroupItems(
  entries: Array<{ itemId: string; isVisible?: boolean; addedAt?: string }>,
  ownerUid: string,
  itemsById: Record<string, RegisteredItem>,
  nowIso: string
): {
  valid: boolean;
  items: SharedQrGroupItemEntry[];
  invalidItemId?: string;
} {
  const seen = new Set<string>();
  const normalized: SharedQrGroupItemEntry[] = [];

  for (const raw of entries) {
    const itemId = typeof raw.itemId === 'string' ? raw.itemId.trim() : '';
    if (!itemId || seen.has(itemId)) continue;
    const item = itemsById[itemId];
    if (!item || item.ownerUid !== ownerUid) {
      return { valid: false, items: [], invalidItemId: itemId };
    }
    seen.add(itemId);
    normalized.push({
      itemId,
      isVisible: raw.isVisible !== false,
      addedAt: typeof raw.addedAt === 'string' && raw.addedAt ? raw.addedAt : nowIso,
    });
  }

  return { valid: true, items: normalized };
}

/**
 * Server-side authoritative public projection for a Shared QR Group.
 * Guarantees:
 * - Paused/disabled groups (isActive === false) return 0 items.
 * - Hidden items (isVisible === false) are NEVER returned in the payload.
 * - Archived, restricted, or public-page-disabled items are excluded.
 * - Cross-owner items are rejected defensively.
 * - Each visible item's contact channels, city, description, and image strictly honor
 *   that specific item's privacy settings via buildFinderPublicView().
 * - Individual item QR serial numbers and ownerUid are never exposed.
 */
export function buildSharedQrPublicPayload(
  group: SharedQrGroup,
  itemsById: Record<string, RegisteredItem>,
  options?: {
    ownerContactMethods?: import('../types/domain').AccountContactMethod[];
    contactMethodsLimit?: number;
  }
): SharedQrPublicPayload {
  const linkedOwnedEntries = (group.items || []).filter((entry) => {
    const item = itemsById[entry.itemId];
    return Boolean(item && item.ownerUid === group.ownerUid);
  });

  if (!group.isActive) {
    return {
      groupId: group.id,
      shareCode: group.shareCode,
      name: group.name,
      description: group.description || '',
      isActive: false,
      hasAnyLinkedItems: linkedOwnedEntries.length > 0,
      visibleItemsCount: 0,
      items: [],
    };
  }

  const publicItems: SharedQrPublicItem[] = [];

  for (const entry of linkedOwnedEntries) {
    if (!entry.isVisible) continue;
    const item = itemsById[entry.itemId];
    if (!item) continue;
    if (item.status === 'Archived') continue;
    if (item.moderationFlag === 'restricted') continue;

    const privacy = resolveItemPrivacySettings(item);
    if (!privacy.publicPageEnabled) continue;
    // Defensive check: if item explicitly points to a different shared group, skip it
    if (item.sharedQrGroupId && item.sharedQrGroupId !== group.id) continue;

    const finderView = buildFinderPublicView(item, undefined, {
      forSharedGroup: true,
      ownerContactMethods: options?.ownerContactMethods,
      contactMethodsLimit: options?.contactMethodsLimit,
    });
    if (!finderView.isPublicPageActive) continue;
    publicItems.push({
      itemId: finderView.itemId,
      itemNameAr: finderView.itemNameAr,
      itemNameEn: finderView.itemNameEn,
      category: finderView.category,
      cityAr: finderView.cityAr,
      cityEn: finderView.cityEn,
      imageUrl: finderView.imageUrl,
      descriptionAr: finderView.descriptionAr,
      descriptionEn: finderView.descriptionEn,
      status: finderView.status,
      finderNoteAr: finderView.finderNoteAr,
      finderNoteEn: finderView.finderNoteEn,
      rewardOffered: finderView.rewardOffered,
      rewardAmountTextAr: finderView.rewardAmountTextAr,
      rewardAmountTextEn: finderView.rewardAmountTextEn,
      isContactEnabled: finderView.isContactEnabled,
      allowFinderMessages: finderView.allowFinderMessages,
      allowFoundReports: finderView.allowFoundReports,
      anonymousRelayOnly: finderView.anonymousRelayOnly,
      visibleChannels: finderView.visibleChannels,
      visibleContactMethods: finderView.visibleContactMethods,
    });
  }

  return {
    groupId: group.id,
    shareCode: group.shareCode,
    name: group.name,
    description: group.description || '',
    isActive: true,
    hasAnyLinkedItems: linkedOwnedEntries.length > 0,
    visibleItemsCount: publicItems.length,
    items: publicItems,
  };
}
