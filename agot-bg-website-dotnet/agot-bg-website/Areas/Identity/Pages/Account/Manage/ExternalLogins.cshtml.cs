// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
#nullable disable

using agot_bg_website.Domain;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace agot_bg_website.Areas.Identity.Pages.Account.Manage
{
    public class ExternalLoginsModel(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IUserStore<ApplicationUser> userStore
    ) : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManager = userManager;
        private readonly SignInManager<ApplicationUser> _signInManager = signInManager;
        private readonly IUserStore<ApplicationUser> _userStore = userStore;

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        public IList<UserLoginInfo> CurrentLogins { get; set; }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        public IList<AuthenticationScheme> OtherLogins { get; set; }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        public bool ShowRemoveButton { get; set; }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        [TempData]
        public string StatusMessage { get; set; }

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"Não foi possível carregar o usuário com ID '{_userManager.GetUserId(User)}'.");
            }

            CurrentLogins = await _userManager.GetLoginsAsync(user);
            // Only offer to link a new provider when the account has none linked yet — an account
            // may only ever have one external login (see OnPostLinkLoginAsync for the enforced rule).
            OtherLogins =
                CurrentLogins.Count == 0
                    ? (await _signInManager.GetExternalAuthenticationSchemesAsync()).ToList()
                    : [];

            string passwordHash = null;
            if (_userStore is IUserPasswordStore<ApplicationUser> userPasswordStore)
            {
                passwordHash = await userPasswordStore.GetPasswordHashAsync(
                    user,
                    HttpContext.RequestAborted
                );
            }

            ShowRemoveButton = passwordHash != null || CurrentLogins.Count > 1;
            return Page();
        }

        public async Task<IActionResult> OnPostRemoveLoginAsync(
            string loginProvider,
            string providerKey
        )
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"Não foi possível carregar o usuário com ID '{_userManager.GetUserId(User)}'.");
            }

            var result = await _userManager.RemoveLoginAsync(user, loginProvider, providerKey);
            if (!result.Succeeded)
            {
                StatusMessage = "Erro: o login externo não foi removido.";
                return RedirectToPage();
            }

            await _signInManager.RefreshSignInAsync(user);
            StatusMessage = "O login externo foi removido.";
            return RedirectToPage();
        }

        public async Task<IActionResult> OnPostLinkLoginAsync(string provider)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"Não foi possível carregar o usuário com ID '{_userManager.GetUserId(User)}'.");
            }

            // Only one external login provider may ever be linked to an account (in addition to an
            // optional local password). Linking a second, unrelated external identity onto the same
            // account would let either external account fully control it, and would make the
            // "other" external account's own identity permanently unreachable on this site, so block
            // it here before even redirecting to the provider. See also the matching check in
            // OnGetLinkLoginCallbackAsync, which guards the same rule after the OAuth round-trip.
            var existingLogins = await _userManager.GetLoginsAsync(user);
            if (existingLogins.Count > 0)
            {
                StatusMessage =
                    "Erro: sua conta já está ligada a um login externo. Remova-o antes de ligar outro serviço.";
                return RedirectToPage();
            }

            // Clear the existing external cookie to ensure a clean login process
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

            // Request a redirect to the external login provider to link a login for the current user
            var redirectUrl = Url.Page("./ExternalLogins", pageHandler: "LinkLoginCallback");
            var properties = _signInManager.ConfigureExternalAuthenticationProperties(
                provider,
                redirectUrl,
                _userManager.GetUserId(User)
            );
            return new ChallengeResult(provider, properties);
        }

        public async Task<IActionResult> OnGetLinkLoginCallbackAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"Não foi possível carregar o usuário com ID '{_userManager.GetUserId(User)}'.");
            }

            var userId = await _userManager.GetUserIdAsync(user);
            var info = await _signInManager.GetExternalLoginInfoAsync(userId);
            if (info == null)
            {
                throw new InvalidOperationException(
                    $"Erro inesperado ao carregar as informações do login externo."
                );
            }

            // Re-check the one-external-login-per-account rule after the OAuth round-trip too (see
            // OnPostLinkLoginAsync), since another tab/request could have linked a first provider in
            // the meantime, or this handler could be hit directly.
            var existingLogins = await _userManager.GetLoginsAsync(user);
            if (existingLogins.Count > 0)
            {
                await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
                StatusMessage =
                    "Erro: sua conta já está ligada a um login externo. Remova-o antes de ligar outro serviço.";
                return RedirectToPage();
            }

            var result = await _userManager.AddLoginAsync(user, info);
            if (!result.Succeeded)
            {
                StatusMessage =
                    "Erro: o login externo não foi adicionado. Cada login externo só pode ficar ligado a uma conta.";
                return RedirectToPage();
            }

            // Clear the existing external cookie to ensure a clean login process
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

            StatusMessage = "O login externo foi adicionado.";
            return RedirectToPage();
        }
    }
}
