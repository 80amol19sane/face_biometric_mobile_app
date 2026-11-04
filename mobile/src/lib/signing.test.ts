import { kioskPayload, offlinePayload } from './signing';

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

describe('offlinePayload', () => {
  it('is versioned and ordered like the server expects', () => {
    const scan = { localId: 'a1b2c3d4-0001', prevHash: '', anchoredMs: 1_800_000_000_000, wallMs: 1_800_000_001_000, bootCount: 7, anchorBootCount: 7 };
    expect(offlinePayload('BDEV-00004', scan, 'ab12')).toBe('fb3|BDEV-00004|a1b2c3d4-0001||1800000000000|1800000001000|7|7|ab12');
  });
});
