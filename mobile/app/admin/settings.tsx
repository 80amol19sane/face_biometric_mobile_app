import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { adminSettings } from '../../src/api/admin';
import { getServerUrl } from '../../src/api/http';
import { AdminPage } from '../../src/components/admin/AdminPage';
import { Group } from '../../src/components/admin/parts';
import { Row } from '../../src/components/Row';
import { Segmented } from '../../src/components/Segmented';
import { SettingRow } from '../../src/components/SettingRow';
import { Caption } from '../../src/components/ui';
import { getKioskDevice, kioskKeyProtection } from '../../src/kiosk/registry';
import { THEME_CHOICES, versionLabel } from '../../src/lib/appearance';
import { SLEEP_CHOICES } from '../../src/lib/sleep';
import { useLoad } from '../../src/state/useLoad';
import { usePreferences } from '../../src/state/preferences';
import { space, styleFactory, type, useStyles, useTheme } from '../../src/theme';

const PROTECTION = { hardware: 'Protected by phone hardware', software: 'Stored in software', none: 'Not registered' } as const;

export default function Settings() {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const { theme, setTheme, diagnostics, setDiagnostics, sleep, setSleep } = usePreferences();
  const { data, error: loadError } = useLoad(adminSettings);
  const [server, setServer] = useState<string | null>(null);
  const [device, setDevice] = useState<string | null>(null);

  useEffect(() => {
    getServerUrl().then(setServer);
    getKioskDevice().then(setDevice);
  }, []);

  const yesNo = (on: boolean | number) => (on ? 'On' : 'Off');

  return (
    <AdminPage title="Settings" back error={loadError}>
      {data && (
        <>
          <Group title="RECOGNITION">
            <SettingRow label="Liveness check" hint="Turn or smile before matching" value={yesNo(data.require_liveness)} />
            <SettingRow label="Match threshold" hint="Higher is stricter" value={data.match_threshold.toFixed(2)} />
          </Group>

          <Group title="ATTENDANCE RULES">
            <SettingRow label="PIN attendance" hint="Keypad option on the kiosk" value={yesNo(data.pin_enabled)} />
            <SettingRow label="PIN length" value={`${data.pin_min_length} to ${data.pin_max_length} digits`} />
            <SettingRow label="Lockout" value={`${data.max_failed_attempts} tries · ${data.lockout_minutes} min`} />
            <SettingRow label="Keep proof photos" hint="Then delete automatically" value={`${data.photo_retention_days} days`} />
          </Group>

          <Group title="CAMERA AND KIOSK">
            <SettingRow label="Return to camera after" value={`${data.kiosk_return_seconds} s`} />
          </Group>

          <Group title="OFFLINE ATTENDANCE">
            <SettingRow label="Offline attendance" hint="Kiosks save face scans without internet; the server checks them later" value={yesNo(data.offline_enabled)} />
            <SettingRow label="Offline window" hint="Older scans are held for HR" value={`${data.offline_max_hours} h`} />
            <SettingRow label="Close-match review from" hint="Offline scans at or above this similarity, but under the match threshold, are held for HR" value={data.offline_review_floor === undefined ? '—' : data.offline_review_floor.toFixed(2)} />
            <SettingRow label="Review window" hint="Unreviewed scans are then closed as rejected" value={`${data.held_retention_days} days`} />
          </Group>
          <Caption>These rules are shared by every kiosk. They can only be changed in the Frappe desk, under Face Biometric Settings, so no single phone can alter them.</Caption>
        </>
      )}

      <Group title="THIS PHONE">
        <View style={styles.pad}>
          <Text style={styles.label}>Theme</Text>
          <Segmented label="Theme" options={THEME_CHOICES} value={theme} onChange={setTheme} />
        </View>
        <View style={styles.pad}>
          <Text style={styles.label}>Blank the screen when nobody is near</Text>
          <Segmented label="Sleep after" options={SLEEP_CHOICES} value={sleep} onChange={setSleep} />
          <Text style={styles.hint}>A face or a tap wakes it. The camera keeps watching while it is blank.</Text>
        </View>
        <SettingRow label="Show detector info" hint="A line at the top of the camera, for support">
          <Switch value={diagnostics} onValueChange={setDiagnostics} accessibilityLabel="Show detector info" trackColor={{ false: color.line, true: color.accent }} thumbColor={color.surface} />
        </SettingRow>
        <SettingRow label="Phone" value={Device.modelName ?? 'Android phone'} />
        <SettingRow label="Registered as" value={device ?? 'Not a kiosk yet'} />
        <SettingRow label="Kiosk key" value={PROTECTION[kioskKeyProtection()]} />
      </Group>

      <Group title="ABOUT">
        <SettingRow label="App version" value={versionLabel(Constants.expoConfig?.version, Constants.expoConfig?.android?.versionCode)} />
        <SettingRow label="Server" value={(server ?? 'Not set').replace('https://', '')} />
        <Row icon="swap-horizontal-outline" label="Change server" onPress={() => router.push('/server')} />
      </Group>
    </AdminPage>
  );
}

const createStyles = styleFactory((color) => ({
  pad: { gap: space.sm, paddingVertical: space.md - 2 },
  label: { ...type.label, fontSize: 16, color: color.ink },
  hint: { ...type.caption, color: color.muted },
}));
