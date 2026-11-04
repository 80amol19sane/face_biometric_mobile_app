import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { KioskPunch } from '../../api/kiosk';
import { formatClock, formatShortDate, parseSiteTime } from '../../lib/clock';
import { greeting } from '../../lib/names';
import { describeStanding } from '../../lib/shift';
import { initialsOf } from '../Avatar';
import { space, styleFactory, type, useStyles, useTheme } from '../../theme';
import { Button, Pill } from '../ui';

interface PunchResultProps {
  punch: KioskPunch;
  seconds: number;
  onDone: () => void;
}

/** Shown after a punch: who, in or out, how it sat against the shift, then back to the camera on its own. */
export function PunchResult({ punch, seconds, onDone }: PunchResultProps) {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const when = parseSiteTime(punch.time);
  const standing = describeStanding(punch.shift);
  const isIn = punch.log_type === 'IN';
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const run = Animated.timing(progress, { toValue: 0, duration: seconds * 1000, easing: Easing.linear, useNativeDriver: false });
    run.start(({ finished }) => finished && onDone());
    return () => run.stop();
  }, [progress, seconds, onDone]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.top}>
          <View style={styles.checkRing}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={34} color="#06281A" />
            </View>
          </View>
          <Text style={styles.recorded}>ATTENDANCE RECORDED</Text>
        </View>

        <View style={styles.sheet}>
          <View style={styles.who}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initialsOf(punch.employee_name)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.greeting}>{isIn ? greeting(when) : 'Have a good day,'}</Text>
              <Text style={styles.name} numberOfLines={2}>{punch.employee_name}</Text>
            </View>
          </View>

          <View style={styles.pills}>
            <View style={[styles.direction, { backgroundColor: isIn ? color.success : color.accent }]}>
              <Text style={[styles.directionText, { color: isIn ? '#FFFFFF' : color.accentInk }]}>{isIn ? 'IN' : 'OUT'}</Text>
            </View>
            {punch.method === 'PIN' && <Pill label="By PIN" tone="accent" />}
            {standing && <Pill label={standing.text} tone={standing.tone} />}
          </View>

          {punch.method === 'PIN' && (
            <View style={styles.proof}>
              <Ionicons name="camera-outline" size={22} color={color.accent} />
              <Text style={styles.proofText}>Proof photo saved for HR to review, then deleted automatically.</Text>
            </View>
          )}

          <View style={styles.details}>
            <Detail label="Time" value={formatClock(when)} strong />
            <Detail label="Date" value={formatShortDate(when)} />
            <Detail label="Employee ID" value={punch.employee} />
            {punch.department ? <Detail label="Department" value={punch.department.replace(/ - [A-Z]+$/, '')} /> : null}
            {punch.shift ? <Detail label="Shift" value={punch.shift.name} last /> : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.returning}>Returning to the camera…</Text>
            <View style={styles.track}>
              <Animated.View style={[styles.bar, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
            </View>
            <Button label="Done" onPress={onDone} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Detail({ label, value, strong, last }: { label: string; value: string; strong?: boolean; last?: boolean }) {
  const styles = useStyles(createStyles);
  return (
    <View style={[styles.detail, last && styles.detailLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, strong && styles.detailStrong]}>{value}</Text>
    </View>
  );
}

const createStyles = styleFactory((color) => ({
  root: { flex: 1, backgroundColor: '#0B1A16' },
  flex: { flex: 1 },
  top: { alignItems: 'center', gap: space.md, paddingTop: space.lg, paddingBottom: space.lg },
  checkRing: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(91,211,143,0.16)', alignItems: 'center', justifyContent: 'center' },
  check: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#5BD38F', alignItems: 'center', justifyContent: 'center' },
  recorded: { fontSize: 15, lineHeight: 20, fontWeight: '700', letterSpacing: 1.8, color: '#7BE0A6' },
  sheet: { flex: 1, backgroundColor: color.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: space.lg, gap: space.md + 4 },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: color.accentTint, borderWidth: 3, borderColor: color.success, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 32, fontWeight: '700', color: color.accent },
  greeting: { ...type.body, color: color.muted },
  name: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3, color: color.ink },
  pills: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm + 2 },
  direction: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  directionText: { fontSize: 16, lineHeight: 22, fontWeight: '700', letterSpacing: 1 },
  proof: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 4, padding: space.sm + 4, borderRadius: 16, backgroundColor: color.accentTint },
  proofText: { flex: 1, ...type.caption, color: color.ink },
  details: { borderTopWidth: 1, borderTopColor: color.line },
  detail: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: color.line, gap: space.md },
  detailLast: { borderBottomWidth: 0 },
  detailLabel: { ...type.body, color: color.muted },
  detailValue: { ...type.label, fontSize: 16, color: color.ink, flexShrink: 1, textAlign: 'right' },
  detailStrong: { fontWeight: '700' },
  footer: { marginTop: 'auto', gap: space.sm + 4 },
  returning: { ...type.caption, textAlign: 'center', color: color.muted },
  track: { height: 6, borderRadius: 3, backgroundColor: color.line, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3, backgroundColor: color.accent },
}));
