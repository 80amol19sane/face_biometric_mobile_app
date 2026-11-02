import { router } from 'expo-router';
import { useState } from 'react';
import { ApiError } from '../src/api/http';
import { currentUser, login } from '../src/api/session';
import { Brand } from '../src/components/Brand';
import { Field } from '../src/components/Field';
import { Body, Button, Screen } from '../src/components/ui';
import { useSession } from '../src/state/session';

export default function LoginScreen() {
  const { setUser } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      const user = await currentUser();
      if (!user) throw new ApiError('Login did not start a session. Please try again.', 'server');
      setUser(user);
      setPassword('');
      router.replace('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <>
          <Button label="Sign in" onPress={signIn} busy={busy} disabled={!username.trim() || !password} />
          <Button label="Change server" variant="ghost" onPress={() => router.push('/server')} />
        </>
      }
    >
      <Brand title="Welcome back" subtitle="Sign in with your HRMS email and password." />
      <Field label="Email" value={username} onChangeText={setUsername} keyboardType="email-address" textContentType="username" autoComplete="username" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" autoComplete="password" returnKeyType="go" onSubmitEditing={signIn} />
      {error && <Body tone="danger">{error}</Body>}
    </Screen>
  );
}
