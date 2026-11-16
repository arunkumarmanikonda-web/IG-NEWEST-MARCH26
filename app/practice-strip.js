"use client";

import { useEffect, useRef, useState } from "react";
import "./practice-strip.css";

export default function PracticeStrip({ practices = [] }) {
  const viewport = useRef(null);
  const list = useRef(null);
  const [overflow, setOverflow] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const loop = overflow && !reducedMotion;

  useEffect(() => {
    if (!list.current) return;
    const frame = viewport.current;
    const items = list.current;
    const measure = () => setOverflow(items.offsetWidth > frame.clientWidth);
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(items);
    measure();

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(preference.matches);
    syncMotion();
    preference.addEventListener("change", syncMotion);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", syncMotion);
    };
  }, [practices.length]);

  useEffect(() => {
    if (!loop || paused || hovered || focused) return;
    const frame = viewport.current;
    const items = list.current;
    let previousTime;
    let fraction = 0;
    let animation;
    const advance = (now) => {
      if (previousTime !== undefined) {
        // Accumulate subpixels on screens that round native scroll positions.
        fraction += Math.min(now - previousTime, 64) * 0.026;
        const pixels = Math.floor(fraction);
        if (pixels) {
          fraction -= pixels;
          frame.scrollLeft = (frame.scrollLeft + pixels) % items.offsetWidth;
        }
      }
      previousTime = now;
      animation = requestAnimationFrame(advance);
    };
    animation = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(animation);
  }, [loop, paused, hovered, focused]);

  if (!practices.length) return null;
  const links = (copy) => (
    <ul ref={copy ? undefined : list} aria-hidden={copy || undefined}>
      {practices.map(({ slug, title, href }) => (
        <li key={slug}>
          <a href={href || `/practices/${slug}`} tabIndex={copy ? -1 : undefined}
            onMouseDown={copy ? (event) => { if (event.button === 0) event.preventDefault(); } : undefined}>
            {title}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <nav id="practice-strip" className="practice-strip" aria-label="India Gully practices">
      <a className="practice-strip-index" href="/practices">Our practices</a>
      {loop && (
        <button className="practice-strip-toggle" type="button"
          aria-label={paused ? "Play practice banner" : "Pause practice banner"}
          title={paused ? "Play practice banner" : "Pause practice banner"}
          onClick={() => setPaused(!paused)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d={paused ? "M4 2v12l9-6z" : "M3 2h3v12H3zm7 0h3v12h-3z"} />
          </svg>
        </button>
      )}
      <div className="practice-strip-viewport" ref={viewport}
        onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={(event) => { if (event.pointerType !== "mouse") setPaused(true); }}
        onWheel={(event) => { if (event.deltaX || event.shiftKey) setPaused(true); }}
        onFocus={() => setFocused(true)}
        onBlur={(event) => setFocused(event.currentTarget.contains(event.relatedTarget))}>
        {links(false)}
        {loop && links(true)}
      </div>
    </nav>
  );
}
