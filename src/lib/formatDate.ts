export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "Europe/London",
  }).format(new Date(value));
}
