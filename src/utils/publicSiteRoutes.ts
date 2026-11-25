import { RouteId, ThemeMode, WorkspacePageId } from '../types/domain';

export const WORKSPACE_ROUTE_SET: ReadonlySet<string> = new Set<WorkspacePageId>([
  'dashboard',
  'my-items',
  'add-item',
  'item-details',
  'groups',
  'group-details',
  'qr-manager',
  'qr-preview',
  'shared-qr-groups',
  'design-library',
  'template-details',
  'print-studio',
  'analytics',
  'my-purchases',
  'contact-methods',
  'notifications',
  'activity',
  'profile',
  'settings',
  'privacy-security',
  'plans',
  'support',
  'support-faq',
  'support-tickets',
]);

export const PUBLIC_MARKETING_ROUTES: readonly RouteId[] = [
  'home',
  'about',
  'how-it-works',
  'features',
  'design-store',
  'pricing',
  'privacy',
  'faq',
  'contact',
] as const;

export function isWorkspaceRoutePath(route: RouteId): boolean {
  return WORKSPACE_ROUTE_SET.has(route);
}

export interface ParsedUrlRouteState {
  route: RouteId;
  codeSerial: string;
  sharedCode: string;
  itemId: string;
  groupId: string;
  groupType: 'org' | 'shared';
  designId: string;
  tab: string;
}

/**
 * Pure URL parser for all public marketing pages, legacy aliases, finder recovery routes,
 * shared QR routes, all 21 workspace routes, and admin portal.
 */
export function parsePublicAndAppPathname(
  pathname: string,
  search = ''
): ParsedUrlRouteState {
  const params = new URLSearchParams(search);
  const codeParam = params.get('code') || '';
  const sharedParam = params.get('share') || '';
  const itemParam = params.get('itemId') || '';
  const groupParam = params.get('groupId') || '';
  const rawGroupType = params.get('groupType');
  const groupType: 'org' | 'shared' = rawGroupType === 'shared' ? 'shared' : 'org';
  const designParam = params.get('designId') || '';
  const tabParam = params.get('tab') || '';
  const routeParam = params.get('page') as RouteId | null;

  const base = {
    codeSerial: codeParam,
    sharedCode: sharedParam,
    itemId: itemParam,
    groupId: groupParam,
    groupType,
    designId: designParam,
    tab: tabParam,
  };

  if (routeParam) {
    return {
      ...base,
      route: routeParam,
    };
  }

  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  if (cleanPath === '' || cleanPath === 'home') {
    return { ...base, route: 'home', sharedCode: '' };
  }
  if (cleanPath === 'admin' || cleanPath.startsWith('admin/')) {
    return { ...base, route: 'admin' };
  }
  if (cleanPath.startsWith('shared/')) {
    const shareCode = decodeURIComponent(cleanPath.slice(7));
    return { ...base, route: 'shared-qr', sharedCode: shareCode };
  }
  if (cleanPath === 'shared-qr') {
    return { ...base, route: 'shared-qr' };
  }
  if (cleanPath.startsWith('found/')) {
    const code = decodeURIComponent(cleanPath.slice(6));
    return { ...base, route: 'found-item', codeSerial: code, sharedCode: '' };
  }
  if (cleanPath === 'found-item') {
    return { ...base, route: 'found-item', sharedCode: '' };
  }
  if (cleanPath.startsWith('app/')) {
    const subRoute = cleanPath.replace(/^app\//, '') as RouteId;
    if (WORKSPACE_ROUTE_SET.has(subRoute)) {
      return { ...base, route: subRoute };
    }
    // Helpful aliases inside /app/*
    if (subRoute === ('templates' as unknown as RouteId)) {
      return { ...base, route: 'design-library' };
    }
    if (subRoute === ('subscriptions' as unknown as RouteId)) {
      return { ...base, route: 'plans' };
    }
    if (subRoute === ('tickets' as unknown as RouteId)) {
      return { ...base, route: 'support-tickets' };
    }
  }
  // Canonical Template Library URL (/library) + backward-compatible aliases (/designs, /design-store)
  if (cleanPath === 'library' || cleanPath === 'designs' || cleanPath === 'design-store') {
    return { ...base, route: 'design-store', sharedCode: '' };
  }
  if (
    cleanPath === 'login' ||
    cleanPath === 'register' ||
    cleanPath === 'reset-password' ||
    cleanPath === 'pricing' ||
    cleanPath === 'privacy' ||
    cleanPath === 'design-details' ||
    cleanPath === 'features' ||
    cleanPath === 'how-it-works' ||
    cleanPath === 'use-cases' ||
    cleanPath === 'faq' ||
    cleanPath === 'about' ||
    cleanPath === 'contact'
  ) {
    return { ...base, route: cleanPath, sharedCode: '' };
  }
  return { ...base, route: 'home', sharedCode: '' };
}

/**
 * Builds the canonical URL path for history.pushState.
 * Maps 'design-store' cleanly to '/library', 'privacy' to '/privacy', and preserves workspace query params.
 */
export function buildCanonicalRoutePath(
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
  if (route === 'home') return '/';
  if (route === 'admin') return '/admin';
  if (route === 'design-store') return '/library';
  if (route === 'design-details') {
    const q = params?.designId ? `?designId=${encodeURIComponent(params.designId)}` : '';
    return `/design-details${q}`;
  }
  if (route === 'shared-qr') {
    if (params?.sharedCode) {
      return `/shared/${encodeURIComponent(params.sharedCode)}`;
    }
    return '/shared-qr';
  }
  if (route === 'found-item') {
    if (params?.codeSerial) {
      return `/found/${encodeURIComponent(params.codeSerial)}`;
    }
    return '/found-item';
  }
  if (isWorkspaceRoutePath(route)) {
    const sp = new URLSearchParams();
    if (params?.itemId) sp.set('itemId', params.itemId);
    if (params?.groupId) sp.set('groupId', params.groupId);
    if (params?.groupType) sp.set('groupType', params.groupType);
    if (params?.designId) sp.set('designId', params.designId);
    if (params?.tab) sp.set('tab', params.tab);
    const qs = sp.toString();
    return `/app/${route}${qs ? `?${qs}` : ''}`;
  }
  return `/${route}`;
}

/**
 * Light Mode is strictly the default on first visit (when no saved user choice exists).
 */
export function resolveInitialPublicTheme(savedTheme: string | null | undefined): ThemeMode {
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }
  return 'light';
}

/**
 * Guards against showing unconfigured placeholder phone numbers (e.g., +966 55 000 0000)
 * on Support & Contact views.
 */
export function isRealConfiguredPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return false;
  if (/0{6,}/.test(digits)) return false;
  return true;
}
