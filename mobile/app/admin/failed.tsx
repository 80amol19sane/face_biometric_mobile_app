import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { failedAttempts, type FailedAttempt } from '../../src/api/admin';
import { getServerUrl } from '../../src/api/http';
import { AdminPage } from '../../src/components/admin/AdminPage';
import { Body, Pill } from '../../src/components/ui';
import { formatClock, parseSiteTime } from '../../src/lib/clock';
import { useLoad } from '../../src/state/useLoad';
import { radius, space, styleFactory, type, useStyles } from '../../src/theme';

type Filter = 'All' | 'Face' | 'PIN';

export default function FailedAttempts() {
  const styles = useStyles(createStyles);
  const [filter, setFilter] = useState<Filter>('All');
  const [server, setServer] = useState<string | null>(null);
  useEffect(() => {
    getServerUrl().then(setServer);
  }, []);
  const { data, error, loading, reload } = useLoad(() => failedAttempts(undefined, filter === 'All' ? undefined : filter), [filter]);

  return (
    <AdminPage title="Failed attempts" subtitle={data ? `Today · ${data.length} event${data.length === 1 ? '' : 's'}` : undefined} back error={error} refreshing={loading && !!data} onRefresh={reload}>
      <View style={styles.chips}>
        {(['All', 'Face', 'PIN'] as Filter[]).map((f) => (
          <Pressable key={f} accessibilityRole="button" accessibilityState={{ selected: filter === f }} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipOn]}>
            <Text style={[styles.chipText, filter === f && styles.chipTextOn]}>{f}</Text>
          </Pressable>
        ))}
      </View>
      {data?.length === 0 && <Body>No failed attempts today.</Body>}
      {data?.map((a) => <Attempt key={a.name} attempt={a} server={server} />)}
    </AdminPage>
  );
}

const TITLES: Record<string, string> = {
  'Unknown Face': 'Unrecognised face',
  'Ambiguous Face': 'Face matched two people',
  'Wrong PIN': 'Wrong PIN',
  'No PIN': 'No PIN set',
  'PIN Disabled': 'PIN disabled',
  'Bad Signature': 'Request not signed by the kiosk',
  'Challenge Failed': 'Expired or reused request',
  'No Match': 'Face did not match',
  'No Active Template': 'No active face',
};

function Attempt({ attempt: a, server }: { attempt: FailedAttempt; server: string | null }) {
  const styles = useStyles(createStyles);
  const [photoFailed, setPhotoFailed] = useState(false);

  const detail = [formatClock(parseSiteTime(a.creation)), a.device, a.similarity != null ? `closest match ${a.similarity.toFixed(2)}` : null, a.detail].filter(Boolean).join(' · ');
  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.title}>{TITLES[a.outcome] ?? a.outcome}{a.employee_name ? ` · ${a.employee_name}` : ''}</Text>
        <Pill label={a.method} tone={a.method === 'PIN' ? 'warning' : 'danger'} />
      </View>
      <Text style={styles.detail}>{detail}</Text>
      {a.photo && server && !photoFailed ? <Image source={{ uri: `${server}${a.photo}` }} style={styles.photo} onError={() => setPhotoFailed(true)} accessibilityLabel="Proof photo" /> : null}
    </View>
  );
}

const createStyles = styleFactory((color) => ({
  chips: { flexDirection: 'row', gap: space.sm },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: color.surface },
  chipOn: { backgroundColor: color.accent },
  chipText: { ...type.label, fontSize: 14, color: color.ink },
  chipTextOn: { color: color.accentInk },
  row: { gap: 6, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: color.line },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, ...type.label, fontSize: 16, lineHeight: 22, color: color.ink },
  detail: { ...type.caption, color: color.muted },
  photo: { width: 96, height: 96, borderRadius: 12, marginTop: 4, backgroundColor: color.line },
}));
