#!/usr/bin/env python3
"""Aplica traduções do site (.NET) com segurança.

Uso: python3 apply.py arquivo.json [--root PASTA]
O JSON é {"caminho/relativo": [["texto original", "tradução"], ...]}.
Cada texto original precisa aparecer EXATAMENTE uma vez no arquivo
(use ["original", "tradução", N] para exigir N ocorrências e trocar todas).
Se qualquer troca falhar, nada é gravado naquele arquivo.
"""
import json, sys, os

def main():
    args = sys.argv[1:]
    root = "."
    if "--root" in args:
        i = args.index("--root"); root = args[i + 1]; del args[i:i + 2]
    data = json.load(open(args[0], encoding="utf-8"))
    failed = 0
    for rel, pairs in data.items():
        path = os.path.join(root, rel)
        text = open(path, encoding="utf-8-sig", newline="").read()
        bom = open(path, "rb").read(3) == b"\xef\xbb\xbf"
        ok = True
        for pair in pairs:
            old, new = pair[0], pair[1]
            want = pair[2] if len(pair) > 2 else 1
            n = text.count(old)
            if n != want:
                print(f"FALHOU {rel}: {n}x (esperado {want}): {old[:70]!r}")
                ok = False
                continue
            text = text.replace(old, new)
        if ok:
            with open(path, "w", encoding="utf-8-sig" if bom else "utf-8", newline="") as f:
                f.write(text)
            print(f"ok {rel} ({len(pairs)} trocas)")
        else:
            failed += 1
    sys.exit(1 if failed else 0)

main()
