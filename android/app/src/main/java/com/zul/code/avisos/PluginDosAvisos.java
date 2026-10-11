package com.zul.code.avisos;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * A ponte entre o app e os avisos (ver `src/lib/avisos.ts`).
 *
 * Também avisa o app quando ele foi aberto tocando numa notificação, com a
 * tela para onde ir — o evento fica guardado até o app ouvir, porque numa
 * abertura do zero ele chega antes de a página carregar.
 */
@CapacitorPlugin(
    name = "AvisosDoZul",
    permissions = { @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "avisos") }
)
public class PluginDosAvisos extends Plugin {

    @Override
    public void load() {
        verificarRota(getActivity().getIntent());
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        verificarRota(intent);
    }

    private void verificarRota(Intent intent) {
        if (intent == null || !intent.hasExtra(Avisos.EXTRA_ROTA)) return;
        String rota = intent.getStringExtra(Avisos.EXTRA_ROTA);
        int aviso = intent.getIntExtra(Avisos.EXTRA_AVISO, -1);
        if (aviso >= 0) NotificationManagerCompat.from(getContext()).cancel(aviso);
        intent.removeExtra(Avisos.EXTRA_AVISO);
        // Sem isto, girar o celular ou recarregar a página reabriria a mesma tela.
        intent.removeExtra(Avisos.EXTRA_ROTA);
        JSObject dados = new JSObject();
        dados.put("rota", rota);
        notifyListeners("avisoTocado", dados, true);
    }

    @PluginMethod
    public void estado(PluginCall chamada) {
        chamada.resolve(retratoDoEstado());
    }

    @PluginMethod
    public void pedirPermissao(PluginCall chamada) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && getPermissionState("avisos") != PermissionState.GRANTED) {
            requestPermissionForAlias("avisos", chamada, "depoisDaPermissao");
        } else {
            chamada.resolve(retratoDoEstado());
        }
    }

    @PermissionCallback
    private void depoisDaPermissao(PluginCall chamada) {
        chamada.resolve(retratoDoEstado());
    }

    /** Liga, desliga ou muda o horário do lembrete, e guarda os textos na língua da pessoa. */
    @PluginMethod
    public void configurar(PluginCall chamada) {
        SharedPreferences p = Lembretes.prefs(getContext());
        JSObject textos = chamada.getObject("textos");
        Lembretes.configurar(getContext(),
            Boolean.TRUE.equals(chamada.getBoolean("ativo", p.getBoolean("ativo", false))),
            chamada.getInt("hora", p.getInt("hora", 19)),
            chamada.getInt("minuto", p.getInt("minuto", 0)),
            textos != null ? textos.toString() : null);
        chamada.resolve(retratoDoEstado());
    }

    @PluginMethod
    public void progresso(PluginCall chamada) {
        Lembretes.progresso(getContext(),
            chamada.getInt("dias", 0),
            chamada.getString("ultimoEstudo", ""),
            chamada.getString("nome", ""));
        chamada.resolve();
    }

    /** Mostra um lembrete agora, para a pessoa ver como ele aparece. */
    @PluginMethod
    public void exemplo(PluginCall chamada) {
        Lembretes.disparar(getContext(), "lembrete", true);
        chamada.resolve();
    }

    /**
     * Abre a tela de notificações do ZulCode nas configurações do Android.
     * Depois de a pessoa negar duas vezes, o Android não pergunta mais: o
     * único caminho para liberar é este.
     */
    @PluginMethod
    public void abrirConfiguracoes(PluginCall chamada) {
        Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName())
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        chamada.resolve();
    }

    @PluginMethod
    public void limpar(PluginCall chamada) {
        Lembretes.limpar(getContext());
        NotificationManagerCompat.from(getContext()).cancelAll();
        chamada.resolve();
    }

    private JSObject retratoDoEstado() {
        SharedPreferences p = Lembretes.prefs(getContext());
        JSObject estado = new JSObject();
        estado.put("ativas", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        estado.put("permissao", Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            ? getPermissionState("avisos").toString() : "granted");
        // O plugin do Google só gera este texto quando o google-services.json
        // está no projeto: é o jeito de saber se o Firebase existe sem chamá-lo
        // (chamar o Firebase sem ele configurado fecha o app).
        estado.put("firebase", getContext().getResources().getIdentifier("google_app_id", "string", getContext().getPackageName()) != 0);
        JSObject lembrete = new JSObject();
        lembrete.put("ativo", p.getBoolean("ativo", false));
        lembrete.put("hora", p.getInt("hora", 19));
        lembrete.put("minuto", p.getInt("minuto", 0));
        estado.put("lembrete", lembrete);
        return estado;
    }
}
