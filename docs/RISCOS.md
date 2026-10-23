# Registro de riscos e bugs

Lista viva de tudo que pode dar problema no projeto. Cada item tem situação,
gravidade e o que fazer. Atualize sempre que mexer em algo relacionado.

Gravidade: 🔴 alta · 🟠 média · 🟡 baixa · Situação: ✅ resolvido · 🛡️ mitigado · ⏳ pendente

## Como verificar antes de cada entrega

1. **Checagem de tipos:** `cd agot-bg-game-server && node_modules/.bin/tsc --noEmit -p .` (precisa dar 0 erros).
2. **Build do cliente:** `yarn run run-client` precisa terminar com "compiled successfully". **Obrigatório:** o `tsc` não acusa expressão regular inválida (ex.: `a)` sem escape); só o build do webpack pega.
2b. **Testes da tradução:** `node_modules/.bin/jest tests/i18n` (paridade de chaves en/pt-BR, parâmetros, tags, cartas e textos do servidor).
2c. **Tela nova:** abrir o jogo em 1440×900 e 1920×1080, testar zoom (roda do mouse e botões), arrastar, mini-mapa, recolher o painel das Casas, minimizar a jogada, abrir o chat e o botão "Tela antiga" / "Tela nova".
3. **Partida de teste com o bot:** apague `src/server/website-client/local-entire-game.json`, reinicie o servidor, rode `tools/i18n/game.js` e depois `tools/i18n/bot.js` (joga com 3 Casas e tira prints). Confira os prints e o log do servidor.
4. **Teste de travamento:** `tools/qa/crashtest.js` manda uma mensagem inválida de propósito; o servidor precisa continuar rodando.
5. **Textos em inglês sobrando:** `node tools/i18n/strings.js <arquivos>` (jogo) e `python3 tools/i18n/site/extract.py <arquivos>` (site .NET; linhas marcadas "EN?").
5b. **Site .NET:** `dotnet build` e `dotnet test agot-bg-website.Tests` (precisa dar 0 falhas). O .NET fica em `/root/.dotnet` no ambiente do Claude.
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
| T4 | Textos que o **servidor** gera (perguntas de escolha, votações, mensagens automáticas, e-mails do site) vêm em inglês. | 🟠 | 🛡️ 22/out | Perguntas/opções (SimpleChoice) e verbos das votações são traduzidos no cliente por `src/client/i18n/serverText.ts` (lista exata + modelos com regex). Texto novo que não estiver lá aparece em inglês sem quebrar. Falta: e-mails e páginas do site .NET. |
| T7 | Textos das cartas ficam nos dados do jogo em inglês; o cliente troca pela tradução pelo id (`dataText`). Se o projeto original mudar o id ou o texto de uma carta, a tradução pode ficar desatualizada. | 🟡 | 🛡️ | Teste jest confere que toda carta tem tradução. Rodar `tools/i18n/dump-card-texts.ts` depois de atualizar do upstream e comparar. |
| T8 | Imagens das cartas e mapas tinham o texto em inglês gravado. | 🟠 | ✅ 22/out | 292 cartas e 4 mapas recriados em `public/images/pt-BR` (ferramentas em `tools/cards`, ver README). Jogo escolhe pela língua (`localizeImages`, `mapImages.ts`). |
| T9 | Seis cartas de Westeros usam na IMAGEM um texto mais curto que a dica do jogo (falta espaço). Mesma regra, outras palavras. | 🟡 | 🛡️ | Lista em `CARD_TEXT` de `tools/cards/generate.py`. Se mudar a tradução da dica, revisar ali também. |
| T10 | Carta nova (projeto original) ou tradução nova de carta: a imagem em PT não se atualiza sozinha. | 🟡 | ⏳ | Rodar `inventory.py`, `generate.py`, `review.py` (conferir as folhas) e `wire.py`. Sem imagem PT, o jogo mostra a original (não quebra). |
| T11 | Imagens em PT dobram o tamanho das imagens do jogo (+106 MB no repositório/servidor). | 🟡 | ⏳ | Aceitável; se pesar na hospedagem, converter para WebP. |
| B1 | Habilidade do Renly mostrava "NaN" no texto (bug do original: `+ +" (or one..."`). | 🟡 | ✅ 22/out | Corrigido em `houseCardAbilities.ts`. |
| T5 | Se faltar tradução de uma chave, aparece o texto em inglês. O TypeScript acusa só nos arquivos de chaves manuais e automáticas; textos novos escritos direto no código (sem `t()`) passam batido. | 🟡 | ⏳ | Rodar `tools/i18n/strings.js` antes de cada entrega. |
| T6 | Atualizações do projeto original (upstream) vão gerar conflitos nos arquivos traduzidos, porque quase todo componente mudou. | 🟠 | ⏳ | Trazer atualizações com cuidado, arquivo por arquivo, e rodar os codemods de novo nos trechos novos. |

## Site (.NET)

| # | Risco | Grav. | Situação | O que fazer |
|---|---|---|---|---|
| W1 | Site traduzido direto nos arquivos (sem arquivos de idioma). Atualizar do projeto original vai dar conflito em quase toda página. | 🟠 | ⏳ | Ao trazer atualizações do original, usar `tools/i18n/site/pt/*.json` como referência do que foi traduzido e reaplicar com `apply.py`. |
| W2 | O aviso vermelho/verde das mensagens de status depende do texto começar com "Erro". Mensagem de erro nova que não comece assim aparece verde. | 🟡 | 🛡️ | Ao escrever mensagem de erro nova, começar com "Erro". |
| W3 | Nomes das funções (Admin, Banned...) ficam em inglês no banco; só a tela traduz (`RoleBadges.DisplayName`). Traduzir no banco quebraria as permissões. | 🟠 | 🛡️ | Nunca mudar `RoleNames`. |
| W4 | Mensagens padrão de validação do .NET vinham em inglês. | 🟡 | ✅ 22/out | Tradutor global (`Infrastructure/Localization`) + testes `PtBrValidationTests`. |
| W5 | Cultura pt-BR muda formato de números (vírgula). Onde número vai para CSS/JS/API, tem que usar `InvariantCulture`. | 🟡 | 🛡️ | Conferido: código já usa `InvariantCulture`/`"O"` nesses pontos. Cuidar em código novo. |
| W6 | Se o fork for juntado no `master`, o GitHub Actions (`deploy.yml`) tenta publicar no servidor do projeto original e falha (sem as senhas). | 🟡 | ⏳ | Desativar/ajustar `deploy.yml` antes da etapa de hospedagem. |
| W8 | FAQ e Discord do projeto original removidos do site e do jogo (22/out). Se o projeto ganhar FAQ/Discord próprios, colocar os links de volta em `_Layout.cshtml`, `Games.cshtml`, `MyGames.cshtml` e `UserSettingsComponent.tsx`. | 🟡 | ✅ | — |
| W7 | Visual: títulos dos cartões da página inicial quase invisíveis; texto de exemplo dos campos alinhado à direita. | 🟡 | ✅ 23/out | Tema novo (cores da tela da partida, dourado) em `ClientAssets/src/app.css`; Início, Partidas, Minhas partidas, Entrar e Criar conta refeitos. Depois de mudar classes nas páginas, rodar `npm run build` em `ClientAssets` (o `app.css` gerado vai para o Git). |
| W9 | `Accounts:RequireConfirmedEmail=false` deixa entrar sem confirmar o e-mail. Só para o Codespaces (não tem servidor de e-mail lá). | 🟠 | 🛡️ 23/out | O padrão é `true`. Nunca colocar `false` em produção. Ligado só no `.devcontainer/iniciar.sh`. |
| W10 | O site do Codespaces usa senhas de teste conhecidas (Postgres `example`, API do servidor do jogo `change-me-in-user-secrets`) e roda em modo `Development`. | 🟡 | 🛡️ | Só para jogar entre amigos. Para um site de verdade (etapa de hospedagem), trocar as senhas e usar `Production`. A API interna (porta 8001) não é aberta para fora. |
| W11 | Fonte dos títulos (IM Fell English SC, licença SIL OFL) vai junto no site (`wwwroot/lib/fonts`) e no jogo (`public/fonts`). Os números dela parecem letras ("1" vira "I"). | 🟡 | 🛡️ | Não usar essa fonte em números (rodada, contagens). Licença junto dos arquivos. |

## Tela nova da partida (mapa em tela cheia, branch `design-novo`)

| # | Risco | Grav. | Situação | O que fazer |
|---|---|---|---|---|
| H1 | O mapa usa `transform: scale()`. O Xarrow (setas de marcha) mede posições na tela e erra com zoom. | 🟠 | ✅ 22/out | Na tela nova as setas são desenhadas nas coordenadas do mapa (`renderMapCoordinateMarchArrows` no `MapComponent`). Testado com zoom 1x e 2x. A tela antiga continua com o Xarrow. |
| H2 | Outros componentes que medem posição na tela (getBoundingClientRect) dentro do mapa podem errar com zoom. As animações de unidades já corrigem a escala. | 🟡 | ⏳ | Ao mexer em algo do mapa que mede posição, dividir pela escala (ver `MovingUnit`). Testar com zoom diferente de 1. |
| H3 | O painel das Casas virou uma lista compacta (`HudHouseList`). O detalhe completo de cada Casa (cartas, unidades, Poder) abre ao clicar, usando o `HouseRowComponent` de sempre. A trilha de suprimento fica numa seção recolhível, reduzida com CSS `zoom` (Chrome, Edge, Safari e Firefox 126+). | 🟡 | 🛡️ 22/out | Se algum navegador antigo mostrar a trilha grande demais, trocar o `zoom` por uma versão compacta da trilha. |
| H4 | O celular continua com a tela antiga (`hudSettings.hudActive` é falso no celular). | 🟡 | ⏳ | Fazer a versão de celular (proposta do quadro de design) numa etapa própria. |
| H5 | Testado na tela nova com o bot (22/out): planejamento, Corvo, marcha, batalha (escolha de carta, Espada, retirada), recrutamento, A Fúria dos Reis com desempate, ataque dos Selvagens (lances e cartas). Sem erro na página nem no servidor. **Ainda não vistos:** draft de cartas/Casas, fim de jogo, vassalos, Banco de Ferro, objetivos (O Festim dos Corvos) e Mãe dos Dragões. | 🟠 | ⏳ | Conferir numa partida com essas opções ligadas. |
| H7 | Durante "A Fúria dos Reis" as posições das trilhas em disputa ficam vazias até os lances terminarem (regra do jogo original). Na tela nova elas aparecem como "?" com explicação, para não parecer erro. | 🟡 | ✅ 22/out | — |
| H8 | O resumo "Últimos acontecimentos" usa o mesmo desenho do histórico e esconde os tipos que viram blocos grandes (`HUD_SKIPPED_LOG_TYPES` no `GameLogListComponent`). Um tipo novo e grande pode aparecer cortado ali. | 🟡 | 🛡️ | Se aparecer, incluir o tipo na lista. |
| H9 | Pontos de vitória na tela nova usam a mesma conta do painel clássico (`hud/displayedVictoryPoints.ts`): Fortalezas+Castelos; fichas de lealdade para Targaryen; PV dos objetivos no Festim dos Corvos. Se o painel clássico mudar a conta, mudar aqui também. | 🟡 | 🛡️ | — |
| H10 | O dono da ficha de cada trilha (Trono, Espada, Corvo) vem do jogo (`game.ironThroneHolder` etc.), não da 1ª posição, porque com vassalos pode ser outra Casa. | 🟡 | ✅ 22/out | — |
| H11 | Na faixa de fichas de ordem, as proibidas pelas cartas de Westeros da rodada aparecem riscadas (`planningRestrictions`). O jogo ainda deixa colocar uma ordem proibida quando não há outra opção (regra do original). | 🟡 | ✅ 22/out | — |
| H12 | Painel de ação: o conteúdo continua montado mesmo recolhido (só fica escondido), porque é ele que deixa clicar nas áreas do mapa. O mapa mede a altura dos painéis de baixo (`bottomPanelsHeight` → `panBottom` no `MapViewport`) e deixa arrastar o sul do mapa para cima deles. | 🟠 | ✅ 22/out | Se alguém tirar o conteúdo do painel quando ele recolhe, os cliques no mapa param de funcionar. Testado com o painel aberto e recolhido. |
| H13 | Resultado dos lances (`HudBidResults`): lê o histórico da partida (tipos `clash-of-kings-*`, `wildling-*`, `ties-decided`, `*-bidder-chosen`). Se o servidor mudar o formato desses registros, o quadro pode não aparecer (o jogo continua normal). Aparece só para lances novos e some ao mudar de fase. | 🟡 | 🛡️ 22/out | Testado com A Fúria dos Reis com empate e com ataque dos Selvagens. |
| H14 | Botões a) b) c) das cartas Asas Negras, Um Trono de Lâminas, Passar a Fio de Espada e O Fardo do Poder dependem do texto exato que o servidor manda (`LETTERED_CHOICES` em `serverText.ts`). Se o texto mudar, voltam os botões normais (sem quebrar). | 🟡 | ✅ 22/out | Teste automático em `tests/i18n` confere os quatro textos. |
| H15 | "Cores das Casas" virou botão liga/desliga (salvo no navegador). O destaque ao passar o mouse sobre uma Casa continua valendo por cima. | 🟡 | ✅ 22/out | — |
| H16 | Sala de espera (lobby) redesenhada. O CSS (`style/lobby.scss`) organiza as opções em grupos usando os `id` das colunas do `GameSettingsComponent` (`#base-settings-col`, `#mod-settings-col`...). | 🟡 | ✅ 23/out | Se mudar esses `id`, conferir a sala de espera. Testado: criar partida no site, 3 contas entrando, confirmação de presença (ao vivo) e início. |
| H17 | No Codespaces a página do jogo é gerada sem comprimir as imagens (`SKIP_IMAGE_OPTIMIZATION=1`), senão leva mais de meia hora. As imagens ficam maiores (abre um pouco mais devagar na primeira vez). | 🟡 | 🛡️ 23/out | Em produção (Dockerfile) continua comprimindo. `gerar-jogo.sh` só refaz quando o código do jogo muda. |
| H6 | As preferências da tela nova (tela antiga, painel recolhido, zoom do mapa) ficam no navegador de cada um (`localStorage`). Em janela anônima voltam ao padrão. | 🟡 | 🛡️ | Aceitável. |

## Imagens, direitos e legal

| # | Risco | Grav. | Situação | O que fazer |
|---|---|---|---|---|
| L1 | Artes das cartas e do mapa são da Fantasy Flight Games. O projeto original também usa. Um site público pode receber pedido de retirada. | 🟠 | ⏳ | Manter sem anúncios/cobrança; ter plano B de arte própria. |
| L2 | Licença GPLv3: o fork precisa manter código aberto e créditos aos autores originais. | 🟡 | ✅ | Repositório público, créditos mantidos. |
| L3 | No Codespaces o link do site fica **público** (qualquer um com o link pode criar conta e entrar). No modo de teste rápido (`modo-teste.sh`, porta 8080) dá para escolher qualquer jogador pelo `#1`, `#2`... | 🟡 | ⏳ | Só compartilhar o link com amigos; não é para produção. Desde 23/out o Codespaces usa o site completo (contas e sala de espera). |

## Ambiente de trabalho (Claude)

| # | Risco | Grav. | Situação | O que fazer |
|---|---|---|---|---|
| A1 | No ambiente do Claude, `registry.npmjs.org` está na lista de exceções do proxy e não resolve. | 🟡 | 🛡️ | Rodar yarn/npm com `NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 npm_config_noproxy=localhost,127.0.0.1`. |
| A3 | O servidor local precisa do `src/server/ClientMessage.json`, que é gerado (`yarn run generate-json-schemas`) e não fica no Git. Sem ele o servidor não liga. | 🟡 | 🛡️ | Rodar o comando depois de instalar as dependências (o Codespaces já faz). |
| A2 | Scripts que matam processos por nome (`pkill -f`, `pgrep -f`) podem matar o próprio terminal se o nome aparecer no comando. | 🟡 | 🛡️ | Usar `tools/qa/restart-server.sh` sozinho, sem outros comandos na mesma linha. |
