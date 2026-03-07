"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then((m) => m.Circle),
  { ssr: false }
);

export default function WorkerProfileMap({
  lat,
  lng,
  radiusKm,
}: {
  lat: number;
  lng: number;
  radiusKm: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="h-48 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
        Loading map...
      </div>
    );
  }

  const center: [number, number] = [lat, lng];
  return (
    <div className="h-48 rounded-lg border border-gray-200 overflow-hidden">
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        <Circle
          center={center}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 0.2,
            weight: 2,
          }}
        />
      </MapContainer>
    </div>
  );
}
