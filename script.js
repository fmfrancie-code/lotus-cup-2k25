// ==========================================
// MODULO: SCRIPT PONTE / ENTRY POINT (script.js)
// Collega l'HTML monolitico ai moduli JavaScript moderni
// ==========================================

import { applyTheme, inizializzaLayout, aggiornaInterfacciaBudget, inizializzaInterazionePlancia } from './layout.js';
import { gameState, updateGameState } from './state.js';
import { inizializzaSchedaPilota, gestisciAssegnazioneBudget, ufficializzaSchedaPerGara, toggleAlettoneController } from './mainSchedaController.js';

// --- FUNZIONE PER DISEGNARE LE CASELLA SULLA PLANCIA ---
function renderizzaCasellePlancia() {
    const configurazioneRighe = {
        'row-tyres': { base: 4, extra: gameState.allocations.tyres },
        'row-body': { base: 2, extra: gameState.allocations.body },
        'row-brakes': { base: 2, extra: gameState.allocations.brakes },
        'row-engine': { base: 2, extra: gameState.allocations.engine },
        'row-fuel': { base: 2, extra: gameState.allocations.fuel },
        'row-suspension': { base: 2, extra: gameState.allocations.suspension },
        'row-workshop': { base: 3, extra: 0 }
    };

    Object.keys(configurazioneRighe).forEach(rowId => {
        const container = document.getElementById(rowId);
        if (!container) return;
        
        container.innerHTML = '';
        const config = configurazioneRighe[rowId];
        const totaleCaselle = config.base + config.extra;

        for (let i = 0; i < totaleCaselle; i++) {
            const box = document.createElement('div');
            box.className = 'box clickable';
            if (i < config.base) {
                box.dataset.base = "true";
            }
            container.appendChild(box);
        }
    });
}

// --- ESPORTAZIONE GLOBALE PER I PULSANTI HTML (onclick) ---

window.changeTheme = function(themeName) {
    applyTheme(themeName);
    updateGameState({ theme: themeName });
};

window.showScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
};

window.createGame = function() {
    const circuit = document.getElementById('input-circuit').value;
    const host = document.getElementById('input-host').value;
    const weather = document.getElementById('input-weather').value;

    if (!circuit || !host || !weather) {
        alert("Compila tutti i campi per creare la partita!");
        return;
    }

    const todayFormatted = new Date().toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    inizializzaSchedaPilota({
        code: Math.floor(1000 + Math.random() * 9000).toString(),
        playerName: host,
        playerId: 'player_' + Date.now(),
        theme: gameState.theme
    });

    updateGameState({
        circuit: circuit,
        host: host,
        weather: weather,
        isSetupMode: true
    });

    window.showScreen('screen-setup');
    
    document.getElementById('display-circuit').innerText = circuit.toUpperCase();
    document.getElementById('display-meta').innerText = `Data: ${todayFormatted} | Pilota: ${host}`;
    document.getElementById('display-code').innerText = gameState.code;

    // Disegna i box all'ingresso della schermata di setup
    renderizzaCasellePlancia();
};

window.startConfiguration = function() {
    updateGameState({
        isSetupMode: true,
        budget: 13 
    });

    const setupScreen = document.getElementById('screen-setup');
    if (setupScreen) {
        setupScreen.classList.add('setup-active');
    }

    const btnStart = document.getElementById('btn-start-config');
    const btnLock = document.getElementById('btn-lock-setup');
    const budgetBar = document.getElementById('budget-bar');
    const budgetCount = document.getElementById('budget-count');

    if (btnStart) btnStart.style.display = 'none';
    if (btnLock) {
        btnLock.style.display = 'block';
        btnLock.disabled = true; 
    }
    if (budgetBar) budgetBar.style.display = 'block';
    if (budgetCount) budgetCount.innerText = gameState.budget;

    renderizzaCasellePlancia();
};

window.officializeSetup = function() {
    const risultato = ufficializzaSchedaPerGara();

    if (!risultato.operazioneRiuscita) {
        alert(risultato.messaggioDescrittivo);
        return;
    }

    const btnLock = document.getElementById('btn-lock-setup');
    const budgetBar = document.getElementById('budget-bar');
    const raceControls = document.getElementById('race-controls');

    if (btnLock) btnLock.style.display = 'none';
    if (budgetBar) budgetBar.style.display = 'none';
    if (raceControls) raceControls.style.display = 'flex';

    alert(risultato.messaggioDescrittivo);
};

window.openJoinGameScreen = function() {
    window.showScreen('screen-join-game');
};

window.loadSavedGameModal = function() {
    const modal = document.getElementById('modal-load-game');
    if (modal) modal.style.display = 'flex';
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
};

// --- INIZIALIZZAZIONE INTERFACCIA ---
document.addEventListener("DOMContentLoaded", () => {
    inizializzaLayout();
    inizializzaInterazionePlancia();
    renderizzaCasellePlancia();

    // Listener per il cambio tema dal menu a tendina
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            applyTheme(e.target.value);
            updateGameState({ theme: e.target.value });
        });
    }

    // Collegamento dei pulsanti di navigazione
    bindClick('btn-goto-new-game', () => showScreen('screen-new-game'));
    bindClick('btn-goto-join', () => openJoinGameScreen());
    bindClick('btn-goto-load', () => loadSavedGameModal());
    bindClick('btn-goto-tutorial', () => showScreen('screen-tutorial'));
    
    document.querySelectorAll('.btn-back-home').forEach(btn => {
        btn.addEventListener('click', () => showScreen('screen-home'));
    });

    bindClick('btn-create-game', () => createGame());
    bindClick('btn-start-config', () => startConfiguration());
    bindClick('btn-lock-setup', () => officializeSetup());
    bindClick('box-wing', () => toggleWing());
    bindClick('btn-close-load-modal', () => closeModal('modal-load-game'));
});

function bindClick(elementId, callback) {
    const el = document.getElementById(elementId);
    if (el) {
        el.addEventListener('click', callback);
    }
}

// --- GESTIONE DEI CLICK SULLA PLANCIA (SETUP BUDGET) ---
document.addEventListener("DOMContentLoaded", () => {
    const righeComponenti = {
        'row-tyres': 'tyres',
        'row-body': 'body',
        'row-brakes': 'brakes',
        'row-engine': 'engine',
        'row-fuel': 'fuel',
        'row-suspension': 'suspension'
    };

    const componentiDaDestra = ['body', 'engine', 'suspension'];

    Object.keys(righeComponenti).forEach(rowId => {
        const container = document.getElementById(rowId);
        if (container) {
            container.addEventListener('click', (e) => {
                if (!gameState.isSetupMode) return;
                
                const box = e.target.closest('.box');
                if (!box) return;

                if (box.dataset.base === "true" || box.classList.contains('wing-disabled')) return;

                const tipoComponente = righeComponenti[rowId];
                const boxesNellaRiga = Array.from(container.querySelectorAll('.box'));
                const isDaDestra = componentiDaDestra.includes(tipoComponente);

                let delta = 0;

                if (isDaDestra) {
                    const boxesValide = boxesNellaRiga.filter(b => !b.classList.contains('wing-disabled'));
                    const primeVuoteDaDestra = [...boxesValide].reverse();
                    const primaCasellaVuota = primeVuoteDaDestra.find(b => b.innerText.trim() === '');
                    const caselleAllocate = boxesValide.filter(b => b.classList.contains('user-allocated'));

                    if (box.classList.contains('user-allocated')) {
                        if (caselleAllocate.length > 0 && box === caselleAllocate[0]) {
                            delta = -1;
                        } else {
                            return;
                        }
                    } else if (box.innerText.trim() === '' && primaCasellaVuota && box === primaCasellaVuota) {
                        delta = 1;
                    } else {
                        if (primaCasellaVuota) {
                            const risultato = gestisciAssegnazioneBudget(tipoComponente, 1);
                            if (risultato.operazioneRiuscita) {
                                primaCasellaVuota.classList.add('user-allocated');
                                primaCasellaVuota.innerText = '1';
                                aggiornaInterfacciaBudget(risultato.budgetResiduo);
                            } else {
                                alert(risultato.messaggioDescrittivo);
                            }
                        }
                        return;
                    }
                } else {
                    const boxesValide = boxesNellaRiga.filter(b => !b.classList.contains('wing-disabled'));
                    const primaCasellaVuota = boxesValide.find(b => b.innerText.trim() === '');
                    const caselleAllocate = boxesValide.filter(b => b.classList.contains('user-allocated'));
                    const ultimaAllocataDallUtente = caselleAllocate.length > 0 ? caselleAllocate[caselleAllocate.length - 1] : null;

                    if (box.classList.contains('user-allocated') && box === ultimaAllocataDallUtente) {
                        delta = -1;
                    } else if (box.innerText.trim() === '') {
                        if (primaCasellaVuota) {
                            const risultato = gestisciAssegnazioneBudget(tipoComponente, 1);
                            if (risultato.operazioneRiuscita) {
                                primaCasellaVuota.classList.add('user-allocated');
                                primaCasellaVuota.innerText = '1';
                                aggiornaInterfacciaBudget(risultato.budgetResiduo);
                            } else {
                                alert(risultato.messaggioDescrittivo);
                            }
                        }
                        return;
                    } else {
                        return;
                    }
                }

                if (delta < 0) {
                    const risultato = gestisciAssegnazioneBudget(tipoComponente, delta);
                    if (risultato.operazioneRiuscita) {
                        box.classList.remove('user-allocated');
                        box.innerText = '';
                        aggiornaInterfacciaBudget(risultato.budgetResiduo);
                    }
                }
            });
        }
    });
});

window.toggleWing = function() {
    const boxWing = document.getElementById('box-wing');
    if (!boxWing) return;

    const containerBody = document.getElementById('row-body');
    if (!containerBody) return;
    
    const boxesBody = Array.from(containerBody.querySelectorAll('.box'));
    const targetBox = boxesBody.find(b => b.innerText.trim() === '1' && !b.classList.contains('wing-disabled'));

    const isAttivo = boxWing.classList.contains('wing-active');
    const wingSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M3 12h18M3 6h18M6 18h12"/></svg>`;

    if (!isAttivo) {
        boxWing.classList.add('wing-active');
        boxWing.innerHTML = wingSvg;
        
        if (targetBox) {
            targetBox.dataset.base = "true";
            targetBox.classList.add('wing-disabled');
        }
    } else {
        boxWing.classList.remove('wing-active');
        boxWing.innerHTML = '';

        const disabledBodyBox = boxesBody.find(b => b.classList.contains('wing-disabled'));
        if (disabledBodyBox) {
            disabledBodyBox.classList.remove('wing-disabled');
            disabledBodyBox.dataset.base = "false";
        }
    }
};

console.log("Lotus Cup 2k25: Script ripristinato con renderizzatore plancia e tutti i temi.");
