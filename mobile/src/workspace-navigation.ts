import { ORIGIN } from './domain.ts';

export const STAFF_APP_ENTRY_URL = `${ORIGIN}/login/mobile`;
export const CLIENT_APP_ENTRY_URL = `${ORIGIN}/login/mobile?audience=client`;
export const CAREERS_APP_URL = `${ORIGIN}/careers`;
export type WebsiteMode = 'staff' | 'client' | 'careers';

// Entry URLs are built into the app, never supplied by catalogue content.
export function websiteEntry(mode: WebsiteMode) {
  if (mode === 'client') return { url: CLIENT_APP_ENTRY_URL, title: 'Client account', label: 'client account', caption: 'Client access', previewAction: 'Open client sign-in' };
  if (mode === 'careers') return { url: CAREERS_APP_URL, title: 'Careers', label: 'careers', caption: 'Careers at India Gully', previewAction: 'Open careers' };
  return { url: STAFF_APP_ENTRY_URL, title: 'Staff workspace', label: 'staff workspace', caption: 'Staff access', previewAction: 'Open staff sign-in' };
}
export type WorkspaceTarget =
  | { kind: 'internal'; url: string }
  | { kind: 'external'; url: string; host: string }
  | { kind: 'mailbox'; url: string }
  | { kind: 'export' }
  | { kind: 'blocked' };

// Evaluate every document navigation and popup. Never inherit the public feed's
// links, accept a credential-bearing URL, or let the WebView launch an intent.
export function workspaceTarget(value: string): WorkspaceTarget {
  if (typeof value !== 'string' || value.length > 16_384 || /[\u0000-\u0020\u007f]/.test(value)) return { kind: 'blocked' };
  if (value.startsWith(`blob:${ORIGIN}/`)) return { kind: 'export' };
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return { kind: 'blocked' };
    if (url.origin === ORIGIN) return { kind: 'internal', url: url.href };
    // A Google mailbox consent URL carries state tied to the WebView cookie.
    // Start the complete connection in the browser instead of forwarding it.
    if (url.hostname === 'accounts.google.com') return { kind: 'mailbox', url: `${ORIGIN}/admin/mailbox` };
    return { kind: 'external', url: url.href, host: url.hostname };
  } catch { return { kind: 'blocked' }; }
}

export function workspaceBrowserPage(value: string, mode: WebsiteMode = 'staff'): string {
  const fallback = `${ORIGIN}/${mode === 'staff' ? 'admin' : mode === 'client' ? 'account' : 'careers'}`;
  const target = workspaceTarget(value);
  if (target.kind !== 'internal') return fallback;
  const url = new URL(target.url);
  // Do not pass private API requests or auth callbacks to a different session.
  const allowed = mode === 'staff' ? /^\/(admin|account)(\/|$)/ : mode === 'client' ? /^\/account(\/|$)/ : /^\/careers(\/|$)/;
  if ([...url.searchParams.keys()].some(key => /token|code|secret|callback|state|redirect|return|next/i.test(key))) return fallback;
  return allowed.test(url.pathname) ? url.href : fallback;
}
