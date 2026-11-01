import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Brand, Gradients, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const tabConfig: Record<string, { label: string; icon: IconName }> = {
  home: { label: 'Home', icon: 'home' },
  trips: { label: 'Trips', icon: 'trips' },
  analytics: { label: 'Analytics', icon: 'analytics' },
  me: { label: 'Me', icon: 'person' },
};

/** Extra scroll padding so content clears the floating bar and add button. */
export const TabBarClearance = 112;

const hasLiquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

type GlassBackdropProps = {
  radius: number;
};

/** Frosted white glass: native Liquid Glass on iOS 26+, blur fallback elsewhere. */
function GlassBackdrop({ radius }: GlassBackdropProps) {
  if (hasLiquidGlass) {
    return (
      <>
        <GlassView
          glassEffectStyle="regular"
          tintColor="rgba(255,255,255,0.45)"
          colorScheme="light"
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.glassVeil]} />
      </>
    );
  }

  return (
    <>
      <BlurView
        intensity={Platform.OS === 'android' ? 80 : 60}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.fallbackVeil]} />
    </>
  );
}

export function GlassTabBar({ state, descriptors, navigateToTab, insets }: BottomTabBarProps) {
  const router = useRouter();
  const theme = useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardVisible) {
    return null;
  }

  const activeKey = state.routes[state.index]?.key;

  const addTrip = () => {
    router.navigate({
      pathname: '/home',
      params: { focus: 'estimator', t: Date.now().toString() },
    });
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(320).springify().damping(18)}
      exiting={FadeOutDown.duration(200)}
      pointerEvents="box-none"
      style={[
        styles.overlay,
        { paddingBottom: Math.max(insets.bottom, 10) + Spacing.sm },
      ]}>
      <View style={styles.barShadow}>
        <View style={styles.bar}>
          <GlassBackdrop radius={33} />

          <View style={styles.tabs}>
            {state.routes.map((route) => {
              const config = tabConfig[route.name];
              if (!config) return null;

              const focused = route.key === activeKey;
              const options = descriptors[route.key]?.options;
              const color = focused ? theme.primary : theme.textMuted;

              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={options?.tabBarAccessibilityLabel ?? `${config.label} tab`}
                  onPress={() => navigateToTab(route.key)}
                  style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
                  <View style={styles.iconPill}>
                    <Icon
                      name={config.icon}
                      size={19}
                      color={color}
                      weight={focused ? 'semibold' : 'regular'}
                    />
                  </View>
                  <AppText style={[styles.label, { color }]}>{config.label}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={[styles.addShadow, Shadows.glow ?? {}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add trip"
          accessibilityHint="Opens a new fare estimate"
          onPress={addTrip}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundImage: Gradients.brand, borderColor: 'rgba(255,255,255,0.55)' },
            pressed && styles.addPressed,
          ]}>
          <Icon name="plus" size={28} color={theme.onPrimary} weight="semibold" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  barShadow: {
    flex: 1,
    borderRadius: 33,
    ...Platform.select({
      ios: {
        shadowColor: Brand.blueDeep,
        shadowOpacity: 0.3,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 9 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  bar: {
    flex: 1,
    height: 66,
    borderRadius: 33,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  glassVeil: {
    backgroundColor: 'rgba(226,232,240,0.52)',
  },
  fallbackVeil: {
    backgroundColor: 'rgba(226,232,240,0.6)',
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 7,
  },
  iconPill: {
    width: 44,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.6,
  },
  addShadow: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  addButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.92,
  },
});
