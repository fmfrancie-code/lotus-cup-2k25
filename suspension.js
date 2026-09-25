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
    
    let indiceModificato = -1;

    if (laCasellaContieneGiaUnaX && arrayUsureSospensioniCorrente.length > 0) {
        const indiceDaRimuovere = Math.max(...arrayUsureSospensioniCorrente);
        const pos = arrayUsureSospensioniCorrente.indexOf(indiceDaRimuovere);
        if (pos !== -1) {
            arrayUsureSospensioniCorrente.splice(pos, 1);
            indiceModificato = indiceDaRimuovere;
        }
    } else {
        const totalBoxes = 6;
        const valoreBase = gameState.baseValues.suspension;
        const puntiAssegnatiSetup = gameState.allocations.suspension;
        const totaleCaselle = valoreBase + puntiAssegnatiSetup;
        
        const startIdx = totalBoxes - totaleCaselle;
        const endIdx = totalBoxes - 1;

        let indiceSinistraDisponibile = -1;
        for (let i = startIdx; i <= endIdx; i++) {
            if (!arrayUsureSospensioniCorrente.includes(i)) {
                indiceSinistraDisponibile = i;
                break;
            }
        }

        if (indiceSinistraDisponibile !== -1) {
            arrayUsureSospensioniCorrente.push(indiceSinistraDisponibile);
            indiceModificato = indiceSinistraDisponibile;
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
        indiceModificato: indiceModificato,
        messaggioDescrittivo: "Sospensioni aggiornate con successo."
    };
}
