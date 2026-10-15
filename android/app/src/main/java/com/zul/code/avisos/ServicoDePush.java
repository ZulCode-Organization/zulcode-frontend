package com.zul.code.avisos;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import androidx.annotation.NonNull;

import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

/**
 * Os avisos que chegam do servidor (Firebase).
 *
 * O servidor manda só dados (zc_titulo, zc_texto, zc_rota e, se houver,
 * zc_imagem, zc_botao, zc_botao_rota e zc_canal), e não uma notificação
 * pronta: assim quem a desenha é o app, com o Zul, a cor e os canais do
 * ZulCode, mesmo com ele fechado. Uma notificação pronta do Firebase sairia
 * com o visual genérico do Android.
 *
 * Substitui o serviço do plugin de push (ver AndroidManifest) e continua
 * repassando tudo a ele, para o app aberto também ficar sabendo.
 */
public class ServicoDePush extends MessagingService {

    /** A imagem grande tem de chegar rápido: o Android dá poucos segundos para o aviso sair. */
    private static final int TEMPO_DA_IMAGEM_MS = 5000;

    @Override
    public void onMessageReceived(@NonNull RemoteMessage mensagem) {
        mostrar(this, mensagem.getData());
        super.onMessageReceived(mensagem);
    }

    /** Separado do serviço para o teste poder mostrar um aviso sem o Firebase. */
    static boolean mostrar(Context contexto, Map<String, String> dados) {
        String titulo = dados.get("zc_titulo");
        if (titulo == null || titulo.trim().isEmpty()) return false;
        String texto = dados.get("zc_texto");
        String rota = rotaDoApp(dados.get("zc_rota"), "/home");
        // O mesmo aviso repetido substitui o anterior em vez de empilhar.
        String chave = dados.get("notificationId");
        int id = 8000 + Math.abs((chave != null ? chave : titulo).hashCode() % 1000);
        String canal = "lembretes".equals(dados.get("zc_canal")) ? Avisos.CANAL_LEMBRETES : Avisos.CANAL_NOVIDADES;

        String botao = dados.get("zc_botao");
        String rotaDoBotao = botao == null || botao.trim().isEmpty() ? null : rotaDoApp(dados.get("zc_botao_rota"), rota);
        Bitmap imagem = baixarImagem(dados.get("zc_imagem"));

        Lembretes.garantirCanais(contexto);
        Avisos.mostrarDoServidor(contexto, id, canal, titulo, texto == null ? "" : texto, rota, imagem,
            rotaDoBotao == null ? null : botao.trim(), rotaDoBotao);
        return true;
    }

    /** Só rotas do próprio app: um aviso nunca leva para fora dele. */
    private static String rotaDoApp(String rota, String padrao) {
        if (rota == null || !rota.startsWith("/") || rota.startsWith("//")) return padrao;
        return rota;
    }

    /** Baixa a imagem grande (só https). Falhou ou demorou: o aviso sai sem ela. */
    private static Bitmap baixarImagem(String endereco) {
        if (endereco == null || !endereco.startsWith("https://")) return null;
        HttpURLConnection conexao = null;
        try {
            conexao = (HttpURLConnection) new URL(endereco).openConnection();
            conexao.setConnectTimeout(TEMPO_DA_IMAGEM_MS);
            conexao.setReadTimeout(TEMPO_DA_IMAGEM_MS);
            conexao.setInstanceFollowRedirects(true);
            if (conexao.getResponseCode() != HttpURLConnection.HTTP_OK) return null;
            try (InputStream entrada = conexao.getInputStream()) {
                return BitmapFactory.decodeStream(entrada);
            }
        } catch (Exception semImagem) {
            return null;
        } finally {
            if (conexao != null) conexao.disconnect();
        }
    }
}
