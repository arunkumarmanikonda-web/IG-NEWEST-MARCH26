# Project NDA and private data rooms

## Operating flow
1. A registered, verified client accepts the current website policies and requests information for a published opportunity.
2. The client reads an owner-approved NDA version and explicitly accepts it with a full name, organisation and authority confirmation.
3. The server retains exact wording, version, SHA-256, account, purpose, project and acceptance timestamp. This is typed-name electronic acceptance, not a certificate-based digital signature.
4. An owner or administrator reviews that specific request.
5. In Project data rooms, an administrator creates the room for the same opportunity, uploads the files and grants the approved requester access.
6. An active link appears in the client's account dashboard and My project data rooms. Merely signing an NDA does not create a grant.

## Permissions
A room can be paused. A client grant can be revoked or expire; maximum grant duration is one year and cannot exceed the NDA's three-year term. A withdrawn/revoked NDA request, suspended account, stale registration policy or invalid session blocks new access.

Download modes are none, all eligible files, and selected files. A file's global original-download block overrides client rules. In all mode, a per-client deny overrides the room default. In selected mode, an explicit file allow is required. Rules cannot reference a different project's file.

Original downloads use a private-storage signed URL valid for 60 seconds after a fresh permission check. A URL already issued may remain usable for that short period after revocation. Files already downloaded cannot be recalled.

View-only recipients receive server-rendered, recipient-watermarked PDF/image pages. The original preview source requires both the client's authenticated project authority and a server-only broker secret. Direct client access to private Storage objects is denied. Watermarks discourage redistribution; screenshots, photographs and copies of visible pixels cannot be prevented.

## Folders and upload
Create nested folders and empty subfolders. Upload multiple files or a local folder; browser folder uploads preserve relative paths and create the corresponding hierarchy. Three concurrent uploads, per-file progress and retry, up to 100 files / 250 MB per batch, 20 MB per file and 12 folder levels. Folder names reject traversal and control characters. Empty folders can be removed; occupied folders require their contents to be archived and children removed first.

Files are initially pending. A signed upload goes directly into private Supabase Storage, avoiding the website's request-body limits. The broker validates file size and signature before marking it ready. Failed/pending objects are never available to clients. Existing files are archived/restored rather than silently overwritten.

## Formats
| Family | Extensions | View-only handling |
| --- | --- | --- |
| PDF | pdf | Native server-rendered, paginated and watermarked; up to 500 pages |
| Word / text | doc, docx, rtf, txt, odt | Administrator uploads a linked PDF for faithful preview |
| Excel / data | xls, xlsx, csv, ods | Linked PDF preview; original download separately controlled |
| Presentations | ppt, pptx, odp | Linked PDF preview |
| Images | jpg, jpeg, png, webp | Native watermarked preview |
| Additional images | gif, tif, tiff, bmp | Linked PDF preview |
| Archive | zip | Download-only; upload individual files for granular permissions |

Executables, active HTML/SVG and macro-enabled Office documents are outside the allowlist. A ZIP is stored as an opaque bundle, never extracted on the server. Its contents cannot have separate permissions until uploaded as individual files. Automatic Office-to-PDF conversion and a malware scanning provider are not connected; neither is represented as active.

## Architecture
- Private bucket: ig-data-rooms, created lazily by the broker on first authorised upload.
- Database: ig_data_rooms, ig_room_folders, ig_room_files, ig_room_grants, ig_room_file_rules, ig_nda_templates and ig_nda_requests.
- Authorisation: audited, session-aware SQL functions with RLS; client dashboard returns approved metadata only.
- Supabase Edge Function ig-room-broker uses the platform's server-side admin credential only after user-scoped permission checks. Its original-source endpoint additionally validates DATAROOM_BROKER_SECRET against a private database hash.
- Vercel renders previews using PDF.js and native Canvas. Original document bytes are never sent to a view-only browser.
- Authenticated file responses use no-store. Upload, preview, download and permission changes are recorded in the audit trail.
- No service-role key is stored in browser or Vercel environment. The broker's platform-managed secret stays inside Supabase.

## Activation and remaining controls
The included legal template is a draft. Only the owner can activate a reviewed version. Review project-specific conditions before publishing an agreement; some CIRP mandates require the process owner's own NDA or eligibility documents.

Before production: configure and verify email delivery, complete real staff verification/password rotation/MFA, deploy an isolated production database and private bucket, add retention/backup/restore procedures, capacity and malware scanning decisions, and perform a live device acceptance test. Marketing, payment, AI and mail integrations are separate capabilities.
