// Joga sozinho uma partida de teste (3 jogadores, abas #1 #2 #3) usando as
// funções do próprio jogo, e tira prints de cada tela nova.
// Uso: node bot.js <pasta-de-prints> <passos>
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs");
const out = process.argv[2] || "bot";
const STEPS = Number(process.argv[3] || 80);
fs.mkdirSync(out, { recursive: true });

// Executado dentro da página de cada jogador.
function botTick() {
  const gc = window.gameClient;
  const eg = gc && gc.entireGame;
  const me = gc && gc.authenticatedPlayer;
  if (!eg || !me) return "sem-jogo";
  const leaf = eg.leafState;
  const name = leaf.constructor.name;
  // espera a resposta do servidor antes de agir de novo
  if ((window.__busyUntil || 0) > Date.now() && window.__busyState == name) return name + ":aguardando";
  window.__busyUntil = Date.now() + 3000;
  window.__busyState = name;
  const myHouse = me.house;
  const commands = (h) => eg.ingameGameState && eg.ingameGameState.getControllerOfHouse(h) == me;
  const regions = () => eg.ingameGameState.world.regions.values;
  try {
    switch (name) {
      case "PlaceOrdersGameState": {
        if (leaf.isReady(myHouse)) return name + ":pronto";
        const todo = regions().filter((r) => r.units.size > 0 && r.getController() == myHouse && !leaf.placedOrders.has(r));
        if (todo.length) {
          const avail = leaf.getAvailableOrders(myHouse).filter((o) => !/raid/.test(o.type.id));
          avail.sort((a, b) => (/march/.test(b.type.id) ? 1 : 0) - (/march/.test(a.type.id) ? 1 : 0));
          if (avail.length) { leaf.assignOrder(todo[0], avail[0]); return name + ":ordem"; }
        }
        leaf.ready();
        return name + ":ready";
      }
      case "ResolveSingleMarchOrderGameState": {
        if (!commands(leaf.house)) return name + ":espera";
        const r = leaf.getRegionsWithMarchOrder()[0];
        const units = leaf.getValidMarchUnits(r);
        const targets = units.length ? leaf.getValidTargetRegions(r, [], units).filter((t) => t != r) : [];
        const target = targets.find((t) => t.getController() == null) || targets[0];
        leaf.sendMoves(r, { entries: target ? [[target, units]] : [] }, false);
        return name + ":marcha";
      }
      case "ResolveSingleConsolidatePowerGameState": {
        if (!commands(leaf.house)) return name + ":espera";
        const r = leaf.actionGameState.getRegionsWithConsolidatePowerOrderOfHouse(leaf.house)[0]
          || leaf.actionGameState.getRegionsWithDefenseMusterOrderOfHouse(leaf.house)[0];
        if (r) { leaf.chooseGainPowerTokens(r); return name + ":poder"; }
        return name + ":sem-ordem";
      }
      case "ChooseHouseCardGameState": {
        const mine = leaf.combatGameState.houseCombatDatas.keys.find((h) => commands(h));
        if (!mine || leaf.houseCards.has(mine)) return name + ":espera";
        const cards = leaf.getChoosableCards(mine);
        leaf.chooseHouseCard(cards[0], false);
        return name + ":carta";
      }
      case "DeclareSupportGameState":
        if (!commands(leaf.house)) return name + ":espera";
        leaf.choose(null); return name + ":nenhum";
      case "UseValyrianSteelBladeGameState":
        if (!commands(leaf.house)) return name + ":espera";
        leaf.choose(false); return name + ":espada";
      case "BiddingGameState":
        if (leaf.bids && leaf.bids.has && leaf.bids.has(myHouse)) return name + ":espera";
        leaf.bid(0); return name + ":lance";
      case "SimpleChoiceGameState":
        if (!commands(leaf.house)) return name + ":espera";
        leaf.choose(0); return name + ":escolha";
      case "PlayerMusteringGameState":
        if (!commands(leaf.house)) return name + ":espera";
        leaf.muster({ entries: [] }); return name + ":recruta";
      case "ReplaceOrderGameState":
        if (!commands(leaf.ravenHolder)) return name + ":espera";
        leaf.skip(); return name + ":pular";
      case "SeeTopWildlingCardGameState":
        if (!commands(leaf.ravenHolder)) return name + ":espera";
        leaf.choose(0); return name + ":manter";
      case "ResolveSingleRaidOrderGameState": {
        if (!commands(leaf.house)) return name + ":espera";
        const r = leaf.actionGameState.getRegionsWithRaidOrderOfHouse(leaf.house)[0];
        leaf.resolveRaid(r, null); return name + ":incursao";
      }
      case "PlayerReconcileArmiesGameState":
        return name + ":ajuste";
      default:
        return name;
    }
  } catch (e) {
    return name + ":erro " + e.message;
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("dontShowScrollbarHintsAgain", JSON.stringify({ value: true, expiresAt: Date.now() + 86400000 }));
    } catch (e) {}
  });
  const pages = [];
  for (const id of [1, 2, 3]) {
    const p = await ctx.newPage();
    p.on("pageerror", (e) => console.log(`[erro na página #${id}] ${e.message}`));
    await p.goto("http://localhost:8080/static/#" + id, { waitUntil: "load" });
    pages.push(p);
  }
  await pages[0].waitForTimeout(8000);
  const seen = new Set();
  let shot = 0;
  for (let step = 0; step < STEPS; step++) {
    const results = [];
    for (const p of pages) results.push(await p.evaluate(botTick).catch((e) => "eval-erro " + e.message));
    const state = results.map((r) => r.split(":")[0]).join("|");
    if (!seen.has(state)) {
      seen.add(state);
      // print da aba de quem precisa agir (ou da primeira)
      const idx = Math.max(0, results.findIndex((r) => !/espera|pronto|sem-jogo/.test(r)));
      await pages[idx].waitForTimeout(1500);
      const file = `${out}/${String(shot++).padStart(2, "0")}-${results[idx].split(":")[0]}.png`;
      await pages[idx].screenshot({ path: file });
    }
    console.log(step, results.join("  |  "));
    await pages[0].waitForTimeout(1200);
  }
  // histórico da partida
  await pages[0].click("[data-rb-event-key=game-logs]").catch(() => {});
  await pages[0].waitForTimeout(1000);
  await pages[0].screenshot({ path: `${out}/zz-historico.png`, fullPage: true });
  await browser.close();
})();
