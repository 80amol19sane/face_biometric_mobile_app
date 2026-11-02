import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ApiError } from '../src/api/http';
import { enrolEmployeeFace } from '../src/api/review';
import { Consent } from '../src/components/Consent';
import { FaceCamera } from '../src/components/FaceCamera';
import { Result } from '../src/components/Result';
import { Button, Screen } from '../src/components/ui';
import { ENROL_FRAMES, MODEL_VERSION } from '../src/face/config';
import { bytesToBase64, embeddingBytes } from '../src/lib/embedding';

type Step = { name: 'consent' } | { name: 'capture'; attempt: number } | { name: 'saving' } | { name: 'done' } | { name: 'failed'; message: string };

/** HR enrols an employee's face in person, on HR's phone, with the employee in front of the camera. */
export default function EnrolEmployee() {
  const { employee, name } = useLocalSearchParams<{ employee: string; name: string }>();
  const [step, setStep] = useState<Step>({ name: 'consent' });
  const capture = () => setStep({ name: 'capture', attempt: Date.now() });

  const save = async (embedding: Float32Array) => {
    setStep({ name: 'saving' });
    try {
      await enrolEmployeeFace(employee, bytesToBase64(embeddingBytes(embedding)), MODEL_VERSION);
      setStep({ name: 'done' });
    } catch (e) {
      setStep({ name: 'failed', message: e instanceof ApiError ? e.message : 'Could not save the face.' });
    }
  };

  switch (step.name) {
    case 'capture':
      return <FaceCamera key={step.attempt} frames={ENROL_FRAMES} onEmbedding={save} onFailure={(message) => setStep({ name: 'failed', message })} onCancel={() => router.back()} />;
    case 'saving':
      return <Result icon="time-outline" tone="accent" title="Saving…" />;
    case 'done':
      return (
        <Result
          icon="checkmark-circle"
          tone="success"
          title={`${name} is enrolled`}
          body="Their face is active. On their own phone they sign in once and tap Check in, which registers that phone."
          actions={<Button label="Done" onPress={() => router.back()} />}
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
              <Button label={`${name} agrees, continue`} onPress={capture} />
              <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
            </>
          }
        >
          <Consent
            title={`Enrol ${name}`}
            lead={`${employee} must be in front of the camera. Continue only if they agree.`}
            points={[
              { icon: 'happy-outline', text: 'They turn their head or smile, then look straight ahead for a few photos.' },
              { icon: 'lock-closed-outline', text: 'Only a numeric face template is stored, encrypted. No photo is kept.' },
              { icon: 'shield-checkmark-outline', text: 'Your approval is recorded against it, and it is active at once.' },
            ]}
          />
        </Screen>
      );
  }
}
