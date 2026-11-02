import { router } from 'expo-router';
import { useState } from 'react';
import { ApiError } from '../src/api/http';
import { enrolFace, myStatus, type TemplateStatus } from '../src/api/faceBiometric';
import { FaceCamera } from '../src/components/FaceCamera';
import { Body, Button, Screen, Title } from '../src/components/ui';
import { ensureDevice } from '../src/device/registry';
import { ENROL_FRAMES, MODEL_VERSION } from '../src/face/config';
import { bytesToBase64, embeddingBytes } from '../src/lib/embedding';
import { useSession } from '../src/state/session';

type Step = { name: 'consent' } | { name: 'capture'; attempt: number } | { name: 'saving' } | { name: 'done'; status: Exclude<TemplateStatus, null> } | { name: 'failed'; message: string };

export default function Enrol() {
  const { user } = useSession();
  const [step, setStep] = useState<Step>({ name: 'consent' });

  const save = async (embedding: Float32Array) => {
    if (!user) return;
    setStep({ name: 'saving' });
    try {
      const device = await ensureDevice(user, await myStatus());
      const { status } = await enrolFace(device, bytesToBase64(embeddingBytes(embedding)), MODEL_VERSION);
      setStep({ name: 'done', status });
    } catch (e) {
      setStep({ name: 'failed', message: e instanceof ApiError ? e.message : 'Could not save your face.' });
    }
  };

  switch (step.name) {
    case 'capture':
      return <FaceCamera key={step.attempt} frames={ENROL_FRAMES} onEmbedding={save} onFailure={(message) => setStep({ name: 'failed', message })} />;
    case 'saving':
      return (
        <Screen>
          <Title>Saving…</Title>
          <Body>Registering this phone and your face.</Body>
        </Screen>
      );
    case 'done':
      return (
        <Screen>
          <Title>{step.status === 'Active' ? 'You’re enrolled' : 'Sent for approval'}</Title>
          <Body>
            {step.status === 'Active'
              ? 'You can check in now.'
              : 'HR needs to approve your face before you can check in. You will see it here once they have.'}
          </Body>
          <Button label="Done" onPress={() => router.replace('/home')} />
        </Screen>
      );
    case 'failed':
      return (
        <Screen>
          <Title>Enrolment didn’t finish</Title>
          <Body tone="danger">{step.message}</Body>
          <Button label="Try again" onPress={() => setStep({ name: 'capture', attempt: Date.now() })} />
          <Button label="Back" variant="secondary" onPress={() => router.replace('/home')} />
        </Screen>
      );
    default:
      return (
        <Screen>
          <Title>Enrol your face</Title>
          <Body>We will ask you to turn your head or smile to prove you are really there, then take a few photos looking straight ahead.</Body>
          <Body>
            Only a numeric face template is sent to your company’s HRMS server, stored encrypted. No photo is kept on this phone or
            the server. HR must approve it, and you can ask HR to delete it at any time.
          </Body>
          <Button label="I agree, continue" onPress={() => setStep({ name: 'capture', attempt: Date.now() })} />
          <Button label="Cancel" variant="secondary" onPress={() => router.replace('/home')} />
        </Screen>
      );
  }
}
