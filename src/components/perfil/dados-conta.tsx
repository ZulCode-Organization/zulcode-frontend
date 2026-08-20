"use client";

import { useState } from "react";
import { Check, Loader2, UserRound } from "lucide-react";
import { usePerfil } from "@/hooks/use-perfil";

/**
 * Edição de nome e e-mail — usa o PUT /user, que valida a unicidade do
 * e-mail e devolve o perfil atualizado. O botão só habilita quando algo
 * mudou de verdade, pra não mandar requisição à toa.
 */
export function DadosConta() {
  const { perfil, salvarDados } = usePerfil();

  /* Rascunho só existe depois que a pessoa digita: até lá os campos mostram
     o que veio do perfil. Assim não é preciso um efeito pra sincronizar
     quando o perfil chega da API (e nem cair no setState dentro de efeito). */
  const [rascunho, setRascunho] = useState<{ nome: string; email: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  if (!perfil) return null;

  const nome = rascunho?.nome ?? perfil.nome;
  const email = rascunho?.email ?? perfil.email;

  const nomeLimpo = nome.trim();
  const emailLimpo = email.trim();
  const mudou = nomeLimpo !== perfil.nome || emailLimpo !== perfil.email;
  const valido = nomeLimpo.length >= 2 && emailLimpo.includes("@");

  const editar = (campos: { nome?: string; email?: string }) =>
    setRascunho({ nome, email, ...campos });

  const salvar = async () => {
    if (!mudou || !valido || salvando) return;
    setSalvando(true);
    setErro(null);
    setSalvo(false);

    const resultado = await salvarDados({
      ...(nomeLimpo !== perfil.nome ? { nome: nomeLimpo } : {}),
      ...(emailLimpo !== perfil.email ? { email: emailLimpo } : {}),
    });

    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.mensagem ?? "Não deu pra salvar agora.");
      return;
    }

    // Volta a espelhar o perfil (que já foi atualizado pelo hook).
    setRascunho(null);
    setSalvo(true);
    window.setTimeout(() => setSalvo(false), 2500);
  };

  const campo =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors duration-150 focus:border-primary";

  return (
    <div>
      <h3 className="mb-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.09em] text-muted-foreground/70">
        Dados da conta
      </h3>

      <div className="rounded-[20px] border border-border bg-card px-5 py-5">
        <div className="mb-3.5 flex items-center gap-2.5 text-[0.95rem] font-extrabold text-foreground">
          <UserRound className="size-4.5" />
          Nome e e-mail
        </div>

        <label className="block text-[0.75rem] font-extrabold uppercase tracking-[0.06em] text-muted-foreground">
          Nome
        </label>
        <input
          value={nome}
          onChange={(evento) => editar({ nome: evento.target.value })}
          className={`mt-1.5 ${campo}`}
          autoComplete="name"
        />

        <label className="mt-3.5 block text-[0.75rem] font-extrabold uppercase tracking-[0.06em] text-muted-foreground">
          E-mail
        </label>
        <input
          value={email}
          onChange={(evento) => editar({ email: evento.target.value })}
          type="email"
          className={`mt-1.5 ${campo}`}
          autoComplete="email"
        />

        {erro && (
          <p className="mt-3 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-[0.82rem] text-destructive">
            {erro}
          </p>
        )}

        <button
          type="button"
          onClick={salvar}
          disabled={!mudou || !valido || salvando}
          className="zc-press zc-press-shadow mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-[0.78rem] font-black uppercase tracking-[0.06em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
          style={{ ["--zc-press-color" as string]: "color-mix(in srgb, var(--primary) 70%, black)" }}
        >
          {salvando && <Loader2 className="size-4 animate-spin" />}
          {salvo && !salvando && <Check className="size-4" />}
          {salvando ? "Salvando" : salvo ? "Salvo" : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
