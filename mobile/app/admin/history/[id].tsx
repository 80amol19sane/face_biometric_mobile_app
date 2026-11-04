import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { biometricHistory } from '../../../src/api/admin';
import { AdminPage } from '../../../src/components/admin/AdminPage';
import { Body } from '../../../src/components/ui';
import { formatClock, formatShortDate, parseSiteTime } from '../../../src/lib/clock';
import { displayName } from '../../../src/lib/names';
import { useLoad } from '../../../src/state/useLoad';
import { space, styleFactory, type, useStyles, useTheme } from '../../../src/theme';

export default function BiometricHistory() {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, loading, reload } = useLoad(() => biometricHistory(id), [id]);
  return (
    <AdminPage title="Biometric history" subtitle={id} back error={error} refreshing={loading && !!data} onRefresh={reload}>
      {data?.length === 0 && <Body>Nothing has been registered or changed yet.</Body>}
      {data?.map((event, i) => {
        const when = parseSiteTime(event.when);
        const face = event.summary.startsWith('Face');
        return (
          <View key={`${event.when}-${i}`} style={styles.row}>
            <View style={styles.icon}>
              <Ionicons name={face ? 'person-outline' : 'lock-closed-outline'} size={20} color={color.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.title}>{event.summary.replace(/ by .*\.$/, '')}</Text>
              <Text style={styles.sub}>{formatShortDate(when)}, {formatClock(when)} · by {displayName(event.by)}</Text>
            </View>
          </View>
        );
      })}
    </AdminPage>
  );
}

const createStyles = styleFactory((color) => ({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: space.md - 2, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: color.line },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.accentTint, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.label, fontSize: 16, lineHeight: 22, color: color.ink },
  sub: { ...type.caption, color: color.muted },
}));
