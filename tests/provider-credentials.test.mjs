import test from 'node:test';
import assert from 'node:assert/strict';
import {providerCredentials,providerCredentialPresence} from '../lib/provider-credentials.mjs';
import {enquiryEmail} from '../lib/email-message.mjs';
import {sendResendPayload} from '../lib/provider-adapters.mjs';
test('Vercel credentials remain scoped and CMS overrides take precedence',()=>{
 const env={RESEND_API_KEY:'environment',RESEND_WEBHOOK_SECRET:'webhook',UNRELATED_SECRET:'private'};
 assert.deepEqual(providerCredentials('resend',{api_key:'override'},env),{api_key:'override',webhook_secret:'webhook'});
 assert.deepEqual(providerCredentials('openai',{},env),{});
 assert.deepEqual(providerCredentialPresence('resend',env),['api_key','webhook_secret']);
 assert.ok(!JSON.stringify(providerCredentialPresence('resend',env)).includes('environment'));
});
test('acknowledgements do not echo confidential enquiry text and forwards target one recipient',()=>{
 const configs={resend:{settings:{from_name:'India Gully',from_email:'hello@indiagully.com',reply_to:'hello@indiagully.com'}},business:{settings:{legal_name:'VEHPL',phone:'+918988988988'}}};
 const job={kind:'acknowledgement',recipient:'customer@example.com',enquiry:{id:'enquiry-reference',name:'Customer',message:'Confidential test content'}};
 const ack=enquiryEmail(configs,job);assert.ok(!ack.text.includes('Confidential'));assert.deepEqual(ack.to,['customer@example.com']);
 const forwarded=enquiryEmail(configs,{...job,kind:'internal',recipient:'akm@indiagully.com'});assert.ok(forwarded.text.includes('Confidential'));assert.deepEqual(forwarded.to,['akm@indiagully.com']);
});
test('retries send the frozen request even when current sender settings change',async()=>{
 const config={mode:'enabled',settings:{domain_verified:true,from_email:'changed@example.com'},secrets:{api_key:'test'}};
 const frozen={from:'India Gully <hello@indiagully.com>',to:['customer@example.com'],subject:'Original',text:'Original'};
 await sendResendPayload(config,frozen,'stable',async(url,options)=>{assert.equal(options.body,JSON.stringify(frozen));assert.equal(options.headers['Idempotency-Key'],'stable');return Response.json({id:'email-id'});});
});
