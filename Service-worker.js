const CACHE='sgkasir-cache-v1';
const FILES=['/','/index.html','/style.css','/app.js','/manifest.json','/icon-192.png'];
self.addEventListener('install', e=> e.waitUntil(caches.open(CACHE).then(c=> c.addAll(FILES))));
self.addEventListener('fetch', e=> e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request))));
self.addEventListener('activate', e=> e.waitUntil(caches.keys().then(keys=> Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));