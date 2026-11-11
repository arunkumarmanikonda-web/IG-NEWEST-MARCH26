# HORECA commerce and Vyapar
11 November 2026. Architecture recommendation; no commerce provider has been provisioned.

## Recommended division of responsibilities
| System | Responsibility |
|---|---|
| India Gully Next.js on Vercel | Branded customer experience, practice pages, opportunities, procurement workspace and customer portal |
| Neon Postgres | Application records, users/access relationships, CMS revisions, enquiries, RFQs, quote approvals, consent history, integration outbox and audit trail; it is not an ecommerce engine |
| Shopify | Standard SKU catalogue, authoritative online stock, cart, hosted checkout and commercial order state |
| Vyapar | Existing books, GST invoicing and accounting workflow, subject to confirmed supported interfaces |

Shopify supports replacing the storefront with a custom frontend. That permits India Gully design and navigation while keeping checkout and core order operations on the commerce platform. A custom BOQ/RFQ workspace is separate from retail checkout and can support project-level requirements, line specifications, substitutions, quantities, vendor comparisons, quote versions and approvals.

## Vyapar integration boundary
Vyapar's official guides confirm an online catalogue/store, receipt of orders, conversion of confirmed orders to sales invoices, and Excel item imports. A supported public API for the core accounting application's two-way synchronisation was not verified. Similar names such as VyaparGateway or VyaparAPI are not evidence of compatibility with the user's Vyapar accounting licence.

Obtain the actual product edition/version and official integration documentation or a supported account capability before implementing a live bridge. With no supported API, begin with validated file exchange using the actual exported/sample formats. A generated spreadsheet does not prove that Vyapar accepted an invoice, payment or stock change.

## Reconciliation controls
- Assign one authoritative owner to each field: SKU, tax category, online availability, approved price, order ID, invoice number and payment state. Do not allow both systems to overwrite the same stock ledger independently.
- Keep external IDs, source versions, payload digests, import batches and acknowledgements. Reject changed payloads reusing an idempotency key.
- Verify webhook signatures and event deduplication; retry transient failures; queue conflicts for review.
- Reconcile order, invoice, payment, cancellation, refund, credit note and stock movement amounts. Never mark paid from a browser redirect or screenshot.
- Start with read-only catalogue import and sandbox orders; reconcile a full test cycle before enabling live financial writes.
- Keep credentials and accounting files private. Never scrape a desktop application's internals or edit its local database to imitate a supported integration.

## A wholly custom store
Possible if selected by the owner, but it needs a commerce service in addition to Neon. The implementation must cover inventory reservation and release, prices/taxes, shipping, partial fulfilment, payments/refunds, credit notes, reconciliations, fraud controls, audit and recovery. AI can prepare copy, suggest substitutions, prioritise exceptions and draft communications. Tax, money, stock and authorisation must use deterministic rules and verified events.

For India's project procurement business, the recommended starting point is a custom procurement workflow plus a managed commerce core for standard direct purchases. No zero-defect guarantee is made. Acceptance is measured by tested workflows, concurrency/idempotency checks, reconciliation and recovery drills.

Official references: [Shopify custom storefronts](https://help.shopify.com/en/manual/custom-storefronts), [Storefront API](https://shopify.dev/docs/api/storefront/latest), [Cart and checkout](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage), [Vyapar online store](https://vyaparapp.in/guides/how-to-create-an-online-store-in-vyapar), [Vyapar Excel imports](https://vyaparapp.in/videos/how-to-import-batches-through-excel), [Neon managed auth](https://neon.com/blog/neon-auth-branchable-identity-in-your-database).
