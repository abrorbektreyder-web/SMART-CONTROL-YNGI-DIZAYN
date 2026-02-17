// ================================================
// SMART CONTROL POS - Service Worker
// Offline rejim va kesh boshqaruvi
// ================================================

const CACHE_NAME = 'smart-control-v2';
const STATIC_ASSETS = [
    './',
    './login.html',
    './index.html',
    './owner.html',
    './cashier.html',
    './accountant.html',
    './assets/style.css',
    './assets/app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Google Fonts (offline uchun)
const FONT_URLS = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// ========================================
// INSTALL — statik fayllarni keshga saqlash
// ========================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Cache install error:', error);
            })
    );
});

// ========================================
// ACTIVATE — eski keshlarni tozalash
// ========================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// ========================================
// FETCH — Network First strategiyasi
// API so'rovlari: faqat network (keshlamaymiz)
// Statik fayllar: Network First, offline bo'lsa keshdan
// ========================================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API so'rovlarini keshlamaslik — backend ma'lumotlarga tegilmaydi
    if (url.pathname.includes('/api/') ||
        url.pathname.includes('/auth/') ||
        url.pathname.includes('/products/') ||
        url.pathname.includes('/sales/') ||
        url.pathname.includes('/shifts/') ||
        url.pathname.includes('/debts/') ||
        url.pathname.includes('/reports/') ||
        url.hostname === 'smart-control-v5-stable.onrender.com') {

        // API uchun: faqat networkdan, keshlamaymiz
        event.respondWith(
            fetch(event.request).catch(() => {
                // API offline bo'lsa, xatolik qaytarish
                return new Response(
                    JSON.stringify({
                        error: 'Offline',
                        detail: 'Internet aloqasi yo\'q. Iltimos, internetga ulaning.'
                    }),
                    {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            })
        );
        return;
    }

    // Statik fayllar uchun: Network First strategiya
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Muvaffaqiyatli javobni keshga saqlash
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Network yo'q bo'lsa, keshdan qaytarish
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // HTML so'rovlar uchun login sahifasini qaytarish
                    if (event.request.headers.get('accept') &&
                        event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('./login.html');
                    }

                    return new Response('Offline', { status: 503 });
                });
            })
    );
});
