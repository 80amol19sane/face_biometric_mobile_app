import { router } from 'expo-router';
import { useCallback } from 'react';
import { logout } from '../api/session';
import { useSession } from './session';

/** Ends the server session, forgets the user here, and returns to sign-in. */
export function useSignOut() {
  const { setUser } = useSession();
  return useCallback(async () => {
    await logout();
    setUser(null);
    router.replace('/login');
  }, [setUser]);
}
