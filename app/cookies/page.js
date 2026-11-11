import LegalDocument from '../legal-document';
export const dynamic='force-dynamic';
export const metadata={title:'Cookie notice'};
export default function Page(){return <LegalDocument policy='cookies'/>;}
