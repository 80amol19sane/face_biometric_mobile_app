import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { claimEmployee } from '../../offline/recorder';
import { formatClock, formatShortDate } from '../../lib/clock';
import { space, styleFactory, type, useStyles } from '../../theme';
import { Field } from '../Field';
import { KeyboardFrame, KeyboardScroll } from '../KeyboardFrame';
import { Button } from '../ui';

interface QueuedResultProps {
  at: Date;
  /** The saved scan, so the person can add their employee ID to it. */
  localId: string;
  seconds: number;
  onDone: () => void;
}

/**
 * Shown after a scan saved offline. It cannot say who the person is or whether it was recognised,
 * because the server has not seen it yet, so it says exactly that.
 */
export function QueuedResult({ at, localId, seconds, onDone }: QueuedResultProps) {
  const styles = useStyles(createStyles);
  const progress = useRef(new Animated.Value(1)).current;
  const [step, setStep] = useState<'idle' | 'typing' | 'saved'>('idle');
  const [employee, setEmployee] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const saveId = async () => {
    try {
      await claimEmployee(localId, employee);
      setStep('saved');
    } catch {
      setProblem('Could not save that. Please try again.');
    }
  };

  // Typing an ID can take longer than the usual return time, so the countdown waits.
  useEffect(() => {
    if (step === 'typing') return;
    progress.setValue(1);
    const run = Animated.timing(progress, { toValue: 0, duration: seconds * 1000, easing: Easing.linear, useNativeDriver: false });
    run.start(({ finished }) => finished && onDone());
    return () => run.stop();
  }, [progress, seconds, onDone, step]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <KeyboardFrame>
        <View style={styles.top}>
          <View style={styles.ring}>
            <View style={styles.badge}>
              <Ionicons name="cloud-offline-outline" size={32} color="#2B1B00" />
            </View>
          </View>
          <Text style={styles.recorded}>SAVED OFFLINE</Text>
        </View>

        <View style={styles.sheet}>
          <KeyboardScroll contentStyle={styles.sheetContent}>
          <Text style={styles.time}>{formatClock(at)}</Text>
          <Text style={styles.date}>{formatShortDate(at)}</Text>
          <Text style={styles.body}>Your scan is saved. This kiosk has no connection, so it cannot tell you who it matched yet.</Text>
          <Text style={styles.body}>It will be checked and recorded when the connection returns. If your attendance is missing later, tell HR.</Text>
          {step === 'saved' ? <Text style={styles.body}>Thanks. Your ID is saved with this scan and HR will check it.</Text> : null}
          {step === 'idle' ? <Button label="Add my employee ID" variant="ghost" onPress={() => setStep('typing')} /> : null}
          {step === 'typing' ? (
            <View style={styles.claim}>
              <Field label="Employee ID" value={employee} onChangeText={setEmployee} placeholder="HR-EMP-00032" autoCapitalize="characters" returnKeyType="done" onSubmitEditing={saveId} />
              {problem ? <Text style={styles.body}>{problem}</Text> : null}
              <Button label="Save ID" disabled={!employee.trim()} onPress={saveId} />
            </View>
          ) : null}
          <View style={styles.footer}>
            <Text style={styles.returning}>Returning to the camera…</Text>
            <View style={styles.track}>
              <Animated.View style={[styles.bar, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
            </View>
            <Button label="Done" onPress={onDone} />
          </View>
          </KeyboardScroll>
        </View>
        </KeyboardFrame>
      </SafeAreaView>
    </View>
  );
}

const createStyles = styleFactory((color) => ({
  root: { flex: 1, backgroundColor: '#1C1507' },
  flex: { flex: 1 },
  top: { alignItems: 'center', gap: space.md, paddingTop: space.lg, paddingBottom: space.lg },
  ring: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(242,179,92,0.16)', alignItems: 'center', justifyContent: 'center' },
  badge: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F2B35C', alignItems: 'center', justifyContent: 'center' },
  recorded: { fontSize: 15, lineHeight: 20, fontWeight: '700', letterSpacing: 1.8, color: '#F5C987' },
  sheet: { flex: 1, backgroundColor: color.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  sheetContent: { padding: space.lg, gap: space.md },
  time: { fontSize: 44, lineHeight: 52, fontWeight: '700', letterSpacing: -0.5, color: color.ink },
  date: { ...type.body, color: color.muted },
  body: { ...type.body, color: color.ink },
  claim: { gap: space.sm + 4 },
  footer: { marginTop: 'auto', gap: space.sm + 4 },
  returning: { ...type.caption, textAlign: 'center', color: color.muted },
  track: { height: 6, borderRadius: 3, backgroundColor: color.line, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3, backgroundColor: color.accent },
}));
