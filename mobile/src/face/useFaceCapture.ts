import type { CameraView } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { averageEmbeddings } from '../lib/embedding';
import { CAPTURE_TIMEOUT_MS } from './config';
import { loadEmbedder } from './embedder';
import { challengeMet, CHALLENGE_PROMPTS, pickChallenge } from './liveness';
import { analysePhoto, embedFace, release } from './pipeline';
import { assessFrontal, assessPlacement, pickSingleFace, REJECTION_PROMPTS } from './quality';

/** What the capture is doing now, so a screen can show the right guidance. */
export type CaptureStage = 'watching' | 'positioning' | 'liveness' | 'capturing';

const WATCH_INTERVAL_MS = 600;

interface Options {
  /** Straight-on frames averaged into the result (3 to enrol, 1 to check in). */
  frames: number;
  /** Camera permission granted. */
  enabled: boolean;
  /** Kiosk mode: wait for someone to appear, with no time limit, before starting. */
  watch?: boolean;
  /** Ask for a head turn or smile first. Defaults to true. */
  requireLiveness?: boolean;
  onEmbedding: (embedding: Float32Array) => void;
  onFailure: (message: string) => void;
}

/**
 * Drives the camera: optionally wait for a face, a random liveness challenge, straight-on frames,
 * then the embedding. It only produces an embedding; it never talks to the server. One run per
 * mount: remount (change the component key) to run it again.
 */
export function useFaceCapture({ frames, enabled, watch = false, requireLiveness = true, onEmbedding, onFailure }: Options) {
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [prompt, setPrompt] = useState('Getting ready…');
  const [captured, setCaptured] = useState(0);
  const [stage, setStage] = useState<CaptureStage>(watch ? 'watching' : 'liveness');
  const [diagnostics, setDiagnostics] = useState('waiting for camera');
  const callbacks = useRef({ onEmbedding, onFailure });
  callbacks.current = { onEmbedding, onFailure };

  // Load the face model now: a broken model should fail at once, and the load hides behind the challenge.
  useEffect(() => {
    loadEmbedder().catch((error) => callbacks.current.onFailure(readableError(error)));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(timer);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !ready) return;
    let cancelled = false;
    let frame = 0;

    const snap = async () => (await camera.current?.takePictureAsync({ quality: 0.5, shutterSound: false, exif: false })) ?? null;
    const look = async (photo: { uri: string; width: number; height: number }) => {
      const analysed = await analysePhoto(photo.uri, photo.width, photo.height);
      const [face] = analysed.faces;
      frame += 1;
      setDiagnostics(
        `#${frame} ${analysed.width}x${analysed.height} faces=${analysed.faces.length}` +
          (face
            ? ` w=${Math.round((face.frame.width / analysed.width) * 100)}% yaw=${face.rotationY.toFixed(0)} smile=${(face.smilingProbability ?? -1).toFixed(2)}`
            : '') +
          ` ${analysed.ms}ms`,
      );
      return analysed;
    };

    /** Kiosk: idle until exactly one face is in view. */
    const watchPhase = async () => {
      while (!cancelled) {
        const shot = await snap();
        if (shot) {
          const photo = await look(shot);
          try {
            const single = pickSingleFace(photo.faces);
            if (single.ok) return;
            setPrompt(single.reason === 'many_faces' ? REJECTION_PROMPTS.many_faces : 'Position your face inside the frame');
          } finally {
            release(photo);
          }
        }
        await sleep(WATCH_INTERVAL_MS);
      }
    };

    const challengePhase = async (): Promise<boolean> => {
      const challenge = pickChallenge();
      setStage('positioning');
      setPrompt(REJECTION_PROMPTS.off_centre);
      const deadline = Date.now() + CAPTURE_TIMEOUT_MS;
      while (!cancelled && Date.now() < deadline) {
        const shot = await snap();
        if (!shot) continue;
        const photo = await look(shot);
        try {
          const single = pickSingleFace(photo.faces);
          const placed = single.ok ? assessPlacement(single.face, photo.width, photo.height) : single;
          if (!placed.ok) {
            setStage('positioning');
            setPrompt(REJECTION_PROMPTS[placed.reason]);
          } else {
            setStage('liveness');
            if (challengeMet(challenge, placed.face)) return true;
            setPrompt(CHALLENGE_PROMPTS[challenge]);
          }
        } finally {
          release(photo);
        }
      }
      return false;
    };

    const frontalPhase = async (): Promise<Float32Array[]> => {
      setStage('capturing');
      setPrompt('Now look straight at the camera');
      const embeddings: Float32Array[] = [];
      const deadline = Date.now() + CAPTURE_TIMEOUT_MS;
      while (!cancelled && embeddings.length < frames && Date.now() < deadline) {
        const shot = await snap();
        if (!shot) continue;
        const photo = await look(shot);
        try {
          const verdict = assessFrontal(photo.faces, photo.width, photo.height);
          if (!verdict.ok) {
            setPrompt(REJECTION_PROMPTS[verdict.reason]);
            continue;
          }
          embeddings.push(await embedFace(photo, verdict.face));
          setCaptured(embeddings.length);
          setPrompt('Hold still…');
        } finally {
          release(photo);
        }
      }
      return embeddings;
    };

    (async () => {
      try {
        if (watch) await watchPhase();
        if (cancelled) return;
        if (requireLiveness && !(await challengePhase())) {
          return cancelled || callbacks.current.onFailure('We could not confirm a live face. Please try again.');
        }
        const embeddings = await frontalPhase();
        if (cancelled) return;
        if (embeddings.length < frames) return callbacks.current.onFailure('We could not get a clear view of your face. Please try again.');
        callbacks.current.onEmbedding(averageEmbeddings(embeddings));
      } catch (error) {
        if (!cancelled) callbacks.current.onFailure(readableError(error));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, ready, watch, requireLiveness, frames]);

  return { camera, setReady, prompt, stage, captured, diagnostics };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The first line of an error, so a native stack trace never reaches the screen. */
export function readableError(error: unknown): string {
  const first = (error instanceof Error ? error.message : '').split('\n')[0].trim();
  return first ? first.slice(0, 160) : 'Face capture failed. Please try again.';
}
