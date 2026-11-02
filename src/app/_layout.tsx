import { Stack } from 'expo-router';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { ActiveCommuteBar } from '@/components/navigation/active-commute-bar';
import { MapPreferenceProvider } from '@/hooks/use-map-preference';
import { ThemeProvider, useColorMode, useTheme } from '@/hooks/use-theme';
import { TripSessionProvider } from '@/hooks/use-trip-session';

SplashScreen.preventAutoHideAsync().catch(() => {
  // The splash screen can already be hidden during fast refresh.
});

// setOptions is not supported in Expo Go and only logs a warning there.
if (Constants.expoGoConfig == null) {
  SplashScreen.setOptions({
    duration: 350,
    fade: true,
  });
}

function RootNavigator() {
  const theme = useTheme();
  const colorMode = useColorMode();

  return (
    <>
      <StatusBar style={colorMode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'fade',
          animationDuration: 280,
        }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="map"
          options={{
            animation: 'slide_from_bottom',
            animationDuration: 320,
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        <Stack.Screen
          name="snapshot/[id]"
          options={{
            animation: 'fade',
            animationDuration: 220,
            contentStyle: { backgroundColor: theme.background },
          }}
        />
      </Stack>

      <ActiveCommuteBar />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <MapPreferenceProvider>
            <TripSessionProvider>
              <RootNavigator />
            </TripSessionProvider>
          </MapPreferenceProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export const unstable_settings = {
  anchor: 'index',
};
