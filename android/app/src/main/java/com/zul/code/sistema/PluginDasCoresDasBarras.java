package com.zul.code.sistema;

import android.graphics.Color;
import android.os.Build;
import android.view.Window;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Pinta as barras do sistema com o fundo do tema que está na tela.
 *
 * Do Android 15 em diante, com a WebView atualizada, o app vai até as bordas
 * e as barras são transparentes: o fundo que aparece atrás delas é o da
 * página, e isto quase não faz diferença. Nos celulares mais antigos (e nos
 * novos com a WebView desatualizada) é o Android que desenha as barras, com a
 * cor que estiver na janela — e ela só seguiria o tema do celular, lido uma
 * vez na abertura. Quem sabe o tema de verdade é o site, que manda a cor
 * exata do próprio fundo (ver `barras-do-sistema.tsx`).
 *
 * A cor dos ícones fica com o `SystemBars` do Capacitor, que já a reaplica
 * quando o celular gira ou muda de tema.
 */
@CapacitorPlugin(name = "CoresDasBarras")
public class PluginDasCoresDasBarras extends Plugin {

    @PluginMethod
    @SuppressWarnings("deprecation")
    public void pintar(PluginCall chamada) {
        int fundo;
        try {
            fundo = Color.parseColor(chamada.getString("cor", ""));
        } catch (IllegalArgumentException e) {
            chamada.reject("Cor inválida.");
            return;
        }
        boolean escuro = Boolean.TRUE.equals(chamada.getBoolean("escuro", false));

        getActivity().runOnUiThread(() -> {
            Window janela = getActivity().getWindow();
            // O fundo da janela é o que aparece se o Android reservar a faixa
            // das barras em vez de deixar a página passar por baixo.
            janela.getDecorView().setBackgroundColor(fundo);
            janela.setStatusBarColor(fundo);
            // Antes do Android 8.1 os botões da barra de navegação são sempre
            // brancos: num fundo claro eles sumiriam, então ali ela fica preta.
            boolean botoesSempreBrancos = Build.VERSION.SDK_INT < Build.VERSION_CODES.O_MR1;
            janela.setNavigationBarColor(botoesSempreBrancos && !escuro ? Color.BLACK : fundo);
            chamada.resolve();
        });
    }
}
