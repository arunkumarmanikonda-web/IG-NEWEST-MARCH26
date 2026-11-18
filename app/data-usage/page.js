import {pageMeta} from '../../lib/seo.mjs';
import LegalDocument from '../legal-document';
export const dynamic='force-dynamic';
export const metadata=pageMeta("/data-usage");
export default function Page(){return <LegalDocument policy='dataUse'/>;}
