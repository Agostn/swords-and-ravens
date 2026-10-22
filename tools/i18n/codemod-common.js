// Troca rótulos comuns (Confirm, Reset...) e "Waiting for X..." em todos os .tsx do cliente.
const ts = require("/home/claude/swords-and-ravens/agot-bg-game-server/node_modules/typescript");
const fs = require("fs");
const path = require("path");
const ROOT = "/home/claude/swords-and-ravens/agot-bg-game-server/src/client";
const LABELS = { Confirm: "common.confirm", Reset: "common.reset", Submit: "common.submit", Ready: "common.ready", Unready: "common.unready" };

function walk(d, a = []) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { if (f != "i18n") walk(p, a); }
    else if (/\.tsx$/.test(f)) a.push(p);
  }
  return a;
}

function relImport(file) {
  let rel = path.relative(path.dirname(file), ROOT + "/i18n/i18n");
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel;
}

function ensureImport(text, file) {
  const m = text.match(/import \{([^}]*)\} from "([./]+(?:i18n\/)?i18n)";/);
  if (m) {
    const names = new Set(m[1].split(",").map((s) => s.trim()).filter(Boolean));
    names.add("t");
    return text.replace(m[0], `import { ${[...names].sort().join(", ")} } from "${m[2]}";`);
  }
  const lines = text.split("\n");
  let last = -1;
  lines.forEach((l, i) => { if (l.startsWith("import ") || l.startsWith("} from ")) last = i; });
  while (last >= 0 && !lines[last].trimEnd().endsWith(";")) last++;
  lines.splice(last + 1, 0, `import { t } from "${relImport(file)}";`);
  return lines.join("\n");
}

let total = 0;
for (const file of walk(ROOT)) {
  let text = fs.readFileSync(file, "utf8");
  const src = ts.createSourceFile(file, text, 99, true, 4);
  const edits = [];
  (function visit(n) {
    if (ts.isJsxText(n)) {
      const s = n.text.trim();
      const siblings = n.parent.children ? n.parent.children.filter((x) => !(ts.isJsxText(x) && !x.text.trim())) : [];
      if (LABELS[s] && siblings.length == 1) {
        const start = n.getStart() + n.getText().indexOf(s);
        edits.push([start, start + s.length, `{t("${LABELS[s]}")}`]);
      }
    }
    ts.forEachChild(n, visit);
  })(src);
  edits.sort((a, b) => b[0] - a[0]);
  for (const [a, b, r] of edits) text = text.slice(0, a) + r + text.slice(b);
  // "Waiting for {expr}..." numa linha só (com ou sem espaço antes das reticências)
  let waits = 0;
  text = text.replace(/Waiting for \{((?:[^{}]|\{[^{}]*\})+)\}\s?\.\.\./g, (m, expr) => { waits++; return `{t("common.waitingFor", { who: ${expr} })}`; });
  text = text.replace(/Waiting for \{((?:[^{}]|\{[^{}]*\})+)\}(?=\s*<\/)/g, (m, expr) => { waits++; return `{t("common.waitingFor", { who: ${expr} })}`; });
  if (edits.length || waits) {
    text = ensureImport(text, file);
    fs.writeFileSync(file, text);
    total += edits.length + waits;
    console.log(`${path.relative(ROOT, file)}: ${edits.length} rótulos, ${waits} "Waiting for"`);
  }
}
console.log("total", total);
