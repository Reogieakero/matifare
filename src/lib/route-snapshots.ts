import { getTrackViewport } from '@/lib/offline-map';
import type { SavedTrip } from '@/lib/trips';

/** Camera framing for a saved commute route. */
export type RouteViewport = NonNullable<ReturnType<typeof getTrackViewport>>;

/** A saved commute with a recorded track that can be drawn as a still route image. */
export type RouteSnapshot = SavedTrip & {
  track: NonNullable<SavedTrip['track']>;
  viewport: RouteViewport;
};

/** Turns a saved trip into a snapshot, or null when there is no route to draw. */
export function toRouteSnapshot(trip: SavedTrip): RouteSnapshot | null {
  const track = trip.track;
  if (!track || track.length < 2) return null;

  const viewport = getTrackViewport(track);
  if (!viewport) return null;

  return { ...trip, track, viewport };
}

/** Newest-first snapshots from an already loaded trip list. */
export function toRouteSnapshots(trips: readonly SavedTrip[]): RouteSnapshot[] {
  return trips
    .map(toRouteSnapshot)
    .filter((snapshot): snapshot is RouteSnapshot => snapshot !== null);
}
