import { pageMeta } from "../../lib/seo.mjs";
import { PageHero, Eyebrow, LinkButton, ContactBand } from "../components";
export const metadata = pageMeta("/nda");
const steps = [
  [
    "Explore the brief",
    "Review the approved public overview, broad location and transaction context.",
  ],
  [
    "Register your interest",
    "Use a verified account to identify the opportunity and explain your evaluation purpose.",
  ],
  [
    "Review the agreement",
    "Read the applicable NDA version and record your name, authority and explicit acceptance.",
  ],
  [
    "Obtain approval",
    "India Gully reviews the request and confirms what information may be shared and how.",
  ],
];
const faqs = [
  [
    "Why is some information restricted?",
    "Property identity, precise addresses, ownership information, financials and transaction documents can be commercially sensitive. The public brief is designed to support an initial conversation without disclosing the full information set.",
  ],
  [
    "Does accepting an NDA give me immediate access?",
    "No. Acceptance and disclosure approval are separate steps. India Gully reviews the purpose, mandate conditions and authority to disclose before approving information sharing.",
  ],
  [
    "How is my acceptance recorded?",
    "The account workflow records the agreement text and version, a hash of that text, your typed name and organisation, your confirmation of authority and the server-recorded acceptance time. A receipt is retained in your account.",
  ],
  [
    "Can I sign for my organisation?",
    "Only if you are authorised to do so. Enter your own full name and the organisation you represent. Additional authorisation or a separately executed agreement may be required for a particular mandate.",
  ],
  [
    "Can I withdraw my request?",
    "You can withdraw an open request in your account. Withdrawal ends the access request; it does not cancel confidentiality obligations already accepted.",
  ],
  [
    "What if a separate NDA is required?",
    "Some owners, lenders, insolvency professionals or transaction processes require their own documents. India Gully will identify the applicable process. A general website acceptance does not replace those requirements.",
  ],
];
export default function Page() {
  return (
    <main id="main">
      <PageHero
        eyebrow="CONFIDENTIALITY / REGISTERED ACCESS"
        title={
          <>
            A considered process.
            <br />
            <em>A confidential conversation.</em>
          </>
        }
        description="Understand the opportunity before the detail. Our disclosure process connects a verified account, the applicable confidentiality terms and a review of your information request."
      >
        <LinkButton href="/account/nda">
          Manage NDA & access requests
        </LinkButton>
      </PageHero>
      <section className="section-pad">
        <div className="section-heading">
          <div>
            <Eyebrow>THE DISCLOSURE JOURNEY</Eyebrow>
            <h2>
              Four steps.
              <br />
              Clear responsibilities.
            </h2>
          </div>
          <p>
            Each opportunity has its own disclosure conditions. A public
            listing, registration or NDA acceptance does not guarantee access or
            confirm availability.
          </p>
        </div>
        <div className="nda-steps">
          {steps.map(([title, text], i) => (
            <article key={title}>
              <Eyebrow>0{i + 1}</Eyebrow>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="scope-section">
        <div>
          <Eyebrow>INFORMATION HANDLING</Eyebrow>
          <h2>
            Disclosure should
            <br />
            serve a defined purpose.
          </h2>
          <p>
            Keep your evaluation purpose specific. The team can then establish
            which documents are relevant and whether the mandate permits
            disclosure.
          </p>
        </div>
        <ul className="output-list">
          <li>
            <span>01</span>Public briefs without exact addresses
          </li>
          <li>
            <span>02</span>Verified registration and policy acceptance
          </li>
          <li>
            <span>03</span>Versioned agreement and acceptance record
          </li>
          <li>
            <span>04</span>Separate review of each information request
          </li>
        </ul>
      </section>
      <section className="prose-section faq-list">
        <Eyebrow>FREQUENTLY ASKED QUESTIONS</Eyebrow>
        {faqs.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
      <ContactBand
        title="Need clarity before requesting access?"
        interest="NDA and confidential information"
      />
    </main>
  );
}
