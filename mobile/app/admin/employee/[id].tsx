import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { employeeProfile } from '../../../src/api/admin';
import { AdminPage } from '../../../src/components/admin/AdminPage';
import { Group } from '../../../src/components/admin/parts';
import { Avatar } from '../../../src/components/Avatar';
import { SettingRow } from '../../../src/components/SettingRow';
import { Button, Pill } from '../../../src/components/ui';
import { useLoad } from '../../../src/state/useLoad';
import { space, styleFactory, type, useStyles } from '../../../src/theme';

const day = (value: string | null) => (value ? value.slice(0, 10) : null);

export default function EmployeeProfileScreen() {
  const styles = useStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: p, error, loading, reload } = useLoad(() => employeeProfile(id), [id]);
  const faceOk = p?.face?.status === 'Active';

  return (
    <AdminPage title="Employee profile" back error={error} refreshing={loading && !!p} onRefresh={reload}>
      {p && (
        <>
          <View style={styles.who}>
            <Avatar name={p.employee_name} size={76} />
            <View style={styles.flex}>
              <Text style={styles.name}>{p.employee_name}</Text>
              <Text style={styles.sub}>{[p.designation, p.department?.replace(/ - [A-Z]+$/, '')].filter(Boolean).join(' · ')}</Text>
            </View>
          </View>

          <Group>
            <SettingRow label="Employee ID" value={p.employee} />
            <SettingRow label="Mobile" value={p.mobile || '—'} />
            <SettingRow label="Status" value={p.status} />
            {p.shift ? <SettingRow label="Shift" value={p.shift} /> : null}
          </Group>

          <Group title="BIOMETRIC STATUS">
            <SettingRow label="Face" hint={p.face ? `${day(p.face.creation)} · ${p.face.approved_by ?? 'unknown'} · ${p.face.model_version ?? ''}` : 'Not registered'}>
              <Pill label={p.face ? p.face.status : 'None'} tone={faceOk ? 'success' : p.face ? 'warning' : 'neutral'} />
            </SettingRow>
            <SettingRow label="PIN" hint={p.pin ? `Set ${day(p.pin.set_on) ?? ''} by ${p.pin.set_by ?? 'unknown'}` : 'Not set'}>
              <Pill label={p.pin ? (p.pin.enabled ? 'Enabled' : 'Disabled') : 'None'} tone={p.pin?.enabled ? 'success' : 'neutral'} />
            </SettingRow>
          </Group>

          {p.status === 'Active' && (
            <View style={styles.actions}>
              <Button label={p.face ? 'Update face' : 'Register face'} icon="scan-outline" onPress={() => router.push(`/admin/register/${p.employee}`)} />
              <Button label={p.pin ? 'Reset PIN' : 'Set PIN'} icon="keypad-outline" variant="tonal" onPress={() => router.push(`/admin/pin/${p.employee}`)} />
              <Button label="Biometric history" icon="time-outline" variant="ghost" onPress={() => router.push(`/admin/history/${p.employee}`)} />
            </View>
          )}
        </>
      )}
    </AdminPage>
  );
}

const createStyles = styleFactory((color) => ({
  flex: { flex: 1 },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  name: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3, color: color.ink },
  sub: { ...type.body, color: color.muted },
  actions: { gap: space.sm + 2 },
}));
