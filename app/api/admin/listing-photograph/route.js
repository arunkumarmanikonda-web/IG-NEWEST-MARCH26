import {accountContext} from '../../../../lib/supabase/server';
import {isStaff} from '../../../../lib/sign-in.mjs';
import {readJson,privateJson,errorJson,HttpError} from '../../../../lib/http.mjs';
import {propertyReference} from '../../../../lib/property-photo';
export const maxDuration=60;
export async function POST(request){
  try{
    const {id}=await readJson(request,1024);
    const {client,user,profile,staffVerified}=await accountContext();
    if(!user||profile?.status!=='active'||profile.must_change_password||!isStaff(profile)||!staffVerified)throw new HttpError('Staff sign-in required',403);
    const {data:record}=await client.from('ig_content').select('id,kind,practice,title,public_data').eq('kind','opportunity').eq('id',id).is('deleted_at',null).maybeSingle();
    if(!record)throw new HttpError('Saved listing unavailable.',404);
    return privateJson({id:await propertyReference(client,record)});
  }catch(error){return errorJson(error);}
}
