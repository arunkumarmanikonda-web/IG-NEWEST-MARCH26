// Production installs this optional module only after its explicit release approval.
export function campaignModuleInstalled(env = process.env) {
  if (env.CAMPAIGNS_INSTALLED === 'false') return false;
  return env.VERCEL_ENV !== 'production' || env.CAMPAIGNS_INSTALLED === 'true';
}
