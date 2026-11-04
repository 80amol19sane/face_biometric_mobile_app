import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../src/api/http';
import { identify, type KioskConfig, type KioskPunch } from '../src/api/kiosk';
import { CameraNotice, FailSheet, IdleSheet, ScanSheet } from '../src/components/kiosk/KioskSheets';
import { KioskChrome, type KioskTone } from '../src/components/kiosk/KioskChrome';
import { PunchResult } from '../src/components/kiosk/PunchResult';
import { SleepCover } from '../src/components/kiosk/SleepCover';
import { Result } from '../src/components/Result';
import { Button } from '../src/components/ui';
import { useFaceCapture, type CaptureStage } from '../src/face/useFaceCapture';
import { useKioskBoot } from '../src/kiosk/useKioskBoot';
import { sleepAfterMs } from '../src/lib/sleep';
import { usePreferences } from '../src/state/preferences';

const FAIL_RETURN_MS = 20_000;
const goAdmin = () => router.push('/admin/login');
const goPin = () => router.push('/pin');

/** The default screen: always the walk-up attendance kiosk, never a login. */
export default function Kiosk() {
  useKeepAwake();
  const { boot, retry } = useKioskBoot();

  switch (boot.name) {
    case 'loading':
      return <Result icon="time-outline" tone="accent" title="Starting the kiosk…" />;
    case 'no_server':
      return (
        <Result
          icon="globe-outline"
          tone="accent"
          title="Connect to your company"
          body="This phone needs the address of your HRMS site before it can take attendance."
          actions={<Button label="Enter server address" onPress={() => router.push('/server')} />}
        />
      );
    case 'not_registered':
      return <Setup />;
    case 'offline':
      return (
        <Result
          icon="cloud-offline-outline"
          tone="warning"
          title="No connection"
          body={`${boot.message} Attendance cannot be taken until the kiosk is back online.`}
          actions={
            <>
              <Button label="Try again" icon="refresh" onPress={retry} />
              <Button label="Admin access" variant="ghost" onPress={goAdmin} />
            </>
          }
        />
      );
    case 'ready':
      return <Ready device={boot.device} config={boot.config} />;
  }
}

/** First run: nothing to scan with until an admin registers this phone as a kiosk. */
function Setup() {
  return (
    <KioskChrome tone="fail" pill="Not set up" instruction="This phone is not a kiosk yet" onAdmin={goAdmin}>
      <CameraNotice
        title="An HR admin needs to set this phone up"
        body="Tap the shield icon, sign in with your HR Manager account, then register this phone as a kiosk. After that, employees can check in with no login."
        action="Admin access"
        onAction={goAdmin}
      />
    </KioskChrome>
  );
}

type Outcome = { kind: 'punch'; punch: KioskPunch } | { kind: 'failed'; title: string; pill: string; message: string };

function Ready({ device, config }: { device: string; config: KioskConfig }) {
  const [run, setRun] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const again = useCallback(() => {
    setOutcome(null);
    setRun((n) => n + 1);
  }, []);

  useEffect(() => {
    if (outcome?.kind !== 'failed') return;
    const timer = setTimeout(again, FAIL_RETURN_MS);
    return () => clearTimeout(timer);
  }, [outcome, again]);

  const finish = useCallback((result: Outcome) => {
    const feedback =
      result.kind === 'failed' ? Haptics.NotificationFeedbackType.Error : result.punch.shift?.status === 'Late' ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success;
    Haptics.notificationAsync(feedback).catch(() => {});
    setOutcome(result);
  }, []);

  if (outcome?.kind === 'punch') return <PunchResult punch={outcome.punch} seconds={config.return_seconds} onDone={again} />;
  if (outcome?.kind === 'failed') {
    return (
      <KioskChrome tone="fail" pill={outcome.pill} instruction="" onAdmin={goAdmin}>
        <FailSheet title={outcome.title} message={outcome.message} pinEnabled={config.pin_enabled} onRetry={again} onPin={goPin} />
      </KioskChrome>
    );
  }
  return <Scan key={run} device={device} config={config} onOutcome={finish} />;
}

function Scan({ device, config, onOutcome }: { device: string; config: KioskConfig; onOutcome: (outcome: Outcome) => void }) {
  const { diagnostics: showDiagnostics, sleep } = usePreferences();
  const [permission, requestPermission] = useCameraPermissions();
  const [matching, setMatching] = useState(false);
  const matchingRef = useRef(false);

  const onEmbedding = useCallback(
    async (embedding: Float32Array) => {
      matchingRef.current = true;
      setMatching(true);
      try {
        onOutcome({ kind: 'punch', punch: await identify(device, embedding) });
      } catch (error) {
        onOutcome(failure(error));
      }
    },
    [device, onOutcome],
  );
  const onFailure = useCallback(
    (message: string) =>
      onOutcome({
        kind: 'failed',
        title: 'We could not confirm you',
        pill: 'Not confirmed',
        message,
      }),
    [onOutcome],
  );

  const { camera, setReady, prompt, stage, diagnostics, asleep, wake } = useFaceCapture({
    frames: 1,
    enabled: !!permission?.granted,
    watch: true,
    sleepAfterMs: sleepAfterMs(sleep),
    requireLiveness: config.require_liveness,
    onEmbedding,
    onFailure,
  });

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  const { tone, pill } = describe(stage, matching);
  const watching = stage === 'watching' && !matching;
  const instruction = matching ? 'Matching…' : watching && prompt === 'Getting ready…' ? 'Position your face inside the frame' : prompt;

  return (
    <View style={styles.fill}>
      <KioskChrome
        tone={tone}
        pill={pill}
        instruction={permission?.granted ? instruction : 'Camera access is needed'}
        onAdmin={goAdmin}
        camera={
          permission?.granted ? (
            <View style={StyleSheet.absoluteFill}>
              <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" animateShutter={false} onCameraReady={() => setReady(true)} />
            </View>
          ) : undefined
        }
      >
        {!permission?.granted ? (
          <CameraNotice
            title="Allow the camera"
            body="The kiosk uses the front camera to recognise employees. No photo is stored for face check-ins."
            action="Allow camera"
            onAction={requestPermission}
          />
        ) : watching ? (
          <IdleSheet location={config.label ?? config.location} pinEnabled={config.pin_enabled} onPin={goPin} />
        ) : (
          <ScanSheet stage={stage} matching={matching} requireLiveness={config.require_liveness} pinEnabled={config.pin_enabled && !matching} onPin={goPin} />
        )}
        {showDiagnostics && permission?.granted ? <DiagnosticsLine text={diagnostics} /> : null}
      </KioskChrome>
      <SleepCover visible={asleep && watching} onWake={wake} />
    </View>
  );
}

function describe(stage: CaptureStage, matching: boolean): { tone: KioskTone; pill: string } {
  if (matching) return { tone: 'found', pill: 'Matching' };
  if (stage === 'watching') return { tone: 'idle', pill: 'Ready for attendance' };
  if (stage === 'liveness') return { tone: 'liveness', pill: 'Liveness check' };
  return { tone: 'found', pill: 'Face found' };
}

/** Turns a server or network error into what the person at the kiosk should read. */
function failure(error: unknown): Outcome {
  if (error instanceof ApiError && error.kind === 'network') {
    return {
      kind: 'failed',
      title: 'No connection',
      pill: 'Offline',
      message: 'The kiosk cannot reach the server. Please try again in a moment.',
    };
  }
  const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
  if (error instanceof ApiError && error.status === 417)
    return {
      kind: 'failed',
      title: 'Already recorded',
      pill: 'Already recorded',
      message,
    };
  return {
    kind: 'failed',
    title: 'We could not recognise you',
    pill: 'Not recognised',
    message,
  };
}

function DiagnosticsLine({ text }: { text: string }) {
  return <Text style={styles.diagnostics}>{text}</Text>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  diagnostics: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'monospace',
    color: '#8893A5',
    textAlign: 'center',
  },
});
