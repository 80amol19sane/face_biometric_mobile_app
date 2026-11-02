import { StyleSheet, View } from 'react-native';
import { space } from '../theme';
import { Body, IconBadge, Title, type IconName } from './ui';

interface ConsentProps {
  title: string;
  lead: string;
  points: { icon: IconName; text: string }[];
}

/** The explain-then-agree step before any camera use: what happens, what is kept. */
export function Consent({ title, lead, points }: ConsentProps) {
  return (
    <View style={styles.wrap}>
      <Title>{title}</Title>
      <Body>{lead}</Body>
      <View style={styles.points}>
        {points.map((p) => (
          <View key={p.text} style={styles.point}>
            <IconBadge name={p.icon} size={40} />
            <View style={styles.pointText}>
              <Body>{p.text}</Body>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md, paddingTop: space.lg },
  points: { gap: space.md, paddingTop: space.sm },
  point: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pointText: { flex: 1 },
});
