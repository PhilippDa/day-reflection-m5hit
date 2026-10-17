const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

/** Local calendar date as `YYYY-MM-DD`. Never derived from UTC. */
export function toDateKey(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

/** True for `YYYY-MM-DD` strings that name a real calendar day. */
export function isDateKey(value: string): boolean {
  const match = DATE_KEY.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Local midnight of a valid date key, or `undefined` for anything else. */
export function parseDateKey(value: string): Date | undefined {
  if (!isDateKey(value)) {
    return undefined;
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

/** The date key `days` after (or before, when negative) the given one. Keys that are not dates come back unchanged. */
export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}
