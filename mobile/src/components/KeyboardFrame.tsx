import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Lifts its content above the on-screen keyboard. Android draws edge to edge, so the window no longer
 * resizes by itself and a bare screen leaves the fields and the main button under the keyboard.
 */
export function KeyboardFrame({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView style={styles.fill} behavior="padding">
      {children}
    </KeyboardAvoidingView>
  );
}

/** A keyboard-safe scrolling body: short screens scroll, tall ones fill the phone. */
export function KeyboardScroll({ children, contentStyle }: { children: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView style={styles.fill} contentContainerStyle={[styles.grow, contentStyle]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
});
