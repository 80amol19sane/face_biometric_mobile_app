import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../src/api/http';
import { approveFace, listFaceReview, revokeFace, type ReviewRow, type ReviewStatus } from '../src/api/review';
import { FaceRow } from '../src/components/FaceRow';
import { Body, Caption, Heading } from '../src/components/ui';
import { radius, space, styleFactory, type, useStyles, useTheme } from '../src/theme';

type Filter = 'All' | ReviewStatus;
const FILTERS: Filter[] = ['All', 'Pending', 'Not enrolled', 'Active', 'Revoked'];

export default function Review() {
  const { color } = useTheme();
  const styles = useStyles(createStyles);
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [filter, setFilter] = useState<Filter>('Not enrolled');
  const [query, setQuery] = useState('');
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

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
    Alert.alert('Revoke face access?', `${row.employeeName} cannot check in until they enrol again and HR approves.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: () => act(row, 'revoke') },
    ]);

  const count = (f: Filter) => (rows ?? []).filter((r) => f === 'All' || r.status === f).length;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) => (filter === 'All' || r.status === filter) && (!needle || `${r.employeeName} ${r.employee}`.toLowerCase().includes(needle)),
    );
  }, [rows, filter, query]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={color.ink} />
        </Pressable>
        <View>
          <Heading>Employee faces</Heading>
          <Caption>{rows ? `${rows.length} active employees` : 'Loading…'}</Caption>
        </View>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={color.muted} />
        <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Search name or ID" placeholderTextColor={color.faint} autoCorrect={false} accessibilityLabel="Search employees" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} accessibilityRole="button" accessibilityState={{ selected: filter === f }} style={[styles.filter, filter === f && styles.filterOn]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextOn]}>{f} {count(f)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {error && <View style={styles.pad}><Body tone="danger">{error}</Body></View>}

      <FlatList
        data={visible}
        keyExtractor={(r) => r.employee}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={<Body>{rows ? 'Nobody matches.' : 'Loading…'}</Body>}
        renderItem={({ item }) => (
          <FaceRow
            row={item}
            busy={working === item.employee}
            onApprove={() => act(item, 'approve')}
            onRevoke={() => confirmRevoke(item)}
            onEnrol={() => router.push({ pathname: '/enrol-employee', params: { employee: item.employee, name: item.employeeName } })}
          />
        )}
      />
    </SafeAreaView>
  );
}

const createStyles = styleFactory((color) => ({
  screen: { flex: 1, backgroundColor: color.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginHorizontal: space.md, paddingHorizontal: space.md, minHeight: 48, backgroundColor: color.bg, borderRadius: radius.md },
  searchInput: { flex: 1, fontSize: 16, color: color.ink, paddingVertical: space.sm },
  filterBar: { flexGrow: 0 },
  filters: { gap: space.sm, padding: space.md },
  filter: { minHeight: 40, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: color.bg },
  filterOn: { backgroundColor: color.accent },
  filterText: { ...type.label, color: color.ink },
  filterTextOn: { color: color.accentInk },
  pad: { padding: space.md },
  list: { paddingHorizontal: space.md, paddingBottom: space.xl },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: color.line },
}));
