import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { dashboard } from '../../../src/api/admin';
import { AdminPage } from '../../../src/components/admin/AdminPage';
import { Row, RowGroup } from '../../../src/components/Row';
import { Avatar } from '../../../src/components/Avatar';
import { Button } from '../../../src/components/ui';
import { displayName } from '../../../src/lib/names';
import { useSession } from '../../../src/state/session';
import { useLoad } from '../../../src/state/useLoad';
import { useSignOut } from '../../../src/state/useSignOut';
import { radius, space, styleFactory, type, useStyles } from '../../../src/theme';

export default function More() {
  const styles = useStyles(createStyles);
  const { user } = useSession();
  const signOut = useSignOut();
  const { data } = useLoad(dashboard);
  return (
    <AdminPage eyebrow="ADMIN" title="More" footer={<Button label="Exit admin and return to kiosk" variant="danger" icon="log-out-outline" onPress={signOut} />}>
      <View style={styles.me}>
        <Avatar name={displayName(user)} size={48} />
        <View>
          <Text style={styles.name}>{displayName(user)}</Text>
          <Text style={styles.sub}>{user}</Text>
        </View>
      </View>
      <RowGroup>
        <Row icon="warning-outline" tone="danger" label="Failed attempts" detail="Unrecognised faces and wrong PINs" badge={data?.failed_today ? String(data.failed_today) : undefined} onPress={() => router.push('/admin/failed')} />
        <Row icon="cloud-offline-outline" tone={data?.awaiting_review ? 'warning' : 'neutral'} label="Offline review" detail="Scans saved offline that need a decision" badge={data?.awaiting_review ? String(data.awaiting_review) : undefined} onPress={() => router.push('/admin/offline-review')} />
        <Row icon="phone-portrait-outline" label="Devices" detail="Kiosks and their locations" onPress={() => router.push('/admin/devices')} />
        <Row icon="sync-outline" label="Sync status" detail="Connection and scans waiting to send" onPress={() => router.push('/admin/sync')} />
        <Row icon="settings-outline" label="Settings" detail="Recognition, PIN rules, camera, theme" onPress={() => router.push('/admin/settings')} />
      </RowGroup>
    </AdminPage>
  );
}

const createStyles = styleFactory((color) => ({
  me: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md - 2, borderRadius: radius.lg - 4, backgroundColor: color.surface },
  name: { ...type.label, fontSize: 16, color: color.ink },
  sub: { ...type.caption, color: color.muted },
}));
