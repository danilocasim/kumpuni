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
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];
const DEFAULT_ZOOM = 12;
const AVATAR_SIZE = 44;

function createAvatarIcon(
  L: typeof import("leaflet"),
  avatarUrl: string | null,
  displayName: string | null
): import("leaflet").DivIcon {
  const name = (displayName || "W").trim();
  const initial = name.charAt(0).toUpperCase();
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=94a3b8&color=fff&size=88`;
  const src = avatarUrl && avatarUrl.startsWith("http") ? avatarUrl : fallback;
  const safeSrc = src.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  return L.divIcon({
    className: "avatar-marker-icon",
    html: `<div class="avatar-marker-wrap"><img src="${safeSrc}" alt="" /></div>`,
    iconSize: [AVATAR_SIZE, AVATAR_SIZE],
    iconAnchor: [AVATAR_SIZE / 2, AVATAR_SIZE / 2],
  });
}

export type WorkerMarker = {
  worker_id: string;
  display_name: string | null;
  avatar_url: string | null;
  service_lat: number | null;
  service_lng: number | null;
};

export default function BrowseWorkersMap({
  workers,
  onSelectWorker,
}: {
  workers: WorkerMarker[];
  onSelectWorker: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [Leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setLeaflet(L);
    });
  }, [mounted]);

  const points = workers
    .map((w) => ({
      ...w,
      service_lat: typeof w.service_lat === "number" ? w.service_lat : parseFloat(String(w.service_lat)),
      service_lng: typeof w.service_lng === "number" ? w.service_lng : parseFloat(String(w.service_lng)),
    }))
    .filter(
      (w) =>
        Number.isFinite(w.service_lat) &&
        Number.isFinite(w.service_lng) &&
        w.service_lat >= -90 &&
        w.service_lat <= 90 &&
        w.service_lng >= -180 &&
        w.service_lng <= 180
    ) as Array<WorkerMarker & { service_lat: number; service_lng: number }>;

  if (!mounted) {
    return (
      <div className="h-64 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
        Loading map...
      </div>
    );
  }

  const center: [number, number] =
    points.length >= 1
      ? [points[0].service_lat, points[0].service_lng]
      : DEFAULT_CENTER;
  const zoom = points.length >= 1 ? 13 : DEFAULT_ZOOM;

  return (
    <div className="w-full space-y-1">
      <div className="h-64 w-full rounded-lg border border-gray-200 overflow-hidden z-0 bg-gray-100" style={{ minHeight: 256 }}>
        <MapContainer
          key={`map-${points.length}-${points[0]?.worker_id ?? "empty"}-${center[0]}-${center[1]}`}
          center={center}
          zoom={zoom}
          className="h-full w-full"
          style={{ height: "100%", minHeight: 256 }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {Leaflet &&
            points.map((w) => (
              <Marker
                key={w.worker_id}
                position={[Number(w.service_lat), Number(w.service_lng)]}
                icon={createAvatarIcon(Leaflet, w.avatar_url ?? null, w.display_name)}
                eventHandlers={{
                  click: () => onSelectWorker(w.worker_id),
                }}
              >
                <Popup>
                  <button
                    type="button"
                    className="text-left font-medium text-blue-600"
                    onClick={() => onSelectWorker(w.worker_id)}
                  >
                    {w.display_name || "Worker"}
                  </button>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
      {points.length === 0 && (
        <p className="text-xs text-gray-600 text-center">
          Walang workers na may lokasyon sa area. Mag-rehistro ang workers malapit sa job mo para lumabas dito.
        </p>
      )}
    </div>
  );
}
