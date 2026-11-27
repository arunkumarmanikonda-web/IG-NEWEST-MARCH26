import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { readRegister } from '../../lib/registers.mjs';
import { mobileStaffContext } from './access';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fields = 'id,version,kind,practice,slug,title,summary,body,seo_title,seo_description,public_data';
function recordQuery(client, id) {
  return client.from('ig_content').select(fields).eq('id', id).in('kind', ['opportunity', 'product'])
    .is('deleted_at', null).neq('status', 'archived').maybeSingle();
}
async function save(form) {
  'use server';
  const { client } = await mobileStaffContext();
  const id = String(form.get('id') || '');
  if (!uuid.test(id)) notFound();
  const back = '/staff-workspace?record=' + id;
  const [{data: row, error}, tags] = await Promise.all([
    recordQuery(client, id), client.from('ig_content_tags').select('term_id').eq('content_id', id),
  ]);
  if (error || tags.error) redirect(back + '&result=error');
  if (!row) notFound();
  if (String(row.version) !== form.get('version')) redirect(back + '&result=conflict');
  const title = String(form.get('title') || '').trim();
  const summary = String(form.get('summary') || '').trim();
  if (!title || title.length > 500 || summary.length > 5000) redirect(back + '&result=invalid');
  const result = await client.rpc('ig_save_content', { p: { ...row, title, summary, term_ids: tags.data.map(t => t.term_id) } });
  if (result.error) redirect(back + (result.error.code === '40001' ? '&result=conflict' : '&result=error'));
  redirect(back + '&result=saved');
}
export async function DraftEditor({ client, id, result }) {
  if (!uuid.test(id)) notFound();
  const {data: row, error} = await recordQuery(client, id);
  if (error) return <p role="alert">The record could not be loaded. Try again.</p>;
  if (!row) notFound();
  const notices = {saved: 'Draft saved.', conflict: 'This record changed. Review the current version before saving.', invalid: 'Check the title and summary.', error: 'Save failed. Check your editing permissions and try again.'};
  return <section className="workspace-card"><h2>{row.title}</h2>
    {Object.hasOwn(notices, result) && <p role="status">{notices[result]}</p>}
    <form action={save} className="workspace-form" key={row.version}>
      <input type="hidden" name="id" value={row.id}/><input type="hidden" name="version" value={row.version}/>
      <label>Title<input name="title" defaultValue={row.title} required maxLength={500}/></label>
      <label>Summary<textarea name="summary" defaultValue={row.summary || ''} rows={5} maxLength={5000}/></label>
      <button className="primary">Save draft</button>
    </form></section>;
}
export async function DraftRegister({ client, view }) {
  const kind = view === 'catalogue' ? 'product' : 'opportunity';
  const {data, error} = await readRegister(() => client.from('ig_content').select('id,title,updated_at')
    .eq('kind', kind).is('deleted_at', null).neq('status', 'archived'), 'updated_at');
  return <section className="workspace-card"><h2>{view === 'catalogue' ? 'Product catalogue' : 'Property listings'}</h2>
    {error ? <p role="alert">The register could not be loaded.</p> : data.length ? <ul>{data.map(row =>
      <li key={row.id}><Link href={'/staff-workspace?record=' + row.id}>{row.title}</Link></li>)}</ul> : <p>No records assigned.</p>}
  </section>;
}
