export function enquiryEmail(configs, job, origin) {
  const e = job.enquiry, c = configs.resend.settings;
  if (job.kind === 'room_update') {
    if (!/^https:\/\/[a-zA-Z0-9.-]+$/.test(origin || '') || !/^[a-f0-9-]{36}$/.test(job.room_id || '')) throw new Error('Secure portal address unavailable');
    return {from:c.from_name+' <'+c.from_email+'>',reply_to:c.reply_to,to:[job.recipient],
      subject:'India Gully · Your secure client portal',
      text:'Your India Gully team has shared or updated information in your authorised client portal.\n\nSign in with this email address to review your permitted reports:\n'+origin+'/account/data-rooms/'+job.room_id+'\n\nAccess and downloads remain subject to your engagement and the administrator’s current permissions. This email does not contain the reports or grant access by itself.\n\nFor assistance, reply to '+c.reply_to+'.\nIndia Gully\n'+configs.business.settings.legal_name};
  }
  const message = job.kind === 'internal'
    ? { subject: 'India Gully enquiry · ' + e.id.slice(0, 8), text: [
        'Reference: ' + e.id, 'Name: ' + e.name, 'Email: ' + e.email,
        'Organisation: ' + e.organisation, 'Phone: ' + e.phone,
        'Practice: ' + e.practice, '', e.message,
      ].join('\n') }
    : { subject: 'India Gully · Enquiry received', text:
        'Thank you for contacting India Gully. Your enquiry reference is ' + e.id +
        '. Our team will review your request. You can reply to ' + c.reply_to +
        '.\n\nIndia Gully\n' + configs.business.settings.legal_name + '\n' +
        configs.business.settings.phone };
  return { from: c.from_name + ' <' + c.from_email + '>', reply_to: c.reply_to,
    to: [job.recipient], ...message };
}
