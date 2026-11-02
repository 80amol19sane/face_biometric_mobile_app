import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { space, type, useStyles, useTheme, type Palette, type Tone, styleFactory } from '../theme';
import type { IconName } from './ui';

interface RowProps {
  icon: IconName;
  label: string;
  detail?: string;
  /** Short count or word shown before the chevron, e.g. "3 pending". */
  badge?: string;
  tone?: Tone;
  onPress: () => void;
}

/** Fixed lanes: 24px icon, flexible text, trailing badge and chevron. They line up in every row. */
export function Row({ icon, label, detail, badge, tone = 'neutral', onPress }: RowProps) {
  const { color, tones } = useTheme();
  const styles = useStyles(createStyles);
  const ink = tone === 'danger' ? color.danger : color.ink;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.iconLane}>
        <Ionicons name={icon} size={22} color={tone === 'danger' ? color.danger : color.accent} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.label, { color: ink }]}>{label}</Text>
        {detail && <Text style={styles.detail}>{detail}</Text>}
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: tones.warning.bg }]}>
          <Text style={[styles.badgeLabel, { color: tones.warning.fg }]}>{badge}</Text>
        </View>
      )}
      <View style={styles.chevronLane}>
        <Ionicons name="chevron-forward" size={18} color={color.faint} />
      </View>
    </Pressable>
  );
}

/** Rows sit flush on one surface, separated by hairlines instead of boxes. */
export function RowGroup({ children }: { children: React.ReactNode }) {
  const styles = useStyles(createStyles);
  return <View style={styles.group}>{children}</View>;
}

const createStyles = styleFactory((color) => ({
  group: { backgroundColor: color.surface, borderRadius: 16, overflow: 'hidden' },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line,
  },
  pressed: { backgroundColor: color.bg },
  iconLane: { width: 24, alignItems: 'center', flexShrink: 0 },
  text: { flex: 1, paddingVertical: space.sm },
  label: { ...type.label, fontSize: 16 },
  detail: { ...type.caption, color: color.muted },
  badge: { borderRadius: 999, paddingHorizontal: space.sm + 2, paddingVertical: 3 },
  badgeLabel: { ...type.caption, fontWeight: '700' },
  chevronLane: { width: 18, alignItems: 'center', flexShrink: 0 },
}));
