"use client";

import { useState } from "react";
import { Gift, Trash2, Trophy } from "lucide-react";
import { Dialogo } from "../dialogo";
import { Botao, Entrada, Escolha, Rotulo, Segmentado, Selo } from "../ui";
import { avisar } from "../avisos";
import { AvatarIcon } from "@/components/shared/avatar-icon";
import { AvatarComMoldura } from "@/components/shared/avatar-com-moldura";
import { corDoAvatar } from "@/lib/avatares";
import { invalidar, pedir, useDados } from "@/lib/admin/api";
import { data } from "@/lib/admin/formato";
import type { ConquistaDoAdmin, Cosmetico, CosmeticoDaPessoa, FichaDaPessoa, ItemDaLoja } from "@/lib/admin/tipos";

/** A amostra de um cosmético: o ícone, a moldura em volta de um ícone ou a faixa do banner. */
export function AmostraDoCosmetico({ c }: { c: Pick<Cosmetico, "kind" | "value"> }) {
  if (c.kind === "AVATAR") {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] text-white" style={{ background: corDoAvatar(c.value.avatarId) }}>
        <AvatarIcon id={c.value.avatarId} />
      </span>
    );
  }
  if (c.kind === "FRAME") {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center">
        <AvatarComMoldura avatarId="capivara" molduraId={c.value.molduraId} capa="#1892ff" animar={false} className="size-[21px] rounded-[6px]" />
      </span>
    );
  }
  return <span className="h-9 w-14 shrink-0 rounded-lg border" style={{ background: c.value.background ?? c.value.gradient ?? "#22c55e" }} />;
}

/** Escolhe um avatar ou banner, inclusive os que estão fora da loja (os exclusivos). */
export function EscolhaDeCosmetico({ valor, aoMudar, opcional = false }: { valor: string; aoMudar: (id: string) => void; opcional?: boolean }) {
  const { dados } = useDados<Cosmetico[]>("/admin/loja/cosmeticos");
  const lista = (dados ?? []).filter((c) => c.kind !== "THEME");
  const escolhido = lista.find((c) => c.id === valor);
  return (
    <div className="space-y-2">
      <Rotulo texto="Cosmético" dica="Para criar um exclusivo, vá em Loja e deixe-o fora de venda.">
        <Escolha value={valor} onChange={(e) => aoMudar(e.target.value)}>
          <option value="">{opcional ? "Nenhum" : "Escolha…"}</option>
          {(["AVATAR", "FRAME", "BANNER"] as const).map((tipo) => (
            <optgroup key={tipo} label={tipo === "AVATAR" ? "Ícones" : tipo === "FRAME" ? "Molduras" : "Banners"}>
              {lista.filter((c) => c.kind === tipo).map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.active ? "" : " · exclusivo (fora da loja)"}</option>
              ))}
            </optgroup>
          ))}
        </Escolha>
      </Rotulo>
      {escolhido && (
        <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
          <AmostraDoCosmetico c={escolhido} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{escolhido.name}</p>
            <p className="truncate text-xs text-muted-foreground">{escolhido.description || (escolhido.kind === "AVATAR" ? "Avatar" : "Banner")}</p>
          </div>
          {!escolhido.active && <Selo tom="roxo">Exclusivo</Selo>}
        </div>
      )}
    </div>
  );
}

/** Escolhe um item da loja de efeito (penas, gás de ofensiva, XP em dobro...). */
export function EscolhaDeItem({ valor, aoMudar }: { valor: string; aoMudar: (id: string) => void }) {
  const { dados } = useDados<ItemDaLoja[]>("/admin/loja/itens");
  return (
    <Rotulo texto="Item">
      <Escolha value={valor} onChange={(e) => aoMudar(e.target.value)}>
        <option value="">Escolha…</option>
        {(dados ?? []).map((i) => (
          <option key={i.id} value={i.id}>{i.title}{i.aVenda ? "" : " · fora da loja"}</option>
        ))}
      </Escolha>
    </Rotulo>
  );
}

/** Escolhe uma conquista, mostrando o prêmio que vem junto. */
function EscolhaDeConquista({ valor, aoMudar }: { valor: string; aoMudar: (id: string) => void }) {
  const { dados } = useDados<ConquistaDoAdmin[]>("/admin/conquistas");
  const escolhida = dados?.find((c) => c.id === valor);
  const premio = escolhida
    ? [escolhida.reward.coins ? `${escolhida.reward.coins} rupees` : "", escolhida.reward.cosmetics?.length ? `${escolhida.reward.cosmetics.length} cosmético(s)` : ""].filter(Boolean).join(" + ")
    : "";
  return (
    <div className="space-y-2">
      <Rotulo texto="Conquista" dica="Para criar uma conquista só para dar à mão (de evento, de beta tester...), use o tipo “Manual” em Conquistas.">
        <Escolha value={valor} onChange={(e) => aoMudar(e.target.value)}>
          <option value="">Escolha…</option>
          {(dados ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.title}{c.criteria.type === "manual" ? " · manual" : ""}</option>
          ))}
        </Escolha>
      </Rotulo>
      {escolhida && (
        <div className="rounded-lg border px-3 py-2">
          <p className="text-sm font-bold">{escolhida.title}</p>
          <p className="text-xs text-muted-foreground">{escolhida.description}</p>
          <p className="mt-1 text-xs font-bold">{premio ? `Vem com ${premio}.` : "Sem prêmio, só a conquista."}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Presentes para uma pessoa: dar um avatar ou banner (inclusive os exclusivos,
 * que não estão à venda), dar um item da loja, dar uma conquista e ver ou
 * tirar os cosméticos que ela já tem.
 */
export function PresentesDaPessoa({ pessoa, aoFechar }: { pessoa: FichaDaPessoa; aoFechar: () => void }) {
  const [aba, setAba] = useState<"cosmetico" | "item" | "conquista">("cosmetico");
  const [cosmeticId, setCosmeticId] = useState("");
  const [conquistaId, setConquistaId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [enviando, setEnviando] = useState<string | null>(null);
  const chaveDosCosmeticos = `/admin/pessoas/${pessoa.id}/cosmeticos`;
  const deles = useDados<CosmeticoDaPessoa[]>(chaveDosCosmeticos);

  const fazer = async (chave: string, f: () => Promise<unknown>, texto: string) => {
    setEnviando(chave);
    try {
      await f();
      invalidar(chaveDosCosmeticos);
      invalidar(`/admin/pessoas/${pessoa.id}`);
      invalidar("/admin/acoes");
      avisar(texto);
      return true;
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível concluir.", { tom: "erro" });
      return false;
    } finally {
      setEnviando(null);
    }
  };

  const darCosmetico = async () => {
    const ok = await fazer("dar", () => pedir(chaveDosCosmeticos, { method: "POST", json: { cosmeticId } }), "Cosmético dado.");
    if (ok) setCosmeticId("");
  };
  const darItem = async () => {
    const vezes = Math.min(5, Math.max(1, Math.trunc(Number(quantidade) || 1)));
    const ok = await fazer("item", () => pedir(`/admin/pessoas/${pessoa.id}/itens`, { method: "POST", json: { itemId, quantidade: vezes } }), "Item dado.");
    if (ok) setItemId("");
  };
  const darConquista = async () => {
    const ok = await fazer("conquista", () => pedir(`/admin/pessoas/${pessoa.id}/conquistas`, { method: "POST", json: { achievementId: conquistaId } }), "Conquista dada, com o prêmio dela.");
    if (ok) {
      setConquistaId("");
      invalidar("/admin/conquistas");
    }
  };
  const tirar = (c: CosmeticoDaPessoa) =>
    fazer(`tirar-${c.id}`, () => pedir(`${chaveDosCosmeticos}/${encodeURIComponent(c.id)}`, { method: "DELETE" }), `"${c.name}" tirado.`);

  return (
    <Dialogo
      aberto
      aoFechar={aoFechar}
      titulo={`Presentes para ${pessoa.name}`}
      descricao="O que é dado aparece na hora para a pessoa e fica no registro de ações."
      rodape={<Botao variante="fantasma" onClick={aoFechar}>Fechar</Botao>}
    >
      <div className="space-y-4">
        <Segmentado<"cosmetico" | "item" | "conquista">
          rotulo="Dar"
          valor={aba}
          aoMudar={setAba}
          opcoes={[{ valor: "cosmetico", texto: "Avatar ou banner" }, { valor: "item", texto: "Item da loja" }, { valor: "conquista", texto: "Conquista" }]}
        />

        {aba === "cosmetico" ? (
          <div className="space-y-2">
            <EscolhaDeCosmetico valor={cosmeticId} aoMudar={setCosmeticId} />
            <Botao variante="primario" icone={<Gift className="size-4" />} disabled={!cosmeticId} carregando={enviando === "dar"} onClick={darCosmetico}>Dar cosmético</Botao>
          </div>
        ) : aba === "conquista" ? (
          <div className="space-y-2">
            <EscolhaDeConquista valor={conquistaId} aoMudar={setConquistaId} />
            <Botao variante="primario" icone={<Trophy className="size-4" />} disabled={!conquistaId} carregando={enviando === "conquista"} onClick={darConquista}>Dar conquista</Botao>
          </div>
        ) : (
          <div className="space-y-2">
            <EscolhaDeItem valor={itemId} aoMudar={setItemId} />
            <Rotulo texto="Quantas vezes" dica="O efeito é aplicado na hora, como numa compra (até 5).">
              <Entrada inputMode="numeric" value={quantidade} onChange={(e) => setQuantidade(e.target.value.replace(/\D/g, ""))} maxLength={1} />
            </Rotulo>
            <Botao variante="primario" icone={<Gift className="size-4" />} disabled={!itemId} carregando={enviando === "item"} onClick={darItem}>Dar item</Botao>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-muted-foreground">Cosméticos que já tem</p>
          {!deles.dados ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : deles.dados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum avatar ou banner ainda.</p>
          ) : (
            <ul className="space-y-1.5">
              {deles.dados.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                  <AmostraDoCosmetico c={c} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">Desde {data(c.desde)}{c.equipado ? " · em uso" : ""}</p>
                  </div>
                  {!c.active && <Selo tom="roxo">Exclusivo</Selo>}
                  <Botao
                    tamanho="sm"
                    variante="fantasma"
                    aria-label={`Tirar ${c.name}`}
                    icone={<Trash2 className="size-4" />}
                    carregando={enviando === `tirar-${c.id}`}
                    onClick={() => void tirar(c)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dialogo>
  );
}
