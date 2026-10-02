// ==========================================
// MODULO: BOX & PIT STOP (pitStopBoxes.js)
// Gestione delle riparazioni, rifornimento e ripartenza dai box
// ==========================================

import { gameState, updateGameState } from './state.js';

export function avviaSessionePitStop(numeroGiroCorrente) {
    const initialTyreLapsSnapshot = JSON.parse(JSON.stringify(gameState.tyreLaps || {}));

    updateGameState({
        isPitStopActive: true,
        pitStopStartLap: numeroGiroCorrente,
        previousTyreUsages: [...(gameState.markedUsages.tyres || [])],
        currentPitStopUsages: [], // Traccia solo le riparazioni fatte in questa sosta specifica
        workshopRepairs: {},
        pitStopInitialTyreLaps: initialTyreLapsSnapshot
    });

    return {
        operazioneRiuscita: true,
        messaggioDescrittivo: `Pit Stop avviato al giro ${numeroGiroCorrente}. Sessione box attiva.`
    };
}

export function registraPuntoRiparazioneOfficina(componente, indiceCasella) {
    if (!gameState.isPitStopActive) return null;

    let workshop = [...(gameState.workshopUsages || [])];
    let currentStop = [...(gameState.currentPitStopUsages || [])];
    let repairs = { ...(gameState.workshopRepairs || {}) };

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
            
            currentStop.push(indiceLibero);
            currentStop.sort((a, b) => a - b);

            repairs[indiceLibero] = { component: componente, index: indiceCasella };
            
            updateGameState({ 
                workshopUsages: workshop,         // Aggiornato SUBITO per mostrarlo a schermo
                currentPitStopUsages: currentStop, // Tracciato per l'undo e il malus
                workshopRepairs: repairs
            });
        }
    }
    return workshop;
}

export function rimuoviPuntoRiparazioneOfficina(indiceOfficina) {
    if (!gameState.isPitStopActive) return;

    let workshop = [...(gameState.workshopUsages || [])];
    let currentStop = [...(gameState.currentPitStopUsages || [])];
    let repairs = { ...(gameState.workshopRepairs || {}) };

    // Si può rimuovere (undo) solo se è stato aggiunto in questa sosta corrente
    if (currentStop.includes(indiceOfficina)) {
        workshop = workshop.filter(idx => idx !== indiceOfficina);
        currentStop = currentStop.filter(idx => idx !== indiceOfficina);

        const repairInfo = repairs[indiceOfficina];
        if (repairInfo) {
            const { component, index } = repairInfo;
            let usureComponente = [...(gameState.markedUsages[component] || [])];
            if (!usureComponente.includes(index)) {
                usureComponente.push(index);
                updateGameState({
                    markedUsages: {
                        ...gameState.markedUsages,
                        [component]: usureComponente
                    }
                });
            }
            delete repairs[indiceOfficina];
        }

        updateGameState({
            workshopUsages: workshop,
            currentPitStopUsages: currentStop,
            workshopRepairs: repairs
        });
    }
}

export function ottieniStringaMovOfficina() {
    const count = (gameState.currentPitStopUsages || []).length;
    if (count === 1) return "-2 MOV";
    if (count === 2) return "-4 MOV";
    if (count === 3) return "-6 MOV";
    return "+0 MOV";
}

export function finalizzaRipartenzaDaiBox() {
    const stint2Attivo = Object.values(gameState.tyreLaps).some(laps => laps.some(g => g > 1));

    if (!stint2Attivo && (gameState.currentPitStopUsages || []).length === 0 && (gameState.workshopUsages || []).length === 0) {
        return {
            operazioneRiuscita: false,
            messaggioDescrittivo: "Impossibile uscire dai box: Devi selezionare lo stint 2 o 3 per i pneumatici prima di ripartire!"
        };
    }

    const quantitaPuntiOfficinaUsati = (gameState.currentPitStopUsages || []).length;
    let malusMovFinaleOfficina = 0;
    if (quantitaPuntiOfficinaUsati === 1) malusMovFinaleOfficina = -2;
    else if (quantitaPuntiOfficinaUsati === 2) malusMovFinaleOfficina = -4;
    else if (quantitaPuntiOfficinaUsati === 3) malusMovFinaleOfficina = -6;

    const baseBenzina = gameState.baseValues.fuel;
    const allocBenzina = gameState.allocations.fuel;
    const totaleCaselleDisponibiliBenzina = baseBenzina + allocBenzina;
    const usurateBenzina = gameState.markedUsages.fuel ? gameState.markedUsages.fuel.length : 0;
    const caselleLibereBenzina = totaleCaselleDisponibiliBenzina - usurateBenzina;

    let fuelMov = 0;
    let fuelText = "+0 MOV";
    if (caselleLibereBenzina >= 4) {
        fuelMov = -2;
        fuelText = "-2 MOV";
    } else {
        fuelMov = 1;
        fuelText = "+1 MOV";
    }

    const totaleNetto = malusMovFinaleOfficina + fuelMov;
    const totaleNettoStr = totaleNetto >= 0 ? `+${totaleNetto}` : `${totaleNetto}`;

    // NOTA IMPORTANTE: workshopUsages NON viene svuotato! Rimane permanente per tutta la gara.
    updateGameState({
        isPitStopActive: false,
        isEditingAllowed: false,
        currentPitStopUsages: [], // Resettato solo in vista della prossima sosta
        workshopRepairs: {},
        previousTyreUsages: null,
        pitStopInitialTyreLaps: null
    });

    const messaggioRiepilogoUscita = `Uscita dai box completata!\nRiparazioni: ${malusMovFinaleOfficina} MOV\nBilancio carburante: ${fuelText}\nTotale movimento netto: ${totaleNettoStr} MOV.\nIl contatore malus è stato azzerato a +0 MOV.`;

    return {
        operazioneRiuscita: true,
        malusApplicato: totaleNetto,
        messaggioDescrittivo: messaggioRiepilogoUscita
    };
}
