// This identifies the navigation capabilities of the native shell. Roles and
// access to records are always checked by the regular account and admin routes.
export const hasInAppNavigation = ua => /(?:^|\s)IndiaGullyApp\/1\.0\.4(?:\s|$)/.test(ua || '');

export function isMobileShell(path, marker, userAgent) {
  const ua = userAgent || '';
  // The Careers entry can precede the login cookie on either platform.
  const appleWebView = /AppleWebKit\//i.test(ua) && /iPhone|iPad|iPod|Macintosh/i.test(ua) &&
    !/Safari\/|CriOS\/|FxiOS\/|EdgiOS\/|Chrome\//i.test(ua);
  return hasInAppNavigation(ua) || path.replace(/\/$/, '') === '/login/mobile' || marker === '1' || /;\s*wv\)/i.test(ua) || appleWebView;
}

export function mobileStaffDestination(path, fullDashboard = false) {
  const clean = path.replace(/\/$/, '');
  if (clean !== '/admin' && !clean.startsWith('/admin/')) return null;
  if (fullDashboard) {
    if (clean === '/admin/payments' || clean === '/admin/collections') return '/staff-workspace?view=collections';
    return null;
  }
  if (clean === '/admin') return '/staff-workspace';
  const view = clean.slice('/admin/'.length);
  if (['listings', 'catalogue', 'horeca', 'procurement', 'collections'].includes(view)) {
    return '/staff-workspace?view=' + view;
  }
  const record = /^content\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(view);
  return record ? '/staff-workspace?record=' + record[1] : '/staff-workspace?view=website';
}
