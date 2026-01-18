// SELF-DESTRUCTING SERVICE WORKER
// This script is deployed to explicitly kill any existing service workers on the client.

self.addEventListener("install", (event) => {
  console.log("💣 Kill Switch Service Worker: Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("💣 Kill Switch Service Worker: Activating & Unregistering...");

  event.waitUntil(
    self.registration.unregister()
      .then(() => {
        console.log("✅ Service Worker successfully unregistered.");
        return self.clients.matchAll();
      })
      .then((clients) => {
        // Force reload all open clients to clear the cache state
        clients.forEach((client) => {
          console.log("🔄 Reloading client:", client.url);
          client.navigate(client.url);
        });
      })
  );
});
