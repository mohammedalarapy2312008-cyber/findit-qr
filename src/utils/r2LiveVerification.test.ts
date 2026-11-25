import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { createServerApp } from '../../server';
import {
  deleteObjectFromCloudStorage,
  getPermanentStorageStatus,
  headObjectInCloudStorage,
  verifyCloudStorageRoundtrip,
  type CloudStorageOverrides,
} from '../server/integrations/cloudStorageAdapter';

const ONE_PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+8l8AAAAASUVORK5CYII=';

const LIVE_S3_CREDENTIALS_KEYS = [
  'S3_ENDPOINT',
  'S3_BUCKET',
  'S3_REGION',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const;

function getMissingLiveR2Vars(env: NodeJS.ProcessEnv = process.env): string[] {
  return LIVE_S3_CREDENTIALS_KEYS.filter((k) => !(env[k] || '').trim());
}

async function startIsolatedLiveR2Server(opts: {
  dbFilePath: string;
  mediaRoot: string;
  cloudStorageOverrides: CloudStorageOverrides;
}) {
  const { app, db } = await createServerApp({
    dbFilePath: opts.dbFilePath,
    mediaRoot: opts.mediaRoot,
    disableVite: true,
    cloudStorageOverrides: opts.cloudStorageOverrides,
  });

  const server = await new Promise<import('node:http').Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const addr = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${addr.port}`,
    db,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

test('LIVE Cloudflare R2 Verification: connection, upload, retrieval, access control, server restart persistence, and deletion (non-destructive, zero migration)', async (t) => {
  const missing = getMissingLiveR2Vars(process.env);
  if (missing.length > 0) {
    t.skip(
      `Real Cloudflare R2 credentials are not set in environment yet (missing: ${missing.join(', ')}). Waiting for hosting secrets.`
    );
    return;
  }

  // Confirm default STORAGE_DRIVER safety in current environment without mutating process.env
  const currentHostDriver = (process.env.STORAGE_DRIVER || 'local_persistent').trim() || 'local_persistent';
  const liveTestEnv: NodeJS.ProcessEnv = {
    ...process.env,
    STORAGE_DRIVER: 's3_compatible',
  };
  const overrides: CloudStorageOverrides = { env: liveTestEnv };

  const status = getPermanentStorageStatus({ env: liveTestEnv });
  assert.equal(status.activeDriver, 's3_compatible', 'Live test env must resolve s3_compatible driver');
  assert.equal(status.s3Configured, true, 'Live R2 S3 config must be valid');
  assert.equal(status.cloudUploadEnabled, true, 'Cloud upload must be enabled in live test env');

  // 1. LIVE CONNECTION & SIGV4 ROUNDTRIP (PUT -> HEAD -> GET -> DELETE)
  const roundtrip = await verifyCloudStorageRoundtrip(overrides);
  assert.equal(
    roundtrip.ok,
    true,
    `Live R2 connection/roundtrip failed: ${roundtrip.errorCode || 'unknown error'}`
  );
  assert.equal(roundtrip.steps.put, true, 'Live R2 PUT probe must succeed');
  assert.equal(roundtrip.steps.head, true, 'Live R2 HEAD probe must succeed');
  assert.equal(roundtrip.steps.get, true, 'Live R2 GET probe must succeed');
  assert.equal(roundtrip.steps.byteMatch, true, 'Live R2 GET bytes must match PUT payload');
  assert.equal(roundtrip.steps.delete, true, 'Live R2 DELETE probe must succeed');

  // 2. FULL END-TO-END SERVER VERIFICATION ON ISOLATED TEMP DB (NEVER TOUCHES .data/)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finditqr-r2-live-verify-'));
  const dbFilePath = path.join(tmpDir, 'db.json');
  const mediaRoot = path.join(tmpDir, 'media');
  const uploadedCloudKeys = new Set<string>();

  let srv = await startIsolatedLiveR2Server({
    dbFilePath,
    mediaRoot,
    cloudStorageOverrides: overrides,
  });

  try {
    // Register isolated test Owner A & User B
    const regA = await fetch(`${srv.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'R2 Live Owner A',
        email: 'r2.live.owner.a@example.test',
        password: 'StrongPassword#2026!',
        city: 'الرياض',
        preferredLanguage: 'ar',
      }),
    });
    assert.equal(regA.status, 201);
    const cookieA = regA.headers.get('set-cookie')!.split(';')[0];

    const regB = await fetch(`${srv.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'R2 Live User B',
        email: 'r2.live.user.b@example.test',
        password: 'StrongPassword#2026!',
        city: 'جدة',
        preferredLanguage: 'ar',
      }),
    });
    assert.equal(regB.status, 201);
    const cookieB = regB.headers.get('set-cookie')!.split(';')[0];

    const expectedBytes = Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64');

    // 2a. Upload private original image to real Cloudflare R2
    const upOrig = await fetch(`${srv.baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        folder: 'originals',
        fileName: 'r2-live-private-original.png',
        dataUrl: `data:image/png;base64,${ONE_PIXEL_PNG_BASE64}`,
      }),
    });
    assert.equal(upOrig.status, 201);
    const upOrigJson = (await upOrig.json()) as {
      ok: boolean;
      url: string;
      storageDriver: string;
      cloudMirrored: boolean;
      visibility: string;
    };
    assert.equal(upOrigJson.ok, true);
    assert.equal(upOrigJson.storageDriver, 's3_compatible');
    assert.equal(upOrigJson.cloudMirrored, true);
    assert.equal(upOrigJson.visibility, 'private');

    // 2b. Upload public cover image to real Cloudflare R2 (separate from originals)
    const upCover = await fetch(`${srv.baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        folder: 'covers',
        fileName: 'r2-live-public-cover.png',
        dataUrl: `data:image/png;base64,${ONE_PIXEL_PNG_BASE64}`,
      }),
    });
    assert.equal(upCover.status, 201);
    const upCoverJson = (await upCover.json()) as {
      ok: boolean;
      url: string;
      storageDriver: string;
      cloudMirrored: boolean;
      visibility: string;
    };
    assert.equal(upCoverJson.ok, true);
    assert.equal(upCoverJson.storageDriver, 's3_compatible');
    assert.equal(upCoverJson.cloudMirrored, true);
    assert.equal(upCoverJson.visibility, 'public');

    // Collect real cloud keys for verification & guaranteed cleanup
    const assetsRes = await fetch(`${srv.baseUrl}/api/media/my-assets`, {
      headers: { Cookie: cookieA },
    });
    assert.equal(assetsRes.status, 200);
    const assetsText = await assetsRes.text();
    assert.ok(!assetsText.includes(liveTestEnv.S3_ACCESS_KEY_ID!), 'Access Key ID must never leak in API');
    assert.ok(!assetsText.includes(liveTestEnv.S3_SECRET_ACCESS_KEY!), 'Secret Access Key must never leak in API');

    const assetsJson = JSON.parse(assetsText) as {
      assets: Array<{ url: string; cloudKey?: string | null }>;
    };
    const origAsset = assetsJson.assets.find((a) => a.url === upOrigJson.url);
    const coverAsset = assetsJson.assets.find((a) => a.url === upCoverJson.url);
    assert.ok(origAsset?.cloudKey, 'Original asset must record real R2 cloudKey');
    assert.ok(coverAsset?.cloudKey, 'Cover asset must record real R2 cloudKey');
    uploadedCloudKeys.add(origAsset.cloudKey);
    uploadedCloudKeys.add(coverAsset.cloudKey);

    // Confirm both objects physically exist in Cloudflare R2 via HEAD
    const headOrig = await headObjectInCloudStorage({
      objectKey: origAsset.cloudKey,
      env: liveTestEnv,
    });
    const headCover = await headObjectInCloudStorage({
      objectKey: coverAsset.cloudKey,
      env: liveTestEnv,
    });
    assert.equal(headOrig.exists, true, 'Private original must physically exist in R2');
    assert.equal(headCover.exists, true, 'Public cover must physically exist in R2');

    // 3. RETRIEVAL & ACCESS CONTROL BEFORE RESTART
    const unauthOrig = await fetch(`${srv.baseUrl}${upOrigJson.url}`);
    assert.equal(unauthOrig.status, 401, 'Unauthenticated user must get 401 on private original');

    const userBOrig = await fetch(`${srv.baseUrl}${upOrigJson.url}`, {
      headers: { Cookie: cookieB },
    });
    assert.equal(userBOrig.status, 403, 'Different user must get 403 on private original');

    const ownerAOrig = await fetch(`${srv.baseUrl}${upOrigJson.url}`, {
      headers: { Cookie: cookieA },
    });
    assert.equal(ownerAOrig.status, 200, 'Owner A must retrieve private original');
    assert.deepEqual(Buffer.from(await ownerAOrig.arrayBuffer()), expectedBytes);

    const unauthCover = await fetch(`${srv.baseUrl}${upCoverJson.url}`);
    assert.equal(unauthCover.status, 200, 'Public cover must be accessible without auth');
    assert.deepEqual(Buffer.from(await unauthCover.arrayBuffer()), expectedBytes);

    // 4. PERSISTENCE AFTER SERVER RESTART + LOCAL EPHEMERAL WIPE (LIVE R2 FALLBACK)
    const origLocalPath = path.join(mediaRoot, 'originals', path.basename(upOrigJson.url));
    const coverLocalPath = path.join(mediaRoot, 'covers', path.basename(upCoverJson.url));
    if (fs.existsSync(origLocalPath)) fs.unlinkSync(origLocalPath);
    if (fs.existsSync(coverLocalPath)) fs.unlinkSync(coverLocalPath);

    await srv.close();
    srv = await startIsolatedLiveR2Server({
      dbFilePath,
      mediaRoot,
      cloudStorageOverrides: overrides,
    });

    // Exact same URLs must serve bytes directly from Cloudflare R2 while preserving access control!
    const unauthOrigAfterRestart = await fetch(`${srv.baseUrl}${upOrigJson.url}`);
    assert.equal(unauthOrigAfterRestart.status, 401);

    const userBOrigAfterRestart = await fetch(`${srv.baseUrl}${upOrigJson.url}`, {
      headers: { Cookie: cookieB },
    });
    assert.equal(userBOrigAfterRestart.status, 403);

    const ownerAOrigAfterRestart = await fetch(`${srv.baseUrl}${upOrigJson.url}`, {
      headers: { Cookie: cookieA },
    });
    assert.equal(ownerAOrigAfterRestart.status, 200);
    assert.deepEqual(Buffer.from(await ownerAOrigAfterRestart.arrayBuffer()), expectedBytes);

    const unauthCoverAfterRestart = await fetch(`${srv.baseUrl}${upCoverJson.url}`);
    assert.equal(unauthCoverAfterRestart.status, 200);
    assert.deepEqual(Buffer.from(await unauthCoverAfterRestart.arrayBuffer()), expectedBytes);

    // 5. SAFE DELETION & ACCESS CONTROL ON DELETE
    const delByUserB = await fetch(`${srv.baseUrl}${upOrigJson.url}`, {
      method: 'DELETE',
      headers: { Cookie: cookieB },
    });
    assert.equal(delByUserB.status, 403, 'Non-owner must be blocked from deleting another user file');

    const delOrigByOwner = await fetch(`${srv.baseUrl}${upOrigJson.url}`, {
      method: 'DELETE',
      headers: { Cookie: cookieA },
    });
    assert.equal(delOrigByOwner.status, 200);
    const delOrigJson = (await delOrigByOwner.json()) as { deleted: boolean; deletedCloud: boolean };
    assert.equal(delOrigJson.deleted, true);
    assert.equal(delOrigJson.deletedCloud, true);
    uploadedCloudKeys.delete(origAsset.cloudKey);

    const delCoverByOwner = await fetch(`${srv.baseUrl}${upCoverJson.url}`, {
      method: 'DELETE',
      headers: { Cookie: cookieA },
    });
    assert.equal(delCoverByOwner.status, 200);
    const delCoverJson = (await delCoverByOwner.json()) as { deleted: boolean; deletedCloud: boolean };
    assert.equal(delCoverJson.deleted, true);
    assert.equal(delCoverJson.deletedCloud, true);
    uploadedCloudKeys.delete(coverAsset.cloudKey);

    // Confirm both objects are truly deleted from Cloudflare R2 and API returns 404
    const headOrigAfterDel = await headObjectInCloudStorage({
      objectKey: origAsset.cloudKey,
      env: liveTestEnv,
    });
    const headCoverAfterDel = await headObjectInCloudStorage({
      objectKey: coverAsset.cloudKey,
      env: liveTestEnv,
    });
    assert.equal(headOrigAfterDel.exists, false, 'Deleted original must no longer exist in R2');
    assert.equal(headCoverAfterDel.exists, false, 'Deleted cover must no longer exist in R2');

    const getOrigAfterDel = await fetch(`${srv.baseUrl}${upOrigJson.url}`, {
      headers: { Cookie: cookieA },
    });
    assert.equal(getOrigAfterDel.status, 404);

    // Verify health endpoint leaks zero secrets
    const healthRes = await fetch(`${srv.baseUrl}/api/integrations/health`);
    const healthText = await healthRes.text();
    assert.ok(!healthText.includes(liveTestEnv.S3_ACCESS_KEY_ID!));
    assert.ok(!healthText.includes(liveTestEnv.S3_SECRET_ACCESS_KEY!));

    console.log(
      `[R2 LIVE VERIFICATION PASSED] Bucket=${status.s3Bucket} EndpointHost=${status.s3EndpointHost} HostDefaultDriver=${currentHostDriver}`
    );
  } finally {
    // Guaranteed cleanup of any test objects created in real R2
    for (const key of uploadedCloudKeys) {
      await deleteObjectFromCloudStorage({ objectKey: key, env: liveTestEnv }).catch(() => {});
    }
    await srv.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
