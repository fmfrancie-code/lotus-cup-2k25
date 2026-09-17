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
        // Se la casella cliccata ha già una X, rimuovila
        arrayUsureMotoreCorrente.splice(arrayUsureMotoreCorrente.indexOf(indiceCasellaSelezionata), 1);
    } else {
        // INSERIMENTO SPECULARE (DA SINISTRA VERSO DESTRA per le sezioni di destra):
        const totalBoxes = 6;
        const valoreBaseMotore = gameState.baseValues.engine;
        const puntiAssegnatiSetupMotore = gameState.allocations.engine;
        const totaleCaselleMotore = valoreBaseMotore + puntiAssegnatiSetupMotore;
        
        // Per le sezioni di destra, le caselle valide vanno da (totalBoxes - totaleCaselleMotore) fino a (totalBoxes - 1)
        const startIdx = totalBoxes - totaleCaselleMotore;
        const endIdx = totalBoxes - 1;

        let indiceSinistraDisponibile = -1;
        // Scansiona partendo da sinistra verso destra
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
