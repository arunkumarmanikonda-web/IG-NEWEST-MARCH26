import {redirect} from 'next/navigation';
import {accountContext} from '../../../lib/supabase/server';
import Requests from './requests';
import '../../portal.css';
export const dynamic='force-dynamic';
export const metadata={title:'Procurement requests',robots:{index:false,follow:false}};
export default async function Page(){const{client,user}=await accountContext();if(!user)redirect('/login');const{data,error}=await client.rpc('ig_procurement_dashboard');return <main id="main" className="auth-page account-dashboard">{error?<section className="portal-form"><h1>Procurement requests</h1><p>Complete your account registration and policy acceptance to continue.</p><a href="/account">Open account</a></section>:<Requests items={data||[]}/>}</main>;}
