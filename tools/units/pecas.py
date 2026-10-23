#!/usr/bin/env python3
"""
Gera as peças do tabuleiro (soldado, cavaleiro, máquina de cerco, navio e dragão) de
todas as Casas no estilo "madeira cortada a laser": silhueta pintada na cor da Casa, a
espessura da madeira aparecendo na lateral, veio da madeira e a quina pegando luz.

As silhuetas ficam em tools/units/silhuetas (ver CREDITOS.md). Este script só monta o
acabamento; quem encaixa a silhueta no quadro e gera os PNG é o render.js.

Uso:
  python3 tools/units/pecas.py     -> SVG em tools/units/svg
  node tools/units/render.js       -> PNG 128x128 em agot-bg-game-server/public/images/units-v2
"""
import os
import re

AQUI = os.path.dirname(os.path.abspath(__file__))
SVG_DIR = os.path.join(AQUI, "svg")
SIL_DIR = os.path.join(AQUI, "silhuetas")

# Cores de tinta um pouco mais sóbrias que as cores "de tela" das Casas
CASAS = {
    "baratheon": "#cfa52a",
    "lannister": "#a8242c",
    "stark": "#d8d5cc",
    "greyjoy": "#4f575d",
    "tyrell": "#3f8238",
    "martell": "#d0701f",
    "arryn": "#3a80b8",
    "targaryen": "#5e22a6",
    "bolton": "#b0786f",
}

# nomes dos arquivos (os mesmos das peças antigas, para trocar só a pasta)
ARQUIVOS = {
    "baratheon": {"footman": "BarathFoot", "knight": "BarathKnight", "siegeEngine": "BarathSeige", "ship": "BarathShip", "dragon": "BaraDragon"},
    "lannister": {"footman": "LanFoot", "knight": "LanKnight", "siegeEngine": "LanSeige", "ship": "LanShip", "dragon": "LannDragon"},
    "stark": {"footman": "StarFoot", "knight": "StarKnight", "siegeEngine": "StarSeige", "ship": "StarShip", "dragon": "StarDragon"},
    "greyjoy": {"footman": "GreyFoot", "knight": "GreyKnight", "siegeEngine": "GreySeige", "ship": "GreyShip", "dragon": "GreyDragon"},
    "tyrell": {"footman": "TyrFoot", "knight": "TyrKnight", "siegeEngine": "TyrSeige", "ship": "TyrShip", "dragon": "TyrDragon"},
    "martell": {"footman": "MartFoot", "knight": "MartKnight", "siegeEngine": "MartSeige", "ship": "MartShip", "dragon": "MartDragon"},
    "arryn": {"footman": "ArrynFoot", "knight": "ArrynKnight", "siegeEngine": "ArrynSiege", "ship": "ArrynShip", "dragon": "ArrDragon"},
    "targaryen": {"footman": "TargFoot", "knight": "TargKnight", "ship": "TargShip", "dragon": "TargDragon"},
    "bolton": {"footman": "BoltonFoot", "knight": "BoltonKnight", "siegeEngine": "BoltonSiege", "ship": "BoltonShip", "dragon": "BoltDragon"},
}

SILHUETA = {
    "footman": "soldado.svg",
    "knight": "cavaleiro.svg",
    "siegeEngine": "cerco.svg",
    "ship": "navio.svg",
    "dragon": "dragao.svg",
}


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb2hex(c):
    return "#%02x%02x%02x" % tuple(max(0, min(255, round(v))) for v in c)


def mix(a, b, t):
    a, b = hex2rgb(a), hex2rgb(b)
    return rgb2hex(tuple(a[i] + (b[i] - a[i]) * t for i in range(3)))


def load_paths(unit):
    """Os <path> da silhueta (sem o quadrado de fundo dos ícones), em coordenadas 0..512."""
    svg = open(os.path.join(SIL_DIR, SILHUETA[unit])).read()
    paths, grav = [], []
    for m in re.finditer(r"<path([^>]*)/>", svg):
        attrs = m.group(1)
        d = re.search(r'\sd="([^"]+)"', attrs).group(1)
        if d.strip() in ("M0 0h512v512H0z", "M0 0h512v512H0z "):
            continue
        rule = "evenodd" if "evenodd" in attrs else "nonzero"
        (grav if "data-grav" in attrs else paths).append(f'<path d="{d}" fill-rule="{rule}"/>')
    return "".join(paths), "".join(grav)


def svg_for(color, unit):
    side = mix(color, "#000000", 0.5)        # lateral (espessura), na sombra
    side_edge = mix(color, "#000000", 0.68)
    light = mix(color, "#ffffff", 0.3)       # quina de cima pegando luz
    sil, grav = load_paths(unit)
    engrave = mix(color, "#000000", 0.55)

    out = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -6 128 128" width="120" height="120">',
        "<defs>",
        # render.js mede a silhueta e preenche o transform para caber no quadro
        f'<g id="s"><g id="fit" transform="FIT">{sil}</g></g>',
        # traços gravados (mesmo encaixe da silhueta)
        f'<g id="gv"><g id="fit2" transform="FIT">{grav}</g></g>',
        # contorno do corte, luz na quina e veio da madeira, só dentro da silhueta
        '<filter id="f" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">',
        '<feMorphology in="SourceAlpha" operator="erode" radius="0.9" result="er"/>',
        '<feComposite in="SourceAlpha" in2="er" operator="out" result="edge"/>',
        f'<feFlood flood-color="{side_edge}"/><feComposite in2="edge" operator="in" result="edgeC"/>',
        '<feOffset in="SourceAlpha" dx="1.3" dy="1.5" result="off"/>',
        '<feComposite in="SourceAlpha" in2="off" operator="out" result="hl"/>',
        f'<feFlood flood-color="{light}" flood-opacity="0.8"/><feComposite in2="hl" operator="in" result="hlC"/>',
        '<feTurbulence type="fractalNoise" baseFrequency="0.012 0.3" numOctaves="2" seed="7" result="t"/>',
        '<feColorMatrix in="t" type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0 0.06  0 0 0 0.75 -0.28" result="tc"/>',
        '<feComposite in="tc" in2="SourceAlpha" operator="in" result="grain"/>',
        '<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="grain"/><feMergeNode in="hlC"/><feMergeNode in="edgeC"/></feMerge>',
        "</filter>",
        '<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>',
        "</defs>",
        # sombra no mapa
        '<g transform="translate(4.5 6)" fill="#000" opacity="0.5" filter="url(#sh)"><use href="#s"/></g>',
    ]
    # espessura da madeira: a silhueta repetida, deslocada para baixo e para a direita
    steps = 7
    for k in range(steps, 0, -1):
        dx, dy = k * 0.5, k * 0.68
        fill = side_edge if k == steps else side
        out.append(f'<g transform="translate({dx:.2f} {dy:.2f})" fill="{fill}"><use href="#s"/></g>')
    # frente pintada
    out.append(f'<g filter="url(#f)" fill="{color}"><use href="#s"/></g>')
    if grav:
        out.append(f'<g fill="{engrave}" opacity="0.85"><use href="#gv"/></g>')
    out.append("</svg>")
    return "\n".join(out)


def main():
    os.makedirs(SVG_DIR, exist_ok=True)
    for f in os.listdir(SVG_DIR):
        os.remove(os.path.join(SVG_DIR, f))
    n = 0
    for house, files in ARQUIVOS.items():
        for unit, name in files.items():
            with open(os.path.join(SVG_DIR, name + ".svg"), "w") as f:
                f.write(svg_for(CASAS[house], unit))
            n += 1
    print(n, "SVG gerados em", SVG_DIR)


if __name__ == "__main__":
    main()
