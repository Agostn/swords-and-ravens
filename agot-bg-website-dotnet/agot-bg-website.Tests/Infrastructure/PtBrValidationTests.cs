using System.ComponentModel.DataAnnotations;
using agot_bg_website.Infrastructure.Localization;
using Microsoft.AspNetCore.Identity;
using Xunit;

namespace agot_bg_website.Tests.Infrastructure;

/// <summary>Garante que as mensagens padrão do .NET aparecem em português.</summary>
public class PtBrValidationTests
{
    [Fact]
    public void Required_SemMensagemPropria_FicaEmPortugues()
    {
        var attribute = new RequiredAttribute();
        PtBrValidationMetadataProvider.Translate(attribute);
        Assert.Equal("O campo E-mail é obrigatório.", attribute.FormatErrorMessage("E-mail"));
    }

    [Fact]
    public void EmailAddress_TextoPadraoEmIngles_FicaEmPortugues()
    {
        // [EmailAddress] já vem com "The {0} field is not a valid e-mail address."
        var attribute = new EmailAddressAttribute();
        PtBrValidationMetadataProvider.Translate(attribute);
        Assert.Equal("O campo E-mail não é um e-mail válido.", attribute.FormatErrorMessage("E-mail"));
    }

    [Fact]
    public void MensagemPropria_NaoEhTrocada()
    {
        var attribute = new RequiredAttribute { ErrorMessage = "Mensagem minha." };
        PtBrValidationMetadataProvider.Translate(attribute);
        Assert.Equal("Mensagem minha.", attribute.FormatErrorMessage("X"));
    }

    [Fact]
    public void AdaptadorDoNavegador_TambemTraduz()
    {
        var attribute = new RequiredAttribute();
        var adapter = new PtBrValidationAttributeAdapterProvider().GetAttributeAdapter(attribute, null);
        Assert.NotNull(adapter);
        Assert.Equal("O campo Senha é obrigatório.", attribute.FormatErrorMessage("Senha"));
    }

    [Fact]
    public void ErrosDeConta_EmPortugues_MantendoOsCodigos()
    {
        var describer = new PtBrIdentityErrorDescriber();
        var error = describer.PasswordRequiresDigit();
        Assert.Equal("PasswordRequiresDigit", error.Code);
        Assert.Contains("número", error.Description);
        Assert.Contains("6", describer.PasswordTooShort(6).Description);
    }
}
