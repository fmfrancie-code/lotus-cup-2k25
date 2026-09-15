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
        arrayUsureTelaioCorrente.splice(arrayUsureTelaioCorrente.indexOf(indiceCasellaSelezionata), 1);
    } else {
        arrayUsureTelaioCorrente.push(indiceCasellaSelezionata);
    }

    const valoreBaseTelaio = gameState.baseValues.body;
    const puntiAssegnatiSetupTelaio = gameState.allocations.body;
    const totaleCaselleDisponibiliTelaio = valoreBaseTelaio + puntiAssegnatiSetupTelaio;
    const tutteLeCaselleTelaioSonoOccupate = (arrayUsureTelaioCorrente.length === totaleCaselleDisponibiliTelaio);

    if (tutteLeCaselleTelaioSonoOccupate) {
        if (gameState.wingActive) {
            alettoneAttivoAggiornato = false;
        }
        messaggioAllertaCritica = "Attenzione: Hai finito i punti telaio! L'alettone è stato compromesso.";
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
