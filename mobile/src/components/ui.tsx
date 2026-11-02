import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, space, type, useStyles, useTheme, type Palette, type Tone, styleFactory } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface ScreenProps {
  children: ReactNode;
  /** Pinned below the scrolling content: where the one primary action lives. */
  footer?: ReactNode;
}

export function Screen({ children, footer }: ScreenProps) {
  const styles = useStyles(createStyles);
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer && <View style={styles.footer}>{footer}</View>}
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={useStyles(createStyles).title}>{children}</Text>;
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={useStyles(createStyles).heading}>{children}</Text>;
}

export function Caption({ children }: { children: ReactNode }) {
  return <Text style={useStyles(createStyles).caption}>{children}</Text>;
}

export function Body({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'danger' | 'success' }) {
  const { color } = useTheme();
  const styles = useStyles(createStyles);
  const ink = tone === 'danger' ? color.danger : tone === 'success' ? color.success : color.muted;
  return <Text style={[styles.body, { color: ink }]}>{children}</Text>;
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'tonal' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  icon?: IconName;
  disabled?: boolean;
  busy?: boolean;
}

export function Button({ label, onPress, variant = 'primary', size = 'md', icon, disabled, busy }: ButtonProps) {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const inactive = disabled || busy;
  const look = buttonLook(color)[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!busy }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSmall,
        { backgroundColor: look.bg },
        inactive && styles.inactive,
        pressed && styles.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={look.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 18 : 20} color={look.fg} />}
          <Text style={[size === 'sm' ? styles.buttonLabelSmall : styles.buttonLabel, { color: look.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const { tones } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View style={[styles.pill, { backgroundColor: tones[tone].bg }]}>
      <Text style={[styles.pillLabel, { color: tones[tone].fg }]}>{label}</Text>
    </View>
  );
}

export function IconBadge({ name, tone = 'accent', size = 44 }: { name: IconName; tone?: Tone; size?: number }) {
  const { tones } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: tones[tone].bg }]}>
      <Ionicons name={name} size={size * 0.5} color={tones[tone].fg} />
    </View>
  );
}

const buttonLook = (color: Palette) => ({
  primary: { bg: color.accent, fg: color.accentInk },
  tonal: { bg: color.accentTint, fg: color.accent },
  ghost: { bg: 'transparent', fg: color.accent },
  danger: { bg: 'transparent', fg: color.danger },
});

const createStyles = styleFactory((color) => ({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.lg, gap: space.md, flexGrow: 1 },
  footer: { padding: space.lg, paddingTop: space.sm, gap: space.sm, backgroundColor: color.bg },
  title: { ...type.display, color: color.ink },
  heading: { ...type.title, color: color.ink },
  caption: { ...type.caption, color: color.muted },
  body: { ...type.body },
  button: {
    minHeight: 54,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
  },
  buttonSmall: { minHeight: 44, borderRadius: radius.sm, paddingHorizontal: space.md },
  buttonLabel: { ...type.label, fontSize: 17 },
  buttonLabelSmall: { ...type.label },
  inactive: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space.sm + 4, paddingVertical: space.xs + 1 },
  pillLabel: { ...type.caption, fontWeight: '600' },
  badge: { alignItems: 'center', justifyContent: 'center' },
}));
