import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  BATCH_02_STICKER_SPECS,
  buildBatch02EditableSvg,
  buildBatch02PrintReadySvg,
  buildBatch02CleanStickerSvg,
  getBatch02DieCutPath,
} from "./batch02StickerProduction.ts";
import { INITIAL_TAG_DESIGNS } from "../data/foundationCatalog.ts";

const ENGLISH_TEMPLATE_NAMES = [
  "Neon Velocity",
  "Cloudy Days",
  "Urban Riot",
  "Ocean Wonders",
  "Pixel Quest",
  "Candy Clouds",
  "Botanical Journey",
  "Royal Signature",
];

function extractTextContents(svg: string): string[] {
  const matches = [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)];
  return matches.map((m) => m[1].replace(/<[^>]+>/g, "").trim());
}

test("Batch 02: has exactly 8 independent approved design specifications", () => {
  assert.equal(BATCH_02_STICKER_SPECS.length, 8);
  const ids = new Set(BATCH_02_STICKER_SPECS.map((s) => s.id));
  assert.equal(ids.size, 8);
  const prefixes = new Set(BATCH_02_STICKER_SPECS.map((s) => s.filePrefix));
  assert.equal(prefixes.size, 8);
});

test("Batch 02: every design uses the exact approved Egyptian Arabic message and CTA", () => {
  const expectedMessages: Record<string, string> = {
    "01-neon-velocity": "لقيت حاجة؟ خلّينا نوصلها لصاحبها..",
    "02-cloudy-days": "لقيتني؟ ساعدني أرجع لصاحبي!",
    "03-urban-riot": "لقيت الغرض؟ ساعد في إرجاعه لصاحبه!",
    "04-ocean-wonders": "لقيت حاجة؟ خلّينا نرجّعها لصاحبها!",
    "05-pixel-quest": "لقيت الغرض؟ ساعد في إرجاعه لصاحبه!",
    "06-candy-clouds": "لقيتني؟ رجّعني لصاحبي وخليه يفرح!",
    "07-botanical-journey": "لقيت الغرض؟ ساعد في إرجاعه لصاحبه!",
    "08-royal-signature": "لقيت هذا الغرض؟ ساعد في إعادته لصاحبه!",
  };

  for (const spec of BATCH_02_STICKER_SPECS) {
    assert.equal(spec.arabicMessage, expectedMessages[spec.filePrefix], `Mismatch on ${spec.filePrefix}`);
    assert.equal(spec.scanCtaAr, "امسح هنا", `CTA mismatch on ${spec.filePrefix}`);
  }
});

test("Batch 02: every Editable SVG has separated layers, official FindIt QR logo, blank white QR zone, CTA directly below QR, exact Arabic message, single-subpath die-cut outline, and zero English template names printed on the sticker", () => {
  for (const spec of BATCH_02_STICKER_SPECS) {
    const editableSvg = buildBatch02EditableSvg(spec);

    // 1. Official FindIt QR logo at the top
    assert.ok(
      editableSvg.includes('id="official-findit-qr-logo"'),
      `${spec.filePrefix} missing official FindIt QR logo group`
    );
    assert.ok(
      editableSvg.includes(">FindIt<") && editableSvg.includes(">QR<"),
      `${spec.filePrefix} missing official FindIt QR brand wordmark`
    );

    // 2. Separated editable layers and signature elements
    const requiredLayers = [
      "layer-sticker-white-border",
      "layer-background",
      "layer-main-illustration",
      "layer-decorative-elements",
      "layer-brand-logo",
      "layer-qr-placeholder",
      "layer-arabic-text",
      "layer-die-cut-path",
    ];
    for (const layerId of requiredLayers) {
      assert.ok(
        editableSvg.includes(`id="${layerId}"`),
        `${spec.filePrefix} missing editable layer ${layerId}`
      );
    }
    for (const sigId of spec.signatureElementIds) {
      assert.ok(
        editableSvg.includes(`id="${sigId}"`),
        `${spec.filePrefix} missing signature concept element ${sigId}`
      );
    }

    // 3. Clean white sticker border
    assert.ok(
      editableSvg.includes('id="layer-sticker-white-border"') &&
        editableSvg.includes('fill="#FFFFFF"'),
      `${spec.filePrefix} missing clean white sticker border`
    );

    // 4. Blank white QR placement area (34x34mm + 3mm quiet zone) with zero fake QR dots inside it
    const qrContainerMatch = editableSvg.match(
      /<g id="layer-qr-placeholder">[\s\S]*?<\/g>/
    );
    assert.ok(qrContainerMatch, `${spec.filePrefix} missing layer-qr-placeholder block`);
    const qrContainerXml = qrContainerMatch[0];
    assert.ok(
      qrContainerXml.includes('id="qr-dynamic-placement-area"') &&
        qrContainerXml.includes('width="34"') &&
        qrContainerXml.includes('height="34"') &&
        qrContainerXml.includes('fill="#FFFFFF"') &&
        qrContainerXml.includes('data-quiet-zone-mm="3"'),
      `${spec.filePrefix} QR placement area must be a blank white 34x34mm square (#FFFFFF) with 3mm quiet zone`
    );
    // Only the backing shadow, optional outer glow frame, and single white QR box (<= 3 rects, exactly 1 white #FFFFFF rect, zero fake black QR modules)
    const rectCountInQrContainer = (qrContainerXml.match(/<rect\b/g) || []).length;
    const whiteQrRectCount = (qrContainerXml.match(/fill="#FFFFFF"/g) || []).length;
    assert.equal(
      whiteQrRectCount,
      1,
      `${spec.filePrefix} QR placeholder must have exactly 1 blank white QR rect (found ${whiteQrRectCount})`
    );
    assert.ok(
      rectCountInQrContainer >= 1 && rectCountInQrContainer <= 3,
      `${spec.filePrefix} QR placeholder must not contain fake QR dots/modules (found ${rectCountInQrContainer} rects)`
    );

    // 5. Arabic scan instruction "امسح هنا" placed directly below the QR area
    const ctaMatch = editableSvg.match(
      /<text\b[^>]*y="([0-9.]+)"[^>]*>امسح هنا<\/text>/
    );
    assert.ok(ctaMatch, `${spec.filePrefix} missing "امسح هنا" text element`);
    const ctaY = Number(ctaMatch[1]);
    const qrBottomY = spec.qrZoneMm.y + spec.qrZoneMm.size;
    assert.ok(
      ctaY > qrBottomY && ctaY <= qrBottomY + 10,
      `${spec.filePrefix} "امسح هنا" (y=${ctaY}) must be positioned directly below QR bottom (y=${qrBottomY})`
    );

    // 6. Exact Egyptian Arabic message present
    assert.ok(
      editableSvg.includes(`>${spec.arabicMessage}</text>`),
      `${spec.filePrefix} missing exact Arabic message "${spec.arabicMessage}"`
    );

    // 7. Do NOT print English template names on the sticker
    const stickerTexts = extractTextContents(editableSvg);
    for (const engName of ENGLISH_TEMPLATE_NAMES) {
      for (const textNode of stickerTexts) {
        assert.ok(
          !textNode.toLowerCase().includes(engName.toLowerCase()),
          `${spec.filePrefix} printed forbidden English template name "${engName}" in text element "${textNode}"`
        );
      }
    }

    // 8. Unique die-cut silhouette with zero interior punch-holes
    const dieCutPath = getBatch02DieCutPath(spec.id, spec.widthMm, spec.heightMm);
    const moveCommands = (dieCutPath.match(/M\s/g) || []).length;
    assert.equal(
      moveCommands,
      1,
      `${spec.filePrefix} die-cut path must be a single closed contour without punch holes`
    );
    assert.ok(
      !editableSvg.toLowerCase().includes("keychain-hole") &&
        !editableSvg.toLowerCase().includes("punch-hole"),
      `${spec.filePrefix} must not include any keychain hole`
    );
  }
});

test("Batch 02: all 8 Editable SVGs, 8 Print-Ready SVGs, and 16 high-res PNG files exist on disk and pass validation", () => {
  const editableDir = path.resolve("public/assets/batch02/editable");
  const printReadyDir = path.resolve("public/assets/batch02/print-ready");
  const previewDir = path.resolve("public/assets/batch02/previews");
  const printPngDir = path.resolve("public/assets/batch02/print-png-300dpi");

  assert.equal(fs.readdirSync(editableDir).filter((f) => f.endsWith(".svg")).length, 8);
  assert.equal(fs.readdirSync(printReadyDir).filter((f) => f.endsWith(".svg")).length, 8);
  assert.equal(fs.readdirSync(previewDir).filter((f) => f.endsWith(".png")).length, 8);
  assert.equal(fs.readdirSync(printPngDir).filter((f) => f.endsWith(".png")).length, 8);

  for (const spec of BATCH_02_STICKER_SPECS) {
    // Editable SVG file on disk
    const editablePath = path.join(editableDir, `${spec.filePrefix}.editable.svg`);
    assert.ok(fs.existsSync(editablePath), `Missing editable SVG: ${editablePath}`);
    const editableDisk = fs.readFileSync(editablePath, "utf8");
    assert.ok(editableDisk.includes('data-asset-type="editable-source"'));
    assert.ok(editableDisk.includes('id="qr-dynamic-placement-area"'));

    // Print-Ready SVG file on disk
    const printReadyPath = path.join(printReadyDir, `${spec.filePrefix}.print-ready.svg`);
    assert.ok(fs.existsSync(printReadyPath), `Missing print-ready SVG: ${printReadyPath}`);
    const printReadyDisk = fs.readFileSync(printReadyPath, "utf8");
    assert.ok(printReadyDisk.includes('data-asset-type="print-ready"'));
    assert.ok(printReadyDisk.includes('data-dpi="300"'));
    assert.ok(printReadyDisk.includes('id="guide-bleed-box"'));
    assert.ok(printReadyDisk.includes('id="guide-safe-margin"'));
    assert.ok(printReadyDisk.includes('id="guide-crop-marks"'));
    assert.ok(printReadyDisk.includes('id="die-cut-contour-path"'));

    // Check sticker artwork has zero English template names
    const cleanStickerSvg = buildBatch02CleanStickerSvg(spec);
    for (const engName of ENGLISH_TEMPLATE_NAMES) {
      for (const textNode of extractTextContents(cleanStickerSvg)) {
        assert.ok(
          !textNode.toLowerCase().includes(engName.toLowerCase()),
          `${spec.filePrefix} clean sticker SVG contains English name "${engName}"`
        );
      }
    }

    // High-Resolution PNG Product Preview on disk (1200x900 4:3 studio presentation, 300 DPI pHYs chunk)
    const previewPath = path.join(previewDir, `${spec.filePrefix}.preview.png`);
    assert.ok(fs.existsSync(previewPath), `Missing PNG preview: ${previewPath}`);
    const previewBuf = fs.readFileSync(previewPath);
    assert.equal(previewBuf.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    const previewW = previewBuf.readUInt32BE(16);
    const previewH = previewBuf.readUInt32BE(20);
    assert.equal(previewW, 1200, `${spec.filePrefix} preview width should be 1200px`);
    assert.equal(previewH, 900, `${spec.filePrefix} preview height should be 900px (4:3 studio aspect)`);
    assert.ok(previewBuf.includes(Buffer.from("pHYs", "ascii")), `${spec.filePrefix} preview missing 300 DPI pHYs chunk`);

    // 300-DPI Print PNG on disk
    const expectedPxW = Math.round((spec.widthMm / 25.4) * 300);
    const expectedPxH = Math.round((spec.heightMm / 25.4) * 300);
    const printPngPath = path.join(printPngDir, `${spec.filePrefix}.print-300dpi.png`);
    assert.ok(fs.existsSync(printPngPath), `Missing 300 DPI print PNG: ${printPngPath}`);
    const printPngBuf = fs.readFileSync(printPngPath);
    assert.equal(printPngBuf.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    const printW = printPngBuf.readUInt32BE(16);
    const printH = printPngBuf.readUInt32BE(20);
    assert.equal(printW, expectedPxW);
    assert.equal(printH, expectedPxH);
    assert.ok(printPngBuf.includes(Buffer.from("pHYs", "ascii")), `${spec.filePrefix} print PNG missing 300 DPI pHYs chunk`);
  }
});

test("Active Library Registration: all 8 Batch 02 templates remain registered in the active FindIt QR Library (58 active total = 25 prior + 33 Master Collection, 45 archived legacy)", async () => {
  const { BATCH_02_STICKER_TEMPLATES_8 } = await import("../data/batch02StickerTemplates8.ts");
  const {
    buildPilotEditableSvg,
    buildPilotPrintReadySvg,
    buildPilot3dTextureSurfaceSvg,
    getDieCutContourPolygonMm,
  } = await import("./pilotLabelArtwork.ts");
  const showcaseMediaSrc = fs.readFileSync(path.resolve("src/data/pilotShowcaseMedia.ts"), "utf8");

  assert.equal(BATCH_02_STICKER_TEMPLATES_8.length, 8);
  const active = INITIAL_TAG_DESIGNS.filter((d) => d.status !== "archived");
  const archived = INITIAL_TAG_DESIGNS.filter((d) => d.status === "archived");
  assert.equal(active.length, 58, "Active catalog must contain 58 templates (25 prior + 33 Master Collection)");
  assert.equal(archived.length, 45, "Archived catalog must remain at 45 legacy templates");

  assert.deepEqual(
    BATCH_02_STICKER_TEMPLATES_8.map((t) => t.titleEn),
    ENGLISH_TEMPLATE_NAMES
  );

  for (const tpl of BATCH_02_STICKER_TEMPLATES_8) {
    const inCatalog = active.find((a) => a.id === tpl.id);
    assert.ok(inCatalog, `Template ${tpl.id} (${tpl.titleEn}) must be present in active INITIAL_TAG_DESIGNS`);
    assert.equal(inCatalog.status, "published");
    assert.ok(tpl.originalDesignUrl?.startsWith("/assets/batch02/editable/"));
    assert.ok(tpl.printFileUrl?.startsWith("/assets/batch02/print-ready/"));
    // Strict separation: customer-facing previewImages ONLY contains the clean studio product preview (never raw print production PNGs)
    assert.equal(tpl.previewImages?.length, 1);
    assert.ok(
      tpl.previewImages![0].startsWith("/assets/batch02/previews/"),
      `${tpl.id} previewImages[0] must point to /assets/batch02/previews/`
    );
    assert.ok(
      !tpl.previewImages!.some((u) => u.includes("print-png-300dpi") || u.includes("print-ready")),
      `${tpl.id} customer previewImages must NOT mix in print-production assets`
    );

    // Check linked files (including separate 300 DPI print PNG) exist on disk under public/
    const filePrefixMatch = tpl.printFileUrl!.match(/\/assets\/batch02\/print-ready\/([^/]+)\.print-ready\.svg$/);
    assert.ok(filePrefixMatch, `Unexpected printFileUrl format for ${tpl.id}`);
    const printPngRelUrl = `/assets/batch02/print-png-300dpi/${filePrefixMatch[1]}.print-300dpi.png`;
    for (const relUrl of [tpl.originalDesignUrl!, tpl.printFileUrl!, printPngRelUrl, ...tpl.previewImages!]) {
      const diskPath = path.resolve("public", relUrl.replace(/^\//, ""));
      assert.ok(fs.existsSync(diskPath), `Registered asset URL ${relUrl} missing on disk at ${diskPath}`);
    }

    // Check showcase media entry is registered for this template ID and preview URL, with ZERO raw print PNGs mixed in
    assert.ok(
      showcaseMediaSrc.includes(`'${tpl.id}':`) &&
        showcaseMediaSrc.includes(tpl.previewImages![0]),
      `Missing showcase media entry for ${tpl.id}`
    );
    assert.ok(
      !showcaseMediaSrc.includes("/assets/batch02/print-png-300dpi/"),
      "pilotShowcaseMedia.ts must strictly separate product previews from print-png-300dpi production assets"
    );

    // Check pilotLabelArtwork integration
    const editableSvg = buildPilotEditableSvg(tpl);
    const printReadySvg = buildPilotPrintReadySvg(tpl);
    const surface3dSvg = buildPilot3dTextureSurfaceSvg(tpl);
    assert.ok(editableSvg.includes('id="official-findit-qr-logo"'));
    assert.ok(editableSvg.includes(">امسح هنا</text>"));
    assert.ok(printReadySvg.includes('data-dpi="300"'));
    assert.ok(surface3dSvg.includes('id="qr-dynamic-placement-area"'));

    const poly = getDieCutContourPolygonMm(tpl.pilotArtStyle!, tpl.printSpecs!.trimWidthMm, tpl.printSpecs!.trimHeightMm);
    assert.ok(poly.length >= 8, `Expected valid 3D die-cut polygon for ${tpl.id} (got ${poly.length} vertices)`);
  }
});
