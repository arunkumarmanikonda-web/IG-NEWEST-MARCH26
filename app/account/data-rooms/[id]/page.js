import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { accountContext } from "../../../../lib/supabase/server";
import ClientUpload from "./client-upload";
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
  const { client, user, profile, policiesAccepted } = await accountContext();
  if (!user || !profile)
    redirect("/login?next=" + encodeURIComponent("/account/data-rooms/" + id));
  if (profile.must_change_password) redirect("/account/security");
  if (profile.status !== "active" || !policiesAccepted)
    redirect("/account?next=" + encodeURIComponent("/account/data-rooms/" + id));
  const { data, error } = await client.rpc("ig_room_dashboard", { p: { id } });
  if (error || !data?.length) notFound();
  const {data:canUpload}=await client.rpc("ig_retail_can_upload",{room:id});
  return (
    <main id="main" className="auth-page">
      <div className="data-room">
        <Link href="/account/data-rooms">← Your data rooms</Link>
        <div className="eyebrow">CONFIDENTIAL / AUTHORISED ACCESS</div>
        <h1>{data[0].title}</h1>
        <p>
          Access is personal to your verified account and follows the permissions
          approved by India Gully. Any agreed NDA or engagement terms continue to
          apply. Original downloads are available only where explicitly permitted.
        </p>
        {canUpload && <ClientUpload roomId={id}/>}
        <RoomViewer room={data[0]} email={user.email} />
      </div>
    </main>
  );
}
