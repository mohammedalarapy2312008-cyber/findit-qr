import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createServerApp } from '../../server';
import {
  buildSigV4Request,
  CloudStorageOverrides,
  getPermanentStorageStatus,
  isCloudStorageDriverEnabled,
  isSafeCloudStorageEndpoint,
  REQUIRED_R2_ENV_VARS,
  resolveS3CompatibleConfig,
} from '../server/integrations/cloudStorageAdapter';
import { buildQrRecoveryUrl } from './qrLogic';
import { buildSharedQrRecoveryUrl } from './sharedQrLogic';

const VALID_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

/**
 * In-memory Cloudflare R2 S3-compatible protocol simulator for deterministic SigV4 testing.
 * Verifies Authorization AWS4-HMAC-SHA256 headers and handles PUT, GET, HEAD, DELETE.
 */
function createSimulatedR2Harness() {
  const objects = new Map<string, { body: Buffer; contentType: string }>();
  const requestLog: Array<{ method: string; url: string; hasSigV4: boolean }> = [];

  const fetchImpl: typeof fetch = async (input, init) => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || 'GET').toUpperCase();
    const headersObj = (init?.headers || {}) as Record<string, string>;
    const authHeader = headersObj.Authorization || headersObj.authorization || '';
    const hasSigV4 =
      authHeader.startsWith('AWS4-HMAC-SHA256 Credential=') &&
      authHeader.includes('/auto/s3/aws4_request') &&
      Boolean(headersObj['x-amz-date']) &&
      Boolean(headersObj['x-amz-content-sha256']);

    requestLog.push({ method, url: urlStr, hasSigV4 });
    if (!hasSigV4) {
      return new Response('Missing SigV4', { status: 403 });
    }

    const parsed = new URL(urlStr);
    const key = parsed.pathname.replace(/^\/+/, '');

    if (method === 'PUT') {
      const bodyBytes =
        init?.body instanceof Uint8Array
          ? Buffer.from(init.body)
          : Buffer.from(String(init?.body || ''));
      const contentType = headersObj['Content-Type'] || headersObj['content-type'] || 'application/octet-stream';
      objects.set(key, { body: bodyBytes, contentType });
      return new Response(null, { status: 200 });
    }

    if (method === 'HEAD') {
      const found = objects.get(key);
      if (!found) return new Response(null, { status: 404 });
      return new Response(null, {
        status: 200,
        headers: {
          'content-length': String(found.body.length),
          'content-type': found.contentType,
        },
      });
    }

    if (method === 'GET') {
      const found = objects.get(key);
      if (!found) return new Response('Not Found', { status: 404 });
      return new Response(new Uint8Array(found.body), {
        status: 200,
        headers: { 'content-type': found.contentType },
      });
    }

    if (method === 'DELETE') {
      objects.delete(key);
      return new Response(null, { status: 204 });
    }

    return new Response('Method Not Allowed', { status: 405 });
  };

  return { objects, requestLog, fetchImpl };
}

async function bootIsolatedServer(opts: {
  dbFilePath: string;
  mediaRoot: string;
  adminEmail?: string;
  cloudStorageOverrides?: CloudStorageOverrides;
}): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const { app } = await createServerApp({
    dbFilePath: opts.dbFilePath,
    mediaRoot: opts.mediaRoot,
    adminEmail: opts.adminEmail,
    cloudStorageOverrides: opts.cloudStorageOverrides,
    disableVite: true,
    disableAuthRateLimit: true,
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

// ============================================================================
// PART A: CLOUDFLARE R2 INTEGRATION, FALLBACK, ACCESS CONTROL & SAFE MIGRATION
// ============================================================================

test('A1. Cloudflare R2 env config, local fallback toggle, bucket deduplication, and SigV4 signing', () => {
  assert.deepEqual([...REQUIRED_R2_ENV_VARS], [
    'STORAGE_DRIVER',
    'S3_ENDPOINT',
    'S3_BUCKET',
    'S3_REGION',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
  ]);

  // Explicit local_persistent keeps R2 inactive even when credentials are present
  const localEnv: NodeJS.ProcessEnv = {
    STORAGE_DRIVER: 'local_persistent',
    S3_ENDPOINT: 'https://demoacct123.r2.cloudflarestorage.com',
    S3_BUCKET: 'finditqr-media',
    S3_REGION: 'auto',
    S3_ACCESS_KEY_ID: 'r2-access-demo',
    S3_SECRET_ACCESS_KEY: 'r2-secret-demo',
  };
  assert.equal(isCloudStorageDriverEnabled(localEnv), false);
  assert.equal(resolveS3CompatibleConfig(localEnv), null);
  const localStatus = getPermanentStorageStatus({ env: localEnv });
  assert.equal(localStatus.activeDriver, 'local_persistent');
  assert.equal(localStatus.localFallbackActive, true);

  // s3_compatible / r2 activates Cloudflare R2 and normalizes trailing /bucket on endpoint
  const r2Env: NodeJS.ProcessEnv = {
    STORAGE_DRIVER: 's3_compatible',
    S3_ENDPOINT: 'https://demoacct123.r2.cloudflarestorage.com/finditqr-media/',
    S3_BUCKET: 'finditqr-media',
    S3_REGION: 'auto',
    S3_ACCESS_KEY_ID: 'r2-access-demo',
    S3_SECRET_ACCESS_KEY: 'r2-secret-demo',
  };
  const cfg = resolveS3CompatibleConfig(r2Env);
  assert.ok(cfg);
  assert.equal(cfg.endpoint, 'https://demoacct123.r2.cloudflarestorage.com');
  assert.equal(cfg.region, 'auto');

  const r2Status = getPermanentStorageStatus({ env: r2Env });
  assert.equal(r2Status.activeDriver, 's3_compatible');
  assert.equal(r2Status.providerLabel, 'cloudflare_r2');
  assert.equal(r2Status.missingRequiredVars.length, 0);

  // Endpoint safety guard
  assert.equal(isSafeCloudStorageEndpoint('http://demoacct123.r2.cloudflarestorage.com'), false);
  assert.equal(isSafeCloudStorageEndpoint('https://169.254.169.254'), false);
  assert.equal(isSafeCloudStorageEndpoint('https://demoacct123.r2.cloudflarestorage.com'), true);

  // SigV4 headers for PUT/GET/HEAD/DELETE
  for (const method of ['PUT', 'GET', 'HEAD', 'DELETE'] as const) {
    const req = buildSigV4Request({
      config: cfg,
      method,
      objectKey: 'users/u1/originals/ori-123.png',
      body: Buffer.alloc(0),
    });
    assert.equal(
      req.url,
      'https://demoacct123.r2.cloudflarestorage.com/finditqr-media/users/u1/originals/ori-123.png'
    );
    assert.ok(req.headers.Authorization.startsWith('AWS4-HMAC-SHA256 Credential=r2-access-demo/'));
    assert.ok(req.headers.Authorization.includes('/auto/s3/aws4_request'));
  }
});

test('A2. Cloudflare R2 E2E: upload, retrieve, local-loss cloud fallback, access control, delete, restart persistence, safe migration, and zero secret leakage', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finditqr-r2-e2e-'));
  const dbFilePath = path.join(tmpDir, 'db.json');
  const mediaRoot = path.join(tmpDir, 'media');
  const adminEmail = 'r2admin@finditqr.test';
  const r2 = createSimulatedR2Harness();

  const r2Env: NodeJS.ProcessEnv = {
    STORAGE_DRIVER: 's3_compatible',
    S3_ENDPOINT: 'https://demoacct999.r2.cloudflarestorage.com',
    S3_BUCKET: 'finditqr-media',
    S3_REGION: 'auto',
    S3_ACCESS_KEY_ID: 'SUPER_SECRET_R2_KEY_ID_DO_NOT_LEAK',
    S3_SECRET_ACCESS_KEY: 'SUPER_SECRET_R2_VALUE_DO_NOT_LEAK',
  };

  let srv = await bootIsolatedServer({
    dbFilePath,
    mediaRoot,
    adminEmail,
    cloudStorageOverrides: { env: r2Env, fetchImpl: r2.fetchImpl },
  });

  try {
    // Register Admin, Owner A, and User B
    const regAdmin = await fetch(`${srv.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'R2 Admin', email: adminEmail, password: 'AdminPassword123!' }),
    });
    assert.equal(regAdmin.status, 201);
    const cookieAdmin = regAdmin.headers.get('set-cookie')?.split(';')[0] || '';

    const regA = await fetch(`${srv.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Owner A', email: 'ownera@test.local', password: 'StrongPassword123!' }),
    });
    assert.equal(regA.status, 201);
    const cookieA = regA.headers.get('set-cookie')?.split(';')[0] || '';

    const regB = await fetch(`${srv.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'User B', email: 'userb@test.local', password: 'StrongPassword123!' }),
    });
    assert.equal(regB.status, 201);
    const cookieB = regB.headers.get('set-cookie')?.split(';')[0] || '';

    // 1. Verify R2 live roundtrip endpoint (non-admin blocked 403, admin succeeds 200)
    assert.equal(
      (await fetch(`${srv.baseUrl}/api/storage/r2/verify`, { method: 'POST', headers: { Cookie: cookieA } })).status,
      403
    );
    const verifyRes = await fetch(`${srv.baseUrl}/api/storage/r2/verify`, {
      method: 'POST',
      headers: { Cookie: cookieAdmin },
    });
    assert.equal(verifyRes.status, 200);
    const verifyJson = (await verifyRes.json()) as {
      ok: boolean;
      report: {
        providerLabel: string;
        steps: { put: boolean; head: boolean; get: boolean; byteMatch: boolean; delete: boolean };
      };
    };
    assert.equal(verifyJson.ok, true);
    assert.equal(verifyJson.report.providerLabel, 'cloudflare_r2');
    assert.deepEqual(verifyJson.report.steps, {
      put: true,
      head: true,
      get: true,
      byteMatch: true,
      delete: true,
    });
    // Ensure zero secrets leaked in verify or integrations status
    const statusRes = await fetch(`${srv.baseUrl}/api/integrations/status`, {
      headers: { Cookie: cookieAdmin },
    });
    const statusText = await statusRes.text();
    assert.ok(!statusText.includes('SUPER_SECRET_R2_KEY_ID_DO_NOT_LEAK'));
    assert.ok(!statusText.includes('SUPER_SECRET_R2_VALUE_DO_NOT_LEAK'));
    assert.ok(!JSON.stringify(verifyJson).includes('SUPER_SECRET_R2'));

    // 2. Upload personal photo -> mirrored to R2 AND local fallback kept
    const upRes = await fetch(`${srv.baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ folder: 'originals', dataUrl: VALID_PNG_DATA_URL, fileName: 'bag.png' }),
    });
    assert.equal(upRes.status, 201);
    const upJson = (await upRes.json()) as {
      url: string;
      storageDriver: string;
      cloudMirrored: boolean;
      visibility: string;
    };
    assert.equal(upJson.storageDriver, 's3_compatible');
    assert.equal(upJson.cloudMirrored, true);
    assert.equal(upJson.visibility, 'private');
    assert.equal(r2.objects.size, 1);

    // 3. Remove local copy to simulate ephemeral container disk wipe -> MUST still retrieve from R2 with exact same URL & strict access control!
    const filename = upJson.url.split('/').pop()!;
    const localFilePath = path.join(mediaRoot, 'originals', filename);
    assert.ok(fs.existsSync(localFilePath));
    fs.unlinkSync(localFilePath);
    assert.equal(fs.existsSync(localFilePath), false);

    // Unauth 401, User B 403, Owner A 200 served directly from R2!
    assert.equal((await fetch(`${srv.baseUrl}${upJson.url}`)).status, 401);
    assert.equal((await fetch(`${srv.baseUrl}${upJson.url}`, { headers: { Cookie: cookieB } })).status, 403);
    const cloudServed = await fetch(`${srv.baseUrl}${upJson.url}`, { headers: { Cookie: cookieA } });
    assert.equal(cloudServed.status, 200);
    assert.equal(cloudServed.headers.get('content-type'), 'image/png');
    assert.equal(cloudServed.headers.get('x-content-type-options'), 'nosniff');

    // 4. Restart server -> file STILL retrieved from R2 with same URL and same access control!
    await srv.close();
    srv = await bootIsolatedServer({
      dbFilePath,
      mediaRoot,
      adminEmail,
      cloudStorageOverrides: { env: r2Env, fetchImpl: r2.fetchImpl },
    });
    assert.equal((await fetch(`${srv.baseUrl}${upJson.url}`)).status, 401);
    assert.equal((await fetch(`${srv.baseUrl}${upJson.url}`, { headers: { Cookie: cookieA } })).status, 200);

    // 5. Delete media file -> User B blocked 403, Owner A succeeds 200 and removes object from R2!
    assert.equal(
      (await fetch(`${srv.baseUrl}${upJson.url}`, { method: 'DELETE', headers: { Cookie: cookieB } })).status,
      403
    );
    const delRes = await fetch(`${srv.baseUrl}${upJson.url}`, {
      method: 'DELETE',
      headers: { Cookie: cookieA },
    });
    assert.equal(delRes.status, 200);
    const delJson = (await delRes.json()) as { deleted: boolean; deletedCloud: boolean };
    assert.equal(delJson.deleted, true);
    assert.equal(delJson.deletedCloud, true);
    assert.equal(r2.objects.size, 0);
    assert.equal((await fetch(`${srv.baseUrl}${upJson.url}`, { headers: { Cookie: cookieA } })).status, 404);

    // 6. Test safe non-destructive Local-to-R2 migration (seed a local-only file first)
    const legacyDir = path.join(mediaRoot, 'covers');
    fs.mkdirSync(legacyDir, { recursive: true });
    const legacyPath = path.join(legacyDir, 'cov-legacy1234.png');
    const pngBytes = Buffer.from(VALID_PNG_DATA_URL.split(',')[1], 'base64');
    fs.writeFileSync(legacyPath, pngBytes);

    // Migration plan (admin-only, read-only)
    assert.equal(
      (await fetch(`${srv.baseUrl}/api/storage/r2/migration-plan`, { headers: { Cookie: cookieA } })).status,
      403
    );
    const planRes = await fetch(`${srv.baseUrl}/api/storage/r2/migration-plan`, {
      headers: { Cookie: cookieAdmin },
    });
    assert.equal(planRes.status, 200);
    const planJson = (await planRes.json()) as {
      plan: { dryRun: boolean; preserveLocalBackups: boolean; totalLocalFiles: number; pendingCopyCount: number };
    };
    assert.equal(planJson.plan.dryRun, true);
    assert.equal(planJson.plan.preserveLocalBackups, true);
    assert.equal(planJson.plan.pendingCopyCount, 1);

    // Calling migrate WITHOUT confirmation defaults to dryRun (copies 0 files)
    const dryMigRes = await fetch(`${srv.baseUrl}/api/storage/r2/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({}),
    });
    const dryMigJson = (await dryMigRes.json()) as { migration: { dryRun: boolean; copiedCount: number } };
    assert.equal(dryMigJson.migration.dryRun, true);
    assert.equal(dryMigJson.migration.copiedCount, 0);

    // Confirmed migration copies to R2, verifies HEAD, preserves URL, and NEVER deletes local copy!
    const realMigRes = await fetch(`${srv.baseUrl}/api/storage/r2/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({ dryRun: false, confirmMigration: true }),
    });
    assert.equal(realMigRes.status, 200);
    const realMigJson = (await realMigRes.json()) as {
      ok: boolean;
      migration: {
        dryRun: boolean;
        preserveLocalBackups: boolean;
        deletedLocalCount: number;
        copiedCount: number;
        verifiedCount: number;
      };
    };
    assert.equal(realMigJson.ok, true);
    assert.equal(realMigJson.migration.copiedCount, 1);
    assert.equal(realMigJson.migration.verifiedCount, 1);
    assert.equal(realMigJson.migration.deletedLocalCount, 0);
    assert.equal(fs.existsSync(legacyPath), true);
    assert.equal(r2.objects.size, 1);
  } finally {
    await srv.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ============================================================================
// PART B: ALL 14 QR LIFECYCLE & CROSS-DEVICE RECOVERY SCENARIOS (ISOLATED DB)
// ============================================================================

test('B1. Full 14-Scenario Individual QR & Shared QR Group Lifecycle and Cross-Device Recovery', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finditqr-qr-lifecycle-'));
  const dbFilePath = path.join(tmpDir, 'db.json');
  const mediaRoot = path.join(tmpDir, 'media');
  const srv = await bootIsolatedServer({ dbFilePath, mediaRoot });

  try {
    // Register isolated owner account
    const regRes = await fetch(`${srv.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Sara Al-Harbi',
        email: 'sara.qrtest@example.test',
        password: 'StrongPassword123!',
      }),
    });
    assert.equal(regRes.status, 201);
    const ownerCookie = regRes.headers.get('set-cookie')?.split(';')[0] || '';

    // Add 4 centralized contact methods (Phone, WhatsApp, Email, Telegram)
    const addContact = async (type: string, label: string, value: string) => {
      const r = await fetch(`${srv.baseUrl}/api/contact-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
        body: JSON.stringify({ type, label, value, isActive: true }),
      });
      assert.equal(r.status, 201);
      return ((await r.json()) as { method: { id: string } }).method.id;
    };

    const phoneId = await addContact('phone', 'Personal Phone', '+966501234567');
    const waId = await addContact('whatsapp', 'Travel WhatsApp', '+966559876543');
    const emailId = await addContact('email', 'Recovery Email', 'recovery.sara@example.test');
    const tgId = await addContact('telegram', 'Private Telegram', '@sara_private_tg');
    assert.ok(phoneId && waId && emailId && tgId);

    // SCENARIO 1: Create new item with Individual QR, selecting ONLY WhatsApp + Email (Phone & Telegram unselected)
    const createItem1 = await fetch(`${srv.baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({
        name: 'حقيبة لابتوب ماك بوك',
        category: 'bags',
        description: 'حقيبة رمادية مقاومة للماء',
        finderNote: 'يرجى التواصل لإعادة الحقيبة',
        city: 'الرياض',
        imageUrl: '',
        rewardOffered: true,
        rewardAmountText: '300 ريال',
        designId: 'master-04-heritage-compass',
        selectedContactMethodIds: [waId, emailId],
        showPhone: false,
        showWhatsapp: true,
        showEmail: true,
        showTelegram: false,
        anonymousRelayOnly: false,
        customPhone: '',
        customWhatsapp: '+966559876543',
        customEmail: 'recovery.sara@example.test',
        customTelegram: '',
      }),
    });
    assert.equal(createItem1.status, 201);
    const item1 = ((await createItem1.json()) as {
      item: { id: string; codeSerial: string; name: string; coverUrl: string };
    }).item;
    assert.ok(item1.codeSerial.startsWith('FQR-'));

    // SCENARIO 13: QR code content/URL MUST contain ONLY opaque code & ZERO personal contact data
    const individualQrContent = buildQrRecoveryUrl(item1.codeSerial, 'https://finditqr.app');
    assert.equal(individualQrContent, `https://finditqr.app/found/${encodeURIComponent(item1.codeSerial)}`);
    assert.ok(!individualQrContent.includes('966501234567'));
    assert.ok(!individualQrContent.includes('966559876543'));
    assert.ok(!individualQrContent.includes('sara'));
    assert.ok(!individualQrContent.includes('@'));

    // SCENARIOS 2, 3, 4: Scan QR from separate unauthenticated device (NO cookie!) -> allowed info & selected channels ONLY
    const scan1Res = await fetch(`${srv.baseUrl}/api/public/qr/${encodeURIComponent(item1.codeSerial)}`);
    assert.equal(scan1Res.status, 200);
    const scan1 = ((await scan1Res.json()) as {
      payload: {
        isPublicPageActive: boolean;
        inactiveReason: string | null;
        itemNameAr: string;
        cityAr: string;
        imageUrl: string;
        descriptionAr?: string;
        allowFinderMessages: boolean;
        allowFoundReports: boolean;
        visibleChannels: {
          phone: string | null;
          whatsapp: string | null;
          email: string | null;
          telegram: string | null;
        };
        visibleContactMethods?: Array<{ type: string; value: string }>;
      };
    }).payload;

    assert.equal(scan1.isPublicPageActive, true);
    assert.equal(scan1.inactiveReason, null);
    assert.equal(scan1.itemNameAr, 'حقيبة لابتوب ماك بوك');
    assert.equal(scan1.cityAr, 'الرياض');
    assert.ok(scan1.imageUrl.length > 0);
    // Selected channels (WhatsApp + Email) exposed; unselected (Phone + Telegram) & account login email NOT exposed!
    const contactTypes1 = (scan1.visibleContactMethods || []).map((c) => c.type);
    assert.ok(contactTypes1.includes('whatsapp') || Boolean(scan1.visibleChannels.whatsapp));
    assert.ok(contactTypes1.includes('email') || Boolean(scan1.visibleChannels.email));
    assert.equal(scan1.visibleChannels.phone, null);
    assert.equal(scan1.visibleChannels.telegram, null);
    assert.ok(!contactTypes1.includes('phone'));
    assert.ok(!contactTypes1.includes('telegram'));
    const scan1Str = JSON.stringify(scan1);
    assert.ok(!scan1Str.includes('966501234567'));
    assert.ok(!scan1Str.includes('sara_private_tg'));
    assert.ok(!scan1Str.includes('sara.qrtest@example.test'));

    // SCENARIO 5: Edit item details -> updates reflect immediately on public recovery page
    const editRes = await fetch(`${srv.baseUrl}/api/items/${item1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({
        name: 'حقيبة لابتوب محدثة',
        description: 'وصف محدث للحقيبة الرمادية',
        recoveryInstructions: 'ملاحظة استرداد محدثة فورًا',
        city: 'جدة',
      }),
    });
    assert.equal(editRes.status, 200);

    const scanAfterEdit = ((await (await fetch(`${srv.baseUrl}/api/public/qr/${encodeURIComponent(item1.codeSerial)}`)).json()) as {
      payload: { itemNameAr: string; descriptionAr?: string; finderNoteAr: string; cityAr: string };
    }).payload;
    assert.equal(scanAfterEdit.itemNameAr, 'حقيبة لابتوب محدثة');
    assert.equal(scanAfterEdit.descriptionAr, 'وصف محدث للحقيبة الرمادية');
    assert.equal(scanAfterEdit.finderNoteAr, 'ملاحظة استرداد محدثة فورًا');
    assert.equal(scanAfterEdit.cityAr, 'جدة');

    // SCENARIO 14: Privacy settings changes reflect immediately on public recovery page
    const privacyPatch = await fetch(`${srv.baseUrl}/api/items/${item1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({
        privacySettings: {
          publicPageEnabled: true,
          showDescription: false,
          showCity: false,
          showImage: false,
          allowFinderMessages: false,
          allowFoundReports: false,
        },
        selectedContactMethodIds: [],
        contactChannels: {
          anonymousRelayOnly: true,
          showPhone: false,
          showWhatsapp: false,
          showEmail: false,
          showTelegram: false,
        },
      }),
    });
    assert.equal(privacyPatch.status, 200);

    const scanAfterPrivacy = ((await (await fetch(`${srv.baseUrl}/api/public/qr/${encodeURIComponent(item1.codeSerial)}`)).json()) as {
      payload: {
        isPublicPageActive: boolean;
        cityAr: string;
        imageUrl: string;
        descriptionAr?: string;
        allowFinderMessages: boolean;
        allowFoundReports: boolean;
        anonymousRelayOnly: boolean;
        visibleChannels: { phone: string | null; whatsapp: string | null; email: string | null; telegram: string | null };
        visibleContactMethods?: Array<unknown>;
      };
    }).payload;
    assert.equal(scanAfterPrivacy.isPublicPageActive, true);
    assert.equal(scanAfterPrivacy.cityAr, '');
    assert.equal(scanAfterPrivacy.imageUrl, '');
    assert.equal(scanAfterPrivacy.descriptionAr || '', '');
    assert.equal(scanAfterPrivacy.allowFinderMessages, false);
    assert.equal(scanAfterPrivacy.allowFoundReports, false);
    assert.equal(scanAfterPrivacy.anonymousRelayOnly, true);
    assert.equal(scanAfterPrivacy.visibleChannels.phone, null);
    assert.equal(scanAfterPrivacy.visibleChannels.whatsapp, null);
    assert.equal(scanAfterPrivacy.visibleChannels.email, null);
    assert.equal(scanAfterPrivacy.visibleChannels.telegram, null);
    assert.equal((scanAfterPrivacy.visibleContactMethods || []).length, 0);

    // Also verify message/found-report rejected when disabled by privacy
    const blockedMsg = await fetch(`${srv.baseUrl}/api/public/qr/${encodeURIComponent(item1.codeSerial)}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderName: 'Finder', message: 'Hello I found your bag' }),
    });
    assert.equal(blockedMsg.status, 403);

    // SCENARIO 6: Pause/hide public page (publicPageEnabled: false) -> blocks public access completely
    await fetch(`${srv.baseUrl}/api/items/${item1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({
        privacySettings: { publicPageEnabled: false },
      }),
    });
    const pausedScan = ((await (await fetch(`${srv.baseUrl}/api/public/qr/${encodeURIComponent(item1.codeSerial)}`)).json()) as {
      payload: { isPublicPageActive: boolean; inactiveReason: string | null };
    }).payload;
    assert.equal(pausedScan.isPublicPageActive, false);
    assert.equal(pausedScan.inactiveReason, 'public_disabled');

    // Re-enable item1 public page & messages for Shared QR testing, and create item2 (respecting Free Plan 2-item limit)
    await fetch(`${srv.baseUrl}/api/items/${item1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({
        privacySettings: {
          publicPageEnabled: true,
          showDescription: true,
          showCity: true,
          showImage: true,
          allowFinderMessages: true,
          allowFoundReports: true,
        },
        selectedContactMethodIds: [waId],
        contactChannels: {
          anonymousRelayOnly: false,
          showWhatsapp: true,
          customWhatsapp: '+966559876543',
        },
      }),
    });

    const createItem = async (name: string, category: string, description: string) => {
      const r = await fetch(`${srv.baseUrl}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
        body: JSON.stringify({
          name,
          category,
          description,
          finderNote: 'اتصل عند العثور عليه',
          city: 'الرياض',
          imageUrl: '',
          rewardOffered: false,
          rewardAmountText: '',
          designId: 'master-04-heritage-compass',
          selectedContactMethodIds: [waId],
          showPhone: false,
          showWhatsapp: true,
          showEmail: false,
          showTelegram: false,
          anonymousRelayOnly: false,
          customPhone: '',
          customWhatsapp: '+966559876543',
          customEmail: '',
        }),
      });
      assert.equal(r.status, 201);
      return ((await r.json()) as { item: { id: string; codeSerial: string } }).item;
    };

    const item2 = await createItem('مفاتيح المنزل الاحتياطية', 'keys', 'ميدالية زرقاء بمفتاحين');

    // SCENARIO 7: Create Shared QR Group containing both items (item1, item2)
    const createGroup1 = await fetch(`${srv.baseUrl}/api/shared-qr-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({
        name: 'حقيبة السفر المشتركة',
        description: 'كل الأغراض داخل حقيبة الرحلة',
        items: [
          { itemId: item1.id, isVisible: true },
          { itemId: item2.id, isVisible: true },
        ],
      }),
    });
    assert.equal(createGroup1.status, 201);
    const group1 = ((await createGroup1.json()) as {
      sharedQrGroup: { id: string; shareCode: string; items: Array<{ itemId: string }> };
    }).sharedQrGroup;
    assert.ok(group1.shareCode.startsWith('SQR-'));

    // SCENARIO 13 (Shared QR URL): Contains ONLY opaque shareCode and ZERO personal contact data
    const sharedQrContent = buildSharedQrRecoveryUrl(group1.shareCode, 'https://finditqr.app');
    assert.equal(sharedQrContent, `https://finditqr.app/shared/${encodeURIComponent(group1.shareCode)}`);
    assert.ok(!sharedQrContent.includes('966559876543'));
    assert.ok(!sharedQrContent.includes('sara'));

    // SCENARIO 12: Attempt to link item1 to a SECOND active Shared QR Group -> MUST reject with HTTP 409!
    const conflictGroupRes = await fetch(`${srv.baseUrl}/api/shared-qr-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({
        name: 'مجموعة متعارضة',
        description: 'محاولة ربط غرض مرتبط بالفعل',
        items: [{ itemId: item1.id, isVisible: true }],
      }),
    });
    assert.equal(conflictGroupRes.status, 409);
    const conflictJson = (await conflictGroupRes.json()) as { errorCode: string };
    assert.equal(conflictJson.errorCode, 'ITEM_ALREADY_IN_SHARED_GROUP');

    // SCENARIOS 8 & 9: Scan Shared QR Group from another unauthenticated device -> shows linked items & allows item recovery actions
    const sharedScanRes = await fetch(`${srv.baseUrl}/api/public/shared-qr/${encodeURIComponent(group1.shareCode)}`);
    assert.equal(sharedScanRes.status, 200);
    const sharedPayload = ((await sharedScanRes.json()) as {
      payload: {
        isActive: boolean;
        name: string;
        items: Array<{ itemId: string; itemNameAr: string; finderNoteAr: string }>;
      };
    }).payload;
    assert.equal(sharedPayload.isActive, true);
    assert.equal(sharedPayload.name, 'حقيبة السفر المشتركة');
    assert.equal(sharedPayload.items.length, 2);
    assert.ok(sharedPayload.items.some((x) => x.itemId === item1.id && x.itemNameAr === 'حقيبة لابتوب محدثة'));
    assert.ok(sharedPayload.items.some((x) => x.itemId === item2.id));

    // Submit found-report & message on selected item1 inside Shared QR Group from unauthenticated finder device
    const sharedFoundRes = await fetch(
      `${srv.baseUrl}/api/public/shared-qr/${encodeURIComponent(group1.shareCode)}/items/${item1.id}/found-report`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }
    );
    assert.equal(sharedFoundRes.status, 201);

    const sharedMsgRes = await fetch(
      `${srv.baseUrl}/api/public/shared-qr/${encodeURIComponent(group1.shareCode)}/items/${item1.id}/message`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'Khaled Finder',
          senderContact: '+966511112222',
          message: 'Found your laptop bag at airport gate 4.',
        }),
      }
    );
    assert.equal(sharedMsgRes.status, 201);

    // While item1 is in an active Shared QR Group, its Individual QR MUST be paused (no dual-active QR conflict!)
    const indWhileShared = ((await (await fetch(`${srv.baseUrl}/api/public/qr/${encodeURIComponent(item1.codeSerial)}`)).json()) as {
      payload: { isPublicPageActive: boolean; inactiveReason: string | null };
    }).payload;
    assert.equal(indWhileShared.isPublicPageActive, false);
    assert.equal(indWhileShared.inactiveReason, 'shared_mode');

    // SCENARIO 10a (Unlink item2 without auto-restoring individual QR): remove item2 from group
    const unlinkItem2 = await fetch(
      `${srv.baseUrl}/api/shared-qr-groups/${group1.id}/items/${item2.id}?restoreIndividual=false`,
      { method: 'DELETE', headers: { Cookie: ownerCookie } }
    );
    assert.equal(unlinkItem2.status, 200);
    const sharedAfterUnlink = ((await (await fetch(`${srv.baseUrl}/api/public/shared-qr/${encodeURIComponent(group1.shareCode)}`)).json()) as {
      payload: { items: Array<{ itemId: string }> };
    }).payload;
    assert.equal(sharedAfterUnlink.items.length, 1);
    assert.equal(sharedAfterUnlink.items[0].itemId, item1.id);

    // Verify item2 did NOT auto-reactivate Individual QR when unlinked with restoreIndividual=false
    const item2ScanAfterUnlink = ((await (await fetch(`${srv.baseUrl}/api/public/qr/${encodeURIComponent(item2.codeSerial)}`)).json()) as {
      payload: { isPublicPageActive: boolean; inactiveReason: string | null };
    }).payload;
    assert.equal(item2ScanAfterUnlink.isPublicPageActive, false);
    assert.equal(item2ScanAfterUnlink.inactiveReason, 'unassigned_from_shared');

    // SCENARIO 10b (Re-link item2, then delete item2 completely) -> deleted item disappears from Shared QR immediately
    const relinkRes = await fetch(`${srv.baseUrl}/api/shared-qr-groups/${group1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({
        items: [
          { itemId: item1.id, isVisible: true },
          { itemId: item2.id, isVisible: true },
        ],
      }),
    });
    assert.equal(relinkRes.status, 200);
    const deleteItem2Res = await fetch(`${srv.baseUrl}/api/items/${item2.id}`, {
      method: 'DELETE',
      headers: { Cookie: ownerCookie },
    });
    assert.equal(deleteItem2Res.status, 200);
    const sharedAfterItemDelete = ((await (await fetch(`${srv.baseUrl}/api/public/shared-qr/${encodeURIComponent(group1.shareCode)}`)).json()) as {
      payload: { items: Array<{ itemId: string }> };
    }).payload;
    assert.equal(sharedAfterItemDelete.items.length, 1);
    assert.equal(sharedAfterItemDelete.items[0].itemId, item1.id);

    // SCENARIOS 10c & 11: Pause/deactivate Shared QR Group -> Shared QR becomes inactive AND item1's Individual QR MUST NOT auto-reactivate!
    const pauseGroupRes = await fetch(`${srv.baseUrl}/api/shared-qr-groups/${group1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({ isActive: false }),
    });
    assert.equal(pauseGroupRes.status, 200);

    const pausedSharedScan = ((await (await fetch(`${srv.baseUrl}/api/public/shared-qr/${encodeURIComponent(group1.shareCode)}`)).json()) as {
      payload: { isActive: boolean; items: Array<unknown> };
    }).payload;
    assert.equal(pausedSharedScan.isActive, false);
    assert.equal(pausedSharedScan.items.length, 0);

    // CRITICAL SCENARIO 11: Individual QR of item1 MUST remain inactive — NEVER auto-reactivated!
    const item1ScanAfterGroupPause = ((await (await fetch(`${srv.baseUrl}/api/public/qr/${encodeURIComponent(item1.codeSerial)}`)).json()) as {
      payload: { isPublicPageActive: boolean; inactiveReason: string | null };
    }).payload;
    assert.equal(item1ScanAfterGroupPause.isPublicPageActive, false);
    assert.equal(item1ScanAfterGroupPause.inactiveReason, 'shared_group_paused');

    // Also delete the paused Shared QR Group (default without restoreIndividual=true) -> item1 STILL does NOT auto-reactivate!
    const deleteGroupRes = await fetch(`${srv.baseUrl}/api/shared-qr-groups/${group1.id}`, {
      method: 'DELETE',
      headers: { Cookie: ownerCookie },
    });
    assert.equal(deleteGroupRes.status, 200);
    const item1ScanAfterGroupDelete = ((await (await fetch(`${srv.baseUrl}/api/public/qr/${encodeURIComponent(item1.codeSerial)}`)).json()) as {
      payload: { isPublicPageActive: boolean; inactiveReason: string | null };
    }).payload;
    assert.equal(item1ScanAfterGroupDelete.isPublicPageActive, false);
    assert.equal(item1ScanAfterGroupDelete.inactiveReason, 'unassigned_from_shared');

    // Only explicit owner action restores item1's original Individual QR (preserving exact same codeSerial!)
    const explicitRestore = await fetch(`${srv.baseUrl}/api/items/${item1.id}/restore-individual-qr`, {
      method: 'POST',
      headers: { Cookie: ownerCookie },
    });
    assert.equal(explicitRestore.status, 200);
    const item1RestoredScan = ((await (await fetch(`${srv.baseUrl}/api/public/qr/${encodeURIComponent(item1.codeSerial)}`)).json()) as {
      payload: { isPublicPageActive: boolean; itemNameAr: string };
    }).payload;
    assert.equal(item1RestoredScan.isPublicPageActive, true);
    assert.equal(item1RestoredScan.itemNameAr, 'حقيبة لابتوب محدثة');
  } finally {
    await srv.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
