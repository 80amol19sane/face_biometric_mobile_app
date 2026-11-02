import { StyleSheet, Text, View } from 'react-native';
import type { ReviewRow, ReviewStatus } from '../api/review';
import { color, space, type, type Tone } from '../theme';
import { Avatar } from './Avatar';
import { Button, Pill } from './ui';

const TONE: Record<ReviewStatus, Tone> = { Active: 'success', Pending: 'warning', Revoked: 'danger', 'Not enrolled': 'neutral' };

interface FaceRowProps {
  row: ReviewRow;
  busy: boolean;
  onApprove: () => void;
  onRevoke: () => void;
  onEnrol: () => void;
}

/** One employee: avatar, name, status, then only the actions that make sense for that status. */
export function FaceRow({ row, busy, onApprove, onRevoke, onEnrol }: FaceRowProps) {
  const enrolled = row.status !== 'Not enrolled';
  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <Avatar name={row.employeeName} />
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>{row.employeeName}</Text>
          <Text style={styles.id}>{row.employee}</Text>
        </View>
        <Pill label={row.status} tone={TONE[row.status]} />
      </View>
      <View style={styles.actions}>
        {row.status === 'Pending' && <Button size="sm" label="Approve" icon="checkmark" busy={busy} onPress={onApprove} />}
        <Button size="sm" variant={row.status === 'Not enrolled' ? 'primary' : 'tonal'} label={enrolled ? 'Enrol again' : 'Enrol face'} icon="scan-outline" disabled={busy} onPress={onEnrol} />
        {(row.status === 'Active' || row.status === 'Pending') && <Button size="sm" variant="danger" label="Revoke" disabled={busy} onPress={onRevoke} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: space.md, gap: space.sm + 4 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  text: { flex: 1 },
  name: { ...type.label, fontSize: 16, color: color.ink },
  id: { ...type.caption, color: color.muted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingLeft: 44 + space.md },
});
