// Answer from the saved copy at once, so a weak signal never leaves a blank screen, and refresh that copy in the background.
// A new version therefore shows on the second open, not the first.
const FILES = ['./', 'index.html', 'logic.js', 'game.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => e.waitUntil(caches.open('gully').then(c => c.addAll(FILES))));

self.addEventListener('fetch', e => e.respondWith(
  caches.open('gully').then(c => c.match(e.request, { ignoreSearch: true }).then(hit => {
    const fresh = fetch(e.request)
      .then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }) // never save an error page over a good copy
      .catch(() => hit);
    e.waitUntil(fresh);
    return hit || fresh;
  }))
));
