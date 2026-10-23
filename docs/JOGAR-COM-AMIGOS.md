# Como jogar com os amigos (site completo no GitHub Codespaces)

O Codespaces liga o site inteiro: contas, lista de partidas, sala de espera e o jogo.
É para testar entre amigos (o link é público, mas só quem você mandar vai saber dele).

## Abrir o site (sempre igual, primeira vez ou não)

1. Clique neste link (com a conta do GitHub aberta):
   **https://codespaces.new/Agostn/swords-and-ravens?quickstart=1&ref=design-novo**
   e depois em **Create codespace** (ou **Resume**, se já tiver um).
2. Espere. Na primeira vez a instalação leva uns 10 minutos (banco de dados, .NET, jogo);
   nas outras vezes, 1 a 3 minutos. Ele **se atualiza sozinho** com a versão mais nova
   do GitHub toda vez que abre.
3. Quando aparecer no terminal o quadro **"PRONTO! O site está no ar"**, clique no link
   que está nele (algo como `https://<nome>-8000.app.github.dev`). Também dá para abrir
   pela aba **Portas**, linha "Site (abra este)".

Se você tem um Codespace criado **antes de 23/out**, apague esse (em github.com/codespaces,
nos três pontinhos → Delete) e use o link acima para criar um novo.

## Para jogar

1. **Cada pessoa cria a sua conta** em "Criar conta": só nome de usuário e senha, sem e-mail.
   A **primeira conta criada** no site vira administradora: é ela que pode trocar a senha
   de quem esquecer (em Admin → Usuários → Editar).
2. Quem vai organizar entra em **Todas as partidas → Criar uma partida**.
3. Na **sala de espera**:
   - clique em **Copiar link do convite** e mande no grupo. Quem abrir o link sem conta
     cria a conta e já cai na sala;
   - cada um clica em **Escolher** na Casa que quer;
   - o criador escolhe o **cenário** (Jogo base, O Festim dos Corvos, A Dança dos Dragões,
     Mãe dos Dragões…), o **número de jogadores**, **Ao vivo** ou **Por turnos (PBEM)**
     e as regras opcionais (passe o mouse em cada uma para ver o que faz).
4. Clique em **Iniciar partida**. Ao vivo, cada um clica em **Pronto** para confirmar
   que está aqui, e a partida começa.

Dá para jogar no **celular** e no **tablet**: é só abrir o mesmo link. No celular, use dois
dedos para dar zoom no mapa e a barra de baixo para ver as Casas, o chat e o histórico.

O site continua ligado mesmo se você fechar a aba do Codespace, e abrir o Codespace de novo
(em outro aparelho, por exemplo) não derruba quem está jogando. Mas o GitHub **desliga o
Codespace depois de 30 minutos sem ninguém mexer nele** (jogar no site não conta). Para
partidas longas, aumente esse tempo uma vez em **github.com/settings/codespaces →
Default idle timeout → 240 minutos**. Se desligar, abra pelo link de novo: tudo volta
(partidas e contas ficam salvas).

## Atualizar para a versão mais nova

Não precisa fazer nada: toda vez que o Codespace abre, ele baixa a versão mais nova do
GitHub e refaz a página do jogo se o código mudou. Se ele já estiver aberto e você quiser
atualizar agora, feche a aba do Codespace e abra de novo pelo link.

Cada versão nova salva no GitHub também é testada sozinha (aba **Actions** do repositório,
"Teste do site completo"): instala igual ao Codespace, liga o site e joga duas partidas
inteiras pelo site com 3 contas, no computador e no celular. Os prints ficam lá.

## Se algo der errado

- **Ao entrar ou criar conta, o iPhone "baixa um arquivo" (login, register) ou o computador
  mostra "HTTP ERROR" / "Não deu para enviar o formulário":** a porta 8000 ficou privada.
  O `iniciar.sh` tenta deixar pública sozinho e avisa no terminal se não conseguir.
  Para arrumar na mão: aba **Portas** → botão direito na linha **8000** → **Port Visibility
  → Public**; faça o mesmo na **5000**. Depois recarregue a página do site.

- **A página não abre:** confira na aba Portas se a 8000 e a 5000 estão como
  "Public". Se não estiverem, clique com o botão direito → Port Visibility → Public.
- **O jogo fica em "Conectando…":** a porta 5000 (servidor do jogo) precisa estar
  pública. Log do servidor do jogo: `cat /tmp/servidor-do-jogo.log`.
- **Tela branca ou erro depois de um `git pull`:** rode `bash .devcontainer/gerar-jogo.sh --forcar`
  e depois `bash .devcontainer/iniciar.sh`.
- **Teste rápido sem contas** (o jogo sozinho, cada aba é um jogador):
  `bash .devcontainer/modo-teste.sh` e abra a porta 8080 com `/static/#1`, `#2`...
  Ele desliga o servidor do jogo do site; para voltar ao site, rode `bash .devcontainer/iniciar.sh`.
