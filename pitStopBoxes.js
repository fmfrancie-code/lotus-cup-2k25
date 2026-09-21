// ==========================================
// MODULO: BOX & PIT STOP (pitStopBoxes.js)
// Gestione delle riparazioni, rifornimento e ripartenza dai box
// ==========================================

import { gameState, updateGameState } from './state.js';

export function avviaSessionePitStop(numeroGiroCorrente) {
    updateGameState({
        isPitStopActive: true,
        pitStopStartLap: numeroGiroCorrente,
        previousTyreUsages: [...(gameState.markedUsages.tyres || [])] // Snapshot usure gomme
    });

    return {
        operazioneRiuscita: true,
        messaggioDescrittivo: `Pit Stop avviato al giro ${numeroGiroCorrente}. Sessione box attiva.`
    };
}

export function registraPuntoRiparazioneOfficina() {
    if (!gameState.isPitStopActive) return null;

    let workshop = [...(gameState.workshopUsages || [])];
    if (workshop.length < 3) {
        let indiceLibero = -1;
        for (let i = 0; i < 3; i++) {
            if (!workshop.includes(i)) {
                indiceLibero = i;
                break;
            }
        }
        if (indiceLibero !== -1) {
            workshop.push(indiceLibero);
            workshop.sort((a, b) => a - b);
            updateGameState({ workshopUsages: workshop });
        }
    }
    return workshop;
}

export function ottieniStringaMovOfficina() {
    const count = (gameState.workshopUsages || []).length;
    if (count === 1) return "-2 MOV";
    if (count === 2) return "-4 MOV";
    if (count === 3) return "-6 MOV";
    return "+0 MOV";
}

export function finalizzaRipartenzaDaiBox() {
    const stint2Attivo = Object.values(gameState.tyreLaps).some(laps => laps.some(g => g > 1));

    if (!stint2Attivo && gameState.workshopUsages.length === 0) {
        return {
            operazioneRiuscita: false,
            messaggioDescrittivo: "Impossibile uscire dai box: Devi selezionare lo stint 2 o 3 per i pneumatici prima di ripartire!"
        };
    }

    const quantitaPuntiOfficinaUsati = gameState.workshopUsages.length;
    let malusMovFinaleOfficina = 0;
    if (quantitaPuntiOfficinaUsati === 1) malusMovFinaleOfficina = -2;
    else if (quantitaPuntiOfficinaUsati === 2) malusMovFinaleOfficina = -4;
    else if (quantitaPuntiOfficinaUsati === 3) malusMovFinaleOfficina = -6;

    updateGameState({
        isPitStopActive: false,
        workshopUsages: [],
        previousTyreUsages: null
    });

    const messaggioRiepilogoUscita = `Uscita dai box completata! Malus officina applicato al tiro di dado: ${malusMovFinaleOfficina} MOV. Il contatore malus è stato azzerato a -0 MOV.`;

    return {
        operazioneRiuscita: true,
        malusApplicato: malusMovFinaleOfficina,
        messaggioDescrittivo: messaggioRiepilogoUscita
    };
}
