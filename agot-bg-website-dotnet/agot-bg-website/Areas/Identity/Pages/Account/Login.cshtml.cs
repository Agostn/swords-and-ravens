// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
#nullable disable

using System.ComponentModel.DataAnnotations;
using agot_bg_website.Domain;
using agot_bg_website.Infrastructure.Auth;
using agot_bg_website.Infrastructure.Chat;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Caching.Memory;

namespace agot_bg_website.Areas.Identity.Pages.Account
{
    public class LoginModel(
        SignInManager<ApplicationUser> signInManager,
        UserManager<ApplicationUser> userManager,
        IMemoryCache memoryCache,
        ILogger<LoginModel> logger
    ) : PageModel
    {
        private readonly SignInManager<ApplicationUser> _signInManager = signInManager;
        private readonly UserManager<ApplicationUser> _userManager = userManager;
        private readonly IMemoryCache _memoryCache = memoryCache;
        private readonly ILogger<LoginModel> _logger = logger;

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        [BindProperty]
        public InputModel Input { get; set; }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        public IList<AuthenticationScheme> ExternalLogins { get; set; }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        public string ReturnUrl { get; set; }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        [TempData]
        public string ErrorMessage { get; set; }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        public class InputModel
        {
            /// <summary>
            ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
            ///     directly from your code. This API may change or be removed in future releases.
            /// </summary>
            [Required(ErrorMessage = "Digite seu nome de usuário.")]
            [Display(Name = "Nome de usuário")]
            public string UserName { get; set; }

            /// <summary>
            ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
            ///     directly from your code. This API may change or be removed in future releases.
            /// </summary>
            [Required]
            [DataType(DataType.Password)]
            [Display(Name = "Senha")]
            public string Password { get; set; }

            /// <summary>
            ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
            ///     directly from your code. This API may change or be removed in future releases.
            /// </summary>
            [Display(Name = "Continuar conectado?")]
            public bool RememberMe { get; set; }
        }

        public async Task OnGetAsync(string returnUrl = null)
        {
            if (!string.IsNullOrEmpty(ErrorMessage))
            {
                ModelState.AddModelError(string.Empty, ErrorMessage);
            }

            returnUrl = ReturnUrlHelper.NormalizeAfterLogin(returnUrl ?? Url.Content("~/"));

            // Clear the existing external cookie to ensure a clean login process
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

            ExternalLogins = (
                await _signInManager.GetExternalAuthenticationSchemesAsync()
            ).ToList();

            ReturnUrl = returnUrl;
        }

        public async Task<IActionResult> OnPostAsync(string returnUrl = null)
        {
            returnUrl = ReturnUrlHelper.NormalizeAfterLogin(returnUrl ?? Url.Content("~/"));

            ExternalLogins = (
                await _signInManager.GetExternalAuthenticationSchemesAsync()
            ).ToList();

            if (ModelState.IsValid)
            {
                // Entrar pelo nome de usuário (o cadastro não pede e-mail). Contas antigas que
                // tenham e-mail também podem entrar digitando o e-mail no mesmo campo.
                var login = Input.UserName.Trim();
                var user = await _userManager.FindByNameAsync(login);
                if (user is null && login.Contains('@'))
                {
                    user = await _userManager.FindByEmailAsync(login);
                }
                if (user is not null && user.IsDeleted)
                {
                    // Defence in depth: PasswordHash is already null for soft-deleted accounts so
                    // this can't succeed anyway, but fail fast with a clear reason.
                    ModelState.AddModelError(string.Empty, "Esta conta não existe mais.");
                    return Page();
                }

                // This doesn't count login failures towards account lockout
                // To enable password failures to trigger account lockout, set lockoutOnFailure: true
                var result = user is null
                    ? Microsoft.AspNetCore.Identity.SignInResult.Failed
                    : await _signInManager.PasswordSignInAsync(
                        user,
                        Input.Password,
                        Input.RememberMe,
                        lockoutOnFailure: false
                    );
                if (result.Succeeded)
                {
                    ChatUserDataCache.Invalidate(_memoryCache, user.Id);
                    _logger.LogInformation("User logged in.");
                    return LocalRedirect(returnUrl);
                }
                if (result.RequiresTwoFactor)
                {
                    return RedirectToPage(
                        "./LoginWith2fa",
                        new { ReturnUrl = returnUrl, RememberMe = Input.RememberMe }
                    );
                }
                if (result.IsLockedOut)
                {
                    _logger.LogWarning("User account locked out.");
                    return RedirectToPage("./Lockout");
                }
                if (result.IsNotAllowed)
                {
                    // AppSignInManager.CanSignInAsync also refuses banned members; distinguish that
                    // from "email not confirmed yet" here so a banned member is sent to a plain
                    // "you're banned" page instead of a confusing "confirm your email" message.
                    if (
                        user is not null
                        && await _userManager.IsInRoleAsync(user, RoleNames.Banned)
                    )
                    {
                        return RedirectToPage("./Banned");
                    }

                    ModelState.AddModelError(string.Empty, "Esta conta não pode entrar agora.");
                    return Page();
                }
                else
                {
                    ModelState.AddModelError(string.Empty, "Nome de usuário ou senha incorretos.");
                    return Page();
                }
            }

            // If we got this far, something failed, redisplay form
            return Page();
        }
    }
}
