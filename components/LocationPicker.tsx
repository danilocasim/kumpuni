"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MapChangeView } from "@/components/MapChangeView";
import { MapClickHandler } from "@/components/MapClickHandler";
import type { Marker as LeafletMarker } from "leaflet";

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

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];
const DEFAULT_ZOOM = 13;

const METRO_MANILA_BARANGAYS = [
  "Bagong Silangan",
  "Commonwealth",
  "Diliman",
  "Holy Spirit",
  "Novaliches",
  "Project 4",
  "Quezon City (select)",
  "San Antonio",
  "Sikatuna Village",
  "Ugong Norte",
  "Kapitolyo",
  "Ortigas",
  "Pasig (select)",
  "San Miguel",
  "Sagad",
  "Other (manual)",
];

/** Approximate center coordinates for Metro Manila barangays (for moving the marker on select). */
const BARANGAY_COORDINATES: Record<string, [number, number]> = {
  "Bagong Silangan": [14.7172, 121.111],
  Commonwealth: [14.7039, 121.0782],
  Diliman: [14.6332, 121.0442],
  "Holy Spirit": [14.6689, 121.0508],
  Novaliches: [14.7139, 121.0489],
  "Project 4": [14.6181, 121.0514],
  "Quezon City (select)": [14.6508, 121.0499],
  "San Antonio": [14.5847, 121.0772],
  "Sikatuna Village": [14.6292, 121.0414],
  "Ugong Norte": [14.6022, 121.0564],
  Kapitolyo: [14.5764, 121.0633],
  Ortigas: [14.5872, 121.0564],
  "Pasig (select)": [14.5764, 121.0851],
  "San Miguel": [14.5995, 120.9842],
  Sagad: [14.5719, 121.0914],
};

/** Max distance (km) from a barangay center to still assign that barangay when user picks on map. */
const NEAREST_BARANGAY_KM = 10;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Returns the nearest barangay name for a point, or "Other (manual)" if none within threshold. */
function nearestBarangayFor(lat: number, lng: number): string {
  let nearest = "Other (manual)";
  let minKm = NEAREST_BARANGAY_KM;
  for (const [name, [blat, blng]] of Object.entries(BARANGAY_COORDINATES)) {
    const km = haversineKm(lat, lng, blat, blng);
    if (km < minKm) {
      minKm = km;
      nearest = name;
    }
  }
  return nearest;
}

export interface LocationValue {
  lat: number;
  lng: number;
  barangay: string;
}

interface LocationPickerProps {
  value: LocationValue | null;
  onChange: (value: LocationValue) => void;
  className?: string;
}

export function LocationPicker({ value, onChange, className = "" }: LocationPickerProps) {
  const [center, setCenter] = useState<[number, number]>(
    value ? [value.lat, value.lng] : DEFAULT_CENTER
  );
  const [barangay, setBarangay] = useState(value?.barangay ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const markerRef = useRef<LeafletMarker | null>(null);

  // Fix default Leaflet marker icon (broken in Next.js); run before first map paint
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions(LEAFLET_MARKER_ICON);
      setMapReady(true);
    });
  }, []);

  const handleLocation = useCallback(
    (lat: number, lng: number) => {
      onChange({ lat, lng, barangay: barangay || "Other (manual)" });
    },
    [barangay, onChange]
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      const resolvedBarangay = nearestBarangayFor(lat, lng);
      setCenter([lat, lng]);
      setBarangay(resolvedBarangay);
      onChange({ lat, lng, barangay: resolvedBarangay });
    },
    [onChange]
  );

  const handleBarangayChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      setBarangay(v);
      const coords = BARANGAY_COORDINATES[v];
      if (coords) {
        const [lat, lng] = coords;
        setCenter([lat, lng]);
        onChange({ lat, lng, barangay: v });
      } else if (value) {
        onChange({ ...value, barangay: v });
      }
    },
    [value, onChange]
  );

  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on your device.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const resolvedBarangay = nearestBarangayFor(lat, lng);
        setCenter([lat, lng]);
        setBarangay(resolvedBarangay);
        onChange({ lat, lng, barangay: resolvedBarangay });
        setLoading(false);
      },
      (err) => {
        setError(
          err?.code === 1
            ? "Location permission denied. Pick a spot on the map or choose a barangay."
            : "Could not get location. Try again or pick on the map or choose a barangay."
        );
        setLoading(false);
      }
    );
  }, [onChange]);

  useEffect(() => {
    if (value) {
      setCenter([value.lat, value.lng]);
      setBarangay(value.barangay);
    }
  }, [value?.lat, value?.lng, value?.barangay]);

  // Keep the Leaflet marker in sync when center changes (e.g. "Use current location" or value from parent)
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(center);
    }
  }, [center[0], center[1]]);

  return (
    <div className={className}>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="min-h-touch px-3 rounded border border-gray-300 bg-gray-50 text-sm disabled:opacity-50"
        >
          {loading ? "Getting..." : "Use current location"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <label className="block text-sm font-medium mb-1">Barangay (optional, select from list)</label>
      <select
        value={barangay}
        onChange={handleBarangayChange}
        className="w-full min-h-touch px-3 rounded border border-gray-300 mb-2"
      >
        <option value="">Select barangay...</option>
        {METRO_MANILA_BARANGAYS.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
      <div className="h-64 rounded border border-gray-300 overflow-hidden bg-gray-100">
        {!mapReady ? (
          <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
            Loading map...
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={DEFAULT_ZOOM}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <Marker
              ref={markerRef}
              position={[center[0], center[1]]}
              draggable
              eventHandlers={{
                dragend(e) {
                  const marker = e.target;
                  const { lat, lng } = marker.getLatLng();
                  const resolvedBarangay = nearestBarangayFor(lat, lng);
                  setCenter([lat, lng]);
                  setBarangay(resolvedBarangay);
                  onChange({ lat, lng, barangay: resolvedBarangay });
                },
              }}
            />
            <MapChangeView center={center} zoom={DEFAULT_ZOOM} />
            <MapClickHandler onMapClick={handleMapClick} />
          </MapContainer>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Drag the marker or click the map to set location. You can also pick a barangay above.
      </p>
    </div>
  );
}
