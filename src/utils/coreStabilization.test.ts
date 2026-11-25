import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { createServerApp } from '../../server';
import { INITIAL_TAG_DESIGNS } from '../data/foundationCatalog';
import { composeItemTemplateDesignSvg } from './templateQrCompositor';
import {
  buildBatchPrintSheetSvg,
  computeBatchPrintSheetLayout,
} from './printSheetLayout';
import type { RegisteredItem } from '../types/domain';

async function startTempServer() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finditqr-stab-'));
  const dbFilePath = path.join(tmpDir, 'test-db.json');
  const { app } = await createServerApp({
    dbFilePath,
    disableVite: true,
    disableAuthRateLimit: true,
  });

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const addr = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  return {
    baseUrl,
    cleanup: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  };
}

async function registerTestUser(baseUrl: string, name: string, email: string) {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: name,
      email,
      password: 'StrongPassword2026!',
      country: 'Saudi Arabia',
      preferredLanguage: 'ar',
    }),
  });
  assert.equal(res.status, 201);
  const body = (await res.json()) as { ok: boolean; token: string; profile: Record<string, unknown> };
  assert.equal(body.ok, true);
  return body;
}

test('Core Stabilization E2E: Free Plan 2-item quota, tamper defense, archive preservation, and reactivation rules', async () => {
  const { baseUrl, cleanup } = await startTempServer();
  try {
    const userA = await registerTestUser(baseUrl, 'أحمد مالك', 'quota.owner@example.test');
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userA.token}`,
    };

    // 1. Attempt to elevate plan/quota via PATCH /api/profile -> server must ignore
    const tamperRes = await fetch(`${baseUrl}/api/profile`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        displayName: 'أحمد مالك',
        plan: 'Pro',
        activeItemsLimit: 999,
      }),
    });
    assert.equal(tamperRes.status, 200);
    const tamperBody = (await tamperRes.json()) as { profile: { plan: string; activeItemsLimit: number } };
    assert.equal(tamperBody.profile.plan, 'Free');
    assert.equal(tamperBody.profile.activeItemsLimit, 2);

    const makeDraft = (name: string) => ({
      name,
      category: 'electronics',
      description: `وصف تجريبي للغرض ${name}`,
      finderNote: 'يرجى التواصل عند العثور على الغرض',
      city: 'الرياض',
      designId: 'master-04-heritage-compass',
      showPhone: true,
      showWhatsapp: false,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: false,
      customPhone: '+966501112222',
    });

    // 2. Create Item 1 & Item 2 (succeed)
    const create1 = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(makeDraft('جهاز ماك بوك 1')),
    });
    assert.equal(create1.status, 201);
    const item1 = ((await create1.json()) as { item: RegisteredItem }).item;

    const create2 = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(makeDraft('آيباد برو 2')),
    });
    assert.equal(create2.status, 201);
    const item2 = ((await create2.json()) as { item: RegisteredItem }).item;

    // 3. Direct API attempt for Item 3 must be strictly rejected (403 QUOTA_LIMIT_REACHED)
    const create3Blocked = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(makeDraft('كاميرا سوني 3')),
    });
    assert.equal(create3Blocked.status, 403);
    const blockedBody = (await create3Blocked.json()) as { errorCode: string };
    assert.equal(blockedBody.errorCode, 'QUOTA_LIMIT_REACHED');

    // 4. Archive Item 1 -> active count drops to 1/2, old item data stays intact
    const archive1 = await fetch(`${baseUrl}/api/items/${item1.id}/archive`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.equal(archive1.status, 200);
    const archBody = (await archive1.json()) as {
      item: RegisteredItem;
      profile: { activeItemsCount: number; activeItemsLimit: number };
    };
    assert.equal(archBody.item.status, 'Archived');
    assert.equal(archBody.item.codeSerial, item1.codeSerial);
    assert.equal(archBody.item.description, item1.description);
    assert.equal(archBody.profile.activeItemsCount, 1);
    assert.equal(archBody.profile.activeItemsLimit, 2);

    // 5. Create Item 3 now succeeds (2/2 active, 1 archived preserved)
    const create3Allowed = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(makeDraft('كاميرا سوني 3')),
    });
    assert.equal(create3Allowed.status, 201);
    const item3 = ((await create3Allowed.json()) as { item: RegisteredItem }).item;
    assert.notEqual(item3.codeSerial, item1.codeSerial);
    assert.notEqual(item3.codeSerial, item2.codeSerial);

    // 6. Reactivating archived Item 1 while at 2/2 must fail via BOTH /reactivate AND PATCH
    const reactivateBlocked = await fetch(`${baseUrl}/api/items/${item1.id}/reactivate`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.equal(reactivateBlocked.status, 403);

    const patchUnarchiveBlocked = await fetch(`${baseUrl}/api/items/${item1.id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'Active' }),
    });
    assert.equal(patchUnarchiveBlocked.status, 403);

    // 7. Archive Item 2, then reactivate Item 1 -> succeeds
    const archive2 = await fetch(`${baseUrl}/api/items/${item2.id}/archive`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.equal(archive2.status, 200);

    const reactivateOk = await fetch(`${baseUrl}/api/items/${item1.id}/reactivate`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.equal(reactivateOk.status, 200);
    const reactivatedBody = (await reactivateOk.json()) as {
      item: RegisteredItem;
      profile: { activeItemsCount: number };
    };
    assert.equal(reactivatedBody.item.status, 'Active');
    assert.equal(reactivatedBody.profile.activeItemsCount, 2);
  } finally {
    await cleanup();
  }
});

test('Core Stabilization E2E: User isolation, group rename QR immutability, server-side privacy masking, and delete/archive recovery behavior', async () => {
  const { baseUrl, cleanup } = await startTempServer();
  try {
    const userA = await registerTestUser(baseUrl, 'سارة المالكة', 'owner.iso@example.test');
    const userB = await registerTestUser(baseUrl, 'مستخدم آخر', 'other.user@example.test');
    const headersA = { 'Content-Type': 'application/json', Authorization: `Bearer ${userA.token}` };
    const headersB = { 'Content-Type': 'application/json', Authorization: `Bearer ${userB.token}` };

    // Create organizational group for User A
    const grpRes = await fetch(`${baseUrl}/api/groups`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ name: 'حقيبة العمل', colorHex: '#2563EB' }),
    });
    assert.equal(grpRes.status, 201);
    const groupA = ((await grpRes.json()) as { group: { id: string; name: string } }).group;

    // Create item in Group A with strict privacy: phone hidden, description & city hidden, WhatsApp visible
    const createRes = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        name: 'حاسوب سارة الشخصي',
        category: 'electronics',
        groupId: groupA.id,
        description: 'تفاصيل خاصة لا يجب أن تظهر للمكتشف',
        finderNote: 'يرجى التواصل عبر واتساب فقط',
        city: 'المدينة السرية',
        designId: 'master-04-heritage-compass',
        showPhone: false,
        showWhatsapp: true,
        showEmail: false,
        showTelegram: false,
        anonymousRelayOnly: false,
        customPhone: '+966509998888',
        customWhatsapp: '+966507776666',
        privacySettings: {
          publicPageEnabled: true,
          showDescription: false,
          showImage: false,
          showCity: false,
          allowFinderMessages: true,
          allowFoundReports: true,
        },
      }),
    });
    assert.equal(createRes.status, 201);
    const itemA = ((await createRes.json()) as { item: RegisteredItem }).item;

    // 1. User B cannot access/edit/archive/delete User A's item or group
    assert.equal((await fetch(`${baseUrl}/api/items/${itemA.id}`, { headers: headersB })).status, 403);
    assert.equal(
      (await fetch(`${baseUrl}/api/items/${itemA.id}`, { method: 'PATCH', headers: headersB, body: JSON.stringify({ name: 'اختراق' }) })).status,
      403
    );
    assert.equal((await fetch(`${baseUrl}/api/items/${itemA.id}/archive`, { method: 'POST', headers: headersB })).status, 403);
    assert.equal((await fetch(`${baseUrl}/api/items/${itemA.id}`, { method: 'DELETE', headers: headersB })).status, 403);
    assert.equal(
      (await fetch(`${baseUrl}/api/groups/${groupA.id}`, { method: 'PATCH', headers: headersB, body: JSON.stringify({ name: 'اختراق' }) })).status,
      403
    );
    assert.equal(
      (await fetch(`${baseUrl}/api/items`, {
        method: 'POST',
        headers: headersB,
        body: JSON.stringify({
          name: 'غرض ب',
          category: 'bags',
          groupId: groupA.id,
          finderNote: 'ملاحظة',
          designId: 'master-04-heritage-compass',
          showPhone: false,
          showWhatsapp: false,
          showEmail: false,
          showTelegram: false,
          anonymousRelayOnly: true,
        }),
      })).status,
      403
    );

    const wsB = (await (await fetch(`${baseUrl}/api/workspace`, { headers: headersB })).json()) as {
      items: RegisteredItem[];
      groups: unknown[];
    };
    assert.equal(wsB.items.length, 0);
    assert.equal(wsB.groups.length, 0);

    // 2. Rename Group A -> Item A's QR serial & qrId MUST stay 100% unchanged
    const renameRes = await fetch(`${baseUrl}/api/groups/${groupA.id}`, {
      method: 'PATCH',
      headers: headersA,
      body: JSON.stringify({ name: 'معدات السفر ٢٠٢٦' }),
    });
    assert.equal(renameRes.status, 200);
    const itemAfterRename = ((await (await fetch(`${baseUrl}/api/items/${itemA.id}`, { headers: headersA })).json()) as {
      item: RegisteredItem;
    }).item;
    assert.equal(itemAfterRename.codeSerial, itemA.codeSerial);
    assert.equal(itemAfterRename.qrId, itemA.qrId);
    assert.equal(itemAfterRename.groupName, 'معدات السفر ٢٠٢٦');

    // 3. Unauthenticated public recovery fetch enforces server-side masking
    const pubRes1 = await fetch(`${baseUrl}/api/public/qr/${encodeURIComponent(itemA.codeSerial)}`);
    assert.equal(pubRes1.status, 200);
    const pubRaw1 = await pubRes1.text();
    assert.equal(pubRaw1.includes('+966509998888'), false, 'Hidden phone number must never appear in public API response');
    assert.equal(pubRaw1.includes('تفاصيل خاصة لا يجب أن تظهر'), false, 'Hidden description must never appear in public API response');
    assert.equal(pubRaw1.includes('المدينة السرية'), false, 'Hidden city must never appear in public API response');
    const pubJson1 = JSON.parse(pubRaw1) as { payload: { visibleChannels: Record<string, string | null> } };
    assert.equal(pubJson1.payload.visibleChannels.phone, null);
    assert.equal(pubJson1.payload.visibleChannels.whatsapp, '+966507776666');

    // 4. Enable anonymousRelayOnly -> ALL direct channels masked on server
    await fetch(`${baseUrl}/api/items/${itemA.id}`, {
      method: 'PATCH',
      headers: headersA,
      body: JSON.stringify({
        contactChannels: {
          ...itemA.contactChannels,
          anonymousRelayOnly: true,
        },
      }),
    });
    const pubRawAnon = await (await fetch(`${baseUrl}/api/public/qr/${encodeURIComponent(itemA.codeSerial)}`)).text();
    assert.equal(pubRawAnon.includes('+966507776666'), false, 'WhatsApp must be masked when anonymousRelayOnly is enabled');

    // 5. Unauthenticated finder message succeeds and does NOT leak ownerUid
    const msgRes = await fetch(`${baseUrl}/api/public/qr/${encodeURIComponent(itemA.codeSerial)}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderName: 'أمين',
        message: 'وجدت الحاسوب في المقهى المجاور للمدخل الرئيسي',
        senderContact: '+966500001111',
      }),
    });
    assert.equal(msgRes.status, 201);
    const msgRaw = await msgRes.text();
    assert.equal(msgRaw.includes(String(userA.profile.uid)), false, 'Public message response must not leak ownerUid');

    // 6. Archive item -> public recovery masks contacts and blocks messages/reports; delete -> 404
    await fetch(`${baseUrl}/api/items/${itemA.id}/archive`, { method: 'POST', headers: headersA });
    const pubArchived = (await (await fetch(`${baseUrl}/api/public/qr/${encodeURIComponent(itemA.codeSerial)}`)).json()) as {
      payload: { isPublicPageActive: boolean; isContactEnabled: boolean; visibleChannels: Record<string, string | null> };
    };
    assert.equal(pubArchived.payload.isPublicPageActive, false);
    assert.equal(pubArchived.payload.isContactEnabled, false);
    assert.equal(pubArchived.payload.visibleChannels.whatsapp, null);

    const msgWhenArchived = await fetch(`${baseUrl}/api/public/qr/${encodeURIComponent(itemA.codeSerial)}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'رسالة بعد الأرشفة لا يجب قبولها' }),
    });
    assert.equal(msgWhenArchived.status, 403);

    await fetch(`${baseUrl}/api/items/${itemA.id}`, { method: 'DELETE', headers: headersA });
    const pubDeleted = await fetch(`${baseUrl}/api/public/qr/${encodeURIComponent(itemA.codeSerial)}`);
    assert.equal(pubDeleted.status, 404);
  } finally {
    await cleanup();
  }
});

test('Template Library Copy & Organizational Group Batch Print Independence: 0 phone numbers, full copy, distinct per-item QRs on A4 & Letter', () => {
  const active = INITIAL_TAG_DESIGNS.filter((d) => (d.status || 'published') === 'published');
  assert.equal(active.length, 58);

  const proGrid = active.find((d) => d.id === 'pilot-business-asset');
  assert.ok(proGrid);
  const proGridComp = composeItemTemplateDesignSvg({
    design: proGrid,
    codeSerial: 'FQR-COPY-01',
    mode: 'clean',
    baseOrigin: 'https://finditqr.com',
  });
  assert.ok(
    proGridComp.svgMarkup.includes('PROPERTY ASSET · SCAN TO RETURN'),
    'ProGrid ISO printed callout must not be truncated'
  );

  // Verify zero hardcoded phone numbers across all 58 active templates
  for (const tpl of active) {
    const comp = composeItemTemplateDesignSvg({
      design: tpl,
      codeSerial: 'FQR-CHECK-01',
      mode: 'clean',
      baseOrigin: 'https://finditqr.com',
    });
    const texts = [...comp.svgMarkup.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim()
    );
    const hasPhone = texts.some((t) => /\+?\d{7,}|05\d{7,}|555-\d{4}/i.test(t));
    assert.equal(hasPhone, false, `Template ${tpl.id} must not print hardcoded phone numbers`);
  }

  // Two items in the SAME organizational group must preserve distinct independent QR payloads on both A4 and Letter sheets
  const d1 = active[3]; // master-04-heritage-compass
  const d2 = active[4]; // master-05-tabby-kitten
  const sharedGroupId = 'grp-org-same';
  const item1 = {
    id: 'it-g1',
    ownerUid: 'u1',
    qrId: 'qr-g1',
    name: 'Laptop',
    nameAr: 'لابتوب',
    nameEn: 'Laptop',
    category: 'electronics',
    groupId: sharedGroupId,
    groupName: 'معدات السفر',
    description: '',
    descriptionAr: '',
    descriptionEn: '',
    recoveryInstructions: 'Scan',
    finderNoteAr: 'امسح',
    finderNoteEn: 'Scan',
    rewardOffered: false,
    rewardAmountTextAr: '',
    rewardAmountTextEn: '',
    city: 'Riyadh',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    imageUrl: '',
    status: 'Active',
    codeSerial: 'FQR-GRP-AAA1',
    designId: d1.id,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    lastScanAt: null,
    totalScans: 0,
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
  } as RegisteredItem;
  const item2 = { ...item1, id: 'it-g2', qrId: 'qr-g2', name: 'Camera', codeSerial: 'FQR-GRP-BBB2', designId: d2.id };

  for (const paperFormat of ['A4', 'Letter'] as const) {
    const plan = computeBatchPrintSheetLayout({
      queue: [
        { item: item1, design: d1, copies: 1 },
        { item: item2, design: d2, copies: 1 },
      ],
      paperFormat,
      mode: 'clean',
      scalePercent: 100,
      baseOrigin: 'https://finditqr.com',
    });
    const svg = buildBatchPrintSheetSvg({
      pagePlacements: plan.pages[0],
      paper: plan.paper,
      showCutMarks: true,
      showItemLabels: true,
      pageNumber: 1,
      totalPages: plan.pages.length,
    });
    assert.equal(plan.pages[0].length, 2);
    assert.equal(plan.pages[0][0].recoveryUrl, 'https://finditqr.com/found/FQR-GRP-AAA1');
    assert.equal(plan.pages[0][1].recoveryUrl, 'https://finditqr.com/found/FQR-GRP-BBB2');
    assert.notEqual(plan.pages[0][0].svgMarkup, plan.pages[0][1].svgMarkup);
    const [b1, b2] = plan.pages[0];
    const overlap =
      b1.xMm < b2.xMm + b2.widthMm &&
      b1.xMm + b1.widthMm > b2.xMm &&
      b1.yMm < b2.yMm + b2.heightMm &&
      b1.yMm + b1.heightMm > b2.yMm;
    assert.equal(overlap, false, `${paperFormat} sheet stickers must not overlap`);
    assert.ok(svg.includes('/found/FQR-GRP-AAA1'), `${paperFormat} sheet must encode item1 independent QR`);
    assert.ok(svg.includes('/found/FQR-GRP-BBB2'), `${paperFormat} sheet must encode item2 independent QR`);
  }
});
