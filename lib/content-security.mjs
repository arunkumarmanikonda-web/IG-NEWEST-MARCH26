export function contentSecurityPolicy(nonce,{development=false,supabaseUrl=''}={}) {
  let storage='';
  try { storage=new URL(supabaseUrl).origin; } catch {}
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development?" 'unsafe-eval'":''}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${storage} https://api.razorpay.com https://lumberjack.razorpay.com${development?' ws:':''}`,
    `img-src 'self' data: blob: ${storage} https://*.razorpay.com`,
    "font-src 'self' data:", "object-src 'none'", "base-uri 'self'",
    "form-action 'self'", "frame-ancestors 'none'",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.google.com https://maps.google.com",
    "worker-src 'self' blob:", ...(development?[]:['upgrade-insecure-requests']),
  ].join('; ');
}
