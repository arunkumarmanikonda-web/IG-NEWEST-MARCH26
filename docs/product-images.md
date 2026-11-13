# HORECA product images

Open HORECA catalogue, create/edit a product and use the product-image shortcut. The image workspace has three options:

1. Upload a JPEG, PNG or WebP up to 2.5 MB. Record the description and usage rights. Prepared images are stored privately in the HORECA media library, with catalogue framing.
2. Select an uploaded image and choose AI enhancement. A short-lived reference URL is available only to the currently leased worker. The prompt asks Runway to preserve product geometry, colour, material, markings and components while improving presentation. The editor shows the original and result together.
3. Generate from the current product name and description. Add material, colour, shape and dimensions to improve the brief. Optional visual direction and square, landscape or portrait composition are supported.

Both AI paths use the configured Runway image model and daily request/credit limits. A request currently reserves five credits. Provider billing remains authoritative. Requests retain an idempotency reference through an uncertain response and the worker never blindly resubmits a possibly accepted paid generation. The two-minute recovery schedule polls pending work even after the editor closes.

Results are private until a publisher reviews identity, specifications, rights and disclosure. Approve and use selects the image; save the product draft to retain the selection, then publish the product through its normal revision control. Generated concepts carry the illustrative AI-generated disclosure. Photo enhancements carry the AI-enhanced disclosure. Source photos remain available and need not be public for enhancement. The software cannot guarantee that generative enhancement preserves every product detail; human comparison remains required.

## Acceptance on 12 November 2026

- 126 Node tests and the production build pass, including three product-brief/provider payload checks.
- 17 rollback-only hosted checks cover source privacy, valid leases, source/practice matching, revoked staff, idempotency, publication review and correct disclosures. No provider calls or retained fixtures are produced by this SQL suite.
- A previously generated fictional white-plate test render was uploaded through the signed-in product form. Source `c5745e4c-8c47-4ede-97d3-54432fbb326c` is ready and private. It is explicitly labelled as a test render, not a supplier photograph.
- Enhancement `ab2ae7d1-7e6e-4eb1-8f66-89a4c2c84ca2` reached ready, imported its private PNG and displayed the before/after comparison.
- Description generation `656de801-cde3-40e7-a094-f00c94a861b0` also reached ready and displayed its generated option.
- Each real provider test reserved five credits. Neither result nor source was released publicly, and no test product was published.
- The private media function was deployed as version 5 with its existing authenticated worker-secret boundary. Signed source access additionally requires the exact unexpired job lease.

The product workflow is deployed to the branch review site. Production activation dependencies remain in `launch-readiness.md`.
