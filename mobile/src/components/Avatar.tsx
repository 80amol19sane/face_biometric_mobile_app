import { StyleSheet, Text, View } from 'react-native';
import { color } from '../theme';

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '?') + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();
}

const styles = StyleSheet.create({
  circle: { backgroundColor: color.accentTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  initials: { color: color.accent, fontWeight: '700' },
});
