"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ExternalLink, Flag } from "lucide-react";
import { invalidar, pedir, useDados } from "@/lib/admin/api";
import { dataHora, relativo } from "@/lib/admin/formato";
import { MOTIVOS_DE_DENUNCIA } from "@/lib/playground/projetos";
import { Pagina } from "./shell";
import { AvatarPequeno, Botao, Cabecalho, Cartao, Erro, Esqueleto, Segmentado, Selo, Vazio } from "./ui";

type Situacao = "aberta" | "removida" | "descartada";

type Denuncia = {
  id: string;
  motivo: string;
  detalhe: string | null;
  slug: string;
  criadaEm: string;
  resolvidaEm: string | null;
  projeto: { id: string; nome: string; slugAtual: string | null; abertas: number };
  autor: { id: string; name: string; avatarId: string | null };
  denunciante: { id: string; name: string };
};

const SITUACOES: { valor: Situacao; texto: string }[] = [
  { valor: "aberta", texto: "Abertas" },
  { valor: "removida", texto: "Tiradas do ar" },
  { valor: "descartada", texto: "Descartadas" },
];

const textoDoMotivo = (motivo: string) => MOTIVOS_DE_DENUNCIA.find((m) => m.valor === motivo)?.texto ?? motivo;

/**
 * Denúncias de projetos do playground abertos pelo link público (a Google Play
 * exige o canal). Tirar do ar desliga o link e encerra todas as denúncias
 * abertas do projeto; o projeto continua na conta do dono, privado.
 */
export function AdminDenuncias() {
  const [tipo, setTipo] = useState<"pessoas" | "projetos">("pessoas");
  const escolha = <Segmentado<"pessoas" | "projetos"> rotulo="Tipo" opcoes={[{ valor: "pessoas", texto: "Pessoas" }, { valor: "projetos", texto: "Projetos" }]} valor={tipo} aoMudar={setTipo} />;
  return tipo === "pessoas" ? <DenunciasDePessoas escolha={escolha} /> : <DenunciasDeProjetos escolha={escolha} />;
}

type SituacaoDePessoa = "aberta" | "resolvida" | "descartada";

type DenunciaDePessoa = {
  id: string;
  motivo: string;
  detalhe: string | null;
  criadaEm: string;
  resolvidaEm: string | null;
  alvo: { id: string; name: string; avatarId: string | null; publicCode: string; isBanned: boolean; abertas: number };
  denunciante: { id: string; name: string };
};

const MOTIVOS_DE_PESSOA: Record<string, string> = {
  ofensivo: "Nome ou foto ofensivos",
  assedio: "Assédio, ódio ou ameaça",
  golpe: "Spam ou golpe",
  falso: "Se passando por outra pessoa",
  outro: "Outro motivo",
};

/**
 * Pessoas denunciadas no fim do perfil delas. A ação de verdade (suspender,
 * bloquear) é feita na ficha da pessoa; aqui a equipe só marca a denúncia como
 * resolvida ou descartada, o que vale para todas as abertas contra ela.
 */
function DenunciasDePessoas({ escolha }: { escolha: ReactNode }) {
  const [situacao, setSituacao] = useState<SituacaoDePessoa>("aberta");
  const { dados, erro, recarregar, atualizando } = useDados<DenunciaDePessoa[]>(`/admin/denuncias/pessoas?status=${situacao}`);
  const [decidindo, setDecidindo] = useState<string | null>(null);
  const [falha, setFalha] = useState("");

  const decidir = async (id: string, acao: "resolver" | "descartar") => {
    setDecidindo(id + acao);
    setFalha("");
    try {
      await pedir(`/admin/denuncias/pessoas/${id}/${acao}`, { method: "POST" });
      invalidar("/admin/denuncias/pessoas");
      await recarregar();
    } catch (e) {
      setFalha(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setDecidindo(null);
    }
  };

  return (
    <Pagina>
      <Cabecalho
        titulo="Denúncias"
        descricao="Pessoas denunciadas no fim do perfil. Se procede, abra a ficha e suspenda ou bloqueie; depois marque como resolvida."
        acoes={
          <>
            {escolha}
            <Segmentado<SituacaoDePessoa>
              rotulo="Situação"
              opcoes={[{ valor: "aberta", texto: "Abertas" }, { valor: "resolvida", texto: "Resolvidas" }, { valor: "descartada", texto: "Descartadas" }]}
              valor={situacao}
              aoMudar={setSituacao}
            />
          </>
        }
      />
      {falha && <div className="mb-4"><Erro>{falha}</Erro></div>}
      {erro && !dados ? (
        <Erro tentarDeNovo={recarregar}>{erro}</Erro>
      ) : !dados ? (
        <Cartao><Esqueleto linhas={4} /></Cartao>
      ) : !dados.length ? (
        <Cartao>
          <Vazio titulo={situacao === "aberta" ? "Nenhuma pessoa denunciada" : "Nada por aqui"} icone={<Flag className="size-5" />}>
            {situacao === "aberta" ? "Quando alguém denunciar um perfil, ele aparece aqui." : undefined}
          </Vazio>
        </Cartao>
      ) : (
        <div className="space-y-2.5">
          {dados.map((d) => (
            <Cartao key={d.id} atualizando={atualizando} corpo="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <AvatarPequeno id={d.alvo.avatarId} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="truncate text-sm">{d.alvo.name}</b>
                    <span className="text-xs font-black text-muted-foreground">#{d.alvo.publicCode}</span>
                    <Selo tom="vermelho">{MOTIVOS_DE_PESSOA[d.motivo] ?? d.motivo}</Selo>
                    {situacao === "aberta" && d.alvo.abertas > 1 && <Selo tom="ambar">{d.alvo.abertas} denúncias</Selo>}
                    {d.alvo.isBanned && <Selo>Bloqueada</Selo>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Denunciada por <Link href={`/admin/pessoas/${d.denunciante.id}`} className="font-bold text-foreground hover:underline">{d.denunciante.name}</Link>
                    {" · "}<span title={dataHora(d.criadaEm)}>{relativo(d.criadaEm)}</span>
                    {d.resolvidaEm && <> · decidida <span title={dataHora(d.resolvidaEm)}>{relativo(d.resolvidaEm)}</span></>}
                  </p>
                  {d.detalhe && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm">{d.detalhe}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <Link
                    href={`/admin/pessoas/${d.alvo.id}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ExternalLink className="size-3.5" /> Abrir ficha
                  </Link>
                  {situacao === "aberta" && (
                    <>
                      <Botao tamanho="sm" variante="secundario" carregando={decidindo === d.id + "descartar"} disabled={decidindo !== null} onClick={() => void decidir(d.id, "descartar")}>
                        Descartar
                      </Botao>
                      <Botao tamanho="sm" variante="primario" carregando={decidindo === d.id + "resolver"} disabled={decidindo !== null} onClick={() => void decidir(d.id, "resolver")}>
                        Resolvida
                      </Botao>
                    </>
                  )}
                </div>
              </div>
            </Cartao>
          ))}
        </div>
      )}
    </Pagina>
  );
}

function DenunciasDeProjetos({ escolha }: { escolha: ReactNode }) {
  const [situacao, setSituacao] = useState<Situacao>("aberta");
  const caminho = `/admin/denuncias?status=${situacao}`;
  const { dados, erro, recarregar, atualizando } = useDados<Denuncia[]>(caminho);
  const [decidindo, setDecidindo] = useState<string | null>(null);
  const [falha, setFalha] = useState("");

  const decidir = async (id: string, acao: "remover" | "descartar") => {
    setDecidindo(id + acao);
    setFalha("");
    try {
      await pedir(`/admin/denuncias/${id}/${acao}`, { method: "POST" });
      invalidar("/admin/denuncias");
      await recarregar();
    } catch (e) {
      setFalha(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setDecidindo(null);
    }
  };

  return (
    <Pagina>
      <Cabecalho
        titulo="Denúncias"
        descricao="Projetos do playground denunciados por quem abriu o link público. Tirar do ar desliga o link; o projeto continua com o dono, privado."
        acoes={<>{escolha}<Segmentado<Situacao> rotulo="Situação" opcoes={SITUACOES} valor={situacao} aoMudar={setSituacao} /></>}
      />
      {falha && <div className="mb-4"><Erro>{falha}</Erro></div>}
      {erro && !dados ? (
        <Erro tentarDeNovo={recarregar}>{erro}</Erro>
      ) : !dados ? (
        <Cartao><Esqueleto linhas={4} /></Cartao>
      ) : !dados.length ? (
        <Cartao>
          <Vazio titulo={situacao === "aberta" ? "Nenhuma denúncia para olhar" : "Nada por aqui"} icone={<Flag className="size-5" />}>
            {situacao === "aberta" ? "Quando alguém denunciar um projeto compartilhado, ele aparece aqui." : undefined}
          </Vazio>
        </Cartao>
      ) : (
        <div className="space-y-2.5">
          {dados.map((d) => {
            const linkNoAr = d.projeto.slugAtual === d.slug;
            return (
              <Cartao key={d.id} atualizando={atualizando} corpo="p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <AvatarPequeno id={d.autor.avatarId} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="truncate text-sm">{d.projeto.nome}</b>
                      <Selo tom="vermelho">{textoDoMotivo(d.motivo)}</Selo>
                      {situacao === "aberta" && d.projeto.abertas > 1 && <Selo tom="ambar">{d.projeto.abertas} denúncias</Selo>}
                      {situacao === "aberta" && !linkNoAr && <Selo>Link já desligado</Selo>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      De <Link href={`/admin/pessoas/${d.autor.id}`} className="font-bold text-foreground hover:underline">{d.autor.name}</Link>
                      {" · "}denunciado por <Link href={`/admin/pessoas/${d.denunciante.id}`} className="font-bold text-foreground hover:underline">{d.denunciante.name}</Link>
                      {" · "}<span title={dataHora(d.criadaEm)}>{relativo(d.criadaEm)}</span>
                      {d.resolvidaEm && <> · resolvida <span title={dataHora(d.resolvidaEm)}>{relativo(d.resolvidaEm)}</span></>}
                    </p>
                    {d.detalhe && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm">{d.detalhe}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {/* Abre pelo link denunciado: depois de tirado do ar, ele mostra "link desativado". */}
                    <a
                      href={`/p/${d.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ExternalLink className="size-3.5" /> Abrir
                    </a>
                    {situacao === "aberta" && (
                      <>
                        <Botao tamanho="sm" variante="secundario" carregando={decidindo === d.id + "descartar"} disabled={decidindo !== null} onClick={() => void decidir(d.id, "descartar")}>
                          Descartar
                        </Botao>
                        <Botao tamanho="sm" variante="perigo" carregando={decidindo === d.id + "remover"} disabled={decidindo !== null} onClick={() => void decidir(d.id, "remover")}>
                          Tirar do ar
                        </Botao>
                      </>
                    )}
                  </div>
                </div>
              </Cartao>
            );
          })}
        </div>
      )}
    </Pagina>
  );
}
