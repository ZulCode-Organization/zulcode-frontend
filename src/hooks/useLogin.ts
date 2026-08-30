import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { obterDeviceId, obterDeviceLabel } from "@/lib/device-id";

export function useLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [aguardandoAparelho, setAguardandoAparelho] = useState(false);

  const finishLogin = (data: { accessToken: string; role: string; isNivelado: boolean }) => {
    localStorage.setItem("accessToken", data.accessToken);
    if (data.role === "ADMIN") { router.push("/admin/home"); return; }
    router.push(data.isNivelado ? "/home" : "/onboarding/introduction");
  };

  /**
   * Pergunta ao servidor, de 3 em 3 segundos, se o outro aparelho já decidiu.
   * O pedido expira em 5 minutos, então a espera para junto — sem isso a
   * página ficaria consultando pra sempre.
   */
  const aguardarConfirmacao = async (transferToken: string) => {
    const limite = Date.now() + 5 * 60_000;

    while (Date.now() < limite) {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const resposta = await fetchComTimeout(`${API_BASE_URL}/auth/device-requests/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferToken }),
      }).catch(() => null);

      const dados = await resposta?.json().catch(() => null);
      if (!dados) continue;

      if (dados.status === "approved") {
        setAguardandoAparelho(false);
        finishLogin(dados);
        return;
      }
      if (dados.status === "denied" || dados.status === "expired") {
        setAguardandoAparelho(false);
        setError(
          dados.status === "denied"
            ? "O outro aparelho recusou a troca."
            : "O pedido expirou. Tente entrar de novo."
        );
        return;
      }
      // "pending": segue esperando.
    }

    setAguardandoAparelho(false);
    setError("Ninguém confirmou no outro aparelho. Tente entrar de novo.");
  };
  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetchComTimeout(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha, deviceId: obterDeviceId(), deviceLabel: obterDeviceLabel() }),
      });

      const data = await res.json();

      // 409 SESSION_IN_USE: a conta já está aberta em outro aparelho. O
      // backend devolve um transferToken de 5 minutos; o outro aparelho vê o
      // pedido (DeviceSessionProvider) e aprova ou bloqueia. Aqui a gente
      // espera essa decisão em vez de tratar como erro e parar.
      if (res.status === 409 && data?.transferToken) {
        setAguardandoAparelho(true);
        await aguardarConfirmacao(data.transferToken);
        return;
      }

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

  return { email, setEmail, senha, setSenha, error, loading, aguardandoAparelho, handleSubmit };
}
