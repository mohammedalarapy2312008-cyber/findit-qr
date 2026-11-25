import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_TAG_DESIGNS } from '../data/foundationCatalog';
import { LIBRARY_SHOWCASE_REGISTRY } from '../data/libraryShowcaseRegistry';
import {
  canAccessTemplateByPlanOrPurchase,
} from './adminLogic';
import {
  buildPilotCleanTrimSvg,
  buildPilotEditableSvg,
  buildPilotPrintReadySvg,
} from './pilotLabelArtwork';
import {
  buildBatchPrintSheetSvg,
  computeBatchPrintSheetLayout,
} from './printSheetLayout';
import {
  getActiveCatalogTemplates,
  isTemplateFree,
  summarizeActiveCatalogBreakdown,
} from './templateDiscovery';
import {
  auditTemplateLibraryCatalog,
  filterAndSortLibraryTemplates,
  getIssuedPurchasedTemplateIdSet,
  getTemplateOwnershipStatus,
  summarizeLibraryOwnership,
} from './templateLibraryAudit';
import { composeItemTemplateDesignSvg } from './templateQrCompositor';
import type { IssuedLicense } from '../types/domain';

const PUBLIC_ROOT = path.resolve(process.cwd(), 'public');

test('Phase 1 Audit: 58 active templates, 0 duplicate IDs, 5 free, 53 paid, 6 domain categories', () => {
  const active = getActiveCatalogTemplates(INITIAL_TAG_DESIGNS);
  assert.equal(active.length, 58, 'Must preserve exactly 58 active templates');

  const ids = new Set(active.map((t) => t.id));
  assert.equal(ids.size, 58, 'Every active template must have a unique ID');

  const breakdown = summarizeActiveCatalogBreakdown(INITIAL_TAG_DESIGNS);
  assert.equal(breakdown.activeTotal, 58);
  assert.equal(breakdown.freeTotal, 5);
  assert.equal(breakdown.premiumTotal, 53);

  const domains = new Set(active.map((t) => t.domainCategory));
  for (const expected of ['personal', 'travel', 'family', 'pets', 'business', 'anime_cartoon']) {
    assert.ok(domains.has(expected as never), `Missing domain category ${expected}`);
  }

  for (const tpl of active) {
    assert.ok(tpl.titleAr.trim().length >= 2, `Missing Arabic title on ${tpl.id}`);
    assert.ok(tpl.titleEn.trim().length >= 2, `Missing English title on ${tpl.id}`);
    assert.ok(tpl.dimensionsMm.trim().length >= 3, `Missing dimensionsMm on ${tpl.id}`);
    assert.ok(tpl.weatherproofRating.trim().length >= 2, `Missing weatherproofRating on ${tpl.id}`);
    assert.ok(tpl.materialAr.trim().length >= 2, `Missing materialAr on ${tpl.id}`);
    assert.ok(tpl.materialEn.trim().length >= 2, `Missing materialEn on ${tpl.id}`);
    if (isTemplateFree(tpl)) {
      assert.equal(tpl.priceSar, 0, `Free template ${tpl.id} must have priceSar === 0`);
      assert.equal(tpl.priceUsd, 0, `Free template ${tpl.id} must have priceUsd === 0`);
    } else {
      assert.ok(tpl.priceSar > 0, `Paid template ${tpl.id} must have priceSar > 0`);
      assert.ok(tpl.priceUsd > 0, `Paid template ${tpl.id} must have priceUsd > 0`);
    }
  }
});

test('Phase 1 Audit: All 232 showcase images (58 × 4) and static production files exist on disk', () => {
  const active = getActiveCatalogTemplates(INITIAL_TAG_DESIGNS);
  let totalShowcaseFiles = 0;

  for (const tpl of active) {
    const gallery = tpl.showcaseGallery;
    assert.ok(gallery, `Template ${tpl.id} missing showcaseGallery`);
    const urls = [
      gallery.mockup3dUrl,
      gallery.onProductUrl,
      gallery.closeupUrl,
      gallery.lifestyleUrl,
    ];
    for (const u of urls) {
      assert.ok(u && u.startsWith('/assets/showcase-gallery/'), `Invalid showcase URL on ${tpl.id}: ${u}`);
      const diskPath = path.join(PUBLIC_ROOT, u.replace(/^\//, ''));
      assert.ok(fs.existsSync(diskPath), `Missing showcase file on disk: ${diskPath}`);
      const stat = fs.statSync(diskPath);
      assert.ok(stat.size > 5_000, `Showcase file suspiciously small (${stat.size}B): ${diskPath}`);
      totalShowcaseFiles += 1;
    }

    if (tpl.originalDesignUrl?.startsWith('/assets/')) {
      const origPath = path.join(PUBLIC_ROOT, tpl.originalDesignUrl.replace(/^\//, ''));
      assert.ok(fs.existsSync(origPath), `Missing original design SVG on disk: ${origPath}`);
    }
    if (tpl.printFileUrl?.startsWith('/assets/')) {
      const printPath = path.join(PUBLIC_ROOT, tpl.printFileUrl.replace(/^\//, ''));
      assert.ok(fs.existsSync(printPath), `Missing print-ready SVG on disk: ${printPath}`);
    }
  }

  assert.equal(totalShowcaseFiles, 232, 'Must verify all 232 showcase images (58 × 4)');

  const audit = auditTemplateLibraryCatalog(active);
  assert.equal(audit.summary.complete, 58);
  assert.equal(audit.summary.needs_showcase, 0);
  assert.equal(audit.summary.needs_file_fix, 0);
  assert.equal(audit.summary.needs_qr_calibration, 0);
  assert.equal(audit.summary.needs_print_review, 0);
});

test('Phase 1 Regression: All 58 active templates are covered in LIBRARY_SHOWCASE_REGISTRY and pilotShowcaseMedia.ts keys match catalog IDs', () => {
  const active = getActiveCatalogTemplates(INITIAL_TAG_DESIGNS);
  for (const tpl of active) {
    assert.ok(
      LIBRARY_SHOWCASE_REGISTRY[tpl.id],
      `Template ${tpl.id} missing from LIBRARY_SHOWCASE_REGISTRY`
    );
  }

  const pilotMediaSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/data/pilotShowcaseMedia.ts'),
    'utf8'
  );
  // Ensure the 3 previously mismatched legacy keys are fixed to real catalog IDs
  assert.ok(pilotMediaSource.includes("'pilot-kids-safetag':"), 'pilot-kids-safetag key must exist');
  assert.ok(pilotMediaSource.includes("'pilot-pet-guardian':"), 'pilot-pet-guardian key must exist');
  assert.ok(pilotMediaSource.includes("'pilot-business-asset':"), 'pilot-business-asset key must exist');
  assert.equal(pilotMediaSource.includes("'pilot-kiddo-family':"), false, 'Stale key pilot-kiddo-family must be removed');
  assert.equal(pilotMediaSource.includes("'pilot-paw-pets':"), false, 'Stale key pilot-paw-pets must be removed');
  assert.equal(pilotMediaSource.includes("'pilot-progrid-business':"), false, 'Stale key pilot-progrid-business must be removed');
});

test('Phase 1 Regression: ProGrid ISO SVG callout fits inside left info box without QR quiet zone overlap', () => {
  const progrid = INITIAL_TAG_DESIGNS.find((d) => d.id === 'pilot-business-asset');
  assert.ok(progrid, 'pilot-business-asset must exist');

  const cleanSvg = buildPilotCleanTrimSvg(progrid, { serialCode: 'FQR-ASSET-001' });
  const editableSvg = buildPilotEditableSvg(progrid, { serialCode: 'FQR-ASSET-001' });
  const printSvg = buildPilotPrintReadySvg(progrid, { serialCode: 'FQR-ASSET-001' });

  for (const [label, svg] of [
    ['clean', cleanSvg],
    ['editable', editableSvg],
    ['print', printSvg],
  ] as const) {
    assert.ok(
      svg.includes('PROPERTY ASSET · SCAN TO RETURN'),
      `${label} SVG must preserve complete callout text`
    );
    assert.ok(
      svg.includes('font-size="1.52"'),
      `${label} SVG must use calibrated font-size 1.52 to prevent QR frame collision`
    );
  }
});

test('Phase 1 Ownership: Free vs Paid filtering, independent purchase survival after subscription expiry', () => {
  const active = getActiveCatalogTemplates(INITIAL_TAG_DESIGNS);
  const freeTpl = active.find((t) => t.id === 'master-04-heritage-compass')!;
  const paidTpl = active.find((t) => t.id === 'pilot-business-asset')!;
  const animePaidTpl = active.find((t) => t.id === 'master-21-goku-dragon-ball')!;
  assert.ok(freeTpl && paidTpl && animePaidTpl);

  // 1. Free user with no purchases
  const noPurchases = new Set<string>();
  assert.equal(
    canAccessTemplateByPlanOrPurchase({
      template: freeTpl,
      userPlan: 'Free',
      purchasedTemplateIds: noPurchases,
    }),
    true
  );
  assert.equal(
    canAccessTemplateByPlanOrPurchase({
      template: paidTpl,
      userPlan: 'Free',
      purchasedTemplateIds: noPurchases,
    }),
    false
  );
  assert.equal(
    getTemplateOwnershipStatus({
      template: paidTpl,
      userPlan: 'Free',
      purchasedTemplateIds: noPurchases,
    }),
    'locked'
  );

  // 2. Independent paid purchase issued with expiresAt = null (permanent license)
  const licenses: IssuedLicense[] = [
    {
      id: 'lic-perm-1',
      licenseNumber: 'LIC-2026-0001',
      userId: 'usr-1',
      userEmail: 'buyer@example.com',
      templateId: paidTpl.id,
      templateTitleAr: paidTpl.titleAr,
      templateTitleEn: paidTpl.titleEn,
      purchaseId: 'ord-1',
      licenseTypeId: 'lic-type-personal',
      licenseNameAr: 'رخصة استخدام دائم',
      licenseNameEn: 'Permanent Personal License',
      allowCommercialUse: false,
      maxCopies: 100,
      resaleAllowed: false,
      transferable: false,
      printRulesAr: 'للطباعة الشخصية',
      printRulesEn: 'Personal printing',
      termsSnapshotAr: 'رخصة دائمة غير منتهية الصلاحية',
      termsSnapshotEn: 'Permanent non-expiring license',
      status: 'active',
      issuedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: null,
    },
  ];
  const purchasedSet = getIssuedPurchasedTemplateIdSet(licenses);
  assert.ok(purchasedSet.has(paidTpl.id));

  // Even after subscription expires / downgrades back to Free, purchased template stays owned!
  assert.equal(
    canAccessTemplateByPlanOrPurchase({
      template: paidTpl,
      userPlan: 'Free',
      purchasedTemplateIds: purchasedSet,
    }),
    true
  );
  assert.equal(
    getTemplateOwnershipStatus({
      template: paidTpl,
      userPlan: 'Free',
      purchasedTemplateIds: purchasedSet,
    }),
    'purchased'
  );

  // Unpurchased paid template remains locked on Free plan
  assert.equal(
    canAccessTemplateByPlanOrPurchase({
      template: animePaidTpl,
      userPlan: 'Free',
      purchasedTemplateIds: purchasedSet,
    }),
    false
  );

  // Owned vs Unowned library filter accuracy
  const ownedList = filterAndSortLibraryTemplates(active, {
    userPlan: 'Free',
    purchasedTemplateIds: purchasedSet,
    ownershipFilter: 'owned',
  });
  const unownedList = filterAndSortLibraryTemplates(active, {
    userPlan: 'Free',
    purchasedTemplateIds: purchasedSet,
    ownershipFilter: 'unowned',
  });
  assert.equal(ownedList.length, 6, '5 free + 1 purchased = 6 owned templates');
  assert.equal(unownedList.length, 52, '58 - 6 = 52 unowned templates');

  const summary = summarizeLibraryOwnership({
    templates: active,
    userPlan: 'Free',
    purchasedTemplateIds: purchasedSet,
  });
  assert.equal(summary.freeCount, 5);
  assert.equal(summary.paidCount, 53);
  assert.equal(summary.ownedCount, 6);
  assert.equal(summary.unownedCount, 52);
});

test('Phase 1 QR Compositor & Print Sheet: Composes real QR across architectures and generates valid A4 & Letter print sheets', () => {
  const sampleIds = [
    'master-04-heritage-compass', // master_collection free
    'master-21-goku-dragon-ball', // master_collection anime paid
    'pilot-pebble-pop', // pilot_vector free
    'pilot-business-asset', // pilot_vector ProGrid ISO paid
    'pilot-retro-explorer', // batch02 paid
  ];

  const entries = sampleIds.map((id, idx) => {
    const design = INITIAL_TAG_DESIGNS.find((d) => d.id === id);
    assert.ok(design, `Sample template ${id} must exist`);
    const serial = `FQR-TEST-0${idx + 1}`;
    const composedClean = composeItemTemplateDesignSvg({
      design,
      codeSerial: serial,
      mode: 'clean',
    });
    const composedPrint = composeItemTemplateDesignSvg({
      design,
      codeSerial: serial,
      mode: 'print',
    });

    assert.ok(composedClean.svgMarkup.includes('<svg'), `${id} clean composite must output SVG`);
    assert.ok(composedPrint.svgMarkup.includes('<svg'), `${id} print composite must output SVG`);
    assert.ok(
      composedClean.qrEncodedPayload.includes(`/found/${serial}`),
      `${id} QR payload must encode /found/${serial}`
    );
    assert.equal(
      composedClean.qrEncodedPayload.includes('@'),
      false,
      `${id} QR payload must never expose email PII`
    );

    return {
      item: {
        id: `item-${idx}`,
        name: `Test Item ${idx + 1}`,
        nameAr: `غرض تجريبي ${idx + 1}`,
        nameEn: `Test Item ${idx + 1}`,
        codeSerial: serial,
        designId: design.id,
      } as never,
      design,
      copies: idx === 0 ? 2 : 1,
    };
  });

  // Individual print (1 copy) on A4
  const singlePlan = computeBatchPrintSheetLayout({
    queue: [{ ...entries[0], copies: 1 }],
    paperFormat: 'A4',
    scalePercent: 100,
    mode: 'clean',
  });
  assert.equal(singlePlan.totalStickers, 1);
  assert.equal(singlePlan.pages.length, 1);
  const singleSvg = buildBatchPrintSheetSvg({
    pagePlacements: singlePlan.pages[0],
    paper: singlePlan.paper,
    showCutMarks: true,
    showItemLabels: true,
  });
  assert.ok(singleSvg.includes('viewBox="0 0 210 297"'), 'A4 sheet must use 210×297mm viewBox');
  assert.ok(singleSvg.includes('FQR-TEST-01'), 'Sheet caption must include item serial');

  // Batch print (6 stickers across mixed template shapes/sizes) on US Letter with Bleed
  const batchPlan = computeBatchPrintSheetLayout({
    queue: entries,
    paperFormat: 'Letter',
    scalePercent: 100,
    mode: 'print',
  });
  assert.equal(batchPlan.totalStickers, 6);
  assert.ok(batchPlan.pages.length >= 1);
  const letterSvg = buildBatchPrintSheetSvg({
    pagePlacements: batchPlan.pages[0],
    paper: batchPlan.paper,
    showCutMarks: true,
    showItemLabels: true,
  });
  assert.ok(
    letterSvg.includes('viewBox="0 0 215.9 279.4"'),
    'US Letter sheet must use 215.9×279.4mm viewBox'
  );
});
