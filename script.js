// ==========================================
// MODULO: SCRIPT PONTE / ENTRY POINT (script.js)
// Collega l'HTML monolitico ai moduli JavaScript moderni
// ==========================================

import { applyTheme, inizializzaLayout } from './layout.js';
import { gameState, updateGameState } from './state.js';
import { 
    inizializzaMeteoGara, 
    ottieniEtichettaMeteo, 
    eseguiControlloMeteoVariabile, 
    verificaSeAsfaltoBagnato 
} from './weather.js';
import { 
    inizializzaSchedaPilota, 
    ufficializzaSchedaPerGara, 
    renderTyreDeck, 
    selectTyreFromUI, 
    handleTyreClick, 
    toggleRaceEdit,
    renderBoard,
    toggleWing,
    gestisciTestKers,
    gestisciAvvioPitStop,
    gestisciUscitaBox
} from './mainSchedaController.js';

// ---- ESPOSIZIONE GLOBALE PER I PULSANTI HTML (onclick) ----
window.selectTyre = selectTyreFromUI;
window.toggleTyreLap = handleTyreClick;
window.toggleRaceEdit = toggleRaceEdit;
window.toggleWing = toggleWing;
window.handleTyreClick = handleTyreClick;

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


// --- GESTIONE INTERATTIVITÀ BOX (PIT STOP) ---

window.handlePitStopButtonClick = function() {
    const modal = document.getElementById('modal-pitstop-confirm');
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.confirmEnterPitStop = function() {
    // Esempio: giro corrente impostato a 1 o recuperato dallo stato
    const giroCorrente = 1; 
    const risultato = gestisciAvvioPitStop(giroCorrente);

    if (risultato.operazioneRiuscita) {
        document.body.classList.add('pitstop-mode-active');

        const btnPitStop = document.getElementById('btn-pitstop-action');
        if (btnPitStop) {
            btnPitStop.innerText = "Conferma Uscita Box";
            btnPitStop.onclick = window.tentativoUscitaBox;
        }

        closeModal('modal-pitstop-confirm');
        renderBoard();
    } else {
        alert(risultato.messaggioDescrittivo);
    }
};

window.tentativoUscitaBox = function() {
    const risultato = gestisciUscitaBox();

    if (!risultato.operazioneRiuscita) {
        // Se non è possibile uscire (es. manca lo stint 2 o 3), mostra l'avviso
        alert(risultato.messaggioDescrittivo);
        return;
    }

    document.body.classList.remove('pitstop-mode-active');

    const btnPitStop = document.getElementById('btn-pitstop-action');
    if (btnPitStop) {
        btnPitStop.innerText = "Entrata ai Box (Pit Stop)";
        btnPitStop.onclick = window.handlePitStopButtonClick;
    }

    renderBoard();
    alert(risultato.messaggioDescrittivo);
};

// --- GESTIONE METEO VARIABILE & MODALE ---

window.openWeatherModal = function() {
    if (gameState.weather === 'var_dry' || gameState.weather === 'var_wet') {
        const modalText = document.getElementById('modal-current-weather-text');
        const historyText = document.getElementById('modal-check-history');
        const buttonsContainer = document.getElementById('modal-check-buttons');

        const isDry = gameState.weather === 'var_dry';
        modalText.innerText = isDry ? 'Variabile Asciutto' : 'Variabile Bagnato';
        buttonsContainer.innerHTML = '';

        if (!gameState.weatherLastCheck) {
            historyText.innerText = "Ultimo Check: Nessuno";
            buttonsContainer.innerHTML = `
                <button class="btn btn-secondary" onclick="processWeatherCheck('sun')">&#9728;&#65039; Tiro Check: SOLE</button>
                <button class="btn btn-secondary" onclick="processWeatherCheck('rain')">&#127783;&#65039; Tiro Check: PIOGGIA</button>
            `;
        } else {
            const lastSymbol = gameState.weatherLastCheck === 'sun' ? '&#9728;&#65039; Sole' : '&#127783;&#65039; Pioggia';
            historyText.innerHTML = `<strong style="color:#00f0ff;">Ultimo tiro registrato:</strong> ${lastSymbol}`;

            let btnSunText = gameState.weatherLastCheck === 'sun'
                ? '&#9728;&#65039; Tiro Check: SOLE (Stabilizza su SOLE FISSO!)'
                : '&#9728;&#65039; Tiro Check: SOLE (Asfalto passa ad Asciutto)';

            let btnRainText = gameState.weatherLastCheck === 'rain'
                ? '&#127783;&#65039; Tiro Check: PIOGGIA (Stabilizza su PIOGGIA FISSA!)'
                : '&#127783;&#65039; Tiro Check: PIOGGIA (Asfalto passa a Bagnato)';

            buttonsContainer.innerHTML = `
                <button class="btn btn-secondary" onclick="processWeatherCheck('sun')">${btnSunText}</button>
                <button class="btn btn-secondary" onclick="processWeatherCheck('rain')">${btnRainText}</button>
            `;
        }

        const modal = document.getElementById('modal-weather');
        if (modal) modal.style.display = 'flex';
    }
};

window.processWeatherCheck = function(newCheck) {
    // Sfrutta la funzione robusta già presente in weather.js[cite: 23]
    const risultato = eseguiControlloMeteoVariabile(newCheck);

    if (!risultato.operazioneRiuscita) {
        alert(risultato.messaggioDescrittivo);
        return;
    }

    // Coerenza mescola in base allo stato asfalto risultante[cite: 23]
    const isAsphaltWet = verificaSeAsfaltoBagnato();
    if (!isAsphaltWet && gameState.selectedTyre === 'Pioggia') {
        updateGameState({ selectedTyre: 'Prime' });
    }

    closeModal('modal-weather');

    // Aggiorna gli elementi visivi del meteo nell'header della scheda
    const weatherTextEl = document.getElementById('weather-text'); 
    if (weatherTextEl) {
        weatherTextEl.innerText = ottieniEtichettaMeteo(gameState.weather);
    }
    
    const weatherIconEl = document.getElementById('weather-icon');
    if (weatherIconEl) {
        weatherIconEl.innerHTML = ottieniIconaMeteo(gameState.weather);
    }

    // --- AGGIUNTA CORRETTIVA ---
    // Nasconde immediatamente il pulsante del test meteo se il meteo è diventato fisso
    const weatherTestBtn = document.getElementById('btn-weather-test');
    const isVariableWeather = (gameState.weather === 'var_dry' || gameState.weather === 'var_wet');
    if (weatherTestBtn && !isVariableWeather) {
        weatherTestBtn.style.display = 'none';
    }
    // ---------------------------

    renderTyreDeck();
    renderBoard();
    saveGameState();

    alert(risultato.messaggioDescrittivo);
};
console.log("Lotus Cup 2k25: Script Main orchestrato e ripulito correttamente.");
