"use client";

import { useState } from "react";
import { Dialogo } from "../dialogo";
import { AreaDeTexto, Botao, Entrada, Escolha, Rotulo } from "../ui";
import { avisar } from "../avisos";
import { pedir } from "@/lib/admin/api";
import { numero } from "@/lib/admin/formato";
import { cn } from "@/lib/utils";
import { EscolhaDeCosmetico, EscolhaDeItem } from "./presentes";

type Acao = "recursos" | "selos" | "notificar" | "cosmetico" | "item" | "cortesia" | "tirar_cortesia" | "bloquear" | "desbloquear" | "excluir";
type TrocaDeSelo = "" | "ligar" | "desligar";

const ACOES: { valor: Acao; texto: string }[] = [
  { valor: "recursos", texto: "Ajustar saldo (rupees, XP, penas)" },
  { valor: "cosmetico", texto: "Dar um avatar ou banner" },
  { valor: "item", texto: "Dar um item da loja" },
  { valor: "cortesia", texto: "Dar PRO de cortesia" },
  { valor: "tirar_cortesia", texto: "Encerrar o PRO de cortesia" },
  { valor: "selos", texto: "Selos" },
  { valor: "notificar", texto: "Notificar" },
  { valor: "bloquear", texto: "Bloquear ou suspender" },
  { valor: "desbloquear", texto: "Desbloquear" },
  { valor: "excluir", texto: "Excluir contas" },
];

/** Acima disto, o lote pede que a pessoa digite CONFIRMAR — o backend confere de novo. */
const LIMITE = { pessoas: 20, rupees: 1000, xp: 5000 };
/** O máximo de contas excluídas por vez (o backend confere de novo). */
const EXCLUIR_POR_VEZ = 100;

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
  const [cosmeticId, setCosmeticId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [dias, setDias] = useState("7");
  const [diasDeBloqueio, setDiasDeBloqueio] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const n = (v: string) => Math.trunc(Number(v) || 0);
  // Bloquear e excluir são sempre conferidos digitando: errar a seleção tira gente do app.
  const grande =
    ids.length > LIMITE.pessoas ||
    acao === "bloquear" ||
    acao === "excluir" ||
    (acao === "recursos" && (Math.abs(n(coins)) > LIMITE.rupees || Math.abs(n(xp)) > LIMITE.xp));
  const pronto =
    acao === "recursos" ? Boolean(n(coins) || n(xp) || n(lives))
    : acao === "selos" ? Object.values(selos).some(Boolean)
    : acao === "notificar" ? Boolean(titulo.trim() && texto.trim())
    : acao === "cosmetico" ? Boolean(cosmeticId)
    : acao === "item" ? Boolean(itemId) && n(quantidade) >= 1
    : acao === "cortesia" ? n(dias) >= 1 && n(dias) <= 365
    : acao === "bloquear" ? Boolean(motivo.trim())
    : acao === "excluir" ? ids.length <= EXCLUIR_POR_VEZ
    : true;
  // Excluir não tem volta: pede uma palavra própria, para não sair no automático.
  const palavra = acao === "excluir" ? "EXCLUIR" : "CONFIRMAR";
  const liberado = pronto && (!grande || confirmacao.trim().toUpperCase() === palavra);
  const perigosa = acao === "bloquear" || acao === "excluir";

  const corpoDaAcao = () => {
    switch (acao) {
      case "recursos": return { recursos: { coins: n(coins), xp: n(xp), lives: n(lives), motivo } };
      case "selos": return { selos: Object.fromEntries(Object.entries(selos).filter(([, v]) => v).map(([k, v]) => [k, v === "ligar"])) };
      case "notificar": return { titulo, texto };
      case "cosmetico": return { cosmeticId };
      case "item": return { itemId, quantidade: Math.min(5, Math.max(1, n(quantidade))) };
      case "cortesia": return { dias: n(dias) };
      case "bloquear": return { motivo, ...(n(diasDeBloqueio) > 0 ? { dias: n(diasDeBloqueio) } : {}) };
      default: return {};
    }
  };

  const enviar = async () => {
    setEnviando(true);
    setErro("");
    try {
      const r = await pedir<{ feitas?: number; enviadas?: number; falhas?: { id: string; erro: string }[] }>("/admin/pessoas/lote", {
        method: "POST",
        json: { ids, acao, confirmar: grande, ...corpoDaAcao() },
      });
      const feitas = r.feitas ?? r.enviadas ?? 0;
      // As falhas de cada pessoa costumam ter o mesmo motivo ("já tem este cosmético"): mostra o primeiro.
      const motivoDaFalha = r.falhas?.[0]?.erro;
      const feito =
        acao === "excluir" ? `${numero(feitas)} ${feitas === 1 ? "conta excluída" : "contas excluídas"}` : `Feito para ${numero(feitas)} ${feitas === 1 ? "pessoa" : "pessoas"}`;
      avisar(
        r.falhas?.length
          ? `${feito}, ${r.falhas.length} não deram certo${motivoDaFalha ? ` (${motivoDaFalha})` : ""}.`
          : `${feito}.`,
        { tom: r.falhas?.length ? "erro" : "ok" },
      );
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
      descricao="Cada ação fica registrada separada por pessoa. Os ajustes de saldo podem ser estornados um a um na ficha."
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante={perigosa ? "perigo" : "primario"} disabled={!liberado} carregando={enviando} onClick={enviar}>
            {acao === "excluir" ? `Excluir ${numero(ids.length)} ${ids.length === 1 ? "conta" : "contas"}` : "Aplicar"}
          </Botao>
        </>
      }
    >
      <div className="space-y-4">
        <Rotulo texto="Ação">
          <Escolha value={acao} onChange={(e) => { setAcao(e.target.value as Acao); setConfirmacao(""); setErro(""); }}>
            {ACOES.map((a) => <option key={a.valor} value={a.valor}>{a.texto}</option>)}
          </Escolha>
        </Rotulo>

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

        {acao === "cosmetico" && (
          <div className="space-y-2">
            <EscolhaDeCosmetico valor={cosmeticId} aoMudar={setCosmeticId} />
            <p className="text-xs text-muted-foreground">Quem já tiver este cosmético fica de fora. Os que estão fora da loja só aparecem para quem ganhar.</p>
          </div>
        )}

        {acao === "item" && (
          <div className="space-y-2">
            <EscolhaDeItem valor={itemId} aoMudar={setItemId} />
            <Rotulo texto="Quantas vezes" dica="O efeito é aplicado na hora, como se a pessoa tivesse comprado (até 5).">
              <Entrada inputMode="numeric" value={quantidade} onChange={(e) => setQuantidade(e.target.value.replace(/\D/g, ""))} maxLength={1} />
            </Rotulo>
          </div>
        )}

        {acao === "cortesia" && (
          <Rotulo texto="Dias de PRO" dica="Para quem já tem cortesia, os dias se somam ao que falta. Quem já paga o PRO fica de fora.">
            <Entrada inputMode="numeric" value={dias} onChange={(e) => setDias(e.target.value.replace(/\D/g, ""))} />
          </Rotulo>
        )}

        {acao === "tirar_cortesia" && (
          <p className="text-sm text-muted-foreground">Encerra o PRO de cortesia na hora. Quem paga o PRO continua PRO; quem não tem cortesia fica de fora.</p>
        )}

        {acao === "bloquear" && (
          <div className="space-y-3">
            <Rotulo texto="Motivo" dica="Fica na ficha de cada pessoa.">
              <Entrada value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} placeholder="Ex.: contas criadas para farmar rupees" />
            </Rotulo>
            <Rotulo texto="Por quantos dias" dica="Vazio = bloqueio definitivo. Com dias, é uma suspensão que acaba sozinha. Administradores ficam de fora.">
              <Entrada inputMode="numeric" value={diasDeBloqueio} onChange={(e) => setDiasDeBloqueio(e.target.value.replace(/\D/g, ""))} placeholder="Definitivo" />
            </Rotulo>
          </div>
        )}

        {acao === "desbloquear" && <p className="text-sm text-muted-foreground">Libera as contas bloqueadas ou suspensas da seleção. As que estão livres continuam como estão.</p>}

        {acao === "excluir" && (
          <div className="space-y-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm">
            <p className="font-black text-rose-700 dark:text-rose-300">Apaga as contas de vez, sem como desfazer.</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Vai tudo junto: progresso, XP, rupees, compras, conquistas e ofensiva.</li>
              <li>Quem paga o PRO tem a assinatura cancelada antes, para não ficar cobrança sem dono.</li>
              <li>A sua conta e as de administradores ficam de fora.</li>
              <li>O nome e o e-mail de cada conta ficam guardados no registro de ações.</li>
            </ul>
            {ids.length > EXCLUIR_POR_VEZ && (
              <p className="font-bold text-rose-700 dark:text-rose-300">Selecione no máximo {EXCLUIR_POR_VEZ} contas por vez ({numero(ids.length)} selecionadas).</p>
            )}
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
            texto={
              <>
                {acao === "excluir" ? "Excluir não tem volta." : acao === "bloquear" ? "Bloquear tira as pessoas do app." : "É uma ação grande."} Digite{" "}
                <b className="font-mono text-foreground">{palavra}</b> para liberar.
              </>
            }
            className={cn("rounded-lg border p-3", acao === "excluir" ? "border-rose-500/30 bg-rose-500/5" : "border-amber-500/30 bg-amber-500/5")}
          >
            <Entrada value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="off" />
          </Rotulo>
        )}

        {erro && <p role="alert" className="text-sm font-bold text-rose-600 dark:text-rose-400">{erro}</p>}
      </div>
    </Dialogo>
  );
}
