import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { radius, space, styleFactory, type, useStyles, useTheme } from '../theme';

export function Field({ label, ...input }: { label: string } & TextInputProps) {
  const { color } = useTheme();
  const styles = useStyles(createStyles);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, focused && styles.focused]}
        placeholderTextColor={color.faint}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...input}
      />
    </View>
  );
}

const createStyles = styleFactory((color) => ({
  field: { gap: space.sm },
  label: { ...type.label, color: color.ink },
  input: {
    minHeight: 54,
    backgroundColor: color.surface,
    borderWidth: 1.5,
    borderColor: color.line,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: 17,
    color: color.ink,
  },
  focused: { borderColor: color.accent },
}));
