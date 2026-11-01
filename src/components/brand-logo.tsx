import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { AppText } from './ui/app-text';

type BrandLogoProps = {
  size?: number;
  showWordmark?: boolean;
  muted?: boolean;
};

export function BrandLogo({ size = 30, showWordmark = true, muted = false }: BrandLogoProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Image
        source={require('@/assets/images/mascot.png')}
        style={{ width: size * 1.45, height: size }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
      {showWordmark ? (
        <AppText
          style={[styles.wordmark, { fontSize: size * 0.62, opacity: muted ? 0.75 : 1 }]}
          numberOfLines={1}>
          <Text style={{ color: theme.text }}>Trip</Text>
          <Text style={{ color: theme.primary }}>ede</Text>
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontWeight: '800',
    letterSpacing: -0.7,
  },
});
