import { keyAlias } from '../device/registry';
import { bytesToBase64, embeddingBytes } from '../lib/embedding';
import { currentCoordinates } from '../lib/location';
import { embeddingDigest, signCheckin, type LogType } from '../lib/signing';
import { getChallenge, submitCheckin } from './faceBiometric';

/**
 * One signed punch. The nonce is fetched last: it lives only 60 seconds on the server, and the
 * face capture and the location fix are the slow parts.
 */
export async function checkIn(user: string, device: string, logType: LogType, embedding: Float32Array) {
  const bytes = embeddingBytes(embedding);
  const digest = await embeddingDigest(bytes);
  const { latitude, longitude } = await currentCoordinates();

  const { nonce } = await getChallenge(device);
  const signature = signCheckin(keyAlias(user), { nonce, logType, latitude, longitude, embeddingDigest: digest });

  return submitCheckin({
    device,
    nonce,
    logType,
    embedding: bytesToBase64(bytes),
    signature,
    latitude,
    longitude,
  });
}
