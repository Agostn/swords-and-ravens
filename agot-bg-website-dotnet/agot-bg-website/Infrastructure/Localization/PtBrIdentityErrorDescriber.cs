using Microsoft.AspNetCore.Identity;

namespace agot_bg_website.Infrastructure.Localization;

/// <summary>
/// Mensagens de erro de conta/senha do ASP.NET Core Identity em português do Brasil.
/// Os códigos (Code) continuam os mesmos do original: só o texto mostrado muda.
/// </summary>
public sealed class PtBrIdentityErrorDescriber : IdentityErrorDescriber
{
    private static IdentityError Error(string code, string description) =>
        new() { Code = code, Description = description };

    public override IdentityError DefaultError() =>
        Error(nameof(DefaultError), "Aconteceu um erro inesperado. Tente de novo.");

    public override IdentityError ConcurrencyFailure() =>
        Error(
            nameof(ConcurrencyFailure),
            "Os dados foram alterados por outra ação ao mesmo tempo. Recarregue a página e tente de novo."
        );

    public override IdentityError PasswordMismatch() =>
        Error(nameof(PasswordMismatch), "Senha incorreta.");

    public override IdentityError InvalidToken() =>
        Error(nameof(InvalidToken), "O link é inválido ou já expirou.");

    public override IdentityError RecoveryCodeRedemptionFailed() =>
        Error(nameof(RecoveryCodeRedemptionFailed), "O código de recuperação não funcionou.");

    public override IdentityError LoginAlreadyAssociated() =>
        Error(nameof(LoginAlreadyAssociated), "Já existe uma conta ligada a este login.");

    public override IdentityError InvalidUserName(string? userName) =>
        Error(
            nameof(InvalidUserName),
            $"O nome de usuário '{userName}' é inválido. Use só letras e números."
        );

    public override IdentityError InvalidEmail(string? email) =>
        Error(nameof(InvalidEmail), $"O e-mail '{email}' é inválido.");

    public override IdentityError DuplicateUserName(string userName) =>
        Error(nameof(DuplicateUserName), $"O nome de usuário '{userName}' já está em uso.");

    public override IdentityError DuplicateEmail(string email) =>
        Error(nameof(DuplicateEmail), $"O e-mail '{email}' já está em uso.");

    public override IdentityError InvalidRoleName(string? role) =>
        Error(nameof(InvalidRoleName), $"O nome de função '{role}' é inválido.");

    public override IdentityError DuplicateRoleName(string role) =>
        Error(nameof(DuplicateRoleName), $"A função '{role}' já existe.");

    public override IdentityError UserAlreadyHasPassword() =>
        Error(nameof(UserAlreadyHasPassword), "Esta conta já tem uma senha.");

    public override IdentityError UserLockoutNotEnabled() =>
        Error(nameof(UserLockoutNotEnabled), "O bloqueio não está ativado para esta conta.");

    public override IdentityError UserAlreadyInRole(string role) =>
        Error(nameof(UserAlreadyInRole), $"A conta já tem a função '{role}'.");

    public override IdentityError UserNotInRole(string role) =>
        Error(nameof(UserNotInRole), $"A conta não tem a função '{role}'.");

    public override IdentityError PasswordTooShort(int length) =>
        Error(nameof(PasswordTooShort), $"A senha precisa ter pelo menos {length} caracteres.");

    public override IdentityError PasswordRequiresUniqueChars(int uniqueChars) =>
        Error(
            nameof(PasswordRequiresUniqueChars),
            $"A senha precisa ter pelo menos {uniqueChars} caracteres diferentes."
        );

    public override IdentityError PasswordRequiresNonAlphanumeric() =>
        Error(
            nameof(PasswordRequiresNonAlphanumeric),
            "A senha precisa ter pelo menos um símbolo (por exemplo ! @ # ou .)."
        );

    public override IdentityError PasswordRequiresDigit() =>
        Error(nameof(PasswordRequiresDigit), "A senha precisa ter pelo menos um número (0-9).");

    public override IdentityError PasswordRequiresLower() =>
        Error(nameof(PasswordRequiresLower), "A senha precisa ter pelo menos uma letra minúscula (a-z).");

    public override IdentityError PasswordRequiresUpper() =>
        Error(nameof(PasswordRequiresUpper), "A senha precisa ter pelo menos uma letra maiúscula (A-Z).");
}
