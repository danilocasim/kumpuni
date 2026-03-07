"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { LatLngBoundsLiteral } from "leaflet";

/**
 * Fits the map view to include all given points with padding.
 * Use inside MapContainer. points: array of [lat, lng].
 */
export function MapFitBounds({
  points,
  padding = [24, 24],
  maxZoom = 14,
}: {
  points: Array<[number, number]>;
  padding?: [number, number];
  maxZoom?: number;
}) {
  const map = useMap();
  const pointsKey = points.map((p) => `${p[0]},${p[1]}`).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], maxZoom);
      return;
    }
    const lats = points.map((p) => p[0]);
    const lngs = points.map((p) => p[1]);
    const bounds: LatLngBoundsLiteral = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    map.fitBounds(bounds, { padding, maxZoom });
  }, [map, pointsKey, points.length, maxZoom]);
  return null;
}
