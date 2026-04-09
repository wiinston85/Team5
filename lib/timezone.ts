const SINGAPORE_OFFSET_MINUTES = 8 * 60;

export function nowInSingapore(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + SINGAPORE_OFFSET_MINUTES * 60000);
}

export function toSingaporeDate(input: string | Date): Date {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utcMs + SINGAPORE_OFFSET_MINUTES * 60000);
}

export function formatLocal(dateString: string | null): string {
  if (!dateString) {
    return "No due date";
  }
  const d = new Date(dateString);
  return d.toLocaleString("en-SG", {
    timeZone: "Asia/Singapore",
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function assertFutureDueDate(dateString: string): void {
  const due = new Date(dateString);
  if (Number.isNaN(due.getTime())) {
    throw new Error("Invalid due date");
  }
  const min = Date.now() + 60_000;
  if (due.getTime() < min) {
    throw new Error("Due date must be at least 1 minute in the future");
  }
}

export function addRecurrence(date: Date, pattern: "daily" | "weekly" | "monthly" | "yearly"): Date {
  const next = new Date(date);
  if (pattern === "daily") next.setDate(next.getDate() + 1);
  if (pattern === "weekly") next.setDate(next.getDate() + 7);
  if (pattern === "monthly") next.setMonth(next.getMonth() + 1);
  if (pattern === "yearly") next.setFullYear(next.getFullYear() + 1);
  return next;
}
