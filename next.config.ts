// O plugin aponta para onde o app decide a língua e carrega os textos.
const createNextIntlPlugin = require("next-intl/plugin")
const comTraducoes = createNextIntlPlugin("./src/i18n/request.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Só vale no `next dev`: o emulador do Android enxerga o computador por
  // 10.0.2.2, e sem isto o Next bloqueia os arquivos pedidos de lá.
  allowedDevOrigins: ["10.0.2.2"],
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

module.exports = comTraducoes(nextConfig)
