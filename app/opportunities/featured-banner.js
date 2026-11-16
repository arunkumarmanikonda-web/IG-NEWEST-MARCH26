"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import BrandLogo from "../brand-logo";
import PropertyTags from "../property-tags";
import { Arrow } from "../components";
import { propertyPhotoURL } from "../../lib/listing-images.mjs";
import "./featured-banner.css";

const eventRequests = new Map();
function allowAggregateMeasurement() {
  return typeof window !== "undefined" && navigator.globalPrivacyControl !== true &&
    navigator.doNotTrack !== "1" && window.doNotTrack !== "1";
}

export function trackFeatureEvent(campaignId, event) {
  if (!campaignId || !["impression", "open"].includes(event) || !allowAggregateMeasurement()) return;
  const eventKey = campaignId + ":" + event;
  const previous = eventRequests.get(eventKey);
  if (previous?.busy || previous?.sent) return;
  // Retry receipts are scoped to this one event on this page, never to a visitor.
  const id = previous?.id || window.crypto?.randomUUID?.();
  if (!id) return;
  const state = { id, busy: true, sent: false };
  eventRequests.set(eventKey, state);
  fetch("/api/listings/feature-event", {
    method: "POST", credentials: "omit", referrerPolicy: "no-referrer", keepalive: true, headers: { "content-type": "application/json" },
    body: JSON.stringify({ campaign_id: campaignId, idempotency_key: id, event }),
  }).then(response => {
    if (response.ok) state.sent = true;
  }).catch(() => {}).finally(() => { state.busy = false; });
}

export function FeatureBriefOpen({campaignId}) {
  useEffect(() => {
    const record = () => {
      if (document.visibilityState === "visible") trackFeatureEvent(campaignId, "open");
    };
    record();
    document.addEventListener("visibilitychange", record);
    return () => document.removeEventListener("visibilitychange", record);
  }, [campaignId]);
  return null;
}

export function useFeatureImpression(campaignId, enabled = true) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!enabled || !campaignId || !node || !("IntersectionObserver" in window)) return;
    let visible = false;
    function record() {
      if (visible && document.visibilityState === "visible") trackFeatureEvent(campaignId, "impression");
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      record();
    }, { threshold: 0.5 });
    observer.observe(node);
    document.addEventListener("visibilitychange", record);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", record);
    };
  }, [campaignId, enabled]);
  return ref;
}

function bannerFacts(item) {
  // Some public records include a second unit after the primary area.
  const rawArea = [item.area, item.areaUnit].filter(Boolean).join(" ").trim();
  const primaryArea = rawArea.replace(/(\b(?:acres?|hectares?|sq\.?\s*(?:ft|m)|square\s+(?:feet|metres|meters)))\s*,\s*\d.*$/i, "$1");
  const area = primaryArea.replace(/^(\d{4,})(?=\s|$)/, n => Number(n).toLocaleString("en-IN"));
  return [["Keys", item.keys], ["Area", area], ["Asset type", item.assetClass], ["Transaction", item.transaction]]
    .filter(([, value]) => value !== undefined && value !== null && value !== "").slice(0, 2);
}

function FeaturedCard({ item, lead, preview }) {
  const feature = item.feature;
  const ref = useFeatureImpression(feature.id, !preview);
  const Wrapper = preview ? "div" : Link;
  const href = "/opportunities/" + item.slug + (feature.id ? "?feature=" + encodeURIComponent(feature.id) : "");
  const image = item.image;
  const imageLabel = image?.startsWith("/images/generated/") ? "AI illustration"
    : /\b(?:sketch|illustration)\b/i.test(item.imageAlt || "") ? "Illustration" : "";
  const facts = bannerFacts(item);
  return <article ref={ref} className={"opportunity-feature-card" + (lead ? " opportunity-feature-lead" : "")}>
    <Wrapper className="opportunity-feature-link" {...(!preview && {href})}>
      <div className="opportunity-feature-media">
        {image ? <Image src={propertyPhotoURL(image)} alt="" fill
          unoptimized={/^\/images\/(generated|library)\//.test(image)}
          sizes={lead ? "(max-width: 760px) 100vw, 62vw" : "(max-width: 760px) 100vw, 35vw"} />
          : <div className="opportunity-feature-placeholder"><BrandLogo light decorative /><span>Photography on request</span></div>}
        {imageLabel && <span className="opportunity-feature-disclosure">{imageLabel}</span>}
      </div>
      <div className="opportunity-feature-copy">
        {item.location && <p className="opportunity-feature-locality">{item.location}</p>}
        <h3>{feature.headline || item.title}</h3>
        {facts.length > 0 && <dl className="opportunity-feature-facts">
          {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>}
        <PropertyTags tags={item.tags} contexts={item.contexts} />
        <span className="opportunity-feature-cta">View opportunity <Arrow /></span>
      </div>
    </Wrapper>
  </article>;
}

export default function FeaturedBanner({ items = [], preview = false }) {
  const [selectedSlug, setSelectedSlug] = useState("");
  const [previewWidth, setPreviewWidth] = useState("wide");
  const id = useId();
  const visible = items.filter(item => item?.feature && item.slug)
    .sort((a, b) => Number(a.feature.slot) - Number(b.feature.slot)).slice(0, 3);
  if (!visible.length) return null;
  const index = Math.max(0, visible.findIndex(item => item.slug === selectedSlug));
  const current = visible[index];
  const cards = [current, ...visible.filter(item => item !== current)];
  const multiple = visible.length > 1;
  function move(distance) {
    setSelectedSlug(visible[(index + distance + visible.length) % visible.length].slug);
  }
  return <>
    {preview && <div className="opportunity-feature-preview-tools" role="group" aria-label="Preview width">
      <button type="button" aria-pressed={previewWidth === "wide"} onClick={() => setPreviewWidth("wide")}>Desktop</button>
      <button type="button" aria-pressed={previewWidth === "narrow"} onClick={() => setPreviewWidth("narrow")}>Mobile</button>
    </div>}
    <section className={"opportunity-features" + (preview ? " opportunity-feature-preview opportunity-preview-" + previewWidth : "")}
      aria-label="Featured listings" aria-roledescription={multiple ? "carousel" : undefined}>
      {multiple && <div className="opportunity-feature-controls" role="group" aria-label="Change the lead property"
        onKeyDown={e => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            move(e.key === "ArrowLeft" ? -1 : 1);
          }
        }}>
        <button type="button" aria-controls={id} aria-label="Previous featured property" onClick={() => move(-1)}>
          <span aria-hidden="true">←</span></button>
        <span role="status" aria-live="polite" aria-atomic="true">
          <span aria-hidden="true">{index + 1} / {visible.length}</span>
          <span className="visually-hidden">Featured property {index + 1} of {visible.length}. {current.feature.headline || current.title}</span>
        </span>
        <button type="button" aria-controls={id} aria-label="Next featured property" onClick={() => move(1)}>
          <span aria-hidden="true">→</span></button>
      </div>}
      <div id={id} className={"opportunity-feature-layout opportunity-feature-count-" + visible.length}>
        {cards.map((item, position) => <FeaturedCard key={item.slug} item={item} lead={position === 0} preview={preview} />)}
      </div>
    </section>
  </>;
}
