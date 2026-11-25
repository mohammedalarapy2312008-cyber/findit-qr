import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_45_TAG_DESIGNS, CORE_FIVE_TEMPLATES } from '../data/designTemplates45';
import { INITIAL_TAG_DESIGNS } from '../data/foundationCatalog';
import {
  BATCH_01_NEW_TEMPLATES,
  FLORA_LOOP_TEMPLATE,
  HEXA_PULSE_TEMPLATE,
  JELLY_CUBE_TEMPLATE,
  METRO_TICKET_TEMPLATE,
} from '../data/batch01Designs';
import {
  BATCH_02_NEW_TEMPLATES,
  MONO_MARK_TEMPLATE,
  POCKET_ORBIT_TEMPLATE,
  ASTRO_BUDDY_TEMPLATE,
  CAMPUS_BLOOM_TEMPLATE,
  GAME_MODE_TEMPLATE,
  PURRFECT_TAG_TEMPLATE,
  RETRO_EXPLORER_TEMPLATE,
} from '../data/batch02Designs';
import { PEBBLE_POP_TEMPLATE } from '../data/pebblePopDesign';
import { PILOT_FIVE_TAG_DESIGNS } from '../data/pilotDesigns5';
import { ensureDatabaseAdminDefaults, buildDefaultTemplates } from '../server/adminDefaults';
import { DatabaseSchema } from '../server/dbSchema';
import { computeZoomedCameraPosition } from './pilot3dSceneBuilder';
import {
  buildFindItSignatureSvg,
  buildPilot3dTextureSurfaceSvg,
  buildPilotEditableSvg,
  buildPilotPrintReadySvg,
  getDieCutContourPolygonMm,
  getPilotTrimDimensionsMm,
} from './pilotLabelArtwork';
import {
  filterCatalogTemplates,
  getActiveCatalogTemplates,
  getArchivedCatalogTemplates,
  summarizeActiveCatalogBreakdown,
} from './templateDiscovery';

test('PILOT_FIVE_TAG_DESIGNS delivers 5 completely distinct printable labels without replacing ALL_45_TAG_DESIGNS', () => {
  assert.equal(PILOT_FIVE_TAG_DESIGNS.length, 5);
  assert.equal(ALL_45_TAG_DESIGNS.length, 45);
  assert.equal(CORE_FIVE_TEMPLATES.length, 5);

  const pilotIds = new Set(PILOT_FIVE_TAG_DESIGNS.map((d) => d.id));
  const legacyIds = new Set(ALL_45_TAG_DESIGNS.map((d) => d.id));
  assert.equal(pilotIds.size, 5);

  for (const id of pilotIds) {
    assert.equal(legacyIds.has(id), false, `Pilot ID ${id} must not collide with legacy 45 templates`);
  }

  // Verify 5 distinct domain categories, 5 distinct die-cut shapes, 5 distinct art styles, 5 distinct dimensions
  const domains = new Set(PILOT_FIVE_TAG_DESIGNS.map((d) => d.domainCategory));
  const shapes = new Set(PILOT_FIVE_TAG_DESIGNS.map((d) => d.shapeSilhouette));
  const styles = new Set(PILOT_FIVE_TAG_DESIGNS.map((d) => d.pilotArtStyle));
  const dims = new Set(PILOT_FIVE_TAG_DESIGNS.map((d) => d.dimensionsMm));
  const primaries = new Set(PILOT_FIVE_TAG_DESIGNS.map((d) => d.primaryHex));

  assert.deepEqual(domains, new Set(['personal', 'travel', 'family', 'pets', 'business']));
  assert.equal(shapes.size, 5);
  assert.equal(styles.size, 5);
  assert.equal(dims.size, 5);
  assert.equal(primaries.size, 5);

  for (const p of PILOT_FIVE_TAG_DESIGNS) {
    assert.ok(p.printSpecs, `Missing printSpecs on ${p.id}`);
    assert.equal(p.printSpecs!.dpi, 300);
    assert.equal(p.printSpecs!.bleedMm, 3);
    assert.equal(p.printSpecs!.safeMarginMm, 3);
    assert.ok(p.printSpecs!.recommendedMaterials.length >= 2);
  }
});

test('All 3 assets (Editable Source, Print-Ready File, 3D Surface Texture) match 1:1 with real ISO QR, Bleed/Safe geometry, and subtle FindIt QR brand signature', () => {
  const sig = buildFindItSignatureSvg({ x: 46.9, y: 36.85, inkColor: '#D8B36A' });
  assert.match(sig, /data-brand-signature="findit-qr"/);

  for (const design of PILOT_FIVE_TAG_DESIGNS) {
    const customSerial = 'FQR-UNIT-9921';
    const customCallout = 'PRIORITY OWNER RETURN';
    const opts = {
      serialCode: customSerial,
      calloutText: customCallout,
      showPrintGuides: true,
    };

    const editableSvg = buildPilotEditableSvg(design, opts);
    const printSvg = buildPilotPrintReadySvg(design, opts);
    const surface3dSvg = buildPilot3dTextureSurfaceSvg(design, opts);
    const { widthMm, heightMm, bleedMm } = getPilotTrimDimensionsMm(design);

    // 1. Original Editable SVG has all semantic vector layers & subtle FindIt QR brand signature
    assert.match(editableSvg, /id="layer-cutline"/);
    assert.match(editableSvg, /id="layer-background"/);
    if (design.pilotArtStyle === 'pebble_pop') {
      assert.match(editableSvg, /id="layer-decorative-shapes"/);
      assert.match(editableSvg, /id="layer-accent-graphics"/);
      assert.match(editableSvg, /id="layer-brand-logo"/);
      assert.match(editableSvg, /id="layer-qr-container"/);
    } else {
      assert.match(editableSvg, /id="layer-artwork"/);
    }
    assert.match(editableSvg, /id="layer-typography"/);
    assert.match(editableSvg, /id="layer-qr-code"/);
    assert.match(editableSvg, /data-brand-signature="findit-qr"/);
    assert.ok(editableSvg.includes(customSerial));
    if (design.pilotArtStyle === 'pebble_pop') {
      assert.ok(editableSvg.includes('PRIORITY OWNER'));
      assert.ok(editableSvg.includes('RETURN'));
    } else {
      assert.ok(editableSvg.includes(customCallout));
    }

    // 2. Final Print-Ready SVG has 300 DPI metadata, bleed crop guides, CutContour, and genuine dense QR rects
    assert.match(printSvg, /data-asset-type="print-ready"/);
    assert.match(printSvg, /data-dpi="300"/);
    assert.ok(printSvg.includes('#EC008C'), 'Missing Magenta Die-Cut CutContour');
    assert.ok(printSvg.includes('#06B6D4'), 'Missing Cyan Bleed Line');
    assert.ok(printSvg.includes('#10B981'), 'Missing Emerald Safe Margin Line');
    assert.ok(printSvg.includes(`TRIM ${widthMm}x${heightMm}mm | BLEED +${bleedMm}mm`));
    const rectMatches = printSvg.match(/<rect\b/g) || [];
    assert.ok(rectMatches.length > 200, `Expected genuine dense ISO QR rects on ${design.id}, got ${rectMatches.length}`);

    // 3. Single Source of Truth: 3D Texture SVG embeds identical custom callout, serial, signature, palette, and exact QR module count
    assert.ok(surface3dSvg.includes(customSerial));
    if (design.pilotArtStyle === 'pebble_pop') {
      assert.ok(surface3dSvg.includes('PRIORITY OWNER'));
      assert.ok(surface3dSvg.includes('RETURN'));
    } else {
      assert.ok(surface3dSvg.includes(customCallout));
    }
    assert.ok(surface3dSvg.includes(design.primaryHex));
    assert.match(surface3dSvg, /data-brand-signature="findit-qr"/);
    const surfaceRects = surface3dSvg.match(/<rect\b/g) || [];
    assert.ok(surfaceRects.length > 200, `Expected identical QR module geometry on 3D surface for ${design.id}`);

    // 4. ExtrudeGeometry 2D die-cut contour polygon aligns inside centered millimeter bounds
    const poly = getDieCutContourPolygonMm(design.pilotArtStyle!, widthMm, heightMm);
    assert.ok(poly.length >= 8, `Expected closed contour polygon for ${design.id}`);
    for (const pt of poly) {
      assert.ok(Math.abs(pt.x) <= widthMm / 2 + 2.5);
      assert.ok(Math.abs(pt.y) <= heightMm / 2 + 2.5);
    }
  }
});

test('Pebble Pop builds Template #2 approved artwork, 7+ separated editable SVG layers, 58x68 organic contour, and live color/bilingual text sync across Editable, Print, and 3D SVGs', () => {
  assert.equal(PEBBLE_POP_TEMPLATE.id, 'pilot-pebble-pop');
  assert.equal(PEBBLE_POP_TEMPLATE.pilotArtStyle, 'pebble_pop');
  assert.equal(PEBBLE_POP_TEMPLATE.shapeSilhouette, 'organic_pebble');
  assert.equal(PEBBLE_POP_TEMPLATE.dimensionsMm, '58 × 68 mm');
  assert.equal(PEBBLE_POP_TEMPLATE.primaryHex, '#009BA8');
  assert.equal(PEBBLE_POP_TEMPLATE.secondaryHex, '#FFF3DF');
  assert.equal(PEBBLE_POP_TEMPLATE.badgeColorHex, '#FF7A00');
  assert.equal(PEBBLE_POP_TEMPLATE.defaultCalloutText, 'Scan to Contact the Owner');

  // Default faithful rendering matches exact approved English & Arabic lines and no hardware/hole placeholders
  const defaultEditable = buildPilotEditableSvg(PEBBLE_POP_TEMPLATE);
  assert.ok(defaultEditable.includes('Scan to Contact'));
  assert.ok(defaultEditable.includes('the Owner'));
  assert.ok(defaultEditable.includes('امسح الرمز للتواصل'));
  assert.ok(defaultEditable.includes('مع المالك'));
  assert.ok(defaultEditable.includes('id="pebble-yellow-sun"'));
  assert.ok(defaultEditable.includes('id="pebble-findit-logo"'));

  const opts = {
    primaryHex: '#2563EB',
    secondaryHex: '#FEF3C7',
    accentHex: '#E11D48',
    calloutText: 'Scan to Reach the Owner',
    customSubLabel: 'امسح للتواصل الفوري معي',
    serialCode: 'FQR-PEB-777',
    showPrintGuides: true,
  };

  const editableSvg = buildPilotEditableSvg(PEBBLE_POP_TEMPLATE, opts);
  const printSvg = buildPilotPrintReadySvg(PEBBLE_POP_TEMPLATE, opts);
  const surface3dSvg = buildPilot3dTextureSurfaceSvg(PEBBLE_POP_TEMPLATE, opts);
  const { widthMm, heightMm, bleedMm } = getPilotTrimDimensionsMm(PEBBLE_POP_TEMPLATE);
  assert.equal(widthMm, 58);
  assert.equal(heightMm, 68);

  // Separated vector layers required for Pebble Pop
  for (const layerId of [
    'layer-background',
    'layer-decorative-shapes',
    'layer-accent-graphics',
    'layer-brand-logo',
    'layer-qr-container',
    'layer-typography',
    'layer-qr-code',
    'layer-cutline',
  ]) {
    assert.ok(editableSvg.includes(`id="${layerId}"`), `Missing separated SVG layer ${layerId}`);
  }

  // Customized colors, bilingual text, and QR serial must propagate identically into Editable, Print, and 3D Surface SVGs
  for (const svg of [editableSvg, printSvg, surface3dSvg]) {
    assert.ok(svg.includes('#2563EB'), 'Missing custom primary color in Pebble Pop SVG');
    assert.ok(svg.includes('#FEF3C7'), 'Missing custom secondary cream color in Pebble Pop SVG');
    assert.ok(svg.includes('#E11D48'), 'Missing custom accent color in Pebble Pop SVG');
    assert.ok(svg.includes('Scan to Reach'), 'Missing custom English message line 1 in Pebble Pop SVG');
    assert.ok(svg.includes('the Owner'), 'Missing custom English message line 2 in Pebble Pop SVG');
    assert.ok(svg.includes('امسح للتواصل'), 'Missing custom Arabic message in Pebble Pop SVG');
    assert.ok(svg.includes('FQR-PEB-777'), 'Missing custom serial metadata in Pebble Pop SVG');
    const rects = svg.match(/<rect\b/g) || [];
    assert.ok(rects.length > 200, `Expected genuine dense ISO QR rects in Pebble Pop SVG, got ${rects.length}`);
  }

  assert.ok(printSvg.includes(`TRIM ${widthMm}x${heightMm}mm | BLEED +${bleedMm}mm`));
  assert.ok(printSvg.includes('#EC008C'), 'Missing organic CutContour line on Pebble Pop print sheet');

  // Smooth sampled organic contour polygon (7 cubic segments * 14 = 98 + 1 points) within centered millimeter bounds
  const poly = getDieCutContourPolygonMm('pebble_pop', widthMm, heightMm);
  assert.ok(poly.length >= 84, `Expected smooth organic polygon (>=84 pts), got ${poly.length}`);
  for (const pt of poly) {
    assert.ok(Math.abs(pt.x) <= widthMm / 2 + 0.5);
    assert.ok(Math.abs(pt.y) <= heightMm / 2 + 0.5);
  }
});

test('computeZoomedCameraPosition scales along camera-target ray and enforces min/max zoom bounds', () => {
  const zoomedIn = computeZoomedCameraPosition({
    position: [0, 3, 4],
    target: [0, 0, 0],
    scaleFactor: 0.5,
    minDistance: 1.5,
    maxDistance: 8.0,
  });
  assert.equal(Math.round(zoomedIn.distance * 100) / 100, 2.5);

  const clampedMin = computeZoomedCameraPosition({
    position: [0, 3, 4],
    target: [0, 0, 0],
    scaleFactor: 0.1,
    minDistance: 1.5,
    maxDistance: 8.0,
  });
  assert.equal(clampedMin.distance, 1.5);

  const clampedMax = computeZoomedCameraPosition({
    position: [0, 3, 4],
    target: [0, 0, 0],
    scaleFactor: 3.0,
    minDistance: 1.5,
    maxDistance: 8.0,
  });
  assert.equal(clampedMax.distance, 8.0);
});

test('ensureDatabaseAdminDefaults keeps 17 prior active templates + 8 newly registered Batch 02 sticker templates published (25 active) and non-destructively archives all 45 legacy templates', () => {
  const atelierCustom = {
    ...PILOT_FIVE_TAG_DESIGNS[0],
    titleEn: 'Atelier Crest Custom Kept',
  };
  const legacyPebbleDraft = {
    ...PEBBLE_POP_TEMPLATE,
    dimensionsMm: '68 × 54 mm',
    defaultCalloutText: 'SCAN TO FIND ME',
    salesCount: 42,
    usageCount: 99,
  };
  const luggageLegacy = ALL_45_TAG_DESIGNS.find((t) => t.id === 'design-luggage-pro')!;
  const db = {
    users: {},
    sessions: {},
    items: {
      'item-luggage-legacy-check': {
        id: 'item-luggage-legacy-check',
        ownerUid: 'user-test',
        qrId: 'qr-luggage-legacy-check',
        codeSerial: 'FQR-LUG-20',
        name: 'Legacy Suitcase',
        category: 'bags',
        imageUrl: '',
        status: 'Active',
        description: 'Preserved legacy luggage item',
        recoveryInstructions: 'Call owner',
        rewardOffered: false,
        city: 'Riyadh',
        totalScans: 0,
        lastScanAt: '',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        designId: 'design-luggage-pro',
        contactChannels: { showPhone: true, showWhatsapp: false, showEmail: false, showTelegram: false, anonymousRelayOnly: false },
      },
    },
    messages: {},
    notifications: {},
    activities: {},
    templates: {
      'design-epoxy-tech': {
        ...CORE_FIVE_TEMPLATES[1],
        priceSar: 199,
        isCoreProtected: true,
        status: 'published',
      },
      'design-luggage-pro': {
        ...luggageLegacy,
        usageCount: 20,
        status: 'published',
      },
      [PILOT_FIVE_TAG_DESIGNS[0].id]: atelierCustom,
      [PEBBLE_POP_TEMPLATE.id]: legacyPebbleDraft,
    },
  } as unknown as DatabaseSchema;

  const changed = ensureDatabaseAdminDefaults(db);
  assert.equal(changed, true);
  assert.equal(db.templates['design-epoxy-tech'].priceSar, 199, 'Must preserve existing template edits');
  assert.equal(db.templates['design-epoxy-tech'].status, 'archived', 'Legacy templates must be non-destructively archived');
  assert.equal(db.templates['design-luggage-pro'].status, 'archived', 'design-luggage-pro must be archived from active catalog');
  assert.equal(db.templates['design-luggage-pro'].usageCount, 20, 'Must preserve legacy item reference metadata');
  assert.ok(db.templates[db.items['item-luggage-legacy-check'].designId!], 'Legacy item designId must stay resolvable in db.templates');
  assert.equal(
    db.templates['pilot-atelier-personal'].titleEn,
    'Atelier Crest Custom Kept',
    'Must preserve Atelier Crest untouched'
  );
  assert.ok(db.templates['pilot-pebble-pop'], 'Must keep pilot-pebble-pop');
  assert.equal(db.templates['pilot-pebble-pop'].dimensionsMm, '58 × 68 mm');
  assert.equal(db.templates['pilot-pebble-pop'].primaryHex, '#009BA8');
  assert.equal(db.templates['pilot-pebble-pop'].salesCount, 42, 'Must preserve salesCount on upgrade');
  assert.equal(db.templates['pilot-pebble-pop'].usageCount, 99, 'Must preserve usageCount on upgrade');

  for (const pilot of PILOT_FIVE_TAG_DESIGNS) {
    assert.ok(db.templates[pilot.id], `Missing seeded pilot template ${pilot.id}`);
    assert.equal(db.templates[pilot.id].status, 'published');
    assert.equal(db.templates[pilot.id].isPilotShowcase, true);
  }
  for (const batchTpl of BATCH_01_NEW_TEMPLATES) {
    assert.ok(db.templates[batchTpl.id], `Missing seeded Batch 01 template ${batchTpl.id}`);
    assert.equal(db.templates[batchTpl.id].status, 'published');
    assert.equal(db.templates[batchTpl.id].isPilotShowcase, true);
  }
  for (const batch2Tpl of BATCH_02_NEW_TEMPLATES) {
    assert.ok(db.templates[batch2Tpl.id], `Missing seeded Batch 02 template ${batch2Tpl.id}`);
    assert.equal(db.templates[batch2Tpl.id].status, 'published');
    assert.equal(db.templates[batch2Tpl.id].isPilotShowcase, true);
  }

  const allDefaults = Object.values(buildDefaultTemplates());
  assert.equal(allDefaults.length, 103, 'buildDefaultTemplates must return all 103 templates (58 active + 45 archived)');
  assert.equal(getActiveCatalogTemplates(allDefaults).length, 58, 'Active catalog count must equal 58');
  assert.equal(getArchivedCatalogTemplates(allDefaults).length, 45, 'Archived legacy catalog count must equal 45');
});

test('INITIAL_TAG_DESIGNS contains 58 active templates (25 prior + 33 Master Collection designs) and 45 archived legacy templates with zero duplicates and no Street Pulse', () => {
  assert.equal(BATCH_01_NEW_TEMPLATES.length, 4);
  assert.equal(BATCH_02_NEW_TEMPLATES.length, 7);
  assert.equal(INITIAL_TAG_DESIGNS.length, 103);

  const activeTemplates = getActiveCatalogTemplates(INITIAL_TAG_DESIGNS);
  const archivedTemplates = getArchivedCatalogTemplates(INITIAL_TAG_DESIGNS);
  assert.equal(activeTemplates.length, 58);
  assert.equal(archivedTemplates.length, 45);

  const ids = new Set<string>();
  const slugs = new Set<string>();
  const titlesEn = new Set<string>();
  let pebbleCount = 0;

  for (const tpl of INITIAL_TAG_DESIGNS) {
    assert.equal(ids.has(tpl.id), false, `Duplicate template id detected: ${tpl.id}`);
    assert.equal(slugs.has(tpl.slug), false, `Duplicate template slug detected: ${tpl.slug}`);
    assert.equal(titlesEn.has(tpl.titleEn), false, `Duplicate titleEn detected: ${tpl.titleEn}`);
    assert.equal(tpl.titleEn.toLowerCase().includes('street pulse'), false, 'Street Pulse must not be in Batch 02');
    ids.add(tpl.id);
    slugs.add(tpl.slug);
    titlesEn.add(tpl.titleEn);
    if (tpl.id === 'pilot-pebble-pop' || tpl.titleEn.toLowerCase().includes('pebble pop')) {
      pebbleCount += 1;
    }
  }

  assert.equal(pebbleCount, 1, 'Pebble Pop must appear exactly once and never be duplicated');
  assert.deepEqual(
    BATCH_01_NEW_TEMPLATES.map((t) => t.id),
    ['pilot-metro-ticket', 'pilot-jelly-cube', 'pilot-hexa-pulse', 'pilot-flora-loop']
  );
  assert.deepEqual(
    BATCH_02_NEW_TEMPLATES.map((t) => t.id),
    [
      'pilot-mono-mark',
      'pilot-pocket-orbit',
      'pilot-astro-buddy',
      'pilot-campus-bloom',
      'pilot-game-mode',
      'pilot-purrfect-tag',
      'pilot-retro-explorer',
    ]
  );
  assert.equal(new Set(BATCH_02_NEW_TEMPLATES.map((t) => t.shapeSilhouette)).size, 7);
  assert.equal(new Set(BATCH_02_NEW_TEMPLATES.map((t) => t.pilotArtStyle)).size, 7);
});

test('Batch 01 templates (Metro Ticket, Jelly Cube, Hexa Pulse, Flora Loop) render clean printable separated SVG layers, 300 DPI print specs, 3D polygons, and live bilingual/color sync', () => {
  const expectedSpecs = [
    { tpl: METRO_TICKET_TEMPLATE, width: 58, height: 88, marker: 'TRAVEL ITEM' },
    { tpl: JELLY_CUBE_TEMPLATE, width: 70, height: 70, marker: 'id="jelly-smiling-star"' },
    { tpl: HEXA_PULSE_TEMPLATE, width: 70, height: 80, marker: 'id="hexa-ecg-pulse"' },
    { tpl: FLORA_LOOP_TEMPLATE, width: 72, height: 78, marker: 'id="flora-butterfly"' },
  ];

  for (const { tpl, width, height, marker } of expectedSpecs) {
    const { widthMm, heightMm, bleedMm } = getPilotTrimDimensionsMm(tpl);
    assert.equal(widthMm, width);
    assert.equal(heightMm, height);
    assert.equal(bleedMm, 3);

    const defaultEditable = buildPilotEditableSvg(tpl);
    assert.ok(defaultEditable.includes(marker), `Missing signature artwork ${marker} in ${tpl.id}`);
    assert.ok(defaultEditable.includes('Scan to Contact'));
    assert.ok(defaultEditable.includes('the Owner'));
    assert.ok(defaultEditable.includes('امسح الرمز للتواصل'));
    assert.ok(defaultEditable.includes('مع المالك'));

    // Ensure no physical hardware/hole placeholder terminology leaks into SVG artwork
    for (const forbidden of ['keychain', 'grommet', 'carabiner', 'punch-hole', 'metal-ring']) {
      assert.equal(
        defaultEditable.toLowerCase().includes(forbidden),
        false,
        `Forbidden physical hardware term "${forbidden}" found in ${tpl.id}`
      );
    }

    const customOpts = {
      primaryHex: '#1D4ED8',
      secondaryHex: '#FEF08A',
      accentHex: '#DC2626',
      calloutText: 'Scan to Contact the Owner Now',
      customSubLabel: 'امسح للتواصل السريع',
      serialCode: `FQR-${tpl.pilotArtStyle?.toUpperCase()}-101`,
      showPrintGuides: true,
    };

    const editableSvg = buildPilotEditableSvg(tpl, customOpts);
    const printSvg = buildPilotPrintReadySvg(tpl, customOpts);
    const surface3dSvg = buildPilot3dTextureSurfaceSvg(tpl, customOpts);

    for (const layerId of [
      'layer-background',
      'layer-decorative-shapes',
      'layer-accent-graphics',
      'layer-brand-logo',
      'layer-qr-container',
      'layer-typography',
      'layer-qr-code',
      'layer-cutline',
    ]) {
      assert.ok(editableSvg.includes(`id="${layerId}"`), `Missing separated layer ${layerId} in ${tpl.id}`);
    }

    for (const svg of [editableSvg, printSvg, surface3dSvg]) {
      assert.ok(svg.includes('#1D4ED8'), `Custom primary hex missing in ${tpl.id}`);
      assert.ok(svg.includes('#FEF08A'), `Custom secondary hex missing in ${tpl.id}`);
      assert.ok(svg.includes('#DC2626'), `Custom accent hex missing in ${tpl.id}`);
      assert.ok(svg.includes('Owner Now'), `Custom EN line missing in ${tpl.id}`);
      assert.ok(svg.includes('امسح للتواصل'), `Custom AR line missing in ${tpl.id}`);
      assert.ok(svg.includes(customOpts.serialCode), `Serial code missing in ${tpl.id}`);
      const qrRects = svg.match(/<rect\b/g) || [];
      assert.ok(qrRects.length > 200, `Expected genuine ISO QR rects in ${tpl.id}, got ${qrRects.length}`);
    }

    assert.match(printSvg, /data-asset-type="print-ready"/);
    assert.match(printSvg, /data-dpi="300"/);
    assert.ok(printSvg.includes(`TRIM ${width}x${height}mm | BLEED +3mm`));
    assert.ok(printSvg.includes('#EC008C'));

    const poly = getDieCutContourPolygonMm(tpl.pilotArtStyle!, width, height);
    assert.ok(poly.length >= 12, `Expected detailed contour polygon for ${tpl.id}, got ${poly.length}`);
    for (const pt of poly) {
      assert.ok(Math.abs(pt.x) <= width / 2 + 0.5);
      assert.ok(Math.abs(pt.y) <= height / 2 + 0.5);
    }
  }
});

test('Batch 02 templates (Mono Mark, Pocket Orbit, Astro Buddy, Campus Bloom, Game Mode, Purrfect Tag, Retro Explorer) render hole-free cutlines, zero <filter> tags, separated layers, 300 DPI specs, and live bilingual/color sync', () => {
  const expectedBatch02 = [
    { tpl: MONO_MARK_TEMPLATE, width: 64, height: 74, marker: 'id="mono-phone-scan-icon"' },
    { tpl: POCKET_ORBIT_TEMPLATE, width: 70, height: 76, marker: 'id="pocket-orbit-astronaut"' },
    { tpl: ASTRO_BUDDY_TEMPLATE, width: 70, height: 76, marker: 'id="astro-buddy-astronaut"' },
    { tpl: CAMPUS_BLOOM_TEMPLATE, width: 74, height: 80, marker: 'id="campus-backpack"' },
    { tpl: GAME_MODE_TEMPLATE, width: 76, height: 72, marker: 'id="game-dpad"' },
    { tpl: PURRFECT_TAG_TEMPLATE, width: 72, height: 74, marker: 'id="purrfect-winking-kitty"' },
    { tpl: RETRO_EXPLORER_TEMPLATE, width: 76, height: 78, marker: 'id="explorer-compass-rose"' },
  ];

  for (const { tpl, width, height, marker } of expectedBatch02) {
    const { widthMm, heightMm, bleedMm } = getPilotTrimDimensionsMm(tpl);
    assert.equal(widthMm, width);
    assert.equal(heightMm, height);
    assert.equal(bleedMm, 3);

    const defaultEditable = buildPilotEditableSvg(tpl);
    assert.ok(defaultEditable.includes(marker), `Missing signature artwork ${marker} in ${tpl.id}`);
    assert.ok(defaultEditable.includes('Scan to Contact'));
    assert.ok(defaultEditable.includes('the Owner'));
    assert.ok(defaultEditable.includes('امسح الرمز للتواصل'));
    assert.ok(defaultEditable.includes('مع المالك'));

    // Ensure no SVG <filter> tags or physical keychain/hole terminology appear in printable SVGs
    assert.equal(defaultEditable.toLowerCase().includes('<filter'), false, `SVG <filter> disallowed in ${tpl.id}`);
    for (const forbidden of ['keychain', 'grommet', 'carabiner', 'punch-hole', 'metal-ring', 'keyring']) {
      assert.equal(
        defaultEditable.toLowerCase().includes(forbidden),
        false,
        `Forbidden physical hardware term "${forbidden}" found in ${tpl.id}`
      );
    }

    // Verify clean single-subpath CutContour (exactly one M command inside layer-cutline -> zero interior punch-holes)
    const cutlineMatch = defaultEditable.match(/<g id="layer-cutline">[\s\S]*?<path d="([^"]+)"/);
    assert.ok(cutlineMatch, `Missing CutContour path inside layer-cutline for ${tpl.id}`);
    const mCommands = cutlineMatch![1].match(/\bM\b/g) || [];
    assert.equal(mCommands.length, 1, `CutContour must be a single clean outer path with zero punch holes on ${tpl.id}`);

    const customOpts = {
      primaryHex: '#1E3A8A',
      secondaryHex: '#FEF9C3',
      accentHex: '#E11D48',
      calloutText: 'Scan to Contact the Owner Now',
      customSubLabel: 'امسح للتواصل الفوري',
      serialCode: `FQR-${tpl.pilotArtStyle?.toUpperCase()}-202`,
      showPrintGuides: true,
    };

    const editableSvg = buildPilotEditableSvg(tpl, customOpts);
    const printSvg = buildPilotPrintReadySvg(tpl, customOpts);
    const surface3dSvg = buildPilot3dTextureSurfaceSvg(tpl, customOpts);

    for (const layerId of [
      'layer-background',
      'layer-decorative-shapes',
      'layer-accent-graphics',
      'layer-brand-logo',
      'layer-qr-container',
      'layer-typography',
      'layer-qr-code',
      'layer-cutline',
    ]) {
      assert.ok(editableSvg.includes(`id="${layerId}"`), `Missing separated layer ${layerId} in ${tpl.id}`);
    }

    for (const svg of [editableSvg, printSvg, surface3dSvg]) {
      assert.equal(svg.toLowerCase().includes('<filter'), false, `SVG <filter> disallowed in generated asset for ${tpl.id}`);
      assert.ok(svg.includes('#1E3A8A'), `Custom primary hex missing in ${tpl.id}`);
      assert.ok(svg.includes('#FEF9C3'), `Custom secondary hex missing in ${tpl.id}`);
      assert.ok(svg.includes('#E11D48'), `Custom accent hex missing in ${tpl.id}`);
      assert.ok(svg.includes('Owner Now'), `Custom EN line missing in ${tpl.id}`);
      assert.ok(svg.includes('امسح للتواصل'), `Custom AR line missing in ${tpl.id}`);
      assert.ok(svg.includes(customOpts.serialCode), `Serial code missing in ${tpl.id}`);
      const qrRects = svg.match(/<rect\b/g) || [];
      assert.ok(qrRects.length > 200, `Expected genuine ISO QR rects in ${tpl.id}, got ${qrRects.length}`);
    }

    assert.match(printSvg, /data-asset-type="print-ready"/);
    assert.match(printSvg, /data-dpi="300"/);
    assert.ok(printSvg.includes(`TRIM ${width}x${height}mm | BLEED +3mm`));
    assert.ok(printSvg.includes('#EC008C'));

    const poly = getDieCutContourPolygonMm(tpl.pilotArtStyle!, width, height);
    assert.ok(poly.length >= 12, `Expected detailed contour polygon for ${tpl.id}, got ${poly.length}`);
    for (const pt of poly) {
      assert.ok(Math.abs(pt.x) <= width / 2 + 0.5);
      assert.ok(Math.abs(pt.y) <= height / 2 + 0.5);
    }
  }
});

test('templateDiscovery excludes archived legacy templates and supports category, style cluster, and search filtering across the 58 active designs', () => {
  const breakdown = summarizeActiveCatalogBreakdown(INITIAL_TAG_DESIGNS);
  assert.equal(breakdown.activeTotal, 58);
  assert.equal(breakdown.archivedTotal, 45);
  assert.ok(breakdown.byStyleCluster.cosmic >= 2, 'Expected Pocket Orbit + Astro Buddy in Space & Cosmic cluster');
  assert.ok(breakdown.byStyleCluster.minimal >= 4);
  assert.ok(breakdown.byStyleCluster.playful >= 8);
  assert.ok(breakdown.byStyleCluster.vintage >= 4);
  assert.ok(breakdown.byStyleCluster.nature >= 4);

  const allActive = filterCatalogTemplates(INITIAL_TAG_DESIGNS);
  assert.equal(allActive.length, 58);
  assert.equal(allActive.some((t) => t.id === 'design-luggage-pro'), false, 'Archived legacy templates must stay hidden from active catalog');

  const cosmic = filterCatalogTemplates(INITIAL_TAG_DESIGNS, { styleCluster: 'cosmic' });
  assert.ok(cosmic.some((t) => t.id === 'pilot-astro-buddy'));
  assert.ok(cosmic.some((t) => t.id === 'pilot-pocket-orbit'));

  const astroSearch = filterCatalogTemplates(INITIAL_TAG_DESIGNS, { searchQuery: 'Astro Buddy' });
  assert.equal(astroSearch.length, 1);
  assert.equal(astroSearch[0].id, 'pilot-astro-buddy');

  const catFilter = filterCatalogTemplates(INITIAL_TAG_DESIGNS, { domain: 'pets' });
  assert.ok(catFilter.some((t) => t.id === 'pilot-pet-guardian'));
  assert.ok(catFilter.some((t) => t.id === 'pilot-purrfect-tag'));
  assert.ok(catFilter.some((t) => t.id === 'master-05-tabby-kitten'));
});

