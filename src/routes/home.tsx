import { Hono } from 'hono'
import { layout } from '../lib/layout'
import { VERTICALS, LISTINGS, HOSPITALITY_BRANDS, RETAIL_BRANDS, ADVISORY_PARTNERS } from '../lib/constants'

// ── RECENT INSIGHTS (3 latest) ───────────────────────────────────────────────
const RECENT_INSIGHTS = [
  {
    id: 'horeca-cloud-kitchen-india-2026',
    category: 'HORECA',
    date: 'March 2026',
    readTime: '9 min read',
    title: 'Cloud Kitchens & Dark Stores: India\'s HORECA Infrastructure Revolution',
    excerpt: 'India\'s online food delivery GMV crossed ₹1,00,000 Cr in Q3 FY26. We map the cloud kitchen formats, dark store real estate economics, and the investment models disrupting traditional HORECA infrastructure.',
    img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80',
    color: '#065F46',
  },
  {
    id: 'india-hospitality-brand-strategy-2026',
    category: 'Hospitality',
    date: 'March 2026',
    readTime: '12 min read',
    title: 'Hotel Brand Affiliation in India 2026: Choosing the Right Flag for Your Asset',
    excerpt: 'Marriott, IHG, Hyatt, or domestic? Fee structures, contract lengths, territorial protection, exit clauses — a comprehensive MC framework for asset owners navigating India\'s crowded hotel brand landscape.',
    img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&auto=format&fit=crop&q=80',
    color: '#1A3A6B',
  },
  {
    id: 'entertainment-destination-development-india-2026',
    category: 'Entertainment',
    date: 'March 2026',
    readTime: '10 min read',
    title: 'Building India\'s Next Entertainment Destination: Development Economics & Operational Model',
    excerpt: 'A pipeline of 35+ large-format entertainment projects in 2026-29. We break down capex benchmarks, revenue splits, operator structures, and the investor framework for India\'s experiential leisure boom.',
    img: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&auto=format&fit=crop&q=80',
    color: '#7C3AED',
  },
]

const app = new Hono()

// ── HERO SLIDES ─────────────────────────────────────────────────────────────
// 3 Active Mandate slides + 3 Advisory Service slides
const SLIDES = [
  // ── MANDATE 1: Prism Tower, Gurgaon ────────────────────────────────────
  {
    bg: '#030610',
    tag: 'Active Mandate · Gurgaon · INR 400 Cr · Due Diligence Stage',
    h1a: 'Prism Tower',
    h1b: 'Gurgaon.',
    h1c: '312 Keys · Mixed-Use · REIT-Grade · Leasing Velocity Active',
    sub: 'Institutional-grade mixed-use commercial building on Gurgaon-Faridabad Road, part of a 4-star hotel complex. 312 keys. REIT listing potential. India Gully advising on acquisition & due diligence.',
    cta1: { text: 'Access Mandate Brief — Pre-Mandate Confidentiality Protocol', href: '/listings/prism-tower-gurgaon' },
    cta2: { text: 'Initiate Strategic Consultation', href: 'https://wa.me/919810889134?text=Hi%20Arun%2C%20I%20am%20interested%20in%20Prism%20Tower%20Gurgaon%20mandate' },
    img: '/static/mandates/prism/prism-tower-hero.jpg',
    label: 'REIT-Grade · INR 400 Cr',
    spoc: 'Arun Manikonda',
    value: 'INR 400 Cr',
    type: 'mandate',
  },
  // ── MANDATE 2: Belcibo Multi-Brand F&B Platform ─────────────────────────
  {
    bg: '#0a0008',
    tag: 'Growth Equity · Delhi NCR & Goa · INR 100 Cr · Active Fundraise',
    h1a: 'Belcibo',
    h1b: 'F&B Platform.',
    h1c: '15+ Outlets · Pan-India Rollout · Absorption Rate: 72%',
    sub: 'Scalable multi-brand F&B platform — Imperfecto, Noor, Begam, Khybani, Informal, RuinPub, Patio & more. Seeking strategic growth equity partner for pan-India expansion. Exclusive advisory mandate with India Gully.',
    cta1: { text: 'Access Mandate Brief — Pre-Mandate Confidentiality Protocol', href: '/listings/belcibo-hospitality-platform' },
    cta2: { text: 'Submit Expression of Interest', href: 'https://wa.me/919810889134?text=Hi%20Arun%2C%20interested%20in%20Belcibo%20growth%20equity%20mandate' },
    img: '/static/mandates/belcibo/belcibo-cover.jpg',
    label: 'Growth Equity · INR 100 Cr',
    spoc: 'Arun Manikonda',
    value: 'INR 100 Cr',
    type: 'mandate',
  },
  // ── MANDATE 3: Sawasdee JLG Galleria, Noida ─────────────────────────────
  {
    bg: '#020b14',
    tag: 'Outright Sale · Noida · INR 150 Cr · Negotiation Ready',
    h1a: 'Sawasdee JLG',
    h1b: 'Galleria.',
    h1c: '114 Keys · Integrated Hotel + Retail · Noida · Execution Scope: Full Divestment',
    sub: 'Structure-ready 114-key hotel with integrated retail mall in Sector 63, Noida. Independent hotel access, possession-ready. India Gully holds the exclusive sale mandate. Outright sale — negotiation ready.',
    cta1: { text: 'Access Mandate Brief — Pre-Mandate Confidentiality Protocol', href: '/listings/sawasdee-jlg-noida' },
    cta2: { text: 'Initiate Strategic Consultation', href: 'https://wa.me/919810889134?text=Hi%20Arun%2C%20interested%20in%20Sawasdee%20JLG%20Galleria%20Noida%20mandate' },
    img: '/static/mandates/sawasdee/sawasdee-cover.jpg',
    label: 'Hotel + Mall · INR 150 Cr',
    spoc: 'Arun Manikonda',
    value: 'INR 150 Cr',
    type: 'mandate',
  },
  // ── ADVISORY 1: Capital Markets and Strategic Transaction Ecosystem ───────────────────────────────────
  {
    bg: '#040408',
    tag: 'Capital Markets and Strategic Transaction Ecosystem · Real Estate · Hospitality · Retail',
    h1a: 'India Gully',
    h1b: 'Advisory.',
    h1c: 'INR 2,000 Cr+ Transacted Across Verticals',
    sub: "India's premier multi-vertical advisory — Real Estate acquisitions, Hospitality asset sales, Retail leasing, Entertainment divestments and Debt solutions. EY & CBRE co-advisory credentials. NDA-governed mandates.",
    cta1: { text: 'Access Active Strategic Mandates', href: '/listings' },
    cta2: { text: 'Initiate Mandate Submission', href: '/contact' },
    img: '/static/mandates/hero/hero-ig-advisory-skyline.jpg',
    label: 'Capital Markets and Strategic Transaction Ecosystem',
    type: 'advisory',
  },
  // ── ADVISORY 2: Growth Equity & F&B Platform Advisory ──────────────────
  {
    bg: '#050408',
    tag: 'Growth Equity Advisory · F&B Platforms · HORECA Solutions',
    h1a: 'Growth Capital',
    h1b: 'Advisory.',
    h1c: 'F&B · Hospitality · Entertainment',
    sub: "India Gully structures and executes growth equity rounds for India's most exciting F&B platforms and hospitality brands. Proprietary deal flow. Institutional-grade information memoranda. NDA-protected pipeline.",
    cta1: { text: 'Explore Advisory Services', href: '/services' },
    cta2: { text: 'Strategic Consultation and Intake', href: '/contact' },
    img: '/static/mandates/hero/hero-fine-dining.jpg',
    label: 'Portfolio Management — Growth Equity - F and B',
    type: 'advisory',
  },
  // ── ADVISORY 3: HORECA & Procurement ───────────────────────────────────
  {
    bg: '#050404',
    tag: 'HORECA Solutions · Procurement · FF&E · OS&E · Pan-India',
    h1a: 'HORECA',
    h1b: 'Solutions.',
    h1c: '500+ SKUs · 15+ Hotel Properties',
    sub: "India Gully's HORECA division is the complete hospitality supply partner — FF&E, OS&E, kitchen equipment, linen, uniforms and guest amenities delivered on spec and on schedule across India.",
    cta1: { text: 'Explore HORECA Services', href: '/horeca' },
    cta2: { text: 'Request a Quote', href: '/horeca#enquiry' },
    img: '/static/mandates/hero/hero-hotel-products.jpg',
    label: 'Strategic Advisory — HORECA Institutional Procurement',
    type: 'advisory',
  },
]

app.get('/', async (c) => {
  // ── CMS: fetch published row from D1 ─────────────────────────────────────
  let cmsTitle = '', cmsMeta = '', cmsHeroH = '', cmsHeroSub = '', cmsBodyHtml = ''
  try {
    const db = (c.env as any)?.DB
    if (db) {
      const row = await db.prepare(
        `SELECT title, meta_desc, hero_headline, hero_subheading, body_html
           FROM ig_cms_pages WHERE slug = ? AND status = 'published' LIMIT 1`
      ).bind('/').first()
      if (row) {
        cmsTitle    = (row.title        as string) || ''
        cmsMeta     = (row.meta_desc    as string) || ''
        cmsHeroH    = (row.hero_headline   as string) || ''
        cmsHeroSub  = (row.hero_subheading as string) || ''
        cmsBodyHtml = (row.body_html    as string) || ''
      }
    }
  } catch (_) { /* D1 unavailable - fall through to defaults */ }

  /* ── CMS body override zone ──────────────────────────────────────────── */
  const cmsZoneHtml = cmsBodyHtml
    ? `<section class="cms-body-override wrap" style="padding:2rem 0;">${cmsBodyHtml}</section>`
    : ''

  const content = `

<!-- ══ HERO CAROUSEL ════════════════════════════════════════════════════ -->
<div class="car">
  <div class="car-track">
    ${SLIDES.map((s, i) => `
    <div class="car-slide${i === 0 ? ' on' : ''}">
      <!-- Full-bleed background with Ken Burns -->
      <div class="car-bg" style="background-image:url('${s.img}');background-color:${s.bg};"></div>
      <!-- Cinematic layered overlays -->
      <div class="car-ov-main"></div>
      <div class="car-ov-btm"></div>
      <div class="car-ov-gold"></div>
      <!-- Gold grid texture -->
      <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(184,150,12,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(184,150,12,.025) 1px,transparent 1px);background-size:88px 88px;pointer-events:none;"></div>
      <!-- Star / particle canvas overlay -->
      <canvas class="hero-stars" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.55;z-index:1;"></canvas>
      <div class="car-body">
        <div class="wrap" style="width:100%;">
          <div style="max-width:760px;">

            <!-- Tag line — slides in from left -->
            <div class="s-tag" style="display:flex;align-items:center;gap:.875rem;margin-bottom:2rem;">
              <div style="width:36px;height:1px;background:linear-gradient(90deg,var(--gold),var(--gold-lt));flex-shrink:0;"></div>
              <span style="font-size:.6rem;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:var(--gold);">${s.tag}</span>
            </div>

            <!-- Display headline -->
            <div class="s-txt">
              <h1 style="font-family:'DM Serif Display',Georgia,serif;font-size:clamp(2.75rem,6vw,5.5rem);line-height:1.01;color:#fff;letter-spacing:-.025em;font-weight:400;margin-bottom:1.75rem;">
                ${s.h1a}<br>
                <em style="font-style:italic;color:var(--gold);display:inline-block;position:relative;">${s.h1b}<span style="position:absolute;bottom:-.15em;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent);opacity:.5;"></span></em><br>
                <span style="font-size:.48em;font-weight:300;color:rgba(255,255,255,.42);letter-spacing:-.01em;">${s.h1c}</span>
              </h1>
              <p style="font-size:.98rem;line-height:1.82;color:rgba(255,255,255,.62);max-width:540px;margin-bottom:2rem;font-weight:400;">${s.sub}</p>
            </div>

            <!-- CTAs -->
            <div class="s-cta" style="display:flex;flex-wrap:wrap;gap:1rem;align-items:center;">
              <a href="${s.cta1.href}" class="btn btn-g" style="min-width:200px;justify-content:center;">${s.cta1.text}</a>
              <a href="${s.cta2.href}" ${(s as any).type === 'mandate' && s.cta2.href.startsWith('https://wa.me') ? 'target="_blank" rel="noopener"' : ''} class="btn btn-ghost" style="min-width:160px;justify-content:center;">${s.cta2.text}</a>
            </div>

            ${(s as any).type === 'mandate' && (s as any).spoc ? `
            <!-- Mandate SPOC strip -->
            <div class="hero-spoc-strip" style="display:inline-flex;align-items:center;gap:.75rem;margin-top:1.25rem;padding:.5rem 1rem .5rem .5rem;background:rgba(0,0,0,.35);backdrop-filter:blur(8px);border:1px solid rgba(184,150,12,.25);">
              <div style="width:32px;height:32px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:.78rem;flex-shrink:0;">A</div>
              <div>
                <div style="font-size:.55rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:.15rem;">Strategic Lead · India Gully</div>
                <div style="font-size:.78rem;font-weight:600;color:#fff;">${(s as any).spoc}</div>
              </div>
              <div style="width:1px;height:28px;background:rgba(255,255,255,.12);margin:0 .25rem;"></div>
              <div>
                <div style="font-size:.55rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:.15rem;">Mandate Value</div>
                <div style="font-family:'DM Serif Display',Georgia,serif;font-size:1rem;color:var(--gold);">${(s as any).value}</div>
              </div>
            </div>` : ''}

          </div>
        </div>
      </div>

      <!-- Slide label — bottom right -->
      <div class="hero-slide-label" style="position:absolute;bottom:2.25rem;right:2rem;z-index:3;display:flex;flex-direction:column;align-items:flex-end;gap:.35rem;">
        ${(s as any).type === 'mandate' ? `<div style="background:rgba(184,150,12,.85);padding:.22rem .6rem;font-size:.52rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#fff;margin-bottom:.25rem;">Active Mandate - Pre-Mandate Confidentiality Protocol Required</div>` : `<div style="background:rgba(26,58,107,.7);padding:.22rem .6rem;font-size:.52rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:.25rem;">Advisory Services</div>`}
        <div style="width:1px;height:40px;background:linear-gradient(180deg,transparent,rgba(184,150,12,.5));margin-left:auto;"></div>
        <span style="font-size:.58rem;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.3);">${s.label}</span>
      </div>
    </div>
    `).join('')}
  </div>

  <!-- Controls -->
  <div class="car-ct"></div>
  <button class="car-arr car-prev" aria-label="Previous slide"><i class="fas fa-chevron-left"></i></button>
  <button class="car-arr car-next" aria-label="Next slide"><i class="fas fa-chevron-right"></i></button>
  <div class="car-dots" role="tablist">
    ${SLIDES.map((_,i) => `<button class="c-dot${i===0?' on':''}" role="tab" aria-label="Go to slide ${i+1}"></button>`).join('')}
  </div>
  <div class="car-pb" aria-hidden="true"></div>

  <!-- Scroll hint -->
  <div style="position:absolute;bottom:2.5rem;left:50%;transform:translateX(-50%);z-index:10;display:flex;flex-direction:column;align-items:center;gap:.5rem;">
    <span style="font-size:.55rem;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.25);">Scroll</span>
    <div style="width:1px;height:32px;background:linear-gradient(180deg,rgba(184,150,12,.4),transparent);animation:pulse-line 2s ease-in-out infinite;"></div>
  </div>
</div>
<style>
@keyframes pulse-line{0%,100%{opacity:.3;transform:scaleY(.8)}50%{opacity:.8;transform:scaleY(1)}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
</style>
<script>
(function(){
  /* ── Hero star/particle canvas ── */
  function initStars(canvas){
    var W = canvas.offsetWidth || window.innerWidth;
    var H = canvas.offsetHeight || window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    if(!ctx) return;
    var COUNT = Math.min(Math.floor(W * H / 8000), 120);
    var stars = Array.from({length: COUNT}, function(){
      return {
        x:  Math.random() * W,
        y:  Math.random() * H,
        r:  Math.random() * 1.2 + 0.2,
        sp: Math.random() * 0.4 + 0.05,
        op: Math.random() * 0.6 + 0.15,
        tw: Math.random() * Math.PI * 2,
        ts: Math.random() * 0.015 + 0.005
      };
    });
    var raf;
    function draw(){
      ctx.clearRect(0, 0, W, H);
      stars.forEach(function(s){
        s.tw += s.ts;
        s.y  -= s.sp;
        if(s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }
        var alpha = s.op * (0.6 + 0.4 * Math.sin(s.tw));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,220,100,' + alpha.toFixed(2) + ')';
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return function(){ cancelAnimationFrame(raf); };
  }
  var destroyers = [];
  function startAll(){
    destroyers.forEach(function(d){ d(); });
    destroyers = [];
    document.querySelectorAll('.hero-stars').forEach(function(c){
      destroyers.push(initStars(c));
    });
  }
  /* start after hero loads */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', startAll);
  } else {
    setTimeout(startAll, 200);
  }
  /* Pause stars on non-active slides to save CPU */
  var obs = new MutationObserver(function(){
    document.querySelectorAll('.car-slide').forEach(function(slide){
      var c = slide.querySelector('.hero-stars');
      if(!c) return;
      c.style.opacity = slide.classList.contains('on') ? '0.55' : '0';
    });
  });
  document.querySelectorAll('.car-slide').forEach(function(s){
    obs.observe(s, {attributes:true, attributeFilter:['class']});
  });
})();
</script>

<!-- ══ STATS BAR ════════════════════════════════════════════════════════ -->
<div style="position:relative;z-index:1;" id="homeStatsSection">
  <div id="homeStats">
    ${[
      { n:'INR 2,100 Cr+', l:'Active Advisory Pipeline',      sub:'Active mandates under advisory', icon:'chart-line' },
      { n:'15+',         l:'Hotel Projects',          sub:'Pre-opening & PMC mandates', icon:'hotel' },
      { n:'30+',         l:'Retail Brand Partners',   sub:'Leasing & franchise advisory', icon:'store' },
      { n:'20+',         l:'Hospitality Brands',      sub:'Management & on-boarding', icon:'concierge-bell' },
      { n:'Pan-India',   l:'Operations Reach',        sub:'Tier-1, 2 &amp; 3 cities', icon:'map-marked-alt' },
    ].map((s) => `
    <div class="home-stat-cell">
      <i class="fas fa-${s.icon}" style="font-size:.7rem;color:var(--gold);opacity:.6;display:block;margin-bottom:.625rem;"></i>
      <div class="stat-n count-up" data-target="${s.n}" style="font-size:2.7rem;letter-spacing:-.03em;">${s.n}</div>
      <div style="font-size:.62rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--ink);margin-top:.4rem;margin-bottom:.2rem;">${s.l}</div>
      <div style="font-size:.67rem;color:var(--ink-muted);">${s.sub}</div>
    </div>`).join('')}
  </div>
</div>
<!-- gold rule separator -->
<div class="sec-sep"></div>

<!-- ══ TRUST & PARTNERSHIPS ═══════════════════════════════════════════ -->
<div class="trust-partnerships-section" style="background:linear-gradient(180deg,rgba(251,249,245,.96),rgba(255,255,255,.98));border-top:1px solid rgba(193,154,107,.16);border-bottom:1px solid rgba(193,154,107,.16);padding:1.15rem 0 1.25rem;">
  <div class="wrap">
    <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:1rem 1.5rem;margin-bottom:1rem;">
      <div>
        <div style="font-size:.68rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:.3rem;">Trust & Partnerships</div>
        <div style="font-family:'DM Serif Display',Georgia,serif;font-size:1.35rem;line-height:1.2;color:var(--ink);">Institutional-grade advisory credibility with operator-level execution.</div>
      </div>
      <div style="font-size:.8rem;line-height:1.7;color:var(--ink-muted);max-width:420px;">
        Selected collaborations include <strong style="color:var(--ink);">EY</strong>, <strong style="color:var(--ink);">CBRE India</strong>, <strong style="color:var(--ink);">ANAROCK</strong> and sector-specific operating partners.
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem;">
      <div style="display:flex;align-items:center;gap:.6rem;padding:.78rem .9rem;background:#fff;border:1px solid rgba(16,24,40,.08);border-radius:12px;">
        <i class="fas fa-handshake" style="color:var(--gold);font-size:.9rem;flex-shrink:0;"></i>
        <div style="font-size:.8rem;font-weight:700;color:var(--ink);line-height:1.35;">EY Co-Advisory Partner</div>
      </div>

      <div style="display:flex;align-items:center;gap:.6rem;padding:.78rem .9rem;background:#fff;border:1px solid rgba(16,24,40,.08);border-radius:12px;">
        <i class="fas fa-shield-alt" style="color:var(--gold);font-size:.9rem;flex-shrink:0;"></i>
        <div style="font-size:.8rem;font-weight:700;color:var(--ink);line-height:1.35;">CERT-In Compliant</div>
      </div>

      <div style="display:flex;align-items:center;gap:.6rem;padding:.78rem .9rem;background:#fff;border:1px solid rgba(16,24,40,.08);border-radius:12px;">
        <i class="fas fa-lock" style="color:var(--gold);font-size:.9rem;flex-shrink:0;"></i>
        <div style="font-size:.8rem;font-weight:700;color:var(--ink);line-height:1.35;">OWASP Top-10 Secure</div>
      </div>

      <div style="display:flex;align-items:center;gap:.6rem;padding:.78rem .9rem;background:#fff;border:1px solid rgba(16,24,40,.08);border-radius:12px;">
        <i class="fas fa-chart-line" style="color:var(--gold);font-size:.9rem;flex-shrink:0;"></i>
        <div style="font-size:.8rem;font-weight:700;color:var(--ink);line-height:1.35;">INR 2,100 Cr+ Active Pipeline</div>
      </div>

      <div style="display:flex;align-items:center;gap:.6rem;padding:.78rem .9rem;background:#fff;border:1px solid rgba(16,24,40,.08);border-radius:12px;">
        <i class="fas fa-hotel" style="color:var(--gold);font-size:.9rem;flex-shrink:0;"></i>
        <div style="font-size:.8rem;font-weight:700;color:var(--ink);line-height:1.35;">15+ Hotel Projects Executed</div>
      </div>

      <div style="display:flex;align-items:center;gap:.6rem;padding:.78rem .9rem;background:#fff;border:1px solid rgba(16,24,40,.08);border-radius:12px;">
        <i class="fas fa-map-marked-alt" style="color:var(--gold);font-size:.9rem;flex-shrink:0;"></i>
        <div style="font-size:.8rem;font-weight:700;color:var(--ink);line-height:1.35;">Pan-India Operations</div>
      </div>
    </div>
  </div>
</div>

<!-- ══ PAN-INDIA PRESENCE MAP ════════════════════════════════════════════ -->
<div class="map-presence-section" style="background:var(--parch);padding:5rem 0;border-top:1px solid var(--border);overflow:hidden;">
  <div class="wrap">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center;" class="mob-stack">
      <!-- Left: copy -->
      <div class="fu">
        <div class="gr"></div>
        <p class="eyebrow" style="margin-bottom:1rem;">Pan-India Execution Footprint</p>
        <h2 class="h2" style="margin-bottom:1.25rem;">Active Mandates<br>Across India</h2>
        <p class="body-lg" style="margin-bottom:2rem;color:var(--ink-soft);">India Gully operates across Tier-1, 2 and 3 markets — from Delhi NCR and Mumbai to Kasauli, Chail, Chandigarh and Jaipur. Our active mandates span 8+ cities with INR 2,100 Cr+ in combined advisory value.</p>
        <!-- City list -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:2rem;">
          ${[
            { city:'Delhi NCR',       sub:'Gurugram · Noida · Shalimar Bagh', pin:'#B8960C' },
            { city:'Chandigarh',      sub:'Hotel Rajshree & Spa', pin:'#065F46' },
            { city:'Himachal Pradesh',sub:'Kasauli · Chail · Shimla', pin:'#1A3A6B' },
            { city:'Jaipur',          sub:'Heritage Hotel Corridor', pin:'#7C3AED' },
            { city:'Mumbai',          sub:'BKC · Lower Parel', pin:'#B8960C' },
            { city:'Bengaluru',       sub:'Whitefield · MG Road', pin:'#065F46' },
          ].map(c => `
          <div class="city-pin-card" style="display:flex;align-items:flex-start;gap:.625rem;padding:.625rem;background:var(--surface);border:1px solid var(--border);transition:border-color .2s;" onmouseover="this.style.borderColor='${c.pin}44'" onmouseout="this.style.borderColor='var(--border)'">
            <div style="width:8px;height:8px;border-radius:50%;background:${c.pin};flex-shrink:0;margin-top:.25rem;"></div>
            <div>
              <div class="map-city-name" style="font-size:.75rem;font-weight:700;color:var(--ink);">${c.city}</div>
              <div class="map-city-sub" style="font-size:.62rem;color:var(--ink-faint);">${c.sub}</div>
            </div>
          </div>`).join('')}
        </div>
        <div style="display:flex;gap:.875rem;flex-wrap:wrap;">
          <a href="/listings" class="btn btn-g" style="font-size:.75rem;"><i class="fas fa-map-marked-alt" style="margin-right:.4rem;font-size:.65rem;"></i>Access Active Strategic Mandates</a>
          <a href="/pipeline" class="btn btn-dko" style="font-size:.75rem;"><i class="fas fa-chart-bar" style="margin-right:.4rem;font-size:.65rem;"></i>Pipeline Dashboard</a>
        </div>
      </div>
      <!-- Right: SVG India map -->
      <div style="position:relative;" id="indiaMapWrap" class="india-map-wrap">
        <div class="india-map-box" style="border:1px solid var(--border);padding:1.25rem 1rem 1rem;position:relative;overflow:hidden;border-radius:3px;">
          <!-- India SVG map — geographically accurate, viewBox 520×600 -->
          <svg id="igIndiaMap" viewBox="0 0 440 500" width="100%" style="display:block;max-width:440px;margin:0 auto;" aria-label="India map showing active mandate locations">
            <defs>
              <filter id="mapPinGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="mapShadow" x="-5%" y="-5%" width="115%" height="120%">
                <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="rgba(0,0,0,0.12)"/>
              </filter>
              <style>
                .india-state { fill: #d4cdb8; stroke: #a39070; stroke-width: 0.6; stroke-linejoin: round; }
                .india-state:hover { fill: #c8bfa5; }
                .map-pin-label { font-family: "DM Sans", sans-serif; font-size: 8px; font-weight: 700; fill: currentColor; }
                .map-pin-sub { font-family: "DM Sans", sans-serif; font-size: 6px; fill: currentColor; opacity: 0.65; }
              </style>
            </defs>

            <!-- J&K Full Claim Polygon — covers POK/Gilgit-Baltistan (left lobe), Indian J&K/Ladakh (centre), Aksai Chin (right) per Survey of India claimed boundary -->
            <path id="jk-full-claim" d="M89.8,88.0L82.3,65.8L71.9,44.4L67.4,24.7L82.3,6.6L112.3,3.3L134.7,1.6L157.2,4.9L179.6,11.5L187.1,32.9L179.6,60.9L161.7,82.2L134.7,88.0L104.8,88.0Z"
              fill="rgba(26,58,107,0.08)" stroke="#1A3A6B" stroke-width="1.2" stroke-dasharray="3,2.5" stroke-linejoin="round"/>
            <text x="127" y="40" font-family="DM Sans,sans-serif" font-size="6.5" font-weight="700" fill="#1A3A6B" opacity=".7" text-anchor="middle">J&amp;K</text>
            <text x="127" y="50" font-family="DM Sans,sans-serif" font-size="5.2" fill="#1A3A6B" opacity=".5" text-anchor="middle">India's Claim</text>

            <!-- India States — generated from GADM GeoJSON, simplified for SVG rendering -->
            <g id="india-states" filter="url(#mapShadow)">
              <path class="india-state" d="M213.3,332.6L211.4,332.4L213.4,335.0L208.0,337.8L199.3,338.4L193.4,348.7L189.2,346.2L183.0,349.6L179.7,359.4L183.7,386.3L181.2,381.6L179.7,383.8L183.6,387.4L179.1,384.7L175.2,390.2L170.5,388.1L166.3,393.3L159.6,392.5L157.3,398.6L154.6,399.8L152.0,398.7L152.7,395.9L155.9,395.8L157.8,389.1L154.6,388.2L155.0,384.0L150.4,383.0L150.7,379.5L146.4,378.1L144.8,381.4L140.9,382.4L140.6,379.8L136.9,378.4L136.7,381.1L134.1,381.3L132.6,374.4L140.2,379.0L139.4,375.0L141.7,372.8L133.3,373.1L133.8,369.2L130.7,367.3L130.8,359.7L135.4,360.7L136.5,358.7L133.8,352.6L136.0,350.2L135.2,345.9L141.8,345.6L143.1,338.7L137.7,336.6L141.2,334.7L139.9,324.3L144.5,319.8L140.8,318.3L144.0,312.0L142.1,304.3L148.3,298.0L145.5,294.6L147.1,290.1L151.7,291.2L153.8,287.6L153.8,280.1L161.8,282.6L166.7,287.5L167.7,285.0L171.1,286.9L176.2,285.7L178.6,288.5L177.6,298.3L188.4,303.0L189.9,308.7L193.5,308.7L194.6,315.0L203.0,314.5L209.2,310.5L212.7,311.8L215.9,302.7L218.2,307.7L220.7,304.3L224.5,305.3L223.9,301.0L229.6,297.9L228.3,295.3L230.5,296.0L233.0,292.6L239.9,299.3L243.3,298.7L244.8,294.9L249.2,292.6L240.5,306.4L214.3,325.9L213.3,332.6Z"/>
              <path class="india-state" d="M420.0,124.9L423.5,126.9L419.3,129.9L420.1,132.7L425.5,129.8L426.8,134.8L421.6,140.8L427.5,139.9L438.5,144.3L438.3,149.2L431.0,153.8L434.7,162.2L426.9,157.8L419.1,160.1L406.3,169.1L405.6,163.2L417.9,157.8L415.4,156.9L414.0,151.9L417.3,148.1L394.7,154.8L391.6,153.4L385.3,162.7L380.2,164.9L367.8,163.3L359.6,165.7L358.2,156.1L351.4,154.4L351.3,149.9L356.8,152.2L361.1,149.9L366.3,150.5L369.0,147.7L368.2,145.5L376.1,142.1L377.9,137.0L386.7,136.5L391.0,129.8L397.2,125.4L399.7,128.4L408.8,130.6L414.3,125.3L420.0,124.9Z"/>
              <path class="india-state" d="M416.9,148.5L414.0,152.0L415.4,156.9L417.9,157.9L410.3,159.6L392.5,172.7L391.9,171.2L387.5,181.6L384.8,183.4L384.4,180.9L377.8,187.8L380.0,191.7L374.5,199.8L373.5,206.4L370.3,206.9L369.4,204.6L364.9,210.9L361.1,209.0L361.6,198.4L365.3,198.8L365.2,194.9L370.0,193.1L366.4,189.1L367.7,187.0L363.7,184.4L360.4,185.7L362.4,179.0L356.8,180.3L355.3,178.4L353.0,181.9L351.6,179.8L346.4,184.9L342.2,181.2L329.9,181.0L326.2,187.8L326.5,181.3L323.6,177.2L326.1,168.2L334.2,165.5L338.6,167.7L353.3,167.1L367.8,163.3L373.2,165.3L382.7,164.5L391.6,153.4L394.7,154.8L411.8,148.2L416.9,148.5Z"/>
              <path class="india-state" d="M240.4,155.5L247.9,158.4L248.3,163.2L256.7,167.9L263.1,166.0L266.3,171.0L273.4,170.2L279.4,173.4L284.5,170.7L288.5,174.6L296.7,172.4L298.8,174.4L301.8,171.3L302.5,174.8L295.4,181.6L299.4,188.8L295.0,189.4L295.9,193.5L292.0,191.0L288.2,193.1L284.1,203.2L277.5,203.2L275.2,207.1L269.2,200.3L264.5,199.6L263.5,203.6L254.9,206.9L250.5,204.4L246.0,208.4L243.0,203.8L231.2,204.5L228.9,193.5L240.1,184.9L248.0,184.8L239.4,178.7L241.2,174.2L237.2,172.9L239.9,169.8L244.8,170.0L239.4,165.7L236.1,158.6L240.4,155.5Z"/>
              <path class="india-state" d="M228.6,211.5L235.3,219.7L238.7,219.1L239.1,227.2L244.3,231.5L238.7,236.6L238.7,239.9L233.0,242.7L232.4,248.5L228.7,254.2L229.7,256.6L227.8,256.1L226.6,260.1L218.3,259.8L215.7,265.2L214.0,264.2L214.6,277.7L219.4,278.8L219.4,281.2L217.5,282.4L206.9,277.9L206.6,280.2L209.7,282.2L209.1,286.9L211.5,288.2L212.4,296.5L201.8,307.2L199.6,314.7L194.5,315.0L193.5,308.7L189.9,308.7L189.8,304.8L182.6,299.1L184.7,291.2L187.5,288.5L190.2,290.4L192.3,287.4L187.1,281.7L184.9,282.1L187.1,277.6L184.7,274.7L188.2,273.2L185.8,259.5L189.0,257.4L189.7,250.6L195.5,238.7L203.1,237.1L207.9,228.2L211.1,227.2L211.6,224.2L207.6,220.8L203.0,221.2L203.0,214.6L216.5,216.7L220.7,213.7L225.6,214.9L228.6,211.5Z"/>
              <path class="india-state" d="M137.5,133.8L139.3,139.2L136.7,140.8L132.4,139.2L133.4,134.1L137.5,133.8Z"/>
              <path class="india-state" d="M87.7,347.9L89.5,350.7L93.3,349.9L94.6,355.9L92.1,362.1L88.2,359.3L86.3,354.0L88.0,353.9L84.7,348.8L87.7,347.9Z"/>
              <path class="india-state" d="M61.2,202.6L73.4,207.8L76.1,205.1L78.0,207.1L75.8,210.1L78.2,212.9L80.1,211.0L80.0,216.6L84.4,219.3L84.0,222.1L91.1,224.7L96.6,231.8L95.2,235.4L90.2,237.0L93.9,239.4L90.6,240.0L91.7,246.5L86.7,248.8L88.0,251.4L86.3,252.0L87.4,254.2L94.4,254.2L83.4,259.5L88.1,262.6L88.7,266.5L84.6,269.5L81.3,267.0L81.0,275.3L78.4,276.6L75.7,276.0L76.2,272.8L70.7,276.5L72.9,266.4L68.4,257.8L70.7,253.3L68.6,253.2L72.1,251.3L67.7,251.4L67.2,246.6L68.3,242.6L73.3,241.3L66.9,242.7L65.1,239.7L63.8,247.0L64.1,244.1L61.8,246.2L64.2,252.0L61.4,259.1L45.5,266.7L42.9,267.1L43.1,263.2L40.8,262.5L39.8,266.4L31.3,260.6L25.9,251.6L24.4,251.8L25.5,253.5L23.7,252.1L14.0,240.8L15.9,238.0L18.4,241.7L32.3,236.9L37.2,228.3L35.0,230.6L32.1,229.0L25.4,234.0L21.9,233.2L9.8,227.1L8.7,225.7L11.3,224.1L7.3,221.3L11.4,215.2L7.7,216.0L9.9,214.5L8.2,213.7L11.2,213.7L11.5,208.3L29.8,210.4L38.4,206.2L38.4,209.0L41.8,209.5L46.7,206.5L44.7,204.2L46.3,202.0L61.2,202.6Z"/>
              <path class="india-state" d="M131.8,100.3L136.5,103.5L137.3,106.9L143.1,108.7L136.0,118.5L137.5,132.7L133.4,134.1L131.7,138.0L141.3,140.8L142.2,148.4L134.8,150.5L133.8,153.2L132.2,143.9L127.3,148.0L126.3,145.0L123.6,144.5L122.7,150.1L118.8,149.8L118.4,146.0L120.7,145.0L112.7,137.5L110.3,126.9L105.6,127.3L102.0,124.5L98.4,125.8L98.5,118.8L96.4,118.2L97.3,115.5L105.7,116.1L107.7,122.2L111.0,117.9L119.9,118.9L122.9,116.9L122.4,112.1L128.3,113.4L127.5,110.4L130.6,107.6L133.2,108.3L131.8,100.3Z"/>
              <path class="india-state" d="M131.3,61.7L139.1,68.5L144.9,66.0L148.9,72.4L154.7,69.5L153.3,73.6L155.7,73.7L155.7,77.9L160.7,82.0L159.5,85.4L161.5,88.3L159.7,89.9L164.0,96.5L154.5,93.6L147.5,95.8L144.5,102.2L146.3,106.0L142.8,108.5L136.1,105.8L136.5,103.5L128.4,98.3L128.8,94.8L124.7,91.1L121.9,93.3L117.7,82.8L113.0,80.6L118.3,75.0L116.5,66.7L131.3,61.7Z"/>
              <path class="india-state" d="M147.7,25.8L150.8,25.0L149.0,27.1L152.9,37.8L163.8,43.7L159.7,48.0L159.8,54.8L165.2,61.8L170.2,62.6L169.3,65.9L172.2,72.0L163.7,76.3L160.3,70.6L153.8,74.2L154.7,69.5L148.9,72.4L144.9,66.0L139.1,68.5L130.9,61.4L116.5,66.7L118.2,71.4L111.8,77.5L105.5,74.0L99.9,74.0L99.9,68.2L97.4,69.8L89.7,62.3L92.3,58.1L88.8,53.8L93.4,49.6L87.7,48.4L89.1,44.8L86.0,43.1L88.9,37.8L95.1,36.0L115.6,40.7L129.5,36.7L130.5,34.0L134.2,33.8L146.5,24.6L147.7,25.8Z"/>
              <path class="india-state" d="M292.3,191.6L297.9,198.4L293.7,210.7L290.2,213.4L286.9,212.4L287.0,216.0L280.3,215.9L280.3,218.2L275.0,219.2L272.9,222.6L269.2,219.9L266.4,222.1L267.2,227.4L276.5,229.7L274.7,233.2L279.8,236.5L281.7,241.8L274.9,241.0L269.0,236.7L267.1,246.4L264.9,246.1L265.5,244.1L259.4,243.3L257.0,245.9L253.3,244.5L254.5,238.1L243.0,240.4L238.7,237.4L244.4,230.5L240.9,230.1L239.1,227.2L238.7,219.1L235.3,219.7L228.6,211.5L229.6,204.9L238.5,202.7L240.3,205.2L243.1,203.9L246.0,208.4L250.5,204.4L254.9,206.9L263.5,203.6L264.5,199.6L269.2,200.3L275.2,207.1L277.5,203.2L284.1,203.2L286.0,195.7L292.3,191.6Z"/>
              <path class="india-state" d="M139.3,304.3L139.6,306.4L143.2,306.9L144.0,312.0L140.8,318.3L144.5,319.7L139.9,324.3L141.2,334.7L137.7,336.6L143.1,339.5L141.8,345.6L134.6,347.0L136.1,349.9L133.8,352.6L136.7,358.0L135.4,360.7L130.9,359.5L130.7,367.3L133.8,369.2L133.4,373.2L136.5,371.5L140.0,373.9L140.0,371.7L141.7,372.8L139.4,375.0L140.2,379.0L132.6,374.4L134.1,381.3L136.7,381.1L136.9,378.4L141.3,382.3L148.8,377.9L150.4,383.0L155.0,384.0L154.6,388.2L157.8,389.1L155.9,395.8L154.3,394.6L152.4,397.5L146.6,395.8L143.0,399.1L141.2,406.5L145.1,407.1L144.2,410.8L141.5,410.9L140.5,413.9L132.7,413.4L131.8,416.8L125.4,415.3L120.9,410.3L117.3,410.7L110.7,405.1L109.3,400.2L102.4,397.5L95.3,368.1L90.9,363.9L94.6,355.9L93.3,349.9L90.9,349.7L94.9,348.0L96.5,343.6L95.0,343.4L96.9,342.6L93.6,335.3L99.8,334.4L103.5,328.8L107.6,330.5L108.7,328.6L114.5,328.5L113.9,320.0L125.0,322.8L124.3,318.1L127.1,315.4L129.6,316.7L133.6,308.4L135.9,309.0L139.3,304.3Z"/>
              <path class="india-state" d="M104.3,396.9L110.6,401.7L113.0,407.4L125.4,413.9L122.9,418.7L127.3,420.5L126.1,423.3L130.1,422.8L131.1,425.5L129.0,427.5L132.7,430.0L131.5,437.8L133.8,439.2L137.6,437.0L136.5,449.1L140.1,450.9L136.2,458.8L138.2,466.5L136.6,470.3L127.5,460.6L124.0,450.4L123.0,443.1L124.6,450.4L126.8,450.3L125.0,444.8L122.5,440.3L122.7,443.0L117.2,424.0L108.4,409.7L110.4,407.6L107.4,409.7L102.4,397.5L104.3,396.9Z"/>
              <path class="india-state" d="M154.6,166.1L164.0,169.1L166.1,174.7L160.3,184.4L161.2,186.5L155.6,187.5L153.6,190.6L155.8,194.6L151.6,199.1L154.8,208.6L156.7,206.7L161.0,210.2L163.6,207.3L157.6,192.5L155.5,192.0L158.9,189.4L160.6,190.8L160.1,188.5L161.6,189.6L163.0,187.5L163.7,190.6L160.8,191.8L163.4,191.0L162.2,194.0L164.1,192.2L166.0,194.9L168.6,194.5L168.5,191.1L171.4,192.3L170.0,194.9L176.8,195.1L176.7,192.8L182.8,189.7L185.3,193.9L183.1,196.4L187.9,194.2L190.6,195.7L189.4,194.5L192.1,193.5L190.9,197.6L195.9,198.5L197.9,194.0L201.1,195.5L202.3,193.5L208.2,199.5L211.7,199.6L213.2,203.1L220.2,202.5L218.6,210.9L220.9,213.7L216.5,216.7L203.0,214.6L203.0,221.2L207.6,220.8L211.6,224.2L211.1,227.2L207.9,228.2L203.1,237.1L195.5,238.7L188.7,256.9L185.0,256.1L182.9,252.1L172.1,253.4L167.5,250.4L163.1,254.3L155.6,254.1L154.8,252.2L143.0,256.3L140.5,253.6L143.3,253.4L142.3,250.8L138.5,249.8L131.2,252.5L128.6,259.1L123.5,261.1L120.8,256.2L108.9,255.9L97.9,251.1L96.1,245.5L91.0,245.9L90.6,240.0L93.9,239.4L90.0,237.6L95.2,235.4L96.6,231.8L94.3,228.5L100.6,226.0L97.2,224.1L103.5,219.2L104.3,212.6L100.7,208.5L102.3,205.5L100.1,204.7L101.4,200.1L102.8,202.4L104.7,200.4L102.2,200.1L101.9,197.3L105.1,199.0L106.8,196.0L109.6,196.0L108.3,198.5L110.6,199.0L107.5,198.2L107.6,201.3L116.9,201.1L118.0,205.6L115.2,206.5L116.8,211.9L114.9,213.6L112.1,212.3L113.1,216.4L119.0,214.2L122.1,207.7L122.5,209.6L127.2,210.4L129.7,208.4L132.7,211.0L131.5,204.4L133.7,205.6L135.2,203.8L131.3,199.7L133.5,198.8L132.1,196.6L140.2,194.9L139.6,190.0L130.8,191.6L126.5,184.9L136.1,176.4L154.6,166.1Z"/>
              <path class="india-state" d="M96.0,245.4L98.3,251.4L108.9,255.9L120.8,256.2L123.5,261.1L128.6,259.1L131.2,252.5L138.5,249.8L142.3,250.8L143.3,253.4L140.5,253.6L143.0,256.3L154.8,252.2L155.6,254.1L163.1,254.3L167.5,250.4L172.1,253.4L182.9,252.1L185.0,256.1L189.0,257.2L185.4,260.7L188.2,273.2L184.7,274.7L187.1,277.6L184.9,282.1L187.1,281.7L192.3,287.4L190.2,290.4L186.1,289.6L183.0,295.3L184.1,298.2L180.6,300.4L177.4,297.9L178.6,288.5L175.8,285.4L171.1,286.9L167.7,285.0L166.7,287.5L161.8,282.6L153.8,280.1L153.8,287.6L151.7,291.2L147.1,290.1L145.5,294.6L148.3,298.0L143.1,302.5L142.7,306.4L139.6,306.4L139.0,304.0L135.9,309.0L133.6,308.4L129.6,316.7L127.1,315.4L124.3,318.1L125.0,322.8L113.9,320.0L114.5,328.5L108.7,328.6L107.6,330.5L103.5,328.8L99.8,334.4L93.6,335.3L96.9,342.6L95.0,343.4L96.5,343.6L94.9,348.0L89.9,350.7L87.6,347.6L84.2,348.4L81.4,343.4L76.6,314.3L73.5,307.9L75.9,309.0L75.9,306.1L73.3,305.8L72.4,300.1L75.1,295.1L71.7,296.9L69.4,281.1L72.7,275.0L77.3,277.8L80.9,275.4L81.4,267.0L84.6,269.5L88.7,266.5L88.1,262.6L83.4,259.5L86.8,259.5L88.8,255.7L94.5,253.4L87.4,254.2L86.7,248.8L96.0,245.4Z"/>
              <path class="india-state" d="M396.4,186.1L398.0,189.2L396.5,193.2L398.9,196.3L390.2,215.5L372.5,211.2L374.5,199.8L378.9,192.4L382.0,193.4L385.4,187.5L392.4,188.6L396.4,186.1Z"/>
              <path class="india-state" d="M355.8,178.6L356.8,180.3L362.5,179.1L360.4,185.7L363.7,184.4L367.8,187.1L366.4,189.1L370.0,193.1L364.8,196.1L359.0,193.6L334.9,194.4L325.7,191.9L328.4,186.7L326.6,184.5L329.9,181.0L342.2,181.2L346.4,184.9L355.8,178.6Z"/>
              <path class="india-state" d="M369.9,206.2L373.2,206.7L372.5,211.2L377.9,212.2L379.5,218.3L378.8,227.2L377.3,229.4L374.9,228.7L376.0,241.6L371.6,246.8L368.7,243.4L367.1,246.3L361.8,216.1L362.4,209.0L364.9,210.9L369.4,204.6L369.9,206.2Z"/>
              <path class="india-state" d="M405.9,165.0L403.7,172.8L405.5,179.0L401.3,187.4L397.2,189.1L396.3,185.3L392.5,188.6L385.4,187.5L382.0,193.3L380.4,192.7L377.8,187.8L384.4,180.9L384.8,183.4
