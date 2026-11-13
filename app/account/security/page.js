import { redirect } from "next/navigation";
import { accountContext } from "../../../lib/supabase/server";
import Security from "./security";
import "../../portal.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Account security",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const { user, profile } = await accountContext();
  if (!user || !profile || profile.status !== "active") redirect("/login");
  return (
    <main id="main" className="auth-page">
      <Security changeRequired={profile.must_change_password} />
    </main>
  );
}
