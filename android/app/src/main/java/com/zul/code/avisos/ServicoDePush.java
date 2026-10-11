package com.zul.code.avisos;

import android.content.Context;

import androidx.annotation.NonNull;

import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * Os avisos que chegam do servidor (Firebase).
 *
 * O servidor manda só dados (zc_titulo, zc_texto, zc_rota), e não uma
 * notificação pronta: assim quem a desenha é o app, com o Zul, a cor e os
 * canais do ZulCode, mesmo com ele fechado. Uma notificação pronta do Firebase
 * sairia com o visual genérico do Android.
 *
 * Substitui o serviço do plugin de push (ver AndroidManifest) e continua
 * repassando tudo a ele, para o app aberto também ficar sabendo.
 */
public class ServicoDePush extends MessagingService {

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
        String rota = dados.get("zc_rota");
        // Só rotas do próprio app: um aviso nunca leva para fora dele.
        if (rota == null || !rota.startsWith("/") || rota.startsWith("//")) rota = "/home";
        // O mesmo aviso repetido substitui o anterior em vez de empilhar.
        String chave = dados.get("notificationId");
        int id = 8000 + Math.abs((chave != null ? chave : titulo).hashCode() % 1000);

        Lembretes.garantirCanais(contexto);
        Avisos.mostrar(contexto, id, Avisos.CANAL_NOVIDADES, titulo, texto == null ? "" : texto, rota, 0, null, null, null);
        return true;
    }
}
