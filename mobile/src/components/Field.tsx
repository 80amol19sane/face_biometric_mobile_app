import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { color, radius, space } from '../theme';

export function Field({ label, ...input }: { label: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={color.muted}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={label}
        {...input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  label: { fontSize: 14, fontWeight: '600', color: color.text },
  input: {
    minHeight: 52,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: color.text,
  },
});
