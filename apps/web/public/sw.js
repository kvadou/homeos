/* eslint-disable no-restricted-globals */

self.addEventListener("push", function (event) {
  if (!event.data) return;

  var payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: "HomeOS", body: event.data.text() };
  }

  var options = {
    body: payload.body || "",
    icon: "/logo.png",
    badge: "/icon-192.png",
    data: {
      link: payload.link || "/dashboard",
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title || "HomeOS", options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var link = event.notification.data && event.notification.data.link
    ? event.notification.data.link
    : "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windowClients) {
      // Focus existing window if one is open
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(link);
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});
