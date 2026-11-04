import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { dashboard } from '../../../src/api/admin';
import { AdminPage } from '../../../src/components/admin/AdminPage';
import { StatTile } from '../../../src/components/admin/parts';
import { Button } from '../../../src/components/ui';
import { formatShortDate } from '../../../src/lib/clock';
import { useLoad } from '../../../src/state/useLoad';
import { useSignOut } from '../../../src/state/useSignOut';
import { radius, space, styleFactory, type, useStyles } from '../../../src/theme';

export default function Overview() {
  const styles = useStyles(createStyles);
  const signOut = useSignOut();
  const { data, error, loading, reload } = useLoad(dashboard);
  const percent = data && data.total ? Math.round((data.present_today / data.total) * 100) : 0;

  return (
    <AdminPage
      eyebrow="ADMIN"
      title="Overview"
      right={<Button label="Exit admin" variant="tonal" size="sm" onPress={signOut} />}
      error={error}
      refreshing={loading && !!data}
      onRefresh={reload}
    >
      {data && (
        <>
          <View style={styles.hero}>
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroLabel}>Today's attendance</Text>
                <Text style={styles.heroValue}>
                  {data.present_today} <Text style={styles.heroOf}>of {data.total}</Text>
                </Text>
              </View>
              <Text style={styles.heroLabel}>{formatShortDate(new Date())}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.bar, { width: `${percent}%` }]} />
            </View>
          </View>

          <View style={styles.grid}>
            <StatTile value={data.total} label="Total employees" />
            <StatTile value={data.face_registered} label="Face registered" tone="success" />
            <StatTile value={data.pin_registered} label="PIN registered" />
            <StatTile value={data.not_enrolled} label="Not enrolled" tone={data.not_enrolled ? 'warning' : undefined} />
            <StatTile value={data.failed_today} label="Failed attempts today" tone={data.failed_today ? 'danger' : undefined} />
            <StatTile value={data.pending} label="Pending registrations" />
          </View>

          {data.not_enrolled > 0 && (
            <View style={styles.attention}>
              <View style={styles.attentionText}>
                <Text style={styles.attentionTitle}>{data.not_enrolled} employees cannot use the kiosk yet</Text>
                <Text style={styles.attentionBody}>Register their face or set a PIN.</Text>
              </View>
              <Button label="Review" size="sm" onPress={() => router.push({ pathname: '/admin/employees', params: { show: 'no_face' } })} />
            </View>
          )}
        </>
      )}
    </AdminPage>
  );
}

const createStyles = styleFactory((color) => ({
  hero: { backgroundColor: color.accent, borderRadius: 22, padding: space.md + 4, gap: space.md - 4 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroLabel: { ...type.body, fontSize: 14, color: color.accentInk, opacity: 0.85 },
  heroValue: { fontSize: 40, lineHeight: 46, fontWeight: '700', letterSpacing: -1, color: color.accentInk },
  heroOf: { fontSize: 20, fontWeight: '500', opacity: 0.8 },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4, backgroundColor: color.accentInk },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm + 4 },
  attention: { flexDirection: 'row', alignItems: 'center', gap: space.md - 4, backgroundColor: color.warningTint, borderRadius: radius.md + 2, padding: space.md - 2 },
  attentionText: { flex: 1 },
  attentionTitle: { ...type.label, fontSize: 16, lineHeight: 22, color: color.warning, fontWeight: '700' },
  attentionBody: { ...type.body, fontSize: 14, lineHeight: 20, color: color.ink },
}));
