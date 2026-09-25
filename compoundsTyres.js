// ==========================================
// MODULO: PNEUMATICI E MESCOLE (compoundsTyres.js)
// Gestione di stint, giri, restrizioni meteo e consumo caselle con parametri parlanti
// ==========================================

import { gameState, updateGameState } from './state.js';
import { verificaSeAsfaltoBagnato } from './weather.js';

export function gestisciModificaUsuraPneumaticiInGara(indiceCasellaSelezionata) {
    const arrayCasellePneumaticiCorrente = [...gameState.markedUsages.tyres];
    const valoreBasePneumatici = gameState.baseValues.tyres;
    const puntiAssegnatiSetupPneumatici = gameState.allocations.tyres;
    const totaleCaselleDisponibiliPneumatici = valoreBasePneumatici + puntiAssegnatiSetupPneumatici;

    const laCasellaContieneGiaUnaX = arrayCasellePneumaticiCorrente.includes(indiceCasellaSelezionata);

    if (laCasellaContieneGiaUnaX && arrayCasellePneumaticiCorrente.length > 0) {
        const indiceDaRimuovere = Math.min(...arrayCasellePneumaticiCorrente);
        const pos = arrayCasellePneumaticiCorrente.indexOf(indiceDaRimuovere);
        if (pos !== -1) {
            arrayCasellePneumaticiCorrente.splice(pos, 1);
        }
    } else {
        let indiceDestraDisponibile = -1;
        for (let i = totaleCaselleDisponibiliPneumatici - 1; i >= 0; i--) {
            if (!arrayCasellePneumaticiCorrente.includes(i)) {
                indiceDestraDisponibile = i;
                break;
            }
        }

        if (indiceDestraDisponibile !== -1) {
            arrayCasellePneumaticiCorrente.push(indiceDestraDisponibile);
        }
    }

    updateGameState({
        markedUsages: {
            ...gameState.markedUsages,
            tyres: arrayCasellePneumaticiCorrente
        }
    });

    return {
        operazioneRiuscita: true,
        tyresAggiornati: arrayCasellePneumaticiCorrente,
        messaggioDescrittivo: "Usura pneumatici aggiornata con successo."
    };
}

export function gestisciSelezioneMescolaEGiri(nomeMescolaSelezionata, numeroGiroStint) {
    const elencoMescoleValide = ['Prime', 'Option', 'Intermedie', 'Pioggia'];
    
    if (!elencoMescoleValide.includes(nomeMescolaSelezionata)) {
        return { operazioneRiuscita: false, messaggioDescrittivo: "La mescola selezionata non è valida." };
    }

    const mappaGiriStintAggiornata = { ...gameState.tyreLaps };

    // Rimuove il giro dalle altre mescole
    for (const mescolaCorrente of elencoMescoleValide) {
        if (mescolaCorrente !== nomeMescolaSelezionata) {
            mappaGiriStintAggiornata[mescolaCorrente] = mappaGiriStintAggiornata[mescolaCorrente].filter(
                girorif => girorif !== numeroGiroStint
            );
        }
    }

    // Regime Pit Stop: Mutua esclusione tra tick 2 e tick 3 sulla stessa mescola
    if (gameState.isRaceMode && gameState.isPitStopActive && (numeroGiroStint === 2 || numeroGiroStint === 3)) {
        const lapOpposto = (numeroGiroStint === 2) ? 3 : 2;
        const initialLaps = gameState.pitStopInitialTyreLaps || {};
        
        // Verifica se il tick opposto era già presente prima di entrare in questo pit stop (storico)
        const eraTickInizialeDellaSosta = Object.values(initialLaps).some(laps => laps.includes(lapOpposto));

        // Rimuove il tick opposto SOLO se NON apparteneva a una sosta precedente
        if (!eraTickInizialeDellaSosta) {
            mappaGiriStintAggiornata[nomeMescolaSelezionata] = mappaGiriStintAggiornata[nomeMescolaSelezionata].filter(
                girorif => girorif !== lapOpposto
            );
        }
    }

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

function isLapMarkedAnywhere(lap) {
    return Object.keys(gameState.tyreLaps).some(t => gameState.tyreLaps[t].includes(lap));
}

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
                        // Verifica se il tick è storico (già presente prima di entrare in questo Pit Stop)
                        const initialLaps = gameState.pitStopInitialTyreLaps || {};
                        const isHistorical = initialLaps[t] && initialLaps[t].includes(lap);

                        // Il tick 1 e tutti i tick storici delle soste passate sono intoccabili (immutabili)
                        if (lap !== 1 && !isHistorical) {
                            // Se stiamo valutando il tick 2, ma c'è un tick 3 attivo altrove sulla plancia, bloccalo globalmente
                            let globalBlock = (lap === 2 && isLapMarkedAnywhere(3));

                            // Verifica se lo stesso tick è già marcato su un'altra mescola
                            const sameLapMarkedElsewhere = Object.keys(gameState.tyreLaps).some(
                                tyre => tyre !== t && gameState.tyreLaps[tyre].includes(lap)
                            );

                            // Cliccabile se è già segnato oppure se rispetta tutti i filtri e blocchi
                            if (isMarked || (!globalBlock && !sameLapMarkedElsewhere && !lapUsedAnywhere)) {
                                isClickable = true;
                            }
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

            lapsHtml += `<div class="${classList}" ${isClickable ? `onclick="handleTyreClick('${t}',${lap})"` : ''}>${lap}</div>`;
        });

        card.innerHTML = `
            <button class="tyre-title-btn" ${(!isDisabledByWeather && !isInspecting) ? `onclick="selectTyre('${t}')"` : ''}>${t}</button>
            <div class="laps-container">${lapsHtml}</div>
        `;
        container.appendChild(card);
    });
}

export function selectTyreFromUI(type) {
    const isWet = verificaSeAsfaltoBagnato();

    if (type !== 'Intermedie') {
        if (gameState.weather === 'sun' && type === 'Pioggia') return;
        if (gameState.weather === 'rain' && (type === 'Prime' || type === 'Option')) return;
        if (isWet && (type === 'Prime' || type === 'Option')) return;
        if (!isWet && type === 'Pioggia') return;
    }
    
    if (gameState.isSetupMode) {
        const targetGiro = 1;
        const risultato = gestisciSelezioneMescolaEGiri(type, targetGiro);
        if (risultato.operazioneRiuscita) {
            renderTyreDeck();
            if (typeof saveGameState === 'function') saveGameState();
        }
    } else if (gameState.isPitStopActive) {
        updateGameState({ selectedTyre: type });
        renderTyreDeck();
        if (typeof saveGameState === 'function') saveGameState();
    }
}

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
    
    let markedTyres = [...(gameState.markedUsages.tyres || [])];
    let previousTyres = gameState.previousTyreUsages ? [...gameState.previousTyreUsages] : [];

    if (pos > -1) {
        // Deselezione del tick (2 o 3): ripristina le X dei pneumatici che erano state rimosse
        list.splice(pos, 1);
        markedTyres = previousTyres;
    } else {
        // Selezione di un nuovo tick (2 o 3): salva le usure attuali prima di pulirle, poi azzera SUBITO le X delle gomme
        previousTyres = [...markedTyres];
        gestisciSelezioneMescolaEGiri(type, lap);
        markedTyres = []; 
    }

    updateGameState({ 
        tyreLaps: { ...gameState.tyreLaps },
        previousTyreUsages: previousTyres,
        markedUsages: {
            ...gameState.markedUsages,
            tyres: markedTyres
        }
    });

    renderTyreDeck();
    if (typeof window.renderBoard === 'function') {
        window.renderBoard();
    }
    
    if (typeof saveGameState === 'function') {
        saveGameState();
    }
}
