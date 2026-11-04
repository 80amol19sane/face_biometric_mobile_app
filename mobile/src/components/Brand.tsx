import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { radius, space, useStyles, useTheme, type Palette, styleFactory } from '../theme';
import { Body, Title } from './ui';

/** Mark, title and one line of context for the sign-in style screens. */
export function Brand({ title, subtitle }: { title: string; subtitle: string }) {
  const { color } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <Ionicons name="scan-outline" size={30} color={color.accentInk} />
      </View>
      <Title>{title}</Title>
      <Body>{subtitle}</Body>
    </View>
  );
}

const createStyles = styleFactory((color) => ({
  wrap: { gap: space.sm, paddingTop: space.xl, paddingBottom: space.md },
  mark: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
}));
