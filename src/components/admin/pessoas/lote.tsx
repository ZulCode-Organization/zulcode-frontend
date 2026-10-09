"use client";

import { useState } from "react";
import { Dialogo } from "../dialogo";
import { AreaDeTexto, Botao, Entrada, Escolha, Rotulo, Segmentado } from "../ui";
import { avisar } from "../avisos";
import { pedir } from "@/lib/admin/api";
import { numero } from "@/lib/admin/formato";

type Acao = "recursos" | "selos" | "notificar";
type TrocaDeSelo = "" | "ligar" | "desligar";

/** Acima disto, o lote pede que a pessoa digite CONFIRMAR — o backend confere de novo. */
const LIMITE = { pessoas: 20, rupees: 1000, xp: 5000 };

const SELOS = [
  { campo: "isPro", nome: "PRO (permanente)" },
  { campo: "isVerified", nome: "Verificado" },
  { campo: "isDeveloper", nome: "Desenvolvedor" },
  { campo: "isEarlyTester", nome: "Pioneiro" },
] as const;

export function AcoesEmLote({ aberto, ids, aoFechar, aoConcluir }: { aberto: boolean; ids: string[]; aoFechar: () => void; aoConcluir: () => void }) {
  const [acao, setAcao] = useState<Acao>("recursos");
  const [coins, setCoins] = useState("");
  const [xp, setXp] = useState("");
  const [lives, setLives] = useState("");
  const [motivo, setMotivo] = useState("");
  const [selos, setSelos] = useState<Record<string, TrocaDeSelo>>({});
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const n = (v: string) => Math.trunc(Number(v) || 0);
  const grande = ids.length > LIMITE.pessoas || (acao === "recursos" && (Math.abs(n(coins)) > LIMITE.rupees || Math.abs(n(xp)) > LIMITE.xp));
  const pronto =
    acao === "recursos" ? Boolean(n(coins) || n(xp) || n(lives))
    : acao === "selos" ? Object.values(selos).some(Boolean)
    : Boolean(titulo.trim() && texto.trim());
  const liberado = pronto && (!grande || confirmacao.trim().toUpperCase() === "CONFIRMAR");

  const enviar = async () => {
    setEnviando(true);
    setErro("");
    try {
      const corpo =
        acao === "recursos" ? { recursos: { coins: n(coins), xp: n(xp), lives: n(lives), motivo } }
        : acao === "selos" ? { selos: Object.fromEntries(Object.entries(selos).filter(([, v]) => v).map(([k, v]) => [k, v === "ligar"])) }
        : { titulo, texto };
      const r = await pedir<{ feitas?: number; enviadas?: number; falhas?: { id: string; erro: string }[] }>("/admin/pessoas/lote", {
        method: "POST",
        json: { ids, acao, confirmar: grande, ...corpo },
      });
      const feitas = r.feitas ?? r.enviadas ?? 0;
      avisar(r.falhas?.length ? `${feitas} feitas, ${r.falhas.length} falharam.` : `Feito para ${numero(feitas)} ${feitas === 1 ? "pessoa" : "pessoas"}.`, { tom: r.falhas?.length ? "erro" : "ok" });
      aoConcluir();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={`Ação para ${numero(ids.length)} ${ids.length === 1 ? "pessoa" : "pessoas"}`}
      descricao="Cada ajuste de saldo fica registrado separado, e pode ser estornado um a um na ficha de cada pessoa."
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" disabled={!liberado} carregando={enviando} onClick={enviar}>Aplicar</Botao>
        </>
      }
    >
      <div className="space-y-4">
        <Segmentado<Acao>
          rotulo="Ação"
          valor={acao}
          aoMudar={setAcao}
          opcoes={[{ valor: "recursos", texto: "Ajustar saldo" }, { valor: "selos", texto: "Selos" }, { valor: "notificar", texto: "Notificar" }]}
        />

        {acao === "recursos" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Rotulo texto="Rupees"><Entrada inputMode="numeric" value={coins} onChange={(e) => setCoins(e.target.value)} placeholder="+50 ou -50" /></Rotulo>
              <Rotulo texto="XP"><Entrada inputMode="numeric" value={xp} onChange={(e) => setXp(e.target.value)} placeholder="0" /></Rotulo>
              <Rotulo texto="Penas"><Entrada inputMode="numeric" value={lives} onChange={(e) => setLives(e.target.value)} placeholder="0" /></Rotulo>
            </div>
            <Rotulo texto="Motivo" dica="Aparece no extrato de cada pessoa.">
              <Entrada value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: compensação pelo bug do nivelamento" maxLength={200} />
            </Rotulo>
          </div>
        )}

        {acao === "selos" && (
          <div className="space-y-2">
            {SELOS.map((s) => (
              <div key={s.campo} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <span className="text-sm font-bold">{s.nome}</span>
                <Escolha className="h-8 w-36 text-xs" value={selos[s.campo] ?? ""} onChange={(e) => setSelos((x) => ({ ...x, [s.campo]: e.target.value as TrocaDeSelo }))}>
                  <option value="">Não mexer</option>
                  <option value="ligar">Ligar</option>
                  <option value="desligar">Desligar</option>
                </Escolha>
              </div>
            ))}
          </div>
        )}

        {acao === "notificar" && (
          <div className="space-y-3">
            <Rotulo texto="Título"><Entrada value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120} /></Rotulo>
            <Rotulo texto="Texto"><AreaDeTexto value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={2000} /></Rotulo>
            <p className="text-xs text-muted-foreground">Vai para o sino do app e, para quem ativou, como notificação no celular. Contas bloqueadas ficam de fora.</p>
          </div>
        )}

        {grande && pronto && (
          <Rotulo
            texto={<>É uma ação grande. Digite <b className="font-mono text-foreground">CONFIRMAR</b> para liberar.</>}
            className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
          >
            <Entrada value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="off" />
          </Rotulo>
        )}

        {erro && <p role="alert" className="text-sm font-bold text-rose-600 dark:text-rose-400">{erro}</p>}
      </div>
    </Dialogo>
  );
}
