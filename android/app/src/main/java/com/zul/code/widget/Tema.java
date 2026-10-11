package com.zul.code.widget;

/**
 * As cores de cada visual do widget. Claro e escuro são os fundos do app
 * (globals.css); o azul é o degradê do painel da ofensiva.
 */
final class Tema {

    final int fundoTopo;
    final int fundoBase;
    final int texto;
    final int textoSuave;
    /** Trilho da barra da meta e dos dias da semana ainda por vir. */
    final int trilho;
    /** Cor de destaque: a barra da meta e o anel de hoje. */
    final int destaque;
    final int[] chamaApagada;
    /** No fundo azul a chama azul sumiria: ela fica branca. */
    private final boolean chamaClara;
    final int balao;
    final int textoDoBalao;
    /** Opacidade (0 a 255) do brilho atrás da chama: no fundo claro ele manchava. */
    final int brilho;
    /** A barra da meta quando ela foi cumprida. */
    final int metaFeita;

    private Tema(int fundoTopo, int fundoBase, int texto, int textoSuave, int trilho, int destaque,
                 int[] chamaApagada, boolean chamaClara, int balao, int textoDoBalao, int brilho, int metaFeita) {
        this.fundoTopo = fundoTopo;
        this.fundoBase = fundoBase;
        this.texto = texto;
        this.textoSuave = textoSuave;
        this.trilho = trilho;
        this.destaque = destaque;
        this.chamaApagada = chamaApagada;
        this.chamaClara = chamaClara;
        this.balao = balao;
        this.textoDoBalao = textoDoBalao;
        this.brilho = brilho;
        this.metaFeita = metaFeita;
    }

    static final Tema ESCURO = new Tema(0xFF161B26, 0xFF0A0D14, 0xFFF3F6FA, 0xFF94A3B8, 0xFF232A33, 0xFF1892FF,
        new int[] { 0xFF475569, 0xFF64748B }, false, 0xFF1B212A, 0xFFF3F6FA, 0x55, 0xFF22C55E);

    static final Tema CLARO = new Tema(0xFFFFFFFF, 0xFFEEF4FC, 0xFF0F1115, 0xFF62707F, 0xFFE1E8F0, 0xFF1892FF,
        new int[] { 0xFFCBD5E1, 0xFF94A3B8 }, false, 0xFFEAF0F9, 0xFF0F1115, 0x30, 0xFF16A34A);

    static final Tema AZUL = new Tema(0xFF1D4ED8, 0xFF38BDF8, 0xFFFFFFFF, 0xD9FFFFFF, 0x40FFFFFF, 0xFFFFFFFF,
        new int[] { 0x66FFFFFF, 0x99FFFFFF }, true, 0xFFFFFFFF, 0xFF0F1115, 0x40, 0xFF86EFAC);

    /** A chama acesa na faixa de cor da ofensiva; no azul, a faixa azul vira branca. */
    int[] coresDaChama(int[] faixa) {
        if (chamaClara && faixa[0] == 0xFF2563EB) return new int[] { 0xFFFFFFFF, 0xFFBAE6FD };
        return faixa;
    }
}
