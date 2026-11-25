import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCanonicalRoutePath,
  isRealConfiguredPhone,
  parsePublicAndAppPathname,
  PUBLIC_MARKETING_ROUTES,
  resolveInitialPublicTheme,
} from './publicSiteRoutes';
import { CANONICAL_PLANS } from '../data/plansCatalog';

test('all 9 requested public marketing routes parse and build cleanly', () => {
  const cases: Array<[string, string, string]> = [
    ['/', 'home', '/'],
    ['/about', 'about', '/about'],
    ['/how-it-works', 'how-it-works', '/how-it-works'],
    ['/features', 'features', '/features'],
    ['/library', 'design-store', '/library'],
    ['/pricing', 'pricing', '/pricing'],
    ['/privacy', 'privacy', '/privacy'],
    ['/faq', 'faq', '/faq'],
    ['/contact', 'contact', '/contact'],
  ];

  assert.equal(PUBLIC_MARKETING_ROUTES.length, 9);

  for (const [pathname, expectedRoute, expectedCanonical] of cases) {
    const parsed = parsePublicAndAppPathname(pathname);
    assert.equal(parsed.route, expectedRoute, `Failed parsing ${pathname}`);
    assert.equal(
      buildCanonicalRoutePath(parsed.route),
      expectedCanonical,
      `Failed canonical URL for ${expectedRoute}`
    );
  }
});

test('legacy library aliases (/designs, /design-store) resolve to design-store without breaking', () => {
  assert.equal(parsePublicAndAppPathname('/designs').route, 'design-store');
  assert.equal(parsePublicAndAppPathname('/design-store').route, 'design-store');
  assert.equal(buildCanonicalRoutePath('design-store'), '/library');
});

test('recovery, shared QR, workspace, and admin routes remain fully intact', () => {
  const found = parsePublicAndAppPathname('/found/FQR-4810-RYD');
  assert.equal(found.route, 'found-item');
  assert.equal(found.codeSerial, 'FQR-4810-RYD');

  const shared = parsePublicAndAppPathname('/shared/SHQ-9912');
  assert.equal(shared.route, 'shared-qr');
  assert.equal(shared.sharedCode, 'SHQ-9912');

  assert.equal(parsePublicAndAppPathname('/app/my-items').route, 'my-items');
  assert.equal(parsePublicAndAppPathname('/admin').route, 'admin');
});

test('Light Mode is strictly the default on first visit and restores saved preference', () => {
  assert.equal(resolveInitialPublicTheme(null), 'light');
  assert.equal(resolveInitialPublicTheme(undefined), 'light');
  assert.equal(resolveInitialPublicTheme(''), 'light');
  assert.equal(resolveInitialPublicTheme('invalid'), 'light');
  assert.equal(resolveInitialPublicTheme('dark'), 'dark');
  assert.equal(resolveInitialPublicTheme('light'), 'light');
});

test('placeholder support phone numbers are suppressed on Contact page', () => {
  assert.equal(isRealConfiguredPhone('+966 55 000 0000'), false);
  assert.equal(isRealConfiguredPhone('000000000'), false);
  assert.equal(isRealConfiguredPhone(''), false);
  assert.equal(isRealConfiguredPhone('+966 55 482 1930'), true);
});

test('canonical plans remain Starter/Plus/Premium/Pro with exact quotas', () => {
  assert.deepEqual(
    CANONICAL_PLANS.map((p) => p.id),
    ['starter', 'plus', 'premium', 'pro']
  );
  assert.deepEqual(
    CANONICAL_PLANS.map((p) => [p.maxActiveItems, p.maxContactMethods]),
    [
      [2, 2],
      [10, 3],
      [25, 5],
      [100, 7],
    ]
  );
});
