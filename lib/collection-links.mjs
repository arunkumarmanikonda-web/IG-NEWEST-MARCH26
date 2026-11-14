import {brandedEmail} from './email-brand.mjs';
import {paymentEmailCard} from './payment-email-card.mjs';
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
import { collectionMoney } from './collection-money.mjs';
export { collectionMoney } from './collection-money.mjs';
export function rupeesToPaise(value) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(String(value))) throw new Error('Enter an INR amount with up to two decimal places.');
  const [whole,fraction=''] = String(value).split('.');
  const paise=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if (!Number.isSafeInteger(paise)||paise<100||paise>1000000000) throw new Error('Enter an amount from ₹1 to ₹1 crore. Your configured collection limit also applies.');
  return paise;
}
export function validateCollectionInput(p, now=Date.now()) {
  if (!uuid.test(p.request_id||'')) throw new Error('A valid request reference is required.');
  if (!['real-estate','transaction-advisory','debt-special-situations','hospitality','retail-leasing','entertainment','horeca','corporate'].includes(p.practice)) throw new Error('Choose a practice.');
  if (p.confirmed!==true) throw new Error('Review the recipient, amount and agreed payment purpose.');
  const reference=String(p.invoice_ref||'').trim(), description=String(p.description||'').trim();
  if(reference.length<1||reference.length>80||/[\r\n]/.test(reference)||description.length<10||description.length>500) throw new Error('Enter a reference and a 10–500 character payment purpose.');
  const amount_paise=rupeesToPaise(p.amount), expires=Date.parse(p.expires_at);
  if(!Number.isFinite(expires)||expires<=now+60000||expires>now+90*86400000)throw new Error('Choose an expiry within the next 90 days.');
  const name=String(p.customer_name||'').trim(), email=String(p.customer_email||'').trim().toLowerCase();
  if(!p.contact_id&&(name.length<2||name.length>120||email.length>254||!/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(email)))throw new Error('Enter the client name and one valid email address.');
  if(p.contact_id&&!uuid.test(p.contact_id))throw new Error('Choose a valid client contact.');
  return {request_id:p.request_id,practice:p.practice,confirmed:true,invoice_ref:reference,description,amount_paise,expires_at:new Date(expires).toISOString(),customer_name:name,customer_email:email,contact_id:p.contact_id||null};
}
export function safeCollectionUrl(value) {
  let u;try{u=new URL(value);}catch{throw new Error('Payment link is unavailable.');}
  if(u.protocol!=='https:'||!['rzp.io'].includes(u.hostname)||u.username||u.password||u.port||u.hash||value.length>500)throw new Error('Unrecognised payment link address.');
  return u.href;
}
function providerConfig(config) {
  if(!['live','test'].includes(config?.mode)||!config.settings?.key_id||!config.secrets?.key_secret)throw new Error('Razorpay is not activated.');
  if(!config.settings.key_id.startsWith('rzp_'+config.mode+'_'))throw new Error('Payment mode and credentials do not match.');
}
async function request(config,path,method='GET',body,fetcher=fetch) {
  providerConfig(config);
  const response=await fetcher('https://api.razorpay.com/v1/payment_links'+path,{method,headers:{Authorization:'Basic '+Buffer.from(config.settings.key_id+':'+config.secrets.key_secret).toString('base64'),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(20000)});
  let data;try{data=await response.json();}catch{throw new Error('Razorpay returned an unreadable response. Refresh this request before retrying.');}
  if(!response.ok)throw new Error('Razorpay request was not confirmed ('+response.status+'). Refresh the existing request before creating another.');
  return data;
}
export async function createCollectionLink(config,row,fetcher=fetch) {
  if(!Number.isSafeInteger(row.amount_paise)||row.amount_paise<100||row.amount_paise>config.settings.max_payment_paise)throw new Error('Amount exceeds the configured collection limit.');
  return request(config,'','POST',{amount:row.amount_paise,currency:'INR',accept_partial:false,reference_id:row.id,description:row.reference+' · '+row.description,expire_by:Math.floor(Date.parse(row.expires_at)/1000),customer:{name:row.customer_name,email:row.customer_email},notify:{sms:false,email:false},reminder_enable:false,notes:{india_gully_reference:row.reference,request_id:row.id,practice:row.practice,collector_id:row.created_by,collector_name:row.collector_name,invoice_ref:row.invoice_ref}},fetcher);
}
export async function fetchCollectionLink(config,row,fetcher=fetch) {
  if(row.provider_id){if(!/^plink_[A-Za-z0-9]+$/.test(row.provider_id))throw new Error('Invalid provider link reference.');return request(config,'/'+row.provider_id,'GET',undefined,fetcher);}
  if(!uuid.test(row.id))throw new Error('Invalid request reference.');
  const data=await request(config,'?reference_id='+encodeURIComponent(row.id),'GET',undefined,fetcher);
  const rows=data.payment_links;if(!Array.isArray(rows)||rows.length!==1||rows[0].reference_id!==row.id)throw new Error('Razorpay has not returned one matching link. Keep this request for reconciliation; do not duplicate it.');
  return rows[0];
}
export async function cancelCollectionLink(config,row,fetcher=fetch) {
  if(!/^plink_[A-Za-z0-9]+$/.test(row.provider_id||''))throw new Error('Refresh the provider reference first.');
  return request(config,'/'+row.provider_id+'/cancel','POST',{},fetcher);
}
export function collectionSnapshot(data,row) {
  if(!/^plink_[A-Za-z0-9]+$/.test(data?.id||'')||(row.provider_id&&row.provider_id!==data.id)||data.reference_id!==row.id||data.amount!==Number(row.amount_paise)||data.currency!=='INR'||data.accept_partial!==false||String(data.customer?.email||'').toLowerCase()!==row.customer_email||Number(data.expire_by)!==Math.floor(Date.parse(row.expires_at)/1000))throw new Error('Payment-link identity, recipient or amount mismatch. Review required.');
  if(!['created','paid','expired','cancelled','partially_paid'].includes(data.status)||!Number.isSafeInteger(data.amount_paid)||data.amount_paid<0||data.amount_paid>row.amount_paise||(data.status==='paid'&&data.amount_paid!==row.amount_paise))throw new Error('Unverified payment-link status.');
  return {provider_id:data.id,short_url:safeCollectionUrl(data.short_url),provider_status:data.status,amount_paid:data.amount_paid};
}
export async function collectionQr(url) {
  const {default:QRCode}=await import('qrcode');
  return QRCode.toBuffer(safeCollectionUrl(url),{type:'png',width:512,margin:4,errorCorrectionLevel:'M',color:{dark:'#242423',light:'#ffffff'}});
}
export async function collectionEmail(configs,job) {
  const r=job.collection,c=configs.resend.settings;
  if(!r||r.customer_email!==job.recipient||r.status!=='active')throw new Error('Payment email source is unavailable.');
  const url=safeCollectionUrl(r.short_url),png=await collectionQr(url),amount=collectionMoney(Number(r.amount_paise));
  const legal=configs.business.settings.legal_name;
  const message=brandedEmail({title:r.mode==='test'?'Test payment request':'A payment request from '+r.collector_name,preheader:r.collector_name+' has requested '+amount+' · '+r.reference,greeting:'Hello '+r.customer_name+',',paragraphs:[r.collector_name+' has sent you a payment request for '+amount+' towards '+r.description+'. The payment is in favour of India Gully (M/s '+legal+').','Thank you for placing your trust in us. You can complete this payment securely using the link or the QR code included in this payment card.'],facts:[['Amount payable',amount],['Collection reference',r.reference],['Invoice / agreed reference',r.invoice_ref],['Your India Gully contact',r.collector_name],['Valid until',new Date(r.expires_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST']],action:{label:'Pay securely with Razorpay',url},footer:[...(r.mode==='test'?['TEST MODE: no real money is collected.']:[]),'The QR opens the same fixed-amount checkout. Scan it with your camera. This request is not a tax invoice; your agreed invoice or quotation continues to apply.','Already paid or have a question? Please reply to this email before making another payment. We are here to help.'],legalName:legal});
  const qrCid='payment-qr-'+r.id;
  return {from:c.from_name+' <'+c.from_email+'>',reply_to:/^[^\s<>@]+@indiagully\.com$/i.test(r.collector_email||'')?r.collector_email:c.reply_to,to:[r.customer_email],subject:(r.mode==='test'?'TEST · ':'')+'India Gully · '+amount+' payment request · '+r.reference,...message,html:paymentEmailCard({row:r,amount,legal,url,qrCid}),attachments:[{filename:r.reference+'-QR.png',content:png.toString('base64'),content_type:'image/png',content_id:qrCid}]};
}
