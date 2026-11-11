// Supabase's `totp` collection includes only verified factors. Pending setup
// must use `all` so it can be resumed after a password change or page reload.
export function authenticatorFactors(data) {
  return (Array.isArray(data?.all) ? data.all : []).filter(factor =>
    factor.factor_type === 'totp' &&
    ['verified', 'unverified'].includes(factor.status) &&
    typeof factor.id === 'string'
  ).map(({ id, friendly_name, status }) => ({ id, friendly_name, status }));
}
