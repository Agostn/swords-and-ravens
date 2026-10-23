// Fluxo do site: cadastra/entra com N contas, cria partida, abre o lobby.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const BASE = process.env.BASE || "http://localhost:8000";
const OUT = process.env.OUT || __dirname + "/shots";
require("fs").mkdirSync(OUT, { recursive: true });
async function account(b, name) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: Number(process.env.VH || 900) } });
  const p = await ctx.newPage();
  p.on("pageerror", e => console.log("PAGEERROR", name, e.message));
  await p.goto(BASE + "/Identity/Account/Login");
  await p.fill("input[name='Input.Email']", name + "@exemplo.com");
  const pw = "Senha123!";
  await p.fill("input[type=password]", pw);
  await Promise.all([p.waitForLoadState("networkidle"), p.click("#login-submit")]);
  if (p.url().includes("/Login")) {
    await p.goto(BASE + "/Identity/Account/Register");
    await p.fill("input[name='Input.UserName']", name);
    await p.fill("input[name='Input.Email']", name + "@exemplo.com");
    await p.fill("input[name='Input.Password']", pw);
    await p.fill("input[name='Input.ConfirmPassword']", pw);
    const terms = await p.$("input[type=checkbox]"); if (terms) await terms.check();
    await Promise.all([p.waitForLoadState("networkidle"), p.click("#registerSubmit, form button[type=submit]")]);
  }
  console.log(name, "->", p.url());
  return p;
}
module.exports = { account, BASE, OUT };
if (require.main === module) (async () => {
  const b = await chromium.launch((process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}));
  const ctx = await b.newContext({ viewport: { width: 1440, height: Number(process.env.VH || 900) } });
  const anon = await ctx.newPage();
  for (const [n, u] of [["index", "/"], ["login", "/Identity/Account/Login"], ["register", "/Identity/Account/Register"]]) {
    await anon.goto(BASE + u); await anon.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
  }
  const p1 = await account(b, "jogador1");
  await p1.goto(BASE + "/games"); await p1.screenshot({ path: `${OUT}/games.png`, fullPage: true });
  await b.close();
})();
