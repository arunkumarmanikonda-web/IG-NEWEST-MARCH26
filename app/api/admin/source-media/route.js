import {createHash} from "node:crypto";
import { isStaff } from "../../../../lib/sign-in.mjs";
import {accountContext} from '../../../../lib/supabase/server';import {readJson,privateJson,errorJson,HttpError} from '../../../../lib/http.mjs';import {frameImage} from '../../../../lib/source-media.mjs';
export const maxDuration=60;
export async function POST(request){try{const p=await readJson(request,3600000),{client,user,profile, staffVerified}=await accountContext();if(!user||profile?.status!=='active'||profile.must_change_password||(!isStaff(profile) || !staffVerified))throw new HttpError('Staff sign-in required',403);if(p.rights_confirmed!==true||typeof p.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(p.data))throw new HttpError('Confirm rights for this image');let name=p.source_name,alt=p.alt,practice=p.practice,rights=p.rights_reference;
if(p.catalogue_match===true){
  if(typeof name!=="string"||!/^[-a-z0-9_. ]{1,100}\.(png|jpe?g|webp)$/i.test(name)||typeof p.brand!=="string"||p.brand.length>100||typeof rights!=="string"||rights.length>350)throw new HttpError("Enter the catalogue brand, source and a file named by its manufacturer code.");
  const code=name.replace(/\.[^.]+$/,"");
  const {data:matches,error}=await client.from("ig_content").select("id,title,public_data").eq("kind","product").eq("public_data->>reference",code).eq("public_data->>brand",p.brand.trim()).limit(2);
  if(error||matches?.length!==1)throw new HttpError("Use one exact catalogue brand and manufacturer code.",409);
  const item=matches[0];
  const bytes=Buffer.from(p.data,"base64");
  const hash=createHash("sha256").update(bytes).digest("hex").slice(0,24);
  name="catalogue-photo-"+item.id+"-"+hash+".jpg";alt=item.title;practice="horeca";
  const {data:existing,error:lookupError}=await client.from("ig_source_media").select("id").eq("source_name",name).eq("state","ready").limit(1);
  if(lookupError)throw new HttpError("The product photo register is unavailable.",503);
  if(existing?.length)return privateJson({id:existing[0].id});
  rights="Manufacturer code "+code+". "+rights;
}
const prepared=await client.rpc('ig_source_media_manage',{p:{action:'prepare',practice,source_name:name,rights_reference:rights,alt,preset:p.preset}});if(prepared.error)throw new HttpError(prepared.error.message,403);const bytes=await frameImage(Buffer.from(p.data,'base64'),p.preset);const upload=await client.storage.from('ig-source-media').upload(prepared.data.path,bytes,{contentType:'image/jpeg',upsert:false,cacheControl:'0'});if(upload.error)throw new HttpError('Media upload did not complete',503);const complete=await client.rpc('ig_source_media_manage',{p:{action:'complete',id:prepared.data.id}});if(complete.error)throw new HttpError(complete.error.message);return privateJson(complete.data);}catch(e){return errorJson(e instanceof HttpError?e:new HttpError(e.message||'Image preparation failed'));}}
