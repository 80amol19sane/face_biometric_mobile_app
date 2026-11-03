/** "2026-11-03" for a local date, the form the server's date filters take. */
export function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return isoDay(new Date(y, m - 1, d + days));
}

export const isToday = (day: string) => day === isoDay(new Date());

/** "Today · Tue, 3 Nov" or "Mon, 2 Nov 2026". */
export function dayLabel(day: string, shortDate: (date: Date) => string): string {
  const [y, m, d] = day.split('-').map(Number);
  const text = shortDate(new Date(y, m - 1, d));
  return isToday(day) ? `Today · ${text.replace(/ \d{4}$/, '')}` : text;
}
