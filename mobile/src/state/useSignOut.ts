import { router } from 'expo-router';
import { useCallback } from 'react';
import { logout } from '../api/session';
import { useSession } from './session';

/** Ends the admin session on the server, forgets the user here, and returns to the kiosk. */
export function useSignOut() {
  const { setUser } = useSession();
  return useCallback(async () => {
    await logout();
    setUser(null);
    router.replace('/');
  }, [setUser]);
}
