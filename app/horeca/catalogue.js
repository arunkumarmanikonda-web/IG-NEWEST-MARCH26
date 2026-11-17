"use client";
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {basketKey,normaliseBasket,addProduct} from '../../lib/procurement.mjs';
import {catalogueResults} from '../../lib/catalogue-results.mjs';
import {categoryHref,horecaCategory,productType} from '../../lib/horeca-categories.mjs';
import {collectionDirectory,horecaCollectionDefaults} from '../../lib/horeca-collections.mjs';
import CategoryIcon from './category-icon';
import {Arrow} from '../components';
import './priority-products.css';
import './catalogue.css';

const pageSize=24;
function ProductPhoto({product}){
  const [failed,setFailed]=useState(false),d=product.public_data;
  return <Link className="sku-photo" href={'/horeca/products/'+product.slug} aria-label={'View '+product.title}>
    {d.image&&!failed?<img src={d.image} alt={d.image_alt||product.title} loading="lazy" onError={()=>setFailed(true)}/>:<span className="sku-photo-empty"><CategoryIcon id={horecaCategory(product).id}/><span>Request product photograph</span></span>}
  </Link>;
}

export default function Catalogue({products,priorities,initialCategory='',collections=horecaCollectionDefaults}){
  const [query,setQuery]=useState(''),[brand,setBrand]=useState(''),[type,setType]=useState(''),[sort,setSort]=useState('name'),[limit,setLimit]=useState(pageSize),[notice,setNotice]=useState('');
  const directory=useMemo(()=>collectionDirectory(products,collections),[products,collections]);
  const selected=collections.collections.find(c=>c.id===initialCategory);
  const category=selected?.id||'';
  const categoryCount=directory.find(c=>c.id===category)?.count||0;
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
  return <section className={'section-pad horeca-catalogue'+(selected?' is-collection':'')} id="catalogue">
    {selected?<><Link className="collection-back" href={categoryHref('')}>← All HORECA collections</Link><header className="horeca-collection-hero">
      <img src={selected.image} alt={selected.alt} width="1440" height="960" fetchPriority="high"/>
      <div className="collection-hero-copy"><div className="eyebrow">INDIA GULLY / HORECA COLLECTION</div><p className="collection-kicker">{selected.kicker}</p><h1>{selected.title}</h1><p>{selected.description}</p><span className="collection-hero-rule"/>{categoryCount>0&&<span className="collection-hero-count">{categoryCount} SKUs to explore</span>}</div>
    </header></>:<div className="section-heading collection-heading"><div><div className="eyebrow">INDIA GULLY / HORECA COLLECTIONS</div><h2>{collections.title.split('\n').map((line,i)=><span key={i}>{line}{i<collections.title.split('\n').length-1&&<br/>}</span>)}</h2></div><p>{collections.description}</p></div>}
    <div className="horeca-directory-tools">
      <p className="collection-browse-note">{selected?'Find the right specification for your space.':'Explore by collection, or find a specific product.'}</p>
      <label className="catalogue-search">{selected?'Search '+selected.title.toLowerCase():'Find a specific SKU or product'}<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setBrand('');setType('');setLimit(pageSize);}} placeholder="Product, SKU, brand or manufacturer code"/></label>
    </div>
    {!browsing?<div className="horeca-category-directory" aria-label="HORECA product categories">{directory.map((c,i)=><Link className="horeca-category-tile" key={c.id} href={categoryHref(c.id)}>
      <div className="collection-image"><img src={c.image} alt={c.alt} width="1440" height="960" loading="lazy" decoding="async"/><span className="collection-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><span className="collection-image-label">{c.kicker}</span></div>
      <div className="collection-caption"><div><span className="collection-overline">HORECA COLLECTION</span><h3>{c.title}</h3></div><span className="category-arrow" aria-hidden="true"><Arrow/></span></div><p>{c.description}</p><span className="category-count">{c.count?c.count+' SKUs · Explore collection':'Source for your project'}</span>
    </Link>)}</div>:<>
      <nav className="horeca-category-nav" aria-label="Filter product category">{directory.map(c=><Link key={c.id} href={categoryHref(c.id)} aria-current={c.id===category?'page':undefined}>{c.title}<span>{c.count||<Arrow/>}</span></Link>)}</nav>
      <div className="sku-filter-bar"><label>Brand<select value={brand} onChange={e=>{setBrand(e.target.value);setType('');setLimit(pageSize);}}><option value="">All brands</option>{brands.map(b=><option key={b}>{b}</option>)}</select></label>
        <label>Product type<select value={type} onChange={e=>{setType(e.target.value);setLimit(pageSize);}}><option value="">All types</option>{types.map(t=><option key={t}>{t}</option>)}</select></label>
        <label>Sort SKUs<select value={sort} onChange={e=>{setSort(e.target.value);setLimit(pageSize);}}><option value="name">Product name A–Z</option><option value="priority">Featured first</option><option value="newest">Newest published</option></select></label>
        <button className="sku-clear" type="button" onClick={reset}>Clear filters</button>
      </div>
      <div className="sku-results-summary"><p role="status">{results.length} {results.length===1?'SKU':'SKUs'}{selected?' in '+selected.title:''}{query.trim()?' matching “'+query.trim()+'”':''}</p>{!!results.length&&<span>Explore. Specify. Request a quote.</span>}</div>
      {notice&&<p className="sku-basket-notice" role="status">{notice} <a href="#quotation-basket">View basket →</a></p>}
      <div className="catalogue-grid sku-grid">{results.slice(0,limit).map(p=>{const d=p.public_data,href='/horeca/products/'+p.slug;return <article key={p.id}>
        <ProductPhoto key={d.image} product={p}/><div className="sku-card-content"><p className="sku-brand">{d.brand||horecaCategory(p).label}{featuredIds.has(p.id)&&<span>Featured</span>}</p><h3><Link href={href}>{p.title}</Link></h3>
          <dl className="sku-card-facts">{[['SKU',d.sku],['Model',d.reference]].filter(([,v])=>v).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <p className="sku-description">{p.summary}</p>{d.price_label&&<p className="sku-price">{d.price_label}</p>}
          <div className="catalogue-links"><Link href={href}>View specification <Arrow/></Link><button type="button" onClick={()=>add(p)}>Add to quotation</button></div>
        </div></article>;})}</div>
      {limit<results.length&&<button type="button" className="button catalogue-more" onClick={()=>setLimit(limit+pageSize)}>Show more SKUs ({results.length-limit})</button>}
      {!results.length&&<div className="sku-empty"><div className="eyebrow">SOURCING WITH INDIA GULLY</div><h3>{!query&&!brand&&!type?'Selected for your project.':'No matching SKUs.'}</h3><p>{!query&&!brand&&!type?'Share your '+(selected?.title.toLowerCase()||'procurement')+' requirements, quantities and delivery location. Our HORECA team will prepare the options.':'Try another product name or clear your filters.'}</p><Link className="button" href={'/contact?interest='+encodeURIComponent('HORECA: '+(selected?.title||query||'Procurement'))}>Discuss this requirement <Arrow/></Link></div>}
    </>}
    <div className="horeca-practice-note"><div className="eyebrow">MORE THAN A PRODUCT CATALOGUE</div><p>India Gully’s HORECA practice connects specification planning, sourcing, vendor comparison and delivery coordination.</p><Link href="/contact?interest=HORECA%20procurement">Plan a complete procurement brief <Arrow/></Link></div>
  </section>;
}
