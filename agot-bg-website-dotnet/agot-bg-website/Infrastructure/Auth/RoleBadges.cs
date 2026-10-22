namespace agot_bg_website.Infrastructure.Auth;

/// <summary>
/// Badge color per role, mirroring Django's settings.GROUP_COLORS (bootstrap contextual names
/// mapped onto their DaisyUI badge-* equivalents). Shared between the public profile page
/// (<c>Pages/User.cshtml.cs</c>) and the public users directory (<c>Pages/Users.cshtml.cs</c>) so
/// both render role badges identically.
/// </summary>
public static class RoleBadges
{
    public static readonly IReadOnlyDictionary<string, string> Classes = new Dictionary<
        string,
        string
    >
    {
        [RoleNames.Admin] = "badge-error",
        [RoleNames.HighMember] = "badge-info",
        [RoleNames.Banned] = "badge-error",
        [RoleNames.OnProbation] = "badge-warning",
        [RoleNames.Tongueless] = "badge-warning",
    };

    /// <summary>
    /// Nome da função mostrado na tela, em português. O nome guardado no banco (RoleNames)
    /// continua em inglês: não traduzir lá, senão as permissões param de funcionar.
    /// </summary>
    public static string DisplayName(string role) =>
        role switch
        {
            RoleNames.Member => "Membro",
            RoleNames.Admin => "Admin",
            RoleNames.HighMember => "Membro Ilustre",
            RoleNames.Banned => "Banido",
            RoleNames.OnProbation => "Em observação",
            RoleNames.Tongueless => "Sem Língua",
            _ => role,
        };

    /// <summary>Taxa de vitória no formato brasileiro (ex.: "45,5%"); "—" quando não há.</summary>
    public static string FormatWinRate(double? winRate) =>
        winRate.HasValue
            ? (winRate.Value * 100).ToString("F1", System.Globalization.CultureInfo.GetCultureInfo("pt-BR")) + "%"
            : "—";
}
