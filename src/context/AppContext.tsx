import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  INITIAL_ACTIVITY_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PURCHASES,
  INITIAL_REGISTERED_ITEMS,
  INITIAL_TAG_DESIGNS,
  INITIAL_USER_PROFILE,
  INITIAL_WORKSPACE_SETTINGS,
} from '../data/foundationCatalog';
import { translations, TranslationDictionary } from '../i18n/translations';
import { adminApi } from '../services/adminApi';
import { userAppApi } from '../services/userAppApi';
import { buildDefaultPlans, buildDefaultPlatformSettings } from '../server/adminDefaults';
import {
  AuthenticatedSessionUser,
  enableQaSandboxForTesting,
  firebaseServiceLayer,
  GoogleRedirectUiState,
} from '../services/firebase/services';
import { enrichTemplateDefaults } from '../utils/adminLogic';
import { MappedGoogleAuthError } from '../utils/googleAuthFlow';
import {
  buildCanonicalRoutePath,
  isWorkspaceRoutePath,
  parsePublicAndAppPathname,
  resolveInitialPublicTheme,
} from '../utils/publicSiteRoutes';
import {
  AccountContactMethod,
  ActivityLogEntry,
  AnnouncementBanner,
  AsyncViewState,
  ContactMethodType,
  CoverSourceType,
  FinderMessageEntry,
  FinderMessageStatus,
  FirebaseConfigRequirements,
  IssuedLicense,
  ItemCategory,
  ItemGroup,
  ItemPrivacySettings,
  ItemStatus,
  Language,
  LicenseType,
  ManagedPlanDefinition,
  ManagedPurchaseOrder,
  NewItemDraft,
  NotificationEntry,
  PlatformSettings,
  PurchaseOrder,
  QrRecord,
  RegisteredItem,
  RouteId,
  ServiceResult,
  SharedQrGroup,
  SubscriptionRecord,
  SupportTicket,
  SupportTicketAttachment,
  TagDesignTemplate,
  ThemeMode,
  UserProfile,
  WorkspacePageId,
  WorkspaceSettings,
} from '../types/domain';

export interface ToastNotice {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'danger' | 'primary';
  onConfirm: () => void;
}

export function isWorkspaceRoute(route: RouteId): boolean {
  return isWorkspaceRoutePath(route);
}

interface AppContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  theme: ThemeMode;
  publicTheme: ThemeMode;
  workspaceTheme: ThemeMode;
  setPublicTheme: (mode: ThemeMode) => void;
  setWorkspaceTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  t: TranslationDictionary;
  isRtl: boolean;
  currentRoute: RouteId;
  navigate: (
    route: RouteId,
    params?: {
      itemId?: string;
      qrId?: string;
      designId?: string;
      groupId?: string;
      groupType?: 'org' | 'shared';
      tab?: string;
      codeSerial?: string;
      sharedCode?: string;
    }
  ) => void;
  selectedItemId: string;
  selectedQrId: string;
  selectedDesignId: string;
  selectedGroupId: string;
  selectedGroupType: 'org' | 'shared';
  selectedTab: string;
  selectedCodeSerial: string;
  selectedSharedCode: string;
  pendingItemDraft: NewItemDraft | null;
  itemDraftTemplateReturnActive: boolean;
  savePendingItemDraft: (draft: NewItemDraft | null, markReturnFlow?: boolean) => void;
  selectTemplateForPendingItemDraft: (designId: string, navigateToAddItem?: boolean) => void;
  clearPendingItemDraft: () => void;
  viewState: AsyncViewState;
  setViewState: (state: AsyncViewState) => void;
  // Auth state
  authUser: AuthenticatedSessionUser | null;
  isAuthReady: boolean;
  isAdminUser: boolean;
  isGoogleRedirectPending: boolean;
  googleRedirectError: MappedGoogleAuthError | null;
  clearGoogleRedirectError: () => void;
  // Data state
  items: RegisteredItem[];
  groups: ItemGroup[];
  sharedQrGroups: SharedQrGroup[];
  showcaseItems: RegisteredItem[];
  qrRecords: QrRecord[];
  designs: TagDesignTemplate[];
  plans: ManagedPlanDefinition[];
  announcements: AnnouncementBanner[];
  platformSettings: PlatformSettings;
  purchases: PurchaseOrder[];
  orders: ManagedPurchaseOrder[];
  issuedLicenses: IssuedLicense[];
  subscriptions: SubscriptionRecord[];
  favoriteTemplateIds: string[];
  supportTickets: SupportTicket[];
  licenseTypes: LicenseType[];
  finderMessages: FinderMessageEntry[];
  notifications: NotificationEntry[];
  activityLogs: ActivityLogEntry[];
  profile: UserProfile;
  settings: WorkspaceSettings;
  firebaseStatus: FirebaseConfigRequirements;
  isFirebaseModalOpen: boolean;
  setFirebaseModalOpen: (open: boolean) => void;
  toast: ToastNotice | null;
  showToast: (type: ToastNotice['type'], title: string, message: string) => void;
  dismissToast: () => void;
  confirmDialog: ConfirmDialogState | null;
  requestConfirm: (config: Omit<ConfirmDialogState, 'isOpen'>) => void;
  closeConfirm: () => void;
  // Live Catalog & Commerce Sync
  refreshCatalog: () => Promise<void>;
  refreshCommerce: () => Promise<void>;
  refreshWorkspaceAll: () => Promise<void>;
  toggleFavoriteTemplateInSession: (templateId: string) => Promise<void>;
  // Auth actions
  registerWithEmail: (params: {
    fullName: string;
    email: string;
    password: string;
    country?: string;
    preferredLanguage?: Language;
  }) => Promise<ServiceResult<UserProfile>>;
  loginWithEmail: (
    email: string,
    password: string
  ) => Promise<ServiceResult<{ email: string }>>;
  loginWithGoogle: () => Promise<ServiceResult<UserProfile>>;
  confirmGoogleLinkWithPassword: (
    pendingLinkToken: string,
    password: string
  ) => Promise<ServiceResult<UserProfile>>;
  setAccountPassword: (params: {
    newPassword: string;
    currentPassword?: string;
    googleIdToken?: string;
  }) => Promise<ServiceResult<UserProfile>>;
  linkGoogleAccount: (
    password: string,
    idToken: string
  ) => Promise<ServiceResult<UserProfile>>;
  sendPasswordReset: (email: string) => Promise<ServiceResult<{ email: string }>>;
  verifyPasswordResetToken: (
    token: string
  ) => Promise<ServiceResult<{ maskedEmail: string }>>;
  confirmPasswordReset: (
    token: string,
    newPassword: string
  ) => Promise<ServiceResult<null>>;
  resendVerificationEmail: () => Promise<ServiceResult<null>>;
  logoutUser: () => Promise<void>;
  activateQaSandbox: () => void;
  // Workspace mutations
  createGroupInSession: (
    name: string,
    colorHex?: string,
    extra?: {
      description?: string;
      coverUrl?: string;
      coverSource?: CoverSourceType;
      originalImages?: string[];
    }
  ) => Promise<ItemGroup | null>;
  updateGroupInSession: (
    groupId: string,
    updates: {
      name?: string;
      description?: string;
      colorHex?: string;
      coverUrl?: string;
      coverSource?: CoverSourceType;
      originalImages?: string[];
    }
  ) => Promise<boolean>;
  deleteGroupInSession: (groupId: string) => Promise<boolean>;
  createSharedQrGroupInSession: (input: {
    name: string;
    description?: string;
    items?: Array<{ itemId: string; isVisible?: boolean }>;
    coverUrl?: string;
    coverSource?: CoverSourceType;
    originalImages?: string[];
  }) => Promise<SharedQrGroup | null>;
  updateSharedQrGroupInSession: (
    groupId: string,
    updates: {
      name?: string;
      description?: string;
      isActive?: boolean;
      items?: Array<{ itemId: string; isVisible?: boolean }>;
      coverUrl?: string;
      coverSource?: CoverSourceType;
      originalImages?: string[];
    }
  ) => Promise<SharedQrGroup | null>;
  addItemToSharedQrGroupInSession: (
    groupId: string,
    itemId: string,
    isVisible?: boolean
  ) => Promise<SharedQrGroup | null>;
  toggleSharedQrItemVisibilityInSession: (
    groupId: string,
    itemId: string,
    isVisible: boolean
  ) => Promise<SharedQrGroup | null>;
  removeItemFromSharedQrGroupInSession: (
    groupId: string,
    itemId: string
  ) => Promise<SharedQrGroup | null>;
  deleteSharedQrGroupInSession: (
    groupId: string,
    restoreIndividual?: boolean
  ) => Promise<boolean>;
  restoreItemIndividualQrInSession: (itemId: string) => Promise<boolean>;
  addNewItemInSession: (draft: NewItemDraft) => Promise<RegisteredItem | null>;
  updateItemDetailsInSession: (
    itemId: string,
    updates: {
      name?: string;
      description?: string;
      category?: ItemCategory;
      groupId?: string | null;
      imageUrl?: string;
      coverUrl?: string;
      coverSource?: CoverSourceType;
      originalImages?: string[];
      selectedContactMethodIds?: string[];
      status?: ItemStatus;
      recoveryInstructions?: string;
      city?: string;
      designId?: string;
      contactChannels?: RegisteredItem['contactChannels'];
      privacySettings?: Partial<ItemPrivacySettings>;
    }
  ) => Promise<boolean>;
  updateItemStatusInSession: (itemId: string, newStatus: ItemStatus) => Promise<boolean>;
  archiveItemInSession: (itemId: string) => Promise<boolean>;
  reactivateItemInSession: (itemId: string) => Promise<boolean>;
  deleteItemInSession: (itemId: string) => Promise<boolean>;
  toggleQrActiveInSession: (qrId: string) => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
  clearNotificationsInSession: () => void;
  updateFinderMessageStatusInSession: (
    messageId: string,
    status: FinderMessageStatus
  ) => Promise<void>;
  updateProfileInSession: (updated: UserProfile) => Promise<void>;
  updateSettingsInSession: (updated: WorkspaceSettings) => Promise<void>;
  // Central Contact Methods CRUD
  createContactMethodInSession: (input: {
    type: ContactMethodType;
    label: string;
    value: string;
    isActive?: boolean;
    isPrimary?: boolean;
  }) => Promise<AccountContactMethod | null>;
  updateContactMethodInSession: (
    methodId: string,
    updates: Partial<{
      type: ContactMethodType;
      label: string;
      value: string;
      isActive: boolean;
      isPrimary: boolean;
    }>
  ) => Promise<boolean>;
  deleteContactMethodInSession: (methodId: string) => Promise<boolean>;
  // Workspace Support Tickets CRUD
  refreshTicketsInSession: () => Promise<void>;
  createSupportTicketInSession: (input: {
    subject: string;
    description: string;
    category?: SupportTicket['category'];
    priority?: SupportTicket['priority'];
    relatedItemSerial?: string;
    attachments?: SupportTicketAttachment[];
  }) => Promise<SupportTicket | null>;
  replyToSupportTicketInSession: (
    ticketId: string,
    input: { message: string; attachments?: SupportTicketAttachment[] }
  ) => Promise<SupportTicket | null>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const LANG_STORAGE_KEY = 'finditqr_preferred_lang';
const PUBLIC_THEME_STORAGE_KEY = 'finditqr_public_theme';
const WORKSPACE_THEME_STORAGE_KEY = 'finditqr_workspace_theme';
const PENDING_ITEM_DRAFT_KEY = 'finditqr_pending_item_draft_v1';
const PENDING_TEMPLATE_RETURN_KEY = 'finditqr_pending_template_return_v1';

function parseInitialUrlState() {
  if (typeof window === 'undefined') {
    return {
      route: 'home' as RouteId,
      codeSerial: '',
      sharedCode: '',
      itemId: '',
      groupId: '',
      groupType: 'org' as const,
      designId: '',
      tab: '',
    };
  }
  return parsePublicAndAppPathname(window.location.pathname, window.location.search);
}

function buildRoutePath(
  route: RouteId,
  params?: {
    itemId?: string;
    groupId?: string;
    groupType?: 'org' | 'shared';
    designId?: string;
    tab?: string;
    codeSerial?: string;
    sharedCode?: string;
  }
): string {
  return buildCanonicalRoutePath(route, params);
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialUrl = useMemo(() => parseInitialUrlState(), []);

  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'ar';
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    return saved === 'en' || saved === 'ar' ? saved : 'ar';
  });

  const [publicTheme, setPublicThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem(PUBLIC_THEME_STORAGE_KEY);
    return resolveInitialPublicTheme(saved);
  });

  const [workspaceTheme, setWorkspaceThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem(WORKSPACE_THEME_STORAGE_KEY);
    return resolveInitialPublicTheme(saved);
  });

  const [authUser, setAuthUser] = useState<AuthenticatedSessionUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [googleRedirectUi, setGoogleRedirectUi] = useState<GoogleRedirectUiState>({
    isPending: false,
    error: null,
    completedMessage: null,
  });

  const [currentRoute, setCurrentRoute] = useState<RouteId>(initialUrl.route);
  const [selectedItemId, setSelectedItemId] = useState<string>(initialUrl.itemId);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialUrl.groupId);
  const [selectedGroupType, setSelectedGroupType] = useState<'org' | 'shared'>(
    initialUrl.groupType || 'org'
  );
  const [selectedTab, setSelectedTab] = useState<string>(initialUrl.tab);
  const [selectedCodeSerial, setSelectedCodeSerial] = useState<string>(initialUrl.codeSerial);
  const [selectedSharedCode, setSelectedSharedCode] = useState<string>(initialUrl.sharedCode);
  const [selectedQrId, setSelectedQrId] = useState<string>('');
  const [selectedDesignId, setSelectedDesignId] = useState<string>(
    initialUrl.designId || INITIAL_TAG_DESIGNS[0].id
  );
  const [pendingItemDraft, setPendingItemDraft] = useState<NewItemDraft | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.sessionStorage.getItem(PENDING_ITEM_DRAFT_KEY);
      return raw ? (JSON.parse(raw) as NewItemDraft) : null;
    } catch {
      return null;
    }
  });
  const [itemDraftTemplateReturnActive, setItemDraftTemplateReturnActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(PENDING_TEMPLATE_RETURN_KEY) === '1';
  });
  const [viewState, setViewState] = useState<AsyncViewState>('ready');

  const [items, setItems] = useState<RegisteredItem[]>([]);
  const [groups, setGroups] = useState<ItemGroup[]>([]);
  const [sharedQrGroups, setSharedQrGroups] = useState<SharedQrGroup[]>([]);
  const [designs, setDesigns] = useState<TagDesignTemplate[]>(() =>
    INITIAL_TAG_DESIGNS.map((d) => enrichTemplateDefaults(d))
  );
  const [plans, setPlans] = useState<ManagedPlanDefinition[]>(() =>
    Object.values(buildDefaultPlans())
  );
  const [announcements, setAnnouncements] = useState<AnnouncementBanner[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() =>
    buildDefaultPlatformSettings()
  );
  const [purchases] = useState<PurchaseOrder[]>(INITIAL_PURCHASES);
  const [orders, setOrders] = useState<ManagedPurchaseOrder[]>([]);
  const [issuedLicenses, setIssuedLicenses] = useState<IssuedLicense[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [favoriteTemplateIds, setFavoriteTemplateIds] = useState<string[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [finderMessages, setFinderMessages] = useState<FinderMessageEntry[]>([]);
  const [notifications, setNotifications] =
    useState<NotificationEntry[]>(INITIAL_NOTIFICATIONS);
  const [activityLogs, setActivityLogs] =
    useState<ActivityLogEntry[]>(INITIAL_ACTIVITY_LOGS);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [settings, setSettings] = useState<WorkspaceSettings>(INITIAL_WORKSPACE_SETTINGS);

  const [isFirebaseModalOpen, setFirebaseModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const firebaseStatus = useMemo(() => firebaseServiceLayer.getDiagnostics(), []);
  const isAdminUser = Boolean(
    authUser?.role === 'super_admin' ||
      authUser?.role === 'staff_admin' ||
      profile.role === 'super_admin' ||
      profile.role === 'staff_admin'
  );

  // Derive QR records directly from the authenticated user's real items
  const qrRecords: QrRecord[] = useMemo(() => {
    return items.map((item) => {
      const chosenDesign =
        designs.find((d) => d.id === item.designId) ?? designs[0];
      return {
        id: item.qrId || `qr-${item.id}`,
        serialNumber: item.codeSerial,
        linkedItemId: item.id,
        formatType: chosenDesign.category,
        primaryColor: chosenDesign.primaryHex,
        accentColor: chosenDesign.badgeColorHex,
        badgeLabelAr: 'امسح للتواصل مع المالك',
        badgeLabelEn: 'SCAN TO CONTACT OWNER',
        isActive: (!item.qrMode || item.qrMode === 'individual') && item.status !== 'Archived',
        scansCount: item.totalScans,
        lastScannedLocationAr: item.cityAr || item.city,
        lastScannedLocationEn: item.cityEn || item.city,
        createdAt: item.createdAt,
      };
    });
  }, [items, designs]);

  useLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
  }, [lang]);

  const inWorkspaceContext = isWorkspaceRoute(currentRoute) && Boolean(authUser);
  const theme: ThemeMode = inWorkspaceContext ? workspaceTheme : publicTheme;

  useLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      window.localStorage.setItem(PUBLIC_THEME_STORAGE_KEY, publicTheme);
      window.localStorage.setItem(WORKSPACE_THEME_STORAGE_KEY, workspaceTheme);
    }
  }, [theme, publicTheme, workspaceTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const parsed = parsePublicAndAppPathname(window.location.pathname, window.location.search);
      setCurrentRoute(parsed.route);
      if (parsed.itemId) setSelectedItemId(parsed.itemId);
      setSelectedGroupId(parsed.groupId);
      setSelectedGroupType(parsed.groupType);
      setSelectedTab(parsed.tab);
      if (parsed.designId) setSelectedDesignId(parsed.designId);
      setSelectedCodeSerial(parsed.codeSerial);
      setSelectedSharedCode(parsed.sharedCode);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const refreshCatalog = async () => {
    try {
      const cat = await adminApi.getPublicCatalog();
      if (cat.ok) {
        if (Array.isArray(cat.templates) && cat.templates.length > 0) {
          const liveIds = new Set(cat.templates.map((t) => t.id));
          const archivedFallbacks = INITIAL_TAG_DESIGNS
            .filter((t) => !liveIds.has(t.id))
            .map((t) => enrichTemplateDefaults({ ...t, status: 'archived' }));
          setDesigns([...cat.templates, ...archivedFallbacks]);
        }
        if (Array.isArray(cat.plans) && cat.plans.length > 0) {
          setPlans(cat.plans);
        }
        if (Array.isArray(cat.announcements)) {
          setAnnouncements(cat.announcements);
        }
        if (cat.platformSettings) {
          setPlatformSettings(cat.platformSettings);
        }
      }
    } catch {
      // Retain compiled defaults gracefully if server is briefly unavailable
    }
  };

  const refreshCommerce = async () => {
    if (!authUser) {
      setOrders([]);
      setIssuedLicenses([]);
      setSubscriptions([]);
      setFavoriteTemplateIds([]);
      setSupportTickets([]);
      return;
    }
    try {
      const data = await adminApi.getWorkspaceCommerce();
      if (data.ok) {
        setOrders(data.orders || []);
        setIssuedLicenses(data.licenses || []);
        setSubscriptions(data.subscriptions || []);
        setFavoriteTemplateIds(data.favoriteTemplateIds || []);
        setSupportTickets(data.tickets || []);
        setLicenseTypes(data.licenseTypes || []);
      }
    } catch {
      // Ignore transient load error
    }
  };

  const refreshWorkspaceAll = async () => {
    await firebaseServiceLayer.refreshWorkspace();
    await refreshCommerce();
    await refreshCatalog();
  };

  // 0. Load live public catalog (templates, plans, announcements, platform settings)
  useEffect(() => {
    void refreshCatalog();
  }, []);

  // 1. Auth state listener & Google Redirect lifecycle listener
  useEffect(() => {
    const unsubAuth = firebaseServiceLayer.subscribeToAuthChanges((user) => {
      setAuthUser(user);
      setIsAuthReady(true);
      if (!user) {
        setItems([]);
        setGroups([]);
        setSharedQrGroups([]);
        setFinderMessages([]);
        setNotifications([]);
        setActivityLogs([]);
        setOrders([]);
        setIssuedLicenses([]);
        setSubscriptions([]);
        setFavoriteTemplateIds([]);
        setSupportTickets([]);
        setProfile(INITIAL_USER_PROFILE);
        setSettings(INITIAL_WORKSPACE_SETTINGS);
      }
    });
    const unsubRedirect = firebaseServiceLayer.subscribeToGoogleRedirectState((state) => {
      setGoogleRedirectUi(state);
    });
    return () => {
      unsubAuth();
      unsubRedirect();
    };
  }, []);

  useEffect(() => {
    if (!googleRedirectUi.completedMessage) return;
    setToast({
      id: String(Date.now()),
      type: 'success',
      title: lang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Signed In Successfully',
      message:
        lang === 'ar'
          ? googleRedirectUi.completedMessage.ar
          : googleRedirectUi.completedMessage.en,
    });
    firebaseServiceLayer.consumeGoogleRedirectCompletedMessage();
  }, [googleRedirectUi.completedMessage, lang]);

  // 2. Real-time Workspace data listener (ONLY when authenticated)
  useEffect(() => {
    if (!isAuthReady || !authUser) return;
    setViewState('loading');
    void refreshCommerce();

    const unsub = firebaseServiceLayer.subscribeToUserData(
      authUser.uid,
      Boolean(authUser.isQaSandbox),
      {
        onProfile: (loadedProfile) => {
          setProfile(loadedProfile);
          if (loadedProfile.preferredLanguage) {
            setLangState(loadedProfile.preferredLanguage);
          }
          setViewState('ready');
        },
        onSettings: (loadedSettings) => {
          setSettings(loadedSettings);
        },
        onItems: (loadedItems) => {
          setItems(loadedItems);
          setSelectedItemId((prev) => {
            if (prev && loadedItems.some((i) => i.id === prev)) {
              return prev;
            }
            return loadedItems[0]?.id || '';
          });
          setViewState('ready');
        },
        onGroups: (loadedGroups) => {
          setGroups(loadedGroups);
        },
        onSharedQrGroups: (loadedSharedGroups) => {
          setSharedQrGroups(loadedSharedGroups);
        },
        onActivities: (loadedActs) => {
          setActivityLogs(loadedActs);
        },
        onMessages: (loadedMsgs) => {
          setFinderMessages(loadedMsgs);
        },
        onNotifications: (loadedNotifs) => {
          setNotifications(loadedNotifs);
        },
        onError: () => {
          setViewState('error');
        },
      }
    );

    return () => unsub();
  }, [isAuthReady, authUser?.uid, authUser?.isQaSandbox]);

  // Browser popstate is handled by the unified listener above.

  // 4. Enforce workspace route protection when unauthenticated, and redirect authenticated users away from /login or /register
  useEffect(() => {
    if (!isAuthReady) return;
    if (!authUser && isWorkspaceRoute(currentRoute)) {
      setCurrentRoute('login');
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', buildRoutePath('login'));
      }
      setToast({
        id: String(Date.now()),
        type: 'warning',
        title: lang === 'ar' ? 'تسجيل الدخول مطلوب' : 'Authentication Required',
        message:
          lang === 'ar'
            ? 'يرجى تسجيل الدخول أو إنشاء حساب للوصول إلى لوحة المستخدم وإدارة أغراضك.'
            : 'Please sign in or create an account to access the User Workspace and manage your items.',
      });
    } else if (authUser && (currentRoute === 'login' || currentRoute === 'register')) {
      setCurrentRoute('dashboard');
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', buildRoutePath('dashboard'));
      }
    }
  }, [isAuthReady, authUser, currentRoute, lang]);

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);
  };

  const toggleLang = () => {
    setLangState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const setPublicTheme = (mode: ThemeMode) => {
    setPublicThemeState(mode);
    setWorkspaceThemeState(mode);
  };

  const setWorkspaceTheme = (mode: ThemeMode) => {
    setWorkspaceThemeState(mode);
    setPublicThemeState(mode);
  };

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setPublicThemeState(next);
    setWorkspaceThemeState(next);
  };

  const showToast = (
    type: ToastNotice['type'],
    title: string,
    message: string
  ) => {
    setToast({
      id: String(Date.now()),
      type,
      title,
      message,
    });
  };

  const dismissToast = () => setToast(null);

  const requestConfirm = (config: Omit<ConfirmDialogState, 'isOpen'>) => {
    setConfirmDialog({
      ...config,
      isOpen: true,
    });
  };

  const closeConfirm = () => setConfirmDialog(null);

  const applyRoute = (
    route: RouteId,
    params?: {
      itemId?: string;
      qrId?: string;
      designId?: string;
      groupId?: string;
      groupType?: 'org' | 'shared';
      tab?: string;
      codeSerial?: string;
      sharedCode?: string;
    }
  ) => {
    if (params?.itemId) setSelectedItemId(params.itemId);
    if (params?.qrId) setSelectedQrId(params.qrId);
    if (params?.designId) setSelectedDesignId(params.designId);
    if (params?.groupId !== undefined) setSelectedGroupId(params.groupId);
    if (params?.groupType !== undefined) setSelectedGroupType(params.groupType);
    setSelectedTab(params?.tab ?? '');
    if (params?.codeSerial !== undefined) setSelectedCodeSerial(params.codeSerial);
    if (params?.sharedCode !== undefined) setSelectedSharedCode(params.sharedCode);
    setCurrentRoute(route);
    setViewState('ready');
    if (typeof window !== 'undefined') {
      const targetUrl = buildRoutePath(route, {
        itemId: params?.itemId,
        groupId: params?.groupId,
        groupType: params?.groupType,
        designId: params?.designId,
        tab: params?.tab,
        codeSerial: params?.codeSerial,
        sharedCode: params?.sharedCode,
      });
      if (`${window.location.pathname}${window.location.search}` !== targetUrl) {
        window.history.pushState(null, '', targetUrl);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigate = (
    route: RouteId,
    params?: {
      itemId?: string;
      qrId?: string;
      designId?: string;
      groupId?: string;
      groupType?: 'org' | 'shared';
      tab?: string;
      codeSerial?: string;
      sharedCode?: string;
    }
  ) => {
    if (!authUser && isWorkspaceRoute(route)) {
      applyRoute('login');
      showToast(
        'warning',
        lang === 'ar' ? 'جلسة مصادقة مطلوبة' : 'Sign-In Required',
        lang === 'ar'
          ? 'لا يمكن الدخول إلى لوحة المستخدم دون تسجيل الدخول أولًا.'
          : 'You must be signed in to access the User Workspace.'
      );
      return;
    }
    applyRoute(route, params);
  };

  const savePendingItemDraft = (draft: NewItemDraft | null, markReturnFlow = false) => {
    setPendingItemDraft(draft);
    setItemDraftTemplateReturnActive(Boolean(draft && markReturnFlow));
    if (typeof window !== 'undefined') {
      try {
        if (draft) {
          window.sessionStorage.setItem(PENDING_ITEM_DRAFT_KEY, JSON.stringify(draft));
        } else {
          window.sessionStorage.removeItem(PENDING_ITEM_DRAFT_KEY);
        }
        if (draft && markReturnFlow) {
          window.sessionStorage.setItem(PENDING_TEMPLATE_RETURN_KEY, '1');
        } else {
          window.sessionStorage.removeItem(PENDING_TEMPLATE_RETURN_KEY);
        }
      } catch {
        // Ignore storage quota issues gracefully
      }
    }
  };

  const selectTemplateForPendingItemDraft = (designId: string, navigateToAddItem = true) => {
    setSelectedDesignId(designId);
    setPendingItemDraft((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, designId };
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem(PENDING_ITEM_DRAFT_KEY, JSON.stringify(updated));
        } catch {
          // Ignore storage quota issues
        }
      }
      return updated;
    });
    setItemDraftTemplateReturnActive(false);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(PENDING_TEMPLATE_RETURN_KEY);
    }
    if (navigateToAddItem) {
      navigate('add-item', { designId });
    }
  };

  const clearPendingItemDraft = () => {
    setPendingItemDraft(null);
    setItemDraftTemplateReturnActive(false);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(PENDING_ITEM_DRAFT_KEY);
      window.sessionStorage.removeItem(PENDING_TEMPLATE_RETURN_KEY);
    }
  };

  const registerWithEmail = async (params: {
    fullName: string;
    email: string;
    password: string;
    country?: string;
    preferredLanguage?: Language;
  }): Promise<ServiceResult<UserProfile>> => {
    const res = await firebaseServiceLayer.registerWithEmail({
      ...params,
      preferredLanguage: params.preferredLanguage || lang,
    });
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم إنشاء الحساب بنجاح'
          : 'Account Created Successfully'
        : lang === 'ar'
        ? 'تعذّر إنشاء الحساب'
        : 'Registration Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    if (res.ok) {
      applyRoute('dashboard');
    }
    return res;
  };

  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<ServiceResult<{ email: string }>> => {
    const res = await firebaseServiceLayer.signInWithEmail(email, password);
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم تسجيل الدخول'
          : 'Signed In Successfully'
        : lang === 'ar'
        ? 'فشل تسجيل الدخول'
        : 'Sign-In Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    if (res.ok) {
      applyRoute('dashboard');
    }
    return res;
  };

  const clearGoogleRedirectError = () => {
    firebaseServiceLayer.clearGoogleRedirectError();
  };

  const loginWithGoogle = async (): Promise<ServiceResult<UserProfile>> => {
    const res = await firebaseServiceLayer.signInWithGoogle(lang);
    if (res.errorCode === 'REDIRECT_IN_PROGRESS') {
      return res;
    }
    if (res.errorCode === 'LINK_ACCOUNT_REQUIRED') {
      showToast(
        'warning',
        lang === 'ar' ? 'تأكيد ربط الحساب مطلوب' : 'Account Ownership Verification Required',
        lang === 'ar' ? res.messageAr : res.messageEn
      );
      return res;
    }
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم تسجيل الدخول عبر Google'
          : 'Signed In with Google'
        : lang === 'ar'
        ? 'تنبيه تسجيل الدخول'
        : 'Sign-In Notice',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    if (res.ok) {
      applyRoute('dashboard');
    }
    return res;
  };

  const confirmGoogleLinkWithPassword = async (
    pendingLinkToken: string,
    password: string
  ): Promise<ServiceResult<UserProfile>> => {
    const res = await firebaseServiceLayer.confirmGoogleAccountLinkWithPassword(
      pendingLinkToken,
      password
    );
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم ربط حساب Google بنجاح'
          : 'Google Account Linked'
        : lang === 'ar'
        ? 'تعذر ربط الحساب'
        : 'Account Linking Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    if (res.ok) {
      applyRoute('dashboard');
    }
    return res;
  };

  const setAccountPassword = async (params: {
    newPassword: string;
    currentPassword?: string;
    googleIdToken?: string;
  }): Promise<ServiceResult<UserProfile>> => {
    const res = await firebaseServiceLayer.setPasswordForCurrentAccount(params);
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم حفظ كلمة المرور'
          : 'Password Saved'
        : lang === 'ar'
        ? 'تعذر تحديث كلمة المرور'
        : 'Password Update Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res;
  };

  const linkGoogleAccount = async (
    password: string,
    idToken: string
  ): Promise<ServiceResult<UserProfile>> => {
    const res = await firebaseServiceLayer.linkGoogleToCurrentAccount(password, idToken);
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم ربط حساب Google'
          : 'Google Account Linked'
        : lang === 'ar'
        ? 'تعذر ربط Google'
        : 'Google Link Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res;
  };

  const sendPasswordReset = async (
    email: string
  ): Promise<ServiceResult<{ email: string }>> => {
    const res = await firebaseServiceLayer.sendPasswordReset(email);
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم استلام طلب استعادة كلمة المرور'
          : 'Password Reset Request Received'
        : lang === 'ar'
        ? 'تعذّر إرسال الرابط'
        : 'Password Reset Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res;
  };

  const verifyPasswordResetToken = async (
    token: string
  ): Promise<ServiceResult<{ maskedEmail: string }>> => {
    return firebaseServiceLayer.verifyPasswordResetToken(token);
  };

  const confirmPasswordReset = async (
    token: string,
    newPassword: string
  ): Promise<ServiceResult<null>> => {
    const res = await firebaseServiceLayer.confirmPasswordReset(token, newPassword);
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم تحديث كلمة المرور بنجاح'
          : 'Password Updated Successfully'
        : lang === 'ar'
        ? 'تعذر تحديث كلمة المرور'
        : 'Password Reset Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res;
  };

  const resendVerificationEmail = async (): Promise<ServiceResult<null>> => {
    const res = await firebaseServiceLayer.resendVerificationEmail();
    showToast(
      res.ok ? 'success' : 'warning',
      res.ok
        ? lang === 'ar'
          ? 'تم تأكيد البريد الإلكتروني'
          : 'Email Verified'
        : lang === 'ar'
        ? 'تنبيه التحقق'
        : 'Verification Notice',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res;
  };

  const logoutUser = async (): Promise<void> => {
    await firebaseServiceLayer.signOutUser();
    applyRoute('login');
    showToast(
      'info',
      lang === 'ar' ? 'تم تسجيل الخروج' : 'Signed Out',
      lang === 'ar'
        ? 'تم إنهاء الجلسة بأمان.'
        : 'Your session has been signed out safely.'
    );
  };

  const activateQaSandbox = () => {
    enableQaSandboxForTesting();
  };

  const createGroupInSession = async (
    name: string,
    colorHex = '#0F9D8E',
    extra?: {
      description?: string;
      coverUrl?: string;
      coverSource?: CoverSourceType;
      originalImages?: string[];
    }
  ): Promise<ItemGroup | null> => {
    if (!authUser) return null;
    const res = await firebaseServiceLayer.createGroup(name, colorHex, extra);
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم إنشاء المجموعة'
          : 'Group Created'
        : lang === 'ar'
        ? 'تعذر إنشاء المجموعة'
        : 'Could Not Create Group',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok && res.data ? res.data : null;
  };

  const updateGroupInSession = async (
    groupId: string,
    updates: {
      name?: string;
      description?: string;
      colorHex?: string;
      coverUrl?: string;
      coverSource?: CoverSourceType;
      originalImages?: string[];
    }
  ): Promise<boolean> => {
    if (!authUser) return false;
    const res = await firebaseServiceLayer.updateGroup(groupId, updates);
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم تحديث المجموعة'
          : 'Group Updated'
        : lang === 'ar'
        ? 'تعذر تحديث المجموعة'
        : 'Group Update Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok;
  };

  const deleteGroupInSession = async (groupId: string): Promise<boolean> => {
    if (!authUser) return false;
    const res = await firebaseServiceLayer.deleteGroup(groupId);
    showToast(
      res.ok ? 'info' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم حذف المجموعة'
          : 'Group Deleted'
        : lang === 'ar'
        ? 'تعذر حذف المجموعة'
        : 'Delete Group Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok;
  };

  const createSharedQrGroupInSession = async (input: {
    name: string;
    description?: string;
    items?: Array<{ itemId: string; isVisible?: boolean }>;
    coverUrl?: string;
    coverSource?: CoverSourceType;
    originalImages?: string[];
  }): Promise<SharedQrGroup | null> => {
    if (!authUser) return null;
    const res = await firebaseServiceLayer.createSharedQrGroup(input);
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم إنشاء مجموعة QR المشترك'
          : 'Shared QR Group Created'
        : lang === 'ar'
        ? 'تعذر إنشاء المجموعة'
        : 'Could Not Create Shared QR Group',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok && res.data ? res.data : null;
  };

  const updateSharedQrGroupInSession = async (
    groupId: string,
    updates: {
      name?: string;
      description?: string;
      isActive?: boolean;
      items?: Array<{ itemId: string; isVisible?: boolean }>;
      coverUrl?: string;
      coverSource?: CoverSourceType;
      originalImages?: string[];
    }
  ): Promise<SharedQrGroup | null> => {
    if (!authUser) return null;
    const res = await firebaseServiceLayer.updateSharedQrGroup(groupId, updates);
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم تحديث مجموعة QR المشترك'
          : 'Shared QR Group Updated'
        : lang === 'ar'
        ? 'تعذر التحديث'
        : 'Update Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok && res.data ? res.data : null;
  };

  const addItemToSharedQrGroupInSession = async (
    groupId: string,
    itemId: string,
    isVisible = true
  ): Promise<SharedQrGroup | null> => {
    if (!authUser) return null;
    const res = await firebaseServiceLayer.addItemToSharedQrGroup(groupId, itemId, isVisible);
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تمت إضافة الغرض للمجموعة'
          : 'Item Linked to Shared QR'
        : lang === 'ar'
        ? 'تعذرت إضافة الغرض'
        : 'Could Not Link Item',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok && res.data ? res.data : null;
  };

  const toggleSharedQrItemVisibilityInSession = async (
    groupId: string,
    itemId: string,
    isVisible: boolean
  ): Promise<SharedQrGroup | null> => {
    if (!authUser) return null;
    const res = await firebaseServiceLayer.setSharedQrGroupItemVisibility(
      groupId,
      itemId,
      isVisible
    );
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? isVisible
            ? 'تم إظهار الغرض في QR المشترك'
            : 'تم إخفاء الغرض من QR المشترك'
          : isVisible
          ? 'Item Shown on Shared QR'
          : 'Item Hidden from Shared QR'
        : lang === 'ar'
        ? 'تعذر تغيير حالة الظهور'
        : 'Visibility Update Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok && res.data ? res.data : null;
  };

  const removeItemFromSharedQrGroupInSession = async (
    groupId: string,
    itemId: string
  ): Promise<SharedQrGroup | null> => {
    if (!authUser) return null;
    const res = await firebaseServiceLayer.removeItemFromSharedQrGroup(groupId, itemId);
    showToast(
      res.ok ? 'info' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تمت إزالة الغرض من المجموعة'
          : 'Item Removed from Shared QR'
        : lang === 'ar'
        ? 'تعذرت الإزالة'
        : 'Remove Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok && res.data ? res.data : null;
  };

  const deleteSharedQrGroupInSession = async (
    groupId: string,
    restoreIndividual = false
  ): Promise<boolean> => {
    if (!authUser) return false;
    const res = await firebaseServiceLayer.deleteSharedQrGroup(groupId, restoreIndividual);
    showToast(
      res.ok ? 'info' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم حذف مجموعة QR المشترك'
          : 'Shared QR Group Deleted'
        : lang === 'ar'
        ? 'تعذر حذف المجموعة'
        : 'Delete Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok;
  };

  const restoreItemIndividualQrInSession = async (itemId: string): Promise<boolean> => {
    if (!authUser) return false;
    const res = await firebaseServiceLayer.restoreItemIndividualQr(itemId);
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تمت إعادة تفعيل QR الفردي'
          : 'Individual QR Restored'
        : lang === 'ar'
        ? 'تعذرت إعادة التفعيل'
        : 'Restore Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok;
  };

  const addNewItemInSession = async (
    draft: NewItemDraft
  ): Promise<RegisteredItem | null> => {
    if (!authUser) {
      navigate('login');
      return null;
    }

    const res = await firebaseServiceLayer.createItem(
      authUser.uid,
      draft,
      profile
    );

    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تمت إضافة الغرض بنجاح'
          : 'Item Added Successfully'
        : lang === 'ar'
        ? 'تعذّرت إضافة الغرض'
        : 'Cannot Add Item',
      lang === 'ar' ? res.messageAr : res.messageEn
    );

    if (res.ok && res.data) {
      setSelectedItemId(res.data.id);
      return res.data;
    }
    return null;
  };

  const updateItemDetailsInSession = async (
    itemId: string,
    updates: {
      name?: string;
      description?: string;
      category?: ItemCategory;
      groupId?: string | null;
      imageUrl?: string;
      coverUrl?: string;
      coverSource?: CoverSourceType;
      originalImages?: string[];
      selectedContactMethodIds?: string[];
      status?: ItemStatus;
      recoveryInstructions?: string;
      city?: string;
      designId?: string;
      contactChannels?: RegisteredItem['contactChannels'];
      privacySettings?: Partial<ItemPrivacySettings>;
    }
  ): Promise<boolean> => {
    if (!authUser) return false;
    const existing = items.find((i) => i.id === itemId);
    if (!existing) return false;

    const mergedUpdates = {
      name: updates.name ?? existing.name,
      description: updates.description ?? existing.description,
      category: updates.category ?? existing.category,
      groupId: updates.groupId !== undefined ? updates.groupId : existing.groupId ?? null,
      imageUrl: updates.imageUrl ?? existing.imageUrl,
      coverUrl: updates.coverUrl !== undefined ? updates.coverUrl : existing.coverUrl,
      coverSource: updates.coverSource !== undefined ? updates.coverSource : existing.coverSource,
      originalImages:
        updates.originalImages !== undefined ? updates.originalImages : existing.originalImages,
      selectedContactMethodIds:
        updates.selectedContactMethodIds !== undefined
          ? updates.selectedContactMethodIds
          : existing.selectedContactMethodIds,
      status: updates.status ?? existing.status,
      recoveryInstructions:
        updates.recoveryInstructions ?? existing.recoveryInstructions,
      city: updates.city ?? existing.city,
      designId: updates.designId ?? existing.designId,
      contactChannels: updates.contactChannels ?? existing.contactChannels,
      privacySettings: updates.privacySettings ?? existing.privacySettings,
    };

    const res = await firebaseServiceLayer.updateItemDetails(
      authUser.uid,
      existing,
      mergedUpdates,
      profile
    );

    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم حفظ تعديلات الغرض'
          : 'Item Changes Saved'
        : lang === 'ar'
        ? 'تعذّر حفظ التعديلات'
        : 'Failed to Update Item',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok;
  };

  const updateItemStatusInSession = async (
    itemId: string,
    newStatus: ItemStatus
  ): Promise<boolean> => {
    if (!authUser) return false;
    const target = items.find((i) => i.id === itemId);
    if (!target) return false;

    if (newStatus === 'Archived' && target.status !== 'Archived') {
      return archiveItemInSession(itemId);
    }
    if (target.status === 'Archived' && newStatus !== 'Archived') {
      return reactivateItemInSession(itemId);
    }

    return updateItemDetailsInSession(itemId, {
      status: newStatus,
    });
  };

  const archiveItemInSession = async (itemId: string): Promise<boolean> => {
    if (!authUser) return false;
    const target = items.find((i) => i.id === itemId);
    if (!target) return false;

    const res = await firebaseServiceLayer.archiveItem(
      authUser.uid,
      target,
      profile
    );

    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تمت أرشفة الغرض'
          : 'Item Archived'
        : lang === 'ar'
        ? 'تعذّرت الأرشفة'
        : 'Archive Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok;
  };

  const reactivateItemInSession = async (itemId: string): Promise<boolean> => {
    if (!authUser) return false;
    const target = items.find((i) => i.id === itemId);
    if (!target) return false;

    const res = await firebaseServiceLayer.reactivateItem(
      authUser.uid,
      target,
      profile
    );

    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تمت إعادة تفعيل الغرض'
          : 'Item Reactivated'
        : lang === 'ar'
        ? 'الحد الأقصى للباقة المجانية'
        : 'Free Plan Limit Reached',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok;
  };

  const deleteItemInSession = async (itemId: string): Promise<boolean> => {
    if (!authUser) return false;
    const target = items.find((i) => i.id === itemId);
    if (!target) return false;

    const res = await firebaseServiceLayer.deleteItem(
      authUser.uid,
      target,
      profile
    );

    showToast(
      res.ok ? 'info' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم حذف الغرض نهائيًا'
          : 'Item Deleted'
        : lang === 'ar'
        ? 'تعذّر الحذف'
        : 'Delete Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
    return res.ok;
  };

  const toggleQrActiveInSession = (qrId: string) => {
    const targetQr = qrRecords.find((q) => q.id === qrId);
    if (!targetQr) return;
    if (targetQr.isActive) {
      void archiveItemInSession(targetQr.linkedItemId);
    } else {
      void reactivateItemInSession(targetQr.linkedItemId);
    }
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
    void firebaseServiceLayer.markNotificationReadOnServer(notifId);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    void firebaseServiceLayer.markAllNotificationsReadOnServer();
    showToast(
      'success',
      lang === 'ar' ? 'تمت قراءة جميع الإشعارات' : 'All Notifications Marked Read',
      lang === 'ar'
        ? 'تم تحديث حالة الإشعارات.'
        : 'Updated notification state.'
    );
  };

  const clearNotificationsInSession = () => {
    setNotifications([]);
    void firebaseServiceLayer.clearNotificationsOnServer();
  };

  const updateFinderMessageStatusInSession = async (
    messageId: string,
    status: FinderMessageStatus
  ) => {
    const res = await firebaseServiceLayer.updateFinderMessageStatus(messageId, status);
    if (res.ok) {
      showToast(
        'info',
        lang === 'ar' ? 'تم تحديث حالة الرسالة' : 'Message Status Updated',
        lang === 'ar' ? res.messageAr : res.messageEn
      );
    }
  };

  const updateProfileInSession = async (updated: UserProfile) => {
    if (!authUser) return;
    const res = await firebaseServiceLayer.updateProfileRecord(updated);
    if (res.ok && res.data) {
      setProfile(res.data);
      setLangState(res.data.preferredLanguage);
    }
    showToast(
      res.ok ? 'success' : 'error',
      res.ok
        ? lang === 'ar'
          ? 'تم تحديث بيانات الملف الشخصي'
          : 'Profile Updated'
        : lang === 'ar'
        ? 'تعذّر تحديث الملف الشخصي'
        : 'Profile Update Failed',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
  };

  const updateSettingsInSession = async (updated: WorkspaceSettings) => {
    setSettings(updated);
    if (authUser) {
      const res = await firebaseServiceLayer.updateSettingsRecord(updated);
      if (res.ok && res.data) {
        setSettings(res.data);
      }
      showToast(
        res.ok ? 'success' : 'error',
        res.ok
          ? lang === 'ar'
            ? 'تم حفظ تفضيلات الخصوصية'
            : 'Privacy Settings Saved'
          : lang === 'ar'
          ? 'تعذر الحفظ'
          : 'Save Failed',
        lang === 'ar' ? res.messageAr : res.messageEn
      );
      return;
    }
    showToast(
      'success',
      lang === 'ar' ? 'تم تحديث تفضيلات الخصوصية' : 'Privacy Settings Updated',
      lang === 'ar'
        ? 'تم حفظ إعدادات الخصوصية والتنبيهات بنجاح.'
        : 'Saved privacy and alert preferences.'
    );
  };

  const toggleFavoriteTemplateInSession = async (templateId: string) => {
    if (!authUser) {
      showToast(
        'warning',
        lang === 'ar' ? 'تسجيل الدخول مطلوب' : 'Sign-In Required',
        lang === 'ar'
          ? 'يرجى تسجيل الدخول لحفظ القوالب في المفضلة.'
          : 'Please sign in to save templates to your favorites.'
      );
      return;
    }
    try {
      const res = await adminApi.toggleFavoriteTemplate(templateId);
      setFavoriteTemplateIds(res.favoriteTemplateIds || []);
    } catch {
      showToast(
        'error',
        lang === 'ar' ? 'تعذر التحديث' : 'Update Failed',
        lang === 'ar' ? 'تعذر تحديث قائمة المفضلة.' : 'Could not update favorites.'
      );
    }
  };

  const createContactMethodInSession = async (input: {
    type: ContactMethodType;
    label: string;
    value: string;
    isActive?: boolean;
    isPrimary?: boolean;
  }): Promise<AccountContactMethod | null> => {
    if (!authUser) return null;
    try {
      const res = await userAppApi.createContactMethod(input);
      setProfile(res.profile);
      await firebaseServiceLayer.refreshWorkspace();
      showToast(
        'success',
        lang === 'ar' ? 'تمت إضافة وسيلة التواصل' : 'Contact Method Added',
        lang === 'ar'
          ? `تم حفظ "${res.method.label}" في دليل التواصل المركزي.`
          : `Saved "${res.method.label}" to your central contact directory.`
      );
      return res.method;
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'messageAr' in err
          ? lang === 'ar'
            ? String((err as { messageAr?: string }).messageAr || '')
            : String((err as { messageEn?: string }).messageEn || '')
          : '';
      showToast(
        'error',
        lang === 'ar' ? 'تعذرت الإضافة' : 'Failed to Add Contact Method',
        msg || (lang === 'ar' ? 'تحقق من صحة البيانات المدخلة.' : 'Please verify the entered contact value.')
      );
      return null;
    }
  };

  const updateContactMethodInSession = async (
    methodId: string,
    updates: Partial<{
      type: ContactMethodType;
      label: string;
      value: string;
      isActive: boolean;
      isPrimary: boolean;
    }>
  ): Promise<boolean> => {
    if (!authUser) return false;
    try {
      const res = await userAppApi.updateContactMethod(methodId, updates);
      setProfile(res.profile);
      await firebaseServiceLayer.refreshWorkspace();
      showToast(
        'success',
        lang === 'ar' ? 'تم تحديث وسيلة التواصل' : 'Contact Method Updated',
        lang === 'ar'
          ? 'انطبق التحديث تلقائيًا على جميع الأغراض المرتبطة بهذه الوسيلة.'
          : 'Changes propagated automatically to all linked items.'
      );
      return true;
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'messageAr' in err
          ? lang === 'ar'
            ? String((err as { messageAr?: string }).messageAr || '')
            : String((err as { messageEn?: string }).messageEn || '')
          : '';
      showToast(
        'error',
        lang === 'ar' ? 'تعذر التحديث' : 'Update Failed',
        msg || (lang === 'ar' ? 'تعذر تحديث وسيلة التواصل.' : 'Could not update contact method.')
      );
      return false;
    }
  };

  const deleteContactMethodInSession = async (methodId: string): Promise<boolean> => {
    if (!authUser) return false;
    try {
      const res = await userAppApi.deleteContactMethod(methodId);
      setProfile(res.profile);
      await firebaseServiceLayer.refreshWorkspace();
      showToast(
        'info',
        lang === 'ar' ? 'تم حذف وسيلة التواصل' : 'Contact Method Deleted',
        lang === 'ar'
          ? 'تمت إزالة الوسيلة وفصلها عن الأغراض المرتبطة.'
          : 'Contact method deleted and detached from linked items.'
      );
      return true;
    } catch {
      showToast(
        'error',
        lang === 'ar' ? 'تعذر الحذف' : 'Delete Failed',
        lang === 'ar' ? 'تعذر حذف وسيلة التواصل.' : 'Could not delete contact method.'
      );
      return false;
    }
  };

  const refreshTicketsInSession = async (): Promise<void> => {
    if (!authUser) return;
    try {
      const res = await userAppApi.getWorkspaceTickets();
      setSupportTickets(res.tickets || []);
    } catch {
      // ignore transient error
    }
  };

  const createSupportTicketInSession = async (input: {
    subject: string;
    description: string;
    category?: SupportTicket['category'];
    priority?: SupportTicket['priority'];
    relatedItemSerial?: string;
    attachments?: SupportTicketAttachment[];
  }): Promise<SupportTicket | null> => {
    if (!authUser) return null;
    try {
      const res = await userAppApi.createWorkspaceTicket(input);
      setSupportTickets((prev) => [res.ticket, ...prev]);
      showToast(
        'success',
        lang === 'ar' ? 'تم فتح التذكرة' : 'Ticket Created',
        lang === 'ar' ? res.messageAr : res.messageEn
      );
      return res.ticket;
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'messageAr' in err
          ? lang === 'ar'
            ? String((err as { messageAr?: string }).messageAr || '')
            : String((err as { messageEn?: string }).messageEn || '')
          : '';
      showToast(
        'error',
        lang === 'ar' ? 'تعذر إنشاء التذكرة' : 'Could Not Create Ticket',
        msg || (lang === 'ar' ? 'يرجى التحقق من عنوان ووصف التذكرة.' : 'Please verify ticket subject and description.')
      );
      return null;
    }
  };

  const replyToSupportTicketInSession = async (
    ticketId: string,
    input: { message: string; attachments?: SupportTicketAttachment[] }
  ): Promise<SupportTicket | null> => {
    if (!authUser) return null;
    try {
      const res = await userAppApi.replyToWorkspaceTicket(ticketId, input);
      setSupportTickets((prev) =>
        prev.map((tk) => (tk.id === ticketId ? res.ticket : tk))
      );
      showToast(
        'success',
        lang === 'ar' ? 'تم إرسال الرد' : 'Reply Sent',
        lang === 'ar' ? 'أُضيف ردك إلى التذكرة بنجاح.' : 'Your reply was added to the ticket.'
      );
      return res.ticket;
    } catch {
      showToast(
        'error',
        lang === 'ar' ? 'تعذر إرسال الرد' : 'Reply Failed',
        lang === 'ar' ? 'يرجى كتابة نص واضح قبل الإرسال.' : 'Please enter a valid reply message.'
      );
      return null;
    }
  };

  const value: AppContextValue = {
    lang,
    setLang,
    toggleLang,
    theme,
    publicTheme,
    workspaceTheme,
    setPublicTheme,
    setWorkspaceTheme,
    toggleTheme,
    t: translations[lang],
    isRtl: lang === 'ar',
    currentRoute,
    navigate,
    selectedItemId,
    selectedQrId,
    selectedDesignId,
    selectedGroupId,
    selectedGroupType,
    selectedTab,
    selectedCodeSerial,
    selectedSharedCode,
    pendingItemDraft,
    itemDraftTemplateReturnActive,
    savePendingItemDraft,
    selectTemplateForPendingItemDraft,
    clearPendingItemDraft,
    viewState,
    setViewState,
    authUser,
    isAuthReady,
    isAdminUser,
    isGoogleRedirectPending: googleRedirectUi.isPending,
    googleRedirectError: googleRedirectUi.error,
    clearGoogleRedirectError,
    items,
    groups,
    sharedQrGroups,
    showcaseItems: INITIAL_REGISTERED_ITEMS,
    qrRecords,
    designs,
    plans,
    announcements,
    platformSettings,
    purchases,
    orders,
    issuedLicenses,
    subscriptions,
    favoriteTemplateIds,
    supportTickets,
    licenseTypes,
    finderMessages,
    notifications,
    activityLogs,
    profile,
    settings,
    firebaseStatus,
    isFirebaseModalOpen,
    setFirebaseModalOpen,
    toast,
    showToast,
    dismissToast,
    confirmDialog,
    requestConfirm,
    closeConfirm,
    refreshCatalog,
    refreshCommerce,
    refreshWorkspaceAll,
    toggleFavoriteTemplateInSession,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    confirmGoogleLinkWithPassword,
    setAccountPassword,
    linkGoogleAccount,
    sendPasswordReset,
    verifyPasswordResetToken,
    confirmPasswordReset,
    resendVerificationEmail,
    logoutUser,
    activateQaSandbox,
    createGroupInSession,
    updateGroupInSession,
    deleteGroupInSession,
    createSharedQrGroupInSession,
    updateSharedQrGroupInSession,
    addItemToSharedQrGroupInSession,
    toggleSharedQrItemVisibilityInSession,
    removeItemFromSharedQrGroupInSession,
    deleteSharedQrGroupInSession,
    restoreItemIndividualQrInSession,
    addNewItemInSession,
    updateItemDetailsInSession,
    updateItemStatusInSession,
    archiveItemInSession,
    reactivateItemInSession,
    deleteItemInSession,
    toggleQrActiveInSession,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotificationsInSession,
    updateFinderMessageStatusInSession,
    updateProfileInSession,
    updateSettingsInSession,
    createContactMethodInSession,
    updateContactMethodInSession,
    deleteContactMethodInSession,
    refreshTicketsInSession,
    createSupportTicketInSession,
    replyToSupportTicketInSession,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
