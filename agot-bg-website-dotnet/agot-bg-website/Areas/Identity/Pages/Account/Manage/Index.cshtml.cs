// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
#nullable disable

using System.ComponentModel.DataAnnotations;
using agot_bg_website.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace agot_bg_website.Areas.Identity.Pages.Account.Manage
{
    public class IndexModel(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager
    ) : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManager = userManager;
        private readonly SignInManager<ApplicationUser> _signInManager = signInManager;

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        [Display(Name = "Nome de usuário")]
        public string Username { get; set; }

        public bool CanChangeUsername { get; set; }

        public DateTimeOffset? LastUsernameUpdateTime { get; set; }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        [TempData]
        public string StatusMessage { get; set; }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        [BindProperty]
        public InputModel Input { get; set; }

        [BindProperty]
        public ProfileTextInputModel ProfileTextInput { get; set; }

        [BindProperty]
        public PreferencesInputModel PreferencesInput { get; set; }

        /// <summary>
        ///     This API supports the ASP.NET Core Identity default UI infrastructure and is not intended to be used
        ///     directly from your code. This API may change or be removed in future releases.
        /// </summary>
        public class InputModel
        {
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
            public string NewUsername { get; set; }
        }

        public class ProfileTextInputModel
        {
            [StringLength(1000)]
            [Display(Name = "Sobre você")]
            public string ProfileText { get; set; }
        }

        public class PreferencesInputModel
        {
            [Display(Name = "Avisos por e-mail nas partidas por turnos (PBEM)")]
            public bool EmailNotificationActive { get; set; }

            [Display(Name = "Entrar nas partidas com o som desligado")]
            public bool MuteGames { get; set; }

            [Display(Name = "Usar o nome das Casas no chat das partidas")]
            public bool UseHouseNamesForChat { get; set; }

            [Display(Name = "Usar a barra de rolagem no mapa")]
            public bool UseMapScrollbar { get; set; }

            [Display(Name = "Painel da partida do lado direito (só no computador)")]
            public bool GameStateColumnRight { get; set; }
        }

        private async Task LoadAsync(ApplicationUser user)
        {
            var userName = await _userManager.GetUserNameAsync(user);

            Username = userName;
            LastUsernameUpdateTime = user.LastUsernameUpdateTime;
            CanChangeUsername = user.LastUsernameUpdateTime == null;

            Input = new InputModel { NewUsername = userName };
            ProfileTextInput = new ProfileTextInputModel { ProfileText = user.ProfileText };
            PreferencesInput = new PreferencesInputModel
            {
                EmailNotificationActive = user.EmailNotificationActive,
                MuteGames = user.MuteGames,
                UseHouseNamesForChat = user.UseHouseNamesForChat,
                UseMapScrollbar = user.UseMapScrollbar,
                GameStateColumnRight = user.GameStateColumnRight,
            };
        }

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"Não foi possível carregar o usuário com ID '{_userManager.GetUserId(User)}'.");
            }

            await LoadAsync(user);
            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"Não foi possível carregar o usuário com ID '{_userManager.GetUserId(User)}'.");
            }

            if (!ModelState.IsValid)
            {
                await LoadAsync(user);
                return Page();
            }

            if (
                user.LastUsernameUpdateTime == null
                && !string.IsNullOrWhiteSpace(Input.NewUsername)
                && Input.NewUsername != user.UserName
            )
            {
                if (Infrastructure.Auth.ReservedUsernames.IsReserved(Input.NewUsername))
                {
                    ModelState.AddModelError(
                        "Input.NewUsername",
                        "Este nome de usuário é reservado e não pode ser usado."
                    );
                    await LoadAsync(user);
                    return Page();
                }

                var existing = await _userManager.FindByNameAsync(Input.NewUsername);
                if (existing != null && existing.Id != user.Id)
                {
                    ModelState.AddModelError(
                        "Input.NewUsername",
                        "Este nome de usuário já está em uso."
                    );
                    await LoadAsync(user);
                    return Page();
                }

                var setUserNameResult = await _userManager.SetUserNameAsync(
                    user,
                    Input.NewUsername
                );
                if (!setUserNameResult.Succeeded)
                {
                    foreach (var error in setUserNameResult.Errors)
                    {
                        ModelState.AddModelError(string.Empty, error.Description);
                    }
                    await LoadAsync(user);
                    return Page();
                }

                user.LastUsernameUpdateTime = DateTimeOffset.UtcNow;
                await _userManager.UpdateAsync(user);
                await _signInManager.RefreshSignInAsync(user);
                StatusMessage =
                    "Seu nome de usuário foi trocado. (Só dá para trocar uma vez.)";
                return RedirectToPage();
            }

            await _signInManager.RefreshSignInAsync(user);
            StatusMessage = "Seu perfil foi atualizado.";
            return RedirectToPage();
        }

        public async Task<IActionResult> OnPostUpdateProfileTextAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"Não foi possível carregar o usuário com ID '{_userManager.GetUserId(User)}'.");
            }

            if (!ModelState.IsValid)
            {
                await LoadAsync(user);
                return Page();
            }

            user.ProfileText = ProfileTextInput.ProfileText;
            await _userManager.UpdateAsync(user);

            StatusMessage = "O texto do seu perfil foi atualizado.";
            return RedirectToPage();
        }

        public async Task<IActionResult> OnPostUpdatePreferencesAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"Não foi possível carregar o usuário com ID '{_userManager.GetUserId(User)}'.");
            }

            if (!ModelState.IsValid)
            {
                await LoadAsync(user);
                return Page();
            }

            user.EmailNotificationActive = PreferencesInput.EmailNotificationActive;
            user.MuteGames = PreferencesInput.MuteGames;
            user.UseHouseNamesForChat = PreferencesInput.UseHouseNamesForChat;
            user.UseMapScrollbar = PreferencesInput.UseMapScrollbar;
            user.GameStateColumnRight = PreferencesInput.GameStateColumnRight;
            await _userManager.UpdateAsync(user);

            StatusMessage = "Suas preferências foram salvas.";
            return RedirectToPage();
        }
    }
}
