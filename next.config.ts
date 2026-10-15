const path = require("path")

/**
 * Onde o app decide a língua e carrega os textos (o next-intl procura por
 * `next-intl/config`).
 *
 * É o mesmo apontamento que o plugin `next-intl/plugin` faria. O plugin não é
 * usado porque, ao ser carregado, ele já exige o `@swc/core` nativo do extrator
 * de mensagens dele — recurso que o ZulCode não usa — e o Windows com o
 * Controle Inteligente de Aplicativos ligado bloqueia esse binário sem
 * assinatura, derrubando o `next dev`.
 */
const CONFIG_DE_IDIOMA = "./src/i18n/request.ts"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Só vale no `next dev`: o emulador do Android enxerga o computador por
  // 10.0.2.2, e sem isto o Next bloqueia os arquivos pedidos de lá.
  allowedDevOrigins: ["10.0.2.2"],
  turbopack: {
    resolveAlias: { "next-intl/config": CONFIG_DE_IDIOMA },
  },
  // Para quem rodar com webpack (`--webpack`): ele pede o caminho absoluto.
  webpack(config) {
    config.resolve ??= {}
    config.resolve.alias = { ...config.resolve.alias, "next-intl/config": path.resolve(__dirname, CONFIG_DE_IDIOMA) }
    return config
  },
  async headers() {
    return [{
      source: "/playground-runtime/:path*",
      headers: [
        { key: "Content-Security-Policy", value: "sandbox allow-scripts; frame-ancestors 'self'" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Cache-Control", value: "no-store" },
      ],
    }];
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
