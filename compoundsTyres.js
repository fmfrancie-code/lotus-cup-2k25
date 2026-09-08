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

    // Regola di esclusivitÃ : rimuove il giro selezionato da tutte le altre mescole per evitare sovrapposizioni
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
 * @returns {Object} - Dettagli sull'usura applicata e su eventuali penalità  sui freni
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
            // Se non ci sono piÃ¹ punti pneumatici liberi, si scala la differenza sui freni
            puntiEccessoDaScalareDaiFreni++;
        }
    }

    // Se c'Ã¨ eccesso, applichiamo la X anche sui freni (da destra verso sinistra)
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
 * Funzione di utilità  interna per trovare la casella dei pneumatici da marcare (da destra a sinistra).
 */
export function troviIndiceCasellaPneumaticoDisponibileDaDestra(arrayCaselleUsurateGomme) {
    const totaleCaselleDisponibiliPneumatici = 4 + gameState.allocations.tyres; // Valore base + assegnate in setup
    for (let indiceCasella = totaleCaselleDisponibiliPneumatici - 1; indiceCasella >= 0; indiceCasella--) {
        if (!arrayCaselleUsurateGomme.includes(indiceCasella)) {
            return indiceCasella;
        }
    }
    return -1; // Nessuna casella disponibile
}

/**
 * Funzione di utilità  interna per trovare la casella dei freni da marcare (da destra a sinistra).
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

/**
 * Verifica se un giro è già stato spuntato in qualsiasi altra mescola.
 */
function isLapMarkedAnywhere(lap) {
    return Object.keys(gameState.tyreLaps).some(t => gameState.tyreLaps[t].includes(lap));
}

/**
 * Renderizza visivamente il deck delle mescole e dei giri nella UI.
 */
export function renderTyreDeck() {
    const container = document.getElementById('tyres-deck-container');
    if (!container) return;
    container.innerHTML = '';
    const tyres = ['Prime', 'Option', 'Intermedie', 'Pioggia'];

    const isWet = verificaSeAsfaltoBagnato();
    const isInspecting = typeof inspectingPilotId !== 'undefined' && inspectingPilotId !== null;

    tyres.forEach(t => {
        const isSelected = gameState.selectedTyre === t;
        let isDisabledByWeather = false;

        if (t === 'Intermedie') {
            isDisabledByWeather = false;
        } else if (gameState.weather === 'sun') {
            if (t === 'Pioggia') isDisabledByWeather = true;
        } else if (gameState.weather === 'rain') {
            if (t === 'Prime' || t === 'Option') isDisabledByWeather = true;
        } else {
            if (isWet) {
                if (t === 'Prime' || t === 'Option') isDisabledByWeather = true;
            } else {
                if (t === 'Pioggia') isDisabledByWeather = true;
            }
        }

        const card = document.createElement('div');
        card.className = `tyre-card ${isSelected ? 'active' : ''} ${isDisabledByWeather ? 'disabled-weather' : ''}`;

        let lapsHtml = '';
        [1, 2, 3].forEach(lap => {
            const isMarked = gameState.tyreLaps[t].includes(lap);
            const lapUsedAnywhere = isLapMarkedAnywhere(lap);
            let isClickable = false;
            let isPreSelectedStyle = false;

            if (!isInspecting) {
                if ((!gameState.isRaceMode || gameState.isSetupMode) && isSelected && lap === 1) {
                    isPreSelectedStyle = true;
                }

                if (gameState.isSetupMode) {
                    if (lap === 1 && isSelected) {
                        if (!lapUsedAnywhere || isMarked) isClickable = true;
                    }
                } else if (gameState.isRaceMode) {
                    if (gameState.isPitStopActive && isSelected) {
                        if (lap !== 1) {
                            if (!lapUsedAnywhere || isMarked) isClickable = true;
                        }
                    }
                }
            }

            const classList = [
                'lap-box',
                isMarked ? 'marked' : '',
                (!isMarked && isPreSelectedStyle) ? 'pre-selected' : '',
                isClickable ? 'clickable' : 'disabled'
            ].filter(Boolean).join(' ');

            lapsHtml += `<div class="${classList}" ${isClickable ? `onclick="handleTyreClick('${t}', ${lap})"` : ''}>${lap}</div>`;
        });

        card.innerHTML = `
            <button class="tyre-title-btn" ${(!isDisabledByWeather && !isInspecting) ? `onclick="selectTyreFromUI('${t}')"` : ''}>${t}</button>
            <div class="laps-container">${lapsHtml}</div>
        `;
        container.appendChild(card);
    });
}

/**
 * Gestore UI per la selezione della mescola dal deck.
 */
export function selectTyreFromUI(type) {
    const isWet = verificaSeAsfaltoBagnato();

    if (type !== 'Intermedie') {
        if (gameState.weather === 'sun' && type === 'Pioggia') return;
        if (gameState.weather === 'rain' && (type === 'Prime' || type === 'Option')) return;
        if (isWet && (type === 'Prime' || type === 'Option')) return;
        if (!isWet && type === 'Pioggia') return;
    }
    
    if (gameState.isSetupMode || gameState.isPitStopActive) {
        // Sceglie il primo giro disponibile o default 1 per la nuova mescola
        const targetGiro = gameState.isSetupMode ? 1 : (gameState.tyreLaps[type][0] || 2);
        const risultato = gestisciSelezioneMescolaEGiri(type, targetGiro);
        if (risultato.operazioneRiuscita) {
            renderTyreDeck();
            if (typeof saveGameState === 'function') saveGameState();
        }
    }
}

/**
 * Gestore UI per il click sui box dei giri.
 */
export function handleTyreClick(type, lap) {
    if (gameState.isSetupMode) {
        if (type !== gameState.selectedTyre || lap !== 1) return;
    } else if (gameState.isRaceMode) {
        if (!gameState.isPitStopActive || type !== gameState.selectedTyre || lap === 1) return;
    } else {
        return;
    }

    const list = gameState.tyreLaps[type];
    const pos = list.indexOf(lap);
    
    if (pos > -1) {
        // Se già presente, lo rimuoviamo (o gestiamo la deselezione)
        list.splice(pos, 1);
        updateGameState({ tyreLaps: { ...gameState.tyreLaps } });
    } else {
        gestisciSelezioneMescolaEGiri(type, lap);
    }

    renderTyreDeck();
    if (typeof saveGameState === 'function') saveGameState();
}
