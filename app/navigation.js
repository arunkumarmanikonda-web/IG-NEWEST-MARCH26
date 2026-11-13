"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Arrow } from "./components";
const groups = [
  {
    title: "The firm",
    links: [
      ["/about", "About India Gully"],
      ["/leadership", "Our leadership"],
      ["/our-work", "Selected work"],
      ["/nda", "Confidentiality & NDA"],
    ],
  },
  {
    title: "Expertise",
    links: [
      ["/practices", "All practices"],
      ["/practices/real-estate", "Real estate advisory"],
      ["/practices/transaction-advisory", "Transaction advisory"],
      ["/practices/debt-special-situations", "Debt & special situations"],
      ["/projects", "Hospitality, design & PMC"],
      ["/practices/retail-leasing", "Retail leasing"],
      ["/practices/entertainment", "Entertainment & destinations"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["/insights", "Perspectives"],
      ["/valuation", "Valuation studio"],
      ["/account", "Client & staff portal"],
    ],
  },
];
export default function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  function close() {
    setOpen(false);
    root.current
      ?.querySelectorAll("details[open]")
      .forEach((x) => x.removeAttribute("open"));
  }
  useEffect(() => {
    close();
  }, [path]);
  return (
    <header
      ref={root}
      className="site-header"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          const d = e.target.closest("details");
          close();
          d?.querySelector("summary")?.focus();
        }
      }}
    >
      <Link
        href="/"
        className="brand"
        aria-label="India Gully home"
        onClick={close}
      >
        <img
          src="/brand/logo-dark.svg"
          alt="India Gully. Celebrating Desiness."
          width="224"
          height="52"
        />
      </Link>
      <button
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="primary-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? "Close" : "Menu"}
        <span aria-hidden="true">{open ? "×" : "+"}</span>
      </button>
      <nav
        id="primary-navigation"
        className={open ? "site-nav is-open" : "site-nav"}
        aria-label="Primary"
      >
        {groups.slice(0, 2).map((g) => (
          <details
            className="nav-group"
            key={g.title}
            onToggle={(e) => {
              if (e.currentTarget.open)
                root.current?.querySelectorAll("details[open]").forEach((x) => {
                  if (x !== e.currentTarget) x.removeAttribute("open");
                });
            }}
          >
            <summary>
              {g.title}
              <span aria-hidden="true">⌄</span>
            </summary>
            <div className="nav-dropdown">
              {g.links.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  aria-current={path === href ? "page" : undefined}
                >
                  {label}
                  <Arrow />
                </Link>
              ))}
            </div>
          </details>
        ))}
        <Link
          href="/opportunities"
          aria-current={path.startsWith("/opportunities") ? "page" : undefined}
          onClick={close}
        >
          Opportunities
        </Link>
        <Link
          href="/horeca"
          aria-current={path === "/horeca" ? "page" : undefined}
          onClick={close}
        >
          HORECA
        </Link>
        <details className="nav-group">
          <summary>
            Resources<span aria-hidden="true">⌄</span>
          </summary>
          <div className="nav-dropdown">
            {groups[2].links.map(([href, label]) => (
              <Link key={href} href={href} onClick={close}>
                {label}
                <Arrow />
              </Link>
            ))}
          </div>
        </details>
        <Link href="/contact" className="nav-contact" onClick={close}>
          Let’s talk <Arrow />
        </Link>
      </nav>
    </header>
  );
}
