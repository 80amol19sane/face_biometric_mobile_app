import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { syncStatus } from '../../src/api/admin';
import { ApiError, getServerUrl } from '../../src/api/http';
import { AdminPage } from '../../src/components/admin/AdminPage';
import { Group } from '../../src/components/admin/parts';
import { SettingRow } from '../../src/components/SettingRow';
import { Body, Button, Caption } from '../../src/components/ui';
import { getKioskDevice } from '../../src/kiosk/registry';
import { formatClock, formatShortDate, parseSiteTime } from '../../src/lib/clock';
import { scanQueue } from '../../src/offline/recorder';
import { syncQueue } from '../../src/offline/syncRunner';
import { useLoad } from '../../src/state/useLoad';
import { space, styleFactory, type, useStyles, useTheme } from '../../src/theme';

const at = (ms: number) => `${formatShortDate(new Date(ms))}, ${formatClock(new Date(ms))}`;
const when = (value: string) => `${formatShortDate(parseSiteTime(value))}, ${formatClock(parseSiteTime(value))}`;

export default function Sync() {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const { data, error, loading, reload } = useLoad(async () => ({
    status: await syncStatus(),
    server: await getServerUrl(),
    queue: await scanQueue.state(),
    device: await getKioskDevice(),
  }));
  const [sending, setSending] = useState(false);
  const waiting = data?.queue.scans.length ?? 0;

  const sendNow = async () => {
    if (!data?.device) return;
    setSending(true);
    try {
      await syncQueue(data.device);
    } catch (e) {
      Alert.alert('Could not send', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setSending(false);
      reload();
    }
  };
  const ok = !!data && !error;

  return (
    <AdminPage title="Sync status" back error={null} footer={<Button label="Check connection now" variant="tonal" busy={loading} onPress={reload} />}>
      <View style={[styles.banner, { backgroundColor: ok ? color.successTint : color.warningTint }]}>
        <View style={[styles.icon, { backgroundColor: ok ? color.success : color.warning }]}>
          <Ionicons name={ok ? 'checkmark' : 'cloud-offline-outline'} size={28} color="#FFFFFF" />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.title, { color: ok ? color.success : color.warning }]}>{ok ? 'Connected to Frappe' : 'Not connected'}</Text>
          <Text style={styles.sub}>{ok ? `Last contact ${when(data.status.server_time)}` : (error ?? 'Checking…')}</Text>
        </View>
      </View>
      {data && (
        <Group>
          <SettingRow label="Server" value={(data.server ?? '').replace('https://', '')} />
          <SettingRow label="Last punch" value={data.status.last_punch ? when(data.status.last_punch.time) : 'None yet'} />
          <SettingRow label="Waiting to send" value={`${waiting} scan${waiting === 1 ? '' : 's'}`} />
          {waiting > 0 && <SettingRow label="Oldest waiting" value={at(Math.min(...data.queue.scans.map((scan) => scan.wallMs)))} />}
          {data.queue.lastRun && (
            <SettingRow
              label="Last send"
              hint={at(data.queue.lastRun.atMs)}
              value={`${data.queue.lastRun.accepted} ok · ${data.queue.lastRun.held} held · ${data.queue.lastRun.rejected} refused`}
            />
          )}
          <SettingRow label="Enrolled faces" value={`${data.status.templates} templates`} />
          <SettingRow label="Settings updated" value={when(data.status.settings_updated)} />
        </Group>
      )}
      {waiting > 0 && <Button label="Send waiting scans now" icon="cloud-upload-outline" busy={sending} onPress={sendNow} />}
      <Body>With a connection, every check-in goes to the server at once. Without one, and if HR allowed it for this kiosk, the kiosk keeps each face scan encrypted on the phone and sends it when the connection returns. The server then works out who it was; the phone never does.</Body>
      <Caption>Scans the server cannot accept on its own, such as old ones, go to Offline review.</Caption>
    </AdminPage>
  );
}

const createStyles = styleFactory((color) => ({
  flex: { flex: 1 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md + 4, borderRadius: 22 },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  sub: { ...type.body, fontSize: 14, lineHeight: 20, color: color.ink },
}));
