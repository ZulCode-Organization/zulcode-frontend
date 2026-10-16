"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { faixaDaChama } from "@/components/shared/chama-dupla";
import { SeloPro } from "@/components/shared/selo-pro";
import { Rupee } from "@/components/shared/rupee";
import { useMudanca } from "@/lib/motion/mudancas";
import { CURVA, animar } from "@/lib/motion/movimento";
import {
  apagarChama, estourarConfete, mostrarDiferenca, quicar, receber, saltarChama,
  soltarPena, tremer, vacilarChama, varrerBrilho, voarRupees,
} from "@/lib/motion/efeitos";
import { reagir } from "@/lib/reacoes";
import { MARCOS_DA_SEQUENCIA } from "@/lib/sequencia";
import { Odometro } from "./odometro";
import { BarraRecarga } from "./barra-recarga";
import { Dica, DicaOfensiva, DicaPenas, DicaRupees, useDica } from "./dica";
import { COR_DA_PENA, COR_DO_RUPEE, ChamaNeon, ComEnfeite, ENFEITES_DA_BARRA, PenaDaBarra, corDaChama, useTemaDaBarra } from "./tema";

/** Quanto tempo segurar para fixar o painel. Curto o bastante para ser
 *  descoberto sem querer, longo o bastante para nunca disparar num clique. */
const SEGURAR_MS = 480;

/** Quando as rupees chegam no chip, em média. O voo dura de 980 a 1160ms; o
 *  número começa a rolar quando a primeira encosta. */
const CHEGADA_DAS_RUPEES_MS = 1000;

const formato = (numero: number) => numero.toLocaleString("pt-BR");

// ---------------------------------------------------------------------------
// O chip
// ---------------------------------------------------------------------------

type ChipVivoProps = {
  rotulo: string;
  cor: string;
  aberto: boolean;
  aoAbrir: () => void;
  /** 18. Segurar fixa o painel aberto. */
  aoSegurar?: () => void;
  /** 16. Clicar no número (com mouse) vai direto para cá. */
  destinoDoNumero?: string;
  icone: ReactNode;
  numero: ReactNode;
  iconeRef: React.RefObject<HTMLSpanElement | null>;
  numeroRef: React.RefObject<HTMLSpanElement | null>;
  dica: ReactNode;
  /** O que fica por baixo do chip, como a recarga da pena. */
  embaixo?: ReactNode;
};

/**
 * O chip da barra: ícone + número, sem moldura.
 *
 * Os gestos de cada chip (moeda voando, pena caindo) moram nos componentes de
 * baixo; este aqui cuida do que é comum aos três — passar o mouse, segurar e
 * clicar no número.
 */
function ChipVivo({
  rotulo, cor, aberto, aoAbrir, aoSegurar, destinoDoNumero,
  icone, numero, iconeRef, numeroRef, dica, embaixo,
}: ChipVivoProps) {
  const router = useRouter();
  const { posicao, handlers } = useDica(aberto);
  const segurou = useRef(false);
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apertando = useRef<Animation | null>(null);

  const soltar = () => {
    if (relogio.current) clearTimeout(relogio.current);
    relogio.current = null;
    // Volta do aperto pelo mesmo caminho em vez de pular de volta.
    if (apertando.current && apertando.current.playState !== "finished") apertando.current.reverse();
    apertando.current = null;
  };

  useEffect(() => () => {
    if (relogio.current) clearTimeout(relogio.current);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={rotulo}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        className={cn(
          // Sem moldura em tamanho nenhum: ícone + número, como no celular.
          "zc-chip zc-press relative flex h-9 min-w-0 select-none items-center justify-center gap-1 rounded-2xl px-1 text-[0.9rem] font-extrabold transition-colors duration-300",
          "lg:h-11 lg:w-auto lg:gap-2 lg:px-1.5 lg:text-[0.95rem]",
          // O fundo ao abrir é o que sobrou pra dizer qual painel está aberto.
          aberto && "bg-muted",
          cor,
        )}
        {...handlers}
        onPointerDown={(evento) => {
          handlers.onPointerDown();
          if (!aoSegurar || evento.button !== 0) return;
          segurou.current = false;
          const alvo = iconeRef.current;
          // O ícone afunda devagar enquanto o dedo está lá: é a pista de que
          // segurar faz alguma coisa.
          apertando.current = animar(alvo, [
            { transform: "scale(1)" },
            { transform: "scale(0.84)" },
          ], { duration: SEGURAR_MS, easing: CURVA.assenta, fill: "forwards" });
          relogio.current = setTimeout(() => {
            relogio.current = null;
            segurou.current = true;
            apertando.current?.cancel();
            apertando.current = null;
            animar(alvo, [
              { transform: "scale(0.84)" },
              { transform: "scale(1.14)", offset: 0.45 },
              { transform: "scale(1)" },
            ], { duration: 440, easing: CURVA.mola });
            aoSegurar();
          }, SEGURAR_MS);
        }}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onPointerLeave={() => {
          handlers.onPointerLeave();
          soltar();
        }}
        // No toque, segurar abriria o menu de copiar do sistema por cima.
        onContextMenu={(evento) => { if (aoSegurar) evento.preventDefault(); }}
        onClick={(evento) => {
          if (segurou.current) {
            segurou.current = false;
            return;
          }
          const ponteiro = (evento.nativeEvent as PointerEvent).pointerType;
          const noNumero = (evento.target as Element).closest("[data-numero]");
          if (destinoDoNumero && ponteiro === "mouse" && noNumero) {
            router.push(destinoDoNumero);
            return;
          }
          aoAbrir();
        }}
      >
        <span ref={iconeRef} className="zc-chip-icone relative inline-flex">
          {icone}
        </span>
        {numero !== null && (
          <span ref={numeroRef} data-numero className={cn("relative inline-flex", destinoDoNumero && "zc-chip-numero")}>
            {numero}
          </span>
        )}
        {embaixo}
      </button>
      <Dica posicao={posicao}>{dica}</Dica>
    </>
  );
}

type Comum = {
  /** Id da conta: as mudanças são guardadas por conta, nunca misturadas. */
  contaId: string | null;
  carregando: boolean;
  aberto: boolean;
  aoAbrir: () => void;
  aoSegurar: () => void;
};

// ---------------------------------------------------------------------------
// Ofensiva
// ---------------------------------------------------------------------------

/** Marcos que soltam confete. */

export function ChipOfensiva({
  contaId, carregando, aberto, aoAbrir, aoSegurar,
  dias, acesa, protegido, recorde, protegidos, perfeita = false,
}: Comum & {
  dias: number | null;
  acesa: boolean;
  protegido: boolean;
  /** Ofensiva perfeita: o contorno da chama fica dourado. */
  perfeita?: boolean;
  recorde: number;
  protegidos: string[];
}) {
  const icone = useRef<HTMLSpanElement>(null);
  const numero = useRef<HTMLSpanElement>(null);
  const mudanca = useMudanca(contaId ? `${contaId}:sequencia` : null, dias);
  const faixa = faixaDaChama(dias);
  const tema = useTemaDaBarra();
  // A hora é lida uma vez: a dica não precisa virar "em risco" sozinha às 20h
  // com a tela aberta, e ler o relógio a cada render deixaria o componente
  // impuro.
  const [noite] = useState(() => new Date().getHours() >= 20);
  const emRisco = (dias ?? 0) > 0 && !acesa && noite;

  // 6, 19 e o apagar.
  useEffect(() => {
    const alvo = icone.current;
    if (!mudanca || !alvo) return;
    if (mudanca.para > mudanca.de) {
      const brasas = protegido ? ["#34d399", "#a78bfa"] : [faixa.cor, "#fde68a"];
      saltarChama(alvo, brasas);
      reagir("ofensiva");
      if (numero.current) mostrarDiferenca(numero.current, `+${mudanca.para - mudanca.de}`, getComputedStyle(numero.current).color, 120);
      const marco = MARCOS_DA_SEQUENCIA.find((dia) => mudanca.de < dia && mudanca.para >= dia);
      if (marco) {
        const cores = [faixaDaChama(marco).cor, "#fde68a", "#ffffff"];
        const id = setTimeout(() => estourarConfete(alvo, cores), 300);
        return () => clearTimeout(id);
      }
    } else if (mudanca.para === 0) {
      apagarChama(alvo);
    }
    // A faixa e o gás de agora são lidos no momento da mudança, e não a cada
    // render: a animação é do instante em que o número subiu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mudanca]);

  // 8 e 9: um gesto só, quando a tela abre e os dados chegam. Nunca em laço.
  const jaFez = useRef(false);
  useEffect(() => {
    const alvo = icone.current;
    if (carregando || dias === null || !alvo || jaFez.current) return;
    jaFez.current = true;
    if (emRisco) vacilarChama(alvo, 700);
    else if (acesa && protegido) varrerBrilho(alvo, "#d1fae5", 900);
  }, [carregando, dias, emRisco, acesa, protegido]);

  return (
    <ChipVivo
      rotulo={acesa ? "Dias seguidos" : "Estude hoje para manter a sequência"}
      cor={acesa ? corDaChama(dias, tema) : "text-muted-foreground"}
      aberto={aberto}
      aoAbrir={aoAbrir}
      aoSegurar={aoSegurar}
      destinoDoNumero="/loja"
      iconeRef={icone}
      numeroRef={numero}
      icone={<ChamaNeon className="size-6 lg:size-7" aceso={acesa} protegido={protegido} dias={dias} perfeita={perfeita} tema={tema} />}
      numero={carregando || dias === null ? "…" : (
        <Odometro valor={dias} teto={1000} anterior={mudanca?.de} versao={mudanca?.id} atraso={120} />
      )}
      dica={<DicaOfensiva dias={dias ?? 0} acesa={acesa} protegidos={protegidos} recorde={recorde} emRisco={emRisco} comGas={protegido} />}
    />
  );
}

// ---------------------------------------------------------------------------
// Rupees
// ---------------------------------------------------------------------------

const MARCOS_DE_RUPEES = [100, 1000, 10000, 100000];

export function ChipRupees({
  contaId, carregando, aberto, aoAbrir, aoSegurar, moedas,
}: Comum & { moedas: number | null }) {
  const icone = useRef<HTMLSpanElement>(null);
  const numero = useRef<HTMLSpanElement>(null);
  const mudanca = useMudanca(contaId ? `${contaId}:moedas` : null, moedas);
  const zerado = moedas === 0;
  const ganhou = mudanca !== null && mudanca.para > mudanca.de;
  const tema = useTemaDaBarra();

  // 2, 3 e 10.
  useEffect(() => {
    const alvo = icone.current;
    const texto = numero.current;
    if (!mudanca || !alvo) return;
    const diferenca = mudanca.para - mudanca.de;
    if (diferenca > 0) {
      const { primeira, ultima } = voarRupees(alvo, diferenca);
      // O "plim" toca quando a primeira rupee encosta no ícone, não quando sai.
      const plim = setTimeout(() => reagir("rupees"), primeira);
      receber(alvo, primeira, 1);
      if (ultima - primeira > 160) receber(alvo, ultima, 0.45);
      if (texto) mostrarDiferenca(texto, `+${formato(diferenca)}`, getComputedStyle(texto).color, primeira);
      const marco = MARCOS_DE_RUPEES.find((valor) => mudanca.de < valor && mudanca.para >= valor);
      if (marco) varrerBrilho(alvo, "#ffffff", ultima + 120);
      return () => clearTimeout(plim);
    } else {
      // Gastar: o ícone "paga" — encolhe e volta — e o número sai em cinza.
      animar(alvo, [
        { transform: "scale(1)" },
        { transform: "scale(0.82)", offset: 0.35, easing: CURVA.assenta },
        { transform: "scale(1)" },
      ], { duration: 420, easing: CURVA.mola });
      if (texto) mostrarDiferenca(texto, `−${formato(-diferenca)}`, getComputedStyle(texto).color);
    }
  }, [mudanca]);

  return (
    <ChipVivo
      rotulo="Rupees"
      cor={zerado ? "text-muted-foreground" : COR_DO_RUPEE[tema]}
      aberto={aberto}
      aoAbrir={aoAbrir}
      aoSegurar={aoSegurar}
      destinoDoNumero="/loja"
      iconeRef={icone}
      numeroRef={numero}
      icone={(
        <ComEnfeite enfeite={ENFEITES_DA_BARRA[tema].rupee}>
          <Rupee className="size-5.5 lg:size-6" quantidade={moedas} />
        </ComEnfeite>
      )}
      numero={carregando ? "…" : moedas === null ? null : (
        <Odometro
          valor={moedas}
          teto={99999}
          anterior={mudanca?.de}
          versao={mudanca?.id}
          atraso={ganhou ? CHEGADA_DAS_RUPEES_MS : 0}
        />
      )}
      dica={<DicaRupees saldo={moedas} />}
    />
  );
}

// ---------------------------------------------------------------------------
// Penas
// ---------------------------------------------------------------------------

export function ChipPenas({
  contaId, carregando, aberto, aoAbrir, aoSegurar,
  vidas, maximo, proximaEm, pro, aoRecarregar,
}: Comum & {
  vidas: number | null;
  maximo: number;
  proximaEm: string | null;
  pro: boolean;
  /** A pena da recarga voltou: quem usa busca o perfil de novo. */
  aoRecarregar: () => void;
}) {
  const icone = useRef<HTMLSpanElement>(null);
  const numero = useRef<HTMLSpanElement>(null);
  const mudanca = useMudanca(contaId && !pro ? `${contaId}:penas` : null, vidas);
  const restantes = vidas ?? maximo;
  const vazia = !pro && vidas === 0;
  const tema = useTemaDaBarra();

  // 4, 5 e a pena que volta.
  useEffect(() => {
    const alvo = icone.current;
    const texto = numero.current;
    if (!mudanca || !alvo) return;
    const diferenca = mudanca.para - mudanca.de;
    if (diferenca < 0) {
      soltarPena(alvo);
      reagir("perdaDePena");
      if (texto) mostrarDiferenca(texto, `−${-diferenca}`, getComputedStyle(texto).color, 80);
      if (mudanca.para === 0) tremer(alvo, 160);
    } else {
      quicar(alvo);
      if (texto) mostrarDiferenca(texto, `+${diferenca}`, getComputedStyle(texto).color);
    }
  }, [mudanca]);

  const recarregando = !pro && proximaEm !== null && restantes < maximo;

  return (
    <ChipVivo
      rotulo={pro ? "Penas ilimitadas" : "Penas"}
      cor={pro ? "text-violet-500" : vazia ? "text-muted-foreground" : COR_DA_PENA[tema]}
      aberto={aberto}
      aoAbrir={aoAbrir}
      aoSegurar={aoSegurar}
      destinoDoNumero={pro ? undefined : "/loja"}
      iconeRef={icone}
      numeroRef={numero}
      // No PRO o lugar da pena é do selo: ele diz "ilimitada" melhor que um
      // infinito, e é a marca que a pessoa comprou. Sem número ao lado, o chip
      // fica só com o selo.
      icone={pro
        ? <SeloPro className="h-5.5 rounded-[3px] lg:h-6" />
        : (
          <ComEnfeite enfeite={vazia ? null : ENFEITES_DA_BARRA[tema].pena}>
            <PenaDaBarra tema={tema} vazia={vazia} className="size-5.5 lg:size-6" />
          </ComEnfeite>
        )}
      numero={pro ? null : carregando ? "…" : vidas === null ? null : (
        <Odometro valor={vidas} anterior={mudanca?.de} versao={mudanca?.id} atraso={80} />
      )}
      dica={<DicaPenas vidas={restantes} maximo={maximo} proximaEm={proximaEm} pro={pro} />}
      embaixo={recarregando && proximaEm ? <BarraRecarga proximaEm={proximaEm} aoCompletar={aoRecarregar} /> : null}
    />
  );
}
