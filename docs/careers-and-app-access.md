# Careers and app account access

## Public experience

The site footer links to `/careers`. The page displays only published roles that are still open, with keyword and department filters. Each role has a public detail page and an application form. An empty catalogue is intentional until an administrator publishes a real vacancy; no demonstration jobs are seeded.

Applicants can submit without creating an India Gully account. The form accepts a PDF CV up to 2 MB or a public HTTPS professional-profile/CV link, along with contact details and explicit recruitment-processing consent. Links are stored for an administrator to review, never fetched by the server. A successful submission displays a receipt reference. Repeated requests with the same application identifier do not create duplicate applications.

## Administrator workflow

Open **Management suite → Careers** at `/admin/careers`. Verified owners and administrators can configure the page, create and edit vacancies, publish, close or archive them, set application closing times, and review applicants. Application statuses and internal notes are private. Closed, expired, archived and draft roles do not accept new applications.

Applicant data and CV bytes are held in private database tables. Direct client access is denied; administrator actions and CV downloads require the established role and verified staff-session checks. Downloaded CVs are served as attachments with private no-store headers. Recruitment applications do not automatically send emails to candidates or leadership.

## Android and iOS

Version 1.0.2 (build 4) adds a visible **Sign in** control in the app header, a home-page account entry and a clear client entry in More. Staff workspace remains separate at the bottom of More. Both use a restricted first-party web view and the normal website authentication and permissions. Each fresh account/staff entry resets only its app web session before displaying sign-in; installing the app never grants access.

**Careers** opens the live public careers page inside the app. Future vacancy changes made in admin are therefore reflected on both platforms without a new app binary. The app does not copy application details or CVs into the offline shortlist. Browser-only connections and downloads retain an explicit external-browser option.

## Release verification

Track source tests, SQL access/lifecycle checks, website deployment, signed Android bundle and platform build outcomes in the release record. Source implementation and an unsigned iOS simulator build are not evidence of TestFlight availability. Apple organisation enrolment must activate before device signing and upload can proceed.
