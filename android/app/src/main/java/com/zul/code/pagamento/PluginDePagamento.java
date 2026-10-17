package com.zul.code.pagamento;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Collections;
import java.util.List;

/**
 * A compra do PRO pelo Google Play (Play Billing Library).
 *
 * O site, rodando dentro do app, pede os planos (`planos`), compra (`comprar`)
 * e, ao abrir, procura compras já feitas (`compras`). Quem confere de verdade
 * é o servidor: ele recebe o token, pergunta ao Google e confirma a compra.
 * Aqui só se abre a tela de pagamento do Google e se devolve o token.
 */
@CapacitorPlugin(name = "PagamentoGoogle")
public class PluginDePagamento extends Plugin implements PurchasesUpdatedListener {

    private BillingClient cliente;
    /** Os detalhes do produto, da última consulta: a compra precisa deles. */
    private ProductDetails produto;
    /** A chamada de `comprar` à espera do resultado da tela do Google. */
    private PluginCall compraEmAndamento;

    @Override
    public void load() {
        cliente = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build();
    }

    /** Conecta ao Google Play (se ainda não estiver) e então segue. */
    private void conectar(PluginCall chamada, Runnable depois) {
        if (cliente.isReady()) {
            depois.run();
            return;
        }
        cliente.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult resultado) {
                if (resultado.getResponseCode() == BillingClient.BillingResponseCode.OK) depois.run();
                else chamada.reject("O Google Play não está disponível neste aparelho.", String.valueOf(resultado.getResponseCode()));
            }

            @Override
            public void onBillingServiceDisconnected() {
                // A reconexão automática cuida disso; a próxima chamada conecta de novo.
            }
        });
    }

    /** Os planos do produto (base plans e ofertas), com o preço já na moeda da pessoa. */
    @PluginMethod
    public void planos(PluginCall chamada) {
        String id = chamada.getString("produto");
        if (id == null) {
            chamada.reject("Faltou o produto.");
            return;
        }
        conectar(chamada, () -> {
            QueryProductDetailsParams parametros = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(id).setProductType(BillingClient.ProductType.SUBS).build()))
                .build();
            cliente.queryProductDetailsAsync(parametros, (resultado, consulta) -> {
                List<ProductDetails> lista = consulta.getProductDetailsList();
                if (resultado.getResponseCode() != BillingClient.BillingResponseCode.OK || lista.isEmpty()) {
                    chamada.reject("O PRO não está disponível na Play Store agora.", String.valueOf(resultado.getResponseCode()));
                    return;
                }
                produto = lista.get(0);
                JSArray ofertas = new JSArray();
                List<ProductDetails.SubscriptionOfferDetails> detalhes = produto.getSubscriptionOfferDetails();
                if (detalhes != null) {
                    for (ProductDetails.SubscriptionOfferDetails oferta : detalhes) {
                        List<ProductDetails.PricingPhase> fases = oferta.getPricingPhases().getPricingPhaseList();
                        ProductDetails.PricingPhase cheia = fases.get(fases.size() - 1);
                        boolean teste = false;
                        for (ProductDetails.PricingPhase fase : fases) teste |= fase.getPriceAmountMicros() == 0;
                        JSObject item = new JSObject();
                        item.put("plano", oferta.getBasePlanId());
                        item.put("oferta", oferta.getOfferId());
                        item.put("token", oferta.getOfferToken());
                        item.put("preco", cheia.getFormattedPrice());
                        item.put("precoMicros", cheia.getPriceAmountMicros());
                        item.put("periodo", cheia.getBillingPeriod());
                        item.put("comTeste", teste);
                        ofertas.put(item);
                    }
                }
                JSObject resposta = new JSObject();
                resposta.put("ofertas", ofertas);
                chamada.resolve(resposta);
            });
        });
    }

    /** Abre a tela de pagamento do Google para a oferta escolhida. */
    @PluginMethod
    public void comprar(PluginCall chamada) {
        String token = chamada.getString("token");
        String conta = chamada.getString("conta");
        if (token == null || conta == null || produto == null) {
            chamada.reject("Escolha um plano antes de comprar.");
            return;
        }
        if (compraEmAndamento != null) {
            chamada.reject("Já há uma compra em andamento.");
            return;
        }
        conectar(chamada, () -> {
            BillingFlowParams parametros = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Collections.singletonList(BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(produto).setOfferToken(token).build()))
                // Vai junto e volta na conferência do servidor: prende a compra a esta conta do ZulCode.
                .setObfuscatedAccountId(conta)
                .build();
            chamada.setKeepAlive(true);
            compraEmAndamento = chamada;
            BillingResult resultado = cliente.launchBillingFlow(getActivity(), parametros);
            if (resultado.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                compraEmAndamento = null;
                chamada.setKeepAlive(false);
                chamada.reject("Não deu para abrir o pagamento do Google.", String.valueOf(resultado.getResponseCode()));
            }
        });
    }

    /** O resultado da tela do Google. */
    @Override
    public void onPurchasesUpdated(BillingResult resultado, List<Purchase> compras) {
        PluginCall chamada = compraEmAndamento;
        compraEmAndamento = null;
        if (chamada == null) return;
        chamada.setKeepAlive(false);
        int codigo = resultado.getResponseCode();
        if (codigo == BillingClient.BillingResponseCode.USER_CANCELED) {
            chamada.reject("cancelado", "cancelado");
            return;
        }
        if (codigo == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            chamada.reject("Você já assina o PRO por esta conta do Google.", "ja_tem");
            return;
        }
        if (codigo != BillingClient.BillingResponseCode.OK || compras == null || compras.isEmpty()) {
            chamada.reject("O pagamento não foi concluído.", String.valueOf(codigo));
            return;
        }
        Purchase compra = compras.get(0);
        JSObject resposta = new JSObject();
        resposta.put("token", compra.getPurchaseToken());
        // Pagamento pendente (ex.: boleto): o PRO só liga quando o Google confirmar.
        resposta.put("pendente", compra.getPurchaseState() == Purchase.PurchaseState.PENDING);
        chamada.resolve(resposta);
    }

    /** As assinaturas que esta conta do Google já tem: para restaurar em outro aparelho. */
    @PluginMethod
    public void compras(PluginCall chamada) {
        conectar(chamada, () -> cliente.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(),
            (resultado, lista) -> {
                JSArray tokens = new JSArray();
                for (Purchase compra : lista) {
                    if (compra.getPurchaseState() == Purchase.PurchaseState.PURCHASED) tokens.put(compra.getPurchaseToken());
                }
                JSObject resposta = new JSObject();
                resposta.put("tokens", tokens);
                chamada.resolve(resposta);
            }));
    }

    @Override
    protected void handleOnDestroy() {
        if (cliente != null) cliente.endConnection();
    }
}
