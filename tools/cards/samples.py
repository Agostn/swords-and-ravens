#!/usr/bin/env python3
"""Gera a amostra de cartas em PT-BR (uma ou duas de cada tipo) para aprovação.
Uso: python3 samples.py PASTA_SAIDA"""
import os
import sys

from cardpt import Card

IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../agot-bg-game-server/public/images")
OUT = sys.argv[1]


def house(src, name, text, out):
    # Carta de Casa (2ª ed.): nome na faixa de cima, texto no pergaminho de baixo.
    c = Card(os.path.join(IMG, src))
    c.erase((0.27, 0.055, 0.93, 0.14), darker=45)
    c.title(name, (0.29, 0.06, 0.92, 0.135), size=0.040)
    if text:
        c.erase((0.07, 0.715, 0.93, 0.95), darker=35)
        c.paragraphs([[(text, "r")]], (0.09, 0.725, 0.91, 0.945), size=0.037)
    c.save(os.path.join(OUT, out))


def westeros_base(src, name, text, out):
    # Carta de Westeros do jogo base: pergaminho largo embaixo (título + descrição em itálico).
    c = Card(os.path.join(IMG, src), ink=(52, 58, 56))
    c.erase((0.05, 0.71, 0.95, 0.95), darker=28)
    c.title(name, (0.08, 0.735, 0.92, 0.82), size=0.065)
    c.paragraphs([[(text, "i")]], (0.08, 0.82, 0.92, 0.93), size=0.062)
    c.save(os.path.join(OUT, out))


def westeros_mod(src, region, name, text_segs, out):
    # Carta de Westeros da Mãe dos Dragões: faixa com a região + pergaminho à direita.
    c = Card(os.path.join(IMG, src))
    c.erase((0.40, 0.09, 0.66, 0.19), darker=40)
    c.title(region, (0.41, 0.095, 0.65, 0.185), size=0.06)
    c.erase((0.42, 0.53, 0.975, 0.965), darker=40, max_blob=None)
    c.title(name, (0.42, 0.53, 0.93, 0.61), size=0.068)
    c.paragraphs([text_segs], (0.44, 0.61, 0.92, 0.96), size=0.058, line=1.12)
    c.save(os.path.join(OUT, out))


def wildling(src, name, lowest, everyone, nw_label, nw, out, everyone_label="Todos os Outros"):
    # Carta de Selvagens (medidas do protótipo aprovado "Matadores de Corvos").
    c = Card(os.path.join(IMG, src))
    W, H = 400, 630
    r = lambda b: (b[0] / W, b[1] / H, b[2] / W, b[3] / H)
    boxes = [r((30, 12, 215, 42)), r((38, 55, 360, 182)), r((110, 195, 275, 224)), r((130, 448, 372, 480)), r((38, 522, 360, 590))]
    for b in boxes:
        c.erase((max(0.0, b[0] - 0.03), b[1], min(1.0, b[2] + 0.02), b[3]), darker=35)
    c.title("Vitória dos Selvagens", boxes[0], size=0.030, align="left")
    paras = [[("Menor Lance:", "sc"), (lowest, "r")]]
    if everyone:
        paras.append([(everyone_label + ":", "sc"), (everyone, "r")])
    c.paragraphs(paras, boxes[1], size=0.029)
    c.title(name, (0.14, boxes[2][1], 0.86, boxes[2][3]), size=0.040)
    c.title("Vitória da Patrulha da Noite", boxes[3], size=0.030, align="right")
    c.paragraphs([[(nw_label + ":", "sc"), (nw, "r")]], boxes[4], size=0.029)
    c.save(os.path.join(OUT, out))


def loan(src, name, out):
    # Carta do Banco de Ferro: só o nome na faixa de cima.
    c = Card(os.path.join(IMG, src))
    c.erase((0.17, 0.025, 0.83, 0.12), darker=35)
    c.title(name, (0.18, 0.03, 0.82, 0.115), size=0.050)
    c.save(os.path.join(OUT, out))


def objective(src, name, text, out):
    # Carta de Objetivo: título na faixa, "Objetivo:" + texto no pergaminho.
    c = Card(os.path.join(IMG, src))
    c.erase((0.12, 0.025, 0.88, 0.095), darker=40)
    c.title(name, (0.13, 0.03, 0.87, 0.09), size=0.050)
    c.erase((0.06, 0.12, 0.94, 0.40), darker=35)
    c.paragraphs([[("Objetivo:", "sc")], [(text, "r")]], (0.08, 0.13, 0.92, 0.27), size=0.034, gap=0.0)
    c.save(os.path.join(OUT, out))


os.makedirs(OUT, exist_ok=True)
house("house-cards/Tyrion.png", "Tyrion Lannister",
      "Você pode cancelar na hora a carta de Casa escolhida pelo oponente e devolvê-la à mão dele. "
      "Ele precisa escolher outra carta de Casa para revelar. Se não tiver outras cartas de Casa na mão, "
      "não pode usar carta de Casa nesta batalha.", "casa-tyrion.png")
house("house-cards/Patchface.png", "Cara-Malhada",
      "Depois da batalha, você pode olhar a mão do oponente e descartar uma carta à sua escolha.", "casa-cara-malhada.png")
house("house-cards/CerseiLannister.png", "Cersei Lannister", None, "casa-cersei-sem-texto.png")
westeros_base("westeros-cards/Mustering.png", "Recrutamento",
              "Recrute novas unidades em Fortalezas e Castelos.", "westeros-recrutamento.png")
westeros_mod("westeros-cards/4/FireMadeFlesh.png", "Campina", "Fogo Feito Carne",
             [("O jogador Targaryen pode:", "r"), ("\n", "r"), ("a)", "b"),
              ("destruir um Dragão para mover qualquer ficha de força dos dragões da trilha de rodadas para o quadro de força dos dragões, ou", "r"),
              ("\n", "r"), ("b)", "b"), ("colocar um Dragão destruído na sua área natal (se puder).", "r")],
             "westeros-fogo-feito-carne.png")
wildling("wildling-cards/MammothLarge.png" if os.path.exists(os.path.join(IMG, "wildling-cards/MammothLarge.png")) else "wildling-cards/Mammothlarge.png",
         "Cavaleiros de Mamutes",
         "Destrói 3 das suas unidades em qualquer lugar.",
         "Destroem 2 das suas unidades em qualquer lugar.",
         "Maior Lance",
         "Pode pegar de volta 1 carta de Casa à sua escolha da sua pilha de descarte.",
         "selvagens-cavaleiros-de-mamutes.png")
loan("loan-cards/Pyromancer.png", "Piromante", "banco-piromante.png")
objective("objectives/HoldCourt.png", "Manter a Corte", "Controle Porto Real.", "objetivo-manter-a-corte.png")
print("ok")
