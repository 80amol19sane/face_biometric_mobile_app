import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CAPTURE_TIMEOUT_MS, SHOW_DIAGNOSTICS } from '../face/config';
import { challengeMet, CHALLENGE_PROMPTS, pickChallenge } from '../face/liveness';
import { analysePhoto, embedFace, release } from '../face/pipeline';
import { assessFrontal, assessPlacement, pickSingleFace, REJECTION_PROMPTS } from '../face/quality';
import { averageEmbeddings } from '../lib/embedding';
import { color, radius, space } from '../theme';
import { Body, Button, Screen, Title } from './ui';

interface Props {
  /** Straight-on frames averaged into the result (3 to enrol, 1 to check in). */
  frames: number;
  onEmbedding: (embedding: Float32Array) => void;
  onFailure: (message: string) => void;
}

/**
 * Runs the whole capture: a random liveness challenge, then straight-on frames, then the embedding.
 * It only produces an embedding; it never talks to the server.
 */
export function FaceCamera({ frames, onEmbedding, onFailure }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [prompt, setPrompt] = useState('Getting ready…');
  const [captured, setCaptured] = useState(0);
  const [diagnostics, setDiagnostics] = useState('waiting for camera');

  useEffect(() => {
    if (!permission?.granted) return;
    const timer = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(timer);
  }, [permission?.granted]);

  useEffect(() => {
    if (!permission?.granted || !ready) return;
    let cancelled = false;

    let frame = 0;
    const snap = async () => {
      const photo = await camera.current?.takePictureAsync({ quality: 0.5, shutterSound: false, exif: false });
      return photo ?? null;
    };
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

    const challengePhase = async (): Promise<boolean> => {
      const challenge = pickChallenge();
      setPrompt(CHALLENGE_PROMPTS[challenge]);
      const deadline = Date.now() + CAPTURE_TIMEOUT_MS;
      while (!cancelled && Date.now() < deadline) {
        const shot = await snap();
        if (!shot) continue;
        const photo = await look(shot);
        try {
          const single = pickSingleFace(photo.faces);
          const placed = single.ok ? assessPlacement(single.face, photo.width, photo.height) : single;
          if (!placed.ok) setPrompt(REJECTION_PROMPTS[placed.reason]);
          else if (challengeMet(challenge, placed.face)) return true;
          else setPrompt(CHALLENGE_PROMPTS[challenge]);
        } finally {
          release(photo);
        }
      }
      return false;
    };

    const frontalPhase = async (): Promise<Float32Array[]> => {
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
        if (!(await challengePhase())) return cancelled || onFailure('We could not confirm a live face. Please try again.');
        const embeddings = await frontalPhase();
        if (cancelled) return;
        if (embeddings.length < frames) return onFailure('We could not get a clear view of your face. Please try again.');
        onEmbedding(averageEmbeddings(embeddings));
      } catch (error) {
        if (!cancelled) onFailure(error instanceof Error ? error.message : 'Face capture failed.');
      }
    })();

    return () => {
      cancelled = true;
    };
    // The capture is one run per mount; callers remount this component to retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission?.granted, ready]);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <Screen>
        <Title>Camera access</Title>
        <Body>The camera is used only to match your face when you enrol and check in. Photos are not stored.</Body>
        <Button label="Allow camera" onPress={requestPermission} />
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" onCameraReady={() => setReady(true)} />
      <View style={styles.oval} pointerEvents="none" />
      {SHOW_DIAGNOSTICS && <Text style={styles.diagnostics}>{diagnostics}</Text>}
      <View style={styles.banner}>
        <Text style={styles.prompt} accessibilityLiveRegion="polite">{prompt}</Text>
        {frames > 1 && <Text style={styles.progress}>{captured} of {frames}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  oval: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    width: '70%',
    aspectRatio: 0.78,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
  },
  banner: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    bottom: space.xl,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
    alignItems: 'center',
  },
  diagnostics: { position: 'absolute', top: space.xl, left: space.md, right: space.md, color: '#9BE7A5', fontSize: 12, fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.5)', padding: space.xs },
  prompt: { color: color.primaryText, fontSize: 20, fontWeight: '600', textAlign: 'center' },
  progress: { color: '#D5DBE1', fontSize: 14 },
});
