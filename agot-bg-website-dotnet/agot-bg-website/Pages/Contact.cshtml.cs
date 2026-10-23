using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Security.Claims;
using agot_bg_website.Domain;
using agot_bg_website.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Options;

namespace agot_bg_website.Pages;

/// <summary>
/// Public "Contact us" form. Anonymous on purpose - someone who can't log in (lost password,
/// locked account, ...) is exactly the kind of visitor who needs to reach the staff - so it's
/// protected the same way registration is: Cloudflare Turnstile plus a hidden honeypot field,
/// with an additional hard quota of <see cref="ContactOptions.MaxMessagesPerDay"/> messages per
/// day per visitor (see <see cref="IContactRateLimiter"/>).
/// </summary>
public class ContactModel(
    IBccEmailSender emailSender,
    IOptions<ContactOptions> contactOptions,
    IContactRateLimiter rateLimiter,
    TurnstileVerifier turnstileVerifier,
    UserManager<ApplicationUser> userManager,
    ILogger<ContactModel> logger
) : PageModel
{
    private readonly ContactOptions _contactOptions = contactOptions.Value;

    [BindProperty]
    public InputModel Input { get; set; } = new();

    [BindProperty(Name = "cf-turnstile-response")]
    public string? TurnstileToken { get; set; }

    [TempData]
    public string? StatusMessage { get; set; }

    public bool ContactEnabled => _contactOptions.IsEnabled;

    public int MaxMessagesPerDay => _contactOptions.MaxMessagesPerDay;

    public bool TurnstileEnabled => turnstileVerifier.IsEnabled;

    public string TurnstileSiteKey => turnstileVerifier.SiteKey;

    public class InputModel
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        [Display(Name = "Seu nome")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [Display(Name = "Seu e-mail")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(150, MinimumLength = 3)]
        [Display(Name = "Assunto")]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [StringLength(5000, MinimumLength = 10)]
        [Display(Name = "Mensagem")]
        public string Message { get; set; } = string.Empty;

        // Real visitors never see or fill this field, but simple spam bots populate every form
        // field they find - same honeypot as the registration form.
        public string? Website { get; set; }
    }

    public async Task OnGetAsync()
    {
        await FillNameAndEmailFromAccountAsync();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ContactEnabled)
        {
            // No recipient configured - fail loudly instead of pretending the message was sent.
            logger.LogError(
                "A contact-form message was submitted but Contact:RecipientAddress isn't configured."
            );
            ModelState.AddModelError(
                string.Empty,
                "Erro: o formulário de contato não está disponível agora. Tente de novo mais tarde."
            );
            return Page();
        }

        // A logged-in visitor's name/email are shown read-only in the UI and must never be
        // trusted from the posted form - overwrite them with the real account data (ignoring
        // whatever was actually submitted, even a value crafted via devtools to impersonate
        // someone else) before validating anything else, and drop any validation errors that
        // were raised against the untrusted posted value.
        var isAuthenticated = await FillNameAndEmailFromAccountAsync();
        if (isAuthenticated)
        {
            ModelState.Remove($"{nameof(Input)}.{nameof(Input.Name)}");
            ModelState.Remove($"{nameof(Input)}.{nameof(Input.Email)}");
        }

        if (!ModelState.IsValid)
        {
            return Page();
        }

        if (!string.IsNullOrWhiteSpace(Input.Website))
        {
            ModelState.AddModelError(string.Empty, "Erro: não foi possível enviar sua mensagem.");
            return Page();
        }

        if (
            !await turnstileVerifier.VerifyAsync(
                TurnstileToken,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                expectedAction: "contact",
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

        if (
            !await rateLimiter.TryAcquireAsync(
                BuildRateLimitKey(User, HttpContext.Connection.RemoteIpAddress?.ToString()),
                HttpContext.RequestAborted
            )
        )
        {
            Response.StatusCode = StatusCodes.Status429TooManyRequests;
            ModelState.AddModelError(
                string.Empty,
                $"Você pode mandar no máximo {MaxMessagesPerDay} mensagens por dia. Tente de novo amanhã."
            );
            return Page();
        }

        await emailSender.SendBccEmailAsync(
            _contactOptions.GetRecipientAddresses(),
            $"[Contact] {Input.Subject}",
            BuildEmailHtml(Input, isAuthenticated)
        );

        StatusMessage = "Obrigado pelo contato! Sua mensagem foi enviada.";
        return RedirectToPage();
    }

    /// <summary>
    /// For a logged-in visitor, replaces Input.Name/Input.Email with the account's real username
    /// and email (looked up via <see cref="UserManager{TUser}"/>, not just the sign-in cookie's
    /// claims, so a since-changed email is picked up without requiring a fresh login) - these
    /// fields are read-only/informational for a logged-in visitor, never actually editable or
    /// trusted from the submitted form. Anonymous visitors are left free to type their own
    /// name/email. Returns whether the visitor is authenticated.
    /// </summary>
    private async Task<bool> FillNameAndEmailFromAccountAsync()
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        var user = await userManager.GetUserAsync(User);
        Input.Name = user?.UserName ?? User.Identity.Name ?? string.Empty;
        Input.Email = user?.Email ?? string.Empty;
        return true;
    }

    /// <summary>
    /// The daily quota follows the account when someone is logged in (so it can't be reset by
    /// switching networks), and falls back to the remote IP for anonymous visitors. A missing IP
    /// (shouldn't happen for a real request) shares one bucket rather than bypassing the quota.
    /// </summary>
    internal static string BuildRateLimitKey(ClaimsPrincipal user, string? remoteIp)
    {
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (user.Identity?.IsAuthenticated == true && !string.IsNullOrWhiteSpace(userId))
        {
            return $"user:{userId}";
        }

        return $"ip:{(string.IsNullOrWhiteSpace(remoteIp) ? "unknown" : remoteIp)}";
    }

    /// <summary>
    /// Builds the staff-facing email. Everything the visitor typed is HTML-encoded (this is
    /// attacker-controlled text landing in an HTML email), and newlines are turned into
    /// &lt;br /&gt; so a multi-paragraph message stays readable. <paramref name="isAuthenticated"/>
    /// tells staff whether name/email are the verified account's own data (never spoofable, see
    /// <see cref="FillNameAndEmailFromAccountAsync"/>) or anonymous, visitor-typed values.
    /// </summary>
    internal static string BuildEmailHtml(InputModel input, bool isAuthenticated)
    {
        var statusLabel = isAuthenticated ? "conta verificada" : "sem login";
        var senderLine =
            $"{WebUtility.HtmlEncode(input.Name)} &lt;{WebUtility.HtmlEncode(input.Email)}&gt; ({statusLabel})";

        var message = WebUtility
            .HtmlEncode(input.Message)
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace("\n", "<br />", StringComparison.Ordinal);

        return $"""
            <p>Chegou uma mensagem pelo formulário de contato do GoT dos Games.</p>
            <p><strong>De:</strong> {senderLine}<br />
            <strong>Assunto:</strong> {WebUtility.HtmlEncode(input.Subject)}</p>
            <p>{message}</p>
            """;
    }
}
