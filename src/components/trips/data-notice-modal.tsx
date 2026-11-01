import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type DataNoticeModalProps = {
  visible: boolean;
  onClose: () => void;
};

const points: { icon: IconName; text: string }[] = [
  {
    icon: 'trips',
    text: 'Saved commutes, your selected fare tier and preferences are stored in this phone’s local storage.',
  },
  {
    icon: 'wifi-off',
    text: 'Nothing is uploaded anywhere. No account is needed and the app works without a connection.',
  },
  {
    icon: 'shield',
    text: 'Only this device can read your commutes. Uninstalling the app or clearing its data erases them for good.',
  },
];

export function DataNoticeModal({ visible, onClose }: DataNoticeModalProps) {
  const theme = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      closeLabel="Close data notice"
      icon="lock"
      title="Your data stays here"
      subtitle="Tripede keeps everything on this phone only."
      footer={
        <View style={[styles.footer, { backgroundColor: theme.primarySoft }]}>
          <Icon name="lock" size={15} color={theme.primary} />
          <AppText variant="caption" tone="secondary" style={styles.footerText}>
            NO ACCOUNT · NO CLOUD SYNC · WORKS OFFLINE
          </AppText>
        </View>
      }>
      {points.map((point) => (
        <View key={point.text} style={styles.point}>
          <View style={[styles.pointIcon, { backgroundColor: theme.backgroundElement }]}>
            <Icon name={point.icon} size={16} color={theme.primary} />
          </View>
          <AppText variant="bodySmall" tone="secondary" style={styles.pointText}>
            {point.text}
          </AppText>
        </View>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  pointIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: {
    flex: 1,
    paddingTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  footerText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
});
