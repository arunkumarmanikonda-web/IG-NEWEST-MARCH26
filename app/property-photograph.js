"use client";
import { useRef } from "react";
import Image from "next/image";
import BrandLogo from "./brand-logo";
import { Arrow } from "./components";

export default function PropertyPhotograph({ image, alt, title }) {
  const dialog = useRef(null);
  if (!image)
    return (
      <div className="property-detail-no-photo">
        <BrandLogo light />
        <p>Property photography available on enquiry.</p>
      </div>
    );
  const generated = image.startsWith("/images/generated/");
  return (
    <>
      <div className="property-photograph">
        <Image
          src={image}
          alt={alt || title}
          fill
          sizes="(max-width:760px) 90vw, 60vw"
          unoptimized={generated}
          preload
        />
        {generated && (
          <span className="generated-badge">
            Illustrative AI-generated concept
          </span>
        )}
        <button onClick={() => dialog.current.showModal()}>
          View photograph <Arrow />
        </button>
      </div>
      <dialog
        ref={dialog}
        className="property-lightbox"
        aria-label={"Photograph of " + title}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current.close();
        }}
      >
        <form method="dialog">
          <button autoFocus aria-label="Close photograph">
            Close ×
          </button>
        </form>
        <div className="property-lightbox-image">
          <Image
            src={image}
            alt={alt || title}
            fill
            sizes="100vw"
            unoptimized={generated}
          />
        </div>
        <p>
          {title}
          {generated ? " · Illustrative AI-generated concept" : ""}
        </p>
      </dialog>
    </>
  );
}
