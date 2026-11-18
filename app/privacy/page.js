import {pageMeta} from '../../lib/seo.mjs';
import LegalDocument from '../legal-document';
export const dynamic='force-dynamic';
export const metadata=pageMeta("/privacy");
export default function Page(){return <LegalDocument policy='privacy'/>;}
