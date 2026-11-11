import Link from 'next/link';
import {practices} from '../../lib/content.mjs';
import {PageHero,Eyebrow,Arrow,ContactBand} from '../components';
export const metadata={title:'Our Practices',description:'Real estate, transaction advisory, debt and special situations, hospitality, retail and entertainment advisory.'};
export default function Practices(){return <main id="main"><PageHero eyebrow="OUR PRACTICES" title={<>Commercial perspective.<br/><em>Across the lifecycle.</em></>} description="A connected set of advisory and delivery capabilities, organised around the decisions owners, promoters and investors need to make."/><section className="section-pad"><div className="service-grid">{practices.map(p=><article className="service-item" key={p.slug}><Eyebrow>{p.number} / ADVISORY</Eyebrow><h2>{p.title}</h2><p>{p.intro}</p><Link href={'/practices/'+p.slug} className="text-link">Explore the practice <Arrow/></Link></article>)}</div></section><ContactBand/></main>}
