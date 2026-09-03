// ==========================================
// MODULO: MAESTRO D'ORCHESTRA (script.js)
// Coordinatore centrale degli eventi e della UI
// ==========================================

import { applyTheme, inizializzaLayout, inizializzaInterazionePlancia } from './layout.js';
import { gameState, updateGameState } from './state.js';
import { inizializzaSchedaPilota, ufficializzaSchedaPerGara } from './mainSchedaController.js';

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inizializzazione interfaccia e interazioni della plancia
    inizializzaLayout();
    inizializzaInterazionePlancia();

    // 2. Gestione cambio tema grafico tramite menu a tendina
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            applyTheme(e.target.value);
            updateGameState({ theme: e.target.value });
        });
    }

    // 3. Listener per la navigazione tra le schermate
    bindClick('btn-goto-new-game', () => showScreen('screen-new-game'));
    bindClick('btn-goto-join', () => openJoinGameScreen());
    bindClick('btn-goto-load', () => loadSavedGameModal());
    bindClick('btn-goto-tutorial', () => showScreen('screen-tutorial'));
    
    document.querySelectorAll('.btn-back-home').forEach(btn => {
        btn.addEventListener('click', () => showScreen('screen-home'));
    });

    // 4. Listener per le azioni di gioco
    bindClick('btn-create-game', () => handleCreateGame());
    bindClick('btn-start-config', () => handleStartConfiguration());
    bindClick('btn-lock-setup', () => handleOfficializeSetup());
    bindClick('box-wing', () => toggleWingController());
    bindClick('btn-close-load-modal', () => closeModal('modal-load-game'));
});

// Funzione di utilità per legare i click in sicurezza
function bindClick(elementId, callback) {
    const el = document.getElementById(elementId);
    if (el) {
        el.addEventListener('click', callback);
    }
}

// --- FUNZIONI DI GESTIONE SCHERMATE E FLUSSO ---

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

function handleCreateGame() {
    const circuit = document.getElementById('input-circuit').value;
    const host = document.getElementById('input-host').value;
    const weather = document.getElementById('input-weather').value;

    if (!circuit || !host || !weather) {
        alert("Compila tutti i campi per creare la partita!");
        return;
    }

    const todayFormatted = new Date().toLocaleDateString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    inizializzaSchedaPilota({
        code: Math.floor(1000 + Math.random() * 9000).toString(),
        playerName: host,
        playerId: 'player_' + Date.now(),
        theme: gameState.theme
    });

    updateGameState({ circuit, host, weather, isSetupMode: true });
    showScreen('screen-setup');
    
    document.getElementById('display-circuit').innerText = circuit.toUpperCase();
    document.getElementById('display-meta').innerText = `Data: ${todayFormatted} | Pilota: ${host}`;
    document.getElementById('display-code').innerText = gameState.code;
}

function handleStartConfiguration() {
    updateGameState({ isSetupMode: true, budget: 13 });

    const setupScreen = document.getElementById('screen-setup');
    if (setupScreen) setupScreen.classList.add('setup-active');

    const btnStart = document.getElementById('btn-start-config');
    const btnLock = document.getElementById('btn-lock-setup');
    const budgetBar = document.getElementById('budget-bar');
    const budgetCount = document.getElementById('budget-count');

    if (btnStart) btnStart.style.display = 'none';
    if (btnLock) { btnLock.style.display = 'block'; btnLock.disabled = true; }
    if (budgetBar) budgetBar.style.display = 'block';
    if (budgetCount) budgetCount.innerText = gameState.budget;
}

function handleOfficializeSetup() {
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
}

function openJoinGameScreen() {
    showScreen('screen-join-game');
}

function loadSavedGameModal() {
    const modal = document.getElementById('modal-load-game');
    if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function toggleWingController() {
    const boxWing = document.getElementById('box-wing');
    if (!boxWing) return;
    boxWing.classList.toggle('wing-active');
}

console.log("Lotus Cup 2k25: Script Master Orchestrator avviato correttamente.");
