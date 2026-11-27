import {headers} from 'next/headers';
import {hasInAppNavigation} from '../../lib/mobile-workspace.mjs';
import Link from 'next/link';
import Module from '../admin/[module]/page';
import { DraftEditor, DraftRegister } from './drafts';
import { mobileStaffContext } from './access';
import MobilePaymentStatus from './payment';
import '../portal.css';
import '../brand-workspace.css';

export const dynamic = 'force-dynamic';
export const metadata = {title: 'Mobile staff workspace', robots: {index: false, follow: false}};
const tabs = [['listings','Property listings'], ['catalogue','Product catalogue'], ['procurement','Procurement requests'], ['horeca','HORECA operations'], ['collections','Collection status']];

export default async function StaffWorkspace({ searchParams }) {
  const {client, user} = await mobileStaffContext();
  const {error} = await client.rpc('ig_admin_overview');
  if (error) return <main className="auth-page"><section className="portal-form"><h1>Staff access required</h1><Link href="/account?profile=1">Return to account</Link></section></main>;
  const query = await searchParams;
  const view = query?.view;
  const simulated = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://ehcqhoxiwmydipwfujuf.supabase.co';
  const fullDashboard = !simulated && hasInAppNavigation((await headers()).get('user-agent'));
  let panel;
  if (query?.record) panel = <DraftEditor client={client} id={query.record} result={query.result}/>;
  else if (view === 'listings' || view === 'catalogue') panel = <DraftRegister client={client} view={view}/>;
  else if (view === 'horeca' || view === 'procurement') panel = <Module params={Promise.resolve({module: view})} searchParams={Promise.resolve({})}/>;
  else if (view === 'collections') {
    panel = <MobilePaymentStatus client={client}/>;
  } else if (view === 'website') panel = <section className="workspace-card"><h2>Website administration</h2>
    <p>Choose an available staff task above.</p></section>;
  return <main id="main" className="auth-page account-dashboard"><div>
    <section className="portal-form"><h1>Staff workspace</h1><p>{user.email}</p>
      <nav className="module-tabs" aria-label="Staff tasks">{fullDashboard && <Link href="/admin">Management suite</Link>}{tabs.map(([key,label]) =>
        <Link key={key} href={'/staff-workspace?view=' + key} aria-current={view === key ? 'page' : undefined}>{label}</Link>)}
        <Link href="/account/data-rooms">Assigned data rooms</Link><Link href="/account?profile=1">My account</Link>
        {simulated && <Link href="/account?samples=1">Sample files and payment records</Link>}
      </nav></section>{panel}
  </div></main>;
}
