// ==========================================
// MODULO: MAIN SCHEDA CONTROLLER (mainSchedaController.js)
// ==========================================

import { gameState, updateGameState } from './state.js';
import { assegnaPuntoBudgetSetup } from './setupPhase.js';
import { gestisciConsumoBenzinaEModifica, gestisciConsumoBenzinaAiBox } from './fuel.js';
import { gestisciUsuraMotore } from './engine.js';
import { gestisciModificaUsuraFreniETrafilamentoKers, eseguiTestAttivazioneKers } from './brakesKers.js';
import { gestisciUsuraTelaio } from './chassis.js';
import { gestisciUsuraSospensioni } from './suspension.js';
import { renderTyreDeck, selectTyreFromUI, handleTyreClick, gestisciModificaUsuraPneumaticiInGara } from './compoundsTyres.js';
import { toggleRaceEdit as toggleEditFromModule } from './editOutsideBoxes.js';
import { avviaSessionePitStop, finalizzaRipartenzaDaiBox, registraPuntoRiparazioneOfficina, rimuoviPuntoRiparazioneOfficina, ottieniStringaMovOfficina } from './pitStopBoxes.js';
import { getKersIconHtml } from './layout.js';
import { inviaAggiornamentoStato } from './network.js';

export { renderTyreDeck, selectTyreFromUI, handleTyreClick };

/**
 * Funzione di supporto interna per ottenere lo stato attivo della scheda in modo chiaro e leggibile.
 * Se è attivo lo scouting, restituisce i dati dell'avversario dalla memoria; altrimenti restituisce il gameState locale.
 */
function getActiveBoardState() {
    const isInspectingAnotherPlayer = (window.inspectedPilotId !== null);
    
    if (isInspectingAnotherPlayer && window.currentRoomPilots) {
        const targetPilot = window.currentRoomPilots.find(function(pilotaConnesso) {
            return pilotaConnesso.id === window.inspectedPilotId;
        });
        
        if (targetPilot && targetPilot.boardData) {
            return targetPilot.boardData;
        }
    }
    
    return gameState;
}

/**
 * Funzione di supporto per sincronizzare in un unico pacchetto lo stato con il server (via Socket.io).
 * Viene chiamata solo quando si conferma/chiude la modifica (blocco edit) o all'uscita dai box.
 */
function sincronizzaStatoRemoto() {
    if (gameState.code && gameState.playerId) {
        inviaAggiornamentoStato({
            code: gameState.code,
            pilotId: gameState.playerId,
            sheetStatus: gameState.sheetStatus || "Aggiornato",
            boardData: gameState
        });
    }
}

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
        kersDamagedByEngine: false,
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

export function gestisciAvvioPitStop(numeroGiro) {
    const risultato = avviaSessionePitStop(numeroGiro);
    if (risultato.operazioneRiuscita) {
        const btnEdit = document.getElementById('btn-toggle-edit');
        if (btnEdit) {
            btnEdit.innerText = "SEI NEI BOX";
            btnEdit.classList.remove('btn-read-mode', 'btn-edit-mode');
            btnEdit.classList.add('btn-pitstop-mode');
            btnEdit.style.pointerEvents = 'none';
            btnEdit.style.cursor = 'default';
            btnEdit.style.color = '#ff2a8d';
            btnEdit.style.borderColor = '#ff2a8d';
            btnEdit.style.background = 'rgba(255, 42, 141, 0.1)';
        }

        const weatherTestBtn = document.getElementById('btn-weather-test');
        if (weatherTestBtn) {
            weatherTestBtn.style.display = 'none';
        }

        renderTyreDeck(); 
        renderBoard();
    }
    return risultato;
}

export function gestisciUscitaBox() {
    const risultato = finalizzaRipartenzaDaiBox();
    if (risultato.operazioneRiuscita) {
        document.body.classList.remove('edit-mode-active', 'pitstop-mode-active');

        const btnEdit = document.getElementById('btn-toggle-edit');
        if (btnEdit) {
            btnEdit.innerText = "Modalità edit bloccata(clicca per sbloccare)";
            btnEdit.classList.remove('btn-edit-mode', 'btn-pitstop-mode');
            btnEdit.classList.add('btn-read-mode');
            btnEdit.style.opacity = '1';
            btnEdit.style.pointerEvents = 'auto';
        }

        const btnPitStop = document.getElementById('btn-pitstop-action'); 
        if (btnPitStop) {
            btnPitStop.style.display = 'none';
        }

        const weatherTestBtn = document.getElementById('btn-weather-test');
        if (weatherTestBtn) {
            weatherTestBtn.style.display = 'none';
        }
        
        updateGameState({
            sheetStatus: "Aggiornato"
        });
            
        sincronizzaStatoRemoto(); // Invia il pacchetto completo alla fine del pit stop
        renderTyreDeck();      
        renderWorkshopUI();    
        renderBoard();
    }
    return risultato;
}

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
        isReady: true,
        sheetStatus: "Aggiornato"
    });

    return {
        operazioneRiuscita: true,
        messaggioDescrittivo: "Scheda ufficializzata con successo! La gara è iniziata."
    };
}

export function gestisciAssegnazioneBudget(tipoArea, delta) {
    return assegnaPuntoBudgetSetup(tipoArea, delta);
}

export function gestisciModificaUsuraInGara(tipoComponente, indiceCasella) {
    const usureCorrenti = gameState.markedUsages[tipoComponente] || [];
    const staRimuovendoX = usureCorrenti.includes(indiceCasella);

    let risultatoModifica = null;
    switch (tipoComponente) {
        case 'tyres':
            risultatoModifica = gestisciModificaUsuraPneumaticiInGara(indiceCasella);
            break;
        case 'brakes':
            risultatoModifica = gestisciModificaUsuraFreniETrafilamentoKers(indiceCasella);
            break;
        case 'fuel':
            risultatoModifica = gestisciConsumoBenzinaEModifica(indiceCasella);
            if (risultatoModifica && risultatoModifica.operazioneRiuscita) {
                aggiornaLabelMovBenzina(risultatoModifica.stringaMov);
            }
            break;
        case 'engine':
            risultatoModifica = gestisciUsuraMotore(indiceCasella);
            break;
        case 'body':
            risultatoModifica = gestisciUsuraTelaio(indiceCasella);
            break;
        case 'suspension':
            risultatoModifica = gestisciUsuraSospensioni(indiceCasella);
            break;
        default:
            return { operazioneRiuscita: false, messaggioDescrittivo: "Componente non gestito." };
    }

    if (risultatoModifica && risultatoModifica.operazioneRiuscita) {
        updateGameState({ sheetStatus: "Aggiornato" });
        // NOTA: Niente sincronizzazione qui per singolo click. Verrà inviato tutto il pacchetto bloccando l'edit.
    }

    const componentiRiparabiliInOfficina = ['brakes', 'body', 'engine', 'suspension'];
    if (risultatoModifica && risultatoModifica.operazioneRiuscita && gameState.isPitStopActive && staRimuovendoX && componentiRiparabiliInOfficina.includes(tipoComponente)) {
        const indiceRealeRimosso = risultatoModifica.indiceModificato !== undefined ? risultatoModifica.indiceModificato : indiceCasella;
        registraPuntoRiparazioneOfficina(tipoComponente, indiceRealeRimosso);
        renderWorkshopUI();
    }

    return risultatoModifica;
}

function aggiornaLabelMovBenzina(stringaMov) {
    const labelMov = document.getElementById('fuel-mov-label');
    if (labelMov) {
        labelMov.innerText = stringaMov;
        
        if (stringaMov === "+1 MOV") {
            labelMov.classList.add('mov-active');
        } else {
            labelMov.classList.remove('mov-active');
        }
    }
}

export function renderWorkshopUI() {
    const activeBoardState = getActiveBoardState();
    const workshopUsages = activeBoardState.workshopUsages || [];
    const movText = ottieniStringaMovOfficina();
    
    const movLabelEl = document.getElementById('workshop-mov-label');
    if (movLabelEl) movLabelEl.innerText = movText;

    const rowWorkshop = document.getElementById('row-workshop');
    if (rowWorkshop) {
        const boxes = rowWorkshop.querySelectorAll('.box');
        boxes.forEach(function(boxElement, index) {
            if (workshopUsages.includes(index)) {
                boxElement.innerText = 'X';
                boxElement.className = 'box x-red';
            } else {
                boxElement.innerText = '1';
                boxElement.className = 'box';
            }

            const isInspectingAnotherPlayer = (window.inspectedPilotId !== null);
            if (!isInspectingAnotherPlayer && activeBoardState.isPitStopActive && workshopUsages.includes(index)) {
                boxElement.classList.add('clickable');
                boxElement.style.pointerEvents = 'auto';
                boxElement.style.cursor = 'pointer';
                boxElement.onclick = function() {
                    rimuoviPuntoRiparazioneOfficina(index);
                    renderBoard(); 
                };
            } else {
                boxElement.classList.remove('clickable');
                boxElement.style.pointerEvents = 'none';
                boxElement.onclick = null;
            }
        });
    }
}

export function renderBoard() {
    const activeBoardState = getActiveBoardState();
    const isInspectingAnotherPlayer = (window.inspectedPilotId !== null);
    
    const componentNames = ['tyres', 'brakes', 'fuel', 'body', 'engine', 'suspension'];
    const rightAlignedComponents = ['body', 'engine', 'suspension'];

    componentNames.forEach(function(componentName) {
        const container = document.getElementById(`row-${componentName}`);
        if (!container) return;
        container.innerHTML = '';

        const totalBoxes = (componentName === 'tyres') ? 10 : 6;
        const baseValue = activeBoardState.baseValues[componentName];
        const allocatedValue = activeBoardState.allocations[componentName];
        const totalPoints = baseValue + allocatedValue;
        const isRightAligned = rightAlignedComponents.includes(componentName);
        const wingBoxIndex = totalBoxes - totalPoints;
        const isWingActive = activeBoardState.alettoneAttivo || false;

        for (let boxIndex = 0; boxIndex < totalBoxes; boxIndex++) {
            const boxElement = document.createElement('div');
            boxElement.className = 'box';

            if (!isRightAligned) {
                if (componentName === 'tyres' && boxIndex === 0) {
                    boxElement.innerHTML = `<svg viewBox="0 0 100 100" style="width:22px;height:22px;color:currentColor;"><path d="M 50 15 A 35 35 0 1 1 20 60" fill="none" stroke="currentColor" stroke-width="8" stroke-dasharray="6,4"/><polygon points="12,50 25,65 30,45" fill="currentColor"/><text x="50" y="62" font-size="34" font-weight="bold" text-anchor="middle" fill="currentColor" font-family="Orbitron">1</text></svg>`;
                } else if (boxIndex < baseValue) {
                    boxElement.innerText = '1';
                } else if (boxIndex < totalPoints) {
                    boxElement.innerText = '1';
                    boxElement.classList.add('user-allocated');
                    if (activeBoardState.isSetupMode && !isInspectingAnotherPlayer) {
                        boxElement.classList.add('clickable');
                        boxElement.onclick = function() {
                            const risultatoAssegnazione = gestisciAssegnazioneBudget(componentName, -1);
                            if (risultatoAssegnazione.operazioneRiuscita) {
                                renderBoard();
                                aggiornaInterfacciaBudgetMod(risultatoAssegnazione.budgetResiduo);
                            }
                        };
                    }
                } else {
                    boxElement.innerText = '';
                    if (activeBoardState.isSetupMode && !isInspectingAnotherPlayer) {
                        if (activeBoardState.budget > 0) {
                            boxElement.classList.add('box-setup-highlight', 'clickable');
                            boxElement.onclick = function() {
                                const risultatoAssegnazione = gestisciAssegnazioneBudget(componentName, 1);
                                if (risultatoAssegnazione.operazioneRiuscita) {
                                    renderBoard();
                                    aggiornaInterfacciaBudgetMod(risultatoAssegnazione.budgetResiduo);
                                } else {
                                    alert(risultatoAssegnazione.messaggioDescrittivo);
                                }
                            };
                        } else {
                            boxElement.classList.add('box-setup-disabled');
                        }
                    }
                }
            } else {
                const distancefromRight = totalBoxes - 1 - boxIndex;
                
                if (componentName === 'body' && isWingActive && boxIndex === wingBoxIndex) {
                    boxElement.innerText = 'X';
                    boxElement.classList.add('wing-x', 'x-black');
                    boxElement.dataset.base = "true";
                } else if (distancefromRight < baseValue) {
                    boxElement.innerText = '1';
                } else if (distancefromRight < totalPoints) {
                    boxElement.innerText = '1';
                    boxElement.classList.add('user-allocated');
                    if (activeBoardState.isSetupMode && !isInspectingAnotherPlayer) {
                        boxElement.classList.add('clickable');
                        boxElement.onclick = function() {
                            const risultatoAssegnazione = gestisciAssegnazioneBudget(componentName, -1);
                            if (risultatoAssegnazione.operazioneRiuscita) {
                                if (componentName === 'body') gestisciAggiornamentoAlettoneDopoModifica(componentName);
                                renderBoard();
                                aggiornaInterfacciaBudgetMod(risultatoAssegnazione.budgetResiduo);
                            }
                        };
                    }
                } else {
                    boxElement.innerText = '';
                    if (activeBoardState.isSetupMode && !isInspectingAnotherPlayer) {
                        if (activeBoardState.budget > 0) {
                            boxElement.classList.add('box-setup-highlight', 'clickable');
                            boxElement.onclick = function() {
                                const risultatoAssegnazione = gestisciAssegnazioneBudget(componentName, 1);
                                if (risultatoAssegnazione.operazioneRiuscita) {
                                    if (componentName === 'body') gestisciAggiornamentoAlettoneDopoModifica(componentName);
                                    renderBoard();
                                    aggiornaInterfacciaBudgetMod(risultatoAssegnazione.budgetResiduo);
                                } else {
                                    alert(risultatoAssegnazione.messaggioDescrittivo);
                                }
                            };
                        } else {
                            boxElement.classList.add('box-setup-disabled');
                        }
                    }
                }
            }

            if (activeBoardState.isRaceMode) {
                const isWingXBox = (componentName === 'body' && isWingActive && boxIndex === wingBoxIndex);
                
                if (isWingXBox) {
                    boxElement.innerText = 'X';
                    boxElement.className = 'box wing-x';
                } else if (activeBoardState.markedUsages[componentName] && activeBoardState.markedUsages[componentName].includes(boxIndex)) {
                    boxElement.innerText = 'X';
                    boxElement.className = 'box x-red'; 
                }

                let isClickableBox = (activeBoardState.isEditingAllowed || activeBoardState.isPitStopActive) && !isInspectingAnotherPlayer && !isWingXBox;
                if (isClickableBox) {
                    boxElement.classList.add('clickable');
                    boxElement.onclick = function() {
                        let risultatoModifica;
                        if (componentName === 'fuel' && activeBoardState.isPitStopActive) {
                            risultatoModifica = gestisciConsumoBenzinaAiBox(boxIndex);
                        } else {
                            risultatoModifica = gestisciModificaUsuraInGara(componentName, boxIndex);
                        }

                        if (risultatoModifica && risultatoModifica.operazioneRiuscita) {
                            renderBoard();
                        }
                    };
                }
            }

            container.appendChild(boxElement);
        }
    });
    
    if (typeof updateKersDisplay === 'function') {
        updateKersDisplay();
    }

    const boxWing = document.getElementById('box-wing');
    if (boxWing) {
        boxWing.classList.remove('wing-active', 'circle-green', 'x-red');
        if (activeBoardState.alettoneDanneggiato) {
            boxWing.innerHTML = `<span class="flicker-text">X</span>`;
            boxWing.classList.add('x-red');
        } else if (activeBoardState.alettoneAttivo) {
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
    if (typeof renderTyreDeck === 'function') {
        renderTyreDeck();
    }
    
    renderWorkshopUI();

    const baseBenzina = activeBoardState.baseValues.fuel;
    const allocBenzina = activeBoardState.allocations.fuel;
    const usurateBenzina = activeBoardState.markedUsages.fuel ? activeBoardState.markedUsages.fuel.length : 0;
    const libereBenzina = (baseBenzina + allocBenzina) - usurateBenzina;
    
    let stringaMovCorrente = "+0 MOV";
    if (activeBoardState.isPitStopActive && libereBenzina >= 4) {
        stringaMovCorrente = "-2 MOV";
    } else if (libereBenzina <= 3 && libereBenzina > 0) {
        stringaMovCorrente = "+1 MOV";
    }
    aggiornaLabelMovBenzina(stringaMovCorrente);

    const budgetCountEl = document.getElementById('budget-count');
    if (budgetCountEl) budgetCountEl.innerText = activeBoardState.budget;
}

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
       
    updateGameState({ 
        alettoneAttivo: isWingActive
    });
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
    if (gameState.isPitStopActive) return; 
    
    // Esegue il toggle della modalità edit
    toggleEditFromModule();
    
    // Se la modalità edit è stata appena chiusa/bloccata (quindi isEditingAllowed è diventato false),
    // inviamo l'intero pacchetto aggiornato al server in un'unica soluzione!
    if (!gameState.isEditingAllowed) {
        sincronizzaStatoRemoto();
    }
    
    renderBoard();
}

function updateKersDisplay() {
    const boxKers = document.getElementById('box-kers');
    if (!boxKers) return;

    const activeBoardState = getActiveBoardState();
    const statoKers = activeBoardState.kersState;
    let htmlContenuto = '';

    boxKers.classList.remove('charged', 'damaged', 'empty', 'circle-kers', 'x-red');
    boxKers.style.removeProperty('pointer-events');
    boxKers.style.removeProperty('cursor');

    if (statoKers === 'damaged') {
        boxKers.classList.add('x-red'); 
        htmlContenuto = `<span class="flicker-text">X</span>`;
        boxKers.style.setProperty('pointer-events', 'none', 'important');
        boxKers.style.cursor = 'default';
    } else if (statoKers === 'charged') {
        boxKers.classList.add('circle-kers', 'charged');
        const iconaTematica = getKersIconHtml(activeBoardState.theme);
        htmlContenuto = `<div class="kers-icon-container charged">${iconaTematica}</div>`;
        
        const isInspectingAnotherPlayer = (window.inspectedPilotId !== null);
        if (!isInspectingAnotherPlayer) {
            boxKers.style.setProperty('pointer-events', 'auto', 'important');
            boxKers.style.cursor = 'pointer';
            boxKers.onclick = function() {
                const modalKers = document.getElementById('modal-kers');
                if (modalKers) modalKers.style.display = 'flex';
            };
        } else {
            boxKers.style.setProperty('pointer-events', 'none', 'important');
        }
    } else {
        boxKers.classList.add('empty');
        htmlContenuto = `<div class="kers-icon-container empty"></div>`;
        boxKers.style.setProperty('pointer-events', 'none', 'important');
        boxKers.style.cursor = 'default';
        boxKers.onclick = null;
    }

    boxKers.innerHTML = htmlContenuto;
}

export function gestisciTestKers(esitoTest) {
    const risultato = eseguiTestAttivazioneKers(esitoTest);
    if (risultato.operazioneRiuscita) {
        renderBoard();
    }
    return risultato;
}

window.renderBoard = renderBoard;
window.handleTyreClick = handleTyreClick;
