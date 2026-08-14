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
        // Rimozione della X (da destra verso sinistra)
        const indiceDaRimuovere = arrayUsureSospensioniCorrente.indexOf(indiceCasellaSelezionata);
        if (indiceDaRimuovere !== -1) {
            arrayUsureSospensioniCorrente.splice(indiceDaRimuovere, 1);
        }
    } else {
        // Inserimento della X (da sinistra verso destra)
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