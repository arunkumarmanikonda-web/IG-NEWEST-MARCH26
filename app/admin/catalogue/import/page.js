import Link from 'next/link';import {accountContext} from '../../../../lib/supabase/server';import BrandCatalogueStudio from '../../brand-catalogue-studio';
export default async function CatalogueImportPage({searchParams}){
 const {client}=await accountContext(),q=await searchParams;
 const {data:catalogues,error}=await client.from('ig_brand_catalogues').select('id,name,brand,page_count,created_at').order('created_at',{ascending:false}).limit(50);
 if(error)return <section className="workspace-card"><Link href="/admin/catalogue">← Product catalogue</Link><h2>Brand catalogue import</h2><p>The catalogue database update is awaiting activation. Existing product creation and CSV imports remain available.</p></section>;
 const selected=catalogues.find(c=>c.id===q?.catalogue)?.id||catalogues[0]?.id;let pages=[],reviews=[],items=[];
 if(selected){const pageQuery=client.from('ig_catalogue_pages').select('id,catalogue_id,page_number,status,note,complete:result->complete').eq('catalogue_id',selected).order('page_number').limit(500);
 let reviewQuery=client.from('ig_catalogue_pages').select('id,catalogue_id,page_number,status,result,note').eq('catalogue_id',selected).order('created_at',{ascending:false}).limit(6);
 if(/^\d{1,3}$/.test(q?.review||''))reviewQuery=reviewQuery.eq('page_number',Number(q.review));
 const r=await Promise.all([pageQuery,reviewQuery]);if(r.some(x=>x.error))return <p role="alert">Catalogue pages could not be loaded.</p>;pages=r[0].data;reviews=r[1].data;
 if(reviews.length){const r=await client.from('ig_catalogue_items').select('*').in('page_id',reviews.map(p=>p.id));if(r.error)return <p role="alert">Imported products could not be loaded.</p>;items=r.data;}}
 return <><Link href="/admin/catalogue">← Product catalogue</Link><BrandCatalogueStudio catalogues={catalogues} pages={pages} reviews={reviews} items={items} initialId={selected}/></>;
}
