using System.Net.WebSockets;

namespace agot_bg_website.Infrastructure;

/// <summary>
/// Repassa a conexão do jogo (WebSocket) de "/game-ws" no próprio site para o servidor do
/// jogo (TypeScript, porta 5000). Assim o site e o jogo ficam num endereço só, o que permite
/// jogar com os amigos pelo seu PC usando um túnel gratuito (ex.: cloudflared), que publica
/// apenas um endereço. O endereço interno do servidor do jogo vem de "GameServerWsUrl"
/// (padrão ws://localhost:5000).
/// </summary>
public static class GameServerWebSocketProxy
{
    public const string Path = "/game-ws";

    public static void MapGameServerWebSocketProxy(this WebApplication app)
    {
        app.Map(
            Path,
            branch =>
                branch.Run(async context =>
                {
                    if (!context.WebSockets.IsWebSocketRequest)
                    {
                        context.Response.StatusCode = StatusCodes.Status400BadRequest;
                        await context.Response.WriteAsync("Use WebSocket.");
                        return;
                    }

                    var target = new Uri(
                        app.Configuration["GameServerWsUrl"] ?? "ws://localhost:5000"
                    );
                    using var upstream = new ClientWebSocket();
                    try
                    {
                        await upstream.ConnectAsync(target, context.RequestAborted);
                    }
                    catch (Exception ex)
                    {
                        app.Logger.LogWarning(
                            ex,
                            "game-ws: não deu para conectar no servidor do jogo em {Target}",
                            target
                        );
                        context.Response.StatusCode = StatusCodes.Status502BadGateway;
                        return;
                    }

                    using var client = await context.WebSockets.AcceptWebSocketAsync();
                    using var cts = CancellationTokenSource.CreateLinkedTokenSource(
                        context.RequestAborted
                    );
                    var toServer = Pump(client, upstream, cts.Token);
                    var toClient = Pump(upstream, client, cts.Token);
                    await Task.WhenAny(toServer, toClient);
                    cts.Cancel();
                    try
                    {
                        await Task.WhenAll(toServer, toClient);
                    }
                    catch
                    {
                        // um dos lados já fechou
                    }
                })
        );
    }

    private static async Task Pump(WebSocket from, WebSocket to, CancellationToken ct)
    {
        var buffer = new byte[64 * 1024];
        while (
            !ct.IsCancellationRequested
            && from.State == WebSocketState.Open
            && to.State == WebSocketState.Open
        )
        {
            WebSocketReceiveResult result;
            try
            {
                result = await from.ReceiveAsync(new ArraySegment<byte>(buffer), ct);
            }
            catch
            {
                break;
            }

            if (result.MessageType == WebSocketMessageType.Close)
            {
                try
                {
                    await to.CloseOutputAsync(
                        result.CloseStatus ?? WebSocketCloseStatus.NormalClosure,
                        result.CloseStatusDescription,
                        CancellationToken.None
                    );
                }
                catch
                {
                    // o outro lado já fechou
                }
                break;
            }

            try
            {
                await to.SendAsync(
                    new ArraySegment<byte>(buffer, 0, result.Count),
                    result.MessageType,
                    result.EndOfMessage,
                    ct
                );
            }
            catch
            {
                break;
            }
        }
    }
}
