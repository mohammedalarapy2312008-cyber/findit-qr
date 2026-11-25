import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import {
  chooseGoogleAuthStrategy,
  clearPendingGoogleRedirect,
  isEmbeddedInIframe,
  isFreshFirebaseSignIn,
  isPendingGoogleRedirectFresh,
  mapFirebaseGoogleAuthError,
  PENDING_GOOGLE_REDIRECT_STORAGE_KEY,
  PENDING_GOOGLE_REDIRECT_TTL_MS,
  readPendingGoogleRedirect,
  resolveFirebaseAuthDomain,
  savePendingGoogleRedirect,
  shouldUseSameOriginAuthProxy,
} from './googleAuthFlow';
import { createServerApp, VerifiedGoogleIdentity } from '../../server';

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    },
  };
}

test('shouldUseSameOriginAuthProxy & resolveFirebaseAuthDomain keep canonical firebaseapp.com authDomain for popup reliability on ephemeral Cloud Run hosts', () => {
  const defaultDomain = 'ivory-alignment-qf38q.firebaseapp.com';
  const cloudRunHost = 'ais-dev-mo7c5lygahmde5yqaqhj7n-734447529823.europe-west2.run.app';

  assert.equal(
    shouldUseSameOriginAuthProxy({ protocol: 'https:', hostname: cloudRunHost, host: cloudRunHost }),
    true
  );
  // Canonical authDomain is preserved so Firebase signInWithPopup never hits redirect_uri_mismatch on ephemeral hosts
  assert.equal(
    resolveFirebaseAuthDomain(
      { protocol: 'https:', hostname: cloudRunHost, host: cloudRunHost },
      defaultDomain
    ),
    defaultDomain
  );

  // HTTP localhost must keep default authDomain as well
  assert.equal(
    shouldUseSameOriginAuthProxy({ protocol: 'http:', hostname: 'localhost', host: 'localhost:3000' }),
    false
  );
  assert.equal(
    resolveFirebaseAuthDomain(
      { protocol: 'http:', hostname: 'localhost', host: 'localhost:3000' },
      defaultDomain
    ),
    defaultDomain
  );

  // HTTP on run.app (non-HTTPS) must not proxy
  assert.equal(
    shouldUseSameOriginAuthProxy({ protocol: 'http:', hostname: cloudRunHost, host: cloudRunHost }),
    false
  );
});

test('chooseGoogleAuthStrategy prefers popup across Cloud Run HTTPS, iframes, and localhost to prevent broken redirect loops', () => {
  const cloudRunLoc = {
    protocol: 'https:',
    hostname: 'ais-pre-mo7c5lygahmde5yqaqhj7n-734447529823.europe-west2.run.app',
    host: 'ais-pre-mo7c5lygahmde5yqaqhj7n-734447529823.europe-west2.run.app',
  };

  assert.equal(
    chooseGoogleAuthStrategy({ location: cloudRunLoc, isEmbeddedIframe: false }),
    'popup'
  );
  assert.equal(
    chooseGoogleAuthStrategy({ location: cloudRunLoc, isEmbeddedIframe: true }),
    'popup'
  );
  assert.equal(
    chooseGoogleAuthStrategy({
      location: { protocol: 'http:', hostname: 'localhost', host: 'localhost:3000' },
      isEmbeddedIframe: false,
    }),
    'popup'
  );
});

test('isEmbeddedInIframe handles top-level, iframe, and cross-origin SecurityError safely', () => {
  const sameObj = {};
  assert.equal(isEmbeddedInIframe({ self: sameObj, top: sameObj }), false);
  assert.equal(isEmbeddedInIframe({ self: {}, top: {} }), true);
  assert.equal(
    isEmbeddedInIframe({
      get self() {
        return {};
      },
      get top() {
        throw new Error('SecurityError');
      },
    }),
    true
  );
});

test('PendingGoogleRedirectState save/read/TTL/clear prevents stale redirect loops', () => {
  const storage = createMemoryStorage();
  const t0 = 1_700_000_000_000;

  savePendingGoogleRedirect(
    { startedAt: t0, returnPath: '/login', preferredLanguage: 'en' },
    storage
  );

  const fresh = readPendingGoogleRedirect(storage, t0 + 30_000);
  assert.deepEqual(fresh, { startedAt: t0, returnPath: '/login', preferredLanguage: 'en' });
  assert.equal(isPendingGoogleRedirectFresh(fresh, t0 + PENDING_GOOGLE_REDIRECT_TTL_MS), true);

  // Expired beyond TTL auto-clears from storage
  const expired = readPendingGoogleRedirect(storage, t0 + PENDING_GOOGLE_REDIRECT_TTL_MS + 1000);
  assert.equal(expired, null);
  assert.equal(storage.getItem(PENDING_GOOGLE_REDIRECT_STORAGE_KEY), null);

  // Corrupted JSON auto-clears
  storage.setItem(PENDING_GOOGLE_REDIRECT_STORAGE_KEY, '{bad-json');
  assert.equal(readPendingGoogleRedirect(storage, t0), null);

  // Explicit clear
  savePendingGoogleRedirect(
    { startedAt: t0, returnPath: '/register', preferredLanguage: 'ar' },
    storage
  );
  clearPendingGoogleRedirect(storage);
  assert.equal(readPendingGoogleRedirect(storage, t0), null);
});

test('isFreshFirebaseSignIn accepts fresh credentials (with clock skew) and rejects stale cached users', () => {
  const attemptAt = Date.parse('2026-11-18T12:00:00.000Z');
  assert.equal(isFreshFirebaseSignIn('2026-11-18T12:00:03.000Z', attemptAt), true);
  assert.equal(isFreshFirebaseSignIn('2026-11-18T11:59:50.000Z', attemptAt), true);
  assert.equal(isFreshFirebaseSignIn('2026-11-18T11:55:00.000Z', attemptAt), false);
  assert.equal(isFreshFirebaseSignIn(undefined, attemptAt), false);
});

test('mapFirebaseGoogleAuthError returns clear bilingual diagnostics for cancellation and auth errors', () => {
  const cancelled = mapFirebaseGoogleAuthError(
    { code: 'auth/redirect-cancelled-by-user' },
    'ais-dev.run.app',
    'redirect'
  );
  assert.equal(cancelled.errorCode, 'auth/redirect-cancelled-by-user');
  assert.match(cancelled.messageEn, /cancelled/i);

  const unauthorized = mapFirebaseGoogleAuthError(
    { code: 'auth/unauthorized-domain' },
    'example.run.app',
    'redirect'
  );
  assert.equal(unauthorized.errorCode, 'auth/unauthorized-domain');
  assert.match(unauthorized.messageEn, /example\.run\.app/);

  const popupClosed = mapFirebaseGoogleAuthError(
    { code: 'auth/popup-closed-by-user' },
    'ais-dev.run.app',
    'popup'
  );
  assert.equal(popupClosed.errorCode, 'auth/popup-closed-by-user');
  assert.match(popupClosed.messageEn, /full browser tab/i);
});

test('Server same-origin /__/firebase/init.json, /__/auth/* proxy, COOP headers, and Google account deduplication + session restore work end-to-end', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finditqr-gauth-'));
  const tmpDbPath = path.join(tmpDir, 'db.json');

  const tokenIdentities: Record<string, VerifiedGoogleIdentity> = {
    'valid-google-token-new': {
      googleUid: 'g-uid-new-991',
      email: 'newgoogleuser@example.com',
      emailVerified: true,
      displayName: 'Sara Google',
      photoURL: 'https://lh3.googleusercontent.com/a/default-user',
    },
    'valid-google-token-existing-email': {
      googleUid: 'g-uid-linked-772',
      email: 'existingpw@example.com',
      emailVerified: true,
      displayName: 'Existing PW User',
      photoURL: 'https://lh3.googleusercontent.com/a/linked-user',
    },
  };

  const { app, db } = await createServerApp({
    dbFilePath: tmpDbPath,
    disableVite: true,
    disableAuthRateLimit: true,
    verifyGoogleIdToken: async (idToken: string) => tokenIdentities[idToken] || null,
  });

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. /__/firebase/init.json on local HTTP returns default firebaseapp authDomain + COOP header
    const localInitRes = await fetch(`${baseUrl}/__/firebase/init.json`);
    assert.equal(localInitRes.status, 200);
    assert.equal(
      localInitRes.headers.get('cross-origin-opener-policy'),
      'same-origin-allow-popups'
    );
    const localInitJson = (await localInitRes.json()) as { apiKey: string; authDomain: string; projectId: string };
    assert.equal(localInitJson.authDomain, 'ivory-alignment-qf38q.firebaseapp.com');
    assert.ok(localInitJson.apiKey.length > 10);

    // 2. /__/firebase/init.json behind HTTPS Cloud Run proxy keeps canonical authDomain so signInWithPopup works on ephemeral hosts
    const cloudRunHost = 'ais-dev-mo7c5lygahmde5yqaqhj7n-734447529823.europe-west2.run.app';
    const httpsInitRes = await fetch(`${baseUrl}/__/firebase/init.json`, {
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': cloudRunHost,
      },
    });
    assert.equal(httpsInitRes.status, 200);
    const httpsInitJson = (await httpsInitRes.json()) as { authDomain: string };
    assert.equal(httpsInitJson.authDomain, 'ivory-alignment-qf38q.firebaseapp.com');

    // 3. /__/auth/handler and /__/auth/iframe proxy live Firebase Auth handler assets (not SPA HTML)
    const handlerRes = await fetch(`${baseUrl}/__/auth/handler`);
    assert.equal(handlerRes.status, 200);
    assert.equal(handlerRes.headers.get('cross-origin-opener-policy'), 'unsafe-none');
    assert.equal(handlerRes.headers.get('x-frame-options'), 'SAMEORIGIN');
    const handlerHtml = await handlerRes.text();
    assert.match(handlerHtml, /fireauth|handler\.js/i);

    const iframeRes = await fetch(`${baseUrl}/__/auth/iframe`);
    assert.equal(iframeRes.status, 200);
    const iframeHtml = await iframeRes.text();
    assert.match(iframeHtml, /fireauth|iframe\.js/i);

    // 4. First Google sign-in creates a user and establishes a restorable session
    const g1Res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'valid-google-token-new', preferredLanguage: 'en' }),
    });
    assert.equal(g1Res.status, 200);
    const g1Cookie = g1Res.headers.get('set-cookie') || '';
    assert.match(g1Cookie, /finditqr_session=/);
    const g1Body = (await g1Res.json()) as {
      ok: boolean;
      token: string;
      isExistingUser: boolean;
      profile: { uid: string; email: string; preferredLanguage: string };
    };
    assert.equal(g1Body.ok, true);
    assert.equal(g1Body.isExistingUser, false);
    assert.equal(g1Body.profile.email, 'newgoogleuser@example.com');
    assert.equal(g1Body.profile.preferredLanguage, 'en');

    // 5. Session restores via both Bearer token and HttpOnly cookie
    const sessBearerRes = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { Authorization: `Bearer ${g1Body.token}` },
    });
    assert.equal(sessBearerRes.status, 200);
    const sessBearerBody = (await sessBearerRes.json()) as {
      ok: boolean;
      profile: { uid: string };
    };
    assert.equal(sessBearerBody.profile.uid, g1Body.profile.uid);

    const cookiePair = g1Cookie.split(';')[0];
    const sessCookieRes = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { Cookie: cookiePair },
    });
    assert.equal(sessCookieRes.status, 200);
    const sessCookieBody = (await sessCookieRes.json()) as {
      ok: boolean;
      profile: { uid: string };
    };
    assert.equal(sessCookieBody.profile.uid, g1Body.profile.uid);

    // 6. Second Google sign-in with same identity does NOT create a duplicate user
    const userCountBefore = Object.keys(db.users).length;
    const g2Res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'valid-google-token-new', preferredLanguage: 'ar' }),
    });
    assert.equal(g2Res.status, 200);
    const g2Body = (await g2Res.json()) as {
      ok: boolean;
      isExistingUser: boolean;
      profile: { uid: string };
    };
    assert.equal(g2Body.isExistingUser, true);
    assert.equal(g2Body.profile.uid, g1Body.profile.uid);
    assert.equal(Object.keys(db.users).length, userCountBefore);

    // 7. Existing Email/Password user signing in with Google requires verified ownership proof (409 LINK_ACCOUNT_REQUIRED) before linking to the exact same uid
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Existing PW User',
        email: 'existingpw@example.com',
        password: 'StrongPassword123!',
        country: 'Egypt',
        preferredLanguage: 'ar',
      }),
    });
    assert.equal(regRes.status, 201);
    const regBody = (await regRes.json()) as { profile: { uid: string } };
    const countAfterReg = Object.keys(db.users).length;

    const gChallengeRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'valid-google-token-existing-email' }),
    });
    assert.equal(gChallengeRes.status, 409);
    const gChallengeBody = (await gChallengeRes.json()) as {
      ok: boolean;
      errorCode: string;
      pendingLinkToken: string;
      email: string;
    };
    assert.equal(gChallengeBody.ok, false);
    assert.equal(gChallengeBody.errorCode, 'LINK_ACCOUNT_REQUIRED');
    assert.ok(gChallengeBody.pendingLinkToken.length > 20);
    assert.equal(Object.keys(db.users).length, countAfterReg);

    // Wrong password must be rejected without linking
    const badLinkRes = await fetch(`${baseUrl}/api/auth/link/confirm-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pendingLinkToken: gChallengeBody.pendingLinkToken,
        password: 'WrongPassword999!',
      }),
    });
    assert.equal(badLinkRes.status, 401);

    // Correct password links Google to exact same uid, marks emailVerified, and creates zero duplicates
    const gLinkRes = await fetch(`${baseUrl}/api/auth/link/confirm-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pendingLinkToken: gChallengeBody.pendingLinkToken,
        password: 'StrongPassword123!',
      }),
    });
    assert.equal(gLinkRes.status, 200);
    const gLinkBody = (await gLinkRes.json()) as {
      ok: boolean;
      isExistingUser: boolean;
      profile: { uid: string; emailVerified: boolean; hasGoogle: boolean; hasPassword: boolean };
    };
    assert.equal(gLinkBody.isExistingUser, true);
    assert.equal(gLinkBody.profile.uid, regBody.profile.uid);
    assert.equal(gLinkBody.profile.emailVerified, true);
    assert.equal(gLinkBody.profile.hasGoogle, true);
    assert.equal(gLinkBody.profile.hasPassword, true);
    assert.equal(Object.keys(db.users).length, countAfterReg);

    // Subsequent Google sign-in succeeds immediately with no duplicate
    const gRepeatRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'valid-google-token-existing-email' }),
    });
    assert.equal(gRepeatRes.status, 200);
    const gRepeatBody = (await gRepeatRes.json()) as { profile: { uid: string } };
    assert.equal(gRepeatBody.profile.uid, regBody.profile.uid);
    assert.equal(Object.keys(db.users).length, countAfterReg);

    // Email/password login still works after linking Google
    const pwLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'existingpw@example.com',
        password: 'StrongPassword123!',
      }),
    });
    assert.equal(pwLoginRes.status, 200);
    const pwLoginBody = (await pwLoginRes.json()) as { ok: boolean; profile: { uid: string } };
    assert.equal(pwLoginBody.ok, true);
    assert.equal(pwLoginBody.profile.uid, regBody.profile.uid);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
