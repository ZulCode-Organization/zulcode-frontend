package com.zul.code.widget;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** O relógio dos widgets tocou (meia-noite ou 20h): todos se redesenham e o próximo é agendado. */
public class ReceptorDaVirada extends BroadcastReceiver {
    @Override
    public void onReceive(Context contexto, Intent intent) {
        Widgets.redesenharTodos(contexto);
    }
}
