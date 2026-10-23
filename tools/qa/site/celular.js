// Prints no celular e no tablet (emulação com toque e user-agent de celular).
// Uso: node mobile.js <prefixo> [url-da-partida] [url-da-sala]
const { chromium, devices } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const BASE = process.env.BASE || "http://localhost:8000";
const OUT = process.env.OUT || __dirname + "/shots";
const pre = process.argv[2] || "m";
const DEVS = {
  cel: devices["iPhone 13"],
  tab: { ...devices["iPad (gen 7)"] },
  tabdeitado: { ...devices["iPad (gen 7) landscape"] },
};
const only = (process.env.DEV || "cel,tab,tabdeitado").split(",");
async function login(ctx, name) {
  const p = await ctx.newPage();
  p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await p.goto(BASE + "/Identity/Account/Login");
  await p.fill("input[name='Input.UserName']", name);
  await p.fill("input[type=password]", "Senha123!");
  await Promise.all([p.waitForLoadState("networkidle"), p.click("#login-submit")]);
  return p;
}
(async () => {
  const b = await chromium.launch((process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}));
  for (const d of only) {
    const ctx = await b.newContext({ ...DEVS[d], ...(process.env.UA_DESKTOP ? {} : {}) });
    await ctx.addInitScript(() => { try { localStorage.setItem("dontShowScrollbarHintsAgain", JSON.stringify({ value: true, expiresAt: Date.now() + 86400000 })); } catch (e) {} });
    const anon = await ctx.newPage();
    for (const [n, u] of (process.env.SITE == "0" ? [] : [["inicio", "/"], ["cadastro", "/Identity/Account/Register"]])) {
      await anon.goto(BASE + u); await anon.waitForTimeout(500);
      await anon.screenshot({ path: `${OUT}/${pre}-${d}-${n}.png` });
    }
    const p = await login(ctx, "jogador1");
    const acc = await p.$("button:has-text('Aceitar')"); if (acc) await acc.click();
    if (process.env.SITE != "0") { await p.goto(BASE + "/games"); await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/${pre}-${d}-partidas.png`, fullPage: true }); }
    if (process.argv[4]) { await p.goto(process.argv[4]); await p.waitForTimeout(6000); await p.screenshot({ path: `${OUT}/${pre}-${d}-sala.png` }); await p.screenshot({ path: `${OUT}/${pre}-${d}-sala-full.png`, fullPage: true }); }
    if (process.argv[3]) {
      await p.goto(process.argv[3]); await p.waitForTimeout(9000); await p.screenshot({ path: `${OUT}/${pre}-${d}-jogo.png` });
      if (d == "cel" && process.env.EXTRA) {
        const shot = async (n) => { await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/${pre}-${d}-${n}.png` }); };
        await p.tap(".hud-phone-nav-button:nth-child(1)"); await shot("casas");
        await p.tap(".hud-phone-sheet .hud-icon-button"); 
        await p.tap(".hud-phone-nav-button:nth-child(2)"); await shot("chat");
        await p.tap(".hud-phone-sheet .hud-icon-button");
        await p.tap(".hud-action-header .hud-icon-button"); await shot("min");
        await p.tap(".hud-action-header .hud-icon-button");
        // pinça não dá para simular fácil; testa arrastar com o dedo
        const box = await p.$(".hud-map-viewport"); const bb = await box.boundingBox();
        await p.touchscreen.tap(bb.x + 200, bb.y + 250);
        await shot("toque");
      }
    }
    await ctx.close();
  }
  await b.close();
})();
