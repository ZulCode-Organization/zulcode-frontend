"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Palette, UserRound } from "lucide-react";
import { PerfilUsuario } from "@/lib/types/perfil";
import { AVATARES, AVATAR_MARCA, AvatarIcon, podeUsarAvatarDaMarca } from "@/components/shared/avatar-icon";
import { usePerfil } from "@/hooks/use-perfil";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { BANNERS_ESPECIAIS, CORES_CAPA } from "./banners";

interface EditorAvatarProps {
  perfil: PerfilUsuario;
  onFechar: () => void;
}

type Aba = "icone" | "fundo";

const ABAS: { id: Aba; rotulo: string; Icone: typeof UserRound }[] = [
  { id: "icone", rotulo: "Ícone do perfil", Icone: UserRound },
  { id: "fundo", rotulo: "Cor do fundo", Icone: Palette },
];

/**
 * Tela de edição do perfil, aberta pelo lápis da capa.
 *
 * Junta num lugar só o que antes eram dois pop-ups soltos no cabeçalho: o
 * ícone do perfil e o fundo. As opções são as que existem de verdade — a
 * lista fixa de ícones, as cores de capa e os banners que a pessoa comprou ou
 * desbloqueou. Cada escolha salva na hora em PUT /user (mesma chamada de
 * antes), então o "Pronto" só fecha a tela.
 */
export function EditorAvatar({ perfil, onFechar }: EditorAvatarProps) {
  const { salvarDados } = usePerfil();
  const [aba, setAba] = useState<Aba>("icone");
  const [avatar, setAvatar] = useState(perfil.avatarId ?? "orbit");
  const [fundo, setFundo] = useState(perfil.bannerColor ?? "#22c55e");
  const [avataresComprados, setAvataresComprados] = useState<string[]>([]);
  const [bannersComprados, setBannersComprados] = useState<{ id: string; name: string; gradient: string }[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    fetchComTimeout(`${API_BASE_URL}/user/zulcoins/cosmetics`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((itens: { id: string; name: string; kind: string; owned: boolean; value: { avatarId?: string; gradient?: string } }[]) => {
        setAvataresComprados(itens.filter((item) => item.kind === "AVATAR" && item.owned && item.value.avatarId).map((item) => item.value.avatarId!));
        setBannersComprados(itens.filter((item) => item.kind === "BANNER" && item.owned && item.value.gradient).map((item) => ({ id: item.id, name: item.name, gradient: item.value.gradient! })));
      })
      .catch(() => { setAvataresComprados([]); setBannersComprados([]); });
  }, []);

  /** Aplica na hora e confirma no servidor. Se o PUT recusar, desfaz e conta o
   * motivo — em vez de deixar a tela mostrando uma escolha que não foi salva. */
  const escolherAvatar = async (id: string) => {
    const anterior = avatar;
    setAvatar(id);
    setAviso(null);
    const resultado = await salvarDados({ avatarId: id });
    if (!resultado.ok) {
      setAvatar(anterior);
      setAviso(resultado.mensagem ?? "Não deu pra salvar esse ícone.");
    }
  };

  const escolherFundo = async (valor: string) => {
    const anterior = fundo;
    setFundo(valor);
    setAviso(null);
    const resultado = await salvarDados({ bannerColor: valor });
    if (!resultado.ok) {
      setFundo(anterior);
      setAviso(resultado.mensagem ?? "Não deu pra salvar esse fundo.");
    }
  };

  const conquistouRichard = perfil.conquistas?.some(({ id }) => id === "richard-tribute") ?? false;
  const especiais = BANNERS_ESPECIAIS.filter((banner) =>
    banner.id === "richard-tribute-banner" ? conquistouRichard : !!perfil[banner.requer]
  );
  const banners = [...especiais, ...bannersComprados];

  // Os ícones que a conta pode usar: os livres, mais os comprados, os que vêm
  // de selo (PRO, dev, pioneiro) e o logo da marca, exclusivo da conta oficial.
  const iconesDisponiveis = AVATARES.filter(
    ({ id }) =>
      (id !== "comet" || avataresComprados.includes(id)) &&
      (id !== "pro" || perfil.isPro) &&
      (id !== "developer" || perfil.isDeveloper) &&
      (id !== "early-tester" || perfil.isEarlyTester) &&
      (id !== AVATAR_MARCA || podeUsarAvatarDaMarca(perfil.email))
  );

  return (
    <div className="animate-fade-in-up pt-3">
      <header className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onFechar}
          aria-label="Voltar ao perfil"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" strokeWidth={2.4} />
        </button>
        <h1 className="text-xl font-black">Edite o seu perfil</h1>
      </header>

      <div className="overflow-hidden rounded-[20px] border border-border bg-card lg:grid lg:grid-cols-[1fr_360px]">
        {/* Prévia: a capa de verdade com o ícone escolhido por cima. */}
        <div className="flex min-h-[240px] items-center justify-center p-6" style={{ background: fundo }}>
          <span className="flex size-28 items-center justify-center rounded-[32px] bg-black/15 text-white [&>svg]:size-16">
            <AvatarIcon id={avatar} />
          </span>
        </div>

        <div className="border-t border-border lg:border-l lg:border-t-0">
          <div className="flex border-b border-border">
            {ABAS.map(({ id, rotulo, Icone }) => (
              <button
                key={id}
                type="button"
                onClick={() => setAba(id)}
                title={rotulo}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 border-b-2 py-3.5 text-[0.75rem] font-black uppercase tracking-[0.05em] transition-colors duration-150",
                  aba === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icone className="size-4.5" />
                <span className="hidden sm:inline">{rotulo}</span>
              </button>
            ))}
          </div>

          <div className="p-5">
            {aba === "icone" ? (
              <>
                <p className="pb-3 text-[0.7rem] font-black uppercase tracking-[0.1em] text-muted-foreground">Ícone do perfil</p>
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
                  {iconesDisponiveis.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => escolherAvatar(id)}
                      aria-label={`Usar ícone ${label}`}
                      title={label}
                      className={cn(
                        "zc-press grid aspect-square place-items-center rounded-xl border text-xl transition-colors duration-150",
                        avatar === id ? "border-primary bg-primary/10 ring-2 ring-primary/40" : "border-border bg-background hover:border-primary/40"
                      )}
                    >
                      <AvatarIcon id={id} />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="pb-3 text-[0.7rem] font-black uppercase tracking-[0.1em] text-muted-foreground">Cor do fundo</p>
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
                  {CORES_CAPA.map((cor) => (
                    <button
                      key={cor.id}
                      type="button"
                      onClick={() => escolherFundo(cor.valor)}
                      aria-label={cor.label}
                      title={cor.label}
                      className={cn(
                        "zc-press grid aspect-square place-items-center rounded-xl border-2 transition-colors duration-150",
                        fundo === cor.valor ? "border-primary" : "border-transparent"
                      )}
                      style={{ background: cor.valor }}
                    >
                      {fundo === cor.valor && <Check className="size-5 text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>

                {banners.length > 0 && (
                  <>
                    <p className="pb-3 pt-5 text-[0.7rem] font-black uppercase tracking-[0.1em] text-muted-foreground">Banners desbloqueados</p>
                    <div className="grid gap-2">
                      {banners.map((banner) => (
                        <button
                          key={banner.id}
                          type="button"
                          onClick={() => escolherFundo(banner.gradient)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border p-1.5 text-left text-xs font-black transition-colors duration-150",
                            fundo === banner.gradient ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"
                          )}
                        >
                          <span className="h-8 w-12 shrink-0 rounded-lg" style={{ background: banner.gradient }} />
                          <span className="min-w-0 flex-1 truncate">{banner.name}</span>
                          {fundo === banner.gradient && <Check className="size-4 shrink-0 text-primary" strokeWidth={3} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {aviso && (
        <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-[0.82rem] font-bold text-destructive">{aviso}</p>
      )}

      {/* Cada escolha já salvou sozinha; o Pronto só devolve pro perfil. */}
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onFechar}
          className="zc-press zc-press-shadow rounded-2xl bg-primary px-10 py-3.5 text-[0.8rem] font-black uppercase tracking-[0.08em] text-primary-foreground"
          style={{ ["--zc-press-color" as string]: "rgba(0,0,0,0.32)" }}
        >
          Pronto
        </button>
      </div>
    </div>
  );
}
