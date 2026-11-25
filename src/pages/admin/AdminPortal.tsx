import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  CreditCard,
  FileCheck2,
  Globe,
  KeyRound,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Package,
  Palette,
  Settings,
  Shield,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { FindItLogo } from '../../components/brand/FindItLogo';
import { useApp } from '../../context/AppContext';
import { adminApi, AdminBootstrapStatusResponse } from '../../services/adminApi';
import { AdminPermissionKey } from '../../types/domain';
import { AdminAuthGate, AdminReauthModal } from './AdminAuthGate';
import { AdminFinanceView, AdminPlansView } from './AdminCommerceView';
import { AdminMarketingView, AdminSupportView } from './AdminCommsAndSupportView';
import { AdminDashboardView } from './AdminDashboardView';
import {
  AdminReportsView,
  AdminSecurityView,
  AdminSettingsView,
} from './AdminOpsAndSecurityView';
import { AdminLicensesView, AdminTemplatesView } from './AdminTemplatesAndLicensesView';
import { AdminItemsView, AdminUsersView } from './AdminUsersAndItemsView';

export const AdminPortal: React.FC = () => {
  const {
    lang,
    toggleLang,
    workspaceTheme,
    setWorkspaceTheme,
    navigate,
    authUser,
    logoutUser,
  } = useApp();

  const [status, setStatus] = useState<AdminBootstrapStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<AdminPermissionKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [reauthOpen, setReauthOpen] = useState(false);
  const [pendingRetry, setPendingRetry] = useState<(() => Promise<void>) | null>(null);

  const loadBootstrapStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const s = await adminApi.getBootstrapStatus();
      setStatus(s);
    } catch {
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBootstrapStatus();
  }, [loadBootstrapStatus, authUser?.uid]);

  // Apply light/dark class on html while inside /admin
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (workspaceTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [workspaceTheme]);

  const handleRequireReauth = (retryAction?: () => Promise<void>) => {
    if (retryAction) {
      setPendingRetry(() => retryAction);
    } else {
      setPendingRetry(null);
    }
    setReauthOpen(true);
  };

  const hasAuthorizedRole =
    status &&
    status.authenticated &&
    (status.role === 'super_admin' || status.role === 'staff_admin');

  if (!hasAuthorizedRole) {
    return (
      <AdminAuthGate
        status={status}
        loading={statusLoading}
        onRefreshStatus={loadBootstrapStatus}
      />
    );
  }

  const navItems: Array<{
    id: AdminPermissionKey;
    labelAr: string;
    labelEn: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'dashboard', labelAr: 'لوحة المؤشرات', labelEn: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', labelAr: 'المستخدمون', labelEn: 'Users', icon: Users },
    { id: 'items', labelAr: 'الأغراض و QR', labelEn: 'Items & QR', icon: Package },
    { id: 'templates', labelAr: 'مكتبة القوالب', labelEn: 'Templates', icon: Palette },
    { id: 'licenses', labelAr: 'التراخيص والحقوق', labelEn: 'Licenses', icon: FileCheck2 },
    { id: 'plans', labelAr: 'الباقات والاشتراكات', labelEn: 'Plans & Subs', icon: Layers },
    { id: 'finance', labelAr: 'المالية والمدفوعات', labelEn: 'Finance & Orders', icon: CreditCard },
    { id: 'marketing', labelAr: 'الإعلانات والكوبونات', labelEn: 'Marketing', icon: Megaphone },
    { id: 'support', labelAr: 'الدعم والبلاغات', labelEn: 'Support Desk', icon: LifeBuoy },
    { id: 'reports', labelAr: 'التقارير و CSV', labelEn: 'Reports & CSV', icon: BarChart3 },
    { id: 'settings', labelAr: 'إعدادات المنصة', labelEn: 'Platform Settings', icon: Settings },
    { id: 'security', labelAr: 'الأمان وسجل التدقيق', labelEn: 'Security & Audit', icon: Shield },
  ];

  const allowedSet = new Set(status.permissions);
  const visibleNavItems = navItems.filter(
    (item) => status.role === 'super_admin' || allowedSet.has(item.id)
  );

  const resolvedSection = visibleNavItems.some((i) => i.id === activeSection)
    ? activeSection
    : visibleNavItems[0]?.id || 'dashboard';

  return (
    <div className="min-h-screen flex overflow-x-hidden bg-[#F1F5F9] dark:bg-[#060B14] text-[#0F172A] dark:text-[#F8FAFC]">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Executive Slate-Navy Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 start-0 z-50 w-72 bg-[#0B1220] text-slate-200 border-e border-slate-800 flex-col transition-transform ${
          sidebarOpen ? 'flex' : 'hidden lg:flex'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FindItLogo variant="icon" size="sm" />
            <div>
              <span className="text-sm font-extrabold text-white block leading-tight">
                FindIt QR
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#19B5A5]">
                {status.role === 'super_admin' ? 'SUPER ADMIN CONSOLE' : 'STAFF ADMIN'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = resolvedSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  active
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{lang === 'ar' ? item.labelAr : item.labelEn}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2 text-xs">
          <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800">
            <p className="font-bold text-white truncate">{authUser?.displayName}</p>
            <p className="font-mono text-[11px] text-slate-400 truncate" dir="ltr">
              {authUser?.email}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="py-2 px-2 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 font-semibold flex items-center justify-center gap-1"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#19B5A5]" />
              <span>{lang === 'ar' ? 'الموقع' : 'Site'}</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                await logoutUser();
                await loadBootstrapStatus();
              }}
              className="py-2 px-2 rounded-xl border border-red-900/60 text-red-400 hover:bg-red-950/40 font-bold flex items-center justify-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'خروج' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Executive Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-[#19B5A5] font-bold">
              /admin
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleRequireReauth()}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                status.reauthActive
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {status.reauthActive
                  ? lang === 'ar'
                    ? 'التحقق مفعل'
                    : 'Re-Auth Active'
                  : lang === 'ar'
                  ? 'فتح العمليات الحساسة'
                  : 'Unlock Sensitive Actions'}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{lang === 'ar' ? 'EN' : 'العربية'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setWorkspaceTheme(workspaceTheme === 'dark' ? 'light' : 'dark')
              }
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              {workspaceTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {resolvedSection === 'dashboard' && (
            <AdminDashboardView
              onJumpSection={(sec) => setActiveSection(sec as AdminPermissionKey)}
            />
          )}
          {resolvedSection === 'users' && (
            <AdminUsersView onRequireReauth={handleRequireReauth} />
          )}
          {resolvedSection === 'items' && (
            <AdminItemsView onRequireReauth={handleRequireReauth} />
          )}
          {resolvedSection === 'templates' && (
            <AdminTemplatesView onRequireReauth={handleRequireReauth} />
          )}
          {resolvedSection === 'licenses' && <AdminLicensesView />}
          {resolvedSection === 'plans' && (
            <AdminPlansView onRequireReauth={handleRequireReauth} />
          )}
          {resolvedSection === 'finance' && (
            <AdminFinanceView onRequireReauth={handleRequireReauth} />
          )}
          {resolvedSection === 'marketing' && <AdminMarketingView />}
          {resolvedSection === 'support' && <AdminSupportView />}
          {resolvedSection === 'reports' && <AdminReportsView />}
          {resolvedSection === 'settings' && (
            <AdminSettingsView onRequireReauth={handleRequireReauth} />
          )}
          {resolvedSection === 'security' && (
            <AdminSecurityView
              onRequireReauth={handleRequireReauth}
              currentRole={status.role || 'user'}
            />
          )}
        </main>
      </div>

      <AdminReauthModal
        isOpen={reauthOpen}
        onClose={() => {
          setReauthOpen(false);
          setPendingRetry(null);
        }}
        onSuccess={async () => {
          await loadBootstrapStatus();
          if (pendingRetry) {
            const fn = pendingRetry;
            setPendingRetry(null);
            await fn();
          }
        }}
      />
    </div>
  );
};
