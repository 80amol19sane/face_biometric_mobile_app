import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, space, styleFactory, type, useStyles } from '../theme';

interface CaptureOverlayProps {
  /** 'live' while proving a real person is there, 'capture' while taking the straight-on frames. */
  phase: 'live' | 'capture';
  prompt: string;
  captured: number;
  frames: number;
  diagnostics?: string;
  onCancel: () => void;
}

/** Everything drawn over the camera: close button, step, face guide, instruction. */
export function CaptureOverlay({ phase, prompt, captured, frames, diagnostics, onCancel }: CaptureOverlayProps) {
  const styles = useStyles(createStyles);
  const ready = phase === 'capture';
  return (
    <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={onCancel} style={styles.close}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.step}>{ready ? 'Step 2 of 2 · Look ahead' : 'Step 1 of 2 · Quick check'}</Text>
      </View>

      <View style={styles.guideZone} pointerEvents="none">
        <View style={[styles.guide, { borderColor: ready ? '#4ADE80' : '#FFFFFF' }]} />
      </View>

      <View style={styles.sheet}>
        {diagnostics ? <Text style={styles.diagnostics}>{diagnostics}</Text> : null}
        <Text style={styles.prompt} accessibilityLiveRegion="polite">{prompt}</Text>
        {frames > 1 && (
          <View style={styles.dots}>
            {Array.from({ length: frames }, (_, i) => (
              <View key={i} style={[styles.dot, i < captured && styles.dotOn]} />
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = styleFactory((color) => ({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  step: { ...type.label, color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.pill, overflow: 'hidden' },
  guideZone: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  guide: { width: '68%', aspectRatio: 0.78, borderRadius: 999, borderWidth: 4 },
  sheet: { backgroundColor: color.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg, paddingBottom: space.xl, gap: space.md, alignItems: 'center' },
  prompt: { ...type.title, color: color.ink, textAlign: 'center' },
  diagnostics: { fontSize: 11, lineHeight: 15, fontFamily: 'monospace', color: color.muted, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: space.sm },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.line },
  dotOn: { backgroundColor: color.accent },
}));
