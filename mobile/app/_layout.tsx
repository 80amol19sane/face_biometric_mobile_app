import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PreferencesProvider } from '../src/state/preferences';
import { SessionProvider } from '../src/state/session';
import { useTheme } from '../src/theme';

function ThemedStatusBar() {
  const { dark } = useTheme();
  return <StatusBar style={dark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <SessionProvider>
        <ThemedStatusBar />
        <Stack screenOptions={{ headerShown: false }} />
      </SessionProvider>
    </PreferencesProvider>
  );
}
