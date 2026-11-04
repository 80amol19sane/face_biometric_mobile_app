import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { employees, type EmployeeSummary, type ShowFilter } from '../../../src/api/admin';
import { AdminPage } from '../../../src/components/admin/AdminPage';
import { FacePill, PinPill } from '../../../src/components/admin/parts';
import { Avatar } from '../../../src/components/Avatar';
import { Body, Button, Pill } from '../../../src/components/ui';
import { useLoad } from '../../../src/state/useLoad';
import { radius, space, styleFactory, type, useStyles, useTheme } from '../../../src/theme';

const FILTERS: { value: ShowFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'no_face', label: 'No face' },
  { value: 'no_pin', label: 'No PIN' },
  { value: 'inactive', label: 'Inactive' },
];

export default function Employees() {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const params = useLocalSearchParams<{ show?: ShowFilter }>();
  const [show, setShow] = useState<ShowFilter>(params.show ?? 'all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (params.show) setShow(params.show);
  }, [params.show]);
  // Search as the person types, but not on every key.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, error, loading, reload } = useLoad(() => employees(search, show), [search, show]);

  return (
    <AdminPage eyebrow="ADMIN" title="Employees" error={error} refreshing={loading && !!data} onRefresh={reload}>
      <View style={styles.search}>
        <Ionicons name="search" size={20} color={color.muted} />
        <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Name, ID or mobile" placeholderTextColor={color.faint} autoCorrect={false} accessibilityLabel="Search employees" />
      </View>
      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Pressable key={f.value} accessibilityRole="button" accessibilityState={{ selected: show === f.value }} onPress={() => setShow(f.value)} style={[styles.chip, show === f.value && styles.chipOn]}>
            <Text style={[styles.chipText, show === f.value && styles.chipTextOn]}>
              {f.label}
              {data ? ` ${data.counts[f.value]}` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
      {data?.employees.length === 0 && <Body>Nobody matches.</Body>}
      {data?.employees.map((e) => <EmployeeRow key={e.employee} employee={e} />)}
    </AdminPage>
  );
}

function EmployeeRow({ employee: e }: { employee: EmployeeSummary }) {
  const styles = useStyles(createStyles);
  const inactive = e.status !== 'Active';
  const needsFace = e.face !== 'Active';
  const action = inactive ? 'View' : needsFace ? 'Register' : e.pin === null ? 'Set PIN' : 'Update';
  const go = () =>
    router.push(inactive ? `/admin/employee/${e.employee}` : needsFace || action === 'Update' ? `/admin/register/${e.employee}` : `/admin/pin/${e.employee}`);
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/admin/employee/${e.employee}`)} style={styles.row}>
      <View style={styles.top}>
        <Avatar name={e.employee_name} />
        <View style={styles.text}>
          <Text style={[styles.name, inactive && styles.muted]} numberOfLines={1}>{e.employee_name}</Text>
          <Text style={styles.sub} numberOfLines={1}>{[e.employee, e.department?.replace(/ - [A-Z]+$/, ''), e.designation].filter(Boolean).join(' · ')}</Text>
        </View>
      </View>
      <View style={styles.bottom}>
        {inactive ? <Pill label="Inactive" tone="neutral" /> : (<><FacePill face={e.face} /><PinPill pin={e.pin} /></>)}
        <View style={styles.spacer} />
        <Button size="sm" variant={action === 'Register' ? 'primary' : 'tonal'} label={action} onPress={go} />
      </View>
    </Pressable>
  );
}

const createStyles = styleFactory((color) => ({
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 52, paddingHorizontal: space.md, backgroundColor: color.surface, borderRadius: radius.md },
  input: { flex: 1, fontSize: 16, color: color.ink, paddingVertical: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: color.surface },
  chipOn: { backgroundColor: color.accent },
  chipText: { ...type.label, fontSize: 14, color: color.ink },
  chipTextOn: { color: color.accentInk },
  row: { gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: color.line },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 4 },
  text: { flex: 1 },
  name: { ...type.label, fontSize: 16, lineHeight: 22, color: color.ink },
  muted: { color: color.muted },
  sub: { ...type.caption, color: color.muted },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 56, flexWrap: 'wrap' },
  spacer: { flex: 1 },
}));
