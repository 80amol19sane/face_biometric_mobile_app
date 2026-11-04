import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, space, styleFactory, useStyles } from '../../theme';

export type KioskTone = 'idle' | 'found' | 'liveness' | 'fail';

/** The status pill, frame colour and pill background for each state; the camera is always dark, so these are fixed. */
const TONES: Record<KioskTone, { frame: string; pillText: string; pillBg: string; dot: string }> = {
  idle: { frame: 'rgba(255,255,255,0.85)', pillText: '#7BE0A6', pillBg: 'rgba(91,211,143,0.16)', dot: '#5BD38F' },
  found: { frame: '#3CC4BB', pillText: '#7FE3DB', pillBg: 'rgba(60,196,187,0.16)', dot: '#3CC4BB' },
  liveness: { frame: '#3CC4BB', pillText: '#F5C987', pillBg: 'rgba(242,179,92,0.16)', dot: '#F2B35C' },
  fail: { frame: '#F97066', pillText: '#FFA8A0', pillBg: 'rgba(249,112,102,0.16)', dot: '#F97066' },
};

interface KioskChromeProps {
  tone: KioskTone;
  pill: string;
  instruction: string;
  onAdmin: () => void;
  /** The live camera, drawn behind everything. */
  camera?: ReactNode;
  /** The bottom sheet. */
  children: ReactNode;
}

/** Everything a kiosk screen shares: dark ground or camera, brand header, admin button, oval, status pill, sheet. */
export function KioskChrome({ tone, pill, instruction, onAdmin, camera, children }: KioskChromeProps) {
  const styles = useStyles(createStyles);
  const { width } = useWindowDimensions();
  const ovalWidth = Math.min(width * 0.6, 250);
  const colors = TONES[tone];
  return (
    <View style={styles.root}>
      {camera}
      <View style={styles.scrim} pointerEvents="none" />
      <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.top}>
          <View>
            <Text style={styles.brand}>FACE ATTENDANCE</Text>
            <Text style={styles.title}>Employee Attendance Kiosk</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Admin access" onPress={onAdmin} style={styles.admin}>
            <Ionicons name="shield-half-outline" size={22} color="#F2F4F7" />
          </Pressable>
        </View>

        <View style={styles.middle} pointerEvents="none">
          <View style={[styles.pill, { backgroundColor: colors.pillBg }]}>
            <View style={[styles.dot, { backgroundColor: colors.dot }]} />
            <Text style={[styles.pillText, { color: colors.pillText }]}>{pill}</Text>
          </View>
          <View
            style={[
              styles.oval,
              { width: ovalWidth, height: ovalWidth * 1.27, borderColor: colors.frame, shadowColor: colors.frame },
            ]}
          />
          <Text style={styles.instruction} accessibilityLiveRegion="polite">
            {instruction}
          </Text>
        </View>

        <View style={styles.sheet}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = styleFactory((color) => ({
  root: { flex: 1, backgroundColor: '#0A0F14' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,12,17,0.35)' },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: space.md + 4, paddingTop: space.md },
  brand: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 1.7, color: '#3CC4BB' },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: '#F2F4F7' },
  admin: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  oval: { borderWidth: 3, borderRadius: 999, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
  instruction: { fontSize: 18, lineHeight: 26, fontWeight: '600', color: '#F2F4F7', textAlign: 'center', paddingHorizontal: 40 },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md + 4,
    gap: space.md,
  },
}));
