import { kioskPayload } from './signing';

jest.mock('expo-crypto', () => ({}));
jest.mock('../../modules/device-key', () => ({ DeviceKey: {} }));

describe('kioskPayload', () => {
  it('matches the server test vector in face_biometric/tests/test_kiosk_payload.py', () => {
    expect(kioskPayload('identify', 'BDEV-00004', 'nonce123', 'ab12')).toBe('fb2|identify|BDEV-00004|nonce123|ab12');
  });

  it('keeps actions apart so a signature cannot cross over', () => {
    expect(kioskPayload('pin', 'D', 'n', 'x')).not.toBe(kioskPayload('identify', 'D', 'n', 'x'));
  });
});
