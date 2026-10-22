using agot_bg_website.Areas.Identity.Pages.Account;
using Xunit;

namespace agot_bg_website.Tests.Areas.Identity.Pages.Account;

/// <summary>
/// Covers the "registering with an email that already belongs to an account must be forbidden,
/// with a message pointing at the right sign-in method" requirement (see MIGRATION_PLAN.md §14).
/// </summary>
public class RegisterModelTests
{
    [Fact]
    public void BuildDuplicateAccountErrorMessage_LocalPasswordAccount_TellsVisitorToLogIn()
    {
        var message = RegisterModel.BuildDuplicateAccountErrorMessage(
            hasPassword: true,
            externalProviderNames: []
        );

        Assert.Equal("Já existe uma conta com este e-mail. Entre com ela.", message);
    }

    [Fact]
    public void BuildDuplicateAccountErrorMessage_ExternalOnlyAccount_NamesTheProvider()
    {
        var message = RegisterModel.BuildDuplicateAccountErrorMessage(
            hasPassword: false,
            externalProviderNames: ["Google"]
        );

        Assert.Contains("Google", message);
        Assert.Contains("Entre com o Google", message);
        Assert.Contains("depois você pode criar uma senha", message);
    }

    [Fact]
    public void BuildDuplicateAccountErrorMessage_MultipleProviders_JoinsWithOr()
    {
        var message = RegisterModel.BuildDuplicateAccountErrorMessage(
            hasPassword: false,
            externalProviderNames: ["Google", "Discord"]
        );

        Assert.Contains("Google ou Discord", message);
    }

    [Fact]
    public void BuildDuplicateAccountErrorMessage_ExternalOnlyAccount_NoProviderNamesFallsBackToGenericWording()
    {
        var message = RegisterModel.BuildDuplicateAccountErrorMessage(
            hasPassword: false,
            externalProviderNames: []
        );

        Assert.Contains("um serviço externo", message);
    }
}
