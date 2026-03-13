/** Admin utility helpers — date formatting, action labels, and audit metadata descriptions. */
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatAction(action: string) {
  return action.replace(/[._]/g, " ");
}

export function describeAuditMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata) return "No metadata";

  const entries = Object.entries(metadata).slice(0, 3);
  if (entries.length === 0) return "No metadata";

  return entries
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" ");
}
