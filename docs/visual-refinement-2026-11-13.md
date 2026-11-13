# Listings and leadership refinement — 13 November 2026

This release supersedes the public “Property Collection” terminology with “Real Estate Listings”. Existing `/opportunities` addresses remain stable.

## Changes

- Consistent photographic cards across the home page, listing search and related properties, with location, status, asset type, approved summary and commercial details.
- Sector filters with result counts, grid/list display controls and shareable URL state.
- Property detail pages pair the photograph with a structured factual summary and clear enquiry/brief links. The full photograph remains available in the image viewer.
- Leadership cards share photo, role, name, biography and link baselines. Full profile pages use a consistent reading column, justified desktop text and left-aligned text on very narrow screens.
- Corrected the stylesheet override that forced biography paragraphs left and the mobile header rule that cramped the menu beside the logo.

## Verification

- Production build completed; all 187 existing tests passed.
- Browser checks covered three-column cards, Commercial filtering, list mode, reload persistence, a property detail page, leadership card baselines and biography computed styles.
- Narrow viewport checks at 340 CSS pixels confirmed stacked listings/profile content without horizontal overflow.
- Existing portfolio reference status and disclosures remain. No availability, mandate, price, area or property facts were invented, and no property photographs were replaced with generated images.

Publication and live verification are tracked by this release's Git commit and Vercel deployment.
