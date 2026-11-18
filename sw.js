// Service worker do ANJO: guarda o app para funcionar sem internet e abre o app pelos lembretes.
// Ao publicar uma nova versão, aumente o número abaixo para os aparelhos baixarem a atualização.
const CACHE = "anjo-v8";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/app.js",
  "./js/core/util.js",
  "./js/core/midia.js",
  "./js/core/armazenamento.js",
  "./js/core/lembretes.js",
  "./js/data/conteudo.js",
  "./js/ui/arte.js",
  "./js/saude/raiox.js",
  "./js/saude/nutricao.js",
  "./js/saude/mapa.js",
  "./js/saude/percurso.js",
  "./img/orbe.png",
  "./img/fundo-claro.jpg",
  "./img/fundo-noturno.jpg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== "anjo-agenda").map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Páginas: tenta a internet primeiro (pega atualizações), cai para a cópia guardada se estiver offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Arquivos do app: internet primeiro (sempre a versão mais nova); sem internet, a cópia guardada.
  // Fontes do Google: a cópia guardada primeiro (não mudam).
  const sameOrigin = url.origin === self.location.origin;
  const isFont = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (sameOrigin) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }))
    );
  } else if (isFont) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
      }))
    );
  }
});

// Toque no lembrete: abre o app direto na pausa, no check-in ou no Raio-X.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const a = (e.notification.data && e.notification.data.action) || "";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.postMessage({ a });
          return c.focus();
        }
      }
      return self.clients.openWindow("./?a=" + encodeURIComponent(a));
    })
  );
});

// Aviso vindo do servidor (com o app fechado). O servidor não manda texto nenhum:
// o próprio aparelho olha a agenda que o app guardou e escolhe o lembrete daquele horário.
self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    let it = null;
    try {
      const c = await caches.open("anjo-agenda");
      const r = await c.match(new URL("agenda.json", self.registration.scope).href);
      if (r) {
        const ag = await r.json(), now = new Date(), m = now.getHours() * 60 + now.getMinutes();
        const toMin = (t) => { const [h, mm] = t.split(":").map(Number); return h * 60 + mm; };
        it = (ag.items || []).map((x) => Object.assign({}, x, { d: Math.abs(toMin(x.t) - m) })).filter((x) => x.d <= 3).sort((a, b) => a.d - b.d)[0] || null;
      }
    } catch (err) {}
    const title = it ? (it.kind === "ck" ? "Como você está hoje?" : it.kind === "convite" ? "Um convite do ANJO" : "Hora da sua pausa") : "ANJO";
    const body = it ? (it.kind === "ck" ? "Seu check-in leva 30 segundos." : it.label) : "Você tem um lembrete do ANJO.";
    await self.registration.showNotification(title, {
      body, icon: "icons/icon-192.png", badge: "icons/icon-192.png",
      tag: "anjo-" + (it ? it.id : "lembrete"), data: { action: it ? it.id : "" },
    });
  })());
});
