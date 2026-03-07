"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * Updates the Leaflet map view when center/zoom change.
 * MapContainer only uses center for the initial view; this component keeps the map in sync.
 */
export function MapChangeView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center[0], center[1], zoom]);
  return null;
}
