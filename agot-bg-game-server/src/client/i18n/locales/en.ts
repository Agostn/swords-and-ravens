// English texts (the original Swords and Ravens wording).
// This file defines the list of translation keys: every other language must
// translate every key listed here (TypeScript enforces it in pt-BR.ts).
// Allowed formatting tags inside texts: <b> <i> <small> <br/> <p> <ul> <li>.
// Parameters: {name}.

const en = {
  // ---------- Language ----------
  "language.label": "Language",

  // ---------- Lobby ----------
  "lobby.seat": "Seat {n}",
  "lobby.spectators": "Spectators:",
  "lobby.readyCheckOngoing": "Ready check is ongoing",
  "lobby.notEnoughPlayers":
    "More players must join to be able to start the game.",
  "lobby.targaryenMustBePlayer": "House Targaryen must be chosen by a player",
  "lobby.onlyOwnerCanStart": "Only the owner of the game can start it",
  "lobby.onlyOwnerCanCancel": "Only the owner of the game can cancel it",
  "lobby.start": "Start",
  "lobby.launchReadyCheck": "Launch Ready Check to start the game",
  "lobby.cancel": "Cancel",
  "lobby.confirmCancel": "Are you sure you want to cancel the game?",
  "lobby.mute": "Mute",
  "lobby.unmute": "Unmute",
  "lobby.volume.notifications": "Notifications",
  "lobby.volume.music": "Music",
  "lobby.volume.sfx": "Sfx",
  "lobby.password.ownerTooltip":
    "You can set a password here to prevent strangers from joining your game.",
  "lobby.password.joinTooltip":
    "Enter the password here to unlock and join the game.",
  "lobby.password.ownerPlaceholder": "Set password",
  "lobby.password.joinPlaceholder": "Enter the password to unlock the game",
  "lobby.ready": "Ready",
  "lobby.choose": "Choose",
  "lobby.leave": "Leave",
  "lobby.kick": "Kick",

  // ---------- Game setups ----------
  "setup.base-game": "2nd Edition Base Game (3-6p)",
  "setup.mother-of-dragons": "Mother of Dragons (7p/8p)",
  "setup.a-dance-with-dragons": "A Dance with Dragons (6p)",
  "setup.a-feast-for-crows": "A Feast for Crows (4p)",
  "setup.a-dance-with-mother-of-dragons": "A Dance with Mother of Dragons (8p)",
  "setup.struggle-in-the-north": "Struggle in the North (4p/5p)",
  "setup.rumble-in-the-south": "Rumble in the South (4p)",
  "setup.race-to-kings-landing": "Race to King's Landing (5p)",
  "setup.no-kraken-for-dinner": "No Kraken for Dinner (5p)",
  "setup.learn-the-game": "Teach the Game (2p)",

  "setupTooltip.base-game.title":
    "The official <i>A Game of Thrones Board Game - 2nd edition</i>",
  "setupTooltip.base-game.text":
    "This setup supports 3-player and 6-player modes. The rulebook is available online.<br/>The Neutral Force tokens for 4 and 5 players are not implemented, as the unofficial variants<br/>and the Vassals from the Mother of Dragons expansion are much better.",
  "setupTooltip.mother-of-dragons.title":
    "The official <i>Mother of Dragons</i> expansion",
  "setupTooltip.mother-of-dragons.text":
    "This expansion adds 2 additional houses: Arryn and Targaryen, as well as some more interesting mechanics:<br/>Vassals, Sea Orders and the Iron Bank. If the game is selected with 8 players and House Targaryen,<br/>a completely new map part 'Essos' is also added. The rulebook is available online.",
  "setupTooltip.a-dance-with-dragons.title":
    "The official <i>Dance with Dragons</i> expansion",
  "setupTooltip.a-dance-with-dragons.text":
    "This expansion thematically reflects a later point in the Game of Thrones story<br/>and therefore <i>lasts only <b>6</b> rounds!</i> It adds new house cards and new starting positions<br/>for all 6 houses from the base game.",
  "setupTooltip.a-feast-for-crows.title":
    "The official <i>A Feast for Crows</i> expansion",
  "setupTooltip.a-feast-for-crows.text":
    "This is a 4 player expansion. It adds House Arryn and a completely new way to score victory points.<br/>Instead of capturing castles you have to complete secret objectives.<br/>The exact rules can be found in the game as a tooltip in the Objectives tab.",
  "setupTooltip.a-dance-with-mother-of-dragons.title":
    "The unofficial <i>A Dance with Mother of Dragons</i> variant",
  "setupTooltip.a-dance-with-mother-of-dragons.text":
    "This is a community-created variant and combines <i>A Dance with Dragons</i> and Mother of Dragons.<br/>So it also <i>lasts only <b>6</b> rounds</i>, offers new starting positions and is played with the<br/>Dance with Dragons / Feast for Crows house cards and the Mother of Dragons B deck for Targaryen.",
  "setupTooltip.struggle-in-the-north.title":
    "The unofficial <i>Struggle in the North</i> variant",
  "setupTooltip.struggle-in-the-north.text":
    "This is a community-created variant for 4 and 5 players only.<br/>It is very similar to the base game with fewer players, but instead of Neutral Force tokens,<br/>the southern territories of House Martell and House Tyrell, respectively, are blocked areas.",
  "setupTooltip.rumble-in-the-south.title":
    "The unofficial <i>Rumble in the South</i> variant",
  "setupTooltip.rumble-in-the-south.text":
    "This is a community-created variant for 4 players only.<br/>House Stark and House Greyjoy do not participate and thus Pyke is blocked<br/>as well as almost all of North.",
  "setupTooltip.race-to-kings-landing.title":
    "The unofficial <i>Race to Kings Landing</i> variant",
  "setupTooltip.race-to-kings-landing.text":
    "This is a community-created variant for 5 players only.<br/>House Baratheon does not participate and thus Dragonstone is blocked.",
  "setupTooltip.no-kraken-for-dinner.title":
    "The unofficial <i>No Kraken for Dinner</i> variant",
  "setupTooltip.no-kraken-for-dinner.text":
    "This is a community-created variant for 5 players only.<br/>House Greyjoy does not participate and thus Pyke is blocked.",
  "setupTooltip.learn-the-game.title": "Teach the Game mode",
  "setupTooltip.learn-the-game.text":
    "This mode allows you to start the game with only 2 players to explain the basic mechanics to a friend.<br/>Additionally, the mode can be used with vassals from the Mother of Dragons expansion<br/>and the 'Random vassal assignment' option to make the game semi-playable with two players.<br/>However, victories do not count towards the win rate.",

  // ---------- Game settings ----------
  "settings.live.label": "Live Game",
  "settings.pbem.label": "Play By E-Mail",
  "settings.mode.tooltip":
    "<b>Live Game</b><br/>A live game can be played when all players are online. They are notified by sound when it is their turn.<br/><br/><b>P</b>lay <b>B</b>y <b>E</b>-<b>M</b>ail<br/>The asynchronous game mode. Players receive an e-mail when it is their turn. Those games are typically played over days or weeks.",
  "settings.startWhenFull.label": "Start when full",
  "settings.startWhenFull.tooltip":
    "If this option is enabled, the game will start automatically once all seats are taken.",
  "settings.gameClock.label": "Game clock",
  "settings.gameClock.tooltip":
    "If this option is enabled, each player will have a game clock of 30, 45, 60, 75, 90, or 120 minutes.<br/>When a player's time runs out, they are automatically turned into a vassal and this cannot be undone!<br/>The last remaining player immediately wins the game.<br/>All player clocks can be extended by vote: once for 15 minutes and a second time in the last round.<br/>After 2 failed voting attempts, no further voting can be initiated.<br/>These games can be paused, but public games will automatically resume after 10 minutes,<br/>and the game host will not be able to switch to PBEM in-game.",
  "settings.gameClock.minutes": "min",
  "settings.fixedClock.label": "Fixed clock",
  "settings.fixedClock.tooltip":
    "If this option is enabled, players will not be able to vote to extend their clocks.",
  "settings.private.label": "Private Game",
  "settings.private.tooltip":
    "Enable this option if you know all participants and want to prevent security and replacement mechanisms from being activated.",
  "settings.players": "Players",
  "settings.vps": "VPs",
  "settings.vps.tooltip":
    "Defines the number of Victory points needed to win the game.",
  "settings.lts": "LTs",
  "settings.lts.tooltip":
    "Defines the number of Loyalty tokens needed to win the game.",
  "settings.eyriePort.label": "Add a port to The Eyrie",
  "settings.eyriePort.tooltip":
    "If this option is enabled, the Eyrie has a port and House Arryn scores only 1 victory point for Mercantile Ventures (the objective about ports).",
  "settings.adwdCards.label": "Use <i>ADwD</i> House cards",
  "settings.adwdCards.tooltip":
    "If this option is enabled, the House cards from the <b>A Dance with Dragons</b> and <b>A Feast for Crows</b> expansions are used.",
  "settings.asosCards.label": "Use <i>ASoS</i> House cards",
  "settings.asosCards.tooltip":
    "If this option is enabled, the House cards from the 1st edition expansion <b>A Storm of Swords</b> are used.",
  "settings.firstEditionCards.label": "Use <i>1st edition</i> House cards",
  "settings.firstEditionCards.tooltip":
    "If this option is enabled, the House cards from the <b>1st edition</b> base game are used. Only available for up to 6 players, as the combat strengths of these cards differ from the 2nd edition and expansion cards.",
  "settings.cardsEvolution.label": "House cards evolution",
  "settings.cardsEvolution.tooltip":
    "This is a community variant that starts with the house cards from the base game. From round <b>5</b> onwards, each house receives its alternative deck when the last house card has been played.",
  "settings.cardsEvolution.round": "- Round:",
  "settings.customBalancing.label": "Custom Balancing",
  "settings.customBalancing.modTooltip":
    "A community proposal to avoid an early gang up against Targaryen. For details see",
  "settings.customBalancing.modLink": "Tex's balance proposal",
  "settings.customBalancing.tooltip":
    "A community proposal to improve Tyrell's starting position by adding a ship to the Redwyne Straights.",
  "settings.vassals.label": "MoD Vassals",
  "settings.vassals.tooltip":
    "Unassigned houses will be vassals introduced by the <b>Mother of Dragons</b> expansion.",
  "settings.ironBank.label": "MoD Iron Bank",
  "settings.ironBank.tooltip":
    "Enable the Iron Bank from the <b>Mother of Dragons</b> expansion. All player houses start with 7 Power tokens instead of 5.<br/><br/><i>Note: Enabling the Iron Bank makes the Iron Bank sea order available, even if sea orders are deactivated.</i>",
  "settings.seaOrders.label": "MoD Sea Order Tokens",
  "settings.seaOrders.tooltip":
    "Enable Sea Order tokens from the <b>Mother of Dragons</b> expansion.",
  "settings.giftPowerTokens.label": "MoD Gifting Power Tokens",
  "settings.giftPowerTokens.tooltip":
    "Players can freely gift Power tokens to other players.",
  "settings.randomVassalAssignment.label": "Random vassal assignment",
  "settings.randomVassalAssignment.tooltip":
    "Vassals are randomly assigned to the player houses.",
  "settings.dragonWar.label": "Dragon War",
  "settings.dragonWar.tooltip":
    "All houses except Targaryen will replace their starting knight with a dragon. <small><i>(Inspired by LordWazza)</i></small>",
  "settings.dragonRevenge.label": "Dragon Revenge",
  "settings.dragonRevenge.tooltip":
    "If a player has only one remaining non-dragon land unit and no more castles, it will turn into a dragon.",
  "settings.randomHouses.label": "Random houses",
  "settings.randomHouses.tooltip": "House assignments are created randomly.",
  "settings.randomChosenHouses.label": "Random chosen houses",
  "settings.randomChosenHouses.tooltip":
    "Only the selected house assignments are randomly exchanged. This allows you to designate player and vassal houses while still randomizing the player house assignments.",
  "settings.tidesOfBattle.label": "Tides of Battle",
  "settings.tidesOfBattle.tooltip":
    "Optional game module that enhances the risks and uncertainty of combat.",
  "settings.removeTob3.label": "Remove 3s cards from ToB",
  "settings.removeTob3.tooltip":
    "If this option is enabled, 3s cards will be removed from the Tides of Battle deck.",
  "settings.removeTobSkulls.label": "Remove skulls from ToB",
  "settings.removeTobSkulls.tooltip":
    "If this option is enabled, skull cards will be removed from the Tides of Battle deck.",
  "settings.limitTob2.label": "Limit ToB 2s cards",
  "settings.limitTob2.tooltip":
    "If this option is enabled, the Tides of Battle deck will only contain two 2s cards instead of four.",
  "settings.mixedWd1.label": "Mixed Westeros Deck 1",
  "settings.mixedWd1.tooltip":
    "If this option is enabled, one <b>Mustering</b> card will be replaced by <b>Rally The Men</b>, one <b>A Throne of Blades</b> card by <b>The Burden of Power</b> and the <b>Last Days of Summer</b> card by <b>Famine</b>.",
  "settings.cokWesterosPhase.label": "CoK Westeros Phase",
  "settings.cokWesterosPhase.tooltip":
    "Players may look at the next 3 Westeros cards from each deck at any time.",
  "settings.endless.label": "Endless",
  "settings.endless.tooltip": "The number of game rounds is increased to 1000.",
  "settings.faceless.label": "Faceless",
  "settings.faceless.tooltip":
    "Player names will be hidden and revealed after the game ends.",
  "settings.faceless.confirm":
    "Enabling Faceless is permanent and cannot be undone.\n\nAre you sure you want to enable Faceless?",
  "settings.fogOfWar.label": "Fog of War",
  "settings.fogOfWar.tooltip":
    "Limit visibility to controlled regions, adjacent regions, and regions you attack or are attacked from.",
  "settings.noPrivateChats.label": "Disable private chats",
  "settings.noPrivateChats.tooltip":
    "Players will not be able to create private chat rooms.",
  "settings.precedingMustering.label": "Preceding mustering",
  "settings.precedingMustering.tooltip":
    "All players can recruit units like during a mustering event in their castles before the game starts.",
  "settings.randomStartPositions.label": "Random start positions",
  "settings.randomStartPositions.tooltip":
    "Houses randomly change their start positions.",
  "settings.vassalPositions.label": "Vassal start positions",
  "settings.vassalPositions.tooltip":
    "Player houses will also start with their vassal starting positions.",
  "settings.holdVps.label": "Hold victory points",
  "settings.holdVps.tooltip":
    "When this option is enabled, players do not win immediately upon reaching the required number of victory points. Instead, they must hold the required victory points until the end of the round to win.",
  "settings.tournamentMode.label": "Tournament mode",
  "settings.tournamentMode.tooltip":
    "This option is intended for tournaments. It disables the ability to launch the following votes:<br/>Offer replacement, Replace vassal, Swap houses, Extend player clocks, Declare winner, Abort game, and End game.",
  "settings.draftHouseCards.label": "Draft House cards",
  "settings.draftHouseCards.tooltip":
    "Players will draft their House cards step by step in a randomly chosen order before the game starts.<br/>If <b>Draft Influence tracks</b> is enabled, players can also choose to draft a position on an Influence track instead of a House card.<br/>House cards can be chosen from all 2nd Edition Base Game House cards and from all expansions (ASoS, ADwD, AFfC, MoD) House cards.",
  "settings.thematicDraft.label": "Thematic Draft",
  "settings.thematicDraft.tooltip":
    "Players draft their House cards simultaneously from their house's available decks.",
  "settings.selectedRandomDraft.label": "Selected Random Draft",
  "settings.selectedRandomDraft.tooltip":
    "Players simultaneously draft the House cards to be used. After the draft, the cards and Influence positions, if <b>Draft Influence tracks</b> is enabled, are randomly assigned to houses. Can be combined with <b>Limited Draft</b>.",
  "settings.randomDraft.label": "Random Draft",
  "settings.randomDraft.tooltip":
    "Players receive random House cards and Influence positions if <b>Draft Influence tracks</b> is enabled. Can be combined with <b>Limited Draft</b>.",
  "settings.draftMap.label": "Draft Scenario",
  "settings.draftMap.tooltip":
    "<p>Players can adjust starting positions by adding and removing Units, Power tokens, or Garrisons.<br/><small>Unit and supply limits must be respected at all times.</small></p><p>Unclaimed territories are distributed fairly among houses:<ul><li>Territories with one neighboring house are assigned to that house.</li><li>Territories with multiple neighbors remain unassigned.</li></ul>All players must confirm changes before the game starts.</p>",
  "settings.draftTracks.label": "Draft Influence tracks",
  "settings.draftTracks.tooltip":
    "If this option is enabled, players can choose to draft a position on one of the three Influence tracks instead of drafting a House card during their draft turn.<br/>If enabled in <b>Random</b> or <b>Blind Draft</b> modes, Influence tracks will also be randomly assigned together with House cards.",
  "settings.limitedDraft.label": "Limited Draft",
  "settings.limitedDraft.tooltip":
    "This option removes house card decks from houses that are not in play.",
  "settings.blindDraft.label": "Blind Draft",
  "settings.blindDraft.tooltip":
    "Players receive random House cards and Influence positions if <b>Draft Influence tracks</b> is enabled. House cards remain hidden throughout the game. Can be combined with <b>Limited Draft</b>.",
  "settings.perpetuumRandom.label": "Perpetuum Random",
  "settings.perpetuumRandom.tooltip":
    "Players receive a new deck each time after the last House card has been played.",
  "settings.baseDeck.label": "2nd ed base and MoD A",
  "settings.baseDeck.tooltip":
    "This option adds the <b>2nd edition base game</b> decks and the <b>Mother of Dragons A</b> decks for <b>Arryn</b> and <b>Targaryen</b>.",
  "settings.alternativeDeck.label": "DwD, FfC and MoD B",
  "settings.alternativeDeck.tooltip":
    "This option adds the decks from the <b>Dance with Dragons</b> expansion for the base game houses, the <b>Feast for Crows</b> deck for <b>Arryn</b>, and the <b>Mother of Dragons B</b> deck for <b>Targaryen</b>.",
  "settings.sosDeck.label": "SoS and MoD A",
  "settings.sosDeck.tooltip":
    "This option adds the decks from the <b>Storm of Swords</b> expansion and the <b>Mother of Dragons A</b> decks for <b>Arryn</b> and <b>Targaryen</b>.",
  "settings.firstEditionDeck.label": "1st edition",
  "settings.firstEditionDeck.tooltip":
    "This option adds the decks from the <b>1st edition</b> base game.",

  // ---------- User settings ----------
  "userSettings.chatHouseNames.label": "House names for chat",
  "userSettings.chatHouseNames.tooltip":
    "Show house names instead of user names in chat windows.",
  "userSettings.mapScrollbar.label": "Map scrollbar (Desktop only)",
  "userSettings.mapScrollbar.tooltip":
    "Enables a fixed game map with a scrollbar. The map height then resizes with the actual window height. Keeping it activated won't affect the mobile experience.",
  "userSettings.gameStateColumnRight.label": "Game state column on the right",
  "userSettings.gameStateColumnRight.tooltip":
    "This setting swaps the houses column with the game state column, so that the game state column is displayed to the right of the map.",
  "userSettings.faq": "FAQ"
};

export default en;
