import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { space, styleFactory, type, useStyles, useTheme } from '../../theme';
import { Body } from '../ui';
import { KeyboardFrame } from '../KeyboardFrame';

interface AdminPageProps {
  title: string;
  /** Small label above a tab title, e.g. ADMIN. Tabs have no back button. */
  eyebrow?: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  error?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
}

/** One frame for every admin screen: header, scrolling body, optional pinned footer. */
export function AdminPage({ title, eyebrow, subtitle, back = false, right, children, footer, error, refreshing = false, onRefresh }: AdminPageProps) {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  return (
    // Pages inside the tab bar leave the bottom to the bar; pushed pages sit above the phone's navigation buttons.
    <SafeAreaView style={styles.screen} edges={back ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
      <KeyboardFrame>
      <View style={styles.header}>
        {back && (
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={color.ink} />
          </Pressable>
        )}
        <View style={styles.titles}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
      >
        {error ? <Body tone="danger">{error}</Body> : null}
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardFrame>
    </SafeAreaView>
  );
}

const createStyles = styleFactory((color) => ({
  screen: { flex: 1, backgroundColor: color.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md + 4, paddingTop: space.md, paddingBottom: space.sm },
  back: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1 },
  eyebrow: { ...type.caption, fontWeight: '700', letterSpacing: 1.8, color: color.accent },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.3, color: color.ink },
  subtitle: { ...type.caption, color: color.muted },
  content: { paddingHorizontal: space.md + 4, paddingBottom: space.lg, gap: space.md, flexGrow: 1 },
  footer: { padding: space.md + 4, paddingTop: space.sm, gap: space.sm, backgroundColor: color.bg },
}));
