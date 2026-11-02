import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TripSavedSuccess } from '@/components/map/trip-saved-success';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { MaxContentWidth, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TripSaveModalProps = {
  visible: boolean;
  /** Fare/distance line shown on the success screen. */
  summary?: string;
  onSave: () => Promise<void> | void;
  onDiscard: () => void;
  /** Called after the success animation finishes. */
  onClose: () => void;
};

/**
 * Shown after "End trip". The meter has already stopped, so both actions just
 * decide whether the ride is written to the on-device trip history.
 */
export function TripSaveModal({
  visible,
  summary,
  onSave,
  onDiscard,
  onClose,
}: TripSaveModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'confirm' | 'saving' | 'saved'>('confirm');
  const [wasVisible, setWasVisible] = useState(visible);
  const visibleRef = useRef(visible);
  const onCloseRef = useRef(onClose);

  // Reset the flow each time the modal opens (and when it hides). Adjusting
  // state during render avoids the extra commit a setState-in-effect causes.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    setPhase('confirm');
  }

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Let the celebration play, then close on its own. Read onClose from a ref so
  // parent re-renders (e.g. live GPS updates) don't restart the timer.
  useEffect(() => {
    if (phase !== 'saved') return;

    const timer = setTimeout(() => onCloseRef.current(), 1900);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleSave = async () => {
    if (phase !== 'confirm') return;

    setPhase('saving');
    try {
      await onSave();
      if (visibleRef.current) setPhase('saved');
    } catch {
      if (visibleRef.current) setPhase('confirm');
    }
  };

  const close = phase === 'saved' ? onClose : onDiscard;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            phase === 'saved' ? 'Close the success message' : 'Close without saving the trip'
          }
          onPress={close}
          style={styles.backdrop}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              marginBottom: Math.max(insets.bottom, Spacing.lg),
              ...(Shadows.card ?? {}),
            },
          ]}>
          {phase === 'saved' ? (
            <TripSavedSuccess summary={summary} />
          ) : (
            <>
              <View style={styles.header}>
                <View style={[styles.headerIcon, { backgroundColor: theme.primarySoft }]}>
                  <Icon name="trips" size={18} color={theme.primary} />
                </View>

                <AppText variant="subtitle" style={styles.title}>
                  Save this trip?
                </AppText>
              </View>

              <AppText variant="bodySmall" tone="secondary" style={styles.body}>
                Do you want to keep this ride on this device so you can review it later in
                Trips? Nothing leaves your phone.
              </AppText>

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Discard this trip"
                  accessibilityState={{ disabled: phase === 'saving' }}
                  disabled={phase === 'saving'}
                  onPress={onDiscard}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { borderColor: theme.borderStrong },
                    pressed && styles.pressed,
                  ]}>
                  <AppText variant="label" tone="secondary" style={styles.buttonText}>
                    Discard
                  </AppText>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save the trip details"
                  accessibilityState={{ disabled: phase === 'saving', busy: phase === 'saving' }}
                  disabled={phase === 'saving'}
                  onPress={() => void handleSave()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: theme.primary },
                    pressed && styles.pressed,
                  ]}>
                  <AppText
                    variant="label"
                    style={[styles.buttonText, { color: theme.primaryText }]}>
                    {phase === 'saving' ? 'Saving…' : 'Save trip'}
                  </AppText>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  card: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1.4,
    height: 48,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
