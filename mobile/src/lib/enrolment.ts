import type { ReviewRow } from '../api/review';
import { displayName } from './names';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Enrolled by Sarah Chen on 2 Nov 2026", or null when there is nothing worth saying. */
export function enrolmentNote(row: Pick<ReviewRow, 'status' | 'approvedBy' | 'consentGivenOn'>): string | null {
  if (row.status === 'Not enrolled' || row.status === 'Pending') return null;
  const by = row.approvedBy ? ` by ${displayName(row.approvedBy)}` : '';
  const on = shortDate(row.consentGivenOn);
  const verb = row.status === 'Revoked' ? 'Revoked after enrolment' : 'Enrolled';
  return `${verb}${by}${on ? ` on ${on}` : ''}`;
}

/** Frappe datetimes are "YYYY-MM-DD HH:mm:ss"; parse the date part directly so time zones cannot shift the day. */
function shortDate(value: string | null): string | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}
