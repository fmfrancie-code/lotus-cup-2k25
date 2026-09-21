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

    if (laCasellaContieneGiaUnaX) {
        const indiceDaRimuovere = arrayCasellePneumaticiCorrente.indexOf(indiceCasellaSelezionata);
        if (indiceDaRimuovere !== -1) {
            arrayCasellePneumaticiCorrente.splice(indiceDaRimuovere, 1);
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

    for (const mescolaCorrente of elencoMescoleValide) {
        if (mescolaCorrente !== nomeMescolaSelezionata) {
            mappaGiriStintAggiornata[mescolaCorrente] = mappaGiriStintAggiornata[mescolaCorrente].filter(
                girorif => girorif !== numeroGiroStint
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

    if (pos > -1) {
        list.splice(pos, 1);
        if (gameState.previousTyreUsages) {
            markedTyres = [...gameState.previousTyreUsages];
        }
    } else {
        gestisciSelezioneMescolaEGiri(type, lap);
        markedTyres = []; // Azzera le usure per il nuovo set montato
    }

    updateGameState({ 
        tyreLaps: { ...gameState.tyreLaps },
        markedUsages: {
            ...gameState.markedUsages,
            tyres: markedTyres
        }
    });

    renderTyreDeck();
    if (typeof renderBoard === 'function') {
        renderBoard();
    }
    if (typeof saveGameState === 'function') saveGameState();
}
