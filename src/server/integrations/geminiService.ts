import { GoogleGenAI } from '@google/genai';

export const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-lite-image';

export interface GeminiCoverGenerationResult {
  ok: boolean;
  base64Data?: string;
  mimeType?: string;
  errorCode?:
    | 'GEMINI_KEY_NOT_CONFIGURED'
    | 'API_KEY_INVALID'
    | 'PAID_KEY_OR_PERMISSION_REQUIRED'
    | 'MODEL_NOT_FOUND'
    | 'RATE_LIMIT_OR_QUOTA'
    | 'EMPTY_AI_IMAGE_RESPONSE'
    | 'UPSTREAM_ERROR';
  errorDetail?: string;
  model: string;
}

export interface GeminiStatusSummary {
  configured: boolean;
  model: string;
  requiresPaidKey: boolean;
  mode: 'live_ready' | 'fallback_only';
  sdkVersionPolicy: string;
}

export function getConfiguredGeminiApiKey(env: NodeJS.ProcessEnv = process.env): string {
  const raw = (env.GEMINI_API_KEY || '').trim();
  if (!raw || raw === 'MY_GEMINI_API_KEY' || raw.length < 12) {
    return '';
  }
  return raw;
}

export function getGeminiIntegrationStatus(
  env: NodeJS.ProcessEnv = process.env
): GeminiStatusSummary {
  const configured = Boolean(getConfiguredGeminiApiKey(env));
  return {
    configured,
    model: GEMINI_IMAGE_MODEL,
    requiresPaidKey: true,
    mode: configured ? 'live_ready' : 'fallback_only',
    sdkVersionPolicy: '@google/genai >= 2.29.1',
  };
}

export function classifyGeminiError(err: unknown): {
  errorCode: NonNullable<GeminiCoverGenerationResult['errorCode']>;
  retryable: boolean;
  detail: string;
} {
  const rawMsg = err instanceof Error ? err.message : String(err || 'UPSTREAM_ERROR');
  const lower = rawMsg.toLowerCase();
  const safeDetail = rawMsg.replace(/AIza[0-9A-Za-z_-]{10,}/g, '[REDACTED]').slice(0, 140);

  if (lower.includes('api_key_invalid') || lower.includes('api key not valid') || lower.includes('400')) {
    return { errorCode: 'API_KEY_INVALID', retryable: false, detail: safeDetail };
  }
  if (
    lower.includes('permission_denied') ||
    lower.includes('403') ||
    lower.includes('billing') ||
    lower.includes('paid')
  ) {
    return { errorCode: 'PAID_KEY_OR_PERMISSION_REQUIRED', retryable: false, detail: safeDetail };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return { errorCode: 'MODEL_NOT_FOUND', retryable: false, detail: safeDetail };
  }
  if (
    lower.includes('resource_exhausted') ||
    lower.includes('429') ||
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('rate limit')
  ) {
    return { errorCode: 'RATE_LIMIT_OR_QUOTA', retryable: true, detail: safeDetail };
  }
  return { errorCode: 'UPSTREAM_ERROR', retryable: false, detail: safeDetail };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateGeminiSmartCover(
  prompt: string,
  options?: {
    env?: NodeJS.ProcessEnv;
    maxRetries?: number;
    retryBaseDelayMs?: number;
  }
): Promise<GeminiCoverGenerationResult> {
  const apiKey = getConfiguredGeminiApiKey(options?.env ?? process.env);
  if (!apiKey) {
    return {
      ok: false,
      errorCode: 'GEMINI_KEY_NOT_CONFIGURED',
      errorDetail: 'GEMINI_API_KEY is not configured in server environment.',
      model: GEMINI_IMAGE_MODEL,
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const maxRetries = Math.max(0, Math.min(options?.maxRetries ?? 2, 3));
  const baseDelayMs = options?.retryBaseDelayMs ?? 350;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '4:3',
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          return {
            ok: true,
            base64Data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
            model: GEMINI_IMAGE_MODEL,
          };
        }
      }

      return {
        ok: false,
        errorCode: 'EMPTY_AI_IMAGE_RESPONSE',
        errorDetail: 'Model completed without returning inline image bytes.',
        model: GEMINI_IMAGE_MODEL,
      };
    } catch (err) {
      const classified = classifyGeminiError(err);
      if (classified.retryable && attempt < maxRetries) {
        const delayMs = baseDelayMs * Math.pow(2, attempt);
        await sleep(delayMs);
        continue;
      }
      return {
        ok: false,
        errorCode: classified.errorCode,
        errorDetail: classified.detail,
        model: GEMINI_IMAGE_MODEL,
      };
    }
  }

  return {
    ok: false,
    errorCode: 'UPSTREAM_ERROR',
    errorDetail: 'Exhausted retries.',
    model: GEMINI_IMAGE_MODEL,
  };
}
