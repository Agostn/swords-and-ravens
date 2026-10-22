// Envia mensagens inválidas de propósito e confere se o servidor continua de pé.
// Uso: node crashtest.js '<json da mensagem>'
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const msg = JSON.parse(process.argv[2] || '{"type":"place-order","regionId":"lugar-que-nao-existe","orderId":1}');
(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const ctx = await browser.newContext();
  const p1 = await ctx.newPage(), p2 = await ctx.newPage();
  await p1.goto("http://localhost:8080/static/#1");
  await p2.goto("http://localhost:8080/static/#2");
  await p1.waitForTimeout(7000);
  console.log("estado antes:", await p1.evaluate(() => window.gameClient.entireGame.leafState.constructor.name));
  await p1.evaluate((m) => window.gameClient.entireGame.sendMessageToServer(m), msg);
  await p1.waitForTimeout(3000);
  console.log("conexão #1 depois:", await p1.evaluate(() => window.gameClient.connectionState));
  console.log("conexão #2 depois:", await p2.evaluate(() => window.gameClient.connectionState));
  await p2.reload();
  await p2.waitForTimeout(7000);
  console.log("depois de recarregar #2:", await p2.evaluate(() => window.gameClient.connectionState + " / " + window.gameClient.entireGame.leafState.constructor.name));
  await browser.close();
})();
