import {accountContext} from '../../../../lib/supabase/server';import {readJson,privateJson,errorJson,HttpError} from '../../../../lib/http.mjs';import {dispatchEmailQueue} from '../../../../lib/delivery';
export const maxDuration = 120;
export async function POST(request){try{await readJson(request,1000);const {client}=await accountContext();const {error}=await client.rpc('ig_config_list');if(error)throw new HttpError('Super-user access required',403);return privateJson(await dispatchEmailQueue());}catch(e){return errorJson(e);}}
