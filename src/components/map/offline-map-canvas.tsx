import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type NativeTouchEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useMapPalette } from '@/hooks/use-map-preference';
import { useTheme } from '@/hooks/use-theme';
import type { LocationStatus, UserLocation } from '@/hooks/use-user-location';
import {
  MapBoundsMeters,
  OfflineMap,
  buildAreaPath,
  buildLinePath,
  buildPlacePoints,
  buildRoadPaths,
  buildTrackPath,
  isInsideMapBounds,
  projectPoint,
  type MapPoint,
  type TrackPoint,
} from '@/lib/offline-map';

const DEFAULT_SPAN_METERS = 2300;
const DEFAULT_MAX_SPAN_METERS = 12000;
const MIN_SPAN_METERS = 350;
const ZOOM_DURATION_MS = 260;
const RECENTER_DURATION_MS = 420;

const ROAD_CLASSES = {
  service: ['service'],
  minor: ['residential', 'unclassified', 'living_street', 'road', 'construction'],
  paths: ['footway', 'path', 'steps', 'track', 'cycleway', 'pedestrian'],
  tertiary: ['tertiary', 'tertiary_link'],
  secondary: ['secondary', 'secondary_link'],
  major: ['primary', 'primary_link', 'trunk', 'trunk_link', 'motorway', 'motorway_link'],
} as const;

/**
 * Static city geometry is identical for every map instance (home preview and the
 * full map screen). Building it once at module scope keeps the second instance
 * cheap, so opening the map does not block the navigation animation.
 */
const STATIC_PATHS = {
  waterAreas: buildAreaPath(OfflineMap.water.filter((feature) => feature.area)),
  waterLines: buildLinePath(OfflineMap.water.filter((feature) => !feature.area)),
  green: buildAreaPath(OfflineMap.green),
  coast: buildLinePath(OfflineMap.coastline),
  roads: {
    service: buildRoadPaths([...ROAD_CLASSES.service]),
    minor: buildRoadPaths([...ROAD_CLASSES.minor]),
    paths: buildRoadPaths([...ROAD_CLASSES.paths]),
    tertiary: buildRoadPaths([...ROAD_CLASSES.tertiary]),
    secondary: buildRoadPaths([...ROAD_CLASSES.secondary]),
    major: buildRoadPaths([...ROAD_CLASSES.major]),
  },
};

const STATIC_PLACE_POINTS = buildPlacePoints();

let cachedBuildingPath: string | null = null;

function getBuildingPath() {
  if (cachedBuildingPath == null) {
    cachedBuildingPath = buildAreaPath(OfflineMap.buildings);
  }
  return cachedBuildingPath;
}

type Viewport = {
  center: MapPoint;
  span: number;
};

type GestureState = {
  startCenter: MapPoint;
  startSpan: number;
  startDistance: number;
};

export type OfflineMapCanvasProps = {
  height: number;
  location: UserLocation | null;
  /** Accepted fixes for the active trip; drawn as a line on the map. */
  track?: TrackPoint[];
  status: LocationStatus;
  canAskAgain: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenSettings: () => void;
  onExpand?: () => void;
  initialSpanMeters?: number;
  /** Camera position used before any gesture; defaults to the city center. */
  initialCenter?: MapPoint | null;
  maxSpanMeters?: number;
  bottomInset?: number;
  showChip?: boolean;
  showAttribution?: boolean;
  /** Hide the locate button when the map is showing a recorded route instead of a live fix. */
  showLocate?: boolean;
  /**
   * When false the canvas behaves like a still image: no panning, pinching or
   * zoom controls. Used by route snapshots, where the route must not move.
   */
  interactive?: boolean;
  rounded?: boolean;
  locateLabel?: string;
  style?: StyleProp<ViewStyle>;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function touchDistance(touches: readonly NativeTouchEvent[]) {
  if (touches.length < 2) return 0;
  const [first, second] = touches;
  return Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY);
}

function clampCenter(center: MapPoint): MapPoint {
  return {
    x: clamp(center.x, MapBoundsMeters.minX, MapBoundsMeters.maxX),
    y: clamp(center.y, MapBoundsMeters.minY, MapBoundsMeters.maxY),
  };
}

function placeFontSize(rank: number) {
  if (rank <= 0) return 13.5;
  if (rank === 1) return 12.5;
  if (rank === 2) return 11;
  if (rank <= 4) return 10;
  if (rank === 6) return 9;
  return 8.5;
}

function placeWeight(rank: number) {
  return rank <= 1 ? '700' : rank <= 4 ? '600' : '500';
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function OfflineMapCanvas({
  height,
  location,
  track,
  status,
  canAskAgain,
  error,
  onRetry,
  onOpenSettings,
  onExpand,
  initialSpanMeters = DEFAULT_SPAN_METERS,
  initialCenter,
  maxSpanMeters = DEFAULT_MAX_SPAN_METERS,
  bottomInset = 0,
  showChip = true,
  showAttribution = true,
  showLocate = true,
  interactive = true,
  rounded = true,
  locateLabel,
  style,
}: OfflineMapCanvasProps) {
  const theme = useTheme();
  const palette = useMapPalette();
  const [width, setWidth] = useState(0);
  const [manualCenter, setManualCenter] = useState<MapPoint>(
    () => initialCenter ?? projectPoint(OfflineMap.center.lat, OfflineMap.center.lng),
  );
  const [span, setSpan] = useState(initialSpanMeters);
  const [follow, setFollow] = useState(true);
  const [interacting, setInteracting] = useState(false);

  const locationInside =
    location !== null && isInsideMapBounds(location.latitude, location.longitude);
  const center =
    follow && location && locationInside
      ? projectPoint(location.latitude, location.longitude)
      : manualCenter;

  const viewportRef = useRef<Viewport>({ center, span });
  const widthRef = useRef(0);
  const gestureRef = useRef<GestureState>({
    startCenter: center,
    startSpan: span,
    startDistance: 0,
  });
  const frameRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const pendingViewportRef = useRef<Viewport | null>(null);
  const interactingRef = useRef(false);

  useEffect(() => {
    viewportRef.current = { center, span };
  }, [center, span]);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  useEffect(
    () => () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      if (animationRef.current != null) cancelAnimationFrame(animationRef.current);
    },
    [],
  );

  const scale = width > 0 ? width / span : 0;
  const unitsPerPixel = scale > 0 ? 1 / scale : 0;
  const hasFix = Boolean(location);
  const outsideCoverage = Boolean(location) && !locationInside;

  const commitViewport = useCallback((next: Viewport) => {
    viewportRef.current = next;
    setManualCenter(next.center);
    setSpan(next.span);
  }, []);

  const cancelFrame = useCallback(() => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const cancelAnimation = useCallback(() => {
    if (animationRef.current != null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // Gestures can fire many events per frame on both native and web. Keep only
  // the newest viewport and paint it once per animation frame.
  const scheduleViewport = useCallback(
    (next: Viewport) => {
      pendingViewportRef.current = next;
      if (frameRef.current != null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const pending = pendingViewportRef.current;
        if (!pending) return;
        pendingViewportRef.current = null;
        commitViewport(pending);
      });
    },
    [commitViewport],
  );

  const flushViewport = useCallback(() => {
    cancelFrame();
    const pending = pendingViewportRef.current;
    pendingViewportRef.current = null;
    if (pending) commitViewport(pending);
  }, [cancelFrame, commitViewport]);

  const animateViewport = useCallback(
    (
      targetCenter: MapPoint,
      targetSpan: number,
      onDone?: () => void,
      duration = ZOOM_DURATION_MS,
    ) => {
      cancelFrame();
      cancelAnimation();

      const from = viewportRef.current;
      const to: Viewport = {
        center: clampCenter(targetCenter),
        span: clamp(targetSpan, MIN_SPAN_METERS, maxSpanMeters),
      };
      const startedAt = Date.now();

      const step = () => {
        const progress = Math.min((Date.now() - startedAt) / duration, 1);
        const eased = easeOutCubic(progress);
        const next: Viewport = {
          center: {
            x: from.center.x + (to.center.x - from.center.x) * eased,
            y: from.center.y + (to.center.y - from.center.y) * eased,
          },
          span: from.span + (to.span - from.span) * eased,
        };

        viewportRef.current = next;
        setManualCenter(next.center);
        setSpan(next.span);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(step);
        } else {
          animationRef.current = null;
          onDone?.();
        }
      };

      animationRef.current = requestAnimationFrame(step);
    },
    [cancelAnimation, cancelFrame, maxSpanMeters],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setWidth(nextWidth);
    widthRef.current = nextWidth;
  };

  const recenter = () => {
    const target =
      location && locationInside
        ? projectPoint(location.latitude, location.longitude)
        : projectPoint(OfflineMap.center.lat, OfflineMap.center.lng);
    const shouldFollow = Boolean(location && locationInside);

    // Animate the camera first, then hand control back to the live GPS follow.
    setFollow(false);
    animateViewport(target, initialSpanMeters, () => setFollow(shouldFollow), RECENTER_DURATION_MS);
  };

  const zoomBy = (factor: number) => {
    const current = viewportRef.current;
    animateViewport(current.center, current.span * factor);
  };

  const finishGesture = useCallback(() => {
    flushViewport();
    gestureRef.current.startDistance = 0;
    interactingRef.current = false;
    setInteracting(false);
  }, [flushViewport]);

  const panResponder = useMemo(
    () =>
      // Gesture callbacks read live viewport refs, and only ever run outside render.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onPanResponderGrant: (event: GestureResponderEvent) => {
          cancelAnimation();
          cancelFrame();
          setFollow(false);
          gestureRef.current = {
            startCenter: viewportRef.current.center,
            startSpan: viewportRef.current.span,
            startDistance: touchDistance(event.nativeEvent.touches),
          };
        },
        onPanResponderMove: (event: GestureResponderEvent, gesture) => {
          if (!interactingRef.current) {
            interactingRef.current = true;
            setInteracting(true);
          }
          const gestureState = gestureRef.current;
          const distance = touchDistance(event.nativeEvent.touches);

          if (distance > 0) {
            if (gestureState.startDistance === 0) {
              gestureState.startDistance = distance;
              gestureState.startSpan = viewportRef.current.span;
              gestureState.startCenter = viewportRef.current.center;
              return;
            }
            scheduleViewport({
              center: gestureState.startCenter,
              span: clamp(
                gestureState.startSpan * (gestureState.startDistance / distance),
                MIN_SPAN_METERS,
                maxSpanMeters,
              ),
            });
            return;
          }

          if (gestureState.startDistance > 0) {
            gestureState.startDistance = 0;
            gestureState.startCenter = viewportRef.current.center;
            gestureState.startSpan = viewportRef.current.span;
            return;
          }

          const unitsPerPixelNow = gestureState.startSpan / Math.max(widthRef.current, 1);
          scheduleViewport({
            center: clampCenter({
              x: gestureState.startCenter.x - gesture.dx * unitsPerPixelNow,
              y: gestureState.startCenter.y - gesture.dy * unitsPerPixelNow,
            }),
            span: gestureState.startSpan,
          });
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: finishGesture,
        onPanResponderTerminate: finishGesture,
      }),
    [
      cancelAnimation,
      cancelFrame,
      finishGesture,
      maxSpanMeters,
      scheduleViewport,
    ],
  );

  const paths = STATIC_PATHS;
  const placePoints = STATIC_PLACE_POINTS;

  const showBuildings = span < 1400;
  const buildingPath = useMemo(
    () => (showBuildings ? getBuildingPath() : ''),
    [showBuildings],
  );

  const trackPath = useMemo(() => buildTrackPath(track ?? []), [track]);
  const trackStart = useMemo(() => {
    const first = track?.find((point) =>
      isInsideMapBounds(point.latitude, point.longitude),
    );
    return first ? projectPoint(first.latitude, first.longitude) : null;
  }, [track]);

  const labels = useMemo(() => {
    if (!width || interacting) return [];

    const halfW = span / 2;
    const halfH = (span * height) / width / 2;
    const minX = center.x - halfW;
    const maxX = center.x + halfW;
    const minY = center.y - halfH;
    const maxY = center.y + halfH;

    const maxRank = span < 700 ? 7 : span < 1600 ? 6 : 3;
    const maxLabels = span < 1200 ? 22 : 15;
    const seen = new Set<string>();
    const result: {
      name: string;
      x: number;
      y: number;
      size: number;
      weight: string;
      rank: number;
    }[] = [];

    for (const place of placePoints) {
      if (result.length >= maxLabels) break;
      if (place.rank > maxRank) continue;
      if (seen.has(place.name)) continue;
      const padding = 26 * unitsPerPixel;
      if (place.x < minX + padding || place.x > maxX - padding) continue;
      if (place.y < minY + padding || place.y > maxY - padding) continue;
      seen.add(place.name);
      result.push({
        name: place.name,
        x: place.x,
        y: place.y,
        size: placeFontSize(place.rank) * unitsPerPixel,
        weight: placeWeight(place.rank),
        rank: place.rank,
      });
    }

    return result;
  }, [placePoints, center.x, center.y, span, width, height, unitsPerPixel, interacting]);

  const viewBox = (() => {
    if (!width || !scale) return `0 0 100 100`;
    const viewWidth = width / scale;
    const viewHeight = height / scale;
    return `${center.x - viewWidth / 2} ${center.y - viewHeight / 2} ${viewWidth} ${viewHeight}`;
  })();

  const marker = location ? projectPoint(location.latitude, location.longitude) : null;
  const markerVisible = marker && !outsideCoverage;

  const roadStroke = (pixels: number) => pixels * unitsPerPixel;
  const mins = (pixels: number) => pixels * unitsPerPixel;

  const showPermissionNotice =
    status === 'denied' || status === 'services-off' || status === 'error' || outsideCoverage;

  let noticeTitle = '';
  let noticeBody = '';
  let noticeAction = 'Retry';
  let noticeHandler = onRetry;

  if (outsideCoverage) {
    noticeTitle = 'Outside the offline map';
    noticeBody = `Your fix is outside the bundled ${OfflineMap.city} map, so the map is showing the city center.`;
    noticeAction = 'Recenter';
    noticeHandler = recenter;
  } else if (status === 'denied') {
    noticeTitle = 'Location is off';
    noticeBody = canAskAgain
      ? 'Tripede needs your location to place you on the map. It never leaves this device.'
      : 'Allow location access in Settings to see the live map pin.';
    noticeAction = canAskAgain ? 'Allow location' : 'Open settings';
    noticeHandler = canAskAgain ? onRetry : onOpenSettings;
  } else if (status === 'services-off') {
    noticeTitle = 'Location services are off';
    noticeBody = 'Turn on device location to see where you are. GPS works without internet.';
    noticeAction = 'Open settings';
    noticeHandler = onOpenSettings;
  } else if (status === 'error') {
    noticeTitle = "Couldn't get a GPS fix";
    noticeBody = error ?? 'Move to an open area and try again.';
    noticeAction = 'Try again';
    noticeHandler = onRetry;
  }

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.map,
        { height, backgroundColor: palette.background },
        rounded && { borderRadius: Radii.lg },
        style,
      ]}
      {...(interactive ? panResponder.panHandlers : {})}>
      {width > 0 ? (
        <Svg width={width} height={height} viewBox={viewBox} pointerEvents="none">
          <Rect
            x={center.x - width / scale / 2}
            y={center.y - height / scale / 2}
            width={width / scale}
            height={height / scale}
            fill={palette.land}
          />

          {paths.waterAreas ? <Path d={paths.waterAreas} fill={palette.water} /> : null}
          {paths.green ? <Path d={paths.green} fill={palette.green} /> : null}

          {buildingPath ? <Path d={buildingPath} fill={palette.building} /> : null}

          {span < 700 && paths.roads.paths ? (
            <Path
              d={paths.roads.paths}
              fill="none"
              stroke={palette.path}
              strokeWidth={roadStroke(1)}
              strokeDasharray={`${roadStroke(3)} ${roadStroke(3)}`}
            />
          ) : null}

          {span < 6000 && paths.roads.service ? (
            <Path
              d={paths.roads.service}
              fill="none"
              stroke={palette.service}
              strokeWidth={roadStroke(2.4)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {paths.roads.minor ? (
            <>
              <Path
                d={paths.roads.minor}
                fill="none"
                stroke={palette.minorCasing}
                strokeWidth={roadStroke(3.6)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d={paths.roads.minor}
                fill="none"
                stroke={palette.minorFill}
                strokeWidth={roadStroke(2.2)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : null}

          {paths.roads.tertiary ? (
            <>
              <Path
                d={paths.roads.tertiary}
                fill="none"
                stroke={palette.tertiaryCasing}
                strokeWidth={roadStroke(5)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d={paths.roads.tertiary}
                fill="none"
                stroke={palette.tertiaryFill}
                strokeWidth={roadStroke(3.4)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : null}

          {paths.roads.secondary ? (
            <>
              <Path
                d={paths.roads.secondary}
                fill="none"
                stroke={palette.secondaryCasing}
                strokeWidth={roadStroke(6.5)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d={paths.roads.secondary}
                fill="none"
                stroke={palette.secondaryFill}
                strokeWidth={roadStroke(4.4)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : null}

          {paths.roads.major ? (
            <>
              <Path
                d={paths.roads.major}
                fill="none"
                stroke={palette.majorCasing}
                strokeWidth={roadStroke(8)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d={paths.roads.major}
                fill="none"
                stroke={palette.majorFill}
                strokeWidth={roadStroke(5.6)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : null}

          {paths.coast ? (
            <Path
              d={paths.coast}
              fill="none"
              stroke={palette.coast}
              strokeWidth={roadStroke(1.8)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {paths.waterLines ? (
            <Path
              d={paths.waterLines}
              fill="none"
              stroke={palette.waterLine}
              strokeWidth={roadStroke(1.6)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {trackPath ? (
            <>
              <Path
                d={trackPath}
                fill="none"
                stroke={palette.trackHalo}
                strokeWidth={roadStroke(7)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d={trackPath}
                fill="none"
                stroke={palette.track}
                strokeWidth={roadStroke(4)}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={0.72}
              />
            </>
          ) : null}

          {labels.map((label) => (
            <Fragment key={`${label.name}-${label.rank}`}>
              <SvgText
                x={label.x}
                y={label.y}
                fontSize={label.size}
                fontWeight={label.weight}
                fill={palette.labelHalo}
                stroke={palette.labelHalo}
                strokeWidth={mins(3)}
                textAnchor="middle"
                opacity={0.94}>
                {label.name}
              </SvgText>
              <SvgText
                x={label.x}
                y={label.y}
                fontSize={label.size}
                fontWeight={label.weight}
                fill={palette.labelText}
                textAnchor="middle">
                {label.name}
              </SvgText>
            </Fragment>
          ))}

          {trackStart && trackPath ? (
            <>
              <Circle
                cx={trackStart.x}
                cy={trackStart.y}
                r={mins(7)}
                fill={palette.markerFill}
                stroke={palette.track}
                strokeWidth={roadStroke(2)}
              />
              <Circle cx={trackStart.x} cy={trackStart.y} r={mins(3)} fill={palette.track} />
            </>
          ) : null}

          {markerVisible && marker ? (
            <>
              {location?.accuracy ? (
                <Circle
                  cx={marker.x}
                  cy={marker.y}
                  r={Math.max(Math.min(location.accuracy, 250), mins(10))}
                  fill={palette.accuracyFill}
                  stroke={palette.accuracyStroke}
                  strokeWidth={roadStroke(1)}
                />
              ) : null}
              <Circle
                cx={marker.x}
                cy={marker.y}
                r={mins(9)}
                fill={palette.markerFill}
                stroke={palette.markerStroke}
                strokeWidth={roadStroke(1)}
              />
              <Circle cx={marker.x} cy={marker.y} r={mins(5.5)} fill={palette.markerDot} />
            </>
          ) : null}
        </Svg>
      ) : null}

      {showChip ? (
        <View pointerEvents="none" style={styles.mapTopRow}>
          <View style={[styles.mapChip, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
            <Icon name="wifi-off" size={10} color={theme.primary} />
            <AppText variant="caption" style={[styles.mapChipText, { color: theme.primary }]}>
              WORKS OFFLINE
            </AppText>
          </View>
        </View>
      ) : null}

      {interactive ? (
        <View style={[styles.mapControls, { bottom: Spacing.sm + bottomInset }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zoom in"
            onPress={() => zoomBy(1 / 1.7)}
            style={({ pressed }) => [
              styles.mapButton,
              { backgroundColor: 'rgba(255,255,255,0.94)' },
              pressed && styles.pressed,
            ]}>
            <Icon name="plus" size={15} color={theme.text} weight="semibold" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zoom out"
            onPress={() => zoomBy(1.7)}
            style={({ pressed }) => [
              styles.mapButton,
              { backgroundColor: 'rgba(255,255,255,0.94)' },
              pressed && styles.pressed,
            ]}>
            <Icon name="minus" size={15} color={theme.text} weight="semibold" />
          </Pressable>
          {showLocate ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={locateLabel ?? 'Center the map on my location'}
              accessibilityHint="Moves the map back to your current GPS position"
              onPress={recenter}
              style={({ pressed }) => [
                locateLabel ? styles.locatePill : styles.mapButton,
                locateLabel ? styles.locatePillSpacing : styles.recenterButton,
                { backgroundColor: follow ? theme.primary : 'rgba(255,255,255,0.94)' },
                pressed && styles.pressed,
              ]}>
              <Icon
                name="locate"
                size={locateLabel ? 14 : 16}
                color={follow ? '#FFFFFF' : theme.primary}
                weight="semibold"
              />
              {locateLabel ? (
                <AppText
                  variant="caption"
                  style={[
                    styles.locatePillText,
                    { color: follow ? '#FFFFFF' : theme.primary },
                  ]}>
                  {locateLabel.toUpperCase()}
                </AppText>
              ) : null}
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showAttribution ? (
        <View pointerEvents="none" style={[styles.attributionWrap, { bottom: 3 + bottomInset }]}>
          <AppText style={styles.attribution}>{OfflineMap.attribution}</AppText>
        </View>
      ) : null}

      {showPermissionNotice ? (
        <View style={styles.noticeOverlay}>
          <View style={[styles.noticeCard, { backgroundColor: theme.surface }]}>
            <AppText variant="label" style={styles.noticeTitle}>
              {noticeTitle}
            </AppText>
            <AppText variant="caption" tone="secondary" style={styles.noticeBody}>
              {noticeBody}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={noticeAction}
              onPress={noticeHandler}
              style={({ pressed }) => [
                styles.noticeAction,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}>
              <Icon
                name={noticeAction === 'Open settings' ? 'location' : 'refresh'}
                size={11}
                color="#FFFFFF"
                weight="bold"
              />
              <AppText variant="caption" style={styles.noticeActionText}>
                {noticeAction.toUpperCase()}
              </AppText>
            </Pressable>
          </View>
        </View>
      ) : null}

      {!showPermissionNotice && (status === 'locating' || status === 'checking') && !hasFix ? (
        <View style={[styles.locatingPill, { bottom: Spacing.sm + bottomInset }]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <AppText variant="caption" tone="secondary" style={styles.locatingText}>
            GETTING GPS FIX…
          </AppText>
        </View>
      ) : null}

      {onExpand ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open full screen map"
          onPress={onExpand}
          style={({ pressed }) => [
            styles.expandButton,
            { backgroundColor: 'rgba(255,255,255,0.94)' },
            pressed && styles.pressed,
          ]}>
          <Icon name="expand" size={15} color={theme.primary} weight="semibold" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    overflow: 'hidden',
    userSelect: 'none',
    touchAction: 'none',
  },
  mapTopRow: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mapChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  mapChipText: {
    fontSize: 7.5,
    letterSpacing: 0.8,
  },
  expandButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Shadows.card ?? {}),
  },
  mapControls: {
    position: 'absolute',
    right: Spacing.sm,
    alignItems: 'flex-end',
    gap: 5,
  },
  mapButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Shadows.card ?? {}),
  },
  recenterButton: {
    marginTop: 2,
  },
  locatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    ...(Shadows.card ?? {}),
  },
  locatePillSpacing: {
    marginTop: 2,
  },
  locatePillText: {
    fontSize: 9,
    letterSpacing: 0.7,
  },
  attributionWrap: {
    position: 'absolute',
    left: Spacing.sm,
  },
  attribution: {
    fontSize: 7.5,
    lineHeight: 11,
    color: 'rgba(15,23,42,0.52)',
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  noticeOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: 'rgba(241,246,255,0.55)',
  },
  noticeCard: {
    width: '100%',
    maxWidth: 300,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 3,
    ...(Shadows.card ?? {}),
  },
  noticeTitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  noticeBody: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  noticeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  noticeActionText: {
    color: '#FFFFFF',
    fontSize: 8,
    letterSpacing: 0.8,
  },
  locatingPill: {
    position: 'absolute',
    left: '50%',
    marginLeft: -80,
    width: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  locatingText: {
    fontSize: 8,
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
});
