"use client";

import type { PluginListenerHandle } from "@capacitor/core";
import { API_BASE_URL, fetchComTimeout } from "./api-config";

/**
 * Os anúncios do app Android, para quem não é PRO: o recompensado ("assista e
 * ganhe 1 pena") e um de tela cheia ao sair de uma lição concluída — nunca no
 * meio dela.
 *
 * Fora do app (navegador) e num APK sem o AdMob, tudo devolve "sem anúncio" e
 * nada aparece.
 *
 * Os blocos de anúncio do ZulCode vêm de NEXT_PUBLIC_ADMOB_RECOMPENSADO e
 * NEXT_PUBLIC_ADMOB_INTERSTICIAL; o id do app fica no APK (ADMOB_APP_ID, em
 * android/app/build.gradle).
 */
const TESTE = {
  recompensado: "ca-app-pub-3940256099942544/5224354917",
  intersticial: "ca-app-pub-3940256099942544/1033173712",
};

/**
 * `NEXT_PUBLIC_ADMOB_TESTE=1` troca os blocos do ZulCode pelos de demonstração
 * do Google. É o que se usa para mexer nos anúncios: eles aparecem sempre (até
 * numa conta recém-criada, que o Google ainda não liberou), não rendem nada e
 * não correm risco — ver ou tocar num anúncio de verdade do próprio app conta
 * como tráfego inválido e suspende a conta do AdMob.
 *
 * Em produção isto fica desligado. Para conferir o anúncio de verdade sem
 * risco, o jeito é pôr o aparelho em NEXT_PUBLIC_ADMOB_APARELHOS_DE_TESTE.
 */
const MODO_DE_TESTE = process.env.NEXT_PUBLIC_ADMOB_TESTE === "1";
const ID_RECOMPENSADO = (!MODO_DE_TESTE && process.env.NEXT_PUBLIC_ADMOB_RECOMPENSADO) || TESTE.recompensado;
const ID_INTERSTICIAL = (!MODO_DE_TESTE && process.env.NEXT_PUBLIC_ADMOB_INTERSTICIAL) || TESTE.intersticial;
const deTeste = (id: string) => id.startsWith("ca-app-pub-3940256099942544");

/**
 * Os aparelhos de quem desenvolve o ZulCode (NEXT_PUBLIC_ADMOB_APARELHOS_DE_TESTE,
 * separados por vírgula). Neles o Google serve anúncios de teste mesmo com os
 * ids de verdade, e é assim que se testa sem risco: ver o próprio anúncio real,
 * ou tocar nele, conta como tráfego inválido e suspende a conta do AdMob.
 *
 * O id de cada aparelho sai no logcat na primeira vez que ele pede um anúncio
 * ("Use ... setTestDeviceIds(Arrays.asList(\"ABC123…\"))"). O emulador já é
 * um aparelho de teste por conta própria.
 */
const APARELHOS_DE_TESTE = (process.env.NEXT_PUBLIC_ADMOB_APARELHOS_DE_TESTE ?? "")
  .split(",")
  .map((aparelho) => aparelho.trim())
  .filter(Boolean);

type ModuloAdMob = typeof import("@capacitor-community/admob");
let iniciado: Promise<ModuloAdMob | null> | null = null;
/** Quando não se sabe o que a pessoa consentiu, o anúncio vai sem personalizar. */
let semPersonalizar = false;

/**
 * O AdMob iniciado, com o consentimento resolvido; `null` fora do app, num APK
 * sem ele e quando o Google diz que não dá para pedir anúncio.
 *
 * O formulário de consentimento (GDPR, LGPD) só aparece onde a lei pede, e uma
 * vez: depois o Google lembra a escolha. Perguntar por ele é um passo à parte
 * de propósito — sem o formulário configurado no painel do AdMob, ou sem rede,
 * essa consulta falha, e isso não pode deixar o app inteiro sem anúncio.
 */
function admob() {
  iniciado ??= (async () => {
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.getPlatform() !== "android" || !Capacitor.isPluginAvailable("AdMob")) return null;
      const m = await import("@capacitor-community/admob");
      // Conteúdo para todas as idades com orientação: o ZulCode tem estudantes jovens.
      await m.AdMob.initialize({
        maxAdContentRating: m.MaxAdContentRating.ParentalGuidance,
        initializeForTesting: APARELHOS_DE_TESTE.length > 0,
        testingDevices: APARELHOS_DE_TESTE,
      });
      try {
        let consentimento = await m.AdMob.requestConsentInfo();
        if (consentimento.isConsentFormAvailable && consentimento.status === m.AdmobConsentStatus.REQUIRED) {
          consentimento = await m.AdMob.showConsentForm();
        }
        // A pessoa recusou, ou a lei do país dela não deixa: nada de anúncio.
        if (!consentimento.canRequestAds) return null;
      } catch {
        semPersonalizar = true;
      }
      return m;
    } catch {
      return null;
    }
  })();
  return iniciado;
}

export async function anunciosDisponiveis() {
  return (await admob()) !== null;
}

/** Espera o anúncio em tela cheia fechar (ou falhar), com um teto para nunca prender a tela. */
async function esperarFechar(m: ModuloAdMob, eventos: string[], mostrar: () => Promise<unknown>, aoGanhar?: () => void) {
  const ouvintes: PluginListenerHandle[] = [];
  let fechar = () => {};
  const fechou = new Promise<void>((resolve) => {
    fechar = resolve;
  });
  const adicionar = m.AdMob.addListener as unknown as (evento: string, fn: () => void) => Promise<PluginListenerHandle>;
  for (const evento of eventos) ouvintes.push(await adicionar(evento, fechar));
  if (aoGanhar) ouvintes.push(await adicionar(m.RewardAdPluginEvents.Rewarded, aoGanhar));
  const teto = window.setTimeout(fechar, 3 * 60 * 1000);
  // A promessa de mostrar o recompensado só termina se a pessoa ganhar; quem
  // decide o fim é o evento de fechar.
  void mostrar().then(() => aoGanhar?.(), fechar);
  await fechou;
  window.clearTimeout(teto);
  for (const ouvinte of ouvintes) void ouvinte.remove();
}

// ---------------------------------------------------------------- Recompensado

export type ResultadoDaPena =
  | { ok: true; vidas: number }
  | { ok: false; motivo: "semAnuncio" | "pro" | "cheio" | "limite" | "cancelado" | "falha" };

/**
 * Mostra o anúncio que vale 1 pena. O servidor dá o `nonce` antes (e recusa se
 * a pena não couber ou o limite do dia acabou) e paga depois, quando o anúncio
 * foi visto até o fim.
 */
export async function assistirParaGanharPena(): Promise<ResultadoDaPena> {
  return assistirRecompensado("pena");
}

/** O anúncio que recupera a ofensiva perdida (enquanto a recuperação está aberta). */
export async function assistirParaRecuperarOfensiva(): Promise<boolean> {
  return (await assistirRecompensado("ofensiva")).ok;
}

async function assistirRecompensado(tipo: "pena" | "ofensiva"): Promise<ResultadoDaPena> {
  const m = await admob();
  const token = localStorage.getItem("accessToken");
  if (!m || !token) return { ok: false, motivo: "semAnuncio" };
  const headers = { Authorization: `Bearer ${token}` };

  const pedido = await fetchComTimeout(`${API_BASE_URL}/user/lives/anuncio`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ tipo }),
  }).catch(() => null);
  if (pedido?.status === 422) {
    const corpo = await pedido.json().catch(() => null);
    const motivo = corpo?.motivo;
    return { ok: false, motivo: motivo === "pro" || motivo === "cheio" || motivo === "limite" ? motivo : "falha" };
  }
  if (!pedido?.ok) return { ok: false, motivo: "falha" };
  const { nonce, usuario } = (await pedido.json()) as { nonce: string; usuario: string };

  try {
    await m.AdMob.prepareRewardVideoAd({ adId: ID_RECOMPENSADO, isTesting: deTeste(ID_RECOMPENSADO), npa: semPersonalizar, ssv: { userId: usuario, customData: nonce } });
  } catch {
    return { ok: false, motivo: "falha" };
  }

  let ganhou = false;
  await esperarFechar(
    m,
    [m.RewardAdPluginEvents.Dismissed, m.RewardAdPluginEvents.FailedToShow],
    () => m.AdMob.showRewardVideoAd(),
    () => {
      ganhou = true;
    },
  );
  if (!ganhou) return { ok: false, motivo: "cancelado" };

  // Confirma; com a verificação do Google ligada, a confirmação dele pode
  // levar alguns segundos para chegar ao servidor.
  for (let tentativa = 0; tentativa < 8; tentativa += 1) {
    const resposta = await fetchComTimeout(`${API_BASE_URL}/user/lives/anuncio/${encodeURIComponent(nonce)}/confirmar`, {
      method: "POST",
      headers,
    }).catch(() => null);
    const corpo = resposta?.ok ? await resposta.json().catch(() => null) : null;
    if (corpo?.entregue) return { ok: true, vidas: corpo.lives };
    await new Promise((pronto) => setTimeout(pronto, 1500));
  }
  return { ok: false, motivo: "falha" };
}

// ---------------------------------------------------------------- Tela cheia

/** No máximo um a cada duas lições, e com pelo menos cinco minutos entre eles. */
const LICOES_ENTRE = 2;
const INTERVALO_MS = 5 * 60 * 1000;
const CHAVE = "zc-anuncio-intersticial";
let intersticialPronto = false;

function lerContagem(): { licoes: number; ultimo: number } {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "null");
    if (salvo && typeof salvo.licoes === "number" && typeof salvo.ultimo === "number") return salvo;
  } catch {
    // Sem armazenamento: conta como se fosse a primeira vez.
  }
  return { licoes: 0, ultimo: 0 };
}

function gravarContagem(contagem: { licoes: number; ultimo: number }) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(contagem));
  } catch {
    // Idem.
  }
}

/**
 * Ao terminar uma lição: conta e, se for a vez, já carrega o anúncio sem
 * mostrar — na saída ele abre na hora, sem a pessoa esperar.
 */
export async function licaoConcluidaParaAnuncio() {
  const contagem = lerContagem();
  contagem.licoes += 1;
  gravarContagem(contagem);
  if (contagem.licoes < LICOES_ENTRE || Date.now() - contagem.ultimo < INTERVALO_MS) return;
  const m = await admob();
  if (!m) return;
  try {
    await m.AdMob.prepareInterstitial({ adId: ID_INTERSTICIAL, isTesting: deTeste(ID_INTERSTICIAL), npa: semPersonalizar });
    intersticialPronto = true;
  } catch {
    intersticialPronto = false;
  }
}

/** Na saída da lição concluída: mostra o anúncio se ele carregou, e só volta quando ele fecha. */
export async function mostrarIntersticialSePronto() {
  if (!intersticialPronto) return;
  intersticialPronto = false;
  const m = await admob();
  if (!m) return;
  gravarContagem({ licoes: 0, ultimo: Date.now() });
  await esperarFechar(m, [m.InterstitialAdPluginEvents.Dismissed, m.InterstitialAdPluginEvents.FailedToShow], () => m.AdMob.showInterstitial());
}
