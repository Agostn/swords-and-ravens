// Lista os textos em inglês de um arquivo .tsx/.ts (linha: texto).
// Uso: node strings.js arquivo...
const ts = require("/home/claude/swords-and-ravens/agot-bg-game-server/node_modules/typescript");
const fs = require("fs");
const SKIP_ATTRS = new Set(["className", "id", "key", "variant", "type", "placement", "size", "src", "href", "target", "rel", "htmlFor", "name", "animation", "trigger", "icon", "role", "as", "value", "style", "scrollViewClassName", "mode", "aria-hidden", "inputMode", "autoComplete"]);
for (const file of process.argv.slice(2)) {
  const text = fs.readFileSync(file, "utf8");
  const src = ts.createSourceFile(file, text, 99, true, file.endsWith("x") ? 4 : 3);
  const items = [];
  const line = (n) => src.getLineAndCharacterOfPosition(n.getStart()).line + 1;
  (function visit(node) {
    if (ts.isImportDeclaration(node)) return;
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["t", "tr", "require"].includes(node.expression.text)) return;
    if (ts.isJsxAttribute(node) && SKIP_ATTRS.has(node.name.getText())) return;
    if (ts.isJsxText(node)) {
      const s = node.text.replace(/\s+/g, " ").trim();
      if (/[A-Za-z]{2,}/.test(s)) items.push([line(node), "JSX", s]);
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) {
      const s = ts.isTemplateExpression(node) ? node.getText() : node.text;
      const p = node.parent;
      const isCase = ts.isCaseClause(p);
      const isCompare = ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(p.operatorToken.kind);
      const isIndex = ts.isElementAccessExpression(p);
      if (!isCase && !isCompare && !isIndex && /[A-Za-z]{2,}[^/]*\s+[A-Za-z]{2,}|^[A-Z][a-z]{2,}/.test(s) && !/^[a-z-]+$/.test(s) && !/^(#|\.|\/|https?:)/.test(s))
        items.push([line(node), "STR", s.replace(/\s+/g, " ").slice(0, 160)]);
      if (ts.isTemplateExpression(node)) return;
    }
    ts.forEachChild(node, visit);
  })(src);
  console.log(`=== ${file} (${items.length})`);
  for (const [l, k, s] of items) console.log(`${l}\t${k}\t${s}`);
}
