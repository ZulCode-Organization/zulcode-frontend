"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, KeyRound, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

type Step = "email" | "code" | "password" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      if (step === "email") {
        const response = await fetchComTimeout(`${API_BASE_URL}/auth/password-reset/request`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.message); setMessage(data.message); setStep("code");
      } else if (step === "code") {
        const response = await fetchComTimeout(`${API_BASE_URL}/auth/password-reset/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.message); setResetToken(data.resetToken); setStep("password");
      } else if (step === "password") {
        if (password !== confirm) throw new Error("As senhas não coincidem.");
        const response = await fetchComTimeout(`${API_BASE_URL}/auth/password-reset/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resetToken, password }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.message); setStep("done");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível concluir a operação."); }
    finally { setLoading(false); }
  };
  const copy = step === "email" ? ["Recuperar senha", "Informe o e-mail da sua conta e enviaremos um código seguro.", <Mail key="mail" className="size-5" />] : step === "code" ? ["Confira seu e-mail", "Digite o código de seis dígitos enviado para você.", <KeyRound key="key" className="size-5" />] : step === "password" ? ["Crie uma nova senha", "Escolha uma senha forte para proteger sua conta.", <Lock key="lock" className="size-5" />] : ["Senha atualizada", "Sua conta está protegida novamente.", <CheckCircle2 key="check" className="size-5" />];
  return <main className="grid min-h-dvh place-items-center bg-background px-5 py-10"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-xl sm:p-9"><span className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">{copy[2]}</span><h1 className="text-2xl font-black">{copy[0]}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy[1]}</p>{step === "email" && <div className="mt-7"><Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required icon={<Mail className="size-4" />} /></div>}{step === "code" && <div className="mt-7"><Input label="Código" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" required icon={<KeyRound className="size-4" />} /></div>}{step === "password" && <div className="mt-7 space-y-4"><Input label="Nova senha" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required icon={<Lock className="size-4" />} /><Input label="Confirmar nova senha" type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required icon={<Lock className="size-4" />} /></div>}{message && <p className="mt-5 rounded-xl bg-primary/10 p-3 text-sm text-primary">{message}</p>}{error && <p className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}{step !== "done" ? <Button type="submit" size="lg" className="mt-7 w-full" disabled={loading}>{loading ? "Aguarde…" : step === "email" ? "Enviar código" : step === "code" ? "Validar código" : "Salvar nova senha"}</Button> : <Link href="/login" className="mt-7 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-black text-primary-foreground">Voltar para entrar</Link>}<Link href="/login" className="mt-5 block text-center text-sm font-semibold text-muted-foreground hover:text-primary">Voltar ao login</Link></form></main>;
}
