const CACHE_NAME = "sgkasir-cache-v1";
const FILES = ["/","/index.html","/style.css","/app.js","/manifest.json","/logo.png"];

self.addEventListener('install', evt=>{
  evt.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(FILES)));
});
self.addEventListener('fetch', evt=>{
  evt.respondWith(caches.match(evt.request).then(r=>r || fetch(evt.request)));
});
self.addEventListener('activate', evt=>{
  evt.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
});