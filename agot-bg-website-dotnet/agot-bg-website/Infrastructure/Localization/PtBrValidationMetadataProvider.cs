using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.DataAnnotations;
using Microsoft.AspNetCore.Mvc.ModelBinding.Metadata;
using Microsoft.Extensions.Localization;

namespace agot_bg_website.Infrastructure.Localization;

/// <summary>
/// Põe mensagens em português nos atributos de validação ([Required], [StringLength],
/// [EmailAddress]...) que não definiram a própria mensagem. Sem isso o .NET mostra
/// "The Email field is required." etc. Vale também para a validação no navegador,
/// que lê as mesmas mensagens.
/// </summary>
public sealed class PtBrValidationMetadataProvider : IValidationMetadataProvider
{
    public void CreateValidationMetadata(ValidationMetadataProviderContext context)
    {
        foreach (var item in context.ValidationMetadata.ValidatorMetadata)
        {
            if (item is not ValidationAttribute attribute)
            {
                continue;
            }

            Translate(attribute);
        }
    }

    /// <summary>
    /// Troca a mensagem do atributo pela versão em português, a não ser que alguém já tenha
    /// escrito uma mensagem própria. Atenção: alguns atributos ([EmailAddress], [Phone], [Url])
    /// já vêm com um texto padrão em inglês ("The {0} field is not a valid..."), que também
    /// conta como "não personalizado".
    /// </summary>
    internal static void Translate(ValidationAttribute attribute)
    {
        if (!string.IsNullOrEmpty(attribute.ErrorMessageResourceName))
        {
            return;
        }
        var current = attribute.ErrorMessage;
        var isDefault =
            string.IsNullOrEmpty(current) || current.StartsWith("The {0} field", StringComparison.Ordinal);
        if (!isDefault)
        {
            return;
        }
        var message = MessageFor(attribute);
        if (message is not null)
        {
            attribute.ErrorMessage = message;
        }
    }

    // {0} = nome do campo; os outros números seguem a ordem que cada atributo usa no original.
    internal static string? MessageFor(ValidationAttribute attribute) =>
        attribute switch
        {
            RequiredAttribute => "O campo {0} é obrigatório.",
            StringLengthAttribute { MinimumLength: > 0 } =>
                "O campo {0} precisa ter entre {2} e {1} caracteres.",
            StringLengthAttribute => "O campo {0} pode ter no máximo {1} caracteres.",
            MaxLengthAttribute => "O campo {0} pode ter no máximo {1} caracteres.",
            MinLengthAttribute => "O campo {0} precisa ter pelo menos {1} caracteres.",
            EmailAddressAttribute => "O campo {0} não é um e-mail válido.",
            System.ComponentModel.DataAnnotations.CompareAttribute =>
                "Os campos {0} e {1} não são iguais.",
            RangeAttribute => "O campo {0} precisa estar entre {1} e {2}.",
            RegularExpressionAttribute => "O campo {0} está num formato inválido.",
            UrlAttribute => "O campo {0} não é um endereço válido.",
            PhoneAttribute => "O campo {0} não é um telefone válido.",
            _ => null,
        };

    /// <summary>Mensagens de quando o valor digitado nem consegue ser lido (ex.: texto num campo de número).</summary>
    public static void ConfigureBindingMessages(MvcOptions options)
    {
        var messages = options.ModelBindingMessageProvider;
        messages.SetAttemptedValueIsInvalidAccessor((value, field) =>
            $"O valor '{value}' não é válido para {field}."
        );
        messages.SetMissingBindRequiredValueAccessor(field =>
            $"Não foi enviado um valor para {field}."
        );
        messages.SetMissingKeyOrValueAccessor(() => "É preciso informar um valor.");
        messages.SetMissingRequestBodyRequiredValueAccessor(() =>
            "O corpo da requisição é obrigatório."
        );
        messages.SetNonPropertyAttemptedValueIsInvalidAccessor(value =>
            $"O valor '{value}' não é válido."
        );
        messages.SetNonPropertyUnknownValueIsInvalidAccessor(() => "O valor informado não é válido.");
        messages.SetNonPropertyValueMustBeANumberAccessor(() => "O campo precisa ser um número.");
        messages.SetUnknownValueIsInvalidAccessor(field => $"O valor informado não é válido para {field}.");
        messages.SetValueIsInvalidAccessor(value => $"O valor '{value}' é inválido.");
        messages.SetValueMustBeANumberAccessor(field => $"O campo {field} precisa ser um número.");
        messages.SetValueMustNotBeNullAccessor(value => $"O valor '{value}' é inválido.");
    }
}

/// <summary>
/// Passa por aqui toda validação (no servidor e no navegador), inclusive os [Required] que o
/// MVC cria sozinho para campos que não podem ficar vazios (ex.: caixas de marcar). Traduz a
/// mensagem e depois entrega para o provedor padrão do .NET.
/// </summary>
public sealed class PtBrValidationAttributeAdapterProvider : IValidationAttributeAdapterProvider
{
    private readonly ValidationAttributeAdapterProvider _inner = new();

    public IAttributeAdapter? GetAttributeAdapter(
        ValidationAttribute attribute,
        IStringLocalizer? stringLocalizer
    )
    {
        PtBrValidationMetadataProvider.Translate(attribute);
        return _inner.GetAttributeAdapter(attribute, stringLocalizer);
    }
}
