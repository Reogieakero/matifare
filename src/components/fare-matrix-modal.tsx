import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet, type BottomSheetHandle } from '@/components/ui/bottom-sheet';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { FareMatrix, type FareTier } from '@/constants/fare-matrix';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FareMatrixModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedTierId?: number;
  onSelectTier?: (tier: FareTier) => void;
};

export function FareMatrixModal({
  visible,
  onClose,
  selectedTierId,
  onSelectTier,
}: FareMatrixModalProps) {
  const theme = useTheme();
  const sheetRef = useRef<BottomSheetHandle>(null);

  const chooseTier = (tier: FareTier) => {
    onSelectTier?.(tier);
    sheetRef.current?.close();
  };

  return (
    <BottomSheet
      ref={sheetRef}
      visible={visible}
      onClose={onClose}
      closeLabel="Close fare matrix"
      icon="wallet"
      title="Fare matrix"
      subtitle="Tap the fuel tier that matches the current fuel price."
      contentContainerStyle={styles.tableContent}
      footer={
        <View style={[styles.footer, { backgroundColor: theme.primarySoft }]}>
          <Icon name="route" size={15} color={theme.primary} />
          <AppText variant="caption" tone="secondary" style={styles.footerText}>
            BASE FARE COVERS THE FIRST 3.0 KM. THE PER-KM RATE APPLIES TO EACH
            ADDED KILOMETER.
          </AppText>
        </View>
      }>
      <View style={[styles.headerRow, { borderColor: theme.border }]}>
        <AppText variant="caption" tone="muted" style={[styles.cell, styles.tierCell]}>
          PRICE TIER
        </AppText>
        <AppText variant="caption" tone="muted" style={[styles.cell, styles.fuelCell]}>
          FUEL PRICE RANGE (PER LITER)
        </AppText>
        <AppText variant="caption" tone="muted" style={[styles.cell, styles.rateCell]}>
          BASE FARE (0–3.0 KM)
        </AppText>
        <AppText variant="caption" tone="muted" style={[styles.cell, styles.rateCell]}>
          RATE PER ADDED KM
        </AppText>
      </View>

      {FareMatrix.map((row, index) => {
        const selected = row.id === selectedTierId;

        return (
          <Pressable
            key={row.tier}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${row.tier}, ${row.fuelPrice} per liter, ${row.baseFare} base fare, ${row.perKm} per added kilometer`}
            onPress={() => chooseTier(row)}
            style={({ pressed }) => [
              styles.row,
              {
                borderColor: theme.border,
                backgroundColor: selected
                  ? theme.primarySoft
                  : index % 2 === 0
                    ? theme.backgroundElement
                    : 'transparent',
              },
              pressed && styles.rowPressed,
            ]}>
            <View style={[styles.tierCell, styles.tierRow]}>
              <AppText
                variant="label"
                style={selected ? { color: theme.primary, fontWeight: '700' } : undefined}>
                {row.tier}
              </AppText>
              {selected ? (
                <Icon name="check" size={13} color={theme.primary} weight="bold" />
              ) : null}
            </View>
            <AppText
              variant="label"
              tone="secondary"
              style={[styles.cell, styles.fuelCell, styles.number]}>
              {row.fuelPrice}
            </AppText>
            <AppText variant="label" style={[styles.cell, styles.rateCell, styles.number]}>
              {row.baseFare}
            </AppText>
            <AppText variant="label" style={[styles.cell, styles.rateCell, styles.number]}>
              {row.perKm}
            </AppText>
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  tableContent: {
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 11,
    borderRadius: Radii.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  cell: {
    fontSize: 10,
    lineHeight: 14,
  },
  tierCell: {
    flex: 0.82,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fuelCell: {
    flex: 1.55,
  },
  rateCell: {
    flex: 1,
    textAlign: 'right',
  },
  number: {
    fontVariant: ['tabular-nums'],
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
