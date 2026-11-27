import { ORIGIN, canonicalUrl } from './domain.ts';
import { parseReviewOrigin } from './review-origin.ts';

// Expo replaces this exact property access at bundle time. It is public build
// configuration, not a credential and never a remote-configured destination.
export const REVIEW_ORIGIN = parseReviewOrigin(process.env.EXPO_PUBLIC_REVIEW_ORIGIN);

export const STAFF_APP_ENTRY_URL = `${ORIGIN}/login/mobile`;
export const CLIENT_APP_ENTRY_URL = `${ORIGIN}/login/mobile?audience=client`;
export const CAREERS_APP_URL = `${ORIGIN}/careers`;
export type WebsiteMode = 'staff' | 'client' | 'careers' | 'gullu' | 'public' | 'demo-staff' | 'demo-client';

// Entry URLs are built into the app, never supplied by catalogue content.
export function websiteEntry(mode: WebsiteMode, reviewOrigin: string | null = REVIEW_ORIGIN, publicUrl?: string) {
  const demo = mode === 'demo-client' || mode === 'demo-staff';
  const origin = demo ? parseReviewOrigin(reviewOrigin ?? undefined) : ORIGIN;
  if (!origin) throw new Error('Demo workspaces are not configured in this build.');
  const surface = mode === 'demo-client' ? 'client' : mode === 'demo-staff' ? 'staff' : mode;
  const common = { origin, host: new URL(origin).host, demo, surface };
  if (surface === 'public') return { ...common, url: canonicalUrl(publicUrl) || ORIGIN, title: 'India Gully', label: 'page', caption: 'India Gully', previewAction: 'Open page' };
  if (surface === 'client') return { ...common, url: `${origin}/login/mobile?audience=client`, title: demo ? 'Demo client account' : 'Client account', label: demo ? 'demo client account' : 'client account', caption: demo ? 'Demo client access' : 'Client access', previewAction: demo ? 'Open demo client sign-in' : 'Open client sign-in' };
  if (surface === 'gullu') return { ...common, url: `${origin}/gullu/app`, title: 'Gullu', label: 'Gullu', caption: 'Your India Gully buddy', previewAction: 'Open Gullu' };
  if (surface === 'careers') return { ...common, url: CAREERS_APP_URL, title: 'Careers', label: 'careers', caption: 'Careers at India Gully', previewAction: 'Open careers' };
  return { ...common, url: `${origin}/login/mobile`, title: demo ? 'Demo staff workspace' : 'Staff workspace', label: demo ? 'demo staff workspace' : 'staff workspace', caption: demo ? 'Demo staff access' : 'Staff access', previewAction: demo ? 'Open demo staff sign-in' : 'Open staff sign-in' };
}
export type WorkspaceTarget =
  | { kind: 'internal'; url: string }
  | { kind: 'external'; url: string; host: string }
  | { kind: 'mailbox'; url: string }
  | { kind: 'export' }
  | { kind: 'blocked' };

// Evaluate every document navigation and popup. Never inherit the public feed's
// links, accept a credential-bearing URL, or let the WebView launch an intent.
export function workspaceTarget(value: string, mode: WebsiteMode = 'staff', reviewOrigin: string | null = REVIEW_ORIGIN): WorkspaceTarget {
  const entry = websiteEntry(mode, reviewOrigin);
  if (typeof value !== 'string' || value.length > 16_384 || /[\\\u0000-\u0020\u007f]/.test(value)) return { kind: 'blocked' };
  if (value.startsWith(`blob:${entry.origin}/`)) return { kind: 'export' };
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return { kind: 'blocked' };
    if (url.origin === entry.origin) return { kind: 'internal', url: url.href };
    // Moving between production and demo must start from a deliberate app entry,
    // never a page, redirect, popup, export, or OAuth browser fallback.
    if (url.origin === ORIGIN || url.origin === parseReviewOrigin(reviewOrigin ?? undefined)) return { kind: 'blocked' };
    // A Google mailbox consent URL carries state tied to the WebView cookie.
    // Start the complete connection in the browser instead of forwarding it.
    if (url.hostname === 'accounts.google.com') return { kind: 'mailbox', url: `${entry.origin}/admin/mailbox` };
    return { kind: 'external', url: url.href, host: url.hostname };
  } catch { return { kind: 'blocked' }; }
}
