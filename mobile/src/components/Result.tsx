import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { space, type Tone } from '../theme';
import { Body, IconBadge, Screen, Title, type IconName } from './ui';

interface ResultProps {
  icon: IconName;
  tone: Tone;
  title: string;
  body?: string;
  bodyTone?: 'neutral' | 'danger' | 'success';
  /** Buttons, pinned at the bottom. */
  actions?: ReactNode;
}

/** The end state of a flow: one icon, one sentence, the next step. */
export function Result({ icon, tone, title, body, bodyTone, actions }: ResultProps) {
  return (
    <Screen footer={actions}>
      <View style={styles.center}>
        <IconBadge name={icon} tone={tone} size={88} />
        <Title>{title}</Title>
        {body && <Body tone={bodyTone}>{body}</Body>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', gap: space.md },
});
