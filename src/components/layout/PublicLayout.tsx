import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Globe,
  LayoutDashboard,
  Menu,
  Moon,
  QrCode,
  Shield,
  Sun,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PublicPageId, RouteId } from '../../types/domain';
import { FindItLogo } from '../brand/FindItLogo';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    lang,
    toggleLang,
    theme,
    toggleTheme,
    t,
    currentRoute,
    navigate,
    authUser,
    isAdminUser,
    announcements,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [moreMenuOpen]);

  const primaryNavLinks: Array<{ id: PublicPageId; label: string }> = [
    { id: 'home', label: t.nav.home },
    { id: 'how-it-works', label: t.nav.howItWorks },
    { id: 'features', label: t.nav.features },
    { id: 'design-store', label: t.nav.designStore },
    { id: 'pricing', label: t.nav.pricing },
  ];

  const moreNavLinks: Array<{ id: PublicPageId; label: string }> = [
    { id: 'about', label: t.nav.about },
    { id: 'privacy', label: t.nav.privacy },
    { id: 'faq', label: t.nav.faq },
    { id: 'contact', label: t.nav.contact },
    { id: 'found-item', label: t.nav.foundDemoCta },
  ];

  const isMoreRouteActive = moreNavLinks.some((item) => item.id === currentRoute);

  const handleNav = (id: RouteId) => {
    navigate(id);
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-[#F7FAFC] dark:bg-[#070E1A] text-[#0B1320] dark:text-[#F4F7FB] transition-colors duration-200">
      {/* Live Announcements Strip (Admin-Managed) */}
      {announcements
        .filter((a) => a.isActive && a.targetAudience === 'all')
        .slice(0, 1)
        .map((a) => (
          <div
            key={a.id}
            className="bg-[#0B1320] dark:bg-[#0F2438] border-b border-[#19B5A5]/30 text-white text-xs py-2 px-4 text-center font-semibold"
          >
            <strong className="me-2 text-[#2DD4BF]">
              {lang === 'ar' ? a.titleAr : a.titleEn}:
            </strong>
            <span className="text-slate-200">{lang === 'ar' ? a.bodyAr : a.bodyEn}</span>
          </div>
        ))}

      {/* Clean Single-Row Midnight Teal Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A1322]/95 backdrop-blur-md border-b border-slate-200/85 dark:border-slate-800/85">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-16">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19B5A5] rounded-lg whitespace-nowrap shrink-0"
          >
            <FindItLogo variant="full" size="md" />
          </button>

          {/* Zone 2: Clean Single-Line Navigation */}
          <nav
            aria-label={lang === 'ar' ? 'التنقل الرئيسي' : 'Primary Navigation'}
            className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300"
          >
            {primaryNavLinks.map((item) => {
              const isActive =
                currentRoute === item.id ||
                (item.id === 'design-store' && currentRoute === 'design-details');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'text-[#0F9D8E] dark:text-[#2DD4BF] border-[#0F9D8E] dark:border-[#2DD4BF]'
                      : 'border-transparent hover:text-[#0B1320] dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Accessible More Dropdown for Secondary Public Pages */}
            <div ref={moreRef} className="relative">
              <button
                type="button"
                onClick={() => setMoreMenuOpen((prev) => !prev)}
                aria-expanded={moreMenuOpen}
                aria-haspopup="menu"
                className={`inline-flex items-center gap-1 py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isMoreRouteActive
                    ? 'text-[#0F9D8E] dark:text-[#2DD4BF] border-[#0F9D8E] dark:border-[#2DD4BF]'
                    : 'border-transparent hover:text-[#0B1320] dark:hover:text-white'
                }`}
              >
                <span>{lang === 'ar' ? 'المزيد' : 'More'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {moreMenuOpen && (
                <div
                  role="menu"
                  className="absolute top-full mt-2 end-0 w-52 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] shadow-xl shadow-slate-900/10 dark:shadow-black/40 p-1.5 z-50"
                >
                  {moreNavLinks.map((item) => {
                    const isActive = currentRoute === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        onClick={() => handleNav(item.id)}
                        className={`w-full text-start px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-[#19B5A5]/12 text-[#0F9D8E] dark:text-[#2DD4BF]'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Language, Theme & Primary Auth Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleLang}
              data-testid="public-lang-toggle"
              aria-label={
                lang === 'ar' ? 'Switch language to English' : 'تبديل اللغة إلى العربية'
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#111E33] text-xs font-bold text-[#0B1320] dark:text-slate-200 hover:border-[#19B5A5] transition-colors whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-[#0F9D8E] dark:text-[#2DD4BF]" aria-hidden="true" />
              <span>{lang === 'ar' ? 'EN' : 'AR'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              data-testid="public-theme-toggle"
              aria-label={theme === 'light' ? t.common.darkMode : t.common.lightMode}
              title={theme === 'light' ? t.common.darkMode : t.common.lightMode}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#111E33] text-[#0B1320] dark:text-slate-200 hover:border-[#19B5A5] transition-colors shrink-0"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-[#0B1320]" aria-hidden="true" />
              ) : (
                <Sun className="w-4 h-4 text-[#FFD166]" aria-hidden="true" />
              )}
            </button>

            {isAdminUser && (
              <button
                type="button"
                onClick={() => handleNav('admin')}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[#19B5A5]/40 bg-[#19B5A5]/10 text-[#0F9D8E] dark:text-[#2DD4BF] text-xs font-bold transition-colors whitespace-nowrap shrink-0"
              >
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Admin</span>
              </button>
            )}

            {!authUser && (
              <button
                type="button"
                onClick={() => handleNav('login')}
                className="hidden sm:inline-flex items-center px-3.5 py-2 text-xs sm:text-sm font-bold text-[#0B1320] dark:text-slate-200 hover:text-[#0F9D8E] dark:hover:text-[#2DD4BF] transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.login}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNav(authUser ? 'dashboard' : 'register')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] dark:bg-[#19B5A5] dark:hover:bg-[#14A394] text-white dark:text-[#07101D] transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-[#19B5A5]/20"
            >
              {authUser && <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{authUser ? t.nav.workspaceCta : t.nav.register}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={lang === 'ar' ? 'فتح قائمة التنقل' : 'Toggle Navigation Menu'}
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700/80 text-[#0B1320] dark:text-slate-200 hover:border-[#19B5A5]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#0D1829] border-b border-slate-200 dark:border-slate-800 px-4 py-5 space-y-4 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            {[...primaryNavLinks, ...moreNavLinks].map((item) => {
              const isActive =
                currentRoute === item.id ||
                (item.id === 'design-store' && currentRoute === 'design-details');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`px-3.5 py-2.5 rounded-xl text-start text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#0F9D8E] dark:bg-[#19B5A5] text-white dark:text-[#07101D]'
                      : 'bg-slate-100/90 dark:bg-[#142238] text-[#0B1320] dark:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            {authUser ? (
              <button
                type="button"
                onClick={() => handleNav('dashboard')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0F9D8E] dark:bg-[#19B5A5] text-white dark:text-[#07101D] font-extrabold text-sm text-center"
              >
                {t.nav.workspaceCta}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('login')}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-[#0B1320] dark:text-white font-bold text-sm text-center"
                >
                  {t.nav.login}
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('register')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0F9D8E] dark:bg-[#19B5A5] text-white dark:text-[#07101D] font-extrabold text-sm text-center"
                >
                  {t.nav.register}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Unified Midnight Teal Footer Linking All 9 Pages */}
      <footer className="bg-[#07101D] text-slate-300 border-t border-slate-800/90 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/90">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-4">
              <button
                type="button"
                onClick={() => handleNav('home')}
                className="inline-flex items-center gap-3 text-start focus:outline-none"
              >
                <FindItLogo variant="full" size="md" inverted />
              </button>
              <p className="text-sm text-slate-300 max-w-md leading-relaxed">
                {lang === 'ar'
                  ? 'منصة FindIt QR الذكية لربط مقتنياتك الشخصية ومعدات عملك برموز QR قياسية، لتسهيل استرداد المفقودات بسرعة مع تحكم كامل في خصوصية بياناتك.'
                  : 'FindIt QR connects your personal belongings and commercial assets to smart ISO QR recovery tags, accelerating safe returns while keeping your personal data strictly under your control.'}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleNav(authUser ? 'dashboard' : 'register')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#19B5A5] hover:bg-[#14A394] text-[#07101D] text-xs font-extrabold transition-colors whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{authUser ? t.nav.workspaceCta : t.common.createFreeAccount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('found-item')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#2DD4BF]" aria-hidden="true" />
                  <span>{t.common.tryFinderScan}</span>
                </button>
              </div>
            </div>

            {/* Platform Pages */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4">
                {lang === 'ar' ? 'المنصة' : 'Platform'}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('home')}
                    className="hover:text-[#2DD4BF] transition-colors"
                  >
                    {t.nav.home}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('how-it-works')}
                    className="hover:text-[#2DD4BF] transition-colors"
                  >
                    {t.nav.howItWorks}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('features')}
                    className="hover:text-[#2DD4BF] transition-colors"
                  >
                    {t.nav.features}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('design-store')}
                    className="hover:text-[#2DD4BF] transition-colors"
                  >
                    {t.nav.designStore}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('pricing')}
                    className="hover:text-[#2DD4BF] transition-colors"
                  >
                    {t.nav.pricing}
                  </button>
                </li>
              </ul>
            </div>

            {/* Trust, Company & Support */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4">
                {lang === 'ar' ? 'الثقة والدعم' : 'Company & Trust'}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('about')}
                    className="hover:text-[#2DD4BF] transition-colors"
                  >
                    {t.nav.about}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('privacy')}
                    className="hover:text-[#2DD4BF] transition-colors"
                  >
                    {t.nav.privacy}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('faq')}
                    className="hover:text-[#2DD4BF] transition-colors"
                  >
                    {t.nav.faq}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('contact')}
                    className="hover:text-[#2DD4BF] transition-colors"
                  >
                    {t.nav.contact}
                  </button>
                </li>
              </ul>
            </div>

            {/* Account & Workspace */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4">
                {lang === 'ar' ? 'الحساب والتجربة' : 'Account & Access'}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('login')}
                    className="hover:text-[#2DD4BF] transition-colors"
                  >
                    {t.nav.login}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('register')}
                    className="hover:text-[#2DD4BF] transition-colors"
                  >
                    {t.common.createFreeAccount}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('dashboard')}
                    className="hover:text-[#2DD4BF] transition-colors"
                  >
                    {t.nav.workspaceCta}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('found-item')}
                    className="hover:text-[#2DD4BF] transition-colors"
                  >
                    {t.nav.foundDemoCta}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} FindIt QR — Scan. Connect. Return.{' '}
              {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleNav('privacy')}
                className="text-slate-300 hover:text-[#2DD4BF] transition-colors"
              >
                {t.nav.privacy}
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="text-slate-300 hover:text-white font-semibold transition-colors"
              >
                {theme === 'light' ? t.common.darkMode : t.common.lightMode}
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={toggleLang}
                className="text-slate-300 hover:text-white font-semibold transition-colors"
              >
                {t.meta.switchLangLabel}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
