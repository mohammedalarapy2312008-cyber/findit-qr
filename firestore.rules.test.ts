import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, terminate } from 'firebase/firestore';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');

test('firestore.rules enforces zero-trust default deny, owner-only access, and Free plan 2-item quota', () => {
  const rules = fs.readFileSync(rulesPath, 'utf8');

  // 1. Default deny-all rule exists
  assert.match(rules, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);

  // 2. Owner-only read/write on /users/{userId}
  assert.match(rules, /match \/users\/\{userId\}/);
  assert.match(rules, /allow get: if isOwner\(userId\) && isValidId\(userId\);/);
  assert.match(rules, /allow list: if isOwner\(userId\) && existing\(\)\.uid == request\.auth\.uid;/);

  // 3. Free Plan quota invariants enforced in rules
  assert.match(rules, /incoming\(\)\.activeItemsLimit == 2/);
  assert.match(rules, /data\.activeItemsCount >= 0/);
  assert.match(rules, /data\.activeItemsCount <= data\.activeItemsLimit/);
  assert.match(rules, /isItemBecomingActiveInBatch/);
  assert.match(rules, /isItemBecomingInactiveInBatch/);
  assert.match(rules, /isUserQuotaIncrementedInBatch/);
  assert.match(rules, /isUserQuotaDecrementedInBatch/);

  // 4. Owner-only access on /items/{itemId}
  assert.match(rules, /match \/items\/\{itemId\}/);
  assert.match(rules, /existing\(\)\.ownerUid == request\.auth\.uid/);
});

test('Live Cloud Firestore rejects unauthenticated access with permission-denied', async () => {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const app = initializeApp(config, 'rules-test-app');
  const db = getFirestore(app, config.firestoreDatabaseId);

  try {
    await assert.rejects(
      async () => {
        await getDocFromServer(doc(db, 'users', 'unauthorized-probe-uid'));
      },
      (err: unknown) => {
        const code =
          err instanceof Error && 'code' in err ? String((err as { code?: unknown }).code) : '';
        assert.equal(code, 'permission-denied');
        return true;
      }
    );
  } finally {
    await terminate(db);
    await deleteApp(app);
  }
});
