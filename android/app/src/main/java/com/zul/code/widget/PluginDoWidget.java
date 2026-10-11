package com.zul.code.widget;

import android.graphics.Bitmap;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;

/**
 * A ponte entre o app e os widgets.
 *
 * O site, rodando dentro do app, chama `atualizar` toda vez que carrega o
 * perfil; `limpar` sai quando a pessoa encerra a sessão. As Configurações usam
 * o resto: as prévias, o visual e o pedido para pôr um widget na tela inicial.
 * Fora do Android nada disso existe, e quem chama trata essa ausência (ver
 * `widget-ofensiva.ts`).
 */
@CapacitorPlugin(name = "WidgetDaOfensiva")
public class PluginDoWidget extends Plugin {

    @PluginMethod
    public void atualizar(PluginCall chamada) {
        if (chamada.getInt("dias") == null) {
            chamada.reject("Faltou o número de dias.");
            return;
        }
        DadosDaOfensiva.gravar(getContext(), chamada.getData());
        chamada.resolve();
    }

    @PluginMethod
    public void limpar(PluginCall chamada) {
        DadosDaOfensiva.limpar(getContext());
        chamada.resolve();
    }

    /** Quantos de cada widget estão na tela, o visual e se dá para fixar daqui. */
    @PluginMethod
    public void estado(PluginCall chamada) {
        JSObject naTela = new JSObject();
        for (String tipo : Widgets.TIPOS) naTela.put(tipo, Widgets.ids(getContext(), tipo).length);
        JSObject resposta = new JSObject();
        resposta.put("naTela", naTela);
        resposta.put("estilo", Widgets.estilo(getContext()));
        resposta.put("podeFixar", Widgets.podeFixar(getContext()));
        chamada.resolve(resposta);
    }

    /** O widget desenhado com os dados de agora, em PNG, para a prévia nas Configurações. */
    @PluginMethod
    public void previa(PluginCall chamada) {
        String tipo = chamada.getString("tipo", Widgets.OFENSIVA);
        float densidade = getContext().getResources().getDisplayMetrics().density;
        int largura = Math.round(Math.min(600, chamada.getInt("largura", 150) * densidade));
        int altura = Math.round(Math.min(600, chamada.getInt("altura", 150) * densidade));
        Tema tema = Widgets.tema(chamada.getString("estilo", "escuro"));
        Bitmap imagem = Widgets.pintar(getContext(), tipo, largura, altura, tema);
        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        imagem.compress(Bitmap.CompressFormat.PNG, 100, saida);
        JSObject resposta = new JSObject();
        resposta.put("imagem", "data:image/png;base64," + Base64.encodeToString(saida.toByteArray(), Base64.NO_WRAP));
        chamada.resolve(resposta);
    }

    @PluginMethod
    public void fixar(PluginCall chamada) {
        JSObject resposta = new JSObject();
        resposta.put("pedido", Widgets.fixar(getContext(), chamada.getString("tipo", Widgets.OFENSIVA)));
        chamada.resolve(resposta);
    }

    @PluginMethod
    public void estilo(PluginCall chamada) {
        Widgets.definirEstilo(getContext(), chamada.getString("estilo", Widgets.AUTOMATICO));
        estado(chamada);
    }
}
