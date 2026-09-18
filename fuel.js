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
    const totaleCaselleDisponibiliBenzina = gameState.baseValues.fuel + gameState.allocations.fuel;
    
    const laCasellaContieneGiaUnaX = arrayCaselleBenzinaCorrente.includes(indiceCasellaBenzinaSelezionata);
    let messaggioAvvisoUtente = "";
    let stringaMovimentoAttiva = "+0 MOV";

    if (laCasellaContieneGiaUnaX) {
        const indiceDaRimuovere = arrayCaselleBenzinaCorrente.indexOf(indiceCasellaBenzinaSelezionata);
        if (indiceDaRimuovere !== -1) {
            arrayCaselleBenzinaCorrente.splice(indiceDaRimuovere, 1);
        }
    } else {
        // Regola geometrica per le sezioni di sinistra: inserimento da destra verso sinistra
        let indiceDestraDisponibile = -1;
        for (let i = totaleCaselleDisponibiliBenzina - 1; i >= 0; i--) {
            if (!arrayCaselleBenzinaCorrente.includes(i)) {
                indiceDestraDisponibile = i;
                break;
            }
        }
        if (indiceDestraDisponibile !== -1) {
            arrayCaselleBenzinaCorrente.push(indiceDestraDisponibile);
        }
    }

    const numeroCaselleBenzinaSenzaX = totaleCaselleDisponibiliBenzina - arrayCaselleBenzinaCorrente.length;

    if (numeroCaselleBenzinaSenzaX <= 3 && numeroCaselleBenzinaSenzaX > 0) {
        stringaMovimentoAttiva = "+1 MOV";
    }

    const indiceUltimaCasellaPiuALeft = 0;
    if (arrayCaselleBenzinaCorrente.includes(indiceUltimaCasellaPiuALeft)) {
        messaggioAvvisoUtente = "Attenzione: Hai finito la benzina!";
    }

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
    const totaleCaselleDisponibiliBenzina = gameState.baseValues.fuel + gameState.allocations.fuel;

    if (modalitaSceltaBox === 'pieno') {
        arrayCaselleBenzinaAggiornato = [];
        descrizioneOperazioneBox = "Rifornimento completato: Pieno di benzina effettuato (tutte le usure rimosse)."[cite: 22];
        stringaMovimentoBox = "+0 MOV";
    } else if (modalitaSceltaBox === 'leggerezza') {
        arrayCaselleBenzinaAggiornato = [];
        for (let indiceCasella = numeroCaselleDaMantenereLibere; indiceCasella < totaleCaselleDisponibiliBenzina; indiceCasella++) {
            arrayCaselleBenzinaAggiornato.push(indiceCasella);
        }

        const caselleSenzaXRimaste = totaleCaselleDisponibiliBenzina - arrayCaselleBenzinaAggiornato.length;
        if (caselleSenzaXRimaste <= 3) {
            stringaMovimentoBox = "+1 MOV";
        }

        descrizioneOperazioneBox = `Strategia di leggerezza applicata: mantenute ${caselleSenzaXRimaste} caselle libere di carburante.`[cite: 22];
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
