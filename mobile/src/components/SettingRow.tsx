import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { space, styleFactory, type, useStyles } from '../theme';

interface SettingRowProps {
  label: string;
  /** Plain value shown on the right, or a control passed as children. */
  value?: string;
  hint?: string;
  children?: ReactNode;
}

/** Label and hint on the left, a value or control in a fixed lane on the right. */
export function SettingRow({ label, value, hint, children }: SettingRowProps) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      {value !== undefined && <Text style={styles.value} numberOfLines={2}>{value}</Text>}
      {children}
    </View>
  );
}

const createStyles = styleFactory((color) => ({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  text: { flex: 1, paddingVertical: space.sm },
  label: { ...type.label, fontSize: 16, color: color.ink },
  hint: { ...type.caption, color: color.muted },
  value: { ...type.body, color: color.muted, maxWidth: '45%', textAlign: 'right' },
}));
