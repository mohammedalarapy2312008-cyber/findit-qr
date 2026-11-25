import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createServerApp } from '../../server';
import {
  COVER_LIBRARY_CATALOG,
  FALLBACK_LIBRARY_COVERS,
  GROUP_LIBRARY_COVERS,
  ITEM_LIBRARY_COVERS,
} from '../data/coverLibraryCatalog';
import { INITIAL_TAG_DESIGNS } from '../data/foundationCatalog';
import {
  isSafeCloudStorageEndpoint,
  resolveS3CompatibleConfig,
} from '../server/integrations/cloudStorageAdapter';
import { matchSmartCover, selectBestCoverFromImages } from './aiCoverLogic';

// Valid minimal 1x1 PNG (magic bytes 89 50 4E 47 0D 0A 1A 0A)
const VALID_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

async function startBootableServer(opts: {
  dbFilePath: string;
  mediaRoot: string;
  adminEmail?: string;
}): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const { app } = await createServerApp({
    dbFilePath: opts.dbFilePath,
    mediaRoot: opts.mediaRoot,
    adminEmail: opts.adminEmail,
    disableVite: true,
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    close: async () => {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    },
  };
}

test('1. Curated Cover Library has exact 40 unique Midnight Teal covers (25 items + 10 groups + 5 fallbacks) on disk', () => {
  assert.equal(COVER_LIBRARY_CATALOG.length, 40);
  assert.equal(ITEM_LIBRARY_COVERS.length, 25);
  assert.equal(GROUP_LIBRARY_COVERS.length, 10);
  assert.equal(FALLBACK_LIBRARY_COVERS.length, 5);

  const uniqueIds = new Set<string>();
  const uniqueUrls = new Set<string>();
  const uniqueSvgs = new Set<string>();

  for (const entry of COVER_LIBRARY_CATALOG) {
    assert.ok(!uniqueIds.has(entry.id), `Duplicate ID: ${entry.id}`);
    assert.ok(!uniqueUrls.has(entry.url), `Duplicate URL: ${entry.url}`);
    uniqueIds.add(entry.id);
    uniqueUrls.add(entry.url);

    assert.ok(entry.nameAr.trim().length >= 2);
    assert.ok(entry.nameEn.trim().length >= 2);
    assert.ok(entry.keywordsAr.length >= 2);
    assert.ok(entry.keywordsEn.length >= 2);

    // Verify materialized file exists in public/assets/covers-library/...
    const relativePath = entry.url.replace(/^\/+/, '');
    const diskPath = path.resolve(process.cwd(), 'public', relativePath);
    assert.ok(fs.existsSync(diskPath), `Missing cover file on disk: ${diskPath}`);
    const svgContent = fs.readFileSync(diskPath, 'utf8');
    assert.ok(svgContent.startsWith('<svg') && svgContent.includes('viewBox="0 0 800 600"'));
    assert.ok(!uniqueSvgs.has(svgContent), `Duplicate SVG artwork detected for ${entry.id}`);
    uniqueSvgs.add(svgContent);
  }

  // Verify 58 active templates remain completely untouched
  assert.equal(
    INITIAL_TAG_DESIGNS.filter((d) => (d.status || 'published') === 'published').length,
    58
  );

  // Verify storage.rules exists for Firebase Storage readiness
  assert.ok(fs.existsSync(path.resolve(process.cwd(), 'storage.rules')));
});

test('2. Smart Cover Matching Engine matches Arabic & English items, groups, child items, and Midnight Teal fallbacks accurately', () => {
  // Arabic & English individual items
  assert.equal(
    matchSmartCover({ entityType: 'item', name: 'لابتوب ماك بوك برو 14', category: 'electronics' })
      .cover.id,
    'item-laptop-pro'
  );
  assert.equal(
    matchSmartCover({ entityType: 'item', name: 'محفظة جلدية بنية', category: 'bags' }).cover.id,
    'item-leather-wallet'
  );
  assert.equal(
    matchSmartCover({ entityType: 'item', name: 'مفتاح سيارة مرسيدس', category: 'keys' }).cover.id,
    'item-car-key-fob'
  );
  assert.equal(
    matchSmartCover({ entityType: 'item', name: 'شنطة سفر كبيرة', category: 'bags' }).cover.id,
    'item-travel-suitcase'
  );
  assert.equal(
    matchSmartCover({ entityType: 'item', name: 'جواز سفر سعودي', category: 'documents' }).cover.id,
    'item-passport-travel-docs'
  );
  assert.equal(
    matchSmartCover({ entityType: 'item', name: 'Kids Plush Bear Toy', category: 'bags' }).cover.id,
    'item-kids-teddy-toy'
  );
  assert.equal(
    matchSmartCover({ entityType: 'item', name: 'طوق قط منزلي', category: 'pets' }).cover.id,
    'item-cat-pet-carrier'
  );
  assert.equal(
    matchSmartCover({ entityType: 'item', name: 'Nintendo Switch Console', category: 'electronics' })
      .cover.id,
    'item-gaming-handheld'
  );

  // Groups by name & child contents
  assert.equal(
    matchSmartCover({
      entityType: 'org_group',
      name: 'حقيبة سفر العائلة',
      description: 'مقتنيات المطار والرحلات',
    }).cover.id,
    'group-travel-luggage'
  );
  assert.equal(
    matchSmartCover({
      entityType: 'shared_group',
      name: 'مجموعة عامة',
      childItemNames: ['MacBook Pro', 'iPad Air', 'Sony Headphones'],
      childCategories: ['electronics', 'electronics'],
    }).cover.id,
    'group-tech-workstation'
  );
  assert.equal(
    matchSmartCover({
      entityType: 'org_group',
      name: 'مستلزمات أطفالي للمدرسة',
    }).cover.id,
    'group-family-kids'
  );

  // Fallback for unmatched nonsense text without category hint
  const unmatched = matchSmartCover({
    entityType: 'org_group',
    name: 'XZQ-998811',
  });
  assert.equal(unmatched.coverSource, 'fallback');
  assert.ok(unmatched.coverUrl.startsWith('/assets/covers-library/fallbacks/'));

  // Personal photo best-cover selector prioritizes highest quality landscape image
  const best = selectBestCoverFromImages([
    { url: '/api/media/originals/low.png', width: 200, height: 600, sizeBytes: 5000 },
    { url: '/api/media/originals/best.png', width: 1200, height: 900, sizeBytes: 180000 },
  ]);
  assert.equal(best?.url, '/api/media/originals/best.png');
});

test('3. Cloud Storage Adapter SSRF guard blocks local/private endpoints and accepts valid HTTPS endpoints', () => {
  assert.equal(isSafeCloudStorageEndpoint('http://127.0.0.1:9000'), false);
  assert.equal(isSafeCloudStorageEndpoint('https://localhost:9000'), false);
  assert.equal(isSafeCloudStorageEndpoint('https://169.254.169.254/latest'), false);
  assert.equal(isSafeCloudStorageEndpoint('https://10.0.0.5/bucket'), false);
  assert.equal(
    isSafeCloudStorageEndpoint('https://abc123.r2.cloudflarestorage.com'),
    true
  );

  const missingCfg = resolveS3CompatibleConfig({});
  assert.equal(missingCfg, null);

  // Without explicit STORAGE_DRIVER=s3_compatible|r2, default must stay local_persistent
  const defaultLocalCfg = resolveS3CompatibleConfig({
    S3_ENDPOINT: 'https://abc123.r2.cloudflarestorage.com',
    S3_BUCKET: 'finditqr-media',
    S3_REGION: 'auto',
    S3_ACCESS_KEY_ID: 'key-id',
    S3_SECRET_ACCESS_KEY: 'secret-val',
  });
  assert.equal(defaultLocalCfg, null);

  const validCfg = resolveS3CompatibleConfig({
    STORAGE_DRIVER: 's3_compatible',
    S3_ENDPOINT: 'https://abc123.r2.cloudflarestorage.com',
    S3_BUCKET: 'finditqr-media',
    S3_REGION: 'auto',
    S3_ACCESS_KEY_ID: 'key-id',
    S3_SECRET_ACCESS_KEY: 'secret-val',
  });
  assert.ok(validCfg);
  assert.equal(validCfg.bucket, 'finditqr-media');
});

test('4. Full End-to-End Verification: Auto-match items & groups, personal photo priority, manual change, SERVER RESTART persistence, and strict media access control', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finditqr-covers-storage-'));
  const dbFilePath = path.join(tmpDir, 'db.json');
  const mediaRoot = path.join(tmpDir, 'media');
  const adminEmail = 'superadmin@finditqr.test';

  let srv = await startBootableServer({ dbFilePath, mediaRoot, adminEmail });

  try {
    // Register Owner A, Other User B, and Super Admin
    const regA = await fetch(`${srv.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Owner Alpha',
        email: 'alpha@example.test',
        password: 'StrongPassword123!',
      }),
    });
    assert.equal(regA.status, 201);
    const cookieA = regA.headers.get('set-cookie')?.split(';')[0] || '';

    const regB = await fetch(`${srv.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'User Beta',
        email: 'beta@example.test',
        password: 'StrongPassword123!',
      }),
    });
    assert.equal(regB.status, 201);
    const cookieB = regB.headers.get('set-cookie')?.split(';')[0] || '';

    const regAdmin = await fetch(`${srv.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Platform Admin',
        email: adminEmail,
        password: 'AdminPassword123!',
      }),
    });
    assert.equal(regAdmin.status, 201);
    const cookieAdmin = regAdmin.headers.get('set-cookie')?.split(';')[0] || '';

    // Verify /api/covers/library returns all 40 covers and static SVG serves cleanly
    const libRes = await fetch(`${srv.baseUrl}/api/covers/library`);
    assert.equal(libRes.status, 200);
    const libJson = (await libRes.json()) as {
      ok: boolean;
      counts: { total: number; items: number; groups: number; fallbacks: number };
      covers: Array<{ url: string }>;
    };
    assert.equal(libJson.counts.total, 40);
    assert.equal(libJson.counts.items, 25);
    assert.equal(libJson.counts.groups, 10);
    assert.equal(libJson.counts.fallbacks, 5);

    const staticCoverRes = await fetch(`${srv.baseUrl}/assets/covers-library/items/laptop-pro.svg`);
    assert.equal(staticCoverRes.status, 200);
    assert.equal(staticCoverRes.headers.get('x-content-type-options'), 'nosniff');

    // SCENARIO 1: Create individual item WITHOUT cover -> server auto-matches appropriate cover
    const createItem1 = await fetch(`${srv.baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        name: 'مفتاح سيارتي لكزس',
        category: 'keys',
        description: 'مفتاح ريموت سيارة أسود',
        finderNote: 'يرجى التواصل عند العثور عليه',
        city: 'الرياض',
        imageUrl: '',
        rewardOffered: false,
        rewardAmountText: '',
        designId: 'master-04-heritage-compass',
        showPhone: false,
        showWhatsapp: false,
        showEmail: true,
        showTelegram: false,
        anonymousRelayOnly: false,
        customPhone: '',
        customWhatsapp: '',
        customEmail: 'alpha@example.test',
      }),
    });
    assert.equal(createItem1.status, 201);
    const item1 = ((await createItem1.json()) as {
      item: { id: string; coverUrl: string; coverSource: string; codeSerial: string };
    }).item;
    assert.equal(item1.coverUrl, '/assets/covers-library/items/car-key-fob.svg');
    assert.equal(item1.coverSource, 'library_matched');

    // SCENARIO 2: Create organizational group AND shared QR group -> auto-matches group covers
    const createOrgGroup = await fetch(`${srv.baseUrl}/api/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        name: 'مجموعة السفر والرحلات',
        description: 'حقائب الطائرة وجوازات السفر',
      }),
    });
    assert.equal(createOrgGroup.status, 201);
    const orgGroup = ((await createOrgGroup.json()) as {
      group: { id: string; coverUrl: string; coverSource: string };
    }).group;
    assert.equal(orgGroup.coverUrl, '/assets/covers-library/groups/group-travel-luggage.svg');
    assert.equal(orgGroup.coverSource, 'library_matched');

    const createSharedGroup = await fetch(`${srv.baseUrl}/api/shared-qr-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        name: 'حقيبة العمل واللابتوب',
        description: 'أجهزة المكتب اليومية',
        items: [{ itemId: item1.id, isVisible: true }],
      }),
    });
    assert.equal(createSharedGroup.status, 201);
    const sharedGroup = ((await createSharedGroup.json()) as {
      sharedQrGroup: { id: string; coverUrl: string; coverSource: string };
    }).sharedQrGroup;
    assert.equal(sharedGroup.coverSource, 'library_matched');
    assert.ok(sharedGroup.coverUrl.startsWith('/assets/covers-library/groups/'));

    // SCENARIO 3 & 6: Upload personal photo -> stays private until published as cover, then keeps originalImages separate
    const uploadOriginal = await fetch(`${srv.baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        folder: 'originals',
        dataUrl: VALID_PNG_DATA_URL,
        fileName: 'my-wallet-photo.png',
      }),
    });
    assert.equal(uploadOriginal.status, 201);
    const origJson = (await uploadOriginal.json()) as {
      url: string;
      visibility: string;
      storageDriver: string;
    };
    assert.equal(origJson.visibility, 'private');

    // Before attaching to a public item: Owner A = 200, Unauthenticated = 401, User B = 403
    assert.equal(
      (await fetch(`${srv.baseUrl}${origJson.url}`, { headers: { Cookie: cookieA } })).status,
      200
    );
    assert.equal((await fetch(`${srv.baseUrl}${origJson.url}`)).status, 401);
    assert.equal(
      (await fetch(`${srv.baseUrl}${origJson.url}`, { headers: { Cookie: cookieB } })).status,
      403
    );

    // Upload private support ticket image: Owner A = 200, Admin = 200, Unauth = 401, User B = 403
    const uploadTicket = await fetch(`${srv.baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        folder: 'tickets',
        dataUrl: VALID_PNG_DATA_URL,
        fileName: 'receipt-private.png',
      }),
    });
    assert.equal(uploadTicket.status, 201);
    const ticketImg = (await uploadTicket.json()) as { url: string; visibility: string };
    assert.equal(ticketImg.visibility, 'private');
    assert.equal((await fetch(`${srv.baseUrl}${ticketImg.url}`)).status, 401);
    assert.equal(
      (await fetch(`${srv.baseUrl}${ticketImg.url}`, { headers: { Cookie: cookieB } })).status,
      403
    );
    assert.equal(
      (await fetch(`${srv.baseUrl}${ticketImg.url}`, { headers: { Cookie: cookieA } })).status,
      200
    );
    assert.equal(
      (await fetch(`${srv.baseUrl}${ticketImg.url}`, { headers: { Cookie: cookieAdmin } })).status,
      200
    );

    // Create item 2 with uploaded personal photo prioritized automatically (and originalImages stored separately)
    const createItem2 = await fetch(`${srv.baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        name: 'محفظة السفر الشخصية',
        category: 'bags',
        description: 'محفظة سوداء بها بطاقات',
        finderNote: 'اتصل بي فورًا',
        city: 'جدة',
        imageUrl: '',
        originalImages: [origJson.url],
        rewardOffered: false,
        rewardAmountText: '',
        designId: 'master-04-heritage-compass',
        showPhone: false,
        showWhatsapp: false,
        showEmail: true,
        showTelegram: false,
        anonymousRelayOnly: false,
        customPhone: '',
        customWhatsapp: '',
        customEmail: 'alpha@example.test',
      }),
    });
    assert.equal(createItem2.status, 201);
    const item2 = ((await createItem2.json()) as {
      item: { id: string; coverUrl: string; coverSource: string; originalImages: string[] };
    }).item;
    assert.equal(item2.coverUrl, origJson.url);
    assert.equal(item2.coverSource, 'auto_selected');
    assert.deepEqual(item2.originalImages, [origJson.url]);

    // Now that origJson.url is the active cover of a public item, public GET succeeds (200)
    assert.equal((await fetch(`${srv.baseUrl}${origJson.url}`)).status, 200);

    // SCENARIO 4: Manually change item2's cover to a curated library cover while preserving originalImages separately!
    const patchManualCover = await fetch(`${srv.baseUrl}/api/items/${item2.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        coverUrl: '/assets/covers-library/items/leather-wallet.svg',
        imageUrl: '/assets/covers-library/items/leather-wallet.svg',
        coverSource: 'user_selected',
        originalImages: [origJson.url],
      }),
    });
    assert.equal(patchManualCover.status, 200);
    const patchedItem2 = ((await patchManualCover.json()) as {
      item: { coverUrl: string; coverSource: string; originalImages: string[] };
    }).item;
    assert.equal(patchedItem2.coverUrl, '/assets/covers-library/items/leather-wallet.svg');
    assert.equal(patchedItem2.coverSource, 'user_selected');
    assert.deepEqual(patchedItem2.originalImages, [origJson.url]);

    // Because origJson.url is NO LONGER the public cover, unauthenticated access is immediately blocked again (401) while Owner A still sees it (200)!
    assert.equal((await fetch(`${srv.baseUrl}${origJson.url}`)).status, 401);
    assert.equal(
      (await fetch(`${srv.baseUrl}${origJson.url}`, { headers: { Cookie: cookieA } })).status,
      200
    );

    // SCENARIO 5: REAL SERVER SHUTDOWN + RESTART — verify images, items, covers, and access control persist 100%!
    await srv.close();
    srv = await startBootableServer({ dbFilePath, mediaRoot, adminEmail });

    // Owner A can still access both their private original photo and private ticket image after restart
    const origAfterRestart = await fetch(`${srv.baseUrl}${origJson.url}`, {
      headers: { Cookie: cookieA },
    });
    assert.equal(origAfterRestart.status, 200);
    assert.equal(origAfterRestart.headers.get('content-type'), 'image/png');

    // Unauthenticated & User B are STILL blocked after restart!
    assert.equal((await fetch(`${srv.baseUrl}${origJson.url}`)).status, 401);
    assert.equal(
      (await fetch(`${srv.baseUrl}${origJson.url}`, { headers: { Cookie: cookieB } })).status,
      403
    );

    // Items, manual cover, auto-matched cover, and separated originalImages all persist after restart
    const workspaceAfterRestart = await fetch(`${srv.baseUrl}/api/workspace`, {
      headers: { Cookie: cookieA },
    });
    assert.equal(workspaceAfterRestart.status, 200);
    const itemsList = ((await workspaceAfterRestart.json()) as {
      items: Array<{ id: string; coverUrl: string; coverSource: string; originalImages?: string[] }>;
    }).items;
    const restoredItem1 = itemsList.find((i) => i.id === item1.id);
    const restoredItem2 = itemsList.find((i) => i.id === item2.id);
    assert.equal(restoredItem1?.coverUrl, '/assets/covers-library/items/car-key-fob.svg');
    assert.equal(restoredItem2?.coverUrl, '/assets/covers-library/items/leather-wallet.svg');
    assert.deepEqual(restoredItem2?.originalImages, [origJson.url]);

    // Owner media assets list persists after restart
    const myAssetsRes = await fetch(`${srv.baseUrl}/api/media/my-assets`, {
      headers: { Cookie: cookieA },
    });
    assert.equal(myAssetsRes.status, 200);
    const myAssetsJson = (await myAssetsRes.json()) as { assets: Array<{ url: string }> };
    assert.equal(myAssetsJson.assets.length, 2);
  } finally {
    await srv.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
