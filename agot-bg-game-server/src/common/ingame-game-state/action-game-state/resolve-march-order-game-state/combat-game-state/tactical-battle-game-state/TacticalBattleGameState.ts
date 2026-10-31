/**
 * Mesa de Batalha (combate tático) no jogo completo.
 *
 * Vem depois de tudo que mexe na força (apoio, cartas, efeitos, Lâmina) e antes do resultado: os dois lados
 * posicionam as tropas no campo de 3 faixas (o campo depende da área: terreno, castelo, fortaleza ou mar).
 * A força TOTAL que o jogo calcula reforça as tropas na Mesa; quem vencer mais faixas vence a batalha.
 * Empate total: vence quem está na frente na trilha dos Feudos (a Lâmina), como no jogo original.
 * As baixas continuam iguais (espadas do vencedor − torres do perdedor, escolhidas por quem perdeu).
 *
 * Fases: "place" (cada lado manda a sua Mesa, sem ver a do outro) e, se o dono do Corvo Mensageiro estiver
 * na batalha, "react" (ele vê onde está o exército do outro e pode mudar 1 esquadrão).
 */
import CombatGameState from "../CombatGameState";
import GameState from "../../../../../GameState";
import House from "../../../../game-data-structure/House";
import { ClientMessage } from "../../../../../../messages/ClientMessage";
import Player from "../../../../Player";
import Game from "../../../../game-data-structure/Game";
import { ServerMessage } from "../../../../../../messages/ServerMessage";
import EntireGame from "../../../../../EntireGame";
import IngameGameState from "../../../../IngameGameState";
import User from "../../../../../../server/User";
import BetterMap from "../../../../../../utils/BetterMap";
import RegionKind from "../../../../game-data-structure/RegionKind";
import { observable } from "mobx";
import { v4 } from "uuid";
import _ from "lodash";
import { Lane, Side, Squad, TacticalBattleResult, resolveTacticalBattle } from "../../../../../tactical-battle/tacticalBattle";
import { FieldType, Role, Row, SquadKind, Tactic } from "../../../../../tactical-battle/tacticalBattleData";
import { getBattleField } from "../../../../../tactical-battle/tacticalFields";
import { PlacedSquad, TacticalPiece, buildSquads, isValidTactic, slotsOk } from "../../../../../tactical-battle/tacticalSetup";
import { isValidReaction } from "../../../../../tactical-battle/tacticalReaction";

const PIECE_KINDS: SquadKind[] = ["footman", "knight", "siege-engine", "ship", "dragon"];

/** O que a Mesa decidiu (fica no CombatGameState para o resultado e para a animação no fim). */
export interface TacticalOutcome {
  field: FieldType;
  attackerId: string;
  defenderId: string;
  winnerId: string;
  squads: { attacker: Squad[]; defender: Squad[] };
  tactics: { attacker: Tactic | null; defender: Tactic | null };
  totals: { attacker: number; defender: number };
  result: TacticalBattleResult;
  /** peças de quem perdeu que morreram depois (para a animação matar só elas) */
  killed: string[];
  /** a animação já foi mandada para todos */
  replayed?: boolean;
}

export default class TacticalBattleGameState extends GameState<CombatGameState> {
  field: FieldType;
  @observable phase: "place" | "react" = "place";
  pieces: BetterMap<House, TacticalPiece[]> = new BetterMap();
  @observable squads: BetterMap<House, Squad[]> = new BetterMap();
  tactics: BetterMap<House, Tactic | null> = new BetterMap();
  /** casas que já mandaram a Mesa (o cliente vê isso, mesmo sem ver a Mesa do outro) */
  @observable submitted: House[] = [];
  ravenHouse: House | null = null;

  get combat(): CombatGameState {
    return this.parentGameState;
  }

  get game(): Game {
    return this.combat.game;
  }

  get entireGame(): EntireGame {
    return this.combat.entireGame;
  }

  get ingame(): IngameGameState {
    return this.combat.ingameGameState;
  }

  get houses(): House[] {
    return [this.combat.attacker, this.combat.defender];
  }

  sideOf(house: House): Side {
    return house == this.combat.attacker ? "attacker" : "defender";
  }

  /** quem desempata (Lâmina de Aço Valiriano: o mais alto nos Feudos) */
  get bladeHouse(): House {
    return this.game.whoIsAheadInTrack(this.game.fiefdomsTrack, this.combat.attacker, this.combat.defender);
  }

  firstStart(): void {
    const region = this.combat.defendingRegion;
    this.field = getBattleField(region.id, region.type.kind != RegionKind.LAND, region.castleLevel);
    this.houses.forEach((h) => this.pieces.set(h, this.piecesOf(h)));
    const raven = this.game.ravenHolder;
    this.ravenHouse = this.houses.includes(raven) ? raven : null;

    // Sem peça que lute de um lado (ou forma que não cabe na Mesa): fica a batalha do jeito original
    const cantPlay = this.houses.some((h) => {
      const list = this.pieces.get(h);
      return list.length == 0 || "error" in buildSquads(list, null, this.field, this.sideOf(h));
    });
    if (cantPlay) {
      this.combat.onTacticalBattleEnd(null);
      return;
    }

    // quem só tem a guarnição não tem o que escolher: vai sozinho
    this.houses.forEach((h) => {
      if (this.pieces.get(h).every((p) => p.kind == "garrison")) this.autoSubmit(h);
    });
    this.checkAllSubmitted();
  }

  /** Peças que lutam (força > 0 nesta batalha, já com os efeitos das cartas). */
  piecesOf(house: House): TacticalPiece[] {
    const hcd = this.combat.houseCombatDatas.get(house);
    const list: TacticalPiece[] = hcd.army
      .filter((u) => PIECE_KINDS.includes(u.type.id as SquadKind))
      .map((u) => ({
        piece: String(u.id),
        kind: u.type.id as SquadKind,
        strength: this.combat.getCombatStrengthOfUnit(house, u, false)
      }))
      .filter((p) => p.strength > 0);
    if (house == this.combat.defender) {
      const g = this.combat.getGarrisonCombatStrength(house);
      if (g > 0) list.push({ piece: "garrison", kind: "garrison", strength: g });
    }
    return list;
  }

  autoSubmit(house: House): void {
    if (this.squads.has(house)) return;
    const built = buildSquads(this.pieces.get(house), null, this.field, this.sideOf(house));
    if ("error" in built) return;
    this.squads.set(house, built.squads);
    this.tactics.set(house, null);
    this.markSubmitted(house);
  }

  markSubmitted(house: House): void {
    if (!this.submitted.includes(house)) this.submitted.push(house);
    this.entireGame.broadcastToClients({ type: "tactical-battle-submitted", houseId: house.id });
  }

  checkAllSubmitted(): void {
    if (this.phase != "place" || !this.houses.every((h) => this.squads.has(h))) return;
    if (this.ravenHouse) {
      this.phase = "react";
      // manda o estado de novo: quem tem o Corvo passa a ver o exército do outro
      this.needsToBeTransmittedToClient = true;
      this.entireGame.leafStateId = v4();
      return;
    }
    this.resolve();
  }

  resolve(): void {
    const [attacker, defender] = this.houses;
    const totals = {
      attacker: Math.max(0, this.combat.getTotalCombatStrength(attacker)),
      defender: Math.max(0, this.combat.getTotalCombatStrength(defender))
    };
    const squads = { attacker: this.squads.get(attacker), defender: this.squads.get(defender) };
    const tactics = { attacker: this.tactics.tryGet(attacker, null), defender: this.tactics.tryGet(defender, null) };
    const blade = this.bladeHouse;
    const result = resolveTacticalBattle({
      field: this.field,
      attacker: { squads: squads.attacker, tactic: tactics.attacker, boardTotal: totals.attacker },
      defender: { squads: squads.defender, tactic: tactics.defender, boardTotal: totals.defender },
      bladeHolder: this.sideOf(blade)
    });
    const winner = result.winner == "attacker" ? attacker : result.winner == "defender" ? defender : blade;
    const outcome: TacticalOutcome = {
      field: this.field,
      attackerId: attacker.id,
      defenderId: defender.id,
      winnerId: winner.id,
      squads,
      tactics,
      totals,
      result,
      killed: []
    };
    this.ingame.log({
      type: "tactical-battle-result",
      winner: winner.id,
      attacker: attacker.id,
      defender: defender.id,
      lanesWon: [result.lanesWon.attacker, result.lanesWon.defender],
      duel: !!result.duel || !result.winner
    });
    this.combat.onTacticalBattleEnd(outcome);
  }

  onPlayerMessage(player: Player, message: ClientMessage): void {
    if (message.type == "tactical-battle-submit") {
      if (this.phase != "place") return;
      const house = this.houses.find((h) => h.id == message.houseId);
      if (!house || this.ingame.getControllerOfHouse(house) != player || this.squads.has(house)) return;
      const side = this.sideOf(house);
      const placed = Array.isArray(message.squads) ? (message.squads as unknown as PlacedSquad[]) : [];
      const built = buildSquads(this.pieces.get(house), placed, this.field, side);
      if ("error" in built) {
        console.warn(`tactical-battle-submit recusado (${house.id}): ${built.error}`);
        return;
      }
      this.squads.set(house, built.squads);
      this.tactics.set(house, isValidTactic(message.tactic, side) ? message.tactic : null);
      this.markSubmitted(house);
      this.checkAllSubmitted();
    } else if (message.type == "tactical-battle-react") {
      const raven = this.ravenHouse;
      if (this.phase != "react" || !raven || message.houseId != raven.id || this.ingame.getControllerOfHouse(raven) != player) return;
      const before = this.squads.get(raven);
      const sent = Array.isArray(message.squads) ? message.squads : [];
      const after: Squad[] = before.map((b) => {
        const s = sent.find((x) => x && x.id == b.id);
        return s && [0, 1, 2].includes(s.lane) ? { ...b, lane: s.lane as Lane, row: s.row as Row, role: s.role as Role } : b;
      });
      if (!isValidReaction(before, after, this.field) || !slotsOk(after, this.field)) {
        console.warn(`tactical-battle-react recusado (${raven.id})`);
        return;
      }
      this.squads.set(raven, after);
      this.resolve();
    }
  }

  getWaitedUsers(): User[] {
    if (this.phase == "react" && this.ravenHouse) return [this.ingame.getControllerOfHouse(this.ravenHouse).user];
    return _.uniq(this.houses.filter((h) => !this.squads.has(h)).map((h) => this.ingame.getControllerOfHouse(h).user));
  }

  actionAfterVassalReplacement(newVassal: House): void {
    // quem saiu do jogo (ou perdeu no relógio) vai com a Mesa padrão; o Corvo sem dono não muda nada
    if (!this.houses.includes(newVassal)) return;
    if (this.phase == "place") {
      this.autoSubmit(newVassal);
      this.checkAllSubmitted();
    } else if (this.ravenHouse == newVassal) {
      this.resolve();
    }
  }

  // ---------------------------------------------------------------- cliente
  canSeeSquadsOf(house: House, player: Player | null): boolean {
    if (!player) return false;
    if (this.ingame.safeGetControllerOfHouse(house) == player) return true;
    return this.phase == "react" && this.ravenHouse != null && this.ingame.safeGetControllerOfHouse(this.ravenHouse) == player;
  }

  submit(house: House, squads: PlacedSquad[], tactic: Tactic | null): void {
    this.entireGame.sendMessageToServer({
      type: "tactical-battle-submit",
      houseId: house.id,
      squads: squads.map((q) => ({ piece: q.piece, kind: q.kind, role: q.role, lane: q.lane, row: q.row })),
      tactic
    });
  }

  react(house: House, squads: Squad[]): void {
    this.entireGame.sendMessageToServer({
      type: "tactical-battle-react",
      houseId: house.id,
      squads: squads.map((s) => ({ id: s.id, role: s.role, lane: s.lane, row: s.row }))
    });
  }

  onServerMessage(message: ServerMessage): void {
    if (message.type == "tactical-battle-submitted") {
      const house = this.houses.find((h) => h.id == message.houseId);
      if (house && !this.submitted.includes(house)) this.submitted.push(house);
    }
  }

  serializeToClient(admin: boolean, player: Player | null): SerializedTacticalBattleGameState {
    const visible = (h: House): boolean => admin || this.canSeeSquadsOf(h, player);
    const own = (h: House): boolean => admin || (!!player && this.ingame.safeGetControllerOfHouse(h) == player);
    return {
      type: "tactical-battle",
      field: this.field,
      phase: this.phase,
      pieces: this.pieces.entries.map(([h, list]) => [h.id, list]),
      squads: this.squads.entries.filter(([h]) => visible(h)).map(([h, list]) => [h.id, list]),
      tactics: this.tactics.entries.filter(([h]) => own(h)).map(([h, t]) => [h.id, t]),
      submitted: this.submitted.map((h) => h.id),
      ravenHouse: this.ravenHouse ? this.ravenHouse.id : null
    };
  }

  static deserializeFromServer(combat: CombatGameState, data: SerializedTacticalBattleGameState): TacticalBattleGameState {
    const s = new TacticalBattleGameState(combat);
    const houses = combat.game.houses;
    s.field = data.field;
    s.phase = data.phase;
    s.pieces = new BetterMap(data.pieces.map(([id, list]) => [houses.get(id), list]));
    s.squads = new BetterMap(data.squads.map(([id, list]) => [houses.get(id), list]));
    s.tactics = new BetterMap(data.tactics.map(([id, t]) => [houses.get(id), t]));
    s.submitted = data.submitted.map((id) => houses.get(id));
    s.ravenHouse = data.ravenHouse ? houses.get(data.ravenHouse) : null;
    return s;
  }
}

export interface SerializedTacticalBattleGameState {
  type: "tactical-battle";
  field: FieldType;
  phase: "place" | "react";
  pieces: [string, TacticalPiece[]][];
  squads: [string, Squad[]][];
  tactics: [string, Tactic | null][];
  submitted: string[];
  ravenHouse: string | null;
}
