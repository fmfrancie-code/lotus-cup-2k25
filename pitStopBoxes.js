// ==========================================
// MODULO: BOX & PIT STOP (pitStopBoxes.js)
// Gestione delle riparazioni, rifornimento e ripartenza dai box
// ==========================================

import { gameState, updateGameState } from './state.js';

export function avviaSessionePitStop(numeroGiroCorrente) {
    // Cattura lo snapshot dei pneumatici attivi prima di iniziare la sosta
    const initialTyreLapsSnapshot = JSON.parse(JSON.stringify(gameState.tyreLaps || {}));

    updateGameState({
        isPitStopActive: true,
        pitStopStartLap: numeroGiroCorrente,
        previousTyreUsages: [...(gameState.markedUsages.tyres || [])],
        currentPitStopUsages: [],                                       // Inizia vuoto per questa specifica sosta
        workshopRepairs: {},
        pitStopInitialTyreLaps: initialTyreLapsSnapshot                 // Salvataggio dello snapshot
    });

    return {
        operazioneRiuscita: true,
        messaggioDescrittivo: `Pit Stop avviato al giro ${numeroGiroCorrente}. Sessione box attiva.`
    };
}

export function registraPuntoRiparazioneOfficina(componente, indiceCasella) {
    if (!gameState.isPitStopActive) return null;

    let permanentWorkshop = [...(gameState.workshopUsages || [])];
    let currentStop = [...(gameState.currentPitStopUsages || [])];
    let repairs = { ...(gameState.workshopRepairs || {}) };

    const allUsed = [...new Set([...permanentWorkshop, ...currentStop])];

    if (allUsed.length < 3) {
        let indiceLibero = -1;
        for (let i = 0; i < 3; i++) {
            if (!allUsed.includes(i)) {
                indiceLibero = i;
                break;
            }
        }
        if (indiceLibero !== -1) {
            currentStop.push(indiceLibero);
            currentStop.sort((a, b) => a - b);
            repairs[indiceLibero] = { component: componente, index: indiceCasella };
            
            updateGameState({ 
                currentPitStopUsages: currentStop,
                workshopRepairs: repairs
            });
        }
    }
    return currentStop;
}

export function rimuoviPuntoRiparazioneOfficina(indiceOfficina) {
    if (!gameState.isPitStopActive) return;

    let currentStop = [...(gameState.currentPitStopUsages || [])];
    let repairs = { ...(gameState.workshopRepairs || {}) };

    if (currentStop.includes(indiceOfficina)) {
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

    if (!stint2Attivo && (gameState.workshopUsages || []).length === 0 && (gameState.currentPitStopUsages || []).length === 0) {
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

    // Consolida le riparazioni correnti nello storico permanente delle X sull'officina
    const permanentWorkshop = [...(gameState.workshopUsages || []), ...(gameState.currentPitStopUsages || [])];

    updateGameState({
        isPitStopActive: false,
        isEditingAllowed: false,
        workshopUsages: permanentWorkshop, // Salvataggio permanente delle X
        currentPitStopUsages: [],
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
