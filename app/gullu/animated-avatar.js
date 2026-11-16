"use client";

import { useEffect, useRef } from "react";
import "./animated-avatar.css";

function Eye({ x, side }) {
  return (
    <g transform={`translate(${x} 38)`}>
      <g className={`patang-eye patang-eye-${side}`}>
        <ellipse rx="6.8" ry="8.2" fill="#fff7dc" stroke="#282a34" strokeWidth="1.8" />
        <g className="patang-pupil">
          <ellipse cx="0.7" cy="0.5" rx="3.8" ry="5.1" fill="#242837" />
          <circle cx="1.6" cy="-1.6" r="1.3" fill="#fffdf1" />
        </g>
      </g>
      <path className={`patang-wink patang-wink-${side}`} d="M-5 1Q0 -4 5 0" fill="none" stroke="#292b33" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

export default function AnimatedAvatar({ size = 40, mood = "idle" }) {
  const avatarRef = useRef(null);

  useEffect(() => {
    const svg = avatarRef.current;
    const target = svg.closest("button") || svg;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function reset() {
      svg.style.removeProperty("--gullu-look-x");
      svg.style.removeProperty("--gullu-look-y");
    }
    function lookAt(event) {
      if (preference.matches || event.pointerType === "touch") return;
      const box = target.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const offset = (point, start, length, range) =>
        Math.max(-1, Math.min(1, 2 * (point - start) / length - 1)) * range;
      svg.style.setProperty("--gullu-look-x", `${offset(event.clientX, box.left, box.width, 2)}px`);
      svg.style.setProperty("--gullu-look-y", `${offset(event.clientY, box.top, box.height, 1.5)}px`);
    }
    target.addEventListener("pointermove", lookAt);
    target.addEventListener("pointerleave", reset);
    preference.addEventListener("change", reset);
    return () => {
      target.removeEventListener("pointermove", lookAt);
      target.removeEventListener("pointerleave", reset);
      preference.removeEventListener("change", reset);
    };
  }, []);

  return (
    <svg ref={avatarRef} className="gullu-patang" data-mood={mood} width={size} height={size}
      viewBox="0 0 100 100" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <g className="patang-flight">
        <g className="patang-pose">
          <g className="patang-tail">
            <path d="M49 69C48 77 47 81 56 83S70 86 69 95" fill="none" stroke="#31303b" strokeWidth="2.8" strokeLinecap="round" />
            <path d="m48 80-6-5-2 7 8 1 5 5 2-6z" fill="#dc6048" stroke="#34313b" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="m68 88-6 3 1-7 5 2 6-4 1 6z" fill="#24a799" stroke="#34313b" strokeWidth="1.3" strokeLinejoin="round" />
          </g>
          <path className="patang-tassel" d="m85 34 7-6-1 5 5-1-6 7-7-1z" fill="#ee7151" stroke="#35313b" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M47 4Q66 12 90 35Q67 50 48 72Q34 53 8 37Q22 18 47 4Z" fill="#f7ad28" stroke="#272938" strokeWidth="2.7" strokeLinejoin="round" />
          <path d="M47 6Q56 10 65 17L48 24 31 16Q39 10 47 6Z" fill="#117e7e" />
          <path d="m34 17 14 6 13-5" fill="none" stroke="#f9e4a1" strokeWidth="2" strokeLinecap="round" />
          <path d="M11 37Q19 27 25 23L19 38l10 10Z" fill="#e96b41" />
          <path d="m48 69-8-10q8 3 16-1z" fill="#167d7e" />
          <path d="M12 36Q48 17 87 34M47 8l1 12m0 39v9" fill="none" stroke="#6d4728" strokeWidth="1.3" opacity=".6" />
          <path className="patang-brow" d="M28.5 27.4q3-3.3 7.8-2.6m16.8.4q3.1-2.6 7.1.1" fill="none" stroke="#30303a" strokeWidth="2.7" strokeLinecap="round" />
          <Eye x={36} side="near" />
          <Eye x={56} side="far" />
          <g fill="#da6544">
            <ellipse cx="24" cy="43" rx="3.5" ry="1.8" transform="rotate(16 24 43)" />
            <ellipse cx="67" cy="42" rx="3.5" ry="1.8" transform="rotate(-14 67 42)" />
          </g>
          <g className="patang-mouth">
            <path d="M38.4 49q7.4 4.3 16.7-1.4c-1.3 8.3-12.1 12-16.7 1.4Z" fill="#382e38" stroke="#382e38" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M43.5 54q4.1-3.6 8-2.3c-1.5 2.5-4.6 3.7-8 2.3Z" fill="#ee8778" />
          </g>
          <path className="patang-ponder" d="M43 51q4.5 1.8 7.5-.5" fill="none" stroke="#382e38" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
