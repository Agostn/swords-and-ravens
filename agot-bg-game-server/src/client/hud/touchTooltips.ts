/**
 * Celular e tablet: os balões de explicação (a barra preta) só aparecem
 * quando o dedo SEGURA em cima de algo por meio segundo. Um toque normal
 * só faz a ação (escolher, clicar), sem abrir o balão.
 *
 * Como funciona: com a classe "touch-tooltips" no <body>, o CSS esconde os
 * balões. Ao segurar, a classe "touch-tip-on" libera os balões e avisamos o
 * elemento como se o mouse tivesse passado por cima dele. Ao soltar o dedo,
 * o toque não vira clique (para não escolher nada sem querer); o balão fica
 * na tela até o próximo toque.
 */

const HOLD_MS = 450;
const MOVE_TOLERANCE = 10;

let installed = false;
let holdTimer: number | null = null;
let hideTimer: number | null = null;
let startX = 0;
let startY = 0;
let holding = false;
let shownOn: Element | null = null;

export function isTouchDevice(): boolean {
  try {
    return (
      window.matchMedia("(hover: none)").matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  } catch {
    return false;
  }
}

function hideTip(): void {
  if (hideTimer != null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (shownOn) {
    shownOn.dispatchEvent(
      new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body })
    );
    shownOn = null;
  }
  document.body.classList.remove("touch-tip-on");
}

function cancelHold(): void {
  if (holdTimer != null) {
    window.clearTimeout(holdTimer);
    holdTimer = null;
  }
}

function onTouchStart(e: TouchEvent): void {
  hideTip();
  cancelHold();
  holding = false;
  if (e.touches.length != 1) return;
  const target = e.target as Element | null;
  if (!target) return;
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  holdTimer = window.setTimeout(() => {
    holdTimer = null;
    holding = true;
    // balões abertos por toques anteriores continuam escondidos
    document
      .querySelectorAll(".tooltip, .image-popover")
      .forEach((el) => el.classList.add("touch-stale"));
    document.body.classList.add("touch-tip-on");
    target.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    shownOn = target;
    try {
      navigator.vibrate?.(8);
    } catch {
      // sem vibração
    }
    // some sozinho depois de um tempo
    hideTimer = window.setTimeout(hideTip, 6000);
  }, HOLD_MS);
}

function onTouchMove(e: TouchEvent): void {
  if (holdTimer == null || e.touches.length != 1) return;
  const dx = e.touches[0].clientX - startX;
  const dy = e.touches[0].clientY - startY;
  if (Math.abs(dx) > MOVE_TOLERANCE || Math.abs(dy) > MOVE_TOLERANCE) {
    cancelHold();
  }
}

function onTouchEnd(e: TouchEvent): void {
  cancelHold();
  if (holding) {
    // segurou para ver a explicação: não vale como clique
    if (e.cancelable) e.preventDefault();
    holding = false;
  }
}

// segurar o dedo no Android abre o menu do navegador; aqui não precisa
function onContextMenu(e: Event): void {
  if (document.body.classList.contains("touch-tip-on")) e.preventDefault();
}

export function installTouchTooltips(): void {
  if (installed || !isTouchDevice()) return;
  installed = true;
  document.body.classList.add("touch-tooltips");
  document.addEventListener("touchstart", onTouchStart, {
    passive: true,
    capture: true
  });
  document.addEventListener("touchmove", onTouchMove, {
    passive: true,
    capture: true
  });
  document.addEventListener("touchend", onTouchEnd, {
    passive: false,
    capture: true
  });
  document.addEventListener("touchcancel", cancelHold, { capture: true });
  document.addEventListener("contextmenu", onContextMenu, { capture: true });
}
