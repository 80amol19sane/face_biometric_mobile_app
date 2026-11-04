import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isThemePreference, type ThemePreference } from '../lib/appearance';
import { DEFAULT_SLEEP, isSleepChoice, type SleepChoice } from '../lib/sleep';

const THEME_KEY = 'pref_theme';
const DIAGNOSTICS_KEY = 'pref_diagnostics';
const SLEEP_KEY = 'pref_sleep';

interface Preferences {
  theme: ThemePreference;
  /** Shows what the face detector sees at the top of the camera. Off unless support asks. */
  diagnostics: boolean;
  /** How long the kiosk waits with nobody in view before blanking the screen. */
  sleep: SleepChoice;
  setTheme: (theme: ThemePreference) => void;
  setSleep: (choice: SleepChoice) => void;
  setDiagnostics: (on: boolean) => void;
}

const PreferencesContext = createContext<Preferences | null>(null);

/** Per-phone choices. They load a moment after launch; until then the defaults apply. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [diagnostics, setDiagnosticsState] = useState(false);
  const [sleep, setSleepState] = useState<SleepChoice>(DEFAULT_SLEEP);

  useEffect(() => {
    (async () => {
      const [savedTheme, savedDiagnostics, savedSleep] = await Promise.all([
        SecureStore.getItemAsync(THEME_KEY),
        SecureStore.getItemAsync(DIAGNOSTICS_KEY),
        SecureStore.getItemAsync(SLEEP_KEY),
      ]);
      if (isThemePreference(savedTheme)) setThemeState(savedTheme);
      setDiagnosticsState(savedDiagnostics === '1');
      if (isSleepChoice(savedSleep)) setSleepState(savedSleep);
    })().catch(() => {});
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    SecureStore.setItemAsync(THEME_KEY, next).catch(() => {});
  }, []);

  const setDiagnostics = useCallback((on: boolean) => {
    setDiagnosticsState(on);
    SecureStore.setItemAsync(DIAGNOSTICS_KEY, on ? '1' : '0').catch(() => {});
  }, []);

  const setSleep = useCallback((choice: SleepChoice) => {
    setSleepState(choice);
    SecureStore.setItemAsync(SLEEP_KEY, choice).catch(() => {});
  }, []);

  const value = useMemo(() => ({ theme, diagnostics, sleep, setTheme, setDiagnostics, setSleep }), [theme, diagnostics, sleep, setTheme, setDiagnostics, setSleep]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): Preferences {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used inside PreferencesProvider');
  return value;
}
