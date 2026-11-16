export function isCirpProject(tags = []) {
  return tags.some(({ slug, label }) =>
    slug === "cirp" || /^(cirp|corporate insolvency resolution process)$/i.test(label?.trim() || "")
  );
}

export function projectNdaDraft(project) {
  const clauses = [
    ["Parties and effective date",
      "This undertaking is given to Vivacious Entertainment and Hospitality Private Limited (CIN U74999DL2017PTC323237), trading as India Gully, by the individual or company identified as the Recipient in the acceptance record. If the Recipient is a company, the person accepting confirms that they have authority to bind it. The effective date is the date of acceptance recorded by the portal."],
    ["Project and permitted purpose",
      "The project is " + project.title + " (the Project). In consideration of India Gully making authorised information available for evaluation, the Recipient agrees to use it solely to assess the Project for the purpose stated in its access request. This undertaking applies only to this Project."],
    ["Confidential information",
      "Confidential Information includes information disclosed for that evaluation by or through India Gully with authority, whether in writing, orally, visually or through the project data room. It includes information identified as confidential or reasonably understood to be confidential, including title records, plans, financial models, valuations, personal data, the substance of discussions and any extracts or analyses that reveal such information."],
    ["Exclusions",
      "The obligations do not apply to information that the Recipient can demonstrate was lawfully known to it without restriction before disclosure, entered the public domain without a breach, was received lawfully from a third party free to disclose it, or was developed independently without use of Confidential Information."],
    ["Permitted recipients and safeguards",
      "The Recipient may disclose only what its personnel and professional advisers need for the stated purpose and only where the applicable project rules permit it. Those persons must be bound by confidentiality duties at least as protective as this undertaking. The Recipient is responsible for their compliance. It shall protect the information with reasonable care, keep credentials personal, observe file permissions and refrain from uploading information to public repositories or third-party AI services without prior written permission. It shall promptly notify India Gully of any unauthorised access or disclosure, identify the affected material and cooperate in containing it."],
    ["Disclosure required by law",
      "If disclosure is required by law or by a competent court, tribunal or regulator, the Recipient may disclose the minimum required. To the extent lawful and practicable, it shall first notify India Gully and cooperate in seeking confidential treatment. Nothing in this undertaking restricts a lawful report to a competent authority."],
    ["Return, deletion and retention",
      "On written request or when the evaluation ends, the Recipient shall promptly cease using the information and return or securely delete copies under its control. On request it shall confirm completion in writing. Copies that must be retained by law or professional obligation, and copies in routine backups that cannot reasonably be separated, remain protected and may be accessed only for the reason they were retained."],
    ["Ownership and transaction process",
      "Rights in the information remain with their respective holders. The Recipient receives permission only to evaluate the Project. It shall direct requests for clarification or site access through the designated project channel. Disclosure creates no offer, exclusivity, commitment to transact or representation of title. Any transaction is subject to independent diligence, requisite approvals and definitive documents. Nothing in this undertaking excludes liability for fraud."],
    ["Duration and remedies",
      "Confidentiality and use restrictions continue for three years from the effective date. Duties governing lawfully retained copies and any longer duties imposed by law or separately accepted process terms continue to the extent applicable. Either party may seek relief available under Indian law, including compensation for a proven breach under the Indian Contract Act, 1872 and injunctive relief from a competent forum under the Specific Relief Act, 1963. Relief is subject to the applicable legal requirements."],
    ["Governing law and jurisdiction",
      "Indian law governs this undertaking. Courts of competent jurisdiction at New Delhi shall have jurisdiction where otherwise competent under applicable law. This clause preserves the jurisdiction of any tribunal or other forum to which a matter is reserved by statute."],
    ["Electronic acceptance and notices",
      "The Recipient accepts the displayed version by selecting its verified legal name, checking the declaration and choosing Accept and Submit. The project, Recipient, authorised signatory, stated purpose, agreement version and time of acceptance form part of the electronic record. The parties intend to contract electronically under section 10A of the Information Technology Act, 2000. India Gully will decide access separately. Notices may be sent to hello@indiagully.com and to the email address registered by the Recipient."]
  ];
  if (project.cirp) {
    clauses.splice(5, 0, ["Corporate insolvency resolution process",
      "For material disclosed in a corporate insolvency resolution process, the Recipient shall observe the applicable directions of the resolution professional and the official process documents. Where section 29(2) of the Insolvency and Bankruptcy Code, 2016 or the applicable IBBI (Insolvency Resolution Process for Corporate Persons) Regulations, 2016 apply, the Recipient shall comply with confidentiality and insider-trading law, safeguard the corporate debtor’s intellectual property and prevent use of the information for undue gain or loss. It may share material with a third party only as permitted by the process and subject to those safeguards.",
      "This portal undertaking does not admit the Recipient as a resolution applicant or entitle it to the information memorandum. Any undertaking, prescribed form, approval or execution formality required by the resolution professional must be completed separately. Mandatory process requirements prevail where they impose different terms."]);
  }
  return {
    title: ("Project Confidentiality Undertaking | " + project.title).slice(0, 180),
    body: clauses.map(([heading, ...paragraphs], index) =>
      (index + 1) + ". " + heading + "\n" + paragraphs.join("\n\n")
    ).join("\n\n"),
  };
}
