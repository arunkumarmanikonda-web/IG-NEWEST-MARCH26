import {anonymousServerClient} from "../../../../../lib/runtime-config";
export const dynamic="force-dynamic";
export async function GET(request,{params}){
 const {record,asset}=await params;
 if(!/^[0-9a-f-]{36}$/.test(record)||!/^[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/.test(asset))return new Response(null,{status:404});
 const client=anonymousServerClient(), path=record+"/"+asset;
 const {data:snapshot,error}=await client.from("ig_public_content").select("public_data").eq("id",record).eq("kind","retail_space").maybeSingle();
 if(error)return new Response(null,{status:503});
 if(!snapshot?.public_data?.plans?.some(p=>p.path===path))return new Response(null,{status:404});
 // Redirect to an isolated storage origin so large drawings bypass the app response size limit.
 const signed=await client.storage.from("ig-retail-plans").createSignedUrl(path,60);
 if(signed.error)return new Response(null,{status:404});
 return new Response(null,{status:303,headers:{Location:signed.data.signedUrl,"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
}
