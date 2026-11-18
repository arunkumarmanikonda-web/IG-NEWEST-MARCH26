import { siteConfig } from "./lib/seo.mjs";
export default {
  poweredByHeader: false,
  serverExternalPackages: ["fflate","pdfjs-dist", "@napi-rs/canvas", "tesseract.js", "tesseract.js-core", "sharp"],
  outputFileTracingIncludes: {
    "/*": ["./lib/archive-worker.mjs", "./lib/identity-ocr.mjs", "./lib/identity-evidence.mjs", "./node_modules/fflate/**"],
    "/api/account/identity-check": ["./node_modules/tesseract.js/src/**", "./node_modules/tesseract.js-core/**", "./node_modules/@tesseract.js-data/eng/4.0.0_best_int/**", "./node_modules/pdfjs-dist/legacy/build/**", "./node_modules/pdfjs-dist/standard_fonts/**", "./node_modules/pdfjs-dist/wasm/**", "./node_modules/@napi-rs/canvas*/**"],
    "/opportunities/*/brief.pdf": ["./public/logo-dark.png", "./public/logo-white.png", "./public/images/**", "./assets/fonts/briefs/**", "./node_modules/@napi-rs/canvas*/**"],
    "/admin/content/*/brief.pdf": ["./public/logo-dark.png", "./public/logo-white.png", "./public/images/**", "./assets/fonts/briefs/**", "./node_modules/@napi-rs/canvas*/**"],
    "/api/admin/collections": ["./public/logo-dark.png", "./assets/fonts/IG-Card.ttf", "./node_modules/@napi-rs/canvas*/**"],
    "/api/admin/brand-catalogue": ["./node_modules/pdfjs-dist/legacy/build/**", "./node_modules/pdfjs-dist/standard_fonts/**", "./node_modules/pdfjs-dist/cmaps/**", "./node_modules/pdfjs-dist/wasm/**", "./node_modules/@napi-rs/canvas*/**"],
    "/api/internal/email-worker": ["./scripts/private-file-tools.py","./node_modules/pdfjs-dist/legacy/build/**", "./node_modules/pdfjs-dist/standard_fonts/**", "./node_modules/pdfjs-dist/cmaps/**", "./node_modules/pdfjs-dist/wasm/**", "./node_modules/@napi-rs/canvas*/**"],
    "/api/admin/intake": ["./node_modules/pdfjs-dist/legacy/build/**", "./node_modules/pdfjs-dist/wasm/**", "./node_modules/@napi-rs/canvas*/**"],
    "/api/data-room/file": [
      "./node_modules/pdfjs-dist/legacy/build/**",
      "./node_modules/pdfjs-dist/standard_fonts/**",
      "./node_modules/pdfjs-dist/cmaps/**",
      "./node_modules/pdfjs-dist/wasm/**",
      "./node_modules/@napi-rs/canvas*/**",
    ],
  },
  async redirects() {
    return [
      { source: "/works", destination: "/our-work", permanent: true },
      { source: "/services", destination: "/practices", permanent: true },
      { source: "/listings", destination: "/opportunities", permanent: true },
      {
        source: "/listings/:slug",
        destination: "/opportunities/:slug",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          ...(!siteConfig().indexable
            ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
            : []),
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
