"use client";
import Link from "next/link";

export default function CareersError({ reset }) {
  return <main id="main" className="not-found"><div className="eyebrow">Careers at India Gully</div><h1>We couldn’t load this opportunity.</h1><p>Please try again shortly. You can also return to our current vacancies.</p><div className="form-buttons"><button className="button" type="button" onClick={reset}>Try again</button><Link className="button" href="/careers">View current opportunities</Link></div></main>;
}
