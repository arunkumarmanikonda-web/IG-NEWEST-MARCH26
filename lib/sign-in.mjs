import { HttpError } from './http.mjs';

const staffRoles = new Set(['owner', 'administrator', 'publisher', 'editor', 'property_manager', 'procurement_manager', 'marketing_manager', 'sales', 'auditor']);
export function isStaff(profile) {
  return Array.isArray(profile?.roles) && profile.roles.some(role => staffRoles.has(role));
}
// These flags come only from the authenticated database RPC, never form input.
export function accountDestination(profile, status = {}) {
  if (profile?.status !== 'active' || !status.accepted) return '/account';
  if (profile.must_change_password) return '/account/security';
  if ((isStaff(profile) || status.pending_invitation) && !status.verified) return '/login/verify';
  return isStaff(profile) ? '/admin' : '/account';
}
export async function finishSignIn(client) {
  const { data: identity, error: identityError } = await client.auth.getUser();
  if (identityError || !identity?.user?.email_confirmed_at) throw new HttpError('Verify your email to continue.', 401);
  const { data: profile, error } = await client.from('ig_profiles').select('status,roles,policy_version,must_change_password').eq('id', identity.user.id).maybeSingle();
  if (error || !profile) throw new HttpError('Your account could not be loaded. Please try again.', 503);
  const { data: status, error: statusError } = await client.rpc('ig_signin_status');
  if (statusError || !status) throw new HttpError('Your sign-in could not be verified. Please try again.', 503);
  let next = accountDestination(profile, status);
  if (profile.status === 'active' && status.accepted && status.verified && !profile.must_change_password && status.pending_invitation && !isStaff(profile)) {
    const invitation = await client.rpc('ig_accept_invitation');
    if (invitation.error) throw new HttpError('Your staff invitation could not be completed. Please try again.', 503);
    if (invitation.data?.accepted) next = '/admin';
  }
  if (next === '/admin') {
    const { error: accessError } = await client.rpc('ig_admin_overview');
    if (accessError) throw new HttpError('Your workspace is temporarily unavailable. Please try again.', 503);
  }
  return { ok: true, next };
}
