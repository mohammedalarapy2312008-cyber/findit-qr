import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { createServerApp } from '../../server';
import { INITIAL_TAG_DESIGNS } from '../data/foundationCatalog';
import { RegisteredItem, UserProfile } from '../types/domain';
import {
  buildFinderPublicView,
  buildQrRecoveryUrl,
  createUniqueSerialCode,
  generateQrMatrix,
} from './qrLogic';
import {
  composeItemTemplateDesignSvg,
  getDefaultUnlockedTemplateId,
} from './templateQrCompositor';
import { isTemplateFree } from './templateDiscovery';

function makeTempDbPath(name: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'finditqr-workflow-'));
  return path.join(dir, `${name}.json`);
}

test('QR payload generation binds ONLY to public recovery URL and leaks zero owner contact data', () => {
  const serial1 = createUniqueSerialCode(new Set());
  const serial2 = createUniqueSerialCode(new Set([serial1]));
  assert.notEqual(serial1, serial2);

  const url = buildQrRecoveryUrl(serial1, 'https://finditqr.app');
  assert.equal(url, `https://finditqr.app/found/${encodeURIComponent(serial1)}`);
  assert.ok(!url.includes('@'));
  assert.ok(!url.includes('+966'));

  const matrix = generateQrMatrix(url, undefined, 'M');
  assert.ok(matrix.length >= 21, 'ISO-18004 QR matrix must be at least 21x21 modules');
  assert.equal(matrix.length, matrix[0].length, 'QR matrix must be square');
  // Top-left 7x7 finder pattern check
  assert.equal(matrix[0][0], true);
  assert.equal(matrix[0][6], true);
  assert.equal(matrix[6][0], true);
  assert.equal(matrix[6][6], true);
  assert.equal(matrix[3][3], true);
});

test('Template-QR compositor injects real item QR across Master 33, Batch 02, and Pilot architectures without mutating templates', () => {
  const published = INITIAL_TAG_DESIGNS.filter((t) => (t.status || 'published') === 'published');
  assert.equal(published.length, 58, 'All 58 published templates must remain intact');

  const masterTpl = published.find((t) => t.id === 'master-01-corporate-briefcase');
  const batch02Tpl = published.find((t) => t.id === 'pilot-neon-velocity');
  const pilotTpl = published.find((t) => t.id === 'pilot-atelier-personal');
  assert.ok(masterTpl && batch02Tpl && pilotTpl);

  const serial = 'FQR-TEST-9021';
  const expectedUrl = buildQrRecoveryUrl(serial, 'https://finditqr.app');

  const masterClean = composeItemTemplateDesignSvg({
    design: masterTpl,
    codeSerial: serial,
    mode: 'clean',
    baseOrigin: 'https://finditqr.app',
  });
  assert.equal(masterClean.architecture, 'master33');
  assert.equal(masterClean.recoveryUrl, expectedUrl);
  assert.ok(masterClean.svgMarkup.includes('<svg'));
  assert.ok(masterClean.svgMarkup.includes('</svg>'));
  assert.ok(masterClean.svgMarkup.includes('<rect'));

  const batch02Clean = composeItemTemplateDesignSvg({
    design: batch02Tpl,
    codeSerial: serial,
    mode: 'clean',
    baseOrigin: 'https://finditqr.app',
  });
  assert.equal(batch02Clean.architecture, 'batch02');
  assert.ok(batch02Clean.svgMarkup.includes('findit-item-dynamic-qr'));
  assert.ok(batch02Clean.svgMarkup.includes(expectedUrl));

  const batch02Print = composeItemTemplateDesignSvg({
    design: batch02Tpl,
    codeSerial: serial,
    mode: 'print',
    baseOrigin: 'https://finditqr.app',
  });
  assert.ok(batch02Print.svgMarkup.includes('findit-item-dynamic-qr'));
  assert.ok(batch02Print.svgMarkup.includes(expectedUrl));

  const pilotClean = composeItemTemplateDesignSvg({
    design: pilotTpl,
    codeSerial: serial,
    mode: 'clean',
    baseOrigin: 'https://finditqr.app',
  });
  assert.equal(pilotClean.architecture, 'pilot_vector');
  assert.ok(pilotClean.svgMarkup.includes('<svg'));
  assert.ok(pilotClean.svgMarkup.includes('</svg>'));

  // Default unlocked template helper always returns a Free published template for Free plan users
  const defaultFreeId = getDefaultUnlockedTemplateId(published, 'Free', new Set());
  const defaultFreeTpl = published.find((t) => t.id === defaultFreeId);
  assert.ok(defaultFreeTpl);
  assert.equal(isTemplateFree(defaultFreeTpl), true);
});

test('buildFinderPublicView enforces granular privacy toggles and paused public page strictly', () => {
  const item: RegisteredItem = {
    id: 'item-priv-1',
    qrId: 'qr-priv-1',
    ownerUid: 'u1',
    codeSerial: 'FQR-PRIV-001',
    name: 'حقيبة سفر سوداء',
    nameAr: 'حقيبة سفر سوداء',
    nameEn: 'Black Travel Bag',
    category: 'bags',
    status: 'Active',
    description: 'وصف تفصيلي سري للحقيبة',
    descriptionAr: 'وصف تفصيلي سري للحقيبة',
    descriptionEn: 'Detailed luggage description',
    imageUrl: 'https://example.com/bag.jpg',
    city: 'الرياض',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    recoveryInstructions: 'تواصل معي لو سمحت',
    finderNoteAr: 'تواصل معي لو سمحت',
    finderNoteEn: 'Please contact me',
    rewardOffered: true,
    rewardAmountTextAr: '200 SAR',
    rewardAmountTextEn: '200 SAR',
    designId: 'master-04-heritage-compass',
    totalScans: 0,
    lastScanAt: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    contactChannels: {
      showPhone: true,
      showWhatsapp: false,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: false,
      customPhone: '+966500000111',
      customWhatsapp: '+966500000111',
      customEmail: 'tariq@example.com',
      customTelegram: '@tariq_qr',
    },
    privacySettings: {
      publicPageEnabled: true,
      showDescription: false,
      showImage: false,
      showCity: false,
      allowFinderMessages: true,
      allowFoundReports: false,
    },
  };

  const restrictedView = buildFinderPublicView(item);
  assert.equal(restrictedView.isPublicPageActive, true);
  assert.equal(restrictedView.descriptionAr, '');
  assert.equal(restrictedView.imageUrl, '');
  assert.equal(restrictedView.cityAr, '');
  assert.equal(restrictedView.allowFinderMessages, true);
  assert.equal(restrictedView.allowFoundReports, false);
  assert.equal(restrictedView.visibleChannels.phone, '+966500000111');
  assert.equal(restrictedView.visibleChannels.whatsapp, null);

  // Pause public page completely
  const pausedItem: RegisteredItem = {
    ...item,
    privacySettings: {
      ...item.privacySettings!,
      publicPageEnabled: false,
    },
  };
  const pausedView = buildFinderPublicView(pausedItem);
  assert.equal(pausedView.isPublicPageActive, false);
  assert.equal(pausedView.allowFinderMessages, false);
  assert.equal(pausedView.allowFoundReports, false);
  assert.equal(pausedView.visibleChannels.phone, null);
  assert.equal(pausedView.descriptionAr, '');
  assert.equal(pausedView.imageUrl, '');
});

test('End-to-end API lifecycle: Groups isolation, Paid template 403 enforcement, Item+Template+QR persistence, Privacy & Cascade Delete', async (t) => {
  const dbPath = makeTempDbPath('e2e-lifecycle');
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

  // 1. Register User A and User B
  const register = async (email: string, fullName: string) => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        email,
        password: 'Password123!',
        country: 'Saudi Arabia',
        preferredLanguage: 'ar',
      }),
    });
    assert.equal(res.status, 201);
    return (await res.json()) as { token: string; profile: UserProfile };
  };

  const userA = await register('owner-a@example.com', 'Owner A');
  const userB = await register('owner-b@example.com', 'Owner B');

  const authHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  // 2. User A creates an Item Group
  const createGroupRes = await fetch(`${baseUrl}/api/groups`, {
    method: 'POST',
    headers: authHeaders(userA.token),
    body: JSON.stringify({ name: 'أغراض السفر', color: '#2563EB' }),
  });
  assert.equal(createGroupRes.status, 201);
  const groupBody = (await createGroupRes.json()) as { ok: boolean; group: { id: string; name: string } };
  assert.equal(groupBody.group.name, 'أغراض السفر');

  // 3. User B cannot access/edit/delete User A's group (strict isolation)
  const stealGroupEdit = await fetch(`${baseUrl}/api/groups/${groupBody.group.id}`, {
    method: 'PATCH',
    headers: authHeaders(userB.token),
    body: JSON.stringify({ name: 'Hacked Group' }),
  });
  assert.equal(stealGroupEdit.status, 403);

  const stealGroupDelete = await fetch(`${baseUrl}/api/groups/${groupBody.group.id}`, {
    method: 'DELETE',
    headers: authHeaders(userB.token),
  });
  assert.equal(stealGroupDelete.status, 403);

  // 4. Identify one published Free template and one published Paid template
  const published = INITIAL_TAG_DESIGNS.filter((tpl) => (tpl.status || 'published') === 'published');
  const freeTpl = published.find((tpl) => isTemplateFree(tpl));
  const paidTpl = published.find((tpl) => !isTemplateFree(tpl));
  assert.ok(freeTpl && paidTpl, 'Must have both published free and paid templates');

  // 5. User A (Free plan) is blocked with 403 TEMPLATE_ACCESS_DENIED when attempting to bind a Paid template
  const blockedPaidRes = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: authHeaders(userA.token),
    body: JSON.stringify({
      name: 'جهاز لابتوب',
      category: 'electronics',
      groupId: groupBody.group.id,
      city: 'الرياض',
      finderNote: 'أرجو التواصل عند العثور على الجهاز',
      designId: paidTpl.id,
      showPhone: true,
      customPhone: '+966550001234',
    }),
  });
  assert.equal(blockedPaidRes.status, 403);
  const blockedPaidBody = (await blockedPaidRes.json()) as { errorCode: string };
  assert.equal(blockedPaidBody.errorCode, 'TEMPLATE_ACCESS_DENIED');

  // 6. User B cannot bind User A's group to User B's item
  const crossGroupItemRes = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: authHeaders(userB.token),
    body: JSON.stringify({
      name: 'مفتاح سيارة',
      category: 'keys',
      groupId: groupBody.group.id,
      city: 'جدة',
      finderNote: 'تواصل معي لاستلام المفتاح',
      designId: freeTpl.id,
      showPhone: true,
      customPhone: '+966550009999',
    }),
  });
  assert.equal(crossGroupItemRes.status, 403);

  // 7. User A successfully creates an Item with Free template, Group, and granular privacy settings
  const createItemRes = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: authHeaders(userA.token),
    body: JSON.stringify({
      name: 'حقيبة اللابتوب الشخصية',
      category: 'electronics',
      groupId: groupBody.group.id,
      description: 'حقيبة سوداء تحتوي على شاحن ودفتر ملاحظات',
      city: 'الرياض',
      finderNote: 'أرجو التواصل فور العثور عليها',
      designId: freeTpl.id,
      showPhone: true,
      showWhatsapp: false,
      showEmail: false,
      showTelegram: false,
      anonymousRelayOnly: false,
      customPhone: '+966550001234',
      privacySettings: {
        publicPageEnabled: true,
        showDescription: true,
        showImage: true,
        showCity: true,
        allowFinderMessages: true,
        allowFoundReports: true,
      },
    }),
  });
  assert.equal(createItemRes.status, 201);
  const createdItemBody = (await createItemRes.json()) as {
    ok: boolean;
    item: RegisteredItem;
    qrRecord: { id: string; codeSerial: string };
  };
  assert.equal(createdItemBody.item.designId, freeTpl.id);
  assert.equal(createdItemBody.item.groupId, groupBody.group.id);
  assert.equal(createdItemBody.item.groupName, 'أغراض السفر');
  assert.ok(createdItemBody.item.codeSerial.startsWith('FQR-'));

  const serial = createdItemBody.item.codeSerial;

  // 8. Unauthenticated public recovery page returns ONLY approved fields
  const publicRes1 = await fetch(`${baseUrl}/api/public/qr/${encodeURIComponent(serial)}`);
  assert.equal(publicRes1.status, 200);
  const publicBody1 = (await publicRes1.json()) as { ok: boolean; payload: any };
  assert.equal(publicBody1.payload.isPublicPageActive, true);
  assert.equal(publicBody1.payload.designId, freeTpl.id);
  assert.equal(publicBody1.payload.cityAr, 'الرياض');
  assert.equal(publicBody1.payload.descriptionAr, 'حقيبة سوداء تحتوي على شاحن ودفتر ملاحظات');
  assert.equal(publicBody1.payload.visibleChannels.phone, '+966550001234');
  assert.equal(publicBody1.payload.visibleChannels.email, null);

  // 9. Owner disables description & pauses public page -> public API immediately hides fields & blocks messages/reports
  const patchPrivacyRes = await fetch(`${baseUrl}/api/items/${createdItemBody.item.id}`, {
    method: 'PATCH',
    headers: authHeaders(userA.token),
    body: JSON.stringify({
      privacySettings: {
        publicPageEnabled: false,
        showDescription: false,
        showImage: false,
        showCity: false,
        allowFinderMessages: false,
        allowFoundReports: false,
      },
    }),
  });
  assert.equal(patchPrivacyRes.status, 200);

  const publicResPaused = await fetch(`${baseUrl}/api/public/qr/${encodeURIComponent(serial)}`);
  assert.equal(publicResPaused.status, 200);
  const pausedBody = (await publicResPaused.json()) as { ok: boolean; payload: any };
  assert.equal(pausedBody.payload.isPublicPageActive, false);
  assert.equal(pausedBody.payload.visibleChannels.phone, null);
  assert.equal(pausedBody.payload.descriptionAr, '');
  assert.equal(pausedBody.payload.cityAr, '');

  const blockedMsgRes = await fetch(
    `${baseUrl}/api/public/qr/${encodeURIComponent(serial)}/message`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        finderName: 'محمد',
        message: 'وجدت الحقيبة في المطار',
      }),
    }
  );
  assert.equal(blockedMsgRes.status, 403);
  const blockedMsgBody = (await blockedMsgRes.json()) as { errorCode: string };
  assert.equal(blockedMsgBody.errorCode, 'PUBLIC_PAGE_PAUSED');

  const blockedReportRes = await fetch(
    `${baseUrl}/api/public/qr/${encodeURIComponent(serial)}/found-report`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationHint: 'الرياض' }),
    }
  );
  assert.equal(blockedReportRes.status, 403);

  // 10. Re-enable public page & send finder message, then delete item -> public URL returns 404 immediately
  const resumeRes = await fetch(`${baseUrl}/api/items/${createdItemBody.item.id}`, {
    method: 'PATCH',
    headers: authHeaders(userA.token),
    body: JSON.stringify({
      privacySettings: {
        publicPageEnabled: true,
        showDescription: true,
        showImage: true,
        showCity: true,
        allowFinderMessages: true,
        allowFoundReports: true,
      },
    }),
  });
  assert.equal(resumeRes.status, 200);

  const okMsgRes = await fetch(
    `${baseUrl}/api/public/qr/${encodeURIComponent(serial)}/message`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        finderName: 'سعد',
        message: 'تم العثور على الحقيبة بأمان عند الاستقبال',
      }),
    }
  );
  assert.equal(okMsgRes.status, 201);

  const delItemRes = await fetch(`${baseUrl}/api/items/${createdItemBody.item.id}`, {
    method: 'DELETE',
    headers: authHeaders(userA.token),
  });
  assert.equal(delItemRes.status, 200);

  const publicAfterDelete = await fetch(`${baseUrl}/api/public/qr/${encodeURIComponent(serial)}`);
  assert.equal(publicAfterDelete.status, 404);
});
