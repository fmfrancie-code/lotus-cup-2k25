// ==========================================
// MODULO: SCRIPT PONTE / ENTRY POINT (script.js)
// Collega l'HTML monolitico ai moduli JavaScript moderni
// ==========================================

import { applyTheme, inizializzaLayout, aggiornaInterfacciaBudget, inizializzaInterazionePlancia, aggiornaStatoAlettoneTelaio } from './layout.js';
import { gameState, updateGameState } from './state.js';
import { inizializzaMeteoGara, ottieniEtichettaMeteo, ottieniIconaMeteo } from './weather.js';
import { aggiornaTelemetria } from './telemetryGrid.js';
import { inizializzaSchedaPilota, gestisciAssegnazioneBudget, ufficializzaSchedaPerGara, renderTyreDeck, selectTyreFromUI, handleTyreClick, gestisciModificaUsuraInGara, toggleRaceEdit } from './mainSchedaController.js';

// ---- ESPOSIZIONE GLOBALE DELLE FUNZIONI MESCOLE E GESTORI INLINE NEL DOM
window.selectTyre = selectTyreFromUI;
window.toggleTyreLap = handleTyreClick;
window.toggleRaceEdit = toggleRaceEdit;

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

    // Rimuove la classe di setup per disattivare l'interattività CSS di plancia e alettone
    const setupScreen = document.getElementById('screen-setup');
    if (setupScreen) {
        setupScreen.classList.remove('setup-active');
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
    inizializzaListenerEditGara();
    renderTyreDeck();
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


/**
 * Inizializza il listener in script.js per la modalità Edit in gara su tutta la plancia
 */
function inizializzaListenerEditGara() {
    const righeComponenti = {
        'row-tyres': 'tyres',
        'row-brakes': 'brakes',
        'row-fuel': 'fuel',
        'row-engine': 'engine',
        'row-body': 'body',
        'row-suspension': 'suspension'
    };

    Object.keys(righeComponenti).forEach(rowId => {
        const container = document.getElementById(rowId);
        if (container && !container.dataset.editListenerAttached) {
            container.dataset.editListenerAttached = "true";

            container.addEventListener('click', (e) => {
                // Verifica che la modalità edit sia attiva sul body
                if (!document.body.classList.contains('edit-mode-active')) return;
                
                e.stopImmediatePropagation();
                const box = e.target.closest('.box');
                if (!box) return;

                // Esclude solo l'alettone disabilitato o elementi non validi
                if (box.classList.contains('wing-disabled') || box.classList.contains('wing-x')) return;

                const tipoComponente = righeComponenti[rowId];
                const boxesNellaRiga = Array.from(container.querySelectorAll('.box'));
                const indiceBox = boxesNellaRiga.indexOf(box);

                // Legge lo stato attuale delle usure per questo componente
                let usureCorrenti = [...(gameState.markedUsages[tipoComponente] || [])];

                // Toggle manuale della casella esatta cliccata (Metti/Togli X)
                if (usureCorrenti.includes(indiceBox)) {
                    usureCorrenti = usureCorrenti.filter(idx => idx !== indiceBox);
                } else {
                    usureCorrenti.push(indiceBox);
                }

                // Aggiorna lo stato globale rispettando la regola d'oro (tramite updateGameState)
                const nuovoMarkedUsages = {
                    ...gameState.markedUsages,
                    [tipoComponente]: usureCorrenti
                };
                
                updateGameState({ markedUsages: nuovoMarkedUsages });

                // Sincronizza visivamente la riga esatta
                sincronizzaVisualizzazioneRiga(container, usureCorrenti);
            });
        }
    });
}

/**
 * Aggiorna la grafica della riga applicando o rimuovendo la classe .x-red sulle caselle
 */
function sincronizzaVisualizzazioneRiga(container, arrayIndiciUsurati) {
    if (!arrayIndiciUsurati) return;
    const boxes = container.querySelectorAll('.box');
    boxes.forEach((box, index) => {
        if (box.dataset.base === "true" || box.classList.contains('wing-disabled')) return;

        if (arrayIndiciUsurati.includes(index)) {
            box.classList.add('x-red');
            box.innerText = 'X';
        } else {
            box.classList.remove('x-red');
            box.innerText = '1';
        }
    });
}

console.log("Lotus Cup 2k25: Script Main orchestrato correttamente.");
