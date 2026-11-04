export interface DetectedFace {
  frame: { left: number; top: number; width: number; height: number };
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  smilingProbability?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
}

export type Rejection =
  | 'no_face'
  | 'many_faces'
  | 'too_small'
  | 'off_centre'
  | 'not_frontal'
  | 'eyes_closed';

export type Assessment = { ok: true; face: DetectedFace } | { ok: false; reason: Rejection };

const MIN_FACE_WIDTH_RATIO = 0.2;
const MAX_CENTRE_OFFSET_RATIO = 0.35;
const MAX_YAW = 15;
const MAX_ROLL = 15;
const MAX_PITCH = 20;
const MIN_EYE_OPEN = 0.4;

export const REJECTION_PROMPTS: Record<Rejection, string> = {
  no_face: 'Show your face to the camera',
  many_faces: 'Only one person in the frame, please',
  too_small: 'Move closer',
  off_centre: 'Centre your face in the oval',
  not_frontal: 'Look straight at the camera',
  eyes_closed: 'Keep your eyes open',
};

/** Single face, near enough, centred, looking at the camera. */
export function assessFrontal(faces: DetectedFace[], imageWidth: number, imageHeight: number): Assessment {
  const face = pickSingleFace(faces);
  if ('reason' in face) return face;

  const base = assessPlacement(face.face, imageWidth, imageHeight);
  if (!base.ok) return base;

  const { rotationX, rotationY, rotationZ } = face.face;
  if (Math.abs(rotationY) > MAX_YAW || Math.abs(rotationZ) > MAX_ROLL || Math.abs(rotationX) > MAX_PITCH) {
    return { ok: false, reason: 'not_frontal' };
  }
  const eyes = [face.face.leftEyeOpenProbability, face.face.rightEyeOpenProbability];
  if (eyes.some((p) => p !== undefined && p < MIN_EYE_OPEN)) return { ok: false, reason: 'eyes_closed' };
  return base;
}

/** For a liveness frame the head may be turned, so only presence, size and position are checked. */
export function assessPlacement(face: DetectedFace, imageWidth: number, imageHeight: number): Assessment {
  if (face.frame.width < imageWidth * MIN_FACE_WIDTH_RATIO) return { ok: false, reason: 'too_small' };
  const dx = Math.abs(face.frame.left + face.frame.width / 2 - imageWidth / 2);
  const dy = Math.abs(face.frame.top + face.frame.height / 2 - imageHeight / 2);
  if (dx > imageWidth * MAX_CENTRE_OFFSET_RATIO || dy > imageHeight * MAX_CENTRE_OFFSET_RATIO) {
    return { ok: false, reason: 'off_centre' };
  }
  return { ok: true, face };
}

export function pickSingleFace(faces: DetectedFace[]): Assessment {
  if (faces.length === 0) return { ok: false, reason: 'no_face' };
  if (faces.length > 1) return { ok: false, reason: 'many_faces' };
  return { ok: true, face: faces[0] };
}
