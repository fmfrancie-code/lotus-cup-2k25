// ==========================================
// MODULO: SCRIPT PONTE / ENTRY POINT (script.js)
// Collega l'HTML monolitico ai moduli JavaScript moderni
// ==========================================

import { gameState, updateGameState } from './state.js';
import { applyTheme } from './layout.js';
import { inizializzaSchedaPilota, ufficializzaSchedaPerGara } from './mainSchedaController.js';
import { assegnaPuntoBudgetSetup } from './setupPhase.js';
import { gestisciConsumoBenzinaEModifica } from './fuel.js';
import { gestisciModificaUsuraFreniETrafilamentoKers } from './brakesKers.js';
import { gestisciUsuraTelaio } from './chassis.js';
import { gestisciUsuraMotore } from './engine.js';
import { gestisciUsuraSospensioni } from './suspension.js';

// --- ESPORTAZIONE GLOBALE PER I PULSANTI HTML (onclick) ---

window.changeTheme = function(themeName) {
    applyTheme(themeName);
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

    // Passa alla schermata di setup/gioco
    window.showScreen('screen-setup');
    
    // Aggiorna i testi nell'header della plancia
    document.getElementById('display-circuit').innerText = circuit.toUpperCase();
    document.getElementById('display-meta').innerText = `Data: Oggi | Pilota: ${host}`;
    document.getElementById('display-code').innerText = gameState.code;
};

window.openJoinGameScreen = function() {
    window.showScreen('screen-join-game');
    // Qui collegheremo la logica della lista stanze che faremo subito dopo
};

window.loadSavedGameModal = function() {
    const modal = document.getElementById('modal-load-game');
    if (modal) modal.style.display = 'flex';
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
};

// Funzioni di test rapido per verificare il caricamento dei moduli
console.log("Lotus Cup 2k25: Script ponte caricato correttamente con tutti i moduli attivi.");
