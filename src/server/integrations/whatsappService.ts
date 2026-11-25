export type WhatsAppProviderName = 'meta_cloud' | 'twilio' | 'unconfigured';

export interface WhatsAppAlertPayload {
  toPhone: string;
  bodyText: string;
  templateParams?: string[];
}

export interface WhatsAppSendResult {
  sent: boolean;
  provider: WhatsAppProviderName;
  messageId?: string;
  errorCode?: string;
  errorDetail?: string;
}

export interface WhatsAppStatusSummary {
  configured: boolean;
  provider: WhatsAppProviderName;
  supportedProviders: ('meta_cloud' | 'twilio')[];
  templateConfigured: boolean;
}

export interface WhatsAppServiceOverrides {
  env?: NodeJS.ProcessEnv;
  metaBaseUrl?: string;
  twilioBaseUrl?: string;
  customSender?: (payload: WhatsAppAlertPayload) => Promise<WhatsAppSendResult>;
}

const DEFAULT_META_GRAPH_BASE = 'https://graph.facebook.com';
const DEFAULT_TWILIO_API_BASE = 'https://api.twilio.com';

function getTrimmed(env: NodeJS.ProcessEnv, key: string): string {
  return (env[key] || '').trim();
}

/**
 * Normalizes a phone string into E.164 digits (with leading '+') or returns '' if invalid.
 */
export function normalizeWhatsAppPhone(raw: string): string {
  if (typeof raw !== 'string') return '';
  let cleaned = raw.trim().replace(/^whatsapp:/i, '').replace(/[\s\-().]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = `+${cleaned.slice(2)}`;
  }
  if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`;
  }
  const digits = cleaned.slice(1).replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    return '';
  }
  return `+${digits}`;
}

export function detectWhatsAppProvider(
  env: NodeJS.ProcessEnv = process.env
): WhatsAppProviderName {
  if (getTrimmed(env, 'WHATSAPP_ACCESS_TOKEN') && getTrimmed(env, 'WHATSAPP_PHONE_NUMBER_ID')) {
    return 'meta_cloud';
  }
  if (
    getTrimmed(env, 'TWILIO_ACCOUNT_SID') &&
    getTrimmed(env, 'TWILIO_AUTH_TOKEN') &&
    getTrimmed(env, 'TWILIO_WHATSAPP_FROM')
  ) {
    return 'twilio';
  }
  return 'unconfigured';
}

export function getWhatsAppIntegrationStatus(
  env: NodeJS.ProcessEnv = process.env
): WhatsAppStatusSummary {
  const provider = detectWhatsAppProvider(env);
  return {
    configured: provider !== 'unconfigured',
    provider,
    supportedProviders: ['meta_cloud', 'twilio'],
    templateConfigured: Boolean(getTrimmed(env, 'WHATSAPP_TEMPLATE_NAME')),
  };
}

export async function sendWhatsAppAlert(
  payload: WhatsAppAlertPayload,
  overrides?: WhatsAppServiceOverrides
): Promise<WhatsAppSendResult> {
  if (overrides?.customSender) {
    return overrides.customSender(payload);
  }

  const env = overrides?.env ?? process.env;
  const provider = detectWhatsAppProvider(env);
  if (provider === 'unconfigured') {
    return {
      sent: false,
      provider: 'unconfigured',
      errorCode: 'WHATSAPP_NOT_CONFIGURED',
      errorDetail:
        'Configure WHATSAPP_ACCESS_TOKEN & WHATSAPP_PHONE_NUMBER_ID (Meta Cloud API) or TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM.',
    };
  }

  const normalizedTo = normalizeWhatsAppPhone(payload.toPhone);
  if (!normalizedTo) {
    return {
      sent: false,
      provider,
      errorCode: 'INVALID_WHATSAPP_PHONE',
    };
  }

  try {
    if (provider === 'meta_cloud') {
      const accessToken = getTrimmed(env, 'WHATSAPP_ACCESS_TOKEN');
      const phoneNumberId = getTrimmed(env, 'WHATSAPP_PHONE_NUMBER_ID');
      const apiVersion = getTrimmed(env, 'WHATSAPP_API_VERSION') || 'v21.0';
      const templateName = getTrimmed(env, 'WHATSAPP_TEMPLATE_NAME');
      const templateLang = getTrimmed(env, 'WHATSAPP_TEMPLATE_LANG') || 'ar';
      const baseUrl = (overrides?.metaBaseUrl || DEFAULT_META_GRAPH_BASE).replace(/\/+$/, '');
      const endpoint = `${baseUrl}/${encodeURIComponent(apiVersion)}/${encodeURIComponent(phoneNumberId)}/messages`;

      const toDigits = normalizedTo.replace(/^\+/, '');
      const requestBody =
        templateName && Array.isArray(payload.templateParams) && payload.templateParams.length > 0
          ? {
              messaging_product: 'whatsapp',
              to: toDigits,
              type: 'template',
              template: {
                name: templateName,
                language: { code: templateLang },
                components: [
                  {
                    type: 'body',
                    parameters: payload.templateParams.slice(0, 4).map((val) => ({
                      type: 'text',
                      text: val.slice(0, 180),
                    })),
                  },
                ],
              },
            }
          : {
              messaging_product: 'whatsapp',
              to: toDigits,
              type: 'text',
              text: {
                preview_url: false,
                body: payload.bodyText.slice(0, 1000),
              },
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const json = (await res.json().catch(() => ({}))) as {
        messages?: Array<{ id?: string }>;
        error?: { message?: string };
      };
      if (!res.ok) {
        return {
          sent: false,
          provider: 'meta_cloud',
          errorCode: `META_WHATSAPP_HTTP_${res.status}`,
          errorDetail: json.error?.message?.slice(0, 140),
        };
      }
      return {
        sent: true,
        provider: 'meta_cloud',
        messageId: json.messages?.[0]?.id,
      };
    }

    // Twilio WhatsApp REST API
    const accountSid = getTrimmed(env, 'TWILIO_ACCOUNT_SID');
    const authToken = getTrimmed(env, 'TWILIO_AUTH_TOKEN');
    const rawFrom = getTrimmed(env, 'TWILIO_WHATSAPP_FROM');
    const normalizedFrom = normalizeWhatsAppPhone(rawFrom);
    if (!normalizedFrom) {
      return {
        sent: false,
        provider: 'twilio',
        errorCode: 'INVALID_TWILIO_FROM',
      };
    }

    const baseUrl = (overrides?.twilioBaseUrl || DEFAULT_TWILIO_API_BASE).replace(/\/+$/, '');
    const endpoint = `${baseUrl}/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
    const form = new URLSearchParams({
      From: `whatsapp:${normalizedFrom}`,
      To: `whatsapp:${normalizedTo}`,
      Body: payload.bodyText.slice(0, 1000),
    });

    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
    if (!res.ok) {
      return {
        sent: false,
        provider: 'twilio',
        errorCode: `TWILIO_WHATSAPP_HTTP_${res.status}`,
        errorDetail: typeof json.message === 'string' ? json.message.slice(0, 140) : undefined,
      };
    }

    return {
      sent: true,
      provider: 'twilio',
      messageId: json.sid,
    };
  } catch (err) {
    return {
      sent: false,
      provider,
      errorCode: 'WHATSAPP_TRANSPORT_ERROR',
      errorDetail: err instanceof Error ? err.message.slice(0, 140) : 'Transport failed',
    };
  }
}
