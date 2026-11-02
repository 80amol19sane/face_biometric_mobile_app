import type { DetectedFace } from './quality';

/**
 * Active challenge: a random action a still photo cannot perform. This deters printed photos and
 * static screens. It is not a certified presentation-attack detector; a replayed video of the
 * right action can still pass.
 */
export type Challenge = 'turn_head' | 'smile';

const MIN_TURN_DEGREES = 12;
const MIN_SMILE = 0.6;

export const CHALLENGE_PROMPTS: Record<Challenge, string> = {
  turn_head: 'Turn your head slowly to one side',
  smile: 'Give a big smile',
};

export function pickChallenge(random: () => number = Math.random): Challenge {
  return random() < 0.5 ? 'turn_head' : 'smile';
}

/** Direction-agnostic: ML Kit's yaw sign flips with camera mirroring, the size of the turn does not. */
export function challengeMet(challenge: Challenge, face: DetectedFace): boolean {
  if (challenge === 'turn_head') return Math.abs(face.rotationY) >= MIN_TURN_DEGREES;
  return (face.smilingProbability ?? 0) >= MIN_SMILE;
}
