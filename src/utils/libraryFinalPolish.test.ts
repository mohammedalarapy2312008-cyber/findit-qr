import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { INITIAL_TAG_DESIGNS } from '../data/foundationCatalog';
import {
  getShowcaseGalleryUrlsForSlug,
  LIBRARY_SHOWCASE_REGISTRY,
} from '../data/libraryShowcaseRegistry';
import {
  buildDefaultTemplates,
  ensureDatabaseAdminDefaults,
} from '../server/adminDefaults';
import { DatabaseSchema } from '../server/dbSchema';
import {
  filterCatalogTemplates,
  getActiveCatalogTemplates,
  isTemplateFree,
  REORGANIZED_DOMAIN_CATEGORIES,
  sortCatalogTemplates,
  summarizeActiveCatalogBreakdown,
} from './templateDiscovery';

test('All 58 active templates are preserved alongside 45 archived legacy templates (103 total, zero deletions)', () => {
  assert.equal(INITIAL_TAG_DESIGNS.length, 103);
  const active = getActiveCatalogTemplates(INITIAL_TAG_DESIGNS);
  assert.equal(active.length, 58);

  const archived = INITIAL_TAG_DESIGNS.filter((t) => t.status === 'archived');
  assert.equal(archived.length, 45);

  // Every active template has an explicit registry record
  for (const tpl of active) {
    assert.ok(
      LIBRARY_SHOWCASE_REGISTRY[tpl.id],
      `Missing LIBRARY_SHOWCASE_REGISTRY entry for active template ${tpl.id}`
    );
    assert.ok(tpl.showcaseGallery, `Missing showcaseGallery on ${tpl.id}`);
    assert.ok(tpl.subCategoryAr && tpl.subCategoryEn, `Missing subCategory on ${tpl.id}`);
  }
});

test('All 58 active templates have complete 4-shot realistic presentation JPEGs on disk (232 files)', () => {
  const active = getActiveCatalogTemplates(INITIAL_TAG_DESIGNS);
  let verifiedCount = 0;

  for (const tpl of active) {
    const gallery = getShowcaseGalleryUrlsForSlug(tpl.slug);
    const urls = [
      gallery.mockup3dUrl,
      gallery.onProductUrl,
      gallery.closeupUrl,
      gallery.lifestyleUrl,
    ];

    for (const url of urls) {
      assert.ok(
        !url.includes('print-png-300dpi') && !url.includes('print-ready'),
        `Showcase image ${url} must never expose technical print sheets`
      );
      const diskPath = path.resolve('public', url.replace(/^\//, ''));
      assert.ok(fs.existsSync(diskPath), `Missing showcase file on disk: ${diskPath}`);
      const buf = fs.readFileSync(diskPath);
      assert.ok(buf.length > 12_000, `Showcase JPEG suspiciously small (${buf.length} bytes): ${diskPath}`);
      // Valid JPEG SOI marker FF D8
      assert.equal(buf[0], 0xff, `Invalid JPEG header byte 0 for ${diskPath}`);
      assert.equal(buf[1], 0xd8, `Invalid JPEG header byte 1 for ${diskPath}`);
      verifiedCount++;
    }
  }

  assert.equal(verifiedCount, 58 * 4);
});

test('Rebuilt taxonomy includes dedicated Anime & Cartoon category, multi-category membership, Free/Premium tiers, IP filter, and 4 sort modes', () => {
  assert.ok(
    REORGANIZED_DOMAIN_CATEGORIES.some((c) => c.id === 'anime_cartoon'),
    'REORGANIZED_DOMAIN_CATEGORIES must expose dedicated anime_cartoon section'
  );

  const breakdown = summarizeActiveCatalogBreakdown(INITIAL_TAG_DESIGNS);
  assert.equal(breakdown.activeTotal, 58);
  assert.equal(breakdown.freeTotal, 5);
  assert.equal(breakdown.premiumTotal, 53);
  assert.equal(breakdown.ipReviewRequiredTotal, 11);
  assert.equal(breakdown.originalCommercialTotal, 47);
  assert.ok(
    breakdown.byDomain.anime_cartoon >= 20,
    `Expected rich anime_cartoon category (>=20), got ${breakdown.byDomain.anime_cartoon}`
  );

  // Verify Free filter returns exact 5 starter templates
  const freeOnly = filterCatalogTemplates(INITIAL_TAG_DESIGNS, { priceFilter: 'free' });
  assert.equal(freeOnly.length, 5);
  assert.ok(freeOnly.every((t) => isTemplateFree(t)));

  // Verify Anime & Cartoon includes all 11 reference anime + original commercial cartoon designs
  const allAnime = filterCatalogTemplates(INITIAL_TAG_DESIGNS, { domain: 'anime_cartoon' });
  const originalAnimeOnly = filterCatalogTemplates(INITIAL_TAG_DESIGNS, {
    domain: 'anime_cartoon',
    ipFilter: 'original_only',
  });
  assert.equal(allAnime.length - originalAnimeOnly.length, 11);
  assert.ok(originalAnimeOnly.every((t) => !t.requiresIpVerification));

  // Verify multi-category membership (secondaryDomains)
  const familyTemplates = filterCatalogTemplates(INITIAL_TAG_DESIGNS, { domain: 'family' });
  assert.ok(
    familyTemplates.some((t) => t.id === 'master-03-doraemon-adventure'),
    'Doraemon should belong to both anime_cartoon (primary) and family (secondary)'
  );
  assert.ok(
    allAnime.some((t) => t.id === 'pilot-neon-velocity'),
    'Neon Velocity should belong to both personal (primary) and anime_cartoon (secondary)'
  );

  // Verify all 4 sort modes
  const byPrice = sortCatalogTemplates(getActiveCatalogTemplates(INITIAL_TAG_DESIGNS), 'price_asc');
  assert.equal(byPrice[0].priceSar, 0);
  assert.ok(byPrice[byPrice.length - 1].priceSar >= byPrice[0].priceSar);

  const byPopular = sortCatalogTemplates(getActiveCatalogTemplates(INITIAL_TAG_DESIGNS), 'popular');
  assert.ok((byPopular[0].usageCount || 0) >= (byPopular[byPopular.length - 1].usageCount || 0));

  const byNewest = sortCatalogTemplates(getActiveCatalogTemplates(INITIAL_TAG_DESIGNS), 'newest');
  assert.equal(byNewest.length, 58);

  const byFeatured = sortCatalogTemplates(getActiveCatalogTemplates(INITIAL_TAG_DESIGNS), 'featured');
  assert.equal(byFeatured[0].isFeatured, true);
});

test('Strict separation: Editable & Print-Ready SVGs keep pure blank dynamic QR zones (zero demo QR leaked into print files)', () => {
  const dirs = [
    path.resolve('public/assets/master-collection/editable'),
    path.resolve('public/assets/master-collection/print-ready'),
    path.resolve('public/assets/batch02/editable'),
    path.resolve('public/assets/batch02/print-ready'),
  ];

  let checkedSvgs = 0;
  for (const dir of dirs) {
    assert.ok(fs.existsSync(dir), `Missing production SVG directory: ${dir}`);
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.svg'))) {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      assert.ok(
        !content.includes('demo-preview-qr') && !content.includes('finditqr.app/demo-preview'),
        `Demo showcase QR leaked into production SVG: ${file}`
      );
      checkedSvgs++;
    }
  }
  // 33*2 Master + 8*2 Batch 02 = 82 production SVGs
  assert.equal(checkedSvgs, 82);
});

test('buildDefaultTemplates & ensureDatabaseAdminDefaults hydrate showcaseGallery without overwriting custom admin edits', () => {
  const defaults = buildDefaultTemplates();
  assert.equal(Object.keys(defaults).length, 103);
  assert.equal(defaults['master-21-goku-dragon-ball'].domainCategory, 'anime_cartoon');
  assert.equal(defaults['pilot-pebble-pop'].priceSar, 0);
  assert.ok(defaults['pilot-atelier-personal'].showcaseGallery?.mockup3dUrl);

  // Simulate an existing DB with a custom admin title edit on pilot-atelier-personal
  const db = {
    templates: {
      'pilot-atelier-personal': {
        ...defaults['pilot-atelier-personal'],
        titleEn: 'Atelier Crest Custom Kept',
        showcaseGallery: undefined,
      },
    },
  } as unknown as DatabaseSchema;

  ensureDatabaseAdminDefaults(db);
  assert.equal(db.templates['pilot-atelier-personal'].titleEn, 'Atelier Crest Custom Kept');
  assert.ok(db.templates['pilot-atelier-personal'].showcaseGallery?.onProductUrl);
});
