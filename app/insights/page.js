import {insights} from '../../lib/content.mjs';
import {PageHero,InsightCards,ContactBand} from '../components';
export const metadata={title:'Perspectives',description:'Practical perspectives on transaction readiness, hospitality project delivery and HORECA procurement.'};
export default function Insights(){return <main id="main"><PageHero eyebrow="INDIA GULLY PERSPECTIVES" title={<>Questions worth asking.<br/><em>Decisions worth preparing for.</em></>} description="Practical perspectives on the commercial and operational questions behind assets, transactions and projects."/><section className="section-pad"><InsightCards items={insights}/></section><ContactBand/></main>}
