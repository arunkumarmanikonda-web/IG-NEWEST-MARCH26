import {horecaCatalogue} from '../../../../lib/horeca-catalogue';
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
      const data=await horecaCatalogue();
      return Response.json({revision:data.revision+':'+priority.revision},{headers});
    }
    return Response.json({revision:priority.revision},{headers});
  }catch{return new Response(null,{status:503,headers});}
}
