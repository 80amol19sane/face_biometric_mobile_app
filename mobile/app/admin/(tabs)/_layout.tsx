import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name={icon} size={size} color={color} />,
});

export default function AdminTabs() {
  const { color } = useTheme();
  // Lift the bar above the phone's navigation buttons or gesture line.
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: color.muted,
        tabBarStyle: { backgroundColor: color.surface, borderTopColor: color.line, height: 64 + bottom, paddingBottom: bottom + 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={tab('Overview', 'grid-outline')} />
      <Tabs.Screen name="employees" options={tab('Employees', 'people-outline')} />
      <Tabs.Screen name="logs" options={tab('Logs', 'time-outline')} />
      <Tabs.Screen name="more" options={tab('More', 'ellipsis-horizontal')} />
    </Tabs>
  );
}
