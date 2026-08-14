let gameState = {
    code: null, circuit: '', host: '', date: '', playerName: '', playerId: '',
    theme: 'ironman',
    isSetupMode: false, isRaceMode: false, isEditingAllowed: false, isPitStopActive: false,
    weather: 'var_dry', budget: 13,
    weatherLastCheck: null,
    selectedTyre: 'Prime', tyreLaps: { Prime: [], Option: [], Intermedie: [], Pioggia: [] },
    wingActive: false, kersState: 'empty',
    previousKersState: null,
    baseValues: { tyres: 4, brakes: 2, fuel: 2, body: 2, engine: 2, suspension: 1 },
    allocations: { tyres: 0, brakes: 0, fuel: 0, body: 0, engine: 0, suspension: 0 },
    markedUsages: { tyres: [], brakes: [], fuel: [], body: [], engine: [], suspension: [] },
    savedTyresUsages: [],
    workshopUsages: [],
    workshopStartCount: 0,
    pitStopStartLap: null,
    isReady: false
};

let inspectingPilotId = null; 
let activeTheme = 'ironman';
let myPlayerId = ''; 
let selectedRoomCodeForJoin = null;
let tempStateBackup = null;
let remoteLobbiesCache = {};

const spinSvgIcon = `<svg viewBox="0 0 100 100" style="width:20px;height:20px;color:currentColor;"><path d="M 50 15 A 35 35 0 1 1 20 60" fill="none" stroke="currentColor" stroke-width="8" stroke-dasharray="6,4"/><polygon points="12,50 25,65 30,45" fill="currentColor"/><text x="50" y="62" font-size="34" font-weight="bold" text-anchor="middle" fill="currentColor" font-family="Orbitron">1</text></svg>`;
const arcReactorSvgIcon = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;"><circle cx="50" cy="50" r="44" stroke-width="6"/><circle cx="50" cy="50" r="32" stroke-width="4"/><line x1="50" y1="6" x2="50" y2="18" stroke-width="7"/><line x1="50" y1="82" x2="50" y2="94" stroke-width="7"/><line x1="6" y1="50" x2="18" y2="50" stroke-width="7"/><line x1="82" y1="50" x2="94" y2="50" stroke-width="7"/><line x1="19" y1="19" x2="28" y2="28" stroke-width="7"/><line x1="72" y1="72" x2="81" y2="81" stroke-width="7"/><line x1="19" y1="81" x2="28" y2="72" stroke-width="7"/><line x1="72" y1="28" x2="81" y2="19" stroke-width="7"/><circle cx="50" cy="50" r="20" stroke-width="4"/><circle cx="50" cy="50" r="10" fill="currentColor"/></svg>`;
const powerSvgIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:20px;height:20px;"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>`;
const f1WingSvgIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M 2 6 L 22 6 L 20 10 L 4 10 Z" fill="currentColor" fill-opacity="0.2"/><path d="M 2 4 L 4 14 L 2 14 Z" /><path d="M 22 4 L 20 14 L 22 14 Z" /><line x1="9" y1="10" x2="9" y2="17" /><line x1="15" y1="10" x2="15" y2="17" /></svg>`;

document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('theme-select');
  activeTheme = select ? select.value : 'ironman';
  changeTheme(activeTheme);
});

function saveCurrentPilotToLobby() {
  if (!gameState.code || !gameState.playerId) return;
  let lobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
  if (!lobbies[gameState.code]) {
    lobbies[gameState.code] = {
      code: gameState.code,
      circuit: gameState.circuit,
      host: gameState.host,
      weather: gameState.weather,
      date: gameState.date,
      pilots: {}
    };
  }
  gameState.theme = activeTheme;
  let currentStatus = gameState.isRaceMode ? 'Pronto' : 'In Compilazione';

  lobbies[gameState.code].pilots[gameState.playerId] = {
    id: gameState.playerId,
    name: gameState.playerName,
    status: currentStatus,
    data: gameState
  };
  localStorage.setItem('lotus_lobbies', JSON.stringify(lobbies));
  localStorage.setItem(`lotus_game_${gameState.code}_${gameState.playerId}`, JSON.stringify(gameState));
}

function pushSchedaToServer() {
  saveCurrentPilotToLobby();
  if (typeof socket !== 'undefined' && socket.connected) {
    socket.emit('aggiorna-scheda', gameState);
  }
}

function saveGameState() {
  saveCurrentPilotToLobby();
}

function loadSavedGameModal() {
  let lobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
  let container = document.getElementById('load-games-list-container');
  container.innerHTML = '';

  let keys = Object.keys(lobbies);
  if (keys.length === 0) {
    container.innerHTML = `<small style="color:#a0aec0;">Nessuna partita salvata trovata.</small>`;
  } else {
    keys.forEach(code => {
      let room = lobbies[code];
      let roomDiv = document.createElement('div');
      roomDiv.style.cssText = "margin-bottom: 12px; border-bottom: 1px solid #2e3d52; padding-bottom: 8px;";
      roomDiv.innerHTML = `
        <strong style="color:#00f0ff; display:block;">${room.circuit} (Room: ${room.code})</strong>
        <small style="color:#a0aec0; display:block; margin-bottom:6px;">Data: ${room.date}</small>
      `;
      
      let foundLocalPilot = false;
      Object.keys(room.pilots).forEach(pId => {
        let pilotObj = room.pilots[pId];
        if (localStorage.getItem(`lotus_game_${code}_${pId}`)) {
          foundLocalPilot = true;
          let pilotBtn = document.createElement('button');
          pilotBtn.className = 'btn btn-secondary';
          pilotBtn.style.cssText = "margin: 4px 0; padding: 6px; font-size: 0.8rem; width: 100%; text-align: left; text-transform: none !important;";
          pilotBtn.innerHTML = `Pilota: <b>${pilotObj.name}</b> (${pilotObj.status})`;
          pilotBtn.onclick = () => {
            myPlayerId = pilotObj.id;
            gameState = JSON.parse(localStorage.getItem(`lotus_game_${code}_${pId}`));
            activeTheme = gameState.theme || 'ironman';
            document.getElementById('theme-select').value = activeTheme;
            changeTheme(activeTheme);
            closeModal('modal-load-game');
            inspectingPilotId = null;
            initSetupScreen();
          };
          roomDiv.appendChild(pilotBtn);
        }
      });

      if (foundLocalPilot) {
        container.appendChild(roomDiv);
      }
    });
    
    if (container.children.length === 0) {
      container.innerHTML = `<small style="color:#a0aec0;">Nessuna partita salvata trovata su questo dispositivo.</small>`;
    }
  }
  document.getElementById('modal-load-game').style.display = 'flex';
}

function changeTheme(themeName) {
  activeTheme = themeName;
  document.body.className = '';
  if (themeName === 'cyberpunk') {
    document.body.classList.add('theme-cyberpunk');
  } else {
    document.body.classList.add('theme-ironman');
  }

  const select = document.getElementById('theme-select');
  if (select && select.value !== themeName) {
    select.value = themeName;
  }

  if (document.getElementById('screen-setup').classList.contains('active')) {
    renderBoard();
    renderTyreDeck();
  }
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function openJoinGameScreen() {
  const lobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
  let combinedLobbies = { ...remoteLobbiesCache };
  Object.keys(lobbies).forEach(code => {
    if (!combinedLobbies[code]) combinedLobbies[code] = lobbies[code];
  });
  renderLobbiesListHTML(combinedLobbies);
  showScreen('screen-join-game');
  if (typeof socket !== 'undefined' && socket.connected) {
    socket.emit('richiedi-stanze');
  }
}

function renderLobbiesListHTML(lobbiesObj) {
  const lobbiesContainer = document.getElementById('lobbies-list-container');
  lobbiesContainer.innerHTML = '';

  let keys = Object.keys(lobbiesObj);

  if (keys.length === 0) {
    lobbiesContainer.innerHTML = `<small style="color: #a0aec0; display:block; text-align:center; padding:8px; border:1px dashed #2e3d52; border-radius:4px;">Nessuna gara attiva trovata.</small>`;
  } else {
    keys.forEach(code => {
      let l = lobbiesObj[code];
      let card = document.createElement('div');
      card.className = 'lobby-card';
      card.id = `lobby-card-${code}`;

      let isHost = false;
      if (gameState.code == code && gameState.playerName === l.host) {
        isHost = true;
      } else {
        let localLobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
        if (localLobbies[code] && localLobbies[code].host === l.host) {
          isHost = true;
        }
      }

      let deleteBtnHtml = isHost ? `<button class="btn-delete-room" onclick="deleteRoom(event, '${code}')">Elimina</button>` : '';

      card.innerHTML = `
        <div style="flex-grow:1; display: flex; flex-direction: column; gap: 3px; text-align: left; cursor: pointer;" onclick="selectLobbyCard('${code}', '${l.circuit}')">
          <span style="font-size: 0.95rem;"><strong>${l.circuit}</strong> <span style="font-size:0.8rem; color:#a0aec0;">(Host: ${l.host})</span></span>
          <small style="color:#a0aec0; font-size: 0.75rem;">Data: ${l.date || '-'}</small>
          <small style="color:#00ffcc; font-family:'Orbitron'; font-size: 0.8rem;">ROOM: ${code}</small>
        </div>
        ${deleteBtnHtml}
      `;
      lobbiesContainer.appendChild(card);
    });
  }
}

function selectLobbyCard(code, circuitName) {
  document.querySelectorAll('.lobby-card').forEach(c => c.classList.remove('selected'));
  const selectedCard = document.getElementById(`lobby-card-${code}`);
  if (selectedCard) selectedCard.classList.add('selected');

  selectedRoomCodeForJoin = code;
  document.getElementById('selected-room-label').innerText = `${circuitName} (ROOM: ${code})`;
  document.getElementById('join-form-section').style.display = 'block';
}

function deleteRoom(event, code) {
  event.stopPropagation();
  if (confirm(`Sei l'Host. Vuoi chiudere e rimuovere la stanza ROOM: ${code} per tutti i partecipanti?`)) {
    if (typeof socket !== 'undefined' && socket.connected) {
      socket.emit('elimina-stanza-globale', code);
    }
    executeLocalRoomDeletion(code);
  }
}

function executeLocalRoomDeletion(code) {
  let lobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
  if (lobbies[code] && lobbies[code].pilots) {
    Object.keys(lobbies[code].pilots).forEach(pId => {
      localStorage.removeItem(`lotus_game_${code}_${pId}`);
    });
  }
  delete lobbies[code];
  localStorage.setItem('lotus_lobbies', JSON.stringify(lobbies));
  
  if (remoteLobbiesCache[code]) {
    delete remoteLobbiesCache[code];
  }

  if (gameState.code == code) {
    alert("La partita è stata chiusa.");
    gameState.code = null;
    showScreen('screen-home');
  } else if (document.getElementById('screen-join-game').classList.contains('active')) {
    openJoinGameScreen();
  }
}

function createGame() {
  const circuit = document.getElementById('input-circuit').value.trim() || 'Monza';
  const host = document.getElementById('input-host').value.trim() || 'Pilota 1';
  const weatherSelect = document.getElementById('input-weather');
  const weather = weatherSelect.value;
  
  if (!weather) {
    alert("Seleziona prima una condizione meteo valida per la gara!");
    return;
  }

  const nowFormatted = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  myPlayerId = '01';
  gameState = {
    code: Math.floor(1000 + Math.random() * 9000),
    circuit: circuit,
    host: host,
    date: nowFormatted,
    playerName: host,
    playerId: myPlayerId,
    theme: activeTheme,
    isSetupMode: false,
    isRaceMode: false,
    isEditingAllowed: false,
    isPitStopActive: false,
    weather: weather,
    budget: 13,
    weatherLastCheck: null,
    selectedTyre: (weather === 'rain' || weather === 'var_wet') ? 'Intermedie' : 'Prime',
    tyreLaps: { Prime: [], Option: [], Intermedie: [], Pioggia: [] },
    wingActive: false,
    kersState: 'empty',
    previousKersState: null,
    baseValues: { tyres: 4, brakes: 2, fuel: 2, body: 2, engine: 2, suspension: 1 },
    allocations: { tyres: 0, brakes: 0, fuel: 0, body: 0, engine: 0, suspension: 0 },
    markedUsages: { tyres: [], brakes: [], fuel: [], body: [], engine: [], suspension: [] },
    savedTyresUsages: [],
    workshopUsages: [],
    workshopStartCount: 0,
    pitStopStartLap: null,
    isReady: false
  };

  saveGameState();
  
  const roomMetaPayload = {
    code: gameState.code,
    circuit: gameState.circuit,
    host: gameState.host,
    weather: gameState.weather,
    date: gameState.date
  };

  remoteLobbiesCache[gameState.code] = roomMetaPayload;

  if (typeof socket !== 'undefined' && socket.connected) {
    socket.emit('crea-stanza', roomMetaPayload);
    socket.emit('aggiorna-scheda', gameState);
  }

  inspectingPilotId = null;
  initSetupScreen();
}

function joinGame() {
  const code = selectedRoomCodeForJoin;
  const name = document.getElementById('input-player-name').value.trim();
  
  if(!code) { alert('Seleziona una gara dalla lista soprastante!'); return; }
  if(!name) { alert('Inserisci il nome del tuo pilota'); return; }

  let lobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
  let roomMeta = lobbies[code] || remoteLobbiesCache[code];

  if (!roomMeta) {
    alert("Stanza non trovata o scaduta!");
    return;
  }

  if (!lobbies[code]) {
    lobbies[code] = {
      code: roomMeta.code,
      circuit: roomMeta.circuit,
      host: roomMeta.host,
      weather: roomMeta.weather,
      date: roomMeta.date,
      pilots: {}
    };
  }

  let room = lobbies[code];
  let existingPilotId = null;
  Object.keys(room.pilots).forEach(pId => {
    if (room.pilots[pId].name === name) {
      existingPilotId = pId;
    }
  });

  if (existingPilotId) {
    myPlayerId = existingPilotId;
    gameState = room.pilots[existingPilotId].data;
  } else {
    let nextIdNum = Object.keys(room.pilots).length + 1;
    myPlayerId = nextIdNum < 10 ? '0' + nextIdNum : '' + nextIdNum;

    gameState = {
      code: room.code,
      circuit: room.circuit,
      host: room.host,
      date: room.date,
      playerName: name,
      playerId: myPlayerId,
      theme: activeTheme,
      isSetupMode: false,
      isRaceMode: false,
      isEditingAllowed: false,
      isPitStopActive: false,
      weather: room.weather,
      budget: 13,
      weatherLastCheck: null,
      selectedTyre: (room.weather === 'rain' || room.weather === 'var_wet') ? 'Intermedie' : 'Prime',
      tyreLaps: { Prime: [], Option: [], Intermedie: [], Pioggia: [] },
      wingActive: false,
      kersState: 'empty',
      previousKersState: null,
      baseValues: { tyres: 4, brakes: 2, fuel: 2, body: 2, engine: 2, suspension: 1 },
      allocations: { tyres: 0, brakes: 0, fuel: 0, body: 0, engine: 0, suspension: 0 },
      markedUsages: { tyres: [], brakes: [], fuel: [], body: [], engine: [], suspension: [] },
      savedTyresUsages: [],
      workshopUsages: [],
      workshopStartCount: 0,
      pitStopStartLap: null,
      isReady: false
    };
  }

  saveGameState();
  inspectingPilotId = null;
  initSetupScreen();
}

function initSetupScreen() {
  document.getElementById('display-circuit').innerText = gameState.circuit;
  document.getElementById('display-meta').innerText = `Data: ${gameState.date} | Pilota: ${gameState.playerName}`;
  document.getElementById('display-code').innerText = gameState.code;
  
  const startConfigBtn = document.getElementById('btn-start-config');
  const lockSetupBtn = document.getElementById('btn-lock-setup');
  const raceControls = document.getElementById('race-controls');

  if (gameState.isRaceMode) {
    startConfigBtn.style.display = 'none';
    lockSetupBtn.style.display = 'none';
    raceControls.style.display = 'flex';
  } else if (gameState.isSetupMode) {
    startConfigBtn.style.display = 'none';
    lockSetupBtn.style.display = 'block';
    raceControls.style.display = 'none';
  } else {
    startConfigBtn.style.display = 'block';
    lockSetupBtn.style.display = 'none';
    raceControls.style.display = 'none';
  }
  
  updateWeatherUI();
  renderOpponentsList();
  renderTyreDeck();
  renderBoard();
  updateEditButtonUI();
  
  const isInspecting = inspectingPilotId !== null;
  document.getElementById('inspection-banner').style.display = isInspecting ? 'block' : 'none';
  
  if (isInspecting) {
    let lobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
    if (lobbies[gameState.code] && lobbies[gameState.code].pilots[inspectingPilotId]) {
      let inspectedObj = lobbies[gameState.code].pilots[inspectingPilotId];
      document.getElementById('inspecting-pilot-name').innerText = `${inspectedObj.name}`;
    }
    document.getElementById('actions-container-wrapper').style.display = 'none';
  } else {
    document.getElementById('actions-container-wrapper').style.display = 'block';
  }

  showScreen('screen-setup');
}

function returnToMyBoard() {
  inspectingPilotId = null;
  let lobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
  if (lobbies[gameState.code] && lobbies[gameState.code].pilots[myPlayerId]) {
    gameState = lobbies[gameState.code].pilots[myPlayerId].data;
  }
  activeTheme = gameState.theme || 'ironman';
  document.getElementById('theme-select').value = activeTheme;
  changeTheme(activeTheme);
  initSetupScreen();
}

function inspectPilotBoard(pilotId) {
  if (pilotId === myPlayerId) return;

  let lobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
  if (lobbies[gameState.code] && lobbies[gameState.code].pilots[pilotId]) {
    inspectingPilotId = pilotId;
    let targetData = lobbies[gameState.code].pilots[pilotId].data;
    
    gameState = targetData;
    let targetTheme = gameState.theme || 'ironman';
    changeTheme(targetTheme);
    
    initSetupScreen();
  }
}

function updateWeatherUI() {
  const badgeIcon = document.getElementById('weather-icon');
  const badgeText = document.getElementById('weather-text');
  
  if (gameState.weather === 'rain') {
    badgeIcon.innerHTML = '&#127783;&#65039;';
    badgeText.innerText = 'Pioggia Fissa';
  } else if (gameState.weather === 'sun') {
    badgeIcon.innerHTML = '&#9728;&#65039;';
    badgeText.innerText = 'Sole Fisso';
  } else if (gameState.weather === 'var_dry') {
    badgeIcon.innerHTML = '&#9925;';
    let checkTag = gameState.weatherLastCheck ? ` [ULTIMO: ${gameState.weatherLastCheck === 'sun' ? '&#9728;&#65039;' : '&#127783;&#65039;'}]` : '';
    badgeText.innerHTML = `VARIABILE ASCIUTTO${checkTag}`;
  } else if (gameState.weather === 'var_wet') {
    badgeIcon.innerHTML = '&#127783;&#65039;';
    let checkTag = gameState.weatherLastCheck ? ` [ULTIMO: ${gameState.weatherLastCheck === 'sun' ? '&#9728;&#65039;' : '&#127783;&#65039;'}]` : '';
    badgeText.innerHTML = `VARIABILE BAGNATO${checkTag}`;
  }
}

function openWeatherModal() {
  if (inspectingPilotId !== null) return;
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

    document.getElementById('modal-weather').style.display = 'flex';
  }
}

function processWeatherCheck(newCheck) {
  if (!gameState.weatherLastCheck) {
    gameState.weatherLastCheck = newCheck;
  } else {
    if (newCheck === gameState.weatherLastCheck) {
      if (newCheck === 'sun') {
        gameState.weather = 'sun';
      } else {
        gameState.weather = 'rain';
      }
      gameState.weatherLastCheck = null;
    } else {
      gameState.weatherLastCheck = newCheck;
      gameState.weather = (newCheck === 'sun') ? 'var_dry' : 'var_wet';
    }
  }

  const isAsphaltWet = isCurrentAsphaltWet();
  if (!isAsphaltWet && gameState.selectedTyre === 'Pioggia') {
    gameState.selectedTyre = 'Prime';
  }

  updateWeatherUI();
  closeModal('modal-weather');
  updateEditButtonUI();
  renderTyreDeck();
  renderBoard();
  saveGameState();
}

function isCurrentAsphaltWet() {
  if (gameState.weather === 'rain') return true;
  if (gameState.weather === 'sun') return false;
  if (gameState.weather === 'var_wet') {
    if (gameState.weatherLastCheck === 'sun') return false;
    return true;
  }
  if (gameState.weather === 'var_dry') {
    if (gameState.weatherLastCheck === 'rain') return true;
    return false;
  }
  return false;
}

function renderOpponentsList() {
  const list = document.getElementById('opponents-list-items');
  list.innerHTML = '';
  
  let lobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
  let room = lobbies[gameState.code];

  if (room && room.pilots) {
    let pilotIds = Object.keys(room.pilots);
    
    pilotIds.sort((a, b) => {
      if (a === myPlayerId) return -1;
      if (b === myPlayerId) return 1;
      return a.localeCompare(b);
    });

    pilotIds.forEach(pId => {
      let p = room.pilots[pId];
      let isMe = (pId === myPlayerId);
      
      let itemClass = isMe ? "opp-item" : "opp-item clickable-opp";
      let clickAction = isMe ? "" : `onclick="inspectPilotBoard('${pId}')"`;
      
      let displayStatus = p.status;
      if (p.data && p.data.isRaceMode) {
        displayStatus = 'Pronto';
      }

      list.innerHTML += `<div class="${itemClass}" ${clickAction}>
        <span><strong>${p.name}</strong> ${isMe ? '(Tu)' : ''}</span>
        <small style="color:${displayStatus === 'Pronto' ? '#00ffcc' : '#a0aec0'}">${displayStatus}</small>
      </div>`;
    });
  }
}

function refreshOpponentsList() {
  let lobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
  if (lobbies[gameState.code] && lobbies[gameState.code].pilots[myPlayerId]) {
    saveCurrentPilotToLobby();
  }
  renderOpponentsList();
}

function isLapMarkedAnywhere(lap) {
  return Object.keys(gameState.tyreLaps).some(t => gameState.tyreLaps[t].includes(lap));
}

function renderTyreDeck() {
  const container = document.getElementById('tyres-deck-container');
  container.innerHTML = '';
  const tyres = ['Prime', 'Option', 'Intermedie', 'Pioggia'];

  const isWet = isCurrentAsphaltWet();
  const isInspecting = inspectingPilotId !== null;

  tyres.forEach(t => {
    const isSelected = gameState.selectedTyre === t;
    let isDisabledByWeather = false;

    if (t === 'Intermedie') {
      isDisabledByWeather = false;
    } else if (gameState.weather === 'sun') {
      if (t === 'Pioggia') isDisabledByWeather = true;
    } else if (gameState.weather === 'rain') {
      if (t === 'Prime' || t === 'Option') isDisabledByWeather = true;
    } else {
      if (isWet) {
        if (t === 'Prime' || t === 'Option') isDisabledByWeather = true;
      } else {
        if (t === 'Pioggia') isDisabledByWeather = true;
      }
    }

    const card = document.createElement('div');
    card.className = `tyre-card ${isSelected ? 'active' : ''} ${isDisabledByWeather ? 'disabled-weather' : ''}`;

    let lapsHtml = '';
    [1, 2, 3].forEach(lap => {
      const isMarked = gameState.tyreLaps[t].includes(lap);
      const lapUsedAnywhere = isLapMarkedAnywhere(lap);
      let isClickable = false;
      let isPreSelectedStyle = false;

      if (!isInspecting) {
        if ((!gameState.isRaceMode || gameState.isSetupMode) && isSelected && lap === 1) {
          isPreSelectedStyle = true;
        }

        if (gameState.isSetupMode) {
          if (lap === 1 && isSelected) {
            if (!lapUsedAnywhere || isMarked) isClickable = true;
          }
        } else if (gameState.isRaceMode) {
          if (gameState.isPitStopActive && isSelected) {
            if (lap !== 1) {
              if (!lapUsedAnywhere || isMarked) isClickable = true;
            }
          }
        }
      }

      const classList = [
        'lap-box',
        isMarked ? 'marked' : '',
        (!isMarked && isPreSelectedStyle) ? 'pre-selected' : '',
        isClickable ? 'clickable' : 'disabled'
      ].filter(Boolean).join(' ');

      lapsHtml += `<div class="${classList}" ${isClickable ? `onclick="toggleTyreLap('${t}', ${lap})"` : ''}>${lap}</div>`;
    });

    card.innerHTML = `
      <button class="tyre-title-btn" ${(!isDisabledByWeather && !isInspecting) ? `onclick="selectTyre('${t}')"` : ''}>${t}</button>
      <div class="laps-container">${lapsHtml}</div>
    `;
    container.appendChild(card);
  });
}

function selectTyre(type) {
  if (inspectingPilotId !== null) return;
  const isWet = isCurrentAsphaltWet();

  if (type !== 'Intermedie') {
    if (gameState.weather === 'sun' && type === 'Pioggia') return;
    if (gameState.weather === 'rain' && (type === 'Prime' || type === 'Option')) return;
    if (isWet && (type === 'Prime' || type === 'Option')) return;
    if (!isWet && type === 'Pioggia') return;
  }
  
  if (gameState.isSetupMode || gameState.isPitStopActive) {
    gameState.selectedTyre = type;
    renderTyreDeck();
    renderBoard();
    saveGameState();
  }
}

function toggleTyreLap(type, lap) {
  if (inspectingPilotId !== null) return;
  if (gameState.isSetupMode) {
    if (type !== gameState.selectedTyre || lap !== 1) return;
  } else if (gameState.isRaceMode) {
    if (!gameState.isPitStopActive || type !== gameState.selectedTyre || lap === 1) return;
  } else {
    return;
  }

  const list = gameState.tyreLaps[type];
  const pos = list.indexOf(lap);
  
  if (pos > -1) {
    list.splice(pos, 1);
    if (gameState.savedTyresUsages && gameState.savedTyresUsages.length > 0) {
      gameState.markedUsages.tyres = [...gameState.savedTyresUsages];
      gameState.savedTyresUsages = [];
    }
  } else {
    list.push(lap);
    if (gameState.markedUsages.tyres.length > 0) {
      gameState.savedTyresUsages = [...gameState.markedUsages.tyres];
    }
    gameState.markedUsages.tyres = [];
  }

  renderTyreDeck();
  renderBoard();
  saveGameState();
}

function startConfiguration() {
  if (inspectingPilotId !== null) return;
  gameState.isSetupMode = true;
  document.getElementById('btn-start-config').style.display = 'none';
  document.getElementById('budget-bar').style.display = 'block';
  document.getElementById('btn-lock-setup').style.display = 'block';
  renderTyreDeck();
  renderBoard();
}

function renderBoard() {
  const totalEnginePoints = gameState.baseValues.engine + gameState.allocations.engine;
  const engineUsed = gameState.markedUsages.engine.length;
  const engineRemaining = totalEnginePoints - engineUsed;

  if (engineRemaining === 0) {
    if (gameState.kersState !== 'engine_fault') {
      gameState.previousKersState = gameState.kersState;
      gameState.kersState = 'engine_fault';
    }
  } else if (gameState.kersState === 'engine_fault') {
    if (gameState.previousKersState === 'damaged') {
      gameState.kersState = 'damaged';
    } else {
      gameState.kersState = 'empty';
    }
    gameState.previousKersState = null;
  }

  const components = ['tyres', 'brakes', 'fuel', 'body', 'engine', 'suspension'];
  const rightAligned = ['body', 'engine', 'suspension'];
  const isInspecting = inspectingPilotId !== null;
  
  components.forEach(comp => {
    const container = document.getElementById(`row-${comp}`);
    container.innerHTML = '';
    
    const totalBoxes = (comp === 'tyres') ? 10 : 6;
    const baseVal = gameState.baseValues[comp];
    const addedVal = gameState.allocations[comp];
    const totalPoints = baseVal + addedVal;
    const isRight = rightAligned.includes(comp);

    const wingBoxIndex = totalBoxes - totalPoints;

    for (let i = 0; i < totalBoxes; i++) {
      const box = document.createElement('div');
      box.className = 'box';

      if (!isRight) {
        if (comp === 'tyres' && i === 0) {
          box.innerHTML = spinSvgIcon;
        } else if (i < baseVal) {
          box.innerText = '1';
        } else if (i < totalPoints) {
          box.innerText = '1';
          if (gameState.isSetupMode && !isInspecting) {
            box.classList.add('clickable');
            box.onclick = () => removeBudgetPoint(comp);
          }
        } else {
          box.innerText = '';
          if (gameState.isSetupMode && !isInspecting) {
            if (gameState.budget > 0) {
              box.classList.add('box-setup-highlight', 'clickable');
              box.onclick = () => addBudgetPoint(comp);
            } else {
              box.classList.add('box-setup-disabled');
            }
          } else {
            box.style.animation = 'none';
          }
        }
      } else {
        const fromRight = totalBoxes - 1 - i;

        if (comp === 'body' && gameState.wingActive && i === wingBoxIndex) {
          box.innerText = 'X';
          box.classList.add('x-black');
        } 
        else if (fromRight < baseVal) {
          box.innerText = '1';
        } 
        else if (fromRight < totalPoints) {
          box.innerText = '1';
          if (gameState.isSetupMode && !isInspecting) {
            box.classList.add('clickable');
            box.onclick = () => removeBudgetPoint(comp);
          }
        } 
        else {
          box.innerText = '';
          if (gameState.isSetupMode && !isInspecting) {
            if (gameState.budget > 0) {
              box.classList.add('box-setup-highlight', 'clickable');
              box.onclick = () => addBudgetPoint(comp);
            } else {
              box.classList.add('box-setup-disabled');
            }
          } else {
            box.style.animation = 'none';
          }
        }
      }

      if (gameState.isRaceMode) {
        if (gameState.markedUsages[comp].includes(i)) {
          box.innerText = 'X';
          box.classList.add('x-red');
        }

        let isClickableBox = (gameState.isEditingAllowed || gameState.isPitStopActive) && !isInspecting;

        if (isClickableBox) {
          box.classList.add('clickable');
          box.onclick = () => handleComponentClick(comp, i);
        }
      }

      container.appendChild(box);
    }
  });

  const workshopContainer = document.getElementById('row-workshop');
  workshopContainer.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const box = document.createElement('div');
    box.className = 'box';
    if (gameState.workshopUsages.includes(i)) {
      box.innerText = 'X';
      box.classList.add('x-red');
    } else {
      box.innerText = '1';
    }
    if (gameState.isRaceMode && gameState.isPitStopActive && !isInspecting) {
      box.classList.add('clickable');
      box.onclick = () => toggleWorkshopPoint(i);
    }
    workshopContainer.appendChild(box);
  }

  const wingBox = document.getElementById('box-wing');
  wingBox.className = 'box';
  if (gameState.wingActive) {
    if (isBodyCompletelyDestroyed()) {
      wingBox.innerText = 'X';
      wingBox.classList.add('x-red');
    } else {
      wingBox.innerHTML = f1WingSvgIcon;
      wingBox.classList.add('circle-green');
    }
  } else {
    wingBox.innerText = '';
  }
  if (gameState.isSetupMode && !isInspecting) wingBox.classList.add('clickable');

  const kersBox = document.getElementById('box-kers');
  kersBox.className = 'box';
  
  if (gameState.kersState === 'charged') {
    const isCyberpunk = (activeTheme === 'cyberpunk');
    kersBox.innerHTML = isCyberpunk ? powerSvgIcon : arcReactorSvgIcon;
    kersBox.classList.add('circle-kers');

    if (gameState.isRaceMode && gameState.isEditingAllowed && engineRemaining > 0 && !isInspecting) {
      kersBox.classList.add('clickable');
    }
  } else if (gameState.kersState === 'damaged' || gameState.kersState === 'engine_fault') {
    kersBox.innerText = 'X';
    kersBox.classList.add('x-red');
  } else {
    kersBox.innerText = '';
  }

  const totalFuelPoints = gameState.baseValues.fuel + gameState.allocations.fuel;
  const fuelUsed = gameState.markedUsages.fuel.length;
  const fuelRemaining = totalFuelPoints - fuelUsed;
  const fuelValSpan = document.getElementById('fuel-mov-val');
  const fuelPrefixSpan = document.getElementById('fuel-mov-prefix');

  fuelValSpan.classList.remove('mov-num-active', 'mov-num-penalty');

  if (gameState.isPitStopActive && fuelRemaining > 3) {
    fuelPrefixSpan.innerText = '-';
    fuelValSpan.innerText = '2';
    fuelValSpan.classList.add('mov-num-penalty');
  } else if (fuelRemaining <= 3 && gameState.isRaceMode) {
    fuelPrefixSpan.innerText = '+';
    fuelValSpan.innerText = '1';
    fuelValSpan.classList.add('mov-num-active');
  } else {
    fuelPrefixSpan.innerText = '+';
    fuelValSpan.innerText = '0';
  }

  const workshopValSpan = document.getElementById('workshop-mov-val');
  
  if (gameState.isRaceMode && (gameState.isEditingAllowed || gameState.isPitStopActive)) {
    const currentWorkshopCount = gameState.workshopUsages.length;
    const newRepairsThisSession = Math.max(0, currentWorkshopCount - gameState.workshopStartCount);
    const movPenalty = newRepairsThisSession * 2;

    workshopValSpan.innerText = `-${movPenalty}`;
    
    if (movPenalty > 0) {
      workshopValSpan.classList.add('mov-num-penalty');
    } else {
      workshopValSpan.classList.remove('mov-num-penalty');
    }
  } else {
    workshopValSpan.innerText = '0';
    workshopValSpan.classList.remove('mov-num-active');
  }

  document.getElementById('budget-count').innerText = gameState.budget;
  const lockBtn = document.getElementById('btn-lock-setup');
  
  const isIronMan = (activeTheme === 'ironman');
  if (gameState.budget === 0) {
    lockBtn.disabled = false;
    lockBtn.innerText = "Ufficializza Scheda / Inizio Gara";
  } else {
    lockBtn.disabled = !isIronMan;
    lockBtn.innerText = isIronMan 
      ? `Assegna tutti i 13 Punti per Iniziare (${gameState.budget} rimanenti)`
      : `Ufficializza Scheda / Inizio Gara (Assegna tutti i 13 Punti)`;
  }
}

function addBudgetPoint(comp) {
  if (inspectingPilotId !== null) return;
  if (gameState.budget > 0) {
    gameState.allocations[comp]++;
    gameState.budget--;
    renderBoard();
  }
}

function removeBudgetPoint(comp) {
  if (inspectingPilotId !== null) return;
  if (gameState.allocations[comp] > 0) {
    gameState.allocations[comp]--;
    gameState.budget++;
    renderBoard();
  }
}

function toggleWing() {
  if (inspectingPilotId !== null) return;
  if (!gameState.isSetupMode) return;
  gameState.wingActive = !gameState.wingActive;
  renderBoard();
}

function officializeSetup() {
  if (inspectingPilotId !== null) return;
  if (gameState.budget > 0) return;
  if (!isLapMarkedAnywhere(1)) {
    gameState.tyreLaps[gameState.selectedTyre].push(1);
  }
  gameState.isSetupMode = false;
  gameState.isRaceMode = true;
  gameState.isEditingAllowed = false;
  gameState.isReady = true;

  document.getElementById('budget-bar').style.display = 'none';
  document.getElementById('btn-lock-setup').style.display = 'none';
  
  document.getElementById('race-controls').style.display = 'flex';
  updateEditButtonUI();

  renderBoard();
  renderTyreDeck();
  renderOpponentsList();
  pushSchedaToServer();
}

function toggleRaceEdit() {
  if (inspectingPilotId !== null) return;
  if (gameState.isPitStopActive) return;

  if (!gameState.isEditingAllowed) {
    tempStateBackup = JSON.parse(JSON.stringify(gameState));
    gameState.isEditingAllowed = true;
    gameState.workshopStartCount = gameState.workshopUsages.length;
  } else {
    gameState.isEditingAllowed = false;
    tempStateBackup = null;
    
    pushSchedaToServer(); 
  }

  updateEditButtonUI();
  renderBoard();
  renderTyreDeck();
  
  if (!gameState.isEditingAllowed) {
    let lobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
    if (lobbies[gameState.code] && lobbies[gameState.code].pilots[myPlayerId]) {
      lobbies[gameState.code].pilots[myPlayerId].data = gameState;
      localStorage.setItem('lotus_lobbies', JSON.stringify(lobbies));
    }
  }
}

function updateEditButtonUI() {
  const editBtn = document.getElementById('btn-toggle-edit');
  const pitBtn = document.getElementById('btn-pitstop-action');
  const weatherTestBtn = document.getElementById('btn-weather-test');

  const isVariableWeather = (gameState.weather === 'var_dry' || gameState.weather === 'var_wet');

  if (gameState.isPitStopActive) {
    editBtn.innerText = "Sosta ai box in corso...";
    editBtn.className = 'btn btn-pitstop-mode';
    pitBtn.innerText = "Ripartenza dai box";
    pitBtn.style.display = 'block';
    weatherTestBtn.style.display = 'none';
  } else if (gameState.isEditingAllowed) {
    editBtn.innerText = "Modalità edit attiva (clicca per bloccare)";
    editBtn.className = 'btn btn-edit-mode';
    pitBtn.innerText = "Entrata ai Box (Pit Stop)";
    pitBtn.style.display = 'block';
    
    if (isVariableWeather) {
      weatherTestBtn.style.display = 'block';
    } else {
      weatherTestBtn.style.display = 'none';
    }
  } else {
    editBtn.innerText = "Modalità edit attiva (clicca per sbloccare)";
    editBtn.className = 'btn btn-read-mode';
    pitBtn.style.display = 'none';
    weatherTestBtn.style.display = 'none';
  }
}

function handlePitStopButtonClick() {
  if (inspectingPilotId !== null) return;
  if (!gameState.isPitStopActive) {
    document.getElementById('modal-pitstop-confirm').style.display = 'flex';
  } else {
    let hasSelectedNewLap = false;
    if (gameState.pitStopStartLap === 1) {
      hasSelectedNewLap = isLapMarkedAnywhere(2) || isLapMarkedAnywhere(3);
    } else if (gameState.pitStopStartLap === 2) {
      hasSelectedNewLap = isLapMarkedAnywhere(3);
    } else {
      hasSelectedNewLap = true;
    }

    if (!hasSelectedNewLap) {
      alert("ATTENZIONE: Per poter uscire dai box devi prima selezionare a quale inizio giro ti trovi!");
      return;
    }

    const currentWorkshopCount = gameState.workshopUsages.length;
    const newRepairsThisSession = Math.max(0, currentWorkshopCount - gameState.workshopStartCount);
    const workshopMalus = newRepairsThisSession * 2;

    const totalFuelPoints = gameState.baseValues.fuel + gameState.allocations.fuel;
    const fuelUsed = gameState.markedUsages.fuel.length;
    const fuelRemaining = totalFuelPoints - fuelUsed;
    
    let fuelPointsEffect = (fuelRemaining <= 3) ? +1 : -2;
    const netTotalPoints = fuelPointsEffect - workshopMalus;

    alert(`Uscita dai box completata!\nRiparazioni: -${workshopMalus} MOV\nBilancio Carburante: ${fuelPointsEffect >= 0 ? '+' + fuelPointsEffect : fuelPointsEffect} MOV\nTotale Netto: ${netTotalPoints}`);

    gameState.markedUsages.tyres = [];
    gameState.savedTyresUsages = [];
    gameState.isPitStopActive = false;
    gameState.isEditingAllowed = false;
    gameState.pitStopStartLap = null;

    updateEditButtonUI();
    renderBoard();
    renderTyreDeck();
    
    pushSchedaToServer();
  }
}

function confirmEnterPitStop() {
  gameState.isPitStopActive = true;
  if (isLapMarkedAnywhere(2)) gameState.pitStopStartLap = 2;
  else if (isLapMarkedAnywhere(1)) gameState.pitStopStartLap = 1;
  else gameState.pitStopStartLap = 0;

  closeModal('modal-pitstop-confirm');
  updateEditButtonUI();
  renderBoard();
  renderTyreDeck();
  saveGameState();
}

function handleComponentClick(comp, clickedIndex) {
  if (inspectingPilotId !== null) return;
  const rightAligned = ['body', 'engine', 'suspension'];
  const repairable = ['brakes', 'body', 'engine', 'suspension'];
  const isRight = rightAligned.includes(comp);
  
  const totalBoxes = (comp === 'tyres') ? 10 : 6;
  const totalPoints = gameState.baseValues[comp] + gameState.allocations[comp];
  const wingBoxIndex = totalBoxes - totalPoints;

  if (comp === 'body' && gameState.wingActive && clickedIndex === wingBoxIndex) return;

  if (comp === 'fuel' && gameState.isPitStopActive) {
    const markedList = gameState.markedUsages.fuel;
    const totalFuelPoints = gameState.baseValues.fuel + gameState.allocations.fuel;
    const isClickedMarked = markedList.includes(clickedIndex);

    if (isClickedMarked) {
      const currentRemaining = totalFuelPoints - markedList.length;
      if (currentRemaining < 3) {
        markedList.sort((a, b) => a - b);
        markedList.shift();
      } else {
        gameState.markedUsages.fuel = [];
      }
    } else {
      markedList.push(clickedIndex);
    }

    renderBoard();
    saveGameState();
    return;
  }

  const markedList = gameState.markedUsages[comp];

  if (gameState.isPitStopActive && repairable.includes(comp)) {
    const isClickedMarked = markedList.includes(clickedIndex);

    if (isClickedMarked) {
      let availableWorkshopIndex = -1;
      for (let w = 0; w < 3; w++) {
        if (!gameState.workshopUsages.includes(w)) { availableWorkshopIndex = w; break; }
      }
      if (availableWorkshopIndex === -1) return;

      if (!isRight) { markedList.sort((a, b) => a - b); markedList.shift(); }
      else { markedList.sort((a, b) => b - a); markedList.shift(); }

      gameState.workshopUsages.push(availableWorkshopIndex);
    } else {
      let targetIndex = -1;
      if (!isRight) {
        for (let i = totalPoints - 1; i >= 0; i--) { if (!markedList.includes(i)) { targetIndex = i; break; } }
      } else {
        for (let i = totalBoxes - totalPoints; i < totalBoxes; i++) {
          if (comp === 'body' && gameState.wingActive && i === wingBoxIndex) continue;
          if (!markedList.includes(i)) { targetIndex = i; break; }
        }
      }
      if (targetIndex !== -1) {
        markedList.push(targetIndex);
        if (gameState.workshopUsages.length > 0) gameState.workshopUsages.pop();
      }
    }
  } else {
    const isClickedMarked = markedList.includes(clickedIndex);
    if (isClickedMarked) {
      if (!isRight) { markedList.sort((a, b) => a - b); markedList.shift(); }
      else { markedList.sort((a, b) => b - a); markedList.shift(); }
    } else {
      let targetIndex = -1;
      if (!isRight) {
        for (let i = totalPoints - 1; i >= 0; i--) { if (!markedList.includes(i)) { targetIndex = i; break; } }
      } else {
        for (let i = totalBoxes - totalPoints; i < totalBoxes; i++) {
          if (comp === 'body' && gameState.wingActive && i === wingBoxIndex) continue;
          if (!markedList.includes(i)) { targetIndex = i; break; }
        }
      }
      if (targetIndex !== -1) {
        markedList.push(targetIndex);
        const totalEng = gameState.baseValues.engine + gameState.allocations.engine;
        const engUsed = gameState.markedUsages.engine.length;
        if (comp === 'brakes' && gameState.kersState === 'empty' && (totalEng - engUsed > 0)) {
          gameState.kersState = 'charged';
        }
      }
    }
  }

  renderBoard();
  saveGameState();
}

function toggleWorkshopPoint(index) {
  if (inspectingPilotId !== null) return;
  if (!gameState.isPitStopActive) return;

  const pos = gameState.workshopUsages.indexOf(index);
  if (pos > -1) gameState.workshopUsages.splice(pos, 1);
  else gameState.workshopUsages.push(index);
  renderBoard();
  saveGameState();
}

function isBodyCompletelyDestroyed() {
  const totalAvailable = gameState.baseValues.body + gameState.allocations.body;
  const userMarked = gameState.markedUsages.body.length;
  return userMarked >= (totalAvailable - 1);
}

function interactKers() {
  if (inspectingPilotId !== null) return;
  const totalEng = gameState.baseValues.engine + gameState.allocations.engine;
  const engUsed = gameState.markedUsages.engine.length;

  if (gameState.isRaceMode && gameState.isEditingAllowed && gameState.kersState === 'charged' && (totalEng - engUsed > 0)) {
    document.getElementById('modal-kers').style.display = 'flex';
  }
}

function resolveKers(isDamaged) {
  if (isDamaged) {
    gameState.kersState = 'damaged';
    const totalBoxes = 6;
    const totalEnginePoints = gameState.baseValues.engine + gameState.allocations.engine;
    const markedList = gameState.markedUsages.engine;
    let targetIndex = -1;
    for (let i = totalBoxes - totalEnginePoints; i < totalBoxes; i++) {
      if (!markedList.includes(i)) { targetIndex = i; break; }
    }
    if (targetIndex !== -1) markedList.push(targetIndex);
  } else {
    gameState.kersState = 'empty';
  }
  closeModal('modal-kers');
  renderBoard();
  saveGameState();
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

const socket = io('https://lotus-cup-server.onrender.com');

socket.on('connect', () => {
  console.log('Connesso al server di sincronizzazione!');
  socket.emit('richiedi-stanze');
  if (gameState.code) {
    saveCurrentPilotToLobby();
  }
});

socket.on('lista-stanze', (stanzeObj) => {
  remoteLobbiesCache = stanzeObj || {};
  if (document.getElementById('screen-join-game').classList.contains('active')) {
    let combinedLobbies = { ...remoteLobbiesCache };
    let localLobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
    Object.keys(localLobbies).forEach(code => {
      if (!combinedLobbies[code]) {
        combinedLobbies[code] = localLobbies[code];
      }
    });
    renderLobbiesListHTML(combinedLobbies);
  }
});

socket.on('ricevi-scheda', (data) => {
  console.log("Aggiornamento ricevuto dal server per la stanza:", data.code);
  
  let lobbies = JSON.parse(localStorage.getItem('lotus_lobbies') || '{}');
  if (!lobbies[data.code]) {
    lobbies[data.code] = {
      code: data.code,
      circuit: data.circuit,
      host: data.host,
      weather: data.weather,
      date: data.date,
      pilots: {}
    };
  }
  if (!lobbies[data.code].pilots) lobbies[data.code].pilots = {};
  
  let currentStatus = data.isRaceMode ? 'Pronto' : 'In Compilazione';
  lobbies[data.code].pilots[data.playerId] = {
    id: data.playerId,
    name: data.playerName,
    status: currentStatus,
    data: data
  };
  
  localStorage.setItem('lotus_lobbies', JSON.stringify(lobbies));
  localStorage.setItem(`lotus_game_${data.code}_${data.playerId}`, JSON.stringify(data));

  if (document.getElementById('screen-join-game').classList.contains('active')) {
    socket.emit('richiedi-stanze');
    let combinedLobbies = { ...remoteLobbiesCache };
    Object.keys(lobbies).forEach(code => {
      if (!combinedLobbies[code]) combinedLobbies[code] = lobbies[code];
    });
    renderLobbiesListHTML(combinedLobbies);
  }

  if (gameState.code === data.code && inspectingPilotId === data.playerId) {
    gameState = data;
    initSetupScreen();
  } else {
    renderOpponentsList();
  }
});

socket.on('stanza-eliminata-globale', (code) => {
  console.log("Stanza eliminata globalmente dal server:", code);
  executeLocalRoomDeletion(code);
});
