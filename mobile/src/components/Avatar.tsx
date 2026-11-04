import { Text, View } from 'react-native';
import { useStyles, type Palette, styleFactory } from '../theme';

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const styles = useStyles(createStyles);
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '?') + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();
}

const createStyles = styleFactory((color) => ({
  circle: { backgroundColor: color.accentTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  initials: { color: color.accent, fontWeight: '700' },
}));
