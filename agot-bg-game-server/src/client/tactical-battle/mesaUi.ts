import { observable } from "mobx";

/**
 * Estado da tela da Mesa de Batalha (só no navegador). A tela fica aberta do começo ao fim da batalha e só passa de
 * etapa; quem minimiza, minimiza só a etapa atual (a próxima etapa abre sozinha).
 *  - minKey: etapa que foi minimizada;
 *  - openKey: etapa aberta à mão ("*" = a que estiver valendo), para as etapas que começam minimizadas.
 */
export const mesaUi = observable({
  minKey: "",
  openKey: ""
});

export function openMesa(): void {
  mesaUi.minKey = "";
  mesaUi.openKey = "*";
}
