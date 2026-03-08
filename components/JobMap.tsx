"use client";

import { useLayoutEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapChangeView } from "@/components/MapChangeView";

const LEAFLET_MARKER_ICON = {
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
};

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);

interface JobMapProps {
  jobCenter: [number, number];
  workerLocations?: { lat: number; lng: number; id: string }[];
  className?: string;
  zoom?: number;
}

export function JobMap({ jobCenter, workerLocations = [], className = "h-64", zoom = 13 }: JobMapProps) {
  const [mapReady, setMapReady] = useState(false);

  // Fix default Leaflet marker icon
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions(LEAFLET_MARKER_ICON);
      setMapReady(true);
    });
  }, []);

  return (
    <div className={`rounded-xl border-2 border-subtle overflow-hidden bg-surface-light shadow-inner relative z-0 ${className}`}>
      {!mapReady ? (
        <div className="h-full w-full flex flex-col items-center justify-center text-text-secondary text-sm gap-2">
          <svg className="animate-spin h-6 w-6 text-kumpuni-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Nilo-load ang mapa...
        </div>
      ) : (
        <MapContainer
          center={jobCenter}
          zoom={zoom}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {/* Job Marker */}
          <Marker position={jobCenter} opacity={0.6} title="Job Location" />
          
          {/* Worker Markers */}
          {workerLocations.map((loc) => (
            <Marker key={loc.id} position={[loc.lat, loc.lng]} title="Interested Worker" />
          ))}
          <MapChangeView center={jobCenter} zoom={zoom} />
        </MapContainer>
      )}
    </div>
  );
}
