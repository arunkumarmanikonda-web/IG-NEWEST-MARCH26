import { notFound } from 'next/navigation';
import { mobileStaffContext } from '../access';
import SampleStaffWorkspace from '../../account/sample-staff-workspace';
import '../../portal.css';

export const dynamic = 'force-dynamic';
export const metadata = {title: 'Assigned sample projects', robots: {index: false, follow: false}};

export default async function SampleProjects() {
  const {client, user} = await mobileStaffContext();
  if (user.id !== 'a675e7fe-cc33-42ed-af77-5e9257c34c96') notFound();
  const {data, error} = await client.rpc('ig_review_sample_workflows', {p: {action: 'overview'}});
  if (error || !data) return <main className="auth-page"><section className="portal-form"><h1>Sample files unavailable</h1><p>Refresh the page to try again.</p></section></main>;
  return <SampleStaffWorkspace initial={data}/>;
}
