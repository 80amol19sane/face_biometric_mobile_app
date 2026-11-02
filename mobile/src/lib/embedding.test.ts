import { averageEmbeddings, bytesToBase64, embeddingBytes, l2Normalize } from './embedding';
import { roundCoordinate, signingPayload } from './signing';

jest.mock('expo-crypto', () => ({}));
jest.mock('../../modules/device-key', () => ({ DeviceKey: {} }));

// Vector produced by the backend's own Python: struct.pack('<192f', ((i*37)%101-50)/50 ...)
const VALUES = Float32Array.from({ length: 192 }, (_, i) => (((i * 37) % 101) - 50) / 50);
const PYTHON_BASE64_PREFIX = 'AACAv7gehb6PwvU+zcxMv4/Cdb17FC4/mpkZvylcDz6uR2E/zczMvnsUrj7X';

describe('embedding wire format', () => {
  it('encodes float32 little-endian base64 exactly like struct.pack', () => {
    const encoded = bytesToBase64(embeddingBytes(VALUES));
    expect(encoded.startsWith(PYTHON_BASE64_PREFIX)).toBe(true);
    expect(embeddingBytes(VALUES)).toHaveLength(192 * 4);
  });

  it('pads base64 like the standard alphabet', () => {
    expect(bytesToBase64(new Uint8Array([102]))).toBe('Zg==');
    expect(bytesToBase64(new Uint8Array([102, 111]))).toBe('Zm8=');
    expect(bytesToBase64(new Uint8Array([102, 111, 111]))).toBe('Zm9v');
  });

  it('normalises to unit length and rejects an empty vector', () => {
    const unit = l2Normalize(Float32Array.from([3, 4]));
    expect(unit[0]).toBeCloseTo(0.6);
    expect(unit[1]).toBeCloseTo(0.8);
    expect(() => l2Normalize(new Float32Array(4))).toThrow();
  });

  it('averages to a unit vector and refuses mixed sizes', () => {
    const mean = averageEmbeddings([Float32Array.from([1, 0]), Float32Array.from([0, 1])]);
    expect(mean[0]).toBeCloseTo(Math.SQRT1_2);
    expect(() => averageEmbeddings([new Float32Array(2), new Float32Array(3)])).toThrow();
  });
});

describe('signing payload', () => {
  const digest = '0d0bb4cb57e22a7ace1aac37a95479e4478d317331ea1a138154ff899d30057c';

  it('matches the server layout with six-decimal coordinates', () => {
    const payload = signingPayload({
      nonce: 'abc_DEF-123',
      logType: 'IN',
      latitude: roundCoordinate(12.3456789),
      longitude: roundCoordinate(-77.1234564),
      embeddingDigest: digest,
    });
    expect(payload).toBe(`fb1|abc_DEF-123|IN|12.345679|-77.123456|${digest}`);
  });

  it('leaves coordinates empty when location is unavailable', () => {
    const payload = signingPayload({
      nonce: 'n', logType: 'OUT', latitude: null, longitude: null, embeddingDigest: digest,
    });
    expect(payload).toBe(`fb1|n|OUT|||${digest}`);
  });
});
