package com.zul.code;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.zul.code.avisos.PluginDosAvisos;
import com.zul.code.sistema.PluginDasCoresDasBarras;
import com.zul.code.sistema.PluginDoIcone;
import com.zul.code.widget.PluginDoWidget;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle estadoSalvo) {
        // O registro vem antes do super: é no onCreate do BridgeActivity que a
        // ponte do Capacitor é montada, e plugin registrado depois disso não
        // entra.
        registerPlugin(PluginDoWidget.class);
        registerPlugin(PluginDasCoresDasBarras.class);
        registerPlugin(PluginDosAvisos.class);
        registerPlugin(PluginDoIcone.class);
        super.onCreate(estadoSalvo);
    }

    @Override
    public void onStop() {
        super.onStop();
        // O ícone novo pedido pelo admin entra quando o app sai da tela: trocar
        // com ele aberto fecha o app em alguns celulares.
        PluginDoIcone.aplicarPendente(this);
    }
}
