import nodemailer from 'nodemailer';

export type EmailProviderName = 'resend' | 'sendgrid' | 'smtp' | 'unconfigured';

export interface EmailMessagePayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface EmailSendResult {
  sent: boolean;
  provider: EmailProviderName;
  messageId?: string;
  errorCode?: string;
  errorDetail?: string;
}

export interface EmailStatusSummary {
  configured: boolean;
  provider: EmailProviderName;
  fromConfigured: boolean;
  supportedProviders: ('resend' | 'sendgrid' | 'smtp')[];
}

export interface EmailServiceOverrides {
  env?: NodeJS.ProcessEnv;
  resendEndpoint?: string;
  sendgridEndpoint?: string;
  customSender?: (payload: EmailMessagePayload) => Promise<EmailSendResult>;
}

const DEFAULT_RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_SENDGRID_ENDPOINT = 'https://api.sendgrid.com/v3/mail/send';

export function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTrimmed(env: NodeJS.ProcessEnv, key: string): string {
  return (env[key] || '').trim();
}

export function resolveEmailFromAddress(env: NodeJS.ProcessEnv = process.env): string {
  return (
    getTrimmed(env, 'EMAIL_FROM') ||
    getTrimmed(env, 'SMTP_FROM') ||
    getTrimmed(env, 'SMTP_USER') ||
    ''
  );
}

export function detectEmailProvider(env: NodeJS.ProcessEnv = process.env): EmailProviderName {
  if (getTrimmed(env, 'RESEND_API_KEY')) {
    return 'resend';
  }
  if (getTrimmed(env, 'SENDGRID_API_KEY')) {
    return 'sendgrid';
  }
  if (getTrimmed(env, 'SMTP_HOST') && getTrimmed(env, 'SMTP_USER') && getTrimmed(env, 'SMTP_PASS')) {
    return 'smtp';
  }
  return 'unconfigured';
}

export function getEmailIntegrationStatus(
  env: NodeJS.ProcessEnv = process.env
): EmailStatusSummary {
  const provider = detectEmailProvider(env);
  const from = resolveEmailFromAddress(env);
  const configured = provider !== 'unconfigured' && Boolean(from);
  return {
    configured,
    provider: configured ? provider : 'unconfigured',
    fromConfigured: Boolean(from),
    supportedProviders: ['resend', 'sendgrid', 'smtp'],
  };
}

export function resolvePublicAppUrl(env: NodeJS.ProcessEnv = process.env): string {
  const raw = getTrimmed(env, 'APP_URL');
  if (raw && raw !== 'MY_APP_URL' && /^https?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

export async function sendTransactionalEmail(
  payload: EmailMessagePayload,
  overrides?: EmailServiceOverrides
): Promise<EmailSendResult> {
  if (overrides?.customSender) {
    return overrides.customSender(payload);
  }

  const env = overrides?.env ?? process.env;
  const provider = detectEmailProvider(env);
  const fromAddress = resolveEmailFromAddress(env);

  if (provider === 'unconfigured' || !fromAddress) {
    return {
      sent: false,
      provider: 'unconfigured',
      errorCode: 'EMAIL_PROVIDER_NOT_CONFIGURED',
      errorDetail:
        'Configure RESEND_API_KEY, SENDGRID_API_KEY, or SMTP_HOST/SMTP_USER/SMTP_PASS along with EMAIL_FROM in server environment.',
    };
  }

  const toEmail = payload.to.trim();
  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return {
      sent: false,
      provider,
      errorCode: 'INVALID_RECIPIENT_EMAIL',
    };
  }

  try {
    if (provider === 'resend') {
      const apiKey = getTrimmed(env, 'RESEND_API_KEY');
      const endpoint = overrides?.resendEndpoint || DEFAULT_RESEND_ENDPOINT;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [toEmail],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok) {
        return {
          sent: false,
          provider: 'resend',
          errorCode: `RESEND_HTTP_${res.status}`,
          errorDetail: typeof json.message === 'string' ? json.message.slice(0, 140) : 'Resend rejected request',
        };
      }
      return {
        sent: true,
        provider: 'resend',
        messageId: json.id,
      };
    }

    if (provider === 'sendgrid') {
      const apiKey = getTrimmed(env, 'SENDGRID_API_KEY');
      const endpoint = overrides?.sendgridEndpoint || DEFAULT_SENDGRID_ENDPOINT;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: fromAddress.replace(/^.*<([^>]+)>$/, '$1').trim() },
          subject: payload.subject,
          content: [
            { type: 'text/plain', value: payload.text },
            { type: 'text/html', value: payload.html },
          ],
          ...(payload.replyTo ? { reply_to: { email: payload.replyTo } } : {}),
        }),
      });
      if (!res.ok) {
        return {
          sent: false,
          provider: 'sendgrid',
          errorCode: `SENDGRID_HTTP_${res.status}`,
        };
      }
      return {
        sent: true,
        provider: 'sendgrid',
        messageId: res.headers.get('x-message-id') || undefined,
      };
    }

    // SMTP via nodemailer
    const host = getTrimmed(env, 'SMTP_HOST');
    const port = Number(getTrimmed(env, 'SMTP_PORT') || '587');
    const secure = getTrimmed(env, 'SMTP_SECURE') === 'true' || port === 465;
    const user = getTrimmed(env, 'SMTP_USER');
    const pass = getTrimmed(env, 'SMTP_PASS');

    const transporter = nodemailer.createTransport({
      host,
      port: Number.isFinite(port) && port > 0 ? port : 587,
      secure,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
    });

    return {
      sent: true,
      provider: 'smtp',
      messageId: info.messageId,
    };
  } catch (err) {
    return {
      sent: false,
      provider,
      errorCode: 'EMAIL_TRANSPORT_ERROR',
      errorDetail: err instanceof Error ? err.message.slice(0, 140) : 'Transport failed',
    };
  }
}

function wrapBilingualEmailHtml(params: {
  badgeAr: string;
  badgeEn: string;
  titleAr: string;
  titleEn: string;
  bodyArHtml: string;
  bodyEnHtml: string;
  ctaUrl?: string;
  ctaLabelAr?: string;
  ctaLabelEn?: string;
}): string {
  const safeCtaUrl =
    params.ctaUrl && /^https?:\/\//i.test(params.ctaUrl) ? escapeHtml(params.ctaUrl) : '';

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#0B1320;font-family:Arial,Helvetica,sans-serif;color:#E2E8F0;">
  <div style="max-width:600px;margin:0 auto;background:#111C2D;border:1px solid #1E293B;border-radius:16px;overflow:hidden;">
    <div style="padding:20px 24px;background:linear-gradient(135deg,#0F1A2B,#17243A);border-bottom:1px solid #1E293B;">
      <div style="font-size:18px;font-weight:700;color:#19B5A5;">FindIt QR</div>
      <div style="font-size:12px;color:#94A3B8;margin-top:4px;">${escapeHtml(params.badgeAr)} · ${escapeHtml(params.badgeEn)}</div>
    </div>
    <div style="padding:24px;direction:rtl;text-align:right;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#FFFFFF;">${escapeHtml(params.titleAr)}</h2>
      <div style="font-size:14px;line-height:1.7;color:#CBD5E1;">${params.bodyArHtml}</div>
    </div>
    ${
      safeCtaUrl
        ? `<div style="padding:0 24px 20px;text-align:center;">
      <a href="${safeCtaUrl}" style="display:inline-block;padding:12px 24px;background:#19B5A5;color:#0B1320;font-weight:700;text-decoration:none;border-radius:10px;font-size:14px;">${escapeHtml(params.ctaLabelAr || 'فتح الرابط')} / ${escapeHtml(params.ctaLabelEn || 'Open Link')}</a>
    </div>`
        : ''
    }
    <div style="padding:20px 24px;border-top:1px solid #1E293B;direction:ltr;text-align:left;">
      <h3 style="margin:0 0 10px;font-size:15px;color:#FFFFFF;">${escapeHtml(params.titleEn)}</h3>
      <div style="font-size:13px;line-height:1.6;color:#94A3B8;">${params.bodyEnHtml}</div>
    </div>
  </div>
</body>
</html>`;
}

export function buildPasswordResetEmail(params: {
  to: string;
  rawToken: string;
  appUrl?: string;
}): EmailMessagePayload {
  const baseUrl = (params.appUrl || resolvePublicAppUrl()).replace(/\/+$/, '');
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(params.rawToken)}`;

  return {
    to: params.to,
    subject: 'FindIt QR — إعادة تعيين كلمة المرور | Password Reset',
    text: `FindIt QR\n\nلإعادة تعيين كلمة المرور (صالح لمدة 30 دقيقة):\n${resetUrl}\n\nTo reset your password (valid for 30 minutes):\n${resetUrl}\n`,
    html: wrapBilingualEmailHtml({
      badgeAr: 'أمان الحساب',
      badgeEn: 'Account Security',
      titleAr: 'طلب إعادة تعيين كلمة المرور',
      titleEn: 'Password Reset Request',
      bodyArHtml:
        '<p>تلقّينا طلبًا لإعادة تعيين كلمة المرور لحسابك في FindIt QR. الرابط أدناه صالح لمدة 30 دقيقة ولمرة واحدة فقط. إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.</p>',
      bodyEnHtml:
        '<p>We received a request to reset your FindIt QR password. The link above is valid for 30 minutes and can only be used once. If you did not request this, you can safely ignore this email.</p>',
      ctaUrl: resetUrl,
      ctaLabelAr: 'تعيين كلمة مرور جديدة',
      ctaLabelEn: 'Reset Password',
    }),
  };
}

export function buildEmailVerificationEmail(params: {
  to: string;
  rawToken: string;
  appUrl?: string;
}): EmailMessagePayload {
  const baseUrl = (params.appUrl || resolvePublicAppUrl()).replace(/\/+$/, '');
  const verifyUrl = `${baseUrl}/app/settings?verifyToken=${encodeURIComponent(params.rawToken)}`;

  return {
    to: params.to,
    subject: 'FindIt QR — تأكيد البريد الإلكتروني | Verify Your Email',
    text: `FindIt QR\n\nرمز تأكيد البريد الإلكتروني (صالح لمدة 30 دقيقة): ${params.rawToken}\nأو افتح الرابط: ${verifyUrl}\n\nEmail verification token (valid for 30 minutes): ${params.rawToken}\nOr open: ${verifyUrl}\n`,
    html: wrapBilingualEmailHtml({
      badgeAr: 'توثيق البريد الإلكتروني',
      badgeEn: 'Email Verification',
      titleAr: 'تأكيد عنوان بريدك الإلكتروني',
      titleEn: 'Verify Your Email Address',
      bodyArHtml: `<p>يرجى تأكيد بريدك الإلكتروني لتفعيل تنبيهات الاستعادة في FindIt QR. رمز التحقق (صالح لـ 30 دقيقة):</p><p style="font-family:monospace;background:#0B1320;padding:10px 14px;border-radius:8px;color:#19B5A5;word-break:break-all;">${escapeHtml(params.rawToken)}</p>`,
      bodyEnHtml: `<p>Please verify your email address to enable recovery alerts in FindIt QR. Verification token (valid for 30 minutes):</p><p style="font-family:monospace;background:#0B1320;padding:10px 14px;border-radius:8px;color:#19B5A5;word-break:break-all;">${escapeHtml(params.rawToken)}</p>`,
      ctaUrl: verifyUrl,
      ctaLabelAr: 'تأكيد البريد الإلكتروني',
      ctaLabelEn: 'Verify Email',
    }),
  };
}

export function buildFoundReportEmail(params: {
  to: string;
  itemName: string;
  codeSerial: string;
  sharedGroupName?: string;
  appUrl?: string;
}): EmailMessagePayload {
  const baseUrl = (params.appUrl || resolvePublicAppUrl()).replace(/\/+$/, '');
  const inboxUrl = `${baseUrl}/app/messages`;
  const groupNoteAr = params.sharedGroupName
    ? ` عبر مجموعة QR المشتركة «${escapeHtml(params.sharedGroupName)}»`
    : '';
  const groupNoteEn = params.sharedGroupName
    ? ` via Shared QR Group "${escapeHtml(params.sharedGroupName)}"`
    : '';

  return {
    to: params.to,
    subject: `FindIt QR — بلاغ عاجل: تم العثور على «${params.itemName}» | Urgent Found Report`,
    text: `بلاغ عاجل: قام شخص بمسح الكود (${params.codeSerial}) والضغط على «عثرت على هذا الغرض» للغرض: ${params.itemName}.\nافتح صندوق الرسائل: ${inboxUrl}\n\nUrgent Found Report: Someone scanned (${params.codeSerial}) and reported finding "${params.itemName}".\nOpen inbox: ${inboxUrl}`,
    html: wrapBilingualEmailHtml({
      badgeAr: 'بلاغ عثور فوري',
      badgeEn: 'Urgent Found Alert',
      titleAr: `بلاغ عاجل: «عثرت على هذا الغرض» — ${params.itemName}`,
      titleEn: `Urgent Found Report: "${params.itemName}"`,
      bodyArHtml: `<p>قام شخص بمسح رمز الاستعادة <strong>${escapeHtml(params.codeSerial)}</strong>${groupNoteAr} والضغط على زر «عثرت على هذا الغرض» للغرض <strong>${escapeHtml(params.itemName)}</strong>.</p>`,
      bodyEnHtml: `<p>Someone scanned recovery tag <strong>${escapeHtml(params.codeSerial)}</strong>${groupNoteEn} and clicked "I Found This Item" for <strong>${escapeHtml(params.itemName)}</strong>.</p>`,
      ctaUrl: inboxUrl,
      ctaLabelAr: 'عرض الإشعارات والرسائل',
      ctaLabelEn: 'Open Messages',
    }),
  };
}

export function buildFinderMessageEmail(params: {
  to: string;
  itemName: string;
  codeSerial: string;
  senderName: string;
  senderContact?: string;
  message: string;
  sharedGroupName?: string;
  appUrl?: string;
}): EmailMessagePayload {
  const baseUrl = (params.appUrl || resolvePublicAppUrl()).replace(/\/+$/, '');
  const inboxUrl = `${baseUrl}/app/messages`;
  const contactLineAr = params.senderContact
    ? `<p><strong>وسيلة تواصل المكتشف:</strong> ${escapeHtml(params.senderContact)}</p>`
    : '';
  const contactLineEn = params.senderContact
    ? `<p><strong>Finder contact:</strong> ${escapeHtml(params.senderContact)}</p>`
    : '';

  return {
    to: params.to,
    subject: `FindIt QR — رسالة جديدة حول «${params.itemName}» | New Finder Message`,
    text: `رسالة جديدة بخصوص ${params.itemName} (${params.codeSerial}) من ${params.senderName}:\n${params.message}\n${params.senderContact ? `التواصل: ${params.senderContact}\n` : ''}افتح صندوق الرسائل: ${inboxUrl}`,
    html: wrapBilingualEmailHtml({
      badgeAr: 'رسالة مكتشف جديدة',
      badgeEn: 'New Finder Message',
      titleAr: `رسالة جديدة حول الغرض: ${params.itemName}`,
      titleEn: `New Message for Item: ${params.itemName}`,
      bodyArHtml: `<p><strong>المرسل:</strong> ${escapeHtml(params.senderName)} · <strong>الكود:</strong> ${escapeHtml(params.codeSerial)}</p><blockquote style="margin:12px 0;padding:12px 14px;background:#0B1320;border-right:3px solid #19B5A5;border-radius:8px;color:#F8FAFC;">${escapeHtml(params.message)}</blockquote>${contactLineAr}`,
      bodyEnHtml: `<p><strong>From:</strong> ${escapeHtml(params.senderName)} · <strong>Tag:</strong> ${escapeHtml(params.codeSerial)}</p><blockquote style="margin:12px 0;padding:12px 14px;background:#0B1320;border-left:3px solid #19B5A5;border-radius:8px;color:#F8FAFC;">${escapeHtml(params.message)}</blockquote>${contactLineEn}`,
      ctaUrl: inboxUrl,
      ctaLabelAr: 'قراءة الرسالة في الحساب',
      ctaLabelEn: 'View in Inbox',
    }),
  };
}

export function buildSupportTicketEmail(params: {
  to: string;
  ticketNumber: string;
  subject: string;
  eventType: 'created' | 'reply';
  messageSnippet: string;
  appUrl?: string;
}): EmailMessagePayload {
  const baseUrl = (params.appUrl || resolvePublicAppUrl()).replace(/\/+$/, '');
  const supportUrl = `${baseUrl}/app/support`;
  const isCreated = params.eventType === 'created';

  return {
    to: params.to,
    subject: isCreated
      ? `FindIt QR — تم استلام تذكرة الدعم ${params.ticketNumber} | Support Ticket Received`
      : `FindIt QR — تحديث على تذكرة الدعم ${params.ticketNumber} | Support Ticket Update`,
    text: `${params.ticketNumber} — ${params.subject}\n\n${params.messageSnippet}\n\n${supportUrl}`,
    html: wrapBilingualEmailHtml({
      badgeAr: `تذكرة دعم ${params.ticketNumber}`,
      badgeEn: `Ticket ${params.ticketNumber}`,
      titleAr: isCreated
        ? `تم إنشاء تذكرة الدعم ${params.ticketNumber}`
        : `تحديث جديد على التذكرة ${params.ticketNumber}`,
      titleEn: isCreated
        ? `Support Ticket ${params.ticketNumber} Created`
        : `Update on Support Ticket ${params.ticketNumber}`,
      bodyArHtml: `<p><strong>الموضوع:</strong> ${escapeHtml(params.subject)}</p><p>${escapeHtml(params.messageSnippet)}</p>`,
      bodyEnHtml: `<p><strong>Subject:</strong> ${escapeHtml(params.subject)}</p><p>${escapeHtml(params.messageSnippet)}</p>`,
      ctaUrl: supportUrl,
      ctaLabelAr: 'متابعة التذكرة',
      ctaLabelEn: 'View Ticket',
    }),
  };
}
