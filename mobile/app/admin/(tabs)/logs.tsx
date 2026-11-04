import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import { attendanceLogs, type AttendanceLog } from '../../../src/api/admin';
import { AdminPage } from '../../../src/components/admin/AdminPage';
import { Body } from '../../../src/components/ui';
import { clockTime } from '../../../src/lib/punches';
import { formatShortDate } from '../../../src/lib/clock';
import { addDays, dayLabel, isoDay, isToday } from '../../../src/lib/dates';
import { describeStanding } from '../../../src/lib/shift';
import { useLoad } from '../../../src/state/useLoad';
import { space, styleFactory, type, useStyles, useTheme } from '../../../src/theme';

export default function Logs() {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const [day, setDay] = useState(isoDay(new Date()));
  const { data, error, loading, reload } = useLoad(() => attendanceLogs(day), [day]);
  const step = (n: number) => setDay(addDays(day, n));

  return (
    <AdminPage eyebrow="ADMIN" title="Attendance logs" error={error} refreshing={loading && !!data} onRefresh={reload}>
      <View style={styles.nav}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous day" onPress={() => step(-1)} style={styles.arrow}>
          <Ionicons name="chevron-back" size={22} color={color.ink} />
        </Pressable>
        <Text style={styles.day}>{dayLabel(day, formatShortDate)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next day" disabled={isToday(day)} onPress={() => step(1)} style={[styles.arrow, isToday(day) && styles.off]}>
          <Ionicons name="chevron-forward" size={22} color={color.ink} />
        </Pressable>
      </View>
      {data && (
        <>
          <View style={styles.summary}>
            <Summary value={data.summary.in} label="IN" />
            <Summary value={data.summary.out} label="OUT" />
            <Summary value={data.summary.late} label="Late" warn />
            <Summary value={data.summary.by_pin} label="By PIN" />
          </View>
          {data.logs.length === 0 && <Body>No punches on this day.</Body>}
          {data.logs.map((log) => <LogRow key={log.name} log={log} />)}
        </>
      )}
    </AdminPage>
  );
}

function Summary({ value, label, warn }: { value: number; label: string; warn?: boolean }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.sum}>
      <Text style={[styles.sumValue, warn && value > 0 && styles.warn]}>{value}</Text>
      <Text style={styles.sumLabel}>{label}</Text>
    </View>
  );
}

function LogRow({ log }: { log: AttendanceLog }) {
  const styles = useStyles(createStyles);
  const standing = describeStanding(log.standing);
  const detail = [log.employee, log.method === 'PIN' ? 'PIN with photo' : 'Face', standing && standing.tone !== 'success' ? standing.text : null].filter(Boolean).join(' · ');
  const isIn = log.log_type === 'IN';
  return (
    <View style={styles.row}>
      <Text style={styles.time}>{clockTime(log.time)}</Text>
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>{log.employee_name}</Text>
        <Text style={styles.detail} numberOfLines={1}>{detail}</Text>
      </View>
      <View style={[styles.dir, isIn ? styles.dirIn : styles.dirOut]}>
        <Text style={[styles.dirText, isIn ? styles.dirInText : styles.dirOutText]}>{log.log_type}</Text>
      </View>
    </View>
  );
}

const createStyles = styleFactory((color) => ({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: color.surface, borderRadius: 16, padding: 4 },
  arrow: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.3 },
  day: { ...type.label, fontSize: 16, color: color.ink, fontWeight: '700' },
  summary: { flexDirection: 'row', gap: space.sm + 2 },
  sum: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 16, backgroundColor: color.surface },
  sumValue: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: color.ink },
  sumLabel: { fontSize: 12, lineHeight: 16, color: color.muted },
  warn: { color: color.warning },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 4, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: color.line },
  time: { width: 68, ...type.label, fontWeight: '700', color: color.ink },
  text: { flex: 1 },
  name: { ...type.label, fontSize: 16, lineHeight: 22, color: color.ink },
  detail: { ...type.caption, color: color.muted },
  dir: { width: 44, alignItems: 'center', paddingVertical: 3, borderRadius: 999 },
  dirIn: { backgroundColor: color.successTint },
  dirOut: { backgroundColor: color.accentTint },
  dirText: { fontSize: 12, lineHeight: 18, fontWeight: '700' },
  dirInText: { color: color.success },
  dirOutText: { color: color.accent },
}));
