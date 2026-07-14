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

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[\s._-]+/g, "");
}

interface LanguageIconProps {
  id: string;
  name?: string;
  className?: string;
}

export function LanguageIcon({ id, name, className }: LanguageIconProps) {
  const Icon =
    ICONS[normalize(id)] ?? (name ? ICONS[normalize(name)] : undefined) ?? Code2;
  return <Icon className={className} />;
}
