const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata",
});

export function PerspectiveDate({ value }) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return <time dateTime={value}>{dateFormat.format(new Date(value))}</time>;
}
