package com.zul.code.avisos;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.zul.code.MainActivity;
import com.zul.code.R;

/**
 * Como uma notificação do ZulCode aparece.
 *
 * Todas passam por aqui, venham de um lembrete agendado no celular ou do
 * servidor: o ícone é a silhueta do Zul, a cor é o azul da marca, e a de
 * ofensiva abre com a chama e o número de dias da pessoa. Tocar abre o app já
 * na tela certa (a `rota`).
 */
public final class Avisos {

    public static final String CANAL_LEMBRETES = "zulcode_lembretes";
    public static final String CANAL_NOVIDADES = "zulcode_alertas";
    public static final String EXTRA_ROTA = "zc_rota";
    /** Qual aviso abriu o app: ele é fechado ao abrir (os botões não fecham sozinhos). */
    public static final String EXTRA_AVISO = "zc_aviso";
    static final int AZUL = 0xFF1892FF;

    private Avisos() {}

    /** Os canais aparecem nas configurações do Android, com estes nomes, e lá a pessoa desliga cada um. */
    static void garantirCanais(Context contexto, String nomeLembretes, String nomeNovidades) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager gerente = contexto.getSystemService(NotificationManager.class);
        NotificationChannel lembretes = new NotificationChannel(CANAL_LEMBRETES, nomeLembretes, NotificationManager.IMPORTANCE_HIGH);
        lembretes.enableVibration(true);
        NotificationChannel novidades = new NotificationChannel(CANAL_NOVIDADES, nomeNovidades, NotificationManager.IMPORTANCE_DEFAULT);
        gerente.createNotificationChannel(lembretes);
        gerente.createNotificationChannel(novidades);
    }

    /** Abre o app na `rota`. O código de pedido distingue as ações do mesmo aviso. */
    static PendingIntent abrir(Context contexto, String rota, int codigo, int aviso) {
        Intent intent = new Intent(contexto, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra(EXTRA_ROTA, rota);
        intent.putExtra(EXTRA_AVISO, aviso);
        return PendingIntent.getActivity(contexto, codigo, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /**
     * Mostra um aviso. `dias` maior que zero desenha a chama na imagem grande;
     * `acaoDepois` não nulo põe o botão de lembrar mais tarde.
     */
    static void mostrar(Context contexto, int id, String canal, String titulo, String texto, String rota,
                        int dias, String rotuloDias, String acaoEstudar, String acaoDepois) {
        if (!NotificationManagerCompat.from(contexto).areNotificationsEnabled()) return;

        NotificationCompat.Builder aviso = new NotificationCompat.Builder(contexto, canal)
            .setSmallIcon(R.drawable.ic_aviso_zul)
            .setColor(AZUL)
            .setContentTitle(titulo)
            .setContentText(texto)
            .setLargeIcon(ArteDoAviso.cabecaDoZul(contexto))
            .setContentIntent(abrir(contexto, rota, id, id))
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setPriority(NotificationCompat.PRIORITY_HIGH);

        if (dias > 0) {
            // Aberta, a notificação mostra a chama grande; a cabeça pequena some
            // para não repetir o Zul que já está na imagem.
            Bitmap arte = ArteDoAviso.ofensiva(contexto, dias, rotuloDias);
            aviso.setStyle(new NotificationCompat.BigPictureStyle().bigPicture(arte).bigLargeIcon((Bitmap) null).setSummaryText(texto));
        } else {
            aviso.setStyle(new NotificationCompat.BigTextStyle().bigText(texto));
        }

        if (acaoEstudar != null) aviso.addAction(0, acaoEstudar, abrir(contexto, rota, id + 1, id));
        if (acaoDepois != null) {
            Intent adiar = new Intent(contexto, ReceptorDeLembrete.class).setAction(ReceptorDeLembrete.ADIAR);
            aviso.addAction(0, acaoDepois, PendingIntent.getBroadcast(contexto, id + 2, adiar, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }

        try {
            NotificationManagerCompat.from(contexto).notify(id, aviso.build());
        } catch (SecurityException semPermissao) {
            // Android 13+ sem a permissão de avisos: não há o que mostrar.
        }
    }

    /**
     * Um aviso que veio do servidor: o mesmo visual dos outros, mais a imagem
     * grande e um botão de ação, quando o administrativo os mandou.
     */
    static void mostrarDoServidor(Context contexto, int id, String canal, String titulo, String texto, String rota,
                                  Bitmap imagem, String botao, String rotaDoBotao) {
        if (!NotificationManagerCompat.from(contexto).areNotificationsEnabled()) return;

        NotificationCompat.Builder aviso = new NotificationCompat.Builder(contexto, canal)
            .setSmallIcon(R.drawable.ic_aviso_zul)
            .setColor(AZUL)
            .setContentTitle(titulo)
            .setContentText(texto)
            .setLargeIcon(imagem != null ? imagem : ArteDoAviso.cabecaDoZul(contexto))
            .setContentIntent(abrir(contexto, rota, id, id))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH);

        if (imagem != null) {
            // Aberta, a notificação mostra a imagem grande; fechada, ela aparece pequena ao lado.
            aviso.setStyle(new NotificationCompat.BigPictureStyle().bigPicture(imagem).bigLargeIcon((Bitmap) null).setSummaryText(texto));
        } else {
            aviso.setStyle(new NotificationCompat.BigTextStyle().bigText(texto));
        }
        if (botao != null && rotaDoBotao != null) aviso.addAction(0, botao, abrir(contexto, rotaDoBotao, id + 3, id));

        try {
            NotificationManagerCompat.from(contexto).notify(id, aviso.build());
        } catch (SecurityException semPermissao) {
            // Android 13+ sem a permissão de avisos: não há o que mostrar.
        }
    }
}
