# HORECA commerce architecture
Updated 12 November 2026. This replaces the earlier provider proposal.

The implemented journey is business procurement: browse or import products, submit an RFQ, obtain supplier bids, compare landed costs, approve a selling quotation, accept that exact version, collect payment and track fulfilment. It does not advertise unverified fixed-price retail checkout.

| System | Responsibility |
|---|---|
| India Gully on Vercel | Public catalogue, client/supplier portals, staff workspaces, authenticated APIs and AI processing |
| Supabase | Versioned products and quotes, manufacturer references and SKUs, RFQs/bids/orders, inventory movements, data access, private source files and audit records |
| Razorpay | Payment collection, signed events, reconciliation and refunds, subject to live activation |
| OpenAI / Runway | Evidence-backed draft content and reviewed creative preparation |

Vyapar is excluded at the owner's direction. Shopify and Neon are not required by this implemented quote-based architecture. Payment receipts do not replace statutory GST invoicing.

## Reconciliation controls
- Internal SKUs are unique and automatic by default; manufacturer article codes remain separate. Admins can override SKUs subject to duplicate checks.
- Exact quotation revisions govern acceptance and payment amounts. Supplier costs remain private.
- Payment status requires verified provider events or reconciliation, never a browser redirect or screenshot.
- Stock changes use receipts, dispatches, returns and adjustment controls. Project-sourced procurement does not pretend all listed goods are held in stock.
- Provider credentials and brand catalogues remain private. AI creates drafts, with explicit specification/image review before publication.

See [launch readiness](launch-readiness.md), [catalogue imports](catalogue-import.md) and [product images](product-images.md) for implementation evidence and activation dependencies.
