import { siteSection } from "../../lib/website";
import {pageMeta} from '../../lib/seo.mjs';
import Seo from '../seo';
import {published} from '../../lib/cms';
export const dynamic='force-dynamic';
import {insights} from '../../lib/content.mjs';
import {PageHero,InsightCards,ContactBand} from '../components';
export const metadata=pageMeta('/insights');
export default async function Insights(){
  const copy = await siteSection("insights");const records=await published('article');const items=records===null?insights:records.map(x=>({...x,image:x.public_data.image||'/images/city.jpg',category:x.public_data.sector||'INDIA GULLY PERSPECTIVES'}));return <main id="main"><Seo path="/insights"/><PageHero eyebrow={copy["eyebrow-india-gully-perspectives"]} title={<>{copy["questions-worth-asking"]}<br/><em>{copy["decisions-worth-preparing-for"]}</em></>} description={copy["description-practical-perspectives-on-the-commercial-and-operational"]}/><section className="section-pad"><InsightCards items={items}/></section><ContactBand/></main>}
