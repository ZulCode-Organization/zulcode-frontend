package com.zul.code.sistema;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.review.ReviewInfo;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;

/**
 * A janela de avaliação da Play Store, dentro do app (In-App Review).
 *
 * Quem decide se ela aparece é o Google: ele tem uma cota por pessoa e não
 * conta se apareceu nem se a pessoa avaliou. Por isso o "pedir" sempre termina
 * bem; quando escolher a hora, quem chama é o lado web (lib/avaliacao.ts).
 * Também não pode pedir "5 estrelas" nem dar prêmio em troca: é regra da Play.
 */
@CapacitorPlugin(name = "AvaliacaoNaLoja")
public class PluginDaAvaliacao extends Plugin {

    @PluginMethod
    public void pedir(PluginCall chamada) {
        ReviewManager gerente = ReviewManagerFactory.create(getContext());
        gerente.requestReviewFlow().addOnCompleteListener(pedido -> {
            if (!pedido.isSuccessful() || getActivity() == null) {
                chamada.resolve(resposta(false));
                return;
            }
            ReviewInfo info = pedido.getResult();
            gerente.launchReviewFlow(getActivity(), info)
                .addOnCompleteListener(fluxo -> chamada.resolve(resposta(true)));
        });
    }

    /**
     * Abre a página do ZulCode na Play Store (o botão "Avaliar" do fim do
     * nivelamento). Sem o app da Play no aparelho, abre a página no navegador.
     */
    @PluginMethod
    public void abrirLoja(PluginCall chamada) {
        String pacote = getContext().getPackageName();
        Intent loja = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + pacote));
        loja.setPackage("com.android.vending");
        loja.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(loja);
        } catch (ActivityNotFoundException semPlay) {
            Intent site = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + pacote));
            site.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getContext().startActivity(site);
            } catch (ActivityNotFoundException semNavegador) {
                chamada.reject("Não foi possível abrir a Play Store.");
                return;
            }
        }
        chamada.resolve();
    }

    private static JSObject resposta(boolean pedido) {
        JSObject r = new JSObject();
        r.put("pedido", pedido);
        return r;
    }
}
