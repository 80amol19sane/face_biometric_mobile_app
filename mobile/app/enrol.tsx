import { router } from 'expo-router';
import { useState } from 'react';
import { ApiError } from '../src/api/http';
import { enrolFace, myStatus, type TemplateStatus } from '../src/api/faceBiometric';
import { Consent } from '../src/components/Consent';
import { FaceCamera } from '../src/components/FaceCamera';
import { Result } from '../src/components/Result';
import { Button, Screen } from '../src/components/ui';
import { ensureDevice } from '../src/device/registry';
import { ENROL_FRAMES, MODEL_VERSION } from '../src/face/config';
import { bytesToBase64, embeddingBytes } from '../src/lib/embedding';
import { useSession } from '../src/state/session';

type Step =
  | { name: 'consent' }
  | { name: 'capture'; attempt: number }
  | { name: 'saving' }
  | { name: 'done'; status: Exclude<TemplateStatus, null> }
  | { name: 'failed'; message: string };

export default function Enrol() {
  const { user } = useSession();
  const [step, setStep] = useState<Step>({ name: 'consent' });
  const capture = () => setStep({ name: 'capture', attempt: Date.now() });

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
      return <FaceCamera key={step.attempt} frames={ENROL_FRAMES} onEmbedding={save} onFailure={(message) => setStep({ name: 'failed', message })} onCancel={() => router.back()} />;
    case 'saving':
      return <Result icon="time-outline" tone="accent" title="Saving…" body="Registering this phone and your face." />;
    case 'done':
      return (
        <Result
          icon="checkmark-circle"
          tone="success"
          title={step.status === 'Active' ? 'You’re enrolled' : 'Sent for approval'}
          body={step.status === 'Active' ? 'You can check in now.' : 'HR needs to approve your face before you can check in. You’ll see it on the home screen once they do.'}
          actions={<Button label="Done" onPress={() => router.replace('/home')} />}
        />
      );
    case 'failed':
      return (
        <Result
          icon="alert-circle"
          tone="danger"
          title="Enrolment didn’t finish"
          body={step.message}
          bodyTone="danger"
          actions={
            <>
              <Button label="Try again" icon="refresh" onPress={capture} />
              <Button label="Back" variant="ghost" onPress={() => router.back()} />
            </>
          }
        />
      );
    default:
      return (
        <Screen
          footer={
            <>
              <Button label="I agree, continue" onPress={capture} />
              <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
            </>
          }
        >
          <Consent
            title="Enrol your face"
            lead="A short check, then a few photos looking straight ahead."
            points={[
              { icon: 'happy-outline', text: 'You’ll be asked to turn your head or smile, to show you’re really there.' },
              { icon: 'lock-closed-outline', text: 'Only a numeric face template is sent, stored encrypted. No photo is kept.' },
              { icon: 'shield-checkmark-outline', text: 'HR approves it before it works. You can ask HR to delete it any time.' },
            ]}
          />
        </Screen>
      );
  }
}
