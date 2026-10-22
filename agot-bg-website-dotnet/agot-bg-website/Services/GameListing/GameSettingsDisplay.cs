using System.Text.Json;
using agot_bg_website.Domain;

namespace agot_bg_website.Services.GameListing;

/// <summary>
/// Friendly display names for a game's `ViewOfGame.settings` blob, used to summarize a game's
/// setup/settings in the games-list "gear" popup on Games/MyGames/User (see _GamesTable.cshtml
/// and Pages/User.cshtml). Mirrors the client's src/client/GameSettingsComponent.tsx labels
/// verbatim and data/baseGameData.json's per-setup `name` fields - never touches SerializedGame,
/// only the small ViewOfGame JSON already loaded for every other games-list column.
/// </summary>
public static class GameSettingsDisplay
{
    /// <summary>setupId -> the exact display name from data/baseGameData.json's `setups.*.name`.</summary>
    public static readonly IReadOnlyDictionary<string, string> SetupNames = new Dictionary<
        string,
        string
    >
    {
        ["base-game"] = "Jogo Base – 2ª edição (3–6 jogadores)",
        ["mother-of-dragons"] = "Mãe dos Dragões (7 ou 8 jogadores)",
        ["a-dance-with-dragons"] = "A Dança dos Dragões (6 jogadores)",
        ["a-feast-for-crows"] = "O Festim dos Corvos (4 jogadores)",
        ["a-dance-with-mother-of-dragons"] = "A Dança com a Mãe dos Dragões (8 jogadores)",
        ["struggle-in-the-north"] = "Luta pelo Norte (4 ou 5 jogadores)",
        ["rumble-in-the-south"] = "Confusão no Sul (4 jogadores)",
        ["race-to-kings-landing"] = "Corrida a Porto Real (5 jogadores)",
        ["no-kraken-for-dinner"] = "Sem Kraken no Jantar (5 jogadores)",
        ["learn-the-game"] = "Ensinar o Jogo (2 jogadores)",
    };

    /// <summary>
    /// Boolean GameSettings.ts field -> the exact label text from GameSettingsComponent.tsx's
    /// &lt;label&gt;s. Deliberately covers every boolean field GameSettings.ts declares - leaving
    /// one out would silently make a true setting vanish from the summary rather than fall back
    /// to something readable. "pbem" is handled separately in <see cref="GetEnabledSettingLabels"/>
    /// since, unlike every other entry here, it must always show up first - as either "Play By
    /// E-Mail" or "Live" - rather than only appearing when true.
    /// </summary>
    private static readonly IReadOnlyDictionary<string, string> SettingLabels = new Dictionary<
        string,
        string
    >
    {
        ["onlyLive"] = "Relógio de jogo",
        ["fixedClock"] = "Relógio fixo",
        ["startWhenFull"] = "Começar quando lotar",
        ["adwdHouseCards"] = "Cartas de Casa de A Dança dos Dragões",
        ["asosHouseCards"] = "Cartas de Casa de A Tormenta de Espadas",
        ["firstEditionHouseCards"] = "Cartas de Casa da 1ª edição",
        ["vassals"] = "Mãe dos Dragões: Vassalos",
        ["ironBank"] = "Mãe dos Dragões: Banco de Ferro",
        ["seaOrderTokens"] = "Mãe dos Dragões: Ordens Marítimas",
        ["allowGiftingPowerTokens"] = "Mãe dos Dragões: Presentear Fichas de Poder",
        ["tidesOfBattle"] = "Marés de Batalha",
        ["removeTob3"] = "Extra: Tirar as cartas de 3 das Marés",
        ["removeTobSkulls"] = "Extra: Tirar as caveiras das Marés",
        ["limitTob2"] = "Extra: Limitar cartas de 2 das Marés",
        ["cokWesterosPhase"] = "Fase de Westeros de A Fúria dos Reis",
        ["customBalancing"] = "Extra: Balanceamento da comunidade",
        ["houseCardsEvolution"] = "Extra: Evolução das cartas de Casa",
        ["addPortToTheEyrie"] = "Extra: Adicionar um porto ao Ninho da Águia",
        ["randomVassalAssignment"] = "Extra: Distribuir vassalos aleatoriamente",
        ["dragonWar"] = "Extra: Guerra dos Dragões",
        ["dragonRevenge"] = "Extra: Vingança do Dragão",
        ["fogOfWar"] = "Extra: Névoa de guerra",
        ["mixedWesterosDeck1"] = "Extra: Baralho de Westeros I misto",
        ["precedingMustering"] = "Extra: Recrutamento antes do início",
        ["randomStartPositions"] = "Extra: Posições iniciais aleatórias",
        ["useVassalPositions"] = "Extra: Posições iniciais de vassalo",
        ["holdVictoryPointsUntilEndOfRound"] = "Extra: Pontos de vitória só no fim da rodada",
        ["draftHouseCards"] = "Extra: Draft de cartas de Casa",
        ["thematicDraft"] = "Extra: Draft temático",
        ["selectedRandomDraft"] = "Extra: Draft com sorteio",
        ["randomDraft"] = "Extra: Draft aleatório",
        ["blindDraft"] = "Extra: Draft às cegas",
        ["limitedDraft"] = "Extra: Draft limitado",
        ["draftTracks"] = "Extra: Draft das Trilhas de Influência",
        ["perpetuumRandom"] = "Extra: Aleatório sem fim",
        ["draftMap"] = "Extra: Draft do cenário",
        ["endless"] = "Extra: Partida sem fim (1000 rodadas)",
        ["private"] = "Partida privada",
        ["tournamentMode"] = "Partida de torneio",
        ["faceless"] = "Homens Sem Rosto (anônima)",
        ["randomHouses"] = "Casas aleatórias",
        ["randomChosenHouses"] = "Sortear só as Casas escolhidas",
        ["noPrivateChats"] = "Sem chats privados",
    };

    public static string GetSetupName(string? setupId) =>
        setupId is not null && SetupNames.TryGetValue(setupId, out var name)
            ? name
            : setupId ?? "Configuração desconhecida";

    /// <summary>
    /// Every boolean setting that's true on this game, in GameSettings.ts's own declaration order.
    /// A couple of settings get an inline numeric suffix, matching what the in-game settings UI
    /// shows right next to that same checkbox (the live-clock length, the evolution round).
    /// </summary>
    public static List<string> GetEnabledSettingLabels(
        JsonDocument? viewOfGame,
        GameState gameState
    )
    {
        var labels = new List<string>();
        if (viewOfGame is null)
        {
            return labels;
        }

        if (
            !viewOfGame.RootElement.TryGetProperty("settings", out var settingsEl)
            || settingsEl.ValueKind != JsonValueKind.Object
        )
        {
            return labels;
        }

        // Every game is either PBEM or live - unlike every other setting below, this is never
        // "absent" so it always leads the list rather than only appearing when true.
        var isPbem =
            settingsEl.TryGetProperty("pbem", out var pbemEl)
            && pbemEl.ValueKind == JsonValueKind.True;
        labels.Add(isPbem ? "Por turnos (PBEM)" : "Ao vivo");

        foreach (var (key, label) in SettingLabels)
        {
            if (key == "startWhenFull" && gameState != GameState.InLobby)
            {
                continue;
            }

            if (
                !settingsEl.TryGetProperty(key, out var valueEl)
                || valueEl.ValueKind != JsonValueKind.True
            )
            {
                continue;
            }

            var suffix = key switch
            {
                "onlyLive" when TryGetInt(settingsEl, "initialLiveClock", out var clock) =>
                    $" ({clock} min)",
                "houseCardsEvolution"
                    when TryGetInt(settingsEl, "houseCardsEvolutionRound", out var round) =>
                    $" (rodada {round})",
                _ => "",
            };
            labels.Add(label + suffix);
        }

        return labels;
    }

    private static bool TryGetInt(JsonElement obj, string name, out int value)
    {
        if (obj.TryGetProperty(name, out var el) && el.ValueKind == JsonValueKind.Number)
        {
            value = el.GetInt32();
            return true;
        }

        value = 0;
        return false;
    }
}
