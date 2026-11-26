# Google Play asset declaration review — 26 November 2026

Status: evidence for the saved store-listing draft. No declaration, label, submission or website disclaimer was changed by this review.

## Verified Google guidance

[Declaring AI-generated content in Play Console](https://support.google.com/googleplay/android-developer/answer/17262077?hl=en) requires self-declaration for submitted visual assets and assessment of each asset individually. Its creation flow applies labels to assets considered within the applicable regulations; labels can be changed in individual asset details. Declared assets are labeled on Play and other surfaces where used. The page does **not** define a screenshot exemption, a precise test for AI-authored SVG/code, or a complete regulatory threshold. It therefore does not support either a blanket no-AI certification or labeling every asset merely because the app uses AI elsewhere.

[Understanding Google Play's AI-Generated Content policy](https://support.google.com/googleplay/android-developer/answer/14094294?hl=en) separately excludes apps that only host AI content without generating it from that particular generative-app policy. This is not stated as an exemption from the store-asset declaration.

[Preview asset guidance](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en) recommends screenshots captured from the actual app. Authentic capture establishes UI fidelity; it does not establish the origin of images displayed inside that UI.

## Asset evidence and unresolved provenance

| Asset | Evidence available | What it does not establish |
| --- | --- | --- |
| App icon | Byte-for-byte copy of the approved `public/icon-512.png`; manifest records its hash. | Approval and copying do not independently establish the original artwork's creation history. |
| Feature graphic | Reproducible SVG/font composition with the existing logo, rendered with Inkscape/Pillow; no generative-image model call in the generator. | Deterministic rendering alone is not proof that a new AI-assisted design is outside Google's declaration. The guidance does not resolve this distinction. |
| Eight phone screenshots | Actual, unchanged native emulator captures: Home, Explore, property detail, Saved, HORECA collections, product detail, More and separate staff entry. | Real screenshots can still contain generated or AI-edited catalogue imagery. The visible source images need asset-level provenance review. |

## Release decision

Keep the listing saved as a draft while the declaration remains unresolved. Identify the visible catalogue image records and their original/source/generated status, and record the logo and feature-design provenance. Assess each uploaded asset separately; apply any required label to the affected assets using Play's individual asset controls. If the scope remains unclear, seek an asset-specific answer from Play support before submission. Neither ordinary image resizing nor a real emulator capture alone justifies declaring every underlying image non-AI.

This review does not decide that every screenshot requires a label, does not certify that none require one, and does not change the user's website presentation preferences.
