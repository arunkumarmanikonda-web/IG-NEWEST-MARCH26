import {accountContext} from '../../../lib/supabase/server';
import {readJson,privateJson,errorJson,HttpError} from '../../../lib/http.mjs';
async function execute(p){const {client,user,profile,policiesAccepted}=await accountContext();if(!user||profile?.status!=='active'||!policiesAccepted)throw new HttpError('Sign in and accept the current policies to save listings to your account.',401);const {data,error}=await client.rpc('ig_customer_shortlist',{p});if(error)throw new HttpError(error.message,400);return privateJson({ids:data});}
export async function GET(){try{return await execute({action:'list'});}catch(e){return errorJson(e);}}
export async function POST(request){try{return await execute(await readJson(request,8192));}catch(e){return errorJson(e);}}
