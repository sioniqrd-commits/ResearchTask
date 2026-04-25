// ═══════════════════════════════════════════════════════════════
// ResearchFlow — Service Worker (sw.js)
// Handles: Caching, Offline support, Background sync
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'researchflow-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap'
];

// ─── INSTALL: Cache static assets ───
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE: Clean old caches ───
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── FETCH: Network-first with cache fallback ───
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // For API calls (Google Apps Script) — network only, no cache
  if (url.hostname.includes('script.google.com') || 
      url.hostname.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // For Google Fonts CSS/woff2 — cache first (they rarely change)
  if (url.hostname.includes('fonts.googleapis.com') || 
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // For static assets — network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          
          // If it's a page navigation, serve index.html from cache
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          // For other requests, return an offline response
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});

// ─── BACKGROUND SYNC: Queue failed API calls ───
const SYNC_QUEUE_KEY = 'rf-sync-queue';

self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  // This would process any queued API calls when back online
  // The main app handles this via its own sync mechanism
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_READY' });
  });
}

// ─── PUSH NOTIFICATIONS (for future use) ───
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'ResearchFlow';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Focus existing window or open new one
      for (const client of clients) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(event.notification.data.url || '/');
    })
  );
});

// ─── MESSAGE: Communicate with main app ───
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service Worker loaded:', CACHE_NAME);
