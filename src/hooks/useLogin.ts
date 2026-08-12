import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

export function useLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        setError(data.message ?? "Credenciais inválidas");
        return;
      }

      // Só o token de sessão fica salvo localmente. Nome, XP, streak, cursos
      // etc. são sempre buscados na API (ver hooks/use-perfil.tsx) — nunca
      // cacheados aqui, pra não ficarem desatualizados ou "fake".
      localStorage.setItem("accessToken", data.accessToken);

      if (typeof window !== "undefined" && (window as any).electron) {
        (window as any).electron.notifyAuthSuccess();
      } else {
        if (data.isNivelado) {
          router.push("/home");
        } else {
          router.push("/onboarding/introduction");
        }
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

  return { email, setEmail, senha, setSenha, error, loading, handleSubmit };
}
