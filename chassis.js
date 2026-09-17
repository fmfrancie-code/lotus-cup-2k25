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
    let alettoneAttivoAggiornato = gameState.alettoneAttivo;

    const totalBoxes = 6;
    const valoreBaseTelaio = gameState.baseValues.body;
    const puntiAssegnatiSetupTelaio = gameState.allocations.body;
    const totaleCaselleDisponibiliTelaio = valoreBaseTelaio + puntiAssegnatiSetupTelaio;
    
    const startIdx = totalBoxes - totaleCaselleDisponibiliTelaio;
    const endIdx = totalBoxes - 1;
    
    // L'alettone occupa la prima casella a sinistra SOLO SE l'alettone è stato effettivamente scelto in setup
    const wingBoxIndex = gameState.alettoneAttivo ? startIdx : -1;

    if (laCasellaContieneGiaUnaX) {
        // Se la casella cliccata ha già una X, rimuovila
        const indiceDaRimuovere = arrayUsureTelaioCorrente.indexOf(indiceCasellaSelezionata);
        if (indiceDaRimuovere !== -1) {
            arrayUsureTelaioCorrente.splice(indiceDaRimuovere, 1);
        }
    } else {
        // INSERIMENTO DA SINISTRA A DESTRA
        let indiceSinistraDisponibile = -1;
        
        for (let i = startIdx; i <= endIdx; i++) {
            // Se l'alettone è attivo, saltiamo la prima casella riservata
            if (gameState.alettoneAttivo && i === wingBoxIndex) {
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

    // Controllo rottura alettone: avviene SOLO SE l'alettone era attivo ed è esaurito il resto del telaio
    if (gameState.alettoneAttivo) {
        const slotUsuraTotali = totaleCaselleDisponibiliTelaio - 1;
        const usureEffettive = arrayUsureTelaioCorrente.filter(i => i !== wingBoxIndex).length;

        if (usureEffettive >= slotUsuraTotali) {
            alettoneAttivoAggiornato = false; // L'alettone si rompe
            if (!arrayUsureTelaioCorrente.includes(wingBoxIndex)) {
                arrayUsureTelaioCorrente.push(wingBoxIndex); // Mette la X rossa sullo slot alettone
            }
            messaggioAllertaCritica = "Attenzione: Hai finito i punti telaio! L'alettone è stato compromesso.";
        }
    }

    updateGameState({
        markedUsages: {
            ...gameState.markedUsages,
            body: arrayUsureTelaioCorrente
        },
        alettoneAttivo: alettoneAttivoAggiornato
    });

    return {
        operazioneRiuscita: true,
        usureTelaioAggiornate: arrayUsureTelaioCorrente,
        messaggioDescrittivo: messaggioAllertaCritica || "Telaio aggiornato con successo."
    };
}
