import { practices, insights, opportunities, contact } from "./content.mjs";

const liveHosts = new Set(["indiagully.com", "www.indiagully.com"]);
export function siteConfig(env = process.env) {
  const candidate =
    env.NEXT_PUBLIC_SITE_URL ||
    (env.VERCEL_URL
      ? `https://${env.VERCEL_URL}`
      : "https://india-gully.vercel.app");
  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid URL");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error("Site URL must be an HTTPS origin");
  const indexable =
    env.SEARCH_INDEXING_ENABLED === "true" &&
    env.VERCEL_ENV === "production" &&
    liveHosts.has(url.hostname);
  return { origin: url.origin, indexable };
}

export const pages = [
  {
    path: "/leadership",
    title: "Our Leadership",
    description:
      "Meet Arun Manikonda, Pavan Manikonda and Amit Jhingan. Explore the experience behind India Gully’s advisory, real estate and hospitality practices.",
  },
  {
    path: "/our-work",
    title: "Selected Work & Experience",
    description:
      "Selected India Gully engagements in transaction advisory, retail leasing, hospitality PMC and HORECA procurement.",
  },
  {
    path: "/nda",
    title: "Confidentiality & NDA Process",
    description:
      "Understand India Gully’s confidential opportunity process, registered access, NDA acceptance and controlled information disclosure.",
  },
  {
    path: "/",
    title: "India Gully | Property. Advisory. Transactions.",
    description:
      "India Gully connects real estate, transaction advisory, debt and special situations, hospitality projects and HORECA procurement in India.",
  },
  {
    path: "/practices",
    title: "Our Advisory Practices",
    description:
      "Explore India Gully’s practices in real estate, transaction advisory, debt, hospitality, retail leasing and entertainment destinations.",
  },
  {
    path: "/opportunities",
    title: "Property Collection | Real Estate & Hospitality",
    description:
      "Discover India Gully’s Property Collection. Explore real estate and hospitality listings by location and asset type, view property briefs and discuss your requirements.",
  },
  {
    path: "/projects",
    title: "Hospitality Design Coordination & PMC",
    description:
      "Connect hospitality feasibility, design coordination, project management, procurement and opening readiness with India Gully.",
  },
  {
    path: "/horeca",
    title: "HORECA Procurement & Project Supplies",
    description:
      "Source hotel, restaurant and café equipment, tableware, linen, housekeeping and operating supplies through India Gully’s procurement team.",
  },
  {
    path: "/valuation",
    title: "Free Property & Hotel Valuation Tools",
    description:
      "Explore property income capitalisation, discounted cash flow and hotel enterprise value using transparent, editable assumptions.",
  },
  {
    path: "/insights",
    title: "Real Estate & Hospitality Perspectives",
    description:
      "Practical perspectives on transaction readiness, hospitality project delivery and HORECA procurement from India Gully.",
  },
  {
    path: "/about",
    title: "About India Gully",
    description:
      "Meet India Gully, an Indian advisory and delivery practice connecting real estate, transactions, capital, hospitality and procurement.",
  },
  {
    path: "/contact",
    title: "Contact India Gully",
    description:
      "Discuss your asset, transaction, hotel project or procurement brief. Contact hello@indiagully.com or +91 89889 88988.",
  },
  {
    path: "/privacy",
    title: "Privacy Notice",
    description:
      "Read how India Gully handles website enquiries, valuation inputs and technical information.",
  },
  {
    path: "/data-usage",
    title: "Data Usage Policy",
    description:
      "Understand account data, policy acceptance and optional communication preferences at India Gully.",
  },
  {
    path: "/terms",
    title: "Terms of Use",
    description:
      "Read the terms for using the India Gully website, public portfolio information and indicative valuation tools.",
  },
  ...practices.map((p) => ({
    path: `/practices/${p.slug}`,
    title: p.title,
    description: p.intro.split(". ")[0] + ".",
    image: p.image,
    type: "service",
    name: p.title,
  })),
  ...insights.map((p) => ({
    path: `/insights/${p.slug}`,
    title: p.title,
    description: p.summary,
    image: p.image,
    type: "article",
  })),
  ...opportunities.map((p) => ({
    path: `/opportunities/${p.slug}`,
    title: p.title,
    description: p.description,
    image: p.image,
    type: "portfolio",
  })),
];
export function pageMeta(path, env = process.env) {
  const page = pages.find((p) => p.path === path);
  if (!page)
    return { title: "Page not found", robots: { index: false, follow: false } };
  const { origin, indexable } = siteConfig(env);
  const image = new URL(page.image || "/images/city.jpg", origin).href;
  return {
    title: path === "/" ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: { canonical: new URL(path, origin).href },
    robots: { index: indexable, follow: indexable },
    openGraph: {
      title: page.title,
      description: page.description,
      url: new URL(path, origin).href,
      siteName: "India Gully",
      locale: "en_IN",
      type: page.type === "article" ? "article" : "website",
      images: [{ url: image, alt: page.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [image],
    },
  };
}
export function structuredData(path, env = process.env) {
  const page = pages.find((p) => p.path === path);
  if (!page) return null;
  const { origin } = siteConfig(env),
    id = origin + "/#organization",
    url = new URL(path, origin).href;
  const organization = {
    "@type": "Organization",
    "@id": id,
    name: "India Gully",
    legalName: "Vivacious Entertainment and Hospitality Private Limited",
    url: origin,
    logo: origin + "/logo-dark.png",
    email: contact.email,
    telephone: contact.tel,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "enquiries",
        email: contact.email,
        telephone: contact.tel,
        availableLanguage: "English",
      },
    ],
  };
  const graph = [
    organization,
    {
      "@type": "WebSite",
      "@id": origin + "/#website",
      url: origin,
      name: "India Gully",
      publisher: { "@id": id },
      inLanguage: "en-IN",
    },
    {
      "@type": "WebPage",
      "@id": url + "#webpage",
      url,
      name: page.title,
      description: page.description,
      isPartOf: { "@id": origin + "/#website" },
    },
  ];
  if (page.type === "service")
    graph.push({
      "@type": "Service",
      name: page.name,
      serviceType: page.name,
      url,
      description: page.description,
      provider: { "@id": id },
      areaServed: { "@type": "Country", name: "India" },
    });
  if (page.type === "article")
    graph.push({
      "@type": "Article",
      headline: page.title,
      description: page.description,
      mainEntityOfPage: url,
      image: new URL(page.image, origin).href,
      author: { "@id": id },
      publisher: { "@id": id },
    });
  if (path !== "/") {
    const parts = path.split("/").filter(Boolean),
      items = [{ name: "Home", item: origin + "/" }];
    parts.forEach((part, i) => {
      const p = "/" + parts.slice(0, i + 1).join("/");
      items.push({
        name: pages.find((x) => x.path === p)?.title || part,
        item: origin + p,
      });
    });
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: items.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        ...p,
      })),
    });
  }
  // No exact address, coordinates, price, availability, review or regulated status is inferred.
  return { "@context": "https://schema.org", "@graph": graph };
}
export const jsonLd = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
