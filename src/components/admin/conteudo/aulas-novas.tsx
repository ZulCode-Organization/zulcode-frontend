"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { Botao, Selo } from "../ui";
import { ConfirmarDigitando } from "../dialogo";
import { avisar } from "../avisos";
import { invalidar, pedir, useDados } from "@/lib/admin/api";
import { numero } from "@/lib/admin/formato";

interface SituacaoDaLinguagem {
  slug: string;
  nome: string;
  pronto: boolean;
  aulasNovas: number;
  unidadesNovas: number;
  problemas: string[];
  trocada: boolean;
  licoesHoje: number;
}

const ROTA = "/admin/aulas-novas";

/**
 * As aulas novas que já foram escritas e a troca de cada linguagem, uma de
 * cada vez. Trocar apaga a trilha antiga daquela linguagem: o progresso nas
 * aulas recomeça (XP, rupees, ofensiva e conquistas ficam), por isso a
 * confirmação pede o nome da linguagem digitado.
 */
export function AulasNovas() {
  const { dados } = useDados<SituacaoDaLinguagem[]>(ROTA);
  const [trocando, setTrocando] = useState<SituacaoDaLinguagem | null>(null);
  const prontas = dados?.filter((l) => l.pronto) ?? [];
  if (!prontas.length) return null;

  return (
    <section className="mb-5 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h2 className="font-black">Aulas novas</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Trilhas reescritas no formato novo (conceito, código, depuração, prova e projeto). Troque uma linguagem por vez.
      </p>
      <ul className="mt-3 divide-y">
        {prontas.map((l) => (
          <li key={l.slug} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black">{l.nome}</p>
                {l.trocada ? (
                  <Selo tom="verde" icone={<CheckCircle2 className="size-3" />}>No ar</Selo>
                ) : (
                  <Selo tom="roxo">Esperando a troca</Selo>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {numero(l.aulasNovas)} aulas em {numero(l.unidadesNovas)} unidades · hoje a trilha tem {numero(l.licoesHoje)} {l.licoesHoje === 1 ? "aula" : "aulas"}
              </p>
              {l.problemas.length > 0 && (
                <details className="mt-1.5 text-xs">
                  <summary className="inline-flex cursor-pointer items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-3" />
                    {l.problemas.length} {l.problemas.length === 1 ? "problema" : "problemas"} no curso
                  </summary>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                    {l.problemas.slice(0, 20).map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </details>
              )}
            </div>
            <Botao
              variante={l.trocada ? "fantasma" : "primario"}
              disabled={l.problemas.length > 0}
              onClick={() => setTrocando(l)}
              className="w-full sm:w-auto"
            >
              {l.trocada ? "Importar de novo" : "Trocar pelas aulas novas"}
            </Botao>
          </li>
        ))}
      </ul>

      {trocando && (
        <ConfirmarDigitando
          aberto
          aoFechar={() => setTrocando(null)}
          titulo={`Trocar as aulas de ${trocando.nome}?`}
          palavra={trocando.slug}
          rotuloDoBotao="Trocar agora"
          aoConfirmar={async () => {
            const r = await pedir<{ licoes: number; questoes: number }>(`${ROTA}/${trocando.slug}`, { method: "POST" });
            invalidar(ROTA);
            invalidar("/admin/conteudo/cursos");
            avisar(`${trocando.nome}: ${r.licoes} aulas e ${r.questoes} questões no ar.`);
          }}
        >
          <p>
            As {numero(trocando.licoesHoje)} aulas de hoje saem e entram {numero(trocando.aulasNovas)} aulas novas, já publicadas.
          </p>
          <p className="mt-2">
            <b className="text-foreground">Todo mundo recomeça a trilha de {trocando.nome}.</b> XP, rupees, ofensiva e conquistas continuam. Não dá para desfazer.
          </p>
        </ConfirmarDigitando>
      )}
    </section>
  );
}
