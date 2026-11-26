import { careersAdminContext, careersAdminRpc } from "../../../lib/careers-admin";
import CareersStudio from "./studio";
import "./studio.css";

export const metadata = { title: "Careers & applications" };

export default async function CareersAdminPage() {
  let data;
  try {
    const { client } = await careersAdminContext();
    data = await careersAdminRpc(client, { action: "status" });
  } catch (error) {
    return <section className="workspace-card"><h2>Careers &amp; applications</h2><p role="alert">{error.status === 403 ? "Only verified administrators can manage Careers and view applicant information." : "The careers workspace could not be loaded. Please reload the page to try again."}</p></section>;
  }
  return <CareersStudio initial={data} />;
}
