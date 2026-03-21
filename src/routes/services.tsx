import { Hono } from 'hono'
import { layout } from '../lib/layout'
import { HOSPITALITY_BRANDS, RETAIL_BRANDS, ADVISORY_PARTNERS } from '../lib/constants'

const app = new Hono()

const SERVICES = [
  {
    id: 'real-estate',
    icon: '🏛️',
    name: 'Real Estate Advisory',
    tagline: 'End-to-end transaction advisory, strategic site acquisition & institutional asset management',
    desc: 'We advise developers, investors and family offices on the full real estate lifecycle, from site selection and feasibility to transaction structuring, asset management and divestment. Our real estate practice spans commercial, hospitality and mixed-use assets across India.',
    items: ['Strategic Site Acquisition & Investigative Due Diligence','Development Strategy, Feasibility Architecture & Viability Assessment','Transaction Structuring & Institutional Deal Advisory','Institutional Asset Valuation & Independent Appraisal','Capital Markets: Acquisitions & Optimized Divestment','Commercial Lease Structuring & Yield Optimization','End-to-End Portfolio Management & Asset Stewardship','Governance, Regulatory & Statutory Compliance'],
    highlights: [
      { v:'INR 2,100 Cr', l:'Entertainment & Retail Hub, Mumbai MMR, 800,000 sq. ft., 85% pre-leased' },
      { v:'INR 620 Cr',   l:'6–Property Heritage Hotel Portfolio, Rajasthan, 72% TTM occupancy' },
    ],
    partners: [] as string[],
  },
  {
    id: 'retail',
    icon: '🛍️',
    name: 'Retail & Leasing Strategy',
    tagline: 'Retail intelligence, brand mix engineering, anchor structuring & franchise velocity advisory',
    desc: 'India Gully brings 30+ curated retail brand relationships and institutional mall-leasing expertise to developers, destination owners, and retail operators. We synergize across every execution stage — from market intelligence and brand mix strategy to lease structuring, absorption rate management, fit-out coordination, and franchise expansion across Tier–1 and Tier–2 strategic growth corridors.',
    items: ['Retail Intelligence & Opportunity Mapping','Curated Brand Mix & Category Optimization','Anchor Tenant Strategy & Inline Leasing Execution','Lease Term Structuring, Negotiation & Yield Engineering','Portfolio of Strategic Brand Alliances (30+ Active Brands)','Fit-Out Coordination, Design Review & Delivery Management','Mall Operations Consultancy & Performance Benchmarking','Leasing Velocity Advisory & Absorption Rate Management','F&B Destination Advisory & Footfall Yield Optimization','Franchise Expansion Architecture & Territory Mapping'],
    highlights: [
      { v:'30+',      l:'Active retail brand relationships across fashion, F&B and entertainment' },
      { v:'15 Cities', l:'Desi Brand retail franchise expansion mandate, INR 45 Cr, 36-month payback' },
    ],
    partners: ['Brand Partners'],
  },
  {
    id: 'hospitality',
    icon: '🏨',
    name: 'Hospitality Management',
    tagline: 'End-to-end hotel management, brand on-boarding, pre-opening PMC & revenue yield engineering',
    desc: 'India Gully delivers end-to-end hospitality advisory — from pre-opening strategy through operational excellence and long-term asset management. Our hospitality practice has successfully on-boarded and managed 15+ hotel projects across Marriott International, IHG Hotels &amp; Resorts, Radisson Hotel Group, Regenta Hotels by Royal Orchid, and Cygnett Hotels &amp; Resorts, engineered for Revenue Optimization, Advanced Yield Engineering, and Stabilized Occupancy targets.',
    items: ['Pre-Opening Planning, Execution & Project Management Consultancy','Brand Selection, Evaluation & Institutional On-Boarding','Lifecycle Asset Management & Long-Term Brand Stewardship','Operational Excellence & Hospitality Asset Management','Revenue Optimization & Advanced Yield Engineering','Human Capital Strategy, Recruitment & Service Excellence Training','FF&E / OS&E Specification, Procurement & Delivery Management','Mock-Up Room Execution & Pre-Opening Quality Assurance'],
    highlights: [
      { v:'15+', l:'Hotel projects managed and advised across India' },
      { v:'20+', l:'Hospitality brand relationships. Marriott to Lemon Tree' },
    ],
    partners: ['Hotel Partners'],
  },
  {
    id: 'entertainment',
    icon: '🎡',
    name: 'Entertainment Destination and Experiential Economy Advisory',
    tagline: 'Yield-driven experiential economy advisory: FECs, cinema anchors, integrated destinations & techno-commercial feasibility',
    desc: 'India Gully advises on large-format entertainment destinations as a yield-driven experiential economy advisory practice — from Strategic Concept Engineering and operator selection to Techno-Commercial Feasibility, project management, and Lifecycle Asset Management. Our principals bring verified hands-on execution depth from landmark entertainment real estate transactions in India exceeding INR 1,350 Cr.',
    items: ['Strategic Concept Engineering & Destination Master Planning','Anchor Cinema Strategy: Multiplex Site Selection & Operator Alignment','Entertainment Operator Identification, Evaluation & Commercial Alignment','Techno-Commercial Feasibility, Financial Modelling & Business Plan Architecture','Technology, AV Systems & Immersive Experience Infrastructure Advisory','Attraction Design, Programming & Guest Journey Engineering','Revenue Mix Strategy, Dwell-Time Optimization & Yield Engineering','Lifecycle Asset Management: Pre-Opening through Stabilization & Growth','Project Management, Commissioning & Institutional Quality Assurance'],
    highlights: [
      { v:'INR 1,350 Cr+', l:'Entertainment City Limited — 100% shareholder-consented divestment, joint advisory with EY' },
      { v:'INR 500 Cr',    l:'Adlabs Imagica acquisition due diligence advisory' },
    ],
    partners: [] as string[],
  },
  {
    id: 'debt',
    icon: '⚖️',
    name: 'Capital Markets and Special Situations',
    tagline: 'Structured debt advisory & distressed asset resolution',
    desc: 'India Gully operates an institutional credit-desk Capital Markets and Special Situations practice — advising lenders, promoters, institutional investors, and PE funds on Bespoke Debt Syndication, Structured Finance Architecture, Special Situations &amp; Stressed Asset Strategy, NCLT Advisory, and Capital Restructuring. Our cross-vertical depth spanning Hospitality, Real Estate, and Retail constitutes a differentiated intelligence advantage — enabling recovery maximization, enterprise value engineering, and institutional-grade deal execution that generalist advisors cannot replicate.',
    items: ['Bespoke Debt Syndication: Construction Finance, Term Loans & Refinancing Architecture','Special Situations & Stressed Assets: Recovery Strategy, Value Maximisation & Exit Structuring','Capital Restructuring, Balance Sheet Optimization & Promoter Advisory','NCLT Advisory, IBC Insolvency Resolution & Creditor-Side Strategy','Bridge Financing, Mezzanine Structuring & Hybrid Capital Architecture','Asset Monetization: Sale-Leaseback, Development Rights & Capital Recycling','Lender Advisory, Independent Due Diligence & Credit Assessment','Special Situation Fund Deal Origination, Screening & Execution Advisory'],
    highlights: [
      { v:'IBC', l:'NCLT Advisory and Insolvency Resolution Structuring for hotel and real estate assets' },
      { v:'Multi-sector', l:'Cross-vertical debt advisory leveraging hospitality, real estate and retail expertise' },
    ],
    partners: [] as string[],
  },
]

// Helper: logo grid for brands
function brandLogoGrid(brands: any[], title: string, subtitle: string) {
  // Group by category
  const cats = [...new Set(brands.map((b: any) => b.cat))] as string[]
  return `
<div style="margin-top:2.5rem;padding-top:2rem;border-top:1px solid var(--border);">
  <p style="font-size:.65rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:.5rem;">${title}</p>
  <p style="font-size:.78rem;color:var(--ink-muted);margin-bottom:1.5rem;">${subtitle}</p>
  ${cats.map((cat: string) => `
  <div style="margin-bottom:1.5rem;">
    <p style="font-size:.6rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--gold);margin-bottom:.75rem;padding-bottom:.4rem;border-bottom:1px solid rgba(184,150,12,.2);">${cat}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.75rem;">
      ${brands.filter((b: any) => b.cat === cat).map((b: any) => `
      <div style="background:var(--parch);padding:.875rem .75rem;display:flex;flex-direction:column;align-items:center;gap:.4rem;border:1px solid var(--border);transition:all .2s;"
           onmouseover="this.style.borderColor='${b.color}';this.style.background='white'"
           onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--parch)'">
        <img src="${b.svg}" alt="${b.name}" width="140" height="56"
             style="width:140px;height:56px;object-fit:contain;border-radius:2px;"
             loading="lazy" decoding="async">
        <span style="font-size:.56rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-faint);text-align:center;">${b.name}</span>
      </div>`).join('')}
    </div>
  </div>`).join('')}
</div>`
}

app.get('/', async (c) => {
  // ── CMS: fetch published row from D1 ─────────────────────────────────────
  let cmsTitle = '', cmsMeta = '', cmsHeroH = '', cmsHeroSub = '', cmsBodyHtml = ''
  try {
    const db = (c.env as any)?.DB
    if (db) {
      const row = await db.prepare(
        `SELECT title, meta_desc, hero_headline, hero_subheading, body_html
           FROM ig_cms_pages WHERE slug = ? AND status = 'published' LIMIT 1`
      ).bind('/services').first()
      if (row) {
        cmsTitle    = (row.title        as string) || ''
        cmsMeta     = (row.meta_desc    as string) || ''
        cmsHeroH    = (row.hero_headline   as string) || ''
        cmsHeroSub  = (row.hero_subheading as string) || ''
        cmsBodyHtml = (row.body_html    as string) || ''
      }
    }
  } catch (_) { /* D1 unavailable – fall through to defaults */ }

  /* ── CMS body override zone ──────────────────────────────────────────── */
  const cmsZoneHtml = cmsBodyHtml
    ? `<section class="cms-body-override wrap" style="padding:2rem 0;">${cmsBodyHtml}</section>`
    : ''

  const content = `

<!-- ══ SERVICES HERO ════════════════════════════════════════════════════ -->
<div class="hero-dk">
  <div class="hero-dk-grid"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 50% 65% at 30% 50%,rgba(184,150,12,.05) 0%,transparent 55%);pointer-events:none;"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:100px;background:linear-gradient(to bottom,transparent,var(--ink));pointer-events:none;"></div>
  <div class="wrap" style="position:relative;">
    <div style="max-width:720px;" class="fu">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;">
        <div style="width:40px;height:1px;background:linear-gradient(90deg,var(--gold),transparent);"></div>
        <span style="font-size:.6rem;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:var(--gold);">Advisory Services</span>
      </div>
      <h1 class="h1" style="margin-bottom:1.5rem;">Six Specialized Verticals.<br><em style="color:var(--gold);font-style:italic;">One Strategic Vision.</em></h1>
      <p class="lead-lt" style="max-width:580px;margin-bottom:2.5rem;">Six institutional advisory verticals operating in parallel — Real Estate Transaction Structuring, Retail Leasing Velocity &amp; Brand Architecture, Hospitality Management &amp; Asset Stewardship, Entertainment Destination &amp; Experiential Economy Advisory, Capital Markets &amp; Special Situations, and HORECA Lifecycle Management. Delivered by domain specialists with verified India market execution depth across INR 2,100 Cr+ of active mandates.</p>
      <div style="display:flex;flex-wrap:wrap;gap:.625rem;">
        ${SERVICES.map((s: any) => `<a href="#${s.id}" class="btn btn-ghost btn-sm">${s.name}</a>`).join('')}
        <a href="/horeca" class="btn btn-ghost btn-sm">HORECA Solutions</a>
      </div>
    </div>
  </div>
</div>

<!-- ══ SERVICES DETAIL ════════════════════════════════════════════════════ -->
${SERVICES.map((s, i) => `
<div id="${s.id}" class="${i%2===0 ? 'sec-wh' : 'sec-pc'}" style="padding-top:6.5rem;padding-bottom:6.5rem;">
  <div class="wrap">
    <div style="display:grid;grid-template-columns:5fr 4fr;gap:5rem;align-items:start;" class="mob-stack">

      <!-- Left -->
      <div class="reveal-l">
        <div style="display:flex;align-items:center;gap:1.25rem;margin-bottom:2rem;">
          <div class="ig-icon-box" style="width:64px;height:64px;">
            <span style="font-size:1.65rem;">${s.icon}</span>
          </div>
          <div>
            <span style="font-size:.58rem;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:var(--gold);">Advisory Vertical — Institutional Grade Execution</span>
          </div>
        </div>
        <h2 class="h2" style="margin-bottom:.875rem;">${s.name}</h2>
        <p style="font-size:.875rem;color:var(--gold);font-weight:500;letter-spacing:.04em;margin-bottom:1.5rem;">${s.tagline}</p>
        <p class="lead" style="margin-bottom:2.5rem;">${s.desc}</p>

        <!-- Service items grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;">
          ${s.items.map((item: string) => `
          <div class="service-item">
            <div style="width:20px;height:20px;background:rgba(184,150,12,.1);border:1px solid rgba(184,150,12,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:.05rem;">
              <i class="fas fa-check" style="color:var(--gold);font-size:.52rem;"></i>
            </div>
            <span style="font-size:.82rem;color:var(--ink-soft);">${item}</span>
          </div>`).join('')}
        </div>

        ${s.id === 'hospitality' ? brandLogoGrid(HOSPITALITY_BRANDS, 'Hotel Brand Partners', 'India Gully holds active advisory and management relationships with these hotel brands across India.') : ''}
        ${s.id === 'retail' ? brandLogoGrid(RETAIL_BRANDS, 'Retail Brand Partners', 'Active leasing relationships across fashion, F&B, entertainment and anchor categories.') : ''}
      </div>

      <!-- Right -->
      <div class="reveal-r">
        <div style="background:var(--ink);padding:2.5rem;margin-bottom:1.75rem;position:relative;overflow:hidden;">
          <!-- Gold top accent -->
          <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent);"></div>
          <p class="eyebrow-lt" style="margin-bottom:1.75rem;">Track Record</p>
          <div style="display:flex;flex-direction:column;gap:1.5rem;">
            ${s.highlights.map((h: any) => `
            <div style="padding-bottom:1.5rem;border-bottom:1px solid rgba(255,255,255,.06);transition:padding-left .2s;" onmouseover="this.style.paddingLeft='.75rem'" onmouseout="this.style.paddingLeft='0'">
              <div style="font-family:'DM Serif Display',Georgia,serif;font-size:2.4rem;color:var(--gold);line-height:.95;margin-bottom:.5rem;letter-spacing:-.03em;">${h.v}</div>
              <p style="font-size:.83rem;color:rgba(255,255,255,.5);line-height:1.75;">${h.l}</p>
            </div>`).join('')}
          </div>
        </div>

        <div class="ig-callout" style="padding:2rem;">
          <p style="font-size:.6rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:.75rem;">Initiate Strategic Consultation and Intake</p>
          <p style="font-size:.875rem;color:var(--ink-soft);line-height:1.8;margin-bottom:1.5rem;">Interested in this advisory vertical? Our leadership team reviews all submissions within 24 hours.</p>
          <div style="display:flex;flex-direction:column;gap:.625rem;margin-bottom:1.5rem;">
            ${[{icon:"check",t:"Boardroom-grade advisory execution depth"},{icon:"check",t:"Pan-India mandate pipeline"},{icon:"check",t:"Immediate Diagnostic Review Window commitment"}].map(b=>`<div style="display:flex;align-items:center;gap:.5rem;font-size:.8rem;color:var(--ink-muted);"><i class="fas fa-${b.icon}" style="color:var(--gold);font-size:.6rem;flex-shrink:0;"></i>${b.t}</div>`).join('')}
          </div>
          <a href="/contact?service=${s.id}" class="btn btn-g" style="width:100%;justify-content:center;">Strategic Consultation and Intake <i class="fas fa-arrow-right" style="margin-left:.4rem;font-size:.6rem;"></i></a>
        </div>
      </div>
    </div>
  </div>
</div>
`).join('')}

<!-- ══ TRANSACTION ADVISORY PARTNERS ════════════════════════════════════ -->
<div class="sec-wh" style="padding-top:5rem;padding-bottom:5rem;">
  <div class="wrap">
    <div style="text-align:center;max-width:640px;margin:0 auto 3rem;">
      <div class="gr-c"></div>
      <p class="eyebrow" style="margin-bottom:.75rem;">Institutional Collaborations &amp; Strategic Alliances</p>
      <h2 class="h2">Institutional Collaborations &amp; Strategic Alliances: Advisory Network</h2>
      <p class="lead" style="margin-top:1rem;max-width:520px;margin-left:auto;margin-right:auto;">India Gully synergizes with globally recognised advisory and consulting firms — bringing institutional credibility, multi-disciplinary expertise, and deep financial rigour to every mandate. </p>
    </div>

    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--border);margin-bottom:2rem;">
      ${ADVISORY_PARTNERS.map((p: any) => `
      <div style="background:#fff;padding:2.25rem 1.25rem;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;transition:background .2s;min-height:160px;" onmouseover="this.style.background='#f9f7f2'" onmouseout="this.style.background='#fff'">
        <div style="height:56px;display:flex;align-items:center;justify-content:center;">
          <img src="${p.logo}" alt="${p.name}" style="max-height:40px;max-width:130px;width:auto;height:auto;object-fit:contain;display:block;"
               onerror="this.style.display='none';this.parentElement.nextElementSibling.style.display='flex'">
        </div>
        <div style="display:none;height:56px;align-items:center;justify-content:center;">
          <span style="font-family:'DM Serif Display',Georgia,serif;font-size:1.3rem;font-weight:700;color:var(--ink);">${p.abbr}</span>
        </div>
        <div>
          <div style="font-size:.75rem;font-weight:700;color:var(--ink);margin-bottom:.2rem;">${p.name}</div>
          <div style="font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);">${p.sub}</div>
        </div>
      </div>`).join('')}
    </div>

    <div style="border:1px solid var(--border);padding:1.25rem 1.5rem;display:flex;gap:.75rem;align-items:flex-start;max-width:820px;margin:0 auto;">
      <i class="fas fa-handshake" style="color:var(--gold);font-size:.875rem;margin-top:.1rem;flex-shrink:0;"></i>
      <p style="font-size:.8rem;color:var(--ink-muted);line-height:1.8;">India Gully synergizes with EY, CBRE, ANAROCK, Pipara and Co, and Resurgent India on select mandates where multi-disciplinary expertise, spanning financial due diligence, real estate capital markets, property consultancy, chartered accounting and investment banking, is required for complex, large-format transactions.</p>
    </div>
  </div>
</div>

<!-- ══ HORECA CTA ═════════════════════════════════════════════════════════ -->
<div class="sec-md">
  <div class="wrap" style="display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center;">
    <div>
      <div class="gr-lt"></div>
      <p class="eyebrow" style="margin-bottom:.75rem;">HORECA Solutions</p>
      <h2 class="h2-lt" style="margin-bottom:1.25rem;">Integrated HORECA Procurement &amp; Supply Chain Orchestration</h2>
      <p class="lead-lt" style="margin-bottom:2rem;">Precision procurement engineered for scale and delivered with logistical excellence — kitchen equipment, FF&amp;E, OS&amp;E, linens, uniforms, and guest amenities specified, sourced, and installed on schedule.</p>
      <a href="/horeca" class="btn btn-g">Explore HORECA Solutions</a>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,.06);">
      ${['FF&amp;E Procurement','OS&amp;E Sourcing','Kitchen Equipment','Linen &amp; Tableware','Uniforms','Guest Amenities','Turnkey Supply','Ongoing Contracts'].map(item => `
      <div style="padding:1.25rem;background:rgba(255,255,255,.02);">
        <i class="fas fa-check" style="color:var(--gold);font-size:.65rem;margin-right:.5rem;"></i>
        <span style="font-size:.78rem;color:rgba(255,255,255,.5);">${item}</span>
      </div>`).join('')}
    </div>
  </div>
</div>

<!-- ══ BOTTOM CTA ══════════════════════════════════════════════════════════ -->
<div class="sec-dk" style="position:relative;overflow:hidden;">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 80% at 50% 50%,rgba(184,150,12,.05) 0%,transparent 70%);pointer-events:none;"></div>
  <div class="wrap" style="text-align:center;max-width:720px;margin:0 auto;position:relative;">
    <div class="gr-c"></div>
    <p class="eyebrow-lt" style="margin-bottom:.75rem;">Initiate a Mandate Engagement</p>
    <h2 class="h2-lt" style="margin-bottom:1.25rem;">Initiate a Confidential Mandate Engagement</h2>
    <p class="lead-lt" style="max-width:520px;margin:0 auto 2.5rem;">Every mandate submission is reviewed by Executive Leadership within the Immediate Diagnostic Review Window. A Pre-Mandate Confidentiality Protocol is executed upon engagement commencement. Six specialized verticals, one institutional platform.</p>
    <div style="display:flex;flex-wrap:wrap;gap:.875rem;justify-content:center;">
      <a href="/contact"  class="btn btn-g">Submit a Mandate Enquiry</a>
      <a href="/listings" class="btn btn-ghost-g">View Active Mandates</a>
    </div>
  </div>
</div>

${cmsZoneHtml}`
  return c.html(layout(cmsTitle || 'Advisory Services', content, {
    description: 'India Gully advisory services. Real Estate, Retail & Leasing, Hospitality Management, Entertainment Destination and Experiential Economy Advisory, Capital Markets and Special Situations, HORECA Solutions. Pan-India presence.',
    canonical: 'https://india-gully.pages.dev/services',
    ogImage: 'https://india-gully.pages.dev/static/og.jpg',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Advisory Services',
      provider: { '@type': 'Organization', name: 'India Gully', url: 'https://india-gully.pages.dev' },
      areaServed: { '@type': 'Country', name: 'India' },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'India Gully Advisory Services',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Real Estate Advisory' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Retail & Leasing' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Hospitality Management' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Entertainment Destination and Experiential Economy Advisory' } },

          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Capital Markets and Special Situations' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'HORECA Solutions' } }
        ]
      }
    }
  }))
})

export default app
