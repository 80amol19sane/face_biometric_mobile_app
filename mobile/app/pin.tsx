import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../src/api/http';
import { lookUp, pinCheckIn, type KioskConfig, type KioskPunch } from '../src/api/kiosk';
import { PunchResult } from '../src/components/kiosk/PunchResult';
import { Result } from '../src/components/Result';
import { Button, Caption } from '../src/components/ui';
import { Avatar } from '../src/components/Avatar';
import { KeyboardFrame, KeyboardScroll } from '../src/components/KeyboardFrame';
import { backspace, canVerify, dotStates, pressDigit } from '../src/lib/pinEntry';
import { useKioskBoot } from '../src/kiosk/useKioskBoot';
import { radius, space, styleFactory, type, useStyles, useTheme } from '../src/theme';

const PHOTO_WIDTH = 480;
const COUNTDOWN_FROM = 3;

type Step =
  | { name: 'id' }
  | { name: 'keypad'; employee: string; employeeName: string; digits: string }
  | { name: 'photo'; employee: string; employeeName: string; pin: string }
  | { name: 'sending' }
  | { name: 'done'; punch: KioskPunch }
  | { name: 'failed'; message: string; employee: string; employeeName: string };

/** PIN attendance: employee id, confirm the name, PIN, then a proof photo is taken and the punch sent. */
export default function PinAttendance() {
  useKeepAwake();
  const { boot } = useKioskBoot();
  if (boot.name !== 'ready') return <Result icon="time-outline" tone="accent" title="One moment…" actions={<Button label="Back" variant="ghost" onPress={() => router.back()} />} />;
  if (!boot.config.pin_enabled) return <Result icon="lock-closed-outline" tone="warning" title="PIN attendance is off" body="Use the face camera, or ask HR." actions={<Button label="Back" onPress={() => router.back()} />} />;
  return <Flow device={boot.device} config={boot.config} />;
}

function Flow({ device, config }: { device: string; config: KioskConfig }) {
  const [step, setStep] = useState<Step>({ name: 'id' });
  const leave = useCallback(() => router.replace('/'), []);

  const send = async (employee: string, employeeName: string, pin: string, photoBase64: string) => {
    setStep({ name: 'sending' });
    try {
      const punch = await pinCheckIn(device, employee, pin, photoBase64);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setStep({ name: 'done', punch });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setStep({ name: 'failed', employee, employeeName, message: error instanceof ApiError ? error.message : 'Something went wrong. Please try again.' });
    }
  };

  switch (step.name) {
    case 'id':
      return <EmployeeId device={device} onBack={leave} onFound={(employee, employeeName) => setStep({ name: 'keypad', employee, employeeName, digits: '' })} />;
    case 'keypad':
      return (
        <Keypad
          employee={step.employee}
          employeeName={step.employeeName}
          config={config}
          onBack={() => setStep({ name: 'id' })}
          onVerify={(pin) => setStep({ name: 'photo', employee: step.employee, employeeName: step.employeeName, pin })}
        />
      );
    case 'photo':
      return <ProofPhoto onBack={() => setStep({ name: 'keypad', employee: step.employee, employeeName: step.employeeName, digits: '' })} onPhoto={(photo) => send(step.employee, step.employeeName, step.pin, photo)} />;
    case 'sending':
      return <Result icon="time-outline" tone="accent" title="Verifying…" body="Checking your PIN with the server." />;
    case 'done':
      return <PunchResult punch={step.punch} seconds={config.return_seconds} onDone={leave} />;
    case 'failed':
      return (
        <Result
          icon="alert-circle"
          tone="danger"
          title="Not recorded"
          body={step.message}
          bodyTone="danger"
          actions={
            <>
              <Button label="Try again" icon="refresh" onPress={() => setStep({ name: 'keypad', employee: step.employee, employeeName: step.employeeName, digits: '' })} />
              <Button label="Back to camera" variant="ghost" onPress={leave} />
            </>
          }
        />
      );
  }
}

function Header({ onBack }: { onBack: () => void }) {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={color.ink} />
      </Pressable>
      <Text style={styles.eyebrow}>PIN ATTENDANCE</Text>
    </View>
  );
}

function EmployeeId({ device, onBack, onFound }: { device: string; onBack: () => void; onFound: (employee: string, employeeName: string) => void }) {
  const styles = useStyles(createStyles);
  const [value, setValue] = useState('');
  const [found, setFound] = useState<{ employee: string; employee_name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    setBusy(true);
    setError(null);
    try {
      setFound(await lookUp(device, value.trim()));
    } catch (e) {
      setFound(null);
      setError(e instanceof ApiError ? e.message : 'Could not check that ID.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardFrame>
      <Header onBack={onBack} />
      <KeyboardScroll>
      <View style={styles.body}>
        <Text style={styles.title}>Who is checking in?</Text>
        <Caption>Enter your employee ID.</Caption>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => {
            setValue(text);
            setFound(null);
          }}
          placeholder="HR-EMP-00032"
          placeholderTextColor="#98A2B3"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={check}
          accessibilityLabel="Employee ID"
        />
        {found ? (
          <View style={styles.confirm}>
            <Avatar name={found.employee_name} size={56} />
            <View style={styles.confirmText}>
              <Caption>Is this you?</Caption>
              <Text style={styles.confirmName}>{found.employee_name}</Text>
            </View>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Caption>Only your name is shown here. Other details appear after your PIN is verified.</Caption>
      </View>
      </KeyboardScroll>
      <View style={styles.footer}>
        {found ? <Button label="Continue" onPress={() => onFound(found.employee, found.employee_name)} /> : <Button label="Find me" busy={busy} disabled={!value.trim()} onPress={check} />}
        <Button label="Use face instead" variant="ghost" onPress={onBack} />
      </View>
      </KeyboardFrame>
    </SafeAreaView>
  );
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'delete'] as const;

function Keypad({ employee, employeeName, config, onBack, onVerify }: { employee: string; employeeName: string; config: KioskConfig; onBack: () => void; onVerify: (pin: string) => void }) {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const [digits, setDigits] = useState('');
  const press = (key: (typeof KEYS)[number]) => {
    if (key === 'clear') setDigits('');
    else if (key === 'delete') setDigits(backspace(digits));
    else setDigits(pressDigit(digits, key, config.pin_max_length));
  };
  return (
    <SafeAreaView style={styles.screen}>
      <Header onBack={onBack} />
      <KeyboardScroll>
      <View style={styles.keypadTop}>
        <View style={styles.chip}>
          <Avatar name={employeeName} size={36} />
          <Text style={styles.chipName}>{employeeName}</Text>
          <Text style={styles.chipId}>{employee}</Text>
        </View>
        <Text style={styles.title}>Enter your PIN</Text>
        <View style={styles.dots} accessibilityLabel={`${digits.length} digits entered`}>
          {dotStates(digits, config.pin_max_length).map((filled, i) => (
            <View key={i} style={[styles.dot, filled && styles.dotFilled]} />
          ))}
        </View>
        <Caption>{config.pin_min_length} to {config.pin_max_length} digits</Caption>
      </View>
      <View style={styles.grid}>
        {KEYS.map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={key === 'delete' ? 'Delete' : key === 'clear' ? 'Clear' : key}
            onPress={() => press(key)}
            style={({ pressed }) => [styles.key, key !== 'clear' && key !== 'delete' && styles.keyFilled, pressed && styles.keyPressed]}
          >
            {key === 'delete' ? <Ionicons name="backspace-outline" size={28} color={color.ink} /> : <Text style={[styles.keyText, key === 'clear' && styles.keyClear]}>{key === 'clear' ? 'Clear' : key}</Text>}
          </Pressable>
        ))}
      </View>
      </KeyboardScroll>
      <View style={styles.footer}>
        <Button label="Verify PIN" disabled={!canVerify(digits, config.pin_min_length)} onPress={() => onVerify(digits)} />
        <Caption>A photo is taken as proof when you verify. HR keeps it for a limited time.</Caption>
      </View>
    </SafeAreaView>
  );
}

function ProofPhoto({ onBack, onPhoto }: { onBack: () => void; onPhoto: (base64: string) => void }) {
  const styles = useStyles(createStyles);
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [problem, setProblem] = useState<string | null>(null);
  const taken = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  useEffect(() => {
    if (!ready) return;
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (taken.current) return;
    taken.current = true;
    (async () => {
      try {
        const shot = await camera.current?.takePictureAsync({ quality: 0.7, shutterSound: false, exif: false });
        if (!shot) throw new Error('no photo');
        const small = await manipulateAsync(shot.uri, [{ resize: { width: PHOTO_WIDTH } }], { format: SaveFormat.JPEG, compress: 0.6, base64: true });
        if (!small.base64) throw new Error('no photo data');
        onPhoto(small.base64);
      } catch {
        taken.current = false;
        setProblem('The photo could not be taken. Please try again.');
        setCount(COUNTDOWN_FROM);
      }
    })();
  }, [ready, count, onPhoto]);

  if (permission && !permission.granted) {
    return <Result icon="camera-outline" tone="warning" title="Camera needed" body="A proof photo is part of PIN attendance." actions={<><Button label="Allow camera" onPress={requestPermission} /><Button label="Back" variant="ghost" onPress={onBack} /></>} />;
  }
  return (
    <View style={styles.photoRoot}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" onCameraReady={() => setReady(true)} />
      <SafeAreaView style={styles.photoOverlay} pointerEvents="box-none">
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={onBack} style={styles.photoClose}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.photoMiddle} pointerEvents="none">
          <View style={styles.photoOval}>
            <Text style={styles.photoCount}>{ready && count > 0 ? count : ''}</Text>
          </View>
          <Text style={styles.photoText}>{problem ?? 'Look at the camera'}</Text>
        </View>
        <View style={styles.photoSheet}>
          <Text style={styles.photoTitle}>Taking a proof photo</Text>
          <Caption>One photo is saved with this check-in so HR can confirm it was you, then deleted automatically.</Caption>
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = styleFactory((color) => ({
  screen: { flex: 1, backgroundColor: color.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  back: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...type.caption, fontWeight: '700', letterSpacing: 1.8, color: color.accent },
  body: { paddingHorizontal: space.lg, gap: space.md, paddingTop: space.md },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3, color: color.ink },
  input: { minHeight: 58, borderRadius: radius.md, borderWidth: 2, borderColor: color.accent, backgroundColor: color.surface, color: color.ink, fontSize: 20, paddingHorizontal: space.md },
  confirm: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: 20, backgroundColor: color.surface },
  confirmText: { flex: 1 },
  confirmName: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: color.ink },
  error: { ...type.body, color: color.danger },
  footer: { padding: space.lg, gap: space.sm + 4 },
  keypadTop: { alignItems: 'center', gap: space.sm + 4, paddingHorizontal: space.lg },
  chip: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6, paddingLeft: 6, paddingRight: space.md, borderRadius: 999, backgroundColor: color.surface },
  chipName: { ...type.label, fontSize: 16, color: color.ink },
  chipId: { ...type.caption, color: color.muted },
  dots: { flexDirection: 'row', gap: space.md, paddingVertical: space.sm },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: color.muted },
  dotFilled: { backgroundColor: color.accent, borderColor: color.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, paddingHorizontal: space.xl, marginTop: space.md },
  key: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  keyFilled: { backgroundColor: color.surface },
  keyPressed: { opacity: 0.6 },
  keyText: { fontSize: 28, fontWeight: '500', color: color.ink },
  keyClear: { fontSize: 16, fontWeight: '600', color: color.muted },
  photoRoot: { flex: 1, backgroundColor: '#000' },
  photoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  photoClose: { margin: space.md, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  photoMiddle: { alignItems: 'center', gap: space.md },
  photoOval: { width: 220, height: 280, borderRadius: 140, borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  photoCount: { fontSize: 72, fontWeight: '700', color: '#FFFFFF' },
  photoText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', paddingHorizontal: space.xl },
  photoSheet: { backgroundColor: color.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: space.lg, gap: 4 },
  photoTitle: { ...type.title, color: color.ink },
}));
