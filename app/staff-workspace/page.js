import Link from 'next/link';
import Module from '../admin/[module]/page';
import { DraftEditor, DraftRegister } from './drafts';
import { mobileStaffContext } from './access';
import MobilePayment from './payment';
import '../portal.css';
import '../brand-workspace.css';

export const dynamic = 'force-dynamic';
export const metadata = {title: 'Mobile staff workspace', robots: {index: false, follow: false}};
const tabs = [['listings','Property listings'], ['catalogue','Product catalogue'], ['procurement','Procurement requests'], ['horeca','HORECA operations'], ['collections','Payment links']];

export default async function StaffWorkspace({ searchParams }) {
  const {client, user} = await mobileStaffContext();
  const {error} = await client.rpc('ig_admin_overview');
  if (error) return <main className="auth-page"><section className="portal-form"><h1>Staff access required</h1><Link href="/account?profile=1">Return to account</Link></section></main>;
  const query = await searchParams;
  const view = query?.view;
  // This deployment is the isolated sample project. Its payment form can only simulate links.
  const simulated = true;
  let panel;
  if (query?.record) panel = <DraftEditor client={client} id={query.record} result={query.result}/>;
  else if (view === 'listings' || view === 'catalogue') panel = <DraftRegister client={client} view={view}/>;
  else if (view === 'horeca' || view === 'procurement') panel = <Module params={Promise.resolve({module: view})} searchParams={Promise.resolve({})}/>;
  else if (view === 'collections') {
    const {data, error: collectionError} = simulated
      ? {data: {practices: ['hospitality','horeca','real-estate'], max_amount_paise: 10000000}}
      : await client.rpc('ig_collection_manage', {p: {action: 'context'}});
    panel = collectionError ? <p role="alert">Collection permissions could not be loaded.</p> :
      <MobilePayment practices={data?.practices || []} limit={(data?.max_amount_paise || 0)/100} simulated={simulated}/>;
  } else if (view === 'website') panel = <section className="workspace-card"><h2>Website administration</h2>
    <p>For company administration, open the India Gully website in your browser and sign in with your authorised staff account.</p></section>;
  return <main id="main" className="auth-page account-dashboard"><div>
    <section className="portal-form"><h1>Staff workspace</h1><p>{user.email}</p>
      <nav className="module-tabs" aria-label="Staff tasks">{tabs.map(([key,label]) =>
        <Link key={key} href={'/staff-workspace?view=' + key} aria-current={view === key ? 'page' : undefined}>{label}</Link>)}
        <Link href="/account/data-rooms">Assigned data rooms</Link><Link href="/account?profile=1">My account</Link>
        {simulated && <Link href="/staff-workspace/samples">Sample files and payment records</Link>}
      </nav></section>{panel}
  </div></main>;
}
