import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { CaptureStage } from '../../face/useFaceCapture';
import { formatClock, formatLongDate } from '../../lib/clock';
import { space, styleFactory, type, useStyles, useTheme } from '../../theme';
import { Button } from '../ui';

/** Time and date that keep ticking, so a person walking up can see the kiosk is alive. */
export function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export function IdleSheet({ location, pinEnabled, onPin }: { location: string | null; pinEnabled: boolean; onPin: () => void }) {
  const styles = useStyles(createStyles);
  const now = useNow();
  return (
    <>
      <View style={styles.clockRow}>
        <View>
          <Text style={styles.clock}>{formatClock(now)}</Text>
          <Text style={styles.date}>{formatLongDate(now)}</Text>
        </View>
        {location ? <Text style={styles.location}>{location}</Text> : null}
      </View>
      {pinEnabled && <Button label="Enter Employee PIN" icon="keypad-outline" variant="tonal" onPress={onPin} />}
      <Text style={styles.note}>Your face is matched on this phone. Only a numeric template is sent, never a photo.</Text>
    </>
  );
}

const STEPS: { label: string; reached: CaptureStage[] }[] = [
  { label: 'Detect face', reached: ['positioning', 'liveness', 'capturing'] },
  { label: 'Quick liveness check', reached: ['capturing'] },
  { label: 'Match employee', reached: [] },
];

export function ScanSheet({ stage, matching, requireLiveness, pinEnabled, onPin }: { stage: CaptureStage; matching: boolean; requireLiveness: boolean; pinEnabled: boolean; onPin: () => void }) {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const steps = requireLiveness ? STEPS : [STEPS[0], STEPS[2]];
  const done = (index: number) => (matching ? index < steps.length - 1 : steps[index].reached.includes(stage));
  const current = steps.findIndex((_, i) => !done(i));
  return (
    <>
      <View>
        <Text style={styles.heading}>{matching ? 'Matching…' : 'Looking for you…'}</Text>
        <Text style={styles.date}>Hold still. This takes a couple of seconds.</Text>
      </View>
      <View style={styles.steps}>
        {steps.map((step, i) => (
          <View key={step.label} style={styles.step}>
            <View style={[styles.stepDot, done(i) ? styles.stepDone : i === current ? styles.stepNow : styles.stepNext]}>
              {done(i) && <Ionicons name="checkmark" size={16} color={color.accentInk} />}
            </View>
            <Text style={[styles.stepLabel, !done(i) && i !== current && styles.stepFaint]}>{step.label}</Text>
          </View>
        ))}
      </View>
      {pinEnabled && <Button label="Use PIN instead" variant="tonal" onPress={onPin} />}
    </>
  );
}

export function FailSheet({ title, message, pinEnabled, onRetry, onPin }: { title: string; message: string; pinEnabled: boolean; onRetry: () => void; onPin: () => void }) {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  return (
    <>
      <View style={styles.failRow}>
        <View style={styles.failIcon}>
          <Ionicons name="alert-circle-outline" size={24} color={color.danger} />
        </View>
        <View style={styles.failText}>
          <Text style={styles.heading}>{title}</Text>
          <Text style={styles.date}>{message}</Text>
        </View>
      </View>
      <Button label="Try again" onPress={onRetry} />
      {pinEnabled && <Button label="Use PIN instead" variant="tonal" onPress={onPin} />}
    </>
  );
}

export function CameraNotice({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  const styles = useStyles(createStyles);
  return (
    <>
      <View>
        <Text style={styles.heading}>{title}</Text>
        <Text style={styles.date}>{body}</Text>
      </View>
      <Button label={action} onPress={onAction} />
    </>
  );
}


const createStyles = styleFactory((color) => ({
  clockRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  clock: { fontSize: 40, lineHeight: 44, fontWeight: '700', letterSpacing: -1, color: color.ink },
  date: { ...type.body, color: color.muted },
  location: { ...type.caption, color: color.muted, textAlign: 'right' },
  note: { ...type.caption, color: color.muted, textAlign: 'center' },
  heading: { ...type.title, color: color.ink },
  steps: { gap: space.sm + 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 4 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  stepDone: { backgroundColor: color.accent, borderColor: color.accent },
  stepNow: { borderColor: color.accent },
  stepNext: { borderColor: color.line },
  stepLabel: { ...type.label, fontSize: 16, color: color.ink },
  stepFaint: { color: color.muted, fontWeight: '400' },
  failRow: { flexDirection: 'row', gap: space.sm + 6, alignItems: 'flex-start' },
  failIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.dangerTint, alignItems: 'center', justifyContent: 'center' },
  failText: { flex: 1, gap: 4 },
}));
