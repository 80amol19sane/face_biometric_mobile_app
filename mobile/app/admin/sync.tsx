import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { syncStatus } from '../../src/api/admin';
import { getServerUrl } from '../../src/api/http';
import { AdminPage } from '../../src/components/admin/AdminPage';
import { Group } from '../../src/components/admin/parts';
import { SettingRow } from '../../src/components/SettingRow';
import { Body, Button, Caption } from '../../src/components/ui';
import { formatClock, formatShortDate, parseSiteTime } from '../../src/lib/clock';
import { useLoad } from '../../src/state/useLoad';
import { space, styleFactory, type, useStyles, useTheme } from '../../src/theme';

const when = (value: string) => `${formatShortDate(parseSiteTime(value))}, ${formatClock(parseSiteTime(value))}`;

export default function Sync() {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const { data, error, loading, reload } = useLoad(async () => ({ status: await syncStatus(), server: await getServerUrl() }));
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
          <SettingRow label="Waiting to send" value="0 punches" />
          <SettingRow label="Enrolled faces" value={`${data.status.templates} templates`} />
          <SettingRow label="Settings updated" value={when(data.status.settings_updated)} />
        </Group>
      )}
      <Body>This kiosk sends every punch to the server immediately and needs a connection to check people in. If the connection drops, it shows a notice and takes no attendance rather than guessing.</Body>
      <Caption>Faces are matched on the server, so there is nothing to download or keep in step.</Caption>
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
