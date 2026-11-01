import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Gradients, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'default' | 'small';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'default',
  icon,
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  accessibilityLabel,
}: AppButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const compact = size === 'small';

  const backgroundColor =
    variant === 'primary' ? 'transparent' : variant === 'secondary' ? theme.surfaceElevated : 'transparent';
  const textColor = variant === 'primary' ? theme.onPrimary : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.baseCompact,
        {
          backgroundColor,
          borderColor: variant === 'secondary' ? theme.border : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          opacity: isDisabled ? 0.45 : pressed ? 0.86 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'auto',
          paddingHorizontal: fullWidth ? Spacing.xl : Spacing.lg,
        },
        variant === 'primary' ? { backgroundImage: Gradients.brand } : null,
        style,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            <AppText
              variant="label"
              style={[styles.label, compact && styles.labelCompact, { color: textColor }]}>
              {label}
            </AppText>
            {icon ? (
              <View style={styles.icon}>
                <Icon name={icon} size={compact ? 15 : 18} color={textColor} weight="semibold" />
              </View>
            ) : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: Radii.lg,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  baseCompact: {
    height: 42,
    borderRadius: Radii.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  label: {
    fontSize: 16,
    letterSpacing: 0.1,
  },
  labelCompact: {
    fontSize: 13,
  },
  icon: {
    marginLeft: 2,
  },
});
