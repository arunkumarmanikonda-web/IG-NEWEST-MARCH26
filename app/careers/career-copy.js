export const workModes = { onsite: "On-site", hybrid: "Hybrid", remote: "Remote" };
export const employmentTypes = { "full-time": "Full-time", "part-time": "Part-time", contract: "Contract", internship: "Internship" };

export function careerDate(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(date) : "";
}

export function CareerParagraphs({ text }) {
  return String(text || "").split(/\n\s*\n/).filter(part => part.trim()).map((part, index) => <p key={index}>{part.trim()}</p>);
}

export function CareerLines({ text }) {
  const lines = String(text || "").split(/\n/).map(line => line.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean);
  return <ul>{lines.map((line, index) => <li key={index}>{line}</li>)}</ul>;
}

export function CareerMeta({ job }) {
  return <ul className="career-meta" aria-label="Role details">
    {job.location && <li>{job.location}</li>}
    {workModes[job.work_mode] && <li>{workModes[job.work_mode]}</li>}
    {employmentTypes[job.employment_type] && <li>{employmentTypes[job.employment_type]}</li>}
  </ul>;
}
