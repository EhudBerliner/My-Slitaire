/**
 * SERVICE WORKER
 * Version: 2.0.0
 * Handles caching and offline functionality
 */

const VERSION = '2.0.0';
const CACHE_NAME = `solitaire-v${VERSION}`;

// Files to cache
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/logic.js',
    './js/ui.js',
    './js/pwa.js',
    './js/main.js',
    './manifest.json'
];

/**
 * Install event - cache assets
 */
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing version ${VERSION}`);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[SW] Assets cached successfully');
                // Force the waiting service worker to become the active service worker
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache assets:', error);
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log(`[SW] Activating version ${VERSION}`);
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log(`[SW] Deleting old cache: ${cacheName}`);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Old caches cleaned up');
                // Take control of all clients immediately
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }
                
                // Not in cache - fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Cache the new response for future use
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[SW] Fetch failed:', error);
                        
                        // Return offline page if available
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        
                        throw error;
                    });
            })
    );
});

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: VERSION });
    }
});

/**
 * Background sync event (if needed in future)
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-game-state') {
        event.waitUntil(syncGameState());
    }
});

/**
 * Sync game state (placeholder for future feature)
 */
async function syncGameState() {
    console.log('[SW] Syncing game state');
    // Implementation for syncing game state to cloud
}

/**
 * Push notification event (placeholder for future feature)
 */
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'סוליטר פרו';
    const options = {
        body: data.body || 'יש לך משחק שמור',
        icon: './logo.png',
        badge: './logo.png',
        vibrate: [200, 100, 200]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log(`[SW] Service Worker version ${VERSION} loaded`);
