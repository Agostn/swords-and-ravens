/** Tutorial com imagens: como funciona o combate tático, em 6 passos. */
import { Role, SquadKind } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { drawFigure } from "./battle";
import { HOUSES, House } from "./data";
import { drawSquad } from "./figures";
import { H, LW, W, drawWall, roundRect, terrainImage } from "./render";

export interface Slide {
  title: string;
  text: string;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

const CW = 600;
const CH = 360;
const A: House = HOUSES.stark;
const D: House = HOUSES.lannister;

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, bg = "rgba(18,14,10,.82)", ink = "#efe3c6", size = 17): void {
  ctx.font = `700 ${size}px 'Alegreya Sans', 'Trebuchet MS', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(text).width + 20;
  ctx.fillStyle = bg;
  roundRect(ctx, x - tw / 2, y - 14, tw, 28, 14);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.fillText(text, x, y + 1);
}

function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color = "#e0b354", width = 4, curve = 0): void {
  const mx = (x0 + x1) / 2 - (y1 - y0) * curve;
  const my = (y0 + y1) / 2 + (x1 - x0) * curve;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx, my, x1, y1);
  ctx.stroke();
  const ang = Math.atan2(y1 - my, x1 - mx);
  ctx.beginPath();
  ctx.moveTo(x1 + Math.cos(ang) * 4, y1 + Math.sin(ang) * 4);
  ctx.lineTo(x1 - Math.cos(ang - 0.5) * 16, y1 - Math.sin(ang - 0.5) * 16);
  ctx.lineTo(x1 - Math.cos(ang + 0.5) * 16, y1 - Math.sin(ang + 0.5) * 16);
  ctx.closePath();
  ctx.fill();
}

function ground(ctx: CanvasRenderingContext2D, field: Parameters<typeof terrainImage>[0], sy: number): void {
  // recorte do campo pintado: da altura sy, com a mesma largura
  const img = terrainImage(field);
  ctx.drawImage(img, 0, sy * 2, W * 2, CH * 2, 0, 0, CW, CH);
}

function squad(ctx: CanvasRenderingContext2D, kind: SquadKind, role: Role, x: number, y: number, h: House): void {
  drawSquad(ctx, x, y + 22, kind, role, h, { scale: 1.1 });
}

function men(ctx: CanvasRenderingContext2D, role: Role, kind: SquadKind, cx: number, cy: number, h: House, side: "attacker" | "defender", n = 3, scale = 1.05): void {
  const gap = (kind == "knight" ? 30 : 16) * scale;
  for (let i = 0; i < n; i++) drawFigure(ctx, cx + (i - (n - 1) / 2) * gap, cy + 13 * scale, role, kind, side, h, 0, scale);
}

export const SLIDES: Slide[] = [
  {
    title: "1. O campo e o seu lado",
    text: "O campo tem 3 faixas: esquerda, centro e direita. Cada faixa tem duas casinhas do seu lado: frente e trás. Você põe suas peças ali. Ao tocar numa peça, cada casinha mostra a FORÇA dela ali (soldado normal = 3, cavaleiro = 6; verde é melhor). No lado do inimigo aparece a sua força se a luta for em cada faixa, contando a ajuda de quem está longe. O lado do inimigo fica escondido na névoa até a luta começar.",
    draw: (ctx) => {
      ground(ctx, "planicie", H * 0.36);
      // névoa
      const g = ctx.createLinearGradient(0, 0, 0, 90);
      g.addColorStop(0, "rgba(22,18,14,.95)");
      g.addColorStop(1, "rgba(22,18,14,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, CW, 90);
      label(ctx, "Inimigo escondido na névoa", CW / 2, 26);
      ["Esquerda", "Centro", "Direita"].forEach((n, i) => label(ctx, n, i * LW + LW / 2, 74, "rgba(18,14,10,.7)", "#efe3c6", 15));
      for (let i = 0; i < 3; i++) {
        for (const [row, y] of [["FRENTE", 100], ["TRÁS", 222]] as [string, number][]) {
          ctx.setLineDash([7, 6]);
          ctx.strokeStyle = "rgba(255,236,190,.6)";
          ctx.lineWidth = 2;
          roundRect(ctx, i * LW + 10, y, LW - 20, 112, 12);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = "700 13px 'Alegreya Sans', sans-serif";
          ctx.textAlign = "left";
          ctx.fillStyle = "rgba(255,240,205,.9)";
          ctx.fillText(row, i * LW + 22, y + 16);
        }
      }
      squad(ctx, "footman", "lanceiro", LW * 0.5, 165, A);
      squad(ctx, "knight", "cavalaria", LW * 1.5, 160, A);
      squad(ctx, "footman", "arqueiro", LW * 1.5, 285, A);
      label(ctx, "Seu lado", CW / 2, CH - 16, A.color, A.ink);
    }
  },
  {
    title: "2. Cada peça escolhe uma função",
    text: "Soldado: lanceiro, escudeiro ou arqueiro. Cavaleiro: cavalaria (carga) ou batedores (cavalaria leve). É pedra-papel-tesoura: arqueiro vence lanceiro, lanceiro vence escudeiro, escudeiro vence arqueiro. A cavalaria atropela arqueiros e escudeiros, mas morre nas lanças; os batedores contornam as lanças, mas não passam pelos escudos.",
    draw: (ctx) => {
      ctx.fillStyle = "#2a2119";
      ctx.fillRect(0, 0, CW, CH);
      const pts: Record<string, [number, number]> = { arqueiro: [150, 80], lanceiro: [300, 270], escudeiro: [450, 80] };
      const roles: Role[] = ["arqueiro", "lanceiro", "escudeiro"];
      const names: Record<string, string> = { arqueiro: "Arqueiro", lanceiro: "Lanceiro", escudeiro: "Escudeiro" };
      arrow(ctx, 175, 110, 280, 240, "#7fbf6a", 4, 0.1);
      arrow(ctx, 322, 240, 428, 112, "#7fbf6a", 4, 0.1);
      arrow(ctx, 420, 72, 182, 72, "#7fbf6a", 4, -0.12);
      label(ctx, "vence", 205, 185, "rgba(40,70,35,.95)", "#e8f6df", 14);
      label(ctx, "vence", 398, 185, "rgba(40,70,35,.95)", "#e8f6df", 14);
      label(ctx, "vence", 300, 35, "rgba(40,70,35,.95)", "#e8f6df", 14);
      roles.forEach((r) => {
        const [x, y] = pts[r];
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.beginPath();
        ctx.arc(x, y, 34, 0, Math.PI * 2);
        ctx.fill();
        men(ctx, r, "footman", x, y - 8, A, "defender", 3, 1.45);
        label(ctx, names[r], x, y + 38, "rgba(18,14,10,.9)", "#efe3c6", 15);
      });
      // cavalaria
      drawFigure(ctx, 70, 318, "cavalaria", "knight", "attacker", D, 0, 1.3);
      label(ctx, "Cavalaria", 70, 338, "rgba(18,14,10,.9)", "#efe3c6", 14);
      drawFigure(ctx, 530, 318, "batedores", "knight", "defender", D, 0, 1.3);
      label(ctx, "Batedores", 530, 338, "rgba(18,14,10,.9)", "#efe3c6", 14);
    }
  },
  {
    title: "3. Frente e trás",
    text: "Arqueiros rendem mais atrás: atiram por cima da sua linha da frente. Quem luta corpo a corpo (lanceiro, escudeiro, cavalaria) rende mais na frente. Se a sua frente for forte, ela protege quem está atrás da carga da cavalaria inimiga.",
    draw: (ctx) => {
      ground(ctx, "planicie", H * 0.3);
      // escudeiros na frente, arqueiros atrás, flechas por cima
      for (let i = 0; i < 6; i++) drawFigure(ctx, 210 + i * 18, 163, "escudeiro", "footman", "attacker", A);
      for (let i = 0; i < 6; i++) drawFigure(ctx, 210 + i * 18, 263, "arqueiro", "footman", "attacker", A);
      for (let i = 0; i < 4; i++) drawFigure(ctx, 220 + i * 36, 53, "cavalaria", "knight", "defender", D);
      ctx.strokeStyle = "#f6edd6";
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 5; i++) {
        const x0 = 220 + i * 20;
        ctx.beginPath();
        ctx.moveTo(x0, 235);
        ctx.quadraticCurveTo(x0 + 10, 120, x0 + 20, 60);
        ctx.stroke();
      }
      label(ctx, "FRENTE: escudeiros", 110, 150);
      label(ctx, "TRÁS: arqueiros", 110, 250);
      label(ctx, "flechas por cima", 470, 140, "rgba(18,14,10,.82)", "#efe3c6", 15);
    }
  },
  {
    title: "4. O terreno de cada faixa",
    text: "O campo vem da área do mapa onde a batalha acontece. Mata atrapalha flechas e cavalos. No rio, quem ataca perde força ao atravessar. Atrás de muralha, quem defende fica bem mais forte, a não ser que o atacante leve uma máquina de cerco para aquela faixa. Embaixo do campo aparece o efeito de cada faixa.",
    draw: (ctx) => {
      const crops: [Parameters<typeof terrainImage>[0], number, string, string][] = [
        ["floresta", 0, "Mata", "flechas e cavalos −"],
        ["rio", 0, "Rio", "quem ataca −20%"],
        ["fortaleza", 0, "Muralha", "quem defende +30%"]
      ];
      crops.forEach(([field, lane, name, fx], i) => {
        const img = terrainImage(field);
        const sx = lane * LW * 2;
        ctx.drawImage(img, sx, H * 0.3 * 2, LW * 2, CH * 2, i * (CW / 3), 0, CW / 3, CH);
        if (field == "fortaleza") {
          ctx.save();
          ctx.translate(i * (CW / 3) - lane * LW, -H * 0.3 + 0);
          drawWall(ctx, lane, false, false);
          ctx.restore();
        }
        label(ctx, name, i * (CW / 3) + CW / 6, 30);
        label(ctx, fx, i * (CW / 3) + CW / 6, CH - 28, "rgba(18,14,10,.88)", "#e0b354", 15);
      });
      ctx.strokeStyle = "rgba(0,0,0,.6)";
      ctx.lineWidth = 3;
      [1, 2].forEach((i) => {
        ctx.beginPath();
        ctx.moveTo((i * CW) / 3, 0);
        ctx.lineTo((i * CW) / 3, CH);
        ctx.stroke();
      });
    }
  },
  {
    title: "5. Quem vence cada faixa",
    text: "Só conta a faixa onde os dois lados têm peças: lá a conta compara quem rende mais (função, terreno, frente/trás, carta e ordem). Quem ficou sozinho numa faixa vai ajudar onde tem luta: a vizinha com 30% da força dele; se a luta for na outra ponta, chega cansado e ajuda com 15%. Ninguém fica inútil. Quem vence uma faixa também ajuda as vizinhas (+20%).",
    draw: (ctx) => {
      ground(ctx, "planicie", H * 0.32);
      ctx.strokeStyle = "rgba(25,18,10,.6)";
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 2;
      [1, 2].forEach((i) => {
        ctx.beginPath();
        ctx.moveTo(i * LW, 0);
        ctx.lineTo(i * LW, CH);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      // faixa esquerda: luta, Stark vence
      men(ctx, "lanceiro", "footman", LW * 0.5, 210, A, "attacker", 3);
      men(ctx, "cavalaria", "knight", LW * 0.5, 120, D, "defender", 2);
      label(ctx, "STARK VENCE", LW * 0.5, 165, A.color, A.ink, 15);
      // centro: sozinho → ajuda pelo lado
      men(ctx, "escudeiro", "footman", LW * 1.5, 260, A, "attacker", 3);
      arrow(ctx, LW * 1.35, 240, LW * 0.82, 200, "#e0b354", 4, -0.15);
      label(ctx, "sozinho: ajuda ao lado", LW * 1.55, 310, "rgba(18,14,10,.85)", "#e0b354", 14);
      // direita: luta, Lannister vence
      men(ctx, "arqueiro", "footman", LW * 2.5, 230, A, "attacker", 3);
      men(ctx, "escudeiro", "footman", LW * 2.5, 110, D, "defender", 3);
      label(ctx, "LANNISTER VENCE", LW * 2.5, 168, D.color, D.ink, 15);
      label(ctx, "faixa com luta", LW * 0.5, 30);
      label(ctx, "sem luta", LW * 1.5, 30);
      label(ctx, "faixa com luta", LW * 2.5, 30);
    }
  },
  {
    title: "6. O resultado: +1 ou +2",
    text: "Quem vencer mais faixas ganha o mini-mapa e soma +1 na batalha do tabuleiro. Se vencer todas as faixas com luta (pelo menos duas), soma +2. Se ninguém se encontrar nas faixas, os exércitos marcham e lutam no centro. Depois a batalha segue igual ao jogo original: Espada de Aço Valiriano, baixas e retirada.",
    draw: (ctx) => {
      ctx.fillStyle = "#2a2119";
      ctx.fillRect(0, 0, CW, CH);
      const badge = (x: number, y: number, txt: string, sub: string, h: House): void => {
        ctx.fillStyle = "rgba(0,0,0,.35)";
        roundRect(ctx, x - 92 + 4, y - 70 + 5, 184, 140, 18);
        ctx.fill();
        ctx.fillStyle = h.color;
        roundRect(ctx, x - 92, y - 70, 184, 140, 18);
        ctx.fill();
        ctx.fillStyle = h.ink;
        ctx.font = "800 64px 'Alegreya Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(txt, x, y - 12);
        ctx.font = "700 17px 'Alegreya Sans', sans-serif";
        ctx.fillText(sub, x, y + 42);
      };
      badge(170, 160, "+1", "venceu mais faixas", A);
      badge(430, 160, "+2", "venceu todas", HOUSES.baratheon);
      label(ctx, "soma na batalha do tabuleiro", CW / 2, 300, "rgba(18,14,10,.9)", "#e0b354", 17);
    }
  }
];

export function drawSlide(canvas: HTMLCanvasElement, i: number): void {
  canvas.width = CW * 2;
  canvas.height = CH * 2;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, CW, CH);
  SLIDES[i].draw(ctx);
}
