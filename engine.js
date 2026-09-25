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
    let indiceModificato = -1;
    let nuovoStatoKers = gameState.kersState;
    let kersDamagedByEngine = gameState.kersDamagedByEngine || false;

    const valoreBaseMotore = gameState.baseValues.engine;
    const puntiAssegnatiSetupMotore = gameState.allocations.engine;
    const totaleCaselleDisponibiliMotore = valoreBaseMotore + puntiAssegnatiSetupMotore;
    
    // Verifica se il motore era già completamente esaurito PRIMA di questo click
    const eraCompletamenteOccupato = (arrayUsureMotoreCorrente.length === totaleCaselleDisponibiliMotore);

    if (laCasellaContieneGiaUnaX && arrayUsureMotoreCorrente.length > 0) {
        // Rimozione LIFO (riparazione -> rimuove l'ultimo punto a destra)
        const indiceDaRimuovere = Math.max(...arrayUsureMotoreCorrente);
        const pos = arrayUsureMotoreCorrente.indexOf(indiceDaRimuovere);
        if (pos !== -1) {
            arrayUsureMotoreCorrente.splice(pos, 1);
            indiceModificato = indiceDaRimuovere;
        }
    } else {
        // Inserimento usura
        const totalBoxes = 6;
        const startIdx = totalBoxes - totaleCaselleDisponibiliMotore;
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
            indiceModificato = indiceSinistraDisponibile;
        }
    }

    // Verifica se il motore è completamente esaurito DOPO il click
    const oraCompletamenteOccupato = (arrayUsureMotoreCorrente.length === totaleCaselleDisponibiliMotore);

    // Gestione logica KERS legata al motore:
    if (!eraCompletamenteOccupato && oraCompletamenteOccupato) {
        // Il motore si è appena esaurito del tutto
        if (nuovoStatoKers === 'damaged') {
            // SCENARIO 2: Il KERS era già rotto prima (es. test fallito). Rimane permanentemente rotto.
            kersDamagedByEngine = false;
        } else {
            // SCENARI 1 & 3: Il KERS era attivo/carico o vuoto, ora viene bloccato dal motore
            nuovoStatoKers = 'damaged';
            kersDamagedByEngine = true;
        }
        messaggioAllertaCritica = "Attenzione: Hai esaurito tutti i punti del motore! KERS disabilitato.";
    } else if (eraCompletamenteOccupato && !oraCompletamenteOccupato) {
        // RIPARAZIONE MOTORE: Se il KERS era stato bloccato dal motore, ora torna disponibile e vuoto
        if (kersDamagedByEngine) {
            nuovoStatoKers = 'empty'; 
            kersDamagedByEngine = false;
            messaggioAllertaCritica = "Motore riparato: KERS tornato disponibile e pronto per essere ricaricato.";
        } else {
            // Se era rotto in modo permanente (test KERS), la riparazione del motore non sblocca il KERS
            messaggioAllertaCritica = "Motore riparato (il KERS rimane permanentemente danneggiato).";
        }
    } else if (oraCompletamenteOccupato) {
        messaggioAllertaCritica = "Attenzione: Hai esaurito tutti i punti del motore!";
    }

    updateGameState({
        markedUsages: {
            ...gameState.markedUsages,
            engine: arrayUsureMotoreCorrente
        },
        kersState: nuovoStatoKers,
        kersDamagedByEngine: kersDamagedByEngine
    });

    return {
        operazioneRiuscita: true,
        usureMotoreAggiornate: arrayUsureMotoreCorrente,
        indiceModificato: indiceModificato,
        motoreEsauritoCompletamente: oraCompletamenteOccupato,
        kersStatoCorrente: nuovoStatoKers,
        messaggioDescrittivo: messaggioAllertaCritica || "Motore aggiornato con successo."
    };
}
