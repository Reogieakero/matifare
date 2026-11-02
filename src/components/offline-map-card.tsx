import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { OfflineMapCanvas } from '@/components/map/offline-map-canvas';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTripLocation } from '@/hooks/use-trip-session';
import { OfflineMap, formatCoordinate } from '@/lib/offline-map';

const MAP_HEIGHT = 194;

export function OfflineMapCard() {
  const theme = useTheme();
  const {
    acquireLocation,
    location,
    locationStatus: status,
    canAskAgain,
    locationError: error,
    refreshLocation: refresh,
    openLocationSettings: openSettings,
  } = useTripLocation();

  useFocusEffect(
    useCallback(() => {
      return acquireLocation();
    }, [acquireLocation]),
  );

  const hasFix = Boolean(location);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border, ...(Shadows.card ?? {}) },
      ]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIcon, { backgroundColor: theme.primarySoft }]}>
            <Icon name="location" size={13} color={theme.primary} />
          </View>
          <View style={styles.headerCopy}>
            <AppText variant="label" style={styles.headerTitle}>
              Live location
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.headerKicker}>
              OFFLINE MAP · {OfflineMap.city.toUpperCase()}
            </AppText>
          </View>
        </View>

        <View
          style={[
            styles.statusPill,
            { backgroundColor: hasFix ? theme.primarySoft : theme.backgroundElement },
          ]}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: hasFix ? theme.primary : theme.textMuted },
            ]}
          />
          <AppText
            variant="caption"
            style={[styles.statusText, { color: hasFix ? theme.primary : theme.textMuted }]}>
            {hasFix ? 'LIVE GPS' : status === 'locating' || status === 'checking' ? 'LOCATING' : 'GPS OFF'}
          </AppText>
        </View>
      </View>

      <OfflineMapCanvas
        height={MAP_HEIGHT}
        location={location}
        status={status}
        canAskAgain={canAskAgain}
        error={error}
        onRetry={refresh}
        onOpenSettings={openSettings}
        onExpand={() => router.push('/map')}
      />

      <View style={styles.footer}>
        <View style={styles.footerCopy}>
          <AppText variant="label" style={styles.footerTitle}>
            {OfflineMap.city}
            <AppText variant="caption" tone="muted">
              {'  '}· DAVAO ORIENTAL
            </AppText>
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.footerCoords}>
            {location
              ? `${formatCoordinate(location.latitude, 'lat')}  ${formatCoordinate(
                  location.longitude,
                  'lng',
                )}`
              : 'Waiting for your GPS position'}
          </AppText>
        </View>

        <View style={[styles.accuracyPill, { backgroundColor: theme.backgroundElement }]}>
          <Icon name={hasFix ? 'location' : 'wifi-off'} size={10} color={theme.textMuted} />
          <AppText variant="caption" tone="muted" style={styles.accuracyText}>
            {hasFix && location?.accuracy
              ? `± ${Math.round(location.accuracy)} M`
              : hasFix
                ? 'GPS'
                : 'OFFLINE'}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    gap: 1,
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  headerKicker: {
    fontSize: 8,
    letterSpacing: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 8,
    letterSpacing: 0.9,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerCopy: {
    flex: 1,
    gap: 1,
  },
  footerTitle: {
    fontSize: 13,
  },
  footerCoords: {
    fontSize: 9,
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
  accuracyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  accuracyText: {
    fontSize: 8,
    letterSpacing: 0.6,
  },
});
