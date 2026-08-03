"use client";

import { useEffect, useState } from "react";
import dadosUsuarioPadrao from "@/data/dados_usuario.json";
import { DadosUsuario } from "@/lib/types/usuario";
import { carregarUsuario } from "@/lib/usuario-storage";

export function useUsuario(): DadosUsuario {
  const [usuario, setUsuario] = useState<DadosUsuario>(dadosUsuarioPadrao as DadosUsuario);

  useEffect(() => {
    const salvo = carregarUsuario();
    if (salvo) setUsuario(salvo);
  }, []);

  return usuario;
}
