export function isMobileShell(path, marker, userAgent) {
  const ua = userAgent || '';
  // The Careers entry can precede the login cookie on either platform.
  const appleWebView = /AppleWebKit\//i.test(ua) && /iPhone|iPad|iPod|Macintosh/i.test(ua) &&
    !/Safari\/|CriOS\/|FxiOS\/|EdgiOS\/|Chrome\//i.test(ua);
  return path.replace(/\/$/, '') === '/login/mobile' || marker === '1' || /;\s*wv\)/i.test(ua) || appleWebView;
}

export function mobileStaffDestination(path) {
  const clean = path.replace(/\/$/, '');
  if (clean !== '/admin' && !clean.startsWith('/admin/')) return null;
  if (clean === '/admin') return '/staff-workspace';
  const view = clean.slice('/admin/'.length);
  if (['listings', 'catalogue', 'horeca', 'procurement', 'collections'].includes(view)) {
    return '/staff-workspace?view=' + view;
  }
  const record = /^content\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(view);
  return record ? '/staff-workspace?record=' + record[1] : '/staff-workspace?view=website';
}
