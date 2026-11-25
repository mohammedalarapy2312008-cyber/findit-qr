import {
  ActivityLogEntry,
  AdminAuditLogEntry,
  AnnouncementBanner,
  CouponCode,
  FinderMessageEntry,
  IssuedLicense,
  ItemGroup,
  LicenseType,
  ManagedPlanDefinition,
  ManagedPurchaseOrder,
  MarketingCampaign,
  NotificationEntry,
  PlatformSettings,
  RegisteredItem,
  SecurityLoginLog,
  SharedQrGroup,
  StoredMediaAssetRecord,
  SubscriptionRecord,
  SupportTicket,
  TagDesignTemplate,
  UnauthorizedAccessEvent,
  UserProfile,
  WorkspaceSettings,
} from '../types/domain';

export interface StoredUserRecord {
  uid: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  googleUid?: string;
  authProviders?: Array<'password' | 'google'>;
  profile: UserProfile;
  settings?: WorkspaceSettings;
}

export interface StoredSessionRecord {
  uid: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string;
  adminVerifiedUntil?: string | null;
}

export interface StoredPasswordResetToken {
  tokenHash: string;
  uid: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface StoredPendingAccountLink {
  tokenHash: string;
  targetUid: string;
  email: string;
  googleUid: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  expiresAt: string;
}

export interface StoredEmailVerificationToken {
  tokenHash: string;
  uid: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface DatabaseSchema {
  users: Record<string, StoredUserRecord>;
  sessions: Record<string, StoredSessionRecord>; // tokenHash -> StoredSessionRecord
  passwordResetTokens?: Record<string, StoredPasswordResetToken>; // tokenHash -> record
  pendingAccountLinks?: Record<string, StoredPendingAccountLink>; // tokenHash -> record
  emailVerificationTokens?: Record<string, StoredEmailVerificationToken>; // tokenHash -> record
  items: Record<string, RegisteredItem & { moderationFlag?: 'clean' | 'flagged' | 'restricted'; moderationNote?: string }>;
  groups?: Record<string, ItemGroup>;
  sharedQrGroups?: Record<string, SharedQrGroup>;
  messages: Record<string, FinderMessageEntry>;
  notifications: Record<string, NotificationEntry>;
  activities: Record<string, ActivityLogEntry>;
  // Dynamic Admin & Commerce Collections
  templates: Record<string, TagDesignTemplate>;
  licenseTypes: Record<string, LicenseType>;
  issuedLicenses: Record<string, IssuedLicense>;
  plans: Record<string, ManagedPlanDefinition>;
  subscriptions: Record<string, SubscriptionRecord>;
  orders: Record<string, ManagedPurchaseOrder>;
  favorites: Record<string, string[]>; // uid -> templateIds[]
  announcements: Record<string, AnnouncementBanner>;
  coupons: Record<string, CouponCode>;
  campaigns: Record<string, MarketingCampaign>;
  supportTickets: Record<string, SupportTicket>;
  mediaAssets?: Record<string, StoredMediaAssetRecord>;
  platformSettings: PlatformSettings;
  auditLogs: Record<string, AdminAuditLogEntry>;
  loginLogs: SecurityLoginLog[];
  securityEvents: UnauthorizedAccessEvent[];
}
