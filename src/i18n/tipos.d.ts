import type pt from "./mensagens/pt";
import type { Idioma } from "./idiomas";

// Os textos em português são a referência: usar uma chave que não existe
// neles é erro de compilação.
declare module "next-intl" {
  interface AppConfig {
    Locale: Idioma;
    Messages: typeof pt;
  }
}
