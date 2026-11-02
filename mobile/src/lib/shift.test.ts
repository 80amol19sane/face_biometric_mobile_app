import { describeStanding } from './shift';

describe('describeStanding', () => {
  it('praises nothing and guesses nothing for an off-shift punch', () => {
    expect(describeStanding(null)).toBeNull();
    expect(describeStanding(undefined)).toBeNull();
  });

  it('calls an on-time punch on time', () => {
    expect(describeStanding({ name: 'Day', status: 'On Time', minutes: 0 })).toEqual({ text: 'On time', tone: 'success' });
  });

  it('says how late, and whether grace covered it', () => {
    expect(describeStanding({ name: 'Day', status: 'Within Grace', minutes: 12 })).toEqual({
      text: '12 min late, within the grace period',
      tone: 'warning',
    });
    expect(describeStanding({ name: 'Day', status: 'Late', minutes: 38 })).toEqual({ text: '38 min late', tone: 'warning' });
  });

  it('says how early someone left', () => {
    expect(describeStanding({ name: 'Day', status: 'Early Exit', minutes: 90 })).toEqual({
      text: '90 min before the shift ends',
      tone: 'warning',
    });
  });
});
