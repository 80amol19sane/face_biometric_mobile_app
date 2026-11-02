import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ApiError } from '../src/api/http';
import { checkIn } from '../src/api/checkin';
import { myStatus } from '../src/api/faceBiometric';
import { FaceCamera } from '../src/components/FaceCamera';
import { Result } from '../src/components/Result';
import { Button } from '../src/components/ui';
import { describeStanding, type ShiftStanding } from '../src/lib/shift';
import { ensureDevice } from '../src/device/registry';
import type { LogType } from '../src/lib/signing';
import { useSession } from '../src/state/session';

type Step = { name: 'capture'; attempt: number } | { name: 'sending' } | { name: 'done'; time: string; shift: ShiftStanding | null } | { name: 'failed'; message: string };

export default function Checkin() {
  const { logType: param } = useLocalSearchParams<{ logType: string }>();
  const logType: LogType = param === 'OUT' ? 'OUT' : 'IN';
  const word = logType === 'IN' ? 'in' : 'out';
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
      setStep({ name: 'done', time: result.time, shift: result.shift ?? null });
    } catch (e) {
      setStep({ name: 'failed', message: e instanceof ApiError ? e.message : 'Check-in failed. Please try again.' });
    }
  };

  switch (step.name) {
    case 'capture':
      return <FaceCamera key={step.attempt} frames={1} onEmbedding={submit} onFailure={(message) => setStep({ name: 'failed', message })} onCancel={() => router.back()} />;
    case 'sending':
      return <Result icon="time-outline" tone="accent" title="Verifying…" body="Checking your face and this phone with the server." />;
    case 'done': {
      const standing = describeStanding(step.shift);
      return (
        <Result
          icon="checkmark-circle"
          tone={standing?.tone ?? 'success'}
          title={`Checked ${word}`}
          body={standing ? `${step.time}\n${standing.text}` : step.time}
          bodyTone={standing?.tone === 'warning' ? 'neutral' : 'success'}
        />
      );
    }
    case 'failed':
      return (
        <Result
          icon="alert-circle"
          tone="danger"
          title={`Not checked ${word}`}
          body={step.message}
          bodyTone="danger"
          actions={
            <>
              <Button label="Try again" icon="refresh" onPress={() => setStep({ name: 'capture', attempt: Date.now() })} />
              <Button label="Back" variant="ghost" onPress={() => router.back()} />
            </>
          }
        />
      );
  }
}
