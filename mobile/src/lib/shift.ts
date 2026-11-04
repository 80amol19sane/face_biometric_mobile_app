import type { Tone } from '../theme';

export type ShiftStatus = 'On Time' | 'Within Grace' | 'Late' | 'Early Exit';

/** How a punch sat against its shift, as the server worked it out. */
export interface ShiftStanding {
  name: string;
  status: ShiftStatus;
  minutes: number;
}

/** Plain words and a status tone. An off-shift punch (null) says nothing rather than guess. */
export function describeStanding(shift: ShiftStanding | null | undefined): { text: string; tone: Tone } | null {
  if (!shift) return null;
  const { status, minutes } = shift;
  switch (status) {
    case 'On Time':
      return { text: 'On time', tone: 'success' };
    case 'Within Grace':
      return { text: `${minutes} min late, within the grace period`, tone: 'warning' };
    case 'Late':
      return { text: `${minutes} min late`, tone: 'warning' };
    case 'Early Exit':
      return { text: `${minutes} min before the shift ends`, tone: 'warning' };
  }
}
