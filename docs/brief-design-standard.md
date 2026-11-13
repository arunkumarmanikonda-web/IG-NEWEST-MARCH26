# Approved India Gully brief standard

Approved by the owner on 14 November 2026 (India time), after reviewing the
Jindal Stage 1 report-inspired design. The owner's follow-up was: “looks good
the AI should be do this job each time”. This is the default for future property
and HORECA briefs, including records created through AI intake and catalogue
workflows. It does not require a separate design selection for each record.

## Automatic application

Every saved record is rendered through `createTeaserPDF` in
`lib/teaser-pdf.mjs`. The admin preview and download route reads the chosen saved
draft or published revision. Public property downloads read only the published
projection. The renderer adapts the title, approved image, supplied facts,
narrative, adviser contacts and enquiry QR to the record.

The PDF cache key includes the complete item, business details, draft status,
origin and design version. A changed revision produces a different key rather
than reusing the old brief. No manual PDF export, browser print setup or new AI
design request is required. Unsaved editor changes must first be saved.

AI prepares the content and image candidates through the existing workflow;
the shared renderer applies the approved visual standard. Publication remains
an explicit staff action after review. Formatting a brief never publishes a
draft, sends it to a client or grants data-room access.

## Design requirements

- A4 portrait, three pages, using the original India Gully logo assets.
- Opening page: full-bleed approved photograph, fine gold frame, discreet
  branding and footer, restrained serif title in the lower part of the page.
- Overview: photographic masthead, prominent supplied facts, clear summary,
  aligned editorial sections, readable spacing and a quiet enquiry callout.
- Closing page: photographic hero, clear invitation, named advisers,
  clickable phone/email links, a discussion or quotation link and a scannable
  record-specific enquiry QR.
- Warm white, charcoal and restrained gold. Keep the PDF's gold frame distinct
  from the separate website colour and border preferences.
- Real estate contacts: Arun Manikonda and Amit Jhingan. HORECA contact: Pavan
  Manikonda. The canonical details are in `lib/brief-contacts.mjs`.
- All text remains selectable. Reuse image embeddings to keep downloads compact.
- Drafts remain visibly marked. Never substitute an unrelated asset photograph
  or invent facts to fill space. When no approved photo is supplied, the current
  renderer uses a typographic cover; an approved image is needed for a photo hero.
  Existing illustrative-image labelling must remain accurate.

## Maintenance and checks

Keep both PDF routes on this shared renderer. Preserve the approved composition
when extending fields or AI workflows. Do not resurrect `app/teaser-sheet.js`
or the old browser-print layout for new brief flows.

After any renderer change, inspect all three rendered pages and run
`node --test tests/teaser-pdf.test.mjs`. Check long titles, six supplied facts,
short HORECA copy, draft labels, page bounds, adviser links and QR decoding.
Preview arbitrary new records, not just the original sample properties.
