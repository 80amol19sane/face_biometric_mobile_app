import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { getServerUrl } from '../src/api/http';
import { Row, RowGroup } from '../src/components/Row';
import { Segmented } from '../src/components/Segmented';
import { SettingRow } from '../src/components/SettingRow';
import { Body, Button, Caption, Heading, Screen } from '../src/components/ui';
import { keyProtection, storedDevice } from '../src/device/registry';
import { THEME_CHOICES, versionLabel } from '../src/lib/appearance';
import { displayName } from '../src/lib/names';
import { usePreferences } from '../src/state/preferences';
import { useSession } from '../src/state/session';
import { useSignOut } from '../src/state/useSignOut';
import { space, styleFactory, useStyles, useTheme } from '../src/theme';

const PROTECTION = {
  hardware: 'Protected by phone hardware',
  software: 'Stored in software',
  none: 'Set up at your first check-in',
} as const;

export default function Settings() {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const { user } = useSession();
  const { theme, setTheme, diagnostics, setDiagnostics } = usePreferences();
  const signOut = useSignOut();
  const [server, setServer] = useState<string | null>(null);
  const [device, setDevice] = useState<string | null>(null);

  useEffect(() => {
    getServerUrl().then(setServer);
    if (user) storedDevice(user).then(setDevice);
  }, [user]);

  const protection = user ? PROTECTION[keyProtection(user)] : PROTECTION.none;
  const build = Constants.expoConfig?.android?.versionCode;

  return (
    <Screen footer={<Button label="Sign out" variant="danger" icon="log-out-outline" onPress={signOut} />}>
      <View style={styles.header}>
        <Heading>Settings</Heading>
        <Caption>{user ? `Signed in as ${displayName(user)}` : 'Not signed in'}</Caption>
      </View>

      <View style={styles.section}>
        <Caption>Appearance</Caption>
        <Segmented label="Theme" options={THEME_CHOICES} value={theme} onChange={setTheme} />
      </View>

      <View style={styles.section}>
        <Caption>Camera</Caption>
        <RowGroup>
          <SettingRow label="Show detector info" hint="A line at the top of the camera. Turn on if HR asks for it.">
            <Switch
              value={diagnostics}
              onValueChange={setDiagnostics}
              accessibilityLabel="Show detector info"
              trackColor={{ false: color.line, true: color.accent }}
              thumbColor={color.surface}
            />
          </SettingRow>
        </RowGroup>
      </View>

      <View style={styles.section}>
        <Caption>This phone</Caption>
        <RowGroup>
          <SettingRow label="Phone" value={Device.modelName ?? 'Android phone'} />
          <SettingRow label="Face key" value={protection} />
          <SettingRow label="Registered as" value={device ?? 'Not registered yet'} />
        </RowGroup>
      </View>

      <View style={styles.section}>
        <Caption>About</Caption>
        <RowGroup>
          <SettingRow label="App version" value={versionLabel(Constants.expoConfig?.version, build)} />
          <SettingRow label="Server" value={server ?? 'Not set'} />
          <Row icon="swap-horizontal-outline" label="Change server" onPress={() => router.push('/server')} />
        </RowGroup>
        <Body>Your face is checked against what HR enrolled. Photos never leave this phone.</Body>
      </View>
    </Screen>
  );
}

const createStyles = styleFactory(() => ({
  header: { gap: 2, paddingVertical: space.sm },
  section: { gap: space.sm },
}));
