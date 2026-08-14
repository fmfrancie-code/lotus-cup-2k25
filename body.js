// ==========================================
// MODULO: TELAIO (body.js)
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
        // Rimozione della X (da destra verso sinistra per i componenti di destra)
        const indiceDaRimuovere = arrayUsureTelaioCorrente.indexOf(indiceCasellaSelezionata);
        if (indiceDaRimuovere !== -1) {
            arrayUsureTelaioCorrente.splice(indiceDaRimuovere, 1);
        }
    } else {
        // Inserimento della X (da sinistra verso destra per i componenti di destra)
        arrayUsureTelaioCorrente.push(indiceCasellaSelezionata);
    }

    const valoreBaseTelaio = gameState.baseValues.body;
    const puntiAssegnatiSetupTelaio = gameState.allocations.body;
    const totaleCaselleDisponibiliTelaio = valoreBaseTelaio + puntiAssegnatiSetupTelaio;

    const tutteLeCaselleTelaioSonoOccupate = (arrayUsureTelaioCorrente.length === totaleCaselleDisponibiliTelaio);

    if (tutteLeCaselleTelaioSonoOccupate) {
        // Regola critica Telaio: esaurimento totale rompe l'alettone se attivo
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