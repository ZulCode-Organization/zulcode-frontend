package com.zul.code.widget;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;

/**
 * O retrato que os widgets desenham.
 *
 * O widget roda fora do navegador do app e não enxerga nem a sessão nem o
 * localStorage. Então o app, toda vez que carrega o perfil, grava aqui o que
 * a barra de cima acabou de mostrar — e os widgets só leem. Nada de token nem
 * de rede no lado nativo.
 *
 * O dia do último estudo vem junto para o widget virar o dia sozinho: à
 * meia-noite a chama apaga e o "estude hoje" aparece mesmo com o app fechado
 * (ver Situacao).
 */
public final class DadosDaOfensiva {
    private static final String ARQUIVO = "zulcode.widget";

    public final int dias;
    /** O que o app disse na hora do retrato. Só vale quando não há `ultimoEstudo` (app antigo). */
    public final boolean acesa;
    public final int protecoes;
    /** aaaa-mm-dd no fuso do celular; vazio quando o app não mandou. */
    public final String ultimoEstudo;
    /** Os dias em que uma proteção segurou a ofensiva (aaaa-mm-dd). */
    public final Set<String> diasProtegidos;
    public final int metaMinutos;
    public final int minutosHoje;
    /** O dia em que `minutosHoje` foi lido: no dia seguinte ele volta a zero. */
    public final String diaDoRetrato;
    public final String nome;
    /** As frases na língua do app (widget.json), cruas, com {dias} e {nome}. */
    public final JSONObject textos;
    /** Falso antes do primeiro login: aí o widget convida a abrir o app. */
    public final boolean temDados;

    private DadosDaOfensiva(SharedPreferences p) {
        dias = p.getInt("dias", 0);
        acesa = p.getBoolean("acesa", false);
        protecoes = p.getInt("protecoes", p.getBoolean("protegida", false) ? 1 : 0);
        ultimoEstudo = p.getString("ultimoEstudo", "");
        diasProtegidos = new HashSet<>(p.getStringSet("diasProtegidos", new HashSet<>()));
        metaMinutos = p.getInt("meta", 10);
        minutosHoje = p.getInt("minutosHoje", 0);
        diaDoRetrato = p.getString("diaDoRetrato", "");
        nome = p.getString("nome", "");
        textos = lerJson(p.getString("textos", "{}"));
        temDados = p.getBoolean("temDados", false);
    }

    private static JSONObject lerJson(String texto) {
        try {
            return new JSONObject(texto);
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    private static SharedPreferences prefs(Context contexto) {
        return contexto.getSharedPreferences(ARQUIVO, Context.MODE_PRIVATE);
    }

    public static DadosDaOfensiva ler(Context contexto) {
        return new DadosDaOfensiva(prefs(contexto));
    }

    /**
     * Grava o que o app mandou e redesenha os widgets. Os campos novos são
     * opcionais: um app publicado antes deles manda só dias, acesa e protegida.
     */
    public static void gravar(Context contexto, JSONObject d) {
        SharedPreferences.Editor e = prefs(contexto).edit()
            .putInt("dias", Math.max(0, d.optInt("dias", 0)))
            .putBoolean("acesa", d.optBoolean("acesa", false))
            .putInt("protecoes", Math.max(0, d.optInt("protecoes", d.optBoolean("protegida", false) ? 1 : 0)))
            .putString("ultimoEstudo", d.optString("ultimoEstudo", ""))
            .putInt("meta", Math.max(1, d.optInt("meta", 10)))
            .putInt("minutosHoje", Math.max(0, d.optInt("minutosHoje", 0)))
            .putString("diaDoRetrato", Situacao.dia(0))
            .putString("nome", d.optString("nome", ""))
            .putBoolean("temDados", true);

        Set<String> protegidos = new HashSet<>();
        JSONArray lista = d.optJSONArray("diasProtegidos");
        if (lista != null) for (int i = 0; i < lista.length(); i++) protegidos.add(lista.optString(i));
        e.putStringSet("diasProtegidos", protegidos);

        JSONObject textos = d.optJSONObject("textos");
        if (textos != null) e.putString("textos", textos.toString());
        e.apply();
        Widgets.redesenharTodos(contexto);
    }

    /** Volta ao estado de quem nunca entrou. Usado quando a pessoa sai da conta. */
    public static void limpar(Context contexto) {
        // Os textos ficam: o convite para entrar continua na língua da pessoa.
        String textos = prefs(contexto).getString("textos", null);
        SharedPreferences.Editor e = prefs(contexto).edit().clear();
        if (textos != null) e.putString("textos", textos);
        e.apply();
        Widgets.redesenharTodos(contexto);
    }
}
