import FaceDetection from '@react-native-ml-kit/face-detection';
import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { embed } from './embedder';
import { DETECTION_MAX_SIDE, MODEL_INPUT_SIZE } from './config';
import { faceCropBox, jpegToModelInput } from './preprocess';
import type { DetectedFace } from './quality';

export interface AnalysedPhoto {
  uri: string;
  width: number;
  height: number;
  faces: DetectedFace[];
  /** Milliseconds spent downscaling and detecting, for the on-screen diagnostics. */
  ms: number;
}

/**
 * Downsizes the camera photo (expo-camera has already applied its rotation to the pixels, so the
 * detector's coordinates and the image size agree), then looks for faces. Always call release()
 * when done: it deletes the photo.
 */
export async function analysePhoto(cameraUri: string, cameraWidth: number, cameraHeight: number): Promise<AnalysedPhoto> {
  const started = Date.now();
  try {
    const scale = DETECTION_MAX_SIDE / Math.max(cameraWidth, cameraHeight);
    const resize = scale < 1 ? { width: Math.round(cameraWidth * scale) } : undefined;
    const small = await manipulateAsync(cameraUri, resize ? [{ resize }] : [], { format: SaveFormat.JPEG, compress: 0.9 });
    const faces = await FaceDetection.detect(small.uri, {
      performanceMode: 'fast',
      classificationMode: 'all',
      landmarkMode: 'none',
      contourMode: 'none',
      minFaceSize: 0.15,
    });
    return { uri: small.uri, width: small.width, height: small.height, faces, ms: Date.now() - started };
  } finally {
    discard(cameraUri);
  }
}

export async function embedFace(photo: AnalysedPhoto, face: DetectedFace): Promise<Float32Array> {
  const crop = await manipulateAsync(
    photo.uri,
    [{ crop: faceCropBox(face, photo.width, photo.height) }, { resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
    { format: SaveFormat.JPEG, compress: 1, base64: true },
  );
  try {
    if (!crop.base64) throw new Error('Face crop has no pixel data');
    return await embed(jpegToModelInput(crop.base64));
  } finally {
    discard(crop.uri);
  }
}

export function release(photo: AnalysedPhoto): void {
  discard(photo.uri);
}

/** Face photos are never kept: they are deleted as soon as they have been read. */
function discard(uri: string): void {
  try {
    new File(uri).delete();
  } catch {
    // Already gone, or the OS reclaims the cache directory anyway.
  }
}
