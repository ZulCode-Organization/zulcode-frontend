"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone, ShieldAlert } from "lucide-react";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

type Request = { id: string; targetLabel?: string | null };

export function DeviceSessionProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const [working, setWorking] = useState(false);
  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem("accessToken"); if (!token || document.hidden) return;
      try { const response = await fetchComTimeout(`${API_BASE_URL}/auth/device-requests`, { headers: { Authorization: `Bearer ${token}` } }); if (response.ok) setRequest((await response.json())[0] ?? null); } catch { /* next poll */ }
    };
    void check(); const timer = window.setInterval(check, 12_000); return () => clearInterval(timer);
  }, []);
  const decide = async (decision: "approve" | "deny") => {
    const token = localStorage.getItem("accessToken"); if (!token || !request) return;
    setWorking(true);
    try { const response = await fetchComTimeout(`${API_BASE_URL}/auth/device-requests/decision`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ requestId: request.id, decision }) }); if (response.ok) { setRequest(null); if (decision === "approve") { localStorage.removeItem("accessToken"); window.location.assign("/login?session=transferred"); } } } finally { setWorking(false); }
  };
  return <>{children}{request && <div className="fixed inset-0 z-[200] grid place-items-center bg-black/65 p-5"><section role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl"><span className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500"><ShieldAlert className="size-6" /></span><h2 className="mt-5 text-xl font-black">Tentativa em outro dispositivo</h2><p className="mt-2 text-sm leading-6 text-muted-foreground"><b className="text-foreground">{request.targetLabel ?? "Outro dispositivo"}</b> está tentando entrar na sua conta. Deseja transferir o acesso?</p><p className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><MonitorSmartphone className="size-4 text-primary" />Ao transferir, esta sessão será encerrada.</p><div className="mt-6 grid gap-2 sm:grid-cols-2"><button type="button" disabled={working} onClick={() => decide("deny")} className="rounded-xl border border-border px-4 py-3 text-sm font-black">Bloquear tentativa</button><button type="button" disabled={working} onClick={() => decide("approve")} className="rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground">{working ? "Aguarde…" : "Trocar dispositivo"}</button></div></section></div>}</>;
}
