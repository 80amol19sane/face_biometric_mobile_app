import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { employeeProfile, enrolFace } from '../../../src/api/admin';
import { ApiError } from '../../../src/api/http';
import { AdminPage } from '../../../src/components/admin/AdminPage';
import { Group } from '../../../src/components/admin/parts';
import { Avatar } from '../../../src/components/Avatar';
import { FaceCamera } from '../../../src/components/FaceCamera';
import { Result } from '../../../src/components/Result';
import { SettingRow } from '../../../src/components/SettingRow';
import { Body, Button, Caption } from '../../../src/components/ui';
import { ENROL_FRAMES, MODEL_VERSION } from '../../../src/face/config';
import { bytesToBase64, embeddingBytes } from '../../../src/lib/embedding';
import { useLoad } from '../../../src/state/useLoad';
import { Ionicons } from '@expo/vector-icons';
import { space, styleFactory, type, useStyles, useTheme } from '../../../src/theme';

type Step = { name: 'details' } | { name: 'capture'; attempt: number } | { name: 'saving' } | { name: 'done' } | { name: 'failed'; message: string };

/** Register or replace a face: confirm who, get consent, capture with liveness, store. */
export default function RegisterFace() {
  const styles = useStyles(createStyles);
  const { color } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: p, error } = useLoad(() => employeeProfile(id), [id]);
  const [step, setStep] = useState<Step>({ name: 'details' });
  const [consent, setConsent] = useState(false);
  const first = p?.employee_name.split(' ')[0] ?? 'They';

  const save = async (embedding: Float32Array) => {
    setStep({ name: 'saving' });
    try {
      await enrolFace(id, bytesToBase64(embeddingBytes(embedding)), MODEL_VERSION);
      setStep({ name: 'done' });
    } catch (e) {
      setStep({ name: 'failed', message: e instanceof ApiError ? e.message : 'Could not save the face.' });
    }
  };

  switch (step.name) {
    case 'capture':
      return <FaceCamera key={step.attempt} frames={ENROL_FRAMES} onEmbedding={save} onFailure={(message) => setStep({ name: 'failed', message })} onCancel={() => setStep({ name: 'details' })} />;
    case 'saving':
      return <Result icon="time-outline" tone="accent" title="Storing the template…" body="Turning the samples into an encrypted face template." />;
    case 'done':
      return (
        <Result
          icon="checkmark-circle"
          tone="success"
          title={`${first}'s face is registered`}
          body="Template generated from the samples and stored encrypted. No photo is kept. They can use the kiosk straight away."
          actions={
            <>
              <Button label={`Set a PIN for ${first}`} icon="keypad-outline" onPress={() => router.replace(`/admin/pin/${id}`)} />
              <Button label="Register another employee" variant="tonal" onPress={() => router.replace('/admin/employees')} />
              <Button label="Back to profile" variant="ghost" onPress={() => router.replace(`/admin/employee/${id}`)} />
            </>
          }
        />
      );
    case 'failed':
      return (
        <Result
          icon="alert-circle"
          tone="danger"
          title="Registration didn’t finish"
          body={step.message}
          bodyTone="danger"
          actions={
            <>
              <Button label="Try again" icon="refresh" onPress={() => setStep({ name: 'capture', attempt: Date.now() })} />
              <Button label="Back" variant="ghost" onPress={() => setStep({ name: 'details' })} />
            </>
          }
        />
      );
  }

  return (
    <AdminPage
      title={p?.face ? 'Update face' : 'Register face'}
      eyebrow="STEP 1 OF 2 · VERIFY DETAILS"
      back
      error={error}
      footer={<Button label="Open camera" icon="camera-outline" disabled={!p || !consent} onPress={() => setStep({ name: 'capture', attempt: Date.now() })} />}
    >
      {p && (
        <>
          <Text style={styles.heading}>Is this the right person?</Text>
          <View style={styles.who}>
            <Avatar name={p.employee_name} size={60} />
            <View style={styles.flex}>
              <Text style={styles.name}>{p.employee_name}</Text>
              <Caption>{[p.designation, p.department?.replace(/ - [A-Z]+$/, '')].filter(Boolean).join(' · ')}</Caption>
            </View>
          </View>
          <Group>
            <SettingRow label="Employee ID" value={p.employee} />
            <SettingRow label="Mobile" value={p.mobile || '—'} />
            <SettingRow label="Current face" value={p.face ? `${p.face.status} since ${p.face.creation.slice(0, 10)}` : 'None'} />
          </Group>
          {p.face && <Body>The old face keeps working until the new one is saved. If you cancel part-way, nothing changes.</Body>}
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent(!consent)} style={styles.consent}>
            <View style={[styles.box, consent && styles.boxOn]}>{consent && <Ionicons name="checkmark" size={18} color={color.accentInk} />}</View>
            <Text style={styles.consentText}>{first} is here in person and agrees to HR storing a numeric face template for attendance. No photo is kept.</Text>
          </Pressable>
          <Caption>You cannot register your own face. Ask another HR Manager.</Caption>
        </>
      )}
    </AdminPage>
  );
}

const createStyles = styleFactory((color) => ({
  flex: { flex: 1 },
  heading: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3, color: color.ink },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md - 2, borderRadius: 20, backgroundColor: color.surface },
  name: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: color.ink },
  consent: { flexDirection: 'row', gap: space.md - 2, alignItems: 'flex-start', padding: space.md - 2, borderRadius: 20, backgroundColor: color.surface },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: color.muted, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: color.accent, borderColor: color.accent },
  consentText: { flex: 1, ...type.body, fontSize: 15, lineHeight: 22, color: color.ink },
}));
