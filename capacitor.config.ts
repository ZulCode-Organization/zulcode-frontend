import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'com.zul.code',
  appName: 'ZulCode',
  // O app Next tem rotas dinâmicas; no Android ele carrega a versão hospedada
  // em vez de uma exportação estática incompleta.
  webDir: 'capacitor-web',
  ...(serverUrl ? { server: { url: serverUrl, cleartext: serverUrl.startsWith('http://') } } : {}),
  android: {
    // Transparente (#RRGGBBAA): enquanto a página não desenha, aparece o fundo
    // da janela, que segue o tema do celular (res/values*/cores.xml). Sem isto
    // a WebView é branca e, no tema escuro, piscava um clarão entre a splash e
    // a abertura.
    backgroundColor: '#00000000',
  },
};

export default config;
