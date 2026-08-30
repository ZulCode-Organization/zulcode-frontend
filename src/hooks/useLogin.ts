import { useState } from "react";
import { useRouter } from "next/navigation";
import { CorpoSignin, entrarNaConta, mensagemDoErro } from "@/lib/signin-request";

export function useLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const finishLogin = (data: CorpoSignin) => {
    if (!data.accessToken) {
      setError("O servidor não devolveu o token de acesso. Tente novamente.");
      return;
    }

    localStorage.setItem("accessToken", data.accessToken);
    if (data.role === "ADMIN") { router.push("/admin/home"); return; }
    router.push(data.isNivelado ? "/home" : "/onboarding/introduction");
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const { res, data } = await entrarNaConta(email, senha);

      if (!res.ok) {
        setError(mensagemDoErro(data, "Credenciais inválidas"));
        return;
      }

      // Só o token de sessão fica salvo localmente. Nome, XP, streak, cursos
      // etc. são sempre buscados na API (ver hooks/use-perfil.tsx) — nunca
      // cacheados aqui, pra não ficarem desatualizados ou "fake".
      finishLogin(data);
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

  return { email, setEmail, senha, setSenha, error, loading, handleSubmit };
}
