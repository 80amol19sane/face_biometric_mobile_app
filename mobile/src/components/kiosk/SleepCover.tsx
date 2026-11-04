import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import { formatClock } from '../../lib/clock';
import { useNow } from './KioskSheets';

const FADE_IN_MS = 600;
const FADE_OUT_MS = 250;

/**
 * A black screen over the kiosk while nobody is near. The camera behind it keeps looking for a
 * face; a face or a tap takes the cover away. It fades slowly in and quickly out, so waking
 * feels instant. Dim text keeps the pixels on an OLED screen nearly off.
 */
export function SleepCover({ visible, onWake }: { visible: boolean; onWake: () => void }) {
  const now = useNow();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fade = Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? FADE_IN_MS : FADE_OUT_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    fade.start();
    return () => fade.stop();
  }, [visible, opacity]);

  return (
    <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[styles.cover, { opacity }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Wake the kiosk" onPress={onWake} style={styles.tap}>
        <Text style={styles.clock}>{formatClock(now)}</Text>
        <Text style={styles.hint}>Step up to check in</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cover: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
  tap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  clock: { fontSize: 44, lineHeight: 52, fontWeight: '300', color: '#4A5361' },
  hint: { fontSize: 18, lineHeight: 26, fontWeight: '500', color: '#5F6978' },
});
