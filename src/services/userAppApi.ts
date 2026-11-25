import { CoverLibraryEntry } from '../data/coverLibraryCatalog';
import {
  AccountContactMethod,
  ContactMethodType,
  CoverSourceType,
  ItemCategory,
  StoredMediaAssetRecord,
  SupportTicket,
  SupportTicketAttachment,
  UserProfile,
} from '../types/domain';
import { AnalyticsTimeframe, WorkspaceAnalyticsSummary } from '../utils/workspaceAnalytics';
import { ApiRequestError } from './adminApi';
import { authHeaders } from './firebase/services';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  });
  let payload: Record<string, unknown> = {};
  try {
    payload = (await res.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }
  if (!res.ok || payload.ok === false) {
    throw new ApiRequestError({
      status: res.status,
      errorCode: typeof payload.errorCode === 'string' ? payload.errorCode : undefined,
      messageAr: typeof payload.messageAr === 'string' ? payload.messageAr : undefined,
      messageEn: typeof payload.messageEn === 'string' ? payload.messageEn : undefined,
    });
  }
  return payload as T;
}

export const userAppApi = {
  uploadMedia(payload: {
    folder: 'originals' | 'covers' | 'avatars' | 'tickets';
    dataUrl: string;
    fileName?: string;
  }): Promise<{
    ok: true;
    url: string;
    folder: string;
    visibility?: 'private' | 'public';
    mimeType: string;
    sizeBytes: number;
    storageDriver?: 'local_persistent' | 's3_compatible';
    cloudMirrored?: boolean;
    name: string;
  }> {
    return requestJson('/api/media/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMyMediaAssets(): Promise<{
    ok: true;
    assets: StoredMediaAssetRecord[];
    storage: {
      activeDriver: string;
      cloudUploadEnabled: boolean;
      privateMediaAccessControl: boolean;
    };
  }> {
    return requestJson('/api/media/my-assets', { method: 'GET' });
  },

  getCoverLibrary(params?: {
    scope?: 'all' | 'item' | 'group' | 'fallback';
    query?: string;
    category?: string;
  }): Promise<{
    ok: true;
    counts: { total: number; items: number; groups: number; fallbacks: number };
    covers: CoverLibraryEntry[];
  }> {
    const qs = new URLSearchParams();
    if (params?.scope) qs.set('scope', params.scope);
    if (params?.query) qs.set('q', params.query);
    if (params?.category) qs.set('category', params.category);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return requestJson(`/api/covers/library${suffix}`, { method: 'GET' });
  },

  matchSmartCover(payload: {
    entityType: 'item' | 'org_group' | 'shared_group';
    name: string;
    category?: ItemCategory;
    description?: string;
    childItemNames?: string[];
    childItemCategories?: ItemCategory[];
  }): Promise<{
    ok: true;
    coverUrl: string;
    coverSource: 'library_matched' | 'fallback';
    matchedCover: CoverLibraryEntry;
    alternatives: CoverLibraryEntry[];
    score: number;
    matchedKeywords: string[];
  }> {
    return requestJson('/api/covers/match', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  generateAiCover(payload: {
    entityType: 'item' | 'org_group' | 'shared_group';
    name: string;
    category?: ItemCategory;
    description?: string;
  }): Promise<{
    ok: true;
    mode: 'library_matched' | 'ai_generated' | 'fallback';
    coverSource: CoverSourceType;
    coverUrl: string;
    matchedCover?: CoverLibraryEntry;
    alternatives?: CoverLibraryEntry[];
    messageAr: string;
    messageEn: string;
  }> {
    return requestJson('/api/ai-covers/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getContactMethods(): Promise<{
    ok: true;
    contactMethods: AccountContactMethod[];
    contactMethodsLimit: number;
  }> {
    return requestJson('/api/contact-methods', { method: 'GET' });
  },

  createContactMethod(payload: {
    type: ContactMethodType;
    label: string;
    value: string;
    isActive?: boolean;
    isPrimary?: boolean;
  }): Promise<{
    ok: true;
    method: AccountContactMethod;
    contactMethods: AccountContactMethod[];
    profile: UserProfile;
  }> {
    return requestJson('/api/contact-methods', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateContactMethod(
    methodId: string,
    payload: Partial<{
      type: ContactMethodType;
      label: string;
      value: string;
      isActive: boolean;
      isPrimary: boolean;
    }>
  ): Promise<{
    ok: true;
    method: AccountContactMethod;
    contactMethods: AccountContactMethod[];
    profile: UserProfile;
  }> {
    return requestJson(`/api/contact-methods/${encodeURIComponent(methodId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteContactMethod(methodId: string): Promise<{
    ok: true;
    contactMethods: AccountContactMethod[];
    profile: UserProfile;
  }> {
    return requestJson(`/api/contact-methods/${encodeURIComponent(methodId)}`, {
      method: 'DELETE',
    });
  },

  getWorkspaceTickets(): Promise<{ ok: true; tickets: SupportTicket[] }> {
    return requestJson('/api/workspace/tickets', { method: 'GET' });
  },

  createWorkspaceTicket(payload: {
    subject: string;
    description: string;
    category?: SupportTicket['category'];
    priority?: SupportTicket['priority'];
    relatedItemSerial?: string;
    attachments?: SupportTicketAttachment[];
  }): Promise<{ ok: true; ticket: SupportTicket; messageAr: string; messageEn: string }> {
    return requestJson('/api/workspace/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  replyToWorkspaceTicket(
    ticketId: string,
    payload: { message: string; attachments?: SupportTicketAttachment[] }
  ): Promise<{ ok: true; ticket: SupportTicket }> {
    return requestJson(`/api/workspace/tickets/${encodeURIComponent(ticketId)}/reply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getWorkspaceAnalytics(
    period: AnalyticsTimeframe = '30d'
  ): Promise<{ ok: true; analytics: WorkspaceAnalyticsSummary }> {
    return requestJson(`/api/workspace/analytics?period=${encodeURIComponent(period)}`, {
      method: 'GET',
    });
  },
};
