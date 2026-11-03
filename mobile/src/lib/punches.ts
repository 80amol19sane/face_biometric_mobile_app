/** Frappe sends "YYYY-MM-DD HH:mm:ss" in the site's clock; show it as that clock reads, not the phone's. */
export function clockTime(value: string): string {
  const match = value.match(/(\d{2}):(\d{2})/);
  if (!match) return value;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? 'AM' : 'PM'}`;
}
