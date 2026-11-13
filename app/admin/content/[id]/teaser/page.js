import { notFound } from "next/navigation";
import Link from "next/link";
import { accountContext } from "../../../../../lib/supabase/server";
import "../../../../opportunities/[slug]/teaser/teaser.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Generate a branded property or product brief",
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
  const pdfUrl = "/admin/content/" + id + "/brief.pdf?version=" + (isLive ? "live" : "draft");
  return (
    <div className="teaser-workspace">
      <div className="teaser-controls">
        <Link href={"/admin/content/" + id}>← Back to editor</Link>
        {live && (
          <Link href={"?version=" + (isLive ? "draft" : "live")}>
            {isLive ? "Preview saved draft" : "Use published revision"}
          </Link>
        )}
        <a className="button" href={"/admin/content/" + id + "/brief.pdf?version=" + (isLive ? "live" : "draft")}>Download PDF brief</a>
      </div>
      <p className="teaser-help">
        India Gully’s approved three-page design is applied automatically to every saved revision: a photographic cover, property or product details, and an adviser enquiry page.{" "}
        {isLive
          ? "Using the published revision."
          : "Draft watermark remains until you choose a published revision."}
      </p>
      <iframe className="brief-pdf-preview" title="India Gully PDF brief preview" src={pdfUrl + "&inline=1"} />
      <p className="teaser-help">If your browser cannot show the preview, <a href={pdfUrl}>download the PDF brief</a>.</p>
    </div>
  );
}
