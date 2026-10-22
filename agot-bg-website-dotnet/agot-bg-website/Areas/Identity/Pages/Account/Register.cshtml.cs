// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
#nullable disable

using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Text.Encodings.Web;
using agot_bg_website.Domain;
using agot_bg_website.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.WebUtilities;

namespace agot_bg_website.Areas.Identity.Pages.Account
{
    public class RegisterModel : PageModel
    {
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUserStore<ApplicationUser> _userStore;
        private readonly IUserEmailStore<ApplicationUser> _emailStore;
        private readonly ILogger<RegisterModel> _logger;
        private readonly IEmailSender _emailSender;
        private readonly DisposableEmailChecker _disposableEmailChecker;
        private readonly TurnstileVerifier _turnstileVerifier;
        private readonly RegistrationRateLimiter _rateLimiter;

        public RegisterModel(
            UserManager<ApplicationUser> userManager,
            IUserStore<ApplicationUser> userStore,
            SignInManager<ApplicationUser> signInManager,
            ILogger<RegisterModel> logger,
            IEmailSender emailSender,
            DisposableEmailChecker disposableEmailChecker,
            TurnstileVerifier turnstileVerifier,
            RegistrationRateLimiter rateLimiter
        )
        {
            _userManager = userManager;
            _userStore = userStore;
            _emailStore = GetEmailStore();
            _signInManager = signInManager;
            _logger = logger;
            _emailSender = emailSender;
            _disposableEmailChecker = disposableEmailChecker;
            _turnstileVerifier = turnstileVerifier;
            _rateLimiter = rateLimiter;
        }

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
        public string ReturnUrl { get; set; }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        public IList<AuthenticationScheme> ExternalLogins { get; set; }

        public bool TurnstileEnabled => _turnstileVerifier.IsEnabled;

        public string TurnstileSiteKey => _turnstileVerifier.SiteKey;

        [BindProperty(Name = "cf-turnstile-response")]
        public string TurnstileToken { get; set; }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        public class InputModel
        {
            [Required]
            [StringLength(
                30,
                MinimumLength = 3,
                ErrorMessage = "O {0} precisa ter entre {2} e {1} caracteres."
            )]
            [RegularExpression(
                Infrastructure.Auth.UsernamePolicy.Pattern,
                ErrorMessage = Infrastructure.Auth.UsernamePolicy.ErrorMessage
            )]
            [Display(Name = "Nome de usuário")]
            public string UserName { get; set; }

            /// <summary>
            ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
            ///     directly from your code. This API may change or be removed in future releases.
            /// </summary>
            [Required]
            [EmailAddress]
            [Display(Name = "E-mail")]
            public string Email { get; set; }

            /// <summary>
            ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
            ///     directly from your code. This API may change or be removed in future releases.
            /// </summary>
            [Required]
            [StringLength(
                100,
                ErrorMessage = "A {0} precisa ter de {2} a {1} caracteres.",
                MinimumLength = 6
            )]
            [DataType(DataType.Password)]
            [Display(Name = "Senha")]
            public string Password { get; set; }

            /// <summary>
            ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
            ///     directly from your code. This API may change or be removed in future releases.
            /// </summary>
            [DataType(DataType.Password)]
            [Display(Name = "Confirmação da senha")]
            [Compare(
                "Password",
                ErrorMessage = "A senha e a confirmação não são iguais."
            )]
            public string ConfirmPassword { get; set; }

            // Real visitors never see or fill this field, but simple registration bots commonly
            // populate every form field.
            public string Website { get; set; }
        }

        public async Task OnGetAsync(string returnUrl = null)
        {
            ReturnUrl = returnUrl;
            ExternalLogins = (
                await _signInManager.GetExternalAuthenticationSchemesAsync()
            ).ToList();
        }

        public async Task<IActionResult> OnPostAsync(string returnUrl = null)
        {
            returnUrl ??= Url.Content("~/");
            ExternalLogins = (
                await _signInManager.GetExternalAuthenticationSchemesAsync()
            ).ToList();

            if (!_rateLimiter.TryAcquire(HttpContext.Connection.RemoteIpAddress?.ToString()))
            {
                Response.StatusCode = StatusCodes.Status429TooManyRequests;
                ModelState.AddModelError(
                    string.Empty,
                    "Muitas tentativas de criar conta a partir da sua rede. Tente de novo mais tarde."
                );
                return Page();
            }

            if (ModelState.IsValid)
            {
                if (!string.IsNullOrWhiteSpace(Input.Website))
                {
                    ModelState.AddModelError(string.Empty, "Não foi possível criar a conta.");
                    return Page();
                }

                if (
                    !await _turnstileVerifier.VerifyAsync(
                        TurnstileToken,
                        HttpContext.Connection.RemoteIpAddress?.ToString(),
                        expectedAction: "register",
                        HttpContext.RequestAborted
                    )
                )
                {
                    ModelState.AddModelError(
                        string.Empty,
                        "Complete a verificação de que você não é um robô e tente de novo."
                    );
                    return Page();
                }

                if (Infrastructure.Auth.ReservedUsernames.IsReserved(Input.UserName))
                {
                    ModelState.AddModelError(
                        "Input.UserName",
                        "Este nome de usuário é reservado e não pode ser usado."
                    );
                    return Page();
                }

                // Ensure the username is unique
                var existingNameUser = await _userManager.FindByNameAsync(Input.UserName);
                if (existingNameUser is not null)
                {
                    ModelState.AddModelError("Input.UserName", "Este nome de usuário já está em uso.");
                    return Page();
                }

                // If this email already belongs to an account, don't let CreateAsync fail with a
                // generic "email already taken" error — tell the visitor exactly what to do next,
                // per the requirement that duplicate registration must be forbidden in favor of
                // signing in with the already-linked method.
                var existingUser = await _userManager.FindByEmailAsync(Input.Email);
                if (existingUser is not null)
                {
                    var hasPassword = await _userManager.HasPasswordAsync(existingUser);
                    var providerNames = hasPassword
                        ? []
                        : (await _userManager.GetLoginsAsync(existingUser))
                            .Select(l => l.ProviderDisplayName ?? l.LoginProvider)
                            .ToArray();
                    ModelState.AddModelError(
                        string.Empty,
                        BuildDuplicateAccountErrorMessage(hasPassword, providerNames)
                    );
                    return Page();
                }

                if (await _disposableEmailChecker.IsDisposableAsync(Input.Email))
                {
                    ModelState.AddModelError(
                        "Input.Email",
                        "E-mails temporários/descartáveis não são aceitos. Use um e-mail em que você realmente receba mensagens."
                    );
                    return Page();
                }

                var user = CreateUser();

                await _userStore.SetUserNameAsync(user, Input.UserName, CancellationToken.None);
                await _emailStore.SetEmailAsync(user, Input.Email, CancellationToken.None);
                var result = await _userManager.CreateAsync(user, Input.Password);

                if (result.Succeeded)
                {
                    _logger.LogInformation("User created a new account with password.");

                    await _userManager.AddToRoleAsync(user, Infrastructure.Auth.RoleNames.Member);

                    var userId = await _userManager.GetUserIdAsync(user);
                    var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                    code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));
                    var callbackUrl = Url.Page(
                        "/Account/ConfirmEmail",
                        pageHandler: null,
                        values: new
                        {
                            area = "Identity",
                            userId = userId,
                            code = code,
                            returnUrl = returnUrl,
                        },
                        protocol: Request.Scheme
                    );

                    await _emailSender.SendEmailAsync(
                        Input.Email,
                        "Confirme seu e-mail",
                        EmailTemplates.Build(
                            Input.UserName,
                            Input.Email,
                            $"<p>Confirme sua conta <a href='{HtmlEncoder.Default.Encode(callbackUrl)}'>clicando aqui</a>.</p>"
                        )
                    );

                    if (_userManager.Options.SignIn.RequireConfirmedAccount)
                    {
                        return RedirectToPage(
                            "RegisterConfirmation",
                            new { email = Input.Email, returnUrl = returnUrl }
                        );
                    }
                    else
                    {
                        await _signInManager.SignInAsync(user, isPersistent: false);
                        return LocalRedirect(returnUrl);
                    }
                }
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }
            }

            // If we got this far, something failed, redisplay form
            return Page();
        }

        private ApplicationUser CreateUser()
        {
            try
            {
                return Activator.CreateInstance<ApplicationUser>();
            }
            catch
            {
                throw new InvalidOperationException(
                    $"Can't create an instance of '{nameof(ApplicationUser)}'. "
                        + $"Ensure that '{nameof(ApplicationUser)}' is not an abstract class and has a parameterless constructor, or alternatively "
                        + $"override the register page in /Areas/Identity/Pages/Account/Register.cshtml"
                );
            }
        }

        private IUserEmailStore<ApplicationUser> GetEmailStore()
        {
            if (!_userManager.SupportsUserEmail)
            {
                throw new NotSupportedException(
                    "The default UI requires a user store with email support."
                );
            }
            return (IUserEmailStore<ApplicationUser>)_userStore;
        }

        /// <summary>
        /// Builds the error shown when registering with an email that already belongs to an
        /// account — a local-password account gets a plain "log in instead" message, while an
        /// external-login-only account is told exactly which provider(s) to sign in with instead
        /// (registration must be forbidden here, not silently merged/duplicated). Extracted as a
        /// pure function so it's unit-testable without a live UserManager/database.
        /// </summary>
        internal static string BuildDuplicateAccountErrorMessage(
            bool hasPassword,
            IReadOnlyList<string> externalProviderNames
        )
        {
            if (hasPassword)
            {
                return "Já existe uma conta com este e-mail. Entre com ela.";
            }

            var providerNames =
                externalProviderNames.Count > 0
                    ? string.Join(" ou ", externalProviderNames)
                    : "um serviço externo";
            return $"Este e-mail já está ligado a uma conta pelo {providerNames}. Entre com o {providerNames} — "
                + "depois você pode criar uma senha nas configurações do seu perfil.";
        }
    }
}
