import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ApiError, getServerUrl } from '../src/api/http';
import { currentUser } from '../src/api/session';
import { Button } from '../src/components/ui';
import { Result } from '../src/components/Result';
import { useSession } from '../src/state/session';
import { color } from '../src/theme';

/** Decides where to start: server address, then login, then home. */
export default function Boot() {
  const { setUser } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        if (!(await getServerUrl())) return router.replace('/server');
        const user = await currentUser();
        if (cancelled) return;
        setUser(user);
        router.replace(user ? '/home' : '/login');
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Something went wrong starting the app.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, setUser]);

  if (error) {
    return (
      <Result
        icon="alert-circle"
        tone="danger"
        title="Can’t connect"
        body={error}
        actions={
          <>
            <Button label="Try again" icon="refresh" onPress={() => setAttempt((n) => n + 1)} />
            <Button label="Change server" variant="ghost" onPress={() => router.replace('/server')} />
          </>
        }
      />
    );
  }
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg }}>
      <ActivityIndicator size="large" color={color.accent} />
    </View>
  );
}
