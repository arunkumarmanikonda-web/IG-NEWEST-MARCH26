import { practices } from "./content.mjs";
import { contentPath } from "./content-routes.mjs";
export const searchTypes = {
  practice: "Practices",
  opportunity: "Real estate listings",
  product: "HORECA products",
  project: "Selected work",
  article: "Insights",
  person: "Leadership",
  page: "Website pages",
  faq: "FAQs",
};
const pages = [
  ["/about", "About India Gully", "Our story, vision, mission and approach."],
  [
    "/opportunities",
    "Real estate listings",
    "Explore property, investment, hotel and commercial opportunities.",
  ],
  [
    "/horeca",
    "HORECA procurement",
    "Hospitality products, catalogues, sourcing and project procurement.",
  ],
  [
    "/projects",
    "Hospitality, design & PMC",
    "Feasibility, operator selection, programmes, budgets and project delivery.",
  ],
  [
    "/valuation",
    "Valuation studio",
    "Explore indicative asset and business valuation scenarios.",
  ],
  [
    "/contact",
    "Contact India Gully",
    "Discuss your investment, project or procurement requirement.",
  ],
  [
    "/nda",
    "Confidentiality & NDA",
    "Access detailed information through the agreed disclosure process.",
  ],
  [
    "/privacy",
    "Privacy notice",
    "Personal information, permissions and your rights.",
  ],
  [
    "/grievances",
    "Grievances",
    "Contact the grievance officer and raise a concern.",
  ],
  ["/terms", "Website terms", "Terms of use and scope of website information."],
  [
    "/refunds",
    "Refunds and cancellations",
    "Payment, cancellation and refund enquiries.",
  ],
  [
    "/shipping",
    "Delivery and fulfilment",
    "Delivery and project procurement terms.",
  ],
];
export function buildSearchIndex(records = []) {
  const index = [
    ...pages.map(([href, title, summary]) => ({
      href,
      title,
      summary,
      kind: "page",
      practice:
        {
          "/horeca": "horeca",
          "/projects": "hospitality",
          "/opportunities": "real-estate",
        }[href] || "",
      location: "",
      keywords: "",
    })),
    ...practices.map((p) => ({
      href: "/practices/" + p.slug,
      title: p.title,
      summary: p.intro,
      kind: "practice",
      practice: p.slug,
      location: "",
      keywords: p.services.flat().join(" "),
    })),
  ];
  // Caller supplies ONLY the published projection. Never accept a draft source.
  for (const r of records) {
    if (r.status && r.status !== "published") continue;
    const d = r.public_data || {};
    index.push({
      href: contentPath(r),
      title: r.title,
      summary: r.summary || "",
      kind: r.kind,
      practice:
        r.practice ||
        {
          opportunity: "real-estate",
          product: "horeca",
          project: "hospitality",
        }[r.kind] ||
        "",
      location: [d.city, d.region].filter(Boolean).join(", "),
      keywords: [
        d.seo_keywords,
        d.sku,
        d.brand,
        d.category,
        d.asset_class,
        d.transaction_type,
        r.body,
      ]
        .filter(Boolean)
        .join(" ")
        .slice(0, 15000),
    });
  }
  return index;
}
export function filterSearch(
  index,
  { q = "", kind = "", practice = "", location = "" } = {},
) {
  const words = String(q)
    .trim()
    .toLocaleLowerCase("en-IN")
    .split(/\s+/)
    .filter(Boolean);
  return index
    .filter(
      (r) =>
        (!kind || r.kind === kind) &&
        (!practice || r.practice === practice) &&
        (!location || r.location === location) &&
        words.every((word) =>
          [r.title, r.summary, r.location, r.keywords]
            .join(" ")
            .toLocaleLowerCase("en-IN")
            .includes(word),
        ),
    )
    .sort(
      (a, b) =>
        Number(b.title.toLowerCase().includes(q.toLowerCase())) -
        Number(a.title.toLowerCase().includes(q.toLowerCase())),
    );
}
