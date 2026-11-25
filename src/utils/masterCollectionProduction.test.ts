import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  MASTER_COLLECTION_SPECS,
  buildMasterEditableSvg,
  buildMasterPrintReadySvg,
  buildMasterCleanStickerSvg,
  getMasterDieCutPolygonMm,
  getMasterSpecById,
} from './masterCollectionProduction.ts';
import { MASTER_COLLECTION_TEMPLATES_33 } from '../data/masterCollectionTemplates33.ts';
import { INITIAL_TAG_DESIGNS } from '../data/foundationCatalog.ts';
import { buildDefaultTemplates, ensureDatabaseAdminDefaults } from '../server/adminDefaults.ts';
import { DatabaseSchema } from '../server/dbSchema.ts';
import {
  buildPilot3dTextureSurfaceSvg,
  buildPilotEditableSvg,
  buildPilotPrintReadySvg,
} from './pilotLabelArtwork.ts';

function readPngPhysDpi(buf: Buffer): { width: number; height: number; xPpm: number; yPpm: number } {
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Invalid PNG signature');
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const physIdx = buf.indexOf(Buffer.from('pHYs', 'ascii'));
  assert.ok(physIdx > 0, 'Missing PNG pHYs chunk');
  const xPpm = buf.readUInt32BE(physIdx + 4);
  const yPpm = buf.readUInt32BE(physIdx + 8);
  return { width, height, xPpm, yPpm };
}

test('Master Collection: defines exactly 33 unique specs (29 reference reproductions + 4 brand-new commercial originals) with zero duplicates', () => {
  assert.equal(MASTER_COLLECTION_SPECS.length, 33);
  assert.equal(MASTER_COLLECTION_TEMPLATES_33.length, 33);

  const refs = MASTER_COLLECTION_SPECS.filter((s) => s.origin === 'reference');
  const news = MASTER_COLLECTION_SPECS.filter((s) => s.origin === 'new_original');
  assert.equal(refs.length, 29, 'Expected all 29 attached reference templates reproduced');
  assert.equal(news.length, 4, 'Expected 4 brand-new commercial templates (#30-#33)');

  const ids = new Set(MASTER_COLLECTION_SPECS.map((s) => s.id));
  const prefixes = new Set(MASTER_COLLECTION_SPECS.map((s) => s.filePrefix));
  const sources = new Set(MASTER_COLLECTION_SPECS.map((s) => s.sourceImagePublicUrl));
  const indices = MASTER_COLLECTION_SPECS.map((s) => s.index);

  assert.equal(ids.size, 33, 'Duplicate Master Collection ID detected');
  assert.equal(prefixes.size, 33, 'Duplicate Master Collection filePrefix detected');
  assert.equal(sources.size, 33, 'Duplicate source artwork path detected (reference merged or duplicated)');
  assert.deepEqual(
    indices,
    Array.from({ length: 33 }, (_, i) => i + 1),
    'Indices must run strictly 1..33 without gaps'
  );

  // Verify every reference image source file exists on disk
  for (const spec of MASTER_COLLECTION_SPECS) {
    const diskSrc = path.resolve('public', spec.sourceImagePublicUrl.replace(/^\//, ''));
    assert.ok(fs.existsSync(diskSrc), `Missing source artwork on disk for #${spec.index}: ${diskSrc}`);
    assert.equal(spec.widthMm, 90);
    assert.equal(spec.heightMm, 60);
    assert.ok(spec.qrBoxPx.width > 150 && spec.qrBoxPx.height > 150, `Invalid QR bounding box on ${spec.id}`);
  }
});

test('Master Collection: flags all 11 anime/cartoon reference templates for commercial IP verification and documents reference notes', () => {
  const expectedIpFlaggedIndices = [3, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
  const flagged = MASTER_COLLECTION_SPECS.filter((s) => s.requiresIpVerification).map((s) => s.index);
  assert.deepEqual(flagged, expectedIpFlaggedIndices);

  for (const spec of MASTER_COLLECTION_SPECS) {
    if (spec.origin === 'new_original') {
      assert.equal(spec.requiresIpVerification, false, `New original ${spec.id} must be IP-clean`);
      assert.ok(spec.newOverlay, `New original ${spec.id} must define newOverlay typography & FindIt QR logo config`);
    }
    if (spec.requiresIpVerification) {
      assert.ok(
        spec.unresolvedNotesAr && spec.unresolvedNotesAr.length > 10,
        `IP-flagged template ${spec.id} must document clear Arabic verification note`
      );
    }
  }

  const doraemon = getMasterSpecById('master-03-doraemon-adventure')!;
  const hxh = getMasterSpecById('master-25-hunter-gon-friends')!;
  assert.ok(doraemon.unresolvedNotesAr?.includes('تنوين'), 'Doraemon note must preserve reference observation on تنوين');
  assert.ok(hxh.unresolvedNotesAr?.includes('Spacetoon'), 'Hunter x Hunter note must document Spacetoon mark');
});

test('Master Collection: SVG builders produce blank white QR zones for Editable & Print-Ready and real scannable QR for Product Previews', () => {
  for (const spec of MASTER_COLLECTION_SPECS) {
    const editableSvg = buildMasterEditableSvg(spec);
    const printReadySvg = buildMasterPrintReadySvg(spec);
    const previewSvg = buildMasterCleanStickerSvg(spec, undefined, { includeRealQr: true });

    // Editable SVG: layered, blank white QR zone, zero print guides
    assert.ok(editableSvg.includes('data-asset-type="editable-source"'), `${spec.id} editable metadata missing`);
    assert.ok(editableSvg.includes('data-qr-mode="blank-dynamic-placeholder"'), `${spec.id} editable QR must be blank placeholder`);
    assert.ok(editableSvg.includes('id="qr-dynamic-placement-area"'), `${spec.id} missing QR placement rect`);
    assert.ok(editableSvg.includes('fill="#FFFFFF"'), `${spec.id} QR mask must be pure #FFFFFF`);
    assert.ok(!editableSvg.includes('id="guide-crop-marks"'), `${spec.id} editable SVG must not include crop marks`);
    assert.ok(!editableSvg.includes('bidi-override'), `${spec.id} must use unicode-bidi="embed" instead of bidi-override`);

    // Print-Ready SVG: 300 DPI pre-press with +3mm bleed, -3mm safe margin, crop marks, CutContour #EC008C, blank QR
    assert.ok(printReadySvg.includes('data-asset-type="print-ready"'), `${spec.id} print-ready metadata missing`);
    assert.ok(printReadySvg.includes('data-dpi="300"'), `${spec.id} missing 300 DPI tag`);
    assert.ok(printReadySvg.includes('data-qr-mode="blank-dynamic-placeholder"'), `${spec.id} print-ready QR must be blank placeholder`);
    assert.ok(printReadySvg.includes('id="guide-bleed-box"'), `${spec.id} missing bleed box`);
    assert.ok(printReadySvg.includes('id="guide-safe-margin"'), `${spec.id} missing safe margin`);
    assert.ok(printReadySvg.includes('id="guide-crop-marks"'), `${spec.id} missing crop marks`);
    assert.ok(printReadySvg.includes('id="die-cut-contour-path"') && printReadySvg.includes('#EC008C'), `${spec.id} missing CutContour`);

    // Product Preview SVG: real ISO-18004 QR modules rendered cleanly, zero print guides
    assert.ok(previewSvg.includes('data-asset-type="studio-preview-artwork"'), `${spec.id} preview metadata missing`);
    assert.ok(!previewSvg.includes('id="guide-crop-marks"'), `${spec.id} product preview must never show print crop marks`);
    const qrRects = previewSvg.match(/<rect\b/g) || [];
    assert.ok(qrRects.length > 200, `${spec.id} preview must include dense real ISO-18004 QR modules (got ${qrRects.length})`);

    // 3D Die-Cut Contour Polygon bounds check
    const poly = getMasterDieCutPolygonMm(spec);
    assert.ok(poly.length >= 16, `${spec.id} 3D polygon must be smooth (>=16 vertices)`);
    for (const pt of poly) {
      assert.ok(Math.abs(pt.x) <= spec.widthMm / 2 + 1.0);
      assert.ok(Math.abs(pt.y) <= spec.heightMm / 2 + 1.0);
    }
  }
});

test('Master Collection: all 132 generated production files (33×4) exist on disk with verified 300 DPI metadata and exact dimensions', () => {
  const editableDir = path.resolve('public/assets/master-collection/editable');
  const printReadyDir = path.resolve('public/assets/master-collection/print-ready');
  const previewDir = path.resolve('public/assets/master-collection/previews');
  const printPngDir = path.resolve('public/assets/master-collection/print-png-300dpi');

  assert.equal(fs.readdirSync(editableDir).filter((f) => f.endsWith('.editable.svg')).length, 33);
  assert.equal(fs.readdirSync(printReadyDir).filter((f) => f.endsWith('.print-ready.svg')).length, 33);
  assert.equal(fs.readdirSync(previewDir).filter((f) => f.endsWith('.preview.png')).length, 33);
  assert.equal(fs.readdirSync(printPngDir).filter((f) => f.endsWith('.print-300dpi.png')).length, 33);

  for (const spec of MASTER_COLLECTION_SPECS) {
    // 1. Self-contained Editable SVG on disk
    const editableDisk = fs.readFileSync(path.join(editableDir, `${spec.filePrefix}.editable.svg`), 'utf8');
    assert.ok(editableDisk.includes('data-asset-type="editable-source"'));
    assert.ok(editableDisk.includes('data-qr-mode="blank-dynamic-placeholder"'));
    assert.ok(editableDisk.includes('data:image/jpeg;base64,'), `${spec.filePrefix} editable SVG must inline base64 JPEG artwork`);

    // 2. Self-contained Print-Ready SVG on disk
    const printReadyDisk = fs.readFileSync(path.join(printReadyDir, `${spec.filePrefix}.print-ready.svg`), 'utf8');
    assert.ok(printReadyDisk.includes('data-asset-type="print-ready"'));
    assert.ok(printReadyDisk.includes('data-qr-mode="blank-dynamic-placeholder"'));
    assert.ok(printReadyDisk.includes('#EC008C'));
    assert.ok(printReadyDisk.includes('data:image/jpeg;base64,'), `${spec.filePrefix} print-ready SVG must inline base64 JPEG artwork`);

    // 3. Clean Customer Product Preview PNG (1200x900 4:3, 300 DPI pHYs = 11811 px/m)
    const previewMeta = readPngPhysDpi(fs.readFileSync(path.join(previewDir, `${spec.filePrefix}.preview.png`)));
    assert.equal(previewMeta.width, 1200, `${spec.filePrefix} preview width must be 1200`);
    assert.equal(previewMeta.height, 900, `${spec.filePrefix} preview height must be 900`);
    assert.equal(previewMeta.xPpm, 11811, `${spec.filePrefix} preview must carry 300 DPI pHYs`);
    assert.equal(previewMeta.yPpm, 11811);

    // 4. Flat 300 DPI Print PNG (1063x709 = 90x60mm @ 300 DPI, 300 DPI pHYs = 11811 px/m)
    const printPngMeta = readPngPhysDpi(fs.readFileSync(path.join(printPngDir, `${spec.filePrefix}.print-300dpi.png`)));
    assert.equal(printPngMeta.width, 1063, `${spec.filePrefix} print PNG width must be 1063px (90mm @ 300 DPI)`);
    assert.equal(printPngMeta.height, 709, `${spec.filePrefix} print PNG height must be 709px (60mm @ 300 DPI)`);
    assert.equal(printPngMeta.xPpm, 11811, `${spec.filePrefix} print PNG must carry 300 DPI pHYs`);
    assert.equal(printPngMeta.yPpm, 11811);
  }
});

test('Master Collection: all 33 templates are cleanly registered in catalog, adminDefaults, pilotShowcaseMedia, and pilotLabelArtwork with strict preview/print separation', () => {
  const active = INITIAL_TAG_DESIGNS.filter((t) => (t.status || 'published') === 'published');
  const archived = INITIAL_TAG_DESIGNS.filter((t) => t.status === 'archived');
  assert.equal(active.length, 58, 'Expected 58 active templates (33 Master + 25 prior)');
  assert.equal(archived.length, 45, 'Expected 45 archived legacy templates untouched');
  assert.equal(INITIAL_TAG_DESIGNS.length, 103);

  const showcaseMediaSrc = fs.readFileSync(path.resolve('src/data/pilotShowcaseMedia.ts'), 'utf8');
  assert.ok(
    !showcaseMediaSrc.includes('/assets/master-collection/print-png-300dpi/'),
    'pilotShowcaseMedia.ts must never mix print-png-300dpi into customer product previews'
  );

  assert.ok(
    showcaseMediaSrc.includes('MASTER_COLLECTION_SPECS.map(') &&
      showcaseMediaSrc.includes('/assets/master-collection/previews/${spec.filePrefix}.preview.png'),
    'pilotShowcaseMedia.ts must register all 33 Master Collection studio previews cleanly from MASTER_COLLECTION_SPECS'
  );

  for (const tpl of MASTER_COLLECTION_TEMPLATES_33) {
    assert.equal(tpl.status, 'published');
    assert.ok(active.some((a) => a.id === tpl.id), `${tpl.id} missing from active INITIAL_TAG_DESIGNS`);
    assert.ok(tpl.originalDesignUrl?.startsWith('/assets/master-collection/editable/'));
    assert.ok(tpl.printFileUrl?.startsWith('/assets/master-collection/print-ready/'));
    assert.equal(tpl.previewImages?.length, 1);
    assert.ok(tpl.previewImages![0].startsWith('/assets/master-collection/previews/'));
    assert.ok(
      !tpl.previewImages!.some((u) => u.includes('print-png-300dpi') || u.includes('print-ready')),
      `${tpl.id} customer previewImages must never leak print files`
    );

    // Dispatch check through pilotLabelArtwork.ts
    assert.ok(buildPilotEditableSvg(tpl).includes('data-asset-type="editable-source"'));
    assert.ok(buildPilotPrintReadySvg(tpl).includes('data-asset-type="print-ready"'));
    assert.ok(buildPilot3dTextureSurfaceSvg(tpl).includes('data-collection="master-collection"'));
  }

  // Server adminDefaults seeding check
  const defaultMap = buildDefaultTemplates();
  assert.equal(Object.keys(defaultMap).length, 103);
  const emptyDb = {
    users: {},
    sessions: {},
    items: {},
    messages: {},
    notifications: {},
    activities: {},
    templates: {},
  } as unknown as DatabaseSchema;
  ensureDatabaseAdminDefaults(emptyDb);
  for (const tpl of MASTER_COLLECTION_TEMPLATES_33) {
    assert.ok(emptyDb.templates[tpl.id], `ensureDatabaseAdminDefaults failed to seed ${tpl.id}`);
    assert.equal(emptyDb.templates[tpl.id].status, 'published');
  }
});
