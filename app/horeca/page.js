import AdvertisingEvent from "../advertising-event";
import { siteSection } from "../../lib/website";
import AdviserContacts from '../adviser-contacts';
import '../portal.css';
import Basket from './basket';
import Catalogue from './catalogue';
import {published} from '../../lib/cms';
export const dynamic='force-dynamic';
import {pageMeta} from '../../lib/seo.mjs';
import Seo from '../seo';
import Link from 'next/link';
import {PageHero,Eyebrow,Arrow,ContactBand,LinkButton} from '../components';
export const metadata=pageMeta('/horeca');

export default async function Horeca(){
  const copy = await siteSection("horeca");
  const categories = copy.categories;const products=await published('product');return <main id="main"><Seo path="/horeca"/><AdvertisingEvent practice="horeca"/><PageHero eyebrow={copy["eyebrow-hotels-restaurants-caf-s"]} title={<>{copy["the-right-detail"]}<br/><em>{copy["for-every-operation"]}</em></>} description={copy["description-horeca-procurement-organised-around-what-the-operation"]} image={copy["image-images-dining-jpg"]} alt={copy["alt-tableware-and-service-in-a-restaurant"]}><LinkButton href="/contact?interest=HORECA%20procurement">{copy["share-your-procurement-brief"]}</LinkButton></PageHero>{!!products?.length&&<Catalogue products={products}/>}<Basket/><section className="section-pad"><div className="section-heading"><div><Eyebrow>{copy["procurement-categories"]}</Eyebrow><h2>{copy["from-the-kitchen"]}<br/>{copy["to-the-guest-room"]}</h2></div><p>{copy["plan-a-complete-opening-requirement-source-a"]}</p></div><div className="category-grid">{categories.map(([title,text])=><article key={title}><h3>{title}</h3><p>{text}</p><Link className="text-link" href={'/contact?interest='+encodeURIComponent('HORECA: '+title)}>{copy["discuss-this-category"]} <Arrow/></Link></article>)}</div></section><section className="scope-section"><div><Eyebrow>{copy["from-requirement-to-delivery"]}</Eyebrow><h2>{copy["compare-like-for-like"]}</h2><p>{copy["product-descriptions-quantities-and-commercial-terms-need"]}</p></div><ul className="output-list">{['Requirement and specification review','Vendor responses and deviation comparison','Samples and commercial approval','Delivery and project coordination'].map((x,i)=><li key={x}><span>0{i+1}</span>{x}</li>)}</ul></section><section className="prose-section"><h2>{copy["bring-us-the-working-requirement"]}</h2><p>{copy["a-boq-category-list-or-opening-brief"]}</p><Link className="text-link" href="/insights/procurement-comparison">{copy["read-our-procurement-perspective"]} <Arrow/></Link></section><section className="section-pad procurement-contacts"><h2>{copy["plan-your-requirement-with-pavan"]}</h2><AdviserContacts kind="product" subject="HORECA procurement enquiry"/></section><ContactBand interest="HORECA procurement" title={copy["title-let-s-build-the-right-requirement"]}/></main>}
