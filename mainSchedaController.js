// ==========================================
// MODULO: MAIN SCHEDA CONTROLLER (mainSchedaController.js)
// Coordinatore globale della plancia e delle fasi di gioco
// ==========================================

import { gameState, updateGameState } from './state.js';
import { applyTheme } from './layout.js';

/**
 * Inizializza la scheda del pilota caricando le preferenze e impostando il tema grafico.
 * 
 * @param {Object} datiInizialiPilota - Informazioni di base (nome, id, codice stanza, tema)
 */
export function inizializzaSchedaPilota(datiInizialiPilota) {
    updateGameState({
        code: datiInizialiPilota.code,
        playerName: datiInizialiPilota.playerName,
        playerId: datiInizialiPilota.playerId,
        theme: datiInizialiPilota.theme || 'ironman'
    });

    applyTheme(gameState.theme);
}

/**
 * Transizione della scheda verso la fase di Ufficializzazione / Gara.
 * Vengono bloccati i punti di setup e attivata la modalità di gara.
 */
export function ufficializzaSchedaPerGara() {
    const budgetRimanenteInSetup = gameState.budget;
    
    if (budgetRimanenteInSetup > 0) {
        return {
            operazioneRiuscita: false,
            messaggioDescrittivo: `Attenzione: Devi esaurire tutti i punti budget (rimanenti: ${budgetRimanenteInSetup}) prima di ufficializzare la scheda!`
        };
    }

    updateGameState({
        isSetupMode: false,
        isRaceMode: true,
        isEditingAllowed: false,
        isReady: true
    });

    return {
        operazioneRiuscita: true,
        messaggioDescrittivo: "Scheda ufficializzata con successo! La gara è iniziata."
    };
}