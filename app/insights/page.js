import {pageMeta} from '../../lib/seo.mjs';
import Seo from '../seo';
import {published} from '../../lib/cms';
export const dynamic='force-dynamic';
import {insights} from '../../lib/content.mjs';
import {PageHero,InsightCards,ContactBand} from '../components';
export const metadata=pageMeta('/insights');
export default async function Insights(){const records=await published('article');const items=records===null?insights:records.map(x=>({...x,image:x.public_data.image||'/images/city.jpg',category:x.public_data.sector||'INDIA GULLY PERSPECTIVES'}));return <main id="main"><Seo path="/insights"/><PageHero eyebrow="INDIA GULLY PERSPECTIVES" title={<>Questions worth asking.<br/><em>Decisions worth preparing for.</em></>} description="Practical perspectives on the commercial and operational questions behind assets, transactions and projects."/><section className="section-pad"><InsightCards items={items}/></section><ContactBand/></main>}
