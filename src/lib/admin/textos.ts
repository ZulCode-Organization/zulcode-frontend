import { numero } from "./formato";

/** Como cada ação registrada aparece em texto, na ficha e no registro. */
export const TEXTO_DA_ACAO: Record<string, string> = {
  conceder_recursos: "Ajustou o saldo",
  estornar: "Estornou um ajuste",
  alterar_selos: "Alterou os selos",
  alterar_papel: "Alterou o papel",
  bloquear: "Bloqueou",
  suspender: "Suspendeu",
  desbloquear: "Liberou a conta",
  restaurar_ofensiva: "Restaurou a ofensiva",
  notificar: "Mandou notificação",
  dar_cortesia: "Deu PRO de cortesia",
  tirar_cortesia: "Encerrou a cortesia",
  exportar_dados: "Exportou os dados",
  excluir_conta: "Excluiu a conta",
  publicar_aula: "Publicou a aula",
  duplicar_aula: "Duplicou a aula",
  criar_aula: "Criou a aula",
  apagar_aula: "Apagou a aula",
  criar_unidade: "Criou a unidade",
  editar_unidade: "Renomeou a unidade",
  apagar_unidade: "Apagou a unidade",
  criar_secao: "Criou a seção",
  editar_secao: "Editou a seção",
  apagar_secao: "Apagou a seção",
  criar_curso: "Criou o curso",
  editar_curso: "Editou o curso",
  apagar_curso: "Apagou o curso",
  reordenar_secao: "Reordenou seções",
  reordenar_unidade: "Reordenou unidades",
  reordenar_aula: "Reordenou aulas",
  criar_item: "Criou um item da loja",
  editar_item: "Editou um item da loja",
  apagar_item: "Apagou um item da loja",
  criar_cosmetico: "Criou um cosmético",
  editar_cosmetico: "Editou um cosmético",
  apagar_cosmetico: "Apagou um cosmético",
  criar_segmento: "Salvou um segmento",
  apagar_segmento: "Apagou um segmento",
};

/** O que mudou num ajuste de saldo, em texto: "+50 rupees, −10 XP". */
export function resumoDoAjuste(d: Record<string, unknown>) {
  const partes: string[] = [];
  const sinal = (n: number) => (n > 0 ? `+${numero(n)}` : `−${numero(Math.abs(n))}`);
  if (typeof d.coins === "number" && d.coins) partes.push(`${sinal(d.coins)} rupees`);
  if (typeof d.xp === "number" && d.xp) partes.push(`${sinal(d.xp)} XP`);
  if (typeof d.lives === "number" && d.lives) partes.push(`${sinal(d.lives)} penas`);
  return partes.join(", ");
}
