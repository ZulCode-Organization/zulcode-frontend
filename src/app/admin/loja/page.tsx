"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";

type ShopEffect = "RECOVER_LIVES" | "FREEZE_STREAK" | "DOUBLE_XP";
type ShopItem = { id: string; title: string; description: string; price: number; effect: ShopEffect; active: boolean; order: number };

const effectOptions: Array<{ value: ShopEffect; label: string }> = [
  { value: "RECOVER_LIVES", label: "Recuperar vidas" },
  { value: "FREEZE_STREAK", label: "Congelar streak" },
  { value: "DOUBLE_XP", label: "XP em dobro" },
];
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken")}` });
const messageOf = (body: unknown, fallback: string) => {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    return Array.isArray(message) ? message.join(" ") : String(message || fallback);
  }
  return fallback;
};

export default function AdminLoja() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [editing, setEditing] = useState<ShopItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetchComTimeout(`${API_BASE_URL}/admin/shop`, { headers: authHeaders() });
      if (!response.ok) throw new Error(messageOf(await response.json().catch(() => null), "Não foi possível carregar a loja."));
      setItems(await response.json());
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível carregar a loja."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const data = { title: String(form.get("title") || "").trim(), description: String(form.get("description") || "").trim(), price: Number(form.get("price")), effect: form.get("effect") as ShopEffect, active: form.get("active") === "on", order: Number(form.get("order")) };
    setSaving(true); setError("");
    try {
      const response = await fetchComTimeout(`${API_BASE_URL}/admin/shop${editing.id ? `/${editing.id}` : ""}`, { method: editing.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error(messageOf(await response.json().catch(() => null), "Não foi possível salvar o item."));
      setEditing(null); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível salvar o item."); }
    finally { setSaving(false); }
  };

  const remove = async (item: ShopItem) => {
    if (!window.confirm(`Excluir “${item.title}”? Esta ação não pode ser desfeita.`)) return;
    setError("");
    try {
      const response = await fetchComTimeout(`${API_BASE_URL}/admin/shop/${item.id}`, { method: "DELETE", headers: authHeaders() });
      if (!response.ok) throw new Error(messageOf(await response.json().catch(() => null), "Não foi possível excluir o item."));
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível excluir o item."); }
  };

  return <AppShell><section className="py-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-black text-primary">ADMINISTRAÇÃO</p><h1 className="text-3xl font-black">Loja</h1><p className="mt-1 text-sm text-muted-foreground">Configure os consumíveis vendidos por moedas.</p></div><button onClick={() => { setError(""); setEditing({ id: "", title: "", description: "", price: 0, effect: "RECOVER_LIVES", active: true, order: items.length }); }} className="rounded-xl bg-primary px-4 py-3 font-black text-primary-foreground">Novo item</button></div>
    {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-600">{error}</div>}
    <div className="mt-6 overflow-hidden rounded-2xl border bg-card">{loading ? <p className="p-6 text-sm text-muted-foreground">Carregando itens…</p> : items.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Nenhum item cadastrado.</p> : items.map((item) => <article key={item.id} className="flex flex-wrap items-center gap-4 border-b p-4 last:border-0"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b>{item.title}</b><span className={`rounded-full px-2 py-0.5 text-xs font-black ${item.active ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"}`}>{item.active ? "Ativo" : "Inativo"}</span></div><p className="mt-1 text-sm text-muted-foreground">{item.description}</p><p className="mt-2 text-xs font-bold text-primary">{item.price} moedas · {effectOptions.find(({ value }) => value === item.effect)?.label ?? item.effect} · ordem {item.order}</p></div><div className="flex gap-2"><button onClick={() => { setError(""); setEditing(item); }} className="rounded-lg bg-muted px-3 py-2 text-sm font-bold">Editar</button><button onClick={() => void remove(item)} className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-600">Excluir</button></div></article>)}</div>
    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-3xl bg-card p-6 shadow-2xl"><div><h2 className="text-xl font-black">{editing.id ? "Editar item" : "Novo item"}</h2><p className="text-sm text-muted-foreground">A alteração aparece na loja assim que for salva.</p></div><input name="title" defaultValue={editing.title} placeholder="Título" className="w-full rounded-xl border bg-background p-3" required /><textarea name="description" defaultValue={editing.description} placeholder="Descrição" className="min-h-24 w-full rounded-xl border bg-background p-3" required /><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Preço em moedas<input name="price" type="number" min="0" defaultValue={editing.price} className="mt-1 w-full rounded-xl border bg-background p-3" required /></label><label className="text-sm font-bold">Ordem<input name="order" type="number" min="0" defaultValue={editing.order} className="mt-1 w-full rounded-xl border bg-background p-3" required /></label></div><label className="block text-sm font-bold">Efeito<select name="effect" defaultValue={editing.effect} className="mt-1 w-full rounded-xl border bg-background p-3">{effectOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label><label className="flex items-center gap-2 text-sm font-bold"><input name="active" type="checkbox" defaultChecked={editing.active} /> Disponível para compra</label><div className="flex gap-2"><button disabled={saving} className="rounded-xl bg-primary px-4 py-3 font-black text-primary-foreground disabled:opacity-60">{saving ? "Salvando…" : "Salvar"}</button><button type="button" disabled={saving} onClick={() => { setEditing(null); setError(""); }} className="rounded-xl bg-muted px-4 py-3 font-black">Cancelar</button></div></form></div>}
  </section></AppShell>;
}
