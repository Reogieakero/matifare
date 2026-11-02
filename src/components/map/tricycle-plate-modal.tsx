import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { MaxContentWidth, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TricyclePlateModalProps = {
  visible: boolean;
  /** Draft text, owned by the screen so it can be cleared each time it opens. */
  value: string;
  onChangeValue: (value: string) => void;
  onCancel: () => void;
  /** Receives the typed body/plate number, or null when the rider skipped it. */
  onConfirm: (plateNumber: string | null) => void;
};

/**
 * Optional tricycle body/plate number prompt shown before a commute starts.
 * Confirming always starts tracking — the number itself is never required.
 */
export function TricyclePlateModal({
  visible,
  value,
  onChangeValue,
  onCancel,
  onConfirm,
}: TricyclePlateModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const confirm = () => {
    const plateNumber = value.trim().replace(/\s+/g, ' ').toUpperCase();
    onConfirm(plateNumber ? plateNumber : null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close without starting the trip"
          onPress={onCancel}
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
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: theme.primarySoft }]}>
              <Icon name="car" size={18} color={theme.primary} />
            </View>

            <View style={styles.headerCopy}>
              <AppText variant="subtitle">Whose tricycle is this?</AppText>
              <AppText variant="caption" tone="muted" style={styles.headerKicker}>
                BODY OR PLATE NUMBER · OPTIONAL
              </AppText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel and do not start the trip"
              onPress={onCancel}
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <Icon name="close" size={13} color={theme.textSecondary} weight="semibold" />
            </Pressable>
          </View>

          <AppText variant="bodySmall" tone="secondary" style={styles.body}>
            Add the tricycle&apos;s body or plate number so you can refer back to this ride.
            Leave it blank if you would rather skip it.
          </AppText>

          <TextInput
            value={value}
            onChangeText={onChangeValue}
            onSubmitEditing={confirm}
            placeholder="e.g. 1234 or ABC 1234"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={16}
            returnKeyType="done"
            accessibilityLabel="Tricycle body or plate number, optional"
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.borderStrong,
                color: theme.text,
              },
            ]}
          />

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel and do not start the trip"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: theme.borderStrong },
                pressed && styles.pressed,
              ]}>
              <AppText variant="label" tone="secondary" style={styles.secondaryText}>
                Cancel
              </AppText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                value.trim() ? 'Confirm the number and start tracking' : 'Start tracking'
              }
              onPress={confirm}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}>
              <AppText variant="label" style={[styles.primaryText, { color: theme.primaryText }]}>
                Start tracking
              </AppText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerKicker: {
    fontSize: 8,
    letterSpacing: 0.9,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0,
  },
  input: {
    height: 48,
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  secondaryButton: {
    flex: 0.8,
    height: 48,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 13,
  },
  primaryButton: {
    flex: 1.4,
    height: 48,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
