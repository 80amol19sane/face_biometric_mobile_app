import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../src/api/http';
import { approveFace, listFaceReview, revokeFace, type ReviewRow, type ReviewStatus } from '../src/api/review';
import { Body, Button, Chip } from '../src/components/ui';
import { color, radius, space } from '../src/theme';

const FILTERS: ('All' | ReviewStatus)[] = ['All', 'Pending', 'Active', 'Not enrolled', 'Revoked'];
const TONE = { Active: 'success', Pending: 'warning', Revoked: 'danger', 'Not enrolled': 'muted' } as const;

export default function Review() {
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Pending');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRows(await listFaceReview());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load employees.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const act = async (row: ReviewRow, action: 'approve' | 'revoke') => {
    setWorking(row.employee);
    try {
      await (action === 'approve' ? approveFace : revokeFace)(row.employee);
      await load();
    } catch (e) {
      Alert.alert(action === 'approve' ? 'Could not approve' : 'Could not revoke', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setWorking(null);
    }
  };

  const confirmRevoke = (row: ReviewRow) =>
    Alert.alert('Revoke face access?', `${row.employeeName} will not be able to check in until they enrol again and HR approves.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: () => act(row, 'revoke') },
    ]);

  const visible = useMemo(() => (rows ?? []).filter((r) => filter === 'All' || r.status === filter), [rows, filter]);
  const count = (status: ReviewStatus) => (rows ?? []).filter((r) => r.status === status).length;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Face review</Text>
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </View>
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} accessibilityRole="button" accessibilityState={{ selected: filter === f }} style={[styles.filter, filter === f && styles.filterOn]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextOn]}>{f === 'All' ? 'All' : `${f} ${count(f)}`}</Text>
          </Pressable>
        ))}
      </View>
      {error && <View style={styles.pad}><Body tone="danger">{error}</Body></View>}
      <FlatList
        data={visible}
        keyExtractor={(r) => r.employee}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={<Body>{rows ? 'Nobody in this group.' : 'Loading…'}</Body>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowTop}>
              <View style={styles.rowText}>
                <Text style={styles.name}>{item.employeeName}</Text>
                <Text style={styles.sub}>{item.employee}</Text>
              </View>
              <Chip label={item.status} tone={TONE[item.status]} />
            </View>
            <Button
              label={item.status === 'Not enrolled' ? 'Enrol face' : 'Enrol face again'}
              variant={item.status === 'Not enrolled' ? 'primary' : 'secondary'}
              onPress={() => router.push({ pathname: '/enrol-employee', params: { employee: item.employee, name: item.employeeName } })}
            />
            {item.status === 'Pending' && <Button label="Approve" busy={working === item.employee} onPress={() => act(item, 'approve')} />}
            {(item.status === 'Active' || item.status === 'Pending') && (
              <Button label="Revoke" variant="secondary" disabled={working === item.employee} onPress={() => confirmRevoke(item)} />
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  header: { padding: space.md, gap: space.sm },
  title: { fontSize: 26, fontWeight: '700', color: color.text },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingHorizontal: space.md },
  filter: { borderWidth: 1, borderColor: color.border, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.sm, backgroundColor: color.surface },
  filterOn: { backgroundColor: color.primary, borderColor: color.primary },
  filterText: { color: color.text, fontSize: 14, fontWeight: '600' },
  filterTextOn: { color: color.primaryText },
  pad: { padding: space.md },
  list: { padding: space.md, gap: space.sm },
  row: { backgroundColor: color.surface, borderRadius: radius.md, padding: space.md, gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: color.border },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  rowText: { flexShrink: 1 },
  name: { fontSize: 17, fontWeight: '600', color: color.text },
  sub: { fontSize: 13, color: color.muted },
});
