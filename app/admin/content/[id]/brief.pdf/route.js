import { accountContext } from '../../../../../lib/supabase/server';
import { isStaff } from '../../../../../lib/sign-in.mjs';
import { businessDetails } from '../../../../../lib/runtime-config';
import { createTeaserPDF } from '../../../../../lib/teaser-pdf.mjs';
import { refineLegacyProperty } from '../../../../../lib/property-editorial.mjs';
import { siteConfig } from '../../../../../lib/seo.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request,{params}){
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new Response('Not found',{status:404});
 const {client,user,profile,staffVerified,policiesAccepted}=await accountContext();
 if(!user||profile?.status!=='active'||profile.must_change_password||!isStaff(profile)||!staffVerified||!policiesAccepted)return new Response('Verified staff access required',{status:403,headers:{'Cache-Control':'no-store'}});
 const query=new URL(request.url).searchParams,live=query.get('version')==='live',inline=query.get('inline')==='1';
 // Reading the source under its RLS policy is mandatory even for a live export.
 const {data:record,error}=await client.from('ig_content').select('*').eq('id',id).maybeSingle();
 if(error||!record)return new Response('Not found',{status:404});
 const item=live?(await client.from('ig_public_content').select('*').eq('id',id).maybeSingle()).data:record;
 if(!item)return new Response('Published version not found',{status:404});
 const result=await createTeaserPDF(refineLegacyProperty(item),await businessDetails(),{draft:!live,origin:siteConfig().origin});
 return new Response(result.bytes,{headers:{'Content-Type':'application/pdf','Content-Disposition':(inline?'inline':'attachment')+'; filename="India-Gully-'+(live?'':'DRAFT-')+item.slug+'.pdf"','Cache-Control':'private, no-store','X-Frame-Options':'SAMEORIGIN','Content-Security-Policy':"frame-ancestors 'self'",'X-Content-Type-Options':'nosniff'}});
}
