import { HttpError } from './http.mjs';

// Restrict verification to the two customer-facing email flows. Never accept
// arbitrary Supabase OTP types or client-provided redirect destinations.
export function emailVerification(input) {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || email.length > 254)
    throw new HttpError('Enter a valid email address');
  if (!['email', 'recovery'].includes(input.purpose))
    throw new HttpError('Unsupported verification purpose');
  const token = typeof input.token === 'string' ? input.token.trim() : '';
  if (!/^\d{6,10}$/.test(token)) throw new HttpError('Enter the verification code from your email');
  return { email, token, type: input.purpose };
}

export async function verifyEmailCode(auth, input) {
  const { data, error } = await auth.verifyOtp(emailVerification(input));
  if (error || !data?.session || !data?.user?.email_confirmed_at)
    throw new HttpError('This code is invalid or has expired. Request a new code and try again.', 401);
  return { ok: true, next: input.purpose === 'recovery' ? '/account/security' : '/account' };
}
