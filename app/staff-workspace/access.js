import { redirect } from 'next/navigation';
import { accountContext } from '../../lib/supabase/server';
import { isStaff } from '../../lib/sign-in.mjs';

export async function mobileStaffContext() {
  const context = await accountContext();
  const { user, profile, policiesAccepted, staffVerified } = context;
  if (!user || !profile) redirect('/login');
  if (profile.status !== 'active' || !policiesAccepted || !isStaff(profile)) redirect('/account');
  if (profile.must_change_password) redirect('/account/security');
  if (!staffVerified) redirect('/login/verify');
  return context;
}
