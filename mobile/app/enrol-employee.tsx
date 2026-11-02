import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ApiError } from '../src/api/http';
import { enrolEmployeeFace } from '../src/api/review';
import { FaceCamera } from '../src/components/FaceCamera';
import { Body, Button, Screen, Title } from '../src/components/ui';
import { ENROL_FRAMES, MODEL_VERSION } from '../src/face/config';
import { bytesToBase64, embeddingBytes } from '../src/lib/embedding';

type Step = { name: 'consent' } | { name: 'capture'; attempt: number } | { name: 'saving' } | { name: 'done' } | { name: 'failed'; message: string };

/** HR enrols an employee's face in person, on HR's phone, with the employee in front of the camera. */
export default function EnrolEmployee() {
  const { employee, name } = useLocalSearchParams<{ employee: string; name: string }>();
  const [step, setStep] = useState<Step>({ name: 'consent' });

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
      return <FaceCamera key={step.attempt} frames={ENROL_FRAMES} onEmbedding={save} onFailure={(message) => setStep({ name: 'failed', message })} />;
    case 'saving':
      return (
        <Screen>
          <Title>Saving…</Title>
        </Screen>
      );
    case 'done':
      return (
        <Screen>
          <Title>{name} is enrolled</Title>
          <Body>
            Their face is active now. On their own phone they sign in once and tap Check in; that registers the phone.
          </Body>
          <Button label="Done" onPress={() => router.back()} />
        </Screen>
      );
    case 'failed':
      return (
        <Screen>
          <Title>Enrolment didn’t finish</Title>
          <Body tone="danger">{step.message}</Body>
          <Button label="Try again" onPress={() => setStep({ name: 'capture', attempt: Date.now() })} />
          <Button label="Back" variant="secondary" onPress={() => router.back()} />
        </Screen>
      );
    default:
      return (
        <Screen>
          <Title>Enrol {name}</Title>
          <Body>{employee}</Body>
          <Body>
            {name} must be in front of the camera. They will be asked to turn their head or smile, then look straight ahead for a few photos.
          </Body>
          <Body>
            Only a numeric face template is stored, encrypted, on your company’s HRMS server. No photo is kept. Your approval is recorded
            against it.
          </Body>
          <Body>Continue only if {name} has agreed to this.</Body>
          <Button label={`${name} agrees, continue`} onPress={() => setStep({ name: 'capture', attempt: Date.now() })} />
          <Button label="Cancel" variant="secondary" onPress={() => router.back()} />
        </Screen>
      );
  }
}
