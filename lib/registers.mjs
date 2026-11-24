// The API caps each response. Use an immutable unique key so existing records
// keep their position while staff edit them. Never show a partial register as complete.
export async function readRegister(query, sortBy, keys = ["id"]) {
  const rows = [];
  const pageSize = 250;
  let after;
  for (;;) {
    let page = query().limit(pageSize);
    for (const key of keys) page = page.order(key);
    if (after) {
      if (keys.length === 1) page = page.gt(keys[0], after[0]);
      else {
        const [first, second] = keys;
        page = page.or(first + ".gt." + after[0] + ",and(" + first + ".eq." + after[0] + "," + second + ".gt." + after[1] + ")");
      }
    }
    const { data, error } = await page;
    if (error) return { data: null, error };
    rows.push(...data);
    if (data.length < pageSize) break;
    const next = keys.map(key => data.at(-1)[key]);
    if (next.some(value => value == null) || next.every((value, index) => value === after?.[index]))
      return { data: null, error: { message: "The register could not advance." } };
    after = next;
  }
  if (sortBy) rows.sort((a, b) => b[sortBy].localeCompare(a[sortBy]) || String(a.id).localeCompare(String(b.id)));
  return { data: rows, error: null };
}

export function visibleInRegister(row, filter, now = Date.now()) {
  if (row.deleted_at) return filter === "deleted";
  if (filter === "deleted") return false;
  if (row.status === "archived" || row.listing_archived === true) {
    if (filter === "archived") return true;
    const visible = Boolean(row.live_version) && row.listing_archived === true && new Date(row.archive_until).getTime() > now;
    return filter === "live" ? visible : false;
  }
  if (filter === "active") return true;
  if (filter === "live") return Boolean(row.live_version);
  if (filter === "unlive") return !row.live_version;
  return row.status === filter;
}
