"use client";
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {basketKey,normaliseBasket,addProduct} from '../../lib/procurement.mjs';
import {catalogueResults} from '../../lib/catalogue-results.mjs';
import {categoryDirectory,categoryHref,horecaCategories,horecaCategory,productType} from '../../lib/horeca-categories.mjs';
import CategoryIcon from './category-icon';
import './priority-products.css';
import './catalogue.css';

const pageSize=24;
function ProductPhoto({product}){
  const [failed,setFailed]=useState(false),d=product.public_data;
  return <Link className="sku-photo" href={'/horeca/products/'+product.slug} aria-label={'View '+product.title}>
    {d.image&&!failed?<img src={d.image} alt={d.image_alt||product.title} loading="lazy" onError={()=>setFailed(true)}/>:<span className="sku-photo-empty"><CategoryIcon id={horecaCategory(product).id}/><span>Request product photograph</span></span>}
  </Link>;
}

export default function Catalogue({products,priorities,initialCategory=''}){
  const [query,setQuery]=useState(''),[brand,setBrand]=useState(''),[type,setType]=useState(''),[sort,setSort]=useState('name'),[limit,setLimit]=useState(pageSize),[notice,setNotice]=useState('');
  const directory=useMemo(()=>categoryDirectory(products),[products]);
  const selected=horecaCategories.find(c=>c.id===initialCategory);
  const category=selected?.id||'';
  const browsing=Boolean(selected||query.trim());
  const scoped=useMemo(()=>catalogueResults(products,[],query,'newest',{category}),[products,query,category]);
  const brands=[...new Set(scoped.map(p=>p.public_data.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const types=[...new Set(scoped.filter(p=>!brand||p.public_data.brand===brand).map(productType))].sort();
  const results=useMemo(()=>catalogueResults(products,priorities,query,sort,{category,brand,type}),[products,priorities,query,sort,category,brand,type]);
  const featuredIds=useMemo(()=>new Set(priorities.map(p=>p.content_id)),[priorities]);
  function reset(){setQuery('');setBrand('');setType('');setSort('name');setLimit(pageSize);}
  function add(p){
    try{const rows=normaliseBasket(JSON.parse(localStorage.getItem(basketKey)||'[]'));localStorage.setItem(basketKey,JSON.stringify(addProduct(rows,p)));window.dispatchEvent(new Event('ig-basket'));setNotice(p.title+' added to your quotation basket.');}
    catch{setNotice('Unable to save the basket in this browser. Use the custom requirement form below.');}
  }
  return <section className="section-pad horeca-catalogue" id="catalogue">
    <div className="section-heading"><div><div className="eyebrow">HORECA / PRODUCT DIRECTORY</div><h2>{selected?selected.label:'Every requirement. In its place.'}</h2></div><p>{selected?selected.description:'Choose a category, explore the individual SKUs and build your procurement requirement.'}</p></div>
    <div className="horeca-directory-tools">
      {selected&&<Link className="text-link" href={categoryHref('')}>← All product categories</Link>}
      <label className="catalogue-search">{selected?'Search '+selected.label.toLowerCase():'Find a specific SKU or product'}<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setBrand('');setType('');setLimit(pageSize);}} placeholder="Product, SKU, brand or manufacturer code"/></label>
    </div>
    {!browsing?<div className="horeca-category-directory" aria-label="HORECA product categories">{directory.map(c=><Link className="horeca-category-tile" key={c.id} href={categoryHref(c.id)}>
      <div className="category-tile-top"><CategoryIcon id={c.id}/><span className="category-arrow" aria-hidden="true">↗</span></div><h3>{c.label}</h3><p>{c.description}</p><span className="category-count">{c.count?c.count+' published SKUs':'Sourcing on request'}</span>
    </Link>)}</div>:<>
      <nav className="horeca-category-nav" aria-label="Filter product category">{directory.map(c=><Link key={c.id} href={categoryHref(c.id)} aria-current={c.id===category?'page':undefined}>{c.label}<span>{c.count||'↗'}</span></Link>)}</nav>
      <div className="sku-filter-bar"><label>Brand<select value={brand} onChange={e=>{setBrand(e.target.value);setType('');setLimit(pageSize);}}><option value="">All brands</option>{brands.map(b=><option key={b}>{b}</option>)}</select></label>
        <label>Product type<select value={type} onChange={e=>{setType(e.target.value);setLimit(pageSize);}}><option value="">All types</option>{types.map(t=><option key={t}>{t}</option>)}</select></label>
        <label>Sort SKUs<select value={sort} onChange={e=>{setSort(e.target.value);setLimit(pageSize);}}><option value="name">Product name A–Z</option><option value="priority">Featured first</option><option value="newest">Newest published</option></select></label>
        <button className="sku-clear" type="button" onClick={reset}>Clear filters</button>
      </div>
      <div className="sku-results-summary"><p role="status">{results.length} {results.length===1?'SKU':'SKUs'}{selected?' in '+selected.label:''}{query.trim()?' matching “'+query.trim()+'”':''}</p>{!!results.length&&<span>Specification → Quantity → Quotation</span>}</div>
      {notice&&<p className="sku-basket-notice" role="status">{notice} <a href="#quotation-basket">View basket →</a></p>}
      <div className="catalogue-grid sku-grid">{results.slice(0,limit).map(p=>{const d=p.public_data,href='/horeca/products/'+p.slug;return <article key={p.id}>
        <ProductPhoto key={d.image} product={p}/><div className="sku-card-content"><p className="sku-brand">{d.brand||horecaCategory(p).label}{featuredIds.has(p.id)&&<span>Featured</span>}</p><h3><Link href={href}>{p.title}</Link></h3>
          <dl className="sku-card-facts">{[['SKU',d.sku],['Model',d.reference],['Unit',d.uom],['Pack',d.pack_size]].filter(([,v])=>v).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <p className="sku-description">{p.summary}</p>{d.price_label&&<p className="sku-price">{d.price_label}</p>}
          <div className="catalogue-links"><Link href={href}>View specification ↗</Link><button type="button" onClick={()=>add(p)}>Add to quotation</button></div>
        </div></article>;})}</div>
      {limit<results.length&&<button type="button" className="button catalogue-more" onClick={()=>setLimit(limit+pageSize)}>Show more SKUs ({results.length-limit})</button>}
      {!results.length&&<div className="sku-empty"><CategoryIcon id={category}/><h3>{!query&&!brand&&!type?'Let’s source your '+(selected?.label.toLowerCase()||'requirement')+'.':'No matching SKUs.'}</h3><p>{!query&&!brand&&!type?'Share the specification, quantities and delivery location. Our HORECA team will prepare the options.':'Try another product name or clear your filters.'}</p><Link className="button" href={'/contact?interest='+encodeURIComponent('HORECA: '+(selected?.label||query||'Procurement'))}>Discuss this requirement ↗</Link></div>}
    </>}
    <div className="horeca-practice-note"><div className="eyebrow">MORE THAN A PRODUCT CATALOGUE</div><p>India Gully’s HORECA practice connects specification planning, sourcing, vendor comparison and delivery coordination.</p><Link href="/contact?interest=HORECA%20procurement">Plan a complete procurement brief ↗</Link></div>
  </section>;
}
