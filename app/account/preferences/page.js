import { redirect } from "next/navigation";
import { accountContext } from "../../../lib/supabase/server";
import Preferences from "./preferences";
import "../../portal.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Communication preferences",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const { client, user, profile } = await accountContext();
  if (!user || !profile || profile.status !== "active") redirect("/login");
  const { data } = await client
    .from("ig_consents")
    .select("purpose,granted,practices,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <main id="main" className="auth-page">
      <Preferences history={data || []} />
    </main>
  );
}
