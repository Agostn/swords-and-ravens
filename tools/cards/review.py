#!/usr/bin/env python3
"""Folhas de conferência: original | português lado a lado, várias cartas por folha.
Uso: python3 review.py INVENTARIO.json PASTA_SAIDA [--per 8] [--height 420]"""
import argparse, json, os
from PIL import Image, ImageDraw, ImageFont
from generate import ROOT, OUT, family
ap = argparse.ArgumentParser(); ap.add_argument("inventory"); ap.add_argument("out")
ap.add_argument("--per", type=int, default=8); ap.add_argument("--height", type=int, default=420); ap.add_argument("--only")
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
F = ImageFont.truetype(os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts/CrimsonText-Regular.ttf"), 16)
groups = {}
seen = set()
for it in json.load(open(a.inventory)):
    if it["path"] in seen or not os.path.exists(os.path.join(OUT, it["path"])):
        continue
    seen.add(it["path"])
    if a.only and family(it) != a.only: continue
    groups.setdefault(family(it), []).append(it)
for fam, items in groups.items():
    for n in range(0, len(items), a.per):
        chunk = items[n:n + a.per]; H = a.height
        tiles = []
        for it in chunk:
            ims = []
            for f in (os.path.join(ROOT, it["path"]), os.path.join(OUT, it["path"])):
                im = Image.open(f).convert("RGBA"); ims.append(im.resize((int(im.width * H / im.height), H), Image.LANCZOS))
            t = Image.new("RGB", (ims[0].width * 2 + 6, H + 24), (30, 30, 30))
            t.paste(ims[0], (0, 24), ims[0]); t.paste(ims[1], (ims[0].width + 6, 24), ims[1])
            ImageDraw.Draw(t).text((4, 2), it["path"].split("/")[-1], font=F, fill=(230, 220, 190))
            tiles.append(t)
        cols = 4 if tiles[0].width < 700 else 2
        rows = (len(tiles) + cols - 1) // cols
        W = max(t.width for t in tiles) + 12
        sheet = Image.new("RGB", (W * cols, (H + 36) * rows), (20, 20, 20))
        for i, t in enumerate(tiles):
            sheet.paste(t, ((i % cols) * W, (i // cols) * (H + 36)))
        sheet.save(os.path.join(a.out, f"{fam}-{n // a.per + 1:02d}.jpg"), quality=85)
print(sorted(os.listdir(a.out)))
