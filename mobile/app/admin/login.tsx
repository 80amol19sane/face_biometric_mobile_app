import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dashboard } from '../../src/api/admin';
import { ApiError, getServerUrl } from '../../src/api/http';
import { login, logout } from '../../src/api/session';
import { Field } from '../../src/components/Field';
import { Body, Button, Pill } from '../../src/components/ui';
import { useSession } from '../../src/state/session';
import { space, styleFactory, type, useStyles, useTheme } from '../../src/theme';

/** Admin sign-in. A correct password is not enough: the account must also pass the admin role check. */
export default function AdminLogin() {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const { setUser } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [server, setServer] = useState<string | null | undefined>(undefined);

  // Reload when coming back from the server screen.
  useFocusEffect(
    useCallback(() => {
      getServerUrl().then(setServer);
    }, []),
  );
  const editServer = () => router.push({ pathname: '/server', params: { next: '/admin/login' } });

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      try {
        await dashboard();
      } catch (e) {
        await logout();
        throw e instanceof ApiError && e.status === 403 ? new ApiError('This account is not allowed to use admin mode.', 'server', 403) : e;
      }
      setUser(username.trim());
      setPassword('');
      router.replace('/admin');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to attendance" onPress={() => router.replace('/')} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={color.ink} />
        </Pressable>
        <Text style={styles.backLabel}>Back to attendance</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.mark}>
          <Ionicons name="shield-half-outline" size={30} color={color.accentInk} />
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Admin access</Text>
          <Pill label="Restricted" tone="warning" />
        </View>
        <Body>Register employees · Update face · Reset PIN · Attendance reports</Body>
        <View style={styles.server}>
          <Ionicons name="globe-outline" size={22} color={color.accent} />
          <View style={styles.serverText}>
            <Text style={styles.serverLabel}>Connecting to</Text>
            <Text style={styles.serverUrl} numberOfLines={1}>{server === undefined ? '…' : server ? server.replace('https://', '') : 'No server set yet'}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={server ? 'Change server' : 'Add server'} onPress={editServer} style={styles.serverEdit}>
            <Text style={styles.serverEditText}>{server ? 'Change' : 'Add'}</Text>
          </Pressable>
        </View>
        <View style={styles.form}>
          <Field label="Username or email" value={username} onChangeText={setUsername} keyboardType="email-address" textContentType="username" autoComplete="username" returnKeyType="next" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" autoComplete="password" returnKeyType="go" onSubmitEditing={submit} />
          {error ? <Body tone="danger">{error}</Body> : null}
          <Button label="Log in" busy={busy} disabled={!server || !username.trim() || !password} onPress={submit} />
        </View>
      </View>
      <View style={styles.note}>
        <Ionicons name="lock-closed-outline" size={20} color={color.accent} />
        <Text style={styles.noteText}>Sign in with your Frappe account. Only HR Manager and System Manager roles can enter. The session ends after 5 minutes without use, and this kiosk never keeps it.</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = styleFactory((color) => ({
  screen: { flex: 1, backgroundColor: color.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  back: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  backLabel: { ...type.body, color: color.muted },
  body: { flex: 1, padding: space.lg, gap: space.md },
  mark: { width: 60, height: 60, borderRadius: 16, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 2, flexWrap: 'wrap' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3, color: color.ink },
  server: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 2, padding: space.md - 2, borderRadius: 16, backgroundColor: color.surface },
  serverText: { flex: 1 },
  serverLabel: { ...type.caption, color: color.muted },
  serverUrl: { ...type.label, fontSize: 16, color: color.ink },
  serverEdit: { minHeight: 44, minWidth: 64, borderRadius: 22, backgroundColor: color.accentTint, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md },
  serverEditText: { ...type.label, fontSize: 15, color: color.accent },
  form: { gap: space.md, paddingTop: space.md },
  note: { flexDirection: 'row', gap: space.sm + 2, alignItems: 'flex-start', margin: space.lg, padding: space.md - 2, borderRadius: 16, backgroundColor: color.surface },
  noteText: { flex: 1, ...type.caption, fontWeight: '400', color: color.muted },
}));
