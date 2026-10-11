package com.zul.code.widget;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * As frases dos widgets, na língua do app (widget.json). Chegam cruas e são
 * preenchidas aqui. Antes do primeiro login ainda não chegou nada: valem as
 * de reserva, em português.
 */
final class Textos {

    private final JSONObject t;

    Textos(JSONObject textos) {
        t = textos == null ? new JSONObject() : textos;
    }

    String entrarTitulo() { return caminho("entrar.titulo", "ZulCode"); }
    String entrarTexto() { return caminho("entrar.texto", "Toque para entrar"); }
    String metaTitulo() { return caminho("meta.titulo", "Meta de hoje"); }
    String metaFeita() { return caminho("meta.feita", "Meta cumprida!"); }

    String metaMinutos(int feito, int meta) {
        return caminho("meta.minutos", "{feito} de {meta} min")
            .replace("{feito}", String.valueOf(feito)).replace("{meta}", String.valueOf(meta));
    }

    /** O rótulo embaixo do número. */
    String rotulo(Situacao s) {
        if (s.feitoHoje) return s.dias == 1 ? caminho("rotulos.um", "dia seguido") : caminho("rotulos.varios", "dias seguidos");
        if (s.dias > 0) return caminho("rotulos.estudeHoje", "estude hoje");
        return caminho("rotulos.comeceHoje", "comece hoje");
    }

    /** As iniciais dos dias, de domingo a sábado. */
    String[] iniciais() {
        String[] partes = caminho("semana.iniciais", "D S T Q Q S S").trim().split("\\s+");
        return partes.length == 7 ? partes : new String[] { "D", "S", "T", "Q", "Q", "S", "S" };
    }

    /**
     * O que o Zul diz. A frase é sorteada uma vez por dia e estado: o widget é
     * redesenhado muitas vezes, e trocar de frase a cada vez pareceria defeito.
     */
    String falaDoZul(Situacao s, String nome) {
        if (!s.temDados) return caminho("zul.entrar", "Oi! Entra na sua conta pra eu te acompanhar.");
        String grupo = s.feitoHoje ? "feito" : s.dias <= 0 ? "comecar" : s.noite ? "noite" : "risco";
        List<String> frases = lista("zul." + grupo);
        if (frases.isEmpty()) frases.add(reserva(grupo));
        String frase = frases.get(Math.abs((s.chaveDoDia + grupo).hashCode()) % frases.size());
        return preencher(frase, s.dias, nome);
    }

    private static String reserva(String grupo) {
        switch (grupo) {
            case "feito": return "Mandou bem! Sua chama de {diasTexto} está garantida hoje.";
            case "noite": return "Corre! Sua ofensiva de {diasTexto} apaga à meia-noite.";
            case "risco": return "Sua chama de {diasTexto} está esperando. Bora?";
            default: return "Que tal começar uma ofensiva hoje?";
        }
    }

    private String preencher(String modelo, int dias, String nome) {
        String unidade = dias == 1 ? caminho("unidade.um", "dia") : caminho("unidade.varios", "dias");
        String primeiro = nome == null ? "" : nome.trim().split("\\s+")[0];
        String texto = modelo.replace("{diasTexto}", dias + " " + unidade).replace("{dias}", String.valueOf(dias));
        // Sem nome, a frase não pode ficar com ", ," nem começar por vírgula.
        if (primeiro.isEmpty()) texto = texto.replace(", {nome}", "").replace("{nome}, ", "").replace("{nome}", "");
        return texto.replace("{nome}", primeiro).trim();
    }

    private String caminho(String chave, String reserva) {
        Object valor = buscar(chave);
        return valor instanceof String && !((String) valor).isEmpty() ? (String) valor : reserva;
    }

    /** As frases de um grupo (um objeto com chaves quaisquer: a, b, c…). */
    private List<String> lista(String chave) {
        List<String> frases = new ArrayList<>();
        Object valor = buscar(chave);
        if (valor instanceof JSONObject) {
            JSONObject grupo = (JSONObject) valor;
            Iterator<String> chaves = grupo.keys();
            while (chaves.hasNext()) {
                String frase = grupo.optString(chaves.next(), "");
                if (!frase.isEmpty()) frases.add(frase);
            }
        }
        return frases;
    }

    private Object buscar(String chave) {
        Object atual = t;
        for (String parte : chave.split("\\.")) {
            if (!(atual instanceof JSONObject)) return null;
            atual = ((JSONObject) atual).opt(parte);
        }
        return atual;
    }
}
