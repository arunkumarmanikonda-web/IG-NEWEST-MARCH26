import { Hono } from 'hono'
import { layout } from '../lib/layout'
import { VERTICALS, LISTINGS, HOSPITALITY_BRANDS, RETAIL_BRANDS, ADVISORY_PARTNERS } from '../lib/constants'

// ── RECENT INSIGHTS (3 latest) ───────────────────────────────────────────────
const RECENT_INSIGHTS = [
  {
    id: 'retail-leasing-trends-india-2026',
    category: 'Retail',
    date: 'March 2026',
    readTime: '8 min read',
    title: 'India Retail Leasing 2026: Premiumisation, Omnichannel & the New Mall Hierarchy',
    excerpt: 'High-street and grade-A malls are diverging sharply from secondary retail. We map the forces reshaping where brands expand, how rents are structured, and which micro-markets will lead the next leasing cycle.',
    img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
    color: '#B8960C',
  },
  {
    id: 'debt-special-situations-india-hospitality-2026',
    category: 'Debt & Special Situations',
    date: 'March 2026',
    readTime: '11 min read',
    title: 'Distressed Hospitality Assets in India 2026: Opportunity Map for Special Situations Investors',
    excerpt: 'IBC resolution timelines are shortening, and a new class of hotel assets is emerging from NCLT. We identify the 12 most actionable distressed hospitality opportunities and the deal structures that work.',
    img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&auto=format&fit=crop&q=80',
    color: '#7F1D1D',
  },
  {
    id: 'india-realty-2026-outlook',
    category: 'Real Estate',
    date: 'February 2026',
    readTime: '10 min read',
    title: 'India Real Estate 2026: Commercial & Hospitality Convergence',
    excerpt: 'Hybrid work patterns and experience-led tenants are rewriting Grade-A office specifications. Five structural drivers and an investment framework for developers navigating the convergence.',
    img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&auto=format&fit=crop&q=80',
    color: '#1A3A6B',
  },
]

const app = new Hono()

// ── HERO SLIDES ─────────────────────────────────────────────────────────────
// 3 Active Mandate slides + 3 Advisory Service slides
const SLIDES = [
  // ── MANDATE 1: Prism Tower, Gurgaon ────────────────────────────────────
  {
    bg: '#030610',
    tag: 'Active Mandate · Gurgaon · ₹400 Cr · Due Diligence Stage',
    h1a: 'Prism Tower',
    h1b: 'Gurgaon.',
    h1c: '312 Keys · Mixed-Use · REIT-Grade',
    sub: 'Institutional-grade mixed-use commercial building on Gurgaon-Faridabad Road, part of a 4-star hotel complex. 312 keys. REIT listing potential. India Gully advising on acquisition & due diligence.',
    cta1: { text: 'View Mandate & Sign NDA', href: '/listings/prism-tower-gurgaon' },
    cta2: { text: 'Enquire via WhatsApp', href: 'https://wa.me/919810889134?text=Hi%20Arun%2C%20I%20am%20interested%20in%20Prism%20Tower%20Gurgaon%20mandate' },
    img: '/static/mandates/gallery/img-23.jpg',
    label: 'REIT-Grade · ₹400 Cr',
    spoc: 'Arun Manikonda',
    value: '₹400 Cr',
    type: 'mandate',
  },
  // ── MANDATE 2: Belcibo Multi-Brand F&B Platform ─────────────────────────
  {
    bg: '#0a0008',
    tag: 'Growth Equity · Delhi NCR & Goa · ₹100 Cr · Active Fundraise',
    h1a: 'Belcibo',
    h1b: 'F&B Platform.',
    h1c: '15+ Outlets · Pan-India Rollout',
    sub: 'Scalable multi-brand F&B platform — Imperfecto, Noor, Begam, Khybani, Informal, RuinPub, Patio & more. Seeking strategic growth equity partner for pan-India expansion. Exclusive advisory mandate with India Gully.',
    cta1: { text: 'View Mandate & Sign NDA', href: '/listings/belcibo-hospitality-platform' },
    cta2: { text: 'Express Interest', href: 'https://wa.me/919810889134?text=Hi%20Arun%2C%20interested%20in%20Belcibo%20growth%20equity%20mandate' },
    img: '/static/mandates/gallery/img-03.jpg',
    label: 'Growth Equity · ₹100 Cr',
    spoc: 'Arun Manikonda',
    value: '₹100 Cr',
    type: 'mandate',
  },
  // ── MANDATE 3: Sawasdee JLG Galleria, Noida ─────────────────────────────
  {
    bg: '#020b14',
    tag: 'Outright Sale · Noida · ₹150 Cr · Negotiation Ready',
    h1a: 'Sawasdee JLG',
    h1b: 'Galleria.',
    h1c: '114 Keys · Hotel + Retail Mall · Noida',
    sub: 'Structure-ready 114-key hotel with integrated retail mall in Sector 63, Noida. Independent hotel access, possession-ready. India Gully holds the exclusive sale mandate. Outright sale — negotiation ready.',
    cta1: { text: 'View Mandate & Sign NDA', href: '/listings/sawasdee-jlg-noida' },
    cta2: { text: 'Enquire via WhatsApp', href: 'https://wa.me/919810889134?text=Hi%20Arun%2C%20interested%20in%20Sawasdee%20JLG%20Galleria%20Noida%20mandate' },
    img: '/static/mandates/gallery/img-10.jpg',
    label: 'Hotel + Mall · ₹150 Cr',
    spoc: 'Arun Manikonda',
    value: '₹150 Cr',
    type: 'mandate',
  },
  // ── ADVISORY 1: Transaction Advisory ───────────────────────────────────
  {
    bg: '#040408',
    tag: 'Transaction Advisory · Real Estate · Hospitality · Retail',
    h1a: 'India Gully',
    h1b: 'Advisory.',
    h1c: '₹2,000 Cr+ Transacted Across Verticals',
    sub: "India's premier multi-vertical advisory — Real Estate acquisitions, Hospitality asset sales, Retail leasing, Entertainment divestments and Debt solutions. EY & CBRE co-advisory credentials. NDA-governed mandates.",
    cta1: { text: 'View Active Mandates', href: '/listings' },
    cta2: { text: 'Submit Your Mandate', href: '/contact' },
    img: '/static/mandates/gallery/img-24.jpg',
    label: 'Transaction Advisory',
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
    cta2: { text: 'Discuss Your Mandate', href: '/contact' },
    img: '/static/mandates/gallery/img-04.jpg',
    label: 'Growth Equity · F&B',
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
    img: '/static/mandates/gallery/img-25.jpg',
    label: 'HORECA Procurement',
    type: 'advisory',
  },
]

app.get('/', (c) => {
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
                <div style="font-size:.55rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:.15rem;">SPOC · India Gully</div>
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
        ${(s as any).type === 'mandate' ? `<div style="background:rgba(184,150,12,.85);padding:.22rem .6rem;font-size:.52rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#fff;margin-bottom:.25rem;">Active Mandate · NDA Required</div>` : `<div style="background:rgba(26,58,107,.7);padding:.22rem .6rem;font-size:.52rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:.25rem;">Advisory Services</div>`}
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
      'Real Estate Advisory','Transaction Advisory','Retail Leasing Strategy',
      'Hotel Management Advisory','Entertainment Destinations','Debt & Special Situations',
      'HORECA Solutions','Brand On-Boarding','Financial Feasibility','Project Management',
      'Asset Management','Greenfield Hotels','Mall Leasing','FF&E Procurement',
      '₹1,165 Cr+ Pipeline','15+ Hotel Projects','35+ Retail Brands','Pan-India Presence'
    ].map(t=>`<span style="font-size:.62rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(0,0,0,.75);padding:0 2.5rem;">${t}</span><span style="color:rgba(0,0,0,.25);font-size:.45rem;flex-shrink:0;">◆</span>`).join('')}
    ${[
      'Real Estate Advisory','Transaction Advisory','Retail Leasing Strategy',
      'Hotel Management Advisory','Entertainment Destinations','Debt & Special Situations',
      'HORECA Solutions','Brand On-Boarding','Financial Feasibility','Project Management',
      'Asset Management','Greenfield Hotels','Mall Leasing','FF&E Procurement',
      '₹1,165 Cr+ Pipeline','15+ Hotel Projects','35+ Retail Brands','Pan-India Presence'
    ].map(t=>`<span style="font-size:.62rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(0,0,0,.75);padding:0 2.5rem;">${t}</span><span style="color:rgba(0,0,0,.25);font-size:.45rem;flex-shrink:0;">◆</span>`).join('')}
  </div>
</div>

<!-- ══ STATS BAR ════════════════════════════════════════════════════════ -->
<div style="position:relative;z-index:1;" id="homeStatsSection">
  <div id="homeStats">
    ${[
      { n:'₹1,165 Cr+', l:'Advisory Pipeline',      sub:'Active mandates under advisory', icon:'chart-line' },
      { n:'15+',         l:'Hotel Projects',          sub:'Pre-opening & PMC mandates', icon:'hotel' },
      { n:'30+',         l:'Retail Brand Partners',   sub:'Leasing & franchise advisory', icon:'store' },
      { n:'20+',         l:'Hospitality Brands',      sub:'Management & on-boarding', icon:'concierge-bell' },
      { n:'Pan-India',   l:'Operations Reach',        sub:'Tier 1, 2 &amp; 3 cities', icon:'map-marked-alt' },
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
      { icon:'chart-line',     color:'#B8960C', text:'₹1,165 Cr+ Active Pipeline' },
      { icon:'hotel',          color:'#a78bfa', text:'15+ Hotel Projects Executed' },
      { icon:'store',          color:'#34d399', text:'35+ Retail Brand Partnerships' },
      { icon:'building',       color:'#60a5fa', text:'CBRE Co-Advisory Partner' },
      { icon:'balance-scale',  color:'#fbbf24', text:'SEBI-Framework Advisory' },
      { icon:'registered',     color:'#B8960C', text:'MCA Registered · CIN U74999DL2017PTC323237' },
      { icon:'map-marked-alt', color:'#a78bfa', text:'Pan-India · Delhi · Chandigarh · Mumbai · Kerala' },
      { icon:'trophy',         color:'#fbbf24', text:'₹2,000 Cr+ Transactions Advised' },
      { icon:'calendar-alt',   color:'#34d399', text:'Established 2017 · 8+ Years' },
      { icon:'file-contract',  color:'#B8960C', text:'Mutual NDA Framework · All Mandates' },
      { icon:'concierge-bell', color:'#a78bfa', text:'20+ Hospitality Brand Partnerships' },
    ].concat([
      { icon:'shield-alt',     color:'#22c55e', text:'CERT-In Compliant' },
      { icon:'check-double',   color:'#B8960C', text:'OWASP Top-10 Secure' },
      { icon:'handshake',      color:'#60a5fa', text:'EY Co-Advisory Partner' },
      { icon:'chart-line',     color:'#B8960C', text:'₹1,165 Cr+ Active Pipeline' },
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
        <span class="sla-badge">24h Response</span>
        <span>All enquiries guaranteed</span>
      </div>
      <div class="trust-item">
        <i class="fas fa-shield-alt" style="color:var(--gold);"></i>
        <span>Mutual <strong>NDA</strong> before all mandates</span>
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
        <p class="eyebrow" style="margin-bottom:1rem;">Pan-India Presence</p>
        <h2 class="h2" style="margin-bottom:1.25rem;">Active Mandates<br>Across India</h2>
        <p class="body-lg" style="margin-bottom:2rem;color:var(--ink-soft);">India Gully operates across Tier 1, 2 and 3 markets — from Delhi NCR and Mumbai to Kasauli, Chail, Chandigarh and Jaipur. Our active mandates span 8+ cities with ₹1,165 Cr+ in combined advisory value.</p>
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
          <a href="/listings" class="btn btn-g" style="font-size:.75rem;"><i class="fas fa-map-marked-alt" style="margin-right:.4rem;font-size:.65rem;"></i>View Active Mandates</a>
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

            <!-- India States — generated from GADM GeoJSON, simplified for SVG rendering -->
            <g id="india-states" filter="url(#mapShadow)">
              <path class="india-state" d="M355.5,408.5L355.6,421.1L352.9,414.9L355.5,408.5Z"/>
              <path class="india-state" d="M358.2,397.1L359.1,404.1L358.4,405.6L356.7,404.6L358.1,407.1L355.8,407.4L355.8,398.6L358.2,397.1Z"/>
              <path class="india-state" d="M360.0,386.1L360.1,394.4L358.1,394.8L357.4,397.8L357.4,389.0L360.0,386.1Z"/>
              <path class="india-state" d="M213.1,333.7L211.4,333.5L213.3,336.1L208.3,339.0L200.4,339.6L194.9,350.1L192.9,350.4L191.1,347.6L185.4,351.1L182.3,361.0L186.0,388.4L183.7,383.6L182.4,385.9L185.9,389.5L181.8,386.8L178.2,392.5L173.9,390.3L173.8,392.6L170.1,395.6L163.9,394.8L161.8,401.0L159.3,402.2L156.9,401.0L157.6,398.3L159.0,396.9L160.5,398.2L162.2,391.3L159.3,390.4L159.6,386.1L155.4,385.1L155.8,381.5L153.5,382.0L154.0,379.9L151.8,380.1L150.3,383.5L146.8,384.4L146.4,381.8L143.0,380.4L142.9,383.1L140.5,383.3L139.1,376.4L140.9,376.1L142.6,379.2L144.9,378.6L146.1,381.0L145.4,376.9L147.5,376.5L147.5,374.7L145.9,373.6L145.9,375.8L142.7,373.4L142.1,375.5L139.8,375.0L140.3,371.0L137.3,369.1L138.8,363.4L137.5,361.3L141.7,362.3L142.7,360.3L140.2,354.1L142.3,351.7L141.5,347.3L147.6,346.9L148.7,340.0L143.8,337.8L147.0,335.9L147.5,328.8L145.8,325.3L150.0,320.7L146.6,319.2L149.6,312.7L147.8,304.9L153.5,298.5L151.0,295.1L152.4,290.5L156.6,291.6L158.5,287.9L158.5,280.3L165.9,282.9L167.4,286.3L170.4,287.8L171.3,285.3L174.4,287.2L179.1,285.9L181.3,288.8L180.4,298.8L190.3,303.6L191.7,309.4L195.0,309.4L196.0,315.8L203.7,315.3L209.4,311.3L212.6,312.5L215.5,303.3L217.6,308.4L220.0,304.9L223.5,306.0L222.9,301.6L228.2,298.4L226.9,295.7L229.0,296.4L231.3,293.0L232.9,296.9L233.5,295.4L234.6,298.6L237.5,299.8L240.7,299.2L242.1,295.3L246.1,293.0L246.6,294.7L238.1,307.1L230.6,311.9L225.6,319.1L214.1,326.9L213.1,333.7Z"/>
              <path class="india-state" d="M402.8,122.2L404.0,124.6L406.0,124.3L402.2,127.3L402.9,130.1L407.8,127.2L409.1,132.3L404.2,138.4L406.1,139.5L409.7,137.5L419.8,141.9L418.5,144.0L419.6,147.0L417.8,146.8L412.9,151.6L416.3,160.2L409.1,155.7L402.0,158.1L396.9,163.8L390.2,167.2L389.6,161.2L394.0,157.5L399.2,157.6L400.9,155.8L398.6,154.8L397.3,149.7L400.3,145.8L395.3,146.0L379.6,152.6L376.7,151.2L371.0,160.7L366.3,163.0L359.8,163.3L354.9,161.3L347.4,163.7L346.1,153.9L340.0,152.3L339.8,147.6L344.8,150.0L348.8,147.6L353.6,148.2L356.0,145.4L355.3,143.2L362.6,139.7L364.2,134.6L372.3,134.0L376.2,127.2L381.9,122.7L384.2,125.8L392.6,128.0L397.6,122.6L401.7,120.8L402.8,122.2Z"/>
              <path class="india-state" d="M400.0,146.2L397.3,149.8L398.6,154.8L400.9,155.8L399.2,157.6L393.9,157.5L393.2,159.7L379.7,167.5L377.6,170.9L377.1,169.3L373.0,180.0L370.5,181.7L370.2,179.2L364.1,186.2L366.1,190.2L361.1,198.5L360.1,205.2L357.2,205.7L356.4,203.3L352.3,209.8L351.7,207.8L348.8,207.9L349.2,197.0L352.6,197.4L352.5,193.5L356.9,191.7L353.7,187.5L354.8,185.5L351.2,182.8L348.1,184.1L348.0,179.6L350.0,177.3L344.8,178.7L343.4,176.7L341.4,180.2L340.1,178.1L339.4,180.8L335.3,183.3L334.9,181.0L332.2,181.6L331.4,179.5L320.1,179.3L317.1,183.1L318.8,185.3L316.7,186.3L317.0,179.6L314.3,175.5L316.6,172.2L316.6,166.3L324.1,163.6L328.1,165.8L341.6,165.2L354.9,161.3L359.8,163.3L368.5,162.5L376.8,153.2L376.7,151.2L379.6,152.6L395.3,146.0L400.0,146.2Z"/>
              <path class="india-state" d="M238.1,153.4L244.9,156.3L245.2,161.2L252.8,164.2L253.0,166.0L258.8,164.1L261.8,169.2L264.2,167.5L268.3,168.3L273.8,171.6L278.5,168.9L278.8,171.1L282.2,172.8L289.7,170.5L291.6,172.6L294.3,169.4L295.0,173.0L288.5,179.8L292.1,186.9L288.2,187.9L288.9,192.0L285.4,189.5L283.9,192.1L281.9,191.6L278.2,201.9L272.0,201.9L270.0,205.9L264.5,199.0L260.2,198.3L259.2,202.3L254.0,203.2L251.3,205.7L248.7,205.8L247.3,203.2L243.2,207.2L240.4,202.6L237.9,204.0L236.3,201.4L234.6,203.1L229.5,203.2L227.5,192.0L234.2,188.0L237.7,183.3L245.0,183.2L237.1,177.0L236.5,174.7L238.6,174.6L238.8,172.4L235.1,171.1L237.5,167.9L242.1,168.2L239.7,164.2L237.1,163.8L234.1,156.6L238.1,153.4Z"/>
              <path class="india-state" d="M227.2,210.4L232.2,215.0L233.3,218.7L236.5,218.2L236.9,226.4L241.6,230.8L236.5,235.9L236.5,239.3L231.2,242.2L230.7,248.0L227.3,253.9L228.2,256.3L226.4,255.9L225.3,259.9L217.7,259.6L215.3,265.1L213.8,264.1L214.4,277.8L218.7,279.0L218.8,281.4L217.0,282.7L217.1,281.1L213.7,281.7L212.2,278.9L207.3,278.1L207.0,280.4L209.9,282.5L209.3,287.1L211.5,288.6L212.3,297.0L207.5,301.4L208.3,302.9L205.6,306.5L202.6,307.9L200.6,315.5L196.0,315.8L195.0,309.4L191.7,309.4L191.6,305.4L185.0,299.7L186.9,291.5L189.4,288.8L191.9,290.7L193.9,287.8L189.1,281.8L187.1,282.3L189.1,277.7L186.9,274.8L190.1,273.3L187.9,259.3L190.9,257.2L191.5,250.2L196.9,238.1L203.8,236.4L208.2,227.4L211.1,226.4L211.6,223.3L207.9,219.9L203.7,220.3L203.7,213.6L216.1,215.6L220.0,212.7L224.5,213.9L227.2,210.4Z"/>
              <path class="india-state" d="M143.6,131.3L145.2,136.8L142.9,138.4L138.3,135.5L139.8,131.5L143.6,131.3Z"/>
              <path class="india-state" d="M97.9,349.3L99.6,352.1L103.1,351.4L104.2,357.4L102.0,363.8L98.4,360.9L96.6,355.5L98.1,355.4L95.2,350.3L97.9,349.3Z"/>
              <path class="india-state" d="M73.6,201.3L77.0,201.7L75.6,202.4L78.6,205.2L79.6,203.6L84.8,206.6L87.2,203.8L89.0,206.0L87.0,209.0L89.2,211.9L91.0,209.9L90.8,215.6L92.9,218.4L94.9,218.3L94.5,221.2L101.0,223.8L106.1,231.1L104.8,234.8L100.2,236.4L103.6,238.8L100.5,239.4L101.6,246.1L97.0,248.4L98.2,251.0L96.7,251.7L97.7,253.9L104.0,253.9L100.5,254.1L97.1,259.3L93.9,259.3L98.3,262.4L98.9,266.4L95.1,269.4L92.1,267.0L91.8,275.4L89.4,276.8L86.9,276.1L87.3,272.8L82.3,276.6L84.4,266.3L80.2,257.5L82.4,252.9L80.4,252.9L83.6,251.0L79.5,251.0L79.1,246.2L80.2,242.1L84.7,240.8L78.8,242.1L77.1,239.2L76.0,246.6L76.3,243.6L74.2,245.7L76.4,251.6L73.7,258.9L59.2,266.6L56.8,267.0L57.0,263.0L54.9,262.3L53.9,266.3L46.2,260.4L40.9,253.3L41.2,251.3L39.8,251.4L40.9,253.1L39.2,251.8L30.3,240.3L32.1,237.4L34.3,241.1L38.0,238.2L39.0,240.1L41.1,237.5L42.1,238.8L42.6,237.1L47.1,236.2L51.6,227.5L49.6,229.9L46.9,228.2L40.8,233.3L37.6,232.5L26.5,226.2L25.5,224.8L27.8,223.2L26.3,223.7L24.2,220.4L24.2,217.8L27.9,214.1L24.5,215.0L26.5,213.4L24.9,212.7L27.7,212.7L28.0,207.1L29.6,208.8L30.4,207.4L39.4,207.4L44.8,209.3L52.7,205.0L52.7,207.8L55.8,208.3L60.3,205.3L58.5,203.0L60.0,200.7L73.6,201.3Z"/>
              <path class="india-state" d="M138.4,97.2L142.7,100.4L143.4,103.8L148.7,105.7L142.2,115.7L143.6,130.2L139.8,131.5L138.3,135.5L142.9,138.4L145.2,136.7L147.1,138.3L148.0,146.1L143.8,148.8L141.1,148.3L140.2,151.0L138.8,141.5L134.3,145.7L133.4,142.7L130.9,142.2L131.5,144.8L129.1,145.3L130.0,147.9L126.4,147.5L127.4,144.0L126.1,143.7L128.2,142.7L120.9,135.0L118.7,124.2L114.3,124.7L111.1,121.8L107.7,123.1L107.8,116.0L105.9,115.4L106.7,112.7L114.4,113.3L116.3,119.4L119.3,115.1L127.5,116.1L130.2,114.0L129.7,109.2L131.4,110.1L132.5,108.5L135.2,110.5L134.4,107.4L137.3,104.5L139.7,105.3L138.4,97.2Z"/>
              <path class="india-state" d="M137.9,57.8L139.5,61.2L145.1,64.8L150.4,62.2L154.1,68.7L159.4,65.7L158.1,70.0L160.3,70.0L160.3,74.3L164.9,78.5L163.8,81.9L165.7,84.9L164.0,86.5L167.9,93.2L159.2,90.3L152.8,92.6L150.0,99.0L151.7,103.0L148.5,105.4L142.3,102.7L142.7,100.4L135.3,95.1L135.6,91.6L131.9,87.8L129.3,90.0L125.5,79.3L121.2,77.1L126.0,71.4L124.3,62.9L126.2,63.7L132.3,58.6L137.9,57.8Z"/>
              <path class="india-state" d="M152.9,21.2L155.8,20.4L154.2,22.6L157.7,33.5L167.7,39.5L164.0,43.9L164.0,50.8L169.0,57.9L173.6,58.8L172.8,62.1L175.5,68.3L167.7,72.7L165.0,70.5L164.5,66.8L158.5,70.5L159.4,65.7L154.1,68.7L150.4,62.2L145.1,64.8L139.5,61.2L137.6,57.5L132.3,58.6L126.2,63.7L124.3,62.9L125.9,67.7L120.1,73.9L114.4,70.4L109.0,70.2L109.1,64.4L106.8,66.1L104.3,61.5L99.8,58.5L102.1,54.2L99.0,49.7L103.2,45.5L98.0,44.2L99.2,40.6L96.3,38.9L99.0,33.4L104.7,31.7L123.5,36.5L133.4,31.8L136.3,32.4L137.2,29.6L140.6,29.4L151.9,20.0L152.9,21.2Z"/>
              <path class="india-state" d="M285.7,190.1L288.2,191.2L290.8,197.1L288.7,199.3L289.9,202.1L288.0,202.3L286.9,209.5L284.2,210.1L283.7,212.4L280.7,211.4L280.8,214.9L274.6,214.9L274.6,217.3L269.8,218.2L267.9,221.7L264.4,219.0L261.9,221.2L262.6,226.6L271.2,229.0L269.5,232.5L274.2,235.9L275.9,241.2L269.7,240.4L264.3,236.0L262.5,246.0L260.5,245.6L261.1,243.6L259.4,244.6L255.5,242.8L253.3,245.4L249.8,244.0L251.7,240.6L251.0,237.4L240.4,239.8L236.4,236.7L241.7,229.8L238.4,229.3L236.9,226.4L236.5,218.2L233.3,218.7L232.2,215.0L227.2,210.3L228.1,203.6L234.6,203.1L236.3,201.4L237.9,204.0L240.5,202.6L243.2,207.2L247.3,203.2L248.7,205.8L251.3,205.7L254.0,203.2L259.2,202.3L260.2,198.3L264.5,199.0L270.0,205.9L272.0,201.9L278.2,201.9L279.9,194.3L285.7,190.1Z"/>
              <path class="india-state" d="M145.2,305.0L145.6,307.1L148.9,307.6L148.1,311.3L149.6,312.7L146.6,319.2L150.0,320.6L145.8,325.3L147.5,328.8L147.0,335.9L143.8,337.8L148.7,340.8L147.3,341.4L147.6,346.9L143.1,346.5L140.9,348.4L142.3,351.3L140.2,354.1L142.9,359.6L141.7,362.3L137.5,361.1L138.8,363.4L137.3,369.1L140.3,371.0L139.8,375.1L142.1,375.5L142.7,373.4L145.9,375.8L145.9,373.6L147.5,374.7L147.5,376.5L145.4,376.9L146.1,381.0L144.9,378.6L142.6,379.2L140.9,376.1L139.1,376.4L140.5,383.3L142.9,383.1L143.0,380.4L146.4,381.8L147.1,384.4L154.0,379.9L153.5,382.0L155.9,381.7L155.4,385.1L159.6,386.1L159.3,390.4L162.2,391.3L160.5,398.2L159.0,396.9L157.3,399.8L151.9,398.1L150.6,401.3L148.7,401.4L149.1,405.6L147.0,409.0L150.6,409.6L149.7,413.4L147.2,413.5L146.4,416.6L139.2,416.0L138.4,419.5L132.5,418.0L128.4,414.9L128.4,412.9L125.1,413.3L119.0,407.6L117.7,402.6L113.9,401.4L113.1,399.2L111.4,399.8L104.9,369.9L100.8,365.6L104.2,357.4L103.1,351.4L100.9,351.1L104.6,349.4L106.0,344.9L104.6,344.7L106.4,343.9L103.3,336.5L106.1,334.6L107.4,336.4L109.0,335.5L109.1,333.7L112.2,332.8L112.4,329.9L116.2,331.6L117.2,329.7L122.5,329.6L121.9,321.0L126.0,323.5L132.2,323.7L131.5,319.0L134.1,316.3L136.4,317.6L137.1,313.9L139.5,313.6L140.0,309.1L142.1,309.7L145.2,305.0Z"/>
              <path class="india-state" d="M113.2,399.3L118.9,404.1L119.0,407.6L121.1,409.9L132.5,416.5L130.2,421.4L134.3,423.2L133.1,426.1L136.9,425.6L137.8,428.4L135.8,430.4L139.2,432.9L138.1,440.9L140.2,442.3L143.7,440.1L142.7,452.4L146.0,454.2L142.4,462.3L144.2,470.1L142.8,474.0L134.4,464.1L131.2,453.8L130.3,446.3L131.8,453.7L133.8,453.6L132.1,448.1L129.8,443.4L130.0,446.2L125.0,426.8L116.9,412.3L118.8,410.1L116.0,412.3L111.4,399.8L113.2,399.3Z"/>
              <path class="india-state" d="M159.3,164.1L167.9,167.2L169.8,172.9L164.5,182.8L165.3,184.9L160.2,185.9L158.3,189.1L160.4,193.2L156.5,197.7L159.5,207.4L161.2,205.5L165.1,209.0L167.5,206.1L166.4,201.4L164.6,201.9L162.1,191.0L160.2,190.5L163.2,187.9L164.8,189.4L164.3,187.0L165.7,188.1L167.0,186.0L167.7,189.1L165.0,190.4L165.8,191.5L167.3,189.5L166.2,192.6L168.1,190.7L169.8,193.5L172.1,193.1L172.0,189.7L174.7,190.8L173.4,193.4L179.7,193.7L179.6,191.3L185.2,188.2L187.5,192.4L185.5,195.0L190.0,194.1L189.8,192.8L192.3,194.3L191.2,193.1L193.7,192.1L192.7,196.3L197.2,197.1L199.0,192.5L202.0,194.1L203.1,192.1L203.6,194.3L207.7,195.2L208.5,198.2L211.7,198.3L213.1,201.8L214.6,202.1L215.0,200.2L219.5,201.3L218.0,209.8L220.1,212.7L216.1,215.6L203.7,213.6L203.7,220.3L207.9,219.9L211.6,223.3L211.1,226.4L208.2,227.4L203.8,236.4L196.9,238.1L190.5,256.7L187.2,255.8L185.2,251.8L175.3,253.0L174.7,250.9L171.1,250.0L166.8,252.2L167.1,254.0L160.2,253.8L159.5,251.8L153.5,255.7L148.6,256.0L146.3,253.2L148.9,253.1L148.0,250.4L144.5,249.4L137.8,252.2L135.5,258.9L129.3,260.7L128.3,255.9L116.3,255.3L111.9,251.6L107.2,250.7L105.7,245.0L102.4,246.7L100.9,245.4L100.5,239.4L103.6,238.8L100.2,236.4L104.8,234.8L106.1,231.1L104.0,227.7L109.8,225.2L106.7,223.3L112.4,218.2L113.2,211.5L111.8,207.7L109.9,207.3L111.3,204.2L109.3,203.5L110.5,198.8L111.8,201.1L113.5,199.1L111.2,198.8L110.9,196.1L113.8,197.7L115.4,194.6L117.8,194.6L116.8,197.2L119.0,197.6L117.4,198.5L116.1,196.8L116.2,200.0L124.7,199.9L125.7,204.4L123.2,205.3L124.7,210.8L122.8,212.6L120.3,211.2L119.5,213.4L121.2,215.4L126.6,213.2L129.5,206.5L129.9,208.4L134.2,209.3L136.4,207.3L136.5,209.2L139.2,209.9L138.1,203.1L140.1,204.3L141.5,202.5L137.9,198.4L139.9,197.5L138.6,195.2L146.1,193.5L145.6,188.4L143.4,190.1L137.5,190.1L134.7,188.0L133.5,183.4L142.3,174.7L159.3,164.1Z"/>
              <path class="india-state" d="M105.5,244.9L107.6,251.0L111.9,251.6L117.4,255.6L128.3,255.9L128.8,260.0L130.8,260.9L135.5,258.9L137.8,252.2L144.5,249.4L148.0,250.4L148.9,253.1L146.3,253.2L148.6,256.0L153.5,255.7L159.5,251.8L160.2,253.8L167.1,254.0L166.8,252.2L171.1,250.0L174.7,250.9L175.3,253.0L185.2,251.8L187.2,255.8L190.9,257.0L187.6,260.5L190.1,273.3L186.9,274.8L189.1,277.7L187.1,282.3L189.1,281.8L193.9,287.8L191.9,290.7L189.4,288.8L188.2,289.9L185.3,295.7L186.4,298.7L183.2,300.9L180.2,298.4L181.3,288.8L178.7,285.6L174.4,287.2L171.3,285.3L170.4,287.8L167.4,286.3L165.9,282.9L158.5,280.3L158.5,287.9L156.6,291.6L152.4,290.5L151.0,295.1L153.5,298.5L150.7,303.0L148.8,303.1L148.4,307.1L145.6,307.1L145.0,304.6L142.1,309.7L140.0,309.1L139.5,313.6L137.1,313.9L136.4,317.6L134.1,316.3L131.5,319.0L132.2,323.7L126.0,323.5L121.9,321.0L122.5,329.6L117.2,329.7L116.2,331.6L112.4,329.9L112.2,332.8L109.1,333.7L109.0,335.5L107.4,336.4L106.1,334.6L103.3,336.5L106.4,343.9L104.6,344.7L106.0,344.9L104.6,349.4L99.9,352.2L97.8,349.0L94.8,349.9L92.1,344.7L87.7,315.1L84.9,308.5L87.1,309.7L87.1,306.8L84.7,306.4L83.9,300.6L86.3,295.5L85.4,294.6L83.2,297.3L83.7,291.1L81.1,281.3L84.2,275.1L88.4,278.0L91.7,275.5L92.2,266.9L95.1,269.4L98.9,266.4L98.3,262.4L93.9,259.3L97.1,259.3L98.9,255.4L104.2,253.1L97.7,253.9L97.0,248.4L105.5,244.9Z"/>
              <path class="india-state" d="M381.2,184.5L382.6,187.7L381.3,191.7L383.4,194.9L375.5,214.5L369.9,211.9L366.5,212.9L364.4,210.2L363.1,211.6L359.3,210.1L361.1,198.5L365.1,191.0L367.9,192.0L371.0,185.9L377.5,187.1L381.2,184.5Z"/>
              <path class="india-state" d="M343.9,176.9L344.8,178.7L350.0,177.4L348.0,179.6L348.1,184.1L351.2,182.8L354.9,185.6L353.7,187.5L356.9,191.7L352.2,194.8L346.9,192.2L324.7,192.9L316.3,190.4L316.7,186.3L318.8,185.2L317.1,182.9L320.1,179.3L331.4,179.5L332.2,181.6L334.9,181.0L335.3,183.3L339.4,180.8L340.1,178.1L341.4,180.2L343.9,176.9Z"/>
              <path class="india-state" d="M356.9,205.0L359.9,205.5L359.3,210.1L364.2,211.2L365.7,217.3L365.0,226.4L363.7,228.6L361.4,227.9L362.4,241.1L358.4,246.3L355.7,242.9L354.2,245.8L349.4,215.1L350.0,207.8L352.3,209.8L356.4,203.3L356.9,205.0Z"/>
              <path class="india-state" d="M389.9,163.0L390.2,167.2L387.9,171.0L389.5,177.3L385.6,185.9L381.9,187.6L381.1,183.7L377.6,187.1L371.0,185.9L368.0,191.9L366.5,191.3L364.1,186.2L370.2,179.2L370.5,181.7L373.0,180.0L377.1,169.3L377.6,170.9L385.9,162.8L389.6,161.2L389.9,163.0Z"/>
              <path class="india-state" d="M264.9,236.6L277.0,244.1L277.9,247.7L280.7,246.2L281.2,248.7L283.8,250.0L284.1,252.0L278.9,253.5L275.0,258.9L277.1,265.1L274.1,268.6L278.1,267.0L273.8,270.8L274.3,273.3L270.1,276.1L269.1,279.2L267.2,277.9L268.7,279.6L255.8,285.1L247.1,293.7L245.5,292.9L244.5,295.3L242.1,295.3L240.7,299.2L234.9,298.8L231.3,293.0L229.0,296.4L226.9,295.7L228.2,298.4L222.9,301.6L223.5,306.0L220.0,304.9L217.6,308.4L215.5,303.3L212.7,312.5L209.4,311.3L203.7,315.3L200.6,315.5L202.6,307.9L205.6,306.5L208.3,302.9L207.5,301.4L212.3,297.0L211.5,288.6L209.3,287.1L209.9,282.5L207.0,280.4L207.2,278.2L208.2,277.1L212.2,278.9L213.7,281.7L215.1,280.5L217.0,282.7L218.7,281.7L218.7,279.0L214.4,277.8L213.8,264.1L215.3,265.1L217.7,259.6L224.4,260.4L226.4,255.9L228.2,256.3L227.3,253.9L230.7,248.0L231.3,242.0L236.5,239.3L236.3,236.6L240.4,239.8L251.0,237.4L249.9,244.2L253.3,245.4L255.1,242.9L259.4,244.6L261.1,243.6L260.5,245.6L262.5,246.0L264.4,240.3L263.2,237.5L264.9,236.6Z"/>
              <path class="india-state" d="M125.1,70.3L126.0,71.5L121.8,74.5L121.2,77.1L125.5,79.3L129.3,90.0L131.9,87.8L132.8,90.4L135.5,91.4L135.3,95.1L138.5,98.6L136.4,99.4L138.7,100.5L139.6,105.4L137.3,104.5L134.4,107.4L135.2,110.5L132.5,108.5L131.4,110.1L129.7,109.2L130.2,114.0L127.5,116.1L119.3,115.1L116.3,119.4L114.4,113.3L98.1,112.4L97.8,105.5L109.1,93.6L106.5,92.8L108.3,87.5L106.6,83.1L107.8,80.4L112.1,77.4L116.5,77.0L117.7,72.7L120.1,73.9L125.1,70.3Z"/>
              <path class="india-state" d="M98.0,112.2L106.7,112.8L107.7,123.1L111.1,121.8L114.3,124.7L118.7,124.2L120.9,135.0L128.2,142.7L126.1,143.7L127.4,144.0L126.4,147.5L130.0,147.9L129.1,145.3L131.5,144.8L130.9,142.2L133.4,142.7L134.3,145.7L139.2,141.8L139.3,151.0L141.7,149.6L141.1,148.3L144.7,148.6L145.2,153.1L149.8,158.6L147.4,160.4L150.9,161.6L146.4,164.2L146.8,166.2L150.9,163.0L157.9,163.2L155.5,167.2L142.3,174.7L133.5,183.4L134.7,188.0L137.5,190.1L143.4,190.1L145.6,188.4L146.1,193.5L138.6,195.2L139.9,197.5L137.9,198.4L141.5,202.5L140.1,204.3L138.1,203.1L139.2,209.9L136.5,209.2L136.4,207.3L134.2,209.3L129.9,208.4L129.5,206.5L126.6,213.2L121.2,215.4L119.5,213.4L120.3,211.2L122.8,212.6L124.7,210.8L123.2,205.3L125.7,204.4L124.7,199.9L116.2,200.0L116.1,196.8L117.4,198.5L119.0,197.6L116.8,197.2L118.0,194.6L115.4,194.6L113.8,197.7L111.1,195.8L111.2,198.8L113.5,199.5L111.8,201.1L110.5,198.8L109.3,203.5L111.3,204.2L109.9,207.3L111.8,207.7L113.2,211.5L112.4,218.2L106.7,223.3L109.8,225.2L104.0,227.7L99.2,222.4L94.5,221.2L94.9,218.3L92.9,218.4L90.8,215.6L91.0,209.9L89.2,211.9L87.0,209.0L89.0,206.0L87.2,203.8L84.8,206.6L79.6,203.6L78.6,205.2L75.6,202.4L77.0,201.7L72.9,200.3L70.3,202.0L60.1,200.9L54.0,188.8L53.9,183.7L48.6,183.6L46.1,179.6L47.1,169.5L42.3,168.8L37.8,165.2L39.2,159.0L49.8,145.1L52.5,144.9L56.9,150.3L70.8,146.0L77.5,132.5L85.1,128.1L91.2,112.9L99.1,108.6L98.0,112.2Z"/>
              <path class="india-state" d="M300.0,143.6L303.2,147.0L301.7,152.5L303.6,157.2L301.2,159.7L293.0,160.0L291.4,158.3L293.9,148.7L292.8,146.1L300.0,143.6Z"/>
              <path class="india-state" d="M182.7,386.9L185.9,389.5L186.1,388.3L185.1,399.4L179.5,413.4L176.8,412.8L178.9,415.6L179.7,429.5L177.6,430.5L179.6,432.2L180.1,440.8L176.6,439.7L175.6,440.6L178.0,441.2L175.4,440.0L172.0,441.5L166.6,454.3L170.6,457.8L159.3,461.0L156.6,464.5L155.2,473.0L148.2,477.9L144.9,477.2L141.9,474.2L144.2,470.2L142.4,462.3L146.0,454.2L142.7,452.4L144.5,442.3L143.7,440.1L140.2,442.3L138.1,440.9L139.2,432.9L135.8,430.4L137.8,428.4L136.9,425.6L133.1,426.1L134.3,423.2L130.2,421.4L130.0,419.7L133.8,417.5L138.4,419.5L139.2,416.0L146.4,416.6L147.2,413.5L149.7,413.4L151.1,410.6L147.0,408.3L148.9,406.4L148.7,401.4L150.6,401.3L151.9,398.1L160.5,402.2L163.9,394.8L170.1,395.6L173.8,392.6L173.9,390.3L178.2,392.5L182.7,386.9Z"/>
              <path class="india-state" d="M348.4,203.3L350.3,214.2L349.0,217.8L345.4,216.6L345.6,220.7L342.8,224.3L343.6,227.2L340.7,229.7L337.9,224.1L337.1,227.1L334.4,216.4L337.3,210.2L340.4,210.7L341.3,208.2L342.6,209.7L342.4,207.9L344.6,209.7L344.8,206.4L348.4,203.3Z"/>
              <path class="india-state" d="M148.6,105.0L153.4,107.7L150.2,114.0L154.1,119.4L159.9,115.7L162.6,119.2L166.9,120.9L164.1,123.3L173.6,131.0L178.6,130.4L181.2,133.3L183.3,131.4L188.8,136.0L189.5,133.8L207.5,147.6L210.0,146.5L215.2,150.6L218.8,149.9L219.1,153.5L225.3,154.4L227.1,156.4L228.1,153.9L231.2,154.1L235.3,156.5L237.1,163.8L239.7,164.2L242.1,168.2L237.5,167.9L235.1,170.0L238.8,172.4L236.5,175.7L245.0,183.2L237.7,183.3L234.2,188.0L227.3,192.3L227.6,197.5L230.1,201.6L225.3,213.4L221.9,214.1L218.1,210.0L219.5,201.3L215.0,200.2L214.6,202.1L213.1,201.8L211.7,198.3L208.5,198.2L207.7,195.2L203.6,194.3L203.1,192.1L202.0,194.1L199.0,192.5L197.2,197.1L192.7,196.3L193.7,192.1L191.2,193.1L192.3,194.3L189.8,192.8L190.0,194.1L185.5,195.0L187.5,192.4L185.2,188.2L179.6,191.3L179.7,193.7L173.4,193.4L174.7,190.8L172.0,189.7L172.1,193.1L169.8,193.5L168.1,190.7L166.2,192.6L167.3,189.5L165.8,191.5L165.0,190.4L167.7,189.1L167.0,186.0L165.7,188.1L164.3,187.0L164.8,189.4L163.2,187.9L160.2,190.5L162.1,191.0L164.6,201.9L166.4,201.4L167.5,206.1L165.1,209.0L161.2,205.5L159.0,206.9L156.5,197.7L160.4,193.2L158.3,189.1L160.2,185.9L165.3,184.9L164.5,182.8L169.7,171.2L167.9,167.2L157.2,164.7L157.3,162.7L154.6,164.3L150.9,163.0L146.5,165.8L146.4,164.2L150.9,161.6L147.7,160.8L149.8,158.6L144.9,151.7L144.4,148.5L148.0,146.1L148.0,141.1L143.3,131.9L141.8,118.5L148.6,105.0Z"/>
              <path class="india-state" d="M170.7,89.3L173.6,94.5L179.7,95.5L184.7,99.1L184.6,102.2L195.6,107.6L186.7,116.0L185.8,125.1L181.5,133.3L178.6,130.4L173.6,131.0L169.8,126.4L166.6,126.0L164.1,123.3L166.9,120.9L162.6,119.2L160.8,116.1L158.8,115.3L154.1,119.4L150.2,114.0L153.4,107.7L148.3,104.9L151.7,103.0L150.0,99.0L152.8,92.6L159.2,90.3L167.2,93.4L168.6,87.3L170.7,89.3Z"/>
              <path class="india-state" d="M292.9,159.9L302.1,159.7L306.6,165.2L310.0,164.2L316.6,166.9L316.7,171.2L312.4,179.2L307.1,176.4L306.1,172.0L304.3,170.9L305.8,174.4L302.7,174.7L296.3,168.7L295.7,170.7L298.3,172.6L293.6,176.2L292.8,182.0L294.8,181.9L298.6,186.9L302.2,186.7L305.0,190.5L303.8,192.6L297.3,192.1L296.6,196.3L295.6,197.6L293.1,196.4L291.3,200.9L295.7,205.6L301.2,207.4L301.7,212.3L299.0,214.4L298.8,218.0L302.1,220.5L301.0,224.5L304.8,225.2L302.7,228.7L304.3,233.9L302.2,233.2L304.3,235.2L302.8,238.2L300.4,235.5L303.1,239.5L301.2,242.2L300.3,239.8L299.5,246.9L298.6,245.9L297.9,247.5L298.7,244.8L297.6,247.2L297.5,245.2L296.8,247.3L296.3,245.9L294.9,249.9L293.9,242.6L292.6,240.3L290.9,241.3L289.6,238.1L293.7,243.8L292.0,245.2L290.7,243.7L291.9,245.3L290.2,248.8L284.1,252.0L280.7,246.2L277.9,247.7L277.7,244.7L273.6,243.0L275.9,240.5L274.2,235.9L269.5,232.5L271.2,229.0L266.6,228.8L261.4,224.3L264.3,219.0L267.9,221.7L269.8,218.2L274.6,217.3L274.6,214.9L280.8,214.9L280.7,211.4L283.7,212.4L284.2,210.1L286.9,209.5L288.0,202.3L289.9,202.1L288.7,199.3L290.8,197.1L288.0,193.7L289.2,190.7L287.9,188.5L292.1,186.9L288.5,180.0L295.1,172.7L294.3,169.4L292.6,169.7L293.6,164.2L291.0,160.0L291.6,158.3L292.9,159.9Z"/>
            </g>

            <!-- ══ MANDATE CITY PINS ══ -->

            <!-- Himachal Pradesh (Kasauli · Chail) lon 77.1°E lat 31.0°N → 122,89 -->
            <g id="pin-himachal" class="map-pin-group" style="cursor:pointer;" onmouseover="igMapHover('himachal',true)" onmouseout="igMapHover('himachal',false)">
              <circle cx="122" cy="89" r="7.5" fill="#1A3A6B" stroke="rgba(255,255,255,.9)" stroke-width="1.5"/>
              <circle cx="122" cy="89" r="3" fill="#fff"/>
              <text x="133" y="86" class="map-pin-label">Kasauli · Chail</text>
              <text x="133" y="96" class="map-pin-sub">₹75 Cr</text>
            </g>

            <!-- Chandigarh lon 76.8°E lat 30.7°N → 119,94 -->
            <g id="pin-chandigarh" class="map-pin-group" style="cursor:pointer;" onmouseover="igMapHover('chandigarh',true)" onmouseout="igMapHover('chandigarh',false)">
              <circle cx="119" cy="107" r="7.5" fill="#065F46" stroke="rgba(255,255,255,.9)" stroke-width="1.5"/>
              <circle cx="119" cy="107" r="3" fill="#fff"/>
              <text x="131" y="104" class="map-pin-label">Chandigarh</text>
              <text x="131" y="114" class="map-pin-sub">₹70 Cr</text>
            </g>

            <!-- Delhi NCR lon 77.2°E lat 28.6°N → 123,127 — pulsing gold -->
            <g id="pin-delhi" class="map-pin-group" style="cursor:pointer;" onmouseover="igMapHover('delhi',true)" onmouseout="igMapHover('delhi',false)">
              <circle cx="123" cy="127" r="22" fill="rgba(184,150,12,.09)" stroke="rgba(184,150,12,.28)" stroke-width="1">
                <animate attributeName="r" values="22;32;22" dur="2.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values=".7;0.08;.7" dur="2.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="123" cy="127" r="12" fill="#B8960C" stroke="#fff" stroke-width="2" filter="url(#mapPinGlow)"/>
              <circle cx="123" cy="127" r="5" fill="#fff"/>
              <text x="140" y="121" class="map-pin-label" style="font-size:9.5px;">Delhi NCR</text>
              <text x="140" y="133" class="map-pin-sub" style="font-size:7px;opacity:.7;">3 Mandates · ₹900 Cr</text>
            </g>

            <!-- Jaipur lon 75.8°E lat 26.9°N → 107,154 -->
            <g id="pin-jaipur" class="map-pin-group" style="cursor:pointer;" onmouseover="igMapHover('jaipur',true)" onmouseout="igMapHover('jaipur',false)">
              <circle cx="107" cy="154" r="7.5" fill="#7C3AED" stroke="rgba(255,255,255,.9)" stroke-width="1.5"/>
              <circle cx="107" cy="154" r="3" fill="#fff"/>
              <text x="94" y="150" class="map-pin-label" text-anchor="end">Jaipur</text>
              <text x="94" y="160" class="map-pin-sub" text-anchor="end">₹20 Cr</text>
            </g>

            <!-- Mumbai lon 72.8°E lat 19.1°N → 71,277 -->
            <g id="pin-mumbai" class="map-pin-group" style="cursor:pointer;" onmouseover="igMapHover('mumbai',true)" onmouseout="igMapHover('mumbai',false)">
              <circle cx="71" cy="277" r="8" fill="#dc2626" stroke="rgba(255,255,255,.9)" stroke-width="1.5"/>
              <circle cx="71" cy="277" r="3.2" fill="#fff"/>
              <text x="58" y="273" class="map-pin-label" text-anchor="end">Mumbai</text>
              <text x="58" y="283" class="map-pin-sub" text-anchor="end">Pipeline</text>
            </g>

            <!-- Bengaluru lon 77.6°E lat 12.9°N → 128,374 -->
            <g id="pin-bengaluru" class="map-pin-group" style="cursor:pointer;" onmouseover="igMapHover('bengaluru',true)" onmouseout="igMapHover('bengaluru',false)">
              <circle cx="128" cy="374" r="7" fill="#065F46" stroke="rgba(255,255,255,.9)" stroke-width="1.5"/>
              <circle cx="128" cy="374" r="2.8" fill="#fff"/>
              <text x="140" y="371" class="map-pin-label">Bengaluru</text>
              <text x="140" y="381" class="map-pin-sub">Pipeline</text>
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

          </svg>
          <!-- Hover tooltip -->
          <div id="map-tooltip" style="position:absolute;display:none;background:rgba(10,10,10,.95);color:#fff;padding:.5rem .75rem;font-size:.7rem;pointer-events:none;border:1px solid rgba(184,150,12,.35);max-width:180px;z-index:10;border-radius:3px;box-shadow:0 8px 24px rgba(0,0,0,.3);"></div>
        </div>
        <!-- Map caption -->
        <p class="india-map-caption" style="font-size:.62rem;color:var(--ink-faint);text-align:center;margin-top:.5rem;"><i class="fas fa-map-pin" style="color:var(--gold);margin-right:.3rem;font-size:.55rem;"></i>Pins show active India Gully advisory mandates · Updated Q1 2026</p>
        <script>
        (function(){
          var tooltips = {
            delhi:      { title:'Delhi NCR', sub:'Prism Tower · Ambience Tower · Sawasdee JLG', val:'₹900 Cr combined', color:'#B8960C' },
            chandigarh: { title:'Chandigarh', sub:'Hotel Rajshree & Spa · 41 Keys', val:'₹70 Cr', color:'#065F46' },
            himachal:   { title:'Himachal Pradesh', sub:'WelcomHeritage Kasauli · Maple Resort Chail', val:'₹75 Cr combined', color:'#1A3A6B' },
            jaipur:     { title:'Jaipur', sub:'Heritage Hotel · 43 Keys', val:'₹20 Cr', color:'#7C3AED' },
            mumbai:     { title:'Mumbai', sub:'BKC · Lower Parel · Advisory pipeline', val:'In discussion', color:'#dc2626' },
            bengaluru:  { title:'Bengaluru', sub:'Whitefield · MG Road · Active pipeline', val:'In discussion', color:'#065F46' },
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
        { icon:'trophy',         color:'#B8960C', bg:'rgba(184,150,12,.08)', border:'rgba(184,150,12,.18)', title:'₹2,000+ Cr Transacted',       desc:'Landmark transactions including joint advisory with EY for the ₹1,350 Cr+ divestment of Entertainment City Limited — India\'s largest entertainment sector transaction.' },
        { icon:'hotel',          color:'#065F46', bg:'rgba(6,95,70,.08)',    border:'rgba(6,95,70,.18)',    title:'15+ Hotels On-Boarded',        desc:'Hotel brand selection, pre-opening management and PMC across Marriott, Radisson, Cygnett, Regenta and more — from site selection to first check-in.' },
        { icon:'store',          color:'#1A3A6B', bg:'rgba(26,58,107,.08)', border:'rgba(26,58,107,.18)',  title:'1,40,000+ Sq Ft Leased',       desc:'Premium F&B and retail leasing at Gardens Galleria, Hyatt Andaz, AIPL Joy Street and Entertainment City — India\'s top retail destinations.' },
        { icon:'utensils',       color:'#B8960C', bg:'rgba(184,150,12,.08)', border:'rgba(184,150,12,.18)', title:'HORECA to 15+ Properties',     desc:'End-to-end supply of FF&E, OS&E, kitchen equipment and amenities for Mahindra Holidays, Accor, CGH Earth and more across India.' },
        { icon:'handshake',      color:'#7C3AED', bg:'rgba(124,58,237,.08)', border:'rgba(124,58,237,.18)', title:'Co-Advisory with EY & CBRE',   desc:'Trusted by India\'s top professional service firms as co-advisor on complex, multi-party institutional transactions requiring deep sector expertise.' },
        { icon:'map-marked-alt', color:'#B8960C', bg:'rgba(184,150,12,.08)', border:'rgba(184,150,12,.18)', title:'Pan-India Presence',           desc:'Active mandates in Delhi NCR, Chandigarh, Kasauli, Chail, Jaipur, Noida, Gurugram, Bengaluru, Mumbai and Kerala — Tier 1 to 3 markets.' },
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
        { icon:'flag',      n:'01', title:'India-Deep Expertise',    desc:'Born in India. We understand local markets, regulations, culture and consumer behaviour at granular depth across Tier 1, 2 and 3 cities.' },
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
          <p class="eyebrow" style="margin-bottom:.875rem;">Hospitality Partners</p>
          <h2 class="h2">Hotel Brands We<br>Work With</h2>
        </div>
        <div style="max-width:380px;text-align:right;">
          <p class="lead" style="font-size:.9375rem;margin-bottom:1.25rem;">Active relationships with India's most prominent hotel brands — from global chains to homegrown operators. Including our exclusive partner <strong>Nile Hospitality</strong>.</p>
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
          <p class="eyebrow" style="margin-bottom:.875rem;">Retail Partners</p>
          <h2 class="h2">Retail Brands We<br>Advise &amp; Place</h2>
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
        <p class="eyebrow" style="margin-bottom:.75rem;">Knowledge & Research</p>
        <h2 class="h2" style="margin-bottom:.5rem;">Recent Insights</h2>
        <p style="font-size:.88rem;color:var(--ink-muted);max-width:480px;line-height:1.7;">Advisory intelligence from India Gully's active deal pipeline — sector analysis, regulatory briefings, and market forecasts.</p>
      </div>
      <a href="/insights" class="btn btn-dko" style="flex-shrink:0;"><i class="fas fa-book-open" style="margin-right:.5rem;font-size:.7rem;"></i>All Articles</a>
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
        <p class="eyebrow" style="margin-bottom:1rem;">Transaction Advisory</p>
        <h2 class="h2" style="margin-bottom:1.5rem;">Our Advisory<br>Partners</h2>
        <p class="lead" style="margin-bottom:2rem;">India Gully collaborates with globally recognised advisory and consulting firms, bringing institutional credibility, financial rigour and sector depth to complex mandates.</p>
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
        <p class="eyebrow" style="margin-bottom:1rem;">Track Record</p>
        <h2 class="h2">Mandates Executed.<br>Relationships Built.</h2>
      </div>
      <a href="/works" class="btn btn-dko">View All Completed Works</a>
    </div>

    <div id="trackRecord">
      ${[
        { title:'Entertainment City Limited — Landmark Divestment',  loc:'Joint Advisory with EY · Noida, UP',      icon:'🏆', type:'Transaction Advisory', value:'₹1,350+ Cr', desc:'Served as Joint Transaction Advisors alongside EY for the 100% divestment of Entertainment City Limited. Managed end-to-end advisory for this landmark transaction — India\'s largest entertainment real estate deal.' },
        { title:'Worlds of Wonder — Post-COVID Re-opening',          loc:'10-Acre Waterpark · Noida, UP',           icon:'🎡', type:'Operational Revival',  value:'Pan-India',  desc:"Orchestrated the strategic re-opening of India's premier waterpark following COVID-19 closure. Managed lease negotiations and operational revival for this 10-acre world-class attraction." },
        { title:'Khubani at Hyatt Andaz Delhi',                      loc:'42,000 Sq. Ft. Dining · New Delhi',       icon:'🍽️', type:'Hospitality Leasing',  value:'42,000 Sq Ft', desc:'Negotiated and executed leasing for a signature 27,000 + 15,000 Sq. Ft. premium restaurant space within the iconic Hyatt Andaz property in New Delhi.' },
        { title:'800 Sq. Yard Asset — Anand Lok, New Delhi',         loc:'₹65 Cr+ Exit · South Delhi',              icon:'🏛️', type:'Asset Acquisition',    value:'₹65 Cr+', desc:'Executed a strategic acquisition of a prime South Delhi property. Delivered an exceptional ₹65+ Crores exit within a 6-month turnaround — demonstrating superior deal structuring and market timing.' },
        { title:'HORECA Supply — Mahindra Holidays & Resorts',        loc:'Pan-India · Multiple Locations',          icon:'🍽️', type:'HORECA Procurement',   value:'Pan-India', desc:"Established strategic HORECA supply partnership with Mahindra Holidays & Resorts, one of India's largest leisure hospitality companies, across their pan-India resort network." },
        { title:'Due Diligence — Adlabs Imagica for ECL',            loc:'₹500 Cr Transaction · Maharashtra',       icon:'⚖️', type:'Client-Side SPOC',     value:'₹500 Cr', desc:'Served as dedicated Client-Side SPOC for comprehensive due diligence in ECL\'s evaluation of Adlabs Imagica. Coordinated financial, legal and technical assessments for this landmark acquisition review.' },
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
        <p class="eyebrow" style="margin-bottom:1rem;">Leadership</p>
        <h2 class="h2" style="margin-bottom:1.5rem;">Steered by<br>Industry Veterans</h2>
        <p class="lead" style="margin-bottom:2.25rem;">Our leadership brings decades of combined experience across hospitality, real estate, retail and entertainment, having led marquee mandates for India's most prominent developers, hotel brands and institutional investors.</p>
        <a href="/about" class="btn btn-dk">Meet the Full Team</a>
        <div style="margin-top:3rem;padding:1.5rem;border:1px solid var(--border);background:rgba(184,150,12,.03);">
          <div style="font-size:.6rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:.75rem;">Board & KMP</div>
          <div style="font-family:'DM Serif Display',Georgia,serif;font-size:1rem;color:var(--ink);line-height:1.5;">Three Directors. One Vision.<br>Building India's Premier Advisory Practice.</div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:1.25rem;">
        ${[
          { name:'Arun K. Manikonda', title:'Managing Director',      sub:'Director on Board & KMP',  init:'AM', photo:'/static/team/arun-manikonda.jpg',  ph:'+91 98108 89134', em:'akm@indiagully.com', li:'https://www.linkedin.com/in/arun-kumar-manikon', bio:'Founding MD with 20+ years across hospitality, real estate and entertainment. Former MD of Entertainment City Limited, Noida. Led ₹1,350 Cr+ joint advisory with EY — India\'s largest entertainment transaction.' },
          { name:'Pavan K. Manikonda', title:'Executive Director',      sub:'Director on Board & KMP',  init:'PM', photo:'/static/team/pavan-manikonda.jpg',  ph:'+91 62825 56067', em:'pavan@indiagully.com', li:'https://www.linkedin.com/in/pavan-kumar-manikonda-49254421/', bio:'Hospitality operations leader with 18+ years across hotel management, HORECA supply and brand on-boarding. Drives business development and operational delivery across India Gully\'s advisory verticals.' },
          { name:'Amit Jhingan',    title:'President, Real Estate',  sub:'Key Managerial Personnel', init:'AJ', photo:'/static/team/amit-jhingan.png',       ph:'+91 98999 93543', em:'amit.jhingan@indiagully.com', li:'https://www.linkedin.com/in/amit-jhingan-11631451/', bio:'Real Estate Vertical Head with 15+ years of pan-India experience. Specialist in retail leasing (1,40,000+ sq ft placed), commercial transactions and hospitality asset advisory across Delhi NCR and beyond.' },
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
          <!-- Contact -->
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
      <a href="/contact"  class="btn btn-g" style="min-width:230px;justify-content:center;padding:.9rem 2.25rem;">Submit a Mandate Enquiry</a>
      <a href="/listings" class="btn btn-ghost-g" style="min-width:200px;justify-content:center;">View Active Mandates</a>
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

`
  return c.html(layout('Home', content, {
    description: "India Gully. Celebrating Desiness. India's premier multi-vertical advisory firm across Real Estate, Retail, Hospitality, Entertainment, Debt & HORECA Solutions. ₹1,165 Cr+ active mandate pipeline.",
    canonical: 'https://india-gully.pages.dev/',
    ogImage: 'https://india-gully.pages.dev/static/og.jpg',
    heroPreload: '/static/mandates/chail/chail-img1.jpg',
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://india-gully.pages.dev/#organization",
          "name": "India Gully",
          "legalName": "Vivacious Entertainment and Hospitality Pvt. Ltd.",
          "url": "https://india-gully.pages.dev",
          "logo": "https://india-gully.pages.dev/assets/logo-white.png",
          "description": "India's premier multi-vertical advisory firm across Real Estate, Retail, Hospitality, Entertainment, Debt & HORECA Solutions.",
          "address": { "@type": "PostalAddress", "addressLocality": "New Delhi", "addressCountry": "IN" },
          "telephone": "+918988988988",
          "email": "info@indiagully.com",
          "sameAs": ["https://indiagully.com"],
          "foundingDate": "2017",
          "knowsAbout": ["Real Estate Advisory","Hospitality Management","Retail Leasing","Entertainment Advisory","HORECA Procurement","Debt & Special Situations"]
        },
        {
          "@type": "WebSite",
          "@id": "https://india-gully.pages.dev/#website",
          "url": "https://india-gully.pages.dev",
          "name": "India Gully",
          "publisher": { "@id": "https://india-gully.pages.dev/#organization" }
        }
      ]
    })
  }))
})

export default app
