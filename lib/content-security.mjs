export function contentSecurityPolicy(nonce,{development=false,supabaseUrl='',mobile=false}={}) {
  let storage='';
  try { storage=new URL(supabaseUrl).origin; } catch {}
  const paymentConnections = mobile ? '' : ' https://api.razorpay.com https://lumberjack.razorpay.com';
  const paymentImages = mobile ? '' : ' https://*.razorpay.com';
  const paymentFrames = mobile ? '' : ' https://api.razorpay.com https://checkout.razorpay.com';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development?" 'unsafe-eval'":''}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${storage}${paymentConnections}${development?' ws:':''}`,
    `img-src 'self' data: blob: ${storage}${paymentImages}`,
    "font-src 'self' data:", "object-src 'none'", "base-uri 'self'",
    "form-action 'self'", "frame-ancestors 'none'",
    `frame-src 'self'${paymentFrames} https://www.google.com https://maps.google.com`,
    "worker-src 'self' blob:", ...(development?[]:['upgrade-insecure-requests']),
  ].join('; ');
}
