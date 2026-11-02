import { challengeMet, pickChallenge } from './liveness';
import { faceCropBox } from './preprocess';
import { assessFrontal, type DetectedFace } from './quality';

jest.mock('jpeg-js', () => ({ decode: jest.fn() }));

const face = (over: Partial<DetectedFace> = {}): DetectedFace => ({
  frame: { left: 300, top: 400, width: 400, height: 500 },
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  leftEyeOpenProbability: 0.9,
  rightEyeOpenProbability: 0.9,
  ...over,
});

describe('assessFrontal', () => {
  it('accepts a centred, straight, open-eyed face', () => {
    expect(assessFrontal([face()], 1000, 1300).ok).toBe(true);
  });

  it.each([
    ['no_face', [], 1000, 1300],
    ['many_faces', [face(), face()], 1000, 1300],
    ['too_small', [face({ frame: { left: 450, top: 600, width: 100, height: 120 } })], 1000, 1300],
    ['off_centre', [face({ frame: { left: 0, top: 400, width: 250, height: 300 } })], 1000, 1300],
    ['not_frontal', [face({ rotationY: 25 })], 1000, 1300],
    ['eyes_closed', [face({ leftEyeOpenProbability: 0.1 })], 1000, 1300],
  ] as const)('rejects %s', (reason, faces, w, h) => {
    expect(assessFrontal([...faces], w, h)).toEqual({ ok: false, reason });
  });
});

describe('liveness', () => {
  it('passes a turn in either direction but not a small one', () => {
    expect(challengeMet('turn_head', face({ rotationY: -25 }))).toBe(true);
    expect(challengeMet('turn_head', face({ rotationY: 25 }))).toBe(true);
    expect(challengeMet('turn_head', face({ rotationY: 5 }))).toBe(false);
  });

  it('needs a real smile', () => {
    expect(challengeMet('smile', face({ smilingProbability: 0.95 }))).toBe(true);
    expect(challengeMet('smile', face({ smilingProbability: 0.2 }))).toBe(false);
    expect(challengeMet('smile', face())).toBe(false);
  });

  it('picks both challenges', () => {
    expect(pickChallenge(() => 0.1)).toBe('turn_head');
    expect(pickChallenge(() => 0.9)).toBe('smile');
  });
});

describe('faceCropBox', () => {
  it('is square, includes a margin and stays inside the image', () => {
    const box = faceCropBox(face(), 1000, 1300);
    expect(box.width).toBe(box.height);
    expect(box.width).toBe(600);
    expect(box.originX).toBeGreaterThanOrEqual(0);
    expect(box.originX + box.width).toBeLessThanOrEqual(1000);
  });

  it('is pulled back inside when the face is at an edge', () => {
    const box = faceCropBox(face({ frame: { left: 800, top: 1100, width: 200, height: 200 } }), 1000, 1300);
    expect(box.originX + box.width).toBeLessThanOrEqual(1000);
    expect(box.originY + box.height).toBeLessThanOrEqual(1300);
  });
});
