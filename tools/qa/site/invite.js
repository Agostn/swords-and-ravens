// Amigo novo abre o link do convite sem conta: precisa cair na sala de espera depois do cadastro.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { BASE, OUT } = require("./flow");
(async () => {
  const b = await chromium.launch((process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}));
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const url = process.argv[2];
  await p.goto(url);
  console.log("sem conta ->", p.url());
  await p.screenshot({ path: OUT + "/invite-1.png" });
  await p.click("text=Criar uma conta nova");
  console.log("cadastro ->", p.url());
  const n = "amigo" + Date.now() % 100000;
  await p.fill("input[name='Input.UserName']", n);
  await p.fill("input[name='Input.Password']", "Senha123!");
  await p.fill("input[name='Input.ConfirmPassword']", "Senha123!");
  await Promise.all([p.waitForNavigation(), p.click("#registerSubmit")]);
  await p.waitForTimeout(5000);
  console.log("depois do cadastro ->", p.url(), await p.$("text=Sala de espera") ? "SALA OK" : "sem sala");
  await p.screenshot({ path: OUT + "/invite-2.png" });
  await b.close();
})();
