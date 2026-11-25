import {
  ActivityLogEntry,
  AdminAuditLogEntry,
  AdminDashboardAnalytics,
  AdminPermissionKey,
  ALL_ADMIN_PERMISSIONS,
  CouponCode,
  LicenseType,
  ManagedPlanDefinition,
  ManagedPurchaseOrder,
  RegisteredItem,
  SubscriptionRecord,
  SupportTicket,
  TagDesignTemplate,
  TemplateCustomizationMode,
  TemplateDomainCategory,
  UserPlanTier,
  UserRole,
} from '../types/domain';

export function normalizeConfiguredAdminEmail(rawEmail?: string): string {
  return typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
}

export function isSuperAdminEmailMatch(userEmail: string, configuredAdminEmail?: string): boolean {
  const adminEmail = normalizeConfiguredAdminEmail(configuredAdminEmail);
  const candidate = normalizeConfiguredAdminEmail(userEmail);
  return Boolean(adminEmail && candidate && adminEmail === candidate);
}

export function resolveEffectiveRole(
  storedRole: UserRole | undefined,
  email: string,
  configuredAdminEmail?: string,
  emailVerified = true
): UserRole {
  const adminEmail = normalizeConfiguredAdminEmail(configuredAdminEmail);
  if (adminEmail) {
    if (isSuperAdminEmailMatch(email, adminEmail) && emailVerified) {
      return 'super_admin';
    }
    if (storedRole === 'staff_admin') {
      return 'staff_admin';
    }
    return 'user';
  }
  // When ADMIN_EMAIL env var is not explicitly configured in runtime, preserve an already-bound
  // verified super_admin record in the database without ever promoting any other account.
  if (storedRole === 'super_admin' && emailVerified) {
    return 'super_admin';
  }
  if (storedRole === 'staff_admin') {
    return 'staff_admin';
  }
  return 'user';
}

export function resolveEffectivePermissions(
  role: UserRole,
  storedPermissions?: AdminPermissionKey[]
): AdminPermissionKey[] {
  if (role === 'super_admin') {
    return [...ALL_ADMIN_PERMISSIONS];
  }
  if (role === 'staff_admin') {
    const validSet = new Set<AdminPermissionKey>(ALL_ADMIN_PERMISSIONS);
    return (storedPermissions || []).filter((p) => validSet.has(p));
  }
  return [];
}

export function hasAdminPermission(
  role: UserRole,
  permissions: AdminPermissionKey[],
  required?: AdminPermissionKey
): boolean {
  if (role === 'super_admin') return true;
  if (role !== 'staff_admin') return false;
  if (!required) return permissions.length > 0;
  return permissions.includes(required);
}

export function inferDomainCategory(template: TagDesignTemplate): TemplateDomainCategory {
  if (template.domainCategory) return template.domainCategory;
  if (template.category === 'luggage_tag') return 'travel';
  if (template.category === 'pet_medal') return 'pets';
  if (template.category === 'metal_plate') return 'business';
  const badge = `${template.specialtyBadgeEn || ''} ${template.titleEn}`.toLowerCase();
  if (badge.includes('child') || badge.includes('family') || badge.includes('senior') || badge.includes('school')) {
    return 'family';
  }
  if (badge.includes('asset') || badge.includes('enterprise') || badge.includes('medical') || badge.includes('fleet')) {
    return 'business';
  }
  return 'personal';
}

export function enrichTemplateDefaults(
  template: TagDesignTemplate,
  isCoreFive = false
): TagDesignTemplate {
  const nowIso = template.updatedAt || template.createdAt || '2026-11-16T00:00:00.000Z';
  const isFree = template.isFree ?? template.includedInTier === 'free';
  return {
    ...template,
    domainCategory: inferDomainCategory(template),
    status: template.status || 'published',
    isFree,
    isFeatured: template.isFeatured ?? isCoreFive,
    isCoreProtected: template.isCoreProtected ?? isCoreFive,
    purchaseMode: template.purchaseMode || 'both',
    customizationMode: template.customizationMode || 'mixed',
    allowEditAfterSave: template.allowEditAfterSave ?? false,
    maxCopies: template.maxCopies ?? (isFree ? 2 : 5),
    tags: template.tags && template.tags.length > 0 ? template.tags : [template.category, template.templateScope || 'general'],
    licenseTypeId:
      template.licenseTypeId ||
      (template.category === 'metal_plate' ? 'lic-commercial-standard' : 'lic-personal-standard'),
    originalDesignUrl: template.originalDesignUrl || '',
    printFileUrl: template.printFileUrl || '',
    previewImages: template.previewImages || [],
    salesCount: template.salesCount ?? 0,
    usageCount: template.usageCount ?? 0,
    publishedAt: template.publishedAt !== undefined ? template.publishedAt : nowIso,
    createdAt: template.createdAt || nowIso,
    updatedAt: nowIso,
  };
}

export function getCustomizationCapabilities(mode?: TemplateCustomizationMode): {
  canChangeColor: boolean;
  canChangeBadgeText: boolean;
  canUploadLogoOrAssets: boolean;
} {
  if (mode === 'fixed') {
    return { canChangeColor: false, canChangeBadgeText: false, canUploadLogoOrAssets: false };
  }
  if (mode === 'full') {
    return { canChangeColor: true, canChangeBadgeText: true, canUploadLogoOrAssets: true };
  }
  // 'mixed' (default): color + badge text editable according to template policy, structural layout preserved
  return { canChangeColor: true, canChangeBadgeText: true, canUploadLogoOrAssets: false };
}

export function calculateDiscountedOrderTotals(params: {
  subtotalSar: number;
  subtotalUsd: number;
  coupon?: CouponCode | null;
  orderScope: 'templates' | 'plans';
  nowMs?: number;
}): {
  discountSar: number;
  discountUsd: number;
  amountSar: number;
  amountUsd: number;
  couponApplied: string | null;
  couponErrorCode?: string;
} {
  const subtotalSar = Math.max(0, Math.round(params.subtotalSar));
  const subtotalUsd = Math.max(0, Math.round(params.subtotalUsd));

  if (!params.coupon) {
    return {
      discountSar: 0,
      discountUsd: 0,
      amountSar: subtotalSar,
      amountUsd: subtotalUsd,
      couponApplied: null,
    };
  }

  const coupon = params.coupon;
  const nowMs = params.nowMs ?? Date.now();
  if (!coupon.isActive) {
    return {
      discountSar: 0,
      discountUsd: 0,
      amountSar: subtotalSar,
      amountUsd: subtotalUsd,
      couponApplied: null,
      couponErrorCode: 'COUPON_INACTIVE',
    };
  }
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= nowMs) {
    return {
      discountSar: 0,
      discountUsd: 0,
      amountSar: subtotalSar,
      amountUsd: subtotalUsd,
      couponApplied: null,
      couponErrorCode: 'COUPON_EXPIRED',
    };
  }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return {
      discountSar: 0,
      discountUsd: 0,
      amountSar: subtotalSar,
      amountUsd: subtotalUsd,
      couponApplied: null,
      couponErrorCode: 'COUPON_LIMIT_REACHED',
    };
  }
  if (coupon.appliesTo !== 'all' && coupon.appliesTo !== params.orderScope) {
    return {
      discountSar: 0,
      discountUsd: 0,
      amountSar: subtotalSar,
      amountUsd: subtotalUsd,
      couponApplied: null,
      couponErrorCode: 'COUPON_WRONG_SCOPE',
    };
  }

  let discountSar = 0;
  let discountUsd = 0;

  if (coupon.discountType === 'percent') {
    const pct = Math.min(100, Math.max(0, coupon.discountValue));
    discountSar = Math.round((subtotalSar * pct) / 100);
    discountUsd = Math.round((subtotalUsd * pct) / 100);
  } else {
    discountSar = Math.min(subtotalSar, Math.max(0, Math.round(coupon.discountValue)));
    const ratio = subtotalSar > 0 ? discountSar / subtotalSar : 0;
    discountUsd = Math.min(subtotalUsd, Math.round(subtotalUsd * ratio));
  }

  return {
    discountSar,
    discountUsd,
    amountSar: Math.max(0, subtotalSar - discountSar),
    amountUsd: Math.max(0, subtotalUsd - discountUsd),
    couponApplied: coupon.code,
  };
}

export function canAccessTemplateByPlanOrPurchase(params: {
  template: TagDesignTemplate;
  userPlan: UserPlanTier;
  purchasedTemplateIds: ReadonlySet<string>;
}): boolean {
  const { template, userPlan, purchasedTemplateIds } = params;
  if (template.isFree || template.includedInTier === 'free') return true;
  if (purchasedTemplateIds.has(template.id)) return true;

  if (template.purchaseMode === 'single') {
    return false;
  }

  const tierRank: Record<'free' | 'plus' | 'premium' | 'pro' | 'business', number> = {
    free: 0,
    plus: 1,
    premium: 2,
    pro: 3,
    business: 4,
  };
  const planNormalized = (userPlan === 'Free' || userPlan === 'Starter'
    ? 'free'
    : userPlan.toLowerCase()) as 'free' | 'plus' | 'premium' | 'pro' | 'business';

  return tierRank[planNormalized] >= tierRank[template.includedInTier];
}

const ALLOWED_ZIP_EXTENSIONS = new Set(['.json', '.svg', '.png', '.jpg', '.jpeg', '.webp']);
const BLOCKED_ZIP_EXTENSIONS = new Set([
  '.exe',
  '.sh',
  '.bat',
  '.cmd',
  '.ps1',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.html',
  '.htm',
  '.php',
  '.py',
  '.dll',
  '.so',
]);

export function isSafeZipEntryPath(entryPath: string): {
  safe: boolean;
  reason?: string;
} {
  const normalized = entryPath.replace(/\\/g, '/').trim();
  if (!normalized) {
    return { safe: false, reason: 'EMPTY_PATH' };
  }
  if (
    normalized.startsWith('/') ||
    normalized.includes('..') ||
    /^[a-zA-Z]:/.test(normalized) ||
    normalized.includes('\0')
  ) {
    return { safe: false, reason: 'PATH_TRAVERSAL_BLOCKED' };
  }
  // Ignore MacOS resource metadata directories cleanly
  if (normalized.startsWith('__MACOSX/') || normalized.endsWith('.DS_Store')) {
    return { safe: true };
  }
  if (normalized.endsWith('/')) {
    return { safe: true };
  }
  const dotIdx = normalized.lastIndexOf('.');
  const ext = dotIdx >= 0 ? normalized.slice(dotIdx).toLowerCase() : '';
  if (BLOCKED_ZIP_EXTENSIONS.has(ext)) {
    return { safe: false, reason: `BLOCKED_EXECUTABLE_OR_SCRIPT_EXTENSION:${ext}` };
  }
  if (!ALLOWED_ZIP_EXTENSIONS.has(ext)) {
    return { safe: false, reason: `UNSUPPORTED_ZIP_ENTRY_EXTENSION:${ext || 'none'}` };
  }
  return { safe: true };
}

export function buildTemplateFromZipManifestItem(
  raw: Record<string, unknown>,
  fallbackIndex: number
): { valid: boolean; template?: TagDesignTemplate; error?: string } {
  const titleEn = typeof raw.titleEn === 'string' ? raw.titleEn.trim() : '';
  const titleAr = typeof raw.titleAr === 'string' ? raw.titleAr.trim() : titleEn;
  const slugRaw = typeof raw.slug === 'string' ? raw.slug.trim() : '';

  if (!titleEn && !titleAr) {
    return { valid: false, error: `MANIFEST_ITEM_${fallbackIndex}_MISSING_TITLE` };
  }

  const cleanSlug =
    slugRaw ||
    (titleEn || titleAr)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    `zip-tpl-${Date.now()}-${fallbackIndex}`;

  const category =
    raw.category === 'sticker' ||
    raw.category === 'keychain' ||
    raw.category === 'luggage_tag' ||
    raw.category === 'metal_plate' ||
    raw.category === 'pet_medal'
      ? raw.category
      : 'sticker';

  const priceSar =
    typeof raw.priceSar === 'number' && Number.isFinite(raw.priceSar) && raw.priceSar >= 0
      ? Math.round(raw.priceSar)
      : 39;
  const priceUsd =
    typeof raw.priceUsd === 'number' && Number.isFinite(raw.priceUsd) && raw.priceUsd >= 0
      ? Math.round(raw.priceUsd)
      : Math.max(1, Math.round(priceSar / 3.75));

  const nowIso = new Date().toISOString();
  const tpl: TagDesignTemplate = enrichTemplateDefaults({
    id:
      typeof raw.id === 'string' && raw.id.trim()
        ? raw.id.trim()
        : `design-zip-${cleanSlug}`,
    slug: cleanSlug,
    titleAr: titleAr || titleEn,
    titleEn: titleEn || titleAr,
    subtitleAr:
      typeof raw.subtitleAr === 'string' && raw.subtitleAr.trim()
        ? raw.subtitleAr.trim()
        : 'قالب مضاف عبر حزمة ZIP الإدارية',
    subtitleEn:
      typeof raw.subtitleEn === 'string' && raw.subtitleEn.trim()
        ? raw.subtitleEn.trim()
        : 'Template imported via Admin ZIP batch package',
    category,
    domainCategory:
      raw.domainCategory === 'personal' ||
      raw.domainCategory === 'travel' ||
      raw.domainCategory === 'family' ||
      raw.domainCategory === 'pets' ||
      raw.domainCategory === 'business'
        ? raw.domainCategory
        : undefined,
    templateScope: raw.templateScope === 'specialized' ? 'specialized' : 'general',
    shapeSilhouette:
      raw.shapeSilhouette === 'luggage_loop' ||
      raw.shapeSilhouette === 'dome_sticker' ||
      raw.shapeSilhouette === 'chamfer_keyfob' ||
      raw.shapeSilhouette === 'pet_medal' ||
      raw.shapeSilhouette === 'metal_plate' ||
      raw.shapeSilhouette === 'smart_card' ||
      raw.shapeSilhouette === 'shield_tag'
        ? raw.shapeSilhouette
        : 'dome_sticker',
    materialAr:
      typeof raw.materialAr === 'string' && raw.materialAr.trim()
        ? raw.materialAr.trim()
        : 'بولي كربونات مقاوم للخدش',
    materialEn:
      typeof raw.materialEn === 'string' && raw.materialEn.trim()
        ? raw.materialEn.trim()
        : 'Scratch-resistant Polycarbonate',
    dimensionsMm:
      typeof raw.dimensionsMm === 'string' && raw.dimensionsMm.trim()
        ? raw.dimensionsMm.trim()
        : '50 × 50 × 2 mm',
    weatherproofRating:
      typeof raw.weatherproofRating === 'string' && raw.weatherproofRating.trim()
        ? raw.weatherproofRating.trim()
        : 'IP67 Waterproof',
    primaryHex:
      typeof raw.primaryHex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(raw.primaryHex)
        ? raw.primaryHex
        : '#2563EB',
    secondaryHex:
      typeof raw.secondaryHex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(raw.secondaryHex)
        ? raw.secondaryHex
        : '#17243A',
    badgeColorHex:
      typeof raw.badgeColorHex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(raw.badgeColorHex)
        ? raw.badgeColorHex
        : '#19B5A5',
    priceSar,
    priceUsd,
    includedInTier:
      raw.includedInTier === 'free' ||
      raw.includedInTier === 'plus' ||
      raw.includedInTier === 'premium' ||
      raw.includedInTier === 'pro' ||
      raw.includedInTier === 'business'
        ? raw.includedInTier
        : 'plus',
    featuresAr: Array.isArray(raw.featuresAr)
      ? raw.featuresAr.filter((x): x is string => typeof x === 'string')
      : ['تصميم معتمد متوافق مع كود QR القياسي'],
    featuresEn: Array.isArray(raw.featuresEn)
      ? raw.featuresEn.filter((x): x is string => typeof x === 'string')
      : ['ISO 18004 verified high-contrast QR frame'],
    recommendedForAr: Array.isArray(raw.recommendedForAr)
      ? raw.recommendedForAr.filter((x): x is string => typeof x === 'string')
      : ['الأغراض الشخصية'],
    recommendedForEn: Array.isArray(raw.recommendedForEn)
      ? raw.recommendedForEn.filter((x): x is string => typeof x === 'string')
      : ['Personal Belongings'],
    status: 'draft',
    isFree: Boolean(raw.isFree) || priceSar === 0,
    purchaseMode:
      raw.purchaseMode === 'single' || raw.purchaseMode === 'subscription' || raw.purchaseMode === 'both'
        ? raw.purchaseMode
        : 'both',
    customizationMode:
      raw.customizationMode === 'fixed' ||
      raw.customizationMode === 'mixed' ||
      raw.customizationMode === 'full'
        ? raw.customizationMode
        : 'mixed',
    allowEditAfterSave: Boolean(raw.allowEditAfterSave),
    maxCopies: typeof raw.maxCopies === 'number' && raw.maxCopies >= 1 ? raw.maxCopies : 5,
    createdAt: nowIso,
    updatedAt: nowIso,
    publishedAt: null,
  });

  return { valid: true, template: tpl };
}

export function getPeriodCutoffMs(
  period: '7d' | '30d' | '90d' | 'all',
  nowMs = Date.now()
): number {
  if (period === '7d') return nowMs - 7 * 24 * 60 * 60 * 1000;
  if (period === '30d') return nowMs - 30 * 24 * 60 * 60 * 1000;
  if (period === '90d') return nowMs - 90 * 24 * 60 * 60 * 1000;
  return 0;
}

export function computeAdminDashboardAnalytics(input: {
  period: '7d' | '30d' | '90d' | 'all';
  users: Array<{
    uid: string;
    plan: UserPlanTier;
    accountStatus: 'active' | 'suspended';
    createdAt: string;
  }>;
  items: RegisteredItem[];
  templates: TagDesignTemplate[];
  orders: ManagedPurchaseOrder[];
  subscriptions: SubscriptionRecord[];
  tickets: SupportTicket[];
  auditLogs: AdminAuditLogEntry[];
  activities: ActivityLogEntry[];
  nowMs?: number;
}): AdminDashboardAnalytics {
  const nowMs = input.nowMs ?? Date.now();
  const cutoff = getPeriodCutoffMs(input.period, nowMs);

  const inPeriod = (iso?: string | null) => {
    if (!iso) return cutoff === 0;
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? ms >= cutoff : cutoff === 0;
  };

  const newUsersInPeriod = input.users.filter((u) => inPeriod(u.createdAt)).length;
  const activeUsers = input.users.filter((u) => u.accountStatus === 'active').length;
  const suspendedUsers = input.users.filter((u) => u.accountStatus === 'suspended').length;

  const activeQrCodes = input.items.filter((i) => i.status !== 'Archived').length;
  const pausedQrCodes = input.items.filter((i) => i.status === 'Archived').length;
  const totalScans = input.items.reduce((acc, i) => acc + (i.totalScans || 0), 0);

  const publishedTemplates = input.templates.filter(
    (t) => (t.status || 'published') === 'published'
  ).length;
  const draftTemplates = input.templates.filter((t) => t.status === 'draft').length;
  const archivedTemplates = input.templates.filter((t) => t.status === 'archived').length;

  const ordersInPeriod = input.orders.filter((o) => inPeriod(o.createdAt));
  const approvedOrders = ordersInPeriod.filter((o) => o.status === 'approved');
  const pendingReviewOrders = input.orders.filter((o) => o.status === 'pending_review').length;

  const revenueSar = approvedOrders.reduce((acc, o) => acc + (o.amountSar || 0), 0);
  const revenueUsd = approvedOrders.reduce((acc, o) => acc + (o.amountUsd || 0), 0);

  const activeSubscriptions = input.subscriptions.filter((s) => s.status === 'active').length;
  const expiredSubscriptions = input.subscriptions.filter(
    (s) => s.status === 'expired' || s.status === 'cancelled'
  ).length;

  const openSupportTickets = input.tickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_user'
  ).length;

  // Build daily date-bucketed series across existing data dates (no invented numbers)
  const dayMap = new Map<
    string,
    { date: string; newUsers: number; newItems: number; revenueSar: number; ordersCount: number }
  >();
  const ensureDay = (dateStr: string) => {
    const key = dateStr.slice(0, 10);
    if (!key) return null;
    if (!dayMap.has(key)) {
      dayMap.set(key, { date: key, newUsers: 0, newItems: 0, revenueSar: 0, ordersCount: 0 });
    }
    return dayMap.get(key)!;
  };

  for (const u of input.users) {
    if (!inPeriod(u.createdAt)) continue;
    const bucket = ensureDay(u.createdAt);
    if (bucket) bucket.newUsers += 1;
  }
  for (const item of input.items) {
    if (!inPeriod(item.createdAt)) continue;
    const bucket = ensureDay(item.createdAt);
    if (bucket) bucket.newItems += 1;
  }
  for (const ord of ordersInPeriod) {
    const bucket = ensureDay(ord.createdAt);
    if (bucket) {
      bucket.ordersCount += 1;
      if (ord.status === 'approved') {
        bucket.revenueSar += ord.amountSar || 0;
      }
    }
  }

  const series = Array.from(dayMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const planCounts = new Map<UserPlanTier, number>();
  for (const u of input.users) {
    planCounts.set(u.plan, (planCounts.get(u.plan) || 0) + 1);
  }
  const planDistribution = Array.from(planCounts.entries()).map(([plan, usersCount]) => ({
    plan,
    usersCount,
  }));

  const usageByDesign = new Map<string, number>();
  for (const item of input.items) {
    usageByDesign.set(item.designId, (usageByDesign.get(item.designId) || 0) + 1);
  }

  const topTemplates = [...input.templates]
    .map((tpl) => ({
      id: tpl.id,
      titleAr: tpl.titleAr,
      titleEn: tpl.titleEn,
      salesCount: tpl.salesCount || 0,
      usageCount: usageByDesign.get(tpl.id) || tpl.usageCount || 0,
    }))
    .sort((a, b) => b.salesCount + b.usageCount - (a.salesCount + a.usageCount))
    .slice(0, 6);

  return {
    period: input.period,
    totals: {
      totalUsers: input.users.length,
      newUsersInPeriod,
      activeUsers,
      suspendedUsers,
      totalItems: input.items.length,
      activeQrCodes,
      pausedQrCodes,
      totalScans,
      publishedTemplates,
      draftTemplates,
      archivedTemplates,
      totalOrders: ordersInPeriod.length,
      approvedOrders: approvedOrders.length,
      pendingReviewOrders,
      revenueSar,
      revenueUsd,
      activeSubscriptions,
      expiredSubscriptions,
      openSupportTickets,
    },
    series,
    planDistribution,
    topTemplates,
    recentAdminLogs: [...input.auditLogs]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 12),
    recentUserActivities: [...input.activities]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 12),
  };
}

export function buildCsvString(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>): string {
  const escapeCell = (val: string | number | boolean | null | undefined): string => {
    let str = val === null || val === undefined ? '' : String(val);
    // Neutralize spreadsheet formula injection (=, +, -, @, tab, CR at start of cell)
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  return [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
}

export function getFreePlanAuthoritativeSpec(plans: ManagedPlanDefinition[]): {
  maxActiveItems: number;
  maxContactMethods: number;
} {
  const freePlan = plans.find((p) => p.quotaTier === 'Free' || p.quotaTier === 'Starter');
  return {
    maxActiveItems: freePlan ? freePlan.maxActiveItems : 2,
    maxContactMethods: freePlan ? freePlan.maxContactMethods : 2,
  };
}

export function computeLicenseExpiryIso(license: LicenseType, issuedAtIso: string): string | null {
  if (!license.durationDays || license.durationDays <= 0) return null;
  const baseMs = Date.parse(issuedAtIso);
  if (!Number.isFinite(baseMs)) return null;
  return new Date(baseMs + license.durationDays * 24 * 60 * 60 * 1000).toISOString();
}
