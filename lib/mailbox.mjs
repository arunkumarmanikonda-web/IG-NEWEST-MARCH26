import {createHash} from 'node:crypto';
export const gmailScopes=['https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.send'];
export function mailboxConfig(env){
 const enabled=env.GOOGLE_MAIL_ENABLED==='true';
 const redirect=env.GOOGLE_OAUTH_REDIRECT_URI||'';
 if(!enabled)return {enabled:false};
 const u=new URL(redirect);
 if(u.protocol!=='https:'||u.pathname!=='/api/mailbox/callback'||u.search||u.hash||!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)throw new Error('Google mailbox configuration is incomplete');
 return {enabled,clientId:env.GOOGLE_CLIENT_ID,clientSecret:env.GOOGLE_CLIENT_SECRET,redirect,origin:u.origin};
}
export function normaliseMessage(p){
 const to=String(p.to||'').trim().toLowerCase(),subject=String(p.subject||'').trim(),text=String(p.text||'').replace(/\r\n/g,'\n');
 if(!/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(to)||to.length>254)throw new Error('Enter one valid recipient email');
 if(!subject||subject.length>180||/[\r\n]/.test(subject))throw new Error('Use a subject of 1–180 characters');
 if(!text.trim()||text.length>30000)throw new Error('Use a message of 1–30,000 characters');
 return {to,subject,text};
}
export function messageHash(p){return createHash('sha256').update(JSON.stringify(normaliseMessage(p))).digest('hex');}
export function mimeMessage(from,p,id){
 const m=normaliseMessage(p);
 if(!/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(from)||!/^[-a-f0-9]{36}$/.test(id))throw new Error('Invalid sender');
 const raw=['From: '+from,'To: '+m.to,'Subject: =?UTF-8?B?'+Buffer.from(m.subject).toString('base64')+'?=','Message-ID: <'+id+'@indiagully.com>','MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',Buffer.from(m.text).toString('base64').match(/.{1,76}/g).join('\r\n')].join('\r\n');
 return Buffer.from(raw).toString('base64url');
}
export function threadView(thread){
 const header=(m,n)=>m.payload?.headers?.find(h=>h.name.toLowerCase()===n)?.value||'';
 const plain=p=>{if(p.mimeType==='text/plain'&&p.body?.data)return Buffer.from(p.body.data,'base64url').toString('utf8').slice(0,40000);for(const child of p.parts||[]){const s=plain(child);if(s)return s;}return '';};
 return {id:thread.id,messages:(thread.messages||[]).slice(-30).map(m=>({id:m.id,from:header(m,'from'),to:header(m,'to'),subject:header(m,'subject'),date:header(m,'date'),text:plain(m.payload||{})||m.snippet||'No plain-text preview available. Open Gmail to view this message.'}))};
}
