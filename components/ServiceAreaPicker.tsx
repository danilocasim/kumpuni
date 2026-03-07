"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

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
const Circle = dynamic(
  () => import("react-leaflet").then((m) => m.Circle),
  { ssr: false }
);

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];
const DEFAULT_ZOOM = 12;
const MIN_RADIUS_KM = 5;
const MAX_RADIUS_KM = 25;

export interface ServiceAreaValue {
  lat: number;
  lng: number;
  radius_km: number;
}

interface ServiceAreaPickerProps {
  value: ServiceAreaValue | null;
  onChange: (value: ServiceAreaValue) => void;
  className?: string;
}

export function ServiceAreaPicker({
  value,
  onChange,
  className = "",
}: ServiceAreaPickerProps) {
  const [center, setCenter] = useState<[number, number]>(
    value ? [value.lat, value.lng] : DEFAULT_CENTER
  );
  const [radiusKm, setRadiusKm] = useState(value?.radius_km ?? 10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncToParent = useCallback(
    (lat: number, lng: number, km: number) => {
      onChange({ lat, lng, radius_km: km });
    },
    [onChange]
  );

  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Hindi supported ang geolocation.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCenter([lat, lng]);
        syncToParent(lat, lng, radiusKm);
        setLoading(false);
      },
      () => {
        setError("Hindi makuha ang lokasyon.");
        setLoading(false);
      }
    );
  }, [radiusKm, syncToParent]);

  useEffect(() => {
    if (value) {
      setCenter([value.lat, value.lng]);
      setRadiusKm(value.radius_km);
    }
  }, [value?.lat, value?.lng, value?.radius_km]);

  const handleDragEnd = useCallback(
    (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
      const { lat, lng } = e.target.getLatLng();
      setCenter([lat, lng]);
      syncToParent(lat, lng, radiusKm);
    },
    [radiusKm, syncToParent]
  );

  const handleRadiusChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const km = Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Number(e.target.value)));
      setRadiusKm(km);
      syncToParent(center[0], center[1], km);
    },
    [center, syncToParent]
  );

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
      <label className="block text-sm font-medium mb-1">
        Radius ng service area (km): {radiusKm}
      </label>
      <input
        type="range"
        min={MIN_RADIUS_KM}
        max={MAX_RADIUS_KM}
        value={radiusKm}
        onChange={handleRadiusChange}
        className="w-full h-2 rounded accent-blue-600"
      />
      <div className="h-64 rounded border border-gray-300 overflow-hidden bg-gray-100 mt-2">
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
          <Marker position={center} draggable eventHandlers={{ dragend: handleDragEnd }} />
          <Circle
            center={center}
            radius={radiusKm * 1000}
            pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.15, weight: 2 }}
          />
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        I-drag ang marker para ilagay ang center ng service area. I-adjust ang radius sa slider.
      </p>
    </div>
  );
}
