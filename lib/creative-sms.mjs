const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const creativeRatios=['1280:720','720:1280','720:720'];
export function creativeInput(p,config){
 if(p.public_approved!==true)throw new Error('Confirm that the brief contains only approved public information');
 if(!['image','video'].includes(p.kind)||!creativeRatios.includes(p.ratio)||typeof p.prompt!=='string'||p.prompt.trim().length<20||p.prompt.length>900)throw new Error('Choose a format and enter a 20–900 character creative brief');
 const video=p.kind==='video';
 if(p.product_image_mode&&(!['enhance','generate'].includes(p.product_image_mode)||video||p.practice&&p.practice!=='horeca'||p.product_image_mode==='enhance'&&!p.reference_media_id))throw new Error('Product image mode requires a valid HORECA image brief');
 if(p.product_id&&!UUID.test(p.product_id))throw new Error('Invalid product reference');
 if(video&&(!config.settings.video_enabled||p.ratio==='720:720'||!Number.isInteger(p.duration)||p.duration<2||p.duration>10))throw new Error('Video must be enabled, landscape or portrait, and 2–10 seconds');
 if(p.reference_media_id&&(!/^[0-9a-f-]{36}$/i.test(p.reference_media_id)||video))throw new Error('Choose a valid source image for image generation');
 return {...(p.product_image_mode?{product_image_mode:p.product_image_mode,product_title:String(p.product_title||'').slice(0,180),product_sku:String(p.product_sku||'').slice(0,180),...(p.product_id?{product_id:p.product_id}:{})}:{}),...(p.reference_media_id?{reference_media_id:p.reference_media_id}:{}),kind:p.kind,prompt:p.prompt.trim(),ratio:p.ratio,duration:video?p.duration:0,estimated_credits:video?12*p.duration:5,public_approved:true};
}
export function smsInput(p,config){
 const phone=String(p.phone||'').replace(/[\s()-]/g,'').replace(/^\+91/,'');
 if(!/^[6-9]\d{9}$/.test(phone))throw new Error('Enter a valid Indian mobile number');
 if(p.service_confirmed!==true||typeof p.consent_reference!=='string'||p.consent_reference.trim().length<12||p.consent_reference.length>300)throw new Error('Record the recipient’s permission for this service message');
 const count=(config.settings.template_text.match(/\{#var#\}/g)||[]).length;
 if(!Array.isArray(p.variables)||p.variables.length!==count||p.variables.some(x=>typeof x!=='string'||x.length<1||x.length>100||/[|\r\n\u0000-\u001f]/.test(x)))throw new Error('Supply one value per DLT {#var#} placeholder, without pipes or newlines');
 return {phone,variables:p.variables,consent_reference:p.consent_reference.trim(),service_confirmed:true};
}
async function jsonRequest(url,options,fetcher=fetch){
 const response=await fetcher(url,{...options,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});
 const body=await response.json().catch(()=>null);
 if(!response.ok||!body)throw new Error('Provider response could not be confirmed. Check the provider console before trying again.');
 return body;
}
const runwayHeaders=c=>({Authorization:'Bearer '+c.secrets.api_key,'X-Runway-Version':'2024-11-06','Content-Type':'application/json'});
export async function startCreative(config,input,fetcher=fetch){
 if(config.mode!=='enabled'||!config.secrets.api_key)throw new Error('Runway is disabled');
 const i=creativeInput(input,config),video=i.kind==='video';
 const body=await jsonRequest('https://api.dev.runwayml.com/v1/'+(video?'text_to_video':'text_to_image'),{method:'POST',headers:runwayHeaders(config),body:JSON.stringify({model:video?config.settings.video_model:config.settings.image_model,promptText:i.prompt,ratio:i.ratio,...(!video&&config.reference_image_url?{referenceImages:[{uri:config.reference_image_url,tag:'source'}]}:{}),...(video?{duration:i.duration,outputFormat:'mp4'}:{})})},fetcher);
 if(!UUID.test(body.id||''))throw new Error('Generation acknowledgement missing. Do not resubmit before checking Runway.');
 return {provider_id:body.id,estimated_credits:Number.isFinite(body.estimatedCost?.credits)?body.estimatedCost.credits:i.estimated_credits};
}
export async function readCreative(config,id,fetcher=fetch){
 if(!UUID.test(id||''))throw new Error('Invalid Runway task reference');
 const d=await jsonRequest('https://api.dev.runwayml.com/v1/tasks/'+id,{headers:runwayHeaders(config)},fetcher);
 if(d.id!==id||!['PENDING','THROTTLED','RUNNING','SUCCEEDED','FAILED','CANCELED'].includes(d.status))throw new Error('Invalid task response');
 if(d.status==='SUCCEEDED'&&(!Array.isArray(d.output)||!d.output.length||!safeCreativeUrl(d.output[0])))throw new Error('Unsupported media source. Review the task in Runway.');
 return {status:d.status,output:d.status==='SUCCEEDED'?d.output[0]:null};
}
export function safeCreativeUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['cloudfront.net','runwayml.com','runway.com'].some(d=>u.hostname.endsWith('.'+d));}catch{return false;}}
export async function sendServiceSms(config,input,id,fetcher=fetch){
 if(config.mode!=='enabled'||!config.settings.dlt_approved||!config.secrets.api_key||!/^\d{1,20}$/.test(config.settings.message_id))throw new Error('Approved Fast2SMS configuration required');
 const i=smsInput(input,config);
 const d=await jsonRequest('https://www.fast2sms.com/dev/bulkV2',{method:'POST',headers:{Authorization:config.secrets.api_key,'Content-Type':'application/json'},body:JSON.stringify({route:'dlt',sender_id:config.settings.sender_id,message:config.settings.message_id,variables_values:i.variables.join('|'),numbers:i.phone,sms_details:'1',udf1:id})},fetcher);
 if(d.return!==true||typeof d.request_id!=='string'||!/^[a-zA-Z0-9_-]{1,150}$/.test(d.request_id))throw new Error('SMS acceptance not confirmed. Check Fast2SMS before resending.');
 return {provider_id:d.request_id};
}
export async function checkProvider(id,config,fetcher=fetch){
 if(!config?.secrets.api_key)return {ok:false,message:'No API key is configured. Save a key while disabled, then check the connection.'};
 let d;
 if(id==='openai'){
  d=await jsonRequest('https://api.openai.com/v1/models/'+encodeURIComponent(config.settings.model),{headers:{Authorization:'Bearer '+config.secrets.api_key}},fetcher);
  if(d.id!==config.settings.model)throw new Error('Configured model is not available to this key');
 }else if(id==='runway')d=await jsonRequest('https://api.dev.runwayml.com/v1/organization',{headers:runwayHeaders(config)},fetcher);
 else if(id==='fast2sms'){
  d=await jsonRequest('https://www.fast2sms.com/dev/wallet',{method:'POST',headers:{Authorization:config.secrets.api_key}},fetcher);
  if(d.return!==true)throw new Error('Fast2SMS did not verify this account');
 }else throw new Error('Connection check not supported');
 return {ok:true,message:'Provider credentials accepted. No content generated and no SMS sent. A live workflow test is still required.'};
}
