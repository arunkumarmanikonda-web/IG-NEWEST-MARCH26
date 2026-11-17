import AdvertisingEvent from "../advertising-event";
import { siteSection } from "../../lib/website";
import AdviserContacts from '../adviser-contacts';
import '../portal.css';
import Basket from './basket';
import Catalogue from './catalogue';
import LiveListings from '../live-listings';
import { featuredProducts } from '../../lib/featured-products';
import { catalogueProduct } from '../../lib/catalogue-results.mjs';
import {published} from '../../lib/cms';
import {listingRevision} from '../../lib/listing-revision.mjs';
export const dynamic='force-dynamic';
import {pageMeta} from '../../lib/seo.mjs';
import Seo from '../seo';
import Link from 'next/link';
import {PageHero,Eyebrow,Arrow,ContactBand,LinkButton} from '../components';
export const metadata=pageMeta('/horeca');

export default async function Horeca({searchParams}){
  const params=await searchParams;
  const category=typeof params?.category==="string"?params.category:"";
  const [copy, products, priority] = await Promise.all([siteSection("horeca"), published("product"), featuredProducts()]);
  const placements=priority.products.map(p=>p.placement);
  const revision=listingRevision((products||[]).map(({id,version,published_at})=>({id,version,published_at})),placements);
  return <main id="main"><Seo path="/horeca"/><AdvertisingEvent practice="horeca"/><PageHero eyebrow={copy["eyebrow-hotels-restaurants-caf-s"]} title={<>{copy["the-right-detail"]}<br/><em>{copy["for-every-operation"]}</em></>} description={copy["description-horeca-procurement-organised-around-what-the-operation"]} image={copy["image-images-dining-jpg"]} alt={copy["alt-tableware-and-service-in-a-restaurant"]}><div className="hero-actions"><LinkButton href="#catalogue">Browse product categories</LinkButton><Link className="text-link" href="/contact?interest=HORECA%20procurement">{copy["share-your-procurement-brief"]} <Arrow/></Link></div></PageHero>
    <LiveListings revision={revision} endpoint="/api/horeca/priorities?scope=catalogue"/>
    <Catalogue key={category} initialCategory={category} products={(products || []).map(catalogueProduct)} priorities={placements} /><Basket/><section className="scope-section"><div><Eyebrow>{copy["from-requirement-to-delivery"]}</Eyebrow><h2>{copy["compare-like-for-like"]}</h2><p>{copy["product-descriptions-quantities-and-commercial-terms-need"]}</p></div><ul className="output-list">{['Requirement and specification review','Vendor responses and deviation comparison','Samples and commercial approval','Delivery and project coordination'].map((x,i)=><li key={x}><span>0{i+1}</span>{x}</li>)}</ul></section><section className="prose-section"><h2>{copy["bring-us-the-working-requirement"]}</h2><p>{copy["a-boq-category-list-or-opening-brief"]}</p><Link className="text-link" href="/insights/procurement-comparison">{copy["read-our-procurement-perspective"]} <Arrow/></Link></section><section className="section-pad procurement-contacts"><h2>{copy["plan-your-requirement-with-pavan"]}</h2><AdviserContacts kind="product" subject="HORECA procurement enquiry"/></section><ContactBand interest="HORECA procurement" title={copy["title-let-s-build-the-right-requirement"]}/></main>}
