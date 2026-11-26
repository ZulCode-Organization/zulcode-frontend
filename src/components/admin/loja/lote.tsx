"use client";

import { useState } from "react";
import { Dialogo } from "../dialogo";
import { Botao, Entrada, Escolha, Rotulo } from "../ui";
import { avisar } from "../avisos";
import { pedir } from "@/lib/admin/api";
import { numero } from "@/lib/admin/formato";
import { AVATARES_RAROS } from "@/lib/avatares";
import { cn } from "@/lib/utils";
import type { Cosmetico } from "@/lib/admin/tipos";

type Acao = "ativar" | "desativar" | "preco" | "apagar";

const ACOES: { valor: Acao; texto: string }[] = [
  { valor: "ativar", texto: "Pôr na loja" },
  { valor: "desativar", texto: "Tirar da loja" },
  { valor: "preco", texto: "Mudar o preço" },
  { valor: "apagar", texto: "Apagar" },
];

/** O preço mais alto aceito no lote (o backend confere de novo). */
const PRECO_MAXIMO = 100_000;

const RAROS = new Set(AVATARES_RAROS.map((raro) => raro.id));

/** Por que um cosmético não vai para a loja (o backend deixa de fora pelo mesmo motivo). */
function foraDaLoja(c: Cosmetico): "paleta" | "raro" | "gratis" | null {
  if (c.kind === "THEME") return "paleta";
  if (c.value.avatarId && RAROS.has(c.value.avatarId)) return "raro";
  if (c.price <= 0) return "gratis";
  return null;
}

/**
 * A mesma mudança em vários cosméticos: pôr na loja, tirar da loja, trocar o
 * preço ou apagar. Monta a cada abertura, então começa sempre do zero.
 */
export function LoteDeCosmeticos({ selecionados, aoFechar, aoConcluir }: { selecionados: Cosmetico[]; aoFechar: () => void; aoConcluir: () => void }) {
  const [acao, setAcao] = useState<Acao>("ativar");
  const [preco, setPreco] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const total = selecionados.length;
  const deFora = acao === "ativar" ? selecionados.map(foraDaLoja).filter(Boolean) : [];
  const contar = (motivo: string) => deFora.filter((m) => m === motivo).length;
  const compras = selecionados.reduce((soma, c) => soma + (c.vendas ?? 0), 0);
  const precoValido = /^\d+$/.test(preco) && Number(preco) <= PRECO_MAXIMO;
  const pronto =
    total > 0 &&
    (acao !== "ativar" || deFora.length < total) &&
    (acao !== "preco" || precoValido) &&
    (acao !== "apagar" || confirmacao.trim().toUpperCase() === "APAGAR");

  const enviar = async () => {
    setEnviando(true);
    setErro("");
    try {
      const r = await pedir<{ feitas: number; falhas: { id: string; erro: string }[] }>("/admin/loja/cosmeticos/lote", {
        method: "POST",
        json: {
          ids: selecionados.map((c) => c.id),
          acao,
          ...(acao === "preco" ? { preco: Number(preco) } : {}),
          ...(acao === "apagar" ? { confirmar: true } : {}),
        },
      });
      const feito =
        acao === "apagar"
          ? `${numero(r.feitas)} ${r.feitas === 1 ? "cosmético apagado" : "cosméticos apagados"}`
          : `${numero(r.feitas)} ${r.feitas === 1 ? "cosmético mudado" : "cosméticos mudados"}`;
      // As falhas costumam ter o mesmo motivo: mostra o primeiro.
      avisar(r.falhas.length ? `${feito}, ${r.falhas.length} ficaram de fora (${r.falhas[0].erro})` : `${feito}.`, {
        tom: r.falhas.length && !r.feitas ? "erro" : "ok",
      });
      aoConcluir();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo={`Ação para ${numero(total)} ${total === 1 ? "cosmético" : "cosméticos"}`}
      descricao="Cada cosmético fica registrado separado no registro de ações, como se tivesse sido editado um por um."
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante={acao === "apagar" ? "perigo" : "primario"} disabled={!pronto} carregando={enviando} onClick={enviar}>
            {acao === "apagar" ? `Apagar ${numero(total)}` : "Aplicar"}
          </Botao>
        </>
      }
    >
      <div className="space-y-4">
        <Rotulo texto="Ação">
          <Escolha
            value={acao}
            onChange={(e) => {
              setAcao(e.target.value as Acao);
              setConfirmacao("");
              setErro("");
            }}
          >
            {ACOES.map((a) => <option key={a.valor} value={a.valor}>{a.texto}</option>)}
          </Escolha>
        </Rotulo>

        {acao === "ativar" && (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Põe os selecionados à venda, cada um com o preço que já tem.</p>
            {deFora.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="font-black text-amber-700 dark:text-amber-300">
                  {numero(deFora.length)} {deFora.length === 1 ? "fica" : "ficam"} de fora:
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                  {contar("gratis") > 0 && <li>{numero(contar("gratis"))} com preço zero (ficariam de graça): mude o preço antes.</li>}
                  {contar("raro") > 0 && <li>{numero(contar("raro"))} {contar("raro") === 1 ? "ícone raro" : "ícones raros"}: só a equipe dá.</li>}
                  {contar("paleta") > 0 && <li>{numero(contar("paleta"))} {contar("paleta") === 1 ? "paleta" : "paletas"}: saíram do app.</li>}
                </ul>
              </div>
            )}
          </div>
        )}

        {acao === "desativar" && (
          <p className="text-sm text-muted-foreground">
            Tira da loja sem apagar. Quem já tem continua com o item, e a equipe ainda pode dar de presente.
          </p>
        )}

        {acao === "preco" && (
          <Rotulo texto="Novo preço (rupees)" dica="Vale para todos os selecionados, até os que estão fora da loja.">
            <Entrada
              inputMode="numeric"
              value={preco}
              onChange={(e) => setPreco(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Ex.: 120"
              className="w-40"
              autoFocus
            />
          </Rotulo>
        )}

        {acao === "apagar" && (
          <div className="space-y-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm">
            <p className="font-black text-rose-700 dark:text-rose-300">Apaga de vez, sem como desfazer.</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                {compras > 0
                  ? `${numero(compras)} ${compras === 1 ? "compra some" : "compras somem"}: quem tem perde o item.`
                  : "Ninguém comprou estes itens ainda."}
              </li>
              <li>Para só parar de vender, use “Tirar da loja”.</li>
              <li>Conquistas, eventos e códigos que dão estes itens precisam ser revistos.</li>
            </ul>
          </div>
        )}

        {acao === "apagar" && (
          <Rotulo
            texto={
              <>
                Digite <b className="font-mono text-foreground">APAGAR</b> para liberar.
              </>
            }
            className={cn("rounded-lg border border-rose-500/30 bg-rose-500/5 p-3")}
          >
            <Entrada value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="off" />
          </Rotulo>
        )}

        {erro && <p role="alert" className="text-sm font-bold text-rose-600 dark:text-rose-400">{erro}</p>}
      </div>
    </Dialogo>
  );
}
