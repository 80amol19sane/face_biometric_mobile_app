import { Redirect, Stack, useSegments } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';
import { useSession } from '../../src/state/session';
import { useSignOut } from '../../src/state/useSignOut';

const IDLE_LIMIT_MS = 5 * 60 * 1000;

/**
 * Everything under /admin except the login needs an admin signed in. The session ends after five
 * quiet minutes and the moment the app goes to the background, so a kiosk left alone never stays
 * in admin mode.
 */
export default function AdminLayout() {
  const { user } = useSession();
  const signOut = useSignOut();
  const segments = useSegments();
  const onLogin = segments[segments.length - 1] === 'login';
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const restart = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(signOut, IDLE_LIMIT_MS);
  }, [signOut]);

  useEffect(() => {
    if (!user) return;
    restart();
    const sub = AppState.addEventListener('change', (state) => state !== 'active' && signOut());
    return () => {
      sub.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [user, restart, signOut]);

  if (!user && !onLogin) return <Redirect href="/admin/login" />;
  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => {
        if (user) restart();
        return false;
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
