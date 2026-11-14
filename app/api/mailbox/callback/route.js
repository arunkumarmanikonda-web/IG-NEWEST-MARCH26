import {cookies} from 'next/headers';
import {createHash, timingSafeEqual} from 'node:crypto';
import {mailboxContext, mailboxRpc, openMailbox, sealMailbox, googleRequest, gmail, grantedScopes, companyMailboxConfig} from '../../../../lib/mailbox-server';

const noStore = {'Cache-Control':'no-store'};

async function finishConnection(request, jar, c, cfg) {
  const params = new URL(request.url).searchParams;
  let stage = 'session_expired';
  try {
    const saved = openMailbox(c.user.id, JSON.parse(jar.get('ig_google_connect')?.value || '{}'));
    const state = Buffer.from(params.get('state') || '');
    const expected = Buffer.from(saved.state || '');
    if (!expected.length || expected.length !== state.length || !timingSafeEqual(state,expected) ||
        saved.userId !== c.user.id || saved.expires < Date.now()) return stage;
    await mailboxRpc(c.client,{action:'consume',state_hash:createHash('sha256').update(state).digest('hex')});

    if (params.has('error')) return params.get('error') === 'access_denied' ? 'access_denied' : 'connection_failed';
    stage = 'token_exchange_failed';
    const code = params.get('code');
    if (!code || code.length > 4096) return stage;
    const token = await googleRequest('https://oauth2.googleapis.com/token',{
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({client_id:cfg.clientId,client_secret:cfg.clientSecret,redirect_uri:cfg.redirect,
        grant_type:'authorization_code',code,code_verifier:saved.verifier}),
    });
    if (!token.access_token) return stage;
    if (!grantedScopes(token.scope)) return 'permissions_missing';
    if (!token.refresh_token) return 'offline_access_missing';

    stage = 'profile_failed';
    const profile = await gmail(token,'profile');
    if (!profile.emailAddress) return stage;
    if (profile.emailAddress.toLowerCase() !== c.user.email.toLowerCase()) return 'email_mismatch';

    stage = 'save_failed';
    await mailboxRpc(c.client,{action:'connect',email:profile.emailAddress,sealed:sealMailbox(c.user.id,{
      access_token:token.access_token,refresh_token:token.refresh_token,
      expires_at:Date.now()+Number(token.expires_in || 3600)*1000,
    })});
    return 'connected';
  } catch (error) {
    if (stage === 'token_exchange_failed' && error.googleCode === 'invalid_client') return 'invalid_client';
    if (stage === 'profile_failed' && error.googleCode === 'gmail_api_disabled') return 'gmail_api_disabled';
    return stage;
  }
}

export async function GET(request) {
  let context, config;
  try {context=await mailboxContext();}
  catch {return new Response('Sign in to your staff mailbox to reconnect.',{status:403,headers:noStore});}
  try {config=await companyMailboxConfig();}
  catch {return new Response('Mailbox settings are temporarily unavailable.',{status:503,headers:noStore});}
  if (!config.enabled) return new Response('Mailbox integration is not configured',{status:503,headers:noStore});
  const jar = await cookies();
  const status = await finishConnection(request,jar,context,config);
  jar.delete({name:'ig_google_connect',path:'/api/mailbox/callback'});
  return new Response(null,{status:303,headers:{...noStore,Location:config.origin+'/admin/mailbox?status='+status}});
}
