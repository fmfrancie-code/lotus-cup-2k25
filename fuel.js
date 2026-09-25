// ==========================================
// MODULO: BENZINA & CARBURANTE (fuel.js)
// Gestione del consumo carburante, stringa MOV e logica box
// ==========================================

import { gameState, updateGameState } from './state.js';

/**
 * Gestisce l'inserimento o la rimozione di una X di consumo sulla barra della Benzina,
 * applicando le regole di direzione (da destra verso sinistra) e verificando le soglie di movimento (MOV).
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

    if (laCasellaContieneGiaUnaX && arrayCaselleBenzinaCorrente.length > 0) {
        // Rimozione LIFO automatica (indice minimo, poiché riempie da destra a sinistra)
        const indiceDaRimuovere = Math.min(...arrayCaselleBenzinaCorrente);
        const pos = arrayCaselleBenzinaCorrente.indexOf(indiceDaRimuovere);
        if (pos !== -1) {
            arrayCaselleBenzinaCorrente.splice(pos, 1);
        }
    } else {
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
export function gestisciConsumoBenzinaAiBox(indiceCasellaBenzinaSelezionata) {
    let arrayCaselleBenzinaCorrente = [...gameState.markedUsages.fuel];
    const totaleCaselleDisponibiliBenzina = gameState.baseValues.fuel + gameState.allocations.fuel;
    
    // 1. Memorizziamo le caselle pulite PRIMA di effettuare il click dell'utente
    const caselleSenzaXPrima = totaleCaselleDisponibiliBenzina - arrayCaselleBenzinaCorrente.length;

    const laCasellaContieneGiaUnaX = arrayCaselleBenzinaCorrente.includes(indiceCasellaBenzinaSelezionata);
    let stringaMovimentoBox = "+0 MOV";

    if (laCasellaContieneGiaUnaX && arrayCaselleBenzinaCorrente.length > 0) {
        // Rimozione LIFO automatica coerente anche all'interno dei box
        const indiceDaRimuovere = Math.min(...arrayCaselleBenzinaCorrente);
        const pos = arrayCaselleBenzinaCorrente.indexOf(indiceDaRimuovere);
        if (pos !== -1) {
            arrayCaselleBenzinaCorrente.splice(pos, 1);
        }
    } else {
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

    let caselleSenzaXRimaste = totaleCaselleDisponibiliBenzina - arrayCaselleBenzinaCorrente.length;

    // 2. REGOLA DEL MONOLITE CORRETTA:
    // L'auto-fill al massimo scatta SOLO se eravamo a esattamente 3 caselle libere (leggerezza) 
    // e l'utente ha cliccato per portarle a 4. 
    // Se eravamo già al pieno o stavamo aggiungendo X, la regola non interviene e lasciamo piena libertà.
    if (totaleCaselleDisponibiliBenzina >= 5 && caselleSenzaXPrima === 3 && caselleSenzaXRimaste === 4) {
        arrayCaselleBenzinaCorrente = [];
        caselleSenzaXRimaste = totaleCaselleDisponibiliBenzina;
    }

    // 3. Calcolo del MOV coerente
    if (caselleSenzaXRimaste >= 4) {
        stringaMovimentoBox = "-2 MOV";
    } else if (caselleSenzaXRimaste <= 3 && caselleSenzaXRimaste > 0) {
        stringaMovimentoBox = "+1 MOV";
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
        caselleLibereRimaste: caselleSenzaXRimaste,
        stringaMov: stringaMovimentoBox,
        messaggioDescrittivo: "Rifornimento ai box aggiornato."
    };
}
