// Server callers supply the environment explicitly. Never pass its values to a client component.
const bindings = Object.freeze({
  resend: { api_key: 'RESEND_API_KEY', webhook_secret: 'RESEND_WEBHOOK_SECRET' },
  openai: {api_key:'OPENAI_API_KEY'},
  runway: {api_key:'RUNWAYML_API_SECRET'},
  fast2sms: {api_key:'FAST2SMS_API_KEY'},
});
export function providerCredentials(id, stored = {}, env = {}) {
  const base = Object.fromEntries(Object.entries(bindings[id] || {})
    .filter(([, name]) => typeof env[name] === 'string' && env[name])
    .map(([field, name]) => [field, env[name]]));
  return { ...base, ...stored };
}
export function providerCredentialPresence(id, env = {}) {
  return Object.keys(providerCredentials(id, {}, env));
}
