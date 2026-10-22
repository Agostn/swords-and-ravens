using agot_bg_website.Infrastructure;
using Xunit;

namespace agot_bg_website.Tests.Infrastructure;

public class RelativeTimeFormatterTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void JustNow_ReturnsAMoment()
    {
        var result = RelativeTimeFormatter.Format(Now.AddSeconds(-5), Now);

        Assert.Equal("há instantes", result);
    }

    [Fact]
    public void FewMinutesAgo_PluralizesCorrectly()
    {
        Assert.Equal("há 1 minuto", RelativeTimeFormatter.Format(Now.AddMinutes(-1), Now));
        Assert.Equal("há 5 minutos", RelativeTimeFormatter.Format(Now.AddMinutes(-5), Now));
    }

    [Fact]
    public void FewHoursAgo_PluralizesCorrectly()
    {
        Assert.Equal("há 2 horas", RelativeTimeFormatter.Format(Now.AddHours(-2), Now));
    }

    [Fact]
    public void FewDaysAgo_PluralizesCorrectly()
    {
        Assert.Equal("há 3 dias", RelativeTimeFormatter.Format(Now.AddDays(-3), Now));
    }

    [Fact]
    public void FutureTimestamp_ReturnsFromNow()
    {
        Assert.Equal("daqui a 2 horas", RelativeTimeFormatter.Format(Now.AddHours(2), Now));
    }
}
