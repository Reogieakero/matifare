import { Tabs } from 'expo-router';

import { GlassTabBar } from '@/components/navigation/glass-tab-bar';

const tabs: { name: string; title: string }[] = [
  { name: 'home', title: 'Home' },
  { name: 'trips', title: 'Trips' },
  { name: 'analytics', title: 'Analytics' },
  { name: 'me', title: 'Me' },
];

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: `${tab.title} tab`,
          }}
        />
      ))}
    </Tabs>
  );
}
