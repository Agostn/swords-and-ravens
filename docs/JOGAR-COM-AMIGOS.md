# Como jogar com os amigos (site completo no GitHub Codespaces)

O Codespaces liga o site inteiro: contas, lista de partidas, sala de espera e o jogo.
É para testar entre amigos (o link é público, mas só quem você mandar vai saber dele).

## Primeira vez

1. No GitHub, abra o repositório, escolha a branch **`design-novo`**, clique em
   **Code → Codespaces → Create codespace**.
2. Espere a instalação (uns 10 minutos na primeira vez: banco de dados, .NET, jogo).
3. No terminal vai aparecer o endereço do site, algo como
   `https://<nome>-8000.app.github.dev`. Espere aparecer **"Application started"** e abra.
   (Também dá para abrir pela aba **Portas**, linha "Site (abra este)".)

Se você já tinha um Codespace criado antes de 23/out, ele não tem o .NET nem o banco.
Abra a paleta de comandos (Ctrl+Shift+P) e rode **"Codespaces: Rebuild Container"**,
ou crie um Codespace novo.

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

Deixe o terminal do Codespace aberto enquanto estiverem jogando. Se o Codespace
desligar por inatividade, abra de novo: tudo volta (partidas e contas ficam salvas).

## Atualizar para a versão mais nova

No terminal do Codespace:

```bash
git pull
bash .devcontainer/iniciar.sh
```

O `iniciar.sh` refaz a página do jogo sozinho quando o código mudou (1 a 3 minutos).

## Se algo der errado

- **A página não abre:** confira na aba Portas se a 8000 e a 5000 estão como
  "Public". Se não estiverem, clique com o botão direito → Port Visibility → Public.
- **O jogo fica em "Conectando…":** a porta 5000 (servidor do jogo) precisa estar
  pública. Log do servidor do jogo: `cat /tmp/servidor-do-jogo.log`.
- **Tela branca ou erro depois de um `git pull`:** rode `bash .devcontainer/gerar-jogo.sh --forcar`
  e depois `bash .devcontainer/iniciar.sh`.
- **Teste rápido sem contas** (o jogo sozinho, cada aba é um jogador):
  `bash .devcontainer/modo-teste.sh` e abra a porta 8080 com `/static/#1`, `#2`...
  Ele desliga o servidor do jogo do site; para voltar ao site, rode `bash .devcontainer/iniciar.sh`.
