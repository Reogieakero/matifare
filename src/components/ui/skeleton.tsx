import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SkeletonProps = {
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** Override the placeholder color (defaults to the theme's element surface). */
  color?: string;
};

/**
 * A softly pulsing placeholder block used to build skeleton screens.
 */
export function Skeleton({ style, radius = Radii.sm, color }: SkeletonProps) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress]);

  const pulse = useAnimatedStyle(() => ({
    opacity: 0.5 + progress.value * 0.45,
  }));

  return (
    <Animated.View
      style={[
        styles.block,
        { backgroundColor: color ?? theme.backgroundElement, borderRadius: radius },
        pulse,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
  },
});
