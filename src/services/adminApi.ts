import {
  ActivityLogEntry,
  AdminAuditLogEntry,
  AdminDashboardAnalytics,
  AdminItemSummary,
  AdminPermissionKey,
  AdminSessionSummary,
  AdminUserSummary,
  AnnouncementBanner,
  CouponCode,
  IssuedLicense,
  LicenseType,
  ManagedPlanDefinition,
  ManagedPurchaseOrder,
  MarketingCampaign,
  PlatformSettings,
  RegisteredItem,
  SecurityLoginLog,
  SubscriptionRecord,
  SupportTicket,
  TagDesignTemplate,
  UnauthorizedAccessEvent,
  UserPlanTier,
  UserProfile,
  UserRole,
} from '../types/domain';
import { authHeaders } from './firebase/services';

export class ApiRequestError extends Error {
  status: number;
  errorCode: string;
  messageAr: string;
  messageEn: string;

  constructor(params: {
    status: number;
    errorCode?: string;
    messageAr?: string;
    messageEn?: string;
  }) {
    super(params.messageEn || params.errorCode || `HTTP ${params.status}`);
    this.status = params.status;
    this.errorCode = params.errorCode || `HTTP_${params.status}`;
    this.messageAr = params.messageAr || 'تعذر تنفيذ الطلب.';
    this.messageEn = params.messageEn || 'Request failed.';
  }

  get isReauthRequired(): boolean {
    return this.status === 428 || this.errorCode === 'REAUTH_REQUIRED';
  }
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
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

export interface PublicCatalogResponse {
  ok: true;
  templates: TagDesignTemplate[];
  plans: ManagedPlanDefinition[];
  announcements: AnnouncementBanner[];
  platformSettings: PlatformSettings;
}

export interface WorkspaceCommerceResponse {
  ok: true;
  orders: ManagedPurchaseOrder[];
  licenses: IssuedLicense[];
  subscriptions: SubscriptionRecord[];
  favoriteTemplateIds: string[];
  tickets: SupportTicket[];
  licenseTypes: LicenseType[];
}

export interface AdminBootstrapStatusResponse {
  ok: true;
  adminEmailConfigured: boolean;
  superAdminBound: boolean;
  authenticated: boolean;
  currentUserMatchesAdminEmail: boolean;
  currentUserEmailVerified: boolean;
  hasPassword?: boolean;
  hasGoogle?: boolean;
  role: UserRole | null;
  permissions: AdminPermissionKey[];
  reauthActive: boolean;
}

export const adminApi = {
  // Public Catalog & Support
  getPublicCatalog(): Promise<PublicCatalogResponse> {
    return apiJson<PublicCatalogResponse>('/api/public/catalog', { method: 'GET' });
  },

  submitPublicSupportTicket(payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
    category?: SupportTicket['category'];
    relatedItemSerial?: string;
    userId?: string;
  }): Promise<{ ok: true; ticket: SupportTicket; messageAr: string; messageEn: string }> {
    return apiJson('/api/public/support', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  validateCoupon(payload: {
    code: string;
    subtotalSar: number;
    subtotalUsd: number;
    scope: 'templates' | 'plans';
  }): Promise<{
    ok: true;
    couponApplied: string;
    discountSar: number;
    discountUsd: number;
    amountSar: number;
    amountUsd: number;
  }> {
    return apiJson('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Customer Workspace Commerce
  getWorkspaceCommerce(): Promise<WorkspaceCommerceResponse> {
    return apiJson<WorkspaceCommerceResponse>('/api/workspace/commerce', { method: 'GET' });
  },

  toggleFavoriteTemplate(templateId: string): Promise<{ ok: true; favoriteTemplateIds: string[] }> {
    return apiJson(`/api/templates/${encodeURIComponent(templateId)}/favorite`, {
      method: 'POST',
    });
  },

  createOrder(payload: {
    orderType: 'template_purchase' | 'subscription_upgrade';
    targetId: string;
    quantity?: number;
    durationMonths?: 1 | 3 | 12;
    currency?: 'SAR' | 'USD';
    couponCode?: string;
    transferReference?: string;
    paymentProofUrl?: string;
    paymentNotes?: string;
  }): Promise<{
    ok: true;
    order: ManagedPurchaseOrder;
    messageAr: string;
    messageEn: string;
  }> {
    return apiJson('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  submitOrderProof(
    orderId: string,
    payload: {
      transferReference?: string;
      paymentProofUrl?: string;
      paymentNotes?: string;
    }
  ): Promise<{ ok: true; order: ManagedPurchaseOrder }> {
    return apiJson(`/api/orders/${encodeURIComponent(orderId)}/proof`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Admin Auth Bootstrap & Re-auth
  getBootstrapStatus(): Promise<AdminBootstrapStatusResponse> {
    return apiJson<AdminBootstrapStatusResponse>('/api/admin/bootstrap-status', { method: 'GET' });
  },

  bootstrapSuperAdmin(password: string): Promise<{
    ok: true;
    profile: UserProfile;
    reauthWindowMinutes: number;
    messageAr: string;
    messageEn: string;
  }> {
    return apiJson('/api/admin/bootstrap', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  reauthAdmin(
    credential: string | { password?: string; googleIdToken?: string }
  ): Promise<{
    ok: true;
    adminVerifiedUntil: string;
    reauthWindowMinutes: number;
  }> {
    const body = typeof credential === 'string' ? { password: credential } : credential;
    return apiJson('/api/admin/reauth', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // 1. Dashboard
  getDashboard(period: '7d' | '30d' | '90d' | 'all' = 'all'): Promise<{
    ok: true;
    analytics: AdminDashboardAnalytics;
  }> {
    return apiJson(`/api/admin/dashboard?period=${encodeURIComponent(period)}`, { method: 'GET' });
  },

  // 2. Users
  getUsers(): Promise<{ ok: true; users: AdminUserSummary[] }> {
    return apiJson('/api/admin/users', { method: 'GET' });
  },

  getUserDetails(uid: string): Promise<{
    ok: true;
    user: UserProfile;
    items: RegisteredItem[];
    orders: ManagedPurchaseOrder[];
    subscriptions: SubscriptionRecord[];
    licenses: IssuedLicense[];
    activities: ActivityLogEntry[];
  }> {
    return apiJson(`/api/admin/users/${encodeURIComponent(uid)}`, { method: 'GET' });
  },

  updateUser(
    uid: string,
    payload: {
      accountStatus?: 'active' | 'suspended';
      plan?: UserPlanTier;
      adminNotes?: string;
    }
  ): Promise<{ ok: true; profile: UserProfile }> {
    return apiJson(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // 3. Items & QR Moderation
  getItems(): Promise<{ ok: true; items: AdminItemSummary[] }> {
    return apiJson('/api/admin/items', { method: 'GET' });
  },

  moderateItem(
    itemId: string,
    payload: {
      status?: RegisteredItem['status'];
      moderationFlag?: 'clean' | 'flagged' | 'restricted';
      moderationNote?: string;
    }
  ): Promise<{ ok: true; item: RegisteredItem }> {
    return apiJson(`/api/admin/items/${encodeURIComponent(itemId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  transferItemOwner(
    itemId: string,
    payload: { targetEmail: string; reason: string }
  ): Promise<{ ok: true; item: RegisteredItem }> {
    return apiJson(`/api/admin/items/${encodeURIComponent(itemId)}/transfer-owner`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 4. Templates & Designs Library
  getTemplates(): Promise<{ ok: true; templates: TagDesignTemplate[] }> {
    return apiJson('/api/admin/templates', { method: 'GET' });
  },

  createTemplate(payload: Partial<TagDesignTemplate>): Promise<{ ok: true; template: TagDesignTemplate }> {
    return apiJson('/api/admin/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTemplate(
    id: string,
    payload: Partial<TagDesignTemplate>
  ): Promise<{ ok: true; template: TagDesignTemplate }> {
    return apiJson(`/api/admin/templates/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteTemplate(id: string): Promise<{ ok: true }> {
    return apiJson(`/api/admin/templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  uploadTemplatesZip(payload: { fileName: string; base64Zip: string }): Promise<{
    ok: true;
    fileCount: number;
    importedCount: number;
    importedTemplates: TagDesignTemplate[];
    warnings: string[];
  }> {
    return apiJson('/api/admin/templates/upload-zip', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 5. Licenses
  getLicenses(): Promise<{
    ok: true;
    licenseTypes: LicenseType[];
    issuedLicenses: IssuedLicense[];
  }> {
    return apiJson('/api/admin/licenses', { method: 'GET' });
  },

  createLicenseType(payload: Partial<LicenseType>): Promise<{ ok: true; licenseType: LicenseType }> {
    return apiJson('/api/admin/licenses/types', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateLicenseType(
    id: string,
    payload: Partial<LicenseType>
  ): Promise<{ ok: true; licenseType: LicenseType }> {
    return apiJson(`/api/admin/licenses/types/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // 6. Plans & Subscriptions
  getPlans(): Promise<{
    ok: true;
    plans: ManagedPlanDefinition[];
    subscriptions: SubscriptionRecord[];
  }> {
    return apiJson('/api/admin/plans', { method: 'GET' });
  },

  createPlan(payload: Partial<ManagedPlanDefinition>): Promise<{ ok: true; plan: ManagedPlanDefinition }> {
    return apiJson('/api/admin/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updatePlan(
    id: string,
    payload: Partial<ManagedPlanDefinition>
  ): Promise<{ ok: true; plan: ManagedPlanDefinition }> {
    return apiJson(`/api/admin/plans/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // 7. Orders & Manual Finance
  getOrders(): Promise<{ ok: true; orders: ManagedPurchaseOrder[] }> {
    return apiJson('/api/admin/orders', { method: 'GET' });
  },

  reviewOrder(
    id: string,
    payload: { decision: 'approve' | 'reject' | 'refund'; reason: string }
  ): Promise<{ ok: true; order: ManagedPurchaseOrder }> {
    return apiJson(`/api/admin/orders/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 8. Marketing & Announcements
  getMarketing(): Promise<{
    ok: true;
    announcements: AnnouncementBanner[];
    coupons: CouponCode[];
    campaigns: MarketingCampaign[];
  }> {
    return apiJson('/api/admin/marketing', { method: 'GET' });
  },

  createAnnouncement(payload: Partial<AnnouncementBanner>): Promise<{
    ok: true;
    announcement: AnnouncementBanner;
  }> {
    return apiJson('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateAnnouncement(
    id: string,
    payload: Partial<AnnouncementBanner>
  ): Promise<{ ok: true; announcement: AnnouncementBanner }> {
    return apiJson(`/api/admin/announcements/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteAnnouncement(id: string): Promise<{ ok: true }> {
    return apiJson(`/api/admin/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  createCoupon(payload: Partial<CouponCode>): Promise<{ ok: true; coupon: CouponCode }> {
    return apiJson('/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateCoupon(id: string, payload: Partial<CouponCode>): Promise<{ ok: true; coupon: CouponCode }> {
    return apiJson(`/api/admin/coupons/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  sendCampaign(payload: {
    titleAr: string;
    titleEn: string;
    messageAr: string;
    messageEn: string;
    targetAudience: MarketingCampaign['targetAudience'];
    targetUid?: string;
  }): Promise<{ ok: true; campaign: MarketingCampaign }> {
    return apiJson('/api/admin/campaigns/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 9. Support Desk
  getSupportTickets(): Promise<{ ok: true; tickets: SupportTicket[] }> {
    return apiJson('/api/admin/support', { method: 'GET' });
  },

  updateSupportTicket(
    id: string,
    payload: Partial<SupportTicket> & { replyMessage?: string; isInternalNote?: boolean }
  ): Promise<{ ok: true; ticket: SupportTicket }> {
    return apiJson(`/api/admin/support/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // 10. Reports
  getReports(period: '7d' | '30d' | '90d' | 'all' = 'all'): Promise<{
    ok: true;
    analytics: AdminDashboardAnalytics;
  }> {
    return apiJson(`/api/admin/reports?period=${encodeURIComponent(period)}`, { method: 'GET' });
  },

  async downloadReportCsv(scope: 'orders' | 'users'): Promise<string> {
    const res = await fetch(`/api/admin/reports/export.csv?scope=${encodeURIComponent(scope)}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    if (!res.ok) {
      throw new ApiRequestError({ status: res.status, errorCode: 'CSV_EXPORT_FAILED' });
    }
    return res.text();
  },

  // 11. Platform Settings
  getSettings(): Promise<{ ok: true; settings: PlatformSettings }> {
    return apiJson('/api/admin/settings', { method: 'GET' });
  },

  updateSettings(payload: Partial<PlatformSettings>): Promise<{ ok: true; settings: PlatformSettings }> {
    return apiJson('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // 12. Security, Staff RBAC & Sessions
  getSecurity(): Promise<{
    ok: true;
    staffAndAdmins: Array<{
      uid: string;
      email: string;
      displayName: string;
      role: UserRole;
      adminPermissions: AdminPermissionKey[];
      accountStatus: 'active' | 'suspended';
    }>;
    sessions: AdminSessionSummary[];
    loginLogs: SecurityLoginLog[];
    securityEvents: UnauthorizedAccessEvent[];
    auditLogs: AdminAuditLogEntry[];
  }> {
    return apiJson('/api/admin/security', { method: 'GET' });
  },

  updateStaffRbac(payload: {
    email: string;
    role: 'staff_admin' | 'user';
    permissions: AdminPermissionKey[];
  }): Promise<{ ok: true }> {
    return apiJson('/api/admin/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  revokeSession(tokenHash: string): Promise<{ ok: true }> {
    return apiJson(`/api/admin/sessions/${encodeURIComponent(tokenHash)}`, {
      method: 'DELETE',
    });
  },
};
