import { briefContacts } from '../lib/brief-contacts.mjs';
export default function AdviserContacts({ kind, practice, subject = 'Enquiry' }) {
  return <div className="adviser-contacts" aria-label="Your India Gully contacts">
    {briefContacts({ kind, practice }).map(contact => <div key={contact.email}>
      <strong>{contact.name}</strong>
      <span>{contact.role}</span>
      <a href={'tel:' + contact.phone.replace(/\s/g, '')}>{contact.phone}</a>
      <a href={'mailto:' + contact.email + '?subject=' + encodeURIComponent(subject)}>{contact.email}</a>
    </div>)}
  </div>;
}
