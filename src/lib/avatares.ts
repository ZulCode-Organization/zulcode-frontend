/**
 * Os ícones do perfil.
 *
 * Dois tipos:
 * - os desenhados, na mesma linguagem dos ícones da barra de navegação: uma
 *   cor só (currentColor), a camada clara (opacidade .5) faz o volume e a
 *   cheia faz os detalhes, sem contorno em volta;
 * - os raros, que são os ícones oficiais do app, recortados no formato do
 *   perfil. Só a equipe usa ou dá de presente.
 *
 * Quem pode usar cada um, o servidor confere (backend: src/aparencia/regras.ts).
 * Aqui ficam os desenhos e o que mostrar no editor e na loja.
 */

export type ComoDesbloquear = "gratis" | "loja" | "pro" | "evento";

export interface AvatarDesenhado {
  id: string;
  nome: string;
  /** O conteúdo do <svg viewBox="0 0 48 48">: dado fixo deste arquivo, nunca texto de fora. */
  desenho: string;
  como: ComoDesbloquear;
  /** A cor do quadrado na loja e na vitrine (no perfil, o quadrado usa a cor da capa). */
  cor: string;
  /** Como conseguir, quando não é da loja nem livre. */
  detalhe?: string;
}

export interface AvatarRaro {
  id: string;
  nome: string;
  imagem: string;
}

export const AVATAR_PADRAO = "capivara";

export const AVATARES_DESENHADOS: AvatarDesenhado[] = [
  {
    id: "capivara",
    nome: "Capivara Lo-fi",
    como: "gratis",
    cor: "#d97706",
    desenho: `<g fill="currentColor"><g opacity=".5"><circle cx="15.5" cy="13.6" r="3.3"/><circle cx="32.5" cy="13.6" r="3.3"/><path d="M11 25C11 16.5 16.8 12.5 24 12.5S37 16.5 37 25L37.6 33.5C37.6 39.4 32.4 42.5 24 42.5S10.4 39.4 10.4 33.5Z"/></g><path d="M9.5 28C8.5 5 39.5 5 38.5 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><rect x="6" y="24" width="7.6" height="11.4" rx="3.4"/><rect x="34.4" y="24" width="7.6" height="11.4" rx="3.4"/><path d="M16.4 24.6q2.2 1.9 4.4 0M27.2 24.6q2.2 1.9 4.4 0" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/><ellipse cx="21.2" cy="33.4" rx="1.3" ry="1"/><ellipse cx="26.8" cy="33.4" rx="1.3" ry="1"/><path d="M21.6 36.8q2.4 1.7 4.8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></g>`,
  },
  {
    id: "fantasma",
    nome: "Fantasminha",
    como: "gratis",
    cor: "#2563eb",
    desenho: `<g fill="currentColor"><path opacity=".5" d="M9 40V24.6C9 15.4 15.7 9 24 9S39 15.4 39 24.6V40C39 43.9 35.9 47 32 47H16C12.1 47 9 43.9 9 40Z"/><path fill-rule="evenodd" d="M24 15.2c5.2 0 9.5 4.6 9.5 10.3S29.2 35.8 24 35.8 14.5 31.2 14.5 25.5 18.8 15.2 24 15.2ZM20.6 22.4a1.7 2.5 0 1 0 0 5a1.7 2.5 0 1 0 0-5ZM27.4 22.4a1.7 2.5 0 1 0 0 5a1.7 2.5 0 1 0 0-5ZM24 29.6a1.5 1.2 0 1 0 0 2.4a1.5 1.2 0 1 0 0-2.4Z"/><path d="M20 37.6v4.6M28 37.6v4.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="20" cy="43.4" r="1.4"/><circle cx="28" cy="43.4" r="1.4"/></g>`,
  },
  {
    id: "pato",
    nome: "Pato Debugger",
    como: "gratis",
    cor: "#0284c7",
    desenho: `<g fill="currentColor"><g opacity=".5"><path d="M37.8 33.6C40.8 29.6 44.4 30 44 33.8C43.6 37.2 40.6 38.6 38 37.8Z"/><ellipse cx="25" cy="37.2" rx="15.8" ry="8"/><circle cx="20.4" cy="21.2" r="9.8"/></g><path d="M28.4 21.6C32 19.4 37 20.2 37.3 22.8C37.6 25.4 33.2 26.8 29 25.4Z"/><circle cx="22.4" cy="18.6" r="2"/><path d="M22.6 36.4C25.2 33 31.2 33 33.8 36.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="11.4" cy="31" r="4.6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M8.2 34.4L4.4 38.6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></g>`,
  },
  {
    id: "bug",
    nome: "Bug Fofo",
    como: "gratis",
    cor: "#e11d48",
    desenho: `<g fill="currentColor"><g opacity=".5"><circle cx="24" cy="30.4" r="12.6"/><path d="M12 28L7.6 26M11.6 33.6L7 35M13.8 39L10.4 42.4M36 28L40.4 26M36.4 33.6L41 35M34.2 39L37.6 42.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></g><path d="M24 21.4V42.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="18" cy="28.4" r="2.3"/><circle cx="30" cy="28.4" r="2.3"/><circle cx="19.4" cy="36" r="1.9"/><circle cx="28.6" cy="36" r="1.9"/><path d="M21 11.4C19.4 7.6 16.8 5.6 14.4 5.6M27 11.4C28.6 7.6 31.2 5.6 33.6 5.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="14.2" cy="5.6" r="1.9"/><circle cx="33.8" cy="5.6" r="1.9"/><path fill-rule="evenodd" d="M24 10.4c4.2 0 7.6 2.8 7.6 6.2S28.2 22.8 24 22.8 16.4 20 16.4 16.6 19.8 10.4 24 10.4ZM21.2 14a2.2 2.2 0 1 0 0 4.4a2.2 2.2 0 1 0 0-4.4ZM26.8 14a2.2 2.2 0 1 0 0 4.4a2.2 2.2 0 1 0 0-4.4Z"/><circle cx="21.8" cy="15.6" r=".9"/><circle cx="27.4" cy="15.6" r=".9"/></g>`,
  },
  {
    id: "cafe",
    nome: "Café Coder",
    como: "gratis",
    cor: "#c2410c",
    desenho: `<g fill="currentColor"><g opacity=".5"><path d="M10.5 18H34V35.6C34 40.2 30.3 44 25.6 44H18.9C14.3 44 10.5 40.2 10.5 35.6Z"/><path d="M34 23.4C40.8 22.9 41.4 35 34 35.2" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></g><ellipse cx="22.3" cy="18" rx="11.8" ry="3"/><path d="M17.4 13C15.4 11 19.4 9.6 17.4 7M22.4 12C20.4 9.2 24.9 7.8 22.4 4.6M27.4 13C25.4 11 29.4 9.6 27.4 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16.2 27.4q2-2.2 4 0M24.4 27.4q2-2.2 4 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M19.4 31q2.9 3.2 5.8 0Z"/><path d="M6.6 45.6H37.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></g>`,
  },
  {
    id: "zul-miami",
    nome: "Zul Miami",
    como: "pro",
    cor: "#db2777",
    detalhe: "Vem com o PRO.",
    desenho: `<g fill="currentColor"><g opacity=".5"><path d="M18.8 11.6C17.3 7.1 20.6 4.1 24 5.6C22.5 6.4 21.8 8.3 22.5 10.5Z"/><path d="M9.6 41C7.2 34 6.8 24.5 11 17.6C15.4 10.6 22.5 8 29.6 9.1C35.6 10.2 38.6 15.5 38.6 21.8V35.4C38.6 41.4 33.8 46 27.8 46H17.4C13.6 46 10.8 44.2 9.6 41Z"/></g><path d="M34.1 18.8C39.8 15.8 45.8 19.1 45 25.9C44.6 30 42 33 38.6 34.9C39.4 31.5 38.6 28.9 36.4 28.1C34.9 27.8 33.8 26.3 33.4 24.8Z"/><path d="M10.4 19.6L15.4 20.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path fill-rule="evenodd" d="M15 18.4H33C33.9 18.4 34.5 19.2 34.2 20.1L32.5 25.3C32.1 26.3 31.1 27 30 27H19.5C18.2 27 17 26.2 16.7 24.9ZM21.6 20.2L19.5 24.9H20.7L22.8 20.2ZM25.1 20.2L23.6 23.5H24.8L26.3 20.2Z"/></g>`,
  },
  {
    id: "robo",
    nome: "Robô Bit",
    como: "loja",
    cor: "#7c3aed",
    desenho: `<g fill="currentColor"><g opacity=".5"><rect x="5.6" y="19" width="4.6" height="9.6" rx="2.2"/><rect x="37.8" y="19" width="4.6" height="9.6" rx="2.2"/><rect x="9" y="11" width="30" height="25" rx="8"/><rect x="20.6" y="35" width="6.8" height="4" rx="1.4"/><rect x="10" y="38.4" width="28" height="8.4" rx="4.2"/></g><path d="M24 11V7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="24" cy="5" r="2.6"/><rect x="13.2" y="15.4" width="21.6" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M17 24.6l2.6-2.6 2.6 2.6M25.8 24.6l2.6-2.6 2.6 2.6M21 28q3 2.4 6 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="42.6" r="1.8"/></g>`,
  },
  {
    id: "dragao",
    nome: "Dragãozinho",
    como: "loja",
    cor: "#16a34a",
    desenho: `<g fill="currentColor"><g opacity=".5"><path d="M11.6 22.6L4.4 19.6L7.8 26.2L3 29.6L11.6 31.2Z"/><path d="M36.4 22.6L43.6 19.6L40.2 26.2L45 29.6L36.4 31.2Z"/><path d="M11.2 27C11.2 17.3 16.9 12 24 12S36.8 17.3 36.8 27C36.8 36 31.5 41.2 24 41.2S11.2 36 11.2 27Z"/></g><path d="M16.1 15.4L13.1 6.4L20.6 12.4Z"/><path d="M31.9 15.4L34.9 6.4L27.4 12.4Z"/><path d="M20.6 12.8L22.4 8.6L24 12.2L25.6 8.6L27.4 12.8Z"/><path fill-rule="evenodd" d="M18.8 20.2a3.8 3.8 0 1 1 0 7.6a3.8 3.8 0 1 1 0-7.6ZM19.5 22.4a1.9 1.9 0 1 0 0 3.8a1.9 1.9 0 1 0 0-3.8Z"/><path fill-rule="evenodd" d="M29.2 20.2a3.8 3.8 0 1 1 0 7.6a3.8 3.8 0 1 1 0-7.6ZM29.9 22.4a1.9 1.9 0 1 0 0 3.8a1.9 1.9 0 1 0 0-3.8Z"/><ellipse cx="21.4" cy="32.2" rx="1.1" ry=".85"/><ellipse cx="26.6" cy="32.2" rx="1.1" ry=".85"/><path d="M20.6 36.1Q24 38.7 27.4 36.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M24.9 37.3l.85 1.9.85-2.1Z"/></g>`,
  },
  {
    id: "slime",
    nome: "Slime",
    como: "loja",
    cor: "#059669",
    desenho: `<g fill="currentColor"><g opacity=".5"><path d="M8.2 40.5C7.5 29.2 12.8 17.2 24 15.8C35.2 17.2 40.5 29.2 39.8 40.5C39.8 42.8 37.5 43.9 35.2 42.8C33 41.6 32.2 44.2 29.6 44.2C26.6 44.2 26.2 42 23.6 42.8C21 43.5 19.5 45.4 16.5 44.2C14.2 43.5 13.9 41.6 11.6 42.8C9.8 43.5 8.2 42.4 8.2 40.5Z"/><ellipse cx="16.5" cy="46.4" rx="1.2" ry="1.4"/><ellipse cx="32.2" cy="46" rx="1" ry="1.2"/></g><ellipse cx="15.6" cy="25" rx="2.2" ry="3.9" transform="rotate(28 15.6 25)"/><circle cx="19.4" cy="20" r="1.1"/><ellipse cx="19.6" cy="30" rx="2.5" ry="3.3"/><ellipse cx="28.4" cy="30" rx="2.5" ry="3.3"/><path d="M21 35.4Q24 39.4 27 35.4Z"/></g>`,
  },
  {
    id: "alien",
    nome: "Alien",
    como: "loja",
    cor: "#0d9488",
    desenho: `<g fill="currentColor"><g opacity=".5"><path d="M24 9C34.1 9 40.1 16.5 39.4 25.1C38.6 34.5 31.9 41.2 24 41.6C16.1 41.2 9.4 34.5 8.6 25.1C7.9 16.5 13.9 9 24 9Z"/><ellipse cx="24" cy="43" rx="14.6" ry="4.4"/></g><path d="M19.4 11.4C18 7.6 16.9 5.3 15 3.9M28.6 11.4C30 7.6 31.1 5.3 33 3.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="3.9" r="1.9"/><circle cx="33" cy="3.9" r="1.9"/><path fill-rule="evenodd" d="M24 16.4c2.7 0 4.9 2.4 4.9 5.3S26.7 27 24 27s-4.9-2.4-4.9-5.3 2.2-5.3 4.9-5.3ZM24.6 20.1a2.3 2.3 0 1 0 0 4.6a2.3 2.3 0 1 0 0-4.6Z"/><path fill-rule="evenodd" d="M15 22.6a3 3 0 1 1 0 6a3 3 0 1 1 0-6ZM15.4 24.4a1.4 1.4 0 1 0 0 2.8a1.4 1.4 0 1 0 0-2.8Z"/><path fill-rule="evenodd" d="M33 22.6a3 3 0 1 1 0 6a3 3 0 1 1 0-6ZM33.4 24.4a1.4 1.4 0 1 0 0 2.8a1.4 1.4 0 1 0 0-2.8Z"/><path d="M20.2 32.4Q24 36.2 27.8 32.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></g>`,
  },
  {
    id: "onca",
    nome: "Onça",
    como: "loja",
    cor: "#b45309",
    desenho: `<g fill="currentColor"><g opacity=".5"><circle cx="13.5" cy="14.6" r="4.6"/><circle cx="34.5" cy="14.6" r="4.6"/><path d="M9.8 27C9.8 17.6 16.1 11.6 24 11.6S38.2 17.6 38.2 27C38.2 36 32.2 42 24 42S9.8 36 9.8 27Z"/></g><circle cx="13.5" cy="15" r="2"/><circle cx="34.5" cy="15" r="2"/><g fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2.6 1.3" stroke-linecap="round"><circle cx="19" cy="16.8" r="1.8"/><circle cx="29" cy="16.8" r="1.8"/><circle cx="24" cy="14.8" r="1.4"/><circle cx="13" cy="28" r="1.7"/><circle cx="35" cy="28" r="1.7"/></g><path fill-rule="evenodd" d="M14.4 24Q18 20 21.6 24Q18 27 14.4 24ZM18 22.5a.85 1.3 0 1 0 0 2.6a.85 1.3 0 1 0 0-2.6Z"/><path fill-rule="evenodd" d="M26.4 24Q30 20 33.6 24Q30 27 26.4 24ZM30 22.5a.85 1.3 0 1 0 0 2.6a.85 1.3 0 1 0 0-2.6Z"/><path d="M21.8 30.2H26.2C26.2 31.7 25.1 32.8 24 33.2C22.9 32.8 21.8 31.7 21.8 30.2Z"/><path d="M24 33.2V34.7M21 35.1Q22.5 36.6 24 34.7Q25.5 36.6 27 35.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  },
  {
    id: "preguica",
    nome: "Preguiça",
    como: "loja",
    cor: "#4d7c0f",
    desenho: `<g fill="currentColor"><g opacity=".5"><path d="M14.2 26.2C11.6 21 12 15.4 15.4 11.6M33.8 26.2C36.4 21 36 15.4 32.6 11.6" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round"/><ellipse cx="24" cy="28.6" rx="12.8" ry="11.3"/><ellipse cx="24" cy="43.4" rx="12.6" ry="4"/></g><path d="M1 11C12.8 8 33.8 12.8 47 9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M5 9.6C3.6 6 6.4 3.4 9 4C9 6.6 7.6 8.6 5 9.6Z"/><path d="M40 8.2C42.2 4.6 45.6 4.6 47 6.6C45 8 42.8 8.6 40 8.2Z"/><path fill-rule="evenodd" d="M15.8 27.4C16.5 24.4 20.2 23.6 21.8 25.9C22.5 28.1 20.2 30 18 30C16.5 30 15.4 28.9 15.8 27.4ZM18.9 26.3a.95.95 0 1 0 0 1.9a.95.95 0 1 0 0-1.9Z"/><path fill-rule="evenodd" d="M32.2 27.4C31.5 24.4 27.8 23.6 26.2 25.9C25.5 28.1 27.8 30 30 30C31.5 30 32.6 28.9 32.2 27.4ZM29.1 26.3a.95.95 0 1 0 0 1.9a.95.95 0 1 0 0-1.9Z"/><ellipse cx="24" cy="31.4" rx="2.2" ry="1.6"/><path d="M21 34Q24 36.4 27 34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M13.9 9.6v2.4M15.6 9.2v2.4M17.3 9.8v2.2M34.1 9.6v2.4M32.4 9.2v2.4M30.7 9.8v2.2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></g>`,
  },
  {
    id: "sapo",
    nome: "Sapinho",
    como: "loja",
    cor: "#0f766e",
    desenho: `<g fill="currentColor"><g opacity=".5"><circle cx="15.6" cy="16.8" r="6.2"/><circle cx="32.4" cy="16.8" r="6.2"/><path d="M6.8 29.6C6.8 22 13.6 17.4 24 17.4S41.2 22 41.2 29.6C41.2 36.8 34.2 40.8 24 40.8S6.8 36.8 6.8 29.6Z"/><ellipse cx="24" cy="42.8" rx="12.6" ry="4"/></g><path fill-rule="evenodd" d="M15.6 12.4a4.4 4.4 0 1 1 0 8.8a4.4 4.4 0 1 1 0-8.8ZM16.4 14.6a2.2 2.2 0 1 0 0 4.4a2.2 2.2 0 1 0 0-4.4Z"/><path fill-rule="evenodd" d="M32.4 12.4a4.4 4.4 0 1 1 0 8.8a4.4 4.4 0 1 1 0-8.8ZM33.2 14.6a2.2 2.2 0 1 0 0 4.4a2.2 2.2 0 1 0 0-4.4Z"/><circle cx="21.8" cy="25.8" r=".95"/><circle cx="26.2" cy="25.8" r=".95"/><path d="M14.6 30.2Q24 37.4 33.4 30.2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="15.2" cy="43.6" rx="3.2" ry="1.9"/><ellipse cx="32.8" cy="43.6" rx="3.2" ry="1.9"/></g>`,
  },
  {
    id: "polvo",
    nome: "Polvo",
    como: "loja",
    cor: "#be185d",
    desenho: `<g fill="currentColor"><g opacity=".5"><path d="M15 32.2C11.2 36 9 40.5 12 42.8C13.9 43.9 15.8 42.4 14.6 40.9M19.5 34.5C18 39.8 18.8 43.5 21.8 44.2M28.5 34.5C30 39.8 29.2 43.5 26.2 44.2M33 32.2C36.8 36 39 40.5 36 42.8C34.1 43.9 32.2 42.4 33.4 40.9" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><path d="M11.2 26.2C11.2 15.8 17.2 9.8 24 9.8S36.8 15.8 36.8 26.2C36.8 32.2 33 36 24 36S11.2 32.2 11.2 26.2Z"/></g><path fill-rule="evenodd" d="M19.5 21.3a3.4 3.4 0 1 1 0 6.8a3.4 3.4 0 1 1 0-6.8ZM20.1 23.1a1.7 1.7 0 1 0 0 3.4a1.7 1.7 0 1 0 0-3.4Z"/><path fill-rule="evenodd" d="M28.5 21.3a3.4 3.4 0 1 1 0 6.8a3.4 3.4 0 1 1 0-6.8ZM29.1 23.1a1.7 1.7 0 1 0 0 3.4a1.7 1.7 0 1 0 0-3.4Z"/><path d="M21.8 31q2.2 1.9 4.4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="28.6" cy="14.8" r="1.5"/><circle cx="32.4" cy="19" r="1.05"/><circle cx="16.2" cy="17" r=".9"/></g>`,
  },
  {
    id: "raposa",
    nome: "Raposa Ninja",
    como: "loja",
    cor: "#ea580c",
    desenho: `<g fill="currentColor"><g opacity=".5"><path d="M24 40.5C17.6 40.5 12.4 36.8 10.5 30.8C9 25.9 9.8 21 12 17.2L9.8 7.9C15 9.4 18.4 11.6 20.6 14.2C22.9 13.5 25.1 13.5 27.4 14.2C29.6 11.6 33 9.4 38.2 7.9L36 17.2C38.2 21 39 25.9 37.5 30.8C35.6 36.8 30.4 40.5 24 40.5Z"/><ellipse cx="24" cy="43.6" rx="12.4" ry="3.8"/></g><path d="M12.4 11.2L13.7 16.5C15 15 16.5 14.2 18 13.9C16.1 12.4 14.2 11.6 12.4 11.2Z"/><path d="M35.6 11.2L34.3 16.5C33 15 31.5 14.2 30 13.9C31.9 12.4 33.8 11.6 35.6 11.2Z"/><path d="M12.4 28.5C15.8 31.9 19.9 33.4 24 39C28.1 33.4 32.2 31.9 35.6 28.5C34.5 35.6 29.6 40.5 24 40.5S13.5 35.6 12.4 28.5Z"/><path fill-rule="evenodd" d="M10.1 20.2C16.5 18.8 31.5 18.8 37.9 20.2V25.9C31.5 24.4 16.5 24.4 10.1 25.9ZM15 22.1Q18.4 21 21.4 23.2Q18 24.2 15 22.1ZM26.6 23.2Q29.6 21 33 22.1Q30 24.2 26.6 23.2Z"/><path d="M37.5 21.8C41.2 21 44.2 23.2 46.1 26.2M37.5 23.6C40.5 24.8 42.4 27.4 42.4 30.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="24" cy="35" rx="1.8" ry="1.35"/></g>`,
  },
  {
    id: "cacto",
    nome: "Cacto Cool",
    como: "loja",
    cor: "#047857",
    desenho: `<g fill="currentColor"><g opacity=".5"><path d="M16.5 29.2H12.8C11.2 29.2 10.5 28.5 10.5 27V21C10.5 19.5 11.6 18.8 12.8 18.8S15 19.5 15 21V24.8H16.5Z"/><path d="M31.5 24H35.2C36.8 24 37.5 23.2 37.5 21.8V15.8C37.5 14.2 36.4 13.5 35.2 13.5S33 14.2 33 15.8V19.5H31.5Z"/><rect x="15.8" y="11.2" width="16.5" height="27" rx="8.2"/></g><path d="M14.2 38.6H33.8L32.2 44.2C31.9 45.3 30.9 46 29.8 46H18.2C17.1 46 16.1 45.3 15.8 44.2Z"/><rect x="12.8" y="36.2" width="22.5" height="3.6" rx="1.4"/><path fill-rule="evenodd" d="M17.6 22.1a3 3 0 1 0 6 0a3 3 0 1 0-6 0ZM24.4 22.1a3 3 0 1 0 6 0a3 3 0 1 0-6 0ZM19.2 20.9l1.6-1.2.5.6-1.6 1.2ZM26 20.9l1.6-1.2.5.6-1.6 1.2Z"/><path d="M17.2 21.4H30.8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M20.6 27.4Q24 31.2 27.4 27.4Z"/><circle cx="24" cy="7.8" r="1.8"/><circle cx="26.2" cy="9.4" r="1.8"/><circle cx="25.4" cy="12" r="1.8"/><circle cx="22.6" cy="12" r="1.8"/><circle cx="21.8" cy="9.4" r="1.8"/><path d="M17.6 17.4l-1.8-.7M30.4 18.6l1.8-.7M17.6 33.4l-1.8.7M30.4 32.4l1.8.7" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></g>`,
  },
  {
    id: "panda",
    nome: "Panda Gamer",
    como: "loja",
    cor: "#6d28d9",
    desenho: `<g fill="currentColor"><g opacity=".5"><ellipse cx="24" cy="26.2" rx="14.2" ry="12.8"/><ellipse cx="24" cy="43.4" rx="15" ry="4.2"/></g><circle cx="13.9" cy="14.2" r="4.5"/><circle cx="34.1" cy="14.2" r="4.5"/><path d="M9 27C7.1 8.2 40.9 8.2 39 27" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><rect x="4.9" y="21.8" width="7.1" height="10.9" rx="3"/><rect x="36" y="21.8" width="7.1" height="10.9" rx="3"/><path fill-rule="evenodd" d="M14.2 25.5a3.8 4.9 0 1 0 7.6 0a3.8 4.9 0 1 0-7.6 0ZM16.7 25a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0Z"/><path fill-rule="evenodd" d="M26.2 25.5a3.8 4.9 0 1 0 7.6 0a3.8 4.9 0 1 0-7.6 0ZM27.7 25a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0Z"/><circle cx="19" cy="24.4" r=".7"/><circle cx="30" cy="24.4" r=".7"/><path d="M22.1 30H25.9C25.9 31.5 24.8 32.2 24 32.2S22.1 31.5 22.1 30Z"/><path d="M24 32.2V33.4M21.8 33.8Q22.9 34.9 24 33.4Q25.1 34.9 26.2 33.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.2 32.2C9 37.1 12.8 39 17.2 37.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="16.5" y="36" width="4.2" height="3.4" rx="1.7"/></g>`,
  },
  {
    id: "chama",
    nome: "Chama",
    como: "loja",
    cor: "#dc2626",
    desenho: `<g fill="currentColor"><path opacity=".5" d="M24 5.2C26.2 11.2 34.5 14.2 36 24C37.5 34.5 31.5 42.8 24 42.8S10.5 36.8 11.2 27C11.6 21 15 18 17.2 14.2C18 18.8 20.2 20.2 21.8 20.2C21 15 21.8 9.8 24 5.2Z"/><path fill-rule="evenodd" d="M24 16.5C26.2 21 31.5 23.2 31.5 30C31.5 36.8 27.8 39.8 24 39.8S16.5 36.8 16.5 30.8C16.5 27 18.8 24.8 20.2 22.5C21 25.5 22.5 26.2 23.2 26.2C22.9 22.5 23.2 19.5 24 16.5ZM21.2 29.6a1.4 1.9 0 1 0 0 3.8a1.4 1.9 0 1 0 0-3.8ZM26.8 29.6a1.4 1.9 0 1 0 0 3.8a1.4 1.9 0 1 0 0-3.8ZM21.8 34.8Q24 38.2 26.2 34.8Q24 36 21.8 34.8Z"/><path d="M9 11l.9 2.1 2.1.9-2.1.9L9 17l-.9-2.1L6 14l2.1-.9z"/><path d="M39.4 8.4l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z"/><circle cx="40" cy="30" r="1.1"/><circle cx="7.6" cy="32" r=".9"/></g>`,
  },
  {
    id: "rupi",
    nome: "Rupi",
    como: "loja",
    cor: "#7e22ce",
    desenho: `<g fill="currentColor"><path opacity=".5" d="M24 7.7 37.1 16.2V33.3L24 41.8 10.9 33.3V16.2Z"/><path fill-rule="evenodd" d="M24 15.4 31.2 20V29.5L24 34.1 16.8 29.5V20ZM21.4 21.9a1.3 1.7 0 1 0 0 3.4a1.3 1.7 0 1 0 0-3.4ZM26.6 21.9a1.3 1.7 0 1 0 0 3.4a1.3 1.7 0 1 0 0-3.4ZM21.8 27.2Q24 29.8 26.2 27.2Q24 28.4 21.8 27.2Z"/><path d="M24 7.7V15.4M37.1 16.2 31.2 20M37.1 33.3 31.2 29.5M24 41.8V34.1M10.9 33.3 16.8 29.5M10.9 16.2 16.8 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M39.6 5.2l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z"/><path d="M8 37.6l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z"/></g>`,
  },
  {
    id: "cogumelo",
    nome: "Cogumelo Neon",
    como: "loja",
    cor: "#a21caf",
    desenho: `<g fill="currentColor"><path opacity=".5" d="M6.8 26.2C6.8 15 15 8.2 24 8.2S41.2 15 41.2 26.2C41.2 28.5 39 29.2 36.8 28.5H11.2C9 29.2 6.8 28.5 6.8 26.2Z"/><circle cx="15" cy="18.8" r="2.4"/><circle cx="24" cy="13.5" r="2.6"/><circle cx="33" cy="19.5" r="2"/><circle cx="27.8" cy="23.6" r="1.35"/><circle cx="19.5" cy="24" r="1.2"/><path fill-rule="evenodd" d="M18 29.6H30L31.5 40.5C31.5 43.5 28.5 45 24 45S16.5 43.5 16.5 40.5ZM21 33.6a1.2 1.6 0 1 0 0 3.2a1.2 1.6 0 1 0 0-3.2ZM27 33.6a1.2 1.6 0 1 0 0 3.2a1.2 1.6 0 1 0 0-3.2ZM22.2 38.6Q24 40.8 25.8 38.6Q24 39.6 22.2 38.6Z"/><circle cx="41" cy="36" r="1"/><circle cx="6.6" cy="38" r=".9"/><circle cx="40" cy="8" r=".9"/></g>`,
  },
  {
    id: "gato-hacker",
    nome: "Gato Hacker",
    como: "loja",
    cor: "#1e293b",
    desenho: `<g fill="currentColor"><g opacity=".5"><path d="M11.2 20.2L12.8 6.8L21.8 15Z"/><path d="M36.8 20.2L35.2 6.8L26.2 15Z"/><path d="M9.8 27.8C9.8 18.8 16.5 13.5 24 13.5S38.2 18.8 38.2 27.8C38.2 36.8 32.2 42 24 42S9.8 36.8 9.8 27.8Z"/><ellipse cx="24" cy="43.2" rx="15.2" ry="4.4"/></g><path d="M13.8 16.2L14.5 10.6L18.6 14.3Z"/><path d="M34.2 16.2L33.5 10.6L29.4 14.3Z"/><path fill-rule="evenodd" d="M15 27a3.4 3 0 1 0 6.8 0a3.4 3 0 1 0-6.8 0ZM17.65 27a.75 2.3 0 1 0 1.5 0a.75 2.3 0 1 0-1.5 0Z"/><path fill-rule="evenodd" d="M26.2 27a3.4 3 0 1 0 6.8 0a3.4 3 0 1 0-6.8 0ZM28.85 27a.75 2.3 0 1 0 1.5 0a.75 2.3 0 1 0-1.5 0Z"/><path d="M22.5 31.9H25.5L24 33.6Z"/><path d="M15 33L8.2 32.2M15 34.9L9 36.4M33 33L39.8 32.2M33 34.9L39 36.4" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/><path d="M20.8 41.4l1.9 1.5-1.9 1.5M24.4 44.4h3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  },
  {
    id: "planeta",
    nome: "Planetinha",
    como: "loja",
    cor: "#1e40af",
    desenho: `<g fill="currentColor"><circle opacity=".5" cx="24" cy="24.8" r="12.8"/><path d="M43.65 22.1A20.25 5.25 -14 0 1 4.35 31.9M4.35 31.9A20.25 5.25 -14 0 1 10.08 26.41M36.01 19.94A20.25 5.25 -14 0 1 43.65 22.1" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="20.2" cy="22.4" rx="1.35" ry="1.7"/><ellipse cx="27.8" cy="22.4" rx="1.35" ry="1.7"/><path d="M22.1 26q1.9 1.7 3.8 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="40.2" cy="8.6" r="3"/><circle cx="8" cy="9.6" r="1"/><circle cx="43" cy="40" r=".9"/></g>`,
  },
  {
    id: "zul-astronauta",
    nome: "Zul Astronauta",
    como: "evento",
    cor: "#4f46e5",
    detalhe: "Dos eventos e de quem é pioneiro.",
    desenho: `<g fill="currentColor"><g opacity=".5"><ellipse cx="24" cy="42" rx="15.2" ry="5"/><path d="M15.4 33.2C14 28.6 13.9 22 16.5 17.8C19.1 13.7 23.4 12.2 27.3 12.9C30.6 13.6 32.2 16.4 32.2 19.9V28.6C32.2 31.8 29.6 34.4 26.4 34.4H18.4C17.1 34.4 16 34 15.4 33.2Z"/></g><circle cx="24" cy="21" r="15.4" fill="none" stroke="currentColor" stroke-width="2.8"/><path d="M30.2 17.8C33.3 16.1 36.6 18 36.2 21.7C36 23.9 34.6 25.5 32.8 26.5C33.2 24.8 32.8 23.4 31.6 23C30.8 22.8 30.1 22.1 29.9 21.3Z"/><path fill-rule="evenodd" d="M24.6 17.4a3.2 3.2 0 1 1 0 6.4a3.2 3.2 0 1 1 0-6.4ZM25.4 19.2a1.4 1.4 0 1 0 0 2.8a1.4 1.4 0 1 0 0-2.8Z"/><path d="M13.6 15.2A11.6 11.6 0 0 1 18.4 10.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="31.6" cy="41.4" r="2.2"/><rect x="13.2" y="39.8" width="5.6" height="3.2" rx="1.2"/><path d="M6 3.6l.9 2.1 2.1.9-2.1.9L6 9.6l-.9-2.1L3 6.6l2.1-.9z"/><path d="M42.4 30.4l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z"/></g>`,
  },
  {
    id: "pinguim",
    nome: "Pinguim de Gorro",
    como: "evento",
    cor: "#1d4ed8",
    detalhe: "Do evento de Natal.",
    desenho: `<g fill="currentColor"><g opacity=".5"><circle cx="24" cy="25.5" r="13.5"/><ellipse cx="24" cy="43.4" rx="13.2" ry="4"/></g><path fill-rule="evenodd" d="M24 22.5C21 18.8 14.2 19.5 14.2 25.9C14.2 32.2 18.8 37.1 24 37.1S33.8 32.2 33.8 25.9C33.8 19.5 27 18.8 24 22.5ZM20.2 24a1.9 1.9 0 1 0 0 3.8a1.9 1.9 0 1 0 0-3.8ZM27.8 24a1.9 1.9 0 1 0 0 3.8a1.9 1.9 0 1 0 0-3.8ZM21.8 29.2H26.2L24 32.2Z"/><path fill-rule="evenodd" d="M11.2 17.4C11.2 10.8 17.2 7.5 24 7.5S36.8 10.8 36.8 17.4ZM18 10h1.2v6.4H18ZM23.4 9.2h1.2v7.2h-1.2ZM28.8 10H30v6.4h-1.2Z"/><rect x="10.1" y="18" width="27.8" height="4.6" rx="2.3"/><circle cx="24" cy="5.2" r="2.8"/><path d="M11.2 37.1C16.5 40.9 31.5 40.9 36.8 37.1L37.5 40.9C31.5 44.6 16.5 44.6 10.5 40.9Z"/><path d="M30 40.5L33.4 45.2C33.9 46 33.3 47 32.4 47H29.6C28.9 47 28.4 46.4 28.4 45.7L27 41.2Z"/></g>`,
  },
];

/** Os ícones oficiais do app, recortados no formato do perfil (as mesmas imagens da tela "Ícone do app"). */
export const AVATARES_RAROS: AvatarRaro[] = [
  { id: "oficial-padrao", nome: "Padrão", imagem: "/icones-do-app/padrao.webp" },
  { id: "oficial-vampiro", nome: "Vampiro", imagem: "/icones-do-app/vampiro.webp" },
  { id: "oficial-biscoito", nome: "Biscoito", imagem: "/icones-do-app/biscoito.webp" },
  { id: "oficial-derretido", nome: "Derretido", imagem: "/icones-do-app/derretido.webp" },
  { id: "oficial-frankenstein", nome: "Frankenstein", imagem: "/icones-do-app/frankenstein.webp" },
  { id: "oficial-miami", nome: "Miami", imagem: "/icones-do-app/miami.webp" },
  { id: "oficial-natal", nome: "Natal", imagem: "/icones-do-app/natal.webp" },
  { id: "oficial-armadura", nome: "Armadura", imagem: "/icones-do-app/armadura.webp" },
  { id: "oficial-deserto", nome: "Deserto", imagem: "/icones-do-app/deserto.webp" },
];

/**
 * Os ícones de antes do redesenho. O banco já foi migrado, mas um perfil
 * guardado no aparelho (ou uma resposta antiga em cache) ainda pode trazer
 * um id velho: ele aparece como o desenho novo equivalente.
 */
const ANTIGOS: Record<string, string> = {
  orbit: "capivara", code: "cafe", rocket: "pato", shield: "bug", bot: "capivara", spark: "pato",
  crown: "capivara", ghost: "fantasma", comet: "planeta", pro: "zul-miami", developer: "gato-hacker",
  "early-tester": "zul-astronauta", "neon-cat": "gato-hacker", processor: "robo", crystal: "rupi",
  flame: "chama", arcade: "panda", zulcode: "oficial-padrao",
};

const POR_ID = new Map(AVATARES_DESENHADOS.map((a) => [a.id, a]));
const RAROS_POR_ID = new Map(AVATARES_RAROS.map((a) => [a.id, a]));

export type AvatarResolvido = { tipo: "desenho"; avatar: AvatarDesenhado } | { tipo: "raro"; avatar: AvatarRaro };

/** O que desenhar para um id (os antigos viram o equivalente; o desconhecido, o padrão). */
export function resolverAvatar(id?: string | null): AvatarResolvido {
  const atual = id ? ANTIGOS[id] ?? id : AVATAR_PADRAO;
  const raro = RAROS_POR_ID.get(atual);
  if (raro) return { tipo: "raro", avatar: raro };
  return { tipo: "desenho", avatar: POR_ID.get(atual) ?? POR_ID.get(AVATAR_PADRAO)! };
}

export function ehAvatarRaro(id?: string | null) {
  return resolverAvatar(id).tipo === "raro";
}

/** A cor do quadrado de um ícone fora do perfil (na loja, nas vitrines). O raro cobre o quadrado inteiro. */
export function corDoAvatar(id?: string | null) {
  const resolvido = resolverAvatar(id);
  return resolvido.tipo === "desenho" ? resolvido.avatar.cor : "#0f172a";
}

/**
 * A frase de cada ícone no editor do perfil. Os da loja usam a descrição do
 * catálogo quando ela chega (a equipe pode mudar pelo admin); esta é a de
 * reserva, e a única dos livres.
 */
export const DESCRICAO_DO_AVATAR: Record<string, string> = {
  capivara: "A mais tranquila do ZulCode, no ritmo lo-fi.",
  fantasma: "Um fantasminha camarada para estudar junto.",
  pato: "Explique o bug para ele e o bug some.",
  bug: "O único bug que dá vontade de manter.",
  cafe: "O combustível de quem programa.",
  "zul-miami": "O Zul de óculos escuros. Vem com o PRO.",
  robo: "Um robozinho de tela, sempre sorrindo.",
  dragao: "Chifrinhos, babado e um dentinho para fora.",
  slime: "Uma gosma muito feliz de te ver.",
  alien: "Três olhos para não perder nenhum bug.",
  onca: "A rainha da floresta, de olho em você.",
  preguica: "Pendurada no galho, sem pressa nenhuma.",
  sapo: "Olhão no alto e um sorriso de orelha a orelha.",
  polvo: "Oito braços para programar mais rápido.",
  raposa: "Máscara de ninja e a faixa ao vento.",
  cacto: "Óculos escuros e uma flor no topo.",
  panda: "Fone, microfone e muita concentração.",
  chama: "A chama da ofensiva em pessoa.",
  rupi: "A moeda do ZulCode, com cara de feliz.",
  cogumelo: "Um cogumelo que brilha no escuro.",
  "gato-hacker": "Olhos de terminal e um prompt no peito.",
  planeta: "Um planetinha sorridente, com anel e lua.",
  "zul-astronauta": "O Zul no capacete, dos eventos e dos pioneiros.",
  pinguim: "Gorro e cachecol, do evento de Natal.",
};
