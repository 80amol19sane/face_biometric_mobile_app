import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { employeeProfile, setPin, setPinEnabled } from '../../../src/api/admin';
import { ApiError } from '../../../src/api/http';
import { AdminPage } from '../../../src/components/admin/AdminPage';
import { Avatar } from '../../../src/components/Avatar';
import { Field } from '../../../src/components/Field';
import { Body, Button, Caption } from '../../../src/components/ui';
import { useLoad } from '../../../src/state/useLoad';
import { radius, space, styleFactory, type, useStyles, useTheme } from '../../../src/theme';

export default function PinScreen() {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: p, error: loadError } = useLoad(() => employeeProfile(id), [id]);
  const [pin, setNewPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPin = !!p?.pin;
  const enabled = p?.pin?.enabled === 1;
  const mismatch = confirm.length > 0 && confirm !== pin;

  const run = async (work: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      Alert.alert('Done', done, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminPage
      title={hasPin ? 'Reset PIN' : 'Set PIN'}
      back
      error={loadError}
      footer={
        <>
          <Button label="Save PIN" busy={busy} disabled={!pin || pin !== confirm || !password} onPress={() => run(() => setPin(id, pin, password), 'The PIN is saved and enabled.')} />
          {hasPin && enabled && (
            <Button label="Disable PIN for this person" variant="danger" disabled={busy || !password} onPress={() => run(() => setPinEnabled(id, false, password), 'PIN attendance is disabled for this person.')} />
          )}
          {hasPin && !enabled && (
            <Button label="Enable PIN again" variant="tonal" disabled={busy || !password} onPress={() => run(() => setPinEnabled(id, true, password), 'PIN attendance is enabled.')} />
          )}
        </>
      }
    >
      {p && (
        <View style={styles.who}>
          <Avatar name={p.employee_name} />
          <View style={styles.flex}>
            <Text style={styles.name}>{p.employee_name}</Text>
            <Caption>{[p.employee, p.department?.replace(/ - [A-Z]+$/, ''), hasPin ? (enabled ? 'PIN on' : 'PIN off') : 'No PIN yet'].filter(Boolean).join(' · ')}</Caption>
          </View>
        </View>
      )}
      {hasPin && (
        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <Text style={styles.name}>PIN attendance</Text>
            <Caption>Lets this person use the PIN keypad</Caption>
          </View>
          <Switch value={enabled} disabled trackColor={{ false: color.line, true: color.accent }} thumbColor={color.surface} accessibilityLabel="PIN attendance" />
        </View>
      )}
      <Field label="New PIN" value={pin} onChangeText={(t) => setNewPin(t.replace(/\D/g, ''))} keyboardType="number-pad" secureTextEntry maxLength={6} />
      <Field label="Confirm PIN" value={confirm} onChangeText={(t) => setConfirm(t.replace(/\D/g, ''))} keyboardType="number-pad" secureTextEntry maxLength={6} />
      {mismatch ? <Body tone="danger">The two PINs do not match.</Body> : <Caption>4 to 6 digits. Avoid 1234 or repeated digits. The PIN is stored hashed and cannot be read back, only replaced.</Caption>}
      <View style={styles.auth}>
        <Text style={styles.authTitle}>Admin authorisation</Text>
        <Caption>Enter your own password to save, disable or enable a PIN.</Caption>
        <Field label="Your password" value={password} onChangeText={setPassword} secureTextEntry />
      </View>
      {error ? <Body tone="danger">{error}</Body> : null}
    </AdminPage>
  );
}

const createStyles = styleFactory((color) => ({
  flex: { flex: 1 },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md - 4, padding: space.md - 2, borderRadius: radius.md + 2, backgroundColor: color.surface },
  name: { ...type.label, fontSize: 16, color: color.ink },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md - 2, borderRadius: radius.md + 2, backgroundColor: color.surface },
  auth: { gap: space.sm, padding: space.md - 2, borderRadius: radius.md + 2, backgroundColor: color.dangerTint },
  authTitle: { ...type.label, fontWeight: '700', color: color.danger },
}));
