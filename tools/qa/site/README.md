# Testes do site completo (contas, sala de espera, partida)

Scripts de navegador (Playwright) que usam o site como um jogador de verdade.
Precisam do site (`dotnet run`, porta 8000), do servidor do jogo em modo site
(`MASTER_API_ENABLED=true`) e da página do jogo gerada (`.devcontainer/gerar-jogo.sh`).
Para entrar sem confirmar e-mail, ligue o site com `Accounts__RequireConfirmedEmail=false`.

Variáveis: `BASE` (padrão `http://localhost:8000`), `OUT` (pasta dos prints),
`PLAYWRIGHT_MODULE` (caminho do pacote playwright, se não estiver instalado aqui),
`CHROMIUM` (caminho do navegador).

| Script | O que faz |
|---|---|
| `flow.js` | Prints de Início, Entrar e Criar conta; cria/entra com a conta `jogador1`. Também é usado pelos outros. |
| `invite.js <link>` | Amigo sem conta abre o link do convite, cria a conta e precisa cair na sala de espera. |
| `chat.js` | Cria uma partida, duas contas entram, uma manda mensagem no chat e a outra precisa receber; testa o botão "Copiar link do convite". |
| `partida-completa.js <pasta> <passos>` | Cria uma partida (jogo base, 3 jogadores, ao vivo), 3 contas escolhem Casa, confirmam presença e jogam sozinhas até o fim. Para `PBEM`: `MODE=pbem`. Para continuar uma partida: `GAME=<link>`. Avisa "TRAVOU" se ficar 40 passos no mesmo estado. |

O "bot" faz jogadas simples (marcha para áreas vazias, lances 0, sem apoio). Serve para
achar travamentos e erros de tela, não para testar estratégia.
