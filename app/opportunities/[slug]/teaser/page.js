import { redirect } from "next/navigation";
export default async function Teaser({ params }) {
 const { slug } = await params;
 redirect('/opportunities/' + encodeURIComponent(slug) + '/brief.pdf');
}
