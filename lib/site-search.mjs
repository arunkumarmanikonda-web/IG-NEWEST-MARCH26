import {canonicalLocation} from "./customer-experience.mjs";
import { practices } from "./content.mjs";
import { contentPath } from "./content-routes.mjs";
export const searchTypes = {
  practice: "Practices",
  opportunity: "Real estate listings",
  product: "HORECA products",
  retail_space: "Spaces for lease",
  retail_requirement: "Brand requirements",
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
export function buildSearchIndex(records = [], practiceList = practices) {
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
    ...practiceList.map((p) => ({
      href: p.href || "/practices/" + p.slug,
      title: p.title,
      summary: p.intro,
      kind: "practice",
      practice: p.slug,
      location: "",
      keywords: p.services.flat().join(" ")+(["transaction-advisory","debt-special-situations"].includes(p.slug)?" funding debt equity refinance refinancing":""),
    })),
  ];
  // Caller supplies ONLY the published projection. Never accept a draft source.
  for (const r of records) {
    if (r.status && r.status !== "published") continue;
    if (r.kind === "practice" && practiceList.some(p => p.slug === r.slug)) continue;
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
          retail_space:"retail-leasing",retail_requirement:"retail-leasing",
          project: "hospitality",
        }[r.kind] ||
        "",
      location: canonicalLocation(d.city || d.markets || ""),
      keywords: [
        d.seo_keywords,
        d.sku,
        d.brand,
        d.category,
        d.asset_class,
        d.transaction_type,
        d.formats,
        d.markets,
        ...(r.tags || []).map(t=>t.label),
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
  const words = [...new Set(searchWords(q))];
  const score=r=>{
    const title=normaliseSearch(r.title),summary=normaliseSearch(r.summary);
    return (words.length&&title.includes(words.join(' '))?30:0)
      +words.reduce((n,w)=>n+(title.includes(w)?10:0)+(summary.includes(w)?2:0),0)
      +(words.length&&r.kind==='practice'?3:0);
  };
  return index.filter(r=>(!kind||r.kind===kind)&&(!practice||r.practice===practice)&&(!location||canonicalLocation(r.location)===canonicalLocation(location))&&words.every(word=>normaliseSearch([r.title,r.summary,r.location,r.keywords].join(' ')).includes(word)))
    .sort((a,b)=>score(b)-score(a));
}
export function normaliseSearch(value){
 return String(value||'').normalize('NFKC').toLowerCase()
 .replace(/gurgaon/g,'gurugram').replace(/bangalore/g,'bengaluru')
 .replace(/\b(?:distress(?:ed)?|stressed|cirp|insolvency)\b/g,'insolvency')
 .replace(/\b(?:rent(?:al)?|leasing|lease|kiraye|kiraya)\b/g,'lease')
 .replace(/\b(?:fundraising|funding|finance|financing|funds|paisa|raise|raising|capital)\b/g,'funding')
 .replace(/\b(?:buy|purchase|kharidna|sale)\b/g,'sale')
 .replace(/\b(?:crockery|tableware|bartan)\b/g,'tableware')
 .replace(/[^a-z0-9\u0900-\u097f]+/g,' ').trim();
}
export function searchWords(q){return normaliseSearch(q).split(/\s+/).filter(w=>w&&!new Set(['i','am','a','an','the','for','in','me','my','to','is','of','looking','find','show','want','need','mujhe','chahiye','hai','ke','ka','ki','mein','please','opportunities','opportunity']).has(w));}
