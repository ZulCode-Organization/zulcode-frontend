import { useState } from "react";
import { useRouter } from "next/navigation";

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
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Credenciais inválidas");
        return;
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("isNivelado", data.isNivelado ? "true" : "false");

      if (typeof window !== "undefined" && (window as any).electron) {
        (window as any).electron.notifyAuthSuccess();
      } else {
        if (data.isNivelado) {
          router.push("/home");
        } else {
          router.push("/onboarding/introduction");
        }
      }
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, senha, setSenha, error, loading, handleSubmit };
}