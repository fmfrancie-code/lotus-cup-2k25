// ==========================================
// MODULO: FRENI & KERS (brakesKers.js)
// Gestione dell'usura dei freni, ricarica e attivazione interattiva del KERS
// ==========================================

import { gameState, updateGameState } from './state.js';
import { getKersIconHtml } from './layout.js';

/**
 * Gestisce l'inserimento o la rimozione di una X di usura sulla barra dei Freni,
 * verificando contestualmente se il KERS deve essere caricato.
 * 
 * @param {number} indiceCasellaFrenoSelezionata - Indice della casella su cui l'utente ha cliccato
 * @returns {Object} - Stato aggiornato dei freni e del KERS
 */
export function gestisciModificaUsuraFreniETrafilamentoKers(indiceCasellaFrenoSelezionata) {
    const arrayCaselleFreniCorrente = [...gameState.markedUsages.brakes];
    
    const laCasellaContieneGiaUnaX = arrayCaselleFreniCorrente.includes(indiceCasellaFrenoSelezionata);
    let nuovoStatoKers = gameState.kersState;

    if (laCasellaContieneGiaUnaX) {
        // Rimozione della X (da sinistra verso destra secondo le regole di edit)
        const indiceDaRimuovere = arrayCaselleFreniCorrente.indexOf(indiceCasellaFrenoSelezionata);
        if (indiceDaRimuovere !== -1) {
            arrayCaselleFreniCorrente.splice(indiceDaRimuovere, 1);
        }
    } else {
        // Inserimento della X (da destra verso sinistra secondo le regole di edit)
        arrayCaselleFreniCorrente.push(indiceCasellaFrenoSelezionata);
    }

    // REGOLA DI BUSINESS: Quando almeno un punto freno è consumato (almeno una X presente), il KERS si carica.
    // Il KERS si carica solo se non è in stato permanentemente danneggiato.
    const esisteAlmenoUnFrenoConsumato = arrayCaselleFreniCorrente.length > 0;
    
    if (esisteAlmenoUnFrenoConsumato && nuovoStatoKers !== 'damaged') {
        nuovoStatoKers = 'charged';
    } else if (!esisteAlmenoUnFrenoConsumato && nuovoStatoKers !== 'damaged') {
        nuovoStatoKers = 'empty';
    }

    // Aggiornamento dello stato globale
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

    if (esitoTestKersSelezionato === 'ok') {
        // Test OK -> Svuota la casella del KERS (torna vuoto ma utilizzabile in futuro se i freni si ricaricano)
        nuovoStatoKers = 'empty';
        messaggioRisultato = "Test KERS superato con successo [OK]! La casella del KERS è stata svuotata.";
    } else if (esitoTestKersSelezionato === 'damaged') {
        // Test Danneggiato -> Imposta X rossa permanente fino a fine gara (non riparabile)
        nuovoStatoKers = 'damaged';
        messaggioRisultato = "Test KERS fallito: sistema DANNEGGIATO. È stata applicata la X rossa permanente; il KERS non potrà più essere utilizzato.";
    }

    updateGameState({ kersState: nuovoStatoKers });

    return {
        operazioneRiuscita: true,
        kersStatoCorrente: nuovoStatoKers,
        messaggioDescrittivo: messaggioRisultato
    };
}

/**
 * Restituisce il markup HTML visivo per la casella del KERS in base al tema e allo stato corrente.
 * 
 * @param {string} temaGraficoAttivo - Nome del tema ('ironman' o 'cyberpunk')
 * @returns {string} - Codice HTML dell'icona (Reattore Ark, Power o X rossa di danno)
 */
export function generaHtmlCasellaKersPerTema(temaGraficoAttivo) {
    const statoKersCorrente = gameState.kersState;

    if (statoKersCorrente === 'damaged') {
        // Stato di Danno o Blocco Critico: mostra la X rossa con effetto sfarfallio
        return `<div class="kers-icon-container x-red"><span class="flicker-text">X</span></div>`;
    } else if (statoKersCorrente === 'charged') {
        // Stato carico: restituisce l'icona vettoriale specifica del tema scelto
        const iconaVettorialeTematica = getKersIconHtml(temaGraficoAttivo);
        return `<div class="kers-icon-container charged">${iconaVettorialeTematica}</div>`;
    } else {
        // Stato vuoto o inattivo
        return `<div class="kers-icon-container empty"></div>`;
    }
}