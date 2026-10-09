package com.zul.code.widget;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * A ponte entre o app e o widget.
 *
 * O site, rodando dentro do app, chama `atualizar` toda vez que carrega o
 * perfil; `limpar` sai quando a pessoa encerra a sessão. Fora do Android nada
 * disso existe, e quem chama trata essa ausência (ver `widget-ofensiva.ts`).
 */
@CapacitorPlugin(name = "WidgetDaOfensiva")
public class PluginDoWidget extends Plugin {

    @PluginMethod
    public void atualizar(PluginCall chamada) {
        Integer dias = chamada.getInt("dias");
        if (dias == null) {
            chamada.reject("Faltou o número de dias.");
            return;
        }
        DadosDaOfensiva.gravar(
            getContext(),
            dias,
            Boolean.TRUE.equals(chamada.getBoolean("acesa", false)),
            Boolean.TRUE.equals(chamada.getBoolean("protegida", false))
        );
        chamada.resolve();
    }

    @PluginMethod
    public void limpar(PluginCall chamada) {
        DadosDaOfensiva.limpar(getContext());
        chamada.resolve();
    }
}
