using agot_bg_website.Domain;
using agot_bg_website.Infrastructure.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace agot_bg_website.Areas.Admin.Pages.Users;

public class EditModel(UserManager<ApplicationUser> userManager) : PageModel
{
    public ApplicationUser TargetUser { get; set; } = null!;

    public IList<string> CurrentRoles { get; set; } = [];

    public IReadOnlyList<string> AllRoles => RoleNames.All;

    [BindProperty]
    public List<string> SelectedRoles { get; set; } = [];

    /// <summary>
    /// Permissions granted directly to this user, on top of whatever their roles already grant
    /// (Django's <c>auth_user_user_permissions</c> one-off, per-user override) — see
    /// <see cref="Roles.EditModel"/> for the role-wide equivalent.
    /// </summary>
    public IReadOnlyList<string> AllPermissions => GamePermissions.All;

    [BindProperty]
    public List<string> SelectedPermissions { get; set; } = [];

    [TempData]
    public string? StatusMessage { get; set; }

    public async Task<IActionResult> OnGetAsync(Guid id)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
        {
            return NotFound();
        }

        TargetUser = user;
        CurrentRoles = await userManager.GetRolesAsync(user);
        SelectedRoles = [.. CurrentRoles];

        var userClaims = await userManager.GetClaimsAsync(user);
        SelectedPermissions =
        [
            .. userClaims.Where(c => c.Type == GamePermissions.ClaimType).Select(c => c.Value),
        ];
        return Page();
    }

    public async Task<IActionResult> OnPostAsync(Guid id)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
        {
            return NotFound();
        }

        TargetUser = user;
        var currentRoles = await userManager.GetRolesAsync(user);
        SelectedRoles ??= [];
        SelectedPermissions ??= [];

        var rolesToAdd = SelectedRoles.Except(currentRoles).ToArray();
        var rolesToRemove = currentRoles.Except(SelectedRoles).ToArray();
        var errors = new List<string>();

        if (rolesToAdd.Length > 0)
        {
            var result = await userManager.AddToRolesAsync(user, rolesToAdd);
            if (!result.Succeeded)
            {
                errors.AddRange(result.Errors.Select(e => e.Description));
            }
        }
        if (rolesToRemove.Length > 0)
        {
            var result = await userManager.RemoveFromRolesAsync(user, rolesToRemove);
            if (!result.Succeeded)
            {
                errors.AddRange(result.Errors.Select(e => e.Description));
            }
        }

        var currentUserClaims = await userManager.GetClaimsAsync(user);
        var currentPermissions = currentUserClaims
            .Where(c => c.Type == GamePermissions.ClaimType)
            .Select(c => c.Value)
            .ToArray();
        var permissionsToAdd = SelectedPermissions.Except(currentPermissions).ToArray();
        var permissionsToRemove = currentPermissions.Except(SelectedPermissions).ToArray();

        foreach (var permission in permissionsToAdd)
        {
            var result = await userManager.AddClaimAsync(
                user,
                new System.Security.Claims.Claim(GamePermissions.ClaimType, permission)
            );
            if (!result.Succeeded)
            {
                errors.AddRange(result.Errors.Select(e => e.Description));
            }
        }
        foreach (var permission in permissionsToRemove)
        {
            var result = await userManager.RemoveClaimAsync(
                user,
                new System.Security.Claims.Claim(GamePermissions.ClaimType, permission)
            );
            if (!result.Succeeded)
            {
                errors.AddRange(result.Errors.Select(e => e.Description));
            }
        }

        if (
            rolesToAdd.Length > 0
            || rolesToRemove.Length > 0
            || permissionsToAdd.Length > 0
            || permissionsToRemove.Length > 0
        )
        {
            // Force role/permission changes (e.g. Banned/On probation, or a direct permission
            // grant) to take effect on the user's next request instead of only after their
            // session cookie naturally expires.
            await userManager.UpdateSecurityStampAsync(user);
        }

        StatusMessage =
            errors.Count > 0
                ? $"Erro: algumas mudanças de {user.UserName} não foram salvas: {string.Join("; ", errors)}"
                : $"Funções e permissões de {user.UserName} atualizadas.";
        return RedirectToPage("./Index");
    }

    /// <summary>
    /// Troca a senha de um usuário (o cadastro não usa e-mail, então "Esqueci a senha" não existe:
    /// quem esqueceu pede para um Admin trocar aqui).
    /// </summary>
    public async Task<IActionResult> OnPostSetPasswordAsync(Guid id, [FromForm] string? newPassword)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
        {
            StatusMessage = "Erro: a nova senha precisa ter pelo menos 6 caracteres.";
            return RedirectToPage("./Edit", new { id });
        }

        if (await userManager.HasPasswordAsync(user))
        {
            var removed = await userManager.RemovePasswordAsync(user);
            if (!removed.Succeeded)
            {
                StatusMessage =
                    $"Erro: não foi possível trocar a senha: {string.Join("; ", removed.Errors.Select(e => e.Description))}";
                return RedirectToPage("./Edit", new { id });
            }
        }

        var added = await userManager.AddPasswordAsync(user, newPassword);
        if (!added.Succeeded)
        {
            StatusMessage =
                $"Erro: não foi possível trocar a senha: {string.Join("; ", added.Errors.Select(e => e.Description))}";
            return RedirectToPage("./Edit", new { id });
        }

        // derruba as sessões abertas com a senha antiga
        await userManager.UpdateSecurityStampAsync(user);
        StatusMessage = $"Senha de {user.UserName} trocada.";
        return RedirectToPage("./Index");
    }
}
