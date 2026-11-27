import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { accountContext } from "../../../../lib/supabase/server";
import "../../../portal.css";

export const dynamic = "force-dynamic";

export default async function SamplePayment({ params }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const { client, user } = await accountContext();
  if (!user) redirect("/login");
  const { data, error } = await client.rpc("ig_review_sample_payment", { link_id: id });
  if (error || !data) notFound();
  return <main id="main" className="auth-page"><article className="portal-form">
    <div className="eyebrow">India Gully · Simulated payment link</div>
    <h1>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(data.amount)}</h1>
    <p>{data.purpose}</p>
    <p>This review link displays a sample payment request. No charge will be collected.</p>
    <Link href="/account">Return to your workspace</Link>
  </article></main>;
}
