import { PageHero } from "../components";
import {pageMeta} from '../../lib/seo.mjs';
export const metadata = pageMeta('/data-usage');
export default function DataUsage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="POLICY VERSION · 11 NOVEMBER 2026"
        title="Data usage policy"
        description="Your account, your information and your communication choices."
      />
      <article className="prose-section">
        <h2>Operating your account</h2>
        <p>
          India Gully uses your verified email, profile, security settings and
          policy acceptance to provide account access, respond to enquiries and
          maintain security and audit records. Staff access is restricted by
          role and multi-factor authentication.
        </p>
        <h2>Enquiries and engagement information</h2>
        <p>
          Information you submit may be reviewed by the India Gully personnel
          responsible for your request. A first enquiry should contain a
          non-confidential summary. Registering or accepting this policy does
          not sign an NDA or authorise access to restricted asset documents.
        </p>
        <h2>Optional communications</h2>
        <p>
          Email marketing, SMS, personalisation and remarketing preferences are
          separate from registration. They are optional and can be changed in
          your account. Recording a preference does not mean that a campaign is
          active. No advertising pixels or automated marketing delivery are
          active in this preview.
        </p>
        <h2>AI assistance</h2>
        <p>
          AI content and creative tools are not active in this preview.
          Confidential documents, personal details and restricted transaction
          information must not be sent to an AI provider without an approved
          purpose and access controls. Generated claims and asset information
          require review before publication.
        </p>
        <h2>Access and correction</h2>
        <p>
          You can update your profile and communication choices in your account.
          For access, correction, closure or erasure requests, contact{" "}
          <a href="mailto:hello@indiagully.com">hello@indiagully.com</a>.
          Retention requirements will be reviewed for business and audit
          records.
        </p>
      </article>
    </main>
  );
}
