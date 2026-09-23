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
        workshopUsages: [],
        workshopRepairs: {},
        pitStopInitialTyreLaps: initialTyreLapsSnapshot // Salvataggio dello snapshot
    });

    return {
        operazioneRiuscita: true,
        messaggioDescrittivo: `Pit Stop avviato al giro ${numeroGiroCorrente}. Sessione box attiva.`
    };
}

export function registraPuntoRiparazioneOfficina(componente, indiceCasella) {
    if (!gameState.isPitStopActive) return null;

    let workshop = [...(gameState.workshopUsages || [])];
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
            repairs[indiceLibero] = { component: componente, index: indiceCasella };
            
            updateGameState({ 
                workshopUsages: workshop,
                workshopRepairs: repairs
            });
        }
    }
    return workshop;
}

export function rimuoviPuntoRiparazioneOfficina(indiceOfficina) {
    if (!gameState.isPitStopActive) return;

    let workshop = [...(gameState.workshopUsages || [])];
    let repairs = { ...(gameState.workshopRepairs || {}) };

    if (workshop.includes(indiceOfficina)) {
        // Rimuove lo slot dall'officina
        workshop = workshop.filter(idx => idx !== indiceOfficina);

        // Ripristina la X sul componente originale da cui era stata rimossa
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
            workshopRepairs: repairs
        });
    }
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

    // 1. Calcolo malus riparazioni officina
    const quantitaPuntiOfficinaUsati = gameState.workshopUsages.length;
    let malusMovFinaleOfficina = 0;
    if (quantitaPuntiOfficinaUsati === 1) malusMovFinaleOfficina = -2;
    else if (quantitaPuntiOfficinaUsati === 2) malusMovFinaleOfficina = -4;
    else if (quantitaPuntiOfficinaUsati === 3) malusMovFinaleOfficina = -6;

    // 2. Calcolo bilancio carburante in base alle caselle libere rimaste
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

    // 3. Somma algebrica per il totale netto
    const totaleNetto = malusMovFinaleOfficina + fuelMov;
    const totaleNettoStr = totaleNetto >= 0 ? `+${totaleNetto}` : `${totaleNetto}`;

    // 4. Pulizia dello stato della sosta box
    updateGameState({
        isPitStopActive: false,
        isEditingAllowed: false,
        workshopUsages: [],
        workshopRepairs: {},
        previousTyreUsages: null,
        pitStopInitialTyreLaps: null
    });

    // 5. Messaggio di riepilogo combinato dettagliato
    const messaggioRiepilogoUscita = `Uscita dai box completata!\nRiparazioni: ${malusMovFinaleOfficina} MOV\nBilancio carburante: ${fuelText}\nTotale movimento netto: ${totaleNettoStr} MOV.\nIl contatore malus è stato azzerato a +0 MOV.`;

    return {
        operazioneRiuscita: true,
        malusApplicato: totaleNetto,
        messaggioDescrittivo: messaggioRiepilogoUscita
    };
}
