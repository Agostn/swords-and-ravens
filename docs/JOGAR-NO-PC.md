# Rodar o site no seu PC e jogar com os amigos pela internet (de graça)

O site roda no seu computador dentro de um "contêiner" (o mesmo ambiente do Codespace) e um
túnel gratuito da Cloudflare cria um link `https://...trycloudflare.com` para os amigos.
Não precisa abrir porta no roteador nem pagar nada. Enquanto o PC estiver ligado, o site está no ar.

## Uma vez só: instalar os programas (Windows)

1. **Docker Desktop** (grátis para uso pessoal): https://www.docker.com/products/docker-desktop/
   Instale, reinicie o PC se ele pedir e abra o Docker Desktop (ele precisa estar aberto).
   No Windows ele usa o WSL 2; se aparecer o aviso, aceite instalar.
2. **Visual Studio Code**: https://code.visualstudio.com/
3. No VS Code, instale a extensão **Dev Containers** (da Microsoft): ícone de quadradinhos à
   esquerda → procure "Dev Containers" → Install.
4. **Git**: https://git-scm.com/download/win (instalação padrão).

PC: 8 GB de memória no mínimo (16 GB é melhor: a primeira montagem do jogo usa bastante) e uns 15 GB livres no disco.

## Uma vez só: baixar o projeto

1. No VS Code: `Ctrl+Shift+P` → **Git: Clone** → cole
   `https://github.com/Agostn/swords-and-ravens.git` → escolha uma pasta.
2. Quando abrir, no canto de baixo à esquerda troque a branch para **design-novo**.
3. Vai aparecer o aviso "Reopen in Container" (ou `Ctrl+Shift+P` → **Dev Containers: Reopen in
   Container**). Clique.
4. Espere a instalação (10 a 20 minutos na primeira vez). No fim aparece no terminal
   **"PRONTO! O site está no ar"**. No seu PC o site abre em http://localhost:8000.

## Toda vez que for jogar

1. Abra o Docker Desktop, depois o VS Code na pasta do projeto (ele já abre no contêiner e liga o site).
2. No terminal do VS Code (`Ctrl+'`), digite:
   ```
   bash .devcontainer/jogar-online.sh
   ```
3. Aparece **"PRONTO! O site está na internet"** com um link `https://<algo>.trycloudflare.com`.
   Mande esse link no grupo. Cada amigo cria a conta e entra.
4. Para desligar o túnel: `bash .devcontainer/jogar-online.sh --parar` (ou feche o VS Code).

O site se atualiza sozinho com a versão nova do GitHub toda vez que o VS Code abre o contêiner.

## Bom saber

- **O link muda** toda vez que o túnel é ligado de novo. Mande o novo no grupo.
- **O PC precisa ficar ligado** (e sem dormir) durante a partida. Partidas e contas ficam
  salvas no PC; dá para continuar outro dia.
- No celular, dá para pôr o link na Tela de Início (ver o botão de tela cheia no jogo). Como o
  link muda, depois de ligar de novo é preciso adicionar o novo.
- **Link fixo, também de graça:** o Tailscale Funnel dá um endereço que não muda
  (`https://<seu-pc>.<sua-rede>.ts.net`). Precisa criar conta no Tailscale; dá para configurar
  depois, se o link mudando incomodar.
- **Sem PC ligado:** o Codespace continua funcionando como antes (60 horas grátis por mês
  no plano gratuito do GitHub). Lá também dá para usar `bash .devcontainer/jogar-online.sh`
  para ter um link que não depende das portas públicas.
