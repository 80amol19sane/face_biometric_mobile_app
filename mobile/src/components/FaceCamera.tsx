import { CameraView, useCameraPermissions } from 'expo-camera';
import { StyleSheet, View } from 'react-native';
import { usePreferences } from '../state/preferences';
import { useFaceCapture } from '../face/useFaceCapture';
import { Body, Button, IconBadge, Screen, Title } from './ui';
import { CaptureOverlay } from './CaptureOverlay';

interface Props {
  /** Straight-on frames averaged into the result (3 to enrol, 1 to check in). */
  frames: number;
  onEmbedding: (embedding: Float32Array) => void;
  onFailure: (message: string) => void;
  onCancel: () => void;
}

/**
 * Runs the whole capture: a random liveness challenge, then straight-on frames, then the embedding.
 * It only produces an embedding; it never talks to the server.
 */
export function FaceCamera({ frames, onEmbedding, onFailure, onCancel }: Props) {
  const { diagnostics: showDiagnostics } = usePreferences();
  const [permission, requestPermission] = useCameraPermissions();
  const { camera, setReady, prompt, stage, captured, diagnostics } = useFaceCapture({
    frames,
    enabled: !!permission?.granted,
    onEmbedding,
    onFailure,
  });
  const phase = stage === 'capturing' ? 'capture' : 'live';

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <Screen
        footer={
          <>
            <Button label="Allow camera" icon="camera-outline" onPress={requestPermission} />
            <Button label="Not now" variant="ghost" onPress={onCancel} />
          </>
        }
      >
        <View style={styles.permission}>
          <IconBadge name="camera-outline" size={72} />
          <Title>Camera access</Title>
          <Body>The camera is used only to match your face when you enrol and check in. No photo is stored.</Body>
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" onCameraReady={() => setReady(true)} />
      <CaptureOverlay
        phase={phase}
        prompt={prompt}
        captured={captured}
        frames={frames}
        diagnostics={showDiagnostics ? diagnostics : undefined}
        onCancel={onCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  permission: { flex: 1, justifyContent: 'center', gap: 16 },
});
