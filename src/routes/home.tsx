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
    img: 'https://sspark.genspark.ai/cfimages?u1=ZktQqSJf5dTqAjc%2BBdjN%2B4xc%2FchahjnJjF1MqZbhPO2VZaIV2eQlYCPi3u5LkWAVB2yZU%2FcYQ8UDhwJNQxWeTh4ia5bDEA7B4elZHu6JFrs90MZCdbgBrKubIOSZx9I1QBCttPH9cEMxgJiBDgC5Qx%2FfK5PJ5G%2B27kaz11%2Bh94VPJXE%3D&u2=m1vvXA%2BAJfqSa0Pf&width=2560',
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
    img: 'https://sspark.genspark.ai/cfimages?u1=%2Bz0187I11Q6PyxPekyTyFXXQfmD%2BF668EVnVOia4EyI0cFRP3TEywZsiZ4jmFmKZfmHfdYwx%2Bbc3BJYH%2Bkb93%2BiaCvYAkHns%2FVsxJdpjGLGEcT%2BqtrBtoJmjFZU%2F3Tkuuux5VEo0zr3DTk%2B%2F2ojDBdwTqVu2wLhL00xRIJxxlEXKal7ni9h%2B9q5bbRLUsj%2BN4Ln%2BFYX8TixeAVI3QgqlhDkI97QpoMOB1k4tYzkW7f%2FADVn2LMEbqzd%2Bbkov10bjDrHV79n0JftTfgmtx5DErOHuRUsb8Aw4xxi7SFfqOabe5WYYBJr2IgUPnOkKhHPLyfaXxLx%2BuhWxf9kLyp59eIzuCeRO%2FYk%3D&u2=C9lLIi%2FDpHcv3ST3&width=2560',
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
    img: 'https://sspark.genspark.ai/cfimages?u1=T%2FXR1ywDCHXzuOG4oTZbKUQqIL4oEMkQ7dS7YCYI%2FBDnz57AQ4jPF18oW6dEhKCpBdyccFnMyojAjaBvQODwABzazxb5D3Mzx2qZLF3OnmaxdXtRo2vn2QVNK0kfmvmKRnXmv34lvsl7gA3dGVUzcxqfRth4R0GD0p%2BhR5cSLhU1N8SLwbW3V1M2&u2=V8D5sgTkvjI3BK6Y&width=2560',
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
    img: 'https://sspark.genspark.ai/cfimages?u1=aLf4SClMkiiLVFca%2Fwo8AzjbKl7LJoHmbr%2FtfsEwy4X5OWciJBaYx5oVwD2EaAI8HggvuTvRnPQ0yjgyXqK2wVY5lUqvmli5aLFvgcKopmEp8OG964p9WgrYpPlEKO8EQifzT6moeDNjruN3NTJBznBNefvnm9O0l%2BHqaUmRMjBfsg3MaA1ZbxJ1&u2=%2FktRtb6I%2BlMTDYAI&width=2560',
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
    img: 'https://sspark.genspark.ai/cfimages?u1=sfl3s3dWUNvQWuHFHWq%2Bguu9oEEOMTbbzylJr2vZTEJVyw0SgbckABFLXKDCjYLBGSXB3Gf8AbvHH6JYZlNiB3BHERH8S3wSYdQ2zjUteZN%2BPdpd%2BD7b%2FKIbgtMUqiJGfVjtrUi0c933RL4%2FlY%2BD4kf%2Bz9O2M7A%3D&u2=T8pWCzmyoGPlEBXO&width=2560',
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
    img: 'https://sspark.genspark.ai/cfimages?u1=cbpOV8dZBBbfRgUonfsVjfKmSPk5O3UhiRBgrsaA2kuOj7pC7ZsA1RnVF6c6xvsLlEnyLzjf7qdbM5OkRB6auNZSyjtAYznngx9WxNpLPTg1EhG9gDPSvSEBm60LbpJBkZQ%3D&u2=qc5jDRC%2B7dYAurj3&width=2560',
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
          <svg id="igIndiaMap" viewBox="0 0 400 510" width="100%" style="display:block;max-width:440px;margin:0 auto;" aria-label="India map showing active mandate locations">
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
              <path class="india-state" d="M322,463L321,464L322,464L322,464L322,464L322,465L322,465L322,465L322,466L322,466L322,466L322,467L323,467L323,467L323,467L322,467L322,467L323,468L323,468L322,468L322,468L322,468L322,468L322,469L322,469L322,469L322,470L322,470L322,470L322,470L322,470L322,470L322,471L321,471L321,471L321,471L321,470L321,470L321,470L321,470L321,469L321,469L321,469L321,469L321,469L321,469L320,469L320,468L320,468L320,468L320,468L320,467L320,467L320,467L320,467L320,467L319,467L319,467L319,466L319,466L319,466L319,465L319,465L319,465L319,465L319,465L319,464L320,464L320,464L320,464L320,464L320,464L321,464L321,464L321,464L321,464L321,464L321,464L321,463L321,463Z"/>
              <path class="india-state" d="M308,385L308,385L308,386L308,385L308,386L308,387L308,387L308,387L309,388L309,388L308,388L308,388L309,388L308,388L308,389L308,388L308,389L308,389L308,390L308,391L308,391L308,391L308,391L308,390L308,389L309,389L309,390L309,391L309,391L309,392L309,393L308,393L308,393L308,393L308,393L308,394L307,394L308,394L308,394L308,394L308,393L308,393L308,394L308,395L308,395L308,396L308,397L308,396L307,396L307,395L307,395L307,395L307,394L307,394L307,394L307,394L307,393L306,393L306,393L306,392L306,391L306,391L306,391L306,390L306,390L306,389L306,390L307,390L307,390L307,390L307,389L307,388L307,388L307,387L307,386L307,386L307,385L307,385L307,385L308,385Z"/>
              <path class="india-state" d="M310,374L310,374L310,374L311,375L311,375L311,376L311,376L311,377L311,377L311,377L311,378L311,379L311,379L311,380L311,381L311,381L311,381L311,381L310,381L310,382L310,382L310,381L310,381L309,381L310,381L310,382L310,382L310,382L309,381L309,381L309,381L309,382L310,382L310,382L310,383L310,383L310,383L310,383L310,384L309,383L309,383L309,383L308,384L308,383L308,383L308,382L308,382L308,381L308,381L308,380L308,380L308,379L308,379L308,379L308,378L308,378L308,378L309,378L309,378L309,378L309,378L309,377L309,378L308,378L308,377L308,377L308,376L308,376L308,375L308,375L308,375L309,375L309,376L309,375L309,375L309,374L309,374L310,375L310,374L310,374Z"/>
              <path class="india-state" d="M312,364L312,364L312,365L312,365L312,366L312,366L312,366L312,367L312,367L312,367L312,367L312,367L312,367L312,367L311,367L311,367L311,367L311,367L311,368L312,368L312,368L312,368L312,368L312,369L312,370L312,371L312,371L312,372L311,372L311,372L311,372L311,372L311,372L311,371L310,372L310,372L310,372L310,372L310,373L311,373L310,373L310,373L310,373L310,373L310,374L310,374L310,374L310,374L309,374L309,374L309,373L309,373L309,373L309,372L309,372L309,371L309,371L309,371L309,371L310,370L309,370L309,370L309,369L310,369L310,368L309,368L309,368L309,367L310,367L310,366L310,366L310,366L310,365L310,365L311,364L311,364L311,364L311,364L311,364L312,364Z"/>
              <path class="india-state" d="M184,314L184,316L184,317L182,318L180,319L178,320L176,320L173,320L173,320L172,321L171,323L170,326L169,327L169,329L167,330L166,329L166,327L163,328L161,329L160,330L159,333L159,335L158,336L157,338L158,342L158,345L158,346L159,348L158,354L158,357L159,357L160,360L160,363L160,366L160,363L159,362L158,363L158,362L158,362L158,364L160,365L159,365L138,379L127,362L120,353L126,316L131,279L159,283L185,288L196,279L212,277L213,278L212,279L211,281L210,282L209,284L208,285L207,286L206,287L206,289L204,290L202,291L201,292L199,294L198,295L197,297L196,298L196,299L195,300L193,301L191,303L190,304L188,305L187,306L186,307L185,308L184,309L184,312L185,311L185,312Z"/>
              <path class="india-state" d="M349,115L352,116L349,119L350,121L353,120L354,123L353,126L351,128L352,131L356,130L359,131L362,132L363,134L364,136L363,137L360,140L358,142L358,144L360,148L361,150L358,149L357,147L354,146L352,147L349,148L346,152L344,154L342,155L340,157L338,156L338,154L338,152L339,151L341,150L342,148L345,147L347,146L347,145L345,145L345,143L344,141L346,138L342,138L333,141L331,142L328,143L327,142L326,144L323,147L321,150L321,151L320,152L311,153L307,152L303,153L300,151L300,148L300,146L297,145L295,144L295,140L295,139L298,140L302,139L305,139L307,135L310,133L312,131L314,129L317,126L320,125L323,124L326,119L329,117L332,116L335,118L337,119L340,120L342,117L345,115Z"/>
              <path class="india-state" d="M347,137L344,141L346,144L347,145L346,148L341,148L339,151L335,153L332,156L330,157L328,159L326,160L324,164L323,168L321,170L320,170L318,172L316,174L316,176L316,180L314,183L314,184L314,186L313,187L312,190L311,193L309,193L308,194L307,195L305,197L303,194L302,189L303,186L303,185L305,186L305,184L305,183L307,181L309,178L307,177L307,175L304,172L301,173L302,169L303,167L300,167L296,168L294,168L293,170L290,171L288,170L285,169L283,169L280,168L276,169L275,172L274,174L274,172L274,170L274,169L274,168L273,168L273,167L273,166L272,165L272,163L274,162L274,159L276,156L281,154L287,155L294,155L301,154L308,152L318,153L321,151L323,147L326,143L329,143L332,141Z"/>
              <path class="india-state" d="M206,144L207,145L208,146L212,147L212,150L212,151L213,152L214,152L215,153L216,154L217,154L217,154L219,156L222,155L224,154L225,158L227,158L228,157L231,158L232,158L235,160L237,161L238,161L239,160L243,161L245,161L249,161L249,160L252,162L252,162L253,160L254,159L255,162L253,164L252,166L250,169L251,171L252,173L253,176L251,175L249,178L248,179L246,180L243,182L242,186L241,188L240,190L238,191L236,190L233,193L231,190L228,187L224,188L222,191L218,192L215,193L211,193L208,193L206,191L204,190L199,189L197,186L196,183L197,180L199,178L201,177L203,175L208,173L212,172L208,169L204,164L206,162L203,160L206,158L208,156L206,154L205,151L204,148L203,146L205,145Z"/>
              <path class="india-state" d="M196,198L199,201L202,205L204,207L205,212L206,216L209,216L207,219L204,223L203,225L199,229L199,233L197,236L196,239L195,242L193,245L190,244L187,248L184,249L185,254L185,258L188,263L188,266L186,264L183,263L180,261L181,266L181,270L182,274L183,277L182,282L179,284L177,288L175,292L173,296L169,296L167,292L166,291L165,287L163,284L160,282L160,278L162,273L166,273L167,270L163,265L162,264L163,260L163,258L164,254L163,251L162,246L162,245L163,243L164,243L165,241L165,238L165,236L165,235L167,234L167,232L167,229L169,228L171,223L174,223L176,222L178,219L180,214L182,213L182,209L180,209L178,206L175,206L176,202L177,202L181,202L184,202L187,202L189,201L194,201Z"/>
              <path class="india-state" d="M124,123L123,123L123,124L124,124L124,124L124,124L124,124L124,125L124,125L124,125L124,125L125,125L125,125L125,125L125,126L125,126L125,126L125,126L125,127L125,127L125,127L124,127L125,128L125,128L125,128L125,128L125,129L125,129L124,128L124,129L124,129L124,129L124,129L124,130L124,130L123,130L123,130L122,129L122,129L122,129L122,128L122,128L122,128L121,128L121,128L121,128L121,128L121,128L120,128L120,128L120,128L120,128L119,128L119,127L119,127L120,126L120,126L120,126L120,126L120,126L120,125L120,125L120,125L120,124L120,124L120,124L120,123L120,123L121,123L121,123L121,123L122,123L122,122L122,123L122,123L123,123L123,123L123,123L123,123L123,123Z"/>
              <path class="india-state" d="M84,329L87,330L89,335L89,340L87,343L86,343L86,343L86,342L86,342L86,342L86,342L86,341L86,341L86,341L86,341L86,341L85,341L85,341L85,341L85,341L85,340L85,340L85,340L84,340L84,340L84,340L84,339L84,339L84,339L85,339L85,338L84,338L84,337L84,337L84,337L84,336L84,336L84,336L84,335L84,335L83,335L83,335L83,335L83,335L83,335L83,335L83,335L83,335L83,335L84,335L84,335L84,335L84,334L84,334L84,334L83,334L83,334L83,334L83,334L83,334L83,334L83,334L83,333L83,333L82,333L82,333L82,332L82,332L82,332L82,332L82,332L82,331L82,331L82,331L82,331L82,331L82,331L82,330L82,330L81,330Z"/>
              <path class="india-state" d="M63,189L87,229L82,245L71,257L72,251L71,248L70,245L69,243L69,241L69,239L69,239L70,237L68,236L68,233L68,228L72,227L70,227L68,227L66,226L66,227L66,228L65,229L65,230L64,230L63,232L64,234L65,237L63,241L63,243L61,244L59,246L57,247L54,249L51,250L48,251L44,249L41,248L39,246L38,243L36,241L35,239L35,237L33,237L34,237L32,236L30,233L28,231L27,229L25,226L26,224L28,225L30,226L32,224L33,226L34,223L36,223L37,222L40,221L41,220L42,217L43,214L41,216L39,216L39,216L35,217L33,219L31,218L27,217L25,215L22,213L21,212L22,211L22,210L21,209L20,208L20,205L22,203L22,202L20,202L21,201Z"/>
              <path class="india-state" d="M119,91L121,92L122,93L122,96L124,97L126,98L128,99L126,102L125,104L123,106L122,109L122,112L122,115L123,119L123,122L121,123L120,126L121,128L123,130L125,128L127,131L127,133L127,136L127,137L125,139L124,139L123,140L121,140L121,140L120,141L120,139L120,135L119,133L117,135L116,137L115,135L115,134L113,134L113,136L111,136L111,138L110,139L109,137L109,135L109,134L109,131L106,129L103,125L103,120L102,117L99,117L96,115L92,115L92,112L91,109L93,106L96,105L98,106L99,107L99,110L101,110L102,108L106,108L109,109L112,107L111,105L111,104L112,103L112,103L112,103L112,103L114,102L116,103L116,104L116,101L117,100L118,98L120,98L120,96L119,94Z"/>
              <path class="india-state" d="M119,54L119,55L120,57L122,58L123,59L125,60L126,60L128,58L130,58L131,60L132,62L133,64L135,63L137,62L138,65L138,66L138,66L139,68L138,69L140,70L140,71L141,72L141,73L142,73L142,75L141,76L141,77L142,78L143,79L142,80L141,81L142,82L143,83L143,84L143,85L145,87L143,87L141,86L139,86L137,85L135,86L134,86L132,87L131,89L131,90L130,90L130,91L130,92L129,93L130,94L130,95L131,96L129,98L128,99L126,98L125,98L123,97L123,95L122,93L121,93L120,92L118,90L116,88L116,85L115,85L114,82L112,84L111,82L109,79L108,77L108,74L105,72L105,69L108,66L108,62L107,59L110,58L113,56L115,54L117,55Z"/>
              <path class="india-state" d="M132,19L134,18L133,20L134,24L135,28L138,32L140,33L143,35L144,39L142,41L142,45L142,49L145,52L147,54L149,56L149,59L151,62L150,64L147,65L146,67L144,67L142,65L141,63L139,64L138,65L137,64L136,62L134,63L133,64L132,62L132,61L130,60L130,58L128,58L127,59L125,60L124,60L123,59L122,58L120,57L119,56L119,54L118,54L117,55L116,54L113,55L112,57L109,59L107,59L108,61L107,65L105,67L103,68L101,68L99,67L97,66L95,66L93,65L94,61L91,61L90,59L88,57L85,53L87,51L85,47L88,43L86,41L84,36L85,31L88,30L92,30L95,31L100,32L104,33L109,32L112,31L116,30L119,27L121,26L127,21Z"/>
              <path class="india-state" d="M247,179L249,182L251,186L250,187L251,189L251,190L249,190L250,192L250,193L249,195L248,196L247,197L246,198L246,199L245,199L243,199L243,200L243,202L241,203L239,202L237,204L233,206L232,208L230,208L228,207L227,209L227,213L230,214L232,215L235,215L233,218L236,222L237,223L238,227L237,227L235,226L232,225L228,223L228,225L228,228L226,231L225,229L222,229L219,230L216,229L217,224L215,224L210,225L206,223L206,221L209,217L207,215L205,213L204,209L202,206L200,202L197,198L197,194L199,191L205,190L206,191L208,193L210,194L214,191L217,192L219,192L222,191L224,189L227,187L230,188L232,190L234,193L236,190L238,190L239,189L241,189L241,187L242,185L243,182L245,180Z"/>
              <path class="india-state" d="M125,287L127,297L126,306L125,318L121,328L119,340L122,353L126,359L121,359L126,362L134,360L140,368L134,376L129,378L127,389L119,395L107,387L101,381L97,376L95,376L95,375L95,374L95,374L95,372L95,372L95,371L94,370L94,369L94,368L94,367L94,368L94,368L94,367L93,365L93,363L93,362L93,360L93,359L92,359L92,358L92,358L91,357L91,356L91,356L91,355L91,354L90,353L90,352L90,351L90,350L90,349L90,349L90,349L90,348L90,348L89,348L89,348L89,349L89,348L89,347L89,347L89,346L88,346L88,345L88,345L87,345L87,345L87,345L87,345L86,344L87,344L87,344L87,342L88,330L90,324L89,318L93,315L105,310L111,304L118,297Z"/>
              <path class="india-state" d="M97,376L113,392L124,416L123,444L121,446L120,444L119,443L119,442L118,440L117,439L116,438L115,437L115,434L115,433L114,432L115,433L114,432L113,430L113,427L112,423L112,421L112,421L112,422L113,422L113,424L113,422L113,424L114,426L114,427L114,427L114,425L114,424L114,423L113,421L113,421L112,420L112,420L112,419L112,419L112,418L112,418L112,418L112,419L112,420L111,417L111,417L111,415L110,413L110,411L109,411L109,410L108,408L108,405L107,403L107,402L107,401L106,400L106,398L105,396L104,395L104,393L103,392L103,392L103,392L102,391L101,390L102,390L101,389L100,388L101,388L101,388L99,388L100,387L99,386L99,386L98,384L98,383L97,381L97,379L96,378Z"/>
              <path class="india-state" d="M137,154L145,159L146,163L144,168L141,174L137,180L136,190L140,195L144,192L140,184L141,177L143,176L143,178L144,180L148,181L149,178L150,181L155,180L161,179L161,183L164,182L167,181L169,184L172,181L174,181L177,183L183,187L188,188L190,200L183,202L176,202L180,207L182,213L176,221L170,225L167,232L165,236L165,241L162,241L160,237L155,238L146,237L139,239L131,240L127,238L122,235L112,245L106,240L98,238L96,237L95,237L93,237L92,236L91,235L91,231L89,232L88,232L87,229L88,225L86,222L91,216L93,211L96,202L95,192L95,188L95,184L100,183L100,186L107,189L107,196L104,199L106,201L111,195L117,195L119,191L120,186L126,181L120,179L118,169L128,160Z"/>
              <path class="india-state" d="M90,230L94,237L110,241L132,240L159,237L163,248L160,279L135,273L118,296L98,311L90,328L81,329L81,328L80,326L79,325L79,322L78,321L78,320L78,319L77,318L77,317L78,317L78,317L77,316L77,315L77,313L77,312L77,311L76,309L77,309L77,308L76,307L76,305L76,305L75,303L75,302L75,300L75,298L74,297L74,296L74,295L74,294L74,293L73,293L73,291L73,289L74,290L74,291L74,290L74,289L74,290L73,289L72,287L72,285L72,284L72,281L73,281L72,280L73,279L74,278L73,278L72,278L71,280L71,279L71,277L71,275L71,275L71,274L71,275L71,272L71,270L70,269L70,267L70,266L70,264L70,263L70,261L79,252L88,239L86,238Z"/>
              <path class="india-state" d="M330,173L330,174L330,176L331,176L331,177L330,179L331,181L332,181L332,183L332,184L332,185L331,186L331,188L330,188L330,189L329,191L328,193L328,194L327,195L326,197L326,198L326,200L325,202L324,201L323,200L322,200L321,200L320,199L319,199L319,200L318,200L317,200L316,198L316,198L315,198L314,198L313,198L313,199L312,198L311,197L312,196L312,194L312,193L312,191L313,190L312,189L313,189L313,188L313,187L313,187L314,187L314,186L314,186L314,185L314,185L314,184L314,184L314,184L314,184L315,183L315,182L316,181L316,180L317,179L317,180L318,180L319,180L320,178L321,177L321,176L321,175L322,175L323,174L324,175L325,175L326,176L327,176L328,174L329,174L330,173Z"/>
              <path class="india-state" d="M298,166L299,167L301,167L302,167L302,168L302,169L302,170L301,172L302,172L304,172L305,173L306,174L307,174L307,176L307,177L308,178L309,179L308,181L306,181L305,182L305,183L304,183L303,182L302,182L302,182L301,181L300,181L299,181L298,181L297,181L296,181L296,182L295,181L295,181L294,181L293,181L292,181L292,181L291,180L290,180L288,181L287,181L286,181L285,181L285,181L284,181L284,181L283,181L283,181L282,181L281,181L280,181L279,180L277,180L276,179L275,179L274,179L274,178L274,177L274,176L276,174L274,172L275,171L276,169L277,168L280,168L282,168L283,169L285,168L285,169L287,169L288,170L288,171L290,171L292,170L293,170L293,170L294,168L295,168L296,169Z"/>
              <path class="india-state" d="M309,193L310,193L311,193L312,194L311,197L313,198L314,198L315,198L316,200L316,203L317,205L316,208L316,210L316,213L315,215L314,214L313,215L313,217L313,219L313,221L313,223L314,225L314,227L313,228L312,228L312,230L311,230L310,231L309,229L308,229L307,231L307,231L307,230L306,229L307,228L306,226L306,224L306,223L306,222L306,221L306,219L305,219L305,218L305,217L305,217L305,217L304,216L304,216L304,215L304,214L304,213L304,212L304,211L304,211L304,211L304,210L304,209L304,209L304,208L304,208L303,207L303,207L303,206L303,205L303,204L303,202L303,201L303,201L303,200L303,199L303,198L303,197L303,196L305,196L305,197L306,197L306,195L307,194L307,194L308,193Z"/>
              <path class="india-state" d="M338,153L338,154L338,155L338,156L338,157L337,158L337,159L336,160L336,161L337,162L337,163L337,165L337,166L337,167L337,168L336,169L335,170L336,171L335,172L334,173L334,174L333,175L332,176L331,176L330,175L330,174L330,173L330,173L329,174L327,176L326,176L325,175L324,174L323,175L321,175L321,175L321,177L320,178L319,180L318,180L317,179L317,178L316,176L316,175L316,175L316,174L317,174L317,173L318,173L318,172L319,171L319,171L320,169L321,168L321,169L321,170L321,170L323,169L323,167L323,166L323,165L324,164L325,163L325,162L325,161L327,159L327,160L328,160L328,159L329,158L329,157L330,157L330,156L332,156L332,156L333,155L334,153L335,153L336,153L338,152Z"/>
              <path class="india-state" d="M229,222L241,233L245,237L245,238L244,238L242,238L241,239L241,239L240,240L239,242L238,243L238,244L238,245L239,247L240,249L239,250L238,251L237,252L238,252L238,252L239,251L240,251L240,252L239,253L238,254L237,255L237,256L237,257L237,257L237,258L236,258L235,259L234,259L234,260L234,261L234,260L235,259L234,261L233,262L233,263L232,262L231,261L231,262L232,263L232,263L231,264L229,265L228,265L226,265L224,266L223,267L222,268L220,269L219,270L217,272L216,273L216,273L215,274L215,274L214,275L214,275L214,276L213,276L213,276L213,276L213,277L207,281L200,276L197,279L193,287L187,287L181,293L179,286L181,270L188,264L185,251L196,241L202,226L217,223L225,230Z"/>
              <path class="india-state" d="M107,66L105,69L105,73L108,75L109,77L110,80L111,84L113,83L114,85L116,85L116,87L118,90L119,93L117,93L119,94L120,95L120,97L119,99L117,99L116,100L116,101L116,103L116,103L114,102L113,103L112,102L111,103L112,103L112,103L111,104L111,105L112,107L110,108L108,109L105,109L102,108L101,111L99,110L99,108L98,108L97,106L95,105L92,106L84,105L85,102L84,100L84,99L84,98L86,97L86,95L87,95L88,93L89,92L90,91L91,89L92,88L93,87L93,87L92,87L92,88L91,87L91,86L92,84L93,81L92,81L92,79L92,76L92,75L93,75L94,74L95,73L96,73L97,73L98,72L99,72L100,72L101,70L101,69L103,68L106,67Z"/>
              <path class="india-state" d="M84,105L92,109L94,115L101,116L103,123L108,130L109,135L109,138L111,137L113,135L114,135L117,135L120,134L120,141L122,140L123,140L125,142L127,146L128,149L128,152L129,153L127,155L131,154L134,154L135,154L132,158L126,162L120,166L115,172L118,179L123,178L126,180L121,183L120,186L122,190L119,191L120,196L117,195L113,195L111,197L108,201L106,202L103,201L105,199L106,197L106,192L107,190L100,188L100,186L100,184L99,183L97,186L95,186L97,189L95,188L94,191L94,195L97,200L95,206L92,211L92,213L87,212L82,208L79,204L77,198L75,195L73,193L67,193L65,190L61,189L56,189L50,186L46,173L39,168L32,156L45,137L55,138L64,128L73,119L77,108Z"/>
              <path class="india-state" d="M260,135L260,135L261,135L261,136L261,136L262,136L262,137L262,138L262,138L262,139L262,139L262,140L262,141L262,141L262,142L262,142L261,143L261,143L261,144L261,144L261,144L261,145L261,145L262,146L262,146L262,146L262,146L263,147L263,147L263,147L263,148L262,148L262,148L261,149L261,149L261,149L260,149L259,149L258,149L258,150L257,151L256,150L255,150L254,150L253,150L253,149L252,148L252,148L253,147L253,146L253,146L253,145L253,145L253,144L253,144L253,143L254,142L254,141L254,140L254,139L254,139L254,138L253,138L253,138L253,137L254,137L254,137L255,137L255,137L255,137L256,137L256,136L257,137L257,136L258,136L258,136L258,135L259,135L259,134L259,134Z"/>
              <path class="india-state" d="M158,364L161,367L161,368L160,369L160,370L160,371L160,373L160,376L159,378L159,379L159,381L158,382L157,383L157,383L157,383L157,384L156,385L156,385L156,387L155,388L154,392L154,394L154,397L155,398L154,400L154,404L155,413L154,415L154,415L152,415L152,415L153,415L152,415L152,414L151,415L150,415L150,415L149,415L148,417L147,418L148,420L147,421L146,422L145,423L145,425L144,427L144,429L145,430L145,431L146,431L143,432L142,432L141,433L139,434L138,434L137,435L136,435L135,436L135,439L135,439L135,440L135,440L134,441L134,442L134,442L134,444L134,445L133,446L132,447L130,448L129,449L128,450L126,450L124,449L123,448L122,447L125,427L118,403L130,387L139,378Z"/>
              <path class="india-state" d="M302,191L302,192L303,195L303,196L303,198L303,199L303,200L303,201L303,202L302,204L302,205L302,204L301,204L301,205L300,204L299,204L299,206L299,207L299,207L299,208L299,208L298,209L297,210L297,211L297,212L297,212L297,213L297,213L297,214L297,214L297,214L296,215L296,215L295,216L295,216L295,215L294,215L294,215L294,214L294,213L294,213L294,212L293,212L293,211L293,211L292,211L292,213L293,214L292,213L292,211L291,210L291,209L291,208L290,207L290,206L290,206L290,205L290,204L290,203L290,202L290,201L291,200L291,200L292,200L292,198L293,198L294,198L295,198L295,197L296,196L296,197L297,196L298,196L298,197L299,194L299,194L300,193L301,193L302,193L301,192Z"/>
              <path class="india-state" d="M128,98L130,100L131,103L129,107L133,110L134,110L143,115L144,118L147,120L151,123L154,123L157,124L162,126L165,127L169,130L174,134L184,140L189,142L189,144L196,147L198,145L204,151L206,154L206,158L205,161L205,165L212,171L206,172L201,177L198,179L196,184L199,189L197,196L190,200L190,190L183,188L179,185L176,183L174,181L172,182L171,185L167,184L166,181L164,182L163,183L160,184L159,177L155,181L151,182L150,179L149,180L147,182L143,181L142,179L144,175L142,177L140,178L141,184L144,191L142,196L138,195L135,186L137,180L140,175L143,170L144,165L146,163L145,159L140,156L134,153L131,153L126,154L128,151L128,148L125,142L127,137L127,131L123,124L123,114L124,105Z"/>
              <path class="india-state" d="M147,83L148,85L148,86L149,87L151,88L151,89L152,90L153,89L155,90L156,91L157,92L159,92L159,93L159,94L159,96L160,96L161,96L163,97L164,97L165,98L167,100L168,101L167,103L166,104L164,105L163,107L162,108L161,109L162,110L161,112L160,113L160,113L160,115L160,117L160,118L158,120L157,124L155,124L154,124L154,122L152,123L151,123L149,122L148,121L146,118L145,119L144,118L142,116L142,115L143,114L140,112L135,109L133,112L132,111L132,110L131,110L130,108L130,106L130,104L131,103L132,101L131,100L129,99L129,99L128,98L130,97L130,95L130,94L129,92L130,91L130,89L131,88L133,87L135,85L138,85L141,86L144,87L144,85L145,82L146,82Z"/>
              <path class="india-state" d="M253,150L267,155L273,163L271,165L270,168L265,163L263,161L262,163L259,160L256,160L257,163L254,167L255,171L260,176L263,180L257,183L254,186L261,196L260,205L262,212L263,220L262,220L262,219L262,220L263,221L262,222L262,224L261,223L261,223L260,222L261,223L262,225L262,226L261,227L260,227L260,226L260,228L259,229L259,229L259,230L259,231L259,232L258,231L258,233L258,231L258,231L257,232L257,231L257,233L256,231L257,234L256,232L256,233L255,233L255,234L255,235L254,233L254,231L254,228L253,226L252,227L251,225L251,225L251,227L253,228L254,230L252,230L253,231L252,233L250,235L249,236L248,236L245,235L237,223L227,209L242,202L247,197L251,188L252,174L255,160Z"/>
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
    heroPreload: 'https://www.mapleresorts.in/img/about/new-left1.jpg',
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
