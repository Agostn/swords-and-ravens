// Mesa de Batalha no jogo completo, no modo de teste local (sem site): 3 abas (#1, #2, #3) jogam sozinhas com a
// opção "Mesa de Batalha" ligada; nas batalhas, a Mesa é usada PELA TELA (iframe): Pronto → ordem → Confirmar,
// Corvo → Manter, e todos assistem à luta até o fim. Uso: node mesa-e2e.js <pasta-de-prints> <passos> [mesas]
// Precisa do servidor (yarn run-server) e do cliente (yarn run-client) do modo de teste ligados.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("fs");
const out = process.argv[2] || "mesa";
const STEPS = Number(process.argv[3] || 200);
const WANT = Number(process.argv[4] || 3);
const BASE = process.env.BASE || "http://localhost:8080/static/";
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
        const target = targets.find((t) => t.getController() != null && t.getController() != leaf.house && (t.units.size > 0 || t.garrison > 0)) || targets.find((t) => t.getController() == null) || targets[0];
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



async function handleMesa(p, tag, log) {
  const fr = await p.$(".mesa-de-batalha-overlay iframe");
  if (!fr) return false;
  const f = await fr.contentFrame();
  if (!f) return true;
  await p.waitForTimeout(400);
  const vis = async (sel) => { const e = await f.$(sel); return e && (await e.isVisible()); };
  if (await vis("#tac-ok")) {
    const opts = await f.$$(".tac-card:not([disabled])");
    await opts[Math.floor(Math.random() * opts.length)].click();
    await p.screenshot({ path: `${out}/${tag}-ordem.png` });
    await f.click("#tac-ok");
    log("ordem de batalha escolhida");
    return true;
  }
  if (await vis("#close-embed")) {
    await p.screenshot({ path: `${out}/${tag}-resultado.png`, fullPage: false });
    await f.click("#close-embed");
    log("assistiu e fechou");
    return true;
  }
  if (await vis("#skip")) {
    await p.screenshot({ path: `${out}/${tag}-luta.png` });
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `${out}/${tag}-luta2.png` });
    await f.click("#skip");
    return true;
  }
  if (await vis("#tut-close")) { await f.click("#tut-close"); return true; }
  if (await vis("#ready")) {
    const enabled = await f.$eval("#ready", (b) => !b.disabled);
    await p.screenshot({ path: `${out}/${tag}-mesa.png` });
    if (!enabled) {
      // nada no campo ainda: põe a primeira peça numa casinha
      const box = await (await f.$("#board")).boundingBox();
      await f.click(".piece", { timeout: 2000 }).catch(() => {});
      await p.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.7);
      return true;
    }
    await f.click("#ready");
    log("Pronto na Mesa");
    return true;
  }
  return true;
}

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const pages = [];
  for (const n of [1, 2, 3]) {
    const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    p.on("pageerror", (e) => console.log(`[#${n} erro na página] ${e.message}`));
    p.on("console", (m) => { if (m.type() == "error" && !/favicon|404/.test(m.text())) console.log(`[#${n} console] ${m.text().slice(0, 200)}`); });
    await p.goto(BASE + (process.env.PROD ? "?u=" + n : "") + "#" + n);
    pages.push(p);
  }
  await pages[0].waitForTimeout(6000);
  const state = () => pages[0].evaluate(() => window.gameClient && window.gameClient.entireGame && window.gameClient.entireGame.leafState.constructor.name);
  if ((await state()) == "LobbyGameState") {
    await pages[0].evaluate(() => {
      const eg = window.gameClient.entireGame;
      const s = eg.gameSettings;
      s.setupId = "base-game"; s.playerCount = 3; s.tacticalCombat = true; s.pbem = true;
      eg.updateGameSettings(s);
    });
    await pages[0].waitForTimeout(1500);
    for (const p of pages) {
      await p.evaluate(() => {
        const lobby = window.gameClient.entireGame.leafState;
        const free = lobby.lobbyHouses.values.filter((h) => !lobby.players.has(h));
        lobby.chooseHouse(free[0], "");
      });
      await p.waitForTimeout(1200);
    }
    await pages[0].evaluate(() => window.gameClient.entireGame.leafState.start());
    await pages[0].waitForTimeout(6000);
  }
  console.log("estado:", await state(), "Mesa ligada:", await pages[0].evaluate(() => window.gameClient.entireGame.gameSettings.tacticalCombat));
  let mesas = 0; let last = ""; let same = 0;
  for (let step = 0; step < STEPS && mesas < WANT; step++) {
    const res = [];
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const tag = `m${mesas}-p${i + 1}-s${step}`;
      const handled = await handleMesa(p, tag, (m) => console.log(`#${i + 1} ${m}`)).catch((e) => { console.log("mesa erro", e.message); return true; });
      if (handled) { res.push("mesa"); continue; }
      res.push(await p.evaluate(botTick).catch((e) => "erro " + e.message));
    }
    const leaf = await state();
    if (leaf == "TacticalBattleGameState" && last != leaf) { mesas++; console.log(`--- Mesa ${mesas} (passo ${step})`); await pages[0].screenshot({ path: `${out}/mesa${mesas}-painel.png` }); }
    if (leaf == last) same++; else same = 0;
    if (same == 40) { console.log("TRAVOU em", leaf, res.join(" | ")); await pages[0].screenshot({ path: `${out}/travou.png` }); }
    last = leaf;
    if (step % 10 == 0) console.log(step, leaf, res.join(" | "));
    await pages[0].waitForTimeout(500);
  }
  // espera a última luta terminar e confere que ninguém ficou preso
  for (let k = 0; k < 20; k++) {
    for (let i = 0; i < pages.length; i++) await handleMesa(pages[i], `fim-p${i + 1}-${k}`, (m) => console.log(`#${i + 1} ${m}`)).catch(() => {});
    await pages[0].waitForTimeout(700);
  }
  const logs = await pages[0].evaluate(() => window.gameClient.entireGame.ingameGameState.gameLogManager.logs.filter((l) => l.data.type == "tactical-battle-result" || l.data.type == "combat-result").map((l) => JSON.stringify({ t: l.data.type, w: l.data.winner, lanes: l.data.lanesWon })));
  console.log("logs:\n" + logs.join("\n"));
  console.log("mesas:", mesas, "estado final:", await state());
  await browser.close();
})();
