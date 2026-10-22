#!/usr/bin/env python3
"""Recria imagens de cartas com o texto em português.

Método (aprovado no protótipo "Matadores de Corvos"): dentro de cada área de texto da carta,
detecta as letras (pixels bem mais escuros que o fundo), apaga com "inpainting" (preenche
com a textura em volta) e escreve o texto em PT com fontes parecidas com as originais:
  - títulos: IM Fell English SC (versaletes)
  - texto: Crimson Text

Uso como biblioteca:
    from cardpt import Card
    c = Card("original.png")
    c.erase((x0, y0, x1, y1))            # frações 0-1 da carta
    c.title("Recrutamento", box, size=0.05, align="center")
    c.paragraphs([[("Menor Lance:", "sc"), ("Substitui...", "r")]], box, size=0.032)
    c.save("saida.png")

Tamanhos de fonte são frações da ALTURA da carta, para valer em qualquer resolução.
Fontes: pasta indicada em CARD_FONTS (padrão: tools/cards/fonts).
"""
import os
import re

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.environ.get("CARD_FONTS", os.path.join(HERE, "fonts"))
FONT_FILES = {
    "sc": "IMFeENsc28P.ttf",
    "r": "CrimsonText-Regular.ttf",
    "i": "CrimsonText-Italic.ttf",
    "b": "CrimsonText-Bold.ttf",
    "bi": "CrimsonText-BoldItalic.ttf",
}
SCALE = 2  # trabalha em 2x e reduz no fim (letras mais lisas)


class Card:
    def __init__(self, path, ink=(38, 30, 24)):
        src = Image.open(path)
        self.has_alpha = src.mode in ("RGBA", "LA", "P")
        rgba = src.convert("RGBA")
        self.size = rgba.size
        big = rgba.resize((rgba.width * SCALE, rgba.height * SCALE), Image.LANCZOS)
        self.alpha = big.getchannel("A")
        self.bgr = cv2.cvtColor(np.array(big.convert("RGB")), cv2.COLOR_RGB2BGR)
        self.W, self.H = big.size
        self.ink = ink
        self._pil = None

    # ---------- apagar ----------
    def _px(self, box):
        x0, y0, x1, y1 = box
        return int(x0 * self.W), int(y0 * self.H), int(x1 * self.W), int(y1 * self.H)

    def erase(self, box, darker=30, light_text=False, grow=2, max_blob=0.8):
        """Apaga as letras dentro da área. darker = quanto a letra é mais escura que o fundo.
        light_text=True para letra clara sobre fundo escuro.
        max_blob: manchas mais altas que essa fração da área não são apagadas (None = apaga tudo)."""
        self._flush()
        x0, y0, x1, y1 = self._px(box)
        gray = cv2.cvtColor(self.bgr, cv2.COLOR_BGR2GRAY)
        region = gray[y0:y1, x0:x1].astype(np.int16)
        bg = np.median(region)
        if light_text:
            m = region > bg + darker
        else:
            m = region < bg - darker
        m = m.astype(np.uint8)
        # Ignora manchas grandes (desenhos/ícones, ex.: o veado na faixa do título):
        # só apaga formas do tamanho de letras.
        n, labels, stats, _ = cv2.connectedComponentsWithStats(m, 8)
        limit_h = max_blob * (y1 - y0) if max_blob else None
        for i in range(1, n):
            h = stats[i, cv2.CC_STAT_HEIGHT]
            if limit_h and h > limit_h and h > 40 * SCALE * self.H / 1000:
                m[labels == i] = 0
        mask = np.zeros(gray.shape, np.uint8)
        mask[y0:y1, x0:x1] = m * 255
        mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=grow * SCALE // 2 + 1)
        self.bgr = cv2.inpaint(self.bgr, mask, 5 * SCALE, cv2.INPAINT_TELEA)
        return int(m.sum())

    # ---------- escrever ----------
    def _draw(self):
        if self._pil is None:
            self._pil = Image.fromarray(cv2.cvtColor(self.bgr, cv2.COLOR_BGR2RGB))
            self._d = ImageDraw.Draw(self._pil)
        return self._d

    def _flush(self):
        if self._pil is not None:
            self.bgr = cv2.cvtColor(np.array(self._pil), cv2.COLOR_RGB2BGR)
            self._pil = None

    def font(self, style, size):
        return ImageFont.truetype(os.path.join(FONTS, FONT_FILES[style]), max(6, int(size * self.H)))

    def title(self, text, box, size, align="center", style="sc", fill=None, embolden=True):
        d = self._draw()
        x0, y0, x1, y1 = self._px(box)
        f = self.font(style, size)
        while d.textlength(text, font=f) > (x1 - x0) and size > 0.01:
            size *= 0.97
            f = self.font(style, size)
        w = d.textlength(text, font=f)
        x = {"left": x0, "right": x1 - w, "center": (x0 + x1) / 2 - w / 2}[align]
        y = (y0 + y1) / 2
        fill = fill or self.ink
        d.text((x, y), text, font=f, fill=fill, anchor="lm")
        if embolden:
            d.text((x + 0.4 * SCALE, y), text, font=f, fill=fill, anchor="lm")

    def paragraphs(self, paras, box, size, align="center", line=1.16, gap=0.45, fill=None, min_size=0.012):
        """paras: lista de parágrafos; cada um é lista de (texto, estilo). Estilos: sc, r, i, b, bi.
        Diminui a fonte até caber na área. Centraliza na vertical."""
        d = self._draw()
        x0, y0, x1, y1 = self._px(box)
        fill = fill or self.ink
        while True:
            lines = self._layout(paras, size, x1 - x0)
            lh = size * self.H * line
            h = sum(lh if l is not None else lh * gap for l in lines)
            if h <= (y1 - y0) or size <= min_size:
                break
            size *= 0.96
        y = (y0 + y1) / 2 - h / 2
        for l in lines:
            if l is None:
                y += lh * gap
                continue
            w = self._width(l, size)
            x = {"center": (x0 + x1) / 2 - w / 2, "left": x0, "right": x1 - w}[align]
            for word, st in l:
                f = self.font(st, size)
                d.text((x, y), word, font=f, fill=fill)
                if st == "sc":
                    d.text((x + 0.5 * SCALE, y), word, font=f, fill=fill)
                x += d.textlength(word + " ", font=f)
            y += lh
        return size

    def _width(self, words, size):
        d = self._draw()
        total = sum(d.textlength(w + " ", font=self.font(st, size)) for w, st in words)
        return total - d.textlength(" ", font=self.font("r", size))

    def _layout(self, paras, size, maxw):
        lines = []
        for p in paras:
            words = []
            for text, st in p:
                for part in text.split("\n"):
                    if part == "" and words:
                        continue
                    words += [(w, st) for w in part.split()]
                    if "\n" in text:
                        words.append(("\n", st))
            cur = []
            for w in words:
                if w[0] == "\n":
                    if cur:
                        lines.append(cur)
                    cur = []
                    continue
                if cur and self._width(cur + [w], size) > maxw:
                    lines.append(cur)
                    cur = [w]
                else:
                    cur.append(w)
            if cur:
                lines.append(cur)
            lines.append(None)
        return lines[:-1]

    def save(self, out):
        self._flush()
        img = Image.fromarray(cv2.cvtColor(self.bgr, cv2.COLOR_BGR2RGB)).convert("RGBA")
        img.putalpha(self.alpha)
        img = img.resize(self.size, Image.LANCZOS)
        os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
        if out.lower().endswith((".jpg", ".jpeg")):
            img.convert("RGB").save(out, quality=92)
        else:
            img.save(out, optimize=True)


def rich(text, label_style="sc"):
    """Converte 'Rótulo: texto' e marcadores 'a)' em segmentos com estilo.
    **negrito** também vira negrito."""
    segs = []
    for part in re.split(r"(\*\*[^*]+\*\*)", text):
        if part.startswith("**"):
            segs.append((part[2:-2], "b"))
        elif part:
            segs.append((part, "r"))
    return segs
