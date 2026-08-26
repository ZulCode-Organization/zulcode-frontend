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
  const waitForTransfer = async (transferToken: string) => {
    setLoading(true);
    for (let tryCount = 0; tryCount < 100; tryCount++) {
      await new Promise((resolve) => window.setTimeout(resolve, 3000));
      try {
        const response = await fetchComTimeout(`${API_BASE_URL}/auth/device-requests/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transferToken }) });
        const data = await response.json();
        if (data.status === "approved") { finishLogin(data); return; }
        if (data.status === "denied" || data.status === "expired") { setError(data.status === "denied" ? "O acesso foi bloqueado no outro dispositivo." : "A confirmação expirou. Tente entrar novamente."); return; }
      } catch { /* keep waiting while the confirmation is valid */ }
    }
    setError("A confirmação expirou. Tente entrar novamente."); setLoading(false);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      let deviceId = localStorage.getItem("zulcode:device-id");
      if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem("zulcode:device-id", deviceId); }
      const res = await fetchComTimeout(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha, deviceId, deviceLabel: navigator.userAgent.includes("Mobile") ? "Dispositivo móvel" : "Navegador" }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = typeof data.message === "object" ? data.message : data;
        if (detail?.code === "SESSION_IN_USE" && detail.transferToken) { setError("Aguarde: a confirmação foi enviada para o dispositivo que já está conectado."); window.setTimeout(() => void waitForTransfer(detail.transferToken), 0); return; }
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
