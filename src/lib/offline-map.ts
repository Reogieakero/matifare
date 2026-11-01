import rawMap from '@/assets/maps/mati-map.json';

export type MapCoordinate = [number, number];

type MapFeature = {
  points: MapCoordinate[];
};

type MapRoad = MapFeature & {
  class: string;
  name: string;
};

type MapPlace = {
  name: string;
  kind: string;
  rank: number;
  lat: number;
  lng: number;
};

export type OfflineMapData = {
  city: string;
  attribution: string;
  bounds: { south: number; west: number; north: number; east: number };
  center: { lat: number; lng: number };
  roads: MapRoad[];
  water: (MapFeature & { area: boolean })[];
  green: MapFeature[];
  buildings: MapFeature[];
  coastline: MapFeature[];
  places: MapPlace[];
};

export const OfflineMap = rawMap as unknown as OfflineMapData;

const EARTH_DEGREE_LATITUDE_METERS = 110574;
const EARTH_DEGREE_LONGITUDE_METERS = 111320;

const centerLatRadians = (OfflineMap.center.lat * Math.PI) / 180;
const metersPerDegreeLongitude =
  EARTH_DEGREE_LONGITUDE_METERS * Math.cos(centerLatRadians);

export type MapPoint = { x: number; y: number };

/** A GPS fix in the shape needed to draw a travelled track. */
export type TrackPoint = { latitude: number; longitude: number };

/**
 * Local equirectangular projection around Mati City. The area is small enough
 * that metre-accurate distances are indistinguishable from Web Mercator.
 * x grows east, y grows south so it lines up with SVG screen coordinates.
 */
export function projectPoint(latitude: number, longitude: number): MapPoint {
  return {
    x: (longitude - OfflineMap.center.lng) * metersPerDegreeLongitude,
    y: (OfflineMap.center.lat - latitude) * EARTH_DEGREE_LATITUDE_METERS,
  };
}

function projectCoordinate([longitude, latitude]: MapCoordinate): MapPoint {
  return projectPoint(latitude, longitude);
}

export function isInsideMapBounds(latitude: number, longitude: number) {
  const { south, west, north, east } = OfflineMap.bounds;
  return latitude >= south && latitude <= north && longitude >= west && longitude <= east;
}

export const MapBoundsMeters = (() => {
  const northWest = projectPoint(OfflineMap.bounds.north, OfflineMap.bounds.west);
  const southEast = projectPoint(OfflineMap.bounds.south, OfflineMap.bounds.east);
  return {
    minX: northWest.x,
    maxX: southEast.x,
    minY: northWest.y,
    maxY: southEast.y,
  };
})();

function buildPath(points: MapCoordinate[], close = false) {
  if (points.length < 2) return '';

  let path = '';
  for (let index = 0; index < points.length; index += 1) {
    const point = projectCoordinate(points[index]);
    path += `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    if (index < points.length - 1) path += ' ';
  }
  if (close) path += ' Z';
  return path;
}

export function buildAreaPath(features: MapFeature[]) {
  return features.map((feature) => buildPath(feature.points, true)).join(' ');
}

export function buildLinePath(features: MapFeature[]) {
  return features.map((feature) => buildPath(feature.points)).join(' ');
}

export function buildRoadPaths(classes: string[]) {
  return buildLinePath(OfflineMap.roads.filter((road) => classes.includes(road.class)));
}

/**
 * Builds one SVG path for a recorded trip. Fixes outside the bundled map are
 * skipped and start a new subpath, so the line never jumps across the city.
 */
export function buildTrackPath(points: readonly TrackPoint[]) {
  let path = '';
  let previousInside = false;

  for (const point of points) {
    if (!isInsideMapBounds(point.latitude, point.longitude)) {
      previousInside = false;
      continue;
    }

    const projected = projectPoint(point.latitude, point.longitude);
    if (path) path += ' ';
    path += `${previousInside ? 'L' : 'M'}${projected.x.toFixed(1)} ${projected.y.toFixed(1)}`;
    previousInside = true;
  }

  return path;
}

/**
 * Camera position that frames a recorded track inside the bundled map. The
 * canvas is roughly twice as wide as it is tall, so the vertical extent needs
 * extra breathing room. Returns null when no point falls inside the map.
 */
export function getTrackViewport(
  points: readonly TrackPoint[],
  padding = 1.35,
): { center: MapPoint; span: number } | null {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    if (!isInsideMapBounds(point.latitude, point.longitude)) continue;
    const projected = projectPoint(point.latitude, point.longitude);
    minX = Math.min(minX, projected.x);
    maxX = Math.max(maxX, projected.x);
    minY = Math.min(minY, projected.y);
    maxY = Math.max(maxY, projected.y);
  }

  if (!Number.isFinite(minX)) return null;

  const widthSpan = maxX - minX;
  const heightSpan = maxY - minY;
  const span = Math.max(widthSpan, heightSpan * 2, 320) * padding;

  return {
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    span: Math.min(Math.max(span, 350), 12000),
  };
}

export function buildPlacePoints() {
  return OfflineMap.places.map((place) => ({
    ...place,
    ...projectPoint(place.lat, place.lng),
  }));
}

export function formatCoordinate(value: number, axis: 'lat' | 'lng') {
  const direction = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  return `${Math.abs(value).toFixed(5)}° ${direction}`;
}
