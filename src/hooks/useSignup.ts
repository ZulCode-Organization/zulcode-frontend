import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { entrarNaConta, mensagemDoErro } from "@/lib/signin-request";

export function useSignup() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const signupRes = await fetchComTimeout(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nome, email, password: senha }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        setError(signupData.message ?? "Erro ao criar conta");
        return;
      }

      const { res: signinRes, data: signinData } = await entrarNaConta(email, senha);

      // A conta foi criada, mas a entrada automática falhou. Antes isso
      // mandava a pessoa pro /login sem dizer nada — e era o que fazia o
      // cadastro "não ir pro nivelamento", sem pista nenhuma do motivo.
      // Agora o motivo aparece na tela e ela decide o que fazer.
      if (!signinRes.ok) {
        setError(
          `Sua conta foi criada, mas não deu pra entrar automaticamente: ${mensagemDoErro(signinData, "erro desconhecido")}. Tente entrar pela tela de login.`
        );
        return;
      }

      if (!signinData.accessToken) {
        setError("Sua conta foi criada, mas o servidor não devolveu o token. Tente entrar pela tela de login.");
        return;
      }

      // Só o token de sessão fica salvo localmente — o perfil (nome, XP,
      // cursos etc.) é sempre buscado na API, nunca cacheado aqui.
      localStorage.setItem("accessToken", signinData.accessToken);

      if (typeof window !== "undefined" && (window as any).electron) {
        (window as any).electron.notifyAuthSuccess();
      } else {
        router.push("/onboarding/introduction");
      }
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "AbortError"
          ? "O servidor demorou para responder. Tente novamente."
          : "Erro ao conectar com o servidor"
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    nome,
    setNome,
    email,
    setEmail,
    senha,
    setSenha,
    confirmarSenha,
    setConfirmarSenha,
    error,
    loading,
    handleSubmit,
  };
}
