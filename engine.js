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
    let kersPriorState = gameState.kersPriorState || 'empty';

    const valoreBaseMotore = gameState.baseValues.engine;
    const puntiAssegnatiSetupMotore = gameState.allocations.engine;
    const totaleCaselleDisponibiliMotore = valoreBaseMotore + puntiAssegnatiSetupMotore;
    
    const eraCompletamenteOccupato = (arrayUsureMotoreCorrente.length === totaleCaselleDisponibiliMotore);

    if (laCasellaContieneGiaUnaX && arrayUsureMotoreCorrente.length > 0) {
        const indiceDaRimuovere = Math.max(...arrayUsureMotoreCorrente);
        const pos = arrayUsureMotoreCorrente.indexOf(indiceDaRimuovere);
        if (pos !== -1) {
            arrayUsureMotoreCorrente.splice(pos, 1);
            indiceModificato = indiceDaRimuovere;
        }
    } else {
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

    const oraCompletamenteOccupato = (arrayUsureMotoreCorrente.length === totaleCaselleDisponibiliMotore);

    if (!eraCompletamenteOccupato && oraCompletamenteOccupato) {
        // Il motore si è appena rotto del tutto
        if (nuovoStatoKers !== 'damaged') {
            kersPriorState = nuovoStatoKers; // Salviamo lo stato esatto del KERS prima che si rompesse il motore
            nuovoStatoKers = 'damaged';
            kersDamagedByEngine = true;
        } else {
            kersDamagedByEngine = false; // Era già rotto in precedenza per test KERS fallito
        }
        messaggioAllertaCritica = "Attenzione: Hai esaurito tutti i punti del motore! KERS disabilitato.";
    } else if (eraCompletamenteOccupato && !oraCompletamenteOccupato) {
        // Stiamo rimuovendo una X dal motore (riparazione o correzione click)
        if (gameState.isPitStopActive) {
            // SIAMO AI BOX: La riparazione sblocca il KERS facendolo tornare vuoto (empty)
            if (kersDamagedByEngine) {
                nuovoStatoKers = 'empty'; 
                kersDamagedByEngine = false;
                messaggioAllertaCritica = "Motore riparato ai box: KERS tornato disponibile e pronto per essere ricaricato.";
            } else {
                messaggioAllertaCritica = "Motore riparato ai box (il KERS rimane permanentemente danneggiato).";
            }
        } else {
            // NON SIAMO AI BOX (es. click accidentale corretto al volo): Ripristiniamo esattamente lo stato precedente del KERS!
            if (kersDamagedByEngine) {
                nuovoStatoKers = kersPriorState; 
                kersDamagedByEngine = false;
                messaggioAllertaCritica = "Ripristino punto motore: il KERS è tornato allo stato precedente.";
            }
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
        kersDamagedByEngine: kersDamagedByEngine,
        kersPriorState: kersPriorState
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
