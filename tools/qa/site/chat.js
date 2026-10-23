const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { account, BASE, OUT } = require("./flow");
(async () => {
  const b = await chromium.launch((process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}));
  const a = await account(b, "jogador4");
  a.on("pageerror", e => console.log("ERR a", e.message));
  await a.goto(BASE + "/games");
  await a.fill("#create-game-name", "Teste do chat");
  await Promise.all([a.waitForNavigation(), a.click("#criar button[type=submit]")]);
  await a.waitForSelector("text=Escolher", { timeout: 60000 });
  const url = a.url();
  const c = await account(b, "jogador5");
  c.on("pageerror", e => console.log("ERR c", e.message));
  await c.goto(url); await c.waitForSelector("text=Escolher", { timeout: 60000 });
  await a.waitForTimeout(2000);
  const input = await a.$(".lobby-chat input[type=text], .lobby-chat input:not([type]), .lobby-chat textarea");
  await input.fill("Olá, Westeros!"); await input.press("Enter");
  await c.waitForTimeout(3000);
  const got = await c.evaluate(() => document.querySelector(".lobby-chat").innerText);
  console.log("recebeu:", /Olá, Westeros!/.test(got));
  // copiar link
  await a.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await a.click("button:has-text('Copiar link do convite')"); await a.waitForTimeout(500);
  console.log("link:", await a.evaluate(() => navigator.clipboard.readText()));
  await a.screenshot({ path: OUT + "/chat.png" });
  await b.close();
})();
