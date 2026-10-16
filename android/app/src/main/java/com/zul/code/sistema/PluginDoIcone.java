package com.zul.code.sistema;

import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Arrays;
import java.util.List;

/**
 * Troca o ícone do app na tela inicial, entre os que já vêm no APK.
 *
 * Cada ícone é um activity-alias no AndroidManifest ("IconePadrao",
 * "IconeVampiro"...), todos apontando para a MainActivity; trocar é ligar um e
 * desligar os outros. O Android não deixa baixar um ícone novo: para ter mais
 * um, ele precisa entrar no APK (ver gerar-icones.js e o manifesto).
 *
 * A troca não acontece na hora do pedido. Trocar o componente com o app na
 * tela faz alguns celulares fecharem o app, então o pedido fica guardado e é
 * aplicado quando o app vai para o fundo (MainActivity.onStop).
 */
@CapacitorPlugin(name = "IconeDoApp")
public class PluginDoIcone extends Plugin {

    /** Os ícones que existem no APK. Precisa bater com os aliases do manifesto. */
    public static final List<String> ICONES = Arrays.asList("padrao", "vampiro", "biscoito", "derretido", "frankenstein");
    private static final String PREFERENCIAS = "icone_do_app";
    private static final String DESEJADO = "desejado";

    @PluginMethod
    public void trocar(PluginCall chamada) {
        String nome = chamada.getString("nome", "padrao");
        if (!ICONES.contains(nome)) nome = "padrao";
        preferencias(getContext()).edit().putString(DESEJADO, nome).apply();
        JSObject resposta = new JSObject();
        resposta.put("atual", atual(getContext()));
        resposta.put("pendente", !nome.equals(atual(getContext())));
        chamada.resolve(resposta);
    }

    @PluginMethod
    public void consultar(PluginCall chamada) {
        JSObject resposta = new JSObject();
        resposta.put("atual", atual(getContext()));
        resposta.put("disponiveis", String.join(",", ICONES));
        chamada.resolve(resposta);
    }

    /** Aplica o ícone pedido, se for diferente do que está na tela inicial. Chamado no onStop. */
    public static void aplicarPendente(Context contexto) {
        String desejado = preferencias(contexto).getString(DESEJADO, null);
        if (desejado == null || desejado.equals(atual(contexto))) return;
        PackageManager pm = contexto.getPackageManager();
        // Liga o novo antes de desligar os outros: nunca fica um instante sem ícone.
        pm.setComponentEnabledSetting(componente(contexto, desejado),
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
        for (String nome : ICONES) {
            if (nome.equals(desejado)) continue;
            pm.setComponentEnabledSetting(componente(contexto, nome),
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
        }
    }

    /** O ícone ligado agora. O padrão vale enquanto nenhum outro foi ligado. */
    private static String atual(Context contexto) {
        PackageManager pm = contexto.getPackageManager();
        for (String nome : ICONES) {
            if (nome.equals("padrao")) continue;
            if (pm.getComponentEnabledSetting(componente(contexto, nome)) == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) return nome;
        }
        return "padrao";
    }

    private static ComponentName componente(Context contexto, String nome) {
        String classe = "Icone" + Character.toUpperCase(nome.charAt(0)) + nome.substring(1);
        return new ComponentName(contexto.getPackageName(), "com.zul.code." + classe);
    }

    private static SharedPreferences preferencias(Context contexto) {
        return contexto.getSharedPreferences(PREFERENCIAS, Context.MODE_PRIVATE);
    }
}
