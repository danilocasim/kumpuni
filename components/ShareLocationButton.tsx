"use client";

import { useState } from "react";

export default function ShareLocationButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleShare() {
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
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3 space-y-2">
      <p className="text-sm text-gray-600">
        I-share ang current location mo para makita ka ng homeowners sa map (malapit sa job).
      </p>
      <button
        type="button"
        onClick={handleShare}
        disabled={status === "loading"}
        className="min-h-touch px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
      >
        {status === "loading" ? "Kinukuha ang lokasyon..." : "I-share ang lokasyon ko"}
      </button>
      {status === "ok" && <p className="text-sm text-green-600">{message}</p>}
      {status === "error" && <p className="text-sm text-amber-600">{message}</p>}
    </div>
  );
}
