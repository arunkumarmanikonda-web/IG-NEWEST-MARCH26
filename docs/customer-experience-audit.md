# Customer experience audit and rebuild
Reviewed against https://indiagully.com/, /about, /works and public listing journeys on 11 November 2026.

## Findings and response
| Finding | Response in this branch |
| --- | --- |
| Preview omitted the company story, history, vision and mission | Dedicated About experience, timeline and CMS-backed editorial sections |
| Leadership reduced to photographs and job titles | Three substantial biographies, individual profile pages and editable expertise fields |
| Existing project and transaction experience absent | Twelve selected historical engagements, separate from available opportunities |
| Generic homepage offered little evidence of capabilities | Clear practice architecture, selected assets, experience, leadership and confidentiality journey |
| Confidentiality flow undiscoverable | Dedicated NDA page, listing CTA, registered requests, exact-text acceptance receipts and administrator review |
| Original listing overlay contained restricted material in the unauthenticated page | New rooms do not render original documents into public HTML; file authority is checked server-side |
| Two local JPG assets were 59-byte error responses | Removed both invalid files; Jaipur uses an editorial placeholder until the correct property image is supplied |
| Navigation concealed important journeys | Firm, expertise and resources navigation; leadership, work, NDA and portal links in footer |
| Typography and alignment inconsistent | Shared spacing rules, bounded text measure, justified long-form desktop copy, readable left alignment on mobile, consistent table/form alignment |

## Content decisions
Use the supplied India Gully gold, black and white branding without recolouring the logos. Source leadership and selected experience from the firm's existing site. Do not carry conflicting pipeline totals, unsupported transaction-completion claims, blanket exclusive-mandate claims or security certifications into the new website.

Historical assignments are not representations of current availability. The About story, vision, mission, people and project records are seeded into the CMS. Homepage composition, timeline, practice definitions and some procurement sections still have source-managed structure; extending the CMS to every layout block remains part of launch completion.

## Acceptance
Review desktop and mobile page layout, body alignment, image decoding, menu keyboard behaviour and the full leadership, opportunity and NDA journeys. Verify the exact deployed commit, not just a local build. Account verification delivery, real owner onboarding and approval of the NDA wording remain release gates.
