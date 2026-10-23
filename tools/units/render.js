// Encaixa a silhuetas de tools/units/svg no quadro (centralizada, apoiada embaixo) e gera
// PNG de 128x128 com fundo transparente em agot-bg-game-server/public/images/units-v2.
// Também grava o SVG já encaixado. Uso: node tools/units/render.js
const path = require("path");
const fs = require("fs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const SVG = path.join(__dirname, "svg");
const OUT = path.join(__dirname, "..", "..", "agot-bg-game-server", "public", "images", "units-v2");
const SIZE = 128;
// área útil dentro do viewBox (-4 -6 128 128), deixando lugar para a espessura e a sombra
const BOX = { cx: 58, bottom: 104, maxW: 104, maxH: 98 };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const p = await b.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
  const files = fs.readdirSync(SVG).filter((f) => f.endsWith(".svg"));
  for (const f of files) {
    let svg = fs.readFileSync(path.join(SVG, f), "utf8");
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.split('transform="FIT"').join("")}</body></html>`);
    // mede a silhueta fora do <defs> (lá dentro ela não é desenhada)
    const bb = await p.evaluate(() => {
      const fit = document.querySelector("#fit");
      const svgEl = document.querySelector("svg");
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.innerHTML = fit.innerHTML;
      svgEl.appendChild(g);
      const r = g.getBBox();
      g.remove();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    const s = Math.min(BOX.maxW / bb.w, BOX.maxH / bb.h);
    const tx = BOX.cx - (bb.x + bb.w / 2) * s;
    const ty = BOX.bottom - (bb.y + bb.h) * s;
    svg = svg.split('transform="FIT"').join(`transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})"`);
    fs.writeFileSync(path.join(SVG, f), svg);
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('width="120" height="120"', `width="${SIZE}" height="${SIZE}"`)}</body></html>`);
    await p.screenshot({ path: path.join(OUT, f.replace(".svg", ".png")), omitBackground: true, clip: { x: 0, y: 0, width: SIZE, height: SIZE } });
  }
  await b.close();
  console.log(files.length, "PNG em", OUT);
})();
