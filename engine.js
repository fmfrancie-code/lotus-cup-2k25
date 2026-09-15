// ==========================================
// MODULO: MOTORE (engine.js)
// ==========================================

import { gameState, updateGameState } from './state.js';

/**
 * Gestisce l'usura e la modifica delle X sul Motore.
 * 
 * @param {number} indiceCasellaSelezionata - Indice della casella del motore cliccata
 * @returns {Object} - Stato aggiornato e messaggi critici di fault
 */
export function gestisciUsuraMotore(indiceCasellaSelezionata) {
    const arrayUsureMotoreCorrente = [...gameState.markedUsages.engine];
    const laCasellaContieneGiaUnaX = arrayUsureMotoreCorrente.includes(indiceCasellaSelezionata);
    
    let messaggioAllertaCritica = "";
    let statoKersAggiornato = gameState.kersState;

    if (laCasellaContieneGiaUnaX) {
        arrayUsureMotoreCorrente.splice(arrayUsureMotoreCorrente.indexOf(indiceCasellaSelezionata), 1);
    } else {
        arrayUsureMotoreCorrente.push(indiceCasellaSelezionata);
    }

    const valoreBaseMotore = gameState.baseValues.engine;
    const puntiAssegnatiSetupMotore = gameState.allocations.engine;
    const totaleCaselleDisponibiliMotore = valoreBaseMotore + puntiAssegnatiSetupMotore;
    const tutteLeCaselleMotoreSonoOccupate = (arrayUsureMotoreCorrente.length === totaleCaselleDisponibiliMotore);

    if (tutteLeCaselleMotoreSonoOccupate) {
        statoKersAggiornato = 'damaged';
        messaggioAllertaCritica = "Attenzione: Hai finito i punti motore! Motore in fault e KERS danneggiato.";
    }

    updateGameState({
        markedUsages: {
            ...gameState.markedUsages,
            engine: arrayUsureMotoreCorrente
        },
        kersState: statoKersAggiornato
    });

    return {
        operazioneRiuscita: true,
        usureMotoreAggiornate: arrayUsureMotoreCorrente,
        motoreEsauritoCompletamente: tutteLeCaselleMotoreSonoOccupate,
        messaggioDescrittivo: messaggioAllertaCritica || "Motore aggiornato con successo."
    };
}
