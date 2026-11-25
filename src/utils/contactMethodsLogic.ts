import {
  AccountContactMethod,
  ContactChannelPreference,
  ContactMethodType,
  RegisteredItem,
  UserProfile,
  ValidationResult,
} from '../types/domain';

export const VALID_CONTACT_METHOD_TYPES: ReadonlySet<ContactMethodType> = new Set([
  'phone',
  'whatsapp',
  'email',
  'telegram',
  'facebook',
  'custom_link',
]);

export const CONTACT_METHOD_META: Record<
  ContactMethodType,
  { labelAr: string; labelEn: string; placeholderAr: string; placeholderEn: string }
> = {
  phone: {
    labelAr: 'رقم الهاتف',
    labelEn: 'Phone Call',
    placeholderAr: '+966 5X XXX XXXX',
    placeholderEn: '+966 5X XXX XXXX',
  },
  whatsapp: {
    labelAr: 'واتساب',
    labelEn: 'WhatsApp',
    placeholderAr: '+966 5X XXX XXXX',
    placeholderEn: '+966 5X XXX XXXX',
  },
  email: {
    labelAr: 'البريد الإلكتروني',
    labelEn: 'Email Address',
    placeholderAr: 'name@example.com',
    placeholderEn: 'name@example.com',
  },
  telegram: {
    labelAr: 'تيليجرام',
    labelEn: 'Telegram',
    placeholderAr: '@username',
    placeholderEn: '@username',
  },
  facebook: {
    labelAr: 'فيسبوك',
    labelEn: 'Facebook',
    placeholderAr: 'https://facebook.com/username أو @username',
    placeholderEn: 'https://facebook.com/username or @username',
  },
  custom_link: {
    labelAr: 'رابط تواصل مخصص',
    labelEn: 'Custom Contact Link',
    placeholderAr: 'https://example.com/contact',
    placeholderEn: 'https://example.com/contact',
  },
};

export function isSafeContactLinkUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 300 || /\s/.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function normalizeContactMethodValue(type: ContactMethodType, rawValue: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) return '';
  if (type === 'telegram') {
    if (trimmed.startsWith('https://t.me/')) {
      return '@' + trimmed.slice('https://t.me/'.length).replace(/^@+/, '').replace(/\/+$/, '');
    }
    return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
  }
  if (type === 'facebook') {
    if (trimmed.startsWith('https://')) return trimmed;
    const handle = trimmed.replace(/^@+/, '').replace(/^facebook\.com\//i, '').trim();
    return handle ? `https://facebook.com/${handle}` : '';
  }
  return trimmed;
}

export function validateContactMethodInput(input: {
  type?: unknown;
  label?: unknown;
  value?: unknown;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const type = typeof input.type === 'string' ? (input.type as ContactMethodType) : null;
  if (!type || !VALID_CONTACT_METHOD_TYPES.has(type)) {
    errors.type = 'INVALID_CONTACT_TYPE';
  }

  const label = typeof input.label === 'string' ? input.label.trim() : '';
  if (label.length < 2 || label.length > 60) {
    errors.label = 'INVALID_CONTACT_LABEL';
  }

  const rawValue = typeof input.value === 'string' ? input.value.trim() : '';
  if (!rawValue || rawValue.length > 260) {
    errors.value = 'CONTACT_VALUE_REQUIRED';
  } else if (type) {
    const normalized = normalizeContactMethodValue(type, rawValue);
    if (type === 'phone' || type === 'whatsapp') {
      const digits = normalized.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 18) {
        errors.value = 'INVALID_PHONE_FORMAT';
      }
    } else if (type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        errors.value = 'INVALID_EMAIL_FORMAT';
      }
    } else if (type === 'telegram') {
      if (!/^@[A-Za-z0-9_]{3,64}$/.test(normalized)) {
        errors.value = 'INVALID_TELEGRAM_HANDLE';
      }
    } else if (type === 'facebook' || type === 'custom_link') {
      if (!isSafeContactLinkUrl(normalized)) {
        errors.value = 'INVALID_HTTPS_LINK';
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Ensures every user profile has a synchronized central contactMethods array
 * seeded cleanly from any existing legacy profile fields (phone, whatsapp, email, telegram)
 * without duplicating entries or inventing fake values.
 */
export function ensureProfileContactMethods(
  profile: Pick<UserProfile, 'email' | 'phone' | 'whatsapp' | 'telegram' | 'contactMethods' | 'createdAt'>
): AccountContactMethod[] {
  if (Array.isArray(profile.contactMethods)) {
    return profile.contactMethods;
  }
  const seeded: AccountContactMethod[] = [];
  const ts = profile.createdAt || new Date().toISOString();

  if (profile.whatsapp?.trim()) {
    seeded.push({
      id: 'cm-whatsapp-default',
      type: 'whatsapp',
      label: 'WhatsApp',
      value: profile.whatsapp.trim(),
      isActive: true,
      isPrimary: true,
      createdAt: ts,
      updatedAt: ts,
    });
  }
  if (profile.phone?.trim()) {
    seeded.push({
      id: 'cm-phone-default',
      type: 'phone',
      label: 'Phone',
      value: profile.phone.trim(),
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    });
  }
  if (profile.email?.trim()) {
    seeded.push({
      id: 'cm-email-default',
      type: 'email',
      label: 'Account Email',
      value: profile.email.trim(),
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    });
  }
  if (profile.telegram?.trim()) {
    seeded.push({
      id: 'cm-telegram-default',
      type: 'telegram',
      label: 'Telegram',
      value: normalizeContactMethodValue('telegram', profile.telegram),
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    });
  }

  return seeded;
}

/**
 * Resolves the effective contact channels and custom links for an item
 * strictly honoring:
 * - Only methods explicitly selected by the user for this item (selectedContactMethodIds)
 * - Only active methods in the user's central directory
 * - Live propagation when the user updates a central method's value or disables it
 * - Plan contactMethodsLimit cap
 * - Complete hiding when anonymousRelayOnly === true
 */
export function resolveItemEffectiveContacts(params: {
  item: Pick<RegisteredItem, 'contactChannels' | 'selectedContactMethodIds'>;
  ownerContactMethods?: AccountContactMethod[];
  contactMethodsLimit?: number;
}): {
  visibleChannels: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    telegram: string | null;
    facebook: string | null;
    customLinks: Array<{ id: string; label: string; value: string }>;
  };
  visibleContactMethods: Array<{
    id: string;
    type: ContactMethodType;
    label: string;
    value: string;
  }>;
} {
  const prefs = params.item.contactChannels;
  const empty = {
    visibleChannels: {
      phone: null,
      whatsapp: null,
      email: null,
      telegram: null,
      facebook: null,
      customLinks: [] as Array<{ id: string; label: string; value: string }>,
    },
    visibleContactMethods: [] as Array<{
      id: string;
      type: ContactMethodType;
      label: string;
      value: string;
    }>,
  };

  if (!prefs || prefs.anonymousRelayOnly) {
    return empty;
  }

  const selectedIds = Array.isArray(params.item.selectedContactMethodIds)
    ? params.item.selectedContactMethodIds
    : Array.isArray(prefs.selectedMethodIds)
    ? prefs.selectedMethodIds
    : null;

  // If the item uses central contact method IDs and owner directory is available:
  if (selectedIds && selectedIds.length > 0 && Array.isArray(params.ownerContactMethods)) {
    const byId = new Map<string, AccountContactMethod>();
    for (const m of params.ownerContactMethods) {
      byId.set(m.id, m);
    }

    const limit =
      typeof params.contactMethodsLimit === 'number' && params.contactMethodsLimit > 0
        ? params.contactMethodsLimit
        : 7;

    const resolvedList: Array<{
      id: string;
      type: ContactMethodType;
      label: string;
      value: string;
    }> = [];

    for (const id of selectedIds) {
      if (resolvedList.length >= limit) break;
      const found = byId.get(id);
      if (!found || !found.isActive || !found.value.trim()) continue;
      resolvedList.push({
        id: found.id,
        type: found.type,
        label: found.label,
        value: found.value.trim(),
      });
    }

    const visibleChannels = {
      phone: resolvedList.find((m) => m.type === 'phone')?.value || null,
      whatsapp: resolvedList.find((m) => m.type === 'whatsapp')?.value || null,
      email: resolvedList.find((m) => m.type === 'email')?.value || null,
      telegram: resolvedList.find((m) => m.type === 'telegram')?.value || null,
      facebook: resolvedList.find((m) => m.type === 'facebook')?.value || null,
      customLinks: resolvedList
        .filter((m) => m.type === 'custom_link')
        .map((m) => ({ id: m.id, label: m.label, value: m.value })),
    };

    return {
      visibleChannels,
      visibleContactMethods: resolvedList,
    };
  }

  // Backward-compatible fallback for items created with legacy boolean channel flags
  const legacyList: Array<{
    id: string;
    type: ContactMethodType;
    label: string;
    value: string;
  }> = [];

  if (prefs.showPhone && prefs.customPhone?.trim()) {
    legacyList.push({
      id: 'legacy-phone',
      type: 'phone',
      label: 'Phone',
      value: prefs.customPhone.trim(),
    });
  }
  if (prefs.showWhatsapp && prefs.customWhatsapp?.trim()) {
    legacyList.push({
      id: 'legacy-whatsapp',
      type: 'whatsapp',
      label: 'WhatsApp',
      value: prefs.customWhatsapp.trim(),
    });
  }
  if (prefs.showEmail && prefs.customEmail?.trim()) {
    legacyList.push({
      id: 'legacy-email',
      type: 'email',
      label: 'Email',
      value: prefs.customEmail.trim(),
    });
  }
  if (prefs.showTelegram && prefs.customTelegram?.trim()) {
    legacyList.push({
      id: 'legacy-telegram',
      type: 'telegram',
      label: 'Telegram',
      value: prefs.customTelegram.trim(),
    });
  }

  return {
    visibleChannels: {
      phone: prefs.showPhone ? prefs.customPhone || null : null,
      whatsapp: prefs.showWhatsapp ? prefs.customWhatsapp || null : null,
      email: prefs.showEmail ? prefs.customEmail || null : null,
      telegram: prefs.showTelegram ? prefs.customTelegram || null : null,
      facebook: null,
      customLinks: [],
    },
    visibleContactMethods: legacyList,
  };
}

/**
 * Synchronizes legacy ContactChannelPreference fields from selected central method IDs
 * so both new central-directory consumers and legacy validators stay consistent.
 */
export function buildChannelPreferenceFromSelectedMethods(params: {
  selectedMethodIds: string[];
  accountMethods: AccountContactMethod[];
  anonymousRelayOnly: boolean;
}): ContactChannelPreference {
  if (params.anonymousRelayOnly) {
    return {
      showPhone: false,
      showWhatsapp: false,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: true,
      customPhone: '',
      customWhatsapp: '',
      customEmail: '',
      customTelegram: '',
      selectedMethodIds: [],
    };
  }

  const chosen = params.selectedMethodIds
    .map((id) => params.accountMethods.find((m) => m.id === id && m.isActive))
    .filter((m): m is AccountContactMethod => Boolean(m));

  const phone = chosen.find((m) => m.type === 'phone');
  const whatsapp = chosen.find((m) => m.type === 'whatsapp');
  const email = chosen.find((m) => m.type === 'email');
  const telegram = chosen.find((m) => m.type === 'telegram');

  return {
    showPhone: Boolean(phone),
    showWhatsapp: Boolean(whatsapp),
    showEmail: Boolean(email),
    showTelegram: Boolean(telegram),
    anonymousRelayOnly: false,
    customPhone: phone?.value || '',
    customWhatsapp: whatsapp?.value || '',
    customEmail: email?.value || '',
    customTelegram: telegram?.value || '',
    selectedMethodIds: chosen.map((m) => m.id),
  };
}

export function countItemsUsingContactMethod(
  methodId: string,
  items: RegisteredItem[]
): number {
  return items.filter((item) => {
    const ids = item.selectedContactMethodIds || item.contactChannels?.selectedMethodIds || [];
    return ids.includes(methodId);
  }).length;
}
