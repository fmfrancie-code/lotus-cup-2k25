// ==========================================
// MODULO: MAIN SCHEDA CONTROLLER (mainSchedaController.js)
// Coordinatore globale della plancia e delle fasi di gioco
// ==========================================

import { gameState, updateGameState } from './state.js';
import { assegnaPuntoBudgetSetup } from './setupPhase.js';
import { gestisciConsumoBenzinaEModifica, gestisciConsumoBenzinaAiBox } from './fuel.js';
import { gestisciUsuraMotore } from './engine.js';
import { gestisciModificaUsuraFreniETrafilamentoKers, eseguiTestAttivazioneKers } from './brakesKers.js';
import { gestisciUsuraTelaio } from './chassis.js';
import { gestisciUsuraSospensioni } from './suspension.js';
import { renderTyreDeck, selectTyreFromUI, handleTyreClick, gestisciModificaUsuraPneumaticiInGara } from './compoundsTyres.js';
import { toggleRaceEdit as toggleEditFromModule, ottieniDirezioneGeometricaComponente } from './editOutsideBoxes.js';
import { avviaSessionePitStop, finalizzaRipartenzaDaiBox, registraPuntoRiparazioneOfficina, rimuoviPuntoRiparazioneOfficina, ottieniStringaMovOfficina } from './pitStopBoxes.js';
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

export function gestisciAvvioPitStop(numeroGiro) {
    const risultato = avviaSessionePitStop(numeroGiro);
    if (risultato.operazioneRiuscita) {
        // Trasforma il pulsante di edit in una label statica "Sei nei box" con lo stile magenta coordinato
        const btnEdit = document.getElementById('btn-toggle-edit');
        if (btnEdit) {
            btnEdit.innerText = "SEI NEI BOX";
            btnEdit.classList.remove('btn-read-mode', 'btn-edit-mode');
            btnEdit.classList.add('btn-pitstop-mode');
            btnEdit.style.pointerEvents = 'none';
            btnEdit.style.cursor = 'default';
            // Stile coordinato con il pulsante "Conferma Uscita Box"
            btnEdit.style.color = '#ff2a8d';
            btnEdit.style.borderColor = '#ff2a8d';
            btnEdit.style.background = 'rgba(255, 42, 141, 0.1)';
        }

        renderTyreDeck(); // Sblocca i tick 2 e 3
        renderBoard();
    }
    return risultato;
}

export function gestisciUscitaBox() {
    const risultato = finalizzaRipartenzaDaiBox();
    if (risultato.operazioneRiuscita) {
        // Rimuove eventuali classi di attivazione rimaste sul body
        document.body.classList.remove('edit-mode-active', 'pitstop-mode-active');

        // Ripristina graficamente il pulsante di edit nello stato bloccato (Read Mode)
        const btnEdit = document.getElementById('btn-toggle-edit');
        if (btnEdit) {
            btnEdit.innerText = "Modalità edit attiva (clicca per sbloccare)";
            btnEdit.classList.remove('btn-edit-mode', 'btn-pitstop-mode');
            btnEdit.classList.add('btn-read-mode');
            btnEdit.style.opacity = '1';
            btnEdit.style.pointerEvents = 'auto';
        }

        // Nasconde completamente il pulsante di accesso ai box
        const btnPitStop = document.getElementById('btn-pitstop-action'); 
        if (btnPitStop) {
            btnPitStop.style.display = 'none';
        }

        renderTyreDeck();      
        renderWorkshopUI();    
        renderBoard();
    }
    return risultato;
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
 * Coordina la modifica dell'usura di un componente durante la gara in modalità edit o pit stop
 */
export function gestisciModificaUsuraInGara(tipoComponente, indiceCasella) {
    const usureCorrenti = gameState.markedUsages[tipoComponente] || [];
    const staRimuovendoX = usureCorrenti.includes(indiceCasella);

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

    // GESTIONE PIT STOP: I punti officina vengono generati SOLO rimuovendo una X da freni, telaio, motore o sospensioni
    const componentiRiparabiliInOfficina = ['brakes', 'body', 'engine', 'suspension'];
    if (res && res.operazioneRiuscita && gameState.isPitStopActive && staRimuovendoX && componentiRiparabiliInOfficina.includes(tipoComponente)) {
        registraPuntoRiparazioneOfficina(tipoComponente, indiceCasella);
        renderWorkshopUI();
    }

    return res;
}

/**
 * Aggiorna dinamicamente l'etichetta visiva del MOV della benzina a schermo
 */
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

/**
 * Aggiorna la UI della sezione officina (valore MOV e caselle con X rosse da sinistra a destra)
 */
export function renderWorkshopUI() {
    const workshopUsages = gameState.workshopUsages || [];
    const movText = ottieniStringaMovOfficina();
    
    const movLabelEl = document.getElementById('workshop-mov-label');
    if (movLabelEl) movLabelEl.innerText = movText;

    const rowWorkshop = document.getElementById('row-workshop');
    if (rowWorkshop) {
        const boxes = rowWorkshop.querySelectorAll('.box');
        boxes.forEach((box, idx) => {
            if (workshopUsages.includes(idx)) {
                box.innerText = 'X';
                box.className = 'box x-red';
            } else {
                box.innerText = '1';
                box.className = 'box';
            }

            // Se siamo in Pit Stop e la casella ha una X rossa, permette il click per rimuovere il punto e ripristinare la parte
            if (gameState.isPitStopActive && workshopUsages.includes(idx)) {
                box.classList.add('clickable');
                box.style.pointerEvents = 'auto';
                box.style.cursor = 'pointer';
                box.onclick = () => {
                    rimuoviPuntoRiparazioneOfficina(idx);
                    renderBoard(); // Ridisegna la plancia e aggiorna l'officina/MOV
                };
            } else {
                box.classList.remove('clickable');
                box.style.pointerEvents = 'none';
                box.onclick = null;
            }
        });
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
                        let res;
                        // Se siamo sul carburante e siamo ai box, usiamo la funzione dedicata ai box
                        if (comp === 'fuel' && gameState.isPitStopActive) {
                            res = gestisciConsumoBenzinaAiBox(i);
                        } else {
                            // Altrimenti, usiamo il flusso standard di gara
                            res = gestisciModificaUsuraInGara(comp, i);
                        }

                        if (res && res.operazioneRiuscita) {
                            renderBoard();
                        }
                    };
                }
            }

            container.appendChild(box);
        }
    });
    
    if (typeof updateKersDisplay === 'function') {
        updateKersDisplay();
    }

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

    // Sincronizzazione UI officina e MOV benzina
    renderWorkshopUI();

    const baseBenzina = gameState.baseValues.fuel;
    const allocBenzina = gameState.allocations.fuel;
    const usurateBenzina = gameState.markedUsages.fuel ? gameState.markedUsages.fuel.length : 0;
    const libereBenzina = (baseBenzina + allocBenzina) - usurateBenzina;
    
    let stringaMovCorrente = "+0 MOV";
    if (gameState.isPitStopActive && libereBenzina >= 4) {
        stringaMovCorrente = "-2 MOV";
    } else if (libereBenzina <= 3 && libereBenzina > 0) {
        stringaMovCorrente = "+1 MOV";
    }
    aggiornaLabelMovBenzina(stringaMovCorrente);

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
    if (gameState.isPitStopActive) return; // Blocco di sicurezza: impedisce l'edit ai box
    toggleEditFromModule();
    renderBoard();
}

function updateKersDisplay() {
    const boxKers = document.getElementById('box-kers');
    if (!boxKers) return;

    const statoKers = gameState.kersState;
    let htmlContenuto = '';

    boxKers.classList.remove('charged', 'damaged', 'empty', 'circle-kers');

    if (statoKers === 'damaged') {
        boxKers.classList.add('x-red'); 
        htmlContenuto = `<span class="flicker-text">X</span>`;
        boxKers.style.setProperty('pointer-events', 'none', 'important');
        boxKers.style.cursor = 'default';
    } else if (statoKers === 'charged') {
        boxKers.classList.add('circle-kers', 'charged');
        const iconaTematica = getKersIconHtml(gameState.theme);
        htmlContenuto = `<div class="kers-icon-container charged">${iconaTematica}</div>`;
        
        boxKers.style.setProperty('pointer-events', 'auto', 'important');
        boxKers.style.cursor = 'pointer';
        
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

export function gestisciTestKers(esitoTest) {
    const risultato = eseguiTestAttivazioneKers(esitoTest);
    if (risultato.operazioneRiuscita) {
        renderBoard();
    }
    return risultato;
}

window.renderBoard = renderBoard;
window.handleTyreClick = handleTyreClick;
