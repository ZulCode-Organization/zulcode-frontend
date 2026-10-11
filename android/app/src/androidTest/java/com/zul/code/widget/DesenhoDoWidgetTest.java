package com.zul.code.widget;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.graphics.Bitmap;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.File;
import java.io.FileOutputStream;

/**
 * Desenha cada widget em cada estado e visual e guarda as imagens, para
 * conferir o resultado sem arrastá-los para a tela inicial à mão.
 *
 * Também confere o que mais importa: a cor da chama acompanha as faixas do
 * app, e o dia vira sozinho (a chama de ontem apaga; dois dias sem estudo,
 * sem proteção, zeram a ofensiva).
 */
@RunWith(AndroidJUnit4.class)
public class DesenhoDoWidgetTest {

    private static final float DENSIDADE = 2.75f;
    /** Uma amostra de widget.json, como o app manda. */
    private static final String TEXTOS = "{\"rotulos\":{\"um\":\"dia seguido\",\"varios\":\"dias seguidos\",\"estudeHoje\":\"estude hoje\",\"comeceHoje\":\"comece hoje\"},"
        + "\"unidade\":{\"um\":\"dia\",\"varios\":\"dias\"},\"semana\":{\"iniciais\":\"D S T Q Q S S\"},"
        + "\"meta\":{\"titulo\":\"Meta de hoje\",\"feita\":\"Meta cumprida!\",\"minutos\":\"{feito} de {meta} min\"},"
        + "\"zul\":{\"feito\":{\"1\":\"Mandou bem! Sua chama de {diasTexto} está garantida hoje.\"},"
        + "\"risco\":{\"1\":\"Uma lição rapidinha e a ofensiva de {diasTexto} segue firme.\"},"
        + "\"noite\":{\"1\":\"Corre! Sua ofensiva de {diasTexto} apaga à meia-noite.\"},"
        + "\"comecar\":{\"1\":\"Bora aprender algo novo, {nome}?\"}}}";

    private Context contexto() {
        return InstrumentationRegistry.getInstrumentation().getTargetContext();
    }

    private void gravar(int dias, int ultimoEstudoAtras, int protecoes, int minutos) throws Exception {
        JSONObject d = new JSONObject();
        d.put("dias", dias);
        d.put("acesa", ultimoEstudoAtras == 0);
        d.put("protecoes", protecoes);
        d.put("ultimoEstudo", ultimoEstudoAtras < 0 ? "" : Situacao.dia(-ultimoEstudoAtras));
        d.put("diasProtegidos", new JSONArray().put(Situacao.dia(-2)));
        d.put("meta", 10);
        d.put("minutosHoje", minutos);
        d.put("nome", "Vitor Moreira");
        d.put("textos", new JSONObject(TEXTOS));
        DadosDaOfensiva.gravar(contexto(), d);
    }

    private Bitmap salvar(String tipo, int larguraDp, int alturaDp, Tema tema, String nome) throws Exception {
        Bitmap imagem = Widgets.pintar(contexto(), tipo, Math.round(larguraDp * DENSIDADE), Math.round(alturaDp * DENSIDADE), tema);
        File destino = new File(contexto().getExternalFilesDir(null), nome + ".png");
        try (FileOutputStream saida = new FileOutputStream(destino)) {
            imagem.compress(Bitmap.CompressFormat.PNG, 100, saida);
        }
        assertTrue(destino.length() > 0);
        return imagem;
    }

    /** Os três widgets, nos tamanhos do seletor e nos três visuais. */
    private void todos(String estado) throws Exception {
        Tema[] temas = { Tema.ESCURO, Tema.CLARO, Tema.AZUL };
        String[] nomes = { "escuro", "claro", "azul" };
        for (int i = 0; i < temas.length; i++) {
            salvar(Widgets.OFENSIVA, 160, 170, temas[i], estado + "-ofensiva-2x2-" + nomes[i]);
            salvar(Widgets.SEMANA, 330, 170, temas[i], estado + "-semana-4x2-" + nomes[i]);
            salvar(Widgets.ZUL, 330, 170, temas[i], estado + "-zul-4x2-" + nomes[i]);
        }
        salvar(Widgets.OFENSIVA, 75, 80, Tema.ESCURO, estado + "-ofensiva-1x1-escuro");
        salvar(Widgets.OFENSIVA, 250, 80, Tema.ESCURO, estado + "-ofensiva-3x1-escuro");
        salvar(Widgets.SEMANA, 330, 80, Tema.ESCURO, estado + "-semana-4x1-escuro");
        salvar(Widgets.ZUL, 160, 170, Tema.ESCURO, estado + "-zul-2x2-escuro");
        salvar(Widgets.ZUL, 160, 170, Tema.CLARO, estado + "-zul-2x2-claro");
    }

    @Test
    public void desenhaCadaEstado() throws Exception {
        gravar(12, 0, 0, 6);
        todos("01-feito");
        gravar(12, 1, 0, 0);
        todos("02-risco");
        gravar(45, 0, 2, 15);
        todos("03-protegida");
        gravar(120, 0, 0, 12);
        todos("04-dourada");
        gravar(0, -1, 0, 0);
        todos("05-zero");
        gravar(1, 0, 0, 3);
        todos("06-um-dia");
        DadosDaOfensiva.limpar(contexto());
        todos("07-sem-conta");
    }

    /**
     * As prévias do seletor de widgets do Android (res/drawable-nodpi e
     * drawable-night-nodpi): 12 dias, hoje feito, meta pela metade.
     */
    @Test
    public void previasDoSeletor() throws Exception {
        JSONObject d = new JSONObject();
        d.put("dias", 12);
        d.put("acesa", true);
        d.put("ultimoEstudo", Situacao.dia(0));
        d.put("meta", 10);
        d.put("minutosHoje", 6);
        d.put("textos", new JSONObject(TEXTOS));
        DadosDaOfensiva.gravar(contexto(), d);
        String[][] tamanhos = { { Widgets.OFENSIVA, "160", "170" }, { Widgets.SEMANA, "330", "170" }, { Widgets.ZUL, "330", "170" } };
        for (String[] t : tamanhos) {
            int largura = Integer.parseInt(t[1]), altura = Integer.parseInt(t[2]);
            salvar(t[0], largura, altura, Tema.CLARO, "previa-" + t[0] + "-claro");
            salvar(t[0], largura, altura, Tema.ESCURO, "previa-" + t[0] + "-escuro");
        }
    }

    /** O pixel do meio da chama do widget pequeno, onde a faixa de cor aparece. */
    private int corDaChama(int dias, int atras, int protecoes) throws Exception {
        gravar(dias, atras, protecoes, 0);
        Bitmap b = Widgets.pintar(contexto(), Widgets.OFENSIVA, 330, 330, Tema.ESCURO);
        return b.getPixel(165, (int) (330 * 0.28));
    }

    @Test
    public void aChamaSegueAsFaixas() throws Exception {
        int azul = corDaChama(7, 0, 0);
        int ciano = corDaChama(45, 0, 0);
        int dourada = corDaChama(120, 0, 0);
        int protegida = corDaChama(45, 0, 1);
        int apagada = corDaChama(7, 1, 0);
        assertNotEquals(azul, ciano);
        assertNotEquals(ciano, dourada);
        assertNotEquals(dourada, protegida);
        assertNotEquals(azul, apagada);
    }

    @Test
    public void oDiaViraSozinho() throws Exception {
        gravar(5, 0, 0, 7);
        Situacao hoje = new Situacao(DadosDaOfensiva.ler(contexto()));
        assertTrue(hoje.feitoHoje);
        assertEquals(5, hoje.dias);
        assertEquals(7, hoje.minutosHoje);
        assertTrue(hoje.semanaAcesa[hoje.hoje]);

        // Estudou ontem: a ofensiva continua, mas hoje ainda está por fazer.
        gravar(5, 1, 0, 0);
        Situacao ontem = new Situacao(DadosDaOfensiva.ler(contexto()));
        assertFalse(ontem.feitoHoje);
        assertTrue(ontem.emRisco);
        assertEquals(5, ontem.dias);
        assertFalse(ontem.semanaAcesa[ontem.hoje]);
        if (ontem.hoje > 0) assertTrue(ontem.semanaAcesa[ontem.hoje - 1]);

        // Dois dias sem estudo e sem proteção: a ofensiva se perdeu.
        gravar(5, 2, 0, 0);
        assertEquals(0, new Situacao(DadosDaOfensiva.ler(contexto())).dias);
        // Com proteção guardada, quem decide é o servidor: o número fica.
        gravar(5, 2, 1, 0);
        assertEquals(5, new Situacao(DadosDaOfensiva.ler(contexto())).dias);
    }

    /** Sair da conta apaga os números, mas não a língua dos textos. */
    @Test
    public void sairDaContaLimpa() throws Exception {
        gravar(42, 0, 1, 0);
        assertTrue(DadosDaOfensiva.ler(contexto()).temDados);
        DadosDaOfensiva.limpar(contexto());
        DadosDaOfensiva lido = DadosDaOfensiva.ler(contexto());
        assertFalse(lido.temDados);
        assertEquals(0, lido.dias);
        assertTrue(lido.textos.has("rotulos"));
    }
}
