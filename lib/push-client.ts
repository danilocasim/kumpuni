/**
 * T019: Client-side Web Push registration.
 * Call from worker dashboard/setup to enable Fast Match notifications.
 */

const SW_PATH = "/sw.js";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export async function registerPushSubscription(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, error: "Hindi supported ang push sa device na ito." };
  }

  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, error: "Push hindi naka-configure." };
  }

  try {
    const reg = await navigator.serviceWorker.register(SW_PATH);
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, error: "Kailangan i-allow ang notifications." };
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error || "Hindi masave ang subscription." };
    }
    return { ok: true };
  } catch (e) {
    console.error("Push register error:", e);
    return { ok: false, error: "May nangyaring error. Subukan muli." };
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}
