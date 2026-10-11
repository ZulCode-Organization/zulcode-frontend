package com.zul.code.avisos;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import com.zul.code.widget.Widgets;

/**
 * O Android esquece os alarmes quando o celular reinicia ou o app é
 * atualizado; aqui eles são agendados de novo (os lembretes e o relógio dos
 * widgets, que também se redesenham). Não faz mais nada, por isso pode ficar
 * aberto ao sistema.
 */
public class ReceptorDeInicio extends BroadcastReceiver {
    @Override
    public void onReceive(Context contexto, Intent intent) {
        String acao = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(acao) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(acao)) {
            Lembretes.reagendar(contexto);
            Widgets.redesenharTodos(contexto);
        }
    }
}
