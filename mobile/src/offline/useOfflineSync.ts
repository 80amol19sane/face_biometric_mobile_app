import { addNetworkStateListener } from 'expo-network';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { syncQueue } from './syncRunner';

const RETRY_MS = 60_000;

/**
 * Keeps trying to send saved scans while the kiosk is online: now, whenever the connection comes back,
 * when the app returns to the foreground, and every minute. `onSent` lets a screen refresh its counts.
 */
export function useOfflineSync(device: string, enabled: boolean, onSent?: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const run = () => {
      syncQueue(device)
        .then((sent) => sent && onSent?.())
        .catch(() => {}); // still offline or the server refused: the scans stay queued and we try again
    };
    run();
    const timer = setInterval(run, RETRY_MS);
    const network = addNetworkStateListener((state) => state.isInternetReachable && run());
    const app = AppState.addEventListener('change', (state) => state === 'active' && run());
    return () => {
      clearInterval(timer);
      network.remove();
      app.remove();
    };
  }, [device, enabled, onSent]);
}

const RECONNECT_MS = 20_000;

/** While running offline, try the server again every so often and as soon as the phone reports a connection. */
export function useReconnect(active: boolean, retry: () => void) {
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(retry, RECONNECT_MS);
    const network = addNetworkStateListener((state) => state.isInternetReachable && retry());
    return () => {
      clearInterval(timer);
      network.remove();
    };
  }, [active, retry]);
}
