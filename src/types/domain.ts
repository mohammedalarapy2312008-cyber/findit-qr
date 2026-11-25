export type Language = 'ar' | 'en';
export type ThemeMode = 'light' | 'dark';

export type PublicPageId =
  | 'home'
  | 'how-it-works'
  | 'features'
  | 'use-cases'
  | 'pricing'
  | 'privacy'
  | 'design-store'
  | 'design-details'
  | 'about'
  | 'faq'
  | 'contact'
  | 'login'
  | 'register'
  | 'reset-password'
  | 'found-item'
  | 'shared-qr';

export type WorkspacePageId =
  | 'dashboard'
  | 'my-items'
  | 'add-item'
  | 'item-details'
  | 'groups'
  | 'group-details'
  | 'qr-manager'
  | 'qr-preview'
  | 'shared-qr-groups'
  | 'design-library'
  | 'template-details'
  | 'print-studio'
  | 'analytics'
  | 'my-purchases'
  | 'contact-methods'
  | 'notifications'
  | 'activity'
  | 'profile'
  | 'settings'
  | 'privacy-security'
  | 'plans'
  | 'support'
  | 'support-faq'
  | 'support-tickets';

export type AdminPageId = 'admin';

export type RouteId = PublicPageId | WorkspacePageId | AdminPageId;

export type UserRole = 'user' | 'staff_admin' | 'super_admin';

export type AdminPermissionKey =
  | 'dashboard'
  | 'users'
  | 'items'
  | 'templates'
  | 'licenses'
  | 'plans'
  | 'finance'
  | 'marketing'
  | 'support'
  | 'reports'
  | 'settings'
  | 'security';

export const ALL_ADMIN_PERMISSIONS: AdminPermissionKey[] = [
  'dashboard',
  'users',
  'items',
  'templates',
  'licenses',
  'plans',
  'finance',
  'marketing',
  'support',
  'reports',
  'settings',
  'security',
];

export type AsyncViewState = 'ready' | 'loading' | 'empty' | 'error';

export type ItemCategory =
  | 'electronics'
  | 'bags'
  | 'keys'
  | 'documents'
  | 'pets'
  | 'vehicles'
  | 'commercial';

export type ItemStatus = 'Active' | 'Lost' | 'Found' | 'Recovered' | 'Archived';

export type ItemSortBy = 'newest' | 'oldest' | 'name' | 'updated';

export type UserPlanTier = 'Free' | 'Starter' | 'Plus' | 'Premium' | 'Pro' | 'Business';
export type AccountStatus = 'active' | 'suspended';

export interface PlanQuotaSpec {
  tier: UserPlanTier;
  maxActiveItems: number;
  maxContactMethods: number;
  labelAr: string;
  labelEn: string;
}

export const PLAN_QUOTA_SPECS: Record<UserPlanTier, PlanQuotaSpec> = {
  Free: {
    tier: 'Free',
    maxActiveItems: 2,
    maxContactMethods: 2,
    labelAr: 'الباقة المجانية (غرضان نشطان · وسيلتا تواصل)',
    labelEn: 'Free Plan (2 Active Items · 2 Contact Methods)',
  },
  Starter: {
    tier: 'Starter',
    maxActiveItems: 2,
    maxContactMethods: 2,
    labelAr: 'باقة Starter (غرضان نشطان · وسيلتا تواصل)',
    labelEn: 'Starter Plan (2 Active Items · 2 Contact Methods)',
  },
  Plus: {
    tier: 'Plus',
    maxActiveItems: 10,
    maxContactMethods: 3,
    labelAr: 'باقة Plus (١٠ أغراض نشطة · ٣ وسائل تواصل)',
    labelEn: 'Plus Plan (10 Active Items · 3 Contact Methods)',
  },
  Premium: {
    tier: 'Premium',
    maxActiveItems: 25,
    maxContactMethods: 5,
    labelAr: 'باقة Premium (٢٥ غرضًا نشطًا · ٥ وسائل تواصل)',
    labelEn: 'Premium Plan (25 Active Items · 5 Contact Methods)',
  },
  Pro: {
    tier: 'Pro',
    maxActiveItems: 100,
    maxContactMethods: 7,
    labelAr: 'باقة Pro (١٠٠ غرض نشط · ٧ وسائل تواصل)',
    labelEn: 'Pro Plan (100 Active Items · 7 Contact Methods)',
  },
  Business: {
    tier: 'Business',
    maxActiveItems: 250,
    maxContactMethods: 7,
    labelAr: 'باقة Business (٢٥٠ أصلًا نشطًا · ٧ وسائل تواصل)',
    labelEn: 'Business Plan (250 Active Assets · 7 Contact Methods)',
  },
};

export type ContactMethodType =
  | 'phone'
  | 'whatsapp'
  | 'email'
  | 'telegram'
  | 'facebook'
  | 'custom_link';

export interface AccountContactMethod {
  id: string;
  type: ContactMethodType;
  label: string;
  value: string;
  isActive: boolean;
  isPrimary?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CoverSourceType =
  | 'auto_selected'
  | 'library_matched'
  | 'ai_generated'
  | 'user_selected'
  | 'fallback';

export type MediaAssetVisibility = 'private' | 'public_cover' | 'public';

export interface StoredMediaAssetRecord {
  id: string;
  folder: 'originals' | 'covers' | 'avatars' | 'tickets';
  filename: string;
  url: string;
  ownerUid: string;
  visibility: MediaAssetVisibility;
  mimeType: string;
  sizeBytes: number;
  storageDriver: 'local_persistent' | 's3_compatible' | 'firebase_storage';
  cloudKey?: string;
  cloudUrl?: string;
  originalName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactChannelPreference {
  showPhone: boolean;
  showWhatsapp: boolean;
  showEmail: boolean;
  showTelegram: boolean;
  anonymousRelayOnly: boolean;
  customPhone: string;
  customWhatsapp: string;
  customEmail: string;
  customTelegram: string;
  selectedMethodIds?: string[];
}

export interface ItemGroup {
  id: string;
  ownerUid: string;
  name: string;
  description?: string;
  colorHex: string;
  coverUrl?: string;
  coverSource?: CoverSourceType;
  originalImages?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SharedQrGroupItemEntry {
  itemId: string;
  isVisible: boolean;
  addedAt: string;
}

export interface SharedQrGroup {
  id: string;
  ownerUid: string;
  name: string;
  description?: string;
  shareCode: string;
  isActive: boolean;
  items: SharedQrGroupItemEntry[];
  coverUrl?: string;
  coverSource?: CoverSourceType;
  originalImages?: string[];
  totalScans: number;
  lastScanAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SharedQrPublicItem {
  itemId: string;
  itemNameAr: string;
  itemNameEn: string;
  category: ItemCategory;
  cityAr: string;
  cityEn: string;
  imageUrl: string;
  descriptionAr?: string;
  descriptionEn?: string;
  status: ItemStatus;
  finderNoteAr: string;
  finderNoteEn: string;
  rewardOffered: boolean;
  rewardAmountTextAr: string;
  rewardAmountTextEn: string;
  isContactEnabled: boolean;
  allowFinderMessages: boolean;
  allowFoundReports: boolean;
  anonymousRelayOnly: boolean;
  visibleChannels: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    telegram: string | null;
    facebook?: string | null;
    customLinks?: Array<{ id: string; label: string; value: string }>;
  };
  visibleContactMethods?: Array<{
    id: string;
    type: ContactMethodType;
    label: string;
    value: string;
  }>;
}

export interface SharedQrPublicPayload {
  groupId: string;
  shareCode: string;
  name: string;
  description: string;
  isActive: boolean;
  hasAnyLinkedItems: boolean;
  visibleItemsCount: number;
  items: SharedQrPublicItem[];
}

export interface ItemPrivacySettings {
  publicPageEnabled: boolean;
  showDescription: boolean;
  showImage: boolean;
  showCity: boolean;
  allowFinderMessages: boolean;
  allowFoundReports: boolean;
}

export const DEFAULT_ITEM_PRIVACY_SETTINGS: ItemPrivacySettings = {
  publicPageEnabled: true,
  showDescription: true,
  showImage: true,
  showCity: true,
  allowFinderMessages: true,
  allowFoundReports: true,
};

export type ItemQrMode = 'individual' | 'shared' | 'unassigned';

export type IndividualQrInactiveReason =
  | 'archived'
  | 'public_disabled'
  | 'shared_mode'
  | 'shared_group_paused'
  | 'unassigned_from_shared'
  | 'restricted';

export interface RegisteredItem {
  id: string;
  ownerUid: string;
  qrId: string;
  codeSerial: string;
  name: string;
  nameAr: string;
  nameEn: string;
  category: ItemCategory;
  groupId?: string | null;
  groupName?: string | null;
  qrMode?: ItemQrMode;
  sharedQrGroupId?: string | null;
  sharedQrGroupName?: string | null;
  sharedQrGroupPaused?: boolean;
  imageUrl: string;
  coverUrl?: string;
  coverSource?: CoverSourceType;
  originalImages?: string[];
  selectedContactMethodIds?: string[];
  status: ItemStatus;
  description: string;
  descriptionAr: string;
  descriptionEn: string;
  recoveryInstructions: string;
  finderNoteAr: string;
  finderNoteEn: string;
  rewardOffered: boolean;
  rewardAmountTextAr: string;
  rewardAmountTextEn: string;
  city: string;
  cityAr: string;
  cityEn: string;
  totalScans: number;
  lastScanAt: string | null;
  createdAt: string;
  updatedAt: string;
  designId: string;
  contactChannels: ContactChannelPreference;
  privacySettings?: ItemPrivacySettings;
  moderationFlag?: 'clean' | 'flagged' | 'restricted';
  moderationNote?: string;
}

export type QrFormatType = 'sticker' | 'keychain' | 'luggage_tag' | 'metal_plate' | 'pet_medal';

export interface QrRecord {
  id: string;
  serialNumber: string;
  linkedItemId: string;
  formatType: QrFormatType;
  primaryColor: string;
  accentColor: string;
  badgeLabelAr: string;
  badgeLabelEn: string;
  isActive: boolean;
  scansCount: number;
  lastScannedLocationAr: string;
  lastScannedLocationEn: string;
  createdAt: string;
}

export type TemplateScope = 'general' | 'specialized';

export type TagShapeSilhouette =
  | 'luggage_loop'
  | 'dome_sticker'
  | 'chamfer_keyfob'
  | 'pet_medal'
  | 'metal_plate'
  | 'smart_card'
  | 'shield_tag'
  | 'chamfered_octagon'
  | 'ticket_notch'
  | 'cloud_crest'
  | 'collar_shield'
  | 'tech_chamfer_plate'
  | 'organic_pebble'
  | 'metro_ticket'
  | 'jelly_cushion'
  | 'tech_hexagon'
  | 'flora_scallop'
  | 'mono_hexagon'
  | 'orbit_crest'
  | 'astro_emblem'
  | 'campus_cloud'
  | 'arcade_controller'
  | 'explorer_scallop'
  | 'cat_silhouette'
  | 'neon_angular'
  | 'cloud_scallop'
  | 'street_graffiti'
  | 'ocean_wave'
  | 'pixel_arcade'
  | 'candy_scallop'
  | 'botanical_leaf'
  | 'royal_shield';

export type TemplateDomainCategory =
  | 'personal'
  | 'travel'
  | 'family'
  | 'pets'
  | 'business'
  | 'anime_cartoon';

export type TemplateStatus = 'published' | 'draft' | 'archived';
export type TemplatePurchaseMode = 'single' | 'subscription' | 'both';
export type TemplateCustomizationMode = 'fixed' | 'mixed' | 'full';

export type PrintMaterialFinish =
  | 'soft_matte_foil'
  | 'waterproof_vinyl'
  | 'glossy_vinyl'
  | 'textured_outdoor_vinyl'
  | 'brushed_polyester'
  | 'transparent_vinyl';

export type PilotArtStyle =
  | 'atelier_crest'
  | 'voyager_stamp'
  | 'kiddo_buddy'
  | 'paw_guard'
  | 'progrid_iso'
  | 'pebble_pop'
  | 'metro_ticket'
  | 'jelly_cube'
  | 'hexa_pulse'
  | 'flora_loop'
  | 'mono_mark'
  | 'pocket_orbit'
  | 'astro_buddy'
  | 'campus_bloom'
  | 'game_mode'
  | 'retro_explorer'
  | 'purrfect_tag'
  | 'neon_velocity'
  | 'cloudy_days'
  | 'urban_riot'
  | 'ocean_wonders'
  | 'pixel_quest'
  | 'candy_clouds'
  | 'botanical_journey'
  | 'royal_signature';

export interface PrintableMaterialOption {
  id: PrintMaterialFinish;
  nameAr: string;
  nameEn: string;
  notesAr: string;
  notesEn: string;
}

export interface PrintableSpecMetadata {
  trimWidthMm: number;
  trimHeightMm: number;
  bleedMm: number;
  safeMarginMm: number;
  dpi: number;
  colorSpace: string;
  dieCutShapeAr: string;
  dieCutShapeEn: string;
  availableSizesMm: string[];
  defaultMaterial: PrintMaterialFinish;
  recommendedMaterials: PrintableMaterialOption[];
}

export interface TagDesignTemplate {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  category: QrFormatType;
  domainCategory?: TemplateDomainCategory;
  secondaryDomains?: TemplateDomainCategory[];
  subCategoryAr?: string;
  subCategoryEn?: string;
  requiresIpVerification?: boolean;
  templateScope?: TemplateScope;
  shapeSilhouette?: TagShapeSilhouette;
  specialtyBadgeAr?: string;
  specialtyBadgeEn?: string;
  materialAr: string;
  materialEn: string;
  dimensionsMm: string;
  weatherproofRating: string;
  primaryHex: string;
  secondaryHex: string;
  badgeColorHex: string;
  priceSar: number;
  priceUsd: number;
  includedInTier: 'free' | 'plus' | 'premium' | 'pro' | 'business';
  featuresAr: string[];
  featuresEn: string[];
  recommendedForAr: string[];
  recommendedForEn: string[];
  // Pilot Commercial Printable Label Extensions
  isPilotShowcase?: boolean;
  pilotArtStyle?: PilotArtStyle;
  pilotConceptAr?: string;
  pilotConceptEn?: string;
  visualIdentityAr?: string;
  visualIdentityEn?: string;
  defaultCalloutText?: string;
  printSpecs?: PrintableSpecMetadata;
  // Dynamic Admin & Commerce Extensions
  status?: TemplateStatus;
  isFree?: boolean;
  isFeatured?: boolean;
  isCoreProtected?: boolean;
  purchaseMode?: TemplatePurchaseMode;
  customizationMode?: TemplateCustomizationMode;
  allowEditAfterSave?: boolean;
  maxCopies?: number;
  tags?: string[];
  licenseTypeId?: string;
  originalDesignUrl?: string;
  printFileUrl?: string;
  previewImages?: string[];
  showcaseGallery?: {
    mockup3dUrl: string;
    onProductUrl: string;
    closeupUrl: string;
    lifestyleUrl: string;
    productLabelAr: string;
    productLabelEn: string;
    lifestyleLabelAr: string;
    lifestyleLabelEn: string;
  };
  salesCount?: number;
  usageCount?: number;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  titleAr: string;
  titleEn: string;
  itemType: 'design_pack' | 'physical_tag_kit' | 'subscription_preview';
  status: 'architecture_preview' | 'pending_gateway' | 'completed';
  amountSar: number;
  amountUsd: number;
  date: string;
  quantity: number;
  notesAr: string;
  notesEn: string;
}

export type FinderMessageStatus = 'unread' | 'read' | 'archived';

export interface FinderMessageEntry {
  id: string;
  itemId: string;
  codeSerial: string;
  itemName: string;
  ownerUid: string;
  message: string;
  senderContact: string;
  senderName: string;
  createdAt: string;
  status: FinderMessageStatus;
  type: 'message' | 'found_report';
}

export interface NotificationEntry {
  id: string;
  ownerUid?: string;
  type: 'scan_alert' | 'finder_message' | 'found_report' | 'security_notice' | 'system_architecture';
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  timestamp: string;
  isRead: boolean;
  relatedItemId?: string;
  relatedMessageId?: string;
  senderContact?: string;
  severity: 'info' | 'warning' | 'urgent';
}

export interface ActivityLogEntry {
  id: string;
  ownerUid?: string;
  actionType:
    | 'qr_scan'
    | 'found_report'
    | 'finder_message'
    | 'item_registered'
    | 'privacy_updated'
    | 'status_changed'
    | 'design_assigned'
    | 'item_created'
    | 'item_updated'
    | 'item_archived'
    | 'item_reactivated'
    | 'item_deleted'
    | 'profile_updated'
    | 'shared_group_created'
    | 'shared_group_updated'
    | 'shared_group_deleted'
    | 'item_qr_mode_changed';
  titleAr: string;
  titleEn: string;
  detailAr: string;
  detailEn: string;
  actorAr: string;
  actorEn: string;
  locationAr: string;
  locationEn: string;
  timestamp: string;
  itemId?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  displayNameAr: string;
  displayNameEn: string;
  email: string;
  photoURL: string;
  country: string;
  preferredLanguage: Language;
  plan: UserPlanTier;
  accountStatus: AccountStatus;
  activeItemsCount: number;
  activeItemsLimit: number;
  contactMethodsLimit: number;
  lastQuotaItemId: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  phone: string;
  whatsapp: string;
  telegram: string;
  cityAr: string;
  cityEn: string;
  accountType: 'personal' | 'business';
  organizationNameAr: string;
  organizationNameEn: string;
  defaultLanguage: Language;
  joinedAt: string;
  role?: UserRole;
  adminPermissions?: AdminPermissionKey[];
  adminNotes?: string;
  lastActiveAt?: string;
  authProviders?: Array<'password' | 'google'>;
  hasPassword?: boolean;
  hasGoogle?: boolean;
  contactMethods?: AccountContactMethod[];
}

export interface WorkspaceSettings {
  instantEmailAlerts: boolean;
  whatsappScanAlerts: boolean;
  requireFinderNoteBeforeContact: boolean;
  ShareCoarseLocationOnScan: boolean;
  defaultAnonymousMode: boolean;
  autoLockQrAfterRecovery: boolean;
  notifyOnQrScan?: boolean;
  notifyOnFinderMessage?: boolean;
  notifyOnRecovery?: boolean;
  notifyOnSubscription?: boolean;
  notifyOnSystemUpdates?: boolean;
}

export interface NewItemDraft {
  name: string;
  category: ItemCategory;
  groupId?: string | null;
  description: string;
  finderNote: string;
  city: string;
  imageUrl?: string;
  coverUrl?: string;
  coverSource?: CoverSourceType;
  originalImages?: string[];
  selectedContactMethodIds?: string[];
  status?: ItemStatus;
  rewardOffered: boolean;
  rewardAmountText: string;
  designId: string;
  showPhone: boolean;
  showWhatsapp: boolean;
  showEmail: boolean;
  showTelegram: boolean;
  anonymousRelayOnly: boolean;
  customPhone: string;
  customWhatsapp: string;
  customEmail: string;
  customTelegram?: string;
  privacySettings?: Partial<ItemPrivacySettings>;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface FinderPublicPayload {
  itemId: string;
  serialNumber: string;
  designId?: string;
  itemNameAr: string;
  itemNameEn: string;
  category: ItemCategory;
  cityAr: string;
  cityEn: string;
  imageUrl: string;
  descriptionAr?: string;
  descriptionEn?: string;
  status: ItemStatus;
  finderNoteAr: string;
  finderNoteEn: string;
  rewardOffered: boolean;
  rewardAmountTextAr: string;
  rewardAmountTextEn: string;
  isPublicPageActive: boolean;
  isContactEnabled: boolean;
  allowFinderMessages: boolean;
  allowFoundReports: boolean;
  anonymousRelayOnly: boolean;
  qrMode?: ItemQrMode;
  inactiveReason?: IndividualQrInactiveReason | null;
  visibleChannels: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    telegram: string | null;
    facebook?: string | null;
    customLinks?: Array<{ id: string; label: string; value: string }>;
  };
  visibleContactMethods?: Array<{
    id: string;
    type: ContactMethodType;
    label: string;
    value: string;
  }>;
}

export interface FirebaseConfigRequirements {
  isConfigured: boolean;
  missingKeys: string[];
  projectId: string | null;
  firestoreDatabaseId: string | null;
  servicesReady: {
    auth: boolean;
    firestore: boolean;
    storage: boolean;
    functions: boolean;
  };
}

export interface ServiceResult<T> {
  ok: boolean;
  mode: 'firebase_live' | 'foundation_unconfigured';
  data?: T;
  errorCode?: string;
  messageAr: string;
  messageEn: string;
  missingEnvKeys?: string[];
  pendingLink?: {
    pendingLinkToken: string;
    email: string;
  };
}

// ============================================================================
// SUPER ADMIN, DYNAMIC LICENSING, COMMERCE, SUPPORT & AUDIT MODELS
// ============================================================================

export interface LicenseType {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  allowPersonalUse: boolean;
  allowCommercialUse: boolean;
  durationDays: number | null; // null = perpetual
  maxCopies: number;
  printRulesAr: string;
  printRulesEn: string;
  transferable: boolean;
  resaleAllowed: boolean;
  redistributionAllowed: boolean;
  exceptionsAr: string;
  exceptionsEn: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IssuedLicense {
  id: string;
  licenseNumber: string;
  userId: string;
  userEmail: string;
  templateId: string;
  templateTitleAr: string;
  templateTitleEn: string;
  purchaseId: string;
  licenseTypeId: string;
  licenseNameAr: string;
  licenseNameEn: string;
  allowCommercialUse: boolean;
  maxCopies: number;
  resaleAllowed: boolean;
  transferable: boolean;
  printRulesAr: string;
  printRulesEn: string;
  termsSnapshotAr: string;
  termsSnapshotEn: string;
  issuedAt: string;
  expiresAt: string | null;
  status: 'active' | 'expired' | 'revoked';
}

export interface ManagedPlanDefinition {
  id: string;
  quotaTier: UserPlanTier;
  nameAr: string;
  nameEn: string;
  audienceAr: string;
  audienceEn: string;
  monthlySar: number;
  monthlyUsd: number;
  quarterlySar: number;
  quarterlyUsd: number;
  yearlySar: number;
  yearlyUsd: number;
  maxActiveItems: number;
  maxContactMethods: number;
  maxTemplateCopies: number;
  includedTemplatesScope: 'free_only' | 'plus_and_free' | 'all_general' | 'all_templates';
  allowCustomBranding: boolean;
  allowSvgExport: boolean;
  featured: boolean;
  accentHex: string;
  isActive: boolean;
  isCoreFree?: boolean;
  featuresAr: string[];
  featuresEn: string[];
  updatedAt: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  userEmail: string;
  planId: string;
  quotaTier: UserPlanTier;
  durationMonths: 1 | 3 | 12;
  status: 'active' | 'expired' | 'cancelled' | 'pending_payment';
  amountSar: number;
  amountUsd: number;
  orderId: string;
  startedAt: string;
  expiresAt: string;
  autoRenewSupported: boolean;
  updatedAt: string;
}

export type ManagedOrderType = 'template_purchase' | 'subscription_upgrade' | 'design_pack';
export type ManagedOrderStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'refunded'
  | 'cancelled';

export interface ManagedPurchaseOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  orderType: ManagedOrderType;
  targetId: string; // templateId or planId
  titleAr: string;
  titleEn: string;
  quantity: number;
  durationMonths?: 1 | 3 | 12;
  currency: 'SAR' | 'USD';
  subtotalSar: number;
  subtotalUsd: number;
  discountSar: number;
  discountUsd: number;
  amountSar: number;
  amountUsd: number;
  couponCode?: string;
  paymentMethod: 'manual_transfer' | 'free_claim' | 'gateway_pending';
  transferReference?: string;
  paymentProofUrl?: string;
  paymentNotes?: string;
  status: ManagedOrderStatus;
  reviewedByUid?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  decisionReason?: string;
  refundedAt?: string;
  refundReason?: string;
  issuedLicenseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementBanner {
  id: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  targetAudience: 'all' | 'free_users' | 'paid_users';
  severity: 'info' | 'warning' | 'success';
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  createdByUid: string;
}

export interface CouponCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed_sar';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  appliesTo: 'all' | 'templates' | 'plans';
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface MarketingCampaign {
  id: string;
  titleAr: string;
  titleEn: string;
  channel: 'in_app_notification' | 'in_app_banner';
  targetAudience: 'all' | 'free_users' | 'paid_users' | 'specific_user';
  targetUid?: string;
  messageAr: string;
  messageEn: string;
  scheduledFor?: string | null;
  status: 'draft' | 'scheduled' | 'sent';
  sentCount: number;
  sentAt?: string | null;
  createdAt: string;
  createdByEmail: string;
}

export interface SupportTicketAttachment {
  id: string;
  name: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface SupportTicketReply {
  id: string;
  authorUid: string;
  authorName: string;
  authorRole: 'user' | 'admin' | 'public';
  message: string;
  attachments?: SupportTicketAttachment[];
  isInternalNote: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId?: string;
  requesterName: string;
  requesterEmail: string;
  category: 'general' | 'technical' | 'billing' | 'abuse_report' | 'enterprise' | 'designs';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  subject: string;
  description: string;
  relatedItemSerial?: string;
  attachments?: SupportTicketAttachment[];
  assignedToUid?: string;
  assignedToEmail?: string;
  replies: SupportTicketReply[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
}

export interface ManagedFaqEntry {
  id: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  isPublished: boolean;
}

export interface PlatformSettings {
  platformNameAr: string;
  platformNameEn: string;
  slogan: string;
  primaryColorHex: string;
  tealColorHex: string;
  navyColorHex: string;
  coralColorHex: string;
  defaultLanguage: Language;
  enableArabic: boolean;
  enableEnglish: boolean;
  defaultCurrency: 'SAR' | 'USD';
  marketRegionAr: string;
  marketRegionEn: string;
  supportEmail: string;
  supportPhone: string;
  reportProblemUrl: string;
  bankTransferInstructionsAr: string;
  bankTransferInstructionsEn: string;
  enablePublicRegistration: boolean;
  enableDesignStore: boolean;
  enableManualBankTransfer: boolean;
  enableZipTemplateImport: boolean;
  enableTemplateFavorites: boolean;
  enableReportProblemButton: boolean;
  maintenanceMode: boolean;
  sessionTtlHours: number;
  reauthWindowMinutes: number;
  maxLoginAttemptsPerWindow: number;
  faqs: ManagedFaqEntry[];
  updatedAt: string;
}

export interface AdminAuditLogEntry {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetType:
    | 'user'
    | 'item'
    | 'template'
    | 'license'
    | 'plan'
    | 'order'
    | 'subscription'
    | 'marketing'
    | 'support'
    | 'settings'
    | 'security';
  targetId: string;
  summaryAr: string;
  summaryEn: string;
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
  ip: string;
  createdAt: string;
}

export interface SecurityLoginLog {
  id: string;
  email: string;
  uid?: string;
  success: boolean;
  reasonCode: string;
  portal: 'user' | 'admin';
  ip: string;
  createdAt: string;
}

export interface UnauthorizedAccessEvent {
  id: string;
  uid?: string;
  email?: string;
  path: string;
  method: string;
  reasonCode: string;
  ip: string;
  createdAt: string;
}

export interface AdminSessionSummary {
  tokenHashPrefix: string;
  tokenHash: string;
  uid: string;
  email: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string;
  adminVerifiedUntil?: string | null;
}

export interface AdminUserSummary {
  uid: string;
  email: string;
  displayName: string;
  country: string;
  preferredLanguage: Language;
  plan: UserPlanTier;
  accountStatus: AccountStatus;
  role: UserRole;
  adminPermissions: AdminPermissionKey[];
  adminNotes: string;
  activeItemsCount: number;
  activeItemsLimit: number;
  contactMethodsLimit: number;
  totalItemsCount: number;
  totalOrdersCount: number;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

export interface AdminItemSummary extends RegisteredItem {
  ownerEmail: string;
  ownerDisplayName: string;
  ownerPlan: UserPlanTier;
  moderationFlag?: 'clean' | 'flagged' | 'restricted';
  moderationNote?: string;
}

export interface AdminDashboardAnalytics {
  period: '7d' | '30d' | '90d' | 'all';
  totals: {
    totalUsers: number;
    newUsersInPeriod: number;
    activeUsers: number;
    suspendedUsers: number;
    totalItems: number;
    activeQrCodes: number;
    pausedQrCodes: number;
    totalScans: number;
    publishedTemplates: number;
    draftTemplates: number;
    archivedTemplates: number;
    totalOrders: number;
    approvedOrders: number;
    pendingReviewOrders: number;
    revenueSar: number;
    revenueUsd: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    openSupportTickets: number;
  };
  series: Array<{
    date: string;
    newUsers: number;
    newItems: number;
    revenueSar: number;
    ordersCount: number;
  }>;
  planDistribution: Array<{
    plan: UserPlanTier;
    usersCount: number;
  }>;
  topTemplates: Array<{
    id: string;
    titleAr: string;
    titleEn: string;
    salesCount: number;
    usageCount: number;
  }>;
  recentAdminLogs: AdminAuditLogEntry[];
  recentUserActivities: ActivityLogEntry[];
}

