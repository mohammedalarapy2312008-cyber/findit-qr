import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCanonicalRoutePath,
  isWorkspaceRoutePath,
  parsePublicAndAppPathname,
} from './publicSiteRoutes';
import {
  normalizeContactMethodValue,
  resolveItemEffectiveContacts,
  validateContactMethodInput,
} from './contactMethodsLogic';
import {
  buildAiCoverPrompt,
  getFallbackCoverUrl,
  resolveEffectiveCover,
  selectBestCoverFromImages,
} from './aiCoverLogic';
import { evaluatePrintReadiness, PrintStudioSettings } from './printStudioLogic';
import { buildAnalyticsCsvReport, computeWorkspaceAnalytics } from './workspaceAnalytics';
import { buildFinderPublicView, isSafeMediaOrHttpsUrl } from './qrLogic';
import { INITIAL_TAG_DESIGNS } from '../data/foundationCatalog';
import { AccountContactMethod, RegisteredItem, WorkspacePageId } from '../types/domain';

test('all 21 user workspace routes parse and build cleanly with query params', () => {
  const requiredRoutes: WorkspacePageId[] = [
    'dashboard',
    'my-items',
    'add-item',
    'item-details',
    'groups',
    'group-details',
    'qr-manager',
    'qr-preview',
    'design-library',
    'template-details',
    'print-studio',
    'analytics',
    'plans',
    'contact-methods',
    'profile',
    'settings',
    'privacy-security',
    'notifications',
    'support',
    'support-faq',
    'support-tickets',
  ];

  for (const r of requiredRoutes) {
    assert.equal(isWorkspaceRoutePath(r), true, `Expected ${r} to be workspace route`);
    const canonical = buildCanonicalRoutePath(r);
    const parsed = parsePublicAndAppPathname(canonical);
    assert.equal(parsed.route, r, `Round-trip failed for ${r}`);
  }

  const groupUrl = buildCanonicalRoutePath('group-details', {
    groupId: 'grp-123',
    groupType: 'shared',
  });
  const [gPath, gSearch] = groupUrl.split('?');
  const parsedGroup = parsePublicAndAppPathname(gPath, `?${gSearch}`);
  assert.equal(parsedGroup.route, 'group-details');
  assert.equal(parsedGroup.groupId, 'grp-123');
  assert.equal(parsedGroup.groupType, 'shared');
});

test('centralized contact methods validate all 6 types, propagate edits, and block unauthorized exposure', () => {
  assert.equal(
    validateContactMethodInput({ type: 'phone', label: 'Primary Phone', value: '+966 55 123 4567' }).valid,
    true
  );
  assert.equal(
    validateContactMethodInput({ type: 'facebook', label: 'FB Profile', value: '@findituser' }).valid,
    true
  );
  assert.equal(
    normalizeContactMethodValue('facebook', '@findituser'),
    'https://facebook.com/findituser'
  );
  assert.equal(
    validateContactMethodInput({
      type: 'custom_link',
      label: 'Unsafe Link',
      value: 'javascript:alert(1)',
    }).valid,
    false
  );

  const directory: AccountContactMethod[] = [
    {
      id: 'cm-1',
      type: 'whatsapp',
      label: 'Work WhatsApp',
      value: '+966500001111',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cm-2',
      type: 'facebook',
      label: 'Personal Facebook',
      value: 'https://facebook.com/findit.owner',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cm-3',
      type: 'phone',
      label: 'Private Phone (Unselected)',
      value: '+966599999999',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const baseItem: RegisteredItem = {
    id: 'item-c1',
    ownerUid: 'u1',
    qrId: 'qr-c1',
    codeSerial: 'FIQ-TEST-01',
    name: 'Laptop',
    nameAr: 'لابتوب',
    nameEn: 'Laptop',
    category: 'electronics',
    imageUrl: '',
    coverUrl: '/api/media/covers/demo.png',
    selectedContactMethodIds: ['cm-1', 'cm-2'],
    status: 'Active',
    description: 'Silver laptop',
    descriptionAr: 'لابتوب فضي',
    descriptionEn: 'Silver laptop',
    recoveryInstructions: 'Please contact me',
    finderNoteAr: 'يرجى التواصل معي',
    finderNoteEn: 'Please contact me',
    rewardOffered: false,
    rewardAmountTextAr: '',
    rewardAmountTextEn: '',
    city: 'Riyadh',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    totalScans: 3,
    lastScanAt: '2026-05-01T10:00:00Z',
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
    designId: INITIAL_TAG_DESIGNS[0].id,
    contactChannels: {
      showPhone: false,
      showWhatsapp: true,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: false,
      customPhone: '',
      customWhatsapp: '+966500001111',
      customEmail: '',
      customTelegram: '',
      selectedMethodIds: ['cm-1', 'cm-2'],
    },
  };

  // Only cm-1 & cm-2 appear; cm-3 is strictly hidden
  const resolved = resolveItemEffectiveContacts({
    item: baseItem,
    ownerContactMethods: directory,
    contactMethodsLimit: 2,
  });
  assert.equal(resolved.visibleChannels.whatsapp, '+966500001111');
  assert.equal(resolved.visibleChannels.facebook, 'https://facebook.com/findit.owner');
  assert.equal(resolved.visibleChannels.phone, null);

  // Editing central method propagates immediately to public view
  directory[0].value = '+966511112222';
  const publicView = buildFinderPublicView(baseItem, undefined, {
    ownerContactMethods: directory,
    contactMethodsLimit: 2,
  });
  assert.equal(publicView.visibleChannels.whatsapp, '+966511112222');
  assert.equal(publicView.visibleChannels.phone, null);
  assert.equal(publicView.imageUrl, '/api/media/covers/demo.png');
});

test('AI covers auto-select highest quality landscape image and gracefully fall back when empty', () => {
  const best = selectBestCoverFromImages([
    { url: '/api/media/originals/low.jpg', width: 200, height: 600, fileName: 'blur.jpg' },
    { url: '/api/media/originals/hero.jpg', width: 1600, height: 1200, fileName: 'cover-front.jpg' },
  ]);
  assert.ok(best);
  assert.equal(best.url, '/api/media/originals/hero.jpg');

  const prompt = buildAiCoverPrompt({
    entityType: 'item',
    name: 'MacBook Pro 16',
    category: 'electronics',
  });
  assert.ok(prompt.includes('MacBook Pro 16'));
  assert.ok(prompt.includes('Midnight Teal'));

  const fallback = resolveEffectiveCover({ fallbackCategory: 'bags' });
  assert.equal(fallback.source, 'fallback');
  assert.equal(fallback.url, getFallbackCoverUrl('bags'));
  assert.equal(isSafeMediaOrHttpsUrl('/api/media/covers/abc-123.png'), true);
  assert.equal(isSafeMediaOrHttpsUrl('/api/media/../secret.txt'), false);
  assert.equal(isSafeMediaOrHttpsUrl('javascript:alert(1)'), false);
});

test('Print Studio preflight blocks export on low DPI, unlocked QR zone, shared-mode conflict, or locked template', () => {
  const freeTpl = INITIAL_TAG_DESIGNS.find((d) => d.priceSar === 0) || INITIAL_TAG_DESIGNS[0];
  const paidTpl = INITIAL_TAG_DESIGNS.find((d) => d.priceSar > 0) || INITIAL_TAG_DESIGNS[1];

  const baseSettings: PrintStudioSettings = {
    customCalloutText: 'SCAN TO RETURN',
    customSubLabel: 'FindIt QR',
    backgroundTintHex: '#0B1320',
    showFrameLayer: true,
    showCalloutLayer: true,
    showSerialLayer: true,
    qrZoneLocked: true,
    dpi: 300,
    bleedMm: 3,
    widthMm: 55,
    heightMm: 85,
    paperFormat: 'a4',
  };

  const activeItem: RegisteredItem = {
    id: 'item-p1',
    ownerUid: 'u1',
    qrId: 'qr-p1',
    codeSerial: 'FIQ-PRINT-01',
    name: 'Suitcase',
    nameAr: 'حقيبة سفر',
    nameEn: 'Suitcase',
    category: 'bags',
    imageUrl: '',
    status: 'Active',
    qrMode: 'individual',
    description: '',
    descriptionAr: '',
    descriptionEn: '',
    recoveryInstructions: 'Call me',
    finderNoteAr: 'اتصل بي',
    finderNoteEn: 'Call me',
    rewardOffered: false,
    rewardAmountTextAr: '',
    rewardAmountTextEn: '',
    city: 'Jeddah',
    cityAr: 'جدة',
    cityEn: 'Jeddah',
    totalScans: 0,
    lastScanAt: null,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    designId: freeTpl.id,
    contactChannels: {
      showPhone: false,
      showWhatsapp: false,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: true,
      customPhone: '',
      customWhatsapp: '',
      customEmail: '',
      customTelegram: '',
    },
  };

  const passReport = evaluatePrintReadiness({
    item: activeItem,
    template: freeTpl,
    settings: baseSettings,
    userPlan: 'Free',
    purchasedTemplateIds: new Set(),
  });
  assert.equal(passReport.canExportProduction, true);
  assert.equal(passReport.errorCount, 0);

  // Paid template without ownership blocks production export
  const lockedReport = evaluatePrintReadiness({
    item: activeItem,
    template: paidTpl,
    settings: baseSettings,
    userPlan: 'Free',
    purchasedTemplateIds: new Set(),
  });
  assert.equal(lockedReport.canExportProduction, false);
  assert.equal(lockedReport.hasOwnershipAccess, false);

  // Low DPI and unlocked QR zone block production export
  const lowDpiReport = evaluatePrintReadiness({
    item: activeItem,
    template: freeTpl,
    settings: { ...baseSettings, dpi: 150, qrZoneLocked: false },
    userPlan: 'Free',
    purchasedTemplateIds: new Set(),
  });
  assert.equal(lowDpiReport.canExportProduction, false);
  assert.ok(lowDpiReport.errorCount >= 2);

  // Shared QR item blocks individual sticker export
  const sharedReport = evaluatePrintReadiness({
    item: { ...activeItem, qrMode: 'shared', sharedQrGroupId: 'sg-1' },
    template: freeTpl,
    settings: baseSettings,
    userPlan: 'Free',
    purchasedTemplateIds: new Set(),
  });
  assert.equal(sharedReport.canExportProduction, false);
});

test('workspace analytics aggregates real scans and respects showCity privacy flag', () => {
  const summary = computeWorkspaceAnalytics({
    items: [
      {
        id: 'i1',
        ownerUid: 'u1',
        qrId: 'q1',
        codeSerial: 'FIQ-A1',
        name: 'Camera Bag',
        nameAr: 'حقيبة كاميرا',
        nameEn: 'Camera Bag',
        category: 'bags',
        imageUrl: '',
        status: 'Active',
        description: '',
        descriptionAr: '',
        descriptionEn: '',
        recoveryInstructions: 'Note',
        finderNoteAr: 'Note',
        finderNoteEn: 'Note',
        rewardOffered: false,
        rewardAmountTextAr: '',
        rewardAmountTextEn: '',
        city: 'Riyadh',
        cityAr: 'الرياض',
        cityEn: 'Riyadh',
        totalScans: 12,
        lastScanAt: '2026-05-10T10:00:00Z',
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-10T10:00:00Z',
        designId: INITIAL_TAG_DESIGNS[0].id,
        contactChannels: {
          showPhone: false,
          showWhatsapp: false,
          showEmail: false,
          showTelegram: false,
          anonymousRelayOnly: true,
          customPhone: '',
          customWhatsapp: '',
          customEmail: '',
          customTelegram: '',
        },
        privacySettings: {
          publicPageEnabled: true,
          showDescription: true,
          showImage: true,
          showCity: false,
          allowFinderMessages: true,
          allowFoundReports: true,
        },
      },
    ],
    groups: [],
    sharedQrGroups: [
      {
        id: 'sg1',
        ownerUid: 'u1',
        name: 'Travel Gear',
        shareCode: 'SQR-1111-2222',
        isActive: true,
        items: [{ itemId: 'i1', isVisible: true, addedAt: '2026-05-01T10:00:00Z' }],
        totalScans: 5,
        lastScanAt: '2026-05-11T10:00:00Z',
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-11T10:00:00Z',
      },
    ],
    messages: [],
    activities: [],
    timeframe: '30d',
    nowMs: Date.parse('2026-05-15T00:00:00Z'),
  });

  assert.equal(summary.totalCombinedScans, 17);
  // City hidden because item.privacySettings.showCity === false
  assert.equal(summary.coarseCityDistribution.length, 0);
  const csv = buildAnalyticsCsvReport(summary);
  assert.ok(csv.includes('FIQ-A1'));
});
