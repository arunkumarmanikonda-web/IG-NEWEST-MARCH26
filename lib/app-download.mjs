// The app handles exports while the authenticated workspace is still open.
export function offerAppFile(blob, name) {
  const event = new CustomEvent('ig-open-file', {cancelable: true, detail: {blob, name}});
  if (!window.dispatchEvent(event)) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export function appFileLink(href, origin) {
  const url = new URL(href, origin);
  if (url.origin !== origin) return false;
  return /\.(?:pdf|xlsx|docx|pptx|zip|csv)$/i.test(url.pathname) ||
    /^\/api\/admin\/(?:careers\/resume|intelligence\/report)$/.test(url.pathname) ||
    (/^\/api\/admin\/brand-catalogue\/[^/]+\/source$/.test(url.pathname) && !url.searchParams.has('page')) ||
    (url.pathname === '/api/data-room/file' && url.searchParams.get('mode') === 'download');
}
