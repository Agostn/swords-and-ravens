/*
 * Segunda passada: textos entre aspas usados na tela (dentro de {expressões}
 * JSX, atributos como title/placeholder, confirm()/alert(), parâmetros de tr()).
 * Troca "texto" por t("auto2.Arquivo.N"). Uso: node codemod-strings.js [--dry] arquivos...
 */
const ts = require("/home/claude/swords-and-ravens/agot-bg-game-server/node_modules/typescript");
const fs = require("fs");
const path = require("path");
const CLIENT = "/home/claude/swords-and-ravens/agot-bg-game-server/src/client";
const KEYS_FILE = path.join(__dirname, "auto-keys.json");
const dry = process.argv.includes("--dry");
const files = process.argv.slice(2).filter((a) => a != "--dry");
const allKeys = JSON.parse(fs.readFileSync(KEYS_FILE, "utf8"));

const TEXT_ATTRS = new Set(["title", "placeholder", "placeHolder", "label", "tooltip", "name", "text", "alt", "header", "description", "aria-label", "buttonText", "confirmText"]);
const SKIP_PROPS = new Set(["className", "key", "id", "style", "variant", "placement", "type", "trigger", "size", "src", "href", "target", "rel", "color", "backgroundColor", "fontFamily", "fontWeight", "textAlign", "display", "position", "toastId", "theme", "icon", "border", "cursor"]);
const SKIP_CALLS = new Set(["t", "tr", "require", "classNames", "getElementById", "querySelector", "querySelectorAll", "getItem", "setItem", "removeItem", "getWithExpiry", "setWithExpiry", "log", "warn", "error", "debug", "info", "addEventListener", "removeEventListener", "get", "has", "tryGet", "includes", "startsWith", "endsWith", "indexOf", "split", "replace", "match", "test", "send", "Error", "playSound", "find", "filter"]);
const FRAGMENT_WORDS = new Set(["a", "an", "no", "all", "to", "from", "and", "or", "of", "in", "the", "with", "for", "on", "at", "by", "is", "are", "was", "were", "be", "not", "yes", "deputy", "play", "joined", "above", "below", "results", "unknown", "special", "upgrading", "recruiting", "increase", "decrease", "forced", "force", "did", "could", "would", "will"]);

function looksLikeText(s) {
  if (!/[A-Za-z]{2,}/.test(s) && !FRAGMENT_WORDS.has(s.trim().toLowerCase())) return false;
  if (/^(#|\.|\/|https?:|data:|url\()/.test(s.trim())) return false;
  if (/^[\w$]+\.(png|jpe?g|svg|mp3|ogg|webp)$/i.test(s)) return false;
  const trimmed = s.trim();
  if (!trimmed) return false;
  if (/\s/.test(trimmed)) return !/^[\w-]+( [\w-]+)*$/.test(trimmed) || /[A-Z]/.test(trimmed) || trimmed.split(" ").some((w) => FRAGMENT_WORDS.has(w.toLowerCase())) || trimmed.split(" ").length >= 3;
  if (FRAGMENT_WORDS.has(trimmed.toLowerCase())) return true;
  if (/^[A-Z][a-z]+(['’][a-z]+)?[.!?:]?$/.test(trimmed)) return true; // Palavra com maiúscula: "Unknown", "Live"
  if (/^[A-Z]{3,}$/.test(trimmed)) return false; // siglas tipo "PBEM"
  return false;
}

function calleeName(call) {
  const e = call.expression;
  if (ts.isIdentifier(e)) return e.text;
  if (ts.isPropertyAccessExpression(e)) return e.name.text;
  return "";
}

function classify(node) {
  // Devolve true se o literal deve ser traduzido.
  let insideJsx = false, insideTrParams = false, confirmArg = false;
  let p = node.parent, child = node;
  while (p) {
    if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p)) return false;
    if (ts.isCaseClause(p) && p.expression == child) return false;
    if (ts.isElementAccessExpression(p) && p.argumentExpression == child) return false;
    if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.InKeyword, ts.SyntaxKind.InstanceOfKeyword].includes(p.operatorToken.kind)) return false;
    if (ts.isPropertyAssignment(p) && p.initializer == child) {
      const name = p.name.getText().replace(/["']/g, "");
      if (SKIP_PROPS.has(name)) return false;
    }
    if (ts.isPropertyAssignment(p) && p.name == child) return false;
    if (ts.isJsxAttribute(p)) {
      const name = p.name.getText();
      if (TEXT_ATTRS.has(name)) insideJsx = true;
      else if (!(p.initializer && ts.isJsxExpression(p.initializer))) return false;
      else if (SKIP_PROPS.has(name) || ["value", "onClick", "onChange", "as", "role", "animation", "mode", "inputMode", "autoComplete", "keyPrefix", "scrollViewClassName", "fill", "stroke", "d", "transform", "viewBox", "width", "height"].includes(name)) return false;
    }
    if (ts.isCallExpression(p)) {
      const n = calleeName(p);
      if (n == "tr" && child != p.arguments[0]) insideTrParams = true;
      else if (SKIP_CALLS.has(n)) return false;
      if (["confirm", "alert", "prompt", "toast"].includes(n)) confirmArg = true;
    }
    if (ts.isJsxExpression(p)) insideJsx = true;
    if (ts.isFunctionLike(p) && !ts.isArrowFunction(p)) break;
    child = p;
    p = p.parent;
  }
  return insideJsx || insideTrParams || confirmArg;
}

function processFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const src = ts.createSourceFile(file, text, 99, true, file.endsWith("x") ? 4 : 3);
  const base = path.relative(CLIENT, file).replace(/\.tsx?$/, "").replace(/[\\/]/g, ".");
  let counter = 0;
  const edits = [], keys = {};
  (function visit(n) {
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && !ts.isJsxAttribute(n.parent) || (ts.isStringLiteral(n) && ts.isJsxAttribute(n.parent))) {
      if (looksLikeText(n.text) && classify(n)) {
        const key = `auto2.${base}.${counter++}`;
        keys[key] = n.text;
        const call = `t("${key}")`;
        edits.push([n.getStart(), n.getEnd(), ts.isJsxAttribute(n.parent) ? `{${call}}` : call]);
      }
    }
    ts.forEachChild(n, visit);
  })(src);
  if (!edits.length) return { n: 0, keys };
  edits.sort((a, b) => b[0] - a[0]);
  let out = text;
  for (const [a, b, r] of edits) out = out.slice(0, a) + r + out.slice(b);
  let rel = path.relative(path.dirname(file), CLIENT + "/i18n/i18n");
  if (!rel.startsWith(".")) rel = "./" + rel;
  const m = out.match(/import \{([^}]*)\} from "([./]+(?:i18n\/)?i18n)";/);
  if (m) {
    const names = new Set(m[1].split(",").map((s) => s.trim()).filter(Boolean));
    names.add("t");
    out = out.replace(m[0], `import { ${[...names].sort().join(", ")} } from "${m[2]}";`);
  } else {
    const lines = out.split("\n");
    let last = -1;
    lines.forEach((l, i) => { if (l.startsWith("import ") || l.startsWith("} from ")) last = i; });
    while (last >= 0 && !lines[last].trimEnd().endsWith(";")) last++;
    lines.splice(last + 1, 0, `import { t } from "${rel}";`);
    out = lines.join("\n");
  }
  if (!dry) fs.writeFileSync(file, out);
  Object.assign(allKeys, keys);
  return { n: edits.length, keys };
}

let total = 0;
for (const f of files) {
  const r = processFile(path.resolve(f));
  total += r.n;
  if (r.n) {
    console.log(`${path.relative(CLIENT, f)}: ${r.n}`);
    if (dry) for (const [k, v] of Object.entries(r.keys)) console.log(`   ${k} = ${JSON.stringify(v)}`);
  }
}
if (!dry) fs.writeFileSync(KEYS_FILE, JSON.stringify(allKeys, null, 1));
console.log("total", total);
