/** Wire format the backend expects: base64 of little-endian float32 values (see core/embedding.py). */

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function l2Normalize(values: Float32Array): Float32Array {
  let sum = 0;
  for (const v of values) sum += v * v;
  const norm = Math.sqrt(sum);
  if (!Number.isFinite(norm) || norm < 1e-6) throw new Error('Face embedding is empty or invalid');
  return values.map((v) => v / norm);
}

/** Mean of several embeddings of one face, re-normalised. Steadier than any single frame. */
export function averageEmbeddings(embeddings: Float32Array[]): Float32Array {
  if (embeddings.length === 0) throw new Error('No embeddings to average');
  const sum = new Float32Array(embeddings[0].length);
  for (const embedding of embeddings) {
    if (embedding.length !== sum.length) throw new Error('Embeddings differ in size');
    embedding.forEach((v, i) => (sum[i] += v));
  }
  return l2Normalize(sum);
}

/** Explicit little-endian, so the bytes do not depend on the phone's CPU. */
export function embeddingBytes(embedding: Float32Array): Uint8Array {
  const bytes = new Uint8Array(embedding.length * 4);
  const view = new DataView(bytes.buffer);
  embedding.forEach((v, i) => view.setFloat32(i * 4, v, true));
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += BASE64[(n >> 18) & 63] + BASE64[(n >> 12) & 63];
    out += i + 1 < bytes.length ? BASE64[(n >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? BASE64[n & 63] : '=';
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
