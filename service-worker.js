// Cache version name—bump this to force a cache refresh
const CACHE_NAME = "teleprompter-pwa-v1"

// List all assets you want to cache for offline use
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/service-worker.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  // If you used external fonts (e.g., Google Fonts), either prefetch them or omit
]

// Install event—cache everything
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  )
})

// Activate event—remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  // Immediately take control of all clients
  return self.clients.claim()
})

// Fetch event—serve from cache first, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedRes) => {
      if (cachedRes) {
        return cachedRes
      }
      // If not in cache, fetch from network, then cache it for later:
      return fetch(event.request).then((networkRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Only cache GET requests, and avoid opaque (cross-origin) responses if needed
          if (
            event.request.method === "GET" &&
            networkRes.status === 200 &&
            networkRes.type === "basic"
          ) {
            cache.put(event.request, networkRes.clone())
          }
          return networkRes.clone()
        })
      })
    })
  )
})
