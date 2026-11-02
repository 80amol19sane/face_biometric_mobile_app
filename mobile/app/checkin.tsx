import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ApiError } from '../src/api/http';
import { checkIn } from '../src/api/checkin';
import { Body, Button, Screen, Title } from '../src/components/ui';
import { FaceCamera } from '../src/components/FaceCamera';
import { myStatus } from '../src/api/faceBiometric';
import { ensureDevice } from '../src/device/registry';
import type { LogType } from '../src/lib/signing';
import { useSession } from '../src/state/session';

type Step = { name: 'capture'; attempt: number } | { name: 'sending' } | { name: 'done'; time: string } | { name: 'failed'; message: string };

export default function Checkin() {
  const { logType: param } = useLocalSearchParams<{ logType: string }>();
  const logType: LogType = param === 'OUT' ? 'OUT' : 'IN';
  const { user } = useSession();
  const [step, setStep] = useState<Step>({ name: 'capture', attempt: 0 });

  useEffect(() => {
    if (step.name !== 'done') return;
    const timer = setTimeout(() => router.replace('/home'), 2500);
    return () => clearTimeout(timer);
  }, [step]);

  const submit = async (embedding: Float32Array) => {
    setStep({ name: 'sending' });
    try {
      if (!user) throw new ApiError('Please sign in again.', 'server');
      // First check-in on this phone (e.g. HR enrolled the face): register this phone's key now.
      const device = await ensureDevice(user, await myStatus());
      const result = await checkIn(user, device, logType, embedding);
      setStep({ name: 'done', time: result.time });
    } catch (e) {
      setStep({ name: 'failed', message: e instanceof ApiError ? e.message : 'Check-in failed. Please try again.' });
    }
  };

  switch (step.name) {
    case 'capture':
      return <FaceCamera key={step.attempt} frames={1} onEmbedding={submit} onFailure={(message) => setStep({ name: 'failed', message })} />;
    case 'sending':
      return (
        <Screen>
          <Title>Verifying…</Title>
          <Body>Checking your face and this phone with the server.</Body>
        </Screen>
      );
    case 'done':
      return (
        <Screen>
          <Title>{logType === 'IN' ? 'Checked in' : 'Checked out'}</Title>
          <Body tone="success">{step.time}</Body>
        </Screen>
      );
    case 'failed':
      return (
        <Screen>
          <Title>Not checked {logType === 'IN' ? 'in' : 'out'}</Title>
          <Body tone="danger">{step.message}</Body>
          <Button label="Try again" onPress={() => setStep({ name: 'capture', attempt: Date.now() })} />
          <Button label="Back" variant="secondary" onPress={() => router.replace('/home')} />
        </Screen>
      );
  }
}
