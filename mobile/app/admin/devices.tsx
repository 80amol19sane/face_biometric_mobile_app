import * as Device from 'expo-device';
import { useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { devices, revokeDevice, setDeviceOffline, shiftLocations, type DeviceRow } from '../../src/api/admin';
import { ApiError } from '../../src/api/http';
import { AdminPage } from '../../src/components/admin/AdminPage';
import { Field } from '../../src/components/Field';
import { Body, Button, Caption, Pill } from '../../src/components/ui';
import { getKioskDevice, registerThisPhone } from '../../src/kiosk/registry';
import { formatClock, formatShortDate, parseSiteTime } from '../../src/lib/clock';
import { useLoad } from '../../src/state/useLoad';
import { radius, space, styleFactory, type, useStyles, useTheme } from '../../src/theme';

export default function Devices() {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const { data, error, loading, reload } = useLoad(devices);
  const { data: mine, reload: reloadMine } = useLoad(getKioskDevice);
  const [registering, setRegistering] = useState(false);

  const kiosks = (data ?? []).filter((d) => d.device_kind === 'Kiosk');
  const personal = (data ?? []).filter((d) => d.device_kind !== 'Kiosk' && d.status === 'Active').length;

  const toggleOffline = async (d: DeviceRow, allow: boolean) => {
    try {
      await setDeviceOffline(d.name, allow);
      reload();
    } catch (e) {
      Alert.alert('Could not change that', e instanceof ApiError ? e.message : 'Please try again.');
    }
  };

  const revoke = (d: DeviceRow) =>
    Alert.alert('Revoke this kiosk?', `${d.device_label ?? d.name} will stop taking attendance until it is registered again.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await revokeDevice(d.name);
            reload();
          } catch (e) {
            Alert.alert('Could not revoke', e instanceof ApiError ? e.message : 'Please try again.');
          }
        },
      },
    ]);

  return (
    <AdminPage
      title="Devices"
      back
      error={error}
      refreshing={loading && !!data}
      onRefresh={reload}
      footer={registering ? undefined : <Button label={mine ? 'Register this phone again' : 'Register this phone as a kiosk'} icon="phone-portrait-outline" onPress={() => setRegistering(true)} />}
    >
      {registering ? (
        <RegisterPhone
          onDone={() => {
            setRegistering(false);
            reload();
            reloadMine();
          }}
          onCancel={() => setRegistering(false)}
        />
      ) : (
        <>
          {mine ? <Body>This phone is registered as {mine}.</Body> : <View style={styles.hint}><Text style={styles.hintText}>This phone is not a kiosk yet. Register it to start taking attendance.</Text></View>}
          {kiosks.map((d) => (
            <View key={d.name} style={styles.card}>
              <View style={styles.top}>
                <View style={styles.flex}>
                  <Text style={styles.title}>{d.device_label ?? d.name}{d.location ? ` · ${d.location}` : ''}</Text>
                  <Caption>{d.name}</Caption>
                </View>
                <Pill label={d.status} tone={d.status === 'Active' ? 'success' : 'neutral'} />
              </View>
              <Caption>{d.last_seen ? `Last used ${formatShortDate(parseSiteTime(d.last_seen))}, ${formatClock(parseSiteTime(d.last_seen))}` : 'Not used yet'}</Caption>
              {d.status === 'Active' && (
                <View style={styles.offlineRow}>
                  <View style={styles.flex}>
                    <Text style={styles.offlineLabel}>Take attendance offline</Text>
                    <Caption>Saves face scans while there is no internet and sends them later.</Caption>
                  </View>
                  <Switch value={!!d.allow_offline} onValueChange={(on) => toggleOffline(d, on)} accessibilityLabel="Take attendance offline" trackColor={{ false: color.line, true: color.accent }} thumbColor={color.surface} />
                </View>
              )}
              {d.status === 'Active' && <Button label="Revoke" size="sm" variant="danger" onPress={() => revoke(d)} />}
            </View>
          ))}
          {data && kiosks.length === 0 && <Body>No kiosks registered yet.</Body>}
          {data ? <Caption>{personal} personal phone{personal === 1 ? '' : 's'} from the earlier app still registered. They are not used by this app.</Caption> : null}
        </>
      )}
    </AdminPage>
  );
}

function RegisterPhone({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const styles = useStyles(createStyles);
  const { data: locations } = useLoad(shiftLocations);
  const [label, setLabel] = useState(Device.modelName ?? 'Kiosk');
  const [location, setLocation] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async () => {
    setBusy(true);
    setError(null);
    try {
      await registerThisPhone(label.trim(), location);
      Alert.alert('Kiosk ready', 'This phone can now take attendance. Leave admin to start.', [{ text: 'OK', onPress: onDone }]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not register this phone.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Text style={styles.title}>Register this phone as a kiosk</Text>
      <Caption>You are signed in as an admin, so the server will trust this phone's key. Give it a name and, if you like, where it stands.</Caption>
      <Field label="Name" value={label} onChangeText={setLabel} autoCapitalize="words" />
      {locations && locations.length > 0 && (
        <View style={styles.chips}>
          {locations.map((l) => (
            <Pressable key={l} accessibilityRole="button" accessibilityState={{ selected: location === l }} onPress={() => setLocation(location === l ? null : l)} style={[styles.chip, location === l && styles.chipOn]}>
              <Text style={[styles.chipText, location === l && styles.chipTextOn]}>{l}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {error ? <Body tone="danger">{error}</Body> : null}
      <Button label="Register" busy={busy} disabled={!label.trim()} onPress={register} />
      <Button label="Cancel" variant="ghost" onPress={onCancel} />
    </>
  );
}

const createStyles = styleFactory((color) => ({
  flex: { flex: 1 },
  hint: { padding: space.md - 2, borderRadius: radius.md + 2, backgroundColor: color.accentTint },
  hintText: { ...type.body, fontSize: 14, lineHeight: 20, color: color.ink },
  card: { gap: space.sm, padding: space.md, borderRadius: 20, backgroundColor: color.surface },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 4 },
  offlineRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.sm },
  offlineLabel: { ...type.label, fontSize: 15, color: color.ink },
  title: { ...type.label, fontSize: 17, lineHeight: 22, fontWeight: '700', color: color.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: color.surface },
  chipOn: { backgroundColor: color.accent },
  chipText: { ...type.label, fontSize: 14, color: color.ink },
  chipTextOn: { color: color.accentInk },
}));
