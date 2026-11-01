import { forwardRef, useEffect, useImperativeHandle, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { MaxContentWidth, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Screen-reader label for the backdrop tap target. */
  closeLabel: string;
  icon: IconName;
  title: string;
  titleStyle?: StyleProp<TextStyle>;
  subtitle?: string;
  children?: ReactNode;
  /** Optional pinned block below the scrollable content. */
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

const SPRING = { damping: 26, stiffness: 240, mass: 0.9 };

export type BottomSheetHandle = {
  /** Animate the sheet out, then call `onClose`. */
  close: () => void;
};

/**
 * Shared bottom-sheet shell used by the fare matrix and the data notice.
 * Slides up over a dimmed backdrop and can be dismissed by drag or backdrop tap.
 */
export const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(function BottomSheet(
  {
    visible,
    onClose,
    closeLabel,
    icon,
    title,
    titleStyle,
    subtitle,
    children,
    footer,
    contentContainerStyle,
  },
  ref,
) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const translateY = useSharedValue(windowHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    translateY.value = windowHeight;
    backdropOpacity.value = 0;
    translateY.value = withSpring(0, SPRING);
    backdropOpacity.value = withTiming(1, { duration: 260 });
  }, [visible, windowHeight, backdropOpacity, translateY]);

  const close = () => {
    translateY.value = withTiming(
      windowHeight,
      { duration: 260, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
    backdropOpacity.value = withTiming(0, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  };

  useImperativeHandle(ref, () => ({ close }));

  const panGesture = Gesture.Pan()
    .activeOffsetY(6)
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 110 || event.velocityY > 900) {
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, SPRING);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, 220], [1, 0.35]),
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent>
      <GestureHandlerRootView style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={close}
            style={StyleSheet.absoluteFill}
          />

          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.lg,
                ...(Shadows.card ?? {}),
              },
              sheetStyle,
            ]}>
            <GestureDetector gesture={panGesture}>
              <View style={styles.dragArea}>
                <Animated.View
                  style={[styles.handle, { backgroundColor: theme.borderStrong }, handleStyle]}
                />

                <View style={styles.header}>
                  <View style={[styles.headerIcon, { backgroundColor: theme.primarySoft }]}>
                    <Icon name={icon} size={18} color={theme.primary} />
                  </View>
                  <View style={styles.headerCopy}>
                    <AppText variant="title" style={titleStyle}>
                      {title}
                    </AppText>
                    {subtitle ? (
                      <AppText variant="bodySmall" tone="secondary">
                        {subtitle}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              </View>
            </GestureDetector>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scrollArea}
              contentContainerStyle={[styles.content, contentContainerStyle]}>
              {children}
            </ScrollView>

            {footer}
          </Animated.View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
    maxHeight: '88%',
  },
  dragArea: {
    gap: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  scrollArea: {
    flexShrink: 1,
  },
  content: {
    gap: Spacing.md,
  },
});
