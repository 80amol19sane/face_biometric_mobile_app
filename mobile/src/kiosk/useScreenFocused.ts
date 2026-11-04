import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

const REOPEN_DELAY_MS = 400;

/**
 * True while this screen is the one on top. A pushed screen leaves the one beneath mounted, so a
 * screen that owns the camera must let go of it when it is covered: the phone's camera can only be
 * opened once, and a second owner makes every capture fail.
 */
export function useScreenFocused(): boolean {
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      // A beat after returning, so the screen that just left has let go of the camera first.
      const timer = setTimeout(() => setFocused(true), REOPEN_DELAY_MS);
      return () => {
        clearTimeout(timer);
        setFocused(false);
      };
    }, []),
  );
  return focused;
}
