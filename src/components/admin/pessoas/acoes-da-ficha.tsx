"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialogo, ConfirmarDigitando } from "../dialogo";
import { AreaDeTexto, Botao, Entrada, Escolha, Interruptor, Rotulo, Segmentado } from "../ui";
import { avisar } from "../avisos";
import { EscolhaDeDias } from "./calendario";
import { invalidar, pedir, salvarArquivo, useDados } from "@/lib/admin/api";
import { data, numero } from "@/lib/admin/formato";
import type { Calendario, FichaDaPessoa, Papel } from "@/lib/admin/tipos";

export type AcaoDaFicha = "saldo" | "selos" | "papel" | "bloquear" | "ofensiva" | "notificar" | "cortesia" | "dados" | "excluir";

const LIMITE = { rupees: 1000, xp: 5000 };

/**
 * Os diálogos das ações sobre uma pessoa. Cada um fala com uma rota só, e
 * depois de concluir a ficha (e a lista) é buscada de novo — o que a tela
 * mostra é sempre o que o banco tem, e não um palpite do navegador.
 */
export function AcoesDaFicha({ pessoa, acao, aoFechar }: { pessoa: FichaDaPessoa; acao: AcaoDaFicha | null; aoFechar: () => void }) {
  const concluir = (texto: string) => {
    invalidar(`/admin/pessoas/${pessoa.id}`);
    invalidar("/admin/pessoas?");
    invalidar("/admin/acoes");
    avisar(texto);
    aoFechar();
  };
  const props = { pessoa, aoFechar, concluir };
  if (acao === "saldo") return <AjustarSaldo {...props} />;
  if (acao === "selos") return <Selos {...props} />;
  if (acao === "papel") return <PapelDaConta {...props} />;
  if (acao === "bloquear") return <Bloquear {...props} />;
  if (acao === "ofensiva") return <RestaurarOfensiva {...props} />;
  if (acao === "notificar") return <Notificar {...props} />;
  if (acao === "cortesia") return <Cortesia {...props} />;
  if (acao === "excluir") return <Excluir {...props} />;
  return null;
}

type Props = { pessoa: FichaDaPessoa; aoFechar: () => void; concluir: (texto: string) => void };

/** Um envio com estado de carregando e erro, igual em todos os diálogos. */
function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const enviar = async (f: () => Promise<void>) => {
    setEnviando(true);
    setErro("");
    try {
      await f();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setEnviando(false);
    }
  };
  return { enviando, erro, enviar };
}

const MensagemDeErro = ({ erro }: { erro: string }) => (erro ? <p role="alert" className="text-sm font-bold text-rose-600 dark:text-rose-400">{erro}</p> : null);

// ── Saldo ────────────────────────────────────────────────────────────────

function AjustarSaldo({ pessoa, aoFechar, concluir }: Props) {
  const [coins, setCoins] = useState("");
  const [xp, setXp] = useState("");
  const [lives, setLives] = useState("");
  const [motivo, setMotivo] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const { enviando, erro, enviar } = useEnvio();
  const n = (v: string) => Math.trunc(Number(v) || 0);
  const grande = Math.abs(n(coins)) > LIMITE.rupees || Math.abs(n(xp)) > LIMITE.xp;
  const pronto = Boolean(n(coins) || n(xp) || n(lives)) && (!grande || confirmacao.trim().toUpperCase() === "CONFIRMAR");

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo="Ajustar saldo"
      descricao={`Use valores negativos para tirar. Hoje: ${numero(pessoa.coins)} rupees · ${numero(pessoa.xp)} XP · ${pessoa.lives} penas.`}
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao
            variante="primario"
            disabled={!pronto}
            carregando={enviando}
            onClick={() => enviar(async () => {
              await pedir(`/admin/pessoas/${pessoa.id}/recursos`, { method: "PATCH", json: { coins: n(coins), xp: n(xp), lives: n(lives), motivo, confirmar: grande } });
              concluir("Saldo ajustado. Dá para estornar na aba Equipe.");
            })}
          >
            Aplicar
          </Botao>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Rotulo texto="Rupees"><Entrada inputMode="numeric" value={coins} onChange={(e) => setCoins(e.target.value)} placeholder="0" autoFocus /></Rotulo>
          <Rotulo texto="XP"><Entrada inputMode="numeric" value={xp} onChange={(e) => setXp(e.target.value)} placeholder="0" /></Rotulo>
          <Rotulo texto="Penas"><Entrada inputMode="numeric" value={lives} onChange={(e) => setLives(e.target.value)} placeholder="0" /></Rotulo>
        </div>
        <Rotulo texto="Motivo" dica="Aparece no extrato da pessoa e no registro de ações.">
          <Entrada value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: compensação pelo bug do nivelamento" maxLength={200} />
        </Rotulo>
        {grande && (
          <Rotulo texto={<>Ajuste grande. Digite <b className="font-mono text-foreground">CONFIRMAR</b> para liberar.</>} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <Entrada value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="off" />
          </Rotulo>
        )}
        <MensagemDeErro erro={erro} />
      </div>
    </Dialogo>
  );
}

// ── Selos ────────────────────────────────────────────────────────────────

function Selos({ pessoa, aoFechar, concluir }: Props) {
  const [s, setS] = useState({ isPro: pessoa.isPro, isVerified: pessoa.isVerified, isDeveloper: pessoa.isDeveloper, isEarlyTester: pessoa.isEarlyTester });
  const { enviando, erro, enviar } = useEnvio();
  const linhas = [
    { campo: "isVerified", nome: "Verificado", nota: "Só a marca ao lado do nome." },
    { campo: "isPro", nome: "PRO permanente", nota: "Sem prazo. Para dar dias contados, use o PRO de cortesia." },
    { campo: "isDeveloper", nome: "Desenvolvedor", nota: "Troca avatar, capa e tema pelos do selo." },
    { campo: "isEarlyTester", nome: "Pioneiro", nota: "Troca avatar, capa e tema pelos do selo." },
  ] as const;
  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo="Selos"
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" carregando={enviando} onClick={() => enviar(async () => {
            await pedir(`/admin/pessoas/${pessoa.id}/selos`, { method: "PATCH", json: s });
            concluir("Selos atualizados.");
          })}>Salvar</Botao>
        </>
      }
    >
      <div className="space-y-2">
        {linhas.map((l) => (
          <div key={l.campo} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
            <div>
              <p className="text-sm font-bold">{l.nome}</p>
              <p className="text-xs text-muted-foreground">{l.nota}</p>
            </div>
            <Interruptor rotulo={l.nome} ligado={s[l.campo]} aoMudar={(v) => setS((x) => ({ ...x, [l.campo]: v }))} />
          </div>
        ))}
        <MensagemDeErro erro={erro} />
      </div>
    </Dialogo>
  );
}

// ── Papel ────────────────────────────────────────────────────────────────

function PapelDaConta({ pessoa, aoFechar, concluir }: Props) {
  const [papel, setPapel] = useState<Papel>(pessoa.role);
  const [confirmacao, setConfirmacao] = useState("");
  const { enviando, erro, enviar } = useEnvio();
  const viraAdmin = papel === "ADMIN" && pessoa.role !== "ADMIN";
  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo="Papel da conta"
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao
            variante={viraAdmin ? "perigo" : "primario"}
            disabled={papel === pessoa.role || (viraAdmin && confirmacao.trim().toUpperCase() !== "CONFIRMAR")}
            carregando={enviando}
            onClick={() => enviar(async () => {
              await pedir(`/admin/pessoas/${pessoa.id}/papel`, { method: "PATCH", json: { papel, confirmar: viraAdmin } });
              concluir("Papel alterado.");
            })}
          >
            Salvar
          </Botao>
        </>
      }
    >
      <div className="space-y-3">
        <Escolha value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
          <option value="USER">Aluno</option>
          <option value="PROFESSOR">Professor (edita só os cursos atribuídos)</option>
          <option value="ADMIN">Administrador (acesso a tudo)</option>
        </Escolha>
        {viraAdmin && (
          <Rotulo texto={<>Administradores veem e mudam tudo, inclusive outras contas. Digite <b className="font-mono text-foreground">CONFIRMAR</b>.</>} className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
            <Entrada value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="off" />
          </Rotulo>
        )}
        <MensagemDeErro erro={erro} />
      </div>
    </Dialogo>
  );
}

// ── Bloqueio ─────────────────────────────────────────────────────────────

function Bloquear({ pessoa, aoFechar, concluir }: Props) {
  const [tipo, setTipo] = useState<"suspender" | "bloquear">("suspender");
  const [dias, setDias] = useState(3);
  const [motivo, setMotivo] = useState("");
  const { enviando, erro, enviar } = useEnvio();

  if (pessoa.isBanned) {
    return (
      <Dialogo
        aberto
        aoFechar={aoFechar}
        titulo={pessoa.bannedUntil ? "Encerrar a suspensão" : "Desbloquear a conta"}
        descricao={pessoa.banReason ? `Motivo: ${pessoa.banReason}` : undefined}
        rodape={
          <>
            <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
            <Botao variante="primario" carregando={enviando} onClick={() => enviar(async () => {
              await pedir(`/admin/pessoas/${pessoa.id}/desbloquear`, { method: "POST" });
              concluir("Conta liberada.");
            })}>Liberar agora</Botao>
          </>
        }
      >
        {pessoa.bannedUntil && <p className="text-sm text-muted-foreground">A suspensão acabaria sozinha em {data(pessoa.bannedUntil, { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}.</p>}
        <MensagemDeErro erro={erro} />
      </Dialogo>
    );
  }

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo="Bloquear ou suspender"
      descricao="A pessoa sai na hora de todas as sessões e, ao tentar entrar, vê o aviso — com a data, se for suspensão."
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="perigo" disabled={!motivo.trim()} carregando={enviando} onClick={() => enviar(async () => {
            await pedir(`/admin/pessoas/${pessoa.id}/bloquear`, { method: "POST", json: { motivo, ...(tipo === "suspender" && { dias }) } });
            concluir(tipo === "suspender" ? `Conta suspensa por ${dias} dias.` : "Conta bloqueada.");
          })}>{tipo === "suspender" ? "Suspender" : "Bloquear de vez"}</Botao>
        </>
      }
    >
      <div className="space-y-3">
        <Segmentado<"suspender" | "bloquear"> rotulo="Tipo" valor={tipo} aoMudar={setTipo} opcoes={[{ valor: "suspender", texto: "Suspender por um tempo" }, { valor: "bloquear", texto: "Bloquear de vez" }]} />
        {tipo === "suspender" && (
          <Rotulo texto="Por quanto tempo">
            <Escolha value={dias} onChange={(e) => setDias(Number(e.target.value))}>
              {[1, 3, 7, 14, 30, 90].map((d) => <option key={d} value={d}>{d} {d === 1 ? "dia" : "dias"}</option>)}
            </Escolha>
          </Rotulo>
        )}
        <Rotulo texto="Motivo" dica="Fica no registro; a pessoa não vê o motivo.">
          <AreaDeTexto value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} autoFocus />
        </Rotulo>
        <MensagemDeErro erro={erro} />
      </div>
    </Dialogo>
  );
}

// ── Ofensiva ─────────────────────────────────────────────────────────────

function RestaurarOfensiva({ pessoa, aoFechar, concluir }: Props) {
  const calendario = useDados<Calendario>(`/admin/pessoas/${pessoa.id}/calendario`);
  const [valor, setValor] = useState(String(Math.max(pessoa.currentStreak, pessoa.longestStreak)));
  const [dias, setDias] = useState<Set<string>>(new Set());
  const { enviando, erro, enviar } = useEnvio();
  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      largura="max-w-xl"
      titulo="Restaurar ofensiva"
      descricao="Para quando a ofensiva quebrou por bug. Os dias escolhidos ficam marcados como protegidos no calendário da pessoa."
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" disabled={!(Number(valor) >= 1)} carregando={enviando} onClick={() => enviar(async () => {
            await pedir(`/admin/pessoas/${pessoa.id}/ofensiva`, { method: "POST", json: { valor: Math.trunc(Number(valor)), diasProtegidos: [...dias] } });
            concluir(`Ofensiva restaurada para ${valor} dias.`);
          })}>Restaurar</Botao>
        </>
      }
    >
      <div className="space-y-4">
        <Rotulo texto="Ofensiva de quantos dias" dica={`Hoje: ${pessoa.currentStreak} · maior já feita: ${pessoa.longestStreak}`}>
          <Entrada inputMode="numeric" value={valor} onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))} className="w-32" />
        </Rotulo>
        <div>
          <p className="mb-2 text-xs font-bold text-muted-foreground">Dias a proteger (os últimos 30). Dias em azul já têm estudo.</p>
          {calendario.dados ? <EscolhaDeDias c={calendario.dados} escolhidos={dias} aoMudar={setDias} /> : <div className="h-40 animate-pulse rounded-lg bg-muted" />}
        </div>
        <p className="text-xs text-muted-foreground">Se a pessoa ainda não estudou hoje, a chama fica pronta para continuar quando ela estudar — não recomeça do 1.</p>
        <MensagemDeErro erro={erro} />
      </div>
    </Dialogo>
  );
}

// ── Notificar ────────────────────────────────────────────────────────────

function Notificar({ pessoa, aoFechar, concluir }: Props) {
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const { enviando, erro, enviar } = useEnvio();
  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo={`Notificar ${pessoa.name}`}
      descricao="Vai para o sino do app e, se a pessoa ativou, como notificação no celular."
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" disabled={!titulo.trim() || !texto.trim()} carregando={enviando} onClick={() => enviar(async () => {
            await pedir(`/admin/pessoas/${pessoa.id}/notificar`, { method: "POST", json: { titulo, texto } });
            concluir("Notificação enviada.");
          })}>Enviar</Botao>
        </>
      }
    >
      <div className="space-y-3">
        <Rotulo texto="Título"><Entrada value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120} autoFocus /></Rotulo>
        <Rotulo texto="Texto"><AreaDeTexto value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={2000} /></Rotulo>
        <MensagemDeErro erro={erro} />
      </div>
    </Dialogo>
  );
}

// ── Cortesia ─────────────────────────────────────────────────────────────

function Cortesia({ pessoa, aoFechar, concluir }: Props) {
  const [dias, setDias] = useState(30);
  const { enviando, erro, enviar } = useEnvio();
  const ativa = pessoa.proCourtesyUntil && new Date(pessoa.proCourtesyUntil) > new Date();
  const proDeOutroJeito = pessoa.isPro && !ativa;
  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo="PRO de cortesia"
      descricao="Dias de PRO dados pela equipe. Acaba sozinho no prazo; se a pessoa passar a pagar no meio, o PRO continua."
      rodape={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          {ativa && (
            <Botao variante="perigo" carregando={enviando} onClick={() => enviar(async () => {
              await pedir(`/admin/pessoas/${pessoa.id}/cortesia`, { method: "DELETE" });
              concluir("Cortesia encerrada.");
            })}>Encerrar agora</Botao>
          )}
          <Botao variante="primario" disabled={Boolean(proDeOutroJeito)} carregando={enviando} onClick={() => enviar(async () => {
            await pedir(`/admin/pessoas/${pessoa.id}/cortesia`, { method: "POST", json: { dias } });
            concluir(ativa ? `Cortesia estendida em ${dias} dias.` : `${dias} dias de PRO dados.`);
          })}>{ativa ? "Estender" : "Dar PRO"}</Botao>
        </>
      }
    >
      <div className="space-y-3">
        {proDeOutroJeito ? (
          <p className="text-sm text-muted-foreground">Esta conta já é PRO (assinatura ou selo permanente). A cortesia é para quem não é.</p>
        ) : (
          <>
            {ativa && <p className="text-sm">Cortesia valendo até <b>{data(pessoa.proCourtesyUntil, { day: "2-digit", month: "long", year: "numeric" })}</b>.</p>}
            <Rotulo texto={ativa ? "Estender por" : "Por quanto tempo"}>
              <Escolha value={dias} onChange={(e) => setDias(Number(e.target.value))}>
                {[7, 14, 30, 60, 90, 180, 365].map((d) => <option key={d} value={d}>{d} dias</option>)}
              </Escolha>
            </Rotulo>
          </>
        )}
        <MensagemDeErro erro={erro} />
      </div>
    </Dialogo>
  );
}

// ── Exclusão ─────────────────────────────────────────────────────────────

function Excluir({ pessoa, aoFechar }: Props) {
  const router = useRouter();
  return (
    <ConfirmarDigitando
      aberto
      aoFechar={aoFechar}
      titulo="Excluir a conta e todos os dados"
      palavra={pessoa.email}
      rotuloDoBotao="Excluir para sempre"
      aoConfirmar={async () => {
        await pedir(`/admin/pessoas/${pessoa.id}/excluir`, { method: "POST", json: { confirmacao: pessoa.email } });
        invalidar("/admin/pessoas");
        avisar(`A conta de ${pessoa.name} foi excluída.`);
        router.push("/admin/pessoas");
      }}
    >
      <p>Apaga a conta de <b className="text-foreground">{pessoa.name}</b> e tudo ligado a ela: progresso, extratos, projetos, conquistas. Não dá para desfazer.</p>
      {pessoa.subscription && ["active", "trialing", "past_due"].includes(pessoa.subscription.status) && (
        <p className="mt-2 font-bold text-amber-700 dark:text-amber-300">A assinatura será cancelada no Stripe antes, para a cobrança parar.</p>
      )}
      <p className="mt-2">Se for um pedido pela LGPD, baixe os dados antes em &ldquo;Exportar dados&rdquo;.</p>
    </ConfirmarDigitando>
  );
}

/** Baixa tudo que o ZulCode guarda sobre a pessoa, num JSON. */
export async function exportarDados(pessoa: FichaDaPessoa) {
  try {
    const dados = await pedir(`/admin/pessoas/${pessoa.id}/dados`);
    salvarArquivo(new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" }), `dados-${pessoa.publicCode}.json`);
    invalidar("/admin/acoes");
    avisar("Dados exportados.");
  } catch (e) {
    avisar(e instanceof Error ? e.message : "Não foi possível exportar.", { tom: "erro" });
  }
}
