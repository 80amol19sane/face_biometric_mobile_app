import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '../src/api/http';
import { myStatus, type MyStatus, type TemplateStatus } from '../src/api/faceBiometric';
import { pendingFaceCount } from '../src/api/review';
import { currentUser, logout } from '../src/api/session';
import { Avatar } from '../src/components/Avatar';
import { Row, RowGroup } from '../src/components/Row';
import { Tile } from '../src/components/Tile';
import { Body, Button, Caption, Heading, IconBadge, Screen, type IconName } from '../src/components/ui';
import { displayName, greeting } from '../src/lib/names';
import { useSession } from '../src/state/session';
import { radius, space, styleFactory, useStyles, type Tone } from '../src/theme';

interface StatusCopy {
  icon: IconName;
  tone: Tone;
  title: string;
  detail: string;
}

const STATUS: Record<'Active' | 'Pending' | 'Revoked' | 'None' | 'Loading' | 'NoEmployee', StatusCopy> = {
  Active: { icon: 'shield-checkmark-outline', tone: 'success', title: 'Face enrolled', detail: 'You can check in and out.' },
  Pending: { icon: 'hourglass-outline', tone: 'warning', title: 'Waiting for HR approval', detail: 'Check in opens once HR approves your face.' },
  Revoked: { icon: 'alert-circle', tone: 'danger', title: 'Face access revoked', detail: 'Ask HR to enrol your face again.' },
  None: { icon: 'scan-outline', tone: 'accent', title: 'Face not enrolled', detail: 'HR enrols your face in person. Ask them when you are at work.' },
  Loading: { icon: 'time-outline', tone: 'neutral', title: 'Checking your status…', detail: ' ' },
  NoEmployee: { icon: 'person-outline', tone: 'neutral', title: 'No employee linked', detail: 'This login can manage faces but cannot check in.' },
};

export default function Home() {
  const styles = useStyles(createStyles);
  const { user, setUser } = useSession();
  const [status, setStatus] = useState<MyStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noEmployee, setNoEmployee] = useState(false);
  const [pending, setPending] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      if (!(await currentUser())) {
        setUser(null);
        return router.replace('/login');
      }
      pendingFaceCount().then(setPending);
      setStatus(await myStatus());
      setNoEmployee(false);
    } catch (e) {
      // 403 means the login has no active Employee (for example Administrator).
      if (e instanceof ApiError && e.status === 403) setNoEmployee(true);
      else setError(e instanceof ApiError ? e.message : 'Could not load your status.');
    }
  }, [setUser]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const signOut = async () => {
    await logout();
    setUser(null);
    router.replace('/login');
  };

  const copy = STATUS[statusKey(status, noEmployee)];
  const canCheckIn = status?.template === 'Active';
  const canReview = pending !== null;
  const reviewBadge = pending ? `${pending} pending` : undefined;
  const punch = (logType: 'IN' | 'OUT') => router.push({ pathname: '/checkin', params: { logType } });

  return (
    <Screen
      footer={noEmployee && canReview ? <Button label={`Review employee faces${pending ? ` · ${pending} pending` : ''}`} icon="people-outline" onPress={() => router.push('/review')} /> : undefined}
    >
      <View style={styles.header}>
        <Avatar name={displayName(user)} size={48} />
        <View>
          <Caption>{greeting()}</Caption>
          <Heading>{displayName(user)}</Heading>
        </View>
      </View>

      <View style={styles.status}>
        <IconBadge name={copy.icon} tone={copy.tone} size={48} />
        <View style={styles.statusText}>
          <Heading>{copy.title}</Heading>
          <Body>{copy.detail}</Body>
        </View>
      </View>

      {error && <Body tone="danger">{error}</Body>}

      {!noEmployee && (
        <View style={styles.tiles}>
          <Tile icon="log-in-outline" label="Check in" primary disabled={!canCheckIn} onPress={() => punch('IN')} />
          <Tile icon="log-out-outline" label="Check out" disabled={!canCheckIn} onPress={() => punch('OUT')} />
        </View>
      )}

      <RowGroup>
        {canReview && !noEmployee && (
          <Row icon="people-outline" label="Review employee faces" detail="Approve, revoke or enrol" badge={reviewBadge} onPress={() => router.push('/review')} />
        )}
        <Row icon="log-out-outline" label="Sign out" onPress={signOut} />
      </RowGroup>
    </Screen>
  );
}

function statusKey(status: MyStatus | null, noEmployee: boolean): keyof typeof STATUS {
  if (noEmployee) return 'NoEmployee';
  if (!status) return 'Loading';
  const template: TemplateStatus = status.template;
  return template ?? 'None';
}

const createStyles = styleFactory((color) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  status: { flexDirection: 'row', gap: space.md, alignItems: 'center', backgroundColor: color.surface, borderRadius: radius.lg, padding: space.md },
  statusText: { flex: 1, gap: 2 },
  tiles: { flexDirection: 'row', gap: space.md },
}));
