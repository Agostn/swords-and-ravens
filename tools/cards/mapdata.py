#!/usr/bin/env python3
"""Troca os nomes impressos no mapa usando as posições guardadas nos dados do jogo.

Os arquivos data/<mapa>.json (feitos no editor Tiled) têm a camada "Regions": um retângulo
por área do mapa, em cima da plaquinha com o nome, e o id da área. Isso é mais confiável
que OCR (que já trocou "East Summer Sea" por "West Summer Sea").

Para cada área: acha a plaquinha de pergaminho dentro do retângulo, apaga o nome em inglês
e escreve o nome em PT (data-pt-BR.ts). Portos ("Port of ...") não têm plaquinha e são pulados.

Uso: python3 mapdata.py MAPA [--out SAIDA.jpg] [--debug DEBUG.jpg]
  MAPA = westeros | westeros-7p | westeros-with-essos | ffc-eyrie-with-port
"""
import argparse
import json
import os
import re

import cv2
import numpy as np

from mappt import repaint, load_names

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.join(HERE, "../../agot-bg-game-server")

# Nomes de áreas que aparecem no mapa mas não no dicionário (ou com grafia diferente).
EXTRA = {}


def region_names():
    """id da área -> nome em inglês, a partir do baseGameData/código (mesmo nome usado nas dicas)."""
    return None


def plaque_in(bgr, rect):
    """Dentro do retângulo (com folga), acha a plaquinha clara de pergaminho."""
    H, W = bgr.shape[:2]
    x, y, w, h = rect
    pad_x, pad_y = int(w * 0.25) + 10, int(h * 0.6) + 8
    x0, y0 = max(0, x - pad_x), max(0, y - pad_y)
    x1, y1 = min(W, x + w + pad_x), min(H, y + h + pad_y)
    crop = bgr[y0:y1, x0:x1]
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    cx, cy = x + w / 2 - x0, y + h / 2 - y0
    best = None
    for vmin in (185, 175, 165, 155):
        m = cv2.inRange(hsv, (0, 0, vmin), (45, 110, 255))
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
        for i in range(1, n):
            bx, by, bw, bh, area = st[i]
            if not (14 <= bh <= 70 and bw >= 1.8 * bh and bw <= w * 1.8 + 40 and area >= 0.55 * bw * bh):
                continue
            if not (bx - 4 <= cx <= bx + bw + 4 and by - 6 <= cy <= by + bh + 6):
                continue
            # não pode passar muito do retângulo dos dados (senão pegou chão claro junto)
            if bx + x0 < x - 0.2 * w - 8 or bx + bw + x0 > x + 1.2 * w + 8 or bh > h + 24:
                continue
            if best is None or area > best[0]:
                best = (area, (int(bx + x0), int(by + y0), int(bw), int(bh)))
        if best:
            break
    return best[1] if best else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("map")
    ap.add_argument("--out")
    ap.add_argument("--debug")
    ap.add_argument("--report")
    a = ap.parse_args()
    data = json.load(open(os.path.join(GAME, "data", a.map + ".json")))
    img_path = os.path.join(GAME, "public/images", a.map + ".jpg")
    bgr = cv2.imread(img_path)
    bg = next(L for L in data["layers"] if L["name"] == "Background")["objects"][0]
    sx = bgr.shape[1] / bg["width"]
    sy = bgr.shape[0] / bg["height"]
    names = load_names()
    overrides = {}
    ov_path = os.path.join(HERE, "labels", a.map + ".json")
    if os.path.exists(ov_path):
        overrides = json.load(open(ov_path))
    debug = bgr.copy() if a.debug else None
    lines = []
    regions = next(L for L in data["layers"] if L["name"] == "Regions")["objects"]
    for o in regions:
        en = o["name"]
        rid = next((p["value"] for p in o.get("properties", []) if p["name"] == "id"), en)
        if en.startswith("Port of") or "port" in rid.split("-")[-1:]:
            continue
        ov = overrides.get(rid, {})
        if ov.get("skip"):
            lines.append(f"PULADO {rid}")
            continue
        rect = tuple(int(v) for v in (o["x"] * sx, o["y"] * sy, o["width"] * sx, o["height"] * sy))
        box = tuple(ov["box"]) if "box" in ov else (plaque_in(bgr, rect) or rect)
        pt = ov.get("pt") or names.get(en) or EXTRA.get(en)
        if not box or not pt:
            lines.append(f"???  {rid} '{en}' caixa={box} pt={pt}")
            if debug is not None:
                x, y, w, h = rect
                cv2.rectangle(debug, (x, y), (x + w, y + h), (0, 0, 255), 3)
            continue
        if debug is not None:
            x, y, w, h = box
            cv2.rectangle(debug, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(debug, pt, (x, y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        if pt == en:
            lines.append(f"IGUAL {rid} '{en}'")
            continue
        lines.append(f"OK   {rid} {box} '{en}' -> '{pt}'")
        if a.out:
            repaint(bgr, box, pt)
    # plaquinhas que não são áreas (ex.: "The Iron Bank"): {"_extra": [{"near": [x,y,w,h], "pt": "..."}]}
    for ex in overrides.get("_extra", []):
        box = tuple(ex["box"]) if "box" in ex else plaque_in(bgr, tuple(ex["near"]))
        if not box:
            lines.append(f"???  extra {ex}")
            continue
        lines.append(f"OK   extra {box} -> '{ex['pt']}'")
        if debug is not None:
            x, y, w, h = box
            cv2.rectangle(debug, (x, y), (x + w, y + h), (0, 255, 0), 2)
        if a.out:
            repaint(bgr, box, ex["pt"])
    if a.out:
        cv2.imwrite(a.out, bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
    if debug is not None:
        cv2.imwrite(a.debug, debug, [cv2.IMWRITE_JPEG_QUALITY, 85])
    rep = "\n".join(lines)
    if a.report:
        open(a.report, "w").write(rep)
    print(rep)


if __name__ == "__main__":
    main()
