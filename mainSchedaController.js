// ==========================================
// MODULO: MAIN SCHEDA CONTROLLER (mainSchedaController.js)
// Coordinatore globale della plancia e delle fasi di gioco
// ==========================================

import { gameState, updateGameState } from './state.js';
import { assegnaPuntoBudgetSetup } from './setupPhase.js';
import { gestisciConsumoBenzinaEModifica } from './fuel.js';
import { gestisciUsuraMotore } from './engine.js';
import { gestisciModificaUsuraFreniETrafilamentoKers } from './brakesKers.js';
import { gestisciUsuraTelaio } from './chassis.js';
import { gestisciUsuraSospensioni } from './suspension.js';
import { renderTyreDeck, selectTyreFromUI, handleTyreClick, gestisciModificaUsuraPneumaticiInGara } from './compoundsTyres.js';
import { toggleRaceEdit as toggleEditFromModule } from './editOutsideBoxes.js';

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
    switch (tipoComponente) {
        case 'tyres':
            return gestisciModificaUsuraPneumaticiInGara(indiceCasella);
        case 'brakes':
            return gestisciModificaUsuraFreniETrafilamentoKers(indiceCasella);
        case 'fuel':
            return gestisciConsumoBenzinaEModifica(indiceCasella);
        case 'engine':
            return gestisciUsuraMotore(indiceCasella);
        case 'body':
            return gestisciUsuraTelaio(indiceCasella);
        case 'suspension':
            return gestisciUsuraSospensioni(indiceCasella);
        default:
            return { operazioneRiuscita: false, messaggioDescrittivo: "Componente non gestito." };
    }
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
                        // Verifica blocco alettone sul telaio
                        let bloccatoDaAlettone = false;
                        if (comp === 'body' && isWingActive) {
                            const indiceDisabilitato = totalBoxes - totalPoints;
                            if (i <= indiceDisabilitato) bloccatoDaAlettone = true;
                        }

                        if (!bloccatoDaAlettone) {
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
                        } else {
                            box.classList.add('wing-disabled');
                        }
                    }
                }
            }

            // 3. Gestione della modalità Gara / Edit / Pit Stop
            if (gameState.isRaceMode) {
                const isWingXBox = (comp === 'body' && isWingActive && i === wingBoxIndex);
                
                if (gameState.markedUsages[comp] && gameState.markedUsages[comp].includes(i)) {
                    box.innerText = 'X';
                    box.className = 'box x-red'; // Forza lo stile pulito della X rossa neon
                } else if (isWingXBox) {
                    box.innerText = 'X';
                    box.className = 'box wing-x'; // Mantiene blindata la X dell'alettone
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
