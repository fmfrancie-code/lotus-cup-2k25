// ==========================================
// MODULO: TELAIO (chassis.js)
// ==========================================

import { gameState, updateGameState } from './state.js';

/**
 * Gestisce l'usura e la modifica delle X sul Telaio.
 * 
 * @param {number} indiceCasellaSelezionata - Indice della casella del telaio cliccata
 * @returns {Object} - Stato aggiornato e messaggi critici
 */
export function gestisciUsuraTelaio(indiceCasellaSelezionata) {
    const arrayUsureTelaioCorrente = [...gameState.markedUsages.body];
    const laCasellaContieneGiaUnaX = arrayUsureTelaioCorrente.includes(indiceCasellaSelezionata);
    
    let messaggioAllertaCritica = "";
    let alettoneAttivoAggiornato = gameState.wingActive;

    if (laCasellaContieneGiaUnaX) {
        // Se la casella cliccata ha già una X, rimuovila
        const indiceDaRimuovere = arrayUsureTelaioCorrente.indexOf(indiceCasellaSelezionata);
        if (indiceDaRimuovere !== -1) {
            arrayUsureTelaioCorrente.splice(indiceDaRimuovere, 1);
        }
    } else {
        // INSERIMENTO SPECULARE (DA SINISTRA VERSO DESTRA per le sezioni di destra):
        const totalBoxes = 6;
        const valoreBaseTelaio = gameState.baseValues.body;
        const puntiAssegnatiSetupTelaio = gameState.allocations.body;
        const totaleCaselleDisponibiliTelaio = valoreBaseTelaio + puntiAssegnatiSetupTelaio;
        
        const startIdx = totalBoxes - totaleCaselleDisponibiliTelaio;
        const endIdx = totalBoxes - 1;
        const wingBoxIndex = startIdx; // La prima casella a sinistra ospita l'alettone se attivo

        let indiceSinistraDisponibile = -1;
        // Scansiona partendo da sinistra verso destra
        for (let i = startIdx; i <= endIdx; i++) {
            // Se l'alettone è attivo, la prima casella a sinistra è protetta e non riceve usura diretta
            if (gameState.wingActive && i === wingBoxIndex) {
                continue;
            }
            if (!arrayUsureTelaioCorrente.includes(i)) {
                indiceSinistraDisponibile = i;
                break;
            }
        }

        if (indiceSinistraDisponibile !== -1) {
            arrayUsureTelaioCorrente.push(indiceSinistraDisponibile);
        }
    }

    const valoreBaseTelaio = gameState.baseValues.body;
    const puntiAssegnatiSetupTelaio = gameState.allocations.body;
    const totaleCaselleDisponibiliTelaio = valoreBaseTelaio + puntiAssegnatiSetupTelaio;
    const tutteLeCaselleTelaioSonoOccupate = (arrayUsureTelaioCorrente.length === totaleCaselleDisponibiliTelaio);

    if (tutteLeCaselleTelaioSonoOccupate) {
        if (gameState.wingActive) {
            alettoneAttivoAggiornato = false; // L'alettone diventa fuori uso (X rossa)
        }
        messaggioAllertaCritica = "Attenzione: Hai finito i punti telaio! L'alettone è stato compromesso.";
    } else {
        // Se si ripara almeno un punto telaio e l'alettone era stato disattivato per usura, lo ripristiniamo
        // (Nota: controlliamo se l'utente aveva l'alettone impostato o se vogliamo riabilitarlo)
        if (!gameState.wingActive && arrayUsureTelaioCorrente.length < totaleCaselleDisponibiliTelaio) {
            // Se l'utente aveva originariamente scelto di montare l'alettone in setup, ritorna disponibile
            // (Verifichiamo se l'alettone non era stato spento volontariamente ma per esaurimento punti)
            alettoneAttivoAggiornato = true; 
        }
    }

    updateGameState({
        markedUsages: {
            ...gameState.markedUsages,
            body: arrayUsureTelaioCorrente
        },
        wingActive: alettoneAttivoAggiornato
    });

    return {
        operazioneRiuscita: true,
        usureTelaioAggiornate: arrayUsureTelaioCorrente,
        telaioEsauritoCompletamente: tutteLeCaselleTelaioSonoOccupate,
        messaggioDescrittivo: messaggioAllertaCritica || "Telaio aggiornato con successo."
    };
}
