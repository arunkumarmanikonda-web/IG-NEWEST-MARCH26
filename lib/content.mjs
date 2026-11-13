import { publicOpportunity } from "./public-opportunities.mjs";
// Baseline editorial content. Configured environments read opportunities and articles from the published CMS.
export const contact = {
  email: "hello@indiagully.com",
  phone: "+91 89889 88988",
  tel: "+918988988988",
};
export const practices = [
  {
    slug: "real-estate",
    number: "01",
    title: "Real Estate Listings & Advisory",
    line: "Find the property. Shape the opportunity.",
    image: "/images/city.jpg",
    intro:
      "Discover and bring to market commercial properties, hospitality assets, land and development opportunities. Our real estate listings connect buyers, investors, owners and occupiers with public property briefs, supported by transaction, leasing and development advice.",
    audience:
      "Landowners, developers, asset owners, investors and family offices.",
    services: [
      ["Property discovery & listings", "Browse real estate listings by location, asset class and transaction objective. Review the public brief, request further information and speak directly with our real estate team."],
      ["Seller representation", "Position your property for the right audience with an approved listing, carefully presented imagery and a clear information brief. Agree the mandate and disclosure boundaries before taking it to market."],
      [
        "Development strategy",
        "Assess the site, catchment, proposed uses and development constraints. Compare area mixes, phasing and capital requirements before committing to a concept.",
      ],
      [
        "Acquisition and divestment",
        "Define the investment brief, assess candidate assets and organise a structured process from initial screening through commercial negotiations.",
      ],
      [
        "Leasing and asset strategy",
        "Review tenant mix, lease economics, operating expenditure and asset positioning to identify practical choices for an owned portfolio.",
      ],
      [
        "Development partnerships",
        "Assess the commercial basis of a joint venture, including contributions, allocation, milestones and responsibilities.",
      ],
    ],
    outputs: [
      "Approved property listing and branded brief",
      "Buyer, investor or occupier enquiry coordination",
      "Asset and market assessment",
      "Development and financial scenarios",
      "Transaction or leasing strategy",
      "Commercial terms and action plan",
    ],
  },
  {
    slug: "transaction-advisory",
    number: "02",
    title: "Transaction Advisory",
    line: "A clear rationale. A disciplined process.",
    image: "/images/prism.jpg",
    intro:
      "Feasibility studies, valuations and focused audits support sound commercial decisions. We combine this analytical work with transaction preparation, due diligence and execution support for acquisitions, divestments and strategic partnerships.",
    audience:
      "Promoters, strategic acquirers, investors, family offices and operating businesses.",
    services: [
      [
        "Transaction preparation",
        "Clarify the seller or buyer objective, assemble the commercial fact base and identify information gaps before approaching counterparties.",
      ],
      ["Feasibility studies", "Assess market demand, positioning, development options, operating assumptions and financial viability. Test sensitivities and translate the analysis into a practical investment or operating plan."],
      ["Valuations", "Assess businesses, assets and opportunities against an agreed purpose, information base and methodology. Present assumptions, sensitivities and limitations clearly; statutory or regulated valuations require the appropriately appointed registered professional."],
      ["Forensic and investigative audits", "Examine agreed transactions, records and control concerns through a documented, evidence-led scope. Trace exceptions, distinguish findings from allegations and present a confidential report with supporting analysis."],
      ["Operational and commercial audits", "Review processes, procurement, revenue controls, operating costs and performance against the agreed brief. Identify gaps and prioritise corrective actions; statutory assurance is separately scoped with qualified professionals."],
      [
        "Investment materials",
        "Develop a concise teaser, investment memorandum, financial scenarios and management presentation appropriate to the stage of disclosure.",
      ],
      [
        "Counterparty engagement",
        "Map the relevant investor or acquirer universe, organise outreach under the agreed mandate and manage commercial queries.",
      ],
      [
        "Diligence and execution support",
        "Coordinate information requests, issue tracking and negotiations alongside the appointed legal, financial, tax and technical advisers.",
      ],
    ],
    outputs: [
      "Transaction readiness assessment",
      "Teaser and investment memorandum",
      "Counterparty and diligence tracker",
      "Commercial negotiation support",
      "Feasibility study and scenario-based financial model",
      "Purpose-specific valuation and assumptions register",
      "Confidential audit findings and corrective-action plan",
    ],
  },
  {
    slug: "debt-special-situations",
    number: "03",
    title: "Debt & Special Situations",
    line: "Clarity when the situation is complex.",
    image: "/images/city.jpg",
    intro:
      "Capital requirements, operating stress and transaction complexity need a structured response. We help promoters and investors assess options, prepare the commercial case and engage with relevant counterparties.",
    audience:
      "Promoters, asset owners, borrowers, investors and stakeholders in stressed businesses.",
    services: [
      [
        "Debt and refinancing advisory",
        "Assess the funding requirement, cash flow profile, repayment assumptions and documentation readiness for a focused lender discussion.",
      ],
      [
        "Capital structure review",
        "Compare funding routes, tenor, security requirements and promoter implications against the business plan and its downside scenarios.",
      ],
      [
        "Stressed asset strategy",
        "Review operating issues, capital needs and stakeholder priorities to assess turnaround, partnership, asset sale or other commercial options.",
      ],
      [
        "Special situation transactions",
        "Support opportunity screening, investor materials and commercial diligence coordination within the relevant transaction process.",
      ],
    ],
    outputs: [
      "Funding and repayment assessment",
      "Lender or investor presentation",
      "Scenario and sensitivity analysis",
      "Stakeholder and transaction action plan",
    ],
  },
  {
    slug: "hospitality",
    number: "04",
    title: "Hospitality & Project Delivery",
    line: "From the first concept to the first guest.",
    image: "/images/dining.jpg",
    intro:
      "Hospitality works when the concept, operating model and delivery plan work together. We connect feasibility and operator strategy with design coordination, project management and opening readiness.",
    audience:
      "Hotel owners, developers, resort promoters, operators and hospitality investors.",
    services: [
      [
        "Feasibility and business planning",
        "Develop the positioning, room and outlet mix, demand assumptions, operating model and financial scenarios around the proposed project.",
      ],
      [
        "Brand and operator selection",
        "Prepare an operator brief and compare commercial proposals, owner obligations, service standards and implementation requirements.",
      ],
      [
        "Design coordination and PMC",
        "Coordinate the owner’s brief, consultant interfaces, programme, budgets, procurement dependencies and project reporting within a defined appointment.",
      ],
      [
        "Procurement and opening readiness",
        "Align furniture, fixtures, equipment and operating supplies with specifications, sample approvals, delivery schedules and handover requirements.",
      ],
    ],
    outputs: [
      "Feasibility and business plan",
      "Operator evaluation and commercial comparison",
      "Project programme and reporting framework",
      "Procurement and opening readiness schedule",
    ],
  },
  {
    slug: "retail-leasing",
    number: "05",
    title: "Retail & Leasing",
    line: "The right mix changes a destination.",
    image: "/images/dining.jpg",
    intro:
      "A successful retail destination needs more than occupied space. We connect catchment understanding, brand mix and commercial terms with the operating experience of the property.",
    audience:
      "Mall and high-street owners, developers, retail brands and F&B operators.",
    services: [
      [
        "Retail positioning",
        "Assess the catchment, customer proposition, competing destinations and mix of uses that supports the property’s role.",
      ],
      [
        "Brand mix and leasing",
        "Prepare the category plan, anchor strategy and tenant target list, then coordinate commercial engagement and negotiations.",
      ],
      [
        "Brand expansion",
        "Translate an operator’s location criteria into a structured site search and comparison of occupancy costs and trading considerations.",
      ],
      [
        "Fit-out and launch coordination",
        "Track handover conditions, tenant interfaces and opening dependencies against the agreed leasing and project programme.",
      ],
    ],
    outputs: [
      "Positioning and catchment brief",
      "Category and brand mix",
      "Site or tenant comparison",
      "Lease commercial and handover tracker",
    ],
  },
  {
    slug: "entertainment",
    number: "06",
    title: "Entertainment & Destinations",
    line: "Give people a reason to return.",
    image: "/images/dining.jpg",
    intro:
      "Entertainment is both a guest experience and an operating business. We help shape destinations around the audience, commercial model and practical requirements of delivery.",
    audience:
      "Destination owners, mixed-use developers, leisure operators and investors.",
    services: [
      [
        "Concept and positioning",
        "Translate the site and target audience into a considered leisure, entertainment or experiential proposition.",
      ],
      [
        "Commercial feasibility",
        "Assess proposed capacity, attendance assumptions, revenue mix, capital requirements and operating scenarios.",
      ],
      [
        "Operator and partner strategy",
        "Define the roles of anchors, specialist operators, F&B partners and supporting services in the destination plan.",
      ],
      [
        "Delivery and operating readiness",
        "Coordinate project interfaces, guest journey planning and opening dependencies with the appointed technical and operating teams.",
      ],
    ],
    outputs: [
      "Destination concept brief",
      "Commercial feasibility scenarios",
      "Operator and partner plan",
      "Guest journey and delivery priorities",
    ],
  },
];
const publicPortfolio = [
  {
    slug: "prism-tower-gurgaon",
    title: "Prism Tower",
    city: "Gurugram",
    sector: "Commercial",
    type: "Mixed-use commercial & hospitality",
    image: "/images/prism.jpg",
    description:
      "A commercial and hospitality asset featured in India Gully’s existing opportunity portfolio.",
    focus: [
      "Acquisition strategy",
      "Commercial assessment",
      "Diligence coordination",
    ],
    contexts: [],
  },
  {
    slug: "hotel-rajshree-chandigarh",
    title: "Hotel Rajshree & Spa",
    city: "Chandigarh",
    sector: "Hospitality",
    type: "Hotel & wellness",
    image: "/images/rajshree.webp",
    description:
      "A hotel and spa opportunity featured in India Gully’s existing hospitality portfolio.",
    focus: [
      "Hospitality acquisition",
      "Operating review",
      "Brand and positioning assessment",
    ],
    contexts: [],
  },
  {
    slug: "heritage-hotel-jaipur",
    title: "Heritage Hotel Structure",
    city: "Jaipur",
    region: "Rajasthan",
    sector: "Hospitality",
    type: "Hospitality development",
    image: null,
    description:
      "A hospitality structure featured in India Gully’s existing portfolio, with development and fit-out considerations to review.",
    focus: ["Development assessment", "Fit-out planning", "Operator strategy"],
    contexts: ["development"],
  },
  {
    slug: "welcomheritage-santa-roza-kasauli",
    title: "Santa Roza, Kasauli",
    city: "Kasauli",
    region: "Himachal Pradesh",
    sector: "Hospitality",
    type: "Hill resort",
    image: "/images/kasauli.jpg",
    description:
      "A resort asset featured in India Gully’s existing hospitality opportunity portfolio.",
    focus: [
      "Resort acquisition",
      "Operating model",
      "Capital and asset planning",
    ],
    contexts: [],
  },
];
export const opportunities = publicPortfolio
  .map((item) => publicOpportunity({ publicationApproved: true, public: item }))
  .filter(Boolean);
export const insights = [
  {
    slug: "transaction-ready",
    category: "TRANSACTION ADVISORY",
    title: "What makes an asset ready for a serious conversation?",
    summary:
      "A clear brief and a consistent fact base give the transaction process a stronger starting point.",
    image: "/images/prism.jpg",
    sections: [
      [
        "Start with the decision",
        "An owner considering a sale, a development partnership or refinancing is asking three different questions. Define the intended outcome, the time available and the constraints before preparing a presentation or beginning counterparty outreach.",
      ],
      [
        "Build one consistent fact base",
        "Bring the asset description, area measurements, ownership information, approvals, leases and financial records into a controlled information set. Separate a documented fact from a management estimate and an adviser’s assumption. Record the date and source of each important figure.",
      ],
      [
        "Make the commercial case inspectable",
        "Show how revenue, costs, capital expenditure and timing support the proposed transaction. Explain sensitivities and information gaps. A polished memorandum is most useful when the underlying assumptions can be followed.",
      ],
      [
        "Sequence disclosure",
        "An introductory teaser and a detailed diligence room serve different purposes. Agree what can be disclosed at each stage, who can receive it and how questions will be tracked. Specialist advisers should review matters within their respective scopes.",
      ],
    ],
  },
  {
    slug: "hospitality-project-brief",
    category: "HOSPITALITY & PROJECTS",
    title: "A hospitality project starts with a better brief.",
    summary:
      "Connect the guest proposition, operating requirements and project budget before design decisions harden.",
    image: "/images/dining.jpg",
    sections: [
      [
        "Define the guest and the occasion",
        "A hotel serving business travel, a leisure resort and a banquet-led property have different operating requirements. Set out the intended guest, stay pattern and role of rooms, food and beverage, events and other facilities.",
      ],
      [
        "Bring operations into design",
        "The design brief should address guest movement, service circulation, storage, kitchens, housekeeping and maintenance alongside the visible experience. Review these interfaces with the relevant design and operating professionals.",
      ],
      [
        "Connect the budget to the programme",
        "Separate building works, interiors, equipment, operating supplies and pre-opening requirements. Track responsibilities, dependencies and decision dates so that a late specification or approval does not become a surprise at handover.",
      ],
      [
        "Treat opening as a workstream",
        "Opening readiness includes staffing, training, operating procedures, supplies, systems and testing. Define acceptance criteria and the handover evidence required from each appointed party.",
      ],
    ],
  },
  {
    slug: "procurement-comparison",
    category: "HORECA PROCUREMENT",
    title: "Compare specifications before comparing prices.",
    summary:
      "A useful procurement comparison makes inclusions, quantities and commercial terms visible.",
    image: "/images/dining.jpg",
    sections: [
      [
        "Keep the requirement identifiable",
        "Assign each requirement a stable line reference. Record the intended use, specification, unit of measure and quantity. Preserve that reference through vendor responses, substitutions, approvals and orders.",
      ],
      [
        "Distinguish a match from a substitution",
        "A similar description does not necessarily represent the same product. Compare material, dimensions, capacity, finish, accessories, warranty and service scope. Identify deviations explicitly and obtain approval before treating alternatives as equivalent.",
      ],
      [
        "Compare the complete commercial basis",
        "Keep base price, taxes, freight, installation and other charges separately visible. Compare minimum quantities, lead times, payment terms and delivery locations alongside price. Mark unquoted lines rather than assigning assumed rates.",
      ],
      [
        "Close the loop with an approval record",
        "Record the selected specification, sample approval, commercial terms and delivery requirement. A change after selection should create a new version so the project team can identify what was ordered and why.",
      ],
    ],
  },
];
