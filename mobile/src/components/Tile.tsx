import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { color, radius, space, type } from '../theme';
import type { IconName } from './ui';

interface TileProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}

/** A large touch target for the two things an employee does all day. */
export function Tile({ icon, label, onPress, primary, disabled }: TileProps) {
  const fg = primary ? color.accentInk : color.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: primary ? color.accent : color.accentTint },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={30} color={fg} />
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minHeight: 124, borderRadius: radius.lg, padding: space.md, justifyContent: 'space-between' },
  label: { ...type.title, fontSize: 20 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
});
