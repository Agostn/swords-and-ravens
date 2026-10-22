#!/usr/bin/env python3
"""Liga as imagens em PT-BR nos arquivos client/*Images.ts (rodar de novo depois de gerar cartas novas).
Para cada import de public/images/X que tenha public/images/pt-BR/X, cria um import X_ptBR e
embrulha o export default com localizeImages(). Idempotente."""
import os, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../agot-bg-game-server")
FILES = ["houseCardImages.ts", "westerosCardImages.ts", "wildlingCardImages.ts", "loanCardImages.ts", "objectiveCardImages.ts"]
for f in FILES:
    p = os.path.join(ROOT, "src/client", f)
    src = open(p).read()
    start = src.find("// --- imagens em PT-BR (gerado por tools/cards/wire.py) ---")
    if start != -1:
        old_name = re.search(r'export default (\w+)Localized;', src[start:]).group(1)
        src = src[:start].rstrip() + f"\n\nexport default {old_name};\n"
    pairs = []
    for var, path in re.findall(r'import\s+(\w+)\s+from\s+"\.\./\.\./public/images/([^"]+)"', src):
        if os.path.exists(os.path.join(ROOT, "public/images/pt-BR", path)):
            pairs.append((var, path))
    m = re.search(r'export default (\w+);', src)
    name = m.group(1)
    fn = "localizeNestedImages" if f == "westerosCardImages.ts" else "localizeImages"
    imports = "\n".join(f'import {v}_ptBR from "../../public/images/pt-BR/{pth}";' for v, pth in pairs)
    entries = ",\n".join(f"  [{v}, {v}_ptBR]" for v, _ in pairs)
    block = (f"// --- imagens em PT-BR (gerado por tools/cards/wire.py) ---\n"
             f'import {{ {fn} }} from "./i18n/localizedImages";\n{imports}\n\n'
             f"const {name}Localized = {fn}({name}, new Map<string, string>([\n{entries}\n]));\n\n"
             f"export default {name}Localized;\n")
    src = src.replace(f"export default {name};", "").rstrip() + "\n\n" + block
    open(p, "w").write(src)
    print(f, len(pairs), "imagens em PT")
