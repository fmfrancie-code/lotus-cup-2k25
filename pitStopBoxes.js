// ==========================================
// MODULO: BOX & PIT STOP (pitStopBoxes.js)
// Gestione delle riparazioni, rifornimento e ripartenza dai box
// ==========================================

import { gameState, updateGameState } from './state.js';

/**
 * Avvia la sessione di Pit Stop per il pilota.
 */
export function avviaSessionePitStop(numeroGiroCorrente) {
    updateGameState({
        isPitStopActive: true,
        pitStopStartLap: numeroGiroCorrente
    });

    return {
        operazioneRiuscita: true,
        messaggioDescrittivo: `Pit Stop avviato al giro ${numeroGiroCorrente}. Sessione box attiva.`
    };
}

/**
 * Esegue la procedura di uscita e ripartenza dai box, verificando il vincolo dello stint 2 o 3,
 * calcolando il riepilogo di bonus/malus e azzerando i contatori temporanei[cite: 3].
 * 
 * @returns {Object} - Riepilogo completo di uscita dai box
 */
export function finalizzaRipartenzaDaiBox() {
    const stint2Attivo = gameState.tyreLaps.Prime.some(g => g > 1) || 
                         gameState.tyreLaps.Option.some(g => g > 1) || 
                         gameState.tyreLaps.Intermedie.some(g => g > 1) || 
                         gameState.tyreLaps.Pioggia.some(g => g > 1);

    // REGOLA: Se si prova ad uscire dai box senza la selezione dello stint 2 o 3, un messaggio inviterà alla selezione[cite: 3]
    if (!stint2Attivo && gameState.workshopUsages.length === 0) {
        return {
            operazioneRiuscita: false,
            messaggioDescrittivo: "Impossibile uscire dai box: Devi selezionare lo stint 2 o 3 per i pneumatici prima di ripartire!"[cite: 3]
        };
    }

    // Calcolo del malus MOV accumulato dai punti officina
    const quantitaPuntiOfficinaUsati = gameState.workshopUsages.length;
    let malusMovFinaleOfficina = 0;
    if (quantitaPuntiOfficinaUsati === 1) malusMovFinaleOfficina = -2;[cite: 3]
    else if (quantitaPuntiOfficinaUsati === 2) malusMovFinaleOfficina = -4;[cite: 3]
    else if (quantitaPuntiOfficinaUsati === 3) malusMovFinaleOfficina = -6;[cite: 3]

    // Chiusura della sessione box e azzeramento del contatore malus officina per i turni successivi[cite: 3]
    updateGameState({
        isPitStopActive: false,
        workshopUsages: [] // Azzeramento contatore malus per ripartire a -0 MOV[cite: 3]
    });

    const messaggioRiepilogoUscita = `Uscita dai box completata! Malus officina applicato al tiro di dado: ${malusMovFinaleOfficina} MOV. Il contatore malus è stato azzerato a -0 MOV.`;[cite: 3]

    return {
        operazioneRiuscita: true,
        malusApplicato: malusMovFinaleOfficina,
        messaggioDescrittivo: messaggioRiepilogoUscita
    };
}