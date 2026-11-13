import LegalDocument from '../legal-document';
export const dynamic='force-dynamic';
export const metadata={title:'Data usage policy'};
export default function Page(){return <LegalDocument policy='dataUse'/>;}
