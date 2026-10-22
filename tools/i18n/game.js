// Começa uma partida de 3 jogadores (jogo base) e tira prints da tela da partida.
// Uso: node game.js <pasta-de-saida> [nome-do-print]
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const out = process.argv[2] || ".";
const tag = process.argv[3] || "partida";
const BASE = "http://localhost:8080/static/#";

async function open(ctx, id) {
  const p = await ctx.newPage();
  p.on("pageerror", (e) => console.log(`[pageerror #${id}] ${e.message}`));
  await p.goto(BASE + id, { waitUntil: "load" });
  await p.waitForSelector("text=Escolher", { timeout: 60000 }).catch(() => {});
  return p;
}

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const p1 = await open(ctx, 1);
  await p1.waitForTimeout(3000);
  await p1.selectOption("#game-setups", "base-game");
  await p1.waitForTimeout(800);
  await p1.selectOption("#player-count", "3");
  await p1.waitForTimeout(800);
  const p2 = await open(ctx, 2);
  const p3 = await open(ctx, 3);
  const pages = [p1, p2, p3];
  for (let i = 0; i < pages.length; i++) {
    const buttons = await pages[i].$$("button:has-text('Escolher')");
    if (buttons[0]) await buttons[0].click();
    await pages[i].waitForTimeout(1200);
  }
  await p1.click("button:has-text('Iniciar')").catch((e) => console.log("start:", e.message));
  await p1.waitForTimeout(6000);
  await p1.screenshot({ path: `${out}/${tag}-1.png` });
  await p1.screenshot({ path: `${out}/${tag}-1-full.png`, fullPage: true });
  await browser.close();
})();
