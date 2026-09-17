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

    if (laCasellaContieneGiaUnaX) {
        // Se la casella cliccata ha già una X, rimuovila
        const indiceDaRimuovere = arrayUsureTelaioCorrente.indexOf(indiceCasellaSelezionata);
        if (indiceDaRimuovere !== -1) {
            arrayUsureTelaioCorrente.splice(indiceDaRimuovere, 1);
        }
    } else {
        // INSERIMENTO SPECULARE (DA SINISTRA A DESTRA per le sezioni di destra)
        const totalBoxes = 6;
        const valoreBaseTelaio = gameState.baseValues.body;
        const puntiAssegnatiSetupTelaio = gameState.allocations.body;
        const totaleCaselleDisponibiliTelaio = valoreBaseTelaio + puntiAssegnatiSetupTelaio;
        
        // Per il telaio a destra, le caselle valide partono da startIdx
        const startIdx = totalBoxes - totaleCaselleDisponibiliTelaio;
        const endIdx = totalBoxes - 1;
        
        // L'alettone occupa rigorosamente il primissimo slot a sinistra dell'area attiva del telaio
        const wingBoxIndex = startIdx; 

        let indiceSinistraDisponibile = -1;
        // Scansiona partendo da sinistra verso destra
        for (let i = startIdx; i <= endIdx; i++) {
            // Se l'alettone è attivo, la primissima casella a sinistra (wingBoxIndex) è protetta
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

    const valoreBaseTelaio = gameState.baseValues.body;
    const puntiAssegnatiSetupTelaio = gameState.allocations.body;
    const totaleCaselleDisponibiliTelaio = valoreBaseTelaio + puntiAssegnatiSetupTelaio;
    const tutteLeCaselleTelaioSonoOccupate = (arrayUsureTelaioCorrente.length === totaleCaselleDisponibiliTelaio);

    if (tutteLeCaselleTelaioSonoOccupate) {
        if (gameState.alettoneAttivo) {
            alettoneAttivoAggiornato = false;
        }
        messaggioAllertaCritica = "Attenzione: Hai finito i punti telaio! L'alettone è stato compromesso.";
    } else {
        if (!gameState.alettoneAttivo && arrayUsureTelaioCorrente.length < totaleCaselleDisponibiliTelaio) {
            alettoneAttivoAggiornato = true; 
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
        telaioEsauritoCompletamente: tutteLeCaselleTelaioSonoOccupate,
        messaggioDescrittivo: messaggioAllertaCritica || "Telaio aggiornato con successo."
    };
}
