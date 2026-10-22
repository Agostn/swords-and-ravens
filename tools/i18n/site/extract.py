#!/usr/bin/env python3
"""Lista textos em inglês das páginas do site (.NET) para tradução.

Uso: python3 extract.py ARQUIVO...  (caminhos .cshtml / .cs / .js)
Mostra, por arquivo, cada texto encontrado com o número da linha. O texto sai
exatamente como está no arquivo (em JSON), pronto para usar no apply.py.

Também serve de checagem: rodar nos arquivos já traduzidos mostra o que sobrou
em inglês (palavras comuns em inglês são marcadas com "EN?").
"""
import json, re, sys

EN_WORDS = re.compile(
    r"\b(the|you|your|and|with|this|that|for|not|are|has|have|will|can|please|"
    r"account|password|email|game|games|login|log in|sign|user|click|here|"
    r"enter|confirm|code|delete|change|new|save|back|send|settings|profile)\b",
    re.I,
)

def is_texty(s):
    t = s.strip()
    if not t or not re.search(r"[A-Za-z]{2,}", t):
        return False
    if t.startswith("@") and " " not in t:
        return False
    return True

def strip_comments(text):
    # troca comentários Razor/HTML/C# por espaços (mantém posições)
    def blank(m):
        return re.sub(r"[^\n]", " ", m.group(0))
    text = re.sub(r"@\*.*?\*@", blank, text, flags=re.S)
    text = re.sub(r"<!--.*?-->", blank, text, flags=re.S)
    text = re.sub(r"^\s*///?.*$", blank, text, flags=re.M)
    text = re.sub(r"/\*.*?\*/", blank, text, flags=re.S)
    return text

SKIP_LINE = re.compile(
    r"Log(Information|Warning|Error|Debug|Critical|Trace)|nameof\(|\[(Http|Route)|"
    r"asp-|RedirectToPage\(|LocalRedirect|GetSection\(|Configuration\[|"
    r"ThrowIf|throw new|Environment\.|ContentType|MediaTypeNames"
)

def extract(path):
    raw = open(path, encoding="utf-8-sig").read()
    text = strip_comments(raw)
    out = []
    lineof = lambda pos: raw.count("\n", 0, pos) + 1
    if path.endswith(".cshtml"):
        for m in re.finditer(r">([^<>]+)<", text):
            seg = m.group(1)
            if is_texty(seg) and not re.match(r"^\s*[@{}();]", seg.strip()[:1] or " ") :
                s = raw[m.start(1):m.end(1)]
                if "=>" in s or ";" in s.strip()[-1:]:
                    continue
                out.append((lineof(m.start(1)), "texto", s))
        for m in re.finditer(r'\b(title|placeholder|aria-label|alt|content|value|data-confirm)="([^"@][^"]*)"', text):
            if is_texty(m.group(2)) and " " in m.group(2).strip() or (m.group(1) in ("title", "placeholder", "aria-label") and is_texty(m.group(2))):
                out.append((lineof(m.start(2)), m.group(1), raw[m.start(0):m.end(0)]))
    for m in re.finditer(r'(\$?)"((?:[^"\\\n]|\\.)*)"', text):
        lit = m.group(2)
        line_start = text.rfind("\n", 0, m.start()) + 1
        line_end = text.find("\n", m.end())
        line = text[line_start:line_end]
        if SKIP_LINE.search(line):
            continue
        if not re.search(r"[A-Za-z]{2,}", lit):
            continue
        if path.endswith(".cshtml") and re.search(r'\b(class|href|src|id|name|type|asp-[\w-]+|rel|target|method|role|for|style)="$', text[max(0,m.start()-30):m.start()+1]):
            continue
        # texto de verdade: tem espaço entre palavras ou começa com maiúscula seguida de minúsculas
        if not (re.search(r"[A-Za-z]+ [A-Za-z]+", lit) or re.match(r"^[A-Z][a-z]+[.!?:]?$", lit)):
            continue
        if re.match(r"^[\w./:-]+$", lit) and " " not in lit and not re.match(r"^[A-Z][a-z]+$", lit):
            continue
        # classes CSS (tudo minúsculo com hífens/dois-pontos)
        if all(re.match(r"^!?[a-z0-9:/\[\]().%#_-]+$", w) for w in lit.split()) and re.search(r"[-:]", lit):
            continue
        out.append((lineof(m.start()), "string", raw[m.start():m.end()]))
    seen = set()
    for line, kind, s in sorted(out):
        key = (line, s)
        if key in seen:
            continue
        seen.add(key)
        flag = "EN?" if EN_WORDS.search(s) else "   "
        print(f"{line:4} {flag} {kind:8} {json.dumps(s, ensure_ascii=False)}")

for p in sys.argv[1:]:
    print(f"=== {p}")
    extract(p)
