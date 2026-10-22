using System.Net;
using agot_bg_website.Data;
using agot_bg_website.Domain;
using agot_bg_website.Services;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;

namespace agot_bg_website.Api;

/// <summary>
/// The game-server-facing notification endpoints, equivalent of Django's
/// api/views.py::notify_* + add_pbem_response_time — see MIGRATION_PLAN.md §6. Each POST body is
/// <c>{ "users": ["&lt;guid&gt;", ...] }</c>; mail is only sent to users with
/// <see cref="ApplicationUser.EmailNotificationActive"/> still on, mirroring Django's behavior.
/// Subjects/bodies are ported line-for-line from the corresponding
/// agotboardgame_main/templates/agotboardgame_main/*_notification.html templates.
/// </summary>
public static class NotificationsApi
{
    private sealed record NotifyRequest(List<Guid> Users);

    // (subject, body) builders, one per notify* route, preserving the wording/structure from the
    // matching agotboardgame_main/templates/agotboardgame_main/*_notification.html Django
    // template, but rendered as actual HTML because SMTP sends them with IsBodyHtml=true.
    private static readonly Dictionary<
        string,
        (Func<Game, string> Subject, Func<ApplicationUser, Game, string, string> Body)
    > Templates = new()
    {
        ["notifyReadyToStart"] = (
            game => $"Sua partida está pronta para começar: {game.Name}",
            (user, game, gameUrl) =>
                BuildNotificationEmailHtml(
                    user,
                    $"Sua partida &quot;{HtmlEncode(game.Name)}&quot; está pronta para começar:",
                    gameUrl
                )
        ),
        ["notifyYourTurn"] = (
            game => $"É a sua vez em '{game.Name}'",
            (user, game, gameUrl) =>
                BuildNotificationEmailHtml(
                    user,
                    $"É a sua vez de jogar em &quot;{HtmlEncode(game.Name)}&quot;:",
                    gameUrl
                )
        ),
        ["notifyBribeForSupport"] = (
            game => $"Você foi atacado e pode pedir apoio em '{game.Name}'",
            (user, game, gameUrl) =>
                BuildNotificationEmailHtml(
                    user,
                    $"Você foi atacado na partida &quot;{HtmlEncode(game.Name)}&quot; e agora pode pedir apoio ou tentar comprá-lo:",
                    gameUrl
                )
        ),
        ["notifyBattleResults"] = (
            game => $"Sua batalha terminou em '{game.Name}'",
            (user, game, gameUrl) =>
                BuildNotificationEmailHtml(
                    user,
                    $"Sua batalha em &quot;{HtmlEncode(game.Name)}&quot; terminou:",
                    gameUrl
                )
        ),
        ["notifyNewVote"] = (
            game => $"Precisamos do seu voto em '{game.Name}'",
            (user, game, gameUrl) =>
                BuildNotificationEmailHtml(
                    user,
                    $"Uma nova votação começou em &quot;{HtmlEncode(game.Name)}&quot;:",
                    gameUrl
                )
        ),
        ["notifyGameEnded"] = (
            game => $"A partida terminou: {game.Name}",
            (user, game, gameUrl) =>
                BuildNotificationEmailHtml(
                    user,
                    $"A partida &quot;{HtmlEncode(game.Name)}&quot; terminou:",
                    gameUrl
                )
        ),
    };

    internal static string BuildBodyHtml(
        string route,
        ApplicationUser user,
        Game game,
        string gameUrl
    ) => Templates[route].Body(user, game, gameUrl);

    internal static string BuildNotificationEmailHtml(
        ApplicationUser user,
        string explanationHtml,
        string gameUrl
    )
    {
        var encodedGameUrl = HtmlEncode(gameUrl);

        return EmailTemplates.Build(
            user.UserName,
            user.Email,
            $"""
            <p>{explanationHtml}</p>
            <p><a href="{encodedGameUrl}">{encodedGameUrl}</a></p>
            """
        );
    }

    private static string HtmlEncode(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

    public static RouteGroupBuilder MapNotificationsApi(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api")
            .RequireAuthorization(Infrastructure.Auth.MasterApiAuthenticationHandler.SchemeName);

        group.MapPost(
            "/addPbemResponseTime/{userId:guid}/{responseTime:int}",
            async (Guid userId, int responseTime, ApplicationDbContext db) =>
            {
                db.PbemResponseTimes.Add(
                    new PbemResponseTime
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        ResponseTime = responseTime,
                    }
                );
                await db.SaveChangesAsync();
                return Results.NoContent();
            }
        );

        foreach (var (route, template) in Templates)
        {
            group.MapPost(
                $"/{route}/{{gameId:guid}}",
                async (
                    Guid gameId,
                    NotifyRequest body,
                    HttpContext ctx,
                    ApplicationDbContext db,
                    IEmailSender emailSender,
                    IConfiguration configuration
                ) =>
                {
                    var game = await db
                        .Games.AsNoTracking()
                        .FirstOrDefaultAsync(g => g.Id == gameId);
                    if (game is null)
                    {
                        return Results.NotFound();
                    }

                    var users = await db
                        .Users.Where(u =>
                            body.Users.Contains(u.Id)
                            && u.EmailNotificationActive
                            && u.Email != null
                        )
                        .ToListAsync();

                    // This endpoint only ever runs on the private GameServerApi Kestrel endpoint
                    // (see Program.cs's RequireLocalPort(gameServerApiPort)) - the TypeScript game
                    // server dials that internal-only port/host directly, so ctx.Request.Host
                    // here would be that internal address (e.g. "localhost:8001"), not the public
                    // site humans actually browse to. Use the configured public site URL instead;
                    // only fall back to the request's own host if it's not configured.
                    var publicSiteUrl = (
                        configuration["PublicSiteUrl"]
                        ?? $"{ctx.Request.Scheme}://{ctx.Request.Host}"
                    ).TrimEnd('/');
                    var gameUrl = $"{publicSiteUrl}/play/{gameId}";
                    var subject = template.Subject(game);

                    foreach (var user in users)
                    {
                        await emailSender.SendEmailAsync(
                            user.Email!,
                            subject,
                            template.Body(user, game, gameUrl)
                        );
                    }

                    return Results.Ok(new { status = "ok" });
                }
            );
        }

        return group;
    }
}
