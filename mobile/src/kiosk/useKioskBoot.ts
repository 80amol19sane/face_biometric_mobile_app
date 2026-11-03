import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ApiError, getServerUrl } from '../api/http';
import { fetchConfig, type KioskConfig } from '../api/kiosk';
import { getKioskDevice } from './registry';

export type KioskBoot =
  | { name: 'loading' }
  | { name: 'no_server' }
  | { name: 'not_registered' }
  | { name: 'offline'; message: string }
  | { name: 'ready'; device: string; config: KioskConfig };

/**
 * Works out whether this phone can run as a kiosk: a server address, a registered kiosk key, and a
 * live answer from the server. Re-runs whenever the screen regains focus, so coming back from the
 * admin area picks up a new registration or changed settings.
 */
export function useKioskBoot() {
  const [boot, setBoot] = useState<KioskBoot>({ name: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!(await getServerUrl())) return setBoot({ name: 'no_server' });
        const device = await getKioskDevice();
        if (!device) return setBoot({ name: 'not_registered' });
        try {
          const config = await fetchConfig(device);
          if (!cancelled) setBoot({ name: 'ready', device, config });
        } catch (error) {
          if (!cancelled) setBoot({ name: 'offline', message: error instanceof ApiError ? error.message : 'Could not reach the server.' });
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [attempt]),
  );

  return { boot, retry: () => setAttempt((n) => n + 1) };
}
