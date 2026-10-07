// Inserções por posição preservam strings, comentários e as linhas originais.
export function instrumentLoops(source, parse, guardName) {
  const tree = parse(source, { ecmaVersion: "latest", sourceType: "script", locations: true });
  const edits = [];
  const identifiers = new Set();
  const nodes = [tree];
  const loops = new Set(["WhileStatement", "DoWhileStatement", "ForStatement", "ForInStatement", "ForOfStatement"]);
  while (nodes.length) {
    const node = nodes.pop();
    if (node.type === "Identifier") identifiers.add(node.name);
    if (node.type === "WithStatement") {
      throw new SyntaxError("with não é suportado pelo playground com proteção de loops.");
    }
    if (loops.has(node.type)) {
      const check = guardName + "(" + node.loc.start.line + ");";
      if (node.body.type === "BlockStatement") {
        edits.push({ at: node.body.start + 1, text: check });
      } else {
        edits.push({ at: node.body.start, text: "{" + check });
        edits.push({ at: node.body.end, text: "}" });
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child.type === "string") nodes.push(child);
      } else if (value && typeof value === "object" && typeof value.type === "string") {
        nodes.push(value);
      }
    }
  }
  if (identifiers.has(guardName)) throw new Error("Identificador reservado de execução.");
  // Aplicar da direita para a esquerda evita invalidar offsets posteriores.
  edits.sort((a, b) => b.at - a.at);
  let code = source;
  for (const edit of edits) code = code.slice(0, edit.at) + edit.text + code.slice(edit.at);
  return code;
}
