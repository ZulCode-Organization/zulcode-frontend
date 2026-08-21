"use client";

import { useRequireAuth } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/app-shell/app-shell";
import { SideFooter } from "@/components/shared/side-footer";
import { ElementoTile } from "@/components/elementos/elemento-tile";
import { useEffect, useMemo, useState } from "react";
import { useJornada } from "@/hooks/use-jornada";
import { API_BASE_URL, fetchComTimeout } from "@/lib/api-config";
import { ElementoGlossario } from "@/lib/types/elemento";

function ElementosContent() {
  const { cursoAtual, cursos } = useJornada();
  const [elementos, setElementos] = useState<ElementoGlossario[]>([]);
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    fetchComTimeout(`${API_BASE_URL}/languages/${cursoAtual}/elements`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(setElementos);
  }, [cursoAtual]);
  const categorias = useMemo(() => Object.entries(elementos.reduce<Record<string, ElementoGlossario[]>>((acc, item) => { (acc[item.category] ??= []).push(item); return acc; }, {})), [elementos]);
  const nomeCurso = cursos.find(curso => curso.id === cursoAtual)?.name ?? cursoAtual;
  return (
    <div className="pt-3">
      <h1 className="text-2xl font-black text-foreground sm:text-[1.7rem]">Elementos de {nomeCurso}</h1>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        Toque num elemento pra ver o significado e um exemplo de novo.
      </p>

      {categorias.map(([categoria, itens]) => (
        <div key={categoria} className="mt-8">
          <div className="flex items-center gap-3.5">
            <h2 className="shrink-0 text-lg font-black text-foreground">{categoria}</h2>
            <div className="h-px flex-1 bg-border" aria-hidden />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {itens.map((elemento) => (
              <ElementoTile key={elemento.id} elemento={elemento} />
            ))}
          </div>
        </div>
      ))}

      {elementos.length === 0 && <p className="mt-10 text-center text-[0.85rem] text-muted-foreground">Conclua aulas deste curso para desbloquear elementos.</p>}
    </div>
  );
}

export default function ElementosPage() {
  useRequireAuth();

  return (
    <AppShell rightPanel={<SideFooter />}>
      <ElementosContent />
    </AppShell>
  );
}
