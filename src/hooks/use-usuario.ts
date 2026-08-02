import dadosUsuario from "@/data/dados_usuario.json";
import { DadosUsuario } from "@/lib/types/usuario";

export function useUsuario(): DadosUsuario {
  return dadosUsuario as DadosUsuario;
}
