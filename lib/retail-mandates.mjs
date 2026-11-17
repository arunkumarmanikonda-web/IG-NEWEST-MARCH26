export const retailKinds = { retail_space: "Promoter space", retail_requirement: "Brand requirement" };
export const retailRoute = {retail_space:"spaces", retail_requirement:"requirements"};
export const isRetail = kind => Object.hasOwn(retailKinds, kind);
export const retailFields = {
  retail_space: {city:"City", region:"State / region", formats:"Property / retail formats", floors:"Floors offered", zoning:"Tenant mix and zoning", handover:"Handover conditions", availability:"Availability as at", price_label:"Approved commercial terms"},
  retail_requirement: {brand:"Brand or approved public descriptor", markets:"Target cities and catchments", formats:"Store formats", floors:"Preferred floors", area_range:"Area requirement (include unit and basis)", frontage:"Frontage and technical needs", handover:"Fit-out / opening timetable", price_label:"Approved occupancy budget"}
};
export const unitFields = {unit:"Unit reference",floor:"Floor",area:"Area incl. unit",basis:"Area basis",zone:"Zone / preferred use",status:"Availability"};
export const unitStatuses = ["To confirm","Available","On hold","Under offer","Leased","Withdrawn"];
export const planTypes = ["Floor drawing","Zoning plan","Unit schedule"];
export function enquiryMessage(record, unit) {
  const ref = record.public_data?.reference || record.slug;
  const subject = record.kind === "retail_space" ? "I'd like to enquire about " : "I'd like to propose a site for ";
  const selected = unit ? " · "+[unit.unit,unit.floor].filter(Boolean).join(", ") : "";
  return subject + record.title + selected + " (mandate "+ref+").";
}
export function combineUnitEvidence(rows, review) {
  const groups = new Map();
  for (const entry of rows) {
    const value = Object.fromEntries(Object.keys(unitFields).map(k=>[k, String(entry[k] || "").trim()]));
    if (!value.unit) continue;
    if (!unitStatuses.includes(value.status)) value.status = "To confirm";
    const key = [value.floor, value.unit].join("|").toLowerCase();
    const prev = groups.get(key);
    if (!prev) { groups.set(key,{value,disputed:new Set()}); continue; }
    for (const k of ["area","basis","zone","status"]) {
      if (prev.disputed.has(k) || !value[k] || k==="status" && value[k]==="To confirm") continue;
      if (!prev.value[k] || k==="status" && prev.value[k]==="To confirm") prev.value[k]=value[k];
      else if (prev.value[k].toLowerCase() !== value[k].toLowerCase()) {
        prev.value[k]=k==="status"?"To confirm":""; prev.disputed.add(k);
        review.push("Check conflicting "+unitFields[k].toLowerCase()+" for "+value.unit+" "+value.floor+".");
      }
    }
  }
  return [...groups.values()].map(g=>g.value);
}
