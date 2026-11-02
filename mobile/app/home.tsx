import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ApiError } from '../src/api/http';
import { myStatus, type MyStatus } from '../src/api/faceBiometric';
import { currentUser, logout } from '../src/api/session';
import { Body, Button, Card, Chip, Screen, Title } from '../src/components/ui';
import { isKeyHardwareBacked } from '../src/device/registry';
import { useSession } from '../src/state/session';

const TEMPLATE_CHIP = {
  Active: { label: 'Face enrolled', tone: 'success' },
  Pending: { label: 'Waiting for HR approval', tone: 'warning' },
  Revoked: { label: 'Face access revoked', tone: 'danger' },
} as const;

export default function Home() {
  const { user, setUser } = useSession();
  const [status, setStatus] = useState<MyStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      if (!(await currentUser())) {
        setUser(null);
        return router.replace('/login');
      }
      setStatus(await myStatus());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load your status.');
    }
  }, [setUser]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const signOut = async () => {
    await logout();
    setUser(null);
    router.replace('/login');
  };

  const chip = status?.template ? TEMPLATE_CHIP[status.template] : null;
  const canCheckIn = status?.template === 'Active';

  return (
    <Screen>
      <Title>Attendance</Title>
      <Body>{user}</Body>

      <Card>
        {chip ? <Chip label={chip.label} tone={chip.tone} /> : <Chip label={status ? 'Face not enrolled' : 'Loading…'} tone="muted" />}
        {user && isKeyHardwareBacked(user) && <Body>This phone’s security key is stored in secure hardware.</Body>}
        {status?.template === 'Pending' && <Body>HR must approve your face before you can check in.</Body>}
        {status?.template === 'Revoked' && <Body>Ask HR to restore your access, then enrol again.</Body>}
      </Card>

      {error && <Body tone="danger">{error}</Body>}

      <Button label="Check in" onPress={() => router.push({ pathname: '/checkin', params: { logType: 'IN' } })} disabled={!canCheckIn} />
      <Button label="Check out" onPress={() => router.push({ pathname: '/checkin', params: { logType: 'OUT' } })} disabled={!canCheckIn} />
      <Button
        label={status?.template ? 'Enrol my face again' : 'Enrol my face'}
        variant="secondary"
        onPress={() => router.push('/enrol')}
        disabled={!status}
      />
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}
