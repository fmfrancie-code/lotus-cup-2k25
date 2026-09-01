// ==========================================
// MODULO: MAIN SCHEDA CONTROLLER (mainSchedaController.js)
// Coordinatore globale della plancia e delle fasi di gioco
// ==========================================

import { gameState, updateGameState } from './state.js';
import { assegnaPuntoBudgetSetup } from './setupPhase.js';
import { gestisciConsumoBenzinaEModifica } from './fuel.js';
import { gestisciUsuraMotore } from './engine.js';
import { gestisciModificaUsuraFreniETrafilamentoKers } from './brakesKers.js';
import { gestisciUsuraTelaio } from './chassis.js';
import { gestisciUsuraSospensioni } from './suspension.js';

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
        theme: datiInizialiPilota.theme,
        budget: 13,
        allocations: {
            tyres: 0,
            brakes: 0,
            fuel: 0,
            body: 0,
            engine: 0,
            suspension: 0
        }
    });
}

/**
 * Transizione della scheda verso la fase di Ufficializzazione / Gara.
 * Vengono bloccati i punti di setup e attivata la modalitÃ  di gara.
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

/**
 * Gestisce l'assegnazione o la modifica di un punto budget per una specifica area della monoposto.
 * 
 * @param {string} tipoArea - L'area della scheda (es. 'tyres', 'brakes', ecc.)
 * @param {number} delta - Quantità da aggiungere o sottrarre (es. +1 o -1)
 * @returns {Object} Risultato dell'operazione di budget
 */
export function gestisciAssegnazioneBudget(tipoArea, delta) {
    return assegnaPuntoBudgetSetup(tipoArea, delta);
}
