"use client";

import { useEffect, useState } from "react";
import { Pagina } from "./shell";
import { Botao, Cabecalho, Cartao, Entrada, Erro, Esqueleto, Interruptor, Rotulo } from "./ui";
import { avisar } from "./avisos";
import { doCampoDeData, paraCampoDeData } from "./eventos";
import { invalidar, pedir, useDados } from "@/lib/admin/api";
import { dataHora } from "@/lib/admin/formato";
import type { AjustesDoJogo } from "@/lib/admin/tipos";

const CHAVE = "/admin/ajustes";

/**
 * Os números do jogo, sem deploy: rupees por aula, recarga das penas, o "em
 * dobro para todos" e os limites dos alertas. Valem para todos em até 30 segundos.
 */
export function AdminAjustes() {
  const { dados, erro, recarregar } = useDados<AjustesDoJogo>(CHAVE);
  return (
    <Pagina>
      <Cabecalho
        titulo="Ajustes do jogo"
        descricao="Os números que mexem na economia do app. Mudou aqui, vale para todo mundo em até 30 segundos, sem deploy."
      />
      {erro && !dados ? <Erro tentarDeNovo={recarregar}>{erro}</Erro> : !dados ? <Esqueleto linhas={8} /> : <Formulario inicial={dados} />}
    </Pagina>
  );
}

/**
 * Um "em dobro para todos": o interruptor liga por 48 horas, e dá para
 * escolher o fim exato ou um dos atalhos. Vazio é desligado.
 */
function EmDobro({ titulo, valor, agora, daquiA, aoMudar }: {
  titulo: string;
  /** O fim, no formato do campo de data e hora ("" = desligado). */
  valor: string;
  agora: number;
  daquiA: (horas: number) => string;
  aoMudar: (valor: string) => void;
}) {
  const ligado = !!valor && new Date(valor).getTime() > agora;
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black">{titulo}</p>
          <p className="text-xs text-muted-foreground">
            {ligado ? `Ligado até ${dataHora(new Date(valor).toISOString())}.` : "Desligado."} O PRO e os itens da loja já dobram por conta própria.
          </p>
        </div>
        <Interruptor ligado={ligado} aoMudar={(v) => aoMudar(v ? daquiA(48) : "")} rotulo={titulo} />
      </div>
      {ligado && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Rotulo texto="Até" className="min-w-[220px] flex-1">
            <Entrada type="datetime-local" value={valor} onChange={(e) => aoMudar(e.target.value)} />
          </Rotulo>
          <Botao tamanho="sm" onClick={() => aoMudar(daquiA(24))}>24 h</Botao>
          <Botao tamanho="sm" onClick={() => aoMudar(daquiA(48))}>Fim de semana (48 h)</Botao>
        </div>
      )}
    </div>
  );
}

function Formulario({ inicial }: { inicial: AjustesDoJogo }) {
  const [f, setF] = useState({
    rupeesPorAula: String(inicial.rupeesPorAula),
    minutosPorPena: String(inicial.minutosPorPena),
    alertaXp24h: String(inicial.alertaXp24h),
    alertaRupees24h: String(inicial.alertaRupees24h),
    xpEmDobroAte: paraCampoDeData(inicial.xpEmDobroAte),
    rupeesEmDobroAte: paraCampoDeData(inicial.rupeesEmDobroAte),
  });
  const [salvando, setSalvando] = useState(false);
  // O relógio da tela: diz se o "em dobro" ainda vale e é a base do "24 h" e do "48 h".
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const mudar = (parte: Partial<typeof f>) => setF((x) => ({ ...x, ...parte }));
  const n = (v: string) => Math.trunc(Number(v) || 0);
  const daquiA = (horas: number) => paraCampoDeData(new Date(agora + horas * 3_600_000).toISOString());

  const salvar = async () => {
    setSalvando(true);
    try {
      await pedir(CHAVE, {
        method: "PUT",
        json: {
          rupeesPorAula: n(f.rupeesPorAula),
          minutosPorPena: n(f.minutosPorPena),
          alertaXp24h: n(f.alertaXp24h),
          alertaRupees24h: n(f.alertaRupees24h),
          xpEmDobroAte: doCampoDeData(f.xpEmDobroAte),
          rupeesEmDobroAte: doCampoDeData(f.rupeesEmDobroAte),
        },
      });
      invalidar(CHAVE);
      avisar("Ajustes salvos. Valem em até 30 segundos.");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível salvar.", { tom: "erro" });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      <Cartao titulo="Aulas e penas" corpo="grid gap-3 p-4 sm:grid-cols-2">
        <Rotulo texto="Rupees por aula concluída" dica="Padrão: 5. O PRO e as rupees em dobro dobram este número.">
          <Entrada inputMode="numeric" value={f.rupeesPorAula} onChange={(e) => mudar({ rupeesPorAula: e.target.value.replace(/\D/g, "") })} />
        </Rotulo>
        <Rotulo texto="Minutos para recuperar uma pena" dica="Padrão: 60 (uma pena por hora). De 5 a 1440.">
          <Entrada inputMode="numeric" value={f.minutosPorPena} onChange={(e) => mudar({ minutosPorPena: e.target.value.replace(/\D/g, "") })} />
        </Rotulo>
      </Cartao>

      <Cartao titulo="Em dobro para todos" descricao="Para fins de semana especiais ou para compensar um problema." corpo="space-y-3 p-4">
        <EmDobro titulo="XP em dobro" valor={f.xpEmDobroAte} agora={agora} daquiA={daquiA} aoMudar={(xpEmDobroAte) => mudar({ xpEmDobroAte })} />
        <EmDobro titulo="Rupees em dobro" valor={f.rupeesEmDobroAte} agora={agora} daquiA={daquiA} aoMudar={(rupeesEmDobroAte) => mudar({ rupeesEmDobroAte })} />
        <p className="text-xs text-muted-foreground">Um evento com &quot;XP em dobro&quot; marcado também liga o dobro enquanto durar, sem precisar mexer aqui.</p>
      </Cartao>

      <Cartao titulo="Alertas de “pede uma olhada”" descricao="Acima destes números em 24 horas, a conta aparece nos alertas de Pessoas." corpo="grid gap-3 p-4 sm:grid-cols-2">
        <Rotulo texto="XP em 24 horas" dica="Padrão: 3000.">
          <Entrada inputMode="numeric" value={f.alertaXp24h} onChange={(e) => mudar({ alertaXp24h: e.target.value.replace(/\D/g, "") })} />
        </Rotulo>
        <Rotulo texto="Rupees ganhas em 24 horas" dica="Padrão: 2000.">
          <Entrada inputMode="numeric" value={f.alertaRupees24h} onChange={(e) => mudar({ alertaRupees24h: e.target.value.replace(/\D/g, "") })} />
        </Rotulo>
      </Cartao>

      <Botao variante="primario" carregando={salvando} onClick={salvar}>Salvar ajustes</Botao>
    </div>
  );
}
