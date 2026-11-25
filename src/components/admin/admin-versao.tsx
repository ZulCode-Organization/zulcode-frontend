"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Pagina } from "./shell";
import { AreaDeTexto, Botao, Cabecalho, Cartao, Entrada, Erro, Esqueleto, Interruptor, Rotulo } from "./ui";
import { avisar } from "./avisos";
import { invalidar, pedir, useDados } from "@/lib/admin/api";
import { numero, porcento } from "@/lib/admin/formato";
import { cn } from "@/lib/utils";
import { textoDaAtualizacao } from "@/components/avisos/aviso-de-atualizacao";
import type { DistribuicaoDeVersoes, VersaoDoApp } from "@/lib/admin/tipos";

const CHAVE = "/admin/versao-do-app";

/**
 * A barra de "atualização disponível" do app Android. Depois de publicar um
 * .aab novo na Play Store, informe aqui o versionCode dele: quem estiver com
 * uma versão menor vê a barra descer do topo ao abrir o app.
 */
export function AdminVersao() {
  const { dados, erro, recarregar } = useDados<VersaoDoApp>(CHAVE);
  return (
    <Pagina>
      <Cabecalho
        titulo="Atualização do app"
        descricao="Depois de publicar uma versão nova na Play Store, avise aqui. Quem estiver com uma versão mais antiga vê uma barra descer do topo ao abrir o app, com o botão para atualizar."
      />
      {erro && !dados ? (
        <Erro tentarDeNovo={recarregar}>{erro}</Erro>
      ) : !dados ? (
        <Esqueleto linhas={6} />
      ) : (
        <div className="space-y-4">
          <Formulario inicial={dados} />
          <Distribuicao publicada={dados.versionCode} />
        </div>
      )}
    </Pagina>
  );
}

/**
 * Quem está em cada versão do app Android, contando quem abriu o app nos
 * últimos 30 dias. O app conta a própria versão ao abrir, então os números
 * enchem conforme as pessoas entram.
 */
function Distribuicao({ publicada }: { publicada: number }) {
  const { dados: d, erro, recarregar } = useDados<DistribuicaoDeVersoes>(`${CHAVE}/distribuicao`);
  const maior = Math.max(1, ...(d?.versoes.map((v) => v.pessoas) ?? []));
  const atualizados = d?.versoes.filter((v) => publicada > 0 && v.versionCode >= publicada).reduce((n, v) => n + v.pessoas, 0) ?? 0;

  return (
    <Cartao titulo="Quem está em cada versão" descricao="Quem abriu o app Android nos últimos 30 dias. O app conta a própria versão ao abrir." corpo="space-y-4 p-4">
      {erro && !d ? (
        <Erro tentarDeNovo={recarregar}>{erro}</Erro>
      ) : !d ? (
        <Esqueleto linhas={4} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><p className="text-xs font-bold text-muted-foreground">No app</p><p className="text-xl font-black">{numero(d.noApp)}</p></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">Na versão mais nova</p>
              <p className="text-xl font-black">{publicada > 0 ? `${numero(atualizados)}` : "—"}</p>
            </div>
            <div><p className="text-xs font-bold text-muted-foreground">Desatualizados</p><p className={cn("text-xl font-black", publicada > 0 && d.noApp - atualizados > 0 && "text-amber-600")}>{publicada > 0 ? numero(d.noApp - atualizados) : "—"}</p></div>
            <div><p className="text-xs font-bold text-muted-foreground">Só pelo navegador</p><p className="text-xl font-black">{numero(d.soNavegador)}</p></div>
          </div>
          {d.versoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguém contou a versão ainda. Os números aparecem conforme as pessoas abrem o app.</p>
          ) : (
            <ul className="space-y-2">
              {d.versoes.map((v) => {
                const nova = publicada > 0 && v.versionCode >= publicada;
                return (
                  <li key={`${v.versionCode}-${v.versionName ?? ""}`} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
                    <span className="truncate font-bold">
                      {v.versionName ?? "?"} <span className="font-normal text-muted-foreground">({v.versionCode})</span>
                    </span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <span className={cn("block h-full rounded-full", nova ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${Math.max(2, (v.pessoas / maior) * 100)}%` }} />
                    </span>
                    <span className="w-24 text-right text-xs text-muted-foreground">
                      <b className="text-foreground">{numero(v.pessoas)}</b> · {porcento(d.noApp ? (v.pessoas / d.noApp) * 100 : 0, 0)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Cartao>
  );
}

function Formulario({ inicial }: { inicial: VersaoDoApp }) {
  const [v, setV] = useState<VersaoDoApp>(inicial);
  const [salvando, setSalvando] = useState(false);
  const mudar = (parte: Partial<VersaoDoApp>) => setV((atual) => ({ ...atual, ...parte }));

  const salvar = async () => {
    setSalvando(true);
    try {
      await pedir(CHAVE, { method: "PUT", json: { ...v, versionCode: Math.trunc(Number(v.versionCode) || 0) } });
      invalidar(CHAVE);
      avisar(v.ligado ? "Aviso de atualização ligado." : "Aviso de atualização desligado.");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível salvar.", { tom: "erro" });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Cartao titulo="A versão nova" corpo="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <div>
            <p className="text-sm font-black">Mostrar a barra</p>
            <p className="text-xs text-muted-foreground">Desligada, ninguém vê o aviso, qualquer que seja a versão.</p>
          </div>
          <Interruptor ligado={v.ligado} aoMudar={(ligado) => mudar({ ligado })} rotulo="Mostrar a barra de atualização" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Rotulo texto="versionCode publicado" dica="O número que sobe a cada envio para a Play Store (o .aab da 2.1 é o 4).">
            <Entrada inputMode="numeric" value={String(v.versionCode)} onChange={(e) => mudar({ versionCode: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
          </Rotulo>
          <Rotulo texto="Nome da versão" dica="O que a pessoa lê, como 2.1.">
            <Entrada value={v.versionName} onChange={(e) => mudar({ versionName: e.target.value })} maxLength={20} placeholder="2.1" />
          </Rotulo>
        </div>
        <Rotulo texto="Texto da barra" dica="Opcional. Vazio, usa o texto padrão que aparece na prévia.">
          <AreaDeTexto value={v.mensagem} onChange={(e) => mudar({ mensagem: e.target.value })} maxLength={300} placeholder="Ex.: Novos ícones do app e correções." />
        </Rotulo>
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <div>
            <p className="text-sm font-black">Atualização obrigatória</p>
            <p className="text-xs text-muted-foreground">Sem o botão &quot;Depois&quot;: só para quando a versão antiga parou de funcionar.</p>
          </div>
          <Interruptor ligado={v.obrigatoria} aoMudar={(obrigatoria) => mudar({ obrigatoria })} rotulo="Atualização obrigatória" />
        </div>
        <Botao variante="primario" carregando={salvando} onClick={salvar} disabled={v.ligado && !(v.versionCode > 0)}>Salvar</Botao>
      </Cartao>

      <Cartao titulo="Prévia" descricao="Como a barra desce do topo do app." corpo="p-4">
        <div className="overflow-hidden rounded-2xl border bg-background">
          <div className="rounded-b-[20px] border-b bg-card p-4 shadow-md">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Download className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-black">Atualização disponível</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{textoDaAtualizacao(v)}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="flex-1 rounded-xl bg-primary py-2 text-center text-sm font-black text-primary-foreground">Atualizar agora</span>
              {!v.obrigatoria && <span className="rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground">Depois</span>}
            </div>
            <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-border" />
          </div>
          <div className="h-16" />
        </div>
      </Cartao>
    </div>
  );
}
