// ==========================================
// MODULO: SCRIPT PONTE / ENTRY POINT (script.js)
// Collega l'HTML monolitico ai moduli JavaScript moderni
// ==========================================

import { applyTheme, inizializzaLayout } from './layout.js';
import { gameState, updateGameState } from './state.js';
import { inizializzaMeteoGara, ottieniEtichettaMeteo, ottieniIconaMeteo, eseguiControlloMeteoVariabile, verificaSeAsfaltoBagnato } from './weather.js';
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
import { formattaEOrdinaGrigliaPiloti, attivaModalitaIspezioneAvversario, aggiornaTelemetria } from './telemetryGrid.js';
import { 
    inizializzaConnessioneServer, 
    richiediListaStanze, 
    inviaCreazioneStanza, 
    inviaIngressoStanza, 
    inviaAggiornamentoStato, 
    inviaEliminazioneStanza 
} from './network.js';

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

    const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const uniquePlayerId = 'player_' + Date.now();

    inizializzaSchedaPilota({
        code: roomCode,
        playerName: host,
        playerId: uniquePlayerId,
        weather: weather,
        theme: gameState.theme
    });

    updateGameState({
        circuit: circuit,
        host: host,
        weather: weather,
        isSetupMode: false,
        code: roomCode,
        playerId: uniquePlayerId,
        playerName: host
    });

    // Invia direttamente al server tramite network.js (zero localStorage)
    inviaCreazioneStanza({
        code: roomCode,
        circuit: circuit,
        host: host,
        hostId: uniquePlayerId,
        weather: weather,
        date: todayFormatted,
        pilot: {
            id: uniquePlayerId,
            name: host,
            sheetStatus: 'In Compilazione',
            boardData: gameState
        }
    });

    window.showScreen('screen-setup');
    
    document.getElementById('display-circuit').innerText = circuit.toUpperCase();
    document.getElementById('display-meta').innerText = `Data: ${todayFormatted} | Pilota: ${host}`;
    document.getElementById('display-code').innerText = roomCode;
    
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
    renderBoard();
};

window.officializeSetup = function() {
    const risultato = ufficializzaSchedaPerGara();

    if (!risultato.operazioneRiuscita) {
        alert(risultato.messaggioDescrittivo);
        return;
    }

    // Comunica al server il cambio di stato ("Aggiornato") in tempo reale
    inviaAggiornamentoStato({
        code: gameState.code,
        pilotId: gameState.playerId,
        sheetStatus: 'Aggiornato',
        boardData: gameState
    });

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

    renderBoard(); 
    alert(risultato.messaggioDescrittivo);
};

let stanzaSelezionataJoin = null;
// Funzione globale per disegnare o aggiornare la lista delle stanze attive
window.renderLobbiesContainer = function() {
    const containerLobbies = document.getElementById('lobbies-list-container');
    const joinFormSection = document.getElementById('join-form-section');
    if (!containerLobbies) return;

    containerLobbies.innerHTML = '';
    const stanzeAttive = window.activeRoomsFromServer || [];

    if (stanzeAttive.length === 0) {
        containerLobbies.innerHTML = `<p style="color: #a0aec0; text-align: center; font-size: 0.85rem;">Nessuna partita attiva trovata. Creane una nuova!</p>`;
        return;
    }

    stanzeAttive.forEach(stanza => {
        const card = document.createElement('div');
        card.className = 'lobby-card';
        
        const sonoHost = (stanza.hostId === gameState.playerId); 
        const iconaMeteoHtml = ottieniIconaMeteo(stanza.weather);
        const etichettaMeteo = ottieniEtichettaMeteo(stanza.weather);

        card.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 3px; text-align: left; width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: #00f0ff; font-family: 'Orbitron'; font-size: 0.95rem;">${stanza.circuit}</strong>
                    <span style="font-size: 0.75rem; color: #00f0ff; border: 1px solid rgba(0,240,255,0.4); padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; background: rgba(0,240,255,0.08);">
                        ${iconaMeteoHtml} ${etichettaMeteo}
                    </span>
                </div>
                <div style="font-size: 0.8rem; color: #cbd5e1;">Data: ${stanza.date}</div>
                <div style="font-size: 0.8rem; color: #cbd5e1;">Host: ${stanza.host}</div>
                <div style="font-family: 'Orbitron'; font-weight: bold; color: #ffb700; font-size: 0.85rem; margin-top: 2px;">ROOM: ${stanza.code}</div>
            </div>
            ${sonoHost ? `<button class="btn btn-danger" style="width: auto; padding: 6px 12px; margin: 0; font-size: 0.75rem;" onclick="richiediEliminazioneStanza('${stanza.code}')">Elimina</button>` : ''}
        `;
        
        card.onclick = (e) => {
            if (e.target.tagName === 'BUTTON') return;

            document.querySelectorAll('.lobby-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            stanzaSelezionataJoin = stanza;
            
            const labelStanza = document.getElementById('selected-room-label');
            if (labelStanza) labelStanza.innerText = `${stanza.circuit} (Room: ${stanza.code})`;
            if (joinFormSection) joinFormSection.style.display = 'block';
        };

        containerLobbies.appendChild(card);
    });
};

window.openJoinGameScreen = function() {
    window.showScreen('screen-join-game');
    
    const joinFormSection = document.getElementById('join-form-section');
    if (joinFormSection) joinFormSection.style.display = 'none';

    // Disegna subito lo stato attuale e richiede i dati aggiornati al server
    window.renderLobbiesContainer();
    richiediListaStanze();
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
    inizializzaConnessioneServer(); // Avvia la connessione Socket.io con il server Render
    window.refreshOpponentsList();
});

// Funzione globale collegata ai bottoni della modale KERS
window.resolveKers = function(isDamaged) {
    const esitoStr = isDamaged ? 'damaged' : 'ok';
    const risultato = gestisciTestKers(esitoStr); 

    if (risultato.operazioneRiuscita) {
        if (!isDamaged) {
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
    const risultato = eseguiControlloMeteoVariabile(newCheck);

    if (!risultato.operazioneRiuscita) {
        alert(risultato.messaggioDescrittivo);
        return;
    }

    closeModal('modal-weather');

    const weatherTextEl = document.getElementById('weather-text'); 
    if (weatherTextEl) {
        weatherTextEl.innerText = ottieniEtichettaMeteo(gameState.weather);
    }
    
    const weatherIconEl = document.getElementById('weather-icon');
    if (weatherIconEl) {
        weatherIconEl.innerHTML = ottieniIconaMeteo(gameState.weather);
    }

    const weatherTestBtn = document.getElementById('btn-weather-test');
    const isVariableWeather = (gameState.weather === 'var_dry' || gameState.weather === 'var_wet');
    if (weatherTestBtn && !isVariableWeather) {
        weatherTestBtn.style.display = 'none';
    }

    renderTyreDeck();
    renderBoard();
    
    alert(risultato.messaggioDescrittivo);
};

// --- GESTIONE ISPEZIONE SCHEDE AVVERSARI (SCOUTING) ---

window.inspectPilotBoard = function(pilotId) {
    const elencoSimulatoAvversari = window.currentRoomPilots || []; 
    
    const risultato = attivaModalitaIspezioneAvversario(pilotId, elencoSimulatoAvversari);

    if (!risultato.operazioneRiuscita) {
        const banner = document.getElementById('inspection-banner');
        const nameSpan = document.getElementById('inspecting-pilot-name');
        if (banner && nameSpan) {
            nameSpan.innerText = "Pilota Avversario (ID: " + pilotId + ")";
            banner.style.display = 'block';
        }
        return;
    }

    const banner = document.getElementById('inspection-banner');
    const nameSpan = document.getElementById('inspecting-pilot-name');
    if (banner && nameSpan) {
        nameSpan.innerText = risultato.nomeAvversarioIspezionato;
        banner.style.display = 'block';
    }
};

window.returnToMyBoard = function() {
    const banner = document.getElementById('inspection-banner');
    if (banner) {
        banner.style.display = 'none';
    }
    renderBoard();
};

// --- GESTIONE AGGIORNAMENTO TELEMETRIA E PILOTI ---

window.refreshOpponentsList = function() {
    const pilotiStanza = window.currentRoomPilots && window.currentRoomPilots.length > 0 
        ? window.currentRoomPilots 
        : [{
            id: gameState.playerId || 'local_player',
            name: gameState.playerName || gameState.host || 'Pilota',
            sheetStatus: gameState.sheetStatus || 'In Compilazione',
            boardData: gameState
        }];

    aggiornaTelemetria(pilotiStanza);
};

// --- GESTIONE ELIMINAZIONE STANZA (VIA SERVER) ---

window.richiediEliminazioneStanza = function(roomCode) {
    const conferma = confirm("Sei sicuro di voler cancellare la gara?");
    if (!conferma) return;

    inviaEliminazioneStanza({
        code: roomCode,
        playerId: gameState.playerId
    });
};

// --- GESTIONE INGRESSO NELLA STANZA SELEZIONATA (JOIN VIA SERVER) ---

window.joinGame = function() {
    const nomeInserito = document.getElementById('input-player-name').value.trim();

    if (!stanzaSelezionataJoin) {
        alert("Seleziona una partita dalla lista prima di entrare!");
        return;
    }
    if (!nomeInserito) {
        alert("Inserisci il tuo nome pilota!");
        return;
    }

    const uniquePlayerId = 'player_' + Date.now();

    inizializzaSchedaPilota({
        code: stanzaSelezionataJoin.code,
        playerName: nomeInserito,
        playerId: uniquePlayerId,
        weather: stanzaSelezionataJoin.weather,
        theme: gameState.theme
    });

    updateGameState({
        circuit: stanzaSelezionataJoin.circuit,
        host: stanzaSelezionataJoin.host,
        weather: stanzaSelezionataJoin.weather,
        isSetupMode: false,
        code: stanzaSelezionataJoin.code,
        playerId: uniquePlayerId,
        playerName: nomeInserito
    });

    // Invia l'ingresso al server tramite network.js
    inviaIngressoStanza({
        code: stanzaSelezionataJoin.code,
        pilot: {
            id: uniquePlayerId,
            name: nomeInserito,
            sheetStatus: 'In Compilazione',
            boardData: gameState
        }
    });

    window.showScreen('screen-setup');

    document.getElementById('display-circuit').innerText = stanzaSelezionataJoin.circuit.toUpperCase();
    document.getElementById('display-meta').innerText = `Data: ${stanzaSelezionataJoin.date} | Pilota: ${nomeInserito}`;
    document.getElementById('display-code').innerText = stanzaSelezionataJoin.code;

    const weatherTextEl = document.getElementById('weather-text'); 
    if (weatherTextEl) {
        weatherTextEl.innerText = ottieniEtichettaMeteo(stanzaSelezionataJoin.weather);
    }
    const weatherIconEl = document.getElementById('weather-icon');
    if (weatherIconEl) {
        weatherIconEl.innerHTML = ottieniIconaMeteo(stanzaSelezionataJoin.weather);
    }

    renderTyreDeck();
    renderBoard();
};

console.log("Lotus Cup 2k25: Script Main orchestrato con server remoto su Render.");
