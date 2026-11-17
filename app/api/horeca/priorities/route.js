import { featuredProducts } from "../../../../lib/featured-products";
import {listingRevision} from "../../../../lib/listing-revision.mjs";
import {anonymousServerClient} from "../../../../lib/runtime-config";
import {readRegister} from "../../../../lib/registers.mjs";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const headers={"Cache-Control":"no-store"};
  try {
    const priority=await featuredProducts();
    if(new URL(request.url).searchParams.get('scope')==='catalogue'){
      const client=anonymousServerClient();
      const {data,error}=await readRegister(()=>client.from('ig_public_content').select('id,version,published_at').eq('kind','product'));
      if(error)throw error;
      return Response.json({revision:listingRevision(data,priority.products.map(p=>p.placement))},{headers});
    }
    return Response.json({revision:priority.revision},{headers});
  }catch{return new Response(null,{status:503,headers});}
}
