#!/usr/bin/env python3
"""Gera TODAS as cartas em PT-BR em agot-bg-game-server/public/images/pt-BR/<mesmo caminho>.

Uso: python3 generate.py INVENTARIO.json [--only kind] [--match texto]
O inventário vem de inventory.py. Medidas de cada formato de carta em LAYOUTS (frações 0-1).
Exceções de cartas específicas em OVERRIDES (achadas na conferência visual).
"""
import argparse
import json
import os

from cardpt import Card

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../agot-bg-game-server/public/images")
OUT = os.path.join(ROOT, "pt-BR")
LIGHT = (238, 228, 205)

# Textos que o jogo não tinha traduzido (objetivos especiais de cada Casa, só existem na imagem).
SPECIAL_OBJECTIVES = {
    "stark-special-objective": ("Casa Stark", "Controle Winterfell e 5 ou mais áreas com Castelos ou Fortalezas."),
    "baratheon-special-objective": ("Casa Baratheon", "Controle Pedra do Dragão e Porto Real."),
    "lannister-special-objective": ("Casa Lannister", "Controle Lannisporto e Porto Real."),
    "arryn-special-objective": ("Casa Arryn", "Tenha mais Fichas de Poder que qualquer outra Casa e controle o Ninho da Águia."),
}
# Nome da região nas cartas de Westeros da Mãe dos Dragões (faixa no alto).
MOD_REGION = {}  # preenchido por OVERRIDES / conferência; padrão: lido do arquivo westeros-mod-regions.json

# Versões mais curtas, só para a IMAGEM (a dica no jogo mantém o texto completo):
# a carta impressa tem pouco espaço e o português é ~30% mais longo que o inglês.
CARD_TEXT = {
    "a-throne-of-blades": "Quem tem o Trono de Ferro escolhe: a) todos ajustam o Suprimento e os exércitos, b) todos recrutam unidades, ou c) nada acontece.",
    "dark-wings-dark-words": "Quem tem o Corvo Mensageiro escolhe: a) lances nas três Trilhas de Influência, b) todos ganham 1 Ficha de Poder por ícone de poder que controlam, ou c) nada acontece.",
    "put-to-the-sword": "Quem tem a Espada de Aço Valiriano escolhe, nesta Fase de Planejamento: a) proibidas ordens de Defesa, b) proibidas ordens de Marcha +1, ou c) sem restrições.",
    "the-burden-of-power": "Quem tem o Trono de Ferro escolhe: a) a trilha dos Selvagens volta a \"0\", ou b) todos recrutam em Fortalezas e Castelos.",
    "shifting-ambitions": "Cada jogador põe 1 Objetivo da mão virado para baixo. Embaralhe e revele; na ordem dos turnos, cada um pega 1 dessas cartas.",
    "new-information": "Na ordem dos turnos, cada jogador compra 1 Objetivo e depois devolve 1 Objetivo da mão ao baralho, embaralhando.",
}

OVERRIDES = {
    # Letras do nome em inglês passam por baixo do brasão: apaga até mais à direita.
    "house-cards/SerGerrisDrinkwater.png": {"title_x1": 0.90, "title_max_blob": None},
    "house-cards/BastardOfGodsgrace.png": {"title_x1": 0.90, "title_max_blob": None},
    "house-cards/BastardOfNightsong.png": {"title_x1": 0.90, "title_max_blob": None},
    "house-cards/DamonDanceForMe.png": {"title_erase": (0.16, 0.05, 0.86, 0.145)},
    # O texto do jogo tem a opção c) "não fazer nada"; a carta impressa só mostra a) e b).
    "westeros-cards/4/FireMadeFlesh.png": {"segs": [
        ("O jogador Targaryen pode:", "r"), ("a)", "b"),
        ("destruir um Dragão para mover qualquer ficha de força dos dragões da trilha de rodadas para o quadro de força dos dragões, ou", "r"),
        ("b)", "b"), ("colocar um Dragão destruído na sua área natal (se puder).", "r")]},
}


def family(item):
    p = item["path"]
    if item["kind"] == "house":
        if "/storm-of-swords/" in p:
            return "house-asos"
        if "/1st_" in p:
            return "house-1st"
        return "house"
    if item["kind"] == "westeros":
        if "/affc/" in p:
            return "westeros-affc"
        if "/4/" in p:
            return "westeros-mod"
        return "westeros"
    return item["kind"]


def save(c, item):
    out = os.path.join(OUT, item["path"])
    c.save(out)
    return out


def do_house(item, fam, ov):
    c = Card(os.path.join(ROOT, item["path"]))
    name, text = item["name_pt"], item.get("text_pt")
    big = c.size[0] > 400  # cartas da Dança dos Dragões/Festim/Mãe dos Dragões em alta resolução
    if fam == "house":
        # Título: não passa de 0.83 na largura para não apagar o brasão do canto direito.
        x0 = 0.20 if big else 0.25
        x1 = ov.get("title_x1", 0.83)
        c.erase(ov.get("title_erase", (x0, 0.05, x1, 0.145)), darker=45, max_blob=ov.get("title_max_blob", 0.8))
        if big:
            c.title(name, ov.get("title_box", (0.27, 0.06, 0.80, 0.135)), size=0.044, style="b", embolden=False)
        else:
            c.title(name, ov.get("title_box", (0.29, 0.06, 0.80, 0.135)), size=0.040)
        if text:
            c.erase(ov.get("body_erase", (0.06, 0.715, 0.94, 0.942)), darker=35, max_blob=None)
            c.paragraphs([[(text, "r")]], ov.get("body_box", (0.09, 0.725, 0.91, 0.925)), size=0.037)
    else:  # house-asos / house-1st: faixa do nome no meio, texto embaixo alinhado à esquerda
        band = (0.17, 0.675, 0.90, 0.735) if fam == "house-1st" else (0.17, 0.68, 0.89, 0.74)
        light_band = c.median_gray(band) > 140  # faixa clara = letra escura (ex.: Martell 1ª ed.)
        c.erase(band, darker=45, light_text=not light_band)
        c.title(name, (band[0] + 0.02, band[1] + 0.005, band[2] - 0.01, band[3] - 0.005), size=0.041,
                style="b", fill=None if light_band else LIGHT, embolden=False)
        if text:
            c.erase((0.02, 0.745, 0.98, 0.965), darker=40)
            c.paragraphs([[(text, "r")]], (0.06, 0.75, 0.95, 0.955), size=0.040, align="left", line=1.08)
    return save(c, item)


def options_segs(text, style):
    """Quebra "... a) x, b) y, ou c) z" em linhas com a) b) c) em negrito, como na carta impressa."""
    import re
    parts = re.split(r"\s*\b([a-c]\))\s*", text)
    if len(parts) < 4:
        return [(text, style)]
    segs = [(parts[0], style)] if parts[0].strip() else []
    for i in range(1, len(parts), 2):
        segs += [(parts[i], "b"), (parts[i + 1], style)]
    return segs


def do_westeros(item, fam, ov):
    pt = item["pt"]
    if fam == "westeros":
        c = Card(os.path.join(ROOT, item["path"]), ink=(52, 58, 56))
        c.erase(ov.get("erase", (0.05, 0.685, 0.95, 0.955)), darker=28)
        c.title(pt["name"], ov.get("title_box", (0.08, 0.715, 0.92, 0.795)), size=0.062)
        segs = options_segs(CARD_TEXT.get(item["id"], pt["description"]), "i")
        c.paragraphs([segs], ov.get("body_box", (0.06, 0.795, 0.94, 0.94)), size=0.056, line=1.05, min_size=0.04)
    elif fam == "westeros-affc":
        c = Card(os.path.join(ROOT, item["path"]))
        c.erase(ov.get("erase", (0.05, 0.685, 0.95, 0.95)), darker=30)
        c.title(pt["name"], (0.08, 0.715, 0.92, 0.795), size=0.065)
        c.paragraphs([options_segs(CARD_TEXT.get(item["id"], pt["description"]), "r")], (0.06, 0.795, 0.94, 0.94), size=0.056, line=1.08, min_size=0.04)
    else:  # westeros-mod
        c = Card(os.path.join(ROOT, item["path"]))
        regions = ov.get("regions") or MOD_REGION.get(item["id"]) or []
        if isinstance(regions, str):
            regions = [regions]
        # faixas amarelas com o nome do lugar (uma ou duas, uma embaixo da outra)
        for k, region in enumerate(regions):
            y0 = 0.09 + k * 0.185
            c.erase((0.405, y0, 0.735, y0 + 0.10), darker=40)
            c.title(region, (0.42, y0 + 0.005, 0.72, y0 + 0.095), size=0.058)
        c.erase(ov.get("erase", (0.42, 0.53, 0.975, 0.965)), darker=40, max_blob=None)
        c.title(pt["name"], ov.get("title_box", (0.42, 0.55, 0.93, 0.625)), size=0.068)
        segs = ov.get("segs") or [(pt["description"], "r")]
        c.paragraphs([segs], ov.get("body_box", (0.44, 0.625, 0.92, 0.96)), size=0.058, line=1.12)
    return save(c, item)


def do_wildling(item, fam, ov):
    pt = item["pt"]
    c = Card(os.path.join(ROOT, item["path"]))
    W, H = 400, 630
    r = lambda b: (b[0] / W, b[1] / H, b[2] / W, b[3] / H)
    boxes = [r((30, 12, 215, 42)), r((38, 55, 360, 182)), r((110, 195, 275, 224)), r((130, 448, 372, 480)), r((38, 522, 360, 590))]
    boxes = ov.get("boxes", boxes)
    for k, b in enumerate(boxes):
        if k == 2:  # faixa do nome: nomes em inglês longos ocupam quase toda a largura
            c.erase((0.07, b[1] - 0.005, 0.93, b[3] + 0.005), darker=35)
        else:
            c.erase((max(0.0, b[0] - 0.03), b[1], min(1.0, b[2] + 0.02), b[3]), darker=35)
    c.title("Vitória dos Selvagens", boxes[0], size=0.036, align="left")
    paras = [[("Menor Lance:", "sc"), (pt["lowest"], "r")]]
    if pt.get("everyone") and not ov.get("no_everyone"):
        paras.append([(ov.get("everyone_label", "Todos os Outros") + ":", "sc"), (pt["everyone"], "r")])
    c.paragraphs(ov.get("top_paras", paras), boxes[1], size=0.029)
    c.title(pt["name"], (0.10, boxes[2][1], 0.90, boxes[2][3]), size=0.040)
    c.title("Vitória da Patrulha da Noite", boxes[3], size=0.036, align="right")
    c.paragraphs(ov.get("bottom_paras", [[("Maior Lance:", "sc"), (pt["nightsWatch"], "r")]]), boxes[4], size=0.029)
    return save(c, item)


def do_loan(item, fam, ov):
    c = Card(os.path.join(ROOT, item["path"]))
    c.erase((0.17, 0.025, 0.83, 0.12), darker=35)
    c.title(item["pt"]["name"], (0.18, 0.03, 0.82, 0.115), size=0.050)
    return save(c, item)


def do_objective(item, fam, ov):
    c = Card(os.path.join(ROOT, item["path"]))
    if item["id"] in SPECIAL_OBJECTIVES:
        name, text = SPECIAL_OBJECTIVES[item["id"]]
        c.erase((0.10, 0.04, 0.78, 0.13), darker=40)
        c.title(name, (0.16, 0.045, 0.78, 0.125), size=0.050, align="left")
        c.erase((0.07, 0.155, 0.925, 0.37), darker=35, max_blob=None)
        c.paragraphs([[("Objetivo:", "sc")], [(text, "r")]], (0.08, 0.17, 0.92, 0.32), size=0.034, gap=0.0)
        c.erase((0.18, 0.77, 0.82, 0.88), darker=35)
        c.title("Por Rodada", (0.20, 0.775, 0.80, 0.875), size=0.060)
    else:
        name, text = item["pt"]["name"], item["pt"]["description"]
        c.erase(ov.get("title_erase", (0.10, 0.02, 0.90, 0.115)), darker=40)
        c.title(name, (0.13, 0.03, 0.87, 0.105), size=0.050)
        c.erase((0.07, 0.12, 0.925, 0.40), darker=35, max_blob=None)
        c.paragraphs([[("Objetivo:", "sc")], [(text, "r")]], (0.08, 0.13, 0.92, 0.30), size=0.034, gap=0.0)
    return save(c, item)


HANDLERS = {"house": do_house, "westeros": do_westeros, "wildling": do_wildling, "loan": do_loan, "objective": do_objective}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inventory")
    ap.add_argument("--only")
    ap.add_argument("--match")
    a = ap.parse_args()
    items = json.load(open(a.inventory))
    regions_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "westeros-mod-regions.json")
    if os.path.exists(regions_file):
        MOD_REGION.update(json.load(open(regions_file)))
    done, seen = [], set()
    for it in items:
        if it["path"] in seen:
            continue
        if a.only and it["kind"] != a.only and family(it) != a.only:
            continue
        if a.match and a.match not in it["path"] and a.match != it["id"]:
            continue
        seen.add(it["path"])
        fam = family(it)
        HANDLERS[it["kind"]](it, fam, OVERRIDES.get(it["path"], {}))
        done.append((fam, it["path"]))
    print(len(done), "cartas geradas")


if __name__ == "__main__":
    main()
