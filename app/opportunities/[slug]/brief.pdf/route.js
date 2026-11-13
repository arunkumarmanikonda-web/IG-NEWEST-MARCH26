import { publishedItem } from '../../../../lib/cms';
import { businessDetails } from '../../../../lib/runtime-config';
import { createTeaserPDF } from '../../../../lib/teaser-pdf.mjs';
import { siteConfig } from '../../../../lib/seo.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request,{params}){
 const {slug}=await params;
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return new Response('Not found',{status:404});
 try{
  const [item,business]=await Promise.all([publishedItem('opportunity',slug),businessDetails()]);
  if(!item)return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
  const result=await createTeaserPDF(item,business,{origin:siteConfig().origin});
  const headers={'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="India-Gully-'+slug+'.pdf"','Cache-Control':'private, no-cache, must-revalidate','ETag':result.etag,'X-Content-Type-Options':'nosniff'};
  if(request.headers.get('if-none-match')===result.etag)return new Response(null,{status:304,headers});
  return new Response(result.bytes,{headers});
 }catch{return new Response('The property brief is temporarily unavailable. Please try again.',{status:503,headers:{'Cache-Control':'no-store'}});}
}
