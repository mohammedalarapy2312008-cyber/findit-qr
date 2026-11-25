import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { createServerApp, hashSessionToken } from './server';

function makeTempDbPath(name: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'finditqr-test-'));
  return path.join(dir, `${name}.json`);
}

test('API security: PATCH /api/profile blocks client plan, limit, uid, and emailVerified escalation', async (t) => {
  const dbPath = makeTempDbPath('profile-escalation');
  const { app } = await createServerApp({
    dbFilePath: dbPath,
    disableVite: true,
    disableAuthRateLimit: true,
  });

  const server = app.listen(0);
  t.after(() => {
    server.close();
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Sara Al-Harbi',
      email: 'sara@example.com',
      password: 'Password123!',
      country: 'Saudi Arabia',
      preferredLanguage: 'ar',
    }),
  });
  assert.equal(regRes.status, 201);
  const regBody = (await regRes.json()) as { ok: boolean; token: string; profile: any };
  assert.equal(regBody.profile.plan, 'Free');
  assert.equal(regBody.profile.activeItemsLimit, 2);
  assert.equal(regBody.profile.contactMethodsLimit, 2);

  // Attempt privilege escalation via PATCH /api/profile
  const escRes = await fetch(`${baseUrl}/api/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regBody.token}`,
    },
    body: JSON.stringify({
      displayName: 'Sara Updated',
      country: 'UAE',
      plan: 'Business',
      activeItemsLimit: 250,
      contactMethodsLimit: 7,
      emailVerified: true,
      uid: 'uid-forged',
    }),
  });
  assert.equal(escRes.status, 200);
  const escBody = (await escRes.json()) as { ok: boolean; profile: any };
  assert.equal(escBody.profile.displayName, 'Sara Updated');
  assert.equal(escBody.profile.plan, 'Free');
  assert.equal(escBody.profile.activeItemsLimit, 2);
  assert.equal(escBody.profile.contactMethodsLimit, 2);
  assert.equal(escBody.profile.emailVerified, false);
  assert.equal(escBody.profile.uid, regBody.profile.uid);

  // Also reject non-HTTPS photoURL on PATCH /api/profile
  const badPhotoRes = await fetch(`${baseUrl}/api/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regBody.token}`,
    },
    body: JSON.stringify({
      displayName: 'Sara Updated',
      photoURL: 'javascript:alert(1)',
    }),
  });
  assert.equal(badPhotoRes.status, 400);
  const badPhotoBody = (await badPhotoRes.json()) as { errorCode: string };
  assert.equal(badPhotoBody.errorCode, 'INVALID_PHOTO_URL');

  // Verify user still cannot exceed 2 active items on Free plan
  const validItem = {
    name: 'Test Camera',
    category: 'electronics',
    description: 'Black camera with strap',
    finderNote: 'Please contact me to return safely',
    city: 'Riyadh',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
    rewardOffered: false,
    rewardAmountText: '',
    designId: 'design-luggage-pro',
    showPhone: true,
    showWhatsapp: false,
    showEmail: false,
    showTelegram: false,
    anonymousRelayOnly: false,
    customPhone: '+966500000001',
    customWhatsapp: '',
    customEmail: '',
  };

  for (let i = 0; i < 2; i++) {
    const r = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${regBody.token}`,
      },
      body: JSON.stringify({ ...validItem, name: `Test Item ${i + 1}` }),
    });
    assert.equal(r.status, 201);
  }

  const thirdRes = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regBody.token}`,
    },
    body: JSON.stringify({ ...validItem, name: 'Test Item 3' }),
  });
  assert.equal(thirdRes.status, 403);
  const thirdBody = (await thirdRes.json()) as { errorCode: string };
  assert.equal(thirdBody.errorCode, 'QUOTA_LIMIT_REACHED');
});

test('API security: session tokens are SHA-256 hashed at rest, expire cleanly, and migrate legacy sessions', async (t) => {
  const dbPath = makeTempDbPath('session-security');

  // Seed legacy plaintext session to confirm automatic migration without data loss
  const legacyRawToken = crypto.randomBytes(24).toString('hex');
  const legacyUid = 'usr-legacy-01';
  fs.writeFileSync(
    dbPath,
    JSON.stringify({
      users: {
        [legacyUid]: {
          uid: legacyUid,
          email: 'legacy@example.com',
          passwordSalt: '00',
          passwordHash: '00',
          profile: {
            uid: legacyUid,
            displayName: 'Legacy User',
            displayNameAr: 'Legacy User',
            displayNameEn: 'Legacy User',
            email: 'legacy@example.com',
            photoURL: '',
            country: 'SA',
            preferredLanguage: 'ar',
            plan: 'Free',
            accountStatus: 'active',
            activeItemsCount: 0,
            activeItemsLimit: 2,
            contactMethodsLimit: 2,
            lastQuotaItemId: '',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            emailVerified: false,
            phone: '',
            whatsapp: '',
            telegram: '',
            cityAr: '',
            cityEn: '',
            accountType: 'personal',
            organizationNameAr: '',
            organizationNameEn: '',
            defaultLanguage: 'ar',
            joinedAt: '2026-01-01',
          },
        },
      },
      sessions: {
        [legacyRawToken]: legacyUid,
      },
      items: {},
      messages: {},
      notifications: {},
      activities: {},
    }),
    'utf8'
  );

  // Load with very short TTL to test expiration after legacy migration works
  const { app } = await createServerApp({
    dbFilePath: dbPath,
    disableVite: true,
    disableAuthRateLimit: true,
    sessionTtlMs: 80,
  });

  const server = app.listen(0);
  t.after(() => {
    server.close();
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  // Confirm plaintext legacy token was removed from disk and replaced by hash
  const onDiskRaw = fs.readFileSync(dbPath, 'utf8');
  assert.equal(onDiskRaw.includes(legacyRawToken), false);
  assert.equal(onDiskRaw.includes(hashSessionToken(legacyRawToken)), true);

  // Migrated token still authenticates before expiry
  const okRes = await fetch(`${baseUrl}/api/workspace`, {
    headers: { Authorization: `Bearer ${legacyRawToken}` },
  });
  assert.equal(okRes.status, 200);

  // Wait past TTL and confirm session expires
  await new Promise((r) => setTimeout(r, 110));
  const expiredRes = await fetch(`${baseUrl}/api/workspace`, {
    headers: { Authorization: `Bearer ${legacyRawToken}` },
  });
  assert.equal(expiredRes.status, 401);
  const expiredBody = (await expiredRes.json()) as { errorCode: string };
  assert.equal(expiredBody.errorCode, 'SESSION_EXPIRED');
});

test('API validation & public QR recovery: strict PATCH validation, immutable serials, and 404 on unknown QR', async (t) => {
  const dbPath = makeTempDbPath('items-and-public-qr');
  const { app } = await createServerApp({
    dbFilePath: dbPath,
    disableVite: true,
    disableAuthRateLimit: true,
  });

  const server = app.listen(0);
  t.after(() => {
    server.close();
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  // Unknown public QR returns 404 QR_NOT_FOUND
  const missingQrRes = await fetch(`${baseUrl}/api/public/qr/NON-EXISTENT-9999`);
  assert.equal(missingQrRes.status, 404);
  const missingQrBody = (await missingQrRes.json()) as { ok: boolean; errorCode: string };
  assert.equal(missingQrBody.ok, false);
  assert.equal(missingQrBody.errorCode, 'QR_NOT_FOUND');

  // Register user and test POST + PATCH item validation
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Khalid Tester',
      email: 'khalid@example.com',
      password: 'Password123!',
    }),
  });
  const regBody = (await regRes.json()) as { token: string };

  const badImgPost = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regBody.token}`,
    },
    body: JSON.stringify({
      name: 'Backpack',
      category: 'bags',
      description: 'Dark navy travel backpack',
      finderNote: 'Call me if found please',
      city: 'Jeddah',
      imageUrl: 'http://insecure.example.com/bag.jpg',
      rewardOffered: false,
      rewardAmountText: '',
      designId: 'design-luggage-pro',
      showPhone: false,
      showWhatsapp: false,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: true,
      customPhone: '',
      customWhatsapp: '',
      customEmail: '',
    }),
  });
  assert.equal(badImgPost.status, 400);
  assert.equal(((await badImgPost.json()) as any).errorCode, 'INVALID_IMAGE_URL');

  const createRes = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regBody.token}`,
    },
    body: JSON.stringify({
      name: 'Backpack',
      category: 'bags',
      description: 'Dark navy travel backpack',
      finderNote: 'Call me if found please',
      city: 'Jeddah',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
      rewardOffered: false,
      rewardAmountText: '',
      designId: 'design-luggage-pro',
      showPhone: false,
      showWhatsapp: false,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: true,
      customPhone: '',
      customWhatsapp: '',
      customEmail: '',
    }),
  });
  assert.equal(createRes.status, 201);
  const created = (await createRes.json()) as { item: any };
  const originalSerial = created.item.codeSerial;
  assert.match(originalSerial, /^FQR-/);

  // PATCH rejects javascript: imageUrl and short name
  const badPatch = await fetch(`${baseUrl}/api/items/${created.item.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regBody.token}`,
    },
    body: JSON.stringify({
      name: 'X',
      imageUrl: 'javascript:alert(1)',
    }),
  });
  assert.equal(badPatch.status, 400);

  // Valid PATCH preserves codeSerial even if client tries to overwrite it
  const okPatch = await fetch(`${baseUrl}/api/items/${created.item.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regBody.token}`,
    },
    body: JSON.stringify({
      name: 'Travel Backpack Pro',
      codeSerial: 'FQR-HIJACKED',
    }),
  });
  assert.equal(okPatch.status, 200);
  const patchedBody = (await okPatch.json()) as { item: any };
  assert.equal(patchedBody.item.name, 'Travel Backpack Pro');
  assert.equal(patchedBody.item.codeSerial, originalSerial);

  // Created item resolves via unauthenticated public QR endpoint
  const pubRes = await fetch(`${baseUrl}/api/public/qr/${originalSerial}`);
  assert.equal(pubRes.status, 200);
  const pubBody = (await pubRes.json()) as { payload: any };
  assert.equal(pubBody.payload.serialNumber, originalSerial);
  assert.equal(pubBody.payload.ownerUid, undefined);
});

test('API security: auth login enforces sliding-window rate limiting', async (t) => {
  const dbPath = makeTempDbPath('rate-limit');
  const { app } = await createServerApp({
    dbFilePath: dbPath,
    disableVite: true,
    disableAuthRateLimit: false,
  });

  const server = app.listen(0);
  t.after(() => {
    server.close();
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  let lastStatus = 0;
  for (let i = 0; i < 12; i++) {
    const r = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'target@example.com', password: 'WrongPassword123' }),
    });
    lastStatus = r.status;
  }
  assert.equal(lastStatus, 429);
});

test('Super Admin RBAC: ADMIN_EMAIL bootstrap, 401/403 isolation, re-auth enforcement, and security log', async (t) => {
  const dbPath = makeTempDbPath('super-admin-rbac');
  const { app } = await createServerApp({
    dbFilePath: dbPath,
    disableVite: true,
    disableAuthRateLimit: true,
    adminEmail: 'boss@finditqr.test',
  });

  const server = app.listen(0);
  t.after(() => {
    server.close();
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  // 1. Unauthenticated access to admin API returns 401
  const unauthRes = await fetch(`${baseUrl}/api/admin/dashboard`);
  assert.equal(unauthRes.status, 401);

  // 2. Regular user registers and cannot bootstrap or hit /api/admin/*
  const regUserRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Normal Customer',
      email: 'customer@finditqr.test',
      password: 'Password123!',
    }),
  });
  const regUser = (await regUserRes.json()) as { token: string; profile: any };
  assert.equal(regUser.profile.role, 'user');

  const userAdminAttempt = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${regUser.token}` },
  });
  assert.equal(userAdminAttempt.status, 403);

  const userBootstrapAttempt = await fetch(`${baseUrl}/api/admin/bootstrap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regUser.token}`,
    },
    body: JSON.stringify({ password: 'Password123!' }),
  });
  assert.equal(userBootstrapAttempt.status, 403);

  // 3. Matching ADMIN_EMAIL user registers -> not yet verified until bootstrap
  const regAdminRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Chief Admin',
      email: 'boss@finditqr.test',
      password: 'AdminPassword123!',
    }),
  });
  const regAdmin = (await regAdminRes.json()) as { token: string; profile: any };

  // Complete secure bootstrap with password verification
  const bootRes = await fetch(`${baseUrl}/api/admin/bootstrap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regAdmin.token}`,
    },
    body: JSON.stringify({ password: 'AdminPassword123!' }),
  });
  assert.equal(bootRes.status, 200);
  const bootBody = (await bootRes.json()) as { role: string };
  assert.equal(bootBody.role, 'super_admin');

  // 4. Dashboard returns real data (2 users, 58 seeded published templates, 0 orders)
  const dashRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${regAdmin.token}` },
  });
  assert.equal(dashRes.status, 200);
  const dashBody = (await dashRes.json()) as { analytics: any };
  assert.equal(dashBody.analytics.totals.totalUsers, 2);
  assert.equal(dashBody.analytics.totals.publishedTemplates, 58);
  assert.equal(dashBody.analytics.totals.totalOrders, 0);

  // 5. Security panel records customer's unauthorized attempts
  const secRes = await fetch(`${baseUrl}/api/admin/security`, {
    headers: { Authorization: `Bearer ${regAdmin.token}` },
  });
  assert.equal(secRes.status, 200);
  const secBody = (await secRes.json()) as { securityEvents: any[]; auditLogs: any[] };
  assert.ok(secBody.securityEvents.length >= 2);
  assert.ok(secBody.auditLogs.some((l) => l.action === 'SUPER_ADMIN_BOOTSTRAPPED'));
});

test('Super Admin Templates: ZIP security validation, batch import, and core template delete protection', async (t) => {
  const JSZip = (await import('jszip')).default;
  const dbPath = makeTempDbPath('templates-zip');
  const { app } = await createServerApp({
    dbFilePath: dbPath,
    disableVite: true,
    disableAuthRateLimit: true,
    adminEmail: 'boss@finditqr.test',
  });

  const server = app.listen(0);
  t.after(() => {
    server.close();
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const regAdmin = (await (
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Chief Admin',
        email: 'boss@finditqr.test',
        password: 'AdminPassword123!',
      }),
    })
  ).json()) as { token: string };

  await fetch(`${baseUrl}/api/admin/bootstrap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regAdmin.token}`,
    },
    body: JSON.stringify({ password: 'AdminPassword123!' }),
  });

  // Malicious ZIP containing .js script is rejected
  const badZip = new JSZip();
  badZip.file('evil.js', 'alert(1)');
  badZip.file('manifest.json', JSON.stringify([{ titleEn: 'Bad' }]));
  const badB64 = await badZip.generateAsync({ type: 'base64' });

  const badZipRes = await fetch(`${baseUrl}/api/admin/templates/upload-zip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regAdmin.token}`,
    },
    body: JSON.stringify({ fileName: 'bad.zip', base64Zip: badB64 }),
  });
  assert.equal(badZipRes.status, 400);
  assert.equal(((await badZipRes.json()) as any).errorCode, 'ZIP_SECURITY_VALIDATION_FAILED');

  // Clean ZIP with manifest.json + preview.svg imports cleanly as draft
  const goodZip = new JSZip();
  goodZip.file(
    'manifest.json',
    JSON.stringify([
      {
        titleAr: 'قالب سفر مستورد',
        titleEn: 'Imported Travel Shield',
        category: 'luggage_tag',
        priceSar: 49,
      },
    ])
  );
  goodZip.file('preview.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>');
  const goodB64 = await goodZip.generateAsync({ type: 'base64' });

  const goodZipRes = await fetch(`${baseUrl}/api/admin/templates/upload-zip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regAdmin.token}`,
    },
    body: JSON.stringify({ fileName: 'pack.zip', base64Zip: goodB64 }),
  });
  assert.equal(goodZipRes.status, 200);
  const goodZipBody = (await goodZipRes.json()) as { importedCount: number; importedTemplates: any[] };
  assert.equal(goodZipBody.importedCount, 1);
  assert.equal(goodZipBody.importedTemplates[0].status, 'draft');

  // Core template deletion is strictly blocked (409)
  const delCoreRes = await fetch(`${baseUrl}/api/admin/templates/design-luggage-pro`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${regAdmin.token}` },
  });
  assert.equal(delCoreRes.status, 409);
});

test('Manual Payments, Licenses, Plans, Suspension & Staff RBAC work end-to-end', async (t) => {
  const dbPath = makeTempDbPath('finance-staff-suspension');
  const { app } = await createServerApp({
    dbFilePath: dbPath,
    disableVite: true,
    disableAuthRateLimit: true,
    adminEmail: 'boss@finditqr.test',
  });

  const server = app.listen(0);
  t.after(() => {
    server.close();
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  // Register super admin, staff candidate, and customer
  const regAdmin = (await (
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Boss',
        email: 'boss@finditqr.test',
        password: 'AdminPassword123!',
      }),
    })
  ).json()) as { token: string; profile: any };

  await fetch(`${baseUrl}/api/admin/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${regAdmin.token}` },
    body: JSON.stringify({ password: 'AdminPassword123!' }),
  });

  const regStaff = (await (
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Finance Staff',
        email: 'staff@finditqr.test',
        password: 'StaffPassword123!',
      }),
    })
  ).json()) as { token: string; profile: any };

  const regBuyer = (await (
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Buyer',
        email: 'buyer@finditqr.test',
        password: 'BuyerPassword123!',
      }),
    })
  ).json()) as { token: string; profile: any };

  // Buyer submits manual transfer order -> must start as pending_review (never paid!)
  const ordRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regBuyer.token}`,
    },
    body: JSON.stringify({
      orderType: 'subscription_upgrade',
      targetId: 'plus',
      durationMonths: 3,
      currency: 'SAR',
      transferReference: 'BANK-REF-8821',
    }),
  });
  assert.equal(ordRes.status, 201);
  const ordBody = (await ordRes.json()) as { order: any };
  assert.equal(ordBody.order.status, 'pending_review');
  assert.equal(ordBody.order.amountSar, 57); // 19 * 3

  // Grant staff_admin only 'finance' + 'support' permissions (super_admin only)
  const grantRes = await fetch(`${baseUrl}/api/admin/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regAdmin.token}`,
    },
    body: JSON.stringify({
      email: 'staff@finditqr.test',
      role: 'staff_admin',
      permissions: ['finance', 'support'],
    }),
  });
  assert.equal(grantRes.status, 200);

  // Staff cannot access 'security' or modify super_admin
  const staffSecRes = await fetch(`${baseUrl}/api/admin/security`, {
    headers: { Authorization: `Bearer ${regStaff.token}` },
  });
  assert.equal(staffSecRes.status, 403);

  // Staff tries to approve order without re-auth -> 428 REAUTH_REQUIRED
  const needReauthRes = await fetch(`${baseUrl}/api/admin/orders/${ordBody.order.id}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regStaff.token}`,
    },
    body: JSON.stringify({ decision: 'approve', reason: 'Verified wire' }),
  });
  assert.equal(needReauthRes.status, 428);

  // Staff re-authenticates and approves order -> Buyer's plan upgrades to Plus!
  await fetch(`${baseUrl}/api/admin/reauth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regStaff.token}`,
    },
    body: JSON.stringify({ password: 'StaffPassword123!' }),
  });

  const approveRes = await fetch(`${baseUrl}/api/admin/orders/${ordBody.order.id}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regStaff.token}`,
    },
    body: JSON.stringify({ decision: 'approve', reason: 'Bank transfer verified' }),
  });
  assert.equal(approveRes.status, 200);
  const approvedOrder = (await approveRes.json()) as { order: any };
  assert.equal(approvedOrder.order.status, 'approved');
  assert.equal(approvedOrder.order.reviewedByEmail, 'staff@finditqr.test');

  const buyerWs = (await (
    await fetch(`${baseUrl}/api/workspace`, {
      headers: { Authorization: `Bearer ${regBuyer.token}` },
    })
  ).json()) as { profile: any };
  assert.equal(buyerWs.profile.plan, 'Plus');
  assert.equal(buyerWs.profile.activeItemsLimit, 10);

  // Super Admin suspends Buyer -> Buyer's active session is immediately revoked (401) AND re-login is blocked (403 ACCOUNT_SUSPENDED)
  const suspendRes = await fetch(`${baseUrl}/api/admin/users/${regBuyer.profile.uid}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regAdmin.token}`,
    },
    body: JSON.stringify({ accountStatus: 'suspended', adminNotes: 'Policy check' }),
  });
  assert.equal(suspendRes.status, 200);

  const buyerAfterSuspend = await fetch(`${baseUrl}/api/workspace`, {
    headers: { Authorization: `Bearer ${regBuyer.token}` },
  });
  assert.equal(buyerAfterSuspend.status, 401);

  const suspendedLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'buyer@finditqr.test', password: 'BuyerPassword123!' }),
  });
  assert.equal(suspendedLoginRes.status, 403);
});

test('Complete 8-Scenario Auth Audit: Email/Password, Logout/Login, Cookie+Restart Session Persistence, Same-Email Account Recovery, Google Sign-In & Deduplication, Data Restoration, User Isolation & Super Admin Preservation', async (t) => {
  const dbPath = makeTempDbPath('auth-8-mandatory-scenarios');

  const mockGoogleTokens: Record<
    string,
    { googleUid: string; email: string; emailVerified: boolean; displayName: string; photoURL?: string }
  > = {
    'valid-google-token-user1-existing-email': {
      googleUid: 'google-uid-user1-998877',
      email: 'user1@finditqr.test',
      emailVerified: true,
      displayName: 'User One Google',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    },
    'valid-google-token-user2-new': {
      googleUid: 'google-uid-user2-112233',
      email: 'googleuser2@finditqr.test',
      emailVerified: true,
      displayName: 'Google Native User',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    },
    'valid-google-token-superadmin': {
      googleUid: 'google-uid-admin-777777',
      email: 'superboss@finditqr.test',
      emailVerified: true,
      displayName: 'Super Boss Admin',
    },
    'unverified-google-token': {
      googleUid: 'google-uid-unverified',
      email: 'user1@finditqr.test',
      emailVerified: false,
      displayName: 'Unverified Attacker',
    },
  };

  const { app, db } = await createServerApp({
    dbFilePath: dbPath,
    disableVite: true,
    disableAuthRateLimit: false,
    adminEmail: 'superboss@finditqr.test',
    verifyGoogleIdToken: async (token) => mockGoogleTokens[token] || null,
  });

  const server = app.listen(0);
  t.after(() => {
    server.close();
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  // 1. Register new account with email & password
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'User One Original',
      email: '  USER1@FindItQR.test ',
      password: 'Password12345!',
      country: 'Saudi Arabia',
    }),
  });
  assert.equal(regRes.status, 201);
  const setCookieHeader = regRes.headers.get('set-cookie') || '';
  assert.ok(setCookieHeader.includes('finditqr_session='), 'Should set HttpOnly session cookie');
  const cookiePair = setCookieHeader.split(';')[0];

  const regBody = (await regRes.json()) as { ok: boolean; token: string; profile: any };
  assert.equal(regBody.ok, true);
  const originalUid = regBody.profile.uid;
  assert.equal(regBody.profile.email, 'user1@finditqr.test');

  // Create an item and customize settings for User 1
  const itemRes = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regBody.token}`,
    },
    body: JSON.stringify({
      name: 'Valuable Passport Wallet',
      category: 'documents',
      description: 'Navy leather passport holder with airtags',
      finderNote: 'Call me anytime to return',
      city: 'Riyadh',
      showPhone: true,
      customPhone: '+966501112233',
    }),
  });
  assert.equal(itemRes.status, 201);
  const createdItem = ((await itemRes.json()) as { item: any }).item;

  await fetch(`${baseUrl}/api/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${regBody.token}`,
    },
    body: JSON.stringify({ whatsappScanAlerts: true, autoLockQrAfterRecovery: true }),
  });

  // 3a. Verify session persistence on page reload using ONLY HttpOnly cookie (even if localStorage is cleared)
  const cookieWsRes = await fetch(`${baseUrl}/api/workspace`, {
    headers: { Cookie: cookiePair },
  });
  assert.equal(cookieWsRes.status, 200);
  const cookieWsBody = (await cookieWsRes.json()) as {
    ok: boolean;
    sessionToken?: string;
    profile: any;
    items: any[];
    settings: any;
  };
  assert.equal(cookieWsBody.profile.uid, originalUid);
  assert.equal(cookieWsBody.items.length, 1);
  assert.equal(cookieWsBody.items[0].codeSerial, createdItem.codeSerial);
  assert.equal(cookieWsBody.settings.whatsappScanAlerts, true);
  assert.ok(cookieWsBody.sessionToken, 'Workspace returns sessionToken to keep client synced');

  // 2. Log out and log back in with the same account
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookiePair },
  });
  assert.equal(logoutRes.status, 200);

  // Old session is dead
  const afterLogoutWs = await fetch(`${baseUrl}/api/workspace`, {
    headers: { Authorization: `Bearer ${regBody.token}` },
  });
  assert.equal(afterLogoutWs.status, 401);

  // Re-login with email & password (case-insensitive email)
  const reloginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'USER1@finditqr.test',
      password: 'Password12345!',
    }),
  });
  assert.equal(reloginRes.status, 200);
  const reloginBody = (await reloginRes.json()) as { ok: boolean; token: string; profile: any };
  assert.equal(reloginBody.profile.uid, originalUid);

  // 4 & 6. Same-email registration with valid password restores existing account & data instead of creating a duplicate
  const sameEmailRegRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'User One Trying Register Again',
      email: 'user1@finditqr.test',
      password: 'Password12345!',
      country: 'Saudi Arabia',
    }),
  });
  assert.equal(sameEmailRegRes.status, 200);
  const sameEmailRegBody = (await sameEmailRegRes.json()) as {
    ok: boolean;
    restoredExisting?: boolean;
    profile: any;
  };
  assert.equal(sameEmailRegBody.restoredExisting, true);
  assert.equal(sameEmailRegBody.profile.uid, originalUid);
  assert.equal(Object.keys(db.users).length, 1);

  // Unverified Google token is strictly rejected (cannot link account without verified provider identity)
  const unverifiedGoogleRes = await fetch(`${baseUrl}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'unverified-google-token' }),
  });
  assert.equal(unverifiedGoogleRes.status, 401);

  // 4 & 6b. Google Sign-In for existing password-only email requires ownership proof (409 LINK_ACCOUNT_REQUIRED) before linking to the exact same account
  const googleChallengeRes = await fetch(`${baseUrl}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'valid-google-token-user1-existing-email' }),
  });
  assert.equal(googleChallengeRes.status, 409);
  const googleChallengeBody = (await googleChallengeRes.json()) as {
    ok: boolean;
    errorCode: string;
    pendingLinkToken: string;
  };
  assert.equal(googleChallengeBody.errorCode, 'LINK_ACCOUNT_REQUIRED');
  assert.ok(googleChallengeBody.pendingLinkToken);

  const googleExistingRes = await fetch(`${baseUrl}/api/auth/link/confirm-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pendingLinkToken: googleChallengeBody.pendingLinkToken,
      password: 'Password12345!',
    }),
  });
  assert.equal(googleExistingRes.status, 200);
  const googleExistingBody = (await googleExistingRes.json()) as {
    ok: boolean;
    isExistingUser: boolean;
    token: string;
    profile: any;
  };
  assert.equal(googleExistingBody.isExistingUser, true);
  assert.equal(googleExistingBody.profile.uid, originalUid);
  assert.equal(googleExistingBody.profile.emailVerified, true);
  assert.equal(Object.keys(db.users).length, 1);

  // 5. Sign in with a brand-new Google account, then sign in AGAIN with the same Google account -> no duplicate user
  const googleNew1 = await fetch(`${baseUrl}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'valid-google-token-user2-new' }),
  });
  assert.equal(googleNew1.status, 200);
  const googleNew1Body = (await googleNew1.json()) as {
    ok: boolean;
    isExistingUser: boolean;
    token: string;
    profile: any;
  };
  assert.equal(googleNew1Body.isExistingUser, false);
  const user2Uid = googleNew1Body.profile.uid;
  assert.equal(Object.keys(db.users).length, 2);

  const googleNew2 = await fetch(`${baseUrl}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'valid-google-token-user2-new' }),
  });
  assert.equal(googleNew2.status, 200);
  const googleNew2Body = (await googleNew2.json()) as {
    ok: boolean;
    isExistingUser: boolean;
    token: string;
    profile: any;
  };
  assert.equal(googleNew2Body.isExistingUser, true);
  assert.equal(googleNew2Body.profile.uid, user2Uid);
  assert.equal(Object.keys(db.users).length, 2, 'Must never create duplicate Google user');

  // 7. Strict user isolation: User 2 cannot access or mutate User 1's item
  const crossGetRes = await fetch(`${baseUrl}/api/items/${createdItem.id}`, {
    headers: { Authorization: `Bearer ${googleNew2Body.token}` },
  });
  assert.equal(crossGetRes.status, 403);

  const crossDeleteRes = await fetch(`${baseUrl}/api/items/${createdItem.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${googleNew2Body.token}` },
  });
  assert.equal(crossDeleteRes.status, 403);

  const user2Ws = (await (
    await fetch(`${baseUrl}/api/workspace`, {
      headers: { Authorization: `Bearer ${googleNew2Body.token}` },
    })
  ).json()) as { items: any[] };
  assert.equal(user2Ws.items.length, 0);

  // 8. Super Admin authority via ADMIN_EMAIL is preserved across Google Sign-In and profile/item updates
  const adminGoogleRes = await fetch(`${baseUrl}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'valid-google-token-superadmin' }),
  });
  assert.equal(adminGoogleRes.status, 200);
  const adminGoogleBody = (await adminGoogleRes.json()) as { token: string; profile: any };
  assert.equal(adminGoogleBody.profile.role, 'super_admin');

  const adminPatchProfileRes = await fetch(`${baseUrl}/api/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminGoogleBody.token}`,
    },
    body: JSON.stringify({ displayName: 'Super Boss Updated' }),
  });
  assert.equal(adminPatchProfileRes.status, 200);
  const adminPatchedProfile = ((await adminPatchProfileRes.json()) as { profile: any }).profile;
  assert.equal(
    adminPatchedProfile.role,
    'super_admin',
    'Super Admin role must remain intact after PATCH /api/profile'
  );
});

test('User App APIs: Media upload, AI Cover fallback, Contact Methods propagation, Tickets & Analytics', async (t) => {
  const dbPath = makeTempDbPath('user-app-suite-http');
  const uploadedFilesToCleanup: string[] = [];

  const { app } = await createServerApp({
    dbFilePath: dbPath,
    disableVite: true,
    disableAuthRateLimit: true,
  });

  const server = app.listen(0);
  t.after(() => {
    server.close();
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
    for (const relUrl of uploadedFilesToCleanup) {
      const m = /^\/api\/media\/(originals|covers|avatars|tickets)\/([a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp))$/.exec(relUrl);
      if (m) {
        const diskPath = path.resolve(process.cwd(), '.data', 'media', m[1], m[2]);
        if (fs.existsSync(diskPath)) {
          fs.unlinkSync(diskPath);
        }
      }
    }
  });

  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  // Register user
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Noura Al-Qahtani',
      email: 'noura.suite@example.com',
      password: 'Password12345!',
      country: 'Saudi Arabia',
    }),
  });
  assert.equal(regRes.status, 201);
  const { token } = (await regRes.json()) as { token: string };
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 1. Media Upload + Serve + Path Traversal Rejection
  const tinyPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const uploadRes = await fetch(`${baseUrl}/api/media/upload`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      folder: 'originals',
      dataUrl: `data:image/png;base64,${tinyPngBase64}`,
      fileName: 'test-pixel.png',
    }),
  });
  assert.equal(uploadRes.status, 201);
  const uploadBody = (await uploadRes.json()) as { ok: boolean; url: string; folder: string };
  assert.equal(uploadBody.ok, true);
  assert.match(uploadBody.url, /^\/api\/media\/originals\/ori-[a-f0-9]+\.png$/);
  uploadedFilesToCleanup.push(uploadBody.url);

  const unauthServeRes = await fetch(`${baseUrl}${uploadBody.url}`);
  assert.equal(unauthServeRes.status, 401);

  const serveRes = await fetch(`${baseUrl}${uploadBody.url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(serveRes.status, 200);
  assert.equal(serveRes.headers.get('content-type'), 'image/png');

  const traversalRes = await fetch(`${baseUrl}/api/media/originals/..%2Fsecret.png`);
  assert.equal(traversalRes.status, 400);

  const badFolderRes = await fetch(`${baseUrl}/api/media/badfolder/test.png`);
  assert.equal(badFolderRes.status, 400);

  // 2. Smart Cover Matching endpoint (curated 40-cover library + 400 validation)
  const emptyCoverRes = await fetch(`${baseUrl}/api/ai-covers/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ entityType: 'item', name: 'A', category: 'electronics' }),
  });
  assert.equal(emptyCoverRes.status, 400);

  const genCoverRes = await fetch(`${baseUrl}/api/ai-covers/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      entityType: 'item',
      name: 'MacBook Pro M3',
      category: 'electronics',
      description: 'Space Black aluminum laptop',
    }),
  });
  assert.equal(genCoverRes.status, 200);
  const genCoverBody = (await genCoverRes.json()) as {
    ok: boolean;
    mode: string;
    coverUrl: string;
  };
  assert.equal(genCoverBody.ok, true);
  assert.ok(
    genCoverBody.mode === 'library_matched' ||
      genCoverBody.mode === 'fallback' ||
      genCoverBody.mode === 'ai_generated'
  );
  assert.ok(genCoverBody.coverUrl.length > 0);
  if (genCoverBody.coverUrl.startsWith('/api/media/')) {
    uploadedFilesToCleanup.push(genCoverBody.coverUrl);
  }

  // 3. Centralized Contact Methods CRUD + Live Propagation to Public QR
  const cm1Res = await fetch(`${baseUrl}/api/contact-methods`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      type: 'whatsapp',
      label: 'Travel WhatsApp',
      value: '+966500001122',
      isActive: true,
    }),
  });
  assert.equal(cm1Res.status, 201);
  const cm1 = ((await cm1Res.json()) as { method: { id: string } }).method;

  const cm2Res = await fetch(`${baseUrl}/api/contact-methods`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      type: 'phone',
      label: 'Hidden Private Line',
      value: '+966599998877',
      isActive: true,
    }),
  });
  assert.equal(cm2Res.status, 201);

  const itemRes = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'MacBook Pro M3',
      category: 'electronics',
      description: 'Space Black aluminum laptop',
      finderNote: 'Please contact me to return',
      city: 'Riyadh',
      imageUrl: uploadBody.url,
      coverUrl: genCoverBody.coverUrl,
      originalImages: [uploadBody.url],
      selectedContactMethodIds: [cm1.id],
      showPhone: false,
      showWhatsapp: true,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: false,
    }),
  });
  assert.equal(itemRes.status, 201);
  const createdItem = ((await itemRes.json()) as { item: { id: string; codeSerial: string } }).item;

  const pub1 = (await (await fetch(`${baseUrl}/api/public/qr/${createdItem.codeSerial}`)).json()) as {
    payload: { visibleChannels: { whatsapp: string | null; phone: string | null } };
  };
  assert.equal(pub1.payload.visibleChannels.whatsapp, '+966500001122');
  assert.equal(pub1.payload.visibleChannels.phone, null);

  // Edit cm1 centrally and verify immediate propagation to public QR
  const patchCmRes = await fetch(`${baseUrl}/api/contact-methods/${cm1.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ value: '+966511119999' }),
  });
  assert.equal(patchCmRes.status, 200);

  const pub2 = (await (await fetch(`${baseUrl}/api/public/qr/${createdItem.codeSerial}`)).json()) as {
    payload: { visibleChannels: { whatsapp: string | null; phone: string | null } };
  };
  assert.equal(pub2.payload.visibleChannels.whatsapp, '+966511119999');
  assert.equal(pub2.payload.visibleChannels.phone, null);

  // 4. Workspace Support Tickets Create + Reply + Persistence
  const tktCreateRes = await fetch(`${baseUrl}/api/workspace/tickets`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      subject: 'Need bleed check on metal sticker',
      description: 'Checking 300 DPI export settings for my luggage tag.',
      category: 'designs',
      priority: 'medium',
      relatedItemSerial: createdItem.codeSerial,
      attachments: [{ name: 'tag.png', url: uploadBody.url, mimeType: 'image/png', sizeBytes: 95 }],
    }),
  });
  assert.equal(tktCreateRes.status, 201);
  const createdTicket = ((await tktCreateRes.json()) as { ticket: { id: string } }).ticket;

  const tktReplyRes = await fetch(`${baseUrl}/api/workspace/tickets/${createdTicket.id}/reply`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ message: 'Attached my latest preview screenshot.' }),
  });
  assert.equal(tktReplyRes.status, 200);
  const repliedTicket = ((await tktReplyRes.json()) as { ticket: { replies: any[] } }).ticket;
  assert.equal(repliedTicket.replies.length, 1);

  const tktListRes = await fetch(`${baseUrl}/api/workspace/tickets`, { headers: authHeaders });
  assert.equal(tktListRes.status, 200);
  const tktListBody = (await tktListRes.json()) as { tickets: any[] };
  assert.equal(tktListBody.tickets.length, 1);
  assert.equal(tktListBody.tickets[0].replies.length, 1);

  // 5. Workspace Real-Data Analytics
  const analyticsRes = await fetch(`${baseUrl}/api/workspace/analytics?period=30d`, {
    headers: authHeaders,
  });
  assert.equal(analyticsRes.status, 200);
  const analyticsBody = (await analyticsRes.json()) as {
    ok: boolean;
    analytics: { timeframe: string; activeItemsCount: number; totalCombinedScans: number };
  };
  assert.equal(analyticsBody.ok, true);
  assert.equal(analyticsBody.analytics.timeframe, '30d');
  assert.equal(analyticsBody.analytics.activeItemsCount, 1);
  assert.ok(analyticsBody.analytics.totalCombinedScans >= 2);
});



