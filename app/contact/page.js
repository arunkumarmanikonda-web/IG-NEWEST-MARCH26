import { siteSection } from "../../lib/website";
import {pageMeta} from '../../lib/seo.mjs';
import Seo from '../seo';
import {contact} from '../../lib/content.mjs';
import {PageHero,Eyebrow} from '../components';
import Enquiry from './enquiry';
export const metadata=pageMeta('/contact');
export default async function Contact({searchParams}){
  const copy = await siteSection("contact");const query=await searchParams;const interest=typeof query.interest==='string'?query.interest.slice(0,120):'';return <main id="main"><Seo path="/contact"/><PageHero eyebrow={copy["eyebrow-start-a-conversation"]} title={<>{copy["what-comes-next"]}<br/><em>{copy["starts-here"]}</em></>} description={copy["description-tell-us-about-the-asset-transaction-or"]}/><div className="contact-layout"><div className="contact-details"><Eyebrow>{copy["india-gully"]}</Eyebrow><h2>{copy["let-s-understand"]}<br/>{copy["your-priorities"]}</h2><a href={'mailto:'+contact.email}>{contact.email}</a><a href={'tel:'+contact.tel}>{contact.phone}</a><p>{copy["real-estate-transaction-advisory-debt-and-special"]}</p><p className="fine-note">{copy["please-keep-your-first-message-to-a"]}</p></div><Enquiry initialInterest={interest}/></div></main>}
