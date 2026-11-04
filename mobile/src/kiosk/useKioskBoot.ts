import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ApiError, getServerUrl } from '../api/http';
import { fetchConfig, type KioskConfig } from '../api/kiosk';
import { lastContact } from '../offline/contact';
import { getKioskDevice } from './registry';

export type KioskBoot =
  | { name: 'loading' }
  | { name: 'no_server' }
  | { name: 'not_registered' }
  | { name: 'offline'; message: string }
  /** `offline` means the server could not be reached and the kiosk is running on its last settings. */
  | { name: 'ready'; device: string; config: KioskConfig; offline: boolean };

/**
 * Works out whether this phone can run as a kiosk: a server address, a registered kiosk key, and a
 * live answer from the server, or, when HR allowed offline attendance, the settings it last had. Re-runs whenever the screen regains focus, so coming back from the
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
          if (!cancelled) setBoot({ name: 'ready', device, config, offline: false });
        } catch (error) {
          const cached = error instanceof ApiError && error.kind === 'network' ? (await lastContact())?.config : undefined;
          if (cancelled) return;
          if (cached?.offline_enabled) return setBoot({ name: 'ready', device, config: cached, offline: true });
          const base = error instanceof ApiError ? error.message : 'Could not reach the server.';
          // Say why it cannot carry on, so HR knows what to switch on.
          const why = cached ? ' Offline attendance is switched off for this kiosk (Admin, More, Devices).' : '';
          setBoot({ name: 'offline', message: base + why });
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [attempt]),
  );

  return { boot, retry: () => setAttempt((n) => n + 1) };
}
