import {businessDefaults} from './business.mjs';
export const integrationSpecs = Object.freeze({
  business: {title:'Company & statutory identity', modes:['active'], defaults:businessDefaults, secrets:[]},
  resend: {title:'Resend transactional email', modes:['disabled','enabled'], defaults:{from_email:'hello@indiagully.com',from_name:'India Gully',reply_to:'hello@indiagully.com',internal_recipients:['akm@indiagully.com','pavan@indiagully.com','amit.jhingan@indiagully.com'],domain_verified:false},secrets:['api_key','webhook_secret']},
  razorpay: {title:'Razorpay payments', modes:['disabled','test','live'], defaults:{key_id:'',merchant_verified:false,max_payment_paise:100000000},secrets:['key_secret','webhook_secret','previous_webhook_secret']},
  fast2sms: {title:'Fast2SMS approved SMS', modes:['disabled','enabled'],defaults:{sender_id:'',entity_id:'',template_id:'',template_text:'',dlt_approved:false},secrets:['api_key']},
  openai: {title:'OpenAI editorial assistance', modes:['disabled','enabled'],defaults:{model:'gpt-4.1-mini',max_output_tokens:1500},secrets:['api_key']},
});
const email = x => typeof x==='string' && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(x) && x.length<=254;
export function validateIntegration(id, mode, input, secrets={}) {
  const spec=integrationSpecs[id];
  if(!spec || !spec.modes.includes(mode)) throw new Error('Unsupported integration or mode');
  if(!input || typeof input!=='object' || Array.isArray(input)) throw new Error('Settings must be an object');
  if(Object.keys(input).some(k=>!Object.hasOwn(spec.defaults,k))) throw new Error('Unsupported settings field');
  if(Object.keys(secrets).some(k=>!spec.secrets.includes(k))) throw new Error('Unsupported credential');
  const s={...spec.defaults,...input};
  for(const [k,v] of Object.entries(s)) {
    if(typeof v!==typeof spec.defaults[k] || (typeof v==='string' && (v.length>2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)))) throw new Error('Invalid '+k);
  }
  for(const v of Object.values(secrets)) if(typeof v!=='string'||v.length>5000||/[\r\n\x00]/.test(v)) throw new Error('Invalid credential');
  if(id==='business') {
    if(s.legal_name.length<12||!/^\w{21}$/.test(s.cin)||!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(s.gstin)||!email(s.email)||!email(s.grievance_email)||!/^\+91[6-9]\d{9}$/.test(s.phone)) throw new Error('Check the legal name, CIN, GSTIN, email and Indian contact number');
    if(s.statutory_details_confirmed && (s.registered_office.length<20||s.grievance_name.length<3||s.grievance_designation.length<3)) throw new Error('Confirm the full registered office and appointed grievance officer before marking these details complete');
  }
  if(id==='resend') {
    if(!email(s.from_email)||!email(s.reply_to)||!Array.isArray(s.internal_recipients)||s.internal_recipients.length<1||s.internal_recipients.length>10||s.internal_recipients.some(x=>!email(x))||/[\r\n<>]/.test(s.from_name)) throw new Error('Check sender, reply-to and internal recipient addresses');
    if(mode==='enabled'&&(!s.domain_verified||!secrets.api_key||!secrets.webhook_secret)) throw new Error('Verified sender domain, API key and webhook signing secret are required');
  }
  if(id==='razorpay') {
    if(!Number.isSafeInteger(s.max_payment_paise)||s.max_payment_paise<100||s.max_payment_paise>1000000000) throw new Error('Set a valid payment limit in paise');
    if(mode!=='disabled' && (!new RegExp('^rzp_'+mode+'_[a-zA-Z0-9]+$').test(s.key_id)||!secrets.key_secret||!secrets.webhook_secret)) throw new Error('Matching test/live Razorpay keys and webhook secret are required');
    if(mode==='live'&&!s.merchant_verified) throw new Error('Razorpay merchant activation must be complete');
  }
  if(id==='fast2sms'&&mode==='enabled') {
    if(!s.dlt_approved||!/^[A-Za-z]{3,6}$/.test(s.sender_id)||!/^\d{10,25}$/.test(s.entity_id)||!/^\d{10,25}$/.test(s.template_id)||s.template_text.length<10||!secrets.api_key) throw new Error('DLT-approved entity, sender, content template and API key are required');
  }
  if(id==='openai' && (!/^[a-zA-Z0-9._:-]{1,100}$/.test(s.model)||!Number.isInteger(s.max_output_tokens)||s.max_output_tokens<100||s.max_output_tokens>4000||(mode==='enabled'&&!secrets.api_key))) throw new Error('Check the model, token limit and API key');
  return s;
}
