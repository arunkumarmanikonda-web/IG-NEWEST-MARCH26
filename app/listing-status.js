import { listingLifecycle, listingStatusText } from "../lib/listing-lifecycle.mjs";

export default function ListingStatus({ item, className = "" }) {
  const state = listingLifecycle(item);
  return <span className={["listing-status", "listing-status-" + state.status, state.archived ? "listing-status-archived" : "", className].filter(Boolean).join(" ")}>{listingStatusText(item)}</span>;
}
