// ==========================================
// MODULO: STATE (state.js)
// Gestione dello stato globale e localStorage
// ==========================================

export let gameState = {
    code: null,
    circuit: '',
    host: '',
    date: '',
    playerName: '',
    playerId: '',
    theme: 'ironman',
    isSetupMode: false,
    isRaceMode: false,
    isEditingAllowed: false,
    isPitStopActive: false,
    weather: 'var_dry',
    budget: 13,
    weatherLastCheck: null,
    selectedTyre: 'Prime',
    tyreLaps: { Prime: [], Option: [], Intermedie: [], Pioggia: [] },
    wingActive: false,
    kersState: 'empty', // 'empty', 'charged', 'damaged'
    baseValues: { tyres: 4, brakes: 2, fuel: 2, body: 2, engine: 2, suspension: 1 },
    allocations: { tyres: 0, brakes: 0, fuel: 0, body: 0, engine: 0, suspension: 0 },
    markedUsages: { tyres: [], brakes: [], fuel: [], body: [], engine: [], suspension: [] },
    workshopUsages: [],
    workshopStartCount: 0,
    pitStopStartLap: null,
    isReady: false
};

/**
 * Aggiorna parzialmente o totalmente lo stato globale del gioco.
 * @param {Object} newState - Proprietà da aggiornare nello stato
 */
export function updateGameState(newState) {
    gameState = { ...gameState, ...newState };
    saveGameState();
}

/**
 * Salva lo stato corrente nel localStorage del browser del client.
 */
export function saveGameState() {
    if (!gameState.code || !gameState.playerId) return;
    try {
        const key = `lotus_game_${gameState.code}_${gameState.playerId}`;
        localStorage.setItem(key, JSON.stringify(gameState));
    } catch (e) {
        console.error("Errore durante il salvataggio nel localStorage:", e);
    }
}

/**
 * Carica lo stato dal localStorage se esiste una sessione salvata.
 * @param {string} code - Codice della stanza
 * @param {string} playerId - ID univoco del giocatore
 * @returns {boolean} - True se il caricamento è riuscito, false altrimenti
 */
export function loadGameState(code, playerId) {
    try {
        const key = `lotus_game_${code}_${playerId}`;
        const savedData = localStorage.getItem(key);
        if (savedData) {
            gameState = JSON.parse(savedData);
            return true;
        }
    } catch (e) {
        console.error("Errore durante il caricamento dal localStorage:", e);
    }
    return false;
}

/**
 * Resetta lo stato globale ai valori iniziali di default.
 */
export function resetGameState() {
    gameState = {
        code: null, circuit: '', host: '', date: '', playerName: '', playerId: '',
        theme: 'ironman', isSetupMode: false, isRaceMode: false, isEditingAllowed: false,
        isPitStopActive: false, weather: 'var_dry', budget: 13, weatherLastCheck: null,
        selectedTyre: 'Prime', tyreLaps: { Prime: [], Option: [], Intermedie: [], Pioggia: [] },
        wingActive: false, kersState: 'empty', baseValues: { tyres: 4, brakes: 2, fuel: 2, body: 2, engine: 2, suspension: 1 },
        allocations: { tyres: 0, brakes: 0, fuel: 0, body: 0, engine: 0, suspension: 0 },
        markedUsages: { tyres: [], brakes: [], fuel: [], body: [], engine: [], suspension: [] },
        workshopUsages: [], workshopStartCount: 0, pitStopStartLap: null, isReady: false
    };
}