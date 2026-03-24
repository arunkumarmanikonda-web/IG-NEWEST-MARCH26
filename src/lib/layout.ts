// India Gully — Master Layout
// Minimalistic · Clean · Institutional · DM Sans + DM Serif Display

export function layout(title: string, content: string, opts?: {
  description?: string
  ogImage?: string
  bodyClass?: string
  noNav?: boolean
  noFooter?: boolean
  cspNonce?: string       // kept for API compatibility; CSP now uses unsafe-inline + CDN allowlist
  jsonLd?: string | object  // optional JSON-LD structured data blob (string or object)
  canonical?: string      // optional canonical URL override
  heroPreload?: string    // optional above-fold image URL to preload with high priority
}) {
  const desc = opts?.description || "India Gully — Celebrating Desiness. India's premier multi-vertical advisory firm across Real Estate, Retail, Hospitality, Entertainment, Debt & HORECA Solutions."
  const ogImg = opts?.ogImage || 'https://indiagully.com/static/og.jpg'

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<!-- CSP set via response header (unsafe-inline + CDN allowlist — strict-dynamic removed) -->
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
<meta name="description" content="${desc}">
<meta name="author" content="India Gully — Vivacious Entertainment and Hospitality Pvt. Ltd.">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<meta property="og:title" content="${title} — India Gully">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${ogImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="India Gully — Celebrating Desiness">
<meta property="og:type" content="website">
<meta property="og:site_name" content="India Gully">
<meta property="og:locale" content="en_IN">
${opts?.canonical ? `<meta property="og:url" content="${opts.canonical}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@IndiaGully">
<meta name="twitter:creator" content="@IndiaGully">
<meta name="twitter:title" content="${title} — India Gully">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${ogImg}">
<title>${title} — India Gully</title>
${opts?.canonical ? `<link rel="canonical" href="${opts.canonical}">` : ''}
<!-- FAVICON: hologram asset — locked, no AI, no optimisation, lossless only -->
${opts?.jsonLd ? `<script type="application/ld+json">${typeof opts.jsonLd === 'string' ? opts.jsonLd : JSON.stringify(opts.jsonLd)}</script>` : ''}
<link rel="icon" type="image/x-icon" href="/assets/favicon.ico">
<link rel="icon" type="image/png" sizes="64x64" href="/assets/favicon-64.png">
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="preconnect" href="https://www.mapleresorts.in">
<link rel="dns-prefetch" href="https://hotelrajshreechandigarh.com">
<link rel="dns-prefetch" href="https://www.welcomheritagehotels.in">
${opts?.heroPreload ? `<link rel="preload" as="image" href="${opts.heroPreload}" fetchpriority="high">` : ''}
<!-- Non-blocking Google Fonts — media=print swap trick avoids render-blocking -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet"></noscript>
<!-- Non-blocking FontAwesome — defer icon font until after first paint -->
<link rel="preload" as="style" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"></noscript>
<!-- Tailwind CDN \u2014 defer so it does not block first paint; config script waits for load event -->
<script>
/* Tailwind config declared before CDN loads — tw CDN reads this on init */
window.tailwind = window.tailwind || {};
tailwind.config = {
  theme: {
    extend: {
      colors: {
        gold:{ DEFAULT:'#B8960C', light:'#D4AE2A', dark:'#8A6E08', pale:'#FAF6E8', muted:'#F0E8C8' },
        ink: { DEFAULT:'#111111', mid:'#1E1E1E', soft:'#444444', muted:'#6B6B6B', faint:'#A0A0A0' },
        parchment:{ DEFAULT:'#FAF8F3', dark:'#F2EDE3', border:'#E4DECE' }
      },
      fontFamily: {
        sans:  ['"DM Sans"','system-ui','sans-serif'],
        serif: ['"DM Serif Display"','Georgia','serif'],
      }
    }
  }
}
</script>
<!-- Load Tailwind CDN async — runs after config object is set above -->
<script src="https://cdn.tailwindcss.com" defer></script>
<!-- JS capability flag: lets CSS keep content visible if later scripts fail -->
<script>document.documentElement.classList.add('js');</script>
<!-- DARK MODE: early init — defaults to LIGHT; only switches to dark if user explicitly enabled it -->
<script>
(function(){
  try{
    var s=localStorage.getItem('ig_dark_mode');
    // Default is LIGHT — only switch to dark if user explicitly set it to '1'
    if(s==='1') document.documentElement.setAttribute('data-theme','dark');
    else document.documentElement.setAttribute('data-theme','light');
  }catch(e){ document.documentElement.setAttribute('data-theme','light'); }
})();
</script>
<style>
/* ══════════════════════════════════════════════════════════════════════════
   INDIA GULLY — WORLD-CLASS DESIGN SYSTEM v12
   Ultra-Premium · Cinematic · Editorial · Institutional
   Typography: DM Serif Display (display/headlines) + DM Sans (body/UI)
   Color: Deep Obsidian · Warm 24K Gold · Ivory Parchment
   Inspired by: WSJ, Financial Times, Architectural Digest, Condé Nast
══════════════════════════════════════════════════════════════════════════ */

/* ── DARK MODE VARIABLES ───────────────────────────────────────────────── */
/* Use html[data-theme="dark"] (specificity 0-1-1) to beat :root (0-1-0) so
   dark-mode custom properties actually override the light-mode :root values */
html[data-theme="dark"]{
  --gold:#D4AE2A;--gold-pale:rgba(212,174,42,.08);
  --ink:#f1f5f9;--ink-muted:#94a3b8;--ink-soft:#cbd5e1;--ink-faint:#475569;
  --parch:#0a0a0f;--parch-dk:#111118;--border:rgba(255,255,255,.07);--border-lt:rgba(255,255,255,.07);
  --surface:#141420;--surface-2:#1a1a28;
  --bg:#07070f;--bg-2:#0d0d1c;--bg-3:#111120;
  --bg-dk:#07070f;--bg-dk2:#0d0d1c;--bg-dk3:#111120;
}
[data-theme="dark"] body{background:#0a0a0f;color:#f1f5f9;}
[data-theme="dark"] .sec-wh,[data-theme="dark"] .card{background:#141420!important;}
[data-theme="dark"] .mandate-card [style*="background:#fff"],[data-theme="dark"] .insight-card [style*="background:#fff"]{background:#141420!important;color:#f1f5f9!important;}
[data-theme="dark"] [style*="background:#fff"]:not(.hero-dk *):not(nav *):not(footer *){background:#141420!important;}
[data-theme="dark"] .sec-pc,[data-theme="dark"] .sec-pd{background:#0e0e1a!important;}
/* sec-dk must stay dark in dark-mode (--ink flips to light) */
[data-theme="dark"] .sec-dk{background:#0a0a0f!important;}
[data-theme="dark"] .sec-dk .diff-grid{background:rgba(255,255,255,.08)!important;border-color:rgba(255,255,255,.1)!important;}
[data-theme="dark"] .diff-cell{background:rgba(255,255,255,.07)!important;}
[data-theme="dark"] .diff-cell:hover{background:rgba(255,255,255,.12)!important;}
[data-theme="dark"] .am,[data-theme="dark"] .ig-tbl thead tr{background:#1a1a28!important;}
[data-theme="dark"] table.ig-tbl tbody tr{background:#141420;}
[data-theme="dark"] table.ig-tbl tbody tr:hover{background:#1a1a28;}
[data-theme="dark"] .ig-input,.ig-inp{background:#1a1a28;color:#f1f5f9;border-color:rgba(255,255,255,.1);}
[data-theme="dark"] .ig-panel{background:#1a1a28;border-color:rgba(255,255,255,.07);}
[data-theme="dark"] .why-card,[data-theme="dark"] .vg-cell{background:#22223a!important;border-color:rgba(255,255,255,.13)!important;}
[data-theme="dark"] .mandate-card,[data-theme="dark"] .insight-card{background:#141420!important;border-color:rgba(255,255,255,.06)!important;}
[data-theme="dark"] .home-stat-cell,[data-theme="dark"] .ig-metric-box{background:#141420!important;border-color:rgba(255,255,255,.06)!important;}
[data-theme="dark"] .feature-card{background:#141420!important;border-color:rgba(255,255,255,.06)!important;}
[data-theme="dark"] .service-item{background:#141420!important;}
[data-theme="dark"] .ticker{background:rgba(184,150,12,.85)!important;}
/* Dark mode: leader-card & partner-card backgrounds */
[data-theme="dark"] .leader-card,[data-theme="dark"] .partner-card{background:#141420!important;border-color:rgba(255,255,255,.06)!important;}
[data-theme="dark"] .leader-card [style*="background:var(--parch)"],[data-theme="dark"] .partner-card [style*="background:var(--parch)"]{background:#1a1a28!important;}
/* Dark mode: brand cell */
[data-theme="dark"] .brand-cell{background:#141420!important;}
[data-theme="dark"] .brand-cell img{filter:grayscale(1) opacity(.4)!important;}
[data-theme="dark"] .brand-cell img:hover{filter:grayscale(.3) opacity(.9)!important;}
/* Dark mode: horeca cat cell */
[data-theme="dark"] .horeca-cat-cell{background:#141420!important;}
/* Dark mode: ig-prop-cell */
[data-theme="dark"] .ig-prop-cell{background:#141420!important;color:rgba(255,255,255,.45)!important;}
/* Dark mode: works-card, contact-info-card */
[data-theme="dark"] .works-card,[data-theme="dark"] .contact-info-card{background:#141420!important;border-color:rgba(255,255,255,.06)!important;}
/* Dark mode: partner-marquee-section & trust-signals */
[data-theme="dark"] .partner-marquee-section{background:#0a0a12!important;border-color:rgba(255,255,255,.06)!important;}
[data-theme="dark"] .partner-marquee-label{color:rgba(255,255,255,.35)!important;}
[data-theme="dark"] .trust-signals-section{background:#0a0a12!important;border-color:rgba(255,255,255,.06)!important;}
/* Dark mode: map section */
[data-theme="dark"] .map-presence-section{background:#080810!important;border-color:rgba(255,255,255,.06)!important;}
[data-theme="dark"] .map-city-card{background:#141420!important;border-color:rgba(255,255,255,.07)!important;}
[data-theme="dark"] .map-city-card:hover{border-color:rgba(184,150,12,.3)!important;}
[data-theme="dark"] .map-city-name{color:rgba(255,255,255,.9)!important;}
[data-theme="dark"] .map-city-sub{color:rgba(255,255,255,.4)!important;}
[data-theme="dark"] .india-map-box{background:linear-gradient(135deg,#0d0d1e 0%,#141428 100%)!important;border-color:rgba(255,255,255,.08)!important;}
[data-theme="dark"] .india-map-wrap svg .india-land{fill:#1e1e35!important;stroke:rgba(184,150,12,.35)!important;}
[data-theme="dark"] .india-map-wrap svg path[style*="fill:#e8ddc8"]{fill:#1e1e35!important;stroke:rgba(184,150,12,.3)!important;}
[data-theme="dark"] .india-map-wrap svg path[style*="fill:#ddd5be"]{fill:#181830!important;stroke:rgba(184,150,12,.25)!important;}
[data-theme="dark"] .india-map-wrap svg ellipse[style*="fill:#ddd5be"],[data-theme="dark"] .india-map-wrap svg ellipse[style*="fill:#e8ddc8"]{fill:#181830!important;stroke:rgba(184,150,12,.25)!important;}
[data-theme="dark"] .india-map-wrap svg .map-island-label{fill:rgba(255,255,255,.4)!important;}
[data-theme="dark"] .india-map-caption{color:rgba(255,255,255,.3)!important;}
[data-theme="dark"] .india-map-wrap svg text{fill:rgba(255,255,255,.75)!important;}
[data-theme="dark"] .india-map-wrap svg .map-legend-bg{fill:rgba(184,150,12,.06)!important;stroke:rgba(184,150,12,.2)!important;}
[data-theme="dark"] .india-map-wrap svg .map-legend-text{fill:rgba(255,255,255,.5)!important;}
[data-theme="dark"] .india-map-wrap svg .map-pin-label{fill:rgba(255,255,255,.88)!important;}
[data-theme="dark"] .india-map-wrap svg .map-pin-sub{fill:rgba(255,255,255,.5)!important;}
/* Dark mode: why-cards section text */
[data-theme="dark"] .why-card{background:#22223a!important;border-color:rgba(255,255,255,.13)!important;box-shadow:0 2px 20px rgba(0,0,0,.4)!important;}
[data-theme="dark"] .why-card h3{color:#f1f5f9!important;}
[data-theme="dark"] .why-card p{color:rgba(255,255,255,.65)!important;}
[data-theme="dark"] .why-card .why-icon{background:rgba(255,255,255,.06)!important;border-color:rgba(255,255,255,.1)!important;}
/* Dark mode: sec-wh inline-bg overrides */
[data-theme="dark"] [style*="background:var(--parch)"]{background:var(--parch)!important;}
[data-theme="dark"] [style*="background:var(--parch-dk)"]{background:var(--parch-dk)!important;}
/* Dark mode: city list cards with background:#fff */
[data-theme="dark"] .city-pin-card{background:#141420!important;border-color:rgba(255,255,255,.07)!important;}
/* Dark mode: hb-card (hotel brand cards) */
[data-theme="dark"] .hb-card{border-color:rgba(255,255,255,.07)!important;background:#141420!important;}
[data-theme="dark"] .hb-card img{filter:brightness(.85) contrast(1.1);}
/* Dark mode: rb-card (retail brand cards) */
[data-theme="dark"] .rb-card{border-color:rgba(255,255,255,.07)!important;background:#141420!important;}
/* Dark mode: insight mini-card on home page */
[data-theme="dark"] .home-insight-card{background:#141420!important;border-color:rgba(255,255,255,.06)!important;}
[data-theme="dark"] .home-insight-card h3{color:rgba(255,255,255,.88)!important;}
[data-theme="dark"] .home-insight-card p{color:rgba(255,255,255,.45)!important;}
/* Dark mode: stat cells inline */
[data-theme="dark"] .home-stat-cell{background:#141420!important;border-color:rgba(255,255,255,.06)!important;}
/* Dark mode: filter buttons (inline bg) */
[data-theme="dark"] [data-hbcat],[data-theme="dark"] [data-rbcat]{background:transparent!important;border-color:rgba(255,255,255,.12)!important;color:rgba(255,255,255,.5)!important;}
/* Dark mode: track record panels */
[data-theme="dark"] .track-panel>div{background:#141420!important;border-color:rgba(255,255,255,.07)!important;}
[data-theme="dark"] .track-panel>div h4{color:rgba(255,255,255,.88)!important;}
[data-theme="dark"] .track-panel>div p{color:rgba(255,255,255,.5)!important;}
[data-theme="dark"] .track-panel>div[style*="background:#fffdf4"]{background:#16140a!important;border-left-color:var(--gold)!important;}
[data-theme="dark"] .track-tab{color:rgba(255,255,255,.45)!important;}
[data-theme="dark"] .track-tab.tt-active{color:var(--gold)!important;background:rgba(184,150,12,.08)!important;}
/* Dark mode: mandate highlight cells */
[data-theme="dark"] .mandate-highlight{background:#141420!important;border-color:rgba(255,255,255,.06)!important;}

/* ── FOCUS VISIBLE (ARIA) ──────────────────────────────────────────────── */
:focus-visible{outline:2px solid var(--gold);outline-offset:2px;}
a:focus-visible,button:focus-visible{outline:2px solid var(--gold);outline-offset:3px;}

/* ── MODAL OVERLAY ──────────────────────────────── */
.ig-modal{display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.7);backdrop-filter:blur(12px);align-items:center;justify-content:center;padding:1rem;}
.ig-modal-box{background:#fff;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 40px 120px rgba(0,0,0,.5);}
.ig-modal-box.wide{max-width:860px;}
.ig-modal-hd{padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.ig-modal-bd{padding:1.5rem;}
.ig-modal-ft{padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;gap:.75rem;justify-content:flex-end;}
.ig-modal-close{background:none;border:none;cursor:pointer;color:var(--ink-muted);font-size:1rem;padding:.25rem;line-height:1;}
.ig-modal-close:hover{color:var(--ink);}

/* SLIDE PANEL */
.ig-panel{display:none;background:var(--parch-dk);border:1px solid var(--border);padding:1.5rem;margin-top:1rem;}

/* ── RESET ──────────────────────────────────── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  /* 24K Gold palette */
  --gold:#B8960C;--gold-lt:#D4AE2A;--gold-dk:#8A6E08;--gold-vlt:#E8C94A;
  --gold-pale:#FAF6E8;--gold-muted:#F0E8C8;
  --gold-glow:rgba(184,150,12,.35);--gold-line:rgba(184,150,12,.22);
  /* Obsidian ink palette */
  --ink:#0A0A0A;--ink-mid:#141414;--ink-soft:#3A3A3A;--ink-muted:#6B6B6B;--ink-faint:#A8A8A8;
  /* General page background — light parchment (mirrors --parch) */
  --bg:#FAFAF6;--bg-2:#F4EFE6;--bg-3:#EEEAE0;
  /* Dark section background — used by calculator, compare, market-data etc. */
  --bg-dk:#0c0c18;--bg-dk2:#111120;--bg-dk3:#16162a;
  /* Ivory parchment palette */
  --parch:#FAFAF6;--parch-dk:#F4EFE6;--border:#E6E0D4;--border-lt:#EDE8DF;
  --surface:#FFFFFF;--surface-2:#F8F5F0;
  /* Elevation */
  --nav-h:76px;
  --shadow-xs:0 1px 3px rgba(0,0,0,.04);
  --shadow-sm:0 2px 8px rgba(0,0,0,.06);
  --shadow-md:0 8px 32px rgba(0,0,0,.09);
  --shadow-lg:0 20px 60px rgba(0,0,0,.13);
  --shadow-xl:0 40px 100px rgba(0,0,0,.18);
  --shadow-gold:0 8px 32px rgba(184,150,12,.22);
  --shadow-gold-lg:0 20px 60px rgba(184,150,12,.18);
  /* Transitions */
  --t-fast:.18s cubic-bezier(.4,0,.2,1);
  --t-med:.28s cubic-bezier(.4,0,.2,1);
  --t-slow:.45s cubic-bezier(.4,0,.2,1);
  --t-cinema:.75s cubic-bezier(.77,0,.175,1);
}
html{scroll-behavior:smooth}
body{font-family:"DM Sans",system-ui,sans-serif;background:var(--parch);color:var(--ink);font-size:16px;line-height:1.7;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overflow-x:hidden}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
button{font-family:inherit;}

/* ── SELECTION ─────────────────────────────── */
::selection{background:rgba(184,150,12,.15);color:var(--ink)}

/* ── TYPOGRAPHY ─────────────────────────────── */
.f-serif{font-family:"DM Serif Display",Georgia,serif}
/* Eyebrow — refined editorial label */
.eyebrow{
  font-size:.62rem;font-weight:700;letter-spacing:.3em;text-transform:uppercase;
  color:var(--gold);display:inline-flex;align-items:center;gap:.7rem;
}
.eyebrow::before{
  content:'';display:inline-block;width:28px;height:1px;background:linear-gradient(90deg,var(--gold),var(--gold-lt));flex-shrink:0;
}
.eyebrow-lt{
  font-size:.62rem;font-weight:700;letter-spacing:.3em;text-transform:uppercase;
  color:rgba(184,150,12,.75);display:inline-flex;align-items:center;gap:.7rem;
}
.eyebrow-lt::before{content:'';display:inline-block;width:28px;height:1px;background:linear-gradient(90deg,rgba(184,150,12,.5),rgba(184,150,12,.2));flex-shrink:0;}
.eyebrow-plain{font-size:.62rem;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:var(--gold);}
/* Display headings */
.h1{
  font-family:"DM Serif Display",Georgia,serif;
  font-size:clamp(3.2rem,7vw,6.5rem);line-height:1.02;
  color:#fff;letter-spacing:-.025em;font-weight:400;
}
.h2{
  font-family:"DM Serif Display",Georgia,serif;
  font-size:clamp(2.4rem,4.8vw,4rem);line-height:1.06;
  color:var(--ink);letter-spacing:-.02em;font-weight:400;
}
.h2-lt{
  font-family:"DM Serif Display",Georgia,serif;
  font-size:clamp(2.4rem,4.8vw,4rem);line-height:1.06;
  color:#fff;letter-spacing:-.02em;font-weight:400;
}
.h3{font-family:"DM Serif Display",Georgia,serif;font-size:clamp(1.5rem,2.4vw,2.2rem);line-height:1.18;color:var(--ink);font-weight:400;}
.h3-lt{font-family:"DM Serif Display",Georgia,serif;font-size:clamp(1.5rem,2.4vw,2.2rem);line-height:1.18;color:#fff;font-weight:400;}
.h4{font-family:"DM Serif Display",Georgia,serif;font-size:clamp(1.15rem,1.6vw,1.5rem);line-height:1.25;color:var(--ink);font-weight:400;}
/* Body text */
.lead{font-size:1.125rem;line-height:1.9;color:var(--ink-soft);font-weight:400;}
.lead-lt{font-size:1.125rem;line-height:1.9;color:rgba(255,255,255,.68);font-weight:400;}
.body{font-size:.9375rem;line-height:1.85;color:var(--ink-soft);}
.body-lt{font-size:.9375rem;line-height:1.85;color:rgba(255,255,255,.6);}
.body-sm{font-size:.825rem;line-height:1.75;color:var(--ink-soft);}
.caption{font-size:.72rem;letter-spacing:.09em;color:var(--ink-muted);}
.caption-lt{font-size:.72rem;letter-spacing:.09em;color:rgba(255,255,255,.45);}
/* Large display numbers */
.stat-n{font-family:"DM Serif Display",serif;font-size:3.25rem;line-height:.95;color:var(--gold);letter-spacing:-.03em;}
.stat-n-sm{font-family:"DM Serif Display",serif;font-size:2.25rem;line-height:1;color:var(--gold);letter-spacing:-.02em;}
.stat-n-lg{font-family:"DM Serif Display",serif;font-size:4.5rem;line-height:.9;color:var(--gold);letter-spacing:-.04em;}
.overline{font-size:.6rem;font-weight:700;letter-spacing:.26em;text-transform:uppercase;color:var(--ink-muted);}
/* Article body typography */
.article-body h2{font-family:"DM Serif Display",Georgia,serif;font-size:1.75rem;color:var(--ink);margin:2.5rem 0 1rem;line-height:1.2;font-weight:400;}
.article-body h3{font-family:"DM Serif Display",Georgia,serif;font-size:1.35rem;color:var(--ink);margin:2rem 0 .875rem;line-height:1.25;font-weight:400;}
.article-body p{font-size:.9625rem;line-height:1.9;color:var(--ink-soft);margin-bottom:1.35rem;}
.article-body ul,.article-body ol{padding-left:1.5rem;margin-bottom:1.35rem;}
.article-body li{font-size:.9375rem;line-height:1.85;color:var(--ink-soft);margin-bottom:.5rem;}
.article-body strong{color:var(--ink);font-weight:600;}
.article-body blockquote{border-left:3px solid var(--gold);padding:1rem 1.5rem;background:var(--parch);margin:2rem 0;font-family:"DM Serif Display",Georgia,serif;font-size:1.1rem;font-style:italic;color:var(--ink);line-height:1.7;}

/* ── GOLD ORNAMENTS ─────────────────────────── */
.gr{width:40px;height:2px;background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent);margin-bottom:1.25rem;border-radius:1px;}
.gr-c{width:40px;height:2px;background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent);margin:0 auto 1.25rem;border-radius:1px;}
.gr-lt{width:40px;height:2px;background:linear-gradient(90deg,rgba(184,150,12,.6),rgba(184,150,12,.2));margin-bottom:1.25rem;border-radius:1px;}
.gold-rule{width:100%;height:1px;background:linear-gradient(90deg,transparent,var(--gold-lt),transparent);opacity:.25;margin:2.5rem 0;}
.gold-dot{width:5px;height:5px;border-radius:50%;background:var(--gold);display:inline-block;}
/* Premium gold line divider */
.gold-divider{width:100%;height:1px;background:linear-gradient(90deg,transparent 0%,var(--gold-line) 20%,var(--gold-line) 80%,transparent 100%);margin:0;}
/* Gold vertical accent */
.gold-accent-v{width:3px;background:linear-gradient(180deg,var(--gold),var(--gold-lt),transparent);border-radius:2px;}

/* ── LAYOUT ─────────────────────────────────── */
.wrap{max-width:1360px;margin:0 auto;padding:0 2.5rem}
.wrap-md{max-width:1100px;margin:0 auto;padding:0 2.5rem}
.wrap-sm{max-width:960px;margin:0 auto;padding:0 2rem}
.wrap-xs{max-width:720px;margin:0 auto;padding:0 2rem}
.sec{padding:7rem 0}
.sec-sm{padding:5rem 0}
.sec-dk{background:var(--ink);padding:7rem 0;position:relative}
.sec-md{background:var(--ink-mid);padding:7rem 0;position:relative}
.sec-wh{background:#fff;padding:7rem 0}
.sec-pc{background:var(--parch);padding:7rem 0}
.sec-pd{background:var(--parch-dk);padding:7rem 0}

/* ── LUXURY BUTTONS ──────────────────────────── */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:.55rem;
  padding:.82rem 2.1rem;font-size:.72rem;font-weight:700;
  letter-spacing:.14em;text-transform:uppercase;
  transition:all var(--t-med);
  cursor:pointer;border:1.5px solid transparent;
  white-space:nowrap;position:relative;overflow:hidden;
  font-family:"DM Sans",sans-serif;
}
.btn::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,.1) 0%,transparent 50%);
  opacity:0;transition:opacity .22s;pointer-events:none;
}
.btn:hover::before{opacity:1;}
/* Shimmer sweep on hover */
.btn::after{
  content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
  transition:left .55s cubic-bezier(.4,0,.2,1);pointer-events:none;
  transform:skewX(-20deg);
}
.btn:hover::after{left:140%;}
.btn-g{
  background:linear-gradient(135deg,var(--gold-dk) 0%,var(--gold) 50%,var(--gold-lt) 100%);
  background-size:200% auto;
  color:#fff;border-color:var(--gold);
  box-shadow:0 4px 20px rgba(184,150,12,.28),inset 0 1px 0 rgba(255,255,255,.15);
}
.btn-g:hover{
  background-position:right center;
  box-shadow:0 8px 32px rgba(184,150,12,.42),inset 0 1px 0 rgba(255,255,255,.15);
  transform:translateY(-1px);
}
.btn-go{border-color:var(--gold);color:var(--gold);background:transparent;}
.btn-go:hover{background:linear-gradient(135deg,var(--gold),var(--gold-lt));color:#fff;box-shadow:var(--shadow-gold);transform:translateY(-1px);}
.btn-dk{
  background:var(--ink);color:#fff;border-color:var(--ink);
  box-shadow:0 4px 16px rgba(0,0,0,.18);
}
.btn-dk:hover{background:transparent;color:var(--ink);box-shadow:none;}
.btn-dko{border-color:var(--ink);color:var(--ink);background:transparent;}
.btn-dko:hover{background:var(--ink);color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.18);transform:translateY(-1px);}
.btn-ghost{
  border-color:rgba(255,255,255,.25);color:#fff;background:rgba(255,255,255,.04);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
}
.btn-ghost:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.5);transform:translateY(-1px);}
.btn-ghost-g{border-color:rgba(184,150,12,.5);color:var(--gold);background:rgba(184,150,12,.04);}
.btn-ghost-g:hover{background:linear-gradient(135deg,var(--gold),var(--gold-lt));color:#fff;box-shadow:var(--shadow-gold);border-color:var(--gold);transform:translateY(-1px);}
/* Small variant */
.btn-sm{padding:.55rem 1.35rem;font-size:.68rem;letter-spacing:.1em;}

/* ── PREMIUM NAVIGATION ──────────────────────── */
#mainNav{
  height:var(--nav-h);position:fixed;top:0;left:0;right:0;z-index:200;
  transition:background var(--t-slow),box-shadow var(--t-slow),border-color var(--t-slow);
}
#mainNav.nav-solid{
  background:rgba(5,5,5,.97);
  backdrop-filter:blur(28px) saturate(200%);
  -webkit-backdrop-filter:blur(28px) saturate(200%);
  box-shadow:0 1px 0 rgba(255,255,255,.04),0 4px 28px rgba(0,0,0,.35);
  border-bottom:1px solid rgba(184,150,12,.08);
}
#mainNav.nav-clear{background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.12) 65%,transparent 100%);}
.nav-sp{height:var(--nav-h)}
.n-lk{
  font-size:.73rem;font-weight:500;letter-spacing:.04em;
  color:rgba(255,255,255,.55);padding:.5rem .75rem;
  transition:color var(--t-fast);position:relative;
}
.n-lk::after{
  content:'';position:absolute;bottom:-1px;left:1rem;right:1rem;
  height:1px;background:linear-gradient(90deg,var(--gold),var(--gold-lt));
  transform:scaleX(0);transform-origin:left;
  transition:transform .3s cubic-bezier(.4,0,.2,1);
}
.n-lk:hover,.n-lk.on{color:#fff;}
.n-lk:hover::after,.n-lk.on::after{transform:scaleX(1);}
.n-drop{
  position:absolute;top:calc(100% + 16px);left:0;min-width:16rem;
  background:rgba(4,4,4,.99);border:1px solid rgba(184,150,12,.12);
  backdrop-filter:blur(32px);-webkit-backdrop-filter:blur(32px);
  opacity:0;visibility:hidden;
  transform:translateY(-10px) scale(.97);
  transition:all .3s cubic-bezier(.4,0,.2,1);z-index:300;
  box-shadow:0 24px 64px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.02);
}
.n-par:hover .n-drop{opacity:1;visibility:visible;transform:translateY(0) scale(1);}
.n-di{
  display:flex;align-items:center;gap:.9rem;padding:.725rem 1.3rem;
  font-size:.76rem;color:rgba(255,255,255,.58);
  transition:color var(--t-fast),background var(--t-fast),padding-left .22s;
  border-left:2px solid transparent;
}
.n-di:hover{color:#fff;background:rgba(255,255,255,.035);border-left-color:var(--gold);padding-left:1.6rem;}
#nav-desktop-links,#nav-desktop-right{display:none}
#mobileBtn{display:flex}
#mobileMenu{display:none}
@media(min-width:1080px){
  #nav-desktop-links{display:flex;align-items:center;gap:.1rem}
  #nav-desktop-right{display:flex;align-items:center;gap:.6rem}
  #mobileBtn{display:none}
  #mobileMenu{display:none!important}
}

/* ── HERO CAROUSEL ──────────────────────────── */
/* Pull carousel up behind the fixed nav so no blank band shows above it */
.car{position:relative;overflow:hidden;height:calc(100vh + var(--nav-h));margin-top:calc(-1 * var(--nav-h));min-height:640px;max-height:1076px}
.car-track{display:flex;height:100%;transition:transform var(--t-cinema)}
.car-slide{flex:0 0 100%;position:relative;overflow:hidden}
.car-bg{position:absolute;inset:0;background-size:cover;background-position:center;transform:scale(1.1);transition:transform 11s cubic-bezier(.4,0,.2,1)}
.car-slide.on .car-bg{transform:scale(1)}
/* Layered cinematic overlays */
.car-ov-main{position:absolute;inset:0;background:linear-gradient(108deg,rgba(3,3,6,.90) 0%,rgba(3,3,6,.58) 48%,rgba(3,3,6,.18) 100%)}
.car-ov-btm{position:absolute;bottom:0;left:0;right:0;height:45%;background:linear-gradient(to top,rgba(3,3,6,.65) 0%,transparent 100%)}
.car-ov-gold{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 15% 85%,rgba(184,150,12,.06) 0%,transparent 55%)}
/* Car body: flex-start so text is always below the fixed header, never overlapping it */
.car-body{position:relative;z-index:2;height:100%;display:flex;align-items:flex-start;padding-top:calc(var(--nav-h) + 5rem);padding-bottom:8rem;}
/* slide text animation — staggered reveal */
.s-txt{opacity:0;transform:translateY(32px);transition:opacity .85s cubic-bezier(.4,0,.2,1) .25s,transform .85s cubic-bezier(.4,0,.2,1) .25s}
.car-slide.on .s-txt{opacity:1;transform:translateY(0)}
.s-tag{opacity:0;transform:translateX(-16px);transition:opacity .6s ease .1s,transform .6s ease .1s}
.car-slide.on .s-tag{opacity:1;transform:translateX(0)}
.s-cta{opacity:0;transform:translateY(18px);transition:opacity .7s ease .55s,transform .7s ease .55s}
.car-slide.on .s-cta{opacity:1;transform:translateY(0)}
/* dots */
.car-dots{position:absolute;bottom:2.5rem;left:50%;transform:translateX(-50%);display:flex;gap:.5rem;z-index:10;align-items:center}
.c-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.22);border:none;cursor:pointer;transition:all .35s;padding:0}
.c-dot.on{background:var(--gold);width:28px;border-radius:3px;box-shadow:0 0 10px rgba(184,150,12,.5)}
/* arrows */
.car-arr{position:absolute;top:50%;z-index:10;transform:translateY(-50%);width:50px;height:50px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.18);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-size:.82rem;transition:all .25s}
.car-arr:hover{background:var(--gold);border-color:var(--gold);box-shadow:0 0 20px rgba(184,150,12,.4)}
.car-prev{left:2rem}
.car-next{right:2rem}
/* slide counter */
.car-ct{position:absolute;top:2rem;right:2rem;z-index:10;font-size:.68rem;font-weight:600;letter-spacing:.18em;color:rgba(255,255,255,.35)}
.car-ct b{color:rgba(255,255,255,.85);font-weight:600}
/* progress bar */
.car-pb{position:absolute;bottom:0;left:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--gold-lt));z-index:10;width:0;box-shadow:0 0 8px rgba(184,150,12,.6)}

/* ── TICKER ─────────────────────────────────── */
.ticker{overflow:hidden;background:linear-gradient(90deg,var(--gold-dk),var(--gold),var(--gold-lt),var(--gold),var(--gold-dk));background-size:400% auto;padding:.55rem 0;position:relative;z-index:2;animation:tickerBg 8s ease-in-out infinite}
@keyframes tickerBg{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.ticker-tr{display:flex;white-space:nowrap;animation:tick 65s linear infinite;will-change:transform}
.ticker-tr:hover{animation-play-state:paused}
@keyframes tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* ── CARDS ──────────────────────────────────── */
.card{background:#fff;border:1px solid var(--border);transition:border-color var(--t-med),box-shadow var(--t-med),transform var(--t-med)}
.card:hover{border-color:var(--gold-line);box-shadow:0 12px 40px rgba(0,0,0,.07)}
.card-lift:hover{transform:translateY(-5px);box-shadow:0 20px 56px rgba(0,0,0,.1)}
/* Premium feature card */
.feature-card{
  background:#fff;border:1px solid var(--border);overflow:hidden;
  transition:border-color var(--t-med),box-shadow var(--t-med),transform var(--t-med);
  position:relative;
}
.feature-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,var(--gold),transparent);
  opacity:0;transition:opacity var(--t-med);
}
.feature-card:hover{border-color:rgba(184,150,12,.3);box-shadow:0 16px 52px rgba(0,0,0,.09);transform:translateY(-4px);}
.feature-card:hover::before{opacity:1;}
/* Editorial card — used in mandates, insights */
.ed-card{
  background:#fff;border:1px solid var(--border-lt);overflow:hidden;
  transition:all var(--t-med);
}
.ed-card:hover{border-color:rgba(184,150,12,.35);box-shadow:0 20px 60px rgba(0,0,0,.1);transform:translateY(-5px);}
.ed-card:hover .ed-card-img img{transform:scale(1.05);}
.ed-card-img{overflow:hidden;position:relative;}
.ed-card-img img{transition:transform 6s cubic-bezier(.4,0,.2,1);}

/* ── VERTICAL GRID ──────────────────────────── */
.vg{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--border)}
@media(max-width:860px){.vg{grid-template-columns:repeat(2,1fr)}}
@media(max-width:540px){.vg{grid-template-columns:1fr}}
.vg-cell{
  padding:3rem 2.5rem;background:#fff;border-right:1px solid var(--border);border-bottom:1px solid var(--border);
  transition:background var(--t-med),border-color var(--t-med);cursor:pointer;
  position:relative;overflow:hidden;
}
.vg-cell::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(184,150,12,.04) 0%,transparent 60%);opacity:0;transition:opacity var(--t-med);}
.vg-cell:nth-child(3n){border-right:none}
.vg-cell:hover{background:rgba(250,246,232,.7);border-color:var(--gold-line)}
.vg-cell:hover::after{opacity:1;}
.vg-cell:hover .vg-arr{opacity:1;transform:translateX(0)}
.vg-arr{opacity:0;transform:translateX(-10px);transition:all .28s;font-size:.7rem;color:var(--gold);margin-top:.75rem;}
/* Icon wrapper for vg cells */
.vg-icon{
  width:52px;height:52px;background:rgba(184,150,12,.08);border:1px solid rgba(184,150,12,.16);
  display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem;
  transition:background var(--t-med),border-color var(--t-med);
}
.vg-cell:hover .vg-icon{background:rgba(184,150,12,.16);border-color:rgba(184,150,12,.35);}

/* ── MANDATE CARD ───────────────────────────── */
.mc{background:#fff;border:1px solid var(--border);overflow:hidden;transition:border-color var(--t-med),box-shadow var(--t-med)}
.mc:hover{border-color:var(--gold-line);box-shadow:0 12px 40px rgba(0,0,0,.08)}
.mc-head{background:var(--ink);padding:2rem;position:relative;overflow:hidden}
.mc-head::after{content:'';position:absolute;right:-2rem;top:-2rem;width:10rem;height:10rem;border-radius:50%;background:rgba(184,150,12,.05)}

/* ── BADGES ─────────────────────────────────── */
.badge{display:inline-block;padding:.22rem .65rem;font-size:.62rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase}
.b-g{background:rgba(184,150,12,.08);color:var(--gold);border:1px solid rgba(184,150,12,.2)}
.b-dk{background:rgba(10,10,10,.05);color:var(--ink);border:1px solid rgba(10,10,10,.1)}
.b-gr{background:rgba(22,163,74,.07);color:#15803d;border:1px solid rgba(22,163,74,.16)}
.b-bl{background:rgba(59,130,246,.07);color:#1d4ed8;border:1px solid rgba(59,130,246,.16)}
.b-re{background:rgba(220,38,38,.07);color:#b91c1c;border:1px solid rgba(220,38,38,.16)}

/* ── METRIC BOX ─────────────────────────────── */
.ig-metric-box{
  background:#fff;border:1px solid var(--border);padding:2rem 1.75rem;
  position:relative;overflow:hidden;
  transition:border-color var(--t-med),box-shadow var(--t-med),transform var(--t-med);
}
.ig-metric-box::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent);
  opacity:.6;
}
.ig-metric-box:hover{border-color:var(--gold-line);box-shadow:0 8px 32px rgba(0,0,0,.07);transform:translateY(-2px);}

/* ── QUOTE BLOCK ─────────────────────────────── */
.ig-quote{
  border-left:3px solid var(--gold);padding:1.5rem 2rem;
  background:linear-gradient(135deg,rgba(184,150,12,.04),transparent);
  position:relative;
}
.ig-quote::before{content:'"';position:absolute;top:-.5rem;left:1.5rem;font-family:"DM Serif Display",Georgia,serif;font-size:5rem;color:rgba(184,150,12,.12);line-height:1;}

/* ── FORMS ──────────────────────────────────── */
.ig-inp{width:100%;border:1px solid var(--border);padding:.8rem 1rem;background:#fff;font-size:.875rem;font-family:"DM Sans",sans-serif;color:var(--ink);outline:none;transition:border-color .2s,box-shadow .2s;border-radius:0;-webkit-appearance:none}
.ig-inp:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(184,150,12,.07)}
.ig-inp::placeholder{color:var(--ink-faint)}
.ig-lbl{display:block;font-size:.68rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:.35rem}
select.ig-inp{cursor:pointer}
textarea.ig-inp{resize:vertical;min-height:130px}
/* legacy aliases kept for portal */
.ig-input{width:100%;border:1px solid var(--border);padding:.8rem 1rem;background:#fff;font-size:.875rem;font-family:"DM Sans",sans-serif;color:var(--ink);outline:none;transition:border-color .2s,box-shadow .2s;border-radius:0;-webkit-appearance:none}
.ig-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(184,150,12,.07)}
.ig-input::placeholder{color:var(--ink-faint)}
.ig-label{display:block;font-size:.68rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:.35rem}
select.ig-input{cursor:pointer}
textarea.ig-input{resize:vertical;min-height:130px}

/* ── SIDEBAR ────────────────────────────────── */
.sb-lk{display:flex;align-items:center;gap:.75rem;padding:.6rem .875rem;font-size:.78rem;font-weight:500;color:rgba(255,255,255,.5);border-radius:3px;transition:all .18s;cursor:pointer;text-decoration:none;}
.sb-lk:hover{color:#fff;background:rgba(255,255,255,.05)}
.sb-lk.on{color:var(--gold);background:rgba(184,150,12,.11)}
.sb-sec{font-size:.62rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.45);padding:.5rem .875rem;margin-top:.75rem}

/* ── TABLES ─────────────────────────────────── */
.ig-tbl{width:100%;border-collapse:collapse}
.ig-tbl th{background:var(--ink);color:#fff;font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:.7rem 1rem;text-align:left;white-space:nowrap}
.ig-tbl td{padding:.75rem 1rem;border-bottom:1px solid var(--border);font-size:.875rem;vertical-align:middle}
.ig-tbl tr:last-child td{border-bottom:none}
.ig-tbl tbody tr:hover td{background:var(--gold-pale)}
/* alias */
.ig-table{width:100%;border-collapse:collapse}
.ig-table th{background:var(--ink);color:#fff;font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:.7rem 1rem;text-align:left;white-space:nowrap}
.ig-table td{padding:.75rem 1rem;border-bottom:1px solid var(--border);font-size:.875rem;vertical-align:middle}
.ig-table tr:last-child td{border-bottom:none}
.ig-table tbody tr:hover td{background:var(--gold-pale)}

/* ── SCROLLBAR ──────────────────────────────── */
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--gold)}

/* ── ANIMATIONS ─────────────────────────────── */
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideRight{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
@keyframes lineGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes goldPulse{0%,100%{box-shadow:0 0 0 0 rgba(184,150,12,0)}50%{box-shadow:0 0 20px 4px rgba(184,150,12,.18)}}
@keyframes shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
.fu  {animation:fadeUp .65s cubic-bezier(.4,0,.2,1) both}
.fu1 {animation:fadeUp .65s cubic-bezier(.4,0,.2,1) .1s both}
.fu2 {animation:fadeUp .65s cubic-bezier(.4,0,.2,1) .2s both}
.fu3 {animation:fadeUp .65s cubic-bezier(.4,0,.2,1) .3s both}
.fu4 {animation:fadeUp .65s cubic-bezier(.4,0,.2,1) .4s both}
.fu5 {animation:fadeUp .65s cubic-bezier(.4,0,.2,1) .5s both}
.fi  {animation:fadeIn .55s ease both}
.si  {animation:scaleIn .55s cubic-bezier(.4,0,.2,1) both}
/* Shimmer loading placeholder */
.shimmer{background:linear-gradient(90deg,var(--parch) 25%,var(--parch-dk) 50%,var(--parch) 75%);background-size:200% auto;animation:shimmer 2s linear infinite;}

/* ── Lightbox ────────────────────────────────── */
#ig-lightbox{display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.97);align-items:center;justify-content:center;}
#ig-lightbox.open{display:flex;}
#ig-lightbox img{max-width:92vw;max-height:90vh;object-fit:contain;display:block;box-shadow:0 0 60px rgba(0,0,0,.6);}
#ig-lightbox-close{position:absolute;top:1.5rem;right:1.75rem;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:1rem;cursor:pointer;opacity:.8;transition:all .2s;width:38px;height:38px;display:flex;align-items:center;justify-content:center;}
#ig-lightbox-close:hover{opacity:1;background:var(--gold);border-color:var(--gold);}
#ig-lightbox-prev,#ig-lightbox-next{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;width:48px;height:48px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.9rem;transition:all .2s;}
#ig-lightbox-prev{left:1.5rem;}#ig-lightbox-next{right:1.5rem;}
#ig-lightbox-prev:hover,#ig-lightbox-next:hover{background:var(--gold);border-color:var(--gold);}
#ig-lightbox-caption{position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);font-size:.72rem;color:rgba(255,255,255,.5);letter-spacing:.1em;background:rgba(0,0,0,.4);padding:.3rem .875rem;}

/* ── command-k search palette ─────────────────── */
#ig-search-overlay{display:none;position:fixed;inset:0;z-index:10500;background:rgba(0,0,0,.72);backdrop-filter:blur(6px);padding:10vh 1rem 2rem;align-items:flex-start;justify-content:center;}
#ig-search-overlay.open{display:flex;}
#ig-search-box{width:100%;max-width:640px;background:#111118;border:1px solid rgba(184,150,12,.35);box-shadow:0 24px 64px rgba(0,0,0,.7),0 0 0 1px rgba(184,150,12,.1);overflow:hidden;}
#ig-search-header{display:flex;align-items:center;gap:.75rem;padding:.875rem 1.1rem;border-bottom:1px solid rgba(255,255,255,.07);}
#ig-search-header i{color:rgba(184,150,12,.7);font-size:.85rem;flex-shrink:0;}
#ig-search-input{flex:1;background:transparent;border:none;outline:none;font-size:.95rem;color:#fff;font-family:'DM Sans',sans-serif;caret-color:var(--gold);}
#ig-search-input::placeholder{color:rgba(255,255,255,.25);}
#ig-search-shortcut{font-size:.6rem;color:rgba(255,255,255,.2);letter-spacing:.05em;white-space:nowrap;display:flex;gap:.3rem;align-items:center;}
#ig-search-shortcut kbd{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:.1rem .35rem;font-size:.58rem;border-radius:3px;}
#ig-search-results{max-height:58vh;overflow-y:auto;padding:.5rem 0;}
#ig-search-results:empty::after{content:'Start typing to search mandates, articles, and pages…';display:block;padding:2rem 1.25rem;font-size:.8rem;color:rgba(255,255,255,.2);text-align:center;}
.ig-sr-group{padding:.55rem 1.1rem .2rem;font-size:.58rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.25);}
.ig-sr-item{display:flex;align-items:center;gap:.875rem;padding:.7rem 1.1rem;cursor:pointer;transition:background .12s;text-decoration:none;color:inherit;}
.ig-sr-item:hover,.ig-sr-item.active{background:rgba(184,150,12,.1);}
.ig-sr-icon{width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.72rem;}
.ig-sr-item-title{font-size:.82rem;color:#fff;margin-bottom:.15rem;line-height:1.3;}
.ig-sr-item-sub{font-size:.68rem;color:rgba(255,255,255,.35);line-height:1.3;}
.ig-sr-item-badge{margin-left:auto;font-size:.55rem;font-weight:700;letter-spacing:.08em;padding:.15rem .45rem;flex-shrink:0;}
#ig-search-footer{padding:.55rem 1.1rem;border-top:1px solid rgba(255,255,255,.06);display:flex;gap:1.25rem;align-items:center;}
#ig-search-footer span{font-size:.6rem;color:rgba(255,255,255,.2);display:flex;align-items:center;gap:.3rem;}
#ig-search-footer kbd{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:.1rem .35rem;font-size:.58rem;border-radius:3px;}
.ig-sr-highlight{color:var(--gold);}
@media(max-width:640px){#ig-search-overlay{padding:5vh .75rem 1rem;align-items:flex-start;}#ig-search-box{max-width:100%;}}

/* ── Back-to-top ─────────────────────────────── */
#btt{position:fixed;bottom:6rem;right:1.75rem;z-index:400;width:40px;height:40px;background:var(--gold);color:#fff;border:none;cursor:pointer;display:none;align-items:center;justify-content:center;font-size:.75rem;box-shadow:0 4px 20px rgba(184,150,12,.45),0 0 0 3px rgba(184,150,12,.12);transition:all var(--t-med);border-radius:50%;}
#btt:hover{transform:translateY(-4px);box-shadow:0 8px 30px rgba(184,150,12,.55);}
#btt.show{display:flex;}

/* ── Sticky stats bar ────────────────────────── */
#stickyStats{position:fixed;top:calc(var(--nav-h) - 60px);left:0;right:0;z-index:190;opacity:0;visibility:hidden;transform:translateY(-12px);transition:top .35s cubic-bezier(.4,0,.2,1),opacity .35s cubic-bezier(.4,0,.2,1),transform .35s cubic-bezier(.4,0,.2,1),visibility 0s .35s;background:rgba(6,6,6,.98);backdrop-filter:blur(20px);border-bottom:1px solid rgba(184,150,12,.15);pointer-events:none;}
#stickyStats.visible{top:var(--nav-h);opacity:1;visibility:visible;transform:translateY(0);transition:top .35s cubic-bezier(.4,0,.2,1),opacity .35s cubic-bezier(.4,0,.2,1),transform .35s cubic-bezier(.4,0,.2,1),visibility 0s 0s;pointer-events:auto;}
.sticky-stat{display:flex;align-items:center;gap:.5rem;padding:.58rem 1.35rem;}
.sticky-stat-n{font-family:"DM Serif Display",Georgia,serif;font-size:1.05rem;color:var(--gold);line-height:1;}
.sticky-stat-l{font-size:.54rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.4);}
@media(max-width:640px){#stickyStats{display:none;}}

/* ── Scrollbar ───────────────────────────────── */
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--gold)}

/* ── Forms ───────────────────────────────────── */
.ig-inp{
  width:100%;border:1px solid var(--border);padding:.875rem 1.125rem;
  background:#fff;font-size:.875rem;font-family:"DM Sans",sans-serif;
  color:var(--ink);outline:none;
  transition:border-color var(--t-fast),box-shadow var(--t-fast),background var(--t-fast);
  border-radius:0;-webkit-appearance:none;
}
.ig-inp:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(184,150,12,.08);background:#fff;}
.ig-inp::placeholder{color:var(--ink-faint)}
.ig-lbl{display:block;font-size:.67rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:.4rem}
select.ig-inp{cursor:pointer}
textarea.ig-inp{resize:vertical;min-height:140px}
/* legacy aliases */
.ig-input{width:100%;border:1px solid var(--border);padding:.875rem 1.125rem;background:#fff;font-size:.875rem;font-family:"DM Sans",sans-serif;color:var(--ink);outline:none;transition:border-color var(--t-fast),box-shadow var(--t-fast);border-radius:0;-webkit-appearance:none}
.ig-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(184,150,12,.08)}
.ig-input::placeholder{color:var(--ink-faint)}
.ig-label{display:block;font-size:.67rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:.4rem}
select.ig-input{cursor:pointer}
textarea.ig-input{resize:vertical;min-height:140px}

/* ── Sidebar ─────────────────────────────────── */
.sb-lk{display:flex;align-items:center;gap:.75rem;padding:.625rem .9rem;font-size:.775rem;font-weight:500;color:rgba(255,255,255,.48);border-radius:2px;transition:all var(--t-fast);cursor:pointer;text-decoration:none;}
.sb-lk:hover{color:#fff;background:rgba(255,255,255,.05)}
.sb-lk.on{color:var(--gold);background:rgba(184,150,12,.1)}
.sb-sec{font-size:.6rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.4);padding:.5rem .9rem;margin-top:.875rem}

/* ── Tables ──────────────────────────────────── */
.ig-tbl{width:100%;border-collapse:collapse}
.ig-tbl th{background:var(--ink);color:#fff;font-size:.67rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;padding:.75rem 1.1rem;text-align:left;white-space:nowrap}
.ig-tbl td{padding:.8rem 1.1rem;border-bottom:1px solid var(--border);font-size:.875rem;vertical-align:middle}
.ig-tbl tr:last-child td{border-bottom:none}
.ig-tbl tbody tr:hover td{background:rgba(184,150,12,.04)}
.ig-table{width:100%;border-collapse:collapse}
.ig-table th{background:var(--ink);color:#fff;font-size:.67rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;padding:.75rem 1.1rem;text-align:left;white-space:nowrap}
.ig-table td{padding:.8rem 1.1rem;border-bottom:1px solid var(--border);font-size:.875rem;vertical-align:middle}
.ig-table tr:last-child td{border-bottom:none}
.ig-table tbody tr:hover td{background:rgba(184,150,12,.04)}

/* ── Portal card / admin metric ──────────────── */
.pc{background:#fff;border:1px solid rgba(255,255,255,.07);overflow:hidden;transition:transform var(--t-med),box-shadow var(--t-med)}
.pc:hover{transform:translateY(-4px);box-shadow:0 22px 64px rgba(0,0,0,.42)}
.am{background:#fff;border:1px solid var(--border);padding:1.5rem 1.75rem}

/* ── Sidebar notification badge ──────────────── */
.sb-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;background:var(--gold);color:#fff;font-size:.55rem;font-weight:700;border-radius:9px;margin-left:auto;}
.sb-dot{width:7px;height:7px;border-radius:50%;background:#ef4444;margin-left:auto;flex-shrink:0;}

/* ── Progress bar ────────────────────────────── */
.ig-progress-track{background:var(--parch-dk);height:6px;border-radius:3px;overflow:hidden;}
.ig-progress-fill{height:100%;border-radius:3px;transition:width .7s cubic-bezier(.4,0,.2,1);}

/* ── Status pill ─────────────────────────────── */
.status-dot{width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:.4rem;flex-shrink:0;}

/* ── Tooltip ─────────────────────────────────── */
[data-tip]{position:relative;}
[data-tip]:hover::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:rgba(8,8,8,.94);color:#fff;padding:.32rem .7rem;font-size:.67rem;white-space:nowrap;z-index:999;pointer-events:none;letter-spacing:.04em;}

/* ── Dividers ────────────────────────────────── */
.ig-hr{border:none;border-top:1px solid var(--border);margin:1.75rem 0;}
.divider{height:1px;background:var(--border)}
.divider-dk{height:1px;background:rgba(255,255,255,.06)}

/* ── Info/warn/error boxes ───────────────────── */
.ig-info{background:#eff6ff;border:1px solid #bfdbfe;padding:.8rem 1.1rem;font-size:.82rem;color:#1d4ed8;display:flex;align-items:flex-start;gap:.5rem;}
.ig-warn{background:#fffbeb;border:1px solid #fde68a;padding:.8rem 1.1rem;font-size:.82rem;color:#92400e;display:flex;align-items:flex-start;gap:.5rem;}
.ig-danger{background:#fef2f2;border:1px solid #fecaca;padding:.8rem 1.1rem;font-size:.82rem;color:#991b1b;display:flex;align-items:flex-start;gap:.5rem;}
.ig-success{background:#f0fdf4;border:1px solid #bbf7d0;padding:.8rem 1.1rem;font-size:.82rem;color:#15803d;display:flex;align-items:flex-start;gap:.5rem;}
.ig-panel{display:none;background:var(--parch-dk);border:1px solid var(--border);padding:1.5rem;margin-top:1rem;}

/* ── Modal overlay ───────────────────────────── */
.ig-modal{display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.72);backdrop-filter:blur(14px);align-items:center;justify-content:center;padding:1rem;}
.ig-modal-box{background:#fff;width:100%;max-width:620px;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 40px 120px rgba(0,0,0,.55);}
.ig-modal-box.wide{max-width:880px;}
.ig-modal-hd{padding:1.35rem 1.75rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.ig-modal-bd{padding:1.75rem;}
.ig-modal-ft{padding:1.1rem 1.75rem;border-top:1px solid var(--border);display:flex;gap:.75rem;justify-content:flex-end;}
.ig-modal-close{background:none;border:none;cursor:pointer;color:var(--ink-muted);font-size:1rem;padding:.25rem;line-height:1;transition:color var(--t-fast);}
.ig-modal-close:hover{color:var(--ink);}

/* ── Animated counter ────────────────────────── */
.count-up{display:inline-block;}

/* ── Logo marquee ────────────────────────────── */
.marquee-wrap{overflow:hidden;position:relative;}
.marquee-track{display:flex;gap:3.5rem;align-items:center;animation:marquee 38s linear infinite;white-space:nowrap;will-change:transform;}
.marquee-track:hover{animation-play-state:paused;}
.marquee-track img{height:36px;width:auto;object-fit:contain;filter:grayscale(1) opacity(.5);transition:filter .35s;}
.marquee-track img:hover{filter:grayscale(0) opacity(1);}
@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* ── RESPONSIVE GRID ─────────────────────────── */
@media(max-width:768px){
  .r-1{grid-template-columns:1fr!important;}
  .r-2{grid-template-columns:1fr 1fr!important;}
}

/* ── PRINT ───────────────────────────────────── */
@media print{
  #mainNav,footer,.no-print,#btt,#stickyStats,#ig-lightbox,#nda-gate,.car-arr,.car-dots,.car-pb,.car-ct{display:none!important}
  body{background:#fff!important;color:#111!important;font-size:11pt;}
  .wrap,.wrap-md,.wrap-sm{max-width:100%!important;padding:0!important;}
  .listing-detail-grid{display:block!important;}
  .listing-detail-sidebar{display:none!important;}
  #specSheet{display:block!important;page-break-inside:avoid;}
  .detail-car{height:300px!important;}
  h1,h2,h3{color:#111!important;page-break-after:avoid;}
  a{color:#111!important;text-decoration:none!important;}
  .sec-pd,.sec-wh,.sec-dk,.sec-pc{background:#fff!important;padding:1rem 0!important;}
}

/* ══════════════════════════════════════════════
   MOBILE-FIRST RESPONSIVE SYSTEM
   xs<480 · sm<640 · md<768 · lg<1024 · xl<1280
══════════════════════════════════════════════ */
@media(max-width:768px){
  .sec,.sec-sm,.sec-dk,.sec-md,.sec-wh,.sec-pc,.sec-pd{padding:3.5rem 0}
  .wrap,.wrap-md{padding:0 1.25rem}
  .wrap-sm{padding:0 1.25rem}
}
@media(max-width:480px){
  .sec,.sec-sm,.sec-dk,.sec-md,.sec-wh,.sec-pc,.sec-pd{padding:2.75rem 0}
  .wrap,.wrap-md,.wrap-sm{padding:0 1rem}
}
@media(max-width:768px){
  .mob-stack{display:flex!important;flex-direction:column!important;gap:2rem!important;}
  .mob-stack>*{width:100%!important;}
  [style*="grid-template-columns:2fr 1fr"],
  [style*="grid-template-columns:3fr 2fr"],
  [style*="grid-template-columns:1fr 1fr"],
  [style*="grid-template-columns:5fr 4fr"],
  [style*="grid-template-columns:repeat(2,1fr)"],
  [style*="grid-template-columns:repeat(3,1fr)"],
  [style*="grid-template-columns:repeat(4,1fr)"]{
    grid-template-columns:1fr!important;
  }
  [style*="grid-template-columns:repeat(4,1fr)"]{
    grid-template-columns:repeat(2,1fr)!important;
  }
}
@media(max-width:480px){
  [style*="grid-template-columns:repeat(4,1fr)"]{
    grid-template-columns:repeat(2,1fr)!important;
  }
  [style*="grid-template-columns:repeat(2,1fr)"]{
    grid-template-columns:1fr!important;
  }
}
@media(max-width:768px){
  .car{height:92vh;min-height:540px;max-height:800px;}
  .car-arr{display:none;}
  .car-ct{display:none;}
}
@media(max-width:900px){
  .listing-layout{display:flex!important;flex-direction:column!important;gap:2rem!important;}
  .listing-sidebar{position:static!important;width:100%!important;}
}
@media(max-width:640px){
  .h1{font-size:clamp(2.1rem,8.5vw,3.5rem)!important;}
  .h2{font-size:clamp(1.75rem,6.5vw,2.75rem)!important;}
  .lead,.lead-lt{font-size:1rem!important;}
}
@media(max-width:480px){
  .btn-stack-mob{display:flex;flex-direction:column;gap:.625rem;width:100%;}
  .btn-stack-mob .btn{justify-content:center;}
}
@media(max-width:768px){
  .ig-tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .ig-tbl,.ig-table{min-width:560px;}
}
.filter-row{display:flex;flex-wrap:wrap;gap:.5rem;}
@media(max-width:640px){
  .vg{grid-template-columns:1fr!important;}
  .vg-cell:nth-child(3n){border-right:1px solid var(--border)!important;}
  .vg-cell:nth-child(odd){border-right:none!important;}
}
@media(max-width:768px){
  .footer-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:2rem!important;}
}
@media(max-width:480px){
  .footer-grid{grid-template-columns:1fr!important;}
}
@media(prefers-reduced-motion:reduce){
  .ticker-tr,.marquee-track{animation:none!important;}
  .reveal,.reveal-l,.reveal-r,.reveal-scale,.reveal-fast{opacity:1!important;transform:none!important;}
}
@media(max-width:640px){
  .mob-img-full{width:100%!important;height:240px!important;object-fit:cover!important;}
}
@media(max-width:768px){
  .stat-n{font-size:2.25rem!important;}
  .eyebrow{letter-spacing:.18em!important;}
}
@media(max-width:560px){
  .cta-flex{flex-direction:column!important;align-items:stretch!important;}
  .cta-flex .btn{text-align:center;justify-content:center;}
}
body{overflow-x:hidden;}

/* ── HERO DARK SECTION (secondary pages) ─────── */
.hero-dk{
  background:var(--ink);padding:calc(9rem - var(--nav-h)) 0 6rem;position:relative;overflow:hidden;
}
.hero-dk-grid{
  position:absolute;inset:0;
  background-image:linear-gradient(rgba(184,150,12,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(184,150,12,.035) 1px,transparent 1px);
  background-size:80px 80px;pointer-events:none;
}
.hero-dk-radial{position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 70% 50%,rgba(184,150,12,.06) 0%,transparent 55%);pointer-events:none;}
/* Hero floating number — cinematic background serif */
.hero-dk-num{
  position:absolute;right:-2rem;bottom:-3rem;
  font-family:"DM Serif Display",Georgia,serif;
  font-size:clamp(12rem,22vw,22rem);
  color:rgba(184,150,12,.025);
  line-height:1;letter-spacing:-.05em;
  pointer-events:none;user-select:none;
  font-weight:400;
}
/* Brand logo cell */
.brand-cell{background:#fff;padding:1.5rem 1rem;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100px;gap:.6rem;transition:background var(--t-fast),transform var(--t-fast);}
.brand-cell:hover{background:rgba(184,150,12,.04);transform:translateY(-2px);}

/* ── PREMIUM GLASSMORPHISM CARD ──────────────── */
.glass-card{
  background:rgba(255,255,255,.65);
  backdrop-filter:blur(20px) saturate(160%);
  -webkit-backdrop-filter:blur(20px) saturate(160%);
  border:1px solid rgba(255,255,255,.55);
  box-shadow:0 4px 24px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.8);
  transition:all var(--t-med);
}
.glass-card:hover{
  box-shadow:0 16px 48px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.8);
  transform:translateY(-3px);
  border-color:rgba(184,150,12,.3);
}

/* ── FLOATING LABEL FORM FIELDS ─────────────── */
.fl-group{position:relative;}
.fl-group .ig-inp{padding-top:1.4rem;padding-bottom:.4rem;}
.fl-group label{
  position:absolute;left:1.125rem;top:.875rem;
  font-size:.875rem;color:var(--ink-faint);
  transition:all .2s cubic-bezier(.4,0,.2,1);
  pointer-events:none;transform-origin:left top;
}
.fl-group .ig-inp:focus ~ label,
.fl-group .ig-inp:not(:placeholder-shown) ~ label{
  transform:translateY(-.625rem) scale(.75);
  color:var(--gold);
}

/* ── PREMIUM SECTION SEPARATOR ──────────────── */
.sec-sep{
  height:1px;
  background:linear-gradient(90deg,transparent 0%,var(--gold-line) 20%,var(--gold-line) 80%,transparent 100%);
}

/* ── ANIMATED GRADIENT TEXT ─────────────────── */
.grad-text{
  background:linear-gradient(135deg,var(--gold-dk),var(--gold),var(--gold-lt),var(--gold));
  background-size:300% auto;
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
  animation:gradMove 5s ease-in-out infinite;
}
@keyframes gradMove{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}

/* ── PREMIUM NUMBER DISPLAY ─────────────────── */
.ig-big-num{
  font-family:"DM Serif Display",Georgia,serif;
  font-size:clamp(3.5rem,6vw,5.5rem);
  line-height:.9;
  color:var(--gold);
  letter-spacing:-.04em;
  font-weight:400;
}
.ig-big-num-dk{
  font-family:"DM Serif Display",Georgia,serif;
  font-size:clamp(3.5rem,6vw,5.5rem);
  line-height:.9;
  color:#fff;
  letter-spacing:-.04em;
  font-weight:400;
}

/* ── PREMIUM CALLOUT BLOCK ──────────────────── */
.ig-callout{
  position:relative;
  padding:2rem 2.25rem;
  background:linear-gradient(135deg,rgba(184,150,12,.06) 0%,rgba(184,150,12,.02) 100%);
  border:1px solid rgba(184,150,12,.2);
  overflow:hidden;
}
.ig-callout::before{
  content:'';position:absolute;left:0;top:0;bottom:0;
  width:3px;background:linear-gradient(180deg,var(--gold),var(--gold-lt),transparent);
}

/* ── DARK CALLOUT BLOCK ─────────────────────── */
.ig-callout-dk{
  position:relative;
  padding:2rem 2.25rem;
  background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.07);
  overflow:hidden;
}
.ig-callout-dk::before{
  content:'';position:absolute;left:0;top:0;bottom:0;
  width:3px;background:linear-gradient(180deg,var(--gold),rgba(184,150,12,.3));
}

/* ── PILL BADGE ─────────────────────────────── */
.ig-pill{
  display:inline-flex;align-items:center;gap:.375rem;
  padding:.28rem .875rem;
  font-size:.6rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  background:rgba(184,150,12,.1);
  border:1px solid rgba(184,150,12,.25);
  color:var(--gold);
}
.ig-pill-dk{
  display:inline-flex;align-items:center;gap:.375rem;
  padding:.28rem .875rem;
  font-size:.6rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  background:rgba(184,150,12,.12);
  border:1px solid rgba(184,150,12,.3);
  color:var(--gold-lt);
}

/* ── PREMIUM NAV INDICATOR ──────────────────── */
.n-lk.current{color:#fff;}
.n-lk.current::after{transform:scaleX(1);}

/* ── ICON BOX ───────────────────────────────── */
.ig-icon-box{
  width:56px;height:56px;
  display:flex;align-items:center;justify-content:center;
  background:rgba(184,150,12,.08);
  border:1px solid rgba(184,150,12,.18);
  transition:background var(--t-med),border-color var(--t-med),transform var(--t-med);
  flex-shrink:0;
}
.ig-icon-box:hover{background:rgba(184,150,12,.16);border-color:rgba(184,150,12,.35);transform:scale(1.05);}
.ig-icon-box-sm{
  width:40px;height:40px;
  display:flex;align-items:center;justify-content:center;
  background:rgba(184,150,12,.08);
  border:1px solid rgba(184,150,12,.18);
  flex-shrink:0;
}

/* ── HOVER LINE CARD ────────────────────────── */
.hover-line-card{
  padding:1.5rem;
  border-bottom:1px solid var(--border);
  transition:background var(--t-fast),padding-left var(--t-fast),border-left-color var(--t-fast);
  border-left:3px solid transparent;
  cursor:pointer;
}
.hover-line-card:hover{
  background:rgba(184,150,12,.03);
  padding-left:1.75rem;
  border-left-color:var(--gold);
}

/* ── STAT CARD ROW ──────────────────────────── */
.stat-row{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  border:1px solid var(--border);
  background:#fff;
}
@media(max-width:860px){.stat-row{grid-template-columns:repeat(2,1fr);}}
@media(max-width:480px){.stat-row{grid-template-columns:1fr;}}
.stat-row-cell{
  padding:2.25rem 1.75rem;
  text-align:center;
  border-right:1px solid var(--border);
  transition:background var(--t-med);
  position:relative;
}
.stat-row-cell::after{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,var(--gold),transparent);
  opacity:0;transition:opacity var(--t-med);
}
.stat-row-cell:hover{background:rgba(184,150,12,.02);}
.stat-row-cell:hover::after{opacity:1;}
.stat-row-cell:last-child{border-right:none;}

/* ── PREMIUM INSIGHT ARTICLE CARD ───────────── */
.insight-card{
  background:#fff;border:1px solid var(--border-lt);overflow:hidden;
  transition:all var(--t-med);display:flex;flex-direction:column;
  position:relative;
}
.insight-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent);
  transform:scaleX(0);transform-origin:left;
  transition:transform var(--t-med);
}
.insight-card:hover{border-color:rgba(184,150,12,.3);box-shadow:0 16px 48px rgba(0,0,0,.09);transform:translateY(-4px);}
.insight-card:hover::before{transform:scaleX(1);}
.insight-card-img{overflow:hidden;position:relative;}
.insight-card-img img{transition:transform 5s cubic-bezier(.4,0,.2,1);width:100%;height:100%;object-fit:cover;display:block;}
.insight-card:hover .insight-card-img img{transform:scale(1.04);}

/* ── WORKS VERTICAL CARD ────────────────────── */
.works-card{
  background:#fff;border:1px solid var(--border);
  overflow:hidden;transition:all var(--t-med);
  position:relative;
}
.works-card::after{
  content:'';position:absolute;bottom:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent);
  transform:scaleX(0);transform-origin:left;
  transition:transform var(--t-med);
}
.works-card:hover{border-color:rgba(184,150,12,.25);box-shadow:0 12px 36px rgba(0,0,0,.09);transform:translateY(-3px);}
.works-card:hover::after{transform:scaleX(1);}

/* ── LEADERSHIP CARD ────────────────────────── */
.leader-card{
  background:#fff;border:1px solid var(--border);overflow:hidden;
  transition:all var(--t-med);
  position:relative;
}
.leader-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent);
  opacity:0;transition:opacity var(--t-med);
}
.leader-card:hover{border-color:rgba(184,150,12,.3);box-shadow:0 20px 60px rgba(0,0,0,.1);transform:translateY(-5px);}
.leader-card:hover::before{opacity:1;}

/* ── CONTACT CARD ───────────────────────────── */
.contact-info-card{
  border:1px solid var(--border);padding:1.75rem;
  background:#fff;
  transition:border-color var(--t-med),box-shadow var(--t-med);
}
.contact-info-card:hover{border-color:rgba(184,150,12,.25);box-shadow:0 8px 28px rgba(0,0,0,.07);}

/* ── MANDATE DETAIL HIGHLIGHTS ──────────────── */
.mandate-highlight{
  padding:1.25rem 1.5rem;background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.07);
  transition:background var(--t-fast),border-color var(--t-fast);
}
.mandate-highlight:hover{background:rgba(184,150,12,.08);border-color:rgba(184,150,12,.2);}

/* ── MAGAZINE FEATURE ───────────────────────── */
.magazine-feature{
  display:grid;grid-template-columns:1.6fr 1fr;gap:0;
  border:1px solid var(--border);overflow:hidden;
  transition:box-shadow var(--t-med),border-color var(--t-med);
}
.magazine-feature:hover{border-color:rgba(184,150,12,.3);box-shadow:0 20px 60px rgba(0,0,0,.09);}
@media(max-width:768px){.magazine-feature{grid-template-columns:1fr;}}
.magazine-feature-img{position:relative;overflow:hidden;min-height:360px;}
.magazine-feature-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 6s ease;}
.magazine-feature:hover .magazine-feature-img img{transform:scale(1.03);}

/* ── SCROLL INDICATOR ───────────────────────── */
.scroll-indicator{
  display:flex;flex-direction:column;align-items:center;gap:.5rem;
  position:absolute;bottom:2.5rem;left:50%;transform:translateX(-50%);
  z-index:10;
}
.scroll-indicator-line{
  width:1px;height:36px;
  background:linear-gradient(180deg,rgba(184,150,12,.5),transparent);
  animation:scrollPulse 2s ease-in-out infinite;
}
@keyframes scrollPulse{0%,100%{opacity:.4;height:28px}50%{opacity:.9;height:40px}}


/* ── Why India Gully cards ───────────────────── */
.why-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.75rem;}
@media(max-width:860px){.why-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){.why-grid{grid-template-columns:1fr;}}
.why-card{
  background:#fff;border:1px solid var(--border);padding:2.25rem 2rem;
  transition:border-color var(--t-med),box-shadow var(--t-med),transform var(--t-med);
  position:relative;overflow:hidden;
}
.why-card::before{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent);opacity:0;transition:opacity var(--t-med);}
.why-card:hover{border-color:rgba(184,150,12,.28);box-shadow:0 16px 48px rgba(0,0,0,.09);transform:translateY(-4px);}
.why-card:hover::before{opacity:1;}
.why-icon{width:54px;height:54px;display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem;transition:transform var(--t-med);}
.why-card:hover .why-icon{transform:scale(1.08);}

/* ── Home stats bar ──────────────────────────── */
#homeStats{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid var(--border);background:#fff;}
@media(max-width:900px){#homeStats{grid-template-columns:repeat(3,1fr);}}
@media(max-width:560px){#homeStats{grid-template-columns:repeat(2,1fr);}}
@media(max-width:400px){#homeStats{grid-template-columns:1fr;}}
.home-stat-cell{
  padding:2.25rem 1.5rem;text-align:center;border-right:1px solid var(--border);
  transition:background var(--t-med);position:relative;
}
.home-stat-cell::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent);opacity:0;transition:opacity var(--t-med);}
.home-stat-cell:hover{background:var(--parch);}
.home-stat-cell:hover::after{opacity:1;}
.home-stat-cell:last-child{border-right:none;}
@media(max-width:900px){.home-stat-cell:nth-child(3){border-right:none;}.home-stat-cell:nth-child(4){border-right:1px solid var(--border);}
  .home-stat-cell:nth-child(n+4){border-top:1px solid var(--border);}}
@media(max-width:560px){.home-stat-cell:nth-child(2n){border-right:none;}.home-stat-cell:nth-child(2n+1):not(:last-child){border-right:1px solid var(--border);}
  .home-stat-cell:nth-child(n+3){border-top:1px solid var(--border);}
  .home-stat-cell:nth-child(5){grid-column:1/-1;border-right:none;border-top:1px solid var(--border);}}
@media(max-width:400px){.home-stat-cell{border-right:none;border-bottom:1px solid var(--border);padding:1.5rem 1rem;}
  .home-stat-cell:last-child{border-bottom:none;}}

/* ── Brand logo grid ─────────────────────────── */
.brand-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:var(--border);}
@media(max-width:900px){.brand-grid{grid-template-columns:repeat(4,1fr);}}
@media(max-width:560px){.brand-grid{grid-template-columns:repeat(3,1fr);}}
@media(max-width:360px){.brand-grid{grid-template-columns:repeat(2,1fr);}}

/* ── Advisory partners grid ──────────────────── */
.partners-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;}
@media(max-width:560px){.partners-grid{grid-template-columns:1fr;}}
/* Partner card */
.partner-card{
  border:1px solid var(--border);padding:1.75rem;text-align:center;background:#fff;
  transition:border-color var(--t-med),box-shadow var(--t-med),transform var(--t-med);
}
.partner-card:hover{border-color:rgba(184,150,12,.3);box-shadow:0 10px 32px rgba(0,0,0,.08);transform:translateY(-3px);}

/* ── Featured mandates ───────────────────────── */
#featuredMandates{display:grid;grid-template-columns:repeat(3,1fr);gap:1.75rem;margin-bottom:1.75rem;}
@media(max-width:900px){#featuredMandates{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){#featuredMandates{grid-template-columns:1fr;}}

/* ── Track record grid ───────────────────────── */
#trackRecord{display:grid;grid-template-columns:repeat(3,1fr);gap:1.75rem;}
@media(max-width:900px){#trackRecord{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){#trackRecord{grid-template-columns:1fr;}}

/* ── Scroll-reveal ────────────────────────────── */
/* Default state stays visible so content never disappears if a later script fails. */
.reveal,.reveal-l,.reveal-r,.reveal-scale,.reveal-fast{opacity:1;transform:none;}
html.js .reveal{opacity:0;transform:translateY(28px);transition:opacity .75s cubic-bezier(.4,0,.2,1),transform .75s cubic-bezier(.4,0,.2,1);}
html.js .reveal.visible{opacity:1;transform:translateY(0);}
html.js .reveal-l{opacity:0;transform:translateX(-28px);transition:opacity .75s cubic-bezier(.4,0,.2,1),transform .75s cubic-bezier(.4,0,.2,1);}
html.js .reveal-l.visible{opacity:1;transform:translateX(0);}
html.js .reveal-r{opacity:0;transform:translateX(28px);transition:opacity .75s cubic-bezier(.4,0,.2,1),transform .75s cubic-bezier(.4,0,.2,1);}
html.js .reveal-r.visible{opacity:1;transform:translateX(0);}
html.js .reveal-scale{opacity:0;transform:scale(.95);transition:opacity .7s cubic-bezier(.4,0,.2,1),transform .7s cubic-bezier(.4,0,.2,1);}
html.js .reveal-scale.visible{opacity:1;transform:scale(1);}
/* Faster reveal variant */
html.js .reveal-fast{opacity:0;transform:translateY(18px);transition:opacity .5s cubic-bezier(.4,0,.2,1),transform .5s cubic-bezier(.4,0,.2,1);}
html.js .reveal-fast.visible{opacity:1;transform:translateY(0);}

/* ── Listing detail ──────────────────────────── */
.listing-detail-grid{display:grid;grid-template-columns:1fr 390px;gap:4rem;align-items:start;}
@media(max-width:900px){.listing-detail-grid{display:flex;flex-direction:column;gap:2.5rem;}}
.listing-detail-sidebar{position:sticky;top:calc(var(--nav-h) + 2rem);display:flex;flex-direction:column;gap:1.5rem;}
@media(max-width:900px){.listing-detail-sidebar{position:static;width:100%;}}

/* ── Highlights grid ─────────────────────────── */
.highlights-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);margin-bottom:2.5rem;}
@media(max-width:640px){.highlights-grid{grid-template-columns:repeat(2,1fr);}}

/* ── India Gully difference ──────────────────── */
/* diff-section always stays dark regardless of theme */
.diff-section{background:#0a0a10!important;}
.diff-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.15);}
@media(max-width:860px){.diff-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:480px){.diff-grid{grid-template-columns:1fr;}}
.diff-cell{padding:3rem 2.5rem;background:rgba(255,255,255,.06);border-right:none;transition:background var(--t-med);position:relative;overflow:hidden;}
.diff-cell::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent);opacity:0;transition:opacity var(--t-med);}
.diff-cell::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(184,150,12,.5),transparent);opacity:0;transition:opacity var(--t-med);}
.diff-cell:hover{background:rgba(255,255,255,.09);}
.diff-cell:hover::before,.diff-cell:hover::after{opacity:1;}
@media(max-width:860px){.diff-cell:nth-child(2n){border-right:none;}.diff-cell:nth-child(1),.diff-cell:nth-child(2){border-bottom:none;}}
@media(max-width:480px){.diff-cell{border-right:none!important;border-bottom:none;}.diff-cell:last-child{border-bottom:none;}}

/* ── Pipeline stats ──────────────────────────── */
#pipelineStats{display:grid;grid-template-columns:repeat(4,1fr);border-left:1px solid rgba(255,255,255,.06);}
@media(max-width:640px){#pipelineStats{grid-template-columns:repeat(2,1fr);}}

/* ── Mandate grid ────────────────────────────── */
#mandatesGrid{grid-template-columns:repeat(3,1fr)!important;align-items:start!important;}
@media(max-width:900px){#mandatesGrid{grid-template-columns:repeat(2,1fr)!important;}}
@media(max-width:560px){#mandatesGrid{grid-template-columns:1fr!important;}}

/* ── Works track record grid ─────────────────── */
.works-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;}
@media(max-width:900px){.works-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){.works-grid{grid-template-columns:1fr;}}

/* ── Insight grid ────────────────────────────── */
.insight-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.75rem;}
@media(max-width:900px){.insight-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){.insight-grid{grid-template-columns:1fr;}}

/* ── Team grid ───────────────────────────────── */
.team-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;}
@media(max-width:860px){.team-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){.team-grid{grid-template-columns:1fr;}}

/* ── HORECA category grid ────────────────────── */
.horeca-cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);}
@media(max-width:900px){.horeca-cat-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:480px){.horeca-cat-grid{grid-template-columns:1fr;}}
.horeca-cat-cell{background:#fff;padding:2rem 1.5rem;transition:all .25s;position:relative;overflow:hidden;cursor:default;}
.horeca-cat-cell:hover{background:var(--parch);box-shadow:0 8px 32px rgba(0,0,0,.06);}
.horeca-cat-cell:hover .horeca-cat-top{opacity:1;}
.horeca-cat-top{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),transparent);opacity:0;transition:opacity .25s;}

/* ── ig-callout-gold (premium gold CTA box) ─── */
.ig-callout-gold{background:linear-gradient(135deg,rgba(184,150,12,.08) 0%,rgba(184,150,12,.04) 100%);border:1px solid rgba(184,150,12,.25);padding:2.5rem;position:relative;overflow:hidden;}
.ig-callout-gold::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent);}

/* ── timeline-v (vertical milestone timeline) ─── */
.timeline-v { max-width:680px;margin:0 auto; }
.timeline-item { position:relative; }
@media(max-width:560px){
  .timeline-v .timeline-item { grid-template-columns:60px 28px 1fr !important; gap:0 .75rem !important; }
}

/* ── sector-tab (works / compare filter tabs) ─── */
.sector-tab-bar { display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.5rem; }
.sector-tab { padding:.4rem 1rem;border-radius:100px;font-size:.76rem;font-family:'DM Sans',sans-serif;font-weight:600;letter-spacing:.04em;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:rgba(255,255,255,.5);cursor:pointer;transition:all .2s; }
.sector-tab:hover { border-color:rgba(212,174,42,.4);color:rgba(255,255,255,.8); }
.sector-tab.active { background:rgba(212,174,42,.12);border-color:var(--gold);color:var(--gold); }

/* ── val-grid / val-card (valuation calculator) ── */
.val-grid{display:grid;grid-template-columns:1fr 360px;gap:2rem;align-items:start;}
@media(max-width:960px){.val-grid{grid-template-columns:1fr;}}
.val-card{background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.12);border-radius:16px;padding:1.75rem;margin-bottom:1.5rem;}
.val-card-title{font-family:'DM Serif Display',Georgia,serif;font-size:1.25rem;color:#fff;margin-bottom:.4rem;}
.val-card-sub{font-size:.85rem;color:rgba(255,255,255,.5);font-family:'DM Sans',sans-serif;line-height:1.6;margin-bottom:1.25rem;}

/* ── marquee (partner logo ticker) ──────────── */
.marquee-outer{overflow:hidden;position:relative;}
.marquee-outer::before,.marquee-outer::after{content:'';position:absolute;top:0;bottom:0;width:80px;z-index:2;pointer-events:none;}
.marquee-outer::before{left:0;background:linear-gradient(to right,var(--parch),transparent);}
.marquee-outer::after{right:0;background:linear-gradient(to left,var(--parch),transparent);}
.marquee-track{display:flex;gap:2.5rem;animation:marquee 28s linear infinite;width:max-content;align-items:center;}
.marquee-track:hover{animation-play-state:paused;}
@keyframes marquee{from{transform:translateX(0);}to{transform:translateX(-50%);}}
.marquee-item{white-space:nowrap;font-size:.82rem;font-family:'DM Sans',sans-serif;font-weight:600;color:var(--ink-soft);letter-spacing:.06em;padding:.4rem .8rem;border:1px solid var(--border);border-radius:6px;transition:color .2s,border-color .2s;}
.marquee-item:hover{color:var(--gold);border-color:rgba(184,150,12,.3);}
[data-theme="dark"] .marquee-outer::before{background:linear-gradient(to right,rgba(10,10,15,1),transparent);}
[data-theme="dark"] .marquee-outer::after{background:linear-gradient(to left,rgba(10,10,15,1),transparent);}
[data-theme="dark"] .marquee-item{color:rgba(255,255,255,.45);border-color:rgba(255,255,255,.08);}
[data-theme="dark"] .marquee-item:hover{color:var(--gold);border-color:rgba(212,174,42,.3);}

/* ── trust-row (logos / ratings strip) ──────── */
.trust-row{display:flex;align-items:center;gap:2rem;flex-wrap:wrap;padding:1.5rem 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.trust-item{display:flex;align-items:center;gap:.5rem;font-size:.78rem;font-family:'DM Sans',sans-serif;color:var(--ink-soft);}
.trust-item strong{color:var(--ink);}
[data-theme="dark"] .trust-row{border-top-color:rgba(255,255,255,.07);border-bottom-color:rgba(255,255,255,.07);}
[data-theme="dark"] .trust-item{color:rgba(255,255,255,.75);}
[data-theme="dark"] .trust-item strong{color:#fff;}

/* ── india-map-box (map section card) ────────── */
.india-map-box{background:linear-gradient(135deg,#f0ebe0 0%,#e8e1d0 100%);transition:background .3s;}
.india-map-wrap svg .india-land{fill:#e8ddc8;stroke:#b8a878;stroke-width:1.2;stroke-linejoin:round;}
.india-map-wrap svg text{fill:#444;}
/* Map pin group transitions — supports auto-cycle animation */
.map-pin-group{transition:opacity .4s ease, transform .4s ease;transform-box:fill-box;transform-origin:center center;}

/* ── tel-card (quick dial team card) ─────────── */
.tel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.25rem;}
.tel-card{background:rgba(255,255,255,.03);border:1.5px solid rgba(255,255,255,.08);border-radius:14px;padding:1.25rem 1.5rem;display:flex;gap:1rem;align-items:flex-start;transition:border-color .2s,background .2s;}
.tel-card:hover{border-color:rgba(212,174,42,.3);background:rgba(212,174,42,.04);}
.tel-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid rgba(212,174,42,.25);}
.tel-name{font-family:'DM Serif Display',Georgia,serif;font-size:1rem;color:#fff;margin-bottom:.2rem;}
.tel-title{font-size:.76rem;color:var(--gold);font-family:'DM Sans',sans-serif;font-weight:600;margin-bottom:.4rem;}
.tel-contact{display:flex;flex-direction:column;gap:.2rem;}
.tel-link{font-size:.82rem;color:rgba(255,255,255,.6);font-family:'DM Sans',sans-serif;text-decoration:none;transition:color .2s;}
.tel-link:hover{color:var(--gold);}

/* ── test-wall (testimonials) ────────────────── */
.test-wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.5rem;}
.test-card{background:rgba(255,255,255,.03);border:1.5px solid rgba(255,255,255,.08);border-radius:16px;padding:1.75rem;position:relative;transition:border-color .2s,transform .2s;}
.test-card:hover{border-color:rgba(212,174,42,.25);transform:translateY(-2px);}
.test-card::before{content:'"';position:absolute;top:.75rem;right:1.25rem;font-family:'DM Serif Display',Georgia,serif;font-size:4rem;color:rgba(212,174,42,.12);line-height:1;}
.test-quote{font-size:.92rem;color:rgba(255,255,255,.7);font-family:'DM Sans',sans-serif;line-height:1.7;margin-bottom:1.25rem;font-style:italic;}
.test-author{display:flex;align-items:center;gap:.75rem;}
.test-avatar{width:40px;height:40px;border-radius:50%;background:rgba(212,174,42,.15);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;}
.test-name{font-weight:700;font-size:.88rem;color:#fff;font-family:'DM Sans',sans-serif;}
.test-role{font-size:.76rem;color:rgba(255,255,255,.45);font-family:'DM Sans',sans-serif;}
.test-sector{display:inline-flex;align-items:center;gap:.3rem;font-size:.7rem;font-family:'DM Sans',sans-serif;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:.2rem .6rem;border-radius:100px;margin-top:.4rem;}

/* ── sla-badge (response time indicator) ─────── */
.sla-badge{display:inline-flex;align-items:center;gap:.35rem;background:rgba(22,163,74,.1);border:1px solid rgba(22,163,74,.25);color:#15803d;border-radius:100px;padding:.25rem .75rem;font-size:.72rem;font-family:'DM Sans',sans-serif;font-weight:600;letter-spacing:.05em;}
.sla-badge::before{content:'';width:6px;height:6px;border-radius:50%;background:#15803d;animation:pulse 2s infinite;}
[data-theme="dark"] .sla-badge{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.25);color:#4ade80;}
[data-theme="dark"] .sla-badge::before{background:#4ade80;}

/* ── scroll-progress bar ──────────────────────── */
#ig-scroll-prog{position:fixed;top:0;left:0;height:3px;width:0%;background:linear-gradient(90deg,var(--gold),rgba(212,174,42,.7));z-index:10000;transition:width .1s linear;pointer-events:none;}

/* ── contact-bubble (multi-action FAB) ─────────── */
#ig-contact-fab{position:fixed;bottom:1.75rem;right:1.75rem;z-index:9000;display:flex;flex-direction:column;align-items:flex-end;gap:.6rem;}
#ig-fab-main{width:56px;height:56px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.45);border:none;cursor:pointer;transition:transform .2s,box-shadow .2s;flex-shrink:0;}
#ig-fab-main:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(37,211,102,.6);}
#ig-fab-main i{font-size:1.25rem;color:#fff;transition:transform .3s;}
#ig-fab-main.open i.fa-whatsapp{display:none;}
#ig-fab-main.open i.fa-times{display:block!important;}
.ig-fab-action{display:flex;align-items:center;gap:.65rem;opacity:0;transform:translateY(10px) scale(.9);transition:opacity .2s,transform .2s;pointer-events:none;}
.ig-fab-action.show{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}
.ig-fab-action a{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 14px rgba(0,0,0,.22);text-decoration:none;transition:transform .2s;}
.ig-fab-action a:hover{transform:scale(1.1);}
.ig-fab-label{background:#0a0a0a;color:#fff;font-size:.68rem;font-weight:600;letter-spacing:.06em;padding:.28rem .65rem;border-radius:4px;white-space:nowrap;pointer-events:none;}
@media print{#ig-contact-fab,#ig-scroll-prog{display:none!important;}}

/* ── mobile sticky bottom bar ─────────────────── */
#ig-mob-bar{display:none;position:fixed;bottom:0;left:0;right:0;z-index:8900;background:#0c0c18;border-top:1px solid rgba(184,150,12,.25);padding:.55rem .75rem calc(.55rem + env(safe-area-inset-bottom));gap:.5rem;}
#ig-mob-bar a,#ig-mob-bar button{flex:1;display:flex;align-items:center;justify-content:center;gap:.4rem;padding:.55rem .25rem;font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;border:none;cursor:pointer;transition:opacity .18s;}
#ig-mob-bar .mob-wa{background:#25D366;color:#fff;}
#ig-mob-bar .mob-call{background:rgba(184,150,12,.18);border:1px solid rgba(184,150,12,.35);color:#fbbf24;}
#ig-mob-bar .mob-enq{background:var(--gold);color:#fff;}
#ig-mob-bar a:active,#ig-mob-bar button:active{opacity:.75;}
@media(max-width:767px){
  #ig-mob-bar{display:flex;}
  #ig-contact-fab{display:none!important;}
  body{padding-bottom:calc(52px + env(safe-area-inset-bottom));}
}
@media print{#ig-mob-bar{display:none!important;}}

/* ── ig-step (numbered step) ────────────────── */
.ig-step{display:flex;gap:1.5rem;align-items:flex-start;padding:1.75rem 0;border-bottom:1px solid var(--border);}
.ig-step:last-child{border-bottom:none;}
.ig-step-num{width:48px;height:48px;background:var(--gold);display:flex;align-items:center;justify-content:center;font-family:'DM Serif Display',Georgia,serif;font-size:1.1rem;color:#fff;flex-shrink:0;}
.ig-step-body{}
.ig-step-title{font-family:'DM Serif Display',Georgia,serif;font-size:1.1rem;color:var(--ink);margin-bottom:.4rem;}
.ig-step-desc{font-size:.85rem;color:var(--ink-muted);line-height:1.8;}

/* ── ig-properties-grid ──────────────────────── */
.ig-prop-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:var(--border);}
@media(max-width:900px){.ig-prop-grid{grid-template-columns:repeat(4,1fr);}}
@media(max-width:560px){.ig-prop-grid{grid-template-columns:repeat(2,1fr);}}
.ig-prop-cell{background:#fff;padding:1.25rem 1rem;text-align:center;font-size:.7rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-muted);line-height:1.4;transition:background .2s;}
.ig-prop-cell:hover{background:var(--gold-pale);}

/* ── Track record vertical sections ─────────── */
.tr-section-grid{display:grid;grid-template-columns:280px 1fr;gap:0;}
@media(max-width:860px){
  .tr-section-grid{grid-template-columns:1fr!important;display:block!important;}
  .tr-section-sidebar{border-right:none!important;border-bottom:1px solid rgba(255,255,255,.07)!important;padding-bottom:1.5rem!important;margin-bottom:1.5rem!important;}
}

/* ── Service item ────────────────────────────── */
.service-item{
  display:flex;align-items:flex-start;gap:.625rem;
  padding:.75rem 1rem;background:var(--parch);border:1px solid var(--border);
  transition:background var(--t-fast),border-color var(--t-fast);
}
.service-item:hover{background:rgba(184,150,12,.05);border-color:rgba(184,150,12,.2);}

/* ── Image gallery ───────────────────────────── */
.detail-car{position:relative;height:520px;overflow:hidden;background:#111;}
@media(max-width:768px){.detail-car{height:320px!important;}}
.car2-track{display:flex;height:100%;transition:transform var(--t-cinema);}
.car2-slide{flex:0 0 100%;position:relative;overflow:hidden;}
.car2-slide img{width:100%;height:100%;object-fit:cover;transition:transform 8s cubic-bezier(.4,0,.2,1);}
.car2-slide.on img{transform:scale(1.03);}
.tn-strip{display:flex;gap:.5rem;overflow-x:auto;padding:.75rem 0;scrollbar-width:none;}
.tn-strip::-webkit-scrollbar{display:none;}
.tn-thumb{width:80px;height:58px;overflow:hidden;flex-shrink:0;cursor:pointer;border:2px solid transparent;transition:border-color .2s,opacity .2s;opacity:.6;}
.tn-thumb.on{border-color:var(--gold);opacity:1;}
.tn-thumb img{width:100%;height:100%;object-fit:cover;}
</style>
</head>
<body class="${opts?.bodyClass || ''}">
<!-- SCROLL PROGRESS BAR -->
<div id="ig-scroll-prog" aria-hidden="true"></div>
<a href="#main-content" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;" onfocus="this.style.cssText='position:fixed;left:1rem;top:1rem;z-index:99999;background:var(--gold);color:#fff;padding:.5rem 1rem;font-size:.85rem;font-weight:700;text-decoration:none;'" onblur="this.style.cssText='position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;'">Skip to main content</a>
${opts?.noNav ? '' : NAV}
<main id="main-content" role="main" aria-label="Main content" tabindex="-1">
${content}
</main>
${opts?.noFooter ? '' : FOOTER}
<!-- BACK TO TOP -->
<button id="btt" aria-label="Back to top" title="Back to top">
  <i class="fas fa-chevron-up"></i>
</button>
<!-- MULTI-ACTION CONTACT FAB -->
${opts?.noNav ? '' : `<div id="ig-contact-fab" aria-label="Contact India Gully">
  <div class="ig-fab-action" id="fab-act-email" style="transition-delay:.12s;">
    <span class="ig-fab-label">Email Us</span>
    <a href="mailto:info@indiagully.com" aria-label="Email India Gully" style="background:#1A3A6B;">
      <i class="fas fa-envelope" style="color:#fff;font-size:.9rem;"></i>
    </a>
  </div>
  <div class="ig-fab-action" id="fab-act-call" style="transition-delay:.08s;">
    <span class="ig-fab-label">Call Us</span>
    <a href="tel:+918988988988" aria-label="Call India Gully" style="background:var(--gold);">
      <i class="fas fa-phone-alt" style="color:#fff;font-size:.85rem;"></i>
    </a>
  </div>
  <div class="ig-fab-action" id="fab-act-wa" style="transition-delay:.04s;">
    <span class="ig-fab-label">WhatsApp</span>
    <a href="https://wa.me/918988988988?text=Hi%20India%20Gully%2C%20I%20would%20like%20to%20discuss%20a%20mandate." target="_blank" rel="noopener" aria-label="WhatsApp India Gully" style="background:#25D366;">
      <i class="fab fa-whatsapp" style="color:#fff;font-size:1rem;"></i>
    </a>
  </div>
  <button id="ig-fab-main" aria-label="Contact options" aria-expanded="false" onclick="igFabToggle()">
    <i class="fab fa-whatsapp"></i>
    <i class="fas fa-times" style="display:none;"></i>
  </button>
</div>`}
<!-- MOBILE STICKY BOTTOM BAR -->
${opts?.noNav ? '' : `<nav id="ig-mob-bar" aria-label="Quick contact">
  <a href="https://wa.me/918988988988?text=Hi%20India%20Gully%2C%20I%20would%20like%20to%20discuss%20a%20mandate." target="_blank" rel="noopener" class="mob-wa" aria-label="WhatsApp India Gully">
    <i class="fab fa-whatsapp" style="font-size:.85rem;"></i>WhatsApp
  </a>
  <a href="tel:+918988988988" class="mob-call" aria-label="Call India Gully">
    <i class="fas fa-phone-alt" style="font-size:.75rem;"></i>Call
  </a>
  <a href="/contact" class="mob-enq" aria-label="Send enquiry">
    <i class="fas fa-paper-plane" style="font-size:.75rem;"></i>Enquire
  </a>
</nav>`}
<!-- COMMAND-K SEARCH PALETTE -->
<div id="ig-search-overlay" role="dialog" aria-modal="true" aria-label="Search" onclick="if(event.target===this)igSearchClose()">
  <div id="ig-search-box">
    <div id="ig-search-header">
      <i class="fas fa-search"></i>
      <input id="ig-search-input" type="text" placeholder="Search mandates, articles, pages…" autocomplete="off" spellcheck="false" oninput="igSearchQuery(this.value)" onkeydown="igSearchKey(event)">
      <span id="ig-search-shortcut"><kbd>Esc</kbd> to close</span>
    </div>
    <div id="ig-search-results"></div>
    <div id="ig-search-footer">
      <span><kbd>↑↓</kbd> navigate</span>
      <span><kbd>Enter</kbd> open</span>
      <span><kbd>Esc</kbd> close</span>
    </div>
  </div>
</div>
<!-- LIGHTBOX -->
<div id="ig-lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
  <button id="ig-lightbox-close" aria-label="Close image viewer" onclick="igLightboxClose()"><i class="fas fa-times"></i></button>
  <button id="ig-lightbox-prev" aria-label="Previous image" onclick="igLightboxNav(-1)"><i class="fas fa-chevron-left"></i></button>
  <img id="ig-lightbox-img" src="" alt="">
  <button id="ig-lightbox-next" aria-label="Next image" onclick="igLightboxNav(1)"><i class="fas fa-chevron-right"></i></button>
  <div id="ig-lightbox-caption"></div>
</div>
<!-- STICKY STATS -->
<div id="stickyStats" aria-hidden="true">
  <div class="wrap" style="padding-top:0;padding-bottom:0;">
    <div style="display:flex;align-items:center;justify-content:space-between;overflow-x:auto;gap:0;">
      ${[
        {n:'₹2,100 Cr+',l:'Pipeline'},
        {n:'15+',        l:'Hotels'},
        {n:'35+',        l:'Retail Brands'},
        {n:'20+',        l:'Hotel Brands'},
        {n:'Pan-India',  l:'Reach'},
      ].map(s=>`<div class="sticky-stat"><div class="sticky-stat-n">${s.n}</div><div class="sticky-stat-l">${s.l}</div></div>`).join('<div style="width:1px;height:32px;background:rgba(255,255,255,.07);flex-shrink:0;"></div>')}
      <a href="/listings" style="margin-left:auto;flex-shrink:0;padding:.4rem 1rem;font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;background:var(--gold);color:#fff;white-space:nowrap;">View Mandates</a>
    </div>
  </div>
</div>
${SCRIPTS(opts?.cspNonce)}
</body>
</html>`
}

// ── NAVIGATION ─────────────────────────────────────────────────────────────
const NAV = `
<div class="nav-sp"></div>
<nav id="mainNav" class="nav-clear">
  <div style="max-width:1280px;margin:0 auto;padding:0 1.25rem;height:100%;display:flex;align-items:center;justify-content:space-between;">

    <!-- LOGO -->
    <a href="/" style="display:flex;align-items:center;flex-shrink:0;" aria-label="India Gully — Home">
      <img src="data:image/png;base64,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"
           alt="India Gully — Celebrating Desiness"
           height="38"
           style="height:38px;width:auto;max-width:200px;object-fit:contain;object-position:left center;display:block;"
           draggable="false"
           fetchpriority="high"
           decoding="async" onerror="this.onerror=null;this.style.display='none'">
    </a>

    <!-- DESKTOP NAV — 6 top-level items only -->
    <div id="nav-desktop-links" style="gap:.05rem;">
      <a href="/"         class="n-lk">Home</a>
      <a href="/about"    class="n-lk">About</a>

      <!-- Advisory & Services dropdown -->
      <div class="relative n-par" style="position:relative;">
        <button class="n-lk" style="display:flex;align-items:center;gap:.35rem;">Advisory <i class="fas fa-chevron-down" style="font-size:.48rem;opacity:.4;"></i></button>
        <div class="n-drop" style="min-width:16rem;">
          <div style="padding:.5rem 1.2rem .25rem;font-size:.56rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.28);">Services</div>
          <a href="/services#real-estate"   class="n-di"><i class="fas fa-landmark"     style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Real Estate</a>
          <a href="/services#hospitality"   class="n-di"><i class="fas fa-hotel"        style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Hospitality</a>
          <a href="/services#retail"        class="n-di"><i class="fas fa-store"        style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Retail &amp; Leasing</a>
          <a href="/services#entertainment" class="n-di"><i class="fas fa-ticket-alt"   style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Entertainment</a>
          <a href="/services#debt"          class="n-di"><i class="fas fa-balance-scale" style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Debt &amp; Special</a>
          <a href="/horeca"                 class="n-di"><i class="fas fa-utensils"     style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>HORECA Solutions</a>
          <div style="height:1px;background:rgba(255,255,255,.06);margin:.3rem 0;"></div>
          <div style="padding:.25rem 1.2rem .2rem;font-size:.56rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.28);">Tools</div>
          <a href="/valuation"   class="n-di"><i class="fas fa-chart-bar"   style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Valuation Calculator</a>
          <a href="/compare"     class="n-di"><i class="fas fa-columns"     style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Compare Mandates</a>
          <a href="/market-data" class="n-di"><i class="fas fa-chart-line"  style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Market Data</a>
        </div>
      </div>

      <a href="/listings" class="n-lk">Mandates</a>
      <a href="/insights" class="n-lk">Insights</a>

      <!-- More dropdown -->
      <div class="relative n-par" style="position:relative;">
        <button class="n-lk" style="display:flex;align-items:center;gap:.35rem;">More <i class="fas fa-chevron-down" style="font-size:.48rem;opacity:.4;"></i></button>
        <div class="n-drop" style="right:0;left:auto;min-width:12rem;">
          <a href="/works"        class="n-di"><i class="fas fa-trophy"       style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Our Work</a>
          <a href="/invest"       class="n-di"><i class="fas fa-chart-line"   style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Investor Relations</a>
          <a href="/pipeline"     class="n-di"><i class="fas fa-stream"        style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Pipeline Dashboard</a>
          <a href="/resources"    class="n-di"><i class="fas fa-book-open"    style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Resources</a>
          <a href="/testimonials" class="n-di"><i class="fas fa-star"         style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Testimonials</a>
          <a href="/careers"      class="n-di"><i class="fas fa-briefcase"    style="width:16px;font-size:.72rem;color:rgba(184,150,12,.6);"></i>Careers</a>
        </div>
      </div>

      <a href="/contact" class="n-lk">Contact</a>
    </div>

    <!-- RIGHT -->
    <div id="nav-desktop-right" style="gap:.6rem;">
      <!-- Search Button -->
      <button onclick="igSearchOpen()" aria-label="Search" title="Search (Ctrl+K / ⌘K)"
              style="color:rgba(255,255,255,.55);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);padding:.35rem .55rem;cursor:pointer;font-size:.72rem;transition:all .2s;display:flex;align-items:center;gap:.4rem;"
              onmouseover="this.style.borderColor='rgba(184,150,12,.4)';this.style.color='#fbbf24'" onmouseout="this.style.borderColor='rgba(255,255,255,.12)';this.style.color='rgba(255,255,255,.55)'">
        <i class="fas fa-search" style="font-size:.68rem;"></i>
        <span style="font-size:.58rem;opacity:.6;">⌘K</span>
      </button>
      <!-- Dark Mode Toggle -->
      <button id="dark-toggle" onclick="igToggleDark()" aria-label="Toggle dark mode"
              style="color:rgba(255,255,255,.55);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);padding:.35rem .55rem;cursor:pointer;font-size:.72rem;transition:all .2s;"
              title="Toggle dark mode">
        <i id="dark-icon" class="fas fa-moon"></i>
      </button>
      <!-- Portals dropdown -->
      <div class="relative n-par" style="position:relative;">
        <button class="n-lk" style="display:flex;align-items:center;gap:.4rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);padding:.38rem .8rem;">
          <i class="fas fa-lock" style="font-size:.5rem;color:var(--gold);"></i>Portals
          <i class="fas fa-chevron-down" style="font-size:.45rem;opacity:.4;"></i>
        </button>
        <div class="n-drop" style="right:0;left:auto;min-width:12rem;">
          <a href="/portal/client"   class="n-di"><i class="fas fa-user-tie"   style="color:var(--gold);width:14px;font-size:.7rem;"></i>Client Portal</a>
          <a href="/portal/employee" class="n-di"><i class="fas fa-users"      style="color:var(--gold);width:14px;font-size:.7rem;"></i>Employee Portal</a>
          <a href="/portal/board"    class="n-di"><i class="fas fa-gavel"      style="color:var(--gold);width:14px;font-size:.7rem;"></i>Board &amp; KMP</a>
          <div style="height:1px;background:rgba(255,255,255,.06);margin:.2rem 0;"></div>
          <a href="/admin"           class="n-di"><i class="fas fa-shield-alt" style="color:var(--gold);width:14px;font-size:.7rem;"></i>Super Admin</a>
        </div>
      </div>
      <a href="/contact" class="btn btn-g" style="padding:.5rem 1.2rem;font-size:.72rem;">Submit Mandate</a>
    </div>

    <!-- HAMBURGER -->
    <button id="mobileBtn" style="color:#fff;padding:.5rem;background:none;border:none;cursor:pointer;">
      <i class="fas fa-bars" style="font-size:1.05rem;"></i>
    </button>
  </div>

  <!-- MOBILE MENU -->
  <div id="mobileMenu" style="display:none;background:rgba(6,6,6,.98);border-top:1px solid rgba(255,255,255,.06);">
    <div style="padding:1rem 1.25rem;display:flex;flex-direction:column;gap:.1rem;">
      <a href="/"            style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">Home</a>
      <a href="/about"       style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">About</a>
      <a href="/services"    style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">Advisory Services</a>
      <a href="/horeca"      style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">HORECA Solutions</a>
      <a href="/listings"    style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">Mandates</a>
      <a href="/insights"    style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">Insights</a>
      <a href="/works"       style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">Our Work</a>
      <a href="/invest"      style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">Investor Relations</a>
      <a href="/valuation"   style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">Valuation Tool</a>
      <a href="/market-data" style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">Market Data</a>
      <a href="/compare"     style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">Compare Mandates</a>
      <a href="/resources"   style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">Resources</a>
      <a href="/testimonials" style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">Testimonials</a>
      <a href="/careers"     style="display:block;padding:.65rem 0;font-size:.875rem;color:rgba(255,255,255,.7);border-bottom:1px solid rgba(255,255,255,.04);">Careers</a>
      <a href="/contact"     style="display:block;padding:.65rem 0;font-size:.875rem;color:var(--gold);">Contact Us</a>
      <div style="padding-top:.75rem;display:flex;flex-direction:column;gap:.4rem;border-top:1px solid rgba(255,255,255,.06);margin-top:.2rem;">
        <a href="/portal/client"   style="font-size:.78rem;color:rgba(255,255,255,.45);display:flex;align-items:center;gap:.5rem;"><i class="fas fa-lock" style="color:var(--gold);font-size:.58rem;width:14px;"></i>Client Portal</a>
        <a href="/portal/employee" style="font-size:.78rem;color:rgba(255,255,255,.45);display:flex;align-items:center;gap:.5rem;"><i class="fas fa-lock" style="color:var(--gold);font-size:.58rem;width:14px;"></i>Employee Portal</a>
        <a href="/portal/board"    style="font-size:.78rem;color:rgba(255,255,255,.45);display:flex;align-items:center;gap:.5rem;"><i class="fas fa-lock" style="color:var(--gold);font-size:.58rem;width:14px;"></i>Board &amp; KMP</a>
      </div>
    </div>
  </div>
</nav>`

// ── FOOTER ──────────────────────────────────────────────────────────────────
const FOOTER = `
<footer style="background:#060606;border-top:1px solid rgba(184,150,12,.15);position:relative;overflow:hidden;">
  <!-- Footer background grid -->
  <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(184,150,12,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(184,150,12,.02) 1px,transparent 1px);background-size:80px 80px;pointer-events:none;"></div>
  <!-- Footer radial glow -->
  <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:600px;height:300px;background:radial-gradient(ellipse,rgba(184,150,12,.04) 0%,transparent 70%);pointer-events:none;"></div>

  <!-- Top contact strip -->
  <div style="position:relative;border-bottom:1px solid rgba(255,255,255,.04);">
    <div class="wrap" style="padding-top:2rem;padding-bottom:2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.5rem;">
      <div style="display:flex;align-items:center;gap:.875rem;">
        <div style="width:40px;height:1px;background:linear-gradient(90deg,var(--gold),transparent);flex-shrink:0;"></div>
        <span style="font-size:.58rem;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:rgba(184,150,12,.7);">India Gully Advisory · New Delhi, India</span>
      </div>
      <div style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;">
        <a href="tel:+918988988988" style="display:flex;align-items:center;gap:.55rem;font-size:.78rem;color:rgba(255,255,255,.55);transition:color .2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='rgba(255,255,255,.55)'"><i class="fas fa-phone" style="color:var(--gold);font-size:.6rem;"></i>+91 8988 988 988</a>
        <a href="mailto:info@indiagully.com" style="display:flex;align-items:center;gap:.55rem;font-size:.78rem;color:rgba(255,255,255,.55);transition:color .2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='rgba(255,255,255,.55)'"><i class="fas fa-envelope" style="color:var(--gold);font-size:.6rem;"></i>info@indiagully.com</a>
        <a href="/contact" class="btn btn-g btn-sm" style="font-size:.6rem;">Submit Mandate <i class="fas fa-arrow-right" style="font-size:.55rem;"></i></a>
      </div>
    </div>
  </div>

  <!-- Main footer grid -->
  <div class="wrap footer-grid" style="position:relative;padding-top:4.5rem;padding-bottom:3rem;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:3.5rem;">

    <!-- Brand column -->
    <div>
      <div style="margin-bottom:1.5rem;">
        <img src="data:image/png;base64,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"
             alt="India Gully — Celebrating Desiness"
             height="34"
             style="height:34px;width:auto;max-width:200px;object-fit:contain;object-position:left center;display:block;"
             draggable="false"
             decoding="async" onerror="this.onerror=null;this.style.display='none'">
      </div>
      <p style="font-size:.82rem;color:rgba(255,255,255,.55);line-height:1.85;max-width:300px;margin-bottom:1.5rem;">India's premier multi-vertical advisory firm. Strategy, transactions and enablement across Real Estate, Retail, Hospitality, Entertainment and HORECA.</p>
      
      <!-- Credentials strip -->
      <div style="padding:1rem 1.25rem;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);margin-bottom:1.25rem;">
        <p style="font-size:.6rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(184,150,12,.65);margin-bottom:.5rem;">Institutional Credibility</p>
        <div style="display:flex;flex-wrap:wrap;gap:.4rem;">
          ${['EY Co-Advisory','CBRE Co-Advisory','ANAROCK Network','₹2,000 Cr+ Transacted'].map(t=>`<span style="font-size:.58rem;background:rgba(184,150,12,.08);border:1px solid rgba(184,150,12,.15);color:rgba(255,255,255,.5);padding:.18rem .5rem;">${t}</span>`).join('')}
        </div>
      </div>
      
      <p style="font-size:.68rem;color:rgba(255,255,255,.35);line-height:1.7;">Vivacious Entertainment and Hospitality Pvt. Ltd.<br>CIN: U74999DL2017PTC323237 · New Delhi, India</p>
    </div>

    <!-- Advisory column -->
    <div>
      <p style="font-size:.6rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(184,150,12,.7);margin-bottom:1.1rem;display:flex;align-items:center;gap:.5rem;"><span style="width:16px;height:1px;background:rgba(184,150,12,.5);display:inline-block;"></span>Advisory</p>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:.55rem;">
        ${[['Real Estate','/services#real-estate'],['Retail &amp; Leasing','/services#retail'],['Hospitality','/services#hospitality'],['Entertainment','/services#entertainment'],['Debt &amp; Special','/services#debt'],['HORECA Solutions','/horeca']].map(([s,h])=>`<li><a href="${h}" style="font-size:.8rem;color:rgba(255,255,255,.5);transition:color .2s;display:flex;align-items:center;gap:.4rem;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,.5)'"><span style="width:4px;height:4px;background:rgba(184,150,12,.4);border-radius:50%;flex-shrink:0;display:inline-block;"></span>${s}</a></li>`).join('')}
      </ul>
    </div>

    <!-- Platform column -->
    <div>
      <p style="font-size:.6rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(184,150,12,.7);margin-bottom:1.1rem;display:flex;align-items:center;gap:.5rem;"><span style="width:16px;height:1px;background:rgba(184,150,12,.5);display:inline-block;"></span>Platform</p>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:.55rem;">
        ${[['Active Mandates','/listings'],['Compare Mandates','/compare'],['Pipeline Dashboard','/pipeline'],['Our Work','/works'],['Investor Relations','/invest'],['Insights','/insights'],['Market Data','/market-data'],['Valuation Tool','/valuation'],['Resources','/resources'],['Careers','/careers'],['Client Testimonials','/testimonials'],['Submit Mandate','/contact'],['About Us','/about'],['Client Portal','/portal/client'],['Employee Portal','/portal/employee'],['Board Portal','/portal/board']].map(([l,h])=>`<li><a href="${h}" style="font-size:.8rem;color:rgba(255,255,255,.5);transition:color .2s;display:flex;align-items:center;gap:.4rem;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,.5)'"><span style="width:4px;height:4px;background:rgba(184,150,12,.4);border-radius:50%;flex-shrink:0;display:inline-block;"></span>${l}</a></li>`).join('')}
      </ul>
    </div>

    <!-- Contact column -->
    <div>
      <p style="font-size:.6rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(184,150,12,.7);margin-bottom:1.1rem;display:flex;align-items:center;gap:.5rem;"><span style="width:16px;height:1px;background:rgba(184,150,12,.5);display:inline-block;"></span>Leadership</p>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:.6rem;">
        ${[
          {n:'Arun Manikonda',t:'Managing Director',e:'akm@indiagully.com',p:'+91 98108 89134'},
          {n:'Pavan Manikonda',t:'Executive Director',e:'pavan@indiagully.com',p:'+91 62825 56067'},
          {n:'Amit Jhingan',t:'President, Real Estate',e:'amit.jhingan@indiagully.com',p:'+91 98999 93543'},
        ].map(l=>`<li style="padding:.625rem 0;border-bottom:1px solid rgba(255,255,255,.04);">
          <div style="font-size:.78rem;font-weight:600;color:rgba(255,255,255,.75);margin-bottom:.1rem;">${l.n}</div>
          <div style="font-size:.62rem;color:rgba(255,255,255,.4);margin-bottom:.3rem;">${l.t}</div>
          <a href="mailto:${l.e}" style="font-size:.7rem;color:rgba(184,150,12,.65);display:block;transition:color .2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='rgba(184,150,12,.65)'">${l.e}</a>
        </li>`).join('')}
      </ul>
    </div>
  </div>

  <!-- Bottom bar -->
  <div style="position:relative;border-top:1px solid rgba(255,255,255,.04);">
    <div class="wrap" style="padding-top:1rem;padding-bottom:1rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.875rem;">
      <p style="font-size:.65rem;color:rgba(255,255,255,.38);">© 2026 Vivacious Entertainment and Hospitality Pvt. Ltd. All rights reserved. India Gully™ is a registered brand.</p>
      <div style="display:flex;gap:1.5rem;font-size:.65rem;color:rgba(255,255,255,.38);align-items:center;flex-wrap:wrap;">
        <a href="/legal/privacy"    style="transition:color .2s;" onmouseover="this.style.color='rgba(184,150,12,.8)'" onmouseout="this.style.color='rgba(255,255,255,.38)'">Privacy Policy</a>
        <a href="/legal/terms"      style="transition:color .2s;" onmouseover="this.style.color='rgba(184,150,12,.8)'" onmouseout="this.style.color='rgba(255,255,255,.38)'">Terms of Use</a>
        <a href="/legal/disclaimer" style="transition:color .2s;" onmouseover="this.style.color='rgba(184,150,12,.8)'" onmouseout="this.style.color='rgba(255,255,255,.38)'">Disclaimer</a>
        <span style="color:rgba(255,255,255,.2);">GSTIN: 07AAGCV0867P1ZN</span>
        <button onclick="igStartTour && igStartTour()" aria-label="Start guided tour"
                style="background:none;border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.45);padding:.22rem .6rem;font-size:.6rem;cursor:pointer;transition:all .2s;"
                onmouseover="this.style.borderColor='var(--gold)';this.style.color='var(--gold)'" onmouseout="this.style.borderColor='rgba(255,255,255,.18)';this.style.color='rgba(255,255,255,.45)'">
          <i class="fas fa-compass" style="margin-right:.3rem;"></i>Tour
        </button>
      </div>
    </div>
  </div>
</footer>`

// ── SCRIPTS ─────────────────────────────────────────────────────────────────
const SCRIPTS = (_nonce?: string) => `
<script>
(function(){
  /* NAV SCROLL */
  var nav = document.getElementById('mainNav');
  function updNav(){
    if(!nav) return;
    if(window.scrollY > 60){ nav.classList.remove('nav-clear'); nav.classList.add('nav-solid'); }
    else                   { nav.classList.remove('nav-solid'); nav.classList.add('nav-clear'); }
  }
  updNav();
  window.addEventListener('scroll', updNav, {passive:true});

  /* SCROLL PROGRESS BAR */
  var prog = document.getElementById('ig-scroll-prog');
  if(prog){
    window.addEventListener('scroll', function(){
      var scrollTop = window.scrollY;
      var docH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = docH > 0 ? Math.min((scrollTop / docH) * 100, 100) : 0;
      prog.style.width = pct + '%';
    }, {passive:true});
  }

  /* MULTI-ACTION FAB */
  function igFabToggle(){
    var fab = document.getElementById('ig-fab-main');
    var actions = document.querySelectorAll('.ig-fab-action');
    var isOpen = fab && fab.classList.contains('open');
    if(fab){ fab.classList.toggle('open', !isOpen); fab.setAttribute('aria-expanded', String(!isOpen)); }
    actions.forEach(function(a){ a.classList.toggle('show', !isOpen); });
  }
  window.igFabToggle = igFabToggle;
  /* Close FAB when clicking outside */
  document.addEventListener('click', function(e){
    var fab = document.getElementById('ig-contact-fab');
    var btn = document.getElementById('ig-fab-main');
    if(fab && btn && !fab.contains(e.target)){ btn.classList.remove('open'); btn.setAttribute('aria-expanded','false'); document.querySelectorAll('.ig-fab-action').forEach(function(a){ a.classList.remove('show'); }); }
  });

  /* MOBILE MENU */
  var mb = document.getElementById('mobileBtn');
  var mm = document.getElementById('mobileMenu');
  if(mb && mm) mb.addEventListener('click', function(){
    var open = mm.style.display === 'block';
    mm.style.display = open ? 'none' : 'block';
    mb.classList.toggle('open', !open);
  });

  /* CLOSE MOBILE MENU ON LINK CLICK */
  if(mm){ mm.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ mm.style.display='none'; mb && mb.classList.remove('open'); });
  });}

  /* BACK-TO-TOP */
  var btt = document.getElementById('btt');
  if(btt){
    window.addEventListener('scroll', function(){
      btt.classList.toggle('show', window.scrollY > 400);
    },{passive:true});
    btt.addEventListener('click', function(){ window.scrollTo({top:0,behavior:'smooth'}); });
  }

  /* SCROLL-REVEAL */
  (function(){
    var els = document.querySelectorAll('.reveal,.reveal-l,.reveal-r,.reveal-scale,.reveal-fast');
    if(!els.length) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }});
    },{threshold:0.1,rootMargin:'0px 0px -40px 0px'});
    els.forEach(function(el){ io.observe(el); });
  })();

  /* ANIMATED COUNTERS */
  (function(){
    function animCount(el){
      var raw = el.getAttribute('data-target') || el.textContent;
      var prefix = raw.match(/^[₹$€£]*/)[0];
      var suffix = raw.replace(/^[₹$€£\d,.\s]+/,'');
      var num = parseFloat(raw.replace(/[^0-9.]/g,'')) || 0;
      if(!num){ return; }
      var start = 0, dur = 1600, step = 16;
      var t = setInterval(function(){
        start += step;
        var p = Math.min(start/dur, 1);
        var ease = 1 - Math.pow(1-p, 3);
        var cur = Math.round(ease * num * 10) / 10;
        el.textContent = prefix + (Number.isInteger(cur) ? cur.toLocaleString('en-IN') : cur.toLocaleString('en-IN')) + suffix;
        if(p >= 1){ el.textContent = raw; clearInterval(t); }
      }, step);
    }
    var counters = document.querySelectorAll('.count-up');
    if(!counters.length) return;
    var io2 = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ animCount(e.target); io2.unobserve(e.target); }
      });
    },{threshold:0.5});
    counters.forEach(function(c){ io2.observe(c); });
  })();

  /* HERO CAROUSEL */
  var track = document.querySelector('.car-track');
  if(track){
    var slides = Array.from(track.querySelectorAll('.car-slide'));
    var dots   = Array.from(document.querySelectorAll('.c-dot'));
    var pb     = document.querySelector('.car-pb');
    var ct     = document.querySelector('.car-ct');
    var cur    = 0, DELAY = 5800, tmr, el = 0, step = 55;

    function go(n){
      slides[cur].classList.remove('on');
      if(dots[cur]) dots[cur].classList.remove('on');
      cur = ((n % slides.length) + slides.length) % slides.length;
      track.style.transform = 'translateX(-'+(cur*100)+'%)';
      slides[cur].classList.add('on');
      if(dots[cur]) dots[cur].classList.add('on');
      if(ct) ct.innerHTML = '<b>'+(cur+1)+'</b> / '+slides.length;
      startPB();
    }
    function startPB(){
      clearInterval(tmr); el = 0;
      if(pb){ pb.style.transition='none'; pb.style.width='0'; }
      tmr = setInterval(function(){
        el += step;
        var p = Math.min((el/DELAY)*100, 100);
        if(pb){ pb.style.transition='none'; pb.style.width=p+'%'; }
        if(el >= DELAY) go(cur+1);
      }, step);
    }
    slides[0].classList.add('on');
    if(dots[0]) dots[0].classList.add('on');
    if(ct) ct.innerHTML = '<b>1</b> / '+slides.length;
    startPB();

    var pp = document.querySelector('.car-prev');
    var np = document.querySelector('.car-next');
    if(pp) pp.addEventListener('click', function(){ go(cur-1); });
    if(np) np.addEventListener('click', function(){ go(cur+1); });
    dots.forEach(function(d,i){ d.addEventListener('click', function(){ go(i); }); });

    var sx = 0;
    track.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, {passive:true});
    track.addEventListener('touchend',   function(e){ var dx = e.changedTouches[0].clientX - sx; if(Math.abs(dx)>45) go(cur+(dx<0?1:-1)); }, {passive:true});
  }

  /* FORM UX — AJAX handler for enquiry/subscribe forms only.
     Auth forms (/api/auth/*) submit natively so the browser follows the redirect. */
  document.querySelectorAll('.ig-form').forEach(function(form){
    var action = form.getAttribute('action') || '';
    // Skip auth forms — let browser handle redirect natively
    if(action.indexOf('/api/auth') !== -1) return;
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var btn = form.querySelector('[type=submit]');
      if(!btn) return;
      var orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin" style="margin-right:.4rem;"></i>Sending\u2026';
      btn.disabled = true;
      try {
        var fd = new FormData(form);
        var res = await fetch(action || '/api/enquiry', {method:'POST', body:fd});
        btn.innerHTML = '<i class="fas fa-check" style="margin-right:.4rem;"></i>Submitted \u2014 We will be in touch';
        btn.style.cssText += ';background:#15803d!important;border-color:#15803d!important;';
        setTimeout(function(){ btn.innerHTML=orig; btn.disabled=false; btn.style.background=''; btn.style.borderColor=''; }, 4500);
      } catch(err){
        btn.innerHTML = orig; btn.disabled = false;
        alert('Error. Please email info@indiagully.com directly.');
      }
    });
  });

  /* ── MODAL SYSTEM ─────────────────────────────────────────────────────────
     Usage:
       openModal('modal-id')   — shows the overlay + panel
       closeModal('modal-id')  — hides it
     Each modal must have:
       <div id="modal-id" class="ig-modal">
         <div class="ig-modal-box"> … <button onclick="closeModal('modal-id')">×</button> </div>
       </div>
  ──────────────────────────────────────────────────────────────────────── */
  window.openModal = function(id){
    var m = document.getElementById(id);
    if(m){ m.style.display='flex'; document.body.style.overflow='hidden'; }
  };
  window.closeModal = function(id){
    var m = document.getElementById(id);
    if(m){ m.style.display='none'; document.body.style.overflow=''; }
  };
  // Close on backdrop click
  document.addEventListener('click', function(e){
    var t = e.target;
    if(t && t.classList && t.classList.contains('ig-modal')){
      t.style.display='none';
      document.body.style.overflow='';
    }
  });

  /* ── TOAST NOTIFICATIONS ──────────────────────────────────────────────── */
  window.igToast = function(msg, type){
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;background:'+(type==='error'?'#dc2626':type==='warn'?'#d97706':'#15803d')+';color:#fff;padding:.75rem 1.25rem;font-size:.82rem;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,.25);max-width:360px;line-height:1.5;display:flex;align-items:center;gap:.6rem;';
    var icon = document.createElement('i');
    icon.className = 'fas fa-'+(type==='error'?'exclamation-circle':type==='warn'?'exclamation-triangle':'check-circle');
    icon.style.flexShrink = '0';
    var txt = document.createElement('span');
    txt.textContent = msg;
    el.appendChild(icon);
    el.appendChild(txt);
    document.body.appendChild(el);
    setTimeout(function(){ el.style.transition='opacity .4s'; el.style.opacity='0'; setTimeout(function(){ el.remove(); },400); }, 3500);
  };

  /* ── INLINE PANEL TOGGLE ──────────────────────────────────────────────── */
  window.togglePanel = function(id){
    var p = document.getElementById(id);
    if(!p) return;
    // For elements hidden by CSS class, getComputedStyle gives 'none'
    var computed = window.getComputedStyle(p).display;
    var isHidden = computed === 'none';
    if(isHidden){
      // Set appropriate display type: table-row for TR elements, block for others
      p.style.display = (p.tagName === 'TR') ? 'table-row' : 'block';
    } else {
      p.style.display = 'none';
    }
  };

  /* ── CONFIRM ACTION ───────────────────────────────────────────────────── */
  window.igConfirm = function(msg, cb){
    var uid = 'igc_'+Date.now();
    var overlay = document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:1rem;';
    overlay.innerHTML='<div style="background:#fff;padding:2rem;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.35);">'
      +'<div style="display:flex;align-items:flex-start;gap:.875rem;margin-bottom:1.5rem;">'
      +'<div style="width:40px;height:40px;background:#fffbeb;border:1.5px solid #fde68a;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
      +'<i class="fas fa-exclamation-triangle" style="color:#d97706;font-size:.9rem;"></i></div>'
      +'<p style="font-size:.9rem;color:#111;line-height:1.65;padding-top:.2rem;">'+msg+'</p></div>'
      +'<div style="display:flex;gap:.75rem;justify-content:flex-end;">'
      +'<button id="'+uid+'No" style="padding:.55rem 1.25rem;background:#f1f5f9;border:1px solid #e2e8f0;font-size:.82rem;cursor:pointer;font-weight:500;color:#444;">Cancel</button>'
      +'<button id="'+uid+'Yes" style="padding:.55rem 1.25rem;background:#B8960C;color:#fff;border:none;font-size:.82rem;cursor:pointer;font-weight:600;letter-spacing:.05em;">Confirm</button>'
      +'</div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#'+uid+'No').addEventListener('click',function(){ overlay.remove(); });
    overlay.querySelector('#'+uid+'Yes').addEventListener('click',function(){ overlay.remove(); if(cb) cb(); });
    // Close on backdrop
    overlay.addEventListener('click',function(e){ if(e.target===overlay){ overlay.remove(); } });
  };

  /* ── FILE DOWNLOAD SIMULATION ─────────────────────────────────────────── */
  window.igDownload = function(filename, msg){
    igToast(msg || ('Downloading '+filename+' …'), 'success');
  };

  /* ── SIGN OUT ─────────────────────────────────────────────────────────── */
  window.igSignOut = function(portal){
    fetch('/api/auth/logout',{method:'POST',credentials:'include'})
      .catch(function(){})
      .finally(function(){ location.href='/portal/'+(portal||''); });
  };

  /* ── VIEW PDF SIMULATION ──────────────────────────────────────────────── */
  window.igViewPDF = function(filename, msg){
    igToast(msg || ('Opening '+filename+' in viewer …'), 'success');
  };

  /* ── MODAL DIALOG ─────────────────────────────────────────────────────── */
  window.igModal = function(title, bodyHtml){
    var uid = 'igm_'+Date.now();
    var overlay = document.createElement('div');
    overlay.id = uid;
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:1.5rem;';
    var closeId = uid + '_close';
    var closeId2 = uid + '_close2';
    overlay.innerHTML = '<div style="background:#fff;max-width:680px;width:100%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.4);">'
      + '<div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;background:#1A3A6B;">'
      + '<h3 style="font-size:.9rem;font-weight:700;color:#fff;letter-spacing:.04em;margin:0;">'+title+'</h3>'
      + '<button id="'+closeId+'" style="background:none;border:none;color:rgba(255,255,255,.7);font-size:1.1rem;cursor:pointer;padding:.2rem .4rem;line-height:1;">&times;</button>'
      + '</div>'
      + '<div style="padding:1.5rem;overflow-y:auto;font-size:.82rem;color:#374151;line-height:1.7;">'+bodyHtml+'</div>'
      + '<div style="padding:.875rem 1.5rem;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;">'
      + '<button id="'+closeId2+'" style="padding:.5rem 1.25rem;background:#1A3A6B;color:#fff;border:none;font-size:.8rem;font-weight:600;cursor:pointer;letter-spacing:.04em;">Close</button>'
      + '</div></div>';
    document.body.appendChild(overlay);
    var btnClose = document.getElementById(closeId);
    var btnClose2 = document.getElementById(closeId2);
    if(btnClose)  btnClose.addEventListener('click',  function(){ overlay.remove(); });
    if(btnClose2) btnClose2.addEventListener('click', function(){ overlay.remove(); });
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
  };

  /* ── DOCUMENT WATERMARK ───────────────────────────────────────────────── */
  /* igCloseModal — closes the most recently opened igModal overlay */
  window.igCloseModal = function(){
    // igModal overlays have IDs starting with "igm_"
    var overlays = document.querySelectorAll('[id^="igm_"]');
    if(overlays.length){
      overlays[overlays.length-1].remove();
    }
  };

  window.igWatermark = function(docEl, userLabel){
    if(!docEl) return;
    userLabel = userLabel || 'CONFIDENTIAL — India Gully';
    var wm = document.createElement('div');
    wm.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1;';
    for(var y=0;y<6;y++){for(var x=0;x<4;x++){
      var s=document.createElement('span');
      s.style.cssText='position:absolute;left:'+(x*26)+'%;top:'+(y*18)+'%;transform:rotate(-30deg);font-size:.65rem;color:rgba(0,0,0,.08);font-weight:700;white-space:nowrap;user-select:none;letter-spacing:.06em;';
      s.textContent=userLabel; wm.appendChild(s);
    }}
    docEl.style.position='relative'; docEl.appendChild(wm);
  };

  /* ── DPDP CONSENT BANNER v3 — L6 upgrade: per-purpose toggles + withdraw link ── */
  /* Hooks to POST /api/dpdp/consent/record for granular D1-backed consent.          */
  (function(){
    var BANNER_KEY='ig_dpdp_consent_v3';
    if(localStorage.getItem(BANNER_KEY)) return;
    var path=window.location.pathname;
    // Skip login/auth pages — only show on dashboard/app routes
    var isLoginPage=(path==='/admin'||path==='/portal'||path==='/portal/client'
      ||path==='/portal/employee'||path==='/portal/board'||path.endsWith('/login'));
    if(isLoginPage) return;

    var banner=document.createElement('div');
    banner.id='dpdp-banner';
    banner.setAttribute('role','dialog');
    banner.setAttribute('aria-modal','true');
    banner.setAttribute('aria-label','DPDP Data Consent Notice');
    banner.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:9800;'
      +'background:#0A0A0A;border-top:2px solid var(--gold,#B8960C);'
      +'padding:1rem 1.5rem;display:flex;align-items:flex-start;'
      +'gap:1.25rem;flex-wrap:wrap;box-shadow:0 -4px 30px rgba(0,0,0,.6);';

    banner.innerHTML=''
      +'<div style="flex:1;min-width:260px;">'
        +'<div style="font-size:.75rem;font-weight:700;color:#fff;margin-bottom:.35rem;letter-spacing:.06em;">'
          +'&#x1F512; DPDP Act 2023 &mdash; Data Consent &nbsp;'
          +'<span style="font-size:.62rem;font-weight:400;color:rgba(255,255,255,.6);letter-spacing:0;">v3</span>'
        +'</div>'
        +'<div style="font-size:.72rem;color:rgba(255,255,255,.55);line-height:1.6;">'
          +'India Gully processes personal data under the '
          +'<strong style="color:rgba(255,255,255,.8);">Digital Personal Data Protection Act 2023</strong>. '
          +'Essential processing is mandatory. Choose optional purposes below. '
          +'<a href="/legal/privacy" style="color:var(--gold,#B8960C);text-decoration:underline;">Privacy Policy</a>'
          +'&nbsp;|&nbsp;<a href="mailto:dpo@indiagully.com" style="color:var(--gold,#B8960C);text-decoration:underline;">DPO</a>'
        +'</div>'
        // Per-purpose toggle row
        +'<div style="margin-top:.55rem;display:flex;gap:.875rem;flex-wrap:wrap;align-items:center;">'
          +'<label style="display:flex;align-items:center;gap:.35rem;font-size:.68rem;color:rgba(255,255,255,.55);cursor:not-allowed;" title="Required for platform operation">'
            +'<input type="checkbox" checked disabled style="accent-color:var(--gold,#B8960C);width:13px;height:13px;"> Essential (required)'
          +'</label>'
          +'<label id="lbl-analytics" style="display:flex;align-items:center;gap:.35rem;font-size:.68rem;color:rgba(255,255,255,.7);cursor:pointer;" title="Usage analytics and platform improvement">'
            +'<input type="checkbox" id="dpdp-chk-analytics" style="accent-color:var(--gold,#B8960C);width:13px;height:13px;"> Analytics'
          +'</label>'
          +'<label id="lbl-marketing" style="display:flex;align-items:center;gap:.35rem;font-size:.68rem;color:rgba(255,255,255,.7);cursor:pointer;" title="Market research and advisory communications">'
            +'<input type="checkbox" id="dpdp-chk-marketing" style="accent-color:var(--gold,#B8960C);width:13px;height:13px;"> Marketing'
          +'</label>'
          +'<label id="lbl-third" style="display:flex;align-items:center;gap:.35rem;font-size:.68rem;color:rgba(255,255,255,.7);cursor:pointer;" title="SendGrid, Twilio, DocuSign, Razorpay integrations">'
            +'<input type="checkbox" id="dpdp-chk-third" style="accent-color:var(--gold,#B8960C);width:13px;height:13px;"> Third-Party Integrations'
          +'</label>'
          // Withdraw link — shown after consent is stored
          +'<span id="dpdp-withdraw-link" style="display:none;font-size:.62rem;color:rgba(255,255,255,.6);margin-left:auto;">'
            +'<a id="dpdp-do-withdraw" href="#" style="color:rgba(184,150,12,.55);text-decoration:underline;">Withdraw consent</a>'
          +'</span>'
        +'</div>'
      +'</div>'
      // Action buttons
      +'<div style="display:flex;gap:.625rem;flex-shrink:0;align-self:center;flex-wrap:wrap;">'
        +'<button id="dpdp-accept-all" style="background:var(--gold,#B8960C);color:#000;border:none;'
          +'padding:.5rem 1.25rem;font-size:.72rem;font-weight:700;cursor:pointer;letter-spacing:.06em;">'
          +'Accept All'
        +'</button>'
        +'<button id="dpdp-save-pref" style="background:transparent;border:1px solid rgba(184,150,12,.5);'
          +'color:rgba(255,255,255,.7);padding:.5rem 1.25rem;font-size:.72rem;cursor:pointer;">'
          +'Save Preferences'
        +'</button>'
        +'<button id="dpdp-essential-only" style="background:transparent;border:1px solid rgba(255,255,255,.25);'
          +'color:rgba(255,255,255,.65);padding:.5rem .875rem;font-size:.68rem;cursor:pointer;">'
          +'Essential Only'
        +'</button>'
      +'</div>';

    document.body.appendChild(banner);

    /** Send granular consent to /api/dpdp/consent/record (L6 — replaces /api/dpdp/consent) */
    function sendConsentRecord(analytics, marketing, thirdParty){
      var uid = (typeof igSession !== 'undefined' && igSession && igSession.email)
        ? igSession.email : 'anonymous';
      try{
        fetch('/api/dpdp/consent/record',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            user_id:uid,
            analytics:analytics,
            marketing:marketing,
            third_party:thirdParty,
            banner_version:'v3',
            page:path,
          })
        }).catch(function(){});
      }catch(e){}
    }

    function hideBanner(analytics, marketing, thirdParty){
      var purposes=['essential'];
      if(analytics) purposes.push('analytics');
      if(marketing) purposes.push('marketing');
      if(thirdParty) purposes.push('third_party');
      var record={v:3,pref:purposes,analytics:analytics,marketing:marketing,
        third_party:thirdParty,ts:Date.now(),path:path};
      localStorage.setItem(BANNER_KEY,JSON.stringify(record));
      sendConsentRecord(analytics,marketing,thirdParty);
      banner.style.transition='transform .35s ease-in,opacity .35s';
      banner.style.transform='translateY(100%)';
      banner.style.opacity='0';
      setTimeout(function(){banner.remove();},360);
    }

    document.getElementById('dpdp-accept-all').onclick=function(){
      document.getElementById('dpdp-chk-analytics').checked=true;
      document.getElementById('dpdp-chk-marketing').checked=true;
      document.getElementById('dpdp-chk-third').checked=true;
      hideBanner(true,true,true);
      if(window.igToast) igToast('All data purposes accepted.','success');
    };
    document.getElementById('dpdp-save-pref').onclick=function(){
      var a=document.getElementById('dpdp-chk-analytics').checked;
      var m=document.getElementById('dpdp-chk-marketing').checked;
      var t=document.getElementById('dpdp-chk-third').checked;
      hideBanner(a,m,t);
      if(window.igToast) igToast('Data preferences saved.','success');
    };
    document.getElementById('dpdp-essential-only').onclick=function(){
      hideBanner(false,false,false);
      if(window.igToast) igToast('Only essential processing enabled.','info');
    };

    // Withdraw link handler — calls /api/dpdp/consent/withdraw
    document.getElementById('dpdp-do-withdraw').onclick=function(e){
      e.preventDefault();
      var uid = (typeof igSession !== 'undefined' && igSession && igSession.email)
        ? igSession.email : 'anonymous';
      fetch('/api/dpdp/consent/withdraw',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({user_id:uid,purposes:['analytics','marketing','third_party']})
      }).then(function(r){return r.json();}).then(function(d){
        if(d.withdrawal_ref){
          localStorage.removeItem(BANNER_KEY);
          if(window.igToast) igToast('Consent withdrawn (ref: '+d.withdrawal_ref+'). Page will reload.','info');
          setTimeout(function(){location.reload();},1800);
        }
      }).catch(function(){});
    };
  })();

  /* ── DPDP PREFERENCES DRAWER — allows re-managing consent after banner dismissed ── */
  window.igOpenDpdpPreferences=function(){
    var existing=document.getElementById('dpdp-pref-drawer');
    if(existing){existing.remove();return;}
    var stored=localStorage.getItem('ig_dpdp_consent_v3');
    var rec=stored?JSON.parse(stored):{analytics:false,marketing:false,third_party:false};
    var drawer=document.createElement('div');
    drawer.id='dpdp-pref-drawer';
    drawer.setAttribute('role','dialog');
    drawer.setAttribute('aria-label','Manage Data Preferences');
    drawer.style.cssText='position:fixed;bottom:0;right:0;width:340px;z-index:9900;'
      +'background:#111;border:1px solid rgba(184,150,12,.3);border-bottom:none;'
      +'padding:1.25rem;box-shadow:-4px -4px 24px rgba(0,0,0,.7);';
    drawer.innerHTML=''
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">'
        +'<span style="font-size:.78rem;font-weight:700;color:#fff;letter-spacing:.06em;">&#x1F512; Data Preferences</span>'
        +'<button onclick="document.getElementById(&quot;dpdp-pref-drawer&quot;).remove()" '
          +'style="background:none;border:none;color:rgba(255,255,255,.4);font-size:1.1rem;cursor:pointer;">&times;</button>'
      +'</div>'
      +'<div style="font-size:.7rem;color:rgba(255,255,255,.7);margin-bottom:.875rem;line-height:1.6;">'
        +'Manage your data consent under DPDP Act 2023. Changes take effect immediately.'
      +'</div>'
      +'<div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:1rem;">'
        +'<label style="display:flex;align-items:center;justify-content:space-between;font-size:.73rem;color:rgba(255,255,255,.6);">'
          +'<span>&#x2714;&#xFE0F; Essential (required)</span>'
          +'<input type="checkbox" checked disabled style="accent-color:var(--gold,#B8960C);">'
        +'</label>'
        +'<label style="display:flex;align-items:center;justify-content:space-between;font-size:.73rem;color:rgba(255,255,255,.75);cursor:pointer;" title="Platform usage analytics">'
          +'<span>&#x1F4CA; Analytics</span>'
          +'<input type="checkbox" id="dpdp-d-analytics" '+(rec.analytics?'checked':'')+' style="accent-color:var(--gold,#B8960C);">'
        +'</label>'
        +'<label style="display:flex;align-items:center;justify-content:space-between;font-size:.73rem;color:rgba(255,255,255,.75);cursor:pointer;" title="Advisory communications and market research">'
          +'<span>&#x1F4E3; Marketing</span>'
          +'<input type="checkbox" id="dpdp-d-marketing" '+(rec.marketing?'checked':'')+' style="accent-color:var(--gold,#B8960C);">'
        +'</label>'
        +'<label style="display:flex;align-items:center;justify-content:space-between;font-size:.73rem;color:rgba(255,255,255,.75);cursor:pointer;" title="SendGrid, Twilio, DocuSign, Razorpay">'
          +'<span>&#x1F517; Third-Party Integrations</span>'
          +'<input type="checkbox" id="dpdp-d-third" '+(rec.third_party?'checked':'')+' style="accent-color:var(--gold,#B8960C);">'
        +'</label>'
      +'</div>'
      +'<div style="display:flex;gap:.5rem;">'
        +'<button id="dpdp-d-save" style="flex:1;background:var(--gold,#B8960C);color:#000;border:none;'
          +'padding:.5rem;font-size:.72rem;font-weight:700;cursor:pointer;">Save Changes</button>'
        +'<button id="dpdp-d-withdraw" style="background:transparent;border:1px solid rgba(255,255,255,.25);'
          +'color:rgba(255,255,255,.65);padding:.5rem .75rem;font-size:.68rem;cursor:pointer;">Withdraw All</button>'
      +'</div>'
      +'<div style="margin-top:.6rem;font-size:.62rem;color:rgba(255,255,255,.5);">'
        +'Last updated: '+(stored?new Date(rec.ts).toLocaleDateString('en-IN'):'not set')
      +'</div>';
    document.body.appendChild(drawer);

    document.getElementById('dpdp-d-save').onclick=function(){
      var a=document.getElementById('dpdp-d-analytics').checked;
      var m=document.getElementById('dpdp-d-marketing').checked;
      var t=document.getElementById('dpdp-d-third').checked;
      var uid=(typeof igSession!=='undefined'&&igSession&&igSession.email)?igSession.email:'anonymous';
      var purposes=['essential'];
      if(a) purposes.push('analytics');
      if(m) purposes.push('marketing');
      if(t) purposes.push('third_party');
      localStorage.setItem('ig_dpdp_consent_v3',JSON.stringify(
        {v:3,pref:purposes,analytics:a,marketing:m,third_party:t,ts:Date.now()}));
      fetch('/api/dpdp/consent/record',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({user_id:uid,analytics:a,marketing:m,third_party:t,banner_version:'v3-drawer'})
      }).catch(function(){});
      drawer.remove();
      if(window.igToast) igToast('Data preferences updated.','success');
    };
    document.getElementById('dpdp-d-withdraw').onclick=function(){
      var uid=(typeof igSession!=='undefined'&&igSession&&igSession.email)?igSession.email:'anonymous';
      fetch('/api/dpdp/consent/withdraw',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({user_id:uid,purposes:['analytics','marketing','third_party']})
      }).then(function(r){return r.json();}).then(function(d){
        localStorage.removeItem('ig_dpdp_consent_v3');
        drawer.remove();
        if(window.igToast) igToast('Consent withdrawn ('+d.withdrawal_ref+').','info');
        setTimeout(function(){location.reload();},1500);
      }).catch(function(){drawer.remove();});
    };
  };

  /* ── DARK MODE ────────────────────────────────────────────────────────── */
  (function(){
    var DM_KEY = 'ig_dark_mode';
    var root = document.documentElement;
    function applyDark(on){
      root.setAttribute('data-theme', on ? 'dark' : 'light');
      var icon = document.getElementById('dark-icon');
      if(icon){ icon.className = on ? 'fas fa-sun' : 'fas fa-moon'; }
    }
    var saved = localStorage.getItem(DM_KEY);
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyDark(saved ? saved==='1' : prefersDark);
    window.igToggleDark = function(){
      var isDark = root.getAttribute('data-theme')==='dark';
      var next = !isDark;
      applyDark(next);
      localStorage.setItem(DM_KEY, next?'1':'0');
      igToast(next?'Dark mode enabled':'Light mode enabled','success');
    };
  })();

  /* ── HINDI / ENGLISH TOGGLE ─────────────────────────────────────────── */
  (function(){
    var LANG_KEY = 'ig_lang';
    var translations = {
      'Home':'होम','About':'परिचय','Mandates':'मैंडेट','Contact':'संपर्क',
      'Submit Mandate':'मैंडेट सबमिट करें','Portals':'पोर्टल',
      'Advisory':'सलाह','Insights':'अंतर्दृष्टि'
    };
    var isHindi = false;
    window.igToggleLang = function(){
      isHindi = !isHindi;
      var lbl = document.getElementById('lang-label');
      if(lbl) lbl.textContent = isHindi ? 'EN' : 'हिंदी';
      localStorage.setItem(LANG_KEY, isHindi?'hi':'en');
      igToast(isHindi ? 'हिंदी मोड सक्रिय — नेविगेशन लेबल अनुवादित' : 'English mode active','success');
    };
    var saved = localStorage.getItem(LANG_KEY);
    if(saved === 'hi'){ window.igToggleLang && window.igToggleLang(); }
  })();

  /* ── GUIDED TOUR ─────────────────────────────────────────────────────── */
  window.igStartTour = function(){
    var steps = [
      {sel:'#mainNav',         title:'Navigation',       text:'Use the top nav to access Advisory, Mandates, Insights, and the secure Portals.'},
      {sel:'.btn-g',           title:'Submit Mandate',   text:'Submit your advisory brief here. Our team responds within 24 hours.'},
      {sel:'[aria-label="India Gully — Home"]', title:'India Gully Logo', text:'Click the logo to return to the home page at any time.'},
    ];
    var step = 0;
    function showStep(i){
      var overlay = document.getElementById('ig-tour-overlay');
      if(overlay) overlay.remove();
      if(i >= steps.length){ igToast('Tour complete! ✓','success'); return; }
      var s = steps[i];
      var el = document.querySelector(s.sel);
      if(!el){ showStep(i+1); return; }
      var rect = el.getBoundingClientRect();
      var ov = document.createElement('div');
      ov.id = 'ig-tour-overlay';
      ov.style.cssText = 'position:fixed;inset:0;z-index:9990;pointer-events:none;';
      ov.innerHTML = '<div style="position:fixed;left:'+(rect.left-8)+'px;top:'+(rect.top-8)+'px;width:'+(rect.width+16)+'px;height:'+(rect.height+16)+'px;border:2px solid var(--gold);border-radius:4px;box-shadow:0 0 0 9999px rgba(0,0,0,.5);pointer-events:none;"></div>'
        +'<div style="position:fixed;left:'+Math.min(rect.left,window.innerWidth-300)+'px;top:'+(rect.bottom+14)+'px;background:#fff;border-top:3px solid var(--gold);padding:1rem 1.25rem;width:280px;box-shadow:0 8px 32px rgba(0,0,0,.2);pointer-events:all;z-index:9991;">'
        +'<div style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin-bottom:.3rem;">Step '+(i+1)+' of '+steps.length+': '+s.title+'</div>'
        +'<div style="font-size:.82rem;color:#1e293b;line-height:1.5;margin-bottom:.75rem;">'+s.text+'</div>'
        +'<div style="display:flex;gap:.5rem;">'
        +(i>0?'<button onclick="window.igTourStep('+(i-1)+')" style="background:none;border:1px solid #cbd5e1;padding:.3rem .75rem;font-size:.72rem;cursor:pointer;">← Back</button>':'')
        +'<button onclick="window.igTourStep('+(i+1)+')" style="background:var(--gold);color:#fff;border:none;padding:.3rem .875rem;font-size:.72rem;font-weight:600;cursor:pointer;">'+(i===steps.length-1?'Finish':'Next →')+'</button>'
        +'<button onclick="document.getElementById(&quot;ig-tour-overlay&quot;).remove();igToast(&quot;Tour skipped&quot;,&quot;info&quot;)" style="background:none;border:none;font-size:.68rem;color:#94a3b8;cursor:pointer;margin-left:auto;">Skip</button>'
        +'</div></div>';
      document.body.appendChild(ov);
    }
    window.igTourStep = showStep;
    showStep(0);
  };

  /* ── LIGHTBOX ─────────────────────────────────────────────────────────── */
  (function(){
    var lb = document.getElementById('ig-lightbox');
    var lbImg = document.getElementById('ig-lightbox-img');
    var lbCap = document.getElementById('ig-lightbox-caption');
    var lbImages = [];
    var lbCurrent = 0;

    window.igLightboxOpen = function(images, index, captions){
      lbImages = images || [];
      lbCurrent = index || 0;
      if(!lb || !lbImg) return;
      lbImg.src = lbImages[lbCurrent] || '';
      if(lbCap) lbCap.textContent = captions ? captions[lbCurrent] || '' : (lbCurrent+1)+' / '+lbImages.length;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    window.igLightboxClose = function(){
      if(lb) lb.classList.remove('open');
      document.body.style.overflow = '';
    };
    window.igLightboxNav = function(dir){
      lbCurrent = ((lbCurrent + dir) % lbImages.length + lbImages.length) % lbImages.length;
      if(lbImg) lbImg.src = lbImages[lbCurrent];
      if(lbCap) lbCap.textContent = (lbCurrent+1)+' / '+lbImages.length;
    };
    // Keyboard nav
    document.addEventListener('keydown', function(e){
      if(!lb || !lb.classList.contains('open')) return;
      if(e.key==='Escape') window.igLightboxClose();
      if(e.key==='ArrowLeft') window.igLightboxNav(-1);
      if(e.key==='ArrowRight') window.igLightboxNav(1);
    });
    // Click outside image
    if(lb) lb.addEventListener('click', function(e){
      if(e.target === lb) window.igLightboxClose();
    });
  })();

  /* ── STICKY STATS ─────────────────────────────────────────────────────── */
  (function(){
    var ss = document.getElementById('stickyStats');
    var hs = document.getElementById('homeStats');
    if(!ss || !hs) return;
    /* Only show after user has actually scrolled — guards against
       the IO firing on page-load when homeStats is below-the-fold */
    var hasScrolled = false;
    window.addEventListener('scroll', function(){ hasScrolled = true; }, {passive:true, once:true});
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var show = !e.isIntersecting && hasScrolled;
        ss.classList.toggle('visible', show);
        ss.setAttribute('aria-hidden', show ? 'false' : 'true');
      });
    },{threshold:0, rootMargin:'-80px 0px 0px 0px'});
    io.observe(hs);
  })();

  /* ── CMD+K SEARCH PALETTE ────────────────────────────────────────────── */
  (function(){
    /* ---- static search index ---- */
    var IG_INDEX = [
      /* Pages */
      {type:'page', icon:'fa-home',         title:'Home',                         url:'/'},
      {type:'page', icon:'fa-info-circle',  title:'About India Gully',            url:'/about'},
      {type:'page', icon:'fa-briefcase',    title:'Active Mandates',              url:'/listings'},
      {type:'page', icon:'fa-chart-line',   title:'Investor Relations',           url:'/invest'},
      {type:'page', icon:'fa-stream',        title:'Pipeline Dashboard',           url:'/pipeline'},
      {type:'page', icon:'fa-envelope',     title:'Contact Us',                   url:'/contact'},
      {type:'page', icon:'fa-lightbulb',    title:'Insights & Research',          url:'/insights'},
      {type:'page', icon:'fa-star',         title:'Track Record',                 url:'/works'},
      {type:'page', icon:'fa-concierge-bell',title:'Advisory Services',           url:'/services'},
      {type:'page', icon:'fa-utensils',     title:'HORECA Solutions',             url:'/horeca'},
      {type:'page', icon:'fa-book',         title:'Resources & Downloads',        url:'/resources'},
      {type:'page', icon:'fa-users',        title:'Testimonials',                 url:'/testimonials'},
      {type:'page', icon:'fa-user-tie',     title:'Admin Dashboard',              url:'/admin'},
      /* Mandates */
      {type:'mandate', icon:'fa-building',  title:'Prism Tower — Gurugram',           url:'/listings/prism-tower-gurgaon',           meta:'₹400 Cr · Mixed-Use · Gurugram'},
      {type:'mandate', icon:'fa-building',  title:'Belcibo Hospitality Platform',     url:'/listings/belcibo-hospitality-platform',  meta:'₹100 Cr · F&B Platform · Delhi NCR & Goa'},
      {type:'mandate', icon:'fa-hotel',     title:'Hotel Rajshree Chandigarh',        url:'/listings/hotel-rajshree-chandigarh',     meta:'₹70 Cr · Boutique Hotel · Chandigarh'},
      {type:'mandate', icon:'fa-landmark',  title:'WelcomHeritage Santa Roza Kasauli',url:'/listings/welcomheritage-santa-roza-kasauli', meta:'₹45 Cr · Heritage Resort · Kasauli'},
      {type:'mandate', icon:'fa-landmark',  title:'Heritage Hotel Jaipur',            url:'/listings/heritage-hotel-jaipur',         meta:'₹35 Cr · Heritage · Jaipur'},
      {type:'mandate', icon:'fa-tree',      title:'Maple Resort Chail',               url:'/listings/maple-resort-chail',            meta:'₹30 Cr · Mountain Resort · Chail'},
      {type:'mandate', icon:'fa-city',      title:'Ambience Tower North Delhi',       url:'/listings/ambience-tower-north-delhi',    meta:'₹120 Cr · Grade-A Commercial · Rohini'},
      {type:'mandate', icon:'fa-city',      title:'Sawasdee JLG Noida',              url:'/listings/sawasdee-jlg-noida',           meta:'₹85 Cr · Mixed-Use · Noida'},
      /* Articles */
      {type:'article', icon:'fa-newspaper', title:'India Real Estate 2026: Commercial & Hospitality Convergence', url:'/insights/india-realty-2026-outlook',          meta:'Real Estate · 2026'},
      {type:'article', icon:'fa-newspaper', title:'Navigating the Entertainment Zone Regulatory Landscape',       url:'/insights/entertainment-zone-regulatory-india', meta:'Entertainment · Regulatory'},
      {type:'article', icon:'fa-newspaper', title:'Building Resilient HORECA Supply Chains in Tier 2 India',     url:'/insights/horeca-tier2-supply-chain',           meta:'HORECA · Supply Chain'},
      {type:'article', icon:'fa-newspaper', title:'IBC 2025 Update: Hospitality Asset Resolution Trends',        url:'/insights/ibc-distressed-hospitality-2025',     meta:'Debt · IBC · 2025'},
      {type:'article', icon:'fa-newspaper', title:'The Mall-Hotel-Office Trinity: Mixed-Use Integration',         url:'/insights/mall-mixed-use-integration',          meta:'Real Estate · Mixed-Use'},
      {type:'article', icon:'fa-newspaper', title:'Greenfield Mid-Scale Hotel Opportunity 2025-27',              url:'/insights/greenfield-midscale-hotels',          meta:'Hospitality · Greenfield'},
      {type:'article', icon:'fa-newspaper', title:'India Hospitality Market Outlook 2024-2025',                  url:'/insights/india-hospitality-2024',              meta:'Hospitality · Market Outlook'},
      {type:'article', icon:'fa-newspaper', title:'Rise of Integrated Entertainment Destinations in India',       url:'/insights/entertainment-destinations-india',    meta:'Entertainment · FEC'},
      {type:'article', icon:'fa-newspaper', title:'HORECA Procurement Strategy for New Hotel Openings',          url:'/insights/horeca-procurement-strategy',         meta:'HORECA · Procurement'},
      {type:'article', icon:'fa-newspaper', title:'Distressed Hotel Assets: Opportunities in IBC Landscape',     url:'/insights/debt-special-situations-hospitality', meta:'Debt · Distressed'},
      {type:'article', icon:'fa-newspaper', title:'Mall Leasing Strategy in the Experience Economy',             url:'/insights/retail-leasing-malls-india',          meta:'Retail · Leasing'},
      {type:'article', icon:'fa-newspaper', title:'Greenfield Hotel Development in Tier 2 & 3 India',           url:'/insights/greenfield-hotel-development',        meta:'Hospitality · Tier 2'},
      {type:'article', icon:'fa-newspaper', title:'India Retail Leasing 2026: Premiumisation & New Mall Hierarchy',url:'/insights/retail-leasing-trends-india-2026',  meta:'Retail · 2026'},
      {type:'article', icon:'fa-newspaper', title:'Distressed Hospitality Assets in India 2026',                 url:'/insights/debt-special-situations-india-hospitality-2026', meta:'Debt · Special Situations'},
    ];

    var overlay  = document.getElementById('ig-search-overlay');
    var input    = document.getElementById('ig-search-input');
    var results  = document.getElementById('ig-search-results');
    var activeIdx = -1;

    function open(){
      if(!overlay) return;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      if(input){ input.value = ''; input.focus(); }
      if(results) results.innerHTML = '';
      activeIdx = -1;
      renderAll();
    }
    function close(){
      if(!overlay) return;
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    /* Show a short "featured" list when query is empty */
    function renderAll(){
      if(!results) return;
      var featured = IG_INDEX.filter(function(x){ return x.type==='mandate'; }).slice(0,5)
        .concat(IG_INDEX.filter(function(x){ return x.type==='page'; }).slice(0,4));
      render(featured, '');
    }

    function query(q){
      if(!q || !q.trim()){ renderAll(); return; }
      var lq = q.toLowerCase();
      var hits = IG_INDEX.filter(function(item){
        return (item.title + ' ' + (item.meta||'') + ' ' + item.url).toLowerCase().indexOf(lq) !== -1;
      }).slice(0, 10);
      render(hits, q);
    }

    function typeColor(t){
      if(t==='mandate') return '#B8960C';
      if(t==='article') return '#1A3A6B';
      return '#065F46';
    }
    function typeLabel(t){
      if(t==='mandate') return 'Mandate';
      if(t==='article') return 'Article';
      return 'Page';
    }

    function render(items, q){
      if(!results) return;
      activeIdx = -1;
      if(items.length === 0){
        results.innerHTML = '<div style="padding:2rem 1.25rem;text-align:center;font-size:.8rem;color:rgba(255,255,255,.3);">No results for <em style="color:rgba(255,255,255,.55)">&ldquo;'+q+'&rdquo;</em></div>';
        return;
      }
      var html = items.map(function(item, i){
        var accent = typeColor(item.type);
        var label  = typeLabel(item.type);
        var metaHtml = item.meta ? '<span style="font-size:.65rem;color:rgba(255,255,255,.3);margin-left:auto;white-space:nowrap;">'+item.meta+'</span>' : '';
        return '<a href="'+item.url+'" class="ig-sr-item" data-idx="'+i+'" style="display:flex;align-items:center;gap:.85rem;padding:.7rem 1.1rem;text-decoration:none;border-left:2px solid transparent;transition:background .14s,border-color .14s;" onmouseenter="igSearchHover('+i+')" onclick="igSearchClose()">'
          +'<i class="fas '+item.icon+'" style="font-size:.75rem;color:'+accent+';width:16px;text-align:center;flex-shrink:0;"></i>'
          +'<div style="flex:1;min-width:0;">'
          +'<div style="font-size:.82rem;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+item.title+'</div>'
          +'<div style="font-size:.6rem;color:rgba(255,255,255,.25);margin-top:.15rem;">'+item.url+'</div>'
          +'</div>'
          +metaHtml
          +'<span style="font-size:.55rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;background:'+accent+'22;color:'+accent+';border:1px solid '+accent+'44;padding:.1rem .45rem;flex-shrink:0;">'+label+'</span>'
          +'</a>';
      }).join('');
      results.innerHTML = html;
      if(items.length > 0) setActive(0);
    }

    function setActive(i){
      var items = results ? results.querySelectorAll('.ig-sr-item') : [];
      items.forEach(function(el, idx){
        el.style.background    = idx===i ? 'rgba(184,150,12,.08)' : '';
        el.style.borderColor   = idx===i ? 'var(--gold)' : 'transparent';
      });
      activeIdx = i;
    }

    function key(e){
      var items = results ? results.querySelectorAll('.ig-sr-item') : [];
      if(e.key === 'ArrowDown'){
        e.preventDefault();
        setActive(Math.min(activeIdx+1, items.length-1));
      } else if(e.key === 'ArrowUp'){
        e.preventDefault();
        setActive(Math.max(activeIdx-1, 0));
      } else if(e.key === 'Enter'){
        e.preventDefault();
        if(activeIdx >= 0 && items[activeIdx]){
          window.location.href = items[activeIdx].getAttribute('href');
        }
      } else if(e.key === 'Escape'){
        close();
      }
    }

    /* expose globally */
    window.igSearchOpen  = open;
    window.igSearchClose = close;
    window.igSearchQuery = query;
    window.igSearchKey   = key;
    window.igSearchHover = setActive;

    /* Keyboard shortcut: Ctrl+K / Cmd+K */
    document.addEventListener('keydown', function(e){
      if((e.ctrlKey || e.metaKey) && e.key === 'k'){
        e.preventDefault();
        if(overlay && overlay.classList.contains('open')) close(); else open();
      }
    });
  })();

})();
</script>`

// Additional window aliases (Phase M)
;(window as any).igGovDownloadAppointment = (window as any).igGovDownloadAppointmentLetter;
;(window as any).igGovSendComplianceReminder = (window as any).igGovSendEventReminder;
;(window as any).igWfTestRun = (window as any).igWfRunTest;
