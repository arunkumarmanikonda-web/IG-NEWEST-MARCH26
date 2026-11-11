import { siteConfig } from "./lib/seo.mjs";
export default {
  poweredByHeader: false,
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas"],
  outputFileTracingIncludes: {
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
