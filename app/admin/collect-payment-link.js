'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
export default function CollectPaymentLink(){
 const path=usePathname();
 const practice=path.startsWith('/admin/practice/')?path.split('/')[3]:/\/horeca|\/catalogue|\/procurement/.test(path)?'horeca':path.startsWith('/admin/listings')?'real-estate':path.startsWith('/admin/pmc')?'hospitality':'';
 return <Link className="collect-payment-link" href={'/admin/collections'+(practice?'?practice='+encodeURIComponent(practice):'')}>Collect payment <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M3 13 13 3M3 3h10v10"/></svg></Link>;
}
