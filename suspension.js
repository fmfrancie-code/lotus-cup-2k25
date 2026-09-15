// ==========================================
// MODULO: SOSPENSIONI (suspension.js)
// ==========================================

import { gameState, updateGameState } from './state.js';

/**
 * Gestisce l'usura e la modifica delle X sulle Sospensioni.
 * 
 * @param {number} indiceCasellaSelezionata - Indice della casella delle sospensioni cliccata
 * @returns {Object} - Stato aggiornato e messaggi di avviso
 */
export function gestisciUsuraSospensioni(indiceCasellaSelezionata) {
    const arrayUsureSospensioniCorrente = [...gameState.markedUsages.suspension];
    const laCasellaContieneGiaUnaX = arrayUsureSospensioniCorrente.includes(indiceCasellaSelezionata);
    
    let messaggioAllertaCritica = "";

    if (laCasellaContieneGiaUnaX) {
        arrayUsureSospensioniCorrente.splice(arrayUsureSospensioniCorrente.indexOf(indiceCasellaSelezionata), 1);
    } else {
        arrayUsureSospensioniCorrente.push(indiceCasellaSelezionata);
    }

    const valoreBaseSospensioni = gameState.baseValues.suspension;
    const puntiAssegnatiSetupSospensioni = gameState.allocations.suspension;
    const totaleCaselleDisponibiliSospensioni = valoreBaseSospensioni + puntiAssegnatiSetupSospensioni;
    const tutteLeCaselleSospensioniSonoOccupate = (arrayUsureSospensioniCorrente.length === totaleCaselleDisponibiliSospensioni);

    if (tutteLeCaselleSospensioniSonoOccupate) {
        messaggioAllertaCritica = "Attenzione: Hai finito i punti sospensioni!";
    }

    updateGameState({
        markedUsages: {
            ...gameState.markedUsages,
            suspension: arrayUsureSospensioniCorrente
        }
    });

    return {
        operazioneRiuscita: true,
        usureSospensioniAggiornate: arrayUsureSospensioniCorrente,
        sospensioniEsauriteCompletamente: tutteLeCaselleSospensioniSonoOccupate,
        messaggioDescrittivo: messaggioAllertaCritica || "Sospensioni aggiornate con successo."
    };
}
