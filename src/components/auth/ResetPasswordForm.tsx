"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, KeyRound, Lock, Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

type Etapa = "email" | "codigo" | "senha" | "pronto";

/** Quanto tempo esperar antes de poder pedir outro código. */
const ESPERA_REENVIO = 45;

/**
 * Redefinição de senha em três etapas, uma tela de cada vez:
 * e-mail → código de 6 dígitos → senha nova.
 *
 * Cada etapa é uma chamada que já existe na API:
 * POST /auth/password-reset/request, /verify e /confirm. O `verify` devolve
 * um resetToken de 10 minutos, que é o que autoriza a troca — por isso ele
 * fica só em memória, nunca no localStorage.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const campoCodigo = useRef<HTMLInputElement>(null);

  // Contagem pro reenvio: evita a pessoa metralhar o botão e cair no bloqueio
  // por tentativas que o backend aplica depois de 5 pedidos em 2 horas.
  useEffect(() => {
    if (segundos <= 0) return;
    const id = window.setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [segundos]);

  const chamar = async (rota: string, corpo: object) => {
    const resposta = await fetchComTimeout(`${API_BASE_URL}/auth/password-reset/${rota}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    const dados = await resposta.json().catch(() => null);
    if (!resposta.ok) {
      const mensagem = Array.isArray(dados?.message) ? dados.message.join(". ") : dados?.message;
      throw new Error(mensagem ?? "Não foi possível concluir. Tente de novo.");
    }
    return dados;
  };

  const pedirCodigo = async () => {
    if (!email.trim()) return setErro("Escreva o seu e-mail.");
    setCarregando(true);
    setErro("");
    try {
      await chamar("request", { email: email.trim() });
      setEtapa("codigo");
      setSegundos(ESPERA_REENVIO);
      window.setTimeout(() => campoCodigo.current?.focus(), 50);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  const conferirCodigo = async () => {
    if (!/^\d{6}$/.test(codigo)) return setErro("O código tem 6 dígitos.");
    setCarregando(true);
    setErro("");
    try {
      const dados = await chamar("verify", { email: email.trim(), code: codigo });
      setResetToken(dados.resetToken);
      setEtapa("senha");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  const salvarSenha = async () => {
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirmar) return setErro("As senhas não coincidem.");
    setCarregando(true);
    setErro("");
    try {
      await chamar("confirm", { resetToken, password: senha });
      setEtapa("pronto");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  const voltarEtapa = () => {
    setErro("");
    if (etapa === "codigo") setEtapa("email");
    if (etapa === "senha") setEtapa("codigo");
  };

  const passo = etapa === "email" ? 1 : etapa === "codigo" ? 2 : 3;

  return (
    <div className="w-full max-w-sm animate-fade-in-up">
      {etapa !== "pronto" && (
        <>
          <div className="mb-6 flex items-center gap-3">
            {etapa !== "email" && (
              <button
                type="button"
                onClick={voltarEtapa}
                aria-label="Voltar"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <span className="text-xs font-black uppercase tracking-[0.08em] text-primary">
              Passo {passo} de 3
            </span>
          </div>

          {/* Barra de progresso das três etapas. */}
          <div className="mb-7 flex gap-1.5">
            {[1, 2, 3].map((numero) => (
              <span
                key={numero}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  numero <= passo ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {etapa === "email" && (
        <>
          <h2 className="text-2xl font-bold text-foreground">Redefinir senha</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Escreva o e-mail da sua conta. Vamos enviar um código de 6 dígitos pra ele.
          </p>

          <div className="mt-7 flex flex-col gap-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pedirCodigo()}
              icon={<Mail className="size-4" />}
            />
            {erro && <Aviso texto={erro} />}
            <Button size="lg" onClick={pedirCodigo} disabled={carregando} className="mt-2">
              {carregando ? "Enviando..." : "Enviar código"}
            </Button>
          </div>
        </>
      )}

      {etapa === "codigo" && (
        <>
          <h2 className="text-2xl font-bold text-foreground">Confira seu e-mail</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Se existir uma conta para <b className="text-foreground">{email.trim()}</b>, o código
            chegou lá. Ele vale por 15 minutos.
          </p>

          <div className="mt-7 flex flex-col gap-4">
            <Input
              ref={campoCodigo}
              label="Código de 6 dígitos"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && conferirCodigo()}
              icon={<KeyRound className="size-4" />}
              className="text-center text-lg font-black tracking-[0.4em]"
            />
            {erro && <Aviso texto={erro} />}
            <Button size="lg" onClick={conferirCodigo} disabled={carregando} className="mt-2">
              {carregando ? "Conferindo..." : "Continuar"}
            </Button>

            <button
              type="button"
              onClick={pedirCodigo}
              disabled={segundos > 0 || carregando}
              className="text-center text-sm font-semibold text-primary transition-opacity duration-150 hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              {segundos > 0 ? `Reenviar em ${segundos}s` : "Não recebi, reenviar código"}
            </button>
          </div>
        </>
      )}

      {etapa === "senha" && (
        <>
          <h2 className="text-2xl font-bold text-foreground">Crie a nova senha</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pelo menos 8 caracteres. Ao salvar, as outras sessões conectadas serão desconectadas.
          </p>

          <div className="mt-7 flex flex-col gap-4">
            <Input
              label="Nova senha"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && salvarSenha()}
              icon={<Lock className="size-4" />}
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              placeholder="••••••••"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && salvarSenha()}
              icon={<Lock className="size-4" />}
            />
            {erro && <Aviso texto={erro} />}
            <Button size="lg" onClick={salvarSenha} disabled={carregando} className="mt-2">
              {carregando ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </div>
        </>
      )}

      {etapa === "pronto" && (
        <div className="flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500">
            <MailCheck className="size-8" />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-foreground">Senha atualizada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Agora é só entrar com a senha nova.
          </p>
          <Button size="lg" onClick={() => router.push("/login")} className="mt-7 w-full">
            Ir para o login
          </Button>
        </div>
      )}

      {etapa !== "pronto" && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Lembrou a senha?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Voltar ao login
          </Link>
        </p>
      )}
    </div>
  );
}

function Aviso({ texto }: { texto: string }) {
  return (
    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
      {texto}
    </p>
  );
}
