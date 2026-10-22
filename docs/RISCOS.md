# Registro de riscos e bugs

Lista viva de tudo que pode dar problema no projeto. Cada item tem situação,
gravidade e o que fazer. Atualize sempre que mexer em algo relacionado.

Gravidade: 🔴 alta · 🟠 média · 🟡 baixa · Situação: ✅ resolvido · 🛡️ mitigado · ⏳ pendente

## Como verificar antes de cada entrega

1. **Checagem de tipos:** `cd agot-bg-game-server && node_modules/.bin/tsc --noEmit -p .` (precisa dar 0 erros).
2. **Build do cliente:** `yarn run run-client` precisa terminar com "compiled successfully".
3. **Partida de teste com o bot:** apague `src/server/website-client/local-entire-game.json`, reinicie o servidor, rode `tools/i18n/game.js` e depois `tools/i18n/bot.js` (joga com 3 Casas e tira prints). Confira os prints e o log do servidor.
4. **Teste de travamento:** `tools/qa/crashtest.js` manda uma mensagem inválida de propósito; o servidor precisa continuar rodando.
5. **Textos em inglês sobrando:** `node tools/i18n/strings.js <arquivos>`.
6. **Não salvar no Git** o arquivo `src/server/website-client/local-entire-game.json` (ele é do projeto original e o teste local sobrescreve). Antes de cada commit: `git checkout -- agot-bg-game-server/src/server/website-client/local-entire-game.json`.

## Servidor e estabilidade

| # | Risco | Grav. | Situação | O que fazer |
|---|---|---|---|---|
| S1 | Qualquer exceção ao processar a mensagem de um jogador derrubava o servidor inteiro (todas as partidas caíam). | 🔴 | 🛡️ 22/out | Agora só a partida com erro é isolada e recarregada do último save (`GlobalServer.evictGameAfterError`). Testado. |
| S2 | Mensagem de marcha com unidade inexistente (tela desatualizada) causava a exceção do S1. | 🔴 | ✅ 22/out | Mensagem é ignorada (`ResolveSingleMarchOrderGameState`). |
| S3 | ~150 lugares nos tratadores de mensagens buscam áreas/unidades/cartas pelo id enviado pelo jogador sem checar se existe. Com o S1 mitigado, isso não derruba mais o site, mas desconecta os jogadores daquela partida. | 🟠 | ⏳ | Trocar `.get(id)` por validação (`has`/`tryGet`) e ignorar a mensagem, começando pelas ações mais comuns (ordens, marcha, combate, recrutamento). Listar com `grep -rn "get(message\." src/common`. |
| S4 | Erros em temporizadores (relógio das partidas ao vivo) ou fora das mensagens ainda podem encerrar o processo. | 🟠 | 🛡️ | Em produção o Docker reinicia o servidor sozinho (`restart: unless-stopped`) e as partidas voltam do último save. Revisar os temporizadores na etapa de testes. |
| S5 | Ao isolar uma partida com erro, ações feitas nos ~2 s antes do erro podem se perder (o save tem um atraso de 2 s). | 🟡 | ⏳ | Aceitável por enquanto (antes perdia-se tudo de todas as partidas). |
| S6 | Nenhum teste automatizado nas regras do jogo (83 mil linhas). | 🔴 | ⏳ | Etapa de testes: começar por combate, suprimento, marcha, lances e Selvagens. |
| S7 | Bibliotecas antigas (mobx 5, React 17/18 misturados, Bootstrap 4, Node com pacotes de 2021–2022). | 🟠 | ⏳ | Atualizar aos poucos, com o bot de teste rodando a cada atualização. |

## Tradução

| # | Risco | Grav. | Situação | O que fazer |
|---|---|---|---|---|
| T1 | Os textos convertidos automaticamente usam chaves numeradas por arquivo (`auto.Arquivo.N`). Se o arquivo mudar muito, fica difícil saber qual chave é qual. | 🟡 | ⏳ | Ao editar um componente, dar nomes descritivos às chaves que mudar. |
| T2 | Algumas frases foram montadas em pedaços no código original ("A Casa X deixou" + "para trás" + ...). Em português a ordem das palavras às vezes fica estranha. | 🟠 | ⏳ | Revisar o histórico da partida jogando; reescrever o código dessas frases para uma frase inteira com parâmetros. |
| T3 | Plurais feitos com `+ "s"` no código. Funciona para "Fichas", "Cavaleiros", mas não para palavras como "ordens" ou "Soldados" vindo de "Footm-a-n". | 🟡 | ⏳ | Trocar pelo plural do sistema de tradução: `{n|ficha|fichas}`. |
| T4 | Textos que o **servidor** gera (ex.: mensagens automáticas no chat, e-mails do site) continuam em inglês. | 🟠 | ⏳ | Levantar na tradução do site (.NET) e do servidor. |
| T5 | Se faltar tradução de uma chave, aparece o texto em inglês. O TypeScript acusa só nos arquivos de chaves manuais e automáticas; textos novos escritos direto no código (sem `t()`) passam batido. | 🟡 | ⏳ | Rodar `tools/i18n/strings.js` antes de cada entrega. |
| T6 | Atualizações do projeto original (upstream) vão gerar conflitos nos arquivos traduzidos, porque quase todo componente mudou. | 🟠 | ⏳ | Trazer atualizações com cuidado, arquivo por arquivo, e rodar os codemods de novo nos trechos novos. |

## Imagens, direitos e legal

| # | Risco | Grav. | Situação | O que fazer |
|---|---|---|---|---|
| L1 | Artes das cartas e do mapa são da Fantasy Flight Games. O projeto original também usa. Um site público pode receber pedido de retirada. | 🟠 | ⏳ | Manter sem anúncios/cobrança; ter plano B de arte própria. |
| L2 | Licença GPLv3: o fork precisa manter código aberto e créditos aos autores originais. | 🟡 | ✅ | Repositório público, créditos mantidos. |
| L3 | No Codespaces de teste, o link do jogo fica **público** (qualquer um com o link entra) e o modo de teste deixa escolher qualquer jogador pelo `#1`, `#2`... | 🟡 | ⏳ | Só compartilhar o link com amigos; não é para produção. |

## Ambiente de trabalho (Claude)

| # | Risco | Grav. | Situação | O que fazer |
|---|---|---|---|---|
| A1 | No ambiente do Claude, `registry.npmjs.org` está na lista de exceções do proxy e não resolve. | 🟡 | 🛡️ | Rodar yarn/npm com `NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 npm_config_noproxy=localhost,127.0.0.1`. |
| A2 | Scripts que matam processos por nome (`pkill -f`, `pgrep -f`) podem matar o próprio terminal se o nome aparecer no comando. | 🟡 | 🛡️ | Usar `tools/qa/restart-server.sh` sozinho, sem outros comandos na mesma linha. |
