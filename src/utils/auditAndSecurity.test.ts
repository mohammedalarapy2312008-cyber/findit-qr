import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { createServerApp, VerifiedGoogleIdentity } from '../../server';
import { INITIAL_TAG_DESIGNS } from '../data/foundationCatalog';
import { RegisteredItem, SharedQrGroup } from '../types/domain';
import { auditAndNormalizeQrIntegrity } from './qrModeRules';
import { buildCsvString, resolveEffectiveRole } from './adminLogic';
import { computeBatchPrintSheetLayout } from './printSheetLayout';
import { REORGANIZED_DOMAIN_CATEGORIES, summarizeActiveCatalogBreakdown } from './templateDiscovery';

function makeTempDbPath(name: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'finditqr-audit-'));
  return path.join(dir, `${name}.json`);
}

test('Auth Hardening: single-account linking with ownership proof, set-password for Google-only user, link-google for password user, non-enumerating password reset, and token-only email verification', async (t) => {
  const dbPath = makeTempDbPath('auth-hardening');
  const identities: Record<string, VerifiedGoogleIdentity> = {
    'valid-google-token-alice-001': {
      googleUid: 'g-uid-alice-001',
      email: 'alice.unified@example.com',
      emailVerified: true,
      displayName: 'Alice Unified',
      photoURL: 'https://lh3.googleusercontent.com/a/alice',
    },
    'valid-google-token-bob-002': {
      googleUid: 'g-uid-bob-002',
      email: 'bob.pw@example.com',
      emailVerified: true,
      displayName: 'Bob Password',
      photoURL: 'https://lh3.googleusercontent.com/a/bob',
    },
    'valid-google-token-other-003': {
      googleUid: 'g-uid-other-003',
      email: 'other.person@example.com',
      emailVerified: true,
      displayName: 'Other Person',
      photoURL: '',
    },
  };

  const { app, db } = await createServerApp({
    dbFilePath: dbPath,
    disableVite: true,
    disableAuthRateLimit: true,
    verifyGoogleIdToken: async (idToken: string) => identities[idToken] || null,
  });

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  t.after(() => {
    server.close();
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  });
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  // 1. Google-only user creates account -> can set password with fresh Google re-auth -> can log in with password & Google on exact same uid
  const gAlice1 = await fetch(`${baseUrl}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'valid-google-token-alice-001', preferredLanguage: 'ar' }),
  });
  assert.equal(gAlice1.status, 200);
  const alice1Body = (await gAlice1.json()) as {
    token: string;
    profile: { uid: string; hasGoogle: boolean; hasPassword: boolean };
  };
  assert.equal(alice1Body.profile.hasGoogle, true);
  assert.equal(alice1Body.profile.hasPassword, false);

  // Create a second session for Alice to verify set-password revokes other sessions
  const gAlice2 = await fetch(`${baseUrl}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'valid-google-token-alice-001' }),
  });
  const alice2Body = (await gAlice2.json()) as { token: string };

  // Set-password without googleIdToken must be rejected for Google-only account
  const setPwNoProof = await fetch(`${baseUrl}/api/auth/set-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${alice1Body.token}`,
    },
    body: JSON.stringify({ newPassword: 'NewOwnerPassword123!' }),
  });
  assert.ok([401, 403].includes(setPwNoProof.status));

  // Set-password with mismatched Google email must be rejected
  const setPwMismatch = await fetch(`${baseUrl}/api/auth/set-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${alice1Body.token}`,
    },
    body: JSON.stringify({ newPassword: 'NewOwnerPassword123!', googleIdToken: 'valid-google-token-other-003' }),
  });
  assert.ok([401, 403].includes(setPwMismatch.status));

  // Set-password with valid Google re-auth succeeds, keeps exact same uid, revokes other session
  const setPwOk = await fetch(`${baseUrl}/api/auth/set-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${alice1Body.token}`,
    },
    body: JSON.stringify({ newPassword: 'NewOwnerPassword123!', googleIdToken: 'valid-google-token-alice-001' }),
  });
  assert.equal(setPwOk.status, 200);
  const setPwOkBody = (await setPwOk.json()) as {
    profile: { uid: string; hasPassword: boolean; hasGoogle: boolean };
  };
  assert.equal(setPwOkBody.profile.uid, alice1Body.profile.uid);
  assert.equal(setPwOkBody.profile.hasPassword, true);
  assert.equal(setPwOkBody.profile.hasGoogle, true);

  // Second session was revoked upon password change
  const revokedSessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Authorization: `Bearer ${alice2Body.token}` },
  });
  const revokedSessionBody = (await revokedSessionRes.json()) as { authenticated: boolean };
  assert.equal(revokedSessionBody.authenticated, false);
  const revokedWorkspaceRes = await fetch(`${baseUrl}/api/workspace`, {
    headers: { Authorization: `Bearer ${alice2Body.token}` },
  });
  assert.equal(revokedWorkspaceRes.status, 401);

  // Password login works on exact same uid
  const alicePwLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'alice.unified@example.com',
      password: 'NewOwnerPassword123!',
    }),
  });
  assert.equal(alicePwLogin.status, 200);
  const alicePwBody = (await alicePwLogin.json()) as { profile: { uid: string } };
  assert.equal(alicePwBody.profile.uid, alice1Body.profile.uid);

  // 2. Password-only user links Google from inside Profile via /api/auth/link-google
  const regBob = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Bob Password',
      email: 'bob.pw@example.com',
      password: 'BobPassword123!',
      country: 'Egypt',
      preferredLanguage: 'en',
    }),
  });
  assert.equal(regBob.status, 201);
  const bobBody = (await regBob.json()) as { token: string; profile: { uid: string; emailVerified: boolean } };
  assert.equal(bobBody.profile.emailVerified, false);

  // Hardened /api/auth/verify-email must NEVER blindly flip emailVerified without valid proof
  const reqVerify = await fetch(`${baseUrl}/api/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bobBody.token}`,
    },
    body: JSON.stringify({}),
  });
  assert.equal(reqVerify.status, 200);
  const reqVerifyBody = (await reqVerify.json()) as { verified: boolean; profile: { emailVerified: boolean } };
  assert.equal(reqVerifyBody.verified, false);
  assert.equal(db.users[bobBody.profile.uid].profile.emailVerified, false);
  const issuedVerifyTokens = Object.values(db.emailVerificationTokens || {});
  assert.equal(issuedVerifyTokens.length, 1);

  // Forged token must be rejected with 400 and keep emailVerified === false
  const fakeVerify = await fetch(`${baseUrl}/api/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bobBody.token}`,
    },
    body: JSON.stringify({ token: 'forged-verification-token-xyz' }),
  });
  assert.equal(fakeVerify.status, 400);
  assert.equal(db.users[bobBody.profile.uid].profile.emailVerified, false);

  const linkBobBadPw = await fetch(`${baseUrl}/api/auth/link-google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bobBody.token}`,
    },
    body: JSON.stringify({ password: 'WrongPassword!', idToken: 'valid-google-token-bob-002' }),
  });
  assert.equal(linkBobBadPw.status, 401);

  const linkBobOk = await fetch(`${baseUrl}/api/auth/link-google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bobBody.token}`,
    },
    body: JSON.stringify({ password: 'BobPassword123!', idToken: 'valid-google-token-bob-002' }),
  });
  assert.equal(linkBobOk.status, 200);
  const linkBobOkBody = (await linkBobOk.json()) as {
    profile: { uid: string; hasGoogle: boolean; hasPassword: boolean; emailVerified: boolean };
  };
  assert.equal(linkBobOkBody.profile.uid, bobBody.profile.uid);
  assert.equal(linkBobOkBody.profile.hasGoogle, true);
  assert.equal(linkBobOkBody.profile.hasPassword, true);
  assert.equal(linkBobOkBody.profile.emailVerified, true);

  // 3. Non-enumerating Password Reset flow: single-use, rejects replay & expiry, revokes all sessions
  const resetMissing = await fetch(`${baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'does-not-exist@example.com' }),
  });
  assert.equal(resetMissing.status, 200);
  const resetMissingBody = (await resetMissing.json()) as { ok: boolean; messageEn: string };

  const resetBob = await fetch(`${baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bob.pw@example.com' }),
  });
  assert.equal(resetBob.status, 200);
  const resetBobBody = (await resetBob.json()) as {
    ok: boolean;
    messageEn: string;
    devResetToken?: string;
  };
  // Identical non-enumerating message
  assert.equal(resetMissingBody.messageEn, resetBobBody.messageEn);

  // Create an explicit reset token record in test DB to test verify + confirm + replay + session revocation
  const crypto = await import('node:crypto');
  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  db.passwordResetTokens = db.passwordResetTokens || {};
  db.passwordResetTokens[tokenHash] = {
    tokenHash,
    uid: bobBody.profile.uid,
    email: 'bob.pw@example.com',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    usedAt: null,
  };

  // Verify token returns valid: true
  const verifyRes = await fetch(`${baseUrl}/api/auth/reset-password/verify?token=${rawToken}`);
  assert.equal(verifyRes.status, 200);
  const verifyBody = (await verifyRes.json()) as { ok: boolean; valid: boolean };
  assert.equal(verifyBody.valid, true);

  // Confirm reset updates password and revokes Bob's active session
  const confirmRes = await fetch(`${baseUrl}/api/auth/reset-password/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: rawToken, newPassword: 'BrandNewPassword456!' }),
  });
  assert.equal(confirmRes.status, 200);

  // Replay of same token MUST fail (single-use)
  const replayRes = await fetch(`${baseUrl}/api/auth/reset-password/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: rawToken, newPassword: 'AnotherPassword789!' }),
  });
  assert.equal(replayRes.status, 400);

  // Bob's prior session MUST be revoked
  const bobOldSess = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Authorization: `Bearer ${bobBody.token}` },
  });
  const bobOldSessBody = (await bobOldSess.json()) as { authenticated: boolean };
  assert.equal(bobOldSessBody.authenticated, false);
  const bobOldWorkspace = await fetch(`${baseUrl}/api/workspace`, {
    headers: { Authorization: `Bearer ${bobBody.token}` },
  });
  assert.equal(bobOldWorkspace.status, 401);

  // Old password rejected, new password accepted
  const bobOldPw = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bob.pw@example.com', password: 'BobPassword123!' }),
  });
  assert.equal(bobOldPw.status, 401);

  const bobNewPw = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bob.pw@example.com', password: 'BrandNewPassword456!' }),
  });
  assert.equal(bobNewPw.status, 200);
});

test('Owner/Admin Recovery, Google Re-Auth, CSRF Origin, Mass-Assignment, Support Anti-Spoofing & Refund Quota Enforcement', async (t) => {
  const dbPath = makeTempDbPath('admin-security');
  const prevAdminEmail = process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_EMAIL;

  const identities: Record<string, VerifiedGoogleIdentity> = {
    'valid-google-token-owner-999': {
      googleUid: 'g-uid-owner-999',
      email: 'owner.google@example.com',
      emailVerified: true,
      displayName: 'Platform Owner',
      photoURL: '',
    },
  };

  const { app, db } = await createServerApp({
    dbFilePath: dbPath,
    disableVite: true,
    disableAuthRateLimit: true,
    verifyGoogleIdToken: async (idToken: string) => identities[idToken] || null,
  });

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  t.after(() => {
    if (prevAdminEmail !== undefined) process.env.ADMIN_EMAIL = prevAdminEmail;
    else delete process.env.ADMIN_EMAIL;
    server.close();
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  });
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  // Pure function check: persisted verified super_admin survives when ADMIN_EMAIL is unset
  assert.equal(
    resolveEffectiveRole('super_admin', 'owner.google@example.com', '', true),
    'super_admin'
  );

  // CSV injection escaping check
  const csv = buildCsvString(
    ['Name', 'Note'],
    [['=CMD|"/C calc"!A0', '+SUM(A1:A2)']]
  );
  assert.ok(csv.includes("'=CMD"));
  assert.ok(csv.includes("'+SUM"));

  // 1. Sign in Owner via Google, bind as persisted super_admin (simulating existing production owner)
  const ownerLogin = await fetch(`${baseUrl}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'valid-google-token-owner-999' }),
  });
  assert.equal(ownerLogin.status, 200);
  const ownerCookie = (ownerLogin.headers.get('set-cookie') || '').split(';')[0];
  const ownerLoginBody = (await ownerLogin.json()) as { token: string; profile: { uid: string } };
  const ownerRec = db.users[ownerLoginBody.profile.uid];
  ownerRec.profile.role = 'super_admin';

  // 2. GET /api/admin/bootstrap-status recognizes persisted Google-only super_admin even with ADMIN_EMAIL unset
  const bsRes = await fetch(`${baseUrl}/api/admin/bootstrap-status`, {
    headers: { Authorization: `Bearer ${ownerLoginBody.token}` },
  });
  assert.equal(bsRes.status, 200);
  const bsBody = (await bsRes.json()) as {
    superAdminBound: boolean;
    role: string;
    currentUserMatchesAdminEmail: boolean;
    hasGoogle: boolean;
    hasPassword: boolean;
  };
  assert.equal(bsBody.superAdminBound, true);
  assert.equal(bsBody.role, 'super_admin');
  assert.equal(bsBody.currentUserMatchesAdminEmail, true);
  assert.equal(bsBody.hasGoogle, true);
  assert.equal(bsBody.hasPassword, false);

  // 3. Google-only Owner can re-authenticate via { googleIdToken } and unlock sensitive admin mutations
  const reauthRes = await fetch(`${baseUrl}/api/admin/reauth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerLoginBody.token}`,
    },
    body: JSON.stringify({ googleIdToken: 'valid-google-token-owner-999' }),
  });
  assert.equal(reauthRes.status, 200);
  const reauthBody = (await reauthRes.json()) as { ok: boolean; reauthWindowMinutes: number };
  assert.equal(reauthBody.ok, true);
  assert.ok(reauthBody.reauthWindowMinutes > 0);

  // 4. Mass-assignment protection on PATCH /api/admin/settings strips unknown/dangerous fields
  const patchSettingsRes = await fetch(`${baseUrl}/api/admin/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerLoginBody.token}`,
    },
    body: JSON.stringify({
      platformNameAr: 'FindIt QR المحدّث',
      ownerUid: 'hijacked-uid',
      injectedField: 'should-not-persist',
    }),
  });
  assert.equal(patchSettingsRes.status, 200);
  assert.equal(db.platformSettings.platformNameAr, 'FindIt QR المحدّث');
  assert.equal('ownerUid' in (db.platformSettings as unknown as Record<string, unknown>), false);
  assert.equal('injectedField' in (db.platformSettings as unknown as Record<string, unknown>), false);

  // 5. CSRF Origin enforcement rejects foreign Origin on cookie-authenticated mutations
  const csrfRes = await fetch(`${baseUrl}/api/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: ownerCookie,
      Origin: 'https://evil-attacker.example',
    },
    body: JSON.stringify({ displayName: 'CSRF Hacked' }),
  });
  assert.equal(csrfRes.status, 403);

  // 6. Regular user receives 403 on /api/admin/*
  const regUser = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Regular Customer',
      email: 'regular.user@example.com',
      password: 'UserPassword123!',
      country: 'Saudi Arabia',
      preferredLanguage: 'ar',
    }),
  });
  const regBody = (await regUser.json()) as { token: string; profile: { uid: string } };
  const forbiddenAdmin = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${regBody.token}` },
  });
  assert.equal(forbiddenAdmin.status, 403);

  // 7. POST /api/public/support ignores spoofed body.userId
  const supportRes = await fetch(`${baseUrl}/api/public/support`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Visitor',
      email: 'visitor@example.com',
      subject: 'Question',
      message: 'Hello, testing anti-spoofing.',
      userId: ownerRec.uid,
    }),
  });
  assert.equal(supportRes.status, 201);
  const createdTicket = Object.values(db.supportTickets)[0];
  assert.equal(createdTicket.userId, undefined);

  // 8. Paid subscription refund downgrades plan cleanly to Free & archives excess active items (preserving data)
  const regHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${regBody.token}`,
  };
  const ownerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ownerLoginBody.token}`,
  };

  const plusPlan = Object.values(db.plans).find((p) => p.quotaTier === 'Plus');
  assert.ok(plusPlan, 'Expected a seeded Plus plan');

  const subOrderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: regHeaders,
    body: JSON.stringify({
      orderType: 'subscription_upgrade',
      targetId: plusPlan.id,
      durationMonths: 1,
      currency: 'SAR',
      transferReference: 'TX-TEST-001',
    }),
  });
  assert.equal(subOrderRes.status, 201);
  const subOrderBody = (await subOrderRes.json()) as { order: { id: string } };

  // Owner approves order -> user becomes Plus (limit 15)
  const approveRes = await fetch(`${baseUrl}/api/admin/orders/${subOrderBody.order.id}/review`, {
    method: 'POST',
    headers: ownerHeaders,
    body: JSON.stringify({ decision: 'approve' }),
  });
  assert.equal(approveRes.status, 200);
  assert.equal(db.users[regBody.profile.uid].profile.plan, 'Plus');

  // User creates 3 active items (allowed on Plus)
  for (let i = 1; i <= 3; i += 1) {
    const itRes = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: regHeaders,
      body: JSON.stringify({
        name: `Plus Item ${i}`,
        category: 'electronics',
        description: 'Testing quota enforcement on refund',
        finderNote: 'Please return',
        city: 'Riyadh',
        designId: 'master-04-heritage-compass',
        showPhone: true,
        showWhatsapp: false,
        showEmail: false,
        showTelegram: false,
        anonymousRelayOnly: false,
        customPhone: '+966500000001',
        customWhatsapp: '',
        customEmail: '',
        customTelegram: '',
      }),
    });
    assert.equal(itRes.status, 201);
  }

  // Owner refunds the subscription order -> user reverts to Free (limit 2), 3rd item auto-archived (zero deleted!)
  const refundRes = await fetch(`${baseUrl}/api/admin/orders/${subOrderBody.order.id}/review`, {
    method: 'POST',
    headers: ownerHeaders,
    body: JSON.stringify({ decision: 'refund', reason: 'Customer requested refund' }),
  });
  assert.equal(refundRes.status, 200);
  assert.equal(db.users[regBody.profile.uid].profile.plan, 'Free');
  assert.equal(db.users[regBody.profile.uid].profile.activeItemsLimit, 2);
  const userItems = Object.values(db.items).filter((it) => it.ownerUid === regBody.profile.uid);
  assert.equal(userItems.length, 3); // Zero data loss: old items preserved intact
  // Creating another item is now blocked by authoritative Free Plan limit (2)
  const blocked4thRes = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: regHeaders,
    body: JSON.stringify({
      name: 'Blocked 4th Item After Refund',
      category: 'electronics',
      description: 'Should be rejected under Free plan limit',
      finderNote: 'Please return',
      city: 'Riyadh',
      designId: 'master-04-heritage-compass',
      showPhone: true,
      showWhatsapp: false,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: false,
      customPhone: '+966500000001',
      customWhatsapp: '',
      customEmail: '',
      customTelegram: '',
    }),
  });
  assert.equal(blocked4thRes.status, 403);
});

test('Strict QR Mode & Non-Conflict Rules: concurrent conflict guard, paused group non-reactivation, deleted group unassigned mode, 1-click restore, and startup integrity audit', async (t) => {
  const dbPath = makeTempDbPath('qr-non-conflict');
  const { app, db } = await createServerApp({
    dbFilePath: dbPath,
    disableVite: true,
    disableAuthRateLimit: true,
  });

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  t.after(() => {
    server.close();
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  });
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const reg = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'QR Tester',
      email: 'qr-mode-tester@example.com',
      password: 'Password123!',
      country: 'Saudi Arabia',
      preferredLanguage: 'ar',
    }),
  });
  const { token } = (await reg.json()) as { token: string };
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Create 1 item -> starts in 'individual' mode
  const itemRes = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'MacBook Pro',
      category: 'electronics',
      description: 'Silver 14 inch laptop',
      finderNote: 'Call me if found',
      city: 'Jeddah',
      designId: 'master-04-heritage-compass',
      showPhone: true,
      showWhatsapp: false,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: false,
      customPhone: '+966512345678',
      customWhatsapp: '',
      customEmail: '',
      customTelegram: '',
    }),
  });
  assert.equal(itemRes.status, 201);
  const item = ((await itemRes.json()) as { item: RegisteredItem }).item;
  assert.equal(item.qrMode, 'individual');

  // Create two empty Shared QR Groups
  const gARes = await fetch(`${baseUrl}/api/shared-qr-groups`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Group A', items: [] }),
  });
  const gBRes = await fetch(`${baseUrl}/api/shared-qr-groups`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Group B', items: [] }),
  });
  const groupA = ((await gARes.json()) as { sharedQrGroup: SharedQrGroup }).sharedQrGroup;
  const groupB = ((await gBRes.json()) as { sharedQrGroup: SharedQrGroup }).sharedQrGroup;

  // Concurrent attempt to add the exact same item into Group A and Group B simultaneously -> strictly ONE succeeds (200), ONE fails (409)
  const [addA, addB] = await Promise.all([
    fetch(`${baseUrl}/api/shared-qr-groups/${groupA.id}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ itemId: item.id, isVisible: true }),
    }),
    fetch(`${baseUrl}/api/shared-qr-groups/${groupB.id}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ itemId: item.id, isVisible: true }),
    }),
  ]);
  const statuses = [addA.status, addB.status].sort();
  assert.deepEqual(statuses, [201, 409]);

  const winnerGroup = addA.status === 201 ? groupA : groupB;

  // Individual QR MUST now return inactiveReason: 'shared_mode' and block finder message/report
  const indivWhileShared = await fetch(`${baseUrl}/api/public/qr/${item.codeSerial}`);
  assert.equal(indivWhileShared.status, 200);
  const indivWhileSharedBody = (await indivWhileShared.json()) as { payload: any };
  assert.equal(indivWhileSharedBody.payload.isPublicPageActive, false);
  assert.equal(indivWhileSharedBody.payload.inactiveReason, 'shared_mode');
  assert.equal(indivWhileSharedBody.payload.visibleChannels.phone, null);

  const blockedMsg = await fetch(`${baseUrl}/api/public/qr/${item.codeSerial}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Should be blocked in shared mode' }),
  });
  assert.equal(blockedMsg.status, 403);

  // Pause winner group -> individual QR returns inactiveReason: 'shared_group_paused' (NO auto-reactivation!)
  await fetch(`${baseUrl}/api/shared-qr-groups/${winnerGroup.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ isActive: false }),
  });
  const indivWhilePaused = await fetch(`${baseUrl}/api/public/qr/${item.codeSerial}`);
  const indivWhilePausedBody = (await indivWhilePaused.json()) as { payload: any };
  assert.equal(indivWhilePausedBody.payload.isPublicPageActive, false);
  assert.equal(indivWhilePausedBody.payload.inactiveReason, 'shared_group_paused');

  // Delete winner group -> item is preserved in 'unassigned' mode (inactiveReason: 'unassigned_from_shared')
  await fetch(`${baseUrl}/api/shared-qr-groups/${winnerGroup.id}`, {
    method: 'DELETE',
    headers,
  });
  const indivAfterDelete = await fetch(`${baseUrl}/api/public/qr/${item.codeSerial}`);
  const indivAfterDeleteBody = (await indivAfterDelete.json()) as { payload: any };
  assert.equal(indivAfterDeleteBody.payload.isPublicPageActive, false);
  assert.equal(indivAfterDeleteBody.payload.inactiveReason, 'unassigned_from_shared');

  // 1-click Restore Individual QR reactivates exact original codeSerial
  const restoreRes = await fetch(`${baseUrl}/api/items/${item.id}/restore-individual-qr`, {
    method: 'POST',
    headers,
  });
  assert.equal(restoreRes.status, 200);
  const restoredBody = (await restoreRes.json()) as { item: RegisteredItem };
  assert.equal(restoredBody.item.qrMode, 'individual');
  assert.equal(restoredBody.item.codeSerial, item.codeSerial);

  const indivRestored = await fetch(`${baseUrl}/api/public/qr/${item.codeSerial}`);
  const indivRestoredBody = (await indivRestored.json()) as { payload: any };
  assert.equal(indivRestoredBody.payload.isPublicPageActive, true);
  assert.equal(indivRestoredBody.payload.visibleChannels.phone, '+966512345678');

  // Non-destructive integrity audit normalizes multi-group conflicts cleanly without deleting items
  const auditReport = auditAndNormalizeQrIntegrity(db.items, db.sharedQrGroups || {});
  assert.equal(auditReport.issues.length, 0);
});

test('Template Library (58 active, 5 free / 53 paid, 7 categories, FIQR-004 clean) & Print Layout (A4 / US Letter)', () => {
  const active = INITIAL_TAG_DESIGNS.filter((d) => (d.status || 'published') === 'published');
  assert.equal(active.length, 58);

  const breakdown = summarizeActiveCatalogBreakdown(INITIAL_TAG_DESIGNS);
  assert.equal(breakdown.activeTotal, 58);
  assert.equal(breakdown.freeTotal, 5);
  assert.equal(breakdown.premiumTotal, 53);
  assert.equal(REORGANIZED_DOMAIN_CATEGORIES.length, 7);

  // None of the 58 active templates (including FIQR-004 / Kids & Safety) may contain a hardcoded phone number
  for (const tpl of active) {
    assert.doesNotMatch(
      `${tpl.titleAr} ${tpl.titleEn} ${tpl.subtitleAr} ${tpl.subtitleEn} ${tpl.defaultCalloutText || ''}`,
      /\+?\d{3}[\s-]?\d{3}[\s-]?\d{4}/,
      `Hardcoded phone number found in template ${tpl.id}`
    );
  }

  const sampleItem: RegisteredItem = {
    id: 'item-print-1',
    ownerUid: 'u-1',
    qrId: 'qr-1',
    codeSerial: 'FQR-2026-PRINT',
    name: 'Print Sample',
    nameAr: 'عينة طباعة',
    nameEn: 'Print Sample',
    category: 'electronics',
    description: 'Sample',
    descriptionAr: 'عينة',
    descriptionEn: 'Sample',
    imageUrl: '',
    status: 'Active',
    recoveryInstructions: 'Return please',
    finderNoteAr: 'يرجى الإرجاع',
    finderNoteEn: 'Return please',
    city: 'Riyadh',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    rewardOffered: false,
    rewardAmountTextAr: '',
    rewardAmountTextEn: '',
    designId: active[0].id,
    contactChannels: {
      showPhone: false,
      showWhatsapp: false,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: true,
      customPhone: '',
      customWhatsapp: '',
      customEmail: '',
      customTelegram: '',
    },
    totalScans: 0,
    lastScanAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  // Print layout A4 & US Letter pagination
  const queue = active.slice(0, 6).map((tpl) => ({
    item: sampleItem,
    design: tpl,
    copies: 1,
  }));

  const a4 = computeBatchPrintSheetLayout({
    queue,
    paperFormat: 'A4',
    gapMm: 4,
    pageMarginMm: 10,
  });
  assert.ok(a4.pages.length >= 1);
  assert.equal(a4.paper.widthMm, 210);
  assert.equal(a4.paper.heightMm, 297);

  const letter = computeBatchPrintSheetLayout({
    queue,
    paperFormat: 'Letter',
    gapMm: 4,
    pageMarginMm: 10,
  });
  assert.ok(letter.pages.length >= 1);
  assert.equal(letter.paper.widthMm, 215.9);
  assert.equal(letter.paper.heightMm, 279.4);
});
