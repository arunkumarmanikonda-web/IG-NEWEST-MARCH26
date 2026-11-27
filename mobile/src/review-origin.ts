/** Build configuration only. Never populate this value from a feed or deep link. */
export function parseReviewOrigin(value: string | undefined): string | null {
  if (value === undefined || value === '') return null;
  const invalid = () => new Error('EXPO_PUBLIC_REVIEW_ORIGIN must be a separate, canonical HTTPS origin without credentials, port, path, query or fragment.');
  if (typeof value !== 'string' || /[\\\s\u0000-\u001f\u007f]/.test(value)) throw invalid();
  let url: URL;
  try { url = new URL(value); } catch { throw invalid(); }
  const labels = url.hostname.split('.');
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
    url.search || url.hash || (value !== url.origin && value !== `${url.origin}/`) ||
    labels.length < 2 || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
    !/[a-z]/.test(labels.at(-1) || '') || url.hostname.endsWith('.localhost') ||
    ['indiagully.com', 'www.indiagully.com'].includes(url.hostname)) throw invalid();
  return url.origin;
}
