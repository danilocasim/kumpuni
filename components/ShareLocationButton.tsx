"use client";

import { useEffect, useState, useCallback } from "react";
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

/** Animates the map to a new center with zoom */
function AnimateZoom({ center, zoom }: { center: [number, number]; zoom: number }) {
  // useMap must be imported inside dynamic context to avoid SSR issues
  const { useMap } = require("react-leaflet");
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.8 });
  }, [map, center[0], center[1], zoom]);
  return null;
}

export default function ShareLocationButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [animateTarget, setAnimateTarget] = useState<{ lat: number; lng: number } | null>(null);

  // Fix Leaflet default icon in Next.js
  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
  }, []);

  // Fetch existing location on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/worker/location", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.lat === "number" && typeof data.lng === "number") {
          setLocation({ lat: data.lat, lng: data.lng });
        }
      } catch {
        // ignore — just won't show map initially
      }
    })();
  }, []);

  const handleShare = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("Location is not supported by your browser.");
      return;
    }
    setStatus("loading");
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch("/api/worker/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng }),
            credentials: "include",
          });
          const data = await res.json();
          if (res.ok) {
            setStatus("ok");
            setMessage("Na-update ang lokasyon mo. Makikita ka ng homeowners sa map.");
            // If map already showing (existing location), trigger fly animation
            if (location) {
              setAnimateTarget({ lat, lng });
            }
            setLocation({ lat, lng });
          } else {
            setStatus("error");
            setMessage(data.error || "Could not save location.");
          }
        } catch {
          setStatus("error");
          setMessage("Something went wrong. Try again.");
        }
      },
      () => {
        setStatus("error");
        setMessage("No location or permission denied. Turn on Location on your device.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [location]);

  return (
    <div className="space-y-3">
      {/* Map — shown when location exists */}
      {location && (
        <div
          className="rounded-xl overflow-hidden border border-card-border shadow-sm transition-all duration-700 ease-out"
          style={{
            animation: !mapReady ? "none" : undefined,
          }}
        >
          <div
            className="transition-all duration-700 ease-out"
            style={{
              height: mapReady ? 192 : 0,
              opacity: mapReady ? 1 : 0,
            }}
          >
            <MapContainer
              center={[location.lat, location.lng]}
              zoom={15}
              className="h-48 w-full"
              scrollWheelZoom={false}
              whenReady={() => setMapReady(true)}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <Marker position={[location.lat, location.lng]} />
              {animateTarget && (
                <AnimateZoom
                  center={[animateTarget.lat, animateTarget.lng]}
                  zoom={16}
                />
              )}
            </MapContainer>
          </div>
        </div>
      )}

      <p className="text-sm text-text-secondary">
        I-share ang current location mo para makita ka ng homeowners sa map (malapit sa job).
      </p>

      <button
        type="button"
        onClick={handleShare}
        disabled={status === "loading"}
        className="min-h-touch px-4 py-2 rounded-lg bg-kumpuni-blue text-white text-sm font-medium disabled:opacity-50 transition-colors hover:bg-blue-700"
      >
        {status === "loading"
          ? "Kinukuha ang lokasyon..."
          : location
            ? "I-update ang lokasyon ko"
            : "I-share ang lokasyon ko"}
      </button>

      {status === "ok" && <p className="text-sm text-success-green font-medium">{message}</p>}
      {status === "error" && <p className="text-sm text-amber-600">{message}</p>}
    </div>
  );
}
