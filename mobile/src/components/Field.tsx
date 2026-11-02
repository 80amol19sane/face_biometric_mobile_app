import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { color, radius, space, type } from '../theme';

export function Field({ label, ...input }: { label: string } & TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, focused && styles.focused]}
        placeholderTextColor="#98A2B3"
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

const styles = StyleSheet.create({
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
});
