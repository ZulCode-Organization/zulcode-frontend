import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'com.zul.code',
  appName: 'ZulCode',
  // O app Next tem rotas dinâmicas; no Android ele carrega a versão hospedada
  // em vez de uma exportação estática incompleta.
  webDir: 'capacitor-web',
  ...(serverUrl ? { server: { url: serverUrl, cleartext: serverUrl.startsWith('http://') } } : {}),
};

export default config;
