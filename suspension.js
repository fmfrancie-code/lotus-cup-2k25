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
    
    if (laCasellaContieneGiaUnaX) {
        // Se la casella cliccata ha già una X, rimuovila
        arrayUsureSospensioniCorrente.splice(arrayUsureSospensioniCorrente.indexOf(indiceCasellaSelezionata), 1);
    } else {
        // INSERIMENTO SPECULARE (DA SINISTRA VERSO DESTRA per le sezioni di destra):
        const totalBoxes = 6;
        const valoreBase = gameState.baseValues.suspension;
        const puntiAssegnatiSetup = gameState.allocations.suspension;
        const totaleCaselle = valoreBase + puntiAssegnatiSetup;
        
        // Per le sezioni di destra, le caselle valide vanno da (totalBoxes - totaleCaselle) fino a (totalBoxes - 1)
        const startIdx = totalBoxes - totaleCaselle;
        const endIdx = totalBoxes - 1;

        let indiceSinistraDisponibile = -1;
        // Scansiona partendo da sinistra verso destra
        for (let i = startIdx; i <= endIdx; i++) {
            if (!arrayUsureSospensioniCorrente.includes(i)) {
                indiceSinistraDisponibile = i;
                break;
            }
        }

        if (indiceSinistraDisponibile !== -1) {
            arrayUsureSospensioniCorrente.push(indiceSinistraDisponibile);
        }
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
        messaggioDescrittivo: "Sospensioni aggiornate con successo."
    };
}
