export const mailboxConnectionMessages = Object.freeze({
  connected: 'Your Google mailbox is connected.',
  email_mismatch: 'Choose the Google mailbox matching your verified staff email.',
  access_denied: 'Google did not grant mailbox access. Check that the staff account is allowed, then reconnect.',
  permissions_missing: 'Google did not grant both Gmail permissions. Reconnect and select both viewing mail and sending mail.',
  session_expired: 'This connection request expired or was already used. Start a fresh connection in this browser.',
  invalid_client: 'Google rejected the client credentials. The owner can check the Client ID and matching secret in Google Workspace mail settings.',
  offline_access_missing: 'Google did not issue offline access. Review the existing grant in Google Account connections before reconnecting.',
  gmail_api_disabled: 'Google reports that the Gmail API is disabled for this OAuth project. Enable the Gmail API in the same Google Cloud project as the saved Client ID, then reconnect.',
  token_exchange_failed: 'Google could not exchange the authorisation code. Start a fresh connection.',
  profile_failed: 'Google could not return your Gmail profile. Check that this account has an active Gmail mailbox and the project allows Gmail access.',
  save_failed: 'Your mailbox identity was verified, but India Gully could not save the connection. Please retry.',
  connection_failed: 'The mailbox connection could not be completed. Start a fresh connection.',
});

export function googleMailboxErrorCode(payload) {
  const error = payload?.error;
  if (error === 'invalid_client' || error === 'invalid_grant') return error;
  if (error?.details?.some?.(item => item?.reason === 'SERVICE_DISABLED') ||
      error?.errors?.some?.(item => item?.reason === 'accessNotConfigured')) return 'gmail_api_disabled';
  return undefined;
}
