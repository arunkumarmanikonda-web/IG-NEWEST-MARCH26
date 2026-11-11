import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { accountContext } from "../../../../lib/supabase/server";
import RoomViewer from "./viewer";
import "../../../portal.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private project data room",
  robots: { index: false, follow: false },
};
export default async function Page({ params }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const { client, user, profile } = await accountContext();
  if (!user || !profile) redirect("/login");
  if (profile.must_change_password) redirect("/account/security");
  const { data, error } = await client.rpc("ig_room_dashboard", { p: { id } });
  if (error || !data?.length) notFound();
  return (
    <main id="main" className="auth-page">
      <div className="data-room">
        <Link href="/account/data-rooms">← Your data rooms</Link>
        <div className="eyebrow">CONFIDENTIAL / AUTHORISED ACCESS</div>
        <h1>{data[0].title}</h1>
        <p>
          Access is personal to your account and subject to {data[0].room_type==='engagement'?'the agreed engagement and confidentiality terms':'your project NDA'}.
          Original downloads are available only where explicitly permitted.
        </p>
        <RoomViewer room={data[0]} email={user.email} />
      </div>
    </main>
  );
}
