package com.zul.code.avisos;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.app.NotificationManagerCompat;

/**
 * Onde os alarmes dos lembretes chegam, e o botão "Mais tarde" também.
 * Só recebe intents do próprio app (exported=false no manifesto).
 */
public class ReceptorDeLembrete extends BroadcastReceiver {

    static final String LEMBRETE = "com.zul.code.LEMBRETE";
    static final String RISCO = "com.zul.code.RISCO";
    static final String ADIAR = "com.zul.code.ADIAR";
    static final String ADIADO = "com.zul.code.ADIADO";

    @Override
    public void onReceive(Context contexto, Intent intent) {
        String acao = intent.getAction();
        if (LEMBRETE.equals(acao)) {
            Lembretes.disparar(contexto, "lembrete", false);
            // O alarme de hoje já tocou: este agenda o de amanhã.
            Lembretes.reagendar(contexto);
        } else if (RISCO.equals(acao)) {
            Lembretes.disparar(contexto, "risco", false);
            Lembretes.reagendar(contexto);
        } else if (ADIAR.equals(acao)) {
            NotificationManagerCompat avisos = NotificationManagerCompat.from(contexto);
            avisos.cancel(Lembretes.ID_LEMBRETE);
            avisos.cancel(Lembretes.ID_RISCO);
            avisos.cancel(Lembretes.ID_EXEMPLO);
            Lembretes.adiar(contexto);
        } else if (ADIADO.equals(acao)) {
            Lembretes.disparar(contexto, "lembrete", false);
        }
    }
}
