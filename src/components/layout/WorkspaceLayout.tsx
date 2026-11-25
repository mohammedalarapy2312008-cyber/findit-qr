import React, { useState } from 'react';
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Briefcase,
  CheckCircle2,
  CreditCard,
  Database,
  Globe,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquarePlus,
  Moon,
  Palette,
  PhoneCall,
  PlusCircle,
  Printer,
  QrCode,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkspacePageId } from '../../types/domain';
import { FindItLogo } from '../brand/FindItLogo';

const PAGE_TITLE_MAP: Record<WorkspacePageId, { ar: string; en: string }> = {
  dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
  'my-items': { ar: 'أغراضي', en: 'My Items' },
  'add-item': { ar: 'إضافة غرض جديد', en: 'Add New Item' },
  'item-details': { ar: 'تفاصيل وتعديل الغرض', en: 'Item Details' },
  groups: { ar: 'المجموعات', en: 'Groups Hub' },
  'shared-qr-groups': { ar: 'مجموعات QR المشتركة', en: 'Shared QR Groups' },
  'group-details': { ar: 'تفاصيل المجموعة', en: 'Group Details' },
  'qr-manager': { ar: 'إدارة رموز QR', en: 'QR Manager' },
  'qr-preview': { ar: 'تفاصيل ومعاينة رمز QR', en: 'QR Details & Preview' },
  'design-library': { ar: 'مكتبة القوالب', en: 'Template Library' },
  'template-details': { ar: 'تفاصيل القالب', en: 'Template Details' },
  'print-studio': { ar: 'استوديو الطباعة', en: 'Print Studio' },
  analytics: { ar: 'الإحصائيات والتحليلات', en: 'Analytics & Insights' },
  activity: { ar: 'سجل النشاط والعمليات', en: 'Activity Log' },
  plans: { ar: 'الاشتراكات والباقات', en: 'Subscriptions & Plans' },
  'my-purchases': { ar: 'المشتريات والتراخيص', en: 'Purchases & Licenses' },
  'contact-methods': { ar: 'إدارة طرق التواصل', en: 'Contact Methods' },
  profile: { ar: 'الملف الشخصي', en: 'Profile' },
  settings: { ar: 'الإعدادات العامة', en: 'General Settings' },
  'privacy-security': { ar: 'الخصوصية والأمان', en: 'Privacy & Security' },
  notifications: { ar: 'مركز الإشعارات', en: 'Notification Center' },
  support: { ar: 'مركز الدعم والمساعدة', en: 'Support Center' },
  'support-faq': { ar: 'الأسئلة الشائعة', en: 'Workspace FAQ' },
  'support-tickets': { ar: 'تذاكر الدعم الفني', en: 'Support Tickets' },
};

export const WorkspaceLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    lang,
    toggleLang,
    theme,
    toggleTheme,
    t,
    currentRoute,
    navigate,
    notifications,
    items,
    groups,
    sharedQrGroups,
    designs,
    profile,
    authUser,
    isAdminUser,
    announcements,
    logoutUser,
    setFirebaseModalOpen,
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const activeDesignsCount = designs.filter(
    (d) => (d.status || 'published') === 'published'
  ).length;
  const totalGroupsCount = groups.length + sharedQrGroups.length;

  const sidebarSections: Array<{
    sectionAr: string;
    sectionEn: string;
    items: Array<{
      id: WorkspacePageId;
      labelAr: string;
      labelEn: string;
      icon: React.FC<{ className?: string }>;
      count?: number;
      matchRoutes?: WorkspacePageId[];
    }>;
  }> = [
    {
      sectionAr: 'الأصول والتنظيم',
      sectionEn: 'Assets & Organization',
      items: [
        {
          id: 'dashboard',
          labelAr: t.workspaceNav.dashboard,
          labelEn: t.workspaceNav.dashboard,
          icon: LayoutDashboard,
        },
        {
          id: 'my-items',
          labelAr: t.workspaceNav.myItems,
          labelEn: t.workspaceNav.myItems,
          icon: Briefcase,
          count: items.length,
          matchRoutes: ['item-details', 'add-item'],
        },
        {
          id: 'groups',
          labelAr: 'المجموعات',
          labelEn: 'Groups',
          icon: Layers,
          count: totalGroupsCount > 0 ? totalGroupsCount : undefined,
          matchRoutes: ['shared-qr-groups', 'group-details'],
        },
        {
          id: 'qr-manager',
          labelAr: t.workspaceNav.qrManager,
          labelEn: t.workspaceNav.qrManager,
          icon: QrCode,
          matchRoutes: ['qr-preview'],
        },
      ],
    },
    {
      sectionAr: 'القوالب والطباعة والتحليلات',
      sectionEn: 'Templates, Print & Insights',
      items: [
        {
          id: 'design-library',
          labelAr: t.workspaceNav.designLibrary,
          labelEn: t.workspaceNav.designLibrary,
          icon: Palette,
          count: activeDesignsCount,
          matchRoutes: ['template-details'],
        },
        {
          id: 'print-studio',
          labelAr: 'استوديو الطباعة',
          labelEn: 'Print Studio',
          icon: Printer,
        },
        {
          id: 'analytics',
          labelAr: 'الإحصائيات والتحليلات',
          labelEn: 'Analytics & Stats',
          icon: BarChart3,
          matchRoutes: ['activity'],
        },
        {
          id: 'contact-methods',
          labelAr: 'إدارة طرق التواصل',
          labelEn: 'Contact Methods',
          icon: PhoneCall,
          count: Array.isArray(profile.contactMethods) ? profile.contactMethods.length : undefined,
        },
      ],
    },
    {
      sectionAr: 'التنبيهات والاشتراكات والحساب',
      sectionEn: 'Alerts, Plans & Account',
      items: [
        {
          id: 'notifications',
          labelAr: t.workspaceNav.notifications,
          labelEn: t.workspaceNav.notifications,
          icon: Bell,
          count: unreadCount > 0 ? unreadCount : undefined,
        },
        {
          id: 'plans',
          labelAr: t.workspaceNav.plans,
          labelEn: t.workspaceNav.plans,
          icon: CreditCard,
        },
        {
          id: 'my-purchases',
          labelAr: t.workspaceNav.myPurchases,
          labelEn: t.workspaceNav.myPurchases,
          icon: ShoppingBag,
        },
        {
          id: 'privacy-security',
          labelAr: 'الخصوصية والأمان',
          labelEn: 'Privacy & Security',
          icon: ShieldCheck,
        },
        {
          id: 'profile',
          labelAr: t.workspaceNav.profile,
          labelEn: t.workspaceNav.profile,
          icon: User,
        },
        {
          id: 'settings',
          labelAr: t.workspaceNav.settings,
          labelEn: t.workspaceNav.settings,
          icon: Settings,
        },
      ],
    },
    {
      sectionAr: 'الدعم والمساعدة',
      sectionEn: 'Support & Help',
      items: [
        {
          id: 'support',
          labelAr: 'مركز الدعم والمساعدة',
          labelEn: 'Support Center',
          icon: LifeBuoy,
        },
        {
          id: 'support-faq',
          labelAr: 'الأسئلة الشائعة',
          labelEn: 'FAQ',
          icon: HelpCircle,
        },
        {
          id: 'support-tickets',
          labelAr: 'تذاكر الدعم الفني',
          labelEn: 'Support Tickets',
          icon: MessageSquarePlus,
        },
      ],
    },
  ];

  const handleSelect = (id: WorkspacePageId) => {
    navigate(id);
    setSidebarOpen(false);
  };

  const currentTitle =
    PAGE_TITLE_MAP[currentRoute as WorkspacePageId] || {
      ar: t.workspaceNav.title,
      en: t.workspaceNav.title,
    };

  return (
    <div className="min-h-screen flex overflow-x-clip bg-[#F4F8FA] dark:bg-[#0B1320] text-[#0B1320] dark:text-[#F4F8FA]">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Responsive Midnight Teal Sidebar */}
      <aside
        aria-label={t.workspaceNav.title}
        className={`fixed lg:static inset-y-0 start-0 z-50 w-72 bg-white dark:bg-[#0E192B] border-e border-slate-200/90 dark:border-slate-800 flex-col transition-transform duration-200 shadow-lg lg:shadow-none ${
          sidebarOpen ? 'flex translate-x-0' : 'hidden lg:flex'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="text-start focus:outline-none"
          >
            <FindItLogo variant="full" size="sm" />
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label={t.common.cancel}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action: Add New Item + Quota Indicator */}
        <div className="p-4 border-b border-slate-200/70 dark:border-slate-800 space-y-2.5">
          <button
            type="button"
            data-testid="sidebar-add-item-btn"
            onClick={() => handleSelect('add-item')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0F9D8E] hover:bg-[#19B5A5] text-white dark:text-[#07101A] text-sm font-extrabold transition-colors shadow-sm shadow-[#0F9D8E]/25"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            <span>{t.workspaceNav.addItem}</span>
          </button>

          <div className="px-3 py-2 rounded-xl bg-[#F4F8FA] dark:bg-[#0B1320] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-semibold">
              {lang === 'ar' ? `الباقة (${profile.plan}):` : `Plan (${profile.plan}):`}
            </span>
            <span
              className={`font-mono font-bold tabular-nums ${
                profile.activeItemsCount >= profile.activeItemsLimit
                  ? 'text-[#E05D38] dark:text-[#FF8A65]'
                  : 'text-[#0F9D8E] dark:text-[#2DD4BF]'
              }`}
            >
              {profile.activeItemsCount}/{profile.activeItemsLimit}{' '}
              {lang === 'ar' ? 'نشط' : 'active'}
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {sidebarSections.map((section) => (
            <div key={section.sectionEn} className="space-y-1">
              <p className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {lang === 'ar' ? section.sectionAr : section.sectionEn}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentRoute === item.id ||
                  (item.matchRoutes ? item.matchRoutes.includes(currentRoute as WorkspacePageId) : false);

                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`nav-${item.id}`}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#0F9D8E]/12 dark:bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#2DD4BF] border border-[#0F9D8E]/25 dark:border-[#2DD4BF]/25'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14233A]/70 hover:text-[#0B1320] dark:hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#0F9D8E] dark:text-[#2DD4BF]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{lang === 'ar' ? item.labelAr : item.labelEn}</span>
                    </span>
                    {typeof item.count === 'number' && (
                      <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B1320] text-slate-600 dark:text-slate-300">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {isAdminUser && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  navigate('admin');
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0B1320] text-white border border-[#19B5A5]/40 hover:bg-[#14233A] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-[#2DD4BF]" />
                  <span>{lang === 'ar' ? 'لوحة الإدارة المركزية' : 'Admin Portal'}</span>
                </span>
              </button>
            </div>
          )}
        </nav>

        {/* Cloud Diagnostics, Logout & Return to Public Site */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50/70 dark:bg-[#0B1320]">
          <button
            type="button"
            onClick={() => setFirebaseModalOpen(true)}
            className="w-full text-start p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] hover:border-[#0F9D8E]"
          >
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#0B1320] dark:text-white">
              <span className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-[#19B5A5]" aria-hidden="true" />
                <span>FindIt Cloud</span>
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#19B5A5]" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {t.common.firebaseReadyText}
            </p>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-[#14233A] transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#0F9D8E]" aria-hidden="true" />
              <span className="truncate">
                {lang === 'ar' ? 'الموقع العام' : 'Public Site'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void logoutUser()}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="truncate">{t.workspaceNav.logout}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0E192B]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={lang === 'ar' ? 'فتح القائمة الجانبية' : 'Open Sidebar'}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm truncate">
              <span className="text-slate-400 dark:text-slate-500 hidden sm:inline font-semibold">
                {lang === 'ar' ? currentTitle.ar : currentTitle.en}
              </span>
              <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">·</span>
              <span className="font-bold text-[#0B1320] dark:text-white truncate">
                {profile.displayName || authUser?.displayName || authUser?.email}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('activity')}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#0B1320] dark:text-slate-200 hover:border-[#0F9D8E] transition-colors whitespace-nowrap shrink-0"
            >
              <Activity className="w-3.5 h-3.5 text-[#0F9D8E]" aria-hidden="true" />
              <span>{t.workspaceNav.activity}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('found-item')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#0B1320] dark:text-slate-200 hover:border-[#19B5A5] transition-colors whitespace-nowrap shrink-0"
            >
              <QrCode className="w-3.5 h-3.5 text-[#19B5A5]" aria-hidden="true" />
              <span>{t.common.tryFinderScan}</span>
            </button>

            <button
              type="button"
              data-testid="workspace-lang-toggle"
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#0B1320] dark:text-slate-200 hover:border-[#0F9D8E] transition-colors whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-[#0F9D8E]" aria-hidden="true" />
              <span>{t.meta.switchLangLabel}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              data-testid="workspace-theme-toggle"
              aria-label={theme === 'light' ? t.common.darkMode : t.common.lightMode}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[#0B1320] dark:text-slate-200 hover:border-[#0F9D8E] transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-[#0B1320]" />
              ) : (
                <Sun className="w-4 h-4 text-[#FFD166]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => void logoutUser()}
              aria-label={t.workspaceNav.logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.workspaceNav.logout}</span>
            </button>
          </div>
        </header>

        {/* Workspace Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-4">
          {announcements
            .filter(
              (a) =>
                a.isActive &&
                (a.targetAudience === 'all' ||
                  (profile.plan === 'Free'
                    ? a.targetAudience === 'free_users'
                    : a.targetAudience === 'paid_users'))
            )
            .slice(0, 2)
            .map((a) => (
              <div
                key={a.id}
                className="p-3.5 rounded-2xl bg-[#0F9D8E]/10 dark:bg-[#19B5A5]/10 border border-[#0F9D8E]/30 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <strong className="text-[#0B1320] dark:text-white me-2">
                    {lang === 'ar' ? a.titleAr : a.titleEn}
                  </strong>
                  <span className="text-slate-600 dark:text-slate-300">
                    {lang === 'ar' ? a.bodyAr : a.bodyEn}
                  </span>
                </div>
              </div>
            ))}
          {children}
        </main>
      </div>
    </div>
  );
};

