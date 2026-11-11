import { notFound, redirect } from "next/navigation";
import { published, cmsMetadata, contentPath } from "../../../../lib/cms";
import PublishedContent from "../../../published-content";
export const dynamic = "force-dynamic";
async function lookup(params) {
  const { kind, slug } = await params;
  if (
    ![
      "page",
      "practice",
      "opportunity",
      "product",
      "project",
      "article",
      "person",
      "faq",
    ].includes(kind)
  )
    return null;
  return (await published(kind))?.find((x) => x.slug === slug);
}
export async function generateMetadata({ params }) {
  return cmsMetadata(await lookup(params));
}
export default async function PublishedPage({ params }) {
  const item = await lookup(params);
  if (!item) notFound();
  if (["opportunity", "article"].includes(item.kind))
    redirect(contentPath(item));
  return <PublishedContent item={item} />;
}
