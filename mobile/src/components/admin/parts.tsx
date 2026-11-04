import { Text, View } from 'react-native';
import type { FaceStatus } from '../../api/admin';
import { radius, space, styleFactory, type, useStyles } from '../../theme';
import { Pill } from '../ui';

/** A number with a label, used in the overview grid. */
export function StatTile({ value, label, tone }: { value: number | string; label: string; tone?: 'success' | 'warning' | 'danger' }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.tile}>
      <Text style={[styles.value, tone === 'success' && styles.success, tone === 'warning' && styles.warning, tone === 'danger' && styles.danger]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function FacePill({ face }: { face: FaceStatus }) {
  if (face === 'Active') return <Pill label="Face" tone="success" />;
  if (face === 'Pending') return <Pill label="Face pending" tone="warning" />;
  if (face === 'Revoked') return <Pill label="Face revoked" tone="danger" />;
  return <Pill label="No face" tone="warning" />;
}

export function PinPill({ pin }: { pin: boolean | null }) {
  if (pin === null) return <Pill label="No PIN" tone="warning" />;
  return pin ? <Pill label="PIN" tone="success" /> : <Pill label="PIN off" tone="neutral" />;
}

/** A titled group of rows on one surface, separated by hairlines. */
export function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.group}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.groupBody}>{children}</View>
    </View>
  );
}

const createStyles = styleFactory((color) => ({
  tile: { flexGrow: 1, flexBasis: '45%', backgroundColor: color.surface, borderRadius: 18, paddingVertical: 14, paddingHorizontal: space.md },
  value: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5, color: color.ink },
  label: { ...type.body, fontSize: 14, lineHeight: 20, color: color.muted },
  success: { color: color.success },
  warning: { color: color.warning },
  danger: { color: color.danger },
  group: { gap: space.sm },
  groupTitle: { ...type.caption, fontWeight: '700', letterSpacing: 1.4, color: color.muted, paddingHorizontal: 4 },
  groupBody: { backgroundColor: color.surface, borderRadius: radius.lg - 4, paddingHorizontal: space.md },
}));
