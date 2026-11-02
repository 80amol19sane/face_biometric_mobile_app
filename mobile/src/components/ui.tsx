import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, radius, space } from '../theme';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Body({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'danger' | 'success' }) {
  return <Text style={[styles.body, tone === 'danger' && styles.danger, tone === 'success' && styles.success]}>{children}</Text>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  busy?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled, busy }: ButtonProps) {
  const inactive = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!busy }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [styles.button, styles[variant], inactive && styles.inactive, pressed && styles.pressed]}
    >
      {busy ? (
        <ActivityIndicator color={variant === 'primary' ? color.primaryText : color.primary} />
      ) : (
        <Text style={[styles.buttonLabel, variant !== 'primary' && styles.buttonLabelAlt]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Chip({ label, tone }: { label: string; tone: 'success' | 'warning' | 'danger' | 'muted' }) {
  return (
    <View style={[styles.chip, { borderColor: color[tone] }]}>
      <Text style={[styles.chipLabel, { color: color[tone] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.lg, gap: space.md, flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '700', color: color.text },
  body: { fontSize: 16, lineHeight: 22, color: color.muted },
  danger: { color: color.danger },
  success: { color: color.success },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    padding: space.md,
    gap: space.sm,
  },
  button: { minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md },
  primary: { backgroundColor: color.primary },
  secondary: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.primary },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  buttonLabel: { color: color.primaryText, fontSize: 17, fontWeight: '600' },
  buttonLabelAlt: { color: color.primary },
  chip: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space.sm + 4, paddingVertical: space.xs },
  chipLabel: { fontSize: 13, fontWeight: '600' },
});
