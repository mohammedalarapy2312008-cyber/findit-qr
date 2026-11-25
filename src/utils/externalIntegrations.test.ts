import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createServerApp } from '../../server';
import {
  buildFinderMessageEmail,
  detectEmailProvider,
  escapeHtml,
  sendTransactionalEmail,
} from '../server/integrations/emailService';
import {
  classifyGeminiError,
  getGeminiIntegrationStatus,
} from '../server/integrations/geminiService';
import { buildIntegrationsHealthSnapshot } from '../server/integrations/integrationStatus';
import { detectImageMimeFromMagicBytes } from '../server/integrations/mediaStorageService';
import {
  detectWhatsAppProvider,
  normalizeWhatsAppPhone,
  sendWhatsAppAlert,
} from '../server/integrations/whatsappService';

// Valid 1x1 PNG binary (67 bytes)
const VALID_PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);
const VALID_PNG_DATA_URL = `data:image/png;base64,${VALID_PNG_BYTES.toString('base64')}`;

// Minimal valid JPEG signature bytes (>= 12 bytes)
const VALID_JPEG_BYTES = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9,
]);

// Minimal valid WebP signature bytes (RIFF....WEBP)
const VALID_WEBP_BYTES = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);

async function startTempServer(options: Parameters<typeof createServerApp>[0] = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finditqr-int-test-'));
  const dbFilePath = path.join(tmpDir, 'db.json');
  const mediaRoot = path.join(tmpDir, 'media');
  const { app } = await createServerApp({
    dbFilePath,
    mediaRoot,
    disableVite: true,
    disableAuthRateLimit: true,
    ...options,
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    cleanup: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      fs.rmSync(tmpDir, { recursive: true, force: true });
    },
  };
}

test('Magic-byte signature detection accepts PNG/JPEG/WebP and rejects spoofed text', () => {
  assert.equal(detectImageMimeFromMagicBytes(VALID_PNG_BYTES), 'image/png');
  assert.equal(detectImageMimeFromMagicBytes(VALID_JPEG_BYTES), 'image/jpeg');
  assert.equal(detectImageMimeFromMagicBytes(VALID_WEBP_BYTES), 'image/webp');
  assert.equal(detectImageMimeFromMagicBytes(Buffer.from('<script>alert(1)</script>')), null);
  assert.equal(detectImageMimeFromMagicBytes(Buffer.from('short')), null);
});

test('Gemini service status and error classification redact secrets and classify codes', () => {
  const emptyStatus = getGeminiIntegrationStatus({});
  assert.equal(emptyStatus.configured, false);
  assert.equal(emptyStatus.mode, 'fallback_only');
  assert.equal(emptyStatus.requiresPaidKey, true);

  const liveStatus = getGeminiIntegrationStatus({ GEMINI_API_KEY: 'AIzaSyFakeKey1234567890' });
  assert.equal(liveStatus.configured, true);
  assert.equal(liveStatus.mode, 'live_ready');

  const c400 = classifyGeminiError(new Error('400 API_KEY_INVALID for AIzaSySecretValue123456'));
  assert.equal(c400.errorCode, 'API_KEY_INVALID');
  assert.equal(c400.retryable, false);
  assert.ok(!c400.detail.includes('AIzaSySecretValue123456'));

  const c403 = classifyGeminiError(new Error('403 PERMISSION_DENIED billing required'));
  assert.equal(c403.errorCode, 'PAID_KEY_OR_PERMISSION_REQUIRED');

  const c429 = classifyGeminiError(new Error('429 RESOURCE_EXHAUSTED'));
  assert.equal(c429.errorCode, 'RATE_LIMIT_OR_QUOTA');
  assert.equal(c429.retryable, true);
});

test('Email service escapes HTML, detects providers, and sends real HTTP payloads to Resend & SendGrid', async () => {
  assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(detectEmailProvider({}), 'unconfigured');
  assert.equal(detectEmailProvider({ RESEND_API_KEY: 're_test_123' }), 'resend');
  assert.equal(detectEmailProvider({ SENDGRID_API_KEY: 'SG.test_123' }), 'sendgrid');
  assert.equal(
    detectEmailProvider({ SMTP_HOST: 'smtp.example.com', SMTP_USER: 'u', SMTP_PASS: 'p' }),
    'smtp'
  );

  // Unconfigured returns honest unconfigured result
  const unconf = await sendTransactionalEmail(
    { to: 'user@example.com', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' },
    { env: {} }
  );
  assert.equal(unconf.sent, false);
  assert.equal(unconf.provider, 'unconfigured');

  // Spin up local HTTP receiver to verify real Resend & SendGrid HTTP transport
  const captured: Array<{ url: string; auth: string; body: Record<string, unknown> }> = [];
  const mockApi = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
      captured.push({
        url: req.url || '',
        auth: req.headers.authorization || '',
        body: parsed,
      });
      res.writeHead(200, { 'Content-Type': 'application/json', 'x-message-id': 'sg-msg-42' });
      res.end(JSON.stringify({ id: 'resend-msg-99' }));
    });
  });
  await new Promise<void>((resolve) => mockApi.listen(0, '127.0.0.1', () => resolve()));
  const addr = mockApi.address();
  const mockPort = typeof addr === 'object' && addr ? addr.port : 0;

  try {
    const msg = buildFinderMessageEmail({
      to: 'owner@example.com',
      itemName: '<b>Wallet</b>',
      codeSerial: 'FND-1234',
      senderName: 'Sara',
      message: 'Found at <cafe>',
    });
    assert.ok(!msg.html.includes('<b>Wallet</b>'));
    assert.ok(msg.html.includes('&lt;b&gt;Wallet&lt;/b&gt;'));

    const resendRes = await sendTransactionalEmail(msg, {
      env: { RESEND_API_KEY: 're_live_mock', EMAIL_FROM: 'FindIt QR <no-reply@finditqr.com>' },
      resendEndpoint: `http://127.0.0.1:${mockPort}/resend`,
    });
    assert.equal(resendRes.sent, true);
    assert.equal(resendRes.provider, 'resend');
    assert.equal(resendRes.messageId, 'resend-msg-99');
    assert.equal(captured[0].auth, 'Bearer re_live_mock');

    const sgRes = await sendTransactionalEmail(msg, {
      env: { SENDGRID_API_KEY: 'SG.mock_key', EMAIL_FROM: 'no-reply@finditqr.com' },
      sendgridEndpoint: `http://127.0.0.1:${mockPort}/sendgrid`,
    });
    assert.equal(sgRes.sent, true);
    assert.equal(sgRes.provider, 'sendgrid');
    assert.equal(sgRes.messageId, 'sg-msg-42');
    assert.equal(captured[1].auth, 'Bearer SG.mock_key');
  } finally {
    await new Promise<void>((resolve) => mockApi.close(() => resolve()));
  }
});

test('WhatsApp service normalizes E.164 phones and sends real HTTP payloads to Meta Cloud & Twilio', async () => {
  assert.equal(normalizeWhatsAppPhone('00966 50 123 4567'), '+966501234567');
  assert.equal(normalizeWhatsAppPhone('whatsapp:+20 (100) 123-4567'), '+201001234567');
  assert.equal(normalizeWhatsAppPhone('123'), '');

  assert.equal(detectWhatsAppProvider({}), 'unconfigured');
  assert.equal(
    detectWhatsAppProvider({ WHATSAPP_ACCESS_TOKEN: 'tok', WHATSAPP_PHONE_NUMBER_ID: '12345' }),
    'meta_cloud'
  );
  assert.equal(
    detectWhatsAppProvider({
      TWILIO_ACCOUNT_SID: 'AC123',
      TWILIO_AUTH_TOKEN: 'secret',
      TWILIO_WHATSAPP_FROM: '+14155238886',
    }),
    'twilio'
  );

  const captured: Array<{ url: string; auth: string; rawBody: string }> = [];
  const mockApi = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      captured.push({
        url: req.url || '',
        auth: req.headers.authorization || '',
        rawBody: Buffer.concat(chunks).toString('utf8'),
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ messages: [{ id: 'wamid.123' }], sid: 'SM999' }));
    });
  });
  await new Promise<void>((resolve) => mockApi.listen(0, '127.0.0.1', () => resolve()));
  const addr = mockApi.address();
  const mockPort = typeof addr === 'object' && addr ? addr.port : 0;

  try {
    const metaRes = await sendWhatsAppAlert(
      { toPhone: '+966501234567', bodyText: 'Urgent found report' },
      {
        env: { WHATSAPP_ACCESS_TOKEN: 'meta_tok', WHATSAPP_PHONE_NUMBER_ID: '998877' },
        metaBaseUrl: `http://127.0.0.1:${mockPort}`,
      }
    );
    assert.equal(metaRes.sent, true);
    assert.equal(metaRes.provider, 'meta_cloud');
    assert.equal(metaRes.messageId, 'wamid.123');
    assert.equal(captured[0].url, '/v21.0/998877/messages');
    assert.ok(captured[0].rawBody.includes('"messaging_product":"whatsapp"'));

    const twilioRes = await sendWhatsAppAlert(
      { toPhone: '+201001234567', bodyText: 'Twilio alert' },
      {
        env: {
          TWILIO_ACCOUNT_SID: 'AC0001',
          TWILIO_AUTH_TOKEN: 'auth99',
          TWILIO_WHATSAPP_FROM: '+14155238886',
        },
        twilioBaseUrl: `http://127.0.0.1:${mockPort}`,
      }
    );
    assert.equal(twilioRes.sent, true);
    assert.equal(twilioRes.provider, 'twilio');
    assert.equal(twilioRes.messageId, 'SM999');
    assert.ok(captured[1].auth.startsWith('Basic '));
    assert.ok(captured[1].rawBody.includes('To=whatsapp%3A%2B201001234567'));
  } finally {
    await new Promise<void>((resolve) => mockApi.close(() => resolve()));
  }
});

test('End-to-end server integrations: media magic-byte guard, /api/integrations/status, email & WhatsApp triggers', async () => {
  const sentEmails: Array<{ to: string; subject: string; text: string }> = [];
  const sentWhatsApps: Array<{ toPhone: string; bodyText: string }> = [];

  const { baseUrl, cleanup } = await startTempServer({
    emailOverrides: {
      customSender: async (payload) => {
        sentEmails.push({ to: payload.to, subject: payload.subject, text: payload.text });
        return { sent: true, provider: 'resend', messageId: `mock-email-${sentEmails.length}` };
      },
    },
    whatsappOverrides: {
      customSender: async (payload) => {
        sentWhatsApps.push({ toPhone: payload.toPhone, bodyText: payload.bodyText });
        return { sent: true, provider: 'meta_cloud', messageId: `mock-wa-${sentWhatsApps.length}` };
      },
    },
  });

  try {
    // 1. /api/integrations/status must reject unauthenticated requests
    const unauthStatus = await fetch(`${baseUrl}/api/integrations/status`);
    assert.equal(unauthStatus.status, 401);

    // 2. Register user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Integration Tester',
        email: 'tester@example.test',
        password: 'StrongPassword123!',
      }),
    });
    assert.equal(regRes.status, 201);
    const cookie = regRes.headers.get('set-cookie')?.split(';')[0] || '';
    assert.ok(cookie.includes('finditqr_session='));

    // 3. Authenticated /api/integrations/status returns full readiness without secrets
    const statusRes = await fetch(`${baseUrl}/api/integrations/status`, {
      headers: { Cookie: cookie },
    });
    assert.equal(statusRes.status, 200);
    const statusJson = (await statusRes.json()) as { ok: boolean; status: Record<string, unknown> };
    assert.equal(statusJson.ok, true);
    const serialized = JSON.stringify(statusJson);
    assert.ok(serialized.includes('"magicByteValidation":true'));
    assert.ok(!serialized.includes('apiKey'));

    // 4. Media upload rejects spoofed text masquerading as PNG
    const spoofedRes = await fetch(`${baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        folder: 'originals',
        dataUrl: `data:image/png;base64,${Buffer.from('<html>not a png</html>').toString('base64')}`,
      }),
    });
    assert.equal(spoofedRes.status, 400);
    const spoofedJson = (await spoofedRes.json()) as { errorCode: string };
    assert.equal(spoofedJson.errorCode, 'INVALID_IMAGE_SIGNATURE');

    // 5. Media upload accepts valid PNG and serves with nosniff header
    const validUpload = await fetch(`${baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        folder: 'originals',
        dataUrl: VALID_PNG_DATA_URL,
        fileName: 'pixel.png',
      }),
    });
    assert.equal(validUpload.status, 201);
    const uploadJson = (await validUpload.json()) as { ok: boolean; url: string };
    assert.ok(uploadJson.url.startsWith('/api/media/originals/'));

    const unauthMediaGet = await fetch(`${baseUrl}${uploadJson.url}`);
    assert.equal(unauthMediaGet.status, 401);

    const mediaGet = await fetch(`${baseUrl}${uploadJson.url}`, {
      headers: { Cookie: cookie },
    });
    assert.equal(mediaGet.status, 200);
    assert.equal(mediaGet.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(mediaGet.headers.get('content-type'), 'image/png');

    // 6. Email verification dispatches real email
    const verifyReq = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({}),
    });
    assert.equal(verifyReq.status, 200);
    const verifyJson = (await verifyReq.json()) as { emailDelivered: boolean; emailProvider: string };
    assert.equal(verifyJson.emailDelivered, true);
    assert.equal(verifyJson.emailProvider, 'resend');
    assert.equal(sentEmails.length, 1);

    // 7. Password reset dispatches reset link email
    const resetReq = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tester@example.test' }),
    });
    assert.equal(resetReq.status, 200);
    await new Promise((r) => setTimeout(r, 30));
    assert.ok(sentEmails.some((e) => e.text.includes('/reset-password?token=')));

    // 8. Configure WhatsApp number + enable whatsappScanAlerts, create item, trigger found-report
    await fetch(`${baseUrl}/api/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ whatsapp: '+966501112233' }),
    });
    await fetch(`${baseUrl}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ instantEmailAlerts: true, whatsappScanAlerts: true }),
    });

    const createItem = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        name: 'MacBook Pro 14',
        category: 'electronics',
        description: 'Space Black MacBook Pro 14 inch',
        finderNote: 'Please call if found',
        city: 'Riyadh',
        imageUrl: '',
        rewardOffered: false,
        rewardAmountText: '',
        designId: 'design-luggage-pro',
        showPhone: false,
        showWhatsapp: true,
        showEmail: false,
        showTelegram: false,
        anonymousRelayOnly: false,
        customPhone: '',
        customWhatsapp: '+966501112233',
        customEmail: '',
      }),
    });
    assert.equal(createItem.status, 201);
    const itemJson = (await createItem.json()) as { item: { codeSerial: string } };

    const foundReport = await fetch(
      `${baseUrl}/api/public/qr/${encodeURIComponent(itemJson.item.codeSerial)}/found-report`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }
    );
    assert.equal(foundReport.status, 201);
    await new Promise((r) => setTimeout(r, 30));

    assert.ok(sentEmails.some((e) => e.subject.includes('MacBook Pro 14')));
    assert.equal(sentWhatsApps.length, 1);
    assert.equal(sentWhatsApps[0].toPhone, '+966501112233');

    // 9. Support ticket creation dispatches email
    const ticketRes = await fetch(`${baseUrl}/api/workspace/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        subject: 'Need QR sticker help',
        description: 'Testing support ticket confirmation email delivery.',
        category: 'technical',
      }),
    });
    assert.equal(ticketRes.status, 201);
    await new Promise((r) => setTimeout(r, 30));
    assert.ok(sentEmails.some((e) => e.subject.includes('SUP-')));

    // 10. Health snapshot helper works cleanly
    const snap = buildIntegrationsHealthSnapshot({ env: {} });
    assert.equal(snap.firebaseAuth.configured, true);
    assert.equal(snap.firestore.rulesFilePresent, true);
  } finally {
    await cleanup();
  }
});
