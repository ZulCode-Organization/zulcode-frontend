import { useState } from "react";
import { useRouter } from "next/navigation";

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
      const signupRes = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nome, email, password: senha }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        setError(signupData.message ?? "Erro ao criar conta");
        return;
      }

      const signinRes = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha }),
      });

      const signinData = await signinRes.json();

      if (!signinRes.ok) {
        router.push("/login");
        return;
      }

      localStorage.setItem("accessToken", signinData.accessToken);

      if (typeof window !== "undefined" && (window as any).electron) {
        (window as any).electron.notifyAuthSuccess();
      } else {
        router.push("/home");
      }
    } catch {
      setError("Erro ao conectar com o servidor");
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