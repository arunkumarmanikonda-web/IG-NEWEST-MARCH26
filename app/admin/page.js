import {redirect} from 'next/navigation';
import Link from 'next/link';import BrandLogo from '../brand-logo';import {accountContext} from '../../lib/supabase/server';
export default async function Dashboard() {
  const {client,user,profile} = await accountContext();
  if (!user || !profile) redirect('/login');
  const active = kind => client.from('ig_operations').select('id', {count:'exact',head:true})
    .eq('archived',false).eq('kind',kind);
  const [overview,orders,projects] = await Promise.all([
    client.rpc('ig_admin_overview'),
    active('order').not('status','in','(delivered,cancelled)'),
    active('pmc_project').neq('status','completed'),
  ]);
  const metrics = [
    ['Published records',overview.data?.published],
    ['Open enquiries',overview.data?.enquiries],
    ['Active orders',orders.error ? null : orders.count],
    ['Open PMC projects',projects.error ? null : projects.count],
  ];
  return <><div className="dashboard-welcome"><div><span className="eyebrow">YOUR OPERATING CENTRE</span><h2>A clear view.<br/><em>A considered next move.</em></h2><p>Welcome, {profile.display_name?.split(' ')[0]||'team'}. Manage the firm’s publishing, client relationships and delivery from dedicated workspaces.</p></div><div className="dashboard-monogram"><BrandLogo symbol decorative/></div></div><div className="metric-grid">{metrics.map(([k,v])=><div key={k}><span>{k}</span><strong>{v ?? "—"}</strong></div>)}</div><div className="module-heading"><div><span className="eyebrow">WORKSTREAMS</span><h3>Choose your workspace.</h3></div><Link href="/admin/intake">Start with AI </Link></div><div className="workspace-tiles">{[['cms','Website CMS','Manage the firm, people, insights and practice pages.'],['featured','Carousel & priority listings','Choose featured properties and priority HORECA products.'],['listings','Real estate opportunities','Create, classify and publish property opportunities.'],['catalogue','HORECA catalogue','Build product specifications, SKUs and imagery.'],['horeca','HORECA procurement','RFQs, comparisons, purchase orders and fulfilment.'],['pmc','PMC delivery','Programmes, budgets, changes and site progress.'],['clients','Global clients','One relationship directory, independent client logins.'],['data-rooms','Project data rooms','Project-specific disclosure, reports and permissions.'],['intake','AI creation studio','Turn supplied documents and images into reviewed drafts.']].map(([p,t,d])=><Link href={'/admin/'+p} key={p}><h3>{t}</h3><p>{d}</p><b>Open workspace </b></Link>)}</div></>;}
