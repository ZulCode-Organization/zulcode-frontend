package com.zul.code.widget;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;

import com.zul.code.R;
import com.zul.code.arte.Chama;

/**
 * Os desenhos dos widgets. O Android só aceita um punhado de componentes
 * prontos dentro de um widget, e nenhum deles desenha a chama de duas cores
 * nem o Zul; então cada widget é uma imagem pintada aqui, no tamanho exato
 * que ele ocupa na tela.
 */
final class Pintor {

    private static final Typeface NEGRITO = Typeface.create("sans-serif", Typeface.BOLD);
    private static final Typeface MEDIO = Typeface.create("sans-serif-medium", Typeface.NORMAL);
    /** Largura sobre altura do zul_corpo.png. */
    private static final float PROPORCAO_DO_ZUL = 409f / 373f;

    private Pintor() {}

    // ---------------------------------------------------------------- Ofensiva

    /** A chama e o número. Em pé (quadrado) ou deitado, conforme o espaço. */
    static Bitmap ofensiva(Context c, int w, int h, Situacao s, Tema tema, Textos textos, String nome) {
        Bitmap imagem = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas tela = new Canvas(imagem);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        fundo(tela, w, h, tema, p);
        int[] cores = s.temDados ? s.coresDaChama(tema) : tema.chamaApagada;
        float menor = Math.min(w, h);

        String numero = s.temDados ? String.valueOf(s.dias) : textos.entrarTitulo();
        String rotulo = s.temDados ? textos.rotulo(s) : textos.entrarTexto();

        if (w > h * 1.5f) {
            // Deitado: chama à esquerda, número e rótulo à direita.
            float chama = h * 0.6f;
            float x = h * 0.2f;
            float y = (h - chama) / 2f;
            brilho(tela, x + chama / 2f, y + chama / 2f, chama, cores, s.feitoHoje, tema, p);
            Chama.desenhar(c, tela, x, y, chama, cores);
            float textoX = x + chama + h * 0.14f;
            float largura = w - textoX - h * 0.14f;
            p.setTypeface(NEGRITO);
            p.setColor(s.feitoHoje || !s.temDados ? tema.texto : tema.textoSuave);
            caber(p, numero, largura, h * (s.temDados ? 0.36f : 0.2f), h * 0.12f);
            float baseNumero = h * 0.52f;
            tela.drawText(numero, textoX, baseNumero, p);
            p.setTypeface(MEDIO);
            p.setColor(s.emRisco ? tema.destaque : tema.textoSuave);
            caber(p, rotulo, largura, h * 0.14f, h * 0.08f);
            tela.drawText(rotulo, textoX, baseNumero + h * 0.2f, p);
            return imagem;
        }

        float chama = menor * (h > w * 1.3f ? 0.44f : 0.4f);
        float cx = w / 2f;
        float topo = h * 0.11f;
        brilho(tela, cx, topo + chama / 2f, chama, cores, s.feitoHoje, tema, p);
        Chama.desenhar(c, tela, cx - chama / 2f, topo, chama, cores);

        float base = topo + chama + h * 0.10f;
        p.setTextAlign(Paint.Align.CENTER);
        p.setTypeface(NEGRITO);
        if (!s.temDados) {
            p.setColor(tema.texto);
            caber(p, numero, w * 0.86f, menor * 0.13f, menor * 0.08f);
            tela.drawText(numero, cx, base, p);
            p.setColor(tema.textoSuave);
            caber(p, rotulo, w * 0.86f, menor * 0.095f, menor * 0.06f);
            tela.drawText(rotulo, cx, base + menor * 0.16f, p);
            return imagem;
        }
        p.setColor(s.feitoHoje ? tema.texto : tema.textoSuave);
        caber(p, numero, w * 0.86f, menor * 0.3f, menor * 0.15f);
        tela.drawText(numero, cx, base + menor * 0.16f, p);
        p.setTypeface(MEDIO);
        p.setColor(s.emRisco ? tema.destaque : tema.textoSuave);
        caber(p, rotulo, w * 0.9f, menor * 0.093f, menor * 0.06f);
        tela.drawText(rotulo, cx, base + menor * 0.285f, p);
        return imagem;
    }

    // ---------------------------------------------------------------- Semana

    /** A ofensiva, os sete dias da semana e a meta de hoje. */
    static Bitmap semana(Context c, int w, int h, Situacao s, Tema tema, Textos textos, String nome) {
        Bitmap imagem = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas tela = new Canvas(imagem);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        fundo(tela, w, h, tema, p);
        if (!s.temDados) return convite(c, imagem, tela, w, h, tema, textos, p);

        // Baixo (4x1): tudo numa linha. Alto (4x2): a ofensiva em cima, os
        // dias no meio e a meta embaixo.
        boolean baixo = h < w * 0.36f;
        float margem = Math.min(w, h) * (baixo ? 0.16f : 0.09f);
        int[] cores = s.coresDaChama(tema);
        String numero = String.valueOf(s.dias);
        String rotulo = textos.rotulo(s);

        float linha = baixo ? (h - margem * 2) * 0.8f : h * 0.24f;
        float topo = baixo ? (h - linha) / 2f : margem;
        brilho(tela, margem + linha / 2f, topo + linha / 2f, linha * 0.9f, cores, s.feitoHoje, tema, p);
        Chama.desenhar(c, tela, margem, topo, linha, cores);
        float numeroX = margem + linha + margem * 0.5f;
        p.setTypeface(NEGRITO);
        p.setColor(s.feitoHoje ? tema.texto : tema.textoSuave);
        p.setTextSize(linha * (baixo ? 0.56f : 0.8f));
        float baseNumero = topo + linha * (baixo ? 0.56f : 0.82f);
        tela.drawText(numero, numeroX, baseNumero, p);
        float fimDoNumero = numeroX + p.measureText(numero);

        p.setTypeface(MEDIO);
        p.setColor(s.emRisco ? tema.destaque : tema.textoSuave);
        float semanaX;
        if (baixo) {
            caber(p, rotulo, w * 0.3f, linha * 0.25f, linha * 0.16f);
            tela.drawText(rotulo, numeroX, topo + linha * 0.95f, p);
            semanaX = Math.max(fimDoNumero, numeroX + p.measureText(rotulo)) + margem * 1.2f;
        } else {
            float zul = linha * 1.05f;
            caber(p, rotulo, w - fimDoNumero - margem * 2.6f - zul, linha * 0.36f, linha * 0.24f);
            tela.drawText(rotulo, fimDoNumero + margem * 0.5f, baseNumero, p);
            // O Zul espia no canto, do lado do número.
            Bitmap cabeca = BitmapFactory.decodeResource(c.getResources(), R.drawable.zul_cabeca);
            desenharZul(tela, cabeca, new RectF(w - margem - zul, topo - linha * 0.05f, w - margem, topo + zul - linha * 0.05f), tema, p);
            semanaX = margem;
        }

        // Os últimos sete dias, hoje no fim.
        float semanaLargura = w - margem - semanaX;
        float coluna = semanaLargura / 7f;
        float letra = baixo ? h * 0.13f : h * 0.07f;
        float diametro = Math.min(coluna * 0.72f, baixo ? h * 0.3f : h * 0.17f);
        float semanaTopo = baixo ? (h - letra * 1.4f - diametro) / 2f : topo + linha + h * 0.06f;
        String[] iniciais = textos.iniciais();
        p.setTextAlign(Paint.Align.CENTER);
        float fimDosDias = 0;
        for (int i = 0; i < 7; i++) {
            float cx = semanaX + coluna * (i + 0.5f);
            boolean ehHoje = i == s.hoje;
            p.setTypeface(ehHoje ? NEGRITO : MEDIO);
            p.setTextSize(letra);
            p.setColor(ehHoje ? tema.destaque : tema.textoSuave);
            tela.drawText(iniciais[s.diaDaSemana[i]], cx, semanaTopo + letra, p);
            float cy = semanaTopo + letra * 1.4f + diametro / 2f;
            dia(c, tela, cx, cy, diametro, i, s, tema, p);
            fimDosDias = cy + diametro / 2f;
        }
        p.setTextAlign(Paint.Align.LEFT);
        if (baixo) return imagem;

        // A meta de hoje, de baixo para cima: a barra no pé e o texto em cima dela.
        float barra = h * 0.045f;
        float barraTopo = h - margem - barra;
        float metaBase = barraTopo - h * 0.035f;
        float corpo = h * 0.068f;
        if (metaBase - corpo < fimDosDias + h * 0.025f) return imagem;
        boolean feita = s.minutosHoje >= s.meta;
        p.setTextSize(corpo);
        p.setTypeface(NEGRITO);
        p.setColor(tema.texto);
        tela.drawText(feita ? textos.metaFeita() : textos.metaTitulo(), margem, metaBase, p);
        p.setTypeface(MEDIO);
        p.setColor(tema.textoSuave);
        p.setTextAlign(Paint.Align.RIGHT);
        tela.drawText(textos.metaMinutos(Math.min(s.minutosHoje, 999), s.meta), w - margem, metaBase, p);
        p.setTextAlign(Paint.Align.LEFT);
        RectF trilho = new RectF(margem, barraTopo, w - margem, barraTopo + barra);
        p.setColor(tema.trilho);
        tela.drawRoundRect(trilho, barra / 2f, barra / 2f, p);
        float fracao = Math.min(1f, s.minutosHoje / (float) s.meta);
        if (fracao > 0) {
            RectF cheio = new RectF(margem, barraTopo, margem + Math.max(barra, trilho.width() * fracao), barraTopo + barra);
            p.setColor(feita ? tema.metaFeita : tema.destaque);
            tela.drawRoundRect(cheio, barra / 2f, barra / 2f, p);
        }
        return imagem;
    }

    /** Um dia: chama acesa (roxa se uma proteção o salvou), hoje por fazer, ou apagado. */
    private static void dia(Context c, Canvas tela, float cx, float cy, float d, int i, Situacao s, Tema tema, Paint p) {
        float r = d / 2f;
        if (s.semanaAcesa[i]) {
            // Na cor da faixa da ofensiva; o dia salvo por uma proteção fica roxo, como no app.
            int[] faixa = Chama.cores(Math.max(1, s.dias), true, s.semanaProtegida[i]);
            float icone = d * 0.62f;
            p.setColor(tema == Tema.AZUL ? 0xFFFFFFFF : faixa[0]);
            tela.drawCircle(cx, cy, r, p);
            int[] dentro = tema == Tema.AZUL ? faixa : new int[] { 0xFFFFFFFF, faixa[1] };
            Chama.desenhar(c, tela, cx - icone / 2f, cy - icone / 2f, icone, dentro);
            return;
        }
        if (i == s.hoje) {
            // Hoje, ainda por fazer: o anel chama para a lição.
            p.setStyle(Paint.Style.STROKE);
            p.setStrokeWidth(d * 0.1f);
            p.setColor(tema.destaque);
            tela.drawCircle(cx, cy, r - d * 0.05f, p);
            p.setStyle(Paint.Style.FILL);
            float icone = d * 0.5f;
            Chama.desenhar(c, tela, cx - icone / 2f, cy - icone / 2f, icone, tema.chamaApagada);
            return;
        }
        p.setColor(tema.trilho);
        tela.drawCircle(cx, cy, r, p);
    }

    // ---------------------------------------------------------------- Zul

    /** O Zul e um balão com o recado do dia. */
    static Bitmap zul(Context c, int w, int h, Situacao s, Tema tema, Textos textos, String nome) {
        Bitmap imagem = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas tela = new Canvas(imagem);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        fundo(tela, w, h, tema, p);
        String fala = textos.falaDoZul(s, nome);
        Bitmap zul = BitmapFactory.decodeResource(c.getResources(), poseDoZul(s));
        float menor = Math.min(w, h);
        float margem = menor * 0.08f;

        if (w > h * 1.3f) {
            // Deitado: o Zul à esquerda, o balão à direita apontando para ele.
            float zulAltura = h * 0.74f;
            float zulLargura = zulAltura * PROPORCAO_DO_ZUL;
            RectF onde = new RectF(margem, h - margem - zulAltura, margem + zulLargura, h - margem);
            desenharZul(tela, zul, onde, tema, p);
            float balaoX = onde.right + margem * 0.9f;
            RectF balao = new RectF(balaoX, margem, w - margem, h * (s.temDados ? 0.66f : 0.86f));
            balao(tela, balao, balaoX, h * 0.42f, true, tema, p);
            texto(tela, fala, balao, menor * 0.12f, menor * 0.07f, tema.textoDoBalao, menor * 0.07f);
            if (s.temDados) etiqueta(c, tela, balaoX, h - margem, h * 0.2f, s, tema, textos, p);
            return imagem;
        }

        // Em pé: o balão em cima, o Zul embaixo à direita e a chama à esquerda.
        RectF balao = new RectF(margem, margem, w - margem, h * 0.52f);
        float zulAltura = h * 0.38f;
        float zulLargura = zulAltura * PROPORCAO_DO_ZUL;
        RectF onde = new RectF(w - margem - zulLargura, h - margem - zulAltura, w - margem, h - margem);
        balao(tela, balao, onde.centerX(), balao.bottom, false, tema, p);
        texto(tela, fala, balao, menor * 0.1f, menor * 0.065f, tema.textoDoBalao, menor * 0.06f);
        desenharZul(tela, zul, onde, tema, p);
        if (s.temDados) etiqueta(c, tela, margem, h - margem, h * 0.2f, s, tema, textos, p);
        return imagem;
    }

    /**
     * Qual desenho do Zul aparece em cada momento. Por enquanto há um só;
     * quando chegarem as outras poses (comemorando, preocupado, dormindo),
     * é só trocar aqui.
     */
    private static int poseDoZul(Situacao s) {
        return R.drawable.zul_corpo;
    }

    /** O Zul; no visual azul, com um halo claro atrás para não sumir no fundo. */
    private static void desenharZul(Canvas tela, Bitmap zul, RectF onde, Tema tema, Paint p) {
        if (zul == null) return;
        if (tema == Tema.AZUL) {
            float raio = Math.max(onde.width(), onde.height()) * 0.62f;
            p.setShader(new RadialGradient(onde.centerX(), onde.centerY(), raio, new int[] { 0x80FFFFFF, 0x00FFFFFF },
                new float[] { 0.35f, 1f }, Shader.TileMode.CLAMP));
            tela.drawCircle(onde.centerX(), onde.centerY(), raio, p);
            p.setShader(null);
        }
        tela.drawBitmap(zul, null, onde, p);
    }

    /** A chama pequena com o número, no pé do widget do Zul. */
    private static void etiqueta(Context c, Canvas tela, float x, float base, float altura, Situacao s, Tema tema, Textos textos, Paint p) {
        int[] cores = s.coresDaChama(tema);
        Chama.desenhar(c, tela, x, base - altura, altura, cores);
        p.setTypeface(NEGRITO);
        p.setTextAlign(Paint.Align.LEFT);
        p.setTextSize(altura * 0.72f);
        p.setColor(s.feitoHoje ? tema.texto : tema.textoSuave);
        String numero = String.valueOf(s.dias);
        tela.drawText(numero, x + altura * 1.12f, base - altura * 0.18f, p);
    }

    // ---------------------------------------------------------------- Peças

    private static Bitmap convite(Context c, Bitmap imagem, Canvas tela, int w, int h, Tema tema, Textos textos, Paint p) {
        float menor = Math.min(w, h);
        float chama = menor * 0.42f;
        float x = w > h * 1.5f ? h * 0.2f : (w - chama) / 2f;
        Chama.desenhar(c, tela, x, (h - chama) / 2f - (w > h * 1.5f ? 0 : menor * 0.12f), chama, tema.chamaApagada);
        p.setTypeface(NEGRITO);
        p.setColor(tema.texto);
        if (w > h * 1.5f) {
            float textoX = x + chama + h * 0.14f;
            caber(p, textos.entrarTitulo(), w - textoX - h * 0.1f, h * 0.2f, h * 0.1f);
            tela.drawText(textos.entrarTitulo(), textoX, h * 0.5f, p);
            p.setTypeface(MEDIO);
            p.setColor(tema.textoSuave);
            caber(p, textos.entrarTexto(), w - textoX - h * 0.1f, h * 0.13f, h * 0.08f);
            tela.drawText(textos.entrarTexto(), textoX, h * 0.68f, p);
        } else {
            p.setTextAlign(Paint.Align.CENTER);
            caber(p, textos.entrarTitulo(), w * 0.86f, menor * 0.13f, menor * 0.08f);
            tela.drawText(textos.entrarTitulo(), w / 2f, h * 0.72f, p);
            p.setTypeface(MEDIO);
            p.setColor(tema.textoSuave);
            caber(p, textos.entrarTexto(), w * 0.86f, menor * 0.095f, menor * 0.06f);
            tela.drawText(textos.entrarTexto(), w / 2f, h * 0.72f + menor * 0.15f, p);
            p.setTextAlign(Paint.Align.LEFT);
        }
        return imagem;
    }

    /** O fundo com cantos arredondados, no degradê do tema. */
    private static void fundo(Canvas tela, int w, int h, Tema tema, Paint p) {
        float raio = Math.min(w, h) * 0.16f;
        p.setShader(tema == Tema.AZUL
            ? new LinearGradient(0, 0, w, h, tema.fundoTopo, tema.fundoBase, Shader.TileMode.CLAMP)
            : new LinearGradient(0, 0, 0, h, tema.fundoTopo, tema.fundoBase, Shader.TileMode.CLAMP));
        tela.drawRoundRect(new RectF(0, 0, w, h), raio, raio, p);
        p.setShader(null);
    }

    /** O brilho ao redor da chama acesa: dá a sensação de calor. */
    private static void brilho(Canvas tela, float cx, float cy, float chama, int[] cores, boolean acesa, Tema tema, Paint p) {
        if (!acesa) return;
        float raio = chama * 1.15f;
        p.setShader(new RadialGradient(cx, cy, raio, new int[] { (cores[0] & 0x00FFFFFF) | (tema.brilho << 24), 0x00000000 },
            new float[] { 0f, 1f }, Shader.TileMode.CLAMP));
        tela.drawCircle(cx, cy, raio, p);
        p.setShader(null);
    }

    /** Balão de fala com a ponta em (pontaX, pontaY): para a esquerda (deitado) ou para baixo (em pé). */
    private static void balao(Canvas tela, RectF r, float pontaX, float pontaY, boolean paraEsquerda, Tema tema, Paint p) {
        float raio = Math.min(r.width(), r.height()) * 0.22f;
        float ponta = Math.min(r.width(), r.height()) * 0.14f;
        Path forma = new Path();
        forma.addRoundRect(r, raio, raio, Path.Direction.CW);
        Path bico = new Path();
        if (paraEsquerda) {
            float y = Math.min(Math.max(pontaY, r.top + raio + ponta), r.bottom - raio - ponta);
            bico.moveTo(r.left + 1, y - ponta);
            bico.lineTo(r.left - ponta, y + ponta * 0.4f);
            bico.lineTo(r.left + 1, y + ponta);
        } else {
            float x = Math.min(Math.max(pontaX, r.left + raio + ponta), r.right - raio - ponta);
            bico.moveTo(x - ponta, r.bottom - 1);
            bico.lineTo(x + ponta * 0.2f, r.bottom + ponta);
            bico.lineTo(x + ponta, r.bottom - 1);
        }
        bico.close();
        forma.op(bico, Path.Op.UNION);
        p.setColor(tema.balao);
        tela.drawPath(forma, p);
    }

    /** Texto quebrado em linhas dentro de `r`, diminuindo até caber. */
    private static void texto(Canvas tela, String texto, RectF r, float tamanho, float minimo, int cor, float folga) {
        TextPaint tp = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        tp.setTypeface(NEGRITO);
        tp.setColor(cor);
        int largura = (int) (r.width() - folga * 2);
        if (largura <= 0) return;
        StaticLayout linhas;
        float t = tamanho;
        do {
            tp.setTextSize(t);
            linhas = StaticLayout.Builder.obtain(texto, 0, texto.length(), tp, largura)
                .setAlignment(Layout.Alignment.ALIGN_NORMAL).setLineSpacing(0, 1.05f).setIncludePad(false).build();
            t -= 1;
        } while (linhas.getHeight() > r.height() - folga * 2 && t >= minimo);
        tela.save();
        tela.translate(r.left + folga, r.top + Math.max(folga, (r.height() - linhas.getHeight()) / 2f));
        tela.clipRect(0, 0, largura, r.height() - folga);
        linhas.draw(tela);
        tela.restore();
    }

    /** Diminui o texto até ele caber em `largura`. */
    private static void caber(Paint p, String texto, float largura, float tamanho, float minimo) {
        float t = tamanho;
        p.setTextSize(t);
        while (p.measureText(texto) > largura && t > minimo) {
            t -= 1;
            p.setTextSize(t);
        }
    }
}
