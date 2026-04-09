const SINGAPORE_OFFSET_MINUTES = 8 * 60;

function toOffsetDate(date: Date, offsetMinutes: number): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000;
  return new Date(utc + offsetMinutes * 60_000);
}

export function getSingaporeNow(): Date {
  return toOffsetDate(new Date(), SINGAPORE_OFFSET_MINUTES);
}

export function formatSingaporeDate(date: Date): string {
  return toOffsetDate(date, SINGAPORE_OFFSET_MINUTES).toISOString().slice(0, 10);
}

export function toSingaporeISOString(date: Date): string {
  return toOffsetDate(date, SINGAPORE_OFFSET_MINUTES).toISOString();
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

export function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next;
}

export function parseDateInput(input?: string | null): Date | null {
  if (!input) {
    return null;
  }
  const value = new Date(input);
  if (Number.isNaN(value.getTime())) {
    return null;
  }
  return value;
}
