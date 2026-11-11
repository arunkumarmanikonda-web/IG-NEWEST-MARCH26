import 'server-only';
import {runtimeConfigs,integrationRpc} from './runtime-config';
import {sendResend} from './provider-adapters.mjs';
export async function dispatchEmailQueue(enquiryId){
 const configs=await runtimeConfigs(),config=configs.resend;if(config?.mode!=='enabled')return {sent:0,disabled:true};
 const jobs=await integrationRpc('ig_delivery',{action:'claim',enquiry_id:enquiryId});let sent=0;
 for(const j of jobs){const e=j.enquiry,message=j.kind==='internal'?{to:j.recipient,subject:'India Gully enquiry · '+e.id.slice(0,8),text:['Reference: '+e.id,'Name: '+e.name,'Email: '+e.email,'Organisation: '+e.organisation,'Phone: '+e.phone,'Practice: '+e.practice,'',e.message].join('\n')}:{to:j.recipient,subject:'India Gully · Enquiry received',text:'Thank you for contacting India Gully. Your enquiry reference is '+e.id+'. Our team will review your request. You can reply to '+config.settings.reply_to+'.\n\nIndia Gully\n'+configs.business.settings.legal_name+'\n'+configs.business.settings.phone};
  let provider_id,error;try{const result=await sendResend(config,message,'ig-enquiry/'+j.id);if(!result.id)throw new Error('Provider did not acknowledge the message');provider_id=result.id;sent++;}catch{error='Provider delivery failed or was not confirmed. Retry within the idempotency window.';}
  await integrationRpc('ig_delivery',{action:'finish',id:j.id,lease_token:j.lease_token,provider_id,error});
 }return {sent};
}
