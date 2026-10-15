const CACHE = "zulcode-shell-v1";
const ASSET = /\\.(?:js|css|woff2?|png|jpe?g|svg|ico)$/i;

self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/"])).catch(() => undefined)));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && (request.mode === "navigate" || ASSET.test(new URL(request.url).pathname))) {
        const cache = await caches.open(CACHE); cache.put(request, response.clone());
      }
      return response;
    } catch {
      return (await caches.match(request)) || (request.mode === "navigate" ? await caches.match("/") : Response.error());
    }
  })());
});

// ---------------------------------------------------------------- Notificações (Web Push)

/** Só caminhos do próprio site: uma notificação nunca leva para fora dele. */
const rotaSegura = (rota) => (typeof rota === "string" && rota.startsWith("/") && !rota.startsWith("//") ? rota : "/home");

// O servidor manda { titulo, texto, rota, imagem, botao: { rotulo, rota }, etiqueta }.
self.addEventListener("push", (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = { texto: event.data ? event.data.text() : "" };
  }
  const opcoes = {
    body: dados.texto || "",
    icon: "/icons/icon-192.png",
    tag: dados.etiqueta || undefined,
    data: { rota: rotaSegura(dados.rota), botao: dados.botao ? { rota: rotaSegura(dados.botao.rota) } : null },
  };
  if (dados.imagem) opcoes.image = dados.imagem;
  if (dados.botao && dados.botao.rotulo) opcoes.actions = [{ action: "botao", title: dados.botao.rotulo }];
  event.waitUntil(self.registration.showNotification(dados.titulo || "ZulCode", opcoes));
});

// Tocar abre o site na tela do aviso: usa uma aba já aberta, se houver.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const dados = event.notification.data || {};
  const rota = event.action === "botao" && dados.botao ? dados.botao.rota : dados.rota || "/home";
  const destino = new URL(rota, self.location.origin).href;
  event.waitUntil((async () => {
    const abas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const aba of abas) {
      if (new URL(aba.url).origin !== self.location.origin) continue;
      if ("navigate" in aba) await aba.navigate(destino).catch(() => undefined);
      if ("focus" in aba) return aba.focus();
    }
    return self.clients.openWindow(destino);
  })());
});
