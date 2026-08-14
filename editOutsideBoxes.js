// ==========================================
// MODULO: EDIT FUORI DAI BOX (editOutsideBoxes.js)
// Gestione della modalità di modifica in regime di gara
// ==========================================

import { gameState, updateGameState } from './state.js';

/**
 * Sblocca o blocca la modalità di edit fuori dai box durante la gara.
 * 
 * @param {boolean} statoAbilitazioneEdit - True per sbloccare, False per bloccare
 * @returns {Object} - Stato della modale edit
 */
export function impostaStatoModalitaEditFuoriBox(statoAbilitazioneEdit) {
    updateGameState({
        isEditingAllowed: statoAbilitazioneEdit
    });

    return {
        operazioneRiuscita: true,
        editConsentito: statoAbilitazioneEdit,
        messaggioDescrittivo: statoAbilitazioneEdit ? "Modale Edit sbloccata." : "Modale Edit bloccata."
    };
}

/**
 * Verifica se un componente appartiene alla sezione di sinistra (pneumatici, freni, benzina)
 * o di destra (telaio, motore, sospensioni) per determinare la direzione geometrica delle X.
 * 
 * @param {string} nomeComponente - Nome del componente
 * @returns {string} - 'sinistra' oppure 'destra'
 */
export function ottieniDirezioneGeometricaComponente(nomeComponente) {
    const componentiSezioneSinistra = ['tyres', 'brakes', 'fuel'];
    const componentiSezioneDestra = ['body', 'engine', 'suspension'];

    if (componentiSezioneSinistra.includes(nomeComponente)) {
        return 'sinistra';[cite: 3]
    } else if (componentiSezioneDestra.includes(nomeComponente)) {
        return 'destra';[cite: 3]
    }
    return 'sinistra';
}