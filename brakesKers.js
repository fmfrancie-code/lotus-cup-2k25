// ==========================================
// MODULO: FRENI & KERS (brakesKers.js)
// Gestione dell'usura dei freni, ricarica e attivazione interattiva del KERS
// ==========================================

import { gameState, updateGameState } from './state.js';

/**
 * Gestisce l'inserimento o la rimozione di una X di usura sulla barra dei Freni,
 * applicando la regola geometrica delle sezioni di sinistra (da destra verso sinistra)
 * e verificando contestualmente se il KERS deve essere caricato.
 * 
 * @param {number} indiceCasellaFrenoSelezionata - Indice della casella su cui l'utente ha cliccato
 * @returns {Object} - Stato aggiornato dei freni e del KERS
 */
export function gestisciModificaUsuraFreniETrafilamentoKers(indiceCasellaFrenoSelezionata) {
    const arrayCaselleFreniCorrente = [...gameState.markedUsages.brakes];
    const valoreBaseFreni = gameState.baseValues.brakes;
    const puntiAssegnatiSetupFreni = gameState.allocations.brakes;
    const totaleCaselleDisponibiliFreni = valoreBaseFreni + puntiAssegnatiSetupFreni;
    
    const laCasellaContieneGiaUnaX = arrayCaselleFreniCorrente.includes(indiceCasellaFrenoSelezionata);
    let nuovoStatoKers = gameState.kersState;
    let indiceModificato = -1;

    if (laCasellaContieneGiaUnaX && arrayCaselleFreniCorrente.length > 0) {
        const indiceDaRimuovere = Math.min(...arrayCaselleFreniCorrente);
        const pos = arrayCaselleFreniCorrente.indexOf(indiceDaRimuovere);
        if (pos !== -1) {
            arrayCaselleFreniCorrente.splice(pos, 1);
            indiceModificato = indiceDaRimuovere;
        }
    } else {
        let indiceDestraDisponibile = -1;
        for (let i = totaleCaselleDisponibiliFreni - 1; i >= 0; i--) {
            if (!arrayCaselleFreniCorrente.includes(i)) {
                indiceDestraDisponibile = i;
                break;
            }
        }

        if (indiceDestraDisponibile !== -1) {
            arrayCaselleFreniCorrente.push(indiceDestraDisponibile);
            indiceModificato = indiceDestraDisponibile;
        }
    }
    
    // REGOLA DI BUSINESS: Quando almeno un punto freno è consumato, il KERS si carica.
    // Il KERS si carica solo se non è in stato permanentemente danneggiato.
    const esisteAlmenoUnFrenoConsumato = arrayCaselleFreniCorrente.length > 0;
    
    if (esisteAlmenoUnFrenoConsumato && nuovoStatoKers !== 'damaged') {
        nuovoStatoKers = 'charged';
    } else if (!esisteAlmenoUnFrenoConsumato && nuovoStatoKers !== 'damaged') {
        nuovoStatoKers = 'empty';
    }

    updateGameState({
        markedUsages: {
            ...gameState.markedUsages,
            brakes: arrayCaselleFreniCorrente
        },
        kersState: nuovoStatoKers
    });

    return {
        operazioneRiuscita: true,
        freniAggiornati: arrayCaselleFreniCorrente,
        indiceModificato: indiceModificato,
        kersStatoCorrente: nuovoStatoKers,
        messaggioDescrittivo: `Stato freni aggiornato. KERS attualmente: [${nuovoStatoKers.toUpperCase()}].`
    };
}

/**
 * Gestisce l'interazione di click sull'icona KERS per l'attivazione in gara.
 * Apre la richiesta di test e applica l'esito (OK oppure Danneggiato).
 * 
 * @param {string} esitoTestKersSelezionato - Esito scelto dall'utente ('ok' oppure 'damaged')
 * @returns {Object} - Esito dell'operazione e modifiche applicate al KERS
 */
export function eseguiTestAttivazioneKers(esitoTestKersSelezionato) {
    const statoKersAttuale = gameState.kersState;
    
    const ilKersNonECarico = (statoKersAttuale !== 'charged');
    if (ilKersNonECarico) {
        return { 
            operazioneRiuscita: false, 
            messaggioDescrittivo: "Il KERS non è carico o è già disabilitato; impossibile eseguire il test." 
        };
    }

    let nuovoStatoKers = statoKersAttuale;
    let messaggioRisultato = "";
    
    // Array del motore preso una sola volta in modo pulito
    const usureMotoreAggiornate = [...gameState.markedUsages.engine];

    if (esitoTestKersSelezionato === 'ok') {
        // Test OK -> Svuota la casella del KERS
        nuovoStatoKers = 'empty';
        messaggioRisultato = "Test KERS superato con successo [OK]! La casella del KERS è stata svuotata.";
    } else if (esitoTestKersSelezionato === 'damaged') {
        // Test KERS fallito -> KERS danneggiato
        nuovoStatoKers = 'damaged';
        
        const totalBoxes = 6;
        const baseMotore = gameState.baseValues.engine;
        const allocMotore = gameState.allocations.engine;
        const totaleCaselleMotore = baseMotore + allocMotore;
        
        // Regola geometrica per le sezioni di destra: da sinistra a destra
        const startIdx = totalBoxes - totaleCaselleMotore;
        const endIdx = totalBoxes - 1;

        let indiceDaMarcare = -1;

        // Scansiona l'area attiva del motore da sinistra verso destra per trovare la prima casella libera
        for (let i = startIdx; i <= endIdx; i++) {
            if (!usureMotoreAggiornate.includes(i)) {
                indiceDaMarcare = i;
                break; 
            }
        }

        if (indiceDaMarcare !== -1) {
            usureMotoreAggiornate.push(indiceDaMarcare);
        }

        messaggioRisultato = "Test KERS fallito: KERS danneggiato e X rossa applicata sul primo punto utile del motore.";
    }

    // Unico aggiornamento globale alla fine con lo stato corretto e l'array motore aggiornato
    updateGameState({ 
        kersState: nuovoStatoKers,
        markedUsages: {
            ...gameState.markedUsages,
            engine: usureMotoreAggiornate
        }
    });

    return {
        operazioneRiuscita: true,
        kersStatoCorrente: nuovoStatoKers,
        messaggioDescrittivo: messaggioRisultato
    };
}
