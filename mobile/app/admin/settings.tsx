import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { adminSettings, updateSettings, type AdminSettings } from '../../src/api/admin';
import { ApiError, getServerUrl } from '../../src/api/http';
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
type Key = keyof Omit<AdminSettings, 'can_edit_recognition'>;

export default function Settings() {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const { theme, setTheme, diagnostics, setDiagnostics, sleep, setSleep } = usePreferences();
  const { data, error: loadError, reload } = useLoad(adminSettings);
  const [server, setServer] = useState<string | null>(null);
  const [device, setDevice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getServerUrl().then(setServer);
    getKioskDevice().then(setDevice);
  }, []);

  const save = async (values: Partial<Record<Key, number>>) => {
    setSaveError(null);
    try {
      await updateSettings(values);
      reload();
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : 'Could not save that setting.');
    }
  };
  const toggle = (key: Key, label: string) => (
    <Switch value={!!data?.[key]} onValueChange={(on) => save({ [key]: on ? 1 : 0 })} accessibilityLabel={label} trackColor={{ false: color.line, true: color.accent }} thumbColor={color.surface} />
  );

  return (
    <AdminPage title="Settings" back error={loadError ?? saveError}>
      {data && (
        <>
          <Group title="RECOGNITION">
            <SettingRow label="Require liveness check" hint="Turn or smile before matching">{toggle('require_liveness', 'Require liveness check')}</SettingRow>
            <SettingRow label="Match threshold" hint={data.can_edit_recognition ? 'Higher is stricter' : 'System Manager only'}>
              {data.can_edit_recognition ? <Stepper value={data.match_threshold} step={0.05} min={0.3} max={0.9} format={(v) => v.toFixed(2)} onChange={(v) => save({ match_threshold: Math.round(v * 100) / 100 })} /> : <Text style={styles.value}>{data.match_threshold.toFixed(2)}</Text>}
            </SettingRow>
          </Group>

          <Group title="ATTENDANCE RULES">
            <SettingRow label="PIN attendance" hint="Keypad option on the kiosk">{toggle('pin_enabled', 'PIN attendance')}</SettingRow>
            <SettingRow label="PIN length" value={`${data.pin_min_length} to ${data.pin_max_length} digits`} />
            <SettingRow label="Lockout" value={`${data.max_failed_attempts} tries · ${data.lockout_minutes} min`} />
            <SettingRow label="Keep proof photos" hint="Then delete automatically">
              <Stepper value={data.photo_retention_days} step={7} min={7} max={90} format={(v) => `${v} days`} onChange={(v) => save({ photo_retention_days: v })} />
            </SettingRow>
          </Group>

          <Group title="CAMERA AND KIOSK">
            <SettingRow label="Return to camera after">
              <Stepper value={data.kiosk_return_seconds} step={1} min={2} max={20} format={(v) => `${v} s`} onChange={(v) => save({ kiosk_return_seconds: v })} />
            </SettingRow>
          </Group>
          <Caption>Recognition and rule changes apply to every kiosk within a minute.</Caption>
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

function Stepper({ value, step, min, max, format, onChange }: { value: number; step: number; min: number; max: number; format: (v: number) => string; onChange: (v: number) => void }) {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const move = (dir: 1 | -1) => onChange(Math.min(max, Math.max(min, Math.round((value + dir * step) * 100) / 100)));
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityRole="button" accessibilityLabel="Decrease" disabled={value <= min} onPress={() => move(-1)} style={[styles.stepBtn, value <= min && styles.off]}>
        <Text style={[styles.stepText, { color: color.accent }]}>−</Text>
      </Pressable>
      <Text style={styles.value}>{format(value)}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Increase" disabled={value >= max} onPress={() => move(1)} style={[styles.stepBtn, value >= max && styles.off]}>
        <Text style={[styles.stepText, { color: color.accent }]}>+</Text>
      </Pressable>
    </View>
  );
}

const createStyles = styleFactory((color) => ({
  pad: { gap: space.sm, paddingVertical: space.md - 2 },
  label: { ...type.label, fontSize: 16, color: color.ink },
  hint: { ...type.caption, color: color.muted },
  value: { ...type.label, fontSize: 15, color: color.muted, minWidth: 64, textAlign: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.accentTint, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 22, lineHeight: 26, fontWeight: '600' },
  off: { opacity: 0.35 },
}));
