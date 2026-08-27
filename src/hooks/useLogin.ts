import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

export function useLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const finishLogin = (data: { accessToken: string; role: string; isNivelado: boolean }) => {
    localStorage.setItem("accessToken", data.accessToken);
    if (data.role === "ADMIN") { router.push("/admin/home"); return; }
    router.push(data.isNivelado ? "/home" : "/onboarding/introduction");
  };
  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetchComTimeout(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = typeof data.message === "object" ? data.message : data;
        setError(typeof data.message === "string" ? data.message : detail?.message ?? "Credenciais inválidas");
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
