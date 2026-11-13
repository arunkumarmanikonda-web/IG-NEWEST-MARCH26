import {redirect} from 'next/navigation';
import Link from 'next/link';
import {accountContext} from '../../../lib/supabase/server';
import PrivacyRequests from './requests';
import '../../portal.css';
export const dynamic='force-dynamic';
export default async function Page(){const {client,user}=await accountContext();if(!user)redirect('/login');const {data,error}=await client.from('ig_privacy_requests').select('*').eq('user_id',user.id).order('created_at',{ascending:false});return <main id="main" className="auth-page"><div className="nda-account"><Link href="/account">← Your account</Link>{error?<p>Requests unavailable. Please contact hello@indiagully.com.</p>:<PrivacyRequests items={data||[]}/>}</div></main>;}
