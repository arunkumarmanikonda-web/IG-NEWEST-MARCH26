import 'server-only';
import {setTimeout as delay} from 'node:timers/promises';
import {gulluWorkbook,readGulluDay} from './gullu-workbook.mjs';
import {brandedEmail} from './email-brand.mjs';
import {sendResendPayload} from './provider-adapters.mjs';
import {runtimeConfigs, integrationRpc} from './runtime-config';

function digestEmail(configs, job, attached=false) {
  const {from_name,from_email,reply_to} = configs.resend.settings;
  const {conversations,questions,follow_ups,topics,requests} = job.summary;
  const format = date => new Date(date+'T00:00:00Z').toLocaleDateString('en-IN', {
    timeZone:'Asia/Kolkata',day:'numeric',month:'short',year:'numeric',
  });
  const daily=job.cadence==='daily', label=daily?'daily':'weekly';
  const period = daily?format(job.period_start):format(job.period_start)+' to '+format(job.period_end);
  const paragraphs = ['Gullu’s recorded conversations for '+period+' (India time).'];
  if(daily)paragraphs.push(attached?'The attached workbook contains guest details and full conversations.':'The complete workbook is available through the secure download link below. It exceeds the email attachment allowance; no conversations have been removed from that download.');
  if (topics.length) paragraphs.push('Questions by practice\n'+topics.map(t=>t.topic+' · '+t.total).join('\n'));
  if (requests.length) paragraphs.push('Recent requests for follow-up\n'+requests.map(r=>r.practice+' · '+r.question).join('\n'));
  return {
    to:[job.recipient],from:from_name+' <'+from_email+'>',reply_to,
    subject:'India Gully | Gullu’s '+label+' report | '+period,
    ...brandedEmail({title:'Gullu’s '+label+' conversation report',greeting:'Hello team,',paragraphs,
      facts:[['Conversations',conversations],['Questions recorded',questions],['Follow-up requests',follow_ups]],
      action:{label:daily?'Download complete guest workbook':'Review conversations and reports',url:daily?'https://indiagully.com/api/admin/intelligence/report?day='+job.period_start:'https://indiagully.com/admin/intelligence'},
      footer:['Contact details and enquiry assignments are available in the staff workspace.'],
      legalName:configs.business.settings.legal_name}),
  };
}

export async function dispatchGulluDigest() {
  const rpc = p => integrationRpc('ig_gullu_digest',p);
  const jobs = await rpc({action:'claim'});
  if (!jobs.length) return {accepted:0};
  const configs = await runtimeConfigs();
  let accepted = 0, failed = 0;
  for (const [index,job] of jobs.entries()) {
    if (index) await delay(600);
    const lease = {id:job.id,lease_token:job.lease_token};
    let attachment;
    if(job.cadence==='daily' && job.summary.conversations<=120){
      const rows=await readGulluDay(after=>rpc({action:'rows',...lease,after}),120);
      if(rows){const bytes=gulluWorkbook(rows);
        if(bytes.length<650000)attachment={filename:'Gullu-'+job.period_start+'.xlsx',content:bytes.toString('base64')};
      }
    }
    const envelope=digestEmail(configs,job,!!attachment);
    if(attachment)envelope.attachments=[attachment];
    const payload = await rpc({action:'prepare',...lease,payload:envelope});
    if (!payload) continue;
    let providerId;
    try {
      const response = await sendResendPayload(configs.resend,payload,'ig-gullu-'+(job.cadence||'weekly')+'/'+job.id);
      providerId = response.id;
    } catch {
      // Keep the same envelope and provider idempotency key on an uncertain response.
    }
    await rpc({action:'finish',...lease,provider_id:providerId||null});
    if (providerId) accepted++;
    else failed++;
  }
  return {accepted,failed};
}
