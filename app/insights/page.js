import {pageMeta} from '../../lib/seo.mjs';
import Seo from '../seo';
import {insights} from '../../lib/content.mjs';
import {PageHero,InsightCards,ContactBand} from '../components';
export const metadata=pageMeta('/insights');
export default function Insights(){return <main id="main"><Seo path="/insights"/><PageHero eyebrow="INDIA GULLY PERSPECTIVES" title={<>Questions worth asking.<br/><em>Decisions worth preparing for.</em></>} description="Practical perspectives on the commercial and operational questions behind assets, transactions and projects."/><section className="section-pad"><InsightCards items={insights}/></section><ContactBand/></main>}
