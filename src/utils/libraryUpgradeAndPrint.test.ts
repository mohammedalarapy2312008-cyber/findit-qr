import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_TAG_DESIGNS } from '../data/foundationCatalog';
import { DEFAULT_ITEM_PRIVACY_SETTINGS, RegisteredItem } from '../types/domain';
import {
  auditTemplateLibraryCatalog,
  filterAndSortLibraryTemplates,
  getIssuedPurchasedTemplateIdSet,
  getRealTemplatePrintSpecsSummary,
  getTemplateOwnershipStatus,
  summarizeLibraryOwnership,
} from './templateLibraryAudit';
import {
  buildBatchPrintSheetSvg,
  computeBatchPrintSheetLayout,
  parseTemplateDimensionsMm,
  scopeNestedSvgIds,
} from './printSheetLayout';

const verifyPublicAssetOnDisk = (publicRelativeUrl: string): boolean => {
  const cleanRel = publicRelativeUrl.replace(/^\/+/, '');
  const fullPath = path.resolve(process.cwd(), 'public', cleanRel);
  if (!fs.existsSync(fullPath)) return false;
  const stat = fs.statSync(fullPath);
  return stat.isFile() && stat.size > 1000;
};

test('58-Template Comprehensive Audit: preserves 58 active (5 free, 53 paid) & passes all technical checks', () => {
  const report = auditTemplateLibraryCatalog(
    INITIAL_TAG_DESIGNS,
    verifyPublicAssetOnDisk
  );

  assert.equal(report.totalActive, 58);
  assert.equal(report.freeCount, 5);
  assert.equal(report.paidCount, 53);
  assert.equal(report.summary.complete, 58);
  assert.equal(report.summary.needs_showcase, 0);
  assert.equal(report.summary.needs_file_fix, 0);
  assert.equal(report.summary.needs_qr_calibration, 0);
  assert.equal(report.summary.needs_print_review, 0);

  const archCounts = report.items.reduce(
    (acc, item) => {
      acc[item.architecture] = (acc[item.architecture] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  assert.equal(archCounts.master33, 33);
  assert.equal(archCounts.batch02, 8);
  assert.equal(archCounts.pilot_vector, 17);
});

test('Library Ownership Filters & Sorting: filters owned vs unowned, anime_cartoon, and purchased licenses cleanly', () => {
  const paidSample = INITIAL_TAG_DESIGNS.find((d) => !d.isFree && d.priceSar > 0);
  assert.ok(paidSample, 'Expected at least one paid template in catalog');

  const emptyPurchased = new Set<string>();
  const freeUserSummary = summarizeLibraryOwnership({
    templates: INITIAL_TAG_DESIGNS,
    userPlan: 'Free',
    purchasedTemplateIds: emptyPurchased,
  });

  assert.equal(freeUserSummary.freeCount, 5);
  assert.equal(freeUserSummary.paidCount, 53);
  assert.equal(freeUserSummary.ownedCount, 5);
  assert.equal(freeUserSummary.unownedCount, 53);

  const purchasedSet = getIssuedPurchasedTemplateIdSet([
    {
      templateId: paidSample.id,
      status: 'active',
      expiresAt: null,
    },
    {
      templateId: 'des-expired-ignore',
      status: 'active',
      expiresAt: '2020-01-01T00:00:00.000Z',
    },
  ]);
  assert.equal(purchasedSet.has(paidSample.id), true);
  assert.equal(purchasedSet.has('des-expired-ignore'), false);

  assert.equal(
    getTemplateOwnershipStatus({
      template: paidSample,
      userPlan: 'Free',
      purchasedTemplateIds: purchasedSet,
    }),
    'purchased'
  );

  const ownedList = filterAndSortLibraryTemplates(INITIAL_TAG_DESIGNS, {
    ownershipFilter: 'owned',
    userPlan: 'Free',
    purchasedTemplateIds: purchasedSet,
    sortBy: 'popular',
  });
  assert.equal(ownedList.length, 6);
  assert.ok(ownedList.some((d) => d.id === paidSample.id));

  const animeList = filterAndSortLibraryTemplates(INITIAL_TAG_DESIGNS, {
    domain: 'anime_cartoon',
    ownershipFilter: 'all',
    userPlan: 'Free',
    purchasedTemplateIds: emptyPurchased,
    sortBy: 'newest',
  });
  assert.equal(animeList.length, 26);

  const specs = getRealTemplatePrintSpecsSummary(paidSample, 'en');
  assert.ok(specs.some((s) => s.label === 'Trim Dimensions' && s.value === paidSample.dimensionsMm));
});

test('Batch Print Sheet Engine: packs mixed-size items + multiple copies onto collision-free A4 SVG sheets', () => {
  const activeDesigns = INITIAL_TAG_DESIGNS.filter((d) => (d.status || 'published') === 'published');
  const d1 = activeDesigns[0];
  const d2 = activeDesigns[8];
  const d3 = activeDesigns[15];

  const makeItem = (id: string, name: string, serial: string, designId: string): RegisteredItem => ({
    id,
    ownerUid: 'user-1',
    qrId: `qr-${id}`,
    name,
    nameAr: name,
    nameEn: name,
    category: 'electronics',
    groupId: 'grp-1',
    description: 'Test item',
    descriptionAr: 'Test item',
    descriptionEn: 'Test item',
    recoveryInstructions: 'Scan to return',
    finderNoteAr: 'امسح للعودة',
    finderNoteEn: 'Scan to return',
    rewardOffered: false,
    rewardAmountTextAr: '',
    rewardAmountTextEn: '',
    city: 'Riyadh',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    imageUrl: '',
    status: 'Active',
    codeSerial: serial,
    designId,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    lastScanAt: null,
    totalScans: 0,
    contactChannels: {
      showPhone: true,
      showWhatsapp: true,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: false,
      customPhone: '+966500000001',
      customWhatsapp: '+966500000001',
      customEmail: '',
      customTelegram: '',
    },
    privacySettings: { ...DEFAULT_ITEM_PRIVACY_SETTINGS },
  });

  const i1 = makeItem('it-1', 'MacBook Pro', 'FIQ-BATCH-001', d1.id);
  const i2 = makeItem('it-2', 'Passport Wallet', 'FIQ-BATCH-002', d2.id);
  const i3 = makeItem('it-3', 'Travel Suitcase', 'FIQ-BATCH-003', d3.id);

  const dims = parseTemplateDimensionsMm(d1, 'clean');
  assert.ok(dims.widthMm > 10 && dims.heightMm > 10);

  const plan = computeBatchPrintSheetLayout({
    queue: [
      { item: i1, design: d1, copies: 4 },
      { item: i2, design: d2, copies: 4 },
      { item: i3, design: d3, copies: 4 },
    ],
    paperFormat: 'A4',
    mode: 'clean',
    scalePercent: 100,
    baseOrigin: 'https://finditqr.com',
  });

  assert.equal(plan.totalStickers, 12);
  assert.ok(plan.pages.length >= 1);

  // Verify zero bounding-box overlap on every generated sheet page
  for (const page of plan.pages) {
    for (let a = 0; a < page.length; a++) {
      const boxA = page[a];
      assert.ok(boxA.xMm >= 10 && boxA.xMm + boxA.widthMm <= 200.5);
      assert.ok(boxA.yMm >= 10 && boxA.yMm + boxA.heightMm <= 287.5);
      for (let b = a + 1; b < page.length; b++) {
        const boxB = page[b];
        const overlapsX = boxA.xMm < boxB.xMm + boxB.widthMm && boxA.xMm + boxA.widthMm > boxB.xMm;
        const overlapsY = boxA.yMm < boxB.yMm + boxB.heightMm && boxA.yMm + boxA.heightMm > boxB.yMm;
        assert.equal(
          overlapsX && overlapsY,
          false,
          `Detected overlap between ${boxA.placementId} and ${boxB.placementId}`
        );
      }
    }
  }

  const sheetSvg = buildBatchPrintSheetSvg({
    pagePlacements: plan.pages[0],
    paper: plan.paper,
    showCutMarks: true,
    showItemLabels: true,
    pageNumber: 1,
    totalPages: plan.pages.length,
  });

  assert.ok(sheetSvg.includes('width="210mm" height="297mm"'));
  assert.ok(sheetSvg.includes('FIQ-BATCH-001'));
  assert.ok(sheetSvg.includes('id="placed-sticker-0"'));
  assert.ok(sheetSvg.includes('text-anchor="start" direction="ltr" unicode-bidi="plaintext"'));

  const scopedTest = scopeNestedSvgIds('<svg><defs><linearGradient id="g1"/></defs><rect fill="url(#g1)"/></svg>', 's9');
  assert.ok(scopedTest.includes('id="s9_g1"') && scopedTest.includes('url(#s9_g1)'));
});
