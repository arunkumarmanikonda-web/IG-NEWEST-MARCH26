import test from "node:test";
import assert from "node:assert/strict";
import { directRoomRecipients, parseRoomRecipients, roomNdaRecipients, roomShareContacts } from "../lib/room-sharing.mjs";

test("direct sharing offers active portal contacts across non-archived clients", () => {
  const clients = [{ id: "a", name: "Alpha", stage: "engaged" }, { id: "b", name: "Beta", stage: "prospect" }, { id: "c", name: "Closed", stage: "archived" }];
  const contact = { name: "Guest", email: "guest@example.com", active: true, portal_enabled: true };
  const contacts = [
    { ...contact, id: "a1", client_id: "a" }, { ...contact, id: "b1", client_id: "b" },
    { ...contact, id: "c1", client_id: "c" }, { ...contact, id: "unknown", client_id: "missing" },
    { ...contact, id: "off", client_id: "a", active: false }, { ...contact, id: "noportal", client_id: "b", portal_enabled: false },
  ];
  assert.deepEqual(roomShareContacts(contacts, clients).map(c => [c.id, c.client_name]), [["a1", "Alpha"], ["b1", "Beta"]]);
});

test("NDA recipients stay scoped to the approved project and current agreement", () => {
  const request = { content_id: "project", status: "approved", accepted_at: "2026-11-01T00:00:00Z", signed_name: "Guest", agreement_snapshot: { recipient_email: "guest@example.com" } };
  const requests = [{ ...request, id: "yes" }, { ...request, id: "other", content_id: "other" }, { ...request, id: "pending", status: "pending" }, { ...request, id: "old", accepted_at: "2020-01-01T00:00:00Z" }];
  assert.deepEqual(roomNdaRecipients(requests, "project", new Date("2026-11-19T00:00:00Z")).map(r => r.id), ["yes"]);
  assert.deepEqual(roomNdaRecipients(requests, null), []);
});

test("a room with no clients or NDAs can prepare a named or unnamed email recipient", () => {
  assert.deepEqual(directRoomRecipients([], [], "New Guest <NEW@example.com>\nother@example.com\nnew@example.com"), {
    recipient_ids: [], recipients: [{ name: "New Guest", email: "new@example.com" }, { name: "", email: "other@example.com" }], count: 2, emailReady: true,
  });
});

test("selected contact email preferences survive deduplication with typed email addresses", () => {
  const contacts = [{ id: "one", email: "guest@example.com", circulation: false }, { id: "two", email: "guest@example.com", circulation: true }];
  assert.deepEqual(directRoomRecipients(contacts, ["one", "one"], "GUEST@example.com"), {
    recipient_ids: ["one"], recipients: [], count: 1, emailReady: false,
  });
  assert.throws(() => directRoomRecipients(contacts, ["one", "two"], ""), /only one client contact/);
  assert.throws(() => directRoomRecipients(contacts, ["removed"], ""), /no longer eligible/);
});

test("recipient input rejects malformed addresses, multiple addresses on a line and controls", () => {
  for (const input of ["not an email", "a@example.com,b@example.com", "A\tGuest <a@example.com>", "a@example.com\rBcc:other@example.com", "A <a@example.com> extra", "a@-invalid.com"]) {
    assert.throws(() => parseRoomRecipients(input), /Check recipient on line/);
  }
  assert.throws(() => parseRoomRecipients(Array.from({ length: 51 }, (_, i) => `guest${i}@example.com`).join("\n")), /up to 50/);
  assert.throws(() => directRoomRecipients([{ id: "one", email: "one@example.com", circulation: true }], ["one"], Array.from({ length: 50 }, (_, i) => `guest${i}@example.com`).join("\n")), /up to 50/);
});
