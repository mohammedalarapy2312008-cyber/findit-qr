import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCsvString,
  buildTemplateFromZipManifestItem,
  calculateDiscountedOrderTotals,
  canAccessTemplateByPlanOrPurchase,
  computeAdminDashboardAnalytics,
  enrichTemplateDefaults,
  getCustomizationCapabilities,
  hasAdminPermission,
  isSafeZipEntryPath,
  isSuperAdminEmailMatch,
  resolveEffectivePermissions,
  resolveEffectiveRole,
} from './adminLogic';
import { ALL_45_TAG_DESIGNS, CORE_FIVE_TEMPLATES } from '../data/designTemplates45';
import { CouponCode } from '../types/domain';

test('Super Admin email resolution is strict and never escalates arbitrary accounts', () => {
  assert.equal(isSuperAdminEmailMatch('Boss@FindIt.com', 'boss@findit.com'), true);
  assert.equal(isSuperAdminEmailMatch('user@findit.com', 'boss@findit.com'), false);
  assert.equal(isSuperAdminEmailMatch('user@findit.com', ''), false);

  assert.equal(resolveEffectiveRole('user', 'boss@findit.com', 'boss@findit.com'), 'super_admin');
  assert.equal(resolveEffectiveRole('super_admin', 'attacker@findit.com', 'boss@findit.com'), 'user');
  assert.equal(resolveEffectiveRole('staff_admin', 'staff@findit.com', 'boss@findit.com'), 'staff_admin');

  const staffPerms = resolveEffectivePermissions('staff_admin', ['users', 'support']);
  assert.equal(hasAdminPermission('staff_admin', staffPerms, 'users'), true);
  assert.equal(hasAdminPermission('staff_admin', staffPerms, 'security'), false);
  assert.equal(hasAdminPermission('super_admin', [], 'security'), true);
});

test('ZIP security validator rejects path traversal and executable/script payloads', () => {
  assert.equal(isSafeZipEntryPath('../evil.json').safe, false);
  assert.equal(isSafeZipEntryPath('/etc/passwd').safe, false);
  assert.equal(isSafeZipEntryPath('payload/script.js').safe, false);
  assert.equal(isSafeZipEntryPath('payload/shell.sh').safe, false);
  assert.equal(isSafeZipEntryPath('payload/xss.html').safe, false);

  assert.equal(isSafeZipEntryPath('templates/manifest.json').safe, true);
  assert.equal(isSafeZipEntryPath('templates/preview.svg').safe, true);
  assert.equal(isSafeZipEntryPath('__MACOSX/._manifest.json').safe, true);

  const built = buildTemplateFromZipManifestItem(
    {
      titleAr: 'قالب ZIP تجريبي',
      titleEn: 'ZIP Batch Test Tag',
      category: 'luggage_tag',
      priceSar: 40,
    },
    1
  );
  assert.equal(built.valid, true);
  assert.equal(built.template?.status, 'draft');
  assert.equal(built.template?.allowEditAfterSave, false);
});

test('45 templates enrich cleanly preserving all 5 core templates and 30/15 split', () => {
  const coreIds = new Set(CORE_FIVE_TEMPLATES.map((t) => t.id));
  const enriched = ALL_45_TAG_DESIGNS.map((t) => enrichTemplateDefaults(t, coreIds.has(t.id)));
  assert.equal(enriched.length, 45);
  assert.equal(enriched.filter((t) => t.isCoreProtected).length, 5);
  assert.equal(enriched.filter((t) => t.templateScope === 'general').length, 30);
  assert.equal(enriched.filter((t) => t.templateScope === 'specialized').length, 15);
  assert.equal(getCustomizationCapabilities('fixed').canChangeColor, false);
  assert.equal(getCustomizationCapabilities('mixed').canChangeColor, true);
  assert.equal(getCustomizationCapabilities('mixed').canUploadLogoOrAssets, false);
});

test('Coupon calculation and template access control respect scope, expiry, and single/both mode', () => {
  const coupon: CouponCode = {
    id: 'cp-1',
    code: 'SAVE20',
    discountType: 'percent',
    discountValue: 20,
    maxUses: 10,
    usedCount: 1,
    appliesTo: 'templates',
    expiresAt: null,
    isActive: true,
    createdAt: '2026-11-01T00:00:00Z',
  };

  const okDiscount = calculateDiscountedOrderTotals({
    subtotalSar: 100,
    subtotalUsd: 25,
    coupon,
    orderScope: 'templates',
  });
  assert.equal(okDiscount.amountSar, 80);
  assert.equal(okDiscount.amountUsd, 20);
  assert.equal(okDiscount.couponApplied, 'SAVE20');

  const wrongScope = calculateDiscountedOrderTotals({
    subtotalSar: 100,
    subtotalUsd: 25,
    coupon,
    orderScope: 'plans',
  });
  assert.equal(wrongScope.couponErrorCode, 'COUPON_WRONG_SCOPE');
  assert.equal(wrongScope.amountSar, 100);

  const singlePaid = enrichTemplateDefaults(ALL_45_TAG_DESIGNS[0], false);
  singlePaid.isFree = false;
  singlePaid.includedInTier = 'plus';
  singlePaid.purchaseMode = 'single';

  assert.equal(
    canAccessTemplateByPlanOrPurchase({
      template: singlePaid,
      userPlan: 'Pro',
      purchasedTemplateIds: new Set(),
    }),
    false
  );
  assert.equal(
    canAccessTemplateByPlanOrPurchase({
      template: singlePaid,
      userPlan: 'Free',
      purchasedTemplateIds: new Set([singlePaid.id]),
    }),
    true
  );
});

test('Analytics aggregator and CSV builder produce real deterministic outputs', () => {
  const result = computeAdminDashboardAnalytics({
    period: '30d',
    nowMs: Date.parse('2026-11-16T12:00:00Z'),
    users: [
      { uid: 'u1', plan: 'Free', accountStatus: 'active', createdAt: '2026-11-10T10:00:00Z' },
      { uid: 'u2', plan: 'Plus', accountStatus: 'suspended', createdAt: '2026-09-01T10:00:00Z' },
    ],
    items: [],
    templates: ALL_45_TAG_DESIGNS.map((t) => enrichTemplateDefaults(t, false)),
    orders: [
      {
        id: 'o1',
        orderNumber: 'ORD-1',
        userId: 'u2',
        userEmail: 'u2@test.com',
        userName: 'User 2',
        orderType: 'template_purchase',
        targetId: ALL_45_TAG_DESIGNS[0].id,
        titleAr: 'Test',
        titleEn: 'Test',
        quantity: 1,
        currency: 'SAR',
        subtotalSar: 45,
        subtotalUsd: 12,
        discountSar: 0,
        discountUsd: 0,
        amountSar: 45,
        amountUsd: 12,
        paymentMethod: 'manual_transfer',
        status: 'approved',
        createdAt: '2026-11-15T10:00:00Z',
        updatedAt: '2026-11-15T10:00:00Z',
      },
    ],
    subscriptions: [],
    tickets: [],
    auditLogs: [],
    activities: [],
  });

  assert.equal(result.totals.totalUsers, 2);
  assert.equal(result.totals.newUsersInPeriod, 1);
  assert.equal(result.totals.revenueSar, 45);
  assert.equal(result.totals.publishedTemplates, 45);

  const csv = buildCsvString(['Order', 'Amount'], [['ORD-1', 45]]);
  assert.equal(csv, 'Order,Amount\nORD-1,45');
});
