"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { catalogueImageCredit } from "../../lib/product-images.mjs";
import { basketKey, normaliseBasket, addProduct } from "../../lib/procurement.mjs";
import { catalogueResults } from "../../lib/catalogue-results.mjs";
import "./priority-products.css";

const pageSize = 24;

export default function Catalogue({ products, priorities }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("priority");
  const [limit, setLimit] = useState(pageSize);
  const [notice, setNotice] = useState("");
  const results = useMemo(() => catalogueResults(products, priorities, query, sort), [products, priorities, query, sort]);
  const featuredIds = useMemo(() => new Set(priorities.map(p => p.content_id)), [priorities]);
  function add(p) {
    try {
      const rows = normaliseBasket(JSON.parse(localStorage.getItem(basketKey) || "[]"));
      localStorage.setItem(basketKey, JSON.stringify(addProduct(rows, p)));
      window.dispatchEvent(new Event("ig-basket"));
      setNotice(p.title + " added to your quotation basket.");
    } catch {
      setNotice("Unable to save the basket in this browser. Use the custom requirement form below.");
    }
  }

  return <section className="section-pad" id="catalogue">
    <div className="section-heading"><div><div className="eyebrow">CURATED PROCUREMENT</div><h2>Explore the catalogue.</h2></div>
      <p>Review the approved specification, then request a quotation for your quantities and destination.</p>
    </div>
    <div className="catalogue-filter-bar">
      <label className="catalogue-search">Find a product or category
        <input type="search" value={query} onChange={event => {setQuery(event.target.value); setLimit(pageSize);}} placeholder="Search crockery, kitchen, linen…"/>
      </label>
      <label className="catalogue-search catalogue-sort">Sort products
        <select value={sort} onChange={event => {setSort(event.target.value); setLimit(pageSize);}}>
          <option value="priority">Featured first</option>
          <option value="newest">Newest published</option>
          <option value="name">Product name A–Z</option>
        </select>
      </label>
    </div>
    {notice && <p className="fine-note" role="status">{notice}</p>}
    <p className="fine-note" aria-live="polite">{results.length} {results.length === 1 ? "product" : "products"}</p>
    <div className="catalogue-grid">
      {results.slice(0, limit).map(p => {
        const data = p.public_data, credit = catalogueImageCredit(data);
        const href = "/horeca/products/" + p.slug;
        return <article key={p.id}>
          {data.image && <Link href={href}><img src={data.image} alt={data.image_alt || p.title} loading="lazy"/></Link>}
          <div>
            {credit && <p className="fine-note">{credit}</p>}
            <p className="eyebrow">{featuredIds.has(p.id) && "Featured · "}{data.category || data.sector || "HORECA"}</p>
            <h3><Link href={href}>{p.title}</Link></h3>
            {(data.brand || data.sku) && <p className="fine-note">{[data.brand, data.sku && "SKU " + data.sku].filter(Boolean).join(" · ")}</p>}
            <p>{p.summary}</p>
            {data.price_label && <p>{data.price_label}</p>}
            <div className="catalogue-links">
              <Link href={href}>View specification →</Link>
              <button onClick={() => add(p)}>Add to quotation basket</button>
            </div>
          </div>
        </article>;
      })}
    </div>
    {limit < results.length && <button type="button" className="button catalogue-more" onClick={() => setLimit(limit + pageSize)}>Show more products</button>}
    {!results.length && <p>{products.length ? "No products match this search." : "No products are currently published."} Share your requirements through the procurement enquiry form.</p>}
  </section>;
}
