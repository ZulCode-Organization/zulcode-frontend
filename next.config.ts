// O plugin aponta para onde o app decide a língua e carrega os textos.
const createNextIntlPlugin = require("next-intl/plugin")
const comTraducoes = createNextIntlPlugin("./src/i18n/request.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
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
