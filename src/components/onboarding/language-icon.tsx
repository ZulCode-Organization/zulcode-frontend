import type { IconType } from "react-icons";
import {
  SiAngular,
  SiC,
  SiCplusplus,
  SiCss,
  SiDart,
  SiDjango,
  SiElixir,
  SiFlutter,
  SiGo,
  SiHaskell,
  SiHtml5,
  SiJavascript,
  SiKotlin,
  SiLua,
  SiMariadb,
  SiMysql,
  SiNodedotjs,
  SiOpenjdk,
  SiPerl,
  SiPhp,
  SiPostgresql,
  SiPython,
  SiR,
  SiReact,
  SiRuby,
  SiRust,
  SiScala,
  SiSharp,
  SiSqlite,
  SiSwift,
  SiTypescript,
  SiVuedotjs,
} from "react-icons/si";
import { Code2 } from "lucide-react";

const ICONS: Record<string, IconType> = {
  python: SiPython,
  javascript: SiJavascript,
  js: SiJavascript,
  typescript: SiTypescript,
  ts: SiTypescript,
  java: SiOpenjdk,
  csharp: SiSharp,
  "c#": SiSharp,
  cplusplus: SiCplusplus,
  "c++": SiCplusplus,
  cpp: SiCplusplus,
  c: SiC,
  php: SiPhp,
  ruby: SiRuby,
  rust: SiRust,
  go: SiGo,
  golang: SiGo,
  swift: SiSwift,
  kotlin: SiKotlin,
  html: SiHtml5,
  html5: SiHtml5,
  css: SiCss,
  css3: SiCss,
  dart: SiDart,
  r: SiR,
  mysql: SiMysql,
  postgresql: SiPostgresql,
  postgres: SiPostgresql,
  mariadb: SiMariadb,
  sqlite: SiSqlite,
  lua: SiLua,
  scala: SiScala,
  haskell: SiHaskell,
  elixir: SiElixir,
  perl: SiPerl,
  flutter: SiFlutter,
  react: SiReact,
  node: SiNodedotjs,
  nodejs: SiNodedotjs,
  django: SiDjango,
  angular: SiAngular,
  vue: SiVuedotjs,
};

// Cor de marca de cada linguagem/tecnologia — pra não ficar tudo na mesma
// cor neutra do container (herdada de text-foreground).
const COLORS: Record<string, string> = {
  python: "#3776AB",
  javascript: "#F7DF1E",
  js: "#F7DF1E",
  typescript: "#3178C6",
  ts: "#3178C6",
  java: "#F89820",
  csharp: "#239120",
  "c#": "#239120",
  cplusplus: "#00599C",
  "c++": "#00599C",
  cpp: "#00599C",
  c: "#A8B9CC",
  php: "#777BB4",
  ruby: "#CC342D",
  rust: "#CE422B",
  go: "#00ADD8",
  golang: "#00ADD8",
  swift: "#FA7343",
  kotlin: "#7F52FF",
  html: "#E34F26",
  html5: "#E34F26",
  css: "#1572B6",
  css3: "#1572B6",
  dart: "#0175C2",
  r: "#276DC3",
  mysql: "#4479A1",
  postgresql: "#336791",
  postgres: "#336791",
  mariadb: "#003545",
  sqlite: "#003B57",
  lua: "#2C2D72",
  scala: "#DC322F",
  haskell: "#5D4F85",
  elixir: "#4B275F",
  perl: "#39457E",
  flutter: "#02569B",
  react: "#61DAFB",
  node: "#339933",
  nodejs: "#339933",
  django: "#092E20",
  angular: "#DD0031",
  vue: "#4FC08D",
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[\s._-]+/g, "");
}

interface LanguageIconProps {
  id: string;
  name?: string;
  className?: string;
}

export function LanguageIcon({ id, name, className }: LanguageIconProps) {
  const key = ICONS[normalize(id)] ? normalize(id) : name ? normalize(name) : normalize(id);
  const Icon = ICONS[key] ?? Code2;
  const color = COLORS[key];
  return <Icon className={className} style={color ? { color } : undefined} />;
}
