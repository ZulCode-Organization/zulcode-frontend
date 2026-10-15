import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { OfflineSyncProvider } from "@/components/offline/offline-sync-provider";
import { Abertura } from "@/components/abertura/abertura";
import { BarrasDoSistema } from "@/components/abertura/barras-do-sistema";
import { AbrirPeloAviso } from "@/components/avisos/abrir-pelo-aviso";
import { ManterNotificacoes } from "@/components/avisos/manter-notificacoes";
import { VoltarDoLogin } from "@/components/auth/voltar-do-login";
import { LANG_DO_HTML } from "@/i18n/idiomas";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "ZulCode",
  description: "Aprenda programação de forma gamificada",
  // O manifesto deixa adicionar o site à tela de início. No iPhone, é só assim
  // que o site recebe notificações.
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, title: "ZulCode", statusBarStyle: "black-translucent" },
};

/**
 * `viewportFit: "cover"` é o que faz o app ocupar a tela inteira do celular.
 * Sem isto o Android encolhe a página para fora das barras do sistema e pinta
 * o que sobra com a cor da janela — as duas faixas cinzas, em cima e embaixo.
 * Com isto o fundo do app passa por baixo delas, e as medidas das barras
 * chegam ao CSS em `env(safe-area-inset-*)`. São essas medidas que afastam o
 * conteúdo do relógio e dos botões, somadas ao espaçamento que cada barra do
 * app já tinha — procure por `safe-area-inset` para ver onde.
 *
 * `themeColor` é a cor que o sistema usa nas bordas da janela, uma por tema.
 */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // A língua vem do cookie (ver src/i18n/request.ts). O `lang` certo faz o
  // leitor de tela pronunciar e o teclado corrigir na língua da pessoa.
  const idioma = await getLocale();
  return (
    <html
      lang={LANG_DO_HTML[idioma]}
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body className="w-dvw h-dvh overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <BarrasDoSistema />
            <AbrirPeloAviso />
            <ManterNotificacoes />
            <VoltarDoLogin />
            <OfflineSyncProvider>{children}</OfflineSyncProvider>
            <Abertura />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
