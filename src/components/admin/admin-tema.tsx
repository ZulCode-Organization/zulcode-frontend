"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { pedir, useDados } from "@/lib/admin/api";
import { Rupee } from "@/components/shared/rupee";
import {
  COR_DA_PENA, COR_DO_RUPEE, ChamaNeon, ComEnfeite, ENFEITES_DA_BARRA, PenaDaBarra, corDaChama, definirTemaDaBarra,
  type TemaDaBarra,
} from "@/components/app-shell/barra-viva/tema";
import { Pagina } from "./shell";
import { Botao, Cabecalho, Cartao, Erro, Esqueleto } from "./ui";

const OPCOES: { tema: TemaDaBarra; nome: string; descricao: string }[] = [
  { tema: "normal", nome: "Normal", descricao: "Chama neon pela sequência, rupee verde e pena violeta." },
  { tema: "halloween", nome: "Halloween", descricao: "O app em laranja e roxo, abóbora nas aulas feitas; na barra, chama verde de bruxa, rupee com abóbora e pena com morcego." },
  { tema: "natal", nome: "Natal", descricao: "O app em vermelho e verde, presente nas aulas feitas; na barra, chama de gelo, rupee com presente e pena com árvore." },
];

/** A barra como a pessoa vai ver, com números de exemplo. */
function Previa({ tema }: { tema: TemaDaBarra }) {
  return (
    <div className="flex items-center justify-around gap-2 rounded-xl border bg-background px-3 py-3 text-[0.95rem] font-extrabold">
      <span className={cn("inline-flex items-center gap-1.5", corDaChama(12, tema))}>
        <ChamaNeon className="size-7" dias={12} tema={tema} />12
      </span>
      <span className={cn("inline-flex items-center gap-1.5", COR_DO_RUPEE[tema])}>
        <ComEnfeite enfeite={ENFEITES_DA_BARRA[tema].rupee}>
          <Rupee className="size-6" />
        </ComEnfeite>
        250
      </span>
      <span className={cn("inline-flex items-center gap-1.5", COR_DA_PENA[tema])}>
        <ComEnfeite enfeite={ENFEITES_DA_BARRA[tema].pena}>
          <PenaDaBarra className="size-6" tema={tema} />
        </ComEnfeite>
        5
      </span>
    </div>
  );
}

/**
 * O tema da barra de cima. Não há data automática: o tema fica ligado até
 * alguém trocar aqui. Quem já está com o app aberto vê a troca na próxima vez
 * que abrir.
 */
export function AdminTema() {
  const { dados, erro, recarregar } = useDados<{ tema: TemaDaBarra }>("/admin/tema");
  const [salvando, setSalvando] = useState<TemaDaBarra | null>(null);
  const [falha, setFalha] = useState("");
  const atual = dados?.tema;

  const ligar = async (tema: TemaDaBarra) => {
    setSalvando(tema);
    setFalha("");
    try {
      await pedir("/admin/tema", { method: "PUT", json: { tema } });
      definirTemaDaBarra(tema);
      recarregar();
    } catch (e) {
      setFalha(e instanceof Error ? e.message : "Não foi possível trocar o tema.");
    } finally {
      setSalvando(null);
    }
  };

  return (
    <Pagina>
      <Cabecalho
        titulo="Tema da barra"
        descricao="Os ícones da chama, dos rupees e das penas no alto do app. O tema escolhido vale para todo mundo até ser trocado aqui."
      />
      {erro && !dados ? (
        <Erro tentarDeNovo={recarregar}>{erro}</Erro>
      ) : !dados ? (
        <Esqueleto linhas={4} />
      ) : (
        <>
          {falha && <p className="mb-4 text-sm font-bold text-rose-600">{falha}</p>}
          <div className="grid gap-4 md:grid-cols-3">
            {OPCOES.map(({ tema, nome, descricao }) => {
              const ligado = atual === tema;
              return (
                <Cartao
                  key={tema}
                  titulo={nome}
                  descricao={descricao}
                  className={cn(ligado && "border-primary ring-2 ring-primary/20")}
                >
                  <Previa tema={tema} />
                  <Botao
                    variante={ligado ? "secundario" : "primario"}
                    className="mt-3 w-full"
                    disabled={ligado}
                    carregando={salvando === tema}
                    icone={ligado ? <Check className="size-4" /> : undefined}
                    onClick={() => void ligar(tema)}
                  >
                    {ligado ? "Ligado agora" : "Ligar este tema"}
                  </Botao>
                </Cartao>
              );
            })}
          </div>
        </>
      )}
      <TemasEmUso />
    </Pagina>
  );
}

type TemaEmUso = { cor: string; nome: string; pessoas: number };

/**
 * Os temas que as pessoas estão usando agora, com um "Tirar de todos" em
 * cada. Quem estava com o tema volta ao padrão do ZulCode; quem comprou o
 * tema na loja continua dono e pode usar de novo. Durante um evento isto não
 * é preciso: o tema do evento já passa por cima de qualquer um.
 */
export function TemasEmUso() {
  const { dados, erro, recarregar } = useDados<TemaEmUso[]>("/admin/temas-em-uso");
  const [armado, setArmado] = useState<string | null>(null);
  const [tirando, setTirando] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");

  const tirar = async (tema: TemaEmUso) => {
    setTirando(tema.cor);
    setAviso("");
    try {
      const r = await pedir<{ pessoas: number }>("/admin/temas-em-uso/tirar", { method: "POST", json: { cor: tema.cor } });
      setAviso(`${tema.nome} tirado de ${r.pessoas} ${r.pessoas === 1 ? "pessoa" : "pessoas"}.`);
      recarregar();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Não foi possível tirar o tema.");
    } finally {
      setTirando(null);
      setArmado(null);
    }
  };

  return (
    <Cartao
      className="mt-6"
      titulo="Temas que as pessoas estão usando"
      descricao="Tirar um tema faz todo mundo que está com ele voltar ao tema padrão. Quem comprou na loja continua dono e pode usar de novo."
    >
      {erro && !dados ? (
        <Erro tentarDeNovo={recarregar}>{erro}</Erro>
      ) : !dados ? (
        <Esqueleto linhas={3} />
      ) : !dados.length ? (
        <p className="text-sm text-muted-foreground">Ninguém está usando um tema diferente do padrão.</p>
      ) : (
        <div className="divide-y">
          {dados.map((tema) => (
            <div key={tema.cor} className="flex items-center gap-3 py-2.5">
              <span className="size-7 shrink-0 rounded-lg border" style={{ background: tema.cor }} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{tema.nome}</p>
                <p className="text-xs text-muted-foreground">{tema.pessoas} {tema.pessoas === 1 ? "pessoa usando" : "pessoas usando"}</p>
              </div>
              {armado === tema.cor ? (
                <>
                  <Botao variante="fantasma" tamanho="sm" onClick={() => setArmado(null)}>Cancelar</Botao>
                  <Botao variante="perigo" tamanho="sm" carregando={tirando === tema.cor} onClick={() => void tirar(tema)}>
                    Tirar de {tema.pessoas}
                  </Botao>
                </>
              ) : (
                <Botao variante="secundario" tamanho="sm" disabled={tirando !== null} onClick={() => setArmado(tema.cor)}>Tirar de todos</Botao>
              )}
            </div>
          ))}
        </div>
      )}
      {aviso && <p className="mt-3 text-sm font-bold">{aviso}</p>}
    </Cartao>
  );
}
