import React from 'react';
import { Loader2 } from 'lucide-react';
import { GlobalToastAndModals } from './components/common/UiPrimitives';
import { PublicLayout } from './components/layout/PublicLayout';
import { WorkspaceLayout } from './components/layout/WorkspaceLayout';
import { AppProvider, isWorkspaceRoute, useApp } from './context/AppContext';
import {
  AboutPage,
  ContactPage,
  FaqPage,
  FoundItemPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
} from './pages/public/CompanyAndAuthPages';
import { HomePage } from './pages/public/HomePage';
import {
  DesignDetailsPage,
  DesignStorePage,
  FeaturesPage,
  HowItWorksPage,
  PricingPage,
  UseCasesPage,
} from './pages/public/ProductMarketingPages';
import { AdminPortal } from './pages/admin/AdminPortal';
import {
  NotificationsPage,
  PlansWorkspacePage,
  ProfilePage,
  SettingsPage,
} from './pages/workspace/AlertsAndAccountPages';
import {
  AnalyticsPage,
  ContactMethodsPage,
  WorkspacePrivacySecurityPage,
} from './pages/workspace/AnalyticsAndContactsPages';
import {
  AddItemPage,
  DashboardPage,
  ItemDetailsPage,
  MyItemsPage,
} from './pages/workspace/DashboardAndItemsPages';
import {
  GroupDetailsPage,
  GroupsHubPage,
} from './pages/workspace/GroupsHubAndDetailsPages';
import {
  PrintStudioPage,
  WorkspaceTemplateDetailsPage,
} from './pages/workspace/PrintStudioPage';
import {
  DesignLibraryPage,
  MyPurchasesPage,
  QrManagerPage,
  QrPreviewPage,
} from './pages/workspace/QrAndDesignsPages';
import {
  SupportCenterPage,
  SupportTicketsPage,
  WorkspaceFaqPage,
} from './pages/workspace/SupportWorkspacePages';
import { SharedQrRecoveryPage } from './pages/public/SharedQrRecoveryPage';
import { PrivacySecurityPage } from './pages/public/PrivacySecurityPage';

const AppRouter: React.FC = () => {
  const { currentRoute, authUser, isAuthReady, lang } = useApp();
  const isWorkspace = isWorkspaceRoute(currentRoute);

  if (currentRoute === 'admin') {
    return <AdminPortal />;
  }

  if (!isAuthReady && isWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F8FA] dark:bg-[#0B1320] text-[#0B1320] dark:text-white">
        <div className="flex items-center gap-3 text-sm font-bold">
          <Loader2 className="w-5 h-5 text-[#0F9D8E] animate-spin" />
          <span>
            {lang === 'ar'
              ? 'جاري التحقق من جلسة المصادقة...'
              : 'Verifying authentication session...'}
          </span>
        </div>
      </div>
    );
  }

  // Strict route guard: never render WorkspaceLayout without an authenticated session
  if (isWorkspace && !authUser) {
    return (
      <PublicLayout>
        <LoginPage />
      </PublicLayout>
    );
  }

  if (isWorkspace && authUser) {
    return (
      <WorkspaceLayout>
        {currentRoute === 'dashboard' && <DashboardPage />}
        {currentRoute === 'my-items' && <MyItemsPage />}
        {currentRoute === 'add-item' && <AddItemPage />}
        {currentRoute === 'item-details' && <ItemDetailsPage />}
        {currentRoute === 'groups' && <GroupsHubPage />}
        {currentRoute === 'shared-qr-groups' && <GroupsHubPage defaultTab="shared" />}
        {currentRoute === 'group-details' && <GroupDetailsPage />}
        {currentRoute === 'qr-manager' && <QrManagerPage />}
        {currentRoute === 'qr-preview' && <QrPreviewPage />}
        {currentRoute === 'design-library' && <DesignLibraryPage />}
        {currentRoute === 'template-details' && <WorkspaceTemplateDetailsPage />}
        {currentRoute === 'print-studio' && <PrintStudioPage />}
        {currentRoute === 'analytics' && <AnalyticsPage defaultTab="overview" />}
        {currentRoute === 'activity' && <AnalyticsPage defaultTab="activity" />}
        {currentRoute === 'plans' && <PlansWorkspacePage />}
        {currentRoute === 'my-purchases' && <MyPurchasesPage />}
        {currentRoute === 'contact-methods' && <ContactMethodsPage />}
        {currentRoute === 'notifications' && <NotificationsPage />}
        {currentRoute === 'profile' && <ProfilePage />}
        {currentRoute === 'settings' && <SettingsPage />}
        {currentRoute === 'privacy-security' && <WorkspacePrivacySecurityPage />}
        {currentRoute === 'support' && <SupportCenterPage />}
        {currentRoute === 'support-faq' && <WorkspaceFaqPage />}
        {currentRoute === 'support-tickets' && <SupportTicketsPage />}
      </WorkspaceLayout>
    );
  }

  return (
    <PublicLayout>
      {currentRoute === 'home' && <HomePage />}
      {currentRoute === 'how-it-works' && <HowItWorksPage />}
      {currentRoute === 'features' && <FeaturesPage />}
      {currentRoute === 'use-cases' && <UseCasesPage />}
      {currentRoute === 'pricing' && <PricingPage />}
      {currentRoute === 'privacy' && <PrivacySecurityPage />}
      {currentRoute === 'design-store' && <DesignStorePage />}
      {currentRoute === 'design-details' && <DesignDetailsPage />}
      {currentRoute === 'about' && <AboutPage />}
      {currentRoute === 'faq' && <FaqPage />}
      {currentRoute === 'contact' && <ContactPage />}
      {currentRoute === 'login' && <LoginPage />}
      {currentRoute === 'register' && <RegisterPage />}
      {currentRoute === 'reset-password' && <ResetPasswordPage />}
      {currentRoute === 'found-item' && <FoundItemPage />}
      {currentRoute === 'shared-qr' && <SharedQrRecoveryPage />}
    </PublicLayout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
      <GlobalToastAndModals />
    </AppProvider>
  );
}
