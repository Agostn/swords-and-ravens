#!/usr/bin/env python3
"""Lista cada imagem de carta usada pelo jogo, com o id da carta e os textos em inglês e português.
Lê os arquivos client/*Images.ts (que ligam id -> imagem), data/baseGameData.json (cartas de Casa)
e os textos exportados (cards-en.json / cards-pt-*.json, gerados por tools/i18n/dump-card-texts.ts).
Uso: python3 inventory.py CARDS_EN.json CARDS_PT1.json CARDS_PT2.json SAIDA.json"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../agot-bg-game-server")
en, pt1, pt2, out = (json.load(open(p)) if i < 3 else p for i, p in enumerate(sys.argv[1:5]))

def parse_images(fname):
    src = open(os.path.join(ROOT, "src/client", fname)).read()
    imports = dict(re.findall(r'import\s+(\w+)\s+from\s+"\.\./\.\./public/images/([^"]+)"', src))
    pairs = re.findall(r'\[\s*"([^"]+)"\s*,\s*(\w+)\s*\]', src)
    # objetivos: [holdCourt.id, holdCourtImage] -> id vem de objectiveCards.ts
    obj = open(os.path.join(ROOT, "src/common/ingame-game-state/game-data-structure/static-data-structure/objectiveCards.ts")).read()
    ids = dict(re.findall(r'export const (\w+)\s*=\s*new \w+\(\s*"([^"]+)"', obj))
    pairs += [(ids[v], img) for v, img in re.findall(r'\[\s*(\w+)\.id\s*,\s*(\w+)\s*\]', src) if v in ids]
    return [(cid, imports[var]) for cid, var in pairs if var in imports]

house = {}
data = json.load(open(os.path.join(ROOT, "data/baseGameData.json")))
def walk(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == "houseCards" and isinstance(v, dict):
                for cid, c in v.items():
                    if isinstance(c, dict) and "name" in c:
                        house[cid] = c
            else:
                walk(v)
walk(data)
# cartas definidas no código: vassalos (vassalHouseCards.ts) e versões "nerfadas" (createGame.ts)
vsrc = open(os.path.join(ROOT, "src/common/ingame-game-state/game-data-structure/static-data-structure/vassalHouseCards.ts")).read()
for cid, name, ab in re.findall(r'new HouseCard\("([^"]+)",\s*"([^"]+)",[^)]*?(?:houseCardAbilities\.get\("([^"]+)"\)|null)\)', vsrc):
    house[cid] = {"name": name, "ability": ab or None}
csrc = open(os.path.join(ROOT, "src/common/ingame-game-state/game-data-structure/createGame.ts")).read()
for orig, ab in re.findall(r'nerfHouseCard\(game,\s*"([^"]+)",\s*"([^"]+)"\)', csrc):
    if orig in house:
        house[orig + "-nerfed"] = {"name": house[orig]["name"], "ability": ab}

norm = lambda s: s.replace(" ", " ")
items = []
for cid, path in parse_images("houseCardImages.ts"):
    c = house.get(cid, {})
    name_en = c.get("name") or en["houseCard"].get(cid)
    ab = c.get("ability")
    items.append({
        "kind": "house", "id": cid, "path": path,
        "name_en": name_en, "name_pt": pt2["houseCardNames"].get(norm(name_en or ""), name_en),
        "ability": ab,
        "text_en": en["ability"].get(ab, {}).get("description") if ab else None,
        "text_pt": pt2["ability"].get(ab) if ab else None,
    })
for kind, fname in [("westeros", "westerosCardImages.ts"), ("wildling", "wildlingCardImages.ts"),
                    ("loan", "loanCardImages.ts"), ("objective", "objectiveCardImages.ts")]:
    for cid, path in parse_images(fname):
        if cid == "back":
            continue
        items.append({"kind": kind, "id": cid, "path": path,
                      "en": en[kind].get(cid), "pt": pt1[kind].get(cid)})
FIX_TEXT_PT = {
    "aeron-damphair-dwd-nerfed": "Para cada carta de Casa na sua pilha de descarte, você pode descartar uma das suas Fichas de Poder disponíveis para aumentar a força de combate desta carta em uma para cada ficha descartada.",
}
for i in items:
    if i["id"] in FIX_TEXT_PT:
        i["text_pt"] = FIX_TEXT_PT[i["id"]]
json.dump(items, open(out, "w"), indent=1, ensure_ascii=False)
from collections import Counter
print(Counter(i["kind"] for i in items))
print("sem texto PT:", [i["id"] for i in items if (i["kind"] != "house" and not i.get("pt")) or (i["kind"] == "house" and i["ability"] and not i["text_pt"])])
print("caminhos repetidos:", [p for p, n in Counter(i["path"] for i in items).items() if n > 1][:20])
