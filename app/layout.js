import { siteConfig } from "../lib/seo.mjs";
import "./globals.css";
import "./editorial.css";
import Link from "next/link";
import Navigation from "./navigation";
import { Arrow } from "./components";
import { practices, contact } from "../lib/content.mjs";
export const metadata = {
  title: {
    default: "India Gully | Advisory. Transactions. Delivery.",
    template: "%s | India Gully",
  },
  description:
    "Real estate, transaction advisory, debt and special situations, hospitality projects and HORECA procurement. Commercial perspective from strategy to execution.",
  metadataBase: new URL(siteConfig().origin),
  robots: { index: siteConfig().indexable, follow: siteConfig().indexable },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/mark.png", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    other: [{ rel: "mask-icon", url: "/mask-icon.svg", color: "#cfaf00" }],
  },
  manifest: "/manifest.webmanifest",
};
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to main content
        </a>
        <div className="utility-bar">
          <span>
            INDIA GULLY <i /> ADVISORY · TRANSACTIONS · DELIVERY
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
                  src="/logo-white.png"
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
                A brand of Vivacious Entertainment
                <br />
                and Hospitality Pvt. Ltd.
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
              <Link href="/opportunities">Opportunities</Link>
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
              <h2>Start a conversation</h2>
              <a href={"mailto:" + contact.email}>{contact.email}</a>
              <a href={"tel:" + contact.tel}>{contact.phone}</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} India Gully. All rights reserved.
            </span>
            <span>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms of use</Link>
              <Link href="/data-usage">Data usage</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
