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
  } catch (_) { /* D1 unavailable – fall through to defaults */ }

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
              <h1 style="font-family:'DM Serif Display',Georgia,serif;font-size:clamp(3.4rem,7.5vw,7rem);line-height:1.01;color:#fff;letter-spacing:-.025em;font-weight:400;margin-bottom:1.75rem;">
                ${s.h1a}<br>
                <em style="font-style:italic;color:var(--gold);display:inline-block;position:relative;">${s.h1b}<span style="position:absolute;bottom:-.15em;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent);opacity:.5;"></span></em><br>
                <span style="font-size:.48em;font-weight:300;color:rgba(255,255,255,.42);letter-spacing:-.01em;">${s.h1c}</span>
              </h1>
              <p style="font-size:1.05rem;line-height:1.9;color:rgba(255,255,255,.62);max-width:560px;margin-bottom:2.5rem;font-weight:400;">${s.sub}</p>
            </div>

            <!-- CTAs -->
            <div class="s-cta" style="display:flex;flex-wrap:wrap;gap:1rem;align-items:center;">
              <a href="${s.cta1.href}" class="btn btn-g" style="min-width:200px;justify-content:center;">${s.cta1.text}</a>
              <a href="${s.cta2.href}" ${(s as any).type === 'mandate' && s.cta2.href.startsWith('https://wa.me') ? 'target="_blank" rel="noopener"' : ''} class="btn btn-ghost" style="min-width:160px;justify-content:center;">${s.cta2.text}</a>
            </div>

            ${(s as any).type === 'mandate' && (s as any).spoc ? `
            <!-- Mandate SPOC strip -->
            <div style="display:inline-flex;align-items:center;gap:.75rem;margin-top:1.5rem;padding:.5rem 1rem .5rem .5rem;background:rgba(0,0,0,.35);backdrop-filter:blur(8px);border:1px solid rgba(184,150,12,.25);">
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
      <div style="position:absolute;bottom:3.5rem;right:2.5rem;z-index:3;display:flex;flex-direction:column;align-items:flex-end;gap:.35rem;">
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

<!-- ══ GOLD SERVICE TICKER ═══════════════════════════════════════════════ -->
<div class="ticker" role="marquee" aria-label="India Gully services">
  <div class="ticker-tr">
    ${[
      'Real Estate Capital Markets and Strategic Transaction Ecosystem','Capital Markets and Strategic Transaction Ecosystem','Retail Leasing Strategy',
      'Hotel Management Advisory','Entertainment Destinations','Debt & Special Situations',
      'HORECA Solutions','Brand On-Boarding','Financial Feasibility','Project Management',
      'Asset Management','Greenfield Hotels','Mall Leasing','FF&E Procurement',
      'INR 1,165 Cr+ Pipeline','15+ Hotel Projects','35+ Retail Brands','Pan-India Execution Footprint'
    ].map(t=>`<span style="font-size:.62rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(0,0,0,.75);padding:0 2.5rem;">${t}</span><span style="color:rgba(0,0,0,.25);font-size:.45rem;flex-shrink:0;">◆</span>`).join('')}
    ${[
      'Real Estate Capital Markets and Strategic Transaction Ecosystem','Capital Markets and Strategic Transaction Ecosystem','Retail Leasing Strategy',
      'Hotel Management Advisory','Entertainment Destinations','Debt & Special Situations',
      'HORECA Solutions','Brand On-Boarding','Financial Feasibility','Project Management',
      'Asset Management','Greenfield Hotels','Mall Leasing','FF&E Procurement',
      'INR 1,165 Cr+ Pipeline','15+ Hotel Projects','35+ Retail Brands','Pan-India Execution Footprint'
    ].map(t=>`<span style="font-size:.62rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(0,0,0,.75);padding:0 2.5rem;">${t}</span><span style="color:rgba(0,0,0,.25);font-size:.45rem;flex-shrink:0;">◆</span>`).join('')}
  </div>
</div>

<!-- ══ STATS BAR ════════════════════════════════════════════════════════ -->
<div style="position:relative;z-index:1;" id="homeStatsSection">
  <div id="homeStats">
    ${[
      { n:'INR 1,165 Cr+', l:'Active Advisory Pipeline',      sub:'Active mandates under advisory', icon:'chart-line' },
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

<!-- ══ CREDENTIALS PROOF BAR ════════════════════════════════════════════ -->
<div id="proofBar" style="background:#0c0c18;border-top:1px solid rgba(184,150,12,.15);border-bottom:1px solid rgba(184,150,12,.15);padding:.85rem 0;overflow:hidden;position:relative;">
  <!-- subtle animated gold line top -->
  <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 0%,rgba(184,150,12,.4) 30%,rgba(212,174,42,.6) 50%,rgba(184,150,12,.4) 70%,transparent 100%);animation:goldShimmer 3s ease-in-out infinite;"></div>
  <div class="proof-track" style="display:flex;align-items:center;gap:0;white-space:nowrap;animation:proofScroll 38s linear infinite;">
    ${[
      { icon:'shield-alt',     color:'#22c55e', text:'CERT-In Compliant' },
      { icon:'check-double',   color:'#B8960C', text:'OWASP Top-10 Secure' },
      { icon:'handshake',      color:'#60a5fa', text:'EY Co-Advisory Partner' },
      { icon:'chart-line',     color:'#B8960C', text:'INR 1,165 Cr+ Active Pipeline' },
      { icon:'hotel',          color:'#a78bfa', text:'15+ Hotel Projects Executed' },
      { icon:'store',          color:'#34d399', text:'35+ Retail Brand Partnerships' },
      { icon:'building',       color:'#60a5fa', text:'CBRE Co-Advisory Partner' },
      { icon:'balance-scale',  color:'#fbbf24', text:'SEBI-Framework Advisory' },
      { icon:'registered',     color:'#B8960C', text:'MCA Registered · CIN U74999DL2017PTC323237' },
      { icon:'map-marked-alt', color:'#a78bfa', text:'Pan-India · Delhi · Chandigarh · Mumbai · Kerala' },
      { icon:'trophy',         color:'#fbbf24', text:'INR 2,000 Cr+ Transactions Advised' },
      { icon:'calendar-alt',   color:'#34d399', text:'Established 2017 · 8+ Years' },
      { icon:'file-contract',  color:'#B8960C', text:'Mutual NDA Framework · All Mandates' },
      { icon:'concierge-bell', color:'#a78bfa', text:'20+ Hospitality Brand Partnerships' },
    ].concat([
      { icon:'shield-alt',     color:'#22c55e', text:'CERT-In Compliant' },
      { icon:'check-double',   color:'#B8960C', text:'OWASP Top-10 Secure' },
      { icon:'handshake',      color:'#60a5fa', text:'EY Co-Advisory Partner' },
      { icon:'chart-line',     color:'#B8960C', text:'INR 1,165 Cr+ Active Pipeline' },
      { icon:'hotel',          color:'#a78bfa', text:'15+ Hotel Projects Executed' },
      { icon:'store',          color:'#34d399', text:'35+ Retail Brand Partnerships' },
    ]).map(item => `
    <span style="display:inline-flex;align-items:center;gap:.5rem;padding:0 2rem;font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.6);">
      <i class="fas fa-${item.icon}" style="color:${item.color};font-size:.58rem;flex-shrink:0;"></i>${item.text}
    </span><span style="color:rgba(184,150,12,.3);font-size:.45rem;flex-shrink:0;">◆</span>`).join('')}
  </div>
  <style>
    @keyframes proofScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes goldShimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
    #proofBar:hover .proof-track { animation-play-state:paused; }
    @media(prefers-reduced-motion:reduce){ .proof-track{animation:none;} }
  </style>
</div>

<!-- ══ PARTNER MARQUEE ══════════════════════════════════════════════════ -->
<div class="partner-marquee-section" style="background:var(--parch-dk);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:1.1rem 0;overflow:hidden;">
  <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0;">
    <div class="partner-marquee-label" style="flex-shrink:0;padding:0 1.5rem;font-size:.65rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-muted);white-space:nowrap;">
      Advisory Partners
    </div>
    <div class="marquee-outer" style="flex:1;">
      <div class="marquee-track">
        ${[
          '🏛️ EY (Ernst & Young)',
          '🏢 CBRE India',
          '📊 ANAROCK',
          '⚖️ Pipara & Co LLP',
          '💼 Resurgent India',
          '🏨 Sarovar Hotels',
          '🏪 CGH Earth',
          '🏖️ Mahindra Holidays',
          '🏝️ WelcomHeritage',
          '🎰 Pride Hotels',
          '🍽️ Maple Resorts',
          '🏛️ EY (Ernst & Young)',
          '🏢 CBRE India',
          '📊 ANAROCK',
          '⚖️ Pipara & Co LLP',
          '💼 Resurgent India',
          '🏨 Sarovar Hotels',
          '🏪 CGH Earth',
          '🏖️ Mahindra Holidays',
          '🏝️ WelcomHeritage',
          '🎰 Pride Hotels',
          '🍽️ Maple Resorts',
        ].map(p => `<span class="marquee-item">${p}</span>`).join('')}
      </div>
    </div>
  </div>
</div>

<!-- ══ TRUST SIGNALS ROW ════════════════════════════════════════════════ -->
<div class="trust-signals-section" style="background:var(--parch-dk);padding:1.5rem 0;border-bottom:1px solid var(--border);">
  <div class="wrap">
    <div class="trust-row">
      <div class="trust-item">
        <span class="sla-badge">Immediate Diagnostic Review Window</span>
        <span>All submissions reviewed by Executive Leadership</span>
      </div>
      <div class="trust-item">
        <i class="fas fa-shield-alt" style="color:var(--gold);"></i>
        <span>Pre-Mandate Confidentiality Protocol — mandatory execution before all advisory engagements</span>
      </div>
      <div class="trust-item">
        <i class="fas fa-certificate" style="color:var(--gold);"></i>
        <span>CERT-In & <strong>OWASP Top-10</strong> compliant</span>
      </div>
      <div class="trust-item">
        <i class="fas fa-map-marked-alt" style="color:var(--gold);"></i>
        <span><strong>Pan-India</strong> · Delhi NCR · Chandigarh · Mumbai</span>
      </div>
      <div class="trust-item">
        <a href="/testimonials" style="color:var(--gold);font-weight:600;font-family:'DM Sans',sans-serif;font-size:.8rem;text-decoration:none;">
          ⭐ View Client Testimonials →
        </a>
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
        <p class="body-lg" style="margin-bottom:2rem;color:var(--ink-soft);">India Gully operates across Tier-1, 2 and 3 markets — from Delhi NCR and Mumbai to Kasauli, Chail, Chandigarh and Jaipur. Our active mandates span 8+ cities with INR 1,165 Cr+ in combined advisory value.</p>
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
              <path class="india-state" d="M405.9,165.0L403.7,172.8L405.5,179.0L401.3,187.4L397.2,189.1L396.3,185.3L392.5,188.6L385.4,187.5L382.0,193.3L380.4,192.7L377.8,187.8L384.4,180.9L384.8,183.4L387.5,181.6L391.9,171.2L392.5,172.7L401.6,164.7L405.6,163.2L405.9,165.0Z"/>
              <path class="india-state" d="M269.6,237.2L282.9,244.6L283.8,248.1L286.9,246.6L290.3,250.4L290.6,252.3L285.0,253.8L280.7,259.1L282.9,265.2L279.7,268.6L284.1,267.1L279.4,270.8L279.9,273.3L274.3,279.1L272.2,277.8L273.9,279.5L259.8,284.9L250.2,293.3L244.8,294.9L243.3,298.7L237.0,298.3L233.0,292.6L230.5,296.0L228.3,295.3L229.6,297.9L223.9,301.0L224.5,305.3L220.7,304.3L218.2,307.7L215.9,302.7L212.8,311.7L209.2,310.5L199.6,314.6L201.8,307.2L212.4,296.5L211.5,288.2L209.1,286.9L209.7,282.2L206.8,278.1L219.3,281.5L219.4,278.8L214.6,277.7L214.0,264.2L215.7,265.2L218.3,259.8L225.5,260.6L227.8,256.1L229.7,256.6L228.7,254.2L233.1,242.5L238.7,239.9L238.6,237.2L243.0,240.4L254.5,238.1L253.4,244.6L265.5,244.1L264.9,246.1L267.1,246.4L269.6,237.2Z"/>
              <path class="india-state" d="M117.4,74.0L113.0,80.6L117.7,82.8L121.9,93.3L124.7,91.1L128.7,94.6L128.4,98.3L132.0,101.8L129.6,102.5L132.2,103.6L133.2,108.4L130.6,107.6L127.5,110.4L128.3,113.4L122.4,112.1L122.9,116.9L119.9,118.9L111.0,117.9L107.7,122.2L105.7,116.1L87.9,115.2L87.6,108.5L99.8,96.8L97.0,96.1L98.4,83.9L108.0,80.5L109.3,76.3L111.8,77.5L117.4,74.0Z"/>
              <path class="india-state" d="M87.8,115.1L97.2,115.7L98.4,125.8L102.0,124.5L105.6,127.3L110.3,126.9L112.7,137.5L120.7,145.0L118.4,146.0L118.8,149.8L122.7,150.1L123.6,144.5L126.3,145.0L127.3,148.0L132.7,144.2L132.8,153.1L134.8,150.5L138.6,150.8L139.2,155.2L144.3,160.6L141.7,162.4L145.5,163.6L140.5,166.1L140.9,168.1L145.5,165.0L153.1,165.2L150.4,169.1L136.1,176.4L126.5,184.9L130.8,191.6L139.6,190.0L140.2,194.9L132.1,196.6L133.5,198.8L131.3,199.7L135.2,203.8L133.7,205.6L131.5,204.4L132.7,211.0L129.7,208.4L127.2,210.4L122.5,209.6L122.1,207.7L119.0,214.2L113.1,216.4L112.1,212.3L114.9,213.6L116.8,211.9L115.2,206.5L118.0,205.6L116.9,201.1L107.6,201.3L107.5,198.2L110.6,199.0L108.3,198.5L109.6,196.0L106.8,196.0L105.1,199.0L102.1,197.1L102.2,200.1L104.7,200.8L102.8,202.4L101.4,200.1L100.1,204.7L102.3,205.5L100.7,208.5L104.3,212.6L103.5,219.2L97.2,224.1L100.6,226.0L94.3,228.5L89.1,223.3L84.0,222.1L84.4,219.3L80.0,216.6L80.1,211.0L78.2,212.9L75.8,210.1L78.0,207.1L76.0,205.0L73.4,207.8L67.8,204.8L66.6,206.4L63.4,203.6L64.9,203.0L60.4,201.5L57.5,203.2L46.5,202.2L39.9,190.3L39.8,185.3L34.0,185.2L31.3,181.2L32.3,171.3L22.1,167.1L23.7,161.0L35.3,147.4L38.2,147.2L43.0,152.5L58.1,148.2L65.4,135.0L73.7,130.7L80.4,115.8L89.0,111.6L87.8,115.1Z"/>
              <path class="india-state" d="M307.9,145.9L311.5,149.3L309.7,154.7L311.8,159.3L304.7,162.6L299.7,161.7L300.2,148.3L307.9,145.9Z"/>
              <path class="india-state" d="M180.1,384.8L183.8,386.2L182.8,397.1L176.6,410.8L173.6,410.2L176.0,413.0L176.8,426.6L174.6,427.6L176.8,429.3L177.2,437.7L168.5,438.3L162.5,451.0L166.9,454.4L154.6,457.5L151.7,460.9L150.1,469.3L142.5,474.2L139.0,473.4L135.6,470.5L138.2,466.6L136.2,458.8L140.1,450.9L136.5,449.1L138.4,439.2L137.6,437.0L133.8,439.2L131.5,437.8L132.7,430.0L129.0,427.5L131.1,425.5L130.1,422.8L126.1,423.3L127.3,420.5L122.7,417.0L126.8,414.8L131.8,416.8L132.7,413.4L140.5,413.9L141.5,410.9L144.2,410.8L145.7,408.0L141.2,405.8L143.3,403.9L143.0,399.1L146.6,395.8L155.9,399.8L159.6,392.5L166.3,393.3L170.5,388.1L175.2,390.2L180.1,384.8Z"/>
              <path class="india-state" d="M360.7,204.5L362.8,215.2L361.3,218.7L357.4,217.6L355.5,228.0L352.3,230.4L349.3,224.9L348.4,227.9L345.4,217.4L348.7,211.4L351.9,211.8L353.0,209.3L354.4,210.8L354.1,209.1L356.5,210.9L356.8,207.6L360.7,204.5Z"/>
              <path class="india-state" d="M143.0,108.1L148.1,110.7L144.7,116.9L149.0,122.2L155.3,118.5L162.9,123.7L159.8,125.9L170.2,133.5L175.6,132.9L178.5,135.8L180.8,134.0L186.7,138.5L187.5,136.3L207.1,149.9L209.9,148.8L215.5,152.8L219.4,152.1L219.8,155.7L228.5,158.5L229.6,156.1L232.9,156.2L237.4,158.6L239.4,165.7L244.8,170.0L237.2,171.8L241.2,174.2L238.7,177.4L248.0,184.8L240.1,184.9L228.7,193.7L231.8,202.9L226.6,214.4L222.8,215.1L218.7,211.1L220.2,202.5L213.2,203.1L211.7,199.6L208.2,199.5L202.3,193.5L201.1,195.5L197.9,194.0L195.9,198.5L190.9,197.6L192.1,193.5L189.4,194.5L190.6,195.7L187.9,194.2L183.1,196.4L185.3,193.9L182.8,189.7L176.7,192.8L176.8,195.1L170.0,194.9L171.4,192.3L168.5,191.1L168.6,194.5L166.0,194.9L164.1,192.2L162.2,194.0L163.4,191.0L160.8,191.8L163.7,190.6L163.0,187.5L161.6,189.6L160.1,188.5L160.6,190.8L158.9,189.4L155.5,192.0L157.6,192.5L163.6,207.3L161.0,210.2L156.7,206.7L154.3,208.1L151.6,199.1L155.8,194.6L153.6,190.6L155.6,187.5L161.2,186.5L160.3,184.4L166.0,173.0L164.0,169.1L152.3,166.6L152.4,164.7L140.6,167.7L145.5,163.6L141.9,162.8L144.3,160.6L138.9,153.9L138.4,150.7L142.2,148.4L142.3,143.5L137.1,134.4L135.5,121.3L143.0,108.1Z"/>
              <path class="india-state" d="M167.0,92.6L170.2,97.7L176.8,98.7L182.3,102.2L182.2,105.3L194.2,110.6L184.5,118.8L183.4,127.8L178.8,135.8L162.6,128.7L159.8,125.9L162.9,123.7L156.2,118.9L154.1,118.1L149.0,122.2L144.7,116.9L148.1,110.7L142.6,107.9L146.3,106.0L144.5,102.2L147.5,95.8L154.5,93.6L163.2,96.6L164.7,90.7L167.0,92.6Z"/>
              <path class="india-state" d="M300.2,161.9L310.2,161.7L315.2,167.1L318.8,166.1L326.0,168.8L326.2,173.0L321.5,180.9L315.7,178.1L314.6,173.8L312.7,172.7L314.3,176.1L310.9,176.5L303.9,170.6L306.1,174.4L301.0,177.9L300.1,183.7L302.3,183.5L306.4,188.4L310.4,188.2L313.4,191.9L312.1,194.0L305.0,193.5L304.3,197.6L300.4,197.8L298.5,202.2L303.3,206.8L309.3,208.6L309.8,213.4L306.9,215.4L306.7,219.0L310.2,221.4L309.0,225.4L313.1,226.0L310.9,229.5L312.6,234.6L310.3,233.9L312.6,235.9L311.0,238.8L308.4,236.2L311.4,240.1L309.2,242.7L308.2,240.3L307.4,247.3L305.7,247.9L306.6,245.3L305.4,247.6L303.9,246.4L302.4,250.3L301.3,243.2L296.6,238.7L301.1,244.3L297.8,244.2L297.2,249.2L290.6,252.3L286.9,246.6L283.8,248.1L283.7,245.2L279.1,243.5L281.7,241.1L279.8,236.5L274.7,233.2L276.5,229.7L271.6,229.6L265.9,225.2L269.0,219.9L272.9,222.6L275.0,219.2L280.3,218.2L280.3,215.9L287.0,216.0L286.9,212.4L290.2,213.4L293.7,210.6L297.9,198.4L294.9,195.1L294.7,190.0L299.4,188.5L295.4,181.6L302.7,174.5L301.8,171.3L299.9,171.5L300.9,166.1L298.2,162.0L298.8,160.3L300.2,161.9Z"/>
            </g>

            <!-- ══ MANDATE CITY PINS ══ -->

            <!-- Himachal Pradesh (Kasauli · Chail) lon 77.1°E lat 31.0°N → 136,100 — label left to avoid overlap -->
            <g id="pin-himachal" class="map-pin-group" style="cursor:pointer;" onmouseover="igMapHover('himachal',true)" onmouseout="igMapHover('himachal',false)">
              <circle cx="136" cy="100" r="7.5" fill="#1A3A6B" stroke="rgba(255,255,255,.9)" stroke-width="1.5"/>
              <circle cx="136" cy="100" r="3" fill="#fff"/>
              <text x="124" y="97" class="map-pin-label" text-anchor="end">Kasauli · Chail</text>
              <text x="124" y="107" class="map-pin-sub" text-anchor="end">₹75 Cr</text>
            </g>

            <!-- Chandigarh lon 76.8°E lat 30.7°N → 131,112 — label right -->
            <g id="pin-chandigarh" class="map-pin-group" style="cursor:pointer;" onmouseover="igMapHover('chandigarh',true)" onmouseout="igMapHover('chandigarh',false)">
              <circle cx="131" cy="112" r="7.5" fill="#065F46" stroke="rgba(255,255,255,.9)" stroke-width="1.5"/>
              <circle cx="131" cy="112" r="3" fill="#fff"/>
              <text x="143" y="109" class="map-pin-label">Chandigarh</text>
              <text x="143" y="119" class="map-pin-sub">INR 70 Cr</text>
            </g>

            <!-- Delhi NCR lon 77.2°E lat 28.6°N → 137,138 — pulsing gold -->
            <g id="pin-delhi" class="map-pin-group" style="cursor:pointer;" onmouseover="igMapHover('delhi',true)" onmouseout="igMapHover('delhi',false)">
              <circle cx="137" cy="138" r="22" fill="rgba(184,150,12,.09)" stroke="rgba(184,150,12,.28)" stroke-width="1">
                <animate attributeName="r" values="22;32;22" dur="2.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values=".7;0.08;.7" dur="2.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="137" cy="138" r="12" fill="#B8960C" stroke="#fff" stroke-width="2" filter="url(#mapPinGlow)"/>
              <circle cx="137" cy="138" r="5" fill="#fff"/>
              <text x="154" y="132" class="map-pin-label" style="font-size:9.5px;">Delhi NCR</text>
              <text x="154" y="144" class="map-pin-sub" style="font-size:7px;opacity:.7;">3 Mandates · ₹900 Cr</text>
            </g>

            <!-- Jaipur lon 75.8°E lat 26.9°N → 116,166 -->
            <g id="pin-jaipur" class="map-pin-group" style="cursor:pointer;" onmouseover="igMapHover('jaipur',true)" onmouseout="igMapHover('jaipur',false)">
              <circle cx="116" cy="166" r="7.5" fill="#7C3AED" stroke="rgba(255,255,255,.9)" stroke-width="1.5"/>
              <circle cx="116" cy="166" r="3" fill="#fff"/>
              <text x="103" y="162" class="map-pin-label" text-anchor="end">Jaipur</text>
              <text x="103" y="172" class="map-pin-sub" text-anchor="end">₹20 Cr</text>
            </g>

            <!-- Mumbai lon 72.8°E lat 19.1°N → 72,293 -->
            <g id="pin-mumbai" class="map-pin-group" style="cursor:pointer;" onmouseover="igMapHover('mumbai',true)" onmouseout="igMapHover('mumbai',false)">
              <circle cx="72" cy="293" r="8" fill="#dc2626" stroke="rgba(255,255,255,.9)" stroke-width="1.5"/>
              <circle cx="72" cy="293" r="3.2" fill="#fff"/>
              <text x="59" y="289" class="map-pin-label" text-anchor="end">Mumbai</text>
              <text x="59" y="299" class="map-pin-sub" text-anchor="end">Pipeline</text>
            </g>

            <!-- Bengaluru lon 77.6°E lat 12.9°N → 143,395 -->
            <g id="pin-bengaluru" class="map-pin-group" style="cursor:pointer;" onmouseover="igMapHover('bengaluru',true)" onmouseout="igMapHover('bengaluru',false)">
              <circle cx="143" cy="395" r="7" fill="#065F46" stroke="rgba(255,255,255,.9)" stroke-width="1.5"/>
              <circle cx="143" cy="395" r="2.8" fill="#fff"/>
              <text x="155" y="392" class="map-pin-label">Bengaluru</text>
              <text x="155" y="402" class="map-pin-sub">Pipeline</text>
            </g>

            <!-- Hyderabad lon 78.5°E lat 17.4°N → 156,323 -->
            <g id="pin-hyderabad" class="map-pin-group" style="cursor:pointer;" onmouseover="igMapHover('hyderabad',true)" onmouseout="igMapHover('hyderabad',false)">
              <circle cx="156" cy="323" r="7" fill="#9D4E15" stroke="rgba(255,255,255,.9)" stroke-width="1.5"/>
              <circle cx="156" cy="323" r="2.8" fill="#fff"/>
              <text x="168" y="320" class="map-pin-label">Hyderabad</text>
              <text x="168" y="330" class="map-pin-sub">HITEC · Pipeline</text>
            </g>

            <!-- ══ LEGEND ══ -->
            <rect x="5" y="453" width="390" height="50" rx="2"
              fill="rgba(184,150,12,.04)" stroke="rgba(184,150,12,.18)" stroke-width=".7"/>
            <text x="12" y="466" font-family="DM Sans,sans-serif" font-size="6" font-weight="700"
              fill="currentColor" opacity=".45" letter-spacing="1.5">ACTIVE MANDATE LOCATIONS</text>
            <circle cx="14" cy="480" r="4" fill="#B8960C"/>
            <text x="22" y="484" font-family="DM Sans,sans-serif" font-size="6.5" fill="currentColor" opacity=".7">Delhi NCR ₹900Cr</text>
            <circle cx="110" cy="480" r="4" fill="#065F46"/>
            <text x="118" y="484" font-family="DM Sans,sans-serif" font-size="6.5" fill="currentColor" opacity=".7">Chandigarh ₹70Cr</text>
            <circle cx="210" cy="480" r="4" fill="#1A3A6B"/>
            <text x="218" y="484" font-family="DM Sans,sans-serif" font-size="6.5" fill="currentColor" opacity=".7">Himachal ₹75Cr</text>
            <circle cx="300" cy="480" r="4" fill="#7C3AED"/>
            <text x="308" y="484" font-family="DM Sans,sans-serif" font-size="6.5" fill="currentColor" opacity=".7">Jaipur ₹20Cr</text>
            <circle cx="14" cy="496" r="4" fill="#dc2626"/>
            <text x="22" y="500" font-family="DM Sans,sans-serif" font-size="6.5" fill="currentColor" opacity=".5">Mumbai · Pipeline</text>
            <circle cx="110" cy="496" r="4" fill="#065F46"/>
            <text x="118" y="500" font-family="DM Sans,sans-serif" font-size="6.5" fill="currentColor" opacity=".5">Bengaluru · Pipeline</text>
            <circle cx="210" cy="496" r="4" fill="#9D4E15"/>
            <text x="218" y="500" font-family="DM Sans,sans-serif" font-size="6.5" fill="currentColor" opacity=".5">Hyderabad · Pipeline</text>

          </svg>
          <!-- Hover tooltip -->
          <div id="map-tooltip" style="position:absolute;display:none;background:rgba(10,10,10,.95);color:#fff;padding:.5rem .75rem;font-size:.7rem;pointer-events:none;border:1px solid rgba(184,150,12,.35);max-width:180px;z-index:10;border-radius:3px;box-shadow:0 8px 24px rgba(0,0,0,.3);"></div>
        </div>
        <!-- Map caption -->
        <p class="india-map-caption" style="font-size:.62rem;color:var(--ink-faint);text-align:center;margin-top:.5rem;"><i class="fas fa-map-pin" style="color:var(--gold);margin-right:.3rem;font-size:.55rem;"></i>Pins show active India Gully advisory mandates · Updated Q1 2026 · J&amp;K shown per India's claimed boundaries</p>
        <script>
        (function(){
          var tooltips = {
            delhi:      { title:'Delhi NCR', sub:'Prism Tower · Ambience Tower · Sawasdee JLG', val:'₹900 Cr combined', color:'#B8960C' },
            chandigarh: { title:'Chandigarh', sub:'Hotel Rajshree & Spa · 41 Keys', val:'INR 70 Cr', color:'#065F46' },
            himachal:   { title:'Himachal Pradesh', sub:'WelcomHeritage Kasauli · Maple Resort Chail', val:'₹75 Cr combined', color:'#1A3A6B' },
            jaipur:     { title:'Jaipur', sub:'Heritage Hotel · 43 Keys', val:'₹20 Cr', color:'#7C3AED' },
            mumbai:     { title:'Mumbai', sub:'BKC · Lower Parel · Advisory pipeline', val:'In discussion', color:'#dc2626' },
            bengaluru:  { title:'Bengaluru', sub:'Whitefield · MG Road · Active pipeline', val:'In discussion', color:'#065F46' },
            hyderabad:  { title:'Hyderabad', sub:'HITEC City · Banjara Hills · Advisory pipeline', val:'In discussion', color:'#9D4E15' },
          };
          window.igMapHover = function(id, on) {
            var tt = document.getElementById('map-tooltip');
            var wrap = document.getElementById('indiaMapWrap');
            var groups = document.querySelectorAll('.map-pin-group');
            groups.forEach(function(g){ g.style.opacity = on ? '0.55' : '1'; });
            var active = document.getElementById('pin-'+id);
            if (active) active.style.opacity = '1';
            if (!tt || !wrap) return;
            if (on && tooltips[id]) {
              var d = tooltips[id];
              tt.innerHTML = '<strong style="display:block;font-size:.72rem;color:'+d.color+';margin-bottom:.2rem;">'+d.title+'</strong>'+
                '<span style="display:block;font-size:.65rem;color:rgba(255,255,255,.65);margin-bottom:.2rem;">'+d.sub+'</span>'+
                '<span style="font-size:.65rem;color:#D4AE2A;font-weight:700;">'+d.val+'</span>';
              tt.style.display = 'block';
              tt.style.top = '12px'; tt.style.right = '12px'; tt.style.left = 'auto'; tt.style.transform = 'none';
            } else {
              tt.style.display = 'none';
              groups.forEach(function(g){ g.style.opacity = '1'; });
            }
          };
          // Fetch mandate locations from API and update tooltips dynamically
          fetch('/api/mandate-locations').then(function(r){ return r.json(); }).then(function(data){
            if (data && data.locations) {
              data.locations.forEach(function(loc){
                if (tooltips[loc.id]) {
                  tooltips[loc.id].val = loc.value;
                  tooltips[loc.id].sub = loc.mandates;
                }
              });
            }
          }).catch(function(){});

          // ── AUTO-CYCLE through mandate pins like Google Earth ──────────
          var _pins = ['delhi','chandigarh','himachal','jaipur','mumbai','bengaluru'];
          var _pinIdx = 0;
          var _cycleTimer = null;
          var _userInteracting = false;
          var _interactTimer = null;

          function igMapCyclePin(id) {
            var tt = document.getElementById('map-tooltip');
            var groups = document.querySelectorAll('.map-pin-group');
            groups.forEach(function(g){ g.style.opacity = '0.45'; g.style.transform = 'scale(1)'; g.style.transition = 'opacity .4s,transform .4s'; });
            var active = document.getElementById('pin-'+id);
            if (active) {
              active.style.opacity = '1';
              active.style.transform = 'scale(1.25)';
              active.style.transition = 'opacity .4s,transform .4s';
            }
            if (tt && tooltips[id]) {
              var d = tooltips[id];
              tt.innerHTML = '<strong style="display:block;font-size:.72rem;color:'+d.color+';margin-bottom:.2rem;">'+d.title+'</strong>'+
                '<span style="display:block;font-size:.65rem;color:rgba(255,255,255,.65);margin-bottom:.2rem;">'+d.sub+'</span>'+
                '<span style="font-size:.65rem;color:#D4AE2A;font-weight:700;">'+d.val+'</span>';
              tt.style.display = 'block';
              tt.style.top = '12px'; tt.style.right = '12px'; tt.style.left = 'auto'; tt.style.transform = 'none';
            }
          }

          function igMapResetAll() {
            var groups = document.querySelectorAll('.map-pin-group');
            groups.forEach(function(g){ g.style.opacity = '1'; g.style.transform = 'scale(1)'; });
            var tt = document.getElementById('map-tooltip');
            if (tt) tt.style.display = 'none';
          }

          function igStartCycle() {
            _cycleTimer = setInterval(function(){
              if (_userInteracting) return;
              igMapResetAll();
              setTimeout(function(){
                igMapCyclePin(_pins[_pinIdx]);
                _pinIdx = (_pinIdx + 1) % _pins.length;
              }, 200);
            }, 2800);
            // Start first cycle immediately after 1.5s
            setTimeout(function(){
              igMapCyclePin(_pins[_pinIdx]);
              _pinIdx = (_pinIdx + 1) % _pins.length;
            }, 1500);
          }

          // Override hover to pause auto-cycle
          window.igMapHover = function(id, on) {
            _userInteracting = on;
            clearTimeout(_interactTimer);
            if (!on) {
              // Resume auto-cycle 4s after user stops interacting
              _interactTimer = setTimeout(function(){ _userInteracting = false; }, 4000);
            }
            var tt = document.getElementById('map-tooltip');
            var groups = document.querySelectorAll('.map-pin-group');
            groups.forEach(function(g){ g.style.opacity = on ? '0.45' : '1'; g.style.transform = 'scale(1)'; });
            var active = document.getElementById('pin-'+id);
            if (active) { active.style.opacity = '1'; if (on) active.style.transform = 'scale(1.2)'; }
            if (!tt) return;
            if (on && tooltips[id]) {
              var d = tooltips[id];
              tt.innerHTML = '<strong style="display:block;font-size:.72rem;color:'+d.color+';margin-bottom:.2rem;">'+d.title+'</strong>'+
                '<span style="display:block;font-size:.65rem;color:rgba(255,255,255,.65);margin-bottom:.2rem;">'+d.sub+'</span>'+
                '<span style="font-size:.65rem;color:#D4AE2A;font-weight:700;">'+d.val+'</span>';
              tt.style.display = 'block';
              tt.style.top = '12px'; tt.style.right = '12px'; tt.style.left = 'auto'; tt.style.transform = 'none';
            } else {
              tt.style.display = 'none';
              if (!on) groups.forEach(function(g){ g.style.opacity = '1'; g.style.transform = 'scale(1)'; });
            }
          };

          // Use IntersectionObserver to start cycle only when map is visible
          var mapWrap = document.getElementById('indiaMapWrap');
          if (mapWrap && 'IntersectionObserver' in window) {
            var obs = new IntersectionObserver(function(entries){
              entries.forEach(function(entry){
                if (entry.isIntersecting && !_cycleTimer) {
                  igStartCycle();
                } else if (!entry.isIntersecting && _cycleTimer) {
                  clearInterval(_cycleTimer); _cycleTimer = null;
                  _pinIdx = 0;
                  igMapResetAll();
                }
              });
            }, { threshold: 0.3 });
            obs.observe(mapWrap);
          } else {
            igStartCycle();
          }
        })();
        </script>
      </div>
    </div>
  </div>
</div>

<!-- ══ WHY INDIA GULLY ══════════════════════════════════════════════════ -->
<div class="sec-pc" style="padding-top:7rem;padding-bottom:7rem;">
  <div class="wrap">

    <!-- Section header -->
    <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:5rem;align-items:start;margin-bottom:4.5rem;" class="mob-stack">
      <div>
        <div class="gr"></div>
        <p class="eyebrow" style="margin-bottom:1rem;">Why India Gully</p>
        <h2 class="h2">The Advisory Partner<br>Built for India</h2>
      </div>
      <div style="display:flex;align-items:center;padding-top:1rem;">
        <div>
          <p class="lead" style="margin-bottom:1.5rem;">20+ years of boots-on-the-ground execution across every vertical — not just strategy, but delivery. We are investors' most trusted partner in India's complex advisory landscape.</p>
          <div style="width:48px;height:1px;background:linear-gradient(90deg,var(--gold),transparent);"></div>
        </div>
      </div>
    </div>

    <!-- Why cards grid -->
    <div class="why-grid">
      ${[
        { icon:'trophy',         color:'#B8960C', bg:'rgba(184,150,12,.08)', border:'rgba(184,150,12,.18)', title:'₹2,000+ Cr Transacted',       desc:'Landmark transactions including joint advisory with EY for the INR 1,350 Cr+ divestment of Entertainment City Limited — India\'s largest entertainment sector transaction.' },
        { icon:'hotel',          color:'#065F46', bg:'rgba(6,95,70,.08)',    border:'rgba(6,95,70,.18)',    title:'15+ Hotels On-Boarded',        desc:'Hotel brand selection, pre-opening management and PMC across Marriott, Radisson, Cygnett, Regenta and more — from site selection to first check-in.' },
        { icon:'store',          color:'#1A3A6B', bg:'rgba(26,58,107,.08)', border:'rgba(26,58,107,.18)',  title:'1,40,000+ sq. ft. Leased',       desc:'Premium F&B and retail leasing at Gardens Galleria, Hyatt Andaz, AIPL Joy Street and Entertainment City — India\'s top retail destinations.' },
        { icon:'utensils',       color:'#B8960C', bg:'rgba(184,150,12,.08)', border:'rgba(184,150,12,.18)', title:'HORECA to 15+ Properties',     desc:'End-to-end supply of FF&E, OS&E, kitchen equipment and amenities for Mahindra Holidays, Accor, CGH Earth and more across India.' },
        { icon:'handshake',      color:'#7C3AED', bg:'rgba(124,58,237,.08)', border:'rgba(124,58,237,.18)', title:'Co-Advisory with EY & CBRE',   desc:'Trusted by India\'s top professional service firms as co-advisor on complex, multi-party institutional transactions requiring deep sector expertise.' },
        { icon:'map-marked-alt', color:'#B8960C', bg:'rgba(184,150,12,.08)', border:'rgba(184,150,12,.18)', title:'Pan-India Execution Footprint',           desc:'Active mandates in Delhi NCR, Chandigarh, Kasauli, Chail, Jaipur, Noida, Gurugram, Bengaluru, Mumbai and Kerala — Tier–1 to 3 markets.' },
      ].map((w, wi) => `
      <div class="why-card reveal" style="transition-delay:${wi*0.07}s;">
        <div class="why-icon" style="background:${w.bg};border:1px solid ${w.border};">
          <i class="fas fa-${w.icon}" style="color:${w.color};font-size:1.1rem;"></i>
        </div>
        <h3 style="font-family:'DM Serif Display',Georgia,serif;font-size:1.15rem;color:var(--ink);margin-bottom:.6rem;line-height:1.25;">${w.title}</h3>
        <p style="font-size:.875rem;line-height:1.8;color:var(--ink-soft);">${w.desc}</p>
        <div style="width:28px;height:1px;background:linear-gradient(90deg,${w.color},transparent);margin-top:1.25rem;opacity:.6;"></div>
      </div>`).join('')}
    </div>

  </div>
</div>

<!-- ══ FEATURED MANDATES ═══════════════════════════════════════════════ -->
<div class="sec-dk" style="position:relative;overflow:hidden;padding-top:7rem;padding-bottom:7rem;">
  <!-- Background texture -->
  <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(184,150,12,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(184,150,12,.03) 1px,transparent 1px);background-size:80px 80px;pointer-events:none;"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 50% 100%,rgba(184,150,12,.04) 0%,transparent 60%);pointer-events:none;"></div>

  <div class="wrap" style="position:relative;">

    <!-- Section header -->
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:4rem;flex-wrap:wrap;gap:2rem;">
      <div>
        <div class="gr-lt"></div>
        <p class="eyebrow-lt" style="margin-bottom:1rem;">Active Mandates</p>
        <h2 class="h2-lt" style="max-width:500px;">Investment Opportunities<br>of Institutional Grade</h2>
      </div>
      <div style="text-align:right;max-width:360px;">
        <p style="font-size:.875rem;line-height:1.8;color:rgba(255,255,255,.45);margin-bottom:1.5rem;">Exclusive mandates across Hospitality, Real Estate, Heritage & Mixed-Use. All strictly subject to NDA.</p>
        <a href="/listings" class="btn btn-ghost-g">View All 8 Mandates <i class="fas fa-arrow-right" style="font-size:.6rem;margin-left:.25rem;"></i></a>
      </div>
    </div>

    <!-- Featured 3-column mandate cards -->
    <div id="featuredMandates">
      ${LISTINGS.filter((l: any) => l.highlight).slice(0,3).map((l: any, idx: number) => {
        const img = l.images?.[0] || ''
        const ss = { active: { bg:'rgba(184,150,12,.15)', text:'#D4AE2A', border:'rgba(184,150,12,.35)' }, negotiation: { bg:'rgba(59,130,246,.12)', text:'#60a5fa', border:'rgba(59,130,246,.3)' }, feasibility: { bg:'rgba(22,163,74,.1)', text:'#4ade80', border:'rgba(22,163,74,.25)' } }[l.statusType] || { bg:'rgba(184,150,12,.15)', text:'#D4AE2A', border:'rgba(184,150,12,.35)' }
        return `
      <a href="/listings/${l.id}"
         class="ed-card reveal"
         style="display:block;text-decoration:none;transition-delay:${idx*0.1}s;"
         onmouseover="this.style.borderColor='rgba(184,150,12,.4)';this.style.boxShadow='0 24px 70px rgba(0,0,0,.5)';this.style.transform='translateY(-6px)'"
         onmouseout="this.style.borderColor='rgba(255,255,255,.08)';this.style.boxShadow='none';this.style.transform='translateY(0)'"
         style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);overflow:hidden;transition:all .3s cubic-bezier(.4,0,.2,1);">

        <!-- Image area -->
        <div class="ed-card-img" style="height:248px;background:#0a0a12;position:relative;">
          ${img
            ? `<img src="${img}" alt="${l.title}" style="width:100%;height:100%;object-fit:cover;" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(145deg,#090912 0%,#0f0f1e 50%,#111128 100%);position:relative;overflow:hidden;">
                <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(184,150,12,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(184,150,12,.04) 1px,transparent 1px);background-size:32px 32px;"></div>
                <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 60% at 50% 50%,rgba(184,150,12,.06) 0%,transparent 70%);"></div>
                <div style="position:relative;text-align:center;">
                  <div style="width:56px;height:56px;background:rgba(184,150,12,.1);border:1.5px solid rgba(184,150,12,.3);display:flex;align-items:center;justify-content:center;margin:0 auto .875rem;border-radius:2px;">
                    <i class="fas fa-lock" style="color:var(--gold);font-size:1.2rem;"></i>
                  </div>
                  <div style="font-family:'DM Serif Display',Georgia,serif;font-size:1.6rem;color:#fff;line-height:1;margin-bottom:.25rem;">${l.value}</div>
                  ${l.valueUSD ? `<div style="font-size:.58rem;color:rgba(255,255,255,.4);letter-spacing:.05em;margin-bottom:.5rem;">${l.valueUSD}</div>` : '<div style="margin-bottom:.5rem;"></div>'}
                  <div style="font-size:.56rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(184,150,12,.7);">Confidential · NDA</div>
                </div>
              </div>`
          }
          <!-- Gradient overlay (images only) -->
          ${img ? `<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.8) 0%,rgba(0,0,0,.2) 50%,transparent 100%);"></div>` : ''}

          <!-- Sector pill -->
          <div style="position:absolute;top:1.25rem;left:1.25rem;">
            <span style="background:${l.sectorColor};color:#fff;font-size:.57rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:.28rem .75rem;">${l.sector}</span>
          </div>
          <!-- NDA badge always shown -->
          <div style="position:absolute;top:1.25rem;right:1.25rem;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);padding:.22rem .65rem;display:flex;align-items:center;gap:.3rem;border:1px solid rgba(184,150,12,.4);">
            <i class="fas fa-lock" style="font-size:.48rem;color:var(--gold);"></i>
            <span style="font-size:.54rem;color:rgba(255,255,255,.85);letter-spacing:.08em;font-weight:700;text-transform:uppercase;">NDA</span>
          </div>

          <!-- Value overlay on image bottom (images only) -->
          ${img ? `<div style="position:absolute;bottom:1.25rem;left:1.25rem;right:1.25rem;display:flex;align-items:flex-end;justify-content:space-between;">
            <div>
              <div style="font-family:'DM Serif Display',Georgia,serif;font-size:2.1rem;color:#fff;line-height:1;text-shadow:0 2px 12px rgba(0,0,0,.6);">${l.value}</div>
              ${l.valueUSD ? `<div style="font-size:.6rem;color:rgba(255,255,255,.5);letter-spacing:.08em;">${l.valueUSD}</div>` : ''}
            </div>
            <div style="background:rgba(0,0,0,.4);backdrop-filter:blur(6px);padding:.2rem .55rem;display:flex;align-items:center;gap:.3rem;border:1px solid rgba(255,255,255,.15);">
              <i class="fas fa-images" style="font-size:.48rem;color:rgba(255,255,255,.5);"></i>
              <span style="font-size:.54rem;color:rgba(255,255,255,.6);letter-spacing:.06em;">${l.images.length} photos · NDA</span>
            </div>
          </div>` : ''}
        </div>

        <!-- Content -->
        <div style="padding:1.75rem;">
          <!-- Status + location -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem;">
            <span style="background:${ss.bg};color:${ss.text};border:1px solid ${ss.border};font-size:.58rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:.22rem .65rem;">${l.status}</span>
            <span style="font-size:.68rem;color:rgba(255,255,255,.4);display:flex;align-items:center;gap:.3rem;"><i class="fas fa-map-marker-alt" style="color:var(--gold);font-size:.55rem;"></i>${l.locationShort}</span>
          </div>

          <!-- Title -->
          <h3 style="font-family:'DM Serif Display',Georgia,serif;font-size:1.25rem;color:#fff;line-height:1.2;margin-bottom:.35rem;">${l.title}</h3>
          <p style="font-size:.72rem;color:var(--gold);font-weight:500;letter-spacing:.04em;margin-bottom:1rem;">${l.subtitle}</p>

          <!-- Description -->
          <p style="font-size:.825rem;color:rgba(255,255,255,.45);line-height:1.75;margin-bottom:1.25rem;">${l.desc}</p>

          <!-- Highlights row -->
          <div style="display:flex;gap:.75rem;margin-bottom:1.5rem;flex-wrap:wrap;">
            ${l.highlights.slice(0,2).map((h: any) => `
            <div style="flex:1;min-width:120px;padding:.75rem 1rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);">
              <div style="font-size:.58rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:.3rem;">${h.label}</div>
              <div style="font-family:'DM Serif Display',Georgia,serif;font-size:1.1rem;color:var(--gold);line-height:1;">${h.value}</div>
            </div>`).join('')}
          </div>

          <!-- CTA row -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding-top:1.1rem;border-top:1px solid rgba(255,255,255,.07);">
            <span style="font-size:.68rem;color:var(--gold);font-weight:700;letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;gap:.4rem;">
              <i class="fas fa-file-signature" style="font-size:.6rem;"></i>View Mandate
            </span>
            <div style="width:28px;height:28px;background:rgba(184,150,12,.12);border:1px solid rgba(184,150,12,.25);display:flex;align-items:center;justify-content:center;transition:all .22s;" onmouseover="this.style.background='var(--gold)';this.style.borderColor='var(--gold)'" onmouseout="this.style.background='rgba(184,150,12,.12)';this.style.borderColor='rgba(184,150,12,.25)'">
              <i class="fas fa-arrow-right" style="font-size:.55rem;color:var(--gold);pointer-events:none;"></i>
            </div>
          </div>
        </div>
      </a>`
      }).join('')}
    </div>

    <!-- Remaining mandates list -->
    <div style="border:1px solid rgba(255,255,255,.07);overflow:hidden;margin-top:.25rem;">
      <div style="padding:1.1rem 1.75rem;background:rgba(255,255,255,.03);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);">
        <div style="display:flex;align-items:center;gap:.75rem;">
          <i class="fas fa-folder-open" style="color:var(--gold);font-size:.75rem;"></i>
          <span style="font-size:.62rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.35);">More Active Mandates</span>
        </div>
        <a href="/listings" style="font-size:.65rem;color:var(--gold);font-weight:700;letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;gap:.4rem;">View All <i class="fas fa-arrow-right" style="font-size:.55rem;"></i></a>
      </div>
      ${LISTINGS.filter((l: any) => !l.highlight).map((l: any) => `
      <a href="/listings/${l.id}"
         style="display:flex;align-items:center;gap:1.5rem;padding:1.1rem 1.75rem;border-bottom:1px solid rgba(255,255,255,.04);text-decoration:none;transition:background .2s;"
         onmouseover="this.style.background='rgba(255,255,255,.03)'" onmouseout="this.style.background='transparent'">
        ${l.images?.[0]
          ? `<div style="width:60px;height:46px;overflow:hidden;flex-shrink:0;border:1px solid rgba(255,255,255,.08);"><img src="${l.images[0]}" alt="${l.title}" style="width:100%;height:100%;object-fit:cover;" loading="lazy"></div>`
          : `<div style="width:60px;height:46px;flex-shrink:0;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center;"><i class="fas fa-lock" style="color:rgba(184,150,12,.5);font-size:.7rem;"></i></div>`
        }
        <div style="flex:1;min-width:0;">
          <div style="font-size:.875rem;font-weight:600;color:#fff;margin-bottom:.15rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${l.title}</div>
          <div style="font-size:.7rem;color:rgba(255,255,255,.35);">${l.locationShort} · ${l.sector}</div>
        </div>
        <div style="flex-shrink:0;text-align:right;">
          <div style="font-family:'DM Serif Display',Georgia,serif;font-size:1.05rem;color:var(--gold);">${l.value}</div>
          <div style="font-size:.6rem;color:rgba(255,255,255,.3);letter-spacing:.06em;margin-top:.1rem;">${l.status}</div>
        </div>
        <i class="fas fa-chevron-right" style="font-size:.55rem;color:rgba(255,255,255,.2);flex-shrink:0;"></i>
      </a>`).join('')}
    </div>

    <!-- NDA disclaimer -->
    <div style="text-align:center;margin-top:2rem;padding:1.25rem;border:1px solid rgba(184,150,12,.1);background:rgba(184,150,12,.03);">
      <p style="font-size:.72rem;color:rgba(255,255,255,.35);line-height:1.75;">
        <i class="fas fa-shield-alt" style="color:var(--gold);margin-right:.5rem;font-size:.65rem;"></i>
        All mandates strictly by Mutual NDA · Information Memoranda available to qualified investors, family offices &amp; institutional buyers upon request
      </p>
    </div>

  </div>
</div>

<!-- ══ ADVISORY VERTICALS ═════════════════════════════════════════════ -->
<div class="sec-wh" style="padding-top:7rem;padding-bottom:7rem;">
  <div class="wrap">

    <!-- Section header -->
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:5rem;align-items:start;margin-bottom:4.5rem;" class="mob-stack">
      <div>
        <div class="gr"></div>
        <p class="eyebrow" style="margin-bottom:1rem;">Advisory Verticals</p>
        <h2 class="h2">Six Verticals.<br>One Trusted Partner.</h2>
      </div>
      <div style="display:flex;align-items:flex-end;padding-bottom:.25rem;">
        <p class="lead" style="max-width:480px;">From strategy to execution, India Gully delivers institutional-grade advisory across every sector it operates in. Deep expertise. Proven results.</p>
      </div>
    </div>

    <!-- Vertical grid -->
    <div class="vg">
      ${VERTICALS.map((v: any) => `
      <div class="vg-cell" onclick="window.location='/services#${v.id}'" role="button" tabindex="0">
        <div class="vg-icon">
          <span style="font-size:1.45rem;">${v.icon}</span>
        </div>
        <h3 style="font-family:'DM Serif Display',Georgia,serif;font-size:1.2rem;color:var(--ink);margin-bottom:.65rem;line-height:1.2;">${v.name}</h3>
        <p style="font-size:.875rem;line-height:1.8;color:var(--ink-soft);margin-bottom:1.1rem;">${v.desc}</p>
        <div class="vg-arr" style="display:flex;align-items:center;gap:.5rem;font-size:.7rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;">
          Explore <i class="fas fa-arrow-right" style="font-size:.6rem;"></i>
        </div>
      </div>`).join('')}
    </div>

  </div>
</div>

<!-- ══ THE INDIA GULLY DIFFERENCE ════════════════════════════════════ -->
<div class="sec-dk diff-section" style="background:#0a0a10;position:relative;overflow:hidden;padding-top:7rem;padding-bottom:7rem;">
  <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(184,150,12,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(184,150,12,.04) 1px,transparent 1px);background-size:80px 80px;pointer-events:none;"></div>

  <div class="wrap" style="position:relative;">
    <div style="text-align:center;max-width:640px;margin:0 auto 4.5rem;">
      <div class="gr-c"></div>
      <p class="eyebrow-lt" style="margin-bottom:1rem;">Our Proposition</p>
      <h2 class="h2-lt" style="color:#fff;">The India Gully Difference</h2>
      <p style="font-size:1rem;line-height:1.85;color:rgba(255,255,255,.6);margin-top:1.25rem;">What separates us from other advisory firms is not just depth of expertise — it is the way we stay committed from mandate inception to final delivery.</p>
    </div>

    <div class="diff-grid">
      ${[
        { icon:'flag',      n:'01', title:'India-Deep Expertise',    desc:'Born in India. We understand local markets, regulations, culture and consumer behaviour at granular depth across Tier-1, 2 and 3 cities.' },
        { icon:'handshake', n:'02', title:'20+ Brand Relationships', desc:'Deep relationships with every major hotel brand. We know which brand fits which project and navigate negotiations with authority.' },
        { icon:'utensils',  n:'03', title:'HORECA End-to-End',       desc:'One of the few consultants who also procure and supply, giving clients a single accountable partner from strategy to FF&E delivery.' },
        { icon:'bolt',      n:'04', title:'Execution-Led',           desc:'We stay involved through implementation, not just advisory. Turnkey delivery and hands-on project management is our differentiator.' },
      ].map((d, di) => `
      <div class="diff-cell reveal" style="transition-delay:${di*0.1}s;">
        <div style="font-family:'DM Serif Display',Georgia,serif;font-size:4rem;color:rgba(212,174,42,.18);line-height:1;margin-bottom:1.25rem;letter-spacing:-.05em;">${d.n}</div>
        <div class="ig-icon-box" style="margin-bottom:1.75rem;">
          <i class="fas fa-${d.icon}" style="color:var(--gold);font-size:.85rem;"></i>
        </div>
        <h3 style="font-family:'DM Serif Display',Georgia,serif;font-size:1.3rem;color:#fff;line-height:1.2;margin-bottom:1rem;">${d.title}</h3>
        <p style="font-size:.875rem;line-height:1.85;color:rgba(255,255,255,.6);">${d.desc}</p>
      </div>`).join('')}
    </div>
  </div>
</div>

<!-- ══ BRAND PARTNERS ═════════════════════════════════════════════════ -->
<div class="sec-wh" style="padding-top:7rem;padding-bottom:7rem;">
  <div class="wrap">

    <!-- ── HOSPITALITY BRANDS ── -->
    <div style="margin-bottom:6rem;">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1.5rem;">
        <div>
          <div class="gr"></div>
          <p class="eyebrow" style="margin-bottom:.875rem;">Hospitality Brand Ecosystem</p>
          <h2 class="h2">Hospitality Brands We<br>Synergize With</h2>
        </div>
        <div style="max-width:380px;text-align:right;">
          <p class="lead" style="font-size:.9375rem;margin-bottom:1.25rem;">Active institutional advisory and management relationships with India's most prominent hotel brands — from global chains to homegrown operators. Including our exclusive hospitality partner <strong>Nile Hospitality</strong>.</p>
          <a href="/services#hospitality" class="btn btn-sm btn-dko">Our Hospitality Practice</a>
        </div>
      </div>

      <!-- Category filter tabs for hotel brands -->
      <div id="hb-filters" style="display:flex;gap:.5rem;margin-bottom:2rem;flex-wrap:wrap;">
        ${['All','Global Chain','Indian Luxury','Midscale','Economy'].map((c,i) => `
        <button onclick="filterHB('${c}')" data-hbcat="${c}"
          style="padding:.3rem .85rem;font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border:1px solid ${i===0?'var(--gold)':'var(--border)'};background:${i===0?'rgba(184,150,12,.08)':'transparent'};color:${i===0?'var(--gold)':'var(--ink-muted)'};cursor:pointer;transition:all .2s;">
          ${c}${c!=='All'?` <span style="font-size:.55rem;opacity:.7;">(${HOSPITALITY_BRANDS.filter((b:any)=>b.cat===c).length})</span>`:''}
        </button>`).join('')}
      </div>

      <!-- Hotel brand grid -->
      <div id="hbGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:1rem;">
        ${HOSPITALITY_BRANDS.map((b: any) => `
        <div class="hb-card" data-hbcat="${b.cat}"
          style="border:1px solid var(--border);padding:.875rem .75rem;display:flex;flex-direction:column;align-items:center;gap:.5rem;transition:all .25s;cursor:default;"
          onmouseover="this.style.borderColor='${b.color}';this.style.background='rgba(${parseInt(b.color.slice(1,3),16)},${parseInt(b.color.slice(3,5),16)},${parseInt(b.color.slice(5,7),16)},.04)'"
          onmouseout="this.style.borderColor='var(--border)';this.style.background='transparent'">
          <img src="${b.svg}" alt="${b.name}" width="155" height="62"
               style="width:155px;height:62px;object-fit:contain;border-radius:3px;"
               loading="lazy" decoding="async">
          <div style="text-align:center;">
            <div style="font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-faint);">${b.cat}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>

    <!-- ── RETAIL BRANDS ── -->
    <div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1.5rem;">
        <div>
          <div class="gr"></div>
          <p class="eyebrow" style="margin-bottom:.875rem;">Retail Brand Alliance Structure</p>
          <h2 class="h2">Retail Brand Mandates — Leasing Velocity and Placement</h2>
        </div>
        <div style="max-width:420px;text-align:right;">
          <p class="lead" style="font-size:.9375rem;margin-bottom:1.25rem;">${RETAIL_BRANDS.length}+ active retail brand relationships — F&amp;B, anchor stores, cinemas, fashion, accessories &amp; electronics.</p>
          <a href="/services#retail" class="btn btn-sm btn-dko">Our Retail Practice</a>
        </div>
      </div>

      <!-- Retail category tabs -->
      <div id="rb-filters" style="display:flex;gap:.5rem;margin-bottom:2rem;flex-wrap:wrap;">
        ${['All','F&B','Anchor Retail','Cinema','Fashion & Apparel','Accessories & Beauty','Electronics'].map((c,i) => `
        <button onclick="filterRB('${c}')" data-rbcat="${c}"
          style="padding:.3rem .85rem;font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border:1px solid ${i===0?'var(--gold)':'var(--border)'};background:${i===0?'rgba(184,150,12,.08)':'transparent'};color:${i===0?'var(--gold)':'var(--ink-muted)'};cursor:pointer;transition:all .2s;">
          ${c}${c!=='All'?` <span style="font-size:.55rem;opacity:.7;">(${RETAIL_BRANDS.filter((b:any)=>b.cat===c).length})</span>`:''}
        </button>`).join('')}
      </div>

      <!-- Retail brand grid -->
      <div id="rbGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:1rem;">
        ${RETAIL_BRANDS.map((b: any) => `
        <div class="rb-card" data-rbcat="${b.cat}"
          style="border:1px solid var(--border);padding:.875rem .75rem;display:flex;flex-direction:column;align-items:center;gap:.5rem;transition:all .25s;cursor:default;"
          onmouseover="this.style.borderColor='${b.color}';this.style.background='rgba(${parseInt(b.color.slice(1,3),16)},${parseInt(b.color.slice(3,5),16)},${parseInt(b.color.slice(5,7),16)},.04)'"
          onmouseout="this.style.borderColor='var(--border)';this.style.background='transparent'">
          <img src="${b.svg}" alt="${b.name}" width="155" height="62"
               style="width:155px;height:62px;object-fit:contain;border-radius:3px;"
               loading="lazy" decoding="async">
          <div style="text-align:center;">
            <div style="font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-faint);">${b.cat}</div>
          </div>
        </div>`).join('')}
      </div>

      <!-- Category count summary strip -->
      <div style="display:flex;gap:1rem;margin-top:2.5rem;flex-wrap:wrap;justify-content:center;padding:1.5rem;background:rgba(184,150,12,.03);border:1px solid rgba(184,150,12,.12);">
        ${['F&B','Anchor Retail','Cinema','Fashion & Apparel','Accessories & Beauty','Electronics'].map((c: string) => {
          const count = RETAIL_BRANDS.filter((b: any) => b.cat === c).length
          const icons: Record<string,string> = {
            'F&B':'fa-utensils','Anchor Retail':'fa-store','Cinema':'fa-film',
            'Fashion & Apparel':'fa-shirt','Accessories & Beauty':'fa-gem','Electronics':'fa-mobile-screen'
          }
          return `<div style="display:flex;flex-direction:column;align-items:center;gap:.3rem;min-width:80px;">
            <i class="fas ${icons[c]||'fa-tag'}" style="font-size:.9rem;color:var(--gold);"></i>
            <span style="font-family:'DM Serif Display',Georgia,serif;font-size:1.2rem;color:var(--ink);">${count}</span>
            <span style="font-size:.56rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-faint);text-align:center;">${c}</span>
          </div>`
        }).join('')}
      </div>
    </div>

  </div>
</div>

<script>
/* ── Brand filter tabs ────────────────────────────────────────────── */
function filterHB(cat){
  document.querySelectorAll('[data-hbcat]').forEach(function(el){
    if(el.tagName === 'BUTTON'){
      var isActive = el.getAttribute('data-hbcat') === cat;
      el.style.borderColor  = isActive ? 'var(--gold)' : 'var(--border)';
      el.style.background   = isActive ? 'rgba(184,150,12,.08)' : 'transparent';
      el.style.color        = isActive ? 'var(--gold)' : 'var(--ink-muted)';
    } else {
      var show = cat === 'All' || el.getAttribute('data-hbcat') === cat;
      el.style.display = show ? '' : 'none';
    }
  });
}
function filterRB(cat){
  document.querySelectorAll('[data-rbcat]').forEach(function(el){
    if(el.tagName === 'BUTTON'){
      var isActive = el.getAttribute('data-rbcat') === cat;
      el.style.borderColor  = isActive ? 'var(--gold)' : 'var(--border)';
      el.style.background   = isActive ? 'rgba(184,150,12,.08)' : 'transparent';
      el.style.color        = isActive ? 'var(--gold)' : 'var(--ink-muted)';
    } else {
      var show = cat === 'All' || el.getAttribute('data-rbcat') === cat;
      el.style.display = show ? '' : 'none';
    }
  });
}
</script>

<!-- ══ RECENT INSIGHTS ═════════════════════════════════════════════════ -->
<div class="sec-wh" style="padding-top:5.5rem;padding-bottom:5.5rem;border-top:1px solid var(--border);">
  <div class="wrap">

    <!-- Section header -->
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:3rem;flex-wrap:wrap;gap:1rem;">
      <div>
        <div class="gr"></div>
        <p class="eyebrow" style="margin-bottom:.75rem;">Proprietary Advisory Intelligence</p>
        <h2 class="h2" style="margin-bottom:.5rem;">Institutional Research and Market Intelligence</h2>
        <p style="font-size:.88rem;color:var(--ink-muted);max-width:480px;line-height:1.7;">Advisory intelligence from India Gully's active deal pipeline — sector analysis, regulatory briefings, and market forecasts.</p>
      </div>
      <a href="/insights" class="btn btn-dko" style="flex-shrink:0;"><i class="fas fa-book-open" style="margin-right:.5rem;font-size:.7rem;"></i>Access Full Intelligence Library</a>
    </div>

    <!-- 3-column article cards -->
    <div class="insights-strip-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.75rem;">
      ${RECENT_INSIGHTS.map((a, idx) => `
      <article class="ins-home-card reveal" style="border:1px solid var(--border);overflow:hidden;transition:box-shadow .25s,transform .25s;" onmouseover="this.style.boxShadow='0 12px 40px rgba(0,0,0,.12)';this.style.transform='translateY(-3px)'" onmouseout="this.style.boxShadow='';this.style.transform=''">
        <!-- Thumbnail -->
        <a href="/insights/${a.id}" style="display:block;position:relative;height:168px;overflow:hidden;">
          <img src="${a.img}" alt="${a.title}" loading="lazy"
               style="width:100%;height:100%;object-fit:cover;transition:transform 5s ease;"
               onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
          <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.55) 0%,transparent 55%);"></div>
          <span style="position:absolute;top:.875rem;left:.875rem;background:${a.color};color:#fff;font-size:.52rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:.22rem .65rem;">${a.category}</span>
        </a>
        <!-- Body -->
        <div style="padding:1.5rem;">
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.875rem;">
            <span style="font-size:.62rem;color:var(--ink-muted);">${a.date}</span>
            <span style="width:3px;height:3px;border-radius:50%;background:var(--border-dark);display:inline-block;"></span>
            <span style="font-size:.62rem;color:var(--ink-muted);"><i class="fas fa-clock" style="margin-right:.25rem;font-size:.55rem;"></i>${a.readTime}</span>
          </div>
          <h3 style="font-family:'DM Serif Display',Georgia,serif;font-size:1.08rem;color:var(--ink);line-height:1.4;margin-bottom:.75rem;">
            <a href="/insights/${a.id}" style="text-decoration:none;color:inherit;transition:color .2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='inherit'">${a.title}</a>
          </h3>
          <p style="font-size:.8rem;color:var(--ink-soft);line-height:1.75;margin-bottom:1.25rem;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${a.excerpt}</p>
          <a href="/insights/${a.id}" style="font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${a.color};text-decoration:none;display:inline-flex;align-items:center;gap:.35rem;transition:gap .2s;" onmouseover="this.style.gap='.55rem'" onmouseout="this.style.gap='.35rem'">
            Read Article <i class="fas fa-arrow-right" style="font-size:.58rem;"></i>
          </a>
        </div>
      </article>`).join('')}
    </div>

    <style>
      @media(max-width:900px){.insights-strip-grid{grid-template-columns:repeat(2,1fr)!important;}}
      @media(max-width:560px){.insights-strip-grid{grid-template-columns:1fr!important;}}
    </style>

  </div>
</div>

<!-- ══ ADVISORY PARTNERS ══════════════════════════════════════════════ -->
<div class="sec-pd" style="padding-top:7rem;padding-bottom:7rem;">
  <div class="wrap">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6rem;align-items:center;" class="mob-stack">
      <div>
        <div class="gr"></div>
        <p class="eyebrow" style="margin-bottom:1rem;">Capital Markets and Strategic Transaction Ecosystem</p>
        <h2 class="h2" style="margin-bottom:1.5rem;">Strategic Advisory<br>Ecosystem</h2>
        <p class="lead" style="margin-bottom:2rem;">India Gully synergizes with globally recognized institutional advisory and consulting firms, bringing institutional credibility, financial rigour and sector depth to complex mandates.</p>
        <div style="padding:1.25rem 1.5rem;border-left:3px solid var(--gold);background:rgba(184,150,12,.04);">
          <p style="font-size:.82rem;line-height:1.8;color:var(--ink-soft);">Joint advisory with Ernst &amp; Young on the <strong style="color:var(--ink);">₹1,350+ Cr Entertainment City Limited divestment</strong> — India's largest entertainment real estate transaction.</p>
        </div>
      </div>
      <div class="partners-grid">
        ${ADVISORY_PARTNERS.slice(0,4).map((p: any) => `
        <div class="partner-card reveal">
          <div style="height:52px;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;">
            <img src="${p.logo}" alt="${p.name}" style="max-width:140px;max-height:42px;width:auto;height:auto;object-fit:contain;"
                 loading="lazy" decoding="async"
                 onerror="this.style.display='none';this.parentElement.nextElementSibling.style.display='flex'">
            <div style="display:none;align-items:center;justify-content:center;width:130px;height:42px;background:${p.color};border-radius:2px;">
              <span style="font-size:.78rem;font-weight:800;letter-spacing:.06em;color:${p.textColor || '#fff'};">${p.abbr}</span>
            </div>
          </div>
          <div style="font-family:'DM Serif Display',Georgia,serif;font-size:.95rem;color:var(--ink);margin-bottom:.25rem;">${p.name}</div>
          <div style="font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);">${p.sub}</div>
        </div>`).join('')}
      </div>
    </div>
    <!-- 5th partner centred -->
    ${ADVISORY_PARTNERS.slice(4).length > 0 ? `
    <div style="display:flex;justify-content:center;margin-top:1.75rem;">
      ${ADVISORY_PARTNERS.slice(4).map((p: any) => `
      <div class="partner-card" style="padding:1.75rem 3rem;">
        <div style="height:52px;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;">
          <img src="${p.logo}" alt="${p.name}" style="max-width:150px;max-height:46px;width:auto;height:auto;object-fit:contain;"
               loading="lazy" decoding="async"
               onerror="this.style.display='none';this.parentElement.nextElementSibling.style.display='flex'">
          <div style="display:none;align-items:center;justify-content:center;width:130px;height:42px;background:${p.color};border-radius:2px;">
            <span style="font-size:.78rem;font-weight:800;letter-spacing:.06em;color:${p.textColor || '#fff'};">${p.abbr}</span>
          </div>
        </div>
        <div style="font-family:'DM Serif Display',Georgia,serif;font-size:.95rem;color:var(--ink);text-align:center;margin-bottom:.25rem;">${p.name}</div>
        <div style="font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);text-align:center;">${p.sub}</div>
      </div>`).join('')}
    </div>` : ''}
  </div>
</div>

<!-- ══ TRACK RECORD ══════════════════════════════════════════════════ -->
<div class="sec-wh" style="padding-top:7rem;padding-bottom:7rem;">
  <div class="wrap">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:4rem;flex-wrap:wrap;gap:2rem;">
      <div>
        <div class="gr"></div>
        <p class="eyebrow" style="margin-bottom:1rem;">Transactional Record and Execution Alpha</p>
        <h2 class="h2">Optimized Asset Divestments.<br>Execution Alpha Delivered.</h2>
      </div>
      <a href="/works" class="btn btn-dko">Access Full Transactional Record</a>
    </div>

    <div id="trackRecord">
      ${[
        { title:'Entertainment City Limited — Landmark Divestment',  loc:'Joint Advisory with EY · Noida, UP',      icon:'🏆', type:'Capital Markets and Strategic Transaction Ecosystem', value:'₹1,350+ Cr', desc:'Served as Joint Transaction Advisors alongside EY for the 100% divestment of Entertainment City Limited. End-to-End Mandate Stewardship end-to-end advisory for this landmark transaction — India\'s largest entertainment real estate deal.' },
        { title:'Worlds of Wonder — Post-COVID Re-opening',          loc:'10-Acre Waterpark · Noida, UP',           icon:'🎡', type:'Operational Revival',  value:'Pan-India',  desc:"Orchestrated the strategic re-opening of India's premier waterpark following COVID-19 closure. End-to-End Mandate Stewardship lease negotiations and operational revival for this 10-acre world-class attraction." },
        { title:'Khubani at Hyatt Andaz Delhi',                      loc:'42,000 sq. ft.. Dining · New Delhi',       icon:'🍽️', type:'Hospitality Leasing',  value:'42,000 sq. ft.', desc:'Negotiated and executed leasing for a signature 27,000 + 15,000 sq. ft.. premium restaurant space within the iconic Hyatt Andaz property in New Delhi.' },
        { title:'800 Sq. Yard Asset — Anand Lok, New Delhi',         loc:'INR 65 Cr+ Exit · South Delhi',              icon:'🏛️', type:'Asset Acquisition',    value:'INR 65 Cr+', desc:'Executed a strategic acquisition of a prime South Delhi property. Delivered an exceptional ₹65+ Crores exit within a 6-month turnaround — demonstrating superior deal structuring and market timing.' },
        { title:'HORECA Supply — Mahindra Holidays & Resorts',        loc:'Pan-India · Multiple Locations',          icon:'🍽️', type:'HORECA Procurement',   value:'Pan-India', desc:"Established strategic HORECA supply partnership with Mahindra Holidays & Resorts, one of India's largest leisure hospitality companies, across their pan-India resort network." },
        { title:'Due Diligence — Adlabs Imagica for ECL',            loc:'INR 500 Cr Transaction · Maharashtra',       icon:'⚖️', type:'Client-Side SPOC',     value:'INR 500 Cr', desc:'Served as dedicated Client-Side SPOC for comprehensive due diligence in ECL\'s evaluation of Adlabs Imagica. Coordinated financial, legal and technical assessments for this landmark acquisition review.' },
      ].map((p, pi) => `
      <div class="feature-card reveal" style="padding:0;overflow:hidden;transition-delay:${pi*0.08}s;">
        <!-- Colored top strip -->
        <div style="height:3px;background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent);"></div>
        <div style="padding:2rem 1.75rem;">
          <!-- Icon + type -->
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:.75rem;">
            <span style="font-size:2.1rem;flex-shrink:0;">${p.icon}</span>
            <span style="background:rgba(184,150,12,.08);color:var(--gold);border:1px solid rgba(184,150,12,.2);font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.2rem .65rem;white-space:nowrap;">${p.type}</span>
          </div>
          <!-- Value display -->
          <div style="font-family:'DM Serif Display',Georgia,serif;font-size:1.5rem;color:var(--gold);line-height:1;margin-bottom:.625rem;">${p.value}</div>
          <!-- Title + location -->
          <h3 style="font-family:'DM Serif Display',Georgia,serif;font-size:1.1rem;color:var(--ink);line-height:1.3;margin-bottom:.3rem;">${p.title}</h3>
          <p style="font-size:.68rem;letter-spacing:.07em;color:var(--ink-muted);margin-bottom:1rem;display:flex;align-items:center;gap:.35rem;"><i class="fas fa-map-marker-alt" style="color:var(--gold);font-size:.58rem;"></i>${p.loc}</p>
          <p style="font-size:.85rem;color:var(--ink-soft);line-height:1.8;">${p.desc}</p>
        </div>
      </div>`).join('')}
    </div>
  </div>
</div>

<!-- ══ LEADERSHIP ════════════════════════════════════════════════════ -->
<div class="sec-pd" style="padding-top:7rem;padding-bottom:7rem;">
  <div class="wrap">
    <div style="display:grid;grid-template-columns:1fr 1.7fr;gap:5rem;align-items:start;" class="mob-stack">
      <div class="reveal-l">
        <div class="gr"></div>
        <p class="eyebrow" style="margin-bottom:1rem;">Executive Leadership and Mandate Custodians</p>
        <h2 class="h2" style="margin-bottom:1.5rem;">Institutional Leadership.<br>Mandate Custodians.</h2>
        <p class="lead" style="margin-bottom:2.25rem;">Our leadership brings decades of combined experience across hospitality, real estate, retail and entertainment, having led marquee mandates for India's most prominent developers, hotel brands and institutional investors.</p>
        <a href="/about" class="btn btn-dk">Access Executive Leadership Profile</a>
        <div style="margin-top:3rem;padding:1.5rem;border:1px solid var(--border);background:rgba(184,150,12,.03);">
          <div style="font-size:.6rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:.75rem;">Board & KMP</div>
          <div style="font-family:'DM Serif Display',Georgia,serif;font-size:1rem;color:var(--ink);line-height:1.5;">Three Directors. One Vision.<br>Building India's Premier Advisory Practice.</div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:1.25rem;">
        ${[
          { name:'Arun K. Manikonda', title:'Managing Director',      sub:'Director on Board & KMP',  init:'AM', photo:'/static/team/arun-manikonda.jpg',  ph:'+91 98108 89134', em:'akm@indiagully.com', li:'https://www.linkedin.com/in/arun-kumar-manikon', bio:'Founding MD with 20+ years across hospitality, real estate and entertainment. Former MD of Entertainment City Limited, Noida. Led INR 1,350 Cr+ joint advisory with EY — India\'s largest entertainment transaction.' },
          { name:'Pavan K. Manikonda', title:'Executive Director',      sub:'Director on Board & KMP',  init:'PM', photo:'/static/team/pavan-manikonda.jpg',  ph:'+91 62825 56067', em:'pavan@indiagully.com', li:'https://www.linkedin.com/in/pavan-kumar-manikonda-49254421/', bio:'Hospitality operations leader with 18+ years across hotel management, HORECA supply and brand on-boarding. Drives business development and operational delivery across India Gully\'s advisory verticals.' },
          { name:'Amit Jhingan',    title:'President, Real Estate',  sub:'Key Managerial Personnel', init:'AJ', photo:'/static/team/amit-jhingan.png',       ph:'+91 98999 93543', em:'amit.jhingan@indiagully.com', li:'https://www.linkedin.com/in/amit-jhingan-11631451/', bio:'Real Estate Vertical Head with 15+ years of pan-India experience. Specialist in retail leasing (1,40,000+ sq. ft. placed), commercial transactions and hospitality asset advisory across Delhi NCR and beyond.' },
        ].map((p, pi) => `
        <div class="leader-card" style="padding:1.75rem;display:grid;grid-template-columns:auto 1fr auto;gap:1.5rem;align-items:center;transition-delay:${pi*0.1}s;border:1px solid var(--border);" onmouseover="this.style.borderColor='rgba(184,150,12,.25)'" onmouseout="this.style.borderColor='var(--border)'">
          <!-- Avatar -->
          <div style="width:62px;height:62px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid rgba(184,150,12,.3);background:var(--ink);position:relative;">
            <img src="${p.photo}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;object-position:center top;"
                 onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\'width:62px;height:62px;background:var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;\'><span style=\'font-family:DM Serif Display,Georgia,serif;font-size:1.15rem;color:var(--gold);\'>${p.init}</span></div>';">
          </div>
          <!-- Info -->
          <div>
            <div style="font-family:'DM Serif Display',Georgia,serif;font-size:1.1rem;color:var(--ink);margin-bottom:.12rem;">${p.name}</div>
            <div style="font-size:.8rem;color:var(--ink-soft);margin-bottom:.1rem;">${p.title}</div>
            <div style="font-size:.66rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:.5rem;">${p.sub}</div>
            <div style="font-size:.8rem;color:var(--ink-muted);line-height:1.6;">${p.bio}</div>
          </div>
          <!-- Direct Directorship Access -->
          <div style="text-align:right;flex-shrink:0;display:flex;flex-direction:column;gap:.3rem;">
            <a href="tel:${p.ph.replace(/\s/g,'')}" style="font-size:.68rem;color:var(--ink-muted);display:flex;align-items:center;gap:.3rem;justify-content:flex-end;transition:color .2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--ink-muted)'"><i class="fas fa-phone" style="font-size:.58rem;color:var(--gold);"></i>${p.ph}</a>
            <a href="mailto:${p.em}" style="font-size:.68rem;color:var(--ink-muted);display:flex;align-items:center;gap:.3rem;justify-content:flex-end;transition:color .2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--ink-muted)'"><i class="fas fa-envelope" style="font-size:.58rem;color:var(--gold);"></i>${p.em}</a>
            <a href="${p.li}" target="_blank" rel="noopener" style="font-size:.68rem;color:var(--ink-muted);display:flex;align-items:center;gap:.3rem;justify-content:flex-end;transition:color .2s;" onmouseover="this.style.color='#0a66c2'" onmouseout="this.style.color='var(--ink-muted)'"><i class="fab fa-linkedin-in" style="font-size:.58rem;color:#0a66c2;"></i>LinkedIn</a>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>
</div>

<!-- ══ FINAL CTA ═══════════════════════════════════════════════════════ -->
<div class="sec-dk" style="position:relative;overflow:hidden;">
  <!-- Radial gold glow -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 65% 85% at 50% 50%,rgba(184,150,12,.07) 0%,transparent 65%);pointer-events:none;"></div>
  <!-- Subtle grid -->
  <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(184,150,12,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(184,150,12,.025) 1px,transparent 1px);background-size:80px 80px;pointer-events:none;"></div>

  <div class="wrap" style="text-align:center;max-width:820px;margin:0 auto;position:relative;">
    <div class="gr-c"></div>
    <p class="eyebrow-lt" style="margin-bottom:1rem;">Get in Touch</p>
    <h2 class="h2-lt" style="margin-bottom:1.5rem;">Ready to Work<br>With India Gully?</h2>
    <p style="font-size:1.05rem;line-height:1.9;color:rgba(255,255,255,.5);max-width:580px;margin:0 auto 3rem;">Whether you are a developer, investor, brand or operator — we bring the advisory depth, network and execution capability to deliver exceptional results.</p>

    <!-- CTA buttons -->
    <div class="cta-flex" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;margin-bottom:4rem;">
      <a href="/contact"  class="btn btn-g" style="min-width:230px;justify-content:center;padding:.9rem 2.25rem;">Initiate Mandate Submission</a>
      <a href="/listings" class="btn btn-ghost-g" style="min-width:200px;justify-content:center;">Access Active Strategic Mandates</a>
      <a href="/horeca"   class="btn btn-ghost" style="min-width:200px;justify-content:center;">HORECA Supply Enquiry</a>
    </div>

    <!-- Quick contact strip -->
    <div style="border-top:1px solid rgba(255,255,255,.07);padding-top:2.5rem;display:flex;flex-wrap:wrap;gap:2.5rem;justify-content:center;align-items:center;">
      <a href="tel:+918988988988" style="display:flex;align-items:center;gap:.65rem;font-size:.82rem;color:rgba(255,255,255,.45);transition:color .2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,.45)'">
        <div style="width:32px;height:32px;background:rgba(184,150,12,.1);border:1px solid rgba(184,150,12,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i class="fas fa-phone" style="font-size:.65rem;color:var(--gold);"></i>
        </div>
        +91 8988 988 988
      </a>
      <a href="mailto:info@indiagully.com" style="display:flex;align-items:center;gap:.65rem;font-size:.82rem;color:rgba(255,255,255,.45);transition:color .2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,.45)'">
        <div style="width:32px;height:32px;background:rgba(184,150,12,.1);border:1px solid rgba(184,150,12,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i class="fas fa-envelope" style="font-size:.65rem;color:var(--gold);"></i>
        </div>
        info@indiagully.com
      </a>
      <div style="display:flex;align-items:center;gap:.65rem;font-size:.82rem;color:rgba(255,255,255,.35);">
        <div style="width:32px;height:32px;background:rgba(184,150,12,.1);border:1px solid rgba(184,150,12,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i class="fas fa-map-marker-alt" style="font-size:.65rem;color:var(--gold);"></i>
        </div>
        New Delhi, India
      </div>
    </div>

  </div>
</div>

${cmsZoneHtml}`
  return c.html(layout(cmsTitle || 'Home', content, {
    description: cmsMeta || "India Gully. Celebrating Desiness. India's premier multi-vertical advisory firm across Real Estate, Retail, Hospitality, Entertainment, Debt & HORECA Solutions. INR 1,165 Cr+ active mandate pipeline.",
    canonical: 'https://indiagully.com/',
    ogImage: 'https://indiagully.com/static/og.jpg',
    heroPreload: '/static/mandates/chail/chail-img1.jpg',
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://indiagully.com/#organization",
          "name": "India Gully",
          "legalName": "Vivacious Entertainment and Hospitality Pvt. Ltd.",
          "url": "https://indiagully.com",
          "logo": "https://indiagully.com/assets/logo-white.png",
          "description": "India's premier multi-vertical advisory firm across Real Estate, Retail, Hospitality, Entertainment, Debt & HORECA Solutions.",
          "address": { "@type": "PostalAddress", "addressLocality": "New Delhi", "addressCountry": "IN" },
          "telephone": "+918988988988",
          "email": "info@indiagully.com",
          "sameAs": ["https://indiagully.com"],
          "foundingDate": "2017",
          "knowsAbout": ["Real Estate Capital Markets and Strategic Transaction Ecosystem","Hospitality Management","Retail Leasing","Entertainment Advisory","HORECA Procurement","Debt & Special Situations"]
        },
        {
          "@type": "WebSite",
          "@id": "https://indiagully.com/#website",
          "url": "https://indiagully.com",
          "name": "India Gully",
          "publisher": { "@id": "https://indiagully.com/#organization" }
        }
      ]
    })
  }))
})

export default app
