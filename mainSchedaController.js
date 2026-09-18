// ==========================================
// MODULO: MAIN SCHEDA CONTROLLER (mainSchedaController.js)
// Coordinatore globale della plancia e delle fasi di gioco
// ==========================================

import { gameState, updateGameState } from './state.js';
import { assegnaPuntoBudgetSetup } from './setupPhase.js';
import { gestisciConsumoBenzinaEModifica } from './fuel.js';
import { gestisciUsuraMotore } from './engine.js';
import { gestisciModificaUsuraFreniETrafilamentoKers, eseguiTestAttivazioneKers } from './brakesKers.js';
import { gestisciUsuraTelaio } from './chassis.js';
import { gestisciUsuraSospensioni } from './suspension.js';
import { renderTyreDeck, selectTyreFromUI, handleTyreClick, gestisciModificaUsuraPneumaticiInGara } from './compoundsTyres.js';
import { toggleRaceEdit as toggleEditFromModule, ottieniDirezioneGeometricaComponente } from './editOutsideBoxes.js';
import { getKersIconHtml } from './layout.js';

export { renderTyreDeck, selectTyreFromUI, handleTyreClick };

/**
 * Inizializza la scheda del pilota caricando le preferenze e impostando il tema grafico.
 */
export function inizializzaSchedaPilota(datiInizialiPilota) {
    let defaultTyre;

    if (datiInizialiPilota.weather === 'rain') {
        defaultTyre = 'Pioggia';
    } else if (datiInizialiPilota.weather === 'var_dry' || datiInizialiPilota.weather === 'var_wet') {
        defaultTyre = 'Intermedie';
    } else {
        defaultTyre = 'Prime';
    }
    
    updateGameState({
        code: datiInizialiPilota.code,
        playerName: datiInizialiPilota.playerName,
        playerId: datiInizialiPilota.playerId,
        theme: datiInizialiPilota.theme,
        budget: 13,
        alettoneAttivo: false,
        selectedTyre: defaultTyre,
        tyreLaps: {
            Prime: defaultTyre === 'Prime' ? [1] : [],
            Option: defaultTyre === 'Option' ? [1] : [],
            Intermedie: defaultTyre === 'Intermedie' ? [1] : [],
            Pioggia: defaultTyre === 'Pioggia' ? [1] : []
        },
        allocations: {
            tyres: 0,
            brakes: 0,
            fuel: 0,
            body: 0,
            engine: 0,
            suspension: 0
        }
    });
}

/**
 * Transizione della scheda verso la fase di Ufficializzazione / Gara.
 */
export function ufficializzaSchedaPerGara() {
    const budgetRimanenteInSetup = gameState.budget;
    
    if (budgetRimanenteInSetup > 0) {
        return {
            operazioneRiuscita: false,
            messaggioDescrittivo: `Attenzione: Devi esaurire tutti i punti budget (rimanenti: ${budgetRimanenteInSetup}) prima di ufficializzare la scheda!`
        };
    }

    updateGameState({
        isSetupMode: false,
        isRaceMode: true,
        isEditingAllowed: false,
        isReady: true
    });

    return {
        operazioneRiuscita: true,
        messaggioDescrittivo: "Scheda ufficializzata con successo! La gara è iniziata."
    };
}

/**
 * Gestisce l'assegnazione o la modifica di un punto budget.
 */
export function gestisciAssegnazioneBudget(tipoArea, delta) {
    return assegnaPuntoBudgetSetup(tipoArea, delta);
}

/**
 * Coordina la modifica dell'usura di un componente durante la gara in modalità edit
 */
export function gestisciModificaUsuraInGara(tipoComponente, indiceCasella) {
    let res = null;
    switch (tipoComponente) {
        case 'tyres':
            res = gestisciModificaUsuraPneumaticiInGara(indiceCasella);
            break;
        case 'brakes':
            res = gestisciModificaUsuraFreniETrafilamentoKers(indiceCasella);
            break;
        case 'fuel':
            res = gestisciConsumoBenzinaEModifica(indiceCasella);
            // AGGIORNAMENTO DINAMICO MOV BENZINA
            if (res && res.operazioneRiuscita) {
                aggiornaLabelMovBenzina(res.stringaMov);
            }
            break;
        case 'engine':
            res = gestisciUsuraMotore(indiceCasella);
            break;
        case 'body':
            res = gestisciUsuraTelaio(indiceCasella);
            break;
        case 'suspension':
            res = gestisciUsuraSospensioni(indiceCasella);
            break;
        default:
            return { operazioneRiuscita: false, messaggioDescrittivo: "Componente non gestito." };
    }
    return res;
}


// ==========================================
// FUNZIONE DI RENDERING UNIFICATA DELLA PLANCIA (Stile Monolite)
// ==========================================

export function renderBoard() {
    const components = ['tyres', 'brakes', 'fuel', 'body', 'engine', 'suspension'];
    const rightAligned = ['body', 'engine', 'suspension'];
    const isInspecting = false; 

    components.forEach(comp => {
        const container = document.getElementById(`row-${comp}`);
        if (!container) return;
        container.innerHTML = '';

        const totalBoxes = (comp === 'tyres') ? 10 : 6;
        const baseVal = gameState.baseValues[comp];
        const addedVal = gameState.allocations[comp];
        const totalPoints = baseVal + addedVal;
        const isRight = rightAligned.includes(comp);
        const wingBoxIndex = totalBoxes - totalPoints;
        const isWingActive = gameState.alettoneAttivo || false;

        for (let i = 0; i < totalBoxes; i++) {
            const box = document.createElement('div');
            box.className = 'box';

            if (!isRight) {
                // Sezioni di sinistra (Tyres, Brakes, Fuel)
                if (comp === 'tyres' && i === 0) {
                    box.innerHTML = `<svg viewBox="0 0 100 100" style="width:22px;height:22px;color:currentColor;"><path d="M 50 15 A 35 35 0 1 1 20 60" fill="none" stroke="currentColor" stroke-width="8" stroke-dasharray="6,4"/><polygon points="12,50 25,65 30,45" fill="currentColor"/><text x="50" y="62" font-size="34" font-weight="bold" text-anchor="middle" fill="currentColor" font-family="Orbitron">1</text></svg>`;
                } else if (i < baseVal) {
                    box.innerText = '1';
                } else if (i < totalPoints) {
                    box.innerText = '1';
                    box.classList.add('user-allocated');
                    if (gameState.isSetupMode && !isInspecting) {
                        box.classList.add('clickable');
                        box.onclick = () => {
                            const res = gestisciAssegnazioneBudget(comp, -1);
                            if (res.operazioneRiuscita) {
                                renderBoard();
                                aggiornaInterfacciaBudgetMod(res.budgetResiduo);
                            }
                        };
                    }
                } else {
                    box.innerText = '';
                    if (gameState.isSetupMode && !isInspecting) {
                        if (gameState.budget > 0) {
                            box.classList.add('box-setup-highlight', 'clickable');
                            box.onclick = () => {
                                const res = gestisciAssegnazioneBudget(comp, 1);
                                if (res.operazioneRiuscita) {
                                    renderBoard();
                                    aggiornaInterfacciaBudgetMod(res.budgetResiduo);
                                } else {
                                    alert(res.messaggioDescrittivo);
                                }
                            };
                        } else {
                            box.classList.add('box-setup-disabled');
                        }
                    }
                }
            } else {
                // Sezioni di destra (Body, Engine, Suspension)
                const fromRight = totalBoxes - 1 - i;
                
                if (comp === 'body' && isWingActive && i === wingBoxIndex) {
                    box.innerText = 'X';
                    box.classList.add('wing-x', 'x-black');
                    box.dataset.base = "true";
                } else if (fromRight < baseVal) {
                    box.innerText = '1';
                } else if (fromRight < totalPoints) {
                    box.innerText = '1';
                    box.classList.add('user-allocated');
                    if (gameState.isSetupMode && !isInspecting) {
                        box.classList.add('clickable');
                        box.onclick = () => {
                            const res = gestisciAssegnazioneBudget(comp, -1);
                            if (res.operazioneRiuscita) {
                                if (comp === 'body') gestisciAggiornamentoAlettoneDopoModifica(comp);
                                renderBoard();
                                aggiornaInterfacciaBudgetMod(res.budgetResiduo);
                            }
                        };
                    }
                } else {
                    box.innerText = '';
                    if (gameState.isSetupMode && !isInspecting) {
                        // Rimosso il blocco restrittivo di bloccatoDaAlettone: 
                        // le caselle vuote (inclusi gli spazi liberi a sinistra) tornano interamente cliccabili per il setup.
                        if (gameState.budget > 0) {
                            box.classList.add('box-setup-highlight', 'clickable');
                            box.onclick = () => {
                                const res = gestisciAssegnazioneBudget(comp, 1);
                                if (res.operazioneRiuscita) {
                                    if (comp === 'body') gestisciAggiornamentoAlettoneDopoModifica(comp);
                                    renderBoard();
                                    aggiornaInterfacciaBudgetMod(res.budgetResiduo);
                                } else {
                                    alert(res.messaggioDescrittivo);
                                }
                            };
                        } else {
                            box.classList.add('box-setup-disabled');
                        }
                    }
                }
            }

            // 3. Gestione della modalità Gara / Edit / Pit Stop
            if (gameState.isRaceMode) {
                const isWingXBox = (comp === 'body' && isWingActive && i === wingBoxIndex);
                
                if (isWingXBox) {
                    box.innerText = 'X';
                    box.className = 'box wing-x';
                } else if (gameState.markedUsages[comp] && gameState.markedUsages[comp].includes(i)) {
                    box.innerText = 'X';
                    box.className = 'box x-red'; 
                }

                let isClickableBox = (gameState.isEditingAllowed || gameState.isPitStopActive) && !isInspecting && !isWingXBox;
                if (isClickableBox) {
                    box.classList.add('clickable');
                    box.onclick = () => {
                        const res = gestisciModificaUsuraInGara(comp, i);
                        if (res && res.operazioneRiuscita) {
                            renderBoard();
                        }
                    };
                }
            }

            container.appendChild(box);
        }
    });
    
    // Aggiornamento visivo dello stato KERS globale nella plancia
    if (typeof updateKersDisplay === 'function') {
        updateKersDisplay();
    }

    // Aggiornamento visivo dello stato Alettone esterno in basso
    const boxWing = document.getElementById('box-wing');
    if (boxWing) {
        boxWing.classList.remove('wing-active', 'circle-green', 'x-red');
        if (gameState.alettoneDanneggiato) {
            boxWing.innerHTML = `<span class="flicker-text">X</span>`;
            boxWing.classList.add('x-red');
        } else if (gameState.alettoneAttivo) {
            boxWing.classList.add('wing-active', 'circle-green');
            if (!boxWing.querySelector('svg')) {
                boxWing.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;color:inherit;">
                        <path d="M 2 6 L 22 6 L 20 10 L 4 10 Z" fill="currentColor" fill-opacity="0.2"/>
                        <path d="M 2 4 L 4 14 L 2 14 Z"/>
                        <path d="M 22 4 L 20 14 L 22 14 Z"/>
                        <line x1="9" y1="10" x2="9" y2="17"/>
                        <line x1="15" y1="10" x2="15" y2="17"/>
                    </svg>
                `;
            }
        } else {
            boxWing.innerHTML = '';
        }
    }

    // Aggiornamento contatore budget nella UI di setup
    const budgetCountEl = document.getElementById('budget-count');
    if (budgetCountEl) budgetCountEl.innerText = gameState.budget;
}

/**
 * Funzione di servizio interna per aggiornare graficamente il budget e il pulsante di blocco
 */
function aggiornaInterfacciaBudgetMod(budgetResiduo) {
    const budgetCount = document.getElementById('budget-count');
    if (budgetCount) budgetCount.innerText = budgetResiduo;

    const btnLock = document.getElementById('btn-lock-setup');
    if (btnLock) {
        btnLock.disabled = (budgetResiduo > 0);
    }

    const setupScreen = document.getElementById('screen-setup');
    if (setupScreen) {
        if (budgetResiduo === 0) {
            setupScreen.classList.add('budget-zero');
        } else {
            setupScreen.classList.remove('budget-zero');
        }
    }
}


// ==========================================
// GESTIONE ALETTONE (Wing) & TELAIO
// ==========================================

export function toggleWing() {
    const boxWing = document.getElementById('box-wing');
    if (!boxWing) return;

    let isWingActive = boxWing.classList.contains('wing-active');
    
    if (!isWingActive) {
        const wingSvg = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;color:inherit;">
                <path d="M 2 6 L 22 6 L 20 10 L 4 10 Z" fill="currentColor" fill-opacity="0.2"/>
                <path d="M 2 4 L 4 14 L 2 14 Z"/>
                <path d="M 22 4 L 20 14 L 22 14 Z"/>
                <line x1="9" y1="10" x2="9" y2="17"/>
                <line x1="15" y1="10" x2="15" y2="17"/>
            </svg>
        `;
        boxWing.classList.add('wing-active', 'circle-green');
        boxWing.innerHTML = wingSvg;
        isWingActive = true;
    } else {
        boxWing.classList.remove('wing-active', 'circle-green');
        boxWing.innerHTML = '';
        isWingActive = false;
    }
       
    updateGameState({ alettoneAttivo: isWingActive });
    renderBoard();
}

export function gestisciAggiornamentoAlettoneDopoModifica(tipoComponente) {
    if (tipoComponente !== 'body') return;
    const boxWing = document.getElementById('box-wing');
    const isWingActive = boxWing && boxWing.classList.contains('wing-active');
    updateGameState({ alettoneAttivo: isWingActive });
    renderBoard();
}

export function toggleRaceEdit() {
    // 1. Esegue la logica e l'aggiornamento UI del modulo figlio
    toggleEditFromModule();
    
    // 2. Il main controller (padre) coordina la vista e aggiorna la plancia
    renderBoard();
}


function updateKersDisplay() {
    const boxKers = document.getElementById('box-kers');
    if (!boxKers) return;

    const statoKers = gameState.kersState;
    let htmlContenuto = '';

    boxKers.classList.remove('charged', 'damaged', 'empty', 'circle-kers');

    if (statoKers === 'damaged') {
        boxKers.classList.add('x-red'); // <-- Aggiunge lo stile grafico rosso/flicker
        htmlContenuto = `<span class="flicker-text">X</span>`;
        boxKers.style.setProperty('pointer-events', 'none', 'important');
        boxKers.style.cursor = 'default';
    } else if (statoKers === 'charged') {
        // Aggiunge la classe circle-kers per l'animazione luminosa del monolite
        boxKers.classList.add('circle-kers', 'charged');
        const iconaTematica = getKersIconHtml(gameState.theme);
        htmlContenuto = `<div class="kers-icon-container charged">${iconaTematica}</div>`;
        
        boxKers.style.setProperty('pointer-events', 'auto', 'important');
        boxKers.style.cursor = 'pointer';
        
        // Assicura l'apertura della modale KERS al click
        boxKers.onclick = () => {
            const modalKers = document.getElementById('modal-kers');
            if (modalKers) modalKers.style.display = 'flex';
        };
    } else {
        htmlContenuto = `<div class="kers-icon-container empty"></div>`;
        boxKers.style.setProperty('pointer-events', 'none', 'important');
        boxKers.style.cursor = 'default';
        boxKers.onclick = null;
    }

    boxKers.innerHTML = htmlContenuto;
}


/**
 * Gestisce l'esito del test KERS coordinando il modulo brakesKers e il rendering della plancia
 */
export function gestisciTestKers(esitoTest) {
    const risultato = eseguiTestAttivazioneKers(esitoTest);
    if (risultato.operazioneRiuscita) {
        renderBoard();
    }
    return risultato;
}
