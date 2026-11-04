import { Pressable, Text, View } from 'react-native';
import { radius, space, styleFactory, type, useStyles } from '../theme';

interface SegmentedProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A short either-or choice, all options visible at once. */
export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.selected]}
          >
            <Text style={[styles.text, selected && styles.selectedText]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = styleFactory((color) => ({
  track: { flexDirection: 'row', backgroundColor: color.bg, borderRadius: radius.md, padding: space.xs },
  option: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  selected: { backgroundColor: color.accent },
  text: { ...type.label, color: color.muted },
  selectedText: { color: color.accentInk },
}));
