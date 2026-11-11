export function enquiryEmail(configs, job) {
  const e = job.enquiry, c = configs.resend.settings;
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
