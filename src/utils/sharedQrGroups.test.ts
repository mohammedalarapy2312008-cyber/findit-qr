import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { createServerApp } from '../../server';
import { INITIAL_TAG_DESIGNS } from '../data/foundationCatalog';
import { RegisteredItem, SharedQrGroup } from '../types/domain';
import {
  buildSharedQrPublicPayload,
  buildSharedQrRecoveryUrl,
  createUniqueSharedQrCode,
  normalizeSharedQrGroupItems,
  validateSharedQrGroupInput,
} from './sharedQrLogic';

function makeTempDbPath(name: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'finditqr-shared-test-'));
  return path.join(dir, `${name}.json`);
}

function makeMockItem(overrides: Partial<RegisteredItem> = {}): RegisteredItem {
  return {
    id: 'item-1',
    ownerUid: 'owner-a',
    qrId: 'qr-1',
    codeSerial: 'FQR-2026-1111',
    name: 'Laptop Bag',
    nameAr: 'حقيبة اللابتوب',
    nameEn: 'Laptop Bag',
    category: 'bags',
    description: 'Navy travel laptop bag',
    descriptionAr: 'حقيبة لابتوب زرقاء',
    descriptionEn: 'Navy travel laptop bag',
    imageUrl: '',
    status: 'Active',
    recoveryInstructions: 'Please message me to return',
    finderNoteAr: 'يرجى التواصل لإعادتها',
    finderNoteEn: 'Please message me to return',
    city: 'Riyadh',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    rewardOffered: false,
    rewardAmountTextAr: '',
    rewardAmountTextEn: '',
    designId: 'design-luggage-pro',
    contactChannels: {
      showPhone: false,
      showWhatsapp: true,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: false,
      customPhone: '+966500001111',
      customWhatsapp: '+966500002222',
      customEmail: 'owner@example.com',
      customTelegram: '',
    },
    privacySettings: {
      publicPageEnabled: true,
      showDescription: true,
      showImage: false,
      showCity: false,
      allowFinderMessages: true,
      allowFoundReports: true,
    },
    totalScans: 0,
    lastScanAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

test('Pure logic: createUniqueSharedQrCode & buildSharedQrRecoveryUrl generate opaque PII-free codes', () => {
  const used = new Set<string>();
  for (let i = 0; i < 40; i += 1) {
    const code = createUniqueSharedQrCode(used);
    assert.match(code, /^SQR-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    assert.equal(used.has(code), false);
    used.add(code);
  }
  const url = buildSharedQrRecoveryUrl('SQR-ABCD-1234', 'https://finditqr.app');
  assert.equal(url, 'https://finditqr.app/shared/SQR-ABCD-1234');
  assert.equal(validateSharedQrGroupInput({ name: 'A' }).valid, false);
  assert.equal(validateSharedQrGroupInput({ name: 'حقيبة السفر', description: 'أغراض الرحلة' }).valid, true);
});

test('Pure logic: buildSharedQrPublicPayload strictly filters hidden/paused/archived items and honors per-item privacy', () => {
  const itemA = makeMockItem({ id: 'item-a', codeSerial: 'FQR-2026-AAAA' });
  const itemB = makeMockItem({
    id: 'item-b',
    codeSerial: 'FQR-2026-BBBB',
    name: 'House Keys',
    nameAr: 'مفاتيح المنزل',
    nameEn: 'House Keys',
  });
  const itemArchived = makeMockItem({
    id: 'item-c',
    status: 'Archived',
    codeSerial: 'FQR-2026-CCCC',
  });
  const itemsById = {
    [itemA.id]: itemA,
    [itemB.id]: itemB,
    [itemArchived.id]: itemArchived,
  };

  const group: SharedQrGroup = {
    id: 'sgrp-1',
    ownerUid: 'owner-a',
    shareCode: 'SQR-TEST-9999',
    name: 'Travel Bundle',
    description: 'Airport carry-on',
    isActive: true,
    items: [
      { itemId: 'item-a', isVisible: true, addedAt: '2026-01-01T00:00:00.000Z' },
      { itemId: 'item-b', isVisible: false, addedAt: '2026-01-01T00:00:00.000Z' },
      { itemId: 'item-c', isVisible: true, addedAt: '2026-01-01T00:00:00.000Z' },
    ],
    totalScans: 0,
    lastScanAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const activePayload = buildSharedQrPublicPayload(group, itemsById);
  assert.equal(activePayload.isActive, true);
  assert.equal(activePayload.visibleItemsCount, 1);
  assert.equal(activePayload.items.length, 1);
  assert.equal(activePayload.items[0].itemId, 'item-a');
  // Privacy masking: whatsapp allowed, phone/email/city hidden
  assert.equal(activePayload.items[0].visibleChannels.whatsapp, '+966500002222');
  assert.equal(activePayload.items[0].visibleChannels.phone, null);
  assert.equal(activePayload.items[0].visibleChannels.email, null);
  assert.equal(activePayload.items[0].cityAr, '');
  // Individual QR serial and ownerUid must never be leaked
  assert.equal('serialNumber' in activePayload.items[0], false);
  assert.equal('ownerUid' in activePayload.items[0], false);

  // Paused group returns zero items
  const pausedPayload = buildSharedQrPublicPayload({ ...group, isActive: false }, itemsById);
  assert.equal(pausedPayload.isActive, false);
  assert.equal(pausedPayload.visibleItemsCount, 0);
  assert.equal(pausedPayload.items.length, 0);

  // Ownership check on normalizeSharedQrGroupItems rejects foreign item
  const foreignItem = makeMockItem({ id: 'item-foreign', ownerUid: 'owner-other' });
  const norm = normalizeSharedQrGroupItems(
    [{ itemId: 'item-foreign', isVisible: true }],
    'owner-a',
    { ...itemsById, [foreignItem.id]: foreignItem },
    '2026-01-01T00:00:00.000Z'
  );
  assert.equal(norm.valid, false);
});

test('Live HTTP E2E: Shared QR Groups lifecycle, per-item visibility, immutability, independence, and cross-user isolation', async (t) => {
  const dbPath = makeTempDbPath('shared-qr-http');
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

  // 1. Register User A & User B
  const registerUser = async (name: string, email: string) => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: name,
        email,
        password: 'Password123!',
        country: 'Saudi Arabia',
        preferredLanguage: 'ar',
      }),
    });
    assert.equal(res.status, 201);
    return (await res.json()) as { token: string; profile: { uid: string } };
  };

  const userA = await registerUser('Noura Owner', 'noura-shared@example.com');
  const userB = await registerUser('Khalid Other', 'khalid-shared@example.com');
  const headersA = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userA.token}`,
  };
  const headersB = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userB.token}`,
  };

  // 2. Create 1 Organizational Group & 2 Existing Items for User A with different contact privacy settings
  const orgRes = await fetch(`${baseUrl}/api/groups`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ name: 'أغراض العمل التنظيمية', colorHex: '#2563EB' }),
  });
  assert.equal(orgRes.status, 201);
  const orgBody = (await orgRes.json()) as { group: { id: string } };

  const createItemA = async (
    name: string,
    phoneVisible: boolean,
    whatsappVisible: boolean,
    showCity: boolean
  ) => {
    const res = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        name,
        category: 'bags',
        groupId: orgBody.group.id,
        description: `Description for ${name}`,
        finderNote: `Return instructions for ${name}`,
        city: 'الرياض',
        imageUrl: '',
        rewardOffered: false,
        rewardAmountText: '',
        designId: 'design-luggage-pro',
        showPhone: phoneVisible,
        showWhatsapp: whatsappVisible,
        showEmail: false,
        showTelegram: false,
        anonymousRelayOnly: false,
        customPhone: '+966511111111',
        customWhatsapp: '+966522222222',
        customEmail: 'secret-owner@example.com',
        customTelegram: '',
        privacySettings: {
          publicPageEnabled: true,
          showDescription: true,
          showImage: false,
          showCity,
          allowFinderMessages: true,
          allowFoundReports: true,
        },
      }),
    });
    assert.equal(res.status, 201);
    return ((await res.json()) as { item: RegisteredItem }).item;
  };

  const item1 = await createItemA('حقيبة السفر السوداء', true, false, true);
  const item2 = await createItemA('مفاتيح السيارة', false, true, false);

  // 3. Create Shared QR Group linking both items (zero item duplication)
  const createSharedRes = await fetch(`${baseUrl}/api/shared-qr-groups`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      name: 'حزمة السفر',
      description: 'حقيبة ومفاتيح رحلة الصيف',
      items: [
        { itemId: item1.id, isVisible: true },
        { itemId: item2.id, isVisible: true },
      ],
    }),
  });
  assert.equal(createSharedRes.status, 201);
  const createdShared = ((await createSharedRes.json()) as { sharedQrGroup: SharedQrGroup }).sharedQrGroup;
  const originalShareCode = createdShared.shareCode;
  assert.match(originalShareCode, /^SQR-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.equal(createdShared.items.length, 2);

  // Verify User A still has exactly 2 items (zero duplication) and 1 untouched organizational group
  const wsRes = await fetch(`${baseUrl}/api/workspace`, { headers: headersA });
  const wsBody = (await wsRes.json()) as {
    items: RegisteredItem[];
    groups: Array<{ id: string }>;
    sharedQrGroups: SharedQrGroup[];
  };
  assert.equal(wsBody.items.length, 2);
  assert.equal(wsBody.groups.length, 1);
  assert.equal(wsBody.sharedQrGroups.length, 1);

  // 4. Public unauthenticated scan shows both visible items with distinct per-item privacy
  const pubRes1 = await fetch(`${baseUrl}/api/public/shared-qr/${originalShareCode}`);
  assert.equal(pubRes1.status, 200);
  const pubBody1 = (await pubRes1.json()) as { payload: any };
  assert.equal(pubBody1.payload.isActive, true);
  assert.equal(pubBody1.payload.items.length, 2);
  const pubItem1 = pubBody1.payload.items.find((i: any) => i.itemId === item1.id);
  const pubItem2 = pubBody1.payload.items.find((i: any) => i.itemId === item2.id);
  assert.equal(pubItem1.visibleChannels.phone, '+966511111111');
  assert.equal(pubItem1.visibleChannels.whatsapp, null);
  assert.equal(pubItem1.visibleChannels.email, null);
  assert.equal(pubItem1.cityAr, 'الرياض');
  assert.equal(pubItem2.visibleChannels.whatsapp, '+966522222222');
  assert.equal(pubItem2.visibleChannels.phone, null);
  assert.equal(pubItem2.cityAr, '');
  assert.equal(JSON.stringify(pubBody1.payload).includes('secret-owner@example.com'), false);
  assert.equal(JSON.stringify(pubBody1.payload).includes(userA.profile.uid), false);

  // 5. Hide Item 2 from Shared QR -> disappears from shared page, individual QR keeps working, shareCode unchanged
  const hideRes = await fetch(
    `${baseUrl}/api/shared-qr-groups/${createdShared.id}/items/${item2.id}`,
    {
      method: 'PATCH',
      headers: headersA,
      body: JSON.stringify({ isVisible: false }),
    }
  );
  assert.equal(hideRes.status, 200);
  const afterHide = ((await hideRes.json()) as { sharedQrGroup: SharedQrGroup }).sharedQrGroup;
  assert.equal(afterHide.shareCode, originalShareCode);

  const pubResAfterHide = await fetch(`${baseUrl}/api/public/shared-qr/${originalShareCode}`);
  const pubBodyAfterHide = (await pubResAfterHide.json()) as { payload: any };
  assert.equal(pubBodyAfterHide.payload.items.length, 1);
  assert.equal(pubBodyAfterHide.payload.items[0].itemId, item1.id);

  // Individual QR for Item 2 MUST be paused while Item 2 belongs to the Shared QR Group (strict non-conflict rule)
  const indivQrRes = await fetch(`${baseUrl}/api/public/qr/${item2.codeSerial}`);
  assert.equal(indivQrRes.status, 200);
  const indivQrBody = (await indivQrRes.json()) as { ok: boolean; payload: any };
  assert.equal(indivQrBody.ok, true);
  assert.equal(indivQrBody.payload.itemId, item2.id);
  assert.equal(indivQrBody.payload.isPublicPageActive, false);
  assert.equal(indivQrBody.payload.inactiveReason, 'shared_mode');
  assert.equal(indivQrBody.payload.visibleChannels.whatsapp, null);

  // Finder message to HIDDEN Item 2 via shared endpoint MUST be rejected (404)
  const msgHiddenRes = await fetch(
    `${baseUrl}/api/public/shared-qr/${originalShareCode}/items/${item2.id}/message`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Trying to message a hidden item' }),
    }
  );
  assert.equal(msgHiddenRes.status, 404);

  // Finder message & found report to VISIBLE Item 1 via shared endpoint MUST succeed without login
  const msgVisibleRes = await fetch(
    `${baseUrl}/api/public/shared-qr/${originalShareCode}/items/${item1.id}/message`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'وجدت حقيبتك في صالة المطار عند البوابة 4',
        senderName: 'أحمد',
        senderContact: '+966555000111',
      }),
    }
  );
  assert.equal(msgVisibleRes.status, 201);
  const msgVisibleBody = (await msgVisibleRes.json()) as { entry: any };
  assert.equal('ownerUid' in msgVisibleBody.entry, false);

  const reportVisibleRes = await fetch(
    `${baseUrl}/api/public/shared-qr/${originalShareCode}/items/${item1.id}/found-report`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } }
  );
  assert.equal(reportVisibleRes.status, 201);

  // 6. Pause Shared QR -> public endpoint returns isActive: false, items: [], blocks messages; Reactivate restores with same shareCode
  const pauseRes = await fetch(`${baseUrl}/api/shared-qr-groups/${createdShared.id}`, {
    method: 'PATCH',
    headers: headersA,
    body: JSON.stringify({ isActive: false, name: 'حزمة السفر المحدثة' }),
  });
  assert.equal(pauseRes.status, 200);
  const pausedGroup = ((await pauseRes.json()) as { sharedQrGroup: SharedQrGroup }).sharedQrGroup;
  assert.equal(pausedGroup.shareCode, originalShareCode);

  const pubPausedRes = await fetch(`${baseUrl}/api/public/shared-qr/${originalShareCode}`);
  const pubPausedBody = (await pubPausedRes.json()) as { payload: any };
  assert.equal(pubPausedBody.payload.isActive, false);
  assert.equal(pubPausedBody.payload.items.length, 0);

  const msgPausedRes = await fetch(
    `${baseUrl}/api/public/shared-qr/${originalShareCode}/items/${item1.id}/message`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Should be blocked while paused' }),
    }
  );
  assert.equal(msgPausedRes.status, 403);

  // Reactivate
  const resumeRes = await fetch(`${baseUrl}/api/shared-qr-groups/${createdShared.id}`, {
    method: 'PATCH',
    headers: headersA,
    body: JSON.stringify({ isActive: true }),
  });
  assert.equal(resumeRes.status, 200);
  const resumedGroup = ((await resumeRes.json()) as { sharedQrGroup: SharedQrGroup }).sharedQrGroup;
  assert.equal(resumedGroup.shareCode, originalShareCode);

  // 7. Cross-user security isolation: User B cannot edit/delete User A's group OR link User A's item
  const crossEdit = await fetch(`${baseUrl}/api/shared-qr-groups/${createdShared.id}`, {
    method: 'PATCH',
    headers: headersB,
    body: JSON.stringify({ name: 'Hijacked Group' }),
  });
  assert.equal(crossEdit.status, 403);

  const crossDelete = await fetch(`${baseUrl}/api/shared-qr-groups/${createdShared.id}`, {
    method: 'DELETE',
    headers: headersB,
  });
  assert.equal(crossDelete.status, 403);

  const crossLink = await fetch(`${baseUrl}/api/shared-qr-groups`, {
    method: 'POST',
    headers: headersB,
    body: JSON.stringify({
      name: 'User B Group',
      items: [{ itemId: item1.id, isVisible: true }],
    }),
  });
  assert.equal(crossLink.status, 403);

  // 8. Delete Shared QR Group -> public endpoint returns 404, items & individual QRs & org groups remain intact
  const deleteSharedRes = await fetch(`${baseUrl}/api/shared-qr-groups/${createdShared.id}`, {
    method: 'DELETE',
    headers: headersA,
  });
  assert.equal(deleteSharedRes.status, 200);

  const pubAfterDelete = await fetch(`${baseUrl}/api/public/shared-qr/${originalShareCode}`);
  assert.equal(pubAfterDelete.status, 404);

  const wsAfterDelete = await fetch(`${baseUrl}/api/workspace`, { headers: headersA });
  const wsAfterDeleteBody = (await wsAfterDelete.json()) as {
    items: RegisteredItem[];
    groups: Array<{ id: string }>;
    sharedQrGroups: SharedQrGroup[];
  };
  assert.equal(wsAfterDeleteBody.items.length, 2);
  assert.equal(wsAfterDeleteBody.groups.length, 1);
  assert.equal(wsAfterDeleteBody.sharedQrGroups.length, 0);

  // After deleting the Shared QR Group, items remain preserved in 'unassigned' mode (no auto-reactivation)
  const indivAfterDeleteRes = await fetch(`${baseUrl}/api/public/qr/${item1.codeSerial}`);
  assert.equal(indivAfterDeleteRes.status, 200);
  const indivAfterDeleteBody = (await indivAfterDeleteRes.json()) as { payload: any };
  assert.equal(indivAfterDeleteBody.payload.isPublicPageActive, false);
  assert.equal(indivAfterDeleteBody.payload.inactiveReason, 'unassigned_from_shared');

  // Restoring individual QR in 1 click reactivates the exact original codeSerial
  const restoreRes = await fetch(`${baseUrl}/api/items/${item1.id}/restore-individual-qr`, {
    method: 'POST',
    headers: headersA,
  });
  assert.equal(restoreRes.status, 200);
  const indivRestoredRes = await fetch(`${baseUrl}/api/public/qr/${item1.codeSerial}`);
  assert.equal(indivRestoredRes.status, 200);
  const indivRestoredBody = (await indivRestoredRes.json()) as { payload: any };
  assert.equal(indivRestoredBody.payload.isPublicPageActive, true);
});

test('Template Library Integrity: all 58 active templates retain 4 showcase preview files without missing assets', () => {
  const activeTemplates = INITIAL_TAG_DESIGNS.filter((d) => (d.status || 'published') === 'published');
  assert.equal(activeTemplates.length, 58);

  let verifiedShots = 0;
  for (const tpl of activeTemplates) {
    assert.ok(tpl.showcaseGallery, `Missing showcaseGallery for ${tpl.id}`);
    const shots = [
      tpl.showcaseGallery.mockup3dUrl,
      tpl.showcaseGallery.onProductUrl,
      tpl.showcaseGallery.closeupUrl,
      tpl.showcaseGallery.lifestyleUrl,
    ];
    for (const relUrl of shots) {
      assert.ok(relUrl && relUrl.startsWith('/'), `Invalid preview path for ${tpl.id}: ${relUrl}`);
      const diskPath = path.resolve(process.cwd(), 'public', relUrl.replace(/^\/+/, ''));
      assert.equal(fs.existsSync(diskPath), true, `Missing showcase image on disk: ${diskPath}`);
      assert.ok(fs.statSync(diskPath).size > 5000, `Suspiciously small image: ${diskPath}`);
      verifiedShots += 1;
    }
  }
  assert.equal(verifiedShots, 232);
});
