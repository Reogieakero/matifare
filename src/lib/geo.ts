const EARTH_RADIUS_METERS = 6371008.8;

type GeoPoint = {
  latitude: number;
  longitude: number;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

/**
 * Great-circle distance between two GPS fixes, in metres. Good enough for
 * metre-scale trip metering inside Mati City (equirectangular would be too,
 * but haversine stays correct if the rider leaves the mapped area).
 */
export function haversineMeters(from: GeoPoint, to: GeoPoint): number {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(Math.sqrt(a), 1));
}
