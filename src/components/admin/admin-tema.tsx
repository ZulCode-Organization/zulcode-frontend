"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { pedir, useDados } from "@/lib/admin/api";
import { Rupee } from "@/components/shared/rupee";
import {
  COR_DA_PENA, COR_DO_RUPEE, ChamaNeon, ComEnfeite, PenaDaBarra, corDaChama, definirTemaDaBarra,
  type TemaDaBarra,
} from "@/components/app-shell/barra-viva/tema";
import { Pagina } from "./shell";
import { Botao, Cabecalho, Cartao, Erro, Esqueleto } from "./ui";

const OPCOES: { tema: TemaDaBarra; nome: string; descricao: string }[] = [
  { tema: "normal", nome: "Normal", descricao: "Chama neon pela sequência, rupee verde e pena violeta." },
  { tema: "halloween", nome: "Halloween", descricao: "Chama verde de bruxa, rupee abóbora com a abóbora e pena roxa com morcego." },
  { tema: "natal", nome: "Natal", descricao: "Chama neon pela sequência, rupee vermelho e pena verde." },
];

/** A barra como a pessoa vai ver, com números de exemplo. */
function Previa({ tema }: { tema: TemaDaBarra }) {
  return (
    <div className="flex items-center justify-around gap-2 rounded-xl border bg-background px-3 py-3 text-[0.95rem] font-extrabold">
      <span className={cn("inline-flex items-center gap-1.5", corDaChama(12, tema))}>
        <ChamaNeon className="size-7" dias={12} tema={tema} />12
      </span>
      <span className={cn("inline-flex items-center gap-1.5", COR_DO_RUPEE[tema])}>
        <ComEnfeite enfeite={tema === "halloween" ? "abobora" : null}>
          <Rupee className="size-6" />
        </ComEnfeite>
        250
      </span>
      <span className={cn("inline-flex items-center gap-1.5", COR_DA_PENA[tema])}>
        <ComEnfeite enfeite={tema === "halloween" ? "morcego" : null}>
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
    </Pagina>
  );
}
