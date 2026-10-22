#!/usr/bin/env python3
"""Troca os nomes impressos no mapa (plaquinhas de pergaminho) pelos nomes em PT-BR.

1. Acha as plaquinhas (retângulos claros cor de pergaminho).
2. Lê o nome em inglês com OCR (tesseract) e procura o nome mais parecido na lista de lugares.
3. Apaga as letras, alarga a plaquinha se o nome em português for maior, e escreve o nome em PT.
Plaquinhas que não forem reconhecidas com confiança ficam como estão e aparecem no relatório.

Uso: python3 mappt.py ENTRADA.jpg SAIDA.jpg [--crop x0,y0,x1,y1] [--report relatorio.txt]
"""
import argparse
import difflib
import json
import os
import re
import subprocess

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "fonts", "IMFeENsc28P.ttf")
DATA = os.path.join(HERE, "../../agot-bg-game-server/src/client/i18n/locales/data-pt-BR.ts")


def load_names():
    """Lê os nomes {inglês: português} de data-pt-BR.ts (lugares e portos)."""
    text = open(DATA, encoding="utf-8").read()
    names = {}
    for m in re.finditer(r'^\s*"?([^":\n]+?)"?\s*:\s*"([^"]*)"', text, re.M):
        en, pt = m.group(1).strip(), m.group(2)
        if en and pt and not en.startswith("//"):
            names[en] = pt
    return names


def find_labels(bgr, names, min_score):
    """Acha os nomes no mapa com OCR (palavras soltas), junta palavras da mesma linha e
    devolve [(caixa_do_texto, texto_lido, nome_en, nota)]."""
    import pytesseract
    S = 3
    big = cv2.resize(bgr, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(big, cv2.COLOR_BGR2GRAY)
    data = pytesseract.image_to_data(gray, config="--psm 11", output_type=pytesseract.Output.DICT)
    words = []
    for i, t in enumerate(data["text"]):
        t = re.sub(r"[^A-Za-z']", "", t)
        if len(t) >= 2 and float(data["conf"][i]) > 20:
            x, y, w, h = (data[k][i] / S for k in ("left", "top", "width", "height"))
            if 5 <= h <= 30:
                words.append([x, y, w, h, t])
    # junta palavras vizinhas na mesma linha
    words.sort(key=lambda w: (round(w[1] / 6), w[0]))
    lines = []
    for w in words:
        for L in lines:
            lx, ly, lw, lh = L["box"]
            if abs((w[1] + w[3] / 2) - (ly + lh / 2)) < lh * 0.6 and -2 <= w[0] - (lx + lw) < lh * 2.5:
                L["box"] = (lx, min(ly, w[1]), w[0] + w[2] - lx, max(ly + lh, w[1] + w[3]) - min(ly, w[1]))
                L["text"] += " " + w[4]
                break
        else:
            lines.append({"box": (w[0], w[1], w[2], w[3]), "text": w[4]})
    found = []
    for L in lines:
        key, score = best_match(L["text"], names)
        # tenta também cada pedaço, caso a linha tenha juntado lixo
        found.append((L["box"], L["text"], key, score))
    return [f for f in found if f[3] >= min_score], [f for f in found if 0.5 <= f[3] < min_score]


def plaque_around(bgr, tbox):
    """A partir da caixa do texto, expande até a borda da plaquinha (onde o claro acaba)."""
    x, y, w, h = [int(round(v)) for v in tbox]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    V = hsv[:, :, 2].astype(int)
    H_, W_ = V.shape
    cy0, cy1 = max(0, y), min(H_, y + h)
    def light_col(cx):
        col = V[cy0:cy1, cx]
        return (col > 150).mean() > 0.45
    def grow(start, step, limit):
        pos, last_light, gap = start, start, 0
        while 0 < pos < W_ - 1 and abs(pos - start) < limit:
            pos += step
            if light_col(pos):
                last_light, gap = pos, 0
            else:
                gap += 1
                if gap > h * 0.9:  # aceita buracos do tamanho de um espaço entre letras/palavras
                    break
        return last_light
    x0 = grow(x, -1, 6 * h)
    x1 = grow(x + w, 1, 6 * h) + 1
    def light_row(cy):
        row = V[cy, x0:x1]
        return (row > 150).mean() > 0.6
    y0 = y
    while y0 > 0 and light_row(y0 - 1) and y - y0 < h:
        y0 -= 1
    y1 = y + h
    while y1 < H_ - 1 and light_row(y1) and y1 - (y + h) < h:
        y1 += 1
    return (x0, y0, x1 - x0, y1 - y0)


def ocr(bgr, box):
    x, y, w, h = box
    crop = bgr[y:y + h, x:x + w]
    crop = cv2.resize(crop, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    path = "/tmp/_mappt_ocr.png"
    cv2.imwrite(path, th)
    r = subprocess.run(["tesseract", path, "-", "--psm", "7"], capture_output=True, text=True)
    return re.sub(r"[^A-Za-z' ]", "", r.stdout).strip()


def best_match(text, names):
    """Nome mais parecido. Devolve nota baixa se houver dois nomes quase empatados
    (ex.: "East Summer Sea" x "West Summer Sea"), para não trocar um pelo outro."""
    norm = lambda s: re.sub(r"[^a-z]", "", s.lower())
    t = norm(text)
    if len(t) < 3:
        return None, 0
    scores = sorted(((difflib.SequenceMatcher(None, t, norm(k)).ratio(), k) for k in names), reverse=True)
    (s1, k1), (s2, _k2) = scores[0], scores[1]
    if s1 - s2 < 0.08:
        return k1, min(s1, 0.5)
    return k1, s1


def repaint(bgr, box, pt_text, ink=(34, 40, 58)):
    x, y, w, h = box
    pad = 2
    plaque = bgr[y:y + h, x:x + w].copy()
    gray = cv2.cvtColor(plaque, cv2.COLOR_BGR2GRAY).astype(np.int16)
    inner = gray[pad:-pad, h // 4:-h // 4] if w > h else gray
    bg = np.median(inner)
    letters = (gray < bg - 40).astype(np.uint8) * 255
    letters[:pad, :] = 0; letters[-pad:, :] = 0
    letters[:, : h // 4] = 0; letters[:, -(h // 4):] = 0  # não mexe nas pontas enroladas
    letters = cv2.dilate(letters, np.ones((3, 3), np.uint8), iterations=1)
    clean = cv2.inpaint(plaque, letters, 4, cv2.INPAINT_TELEA)

    size = int(h * 0.46)
    font = ImageFont.truetype(FONT, size)
    tmp = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    tw = tmp.textlength(pt_text, font=font)
    need = int(tw + h * 0.8)  # espaço para as pontas
    if need > w:
        # alarga só o miolo da plaquinha, mantendo as pontas
        e = h // 2
        left, mid, right = clean[:, :e], clean[:, e:w - e], clean[:, w - e:]
        mid = cv2.resize(mid, (need - 2 * e, h), interpolation=cv2.INTER_LINEAR)
        clean = np.hstack([left, mid, right])
        nx = x - (need - w) // 2
    else:
        nx = x
    nw = clean.shape[1]
    nx = max(0, min(nx, bgr.shape[1] - nw))
    pil = Image.fromarray(cv2.cvtColor(clean, cv2.COLOR_BGR2RGB))
    d = ImageDraw.Draw(pil)
    while d.textlength(pt_text, font=font) > nw - h * 0.7 and size > 8:
        size -= 1
        font = ImageFont.truetype(FONT, size)
    tw = d.textlength(pt_text, font=font)
    d.text(((nw - tw) / 2, h / 2 + 1), pt_text, font=font, fill=ink, anchor="lm")
    d.text(((nw - tw) / 2 + 0.6, h / 2 + 1), pt_text, font=font, fill=ink, anchor="lm")
    bgr[y:y + h, nx:nx + nw] = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--crop"); ap.add_argument("--report"); ap.add_argument("--labels"); ap.add_argument("--use", help="tabela conferida [{box:[x,y,w,h], en:nome}] (coordenadas da imagem inteira)")
    ap.add_argument("--min-score", type=float, default=0.82)
    a = ap.parse_args()
    names = load_names()
    bgr = cv2.imread(a.src)
    if a.crop:
        x0, y0, x1, y1 = map(int, a.crop.split(","))
        bgr = bgr[y0:y1, x0:x1].copy()
    lines = []
    if a.use:
        ox, oy = (map(int, a.crop.split(",")[:2]) if a.crop else (0, 0))
        for item in json.load(open(a.use)):
            x, y, w, h = item["box"]
            box = (x - ox, y - oy, w, h)
            if box[0] < 0 or box[1] < 0 or box[0] + w > bgr.shape[1] or box[1] + h > bgr.shape[0]:
                continue
            pt = item.get("pt") or names[item["en"]]
            repaint(bgr, box, pt)
            lines.append(f"OK   {item['en']} -> {pt}")
        cv2.imwrite(a.out, bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
        print("\n".join(lines))
        return
    found, doubtful = find_labels(bgr, names, 0.45)
    plaques = []
    for tbox, text, key, score in found + doubtful:
        box = plaque_around(bgr, tbox)
        if box[2] < 1.8 * box[3]:
            continue
        # mesma plaquinha achada por outra palavra?
        if any(abs(box[0] - b[0]) < 8 and abs(box[1] - b[1]) < 8 for b, *_ in plaques):
            continue
        text2 = ocr(bgr, box)
        key2, score2 = best_match(text2, names)
        if score2 >= score:
            text, key, score = text2, key2, score2
        plaques.append((box, text, key, score))
    if a.labels:
        json.dump([{"box": [int(v) for v in b], "ocr": t, "en": k, "score": round(sc, 2)} for b, t, k, sc in plaques],
                  open(a.labels, "w"), indent=1, ensure_ascii=False)
    for box, text, key, score in sorted(plaques, key=lambda f: (f[0][1], f[0][0])):
        if score < a.min_score:
            lines.append(f"???  {box} '{text}' (melhor: {key}, {score:.2f})")
        elif names[key] == key:
            lines.append(f"IGUAL {box} '{text}' -> {key}")
        else:
            repaint(bgr, box, names[key])
            lines.append(f"OK   {box} '{text}' -> {key} -> {names[key]} ({score:.2f})")
    cv2.imwrite(a.out, bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
    rep = "\n".join(lines)
    if a.report:
        open(a.report, "w").write(rep)
    print(rep)


if __name__ == "__main__":
    main()
