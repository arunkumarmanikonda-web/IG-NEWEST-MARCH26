import {pageMeta} from '../../lib/seo.mjs';
import Seo from '../seo';
import {opportunities} from '../../lib/content.mjs';
import {PageHero,ContactBand} from '../components';
import Explorer from './explorer';
import {published,opportunityCard} from '../../lib/cms';
export const dynamic='force-dynamic';
export const metadata=pageMeta('/opportunities');
export default async function Opportunities(){const records=await published('opportunity');const items=records===null?opportunities:records.map(opportunityCard);const contexts=records===null?undefined:[...new Map(records.flatMap(x=>x.tags.filter(t=>t.dimension==='opportunity-context').map(t=>[t.slug,{id:t.slug,label:t.label}]))).values()];return <main id="main"><Seo path="/opportunities"/><PageHero eyebrow="REAL ESTATE & HOSPITALITY" title={<>Start with the asset.<br/><em>Explore the possibility.</em></>} description="Selected assets from India Gully’s existing opportunity portfolio. Speak to the team to confirm current availability, mandate status and the appropriate next step."/><section className="section-pad"><Explorer items={items} contexts={contexts}/><p className="fine-note">Portfolio references are not current offers. Availability, ownership particulars, commercial terms and mandate status require confirmation. CIRP, distress and special-situation classifications are displayed only when supported by verified information.</p></section><ContactBand title="Have a different investment brief?" text="Share your preferred asset class, location, transaction objective and investment parameters." interest="Investment brief"/></main>}
