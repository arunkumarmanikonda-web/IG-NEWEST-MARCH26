import {businessDetails} from "../lib/runtime-config";
import { siteConfig } from "../lib/seo.mjs";
import "./globals.css";
import "./editorial.css";
import "./brand.css";
import "./property-collection.css";
import Link from "next/link";
import Navigation from "./navigation";
import { Arrow } from "./components";
import { practices, contact } from "../lib/content.mjs";
export const dynamic = "force-dynamic";
export const metadata = {
  title: {
    default: "India Gully | Property. Advisory. Transactions.",
    template: "%s | India Gully",
  },
  description:
    "Real estate, transaction advisory, debt and special situations, hospitality projects and HORECA procurement. Commercial perspective from strategy to execution.",
  metadataBase: new URL(siteConfig().origin),
  robots: { index: siteConfig().indexable, follow: siteConfig().indexable },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.svg",
    apple: [{url:"/apple-touch-icon.png",sizes:"180x180",type:"image/png"}],
    other: [{ rel: "mask-icon", url: "/mask-icon.svg", color: "#d4b012" }],
  },
  manifest: "/manifest.webmanifest",
};
export default async function Layout({ children }) {
  const business=await businessDetails();
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to main content
        </a>
        <div className="utility-bar">
          <span>
            ADVISORY · TRANSACTIONS · DELIVERY
          </span>
          <Link href="/valuation">
            Explore the valuation studio <Arrow />
          </Link>
        </div>
        <Navigation />
        {children}
        <footer className="site-footer">
          <div className="footer-top">
            <div className="footer-brand">
              <Link href="/">
                <img
                  src="/brand/logo-white.svg"
                  alt="India Gully"
                  width="260"
                  height="61"
                />
              </Link>
              <p>
                Indian perspective.
                <br />
                Commercial purpose.
              </p>
              <small>
                A brand of {business.legal_name}
              </small>
            </div>
            <div>
              <h2>Our practices</h2>
              {practices.map((p) => (
                <Link key={p.slug} href={"/practices/" + p.slug}>
                  {p.title}
                </Link>
              ))}
              <Link href="/horeca">HORECA Procurement</Link>
            </div>
            <div>
              <h2>Explore</h2>
              <Link href="/opportunities">Property Collection</Link>
              <Link href="/projects">Hospitality projects</Link>
              <Link href="/valuation">Valuation studio</Link>
              <Link href="/insights">Perspectives</Link>
              <Link href="/about">About India Gully</Link>
              <Link href="/leadership">Our leadership</Link>
              <Link href="/our-work">Selected work</Link>
              <Link href="/nda">Confidentiality & NDA</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/account">Account & staff login</Link>
            </div>
            <div>
              <h2>Start a conversation</h2><p className="footer-legal">CIN {business.cin}<br/>GSTIN {business.gstin}{business.registered_office&&<><br/>{business.registered_office}</>}</p>
              <a href={"mailto:" + business.email}>{business.email}</a>
              <a href={"tel:" + business.phone}>{business.phone}</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} India Gully. All rights reserved.
            </span>
            <span>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms of use</Link>
              <Link href="/data-usage">Data usage</Link><Link href="/cookies">Cookies</Link><Link href="/commerce-terms">Procurement terms</Link><Link href="/refunds">Refunds</Link><Link href="/shipping">Delivery</Link><Link href="/grievances">Grievances</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
