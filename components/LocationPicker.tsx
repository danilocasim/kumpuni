"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapChangeView } from "@/components/MapChangeView";
import { MapClickHandler } from "@/components/MapClickHandler";

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
  "Quezon City (pili)",
  "San Antonio",
  "Sikatuna Village",
  "Ugong Norte",
  "Kapitolyo",
  "Ortigas",
  "Pasig (pili)",
  "San Miguel",
  "Sagad",
  "Iba pa (manual)",
];

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

  const handleLocation = useCallback(
    (lat: number, lng: number) => {
      onChange({ lat, lng, barangay: barangay || "Iba pa (manual)" });
    },
    [barangay, onChange]
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setCenter([lat, lng]);
      onChange({ lat, lng, barangay: barangay || "Iba pa (manual)" });
    },
    [barangay, onChange]
  );

  const handleBarangayChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      setBarangay(v);
      if (value) onChange({ ...value, barangay: v });
    },
    [value, onChange]
  );

  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Hindi supported ang geolocation sa device mo.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCenter([lat, lng]);
        onChange({ lat, lng, barangay: barangay || "Iba pa (manual)" });
        setLoading(false);
      },
      () => {
        setError("Hindi makuha ang lokasyon. Piliin na lang sa mapa o barangay.");
        setLoading(false);
      }
    );
  }, [barangay, onChange]);

  useEffect(() => {
    if (value) {
      setCenter([value.lat, value.lng]);
      setBarangay(value.barangay);
    }
  }, [value?.lat, value?.lng, value?.barangay]);

  return (
    <div className={className}>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="min-h-touch px-3 rounded border border-gray-300 bg-gray-50 text-sm disabled:opacity-50"
        >
          {loading ? "Kumukuha..." : "Gamitin ang current location"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <label className="block text-sm font-medium mb-1">Barangay (optional, pili sa list)</label>
      <select
        value={barangay}
        onChange={handleBarangayChange}
        className="w-full min-h-touch px-3 rounded border border-gray-300 mb-2"
      >
        <option value="">Piliin ang barangay...</option>
        {METRO_MANILA_BARANGAYS.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
      <div className="h-64 rounded border border-gray-300 overflow-hidden bg-gray-100">
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            key={`marker-${center[0]}-${center[1]}`}
            position={center}
            draggable
            eventHandlers={{
              dragend(e) {
                const marker = e.target;
                const { lat, lng } = marker.getLatLng();
                setCenter([lat, lng]);
                onChange({ lat, lng, barangay: barangay || "Iba pa (manual)" });
              },
            }}
          />
          <MapChangeView center={center} zoom={DEFAULT_ZOOM} />
          <MapClickHandler onMapClick={handleMapClick} />
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        I-drag ang marker o i-click sa mapa para ilagay ang lokasyon. Pwede rin pumili ng barangay sa taas.
      </p>
    </div>
  );
}
