import { enrolmentNote } from './enrolment';

const row = (over: object) => ({ status: 'Active' as const, approvedBy: 'sarah.chen@example.com', consentGivenOn: '2026-11-02 10:15:00', ...over });

describe('enrolmentNote', () => {
  it('says who enrolled a face and when', () => {
    expect(enrolmentNote(row({}))).toBe('Enrolled by Sarah Chen on 2 Nov 2026');
  });

  it('copes with a missing approver or date', () => {
    expect(enrolmentNote(row({ approvedBy: null }))).toBe('Enrolled on 2 Nov 2026');
    expect(enrolmentNote(row({ consentGivenOn: null }))).toBe('Enrolled by Sarah Chen');
  });

  it('keeps Administrator as is', () => {
    expect(enrolmentNote(row({ approvedBy: 'Administrator' }))).toBe('Enrolled by Administrator on 2 Nov 2026');
  });

  it('marks a revoked face', () => {
    expect(enrolmentNote(row({ status: 'Revoked' }))).toBe('Revoked after enrolment by Sarah Chen on 2 Nov 2026');
  });

  it('says nothing for people with no face on file', () => {
    expect(enrolmentNote(row({ status: 'Not enrolled' }))).toBeNull();
    expect(enrolmentNote(row({ status: 'Pending' }))).toBeNull();
  });
});
