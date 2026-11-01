"""Build the bundled offline vector map for Mati City.

Fetches OpenStreetMap data once (build time only), simplifies it and writes a
compact GeoJSON file that the app renders with react-native-svg. The app never
touches the network at runtime.

Usage:
    python scripts/build-offline-map.py
"""

from __future__ import annotations

import json
import math
import sys
import time
from pathlib import Path

import requests

# Mati City, Davao Oriental — generous bbox around the city proper and coast.
SOUTH, WEST, NORTH, EAST = 6.88, 126.13, 7.03, 126.32

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

HEADERS = {"User-Agent": "Tripede offline map builder (build-time script)"}

OUTPUT = Path(__file__).resolve().parent.parent / "assets" / "maps" / "mati-map.json"

QUERY = f"""
[out:json][timeout:240];
(
  way["highway"]({SOUTH},{WEST},{NORTH},{EAST});
  way["waterway"]({SOUTH},{WEST},{NORTH},{EAST});
  way["natural"="water"]({SOUTH},{WEST},{NORTH},{EAST});
  way["landuse"]({SOUTH},{WEST},{NORTH},{EAST});
  way["leisure"]({SOUTH},{WEST},{NORTH},{EAST});
  way["natural"="coastline"]({SOUTH},{WEST},{NORTH},{EAST});
  way["building"]({SOUTH},{WEST},{NORTH},{EAST});
  node["place"]({SOUTH},{WEST},{NORTH},{EAST});
  node["amenity"~"marketplace|hospital|clinic|school|university|college|townhall|police|fuel|bus_station|ferry_terminal"]({SOUTH},{WEST},{NORTH},{EAST});
  node["tourism"~"attraction|viewpoint|hotel"]({SOUTH},{WEST},{NORTH},{EAST});
);
out body;
>;
out skel qt;
"""


def fetch() -> dict:
    last_error: Exception | None = None
    for url in OVERPASS_URLS:
        print(f"Querying {url} ...", flush=True)
        started = time.time()
        try:
            response = requests.post(url, data={"data": QUERY}, headers=HEADERS, timeout=300)
            response.raise_for_status()
            payload = response.json()
            print(
                f"  ok: {len(payload.get('elements', []))} elements in "
                f"{time.time() - started:.0f}s",
                flush=True,
            )
            return payload
        except Exception as error:  # noqa: BLE001 - try the next mirror
            last_error = error
            print(f"  failed: {error}", flush=True)
    raise SystemExit(f"All Overpass mirrors failed: {last_error}")


def round_coord(value: float) -> float:
    return round(value, 6)


def simplify(points: list[tuple[float, float]], tolerance: float) -> list[tuple[float, float]]:
    """Douglas-Peucker in degrees (tolerance ~= degrees)."""
    if len(points) <= 2:
        return points

    def segment_distance(point, start, end):
        px, py = point
        ax, ay = start
        bx, by = end
        dx, dy = bx - ax, by - ay
        if dx == 0 and dy == 0:
            return math.hypot(px - ax, py - ay)
        t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
        t = max(0.0, min(1.0, t))
        return math.hypot(px - (ax + t * dx), py - (ay + t * dy))

    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        first, last = stack.pop()
        largest, index = 0.0, -1
        for i in range(first + 1, last):
            distance = segment_distance(points[i], points[first], points[last])
            if distance > largest:
                largest, index = distance, i
        if largest > tolerance and index != -1:
            keep[index] = True
            stack.append((first, index))
            stack.append((index, last))

    return [point for point, should_keep in zip(points, keep) if should_keep]


def main() -> None:
    payload = fetch()
    elements = payload["elements"]
    if not elements:
        raise SystemExit("Overpass returned no elements; refusing to write an empty map.")

    nodes = {
        element["id"]: (element["lon"], element["lat"])
        for element in elements
        if element["type"] == "node"
    }

    roads: list[dict] = []
    water: list[dict] = []
    green: list[dict] = []
    buildings: list[dict] = []
    coastline: list[dict] = []
    places: list[dict] = []

    road_tolerance = 0.000035  # ~4 m
    building_tolerance = 0.00002

    for element in elements:
        tags = element.get("tags") or {}
        if element["type"] == "node":
            place = tags.get("place")
            amenity = tags.get("amenity")
            tourism = tags.get("tourism")
            if place in {"city", "town", "village", "suburb", "neighbourhood", "quarter", "hamlet"}:
                places.append(
                    {
                        "name": tags.get("name", ""),
                        "kind": "place",
                        "rank": {"city": 0, "town": 1, "village": 2, "suburb": 3, "quarter": 3, "neighbourhood": 4, "hamlet": 4}.get(place, 5),
                        "lat": element["lat"],
                        "lng": element["lon"],
                    }
                )
            elif amenity in {"marketplace", "hospital", "clinic", "school", "university", "college", "townhall", "police", "fuel", "bus_station", "ferry_terminal"}:
                places.append(
                    {
                        "name": tags.get("name", ""),
                        "kind": amenity,
                        "rank": 6,
                        "lat": element["lat"],
                        "lng": element["lon"],
                    }
                )
            elif tourism in {"attraction", "viewpoint", "hotel"} and tags.get("name"):
                places.append(
                    {
                        "name": tags.get("name", ""),
                        "kind": tourism,
                        "rank": 7,
                        "lat": element["lat"],
                        "lng": element["lon"],
                    }
                )
            continue

        if element["type"] != "way":
            continue

        coords = [nodes[node_id] for node_id in element.get("nodes", []) if node_id in nodes]
        if len(coords) < 2:
            continue

        closed = coords[0] == coords[-1]
        if closed:
            coords = coords[:-1]
            if len(coords) < 3:
                continue

        highway = tags.get("highway")
        natural = tags.get("natural")
        waterway = tags.get("waterway")
        landuse = tags.get("landuse")
        leisure = tags.get("leisure")
        building = tags.get("building")

        if natural == "coastline":
            coastline.append({"points": [[round_coord(x), round_coord(y)] for x, y in coords]})
        elif highway:
            tolerance = 0.0 if highway in {"primary", "secondary", "tertiary"} else road_tolerance
            simplified = simplify(coords, tolerance)
            roads.append(
                {
                    "class": highway,
                    "name": tags.get("name", ""),
                    "points": [[round_coord(x), round_coord(y)] for x, y in simplified],
                }
            )
        elif natural == "water" or waterway:
            simplified = simplify(coords + [coords[0]], 0.00002)
            water.append(
                {
                    "area": natural == "water" or closed,
                    "points": [[round_coord(x), round_coord(y)] for x, y in simplified],
                }
            )
        elif landuse in {"forest", "grass", "meadow", "recreation_ground", "cemetery", "orchard"} or leisure in {"park", "pitch", "garden", "playground", "sports_centre", "stadium"}:
            simplified = simplify(coords + [coords[0]], 0.00003)
            green.append({"points": [[round_coord(x), round_coord(y)] for x, y in simplified]})
        elif building and building != "no":
            simplified = simplify(coords + [coords[0]], building_tolerance)
            if len(simplified) >= 3:
                buildings.append(
                    {"points": [[round_coord(x), round_coord(y)] for x, y in simplified]}
                )
        elif landuse and landuse not in {"residential", "commercial", "retail", "industrial", "quarry", "farmland"}:
            continue

    places = [
        place
        for place in places
        if SOUTH <= place["lat"] <= NORTH and WEST <= place["lng"] <= EAST and place["name"]
    ]
    places.sort(key=lambda place: place["rank"])

    # Keep the map light: buildings only around the city proper and heavily
    # simplified. They are only drawn when the user zooms in.
    center_lat, center_lng = 6.9534, 126.2166
    kept_buildings = []
    for building in buildings:
        lng, lat = building["points"][0]
        dx = (lng - center_lng) * 111320 * math.cos(math.radians(center_lat))
        dy = (lat - center_lat) * 110574
        if math.hypot(dx, dy) > 4000:
            continue
        simplified = simplify(
            [(point[0], point[1]) for point in building["points"]], 0.00007
        )
        if len(simplified) >= 3:
            kept_buildings.append(
                {"points": [[round_coord(x), round_coord(y)] for x, y in simplified]}
            )
    buildings = kept_buildings

    data = {
        "version": 1,
        "city": "Mati City",
        "attribution": "© OpenStreetMap contributors",
        "bounds": {"south": SOUTH, "west": WEST, "north": NORTH, "east": EAST},
        "center": {"lat": 6.9534, "lng": 126.2166},
        "roads": roads,
        "water": water,
        "green": green,
        "buildings": buildings,
        "coastline": coastline,
        "places": places[:80],
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    size_mb = OUTPUT.stat().st_size / (1024 * 1024)
    print(
        f"Wrote {OUTPUT} ({size_mb:.1f} MB): "
        f"{len(roads)} roads, {len(water)} water, {len(green)} green, "
        f"{len(buildings)} buildings, {len(places)} places, "
        f"{len(coastline)} coastline ways",
        flush=True,
    )


if __name__ == "__main__":
    main()
