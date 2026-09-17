// ==========================================
// MODULO: SCRIPT PONTE / ENTRY POINT (script.js)
// Collega l'HTML monolitico ai moduli JavaScript moderni
// ==========================================

import { applyTheme, inizializzaLayout } from './layout.js';
import { gameState, updateGameState } from './state.js';
import { inizializzaMeteoGara, ottieniEtichettaMeteo, ottieniIconaMeteo } from './weather.js';
import { 
    inizializzaSchedaPilota, 
    ufficializzaSchedaPerGara, 
    renderTyreDeck, 
    selectTyreFromUI, 
    handleTyreClick, 
    toggleRaceEdit,
    renderBoard,
    toggleWing,
    gestisciTestKers
} from './mainSchedaController.js';

// ---- ESPOSIZIONE GLOBALE PER I PULSANTI HTML (onclick) ----
window.selectTyre = selectTyreFromUI;
window.toggleTyreLap = handleTyreClick;
window.toggleRaceEdit = toggleRaceEdit;
window.toggleWing = toggleWing;

window.changeTheme = function(themeName) {
    applyTheme(themeName);
    updateGameState({ theme: themeName });
    renderBoard();
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
        weather: weather,
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
    
    const weatherTextEl = document.getElementById('weather-text'); 
    if (weatherTextEl) {
        weatherTextEl.innerText = ottieniEtichettaMeteo(weather);
    }
    
    const weatherIconEl = document.getElementById('weather-icon');
    if (weatherIconEl) {
        weatherIconEl.innerHTML = ottieniIconaMeteo(weather);
    }
    
    renderTyreDeck();
    renderBoard();
};

window.startConfiguration = function() {
    updateGameState({ isSetupMode: true });

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
    
    renderTyreDeck();
    renderBoard(); // Disegna la plancia con i click di setup abilitati
};

window.officializeSetup = function() {
    const risultato = ufficializzaSchedaPerGara();

    if (!risultato.operazioneRiuscita) {
        alert(risultato.messaggioDescrittivo);
        return;
    }

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

    renderBoard(); // Ridisegna la plancia chiudendo la fase di setup e sbloccando la gara
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

// --- INIZIALIZZAZIONE INTERFACCIA AL CARICAMENTO ---
document.addEventListener("DOMContentLoaded", () => {
    inizializzaLayout();
    renderTyreDeck();
    renderBoard();
});


// Funzione globale collegata ai bottoni della modale KERS
window.resolveKers = function(isDamaged) {
    const esitoStr = isDamaged ? 'damaged' : 'ok';
    const risultato = gestisciTestKers(esitoStr); // Passa attraverso il main controller

    if (risultato.operazioneRiuscita) {
        if (!isDamaged) {
            // Effetto visivo di scossione della casella KERS quando svuotata con successo
            const kersBox = document.getElementById('box-kers');
            if (kersBox) {
                kersBox.classList.add('kers-shake');
                setTimeout(() => kersBox.classList.remove('kers-shake'), 400);
            }
        }
        closeModal('modal-kers');
    } else {
        alert(risultato.messaggioDescrittivo);
    }
};
console.log("Lotus Cup 2k25: Script Main orchestrato e ripulito correttamente.");
