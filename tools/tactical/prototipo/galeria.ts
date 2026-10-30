/** Página de teste com todas as figuras (só para conferir o desenho). */
import { Role } from "../../../agot-bg-game-server/src/common/tactical-battle/tacticalBattleData";
import { HOUSES } from "./data";
import { Kind, drawFallen, drawSquad, drawUnit } from "./figures";
import { loadAssets } from "./assets";
import { terrainImage } from "./render";

void loadAssets().then(() => {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 1000;
  document.body.appendChild(c);
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.drawImage(terrainImage("planicie"), 0, 0, 1200, 1560);
  const S = 3;
  const list: [Kind, Role][] = [["foot", "lanceiro"], ["foot", "escudeiro"], ["foot", "arqueiro"], ["horse", "cavalaria"], ["horse", "batedores"], ["siege", "catapulta"], ["tower", "torre"]];
  const hs = [HOUSES.stark, HOUSES.lannister];
  list.forEach(([k, r], i) => {
    hs.forEach((h, j) => {
      const x = 80 + i * 160;
      drawUnit(ctx, x - 30, 150 + j * 170, S, { role: r, kind: k, house: h, back: false, flip: false, walk: 0, atk: 0, seed: i });
      drawUnit(ctx, x + 40, 150 + j * 170, S, { role: r, kind: k, house: h, back: true, flip: true, walk: 1, atk: 1, fight: true, seed: i + 1 });
    });
  });
  drawUnit(ctx, 120, 560, 2, { role: "dragao", kind: "dragon", house: HOUSES.targaryen, back: false, flip: false, walk: 1, atk: 0, time: 0.3 });
  drawUnit(ctx, 680, 560, 2, { role: "dragao", kind: "dragon", house: HOUSES.targaryen, back: false, flip: true, walk: 1, atk: 0.3, time: 0.3 });
  drawUnit(ctx, 300, 560, 2.5, { role: "abordagem", kind: "ship", house: HOUSES.greyjoy, back: false, flip: false, walk: 0, atk: 0 });
  drawFallen(ctx, 420, 600, 3, { role: "lanceiro", kind: "foot", house: HOUSES.stark, back: false, flip: false, walk: 0, atk: 0 }, 2);
  drawFallen(ctx, 900, 600, 3, { role: "cavalaria", kind: "horse", house: HOUSES.lannister, back: false, flip: false, walk: 0, atk: 0 }, 2);
  // esquadrões no tamanho real do posicionamento (×2 porque o canvas do jogo é 2x)
  ctx.save();
  ctx.scale(2, 2);
  drawSquad(ctx, 60, 400, "footman", "lanceiro", HOUSES.stark);
  drawSquad(ctx, 120, 400, "footman", "escudeiro", HOUSES.lannister, { selected: true });
  drawSquad(ctx, 180, 400, "footman", "arqueiro", HOUSES.tyrell);
  drawSquad(ctx, 260, 400, "knight", "cavalaria", HOUSES.baratheon);
  drawSquad(ctx, 340, 400, "knight", "batedores", HOUSES.martell);
  drawSquad(ctx, 420, 400, "siege-engine", "catapulta", HOUSES.arryn);
  drawSquad(ctx, 480, 400, "garrison", "torre", HOUSES.stark);
  ctx.restore();
});
