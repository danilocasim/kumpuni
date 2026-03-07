// T019: Service worker for Web Push (Fast Match worker notifications)
self.addEventListener("push", function (event) {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Kumpuni", body: event.data.text() };
  }
  const title = data.title || "Kumpuni";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    tag: data.tag || "kumpuni-push",
    data: data.url ? { url: data.url } : {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
