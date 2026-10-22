namespace agot_bg_website.Infrastructure;

/// <summary>
/// Small "2 hours ago" / "in 3 days" formatter, equivalent to Django template's
/// <c>|naturaltime</c> filter used on the user profile page (last activity, timestamps in the
/// games-list tooltips). Deliberately hand-rolled instead of pulling in a dependency for this one
/// filter.
/// </summary>
public static class RelativeTimeFormatter
{
    public static string Format(DateTimeOffset value, DateTimeOffset? now = null)
    {
        var reference = now ?? DateTimeOffset.UtcNow;
        var delta = reference - value;
        var future = delta < TimeSpan.Zero;
        var span = future ? -delta : delta;

        string result;
        if (span < TimeSpan.FromSeconds(60))
        {
            result = "instantes";
        }
        else if (span < TimeSpan.FromMinutes(60))
        {
            var minutes = (int)span.TotalMinutes;
            result = $"{minutes} {(minutes == 1 ? "minuto" : "minutos")}";
        }
        else if (span < TimeSpan.FromHours(24))
        {
            var hours = (int)span.TotalHours;
            result = $"{hours} {(hours == 1 ? "hora" : "horas")}";
        }
        else if (span < TimeSpan.FromDays(30))
        {
            var days = (int)span.TotalDays;
            result = $"{days} {(days == 1 ? "dia" : "dias")}";
        }
        else if (span < TimeSpan.FromDays(365))
        {
            var months = (int)(span.TotalDays / 30);
            result = $"{months} {(months == 1 ? "mês" : "meses")}";
        }
        else
        {
            var years = (int)(span.TotalDays / 365);
            result = $"{years} {(years == 1 ? "ano" : "anos")}";
        }

        return future ? $"daqui a {result}" : $"há {result}";
    }
}
