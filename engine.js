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

    if (laCasellaContieneGiaUnaX && arrayUsureMotoreCorrente.length > 0) {
        // Rimozione LIFO automatica (indice massimo per riempimento da sinistra a destra)
        const indiceDaRimuovere = Math.max(...arrayUsureMotoreCorrente);
        const pos = arrayUsureMotoreCorrente.indexOf(indiceDaRimuovere);
        if (pos !== -1) {
            arrayUsureMotoreCorrente.splice(pos, 1);
        }
    } else {
        const totalBoxes = 6;
        const valoreBaseMotore = gameState.baseValues.engine;
        const puntiAssegnatiSetupMotore = gameState.allocations.engine;
        const totaleCaselleMotore = valoreBaseMotore + puntiAssegnatiSetupMotore;
        
        const startIdx = totalBoxes - totaleCaselleMotore;
        const endIdx = totalBoxes - 1;

        let indiceSinistraDisponibile = -1;
        for (let i = startIdx; i <= endIdx; i++) {
            if (!arrayUsureMotoreCorrente.includes(i)) {
                indiceSinistraDisponibile = i;
                break;
            }
        }

        if (indiceSinistraDisponibile !== -1) {
            arrayUsureMotoreCorrente.push(indiceSinistraDisponibile);
        }
    }

    const valoreBaseMotore = gameState.baseValues.engine;
    const puntiAssegnatiSetupMotore = gameState.allocations.engine;
    const totaleCaselleDisponibiliMotore = valoreBaseMotore + puntiAssegnatiSetupMotore;
    const tutteLeCaselleMotoreSonoOccupate = (arrayUsureMotoreCorrente.length === totaleCaselleDisponibiliMotore);

    if (tutteLeCaselleMotoreSonoOccupate) {
        messaggioAllertaCritica = "Attenzione: Hai esaurito tutti i punti del motore!";
    }

    updateGameState({
        markedUsages: {
            ...gameState.markedUsages,
            engine: arrayUsureMotoreCorrente
        }
    });

    return {
        operazioneRiuscita: true,
        usureMotoreAggiornate: arrayUsureMotoreCorrente,
        motoreEsauritoCompletamente: tutteLeCaselleMotoreSonoOccupate,
        messaggioDescrittivo: messaggioAllertaCritica || "Motore aggiornato con successo."
    };
}
