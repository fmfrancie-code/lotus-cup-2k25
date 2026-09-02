// ==========================================
// MODULO: SCRIPT PONTE / ENTRY POINT (script.js)
// Collega l'HTML monolitico ai moduli JavaScript moderni
// ==========================================

import { applyTheme, inizializzaLayout } from './layout.js';             // 1. Gestione Tema Grafico
import { gameState, updateGameState } from './state.js';                 // 2. Gestione Stato Globale
import { gestisciMeteo } from './weather.js';                            // 3. Gestione Meteo
import { aggiornaTelemetria } from './telemetryGrid.js';                 // 4. Gestione Telemetria
import { inizializzaSchedaPilota, gestisciAssegnazioneBudget, ufficializzaSchedaPerGara, toggleAlettoneController } from './mainSchedaController.js';



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

    console.log("Fase di configurazione avviata. Budget disponibile: 13 punti.");
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
    console.log("Gara ufficialmente avviata!");
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
});


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

                // Salta le caselle fisse o disabilitate dall'Alettone
                if (box.dataset.base === "true" || box.classList.contains('wing-disabled') || (box.innerText.trim() !== '' && !box.classList.contains('user-allocated'))) {
                    return;
                }

                const tipoComponente = righeComponenti[rowId];
                const boxesNellaRiga = Array.from(container.querySelectorAll('.box'));
                const isDaDestra = componentiDaDestra.includes(tipoComponente);
                const puntiAttuali = gameState.allocations[tipoComponente] || 0;
                const indiceBox = boxesNellaRiga.indexOf(box);

                let delta = 0;

                if (isDaDestra) {
                    // Da destra a sinistra: individua la prima casella utile partendo da destra
                    const boxesValide = boxesNellaRiga.filter(b => !b.classList.contains('wing-disabled'));
                    const indicePrimoBase = boxesValide.findIndex(b => b.innerText.trim() !== '' && !b.classList.contains('user-allocated'));
                    const indiceUltimaVuota = indicePrimoBase - 1;
                    const indiceUltimaAllocata = indiceUltimaVuota - puntiAttuali + 1;

                    if (box.classList.contains('user-allocated') && indiceBox === indiceUltimaAllocata) {
                        delta = -1;
                    } else if (!box.classList.contains('user-allocated') && indiceBox === indiceUltimaVuota - puntiAttuali) {
                        delta = 1;
                    } else {
                        return;
                    }
                } else {
                    // Da sinistra a destra: individua la prima casella vuota disponibile
                    const boxesValide = boxesNellaRiga.filter(b => !b.classList.contains('wing-disabled'));
                    const offsetInizio = boxesValide.findIndex(b => b.innerText.trim() === '');
                    const indiceProssimoDaAggiungere = offsetInizio + puntiAttuali;
                    const indiceUltimoAggiunto = offsetInizio + puntiAttuali - 1;

                    if (box.classList.contains('user-allocated') && indiceBox === indiceUltimoAggiunto) {
                        delta = -1;
                    } else if (!box.classList.contains('user-allocated') && indiceBox === indiceProssimoDaAggiungere) {
                        delta = 1;
                    } else {
                        return;
                    }
                }

                const risultato = gestisciAssegnazioneBudget(tipoComponente, delta);

                if (risultato.operazioneRiuscita) {
                    if (delta > 0) {
                        box.classList.add('user-allocated');
                        box.innerText = '1'; 
                    } else {
                        box.classList.remove('user-allocated');
                        box.innerText = ''; 
                    }
                    
                    const budgetCount = document.getElementById('budget-count');
                    if (budgetCount) budgetCount.innerText = risultato.budgetResiduo;

                    const btnLock = document.getElementById('btn-lock-setup');
                    if (btnLock) {
                        btnLock.disabled = (risultato.budgetResiduo > 0);
                    }
                } else {
                    alert(risultato.messaggioDescrittivo);
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
    // Trova la prima casella della sezione telaio che contiene un punto base (es. '1') per disabilitarla mantenendo il numero
    const targetBox = boxesBody.find(b => b.innerText.trim() !== '' && !b.classList.contains('wing-disabled'));

    const isAttivo = boxWing.classList.contains('wing-active');
    const wingSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M3 12h18M3 6h18M6 18h12"/></svg>`;

    if (!isAttivo) {
        boxWing.classList.add('wing-active');
        boxWing.innerHTML = wingSvg;
        
        if (targetBox) {
            targetBox.classList.add('wing-disabled');
            // Mantiene il numero '1' visibile ma barrato/attenuato come richiesto
            if (targetBox.innerText.trim() === '') targetBox.innerText = '1';
        }
    } else {
        boxWing.classList.remove('wing-active');
        boxWing.innerHTML = '';

        const disabledBodyBox = boxesBody.find(b => b.classList.contains('wing-disabled'));
        if (disabledBodyBox) {
            disabledBodyBox.classList.remove('wing-disabled');
        }
    }
};

console.log("Lotus Cup 2k25: Script Main orchestrato correttamente.");
