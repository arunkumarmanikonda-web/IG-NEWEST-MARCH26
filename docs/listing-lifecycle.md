# Property availability and archive display

Open **Management suite → Real estate listings → Manage → Availability & archive display**.

- Choose Available, Under offer, Reserved, Sold or Withdrawn.
- Add optional public wording, such as “Successfully placed”. The canonical state remains visible alongside custom wording so visitors can understand availability.
- Save availability to update an existing published listing without publishing the editorial draft.
- When archiving, either hide immediately or keep the approved listing visible for 30, 60 or 90 days, or through a custom date. The date is inclusive through 23:59:59.999 Asia/Kolkata.
- Timed archives remain discoverable with their status until the deadline. Afterwards they disappear automatically from public pages, search, mobile feeds and downloadable briefs; the private record and existing authorised data-room access remain intact.
- Restore creates a private draft. Re-publication is explicit. Publishing does not reset a Sold or Reserved status to Available.
- The register has an availability filter and shows archived display deadlines. “Take selected offline” always hides immediately.

## Implementation

Lifecycle fields are dedicated `ig_content` columns with their own optimistic concurrency counter. `ig_listing_lifecycle` requires real-estate publication authority and records an audit entry. A trigger projects only the trusted fields into the existing public snapshot. Lifecycle-only updates retain the approved body, image, tags, version and publication timestamp.

Public row-level security applies archive expiry on every read. Privileged public RPCs also enforce lifecycle visibility or availability as appropriate. The scheduler is not required. Closed or pending properties cannot remain in active promotions or be suggested by Gullu as available; their reference pages point to available alternatives. Existing client room grants are a separate permission system and are not revoked by a listing status change.

Validation includes database role/permission tests, exact expiry boundaries, unpublished draft isolation, direct and legacy NDA paths, archive extension/restoration, bulk publication, unit tests for public discovery/Gullu/mobile/PDF and India-time date conversion, and a production build. Native app source includes badges; existing installed binaries receive qualified status text through the server feed until updated.
