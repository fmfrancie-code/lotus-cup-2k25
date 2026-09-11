// ==========================================
// MODULO: SCRIPT PONTE / ENTRY POINT (script.js)
// Collega l'HTML monolitico ai moduli JavaScript moderni
// ==========================================

import { applyTheme, inizializzaLayout, aggiornaInterfacciaBudget, inizializzaInterazionePlancia, aggiornaStatoAlettoneTelaio } from './layout.js';
import { gameState, updateGameState } from './state.js';
import { inizializzaMeteoGara, ottieniEtichettaMeteo, ottieniIconaMeteo } from './weather.js';
import { aggiornaTelemetria } from './telemetryGrid.js';
import { inizializzaSchedaPilota, gestisciAssegnazioneBudget, ufficializzaSchedaPerGara, renderTyreDeck, selectTyreFromUI, handleTyreClick } from './mainSchedaController.js';

// ---- ESPOSIZIONE GLOBALE DELLE FUNZIONI MESCOLE E GESTORI INLINE NEL DOM
window.selectTyre = selectTyreFromUI;
window.toggleTyreLap = handleTyreClick;

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
    console.log("Valore meteo letto dalla UI:", weather);
    
    if (!circuit || !host || !weather) {
        alert("Compila tutti i campi per creare la partita!");
        return;
    }

    inizializzaMeteoGara(weather);

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
        isSetupMode: false
    });

    window.showScreen('screen-setup');
    
    document.getElementById('display-circuit').innerText = circuit.toUpperCase();
    document.getElementById('display-meta').innerText = `Data: ${todayFormatted} | Pilota: ${host}`;
    document.getElementById('display-code').innerText = gameState.code;
    
    // Aggiorna correttamente il testo del meteo tramite l'ID corretto
    const weatherTextEl = document.getElementById('weather-text'); 
    if (weatherTextEl) {
        weatherTextEl.innerText = ottieniEtichettaMeteo(weather);
    }
    // Aggiorna correttamente l'icona del meteo tramite l'ID corretto
    const weatherIconEl = document.getElementById('weather-icon');
    if (weatherIconEl) {
    weatherIconEl.innerHTML = ottieniIconaMeteo(weather);
}
    
    // Rendi reattivo il deck delle gomme in base al meteo scelto
    renderTyreDeck();
};

window.startConfiguration = function() {
    updateGameState({
        isSetupMode: true,
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
    
    // Aggiorna subito il deck delle gomme per mostrare la pre-selezione attiva
    renderTyreDeck();

    console.log("Fase di configurazione avviata con mescola predefinita:", gameState.selectedTyre);
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
    renderTyreDeck();
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

                if (box.dataset.base === "true" || box.classList.contains('wing-disabled')) return;

                const tipoComponente = righeComponenti[rowId];
                const boxesNellaRiga = Array.from(container.querySelectorAll('.box'));
                const isDaDestra = componentiDaDestra.includes(tipoComponente);

                let delta = 0;

                if (isDaDestra) {
                    const boxesValide = boxesNellaRiga.filter(b => !b.classList.contains('wing-disabled'));
                    const primeVuoteDaDestra = boxesValide.reverse();
                    
                    const primaCasellaVuota = primeVuoteDaDestra.find(b => b.innerText.trim() === '');

                    if (box.classList.contains('user-allocated')) {
                        const caselleAllocate = boxesValide.filter(b => b.classList.contains('user-allocated'));
                        if (caselleAllocate.length > 0 && box === caselleAllocate[0]) {
                            delta = -1;
                        } else {
                            return;
                        }
                    } else if (box.innerText.trim() === '' && primaCasellaVuota && box === primaCasellaVuota) {
                        delta = 1;
                    } else {
                        if (primaCasellaVuota) {
                            delta = 1;
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
                        
                        const boxWing = document.getElementById('box-wing');
                        if (tipoComponente === 'body' && boxWing && boxWing.classList.contains('wing-active')) {
                            aggiornaStatoAlettoneTelaio(true);
                        }
                    }
                }
            });
        }
    });
});

window.toggleWing = function() {
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
       
    aggiornaStatoAlettoneTelaio(isWingActive);
};

console.log("Lotus Cup 2k25: Script Main orchestrato correttamente.");
