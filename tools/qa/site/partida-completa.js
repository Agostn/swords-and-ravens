// Joga sozinho uma partida inteira PELO SITE (3 contas: jogador1..3), do lobby até o fim,
// usando as funções do próprio jogo, e tira prints de cada tela nova.
// Uso: node partida-completa.js <pasta-de-prints> <passos>   (MODE=pbem para por turnos; GAME=<url> continua uma partida; DEVICE="iPhone 13" para o celular)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
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
  if (window.__stopAt && name == window.__stopAt) return name + ":parado";
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
          const restr = leaf.parentGameState.planningRestrictions || [];
          const avail = leaf.getAvailableOrders(myHouse).filter((o) => !/raid/.test(o.type.id) && !restr.some((r) => r.restriction(o.type)));
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
        // se o servidor recusar (ex.: limite de suprimento), tenta com 1 unidade e depois sem mover
        const key = r.id + "@" + eg.ingameGameState.game.turn;
        window.__marchTries = window.__marchTries || {};
        const tries = (window.__marchTries[key] = (window.__marchTries[key] || 0) + 1);
        // 1ª: todas as unidades; depois 1 unidade em cada alvo possível; por fim, não move
        const alvo = tries == 1 ? target : targets[(tries - 2) % Math.max(1, targets.length)];
        const moving = tries == 1 ? units : units.slice(0, 1);
        const desistir = tries > targets.length + 2;
        leaf.sendMoves(r, { entries: alvo && !desistir ? [[alvo, moving]] : [] }, false);
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
      case "SelectHouseCardGameState":
        if (!commands(leaf.house)) return name + ":espera";
        leaf.select(leaf.houseCards[0]); return name + ":carta";
      case "ResolveTiesGameState":
        if (!commands(leaf.decider)) return name + ":espera";
        leaf.resolveTies(leaf.bidResults.map(([, hs]) => hs)); return name + ":desempate";
      case "ChooseCasualtiesGameState": {
        if (!commands(leaf.house)) return name + ":espera";
        const units = leaf.possibleCasualties.slice(0, leaf.casualties);
        leaf.chooseCasualties(units); return name + ":baixas";
      }
      case "ResolveRetreatGameState": {
        const ch = leaf.getOverridenRetreatLocationChooser(leaf.retreater) || leaf.retreater;
        if (!commands(ch)) return name + ":espera";
        const rs = leaf.getValidRetreatRegions(leaf.combat.defendingArea, leaf.retreater, leaf.combat.getUnitsAbleToRetreat ? leaf.combat.getUnitsAbleToRetreat(leaf.retreater) : []);
        if (rs[0]) leaf.chooseRetreatLocation(rs[0]); return name + ":recuo";
      }
      case "ResolveTiesGameState":
        if (!commands(leaf.decider)) return name + ":espera";
        leaf.resolveTies(leaf.bidResults.map(([, hs]) => hs)); return name + ":desempate";
      case "SelectRegionGameState":
        if (!commands(leaf.house)) return name + ":espera";
        leaf.select(leaf.regions[0]); return name + ":area";
      case "SelectOrdersGameState":
        if (!commands(leaf.house)) return name + ":espera";
        leaf.selectOrders(leaf.possibleRegions.slice(0, leaf.count)); return name + ":ordens";
      case "SelectUnitsGameState": {
        if (!commands(leaf.house)) return name + ":espera";
        const chosen = leaf.possibleUnits.slice(0, leaf.count);
        const byRegion = {};
        chosen.forEach((u) => { (byRegion[u.region.id] = byRegion[u.region.id] || []).push(u); });
        const fake = { map: (fn) => Object.keys(byRegion).map((rid) => fn(byRegion[rid][0].region, byRegion[rid])) };
        leaf.selectUnits(fake); return name + ":unidades";
      }
      case "SelectWesterosCardGameState":
        if (!commands(leaf.house)) return name + ":espera";
        leaf.select(leaf.cards[0]); return name + ":westeros";
      case "PlayerReconcileArmiesGameState": {
        if (!commands(leaf.house)) return name + ":espera";
        // deixa só 1 unidade em cada área (sempre cabe no suprimento)
        const entries = regions().filter((r) => r.getController() == leaf.house && r.units.size > 1)
          .map((r) => [r, r.units.values.slice(1)]);
        leaf.reconcileArmies({ entries }); return name + ":ajuste";
      }
      default:
        return name;
    }
  } catch (e) {
    return name + ":erro " + e.message;
  }
}


const { account, BASE } = require("./flow");
(async () => {
  const browser = await chromium.launch((process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}));
  const live = process.env.MODE != "pbem";
  let pages;
  if (process.env.GAME) {
    pages = [];
    for (const n of ["jogador1", "jogador2", "jogador3"]) {
      const p = await account(browser, n);
      p.on("pageerror", (e) => console.log("[erro na página] " + e.message));
      await p.goto(process.env.GAME); pages.push(p);
    }
    await pages[0].waitForTimeout(8000);
  } else {
  const p1 = await account(browser, "jogador1");
  await p1.goto(BASE + "/games");
  const acc = await p1.$("button:has-text('Aceitar')"); if (acc) await acc.click();
  await p1.fill("#create-game-name", "Teste completo " + (live ? "ao vivo" : "PBEM"));
  await Promise.all([p1.waitForNavigation(), p1.click("#criar button[type=submit]")]);
  const gameUrl = p1.url();
  console.log("partida:", gameUrl);
  await p1.waitForSelector("#game-setups", { timeout: 60000 });
  await p1.waitForTimeout(2000);
  await p1.selectOption("#game-setups", "base-game"); await p1.waitForTimeout(800);
  await p1.selectOption("#player-count", "3"); await p1.waitForTimeout(800);
  if (live) { await p1.selectOption("#pbem-setting", "Live"); await p1.waitForTimeout(800); }
  await p1.screenshot({ path: out + "/00-lobby-dono.png" });
  pages = [p1];
  for (const n of ["jogador2", "jogador3"]) {
    const p = await account(browser, n);
    await p.goto(gameUrl); await p.waitForSelector("text=Escolher", { timeout: 60000 });
    pages.push(p);
  }
  for (const p of pages) {
    p.on("pageerror", (e) => console.log("[erro na página] " + e.message));
    const b = await p.$$("button:has-text('Escolher')"); await b[0].click(); await p.waitForTimeout(1500);
  }
  await p1.screenshot({ path: out + "/01-lobby-cheio.png" });
  await p1.click("button:has-text('Iniciar partida')");
  await p1.waitForTimeout(2500);
  if (live) {
    await p1.screenshot({ path: out + "/02-confirmar-presenca.png" });
    for (const p of pages) { const r = await p.$("button:has-text('Pronto')"); if (r) await r.click(); await p.waitForTimeout(800); }
  }
  await p1.waitForTimeout(8000);
  await p1.screenshot({ path: out + "/03-partida-comecou.png" });
  }
  const p1 = pages[0];
  const seen = new Set(); let shot = 4; let last = ""; let same = 0;
  for (let step = 0; step < STEPS; step++) {
    const results = [];
    for (const p of pages) results.push(await p.evaluate(botTick).catch((e) => "eval-erro " + e.message));
    const state = results.map((r) => r.split(":")[0]).join("|");
    if (state == last) same++; else { same = 0; last = state; }
    if (!seen.has(state)) {
      seen.add(state);
      const idx = Math.max(0, results.findIndex((r) => !/espera|pronto|sem-jogo/.test(r)));
      await pages[idx].waitForTimeout(1200);
      await pages[idx].screenshot({ path: `${out}/${String(shot++).padStart(3, "0")}-${results[idx].split(":")[0]}.png` });
    }
    if (step % 10 == 0 || same == 0) {
      const round = await p1.evaluate(() => window.gameClient.entireGame.ingameGameState?.game.turn).catch(() => "?");
      console.log(step, "rodada", round, results.join("  |  "));
    }
    if (results.some((r) => /GameEnded/.test(r))) { console.log("FIM DE JOGO"); break; }
    if (same == 40) { console.log("TRAVOU em", state); await pages[0].screenshot({ path: `${out}/travou.png` }); break; }
    await pages[0].waitForTimeout(900);
  }
  for (const [i, p] of pages.entries()) await p.screenshot({ path: `${out}/zz-fim-${i + 1}.png` });
  await browser.close();
})();
