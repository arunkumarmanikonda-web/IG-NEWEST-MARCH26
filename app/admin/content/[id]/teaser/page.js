import { notFound } from "next/navigation";
import Link from "next/link";
import { accountContext } from "../../../../../lib/supabase/server";
import { businessDetails } from "../../../../../lib/runtime-config";
import TeaserSheet from "../../../../teaser-sheet";
import PrintButton from "../../../../opportunities/[slug]/teaser/print-button";
import "../../../../opportunities/[slug]/teaser/teaser.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Generate branded one-page teaser",
  robots: { index: false, follow: false },
};
export default async function Teaser({ params, searchParams }) {
  const { id } = await params,
    { version } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { client } = await accountContext();
  const { data: record } = await client
    .from("ig_content")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!record) notFound();
  const { data: live } = await client
    .from("ig_public_content")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const isLive = version === "live" && live;
  const item = isLive ? live : record;
  return (
    <div className="teaser-workspace">
      <div className="teaser-controls">
        <Link href={"/admin/content/" + id}>← Back to editor</Link>
        {live && (
          <Link href={"?version=" + (isLive ? "draft" : "live")}>
            {isLive ? "Preview saved draft" : "Use published revision"}
          </Link>
        )}
        <PrintButton />
      </div>
      <p className="teaser-help">
        A4 one-page brief. Choose “Save as PDF” in the print window, use A4 and
        turn off browser headers and footers.{" "}
        {isLive
          ? "Using the published revision."
          : "Draft watermark remains until you choose a published revision."}
      </p>
      <TeaserSheet
        item={item}
        business={await businessDetails()}
        draft={!isLive}
      />
    </div>
  );
}
