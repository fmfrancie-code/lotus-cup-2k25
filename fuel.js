// ==========================================
// MODULO: BENZINA & CARBURANTE (fuel.js)
// Gestione del consumo carburante, stringa MOV e logica box con parametri parlanti
// ==========================================

import { gameState, updateGameState } from './state.js';

/**
 * Gestisce l'inserimento o la rimozione di una X di consumo sulla barra della Benzina,
 * applicando le regole di direzione e verificando le soglie di movimento (MOV) e di esaurimento.
 * 
 * @param {number} indiceCasellaBenzinaSelezionata - Indice della casella cliccata dall'utente
 * @returns {Object} - Stato aggiornato della benzina, stringa MOV attiva e messaggi di avviso
 */
export function gestisciConsumoBenzinaEModifica(indiceCasellaBenzinaSelezionata) {
    const arrayCaselleBenzinaCorrente = [...gameState.markedUsages.fuel];
    const totaleCaselleDisponibiliBenzina = 2 + gameState.allocations.fuel; // Valore base (2) + punti assegnati in setup
    
    const laCasellaContieneGiaUnaX = arrayCaselleBenzinaCorrente.includes(indiceCasellaBenzinaSelezionata);
    let messaggioAvvisoUtente = "";
    let stringaMovimentoAttiva = "+0 MOV";

    if (laCasellaContieneGiaUnaX) {
        // Rimozione della X (da sinistra verso destra secondo le regole di edit)
        const indiceDaRimuovere = arrayCaselleBenzinaCorrente.indexOf(indiceCasellaBenzinaSelezionata);
        if (indiceDaRimuovere !== -1) {
            arrayCaselleBenzinaCorrente.splice(indiceDaRimuovere, 1);
        }
    } else {
        // Inserimento della X (da destra verso sinistra secondo le regole di edit)
        arrayCaselleBenzinaCorrente.push(indiceCasellaBenzinaSelezionata);
    }

    // Calcolo delle caselle libere (senza X)
    const numeroCaselleBenzinaSenzaX = totaleCaselleDisponibiliBenzina - arrayCaselleBenzinaCorrente.length;

    // REGOLA DI BUSINESS: Se la benzina ha un numero di caselle senza X che sia 3 o inferiore, la stringa passa da "+0 MOV" a "+1 MOV"
    if (numeroCaselleBenzinaSenzaX <= 3 && numeroCaselleBenzinaSenzaX > 0) {
        stringaMovimentoAttiva = "+1 MOV";
    }

    // REGOLA DI BUSINESS: Se l'ultima casella della benzina disponibile (quella più a sinistra, indice 0) viene marcata con una X, il carburante è esaurito
    const indiceUltimaCasellaPiuALeft = 0;
    const ultimaCasellaEStataMarcata = arrayCaselleBenzinaCorrente.includes(indiceUltimaCasellaPiuALeft);
    
    if (ultimaCasellaEStataMarcata) {
        messaggioAvvisoUtente = "Attenzione: Hai finito la benzina!";
    }

    // Aggiornamento dello stato globale
    updateGameState({
        markedUsages: {
            ...gameState.markedUsages,
            fuel: arrayCaselleBenzinaCorrente
        }
    });

    return {
        operazioneRiuscita: true,
        benzinaAggiornata: arrayCaselleBenzinaCorrente,
        caselleLibereRimaste: numeroCaselleBenzinaSenzaX,
        stringaMov: stringaMovimentoAttiva,
        messaggioAvviso: messaggioAvvisoUtente
    };
}

/**
 * Gestisce le opzioni di ripristino della benzina durante la sosta ai Box (Pit Stop).
 * Permette di scegliere tra "Pieno" (azzera tutte le X) o "Leggerezza" (lascia fino a 3 caselle libere).
 * 
 * @param {string} modalitaSceltaBox - 'pieno' oppure 'leggerezza'
 * @param {number} [numeroCaselleDaMantenereLibere=3] - Parametro opzionale per la leggerezza
 * @returns {Object} - Esito dell'operazione e modifiche applicate
 */
export function gestisciRipristinoBenzinaAiBox(modalitaSceltaBox, numeroCaselleDaMantenereLibere = 3) {
    let arrayCaselleBenzinaAggiornato = [...gameState.markedUsages.fuel];
    let descrizioneOperazioneBox = "";
    let stringaMovimentoBox = "+0 MOV";

    if (modalitaSceltaBox === 'pieno') {
        // Pieno di benzina: rimuove in automatico tutte le X dalle caselle della benzina
        arrayCaselleBenzinaAggiornato = [];
        descrizioneOperazioneBox = "Rifornimento completato: Pieno di benzina effettuato (tutte le usure rimosse).";
        stringaMovimentoBox = "+0 MOV";
        
    } else if (modalitaSceltaBox === 'leggerezza') {
        // Leggerezza: il pilota decide la strategia lasciando scoperte le ultime caselle disponibili
        const totaleCaselleDisponibiliBenzina = 2 + gameState.allocations.fuel;
        
        // Ricostruisce lo scenario lasciando libere le ultime caselle richieste (es. le 3 più a sinistra)
        arrayCaselleBenzinaAggiornato = [];
        for (let indiceCasella = numeroCaselleDaMantenereLibere; indiceCasella < totaleCaselleDisponibiliBenzina; indiceCasella++) {
            arrayCaselleBenzinaAggiornato.push(indiceCasella);
        }

        const caselleSenzaXRimaste = totaleCaselleDisponibiliBenzina - arrayCaselleBenzinaAggiornato.length;
        if (caselleSenzaXRimaste <= 3) {
            stringaMovimentoBox = "+1 MOV";
        }

        descrizioneOperazioneBox = `Strategia di leggerezza applicata: mantenute ${caselleSenzaXRimaste} caselle libere di carburante.`;
    }

    updateGameState({
        markedUsages: {
            ...gameState.markedUsages,
            fuel: arrayCaselleBenzinaAggiornato
        }
    });

    return {
        operazioneRiuscita: true,
        benzinaAggiornata: arrayCaselleBenzinaAggiornato,
        stringaMov: stringaMovimentoBox,
        messaggioDescrittivo: descrizioneOperazioneBox
    };
}