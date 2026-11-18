import {published,opportunityCard} from '../../lib/cms';
import {contentPath} from '../../lib/content-routes.mjs';
import Shortlist from './view';
import {comparisonArea} from '../../lib/shortlist.mjs';
export const dynamic='force-dynamic';
export const metadata={title:'Your shortlist',robots:{index:false,follow:false}};
export default async function Page(){const groups=await Promise.all(['opportunity','retail_space','retail_requirement'].map(k=>published(k)));const records=groups.flatMap(g=>g||[]).map(r=>{const d=r.public_data||{},p=r.kind==='opportunity'?opportunityCard(r):null;return {id:r.id,title:r.title,href:contentPath(r),image:d.image||'',location:p?.location||[d.city,d.region,d.markets].filter(Boolean).join(', '),type:p?.assetClass||d.formats||'',transaction:p?.transaction||(r.kind==='retail_space'?'Lease':'Brand requirement'),area:comparisonArea(d),price:d.price_label||'On request',availability:d.availability||'Confirm with our team',review:d.last_verified_at||'Review requested'};});return <main id="main" className="shortlist-page"><h1>Your shortlist</h1><p>Keep property and leasing opportunities together. Compare up to three, then share your brief with India Gully.</p><Shortlist records={records}/></main>;}
