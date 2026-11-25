import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateQrMatrix,
  validateItemDraft,
  validateItemUpdate,
  validateProfileUpdate,
  validateAuthForm,
  buildFinderPublicView,
  filterAndSortItems,
  canAddOrReactivateItem,
  computeDashboardStats,
  countEnabledContactMethods,
  getPlanLimits,
  validateFinderMessageInput,
  buildQrRecoveryUrl,
  isSafeHttpsUrl,
  createUniqueSerialCode,
} from './qrLogic';
import { INITIAL_REGISTERED_ITEMS } from '../data/foundationCatalog';
import {
  BILLING_DURATION_OPTIONS,
  CANONICAL_PLANS,
  formatPlanDurationPrice,
} from '../data/plansCatalog';
import {
  ALL_45_TAG_DESIGNS,
  CORE_FIVE_TEMPLATES,
} from '../data/designTemplates45';
import { NewItemDraft, RegisteredItem } from '../types/domain';

test('generateQrMatrix generates valid 21x21 QR matrix with finder patterns', () => {
  const matrix = generateQrMatrix('FQR-TEST-9901', 21);
  assert.equal(matrix.length, 21);
  assert.equal(matrix[0].length, 21);

  assert.equal(matrix[0][0], true);
  assert.equal(matrix[0][6], true);
  assert.equal(matrix[6][0], true);
  assert.equal(matrix[6][6], true);
  assert.equal(matrix[3][3], true);

  assert.equal(matrix[0][14], true);
  assert.equal(matrix[0][20], true);
  assert.equal(matrix[14][0], true);
  assert.equal(matrix[20][0], true);
});

test('canAddOrReactivateItem enforces Free Plan 2 active items limit', () => {
  assert.equal(canAddOrReactivateItem(0, 2), true);
  assert.equal(canAddOrReactivateItem(1, 2), true);
  assert.equal(canAddOrReactivateItem(2, 2), false);
  assert.equal(canAddOrReactivateItem(3, 2), false);
});

test('getPlanLimits enforces tier maxActiveItems and maxContactMethods (Starter=2, Plus=3, Premium=5, Pro=7)', () => {
  assert.deepEqual(getPlanLimits('Free'), { maxActiveItems: 2, maxContactMethods: 2 });
  assert.deepEqual(getPlanLimits('Starter'), { maxActiveItems: 2, maxContactMethods: 2 });
  assert.deepEqual(getPlanLimits('Plus'), { maxActiveItems: 10, maxContactMethods: 3 });
  assert.deepEqual(getPlanLimits('Premium'), { maxActiveItems: 25, maxContactMethods: 5 });
  assert.deepEqual(getPlanLimits('Pro'), { maxActiveItems: 100, maxContactMethods: 7 });
});

test('countEnabledContactMethods counts independent active channels accurately', () => {
  assert.equal(
    countEnabledContactMethods({
      showPhone: true,
      showWhatsapp: true,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: false,
    }),
    2
  );
  assert.equal(
    countEnabledContactMethods({
      showPhone: true,
      showWhatsapp: true,
      showEmail: true,
      showTelegram: true,
      anonymousRelayOnly: false,
    }),
    4
  );
});

test('computeDashboardStats computes real Active, Lost, Found/Recovered, and Archived counts', () => {
  const sampleItems: RegisteredItem[] = [
    { ...INITIAL_REGISTERED_ITEMS[0], id: '1', status: 'Active', totalScans: 3 },
    { ...INITIAL_REGISTERED_ITEMS[0], id: '2', status: 'Lost', totalScans: 5 },
    { ...INITIAL_REGISTERED_ITEMS[0], id: '3', status: 'Found', totalScans: 2 },
    { ...INITIAL_REGISTERED_ITEMS[0], id: '4', status: 'Recovered', totalScans: 1 },
    { ...INITIAL_REGISTERED_ITEMS[0], id: '5', status: 'Archived', totalScans: 4 },
  ];

  const stats = computeDashboardStats(sampleItems);
  assert.equal(stats.activeCount, 4); // Non-archived items count toward active quota
  assert.equal(stats.lostCount, 1);
  assert.equal(stats.foundOrRecoveredCount, 2);
  assert.equal(stats.archivedCount, 1);
  assert.equal(stats.totalCount, 5);
});

test('validateItemDraft enforces required fields, channel rules, Free Plan quota (2), and contact methods limit', () => {
  const invalidDraft: NewItemDraft = {
    name: 'A',
    category: 'electronics',
    description: 'tiny',
    imageUrl: 'invalid-url',
    finderNote: 'tiny',
    city: 'Riyadh',
    rewardOffered: true,
    rewardAmountText: '',
    designId: 'design-classic-navy',
    showPhone: false,
    showWhatsapp: false,
    showEmail: false,
    showTelegram: false,
    anonymousRelayOnly: false,
    customPhone: '',
    customWhatsapp: '',
    customEmail: '',
    customTelegram: '',
  };

  const res1 = validateItemDraft(invalidDraft, { activeItemsCount: 2, activeItemsLimit: 2 });
  assert.equal(res1.valid, false);
  assert.equal(res1.errors.quota, 'QUOTA_LIMIT_REACHED');
  assert.equal(res1.errors.name, 'ITEM_NAME_LENGTH');
  assert.equal(res1.errors.description, 'ITEM_DESC_LENGTH');
  assert.equal(res1.errors.finderNote, 'FINDER_NOTE_REQUIRED');
  assert.equal(res1.errors.channels, 'AT_LEAST_ONE_CHANNEL_REQUIRED');
  assert.equal(res1.errors.imageUrl, 'INVALID_IMAGE_URL');

  const validDraft: NewItemDraft = {
    ...invalidDraft,
    name: 'Sony A7IV Camera',
    description: 'Black mirrorless camera with 24-70mm lens',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
    finderNote: 'Please contact me via WhatsApp to arrange return.',
    rewardOffered: false,
    showWhatsapp: true,
    customWhatsapp: '+966501112233',
  };

  const res2 = validateItemDraft(validDraft, { activeItemsCount: 1, activeItemsLimit: 2, contactMethodsLimit: 2 });
  assert.equal(res2.valid, true);
  assert.deepEqual(res2.errors, {});

  // Exceeding Starter/Free contactMethodsLimit (3 enabled when limit is 2)
  const overContactLimitDraft: NewItemDraft = {
    ...validDraft,
    showPhone: true,
    customPhone: '+966501112233',
    showEmail: true,
    customEmail: 'owner@finditqr.com',
  };
  const res3 = validateItemDraft(overContactLimitDraft, {
    activeItemsCount: 1,
    activeItemsLimit: 2,
    contactMethodsLimit: 2,
  });
  assert.equal(res3.valid, false);
  assert.equal(res3.errors.channels, 'CONTACT_LIMIT_EXCEEDED');

  // Same 3 channels allowed on Plus plan (contactMethodsLimit: 3)
  const res4 = validateItemDraft(overContactLimitDraft, {
    activeItemsCount: 1,
    activeItemsLimit: 10,
    contactMethodsLimit: 3,
  });
  assert.equal(res4.valid, true);
});

test('validateFinderMessageInput validates message length, honeypot spam, and optional sender contact', () => {
  const tooShort = validateFinderMessageInput({ message: 'Hi' });
  assert.equal(tooShort.valid, false);
  assert.equal(tooShort.errors.message, 'MESSAGE_TOO_SHORT');

  const validMsg = validateFinderMessageInput({
    message: 'I found your bag at the airport gate B12.',
    senderContact: '+966501234567',
  });
  assert.equal(validMsg.valid, true);

  const spamMsg = validateFinderMessageInput({
    message: 'I found your bag at the airport gate B12.',
    honeypot: 'bot-filled-value',
  });
  assert.equal(spamMsg.valid, false);
  assert.equal(spamMsg.errors.spam, 'SPAM_DETECTED');
});

test('validateAuthForm validates login, registration, and password reset inputs', () => {
  const badLogin = validateAuthForm({ email: 'not-an-email', password: '123' }, 'login');
  assert.equal(badLogin.valid, false);
  assert.equal(badLogin.errors.email, 'INVALID_EMAIL');
  assert.equal(badLogin.errors.password, 'PASSWORD_TOO_SHORT');

  const goodRegister = validateAuthForm(
    {
      email: 'user@finditqr.com',
      password: 'SecurePass123',
      fullName: 'Tariq Al-Mansour',
      country: 'Saudi Arabia',
      acceptTerms: true,
    },
    'register'
  );
  assert.equal(goodRegister.valid, true);

  const goodReset = validateAuthForm({ email: 'user@finditqr.com' }, 'reset');
  assert.equal(goodReset.valid, true);
});

test('buildFinderPublicView respects privacy settings and Archived state', () => {
  const sampleItem = INITIAL_REGISTERED_ITEMS[0];
  const publicView = buildFinderPublicView(sampleItem);
  assert.equal(publicView.serialNumber, sampleItem.codeSerial);
  assert.equal(publicView.isContactEnabled, true);
  assert.equal(publicView.visibleChannels.whatsapp, sampleItem.contactChannels.customWhatsapp);

  const archivedItem: RegisteredItem = {
    ...sampleItem,
    status: 'Archived',
  };
  const archivedView = buildFinderPublicView(archivedItem);
  assert.equal(archivedView.isContactEnabled, false);
  assert.equal(archivedView.visibleChannels.phone, null);
  assert.equal(archivedView.visibleChannels.whatsapp, null);
});

test('filterAndSortItems filters by query, category, status, and sorts by newest/oldest/name/updated', () => {
  const items: RegisteredItem[] = [
    {
      ...INITIAL_REGISTERED_ITEMS[0],
      id: 'item-a',
      name: 'Alpha Laptop',
      nameAr: 'Alpha Laptop',
      nameEn: 'Alpha Laptop',
      status: 'Active',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-02T10:00:00.000Z',
    },
    {
      ...INITIAL_REGISTERED_ITEMS[1],
      id: 'item-b',
      name: 'Zeta Keys',
      nameAr: 'Zeta Keys',
      nameEn: 'Zeta Keys',
      status: 'Lost',
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-05T10:00:00.000Z',
    },
    {
      ...INITIAL_REGISTERED_ITEMS[2],
      id: 'item-c',
      name: 'Beta Wallet',
      nameAr: 'Beta Wallet',
      nameEn: 'Beta Wallet',
      status: 'Archived',
      createdAt: '2026-01-15T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    },
  ];

  const byNewest = filterAndSortItems(items, '', 'all', 'all', 'newest');
  assert.equal(byNewest[0].id, 'item-b');

  const byOldest = filterAndSortItems(items, '', 'all', 'all', 'oldest');
  assert.equal(byOldest[0].id, 'item-a');

  const byName = filterAndSortItems(items, '', 'all', 'all', 'name');
  assert.equal(byName[0].id, 'item-a');
  assert.equal(byName[1].id, 'item-c');
  assert.equal(byName[2].id, 'item-b');

  const byUpdated = filterAndSortItems(items, '', 'all', 'all', 'updated');
  assert.equal(byUpdated[0].id, 'item-c');

  const onlyArchived = filterAndSortItems(items, '', 'all', 'Archived', 'newest');
  assert.equal(onlyArchived.length, 1);
  assert.equal(onlyArchived[0].id, 'item-c');
});

test('buildQrRecoveryUrl generates canonical recovery route with safe encoding', () => {
  assert.equal(
    buildQrRecoveryUrl('FQR-2026-0001', 'https://finditqr.app'),
    'https://finditqr.app/found/FQR-2026-0001'
  );
  assert.equal(
    buildQrRecoveryUrl(' FQR SPACE ', 'http://localhost:3000'),
    'http://localhost:3000/found/FQR%20SPACE'
  );
});

test('CANONICAL_PLANS and BILLING_DURATION_OPTIONS expose exact 4 plans and 3 durations', () => {
  assert.deepEqual(
    CANONICAL_PLANS.map((p) => p.nameEn),
    ['Starter / Free', 'Plus', 'Premium', 'Pro']
  );
  assert.deepEqual(
    CANONICAL_PLANS.map((p) => ({ items: p.maxActiveItems, contacts: p.maxContactMethods })),
    [
      { items: 2, contacts: 2 },
      { items: 10, contacts: 3 },
      { items: 25, contacts: 5 },
      { items: 100, contacts: 7 },
    ]
  );
  assert.deepEqual(
    BILLING_DURATION_OPTIONS.map((d) => ({ id: d.id, months: d.months })),
    [
      { id: '1m', months: 1 },
      { id: '3m', months: 3 },
      { id: '12m', months: 12 },
    ]
  );

  const plus = CANONICAL_PLANS[1];
  const p1m = formatPlanDurationPrice(plus, '1m', 'en');
  const p3m = formatPlanDurationPrice(plus, '3m', 'en');
  const p12m = formatPlanDurationPrice(plus, '12m', 'en');
  assert.equal(p1m.totalSar, 19);
  assert.equal(p3m.totalSar, 57);
  assert.equal(p12m.totalSar, 228);

  const freePlan = CANONICAL_PLANS[0];
  assert.equal(formatPlanDurationPrice(freePlan, '12m', 'ar').totalSar, 0);
});

test('ALL_45_TAG_DESIGNS preserves 5 core templates and delivers 30 general + 15 specialized = 45 unique templates', () => {
  assert.equal(ALL_45_TAG_DESIGNS.length, 45);
  assert.equal(CORE_FIVE_TEMPLATES.length, 5);

  const general = ALL_45_TAG_DESIGNS.filter((d) => d.templateScope === 'general');
  const specialized = ALL_45_TAG_DESIGNS.filter((d) => d.templateScope === 'specialized');
  assert.equal(general.length, 30);
  assert.equal(specialized.length, 15);

  const ids = new Set(ALL_45_TAG_DESIGNS.map((d) => d.id));
  const slugs = new Set(ALL_45_TAG_DESIGNS.map((d) => d.slug));
  assert.equal(ids.size, 45);
  assert.equal(slugs.size, 45);

  for (const coreId of [
    'design-luggage-pro',
    'design-epoxy-tech',
    'design-coral-keyfob',
    'design-pet-guardian',
    'design-enterprise-plate',
  ]) {
    assert.equal(ids.has(coreId), true, `Missing preserved template ${coreId}`);
  }
});

test('isSafeHttpsUrl accepts empty or valid https URLs and rejects unsafe schemes or whitespace', () => {
  assert.equal(isSafeHttpsUrl(''), true);
  assert.equal(isSafeHttpsUrl('https://images.unsplash.com/photo-1516035069371-29a1b244cc32'), true);
  assert.equal(isSafeHttpsUrl('http://example.com/photo.jpg'), false);
  assert.equal(isSafeHttpsUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpsUrl('data:image/png;base64,abc'), false);
  assert.equal(isSafeHttpsUrl('https://bad url with spaces.com'), false);
  assert.equal(isSafeHttpsUrl('https://'), false);
});

test('validateItemUpdate and validateProfileUpdate enforce strict input and URL validation', () => {
  const badItemPatch = validateItemUpdate(
    {
      name: 'A',
      description: 'no',
      imageUrl: 'javascript:alert(1)',
      status: 'InvalidStatus' as any,
      category: 'unknown' as any,
      contactChannels: {
        showPhone: true,
        showWhatsapp: true,
        showEmail: true,
        showTelegram: false,
        anonymousRelayOnly: false,
        customPhone: '+966501',
        customWhatsapp: '+966502',
        customEmail: 'bad-email',
        customTelegram: '',
      },
    },
    2
  );
  assert.equal(badItemPatch.valid, false);
  assert.equal(badItemPatch.errors.name, 'ITEM_NAME_LENGTH');
  assert.equal(badItemPatch.errors.description, 'ITEM_DESC_LENGTH');
  assert.equal(badItemPatch.errors.imageUrl, 'INVALID_IMAGE_URL');
  assert.equal(badItemPatch.errors.status, 'INVALID_STATUS');
  assert.equal(badItemPatch.errors.category, 'INVALID_CATEGORY');
  assert.equal(badItemPatch.errors.channels, 'CONTACT_LIMIT_EXCEEDED');
  assert.equal(badItemPatch.errors.customEmail, 'INVALID_EMAIL_FORMAT');

  const badProfile = validateProfileUpdate({
    displayName: 'A',
    photoURL: 'http://insecure.com/avatar.png',
  });
  assert.equal(badProfile.valid, false);
  assert.equal(badProfile.errors.displayName, 'FULL_NAME_REQUIRED');
  assert.equal(badProfile.errors.photoURL, 'INVALID_PHOTO_URL');

  const goodProfile = validateProfileUpdate({
    displayName: 'Tariq Al-Mansour',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    preferredLanguage: 'ar',
  });
  assert.equal(goodProfile.valid, true);
});

test('createUniqueSerialCode retries deterministically to prevent serial collisions', () => {
  const existing = ['FQR-1000-AAAA', 'fqr-1000-aaaa'];
  // Deterministic generator produces AAAA first (num=1000, suffix indices=[0,0,0,0]), then BBBB
  const sequence = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
  let idx = 0;
  const serial = createUniqueSerialCode(existing, () => sequence[idx++] ?? 2);
  assert.equal(serial, 'FQR-1001-BBBB');
  assert.notEqual(serial.toUpperCase(), existing[0]);
});

test('buildQrRecoveryUrl dynamically uses window.location.origin when baseOrigin is omitted', () => {
  const originalWindow = (globalThis as any).window;
  try {
    (globalThis as any).window = {
      location: { origin: 'https://ais-dev-example.run.app/' },
    };
    assert.equal(
      buildQrRecoveryUrl('FQR-7721-DXB'),
      'https://ais-dev-example.run.app/found/FQR-7721-DXB'
    );
  } finally {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
  }
});


