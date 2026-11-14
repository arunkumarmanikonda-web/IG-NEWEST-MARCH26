import Mailbox from './workspace';
import {companyMailboxConfig, mailboxContext, mailboxRpc, openMailbox} from '../../../lib/mailbox-server';

export default async function Page() {
  const c = await mailboxContext();
  const [config, data] = await Promise.all([
    companyMailboxConfig().catch(() => null),
    mailboxRpc(c.client, {action:'dashboard'}),
  ]);
  return <Mailbox
    enabled={Boolean(config?.enabled)}
    settingsUnavailable={!config}
    canConfigure={c.profile.roles.includes('owner')}
    email={c.user.email}
    connection={data.connection}
    messages={(data.messages || []).map(m => ({
      ...m, message:openMailbox(c.user.id, m.sealed), sealed:undefined, payload_hash:undefined,
    }))}
  />;
}
