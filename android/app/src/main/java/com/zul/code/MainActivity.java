package com.zul.code;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.zul.code.widget.PluginDoWidget;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle estadoSalvo) {
        // O registro vem antes do super: é no onCreate do BridgeActivity que a
        // ponte do Capacitor é montada, e plugin registrado depois disso não
        // entra.
        registerPlugin(PluginDoWidget.class);
        super.onCreate(estadoSalvo);
    }
}
