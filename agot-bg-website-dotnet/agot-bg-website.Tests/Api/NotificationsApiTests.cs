using agot_bg_website.Api;
using agot_bg_website.Domain;
using Xunit;

namespace agot_bg_website.Tests.Api;

public class NotificationsApiTests
{
    public static TheoryData<string, string> HtmlTemplateCases =>
        new()
        {
            { "notifyReadyToStart", "está pronta para começar:" },
            { "notifyYourTurn", "É a sua vez de jogar em" },
            {
                "notifyBribeForSupport",
                "e agora pode pedir apoio ou tentar comprá-lo:"
            },
            { "notifyBattleResults", "Sua batalha em" },
            { "notifyNewVote", "Uma nova votação começou em" },
            { "notifyGameEnded", "terminou:" },
        };

    [Theory]
    [MemberData(nameof(HtmlTemplateCases))]
    public void BuildBodyHtml_RendersHtmlParagraphsAndClickableLink(
        string route,
        string expectedSnippet
    )
    {
        var user = new ApplicationUser { UserName = "Arya" };
        var game = new Game { Name = "Clash for Westeros" };
        const string gameUrl = "https://swordsandravens.net/play/123";

        var html = NotificationsApi.BuildBodyHtml(route, user, game, gameUrl);

        Assert.Contains("<p>Olá, Arya!</p>", html);
        Assert.Contains(expectedSnippet, html);
        Assert.Contains(
            "<p><a href=\"https://swordsandravens.net/play/123\">https://swordsandravens.net/play/123</a></p>",
            html
        );
        Assert.Contains("<p>Um abraço,<br />Equipe do Swords and Ravens</p>", html);
    }

    [Fact]
    public void BuildBodyHtml_HtmlEncodesDynamicUserGameAndUrlContent()
    {
        var user = new ApplicationUser { UserName = "Player <One> & Co" };
        var game = new Game { Name = "Foo & <Bar>" };
        const string gameUrl = "https://example.com/play/123?name=foo&mode=\"pbem\"";

        var html = NotificationsApi.BuildBodyHtml("notifyReadyToStart", user, game, gameUrl);

        Assert.Contains("Olá, Player &lt;One&gt; &amp; Co!", html);
        Assert.Contains("Sua partida &quot;Foo &amp; &lt;Bar&gt;&quot; está pronta para começar:", html);
        Assert.Contains(
            "<a href=\"https://example.com/play/123?name=foo&amp;mode=&quot;pbem&quot;\">https://example.com/play/123?name=foo&amp;mode=&quot;pbem&quot;</a>",
            html
        );
        Assert.DoesNotContain("Olá, Player <One> & Co!", html);
        Assert.DoesNotContain("Sua partida &quot;Foo & <Bar>&quot; está pronta para começar:", html);
        Assert.DoesNotContain(
            "<a href=\"https://example.com/play/123?name=foo&mode=\"pbem\"\">",
            html
        );
    }
}
