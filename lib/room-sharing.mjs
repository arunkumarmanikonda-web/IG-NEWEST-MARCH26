// Recipient preparation for the admin form. The server independently enforces
// contact eligibility, authorisation and the room's file-access rules.
export const ROOM_SHARE_LIMIT = 50;
const EMAIL = /^[A-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$/i;

export function roomShareContacts(contacts = [], clients = []) {
  const availableClients = new Map(clients.filter(c => c.stage !== "archived").map(c => [c.id, c]));
  return contacts.filter(c => c.active && c.portal_enabled && availableClients.has(c.client_id))
    .map(c => ({ ...c, client_name: availableClients.get(c.client_id).name }))
    .sort((a, b) => (a.client_name + a.name + a.email).localeCompare(b.client_name + b.name + b.email));
}

export function roomNdaRecipients(requests, contentId, now = new Date()) {
  if (!contentId) return [];
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 3);
  return requests.filter(n => n.content_id === contentId && n.status === "approved" &&
    n.agreement_snapshot?.recipient_email && new Date(n.accepted_at) > cutoff)
    .map(n => ({ id: n.id, name: n.signed_name, email: n.agreement_snapshot.recipient_email, circulation: true }));
}

export function parseRoomRecipients(text = "") {
  const recipients = new Map();
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const value = line.trim();
    if (!value) continue;
    const named = value.match(/^([^<>]+)\s*<([^<>]+)>$/);
    const name = named ? named[1].trim() : "";
    const email = (named ? named[2] : value).trim().toLowerCase();
    if (name.length > 120 || /[\x00-\x1f\x7f]/.test(value) || email.length > 254 || !EMAIL.test(email)) {
      throw new Error(`Check recipient on line ${index + 1}. Use an email address or Name <email@example.com>, one per line.`);
    }
    if (!recipients.has(email)) recipients.set(email, { name, email });
  }
  if (recipients.size > ROOM_SHARE_LIMIT) throw new Error("Share with up to 50 recipients at a time.");
  return [...recipients.values()];
}

export function directRoomRecipients(contacts, selectedIds, text) {
  const available = new Map(contacts.map(c => [c.id, c]));
  const selected = new Map();
  const emails = new Set();
  for (const id of new Set(selectedIds)) {
    const contact = available.get(id);
    if (!contact) throw new Error("A selected contact is no longer eligible. Clear the selection and choose the recipients again.");
    const email = contact.email.trim().toLowerCase();
    if (emails.has(email)) throw new Error("Choose only one client contact for each email address. Remove the duplicate contact from your selection.");
    emails.add(email);
    selected.set(id, contact);
  }
  const recipients = parseRoomRecipients(text).filter(r => !emails.has(r.email));
  recipients.forEach(r => emails.add(r.email));
  if (emails.size > ROOM_SHARE_LIMIT || selected.size > ROOM_SHARE_LIMIT) {
    throw new Error("Share with up to 50 recipients at a time.");
  }
  return {
    recipient_ids: [...selected.keys()].sort(), recipients,
    count: emails.size,
    emailReady: emails.size > 0 && [...selected.values()].every(c => c.circulation),
  };
}
