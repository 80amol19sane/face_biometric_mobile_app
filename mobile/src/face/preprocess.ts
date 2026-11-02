import { decode } from 'jpeg-js';
import { base64ToBytes } from '../lib/base64';
import { MODEL_INPUT_SIZE, MODEL_PIXEL_MEAN, MODEL_PIXEL_STD } from './config';
import type { DetectedFace } from './quality';

const CROP_MARGIN = 1.2;

export interface CropBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

/** Square crop around the face with some margin, kept inside the image. */
export function faceCropBox(face: DetectedFace, imageWidth: number, imageHeight: number): CropBox {
  const { left, top, width, height } = face.frame;
  const side = Math.min(Math.round(Math.max(width, height) * CROP_MARGIN), imageWidth, imageHeight);
  const originX = clamp(Math.round(left + width / 2 - side / 2), 0, imageWidth - side);
  const originY = clamp(Math.round(top + height / 2 - side / 2), 0, imageHeight - side);
  return { originX, originY, width: side, height: side };
}

/** JPEG of the 112x112 face crop to the model's NHWC float32 input, (pixel - mean) / std. */
export function jpegToModelInput(jpegBase64: string): Float32Array {
  const image = decode(base64ToBytes(jpegBase64), { useTArray: true, formatAsRGBA: true });
  if (image.width !== MODEL_INPUT_SIZE || image.height !== MODEL_INPUT_SIZE) {
    throw new Error(`Face crop is ${image.width}x${image.height}, expected ${MODEL_INPUT_SIZE}`);
  }
  const input = new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3);
  for (let pixel = 0, out = 0; pixel < image.data.length; pixel += 4) {
    input[out++] = (image.data[pixel] - MODEL_PIXEL_MEAN) / MODEL_PIXEL_STD;
    input[out++] = (image.data[pixel + 1] - MODEL_PIXEL_MEAN) / MODEL_PIXEL_STD;
    input[out++] = (image.data[pixel + 2] - MODEL_PIXEL_MEAN) / MODEL_PIXEL_STD;
  }
  return input;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
