// ==========================================
// MODULO: PNEUMATICI E MESCOLE (compoundsTyres.js)
// Gestione di stint, giri, restrizioni meteo e consumo caselle con parametri parlanti
// ==========================================

import { gameState, updateGameState } from './state.js';
import { verificaSeAsfaltoBagnato } from './weather.js';

/**
 * Registra o aggiorna lo stint e la selezione della mescola attiva del pilota.
 * 
 * @param {string} nomeMescolaSelezionata - Nome della mescola ('Prime', 'Option', 'Intermedie', 'Pioggia')
 * @param {number} numeroGiroStint - Numero del giro da spuntare (1, 2 o 3)
 * @returns {Object} - Esito dell'operazione e messaggio descrittivo
 */
export function gestisciSelezioneMescolaEGiri(nomeMescolaSelezionata, numeroGiroStint) {
    const elencoMescoleValide = ['Prime', 'Option', 'Intermedie', 'Pioggia'];
    
    if (!elencoMescoleValide.includes(nomeMescolaSelezionata)) {
        return { operazioneRiuscita: false, messaggioDescrittivo: "La mescola selezionata non è valida." };
    }

    // Copia dello stato attuale dei giri per le mescole
    const mappaGiriStintAggiornata = { ...gameState.tyreLaps };

    // Regola di esclusività: rimuove il giro selezionato da tutte le altre mescole per evitare sovrapposizioni
    for (const mescolaCorrente of elencoMescoleValide) {
        if (mescolaCorrente !== nomeMescolaSelezionata) {
            mappaGiriStintAggiornata[mescolaCorrente] = mappaGiriStintAggiornata[mescolaCorrente].filter(
                girorif => girorif !== numeroGiroStint
            );
        }
    }

    // Aggiunge o attiva il giro sulla mescola scelta (evitando duplicati nello stesso stint)
    if (!mappaGiriStintAggiornata[nomeMescolaSelezionata].includes(numeroGiroStint)) {
        mappaGiriStintAggiornata[nomeMescolaSelezionata].push(numeroGiroStint);
    }

    updateGameState({
        selectedTyre: nomeMescolaSelezionata,
        tyreLaps: mappaGiriStintAggiornata
    });

    return { 
        operazioneRiuscita: true, 
        messaggioDescrittivo: `Mescola [${nomeMescolaSelezionata}] impostata correttamente per il giro ${numeroGiroStint}.` 
    };
}

/**
 * Applica il consumo dei pneumatici in base alla mescola attiva, al meteo e all'asfalto,
 * gestendo l'eventuale tracimazione dell'usura sui freni.
 * 
 * @returns {Object} - Dettagli sull'usura applicata e su eventuali penalità sui freni
 */
export function applicaConsumoPneumaticiInBaseAMescolaEMeteo() {
    const mescolaAttivaAlMomento = gameState.selectedTyre;
    const asfaltoBagnatoInAtto = verificaSeAsfaltoBagnato();
    
    let quantitaCasellePneumaticiDaBarrare = 0;

    // Regole di consumo basate sul tipo di mescola e sullo stato dell'asfalto
    if (mescolaAttivaAlMomento === 'Prime' || mescolaAttivaAlMomento === 'Option') {
        if (asfaltoBagnatoInAtto) {
            quantitaCasellePneumaticiDaBarrare = 3;
        } else {
            quantitaCasellePneumaticiDaBarrare = 2;
        }
    } else if (mescolaAttivaAlMomento === 'Intermedie') {
        if (asfaltoBagnatoInAtto) {
            quantitaCasellePneumaticiDaBarrare = 2;
        } else {
            quantitaCasellePneumaticiDaBarrare = 1;
        }
    } else if (mescolaAttivaAlMomento === 'Pioggia') {
        if (!asfaltoBagnatoInAtto) {
            quantitaCasellePneumaticiDaBarrare = 2;
        } else {
            quantitaCasellePneumaticiDaBarrare = 1;
        }
    }

    const arrayCasellePneumaticiCorrente = [...gameState.markedUsages.tyres];
    const arrayCaselleFreniCorrente = [...gameState.markedUsages.brakes];
    
    let puntiEccessoDaScalareDaiFreni = 0;
    
    // Logica di inserimento delle X sui pneumatici (da destra verso sinistra secondo le regole)
    for (let passoUsura = 0; passoUsura < quantitaCasellePneumaticiDaBarrare; passoUsura++) {
        const indicePrimaCasellaDisponibileDaDestra = troviIndiceCasellaPneumaticoDisponibileDaDestra(arrayCasellePneumaticiCorrente);
        
        if (indicePrimaCasellaDisponibileDaDestra !== -1) {
            arrayCasellePneumaticiCorrente.push(indicePrimaCasellaDisponibileDaDestra);
        } else {
            // Se non ci sono più punti pneumatici liberi, si scala la differenza sui freni
            puntiEccessoDaScalareDaiFreni++;
        }
    }

    // Se c'è eccesso, applichiamo la X anche sui freni (da destra verso sinistra)
    for (let passoFreno = 0; passoFreno < puntiEccessoDaScalareDaiFreni; passoFreno++) {
        const indicePrimaCasellaFrenoDisponibileDaDestra = troviIndiceCasellaFrenoDisponibileDaDestra(arrayCaselleFreniCorrente);
        if (indicePrimaCasellaFrenoDisponibileDaDestra !== -1) {
            arrayCaselleFreniCorrente.push(indicePrimaCasellaFrenoDisponibileDaDestra);
        }
    }

    // Aggiornamento dello stato globale
    updateGameState({
        markedUsages: {
            ...gameState.markedUsages,
            tyres: arrayCasellePneumaticiCorrente,
            brakes: arrayCaselleFreniCorrente
        }
    });

    return {
        gommeBarrate: quantitaCasellePneumaticiDaBarrare,
        freniCoinvoltiPerEccesso: puntiEccessoDaScalareDaiFreni,
        messaggioDescrittivo: `Consumo applicato per mescola [${mescolaAttivaAlMomento}]: ${quantitaCasellePneumaticiDaBarrare} punti pneumatici consumati.` + 
            (puntiEccessoDaScalareDaiFreni > 0 ? ` Eccesso di usura di ${puntiEccessoDaScalareDaiFreni} punti scalato sui Freni!` : '')
    };
}

/**
 * Funzione di utilità interna per trovare la casella dei pneumatici da marcare (da destra a sinistra).
 */
function troviIndiceCasellaPneumaticoDisponibileDaDestra(arrayCaselleUsurateGomme) {
    const totaleCaselleDisponibiliPneumatici = 4 + gameState.allocations.tyres; // Valore base + assegnate in setup
    for (let indiceCasella = totaleCaselleDisponibiliPneumatici - 1; indiceCasella >= 0; indiceCasella--) {
        if (!arrayCaselleUsurateGomme.includes(indiceCasella)) {
            return indiceCasella;
        }
    }
    return -1; // Nessuna casella disponibile
}

/**
 * Funzione di utilità interna per trovare la casella dei freni da marcare (da destra a sinistra).
 */
function troviIndiceCasellaFrenoDisponibileDaDestra(arrayCaselleUsurateFreni) {
    const totaleCaselleDisponibiliFreni = 2 + gameState.allocations.brakes; // Valore base + assegnate in setup
    for (let indiceCasella = totaleCaselleDisponibiliFreni - 1; indiceCasella >= 0; indiceCasella--) {
        if (!arrayCaselleUsurateFreni.includes(indiceCasella)) {
            return indiceCasella;
        }
    }
    return -1; // Nessuna casella disponibile
}