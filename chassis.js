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
    
    const totalBoxes = 6;
    const valoreBaseTelaio = gameState.baseValues.body;
    const puntiAssegnatiSetupTelaio = gameState.allocations.body;
    const totaleCaselleDisponibiliTelaio = valoreBaseTelaio + puntiAssegnatiSetupTelaio;
    
    const startIdx = totalBoxes - totaleCaselleDisponibiliTelaio;
    const endIdx = totalBoxes - 1;
    const wingBoxIndex = gameState.alettoneAttivo ? startIdx : -1;

    if (indiceCasellaSelezionata === wingBoxIndex) {
        return { operazioneRiuscita: false, messaggioDescrittivo: "Questa casella indica l'alettone attivo e non riceve usura diretta." };
    }

    const laCasellaContieneGiaUnaX = arrayUsureTelaioCorrente.includes(indiceCasellaSelezionata);
    let alettoneDanneggiatoAggiornato = gameState.alettoneDanneggiato || false;

    const usureEffettive = arrayUsureTelaioCorrente.filter(i => i !== wingBoxIndex);

    if (laCasellaContieneGiaUnaX && usureEffettive.length > 0) {
        const indiceDaRimuovere = Math.max(...usureEffettive);
        const pos = arrayUsureTelaioCorrente.indexOf(indiceDaRimuovere);
        if (pos !== -1) {
            arrayUsureTelaioCorrente.splice(pos, 1);
        }
    } else {
        let indiceSinistraDisponibile = -1;
        for (let i = startIdx; i <= endIdx; i++) {
            if (gameState.alettoneAttivo && i === wingBoxIndex) continue;
            if (!arrayUsureTelaioCorrente.includes(i)) {
                indiceSinistraDisponibile = i;
                break;
            }
        }
        if (indiceSinistraDisponibile !== -1) {
            arrayUsureTelaioCorrente.push(indiceSinistraDisponibile);
        }
    }

    const slotUsuraTotali = gameState.alettoneAttivo ? (totaleCaselleDisponibiliTelaio - 1) : totaleCaselleDisponibiliTelaio;
    const usureEffettiveCount = arrayUsureTelaioCorrente.filter(i => i !== wingBoxIndex).length;

    let messaggioAllertaCritica = "";
    if (gameState.alettoneAttivo && usureEffettiveCount >= slotUsuraTotali) {
        alettoneDanneggiatoAggiornato = true;
        messaggioAllertaCritica = "Attenzione: Punti telaio esauriti! L'alettone è fuori uso.";
    } else {
        if (usureEffettiveCount < slotUsuraTotali) {
            alettoneDanneggiatoAggiornato = false;
        }
    }

    updateGameState({
        markedUsages: {
            ...gameState.markedUsages,
            body: arrayUsureTelaioCorrente
        },
        alettoneDanneggiato: alettoneDanneggiatoAggiornato
    });

    return {
        operazioneRiuscita: true,
        usureTelaioAggiornate: arrayUsureTelaioCorrente,
        messaggioDescrittivo: messaggioAllertaCritica || "Telaio aggiornato con successo."
    };
}
