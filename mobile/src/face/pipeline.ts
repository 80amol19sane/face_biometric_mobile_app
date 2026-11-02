import FaceDetection from '@react-native-ml-kit/face-detection';
import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { embed } from './embedder';
import { MODEL_INPUT_SIZE } from './config';
import { faceCropBox, jpegToModelInput } from './preprocess';
import type { DetectedFace } from './quality';

export interface AnalysedPhoto {
  uri: string;
  width: number;
  height: number;
  faces: DetectedFace[];
}

/**
 * Bakes the camera's EXIF rotation into the pixels (ML Kit and the crop then agree on
 * coordinates), then looks for faces. Always call release() when done: it deletes the photo.
 */
export async function analysePhoto(cameraUri: string): Promise<AnalysedPhoto> {
  try {
    const upright = await manipulateAsync(cameraUri, [], { format: SaveFormat.JPEG, compress: 1 });
    const faces = await FaceDetection.detect(upright.uri, {
      performanceMode: 'accurate',
      classificationMode: 'all',
      landmarkMode: 'none',
      contourMode: 'none',
      minFaceSize: 0.2,
    });
    return { uri: upright.uri, width: upright.width, height: upright.height, faces };
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
