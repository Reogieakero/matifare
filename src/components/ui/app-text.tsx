import { Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextVariant =
  | 'hero'
  | 'display'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'mono';

export type TextTone =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'primary'
  | 'accent'
  | 'inverse'
  | 'danger'
  | 'onPrimary';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  align?: TextStyle['textAlign'];
};

const variants: Record<TextVariant, TextStyle> = {
  hero: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -1.4,
  },
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  mono: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
};

export function AppText({
  variant = 'body',
  tone = 'default',
  align,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();

  const toneColor: Record<TextTone, string> = {
    default: theme.text,
    secondary: theme.textSecondary,
    muted: theme.textMuted,
    primary: theme.primary,
    accent: theme.accent,
    inverse: '#F7FAFC',
    danger: theme.danger,
    onPrimary: theme.onPrimary,
  };

  return (
    <Text
      style={[variants[variant], { color: toneColor[tone] }, align ? { textAlign: align } : null, style]}
      {...rest}
    />
  );
}
