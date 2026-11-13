import { notFound } from "next/navigation";
import { published } from "../../../../lib/cms";
import { businessDetails } from "../../../../lib/runtime-config";
import TeaserSheet from "../../../teaser-sheet";
import PrintButton from "./print-button";
import "./teaser.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Opportunity brief",
  robots: { index: false, follow: false },
};
export default async function Teaser({ params }) {
  const { slug } = await params;
  const records = await published("opportunity"),
    item = records?.find((x) => x.slug === slug);
  if (!item) notFound();
  return (
    <main id="main" className="teaser-workspace">
      <div className="teaser-controls">
        <a href={"/opportunities/" + slug}>← Opportunity details</a>
        <PrintButton />
      </div>
      <TeaserSheet item={item} business={await businessDetails()} />
    </main>
  );
}
