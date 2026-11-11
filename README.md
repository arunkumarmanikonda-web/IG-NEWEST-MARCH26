# India Gully platform rebuild

First implemented slice: a Next.js valuation studio and server-side calculation API.

This is a development preview, not the completed India Gully CMS or marketplace. The existing indiagully.com production site is unchanged. No customer database, authentication, email, SMS, checkout or CMS is represented as connected.

## Run

Node 22 or later. `npm ci`, `npm test`, `npm run build`, `npm run dev`.

## Implemented

- Brand assets supplied by India Gully, used unchanged.
- Income capitalisation with explicit NOI/reserve basis, sensitivity analysis.
- DCF with year-end timing, actual 0% growth, exit costs and annual schedule.
- Hotel enterprise value, revenue/EBITDA breakdown and debt/cash equity bridge.
- Shared calculation module, bounded JSON API, validation, CSV export and print view.
- Development noindex metadata and headers.

## Next implementation gates

Provision real Sanity, Neon, identity, private files and Shopify resources before integrating CMS, private portals and commerce. Connect Resend and Fast2SMS using owner-controlled secrets and approved DNS/DLT configuration. Do not add mock customer, stock, order, payment or delivery state. Obtain an approved product master, property publication permissions, staff roles and commerce operating model.

Planned architecture: Next.js frontend and Node API on Vercel, GitHub reviewed changes, Sanity editorial CMS, Neon transactional records, private Vercel Blob, Shopify for product/cart/order state, Resend and Fast2SMS. Commerce default recommendation is India Gully as seller of record; vendor settlements require a separate supported integration and approved contracts.

The financial tools are indicative scenario calculations. No default input is a market recommendation. All money is computed in INR, with lakh inputs explicitly labelled. The model excludes adjustments stated in the result.
