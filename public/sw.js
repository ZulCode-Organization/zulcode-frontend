/**
 * O ZulCode sem internet.
 *
 * - Os arquivos do Next (/_next/static) nunca mudam de conteúdo (o nome muda):
 *   vêm do cache primeiro e ficam guardados.
 * - Imagens, artes do Zul, sons e fontes: o guardado aparece na hora e é
 *   atualizado por trás.
 * - Páginas: da rede primeiro; sem rede, a última versão guardada daquela
 *   página, ou a página /offline (a navegação do app com o aviso de sem internet),
 *   que é guardada junto com tudo de que precisa já na instalação.
 * O servidor da API é outro endereço e não passa por aqui.
 */
const CACHE = "zulcode-v2";
const OFFLINE = "/offline";
const MIDIA = /\.(?:png|jpe?g|svg|ico|webp|gif|mp3|wav|ogg|woff2?|ttf|json|webmanifest)$/i;
/** O que a tela de sem internet mostra, além do JavaScript e do CSS dela. */
const ARTES_DO_AVISO = ["/zul/zul-derretido.webp", "/icon-only.svg", "/icon-only-dark.svg", "/icons/icon-192.png"];

/** Guarda a página /offline e os arquivos que ela carrega (lidos do próprio HTML). */
async function guardarTelaOffline() {
  const cache = await caches.open(CACHE);
  const resposta = await fetch(OFFLINE, { cache: "reload" });
  if (!resposta.ok) return;
  const html = await resposta.clone().text();
  await cache.put(OFFLINE, resposta);
  const arquivos = new Set(ARTES_DO_AVISO);
  for (const achado of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) arquivos.add(achado[1]);
  await Promise.all([...arquivos].map((url) => cache.add(url).catch(() => undefined)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(guardarTelaOffline().catch(() => undefined).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Os caches de versões antigas (como o "zulcode-shell-v1") saem.
    const nomes = await caches.keys();
    await Promise.all(nomes.filter((nome) => nome !== CACHE).map((nome) => caches.delete(nome)));
    await self.clients.claim();
  })());
});

async function primeiroDoCache(request) {
  const guardado = await caches.match(request);
  if (guardado) return guardado;
  const resposta = await fetch(request);
  if (resposta.ok) (await caches.open(CACHE)).put(request, resposta.clone());
  return resposta;
}

async function guardadoEAtualizado(request, event) {
  const cache = await caches.open(CACHE);
  const guardado = await cache.match(request);
  const daRede = fetch(request).then((resposta) => {
    if (resposta.ok) cache.put(request, resposta.clone());
    return resposta;
  });
  if (guardado) {
    event.waitUntil(daRede.catch(() => undefined));
    return guardado;
  }
  return daRede;
}

async function paginaDaRedePrimeiro(request) {
  try {
    const resposta = await fetch(request);
    if (resposta.ok) (await caches.open(CACHE)).put(request, resposta.clone());
    return resposta;
  } catch {
    return (await caches.match(request, { ignoreSearch: true })) || (await caches.match(OFFLINE)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Os pedidos de dados do roteador do Next (RSC) não são guardados: sem rede,
  // o Next recarrega a página, e aí vale a regra das páginas.
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(paginaDaRedePrimeiro(request));
    return;
  }
  // No localhost (next dev) os nomes não mudam a cada edição: guardar serviria código velho.
  if (url.pathname.startsWith("/_next/static/") && self.location.hostname !== "localhost") {
    event.respondWith(primeiroDoCache(request).catch(() => Response.error()));
    return;
  }
  if (MIDIA.test(url.pathname)) {
    event.respondWith(guardadoEAtualizado(request, event).catch(async () => (await caches.match(request)) || Response.error()));
  }
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
