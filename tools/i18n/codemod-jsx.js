/*
 * Converte textos em JSX para chamadas t()/tr().
 *
 * Para cada sequência de filhos de um elemento JSX formada por texto,
 * {expressões}, <b>/<i>/<small>/<br/> simples e elementos sem texto próprio,
 * gera um modelo em inglês, ex.:
 *     House <b>{house.name}</b> chose {region}.
 * vira
 *     {tr("auto.Arquivo.3", { p0: house.name, p1: region })}
 * com o modelo "House <b>{p0}</b> chose {p1}." guardado em auto-keys.json.
 *
 * Uso: node codemod-jsx.js [--dry] arquivo.tsx...
 */
const ts = require("/home/claude/swords-and-ravens/agot-bg-game-server/node_modules/typescript");
const fs = require("fs");
const path = require("path");
const CLIENT = "/home/claude/swords-and-ravens/agot-bg-game-server/src/client";
const KEYS_FILE = path.join(__dirname, "auto-keys.json");
const FORMAT_TAGS = new Set(["b", "i", "small"]);
const dry = process.argv.includes("--dry");
const files = process.argv.slice(2).filter((a) => a != "--dry");

const allKeys = fs.existsSync(KEYS_FILE) ? JSON.parse(fs.readFileSync(KEYS_FILE, "utf8")) : {};

function decodeEntities(s) {
  return s
    .replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ")
    .replace(/&times;/g, "×").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&rarr;/g, "→").replace(/&larr;/g, "←").replace(/&hellip;/g, "…").replace(/&mdash;/g, "—").replace(/&ndash;/g, "–");
}

// Regras de espaço em branco do JSX (igual ao Babel).
function cleanJsxText(raw) {
  const lines = raw.split(/\r\n|\n|\r/);
  let lastNonEmpty = 0;
  lines.forEach((l, i) => { if (/[^ \t]/.test(l)) lastNonEmpty = i; });
  let str = "";
  lines.forEach((line, i) => {
    const isFirst = i == 0, isLast = i == lines.length - 1, isLastNonEmpty = i == lastNonEmpty;
    let trimmed = line.replace(/\t/g, " ");
    if (!isFirst) trimmed = trimmed.replace(/^[ ]+/, "");
    if (!isLast) trimmed = trimmed.replace(/[ ]+$/, "");
    if (trimmed) {
      if (!isLastNonEmpty) trimmed += " ";
      str += trimmed;
    }
  });
  return decodeEntities(str);
}

function hasLetters(s) { return /[A-Za-z]{2,}/.test(s); }

// O nó contém algum texto JSX com letras (em qualquer profundidade)?
function containsText(node) {
  let found = false;
  (function v(n) {
    if (found) return;
    if (ts.isJsxText(n) && hasLetters(cleanJsxText(n.text))) { found = true; return; }
    if (ts.isStringLiteral(n) && ts.isJsxExpression(n.parent) && hasLetters(n.text)) { found = true; return; }
    ts.forEachChild(n, v);
  })(node);
  return found;
}

function tagName(el) {
  const opening = ts.isJsxElement(el) ? el.openingElement : el;
  return opening.tagName.getText();
}
function hasAttributes(el) {
  const opening = ts.isJsxElement(el) ? el.openingElement : el;
  return opening.attributes.properties.length > 0;
}

function processFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const src = ts.createSourceFile(file, text, 99, true, 4);
  const base = path.relative(CLIENT, file).replace(/\.tsx$/, "").replace(/[\\/]/g, ".");
  // continua a numeração das chaves já existentes deste arquivo
  let counter = 0;
  for (const k of Object.keys(allKeys)) {
    const m = k.match(/^auto\.(.+)\.(\d+)$/);
    if (m && m[1] == base) counter = Math.max(counter, Number(m[2]) + 1);
  }
  const edits = [];
  const fileKeys = {};

  // Converte um item (filho) para pedaço de modelo; devolve null se não dá.
  function itemToTemplate(child, params) {
    if (ts.isJsxText(child)) return { tpl: cleanJsxText(child.text) };
    if (ts.isJsxExpression(child)) {
      if (!child.expression) return { tpl: "" }; // comentário {/* */}
      const e = child.expression;
      if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return { tpl: e.text };
      if (containsText(e)) return null;
      const name = `p${params.length}`;
      params.push([name, e.getText()]);
      return { tpl: `{${name}}` };
    }
    if (ts.isJsxSelfClosingElement(child)) {
      if (tagName(child) == "br" && !hasAttributes(child)) return { tpl: "<br/>" };
      if (containsText(child)) return null;
      const name = `p${params.length}`;
      params.push([name, child.getText()]);
      return { tpl: `{${name}}` };
    }
    if (ts.isJsxElement(child) || ts.isJsxFragment(child)) {
      if (!containsText(child)) {
        const name = `p${params.length}`;
        params.push([name, child.getText()]);
        return { tpl: `{${name}}` };
      }
      if (ts.isJsxElement(child) && FORMAT_TAGS.has(tagName(child)) && !hasAttributes(child)) {
        let inner = "";
        for (const c of child.children) {
          const r = itemToTemplate(c, params);
          if (r == null) return null;
          inner += r.tpl;
        }
        const tag = tagName(child);
        return { tpl: `<${tag}>${inner}</${tag}>` };
      }
      return null;
    }
    return null;
  }

  function convertRun(run) {
    const params = [];
    let tpl = "";
    for (const c of run) {
      const r = itemToTemplate(c, params);
      if (r == null) throw new Error("bug: item não convertível numa sequência");
      tpl += r.tpl;
    }
    const trimmed = tpl.replace(/^[  ]+|[  ]+$/g, "");
    if (!hasLetters(trimmed.replace(/\{p\d+\}/g, "").replace(/<[^>]+>/g, ""))) return false;
    // Mantém espaços nas pontas fora da tradução, como texto JSX.
    const lead = tpl.length - tpl.replace(/^[  ]+/, "").length;
    const trail = tpl.length - tpl.replace(/[  ]+$/, "").length;
    const key = `auto.${base}.${counter++}`;
    fileKeys[key] = trimmed;
    const usesTags = /<(b|i|small|br\/)>/.test(trimmed) || /<\/(b|i|small)>/.test(trimmed);
    let call;
    if (params.length == 0 && !usesTags) call = `t("${key}")`;
    else if (params.length == 0) call = `tr("${key}")`;
    else call = `tr("${key}", { ${params.map(([n, e]) => `${n}: (${e})`).join(", ")} })`;
    let replacement = `{${call}}`;
    if (lead) replacement = `{" "}` + replacement;
    if (trail) replacement = replacement + `{" "}`;
    const start = run[0].getStart();
    const end = run[run.length - 1].getEnd();
    edits.push([start, end, replacement, params.length > 0 || usesTags ? "tr" : "t"]);
    return true;
  }

  function convertible(child) {
    if (ts.isJsxText(child)) return true;
    const params = [];
    return itemToTemplate(child, params) != null;
  }

  function visit(node) {
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      const children = node.children;
      let run = [];
      const flush = () => {
        // remove texto só de espaço/quebra nas pontas
        while (run.length && ts.isJsxText(run[0]) && cleanJsxText(run[0].text) == "") run.shift();
        while (run.length && ts.isJsxText(run[run.length - 1]) && cleanJsxText(run[run.length - 1].text) == "") run.pop();
        if (run.length) convertRun(run);
        run = [];
      };
      for (const c of children) {
        if (convertible(c)) run.push(c);
        else { flush(); visit(c); }
      }
      flush();
      // atributos do elemento (ex.: label={<>texto</>}) também podem ter JSX
      if (ts.isJsxElement(node)) ts.forEachChild(node.openingElement, visit);
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(src);

  if (!edits.length) return { n: 0 };
  edits.sort((a, b) => b[0] - a[0]);
  let out = text;
  const needed = new Set();
  for (const [a, b, r, fn] of edits) { out = out.slice(0, a) + r + out.slice(b); needed.add(fn); }
  // import
  let rel = path.relative(path.dirname(file), CLIENT + "/i18n/i18n");
  if (!rel.startsWith(".")) rel = "./" + rel;
  const m = out.match(/import \{([^}]*)\} from "([./]+(?:i18n\/)?i18n)";/);
  if (m) {
    const names = new Set(m[1].split(",").map((s) => s.trim()).filter(Boolean));
    needed.forEach((n) => names.add(n));
    out = out.replace(m[0], `import { ${[...names].sort().join(", ")} } from "${m[2]}";`);
  } else {
    const lines = out.split("\n");
    let last = -1;
    lines.forEach((l, i) => { if (l.startsWith("import ") || l.startsWith("} from ")) last = i; });
    while (last >= 0 && !lines[last].trimEnd().endsWith(";")) last++;
    lines.splice(last + 1, 0, `import { ${[...needed].sort().join(", ")} } from "${rel}";`);
    out = lines.join("\n");
  }
  if (!dry) fs.writeFileSync(file, out);
  Object.assign(allKeys, fileKeys);
  return { n: edits.length, keys: fileKeys };
}

let total = 0;
for (const f of files) {
  const r = processFile(path.resolve(f));
  total += r.n;
  if (r.n) console.log(`${path.relative(CLIENT, f)}: ${r.n}`);
  if (dry && r.keys) for (const [k, v] of Object.entries(r.keys)) console.log(`   ${k} = ${v}`);
}
if (!dry) fs.writeFileSync(KEYS_FILE, JSON.stringify(allKeys, null, 1));
console.log("total", total);
