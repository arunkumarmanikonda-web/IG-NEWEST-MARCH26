import {pageMeta} from '../../lib/seo.mjs';
import LegalDocument from '../legal-document';
export const dynamic='force-dynamic';
export const metadata=pageMeta("/terms");
export default function Page(){return <LegalDocument policy='terms'/>;}
