import {pageMeta} from '../../lib/seo.mjs';
import Seo from '../seo';
import {contact} from '../../lib/content.mjs';
import {PageHero,Eyebrow} from '../components';
import Enquiry from './enquiry';
export const metadata=pageMeta('/contact');
export default async function Contact({searchParams}){const query=await searchParams;const interest=typeof query.interest==='string'?query.interest.slice(0,120):'';return <main id="main"><Seo path="/contact"/><PageHero eyebrow="START A CONVERSATION" title={<>What comes next<br/><em>starts here.</em></>} description="Tell us about the asset, transaction or project you have in mind. A clear initial brief helps us understand where to begin."/><div className="contact-layout"><div className="contact-details"><Eyebrow>INDIA GULLY</Eyebrow><h2>Let’s understand<br/>your priorities.</h2><a href={'mailto:'+contact.email}>{contact.email}</a><a href={'tel:'+contact.tel}>{contact.phone}</a><p>Real estate · Transaction advisory · Debt and special situations · Hospitality and PMC · Retail · Entertainment · HORECA</p><p className="fine-note">Please keep your first message to a non-confidential summary. The team can agree an appropriate process for detailed documents.</p></div><Enquiry initialInterest={interest}/></div></main>}
