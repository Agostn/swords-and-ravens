"""Desenha uma grade (em frações 0-1 da carta) sobre várias imagens lado a lado, para medir áreas.
Uso: python3 grid.py saida.png img1 img2 ..."""
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
H = 800
tiles = []
for f in files:
    im = Image.open(f).convert("RGB")
    im = im.resize((int(im.width * H / im.height), H))
    d = ImageDraw.Draw(im)
    for i in range(1, 20):
        x = im.width * i / 20; y = H * i / 20
        c = (255, 0, 0) if i % 2 == 0 else (0, 200, 255)
        d.line([(x, 0), (x, H)], fill=c, width=1); d.line([(0, y), (im.width, y)], fill=c, width=1)
        if i % 2 == 0:
            d.text((x + 2, 2), f"{i*5}", fill=(255, 255, 0)); d.text((2, y + 2), f"{i*5}", fill=(255, 255, 0))
    tiles.append(im)
W = sum(t.width for t in tiles) + 10 * len(tiles)
c = Image.new("RGB", (W, H), (30, 30, 30)); x = 0
for t in tiles: c.paste(t, (x, 0)); x += t.width + 10
c.save(out)
