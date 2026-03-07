"use client";

import { useMapEvents } from "react-leaflet";

/**
 * Listens for map clicks and calls onMapClick with the clicked lat/lng.
 * Must be rendered inside MapContainer.
 */
export function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
