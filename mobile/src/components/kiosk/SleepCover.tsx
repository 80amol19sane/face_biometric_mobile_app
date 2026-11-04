import { Pressable, StyleSheet, Text } from 'react-native';
import { formatClock } from '../../lib/clock';
import { useNow } from './KioskSheets';

/**
 * A black screen over the kiosk while nobody is near. The camera behind it keeps looking for a
 * face; a face or a tap takes the cover away. Dim text keeps the pixels on an OLED screen nearly off.
 */
export function SleepCover({ onWake }: { onWake: () => void }) {
  const now = useNow();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Wake the kiosk" onPress={onWake} style={styles.cover}>
      <Text style={styles.clock}>{formatClock(now)}</Text>
      <Text style={styles.hint}>Step up to check in</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cover: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center', gap: 8 },
  clock: { fontSize: 44, lineHeight: 52, fontWeight: '300', color: '#4A5361' },
  hint: { fontSize: 18, lineHeight: 26, fontWeight: '500', color: '#5F6978' },
});
