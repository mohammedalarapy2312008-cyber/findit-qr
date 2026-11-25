import QRCode from 'qrcode';
import {
  AccountContactMethod,
  ContactChannelPreference,
  DEFAULT_ITEM_PRIVACY_SETTINGS,
  FinderPublicPayload,
  ItemCategory,
  ItemPrivacySettings,
  ItemSortBy,
  ItemStatus,
  NewItemDraft,
  PLAN_QUOTA_SPECS,
  QrRecord,
  RegisteredItem,
  UserPlanTier,
  ValidationResult,
} from '../types/domain';
import { resolveItemEffectiveContacts } from './contactMethodsLogic';

export function resolveItemPrivacySettings(
  item?: Pick<RegisteredItem, 'privacySettings'> | null
): ItemPrivacySettings {
  const p = item?.privacySettings;
  return {
    publicPageEnabled:
      typeof p?.publicPageEnabled === 'boolean'
        ? p.publicPageEnabled
        : DEFAULT_ITEM_PRIVACY_SETTINGS.publicPageEnabled,
    showDescription:
      typeof p?.showDescription === 'boolean'
        ? p.showDescription
        : DEFAULT_ITEM_PRIVACY_SETTINGS.showDescription,
    showImage:
      typeof p?.showImage === 'boolean'
        ? p.showImage
        : DEFAULT_ITEM_PRIVACY_SETTINGS.showImage,
    showCity:
      typeof p?.showCity === 'boolean'
        ? p.showCity
        : DEFAULT_ITEM_PRIVACY_SETTINGS.showCity,
    allowFinderMessages:
      typeof p?.allowFinderMessages === 'boolean'
        ? p.allowFinderMessages
        : DEFAULT_ITEM_PRIVACY_SETTINGS.allowFinderMessages,
    allowFoundReports:
      typeof p?.allowFoundReports === 'boolean'
        ? p.allowFoundReports
        : DEFAULT_ITEM_PRIVACY_SETTINGS.allowFoundReports,
  };
}

export function isItemCountingTowardQuota(status: ItemStatus): boolean {
  return status !== 'Archived';
}

export function canAddOrReactivateItem(
  activeItemsCount: number,
  activeItemsLimit: number
): boolean {
  return activeItemsCount < activeItemsLimit;
}

export function getPlanLimits(plan: UserPlanTier): {
  maxActiveItems: number;
  maxContactMethods: number;
} {
  const spec = PLAN_QUOTA_SPECS[plan] || PLAN_QUOTA_SPECS.Free;
  return {
    maxActiveItems: spec.maxActiveItems,
    maxContactMethods: spec.maxContactMethods,
  };
}

export function countEnabledContactMethods(
  prefs: Pick<
    ContactChannelPreference,
    'showPhone' | 'showWhatsapp' | 'showEmail' | 'showTelegram' | 'anonymousRelayOnly'
  > & { selectedMethodIds?: string[]; selectedContactMethodIds?: string[] }
): number {
  if (prefs.anonymousRelayOnly) return 0;
  const selectedIds = prefs.selectedContactMethodIds || prefs.selectedMethodIds;
  if (Array.isArray(selectedIds) && selectedIds.length > 0) {
    return new Set(selectedIds.filter(Boolean)).size;
  }
  let count = 0;
  if (prefs.showWhatsapp) count += 1;
  if (prefs.showPhone) count += 1;
  if (prefs.showEmail) count += 1;
  if (prefs.showTelegram) count += 1;
  return count;
}

export interface DashboardComputedStats {
  activeCount: number;
  lostCount: number;
  foundOrRecoveredCount: number;
  archivedCount: number;
  totalCount: number;
}

export function computeDashboardStats(items: RegisteredItem[]): DashboardComputedStats {
  let activeCount = 0;
  let lostCount = 0;
  let foundOrRecoveredCount = 0;
  let archivedCount = 0;

  for (const item of items) {
    if (item.status === 'Archived') {
      archivedCount += 1;
    } else {
      activeCount += 1;
    }
    if (item.status === 'Lost') {
      lostCount += 1;
    }
    if (item.status === 'Found' || item.status === 'Recovered') {
      foundOrRecoveredCount += 1;
    }
  }

  return {
    activeCount,
    lostCount,
    foundOrRecoveredCount,
    archivedCount,
    totalCount: items.length,
  };
}

export function isSafeHttpsUrl(rawUrl: string | undefined, maxLength = 500): boolean {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return true;
  if (trimmed.length > maxLength) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname) && !/\s/.test(trimmed);
  } catch {
    return false;
  }
}

/**
 * Accepts empty string, safe https:// URLs, or strictly confined server-served
 * media paths (/api/media/...) and curated local cover assets (/src/assets/images/...).
 * Blocks javascript:, data:, relative traversal (..), and whitespace.
 */
export function isSafeMediaOrHttpsUrl(rawUrl: string | undefined, maxLength = 500): boolean {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return true;
  if (trimmed.length > maxLength || /\s/.test(trimmed) || trimmed.includes('..')) return false;
  if (
    trimmed.startsWith('/api/media/') ||
    trimmed.startsWith('/src/assets/images/') ||
    trimmed.startsWith('/assets/covers-library/')
  ) {
    return /^\/(api\/media|src\/assets\/images|assets\/covers-library)\/[A-Za-z0-9/_\-.]+$/.test(trimmed);
  }
  return isSafeHttpsUrl(trimmed, maxLength);
}

const VALID_ITEM_CATEGORIES: ReadonlySet<ItemCategory> = new Set([
  'electronics',
  'bags',
  'keys',
  'documents',
  'pets',
  'vehicles',
  'commercial',
]);

const VALID_ITEM_STATUSES: ReadonlySet<ItemStatus> = new Set([
  'Active',
  'Lost',
  'Found',
  'Recovered',
  'Archived',
]);

export function validateItemDraft(
  draft: NewItemDraft,
  quotaCheck?: {
    activeItemsCount: number;
    activeItemsLimit: number;
    contactMethodsLimit?: number;
  }
): ValidationResult {
  const errors: Record<string, string> = {};

  if (
    quotaCheck &&
    !canAddOrReactivateItem(quotaCheck.activeItemsCount, quotaCheck.activeItemsLimit)
  ) {
    errors.quota = 'QUOTA_LIMIT_REACHED';
  }

  const trimmedName = typeof draft.name === 'string' ? draft.name.trim() : '';
  if (!trimmedName) {
    errors.name = 'ITEM_NAME_REQUIRED';
  } else if (trimmedName.length < 2 || trimmedName.length > 80) {
    errors.name = 'ITEM_NAME_LENGTH';
  }

  if (draft.category !== undefined && !VALID_ITEM_CATEGORIES.has(draft.category)) {
    errors.category = 'INVALID_CATEGORY';
  }

  const trimmedDesc = typeof draft.description === 'string' ? draft.description.trim() : '';
  if (trimmedDesc.length > 0 && (trimmedDesc.length < 5 || trimmedDesc.length > 400)) {
    errors.description = 'ITEM_DESC_LENGTH';
  }

  const trimmedNote = typeof draft.finderNote === 'string' ? draft.finderNote.trim() : '';
  if (!trimmedNote || trimmedNote.length < 5) {
    errors.finderNote = 'FINDER_NOTE_REQUIRED';
  } else if (trimmedNote.length > 1000) {
    errors.finderNote = 'FINDER_NOTE_TOO_LONG';
  }

  if (typeof draft.city === 'string' && draft.city.trim().length > 80) {
    errors.city = 'CITY_TOO_LONG';
  }

  if (draft.imageUrl !== undefined) {
    if (typeof draft.imageUrl !== 'string' || !isSafeMediaOrHttpsUrl(draft.imageUrl, 500)) {
      errors.imageUrl = 'INVALID_IMAGE_URL';
    }
  }

  if (draft.coverUrl !== undefined) {
    if (typeof draft.coverUrl !== 'string' || !isSafeMediaOrHttpsUrl(draft.coverUrl, 500)) {
      errors.coverUrl = 'INVALID_IMAGE_URL';
    }
  }

  const enabledCount = countEnabledContactMethods(draft);
  if (enabledCount === 0 && !draft.anonymousRelayOnly) {
    errors.channels = 'AT_LEAST_ONE_CHANNEL_REQUIRED';
  } else if (
    quotaCheck?.contactMethodsLimit !== undefined &&
    enabledCount > quotaCheck.contactMethodsLimit
  ) {
    errors.channels = 'CONTACT_LIMIT_EXCEEDED';
  }

  if (draft.showEmail && typeof draft.customEmail === 'string' && draft.customEmail.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(draft.customEmail.trim())) {
      errors.customEmail = 'INVALID_EMAIL_FORMAT';
    }
  }

  const contactValues = [
    draft.customPhone,
    draft.customWhatsapp,
    draft.customEmail,
    draft.customTelegram,
  ];
  if (contactValues.some((v) => typeof v === 'string' && v.trim().length > 120)) {
    errors.contactValue = 'CONTACT_VALUE_TOO_LONG';
  }

  if (draft.rewardOffered && (!draft.rewardAmountText || !draft.rewardAmountText.trim())) {
    errors.rewardAmountText = 'REWARD_DETAIL_REQUIRED';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateItemUpdate(
  updates: {
    name?: string;
    description?: string;
    category?: ItemCategory;
    groupId?: string | null;
    imageUrl?: string;
    status?: ItemStatus;
    recoveryInstructions?: string;
    city?: string;
    designId?: string;
    contactChannels?: ContactChannelPreference;
    privacySettings?: Partial<ItemPrivacySettings>;
  },
  contactMethodsLimit?: number
): ValidationResult {
  const errors: Record<string, string> = {};

  if (updates.name !== undefined) {
    if (typeof updates.name !== 'string') {
      errors.name = 'ITEM_NAME_REQUIRED';
    } else {
      const trimmed = updates.name.trim();
      if (!trimmed) errors.name = 'ITEM_NAME_REQUIRED';
      else if (trimmed.length < 2 || trimmed.length > 80) errors.name = 'ITEM_NAME_LENGTH';
    }
  }

  if (updates.description !== undefined) {
    if (typeof updates.description !== 'string') {
      errors.description = 'ITEM_DESC_LENGTH';
    } else {
      const trimmed = updates.description.trim();
      if (trimmed.length > 0 && (trimmed.length < 5 || trimmed.length > 400)) {
        errors.description = 'ITEM_DESC_LENGTH';
      }
    }
  }

  if (updates.recoveryInstructions !== undefined) {
    if (typeof updates.recoveryInstructions !== 'string') {
      errors.recoveryInstructions = 'FINDER_NOTE_REQUIRED';
    } else {
      const trimmed = updates.recoveryInstructions.trim();
      if (trimmed.length < 5) errors.recoveryInstructions = 'FINDER_NOTE_REQUIRED';
      else if (trimmed.length > 1000) errors.recoveryInstructions = 'FINDER_NOTE_TOO_LONG';
    }
  }

  if (updates.city !== undefined) {
    if (typeof updates.city !== 'string' || updates.city.trim().length > 80) {
      errors.city = 'CITY_TOO_LONG';
    }
  }

  if (updates.category !== undefined && !VALID_ITEM_CATEGORIES.has(updates.category)) {
    errors.category = 'INVALID_CATEGORY';
  }

  if (updates.status !== undefined && !VALID_ITEM_STATUSES.has(updates.status)) {
    errors.status = 'INVALID_STATUS';
  }

  if (updates.imageUrl !== undefined) {
    if (typeof updates.imageUrl !== 'string' || !isSafeMediaOrHttpsUrl(updates.imageUrl, 500)) {
      errors.imageUrl = 'INVALID_IMAGE_URL';
    }
  }

  if (updates.designId !== undefined) {
    if (typeof updates.designId !== 'string' || updates.designId.trim().length > 80) {
      errors.designId = 'INVALID_DESIGN_ID';
    }
  }

  if (updates.contactChannels !== undefined) {
    const ch = updates.contactChannels;
    const enabledCount = countEnabledContactMethods(ch);
    if (enabledCount === 0 && !ch.anonymousRelayOnly) {
      errors.channels = 'AT_LEAST_ONE_CHANNEL_REQUIRED';
    } else if (contactMethodsLimit !== undefined && enabledCount > contactMethodsLimit) {
      errors.channels = 'CONTACT_LIMIT_EXCEEDED';
    }

    if (ch.showEmail && typeof ch.customEmail === 'string' && ch.customEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(ch.customEmail.trim())) {
        errors.customEmail = 'INVALID_EMAIL_FORMAT';
      }
    }

    const vals = [ch.customPhone, ch.customWhatsapp, ch.customEmail, ch.customTelegram];
    if (vals.some((v) => typeof v === 'string' && v.trim().length > 120)) {
      errors.contactValue = 'CONTACT_VALUE_TOO_LONG';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateProfileUpdate(updates: {
  displayName?: string;
  country?: string;
  preferredLanguage?: string;
  photoURL?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (updates.displayName !== undefined) {
    if (typeof updates.displayName !== 'string') {
      errors.displayName = 'FULL_NAME_REQUIRED';
    } else {
      const trimmed = updates.displayName.trim();
      if (trimmed.length < 2 || trimmed.length > 80) {
        errors.displayName = 'FULL_NAME_REQUIRED';
      }
    }
  }

  if (updates.country !== undefined) {
    if (typeof updates.country !== 'string' || updates.country.trim().length > 80) {
      errors.country = 'CITY_TOO_LONG';
    }
  }

  if (updates.preferredLanguage !== undefined) {
    if (updates.preferredLanguage !== 'ar' && updates.preferredLanguage !== 'en') {
      errors.preferredLanguage = 'INVALID_LANGUAGE';
    }
  }

  if (updates.photoURL !== undefined) {
    if (typeof updates.photoURL !== 'string' || !isSafeMediaOrHttpsUrl(updates.photoURL, 500)) {
      errors.photoURL = 'INVALID_PHOTO_URL';
    }
  }

  const phones = [updates.phone, updates.whatsapp, updates.telegram];
  if (phones.some((v) => v !== undefined && (typeof v !== 'string' || v.trim().length > 40))) {
    errors.contactValue = 'CONTACT_VALUE_TOO_LONG';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateFinderMessageInput(input: {
  message: string;
  senderContact?: string;
  honeypot?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  if (input.honeypot && input.honeypot.trim().length > 0) {
    errors.spam = 'SPAM_DETECTED';
  }
  const msg = (input.message || '').trim();
  if (!msg || msg.length < 5) {
    errors.message = 'MESSAGE_TOO_SHORT';
  } else if (msg.length > 1000) {
    errors.message = 'MESSAGE_TOO_LONG';
  }
  if (input.senderContact && input.senderContact.trim().length > 150) {
    errors.senderContact = 'CONTACT_TOO_LONG';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface AuthFormInput {
  fullName?: string;
  country?: string;
  email: string;
  password?: string;
  acceptTerms?: boolean;
}

export function validateAuthForm(
  input: AuthFormInput,
  mode: 'login' | 'register' | 'reset'
): ValidationResult {
  const errors: Record<string, string> = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!input.email.trim()) {
    errors.email = 'EMAIL_REQUIRED';
  } else if (!emailRegex.test(input.email.trim())) {
    errors.email = 'INVALID_EMAIL';
  }

  if (mode === 'login' || mode === 'register') {
    const minPassLen = mode === 'login' ? 6 : 8;
    if (!input.password) {
      errors.password = 'PASSWORD_REQUIRED';
    } else if (input.password.length < minPassLen) {
      errors.password = 'PASSWORD_TOO_SHORT';
    }
  }

  if (mode === 'register') {
    if (!input.fullName || input.fullName.trim().length < 2) {
      errors.fullName = 'FULL_NAME_REQUIRED';
    }
    if (input.country !== undefined && input.country.trim().length < 2) {
      errors.country = 'COUNTRY_REQUIRED';
    }
    if (!input.acceptTerms) {
      errors.acceptTerms = 'TERMS_REQUIRED';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface ContactFormInput {
  name: string;
  email: string;
  topic: string;
  message: string;
}

export function validateContactForm(input: ContactFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!input.name.trim() || input.name.trim().length < 2) {
    errors.name = 'NAME_REQUIRED';
  }
  if (!input.email.trim() || !emailRegex.test(input.email.trim())) {
    errors.email = 'INVALID_EMAIL';
  }
  if (!input.topic.trim()) {
    errors.topic = 'TOPIC_REQUIRED';
  }
  if (!input.message.trim() || input.message.trim().length < 10) {
    errors.message = 'MESSAGE_TOO_SHORT';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function filterAndSortItems(
  items: RegisteredItem[],
  searchQuery: string,
  category: ItemCategory | 'all',
  status: ItemStatus | 'all',
  sortBy: ItemSortBy = 'newest',
  groupId: string | 'all' = 'all'
): RegisteredItem[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (category !== 'all' && item.category !== category) {
      return false;
    }
    if (status !== 'all' && item.status !== status) {
      return false;
    }
    if (groupId !== 'all') {
      if (groupId === 'ungrouped') {
        if (item.groupId) return false;
      } else if ((item.groupId || '') !== groupId) {
        return false;
      }
    }
    if (!normalizedQuery) {
      return true;
    }
    const haystacks = [
      item.name,
      item.nameAr,
      item.nameEn,
      item.codeSerial,
      item.city,
      item.cityAr,
      item.cityEn,
      item.description,
      item.descriptionAr,
      item.descriptionEn,
      item.groupName || '',
    ].map((val) => (val || '').toLowerCase());

    return haystacks.some((text) => text.includes(normalizedQuery));
  });

  return [...filtered].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.name || a.nameAr).localeCompare(b.name || b.nameAr, 'ar');
    }
    if (sortBy === 'oldest') {
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    }
    if (sortBy === 'updated') {
      return (b.updatedAt || b.createdAt || '').localeCompare(
        a.updatedAt || a.createdAt || ''
      );
    }
    // newest
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
}

export function buildFinderPublicView(
  item: RegisteredItem,
  qr?: QrRecord,
  options?: {
    forSharedGroup?: boolean;
    ownerContactMethods?: AccountContactMethod[];
    contactMethodsLimit?: number;
  }
): FinderPublicPayload {
  const privacy = resolveItemPrivacySettings(item);
  const forSharedGroup = Boolean(options?.forSharedGroup);
  const qrMode = item.qrMode || (item.sharedQrGroupId ? 'shared' : 'individual');

  let inactiveReason: FinderPublicPayload['inactiveReason'] = null;
  if (item.moderationFlag === 'restricted') {
    inactiveReason = 'restricted';
  } else if (item.status === 'Archived') {
    inactiveReason = 'archived';
  } else if (!forSharedGroup && qrMode === 'shared') {
    inactiveReason = item.sharedQrGroupPaused ? 'shared_group_paused' : 'shared_mode';
  } else if (!forSharedGroup && qrMode === 'unassigned') {
    inactiveReason = 'unassigned_from_shared';
  } else if (!privacy.publicPageEnabled || (qr && !qr.isActive)) {
    inactiveReason = 'public_disabled';
  }

  const isPublicPageActive = inactiveReason === null;
  const isContactEnabled = isPublicPageActive;
  const prefs = item.contactChannels;
  const resolvedContacts = isContactEnabled
    ? resolveItemEffectiveContacts({
        item,
        ownerContactMethods: options?.ownerContactMethods,
        contactMethodsLimit: options?.contactMethodsLimit,
      })
    : {
        visibleChannels: {
          phone: null,
          whatsapp: null,
          email: null,
          telegram: null,
          facebook: null,
          customLinks: [],
        },
        visibleContactMethods: [],
      };

  const displayImage = item.coverUrl || item.imageUrl || '';

  return {
    itemId: item.id,
    serialNumber: item.codeSerial,
    designId: item.designId,
    itemNameAr: item.nameAr || item.name,
    itemNameEn: item.nameEn || item.name,
    category: item.category,
    cityAr: isPublicPageActive && privacy.showCity ? item.cityAr || item.city : '',
    cityEn: isPublicPageActive && privacy.showCity ? item.cityEn || item.city : '',
    imageUrl: isPublicPageActive && privacy.showImage ? displayImage : '',
    descriptionAr:
      isPublicPageActive && privacy.showDescription
        ? item.descriptionAr || item.description || ''
        : '',
    descriptionEn:
      isPublicPageActive && privacy.showDescription
        ? item.descriptionEn || item.description || ''
        : '',
    status: item.status,
    finderNoteAr: isPublicPageActive ? item.finderNoteAr || item.recoveryInstructions : '',
    finderNoteEn: isPublicPageActive ? item.finderNoteEn || item.recoveryInstructions : '',
    rewardOffered: isPublicPageActive && item.rewardOffered,
    rewardAmountTextAr: isPublicPageActive ? item.rewardAmountTextAr : '',
    rewardAmountTextEn: isPublicPageActive ? item.rewardAmountTextEn : '',
    isPublicPageActive,
    isContactEnabled,
    allowFinderMessages: isPublicPageActive && privacy.allowFinderMessages,
    allowFoundReports: isPublicPageActive && privacy.allowFoundReports,
    anonymousRelayOnly: prefs.anonymousRelayOnly,
    qrMode,
    inactiveReason,
    visibleChannels: resolvedContacts.visibleChannels,
    visibleContactMethods: resolvedContacts.visibleContactMethods,
  };
}

/**
 * Builds the canonical recovery URL encoded inside an item's physical QR tag.
 * Uses the actual application origin in browser / env context unless baseOrigin is provided.
 */
export function buildQrRecoveryUrl(serialOrSlug: string, baseOrigin?: string): string {
  const clean = encodeURIComponent((serialOrSlug || 'FINDIT-QR').trim());
  const windowOrigin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  const envOrigin =
    (typeof import.meta !== 'undefined'
      ? (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_PUBLIC_APP_URL
      : undefined) ||
    (typeof process !== 'undefined' ? process.env?.APP_URL : undefined) ||
    '';
  const rawOrigin = (baseOrigin || windowOrigin || envOrigin).trim().replace(/\/+$/, '');
  return rawOrigin ? `${rawOrigin}/found/${clean}` : `/found/${clean}`;
}

/**
 * Generates a unique FindIt QR serial code (e.g. FQR-4810-XK9P), retrying against
 * existing serials (case-insensitive) to guarantee collision-free creation.
 */
export function createUniqueSerialCode(
  existingSerials: Iterable<string>,
  randomIntFn?: (max: number) => number
): string {
  const used = new Set<string>();
  for (const s of existingSerials) {
    if (typeof s === 'string' && s.trim()) {
      used.add(s.trim().toUpperCase());
    }
  }

  const pickInt =
    randomIntFn ||
    ((max: number) => {
      if (typeof globalThis.crypto?.getRandomValues === 'function') {
        const arr = new Uint32Array(1);
        globalThis.crypto.getRandomValues(arr);
        return arr[0] % max;
      }
      return Math.floor(Math.random() * max);
    });

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let attempt = 0; attempt < 50; attempt++) {
    const num = 1000 + pickInt(9000);
    const suffixLen = attempt >= 25 ? 6 : 4;
    let suffix = '';
    for (let i = 0; i < suffixLen; i++) {
      suffix += chars.charAt(pickInt(chars.length));
    }
    const candidate = `FQR-${num}-${suffix}`;
    if (!used.has(candidate.toUpperCase())) {
      return candidate;
    }
  }

  // Fallback with high-resolution suffix if extraordinary saturation occurs
  return `FQR-${Date.now().toString(36).toUpperCase().slice(-6)}-${pickInt(9000) + 1000}`;
}

/**
 * Generates a genuine ISO/IEC 18004 standard scannable QR code module matrix
 * via the `qrcode` library (with Reed-Solomon error correction).
 */
export function generateQrMatrix(
  payload: string,
  _sizeHint?: number,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M'
): boolean[][] {
  const text = (payload || buildQrRecoveryUrl('FINDIT-QR')).trim();
  const qr = QRCode.create(text, { errorCorrectionLevel });
  const size = qr.modules.size;
  const grid: boolean[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => Boolean(qr.modules.get(r, c)))
  );
  return grid;
}
