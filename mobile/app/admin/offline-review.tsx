import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { approveOffline, offlineReview, rejectOffline, type HeldScan } from '../../src/api/admin';
import { ApiError } from '../../src/api/http';
import { AdminPage } from '../../src/components/admin/AdminPage';
import { Avatar } from '../../src/components/Avatar';
import { Field } from '../../src/components/Field';
import { Body, Button, Caption } from '../../src/components/ui';
import { formatClock, formatShortDate, parseSiteTime } from '../../src/lib/clock';
import { useLoad } from '../../src/state/useLoad';
import { space, styleFactory, type, useStyles } from '../../src/theme';

/** Offline scans the server matched to someone but could not accept on its own: HR decides. */
export default function OfflineReview() {
  const styles = useStyles(createStyles);
  const { data, error, loading, reload } = useLoad(offlineReview);

  return (
    <AdminPage title="Offline review" back error={error} refreshing={loading && !!data} onRefresh={reload}>
      <Body>Each scan below was taken while a kiosk had no internet. The server recognised the person but something about the scan needs a human decision, such as an old time or a restarted phone.</Body>
      {data?.map((scan) => <HeldCard key={scan.name} scan={scan} onDecided={reload} />)}
      {data && data.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing to review</Text>
          <Caption>Scans that need a decision will appear here.</Caption>
        </View>
      )}
    </AdminPage>
  );
}

function HeldCard({ scan, onDecided }: { scan: HeldScan; onDecided: () => void }) {
  const styles = useStyles(createStyles);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const when = parseSiteTime(scan.recorded_at);

  const decide = async (approve: boolean) => {
    setBusy(true);
    try {
      await (approve ? approveOffline : rejectOffline)(scan.name, note.trim());
      onDecided();
    } catch (e) {
      Alert.alert('Could not save that', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.who}>
        <Avatar name={scan.employee_name ?? scan.employee} size={44} />
        <View style={styles.flex}>
          <Text style={styles.name}>{scan.employee_name ?? scan.employee}</Text>
          <Caption>
            {scan.employee} · {formatShortDate(when)}, {formatClock(when)}
          </Caption>
        </View>
      </View>
      {scan.detail ? <Text style={styles.reason}>{scan.detail}</Text> : null}
      <Caption>Kiosk {scan.device ?? 'unknown'}{scan.similarity ? ` · face match ${Math.round(scan.similarity * 100)}%` : ''}</Caption>
      <Field label="Your note (required)" value={note} onChangeText={setNote} placeholder="For example: confirmed with the supervisor" autoCapitalize="sentences" />
      <View style={styles.actions}>
        <View style={styles.flex}>
          <Button label="Reject" variant="danger" disabled={!note.trim()} busy={busy} onPress={() => decide(false)} />
        </View>
        <View style={styles.flex}>
          <Button label="Approve" disabled={!note.trim()} busy={busy} onPress={() => decide(true)} />
        </View>
      </View>
    </View>
  );
}

const createStyles = styleFactory((color) => ({
  flex: { flex: 1 },
  card: { gap: space.sm + 4, padding: space.md, borderRadius: 20, backgroundColor: color.surface },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  name: { ...type.label, fontSize: 17, lineHeight: 22, fontWeight: '700', color: color.ink },
  reason: { ...type.body, fontSize: 14, lineHeight: 20, color: color.ink },
  actions: { flexDirection: 'row', gap: space.sm + 4 },
  empty: { alignItems: 'center', gap: space.sm, padding: space.lg },
  emptyTitle: { ...type.label, fontSize: 17, color: color.ink },
}));
