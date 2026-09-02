// ==========================================
// MODULO: SCRIPT PONTE / ENTRY POINT (script.js)
// Collega l'HTML monolitico ai moduli JavaScript moderni
// ==========================================

import { applyTheme, inizializzaLayout } from './layout.js';             // 1. Gestione Tema Grafico
import { gameState, updateGameState } from './state.js';                 // 2. Gestione Stato Globale
import { gestisciMeteo } from './weather.js';                            // 3. Gestione Meteo
import { aggiornaTelemetria } from './telemetryGrid.js';                 // 4. Gestione Telemetria
import { inizializzaSchedaPilota, gestisciAssegnazioneBudget, ufficializzaSchedaPerGara} from './mainSchedaController.js';



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

    // Genera la data odierna formattata (es. 31/08/2026 o formato esteso)
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

    // Passa alla schermata di setup/gioco
    window.showScreen('screen-setup');
    
    // Aggiorna i testi nell'header della plancia
    document.getElementById('display-circuit').innerText = circuit.toUpperCase();
    document.getElementById('display-meta').innerText = `Data: ${todayFormatted} | Pilota: ${host}`;
    document.getElementById('display-code').innerText = gameState.code;
};

window.startConfiguration = function() {
    // Aggiorna lo stato globale per attivare la modalità setup
    updateGameState({
        isSetupMode: true,
        budget: 13 // Inizializza il budget fisso a 13 punti come da regolamento
    });

    // Abilita la classe di stato attivo sul contenitore della schermata di setup
    const setupScreen = document.getElementById('screen-setup');
    if (setupScreen) {
        setupScreen.classList.add('setup-active');
    }

    // Modifica la visibilità dei pulsanti e della barra budget nell'HTML
    const btnStart = document.getElementById('btn-start-config');
    const btnLock = document.getElementById('btn-lock-setup');
    const budgetBar = document.getElementById('budget-bar');
    const budgetCount = document.getElementById('budget-count');

    if (btnStart) btnStart.style.display = 'none';
    if (btnLock) {
        btnLock.style.display = 'block';
        btnLock.disabled = true; // Si sbloccherà quando arrivi a 0 punti o decidi di ufficializzare
    }
    if (budgetBar) budgetBar.style.display = 'block';
    if (budgetCount) budgetCount.innerText = gameState.budget;

    console.log("Fase di configurazione avviata. Budget disponibile: 13 punti.");
};

window.officializeSetup = function() {
    // Chiama la funzione di validazione e transizione nel Controller
    const risultato = ufficializzaSchedaPerGara();

    if (!risultato.operazioneRiuscita) {
        alert(risultato.messaggioDescrittivo);
        return;
    }

    // Se l'operazione è riuscita, aggiorna l'interfaccia HTML
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

                // Salta le caselle che contengono già i valori base fissi (es. '1' nativo)
                if (box.dataset.base === "true" || (box.innerText.trim() !== '' && !box.classList.contains('user-allocated'))) {
                    return;
                }

                const tipoComponente = righeComponenti[rowId];
                const boxesNellaRiga = Array.from(container.querySelectorAll('.box'));
                
                // Filtra solo le caselle modificabili (escludendo quelle base fisse)
                const isDaDestra = componentiDaDestra.includes(tipoComponente);
                
                const puntiAttuali = gameState.allocations[tipoComponente] || 0;
                const indiceBox = boxesNellaRiga.indexOf(box);

                // Determina se il box cliccato è quello valido per aggiungere o rimuovere
                let delta = 0;
                let indiceTarget;

                if (isDaDestra) {
                    // Per le sezioni di destra: partono da destra verso sinistra
                    // Le caselle base sono in fondo (ultime 2), le 4 vuote sono prima
                    const indicePrimoBase = boxesNellaRiga.findIndex(b => b.innerText.trim() !== '' && !b.classList.contains('user-allocated'));
                    const indiceUltimaVuota = indicePrimoBase - 1;
                    const indiceUltimaAllocata = indiceUltimaVuota - puntiAttuali + 1;

                    if (box.classList.contains('user-allocated') && indiceBox === indiceUltimaAllocata) {
                        delta = -1; // Rimozione dell'ultimo punto aggiunto
                    } else if (!box.classList.contains('user-allocated') && indiceBox === indiceUltimaVuota - puntiAttuali) {
                        delta = 1; // Aggiunta del prossimo punto
                    } else {
                        return; // Click non valido secondo la sequenza
                    }
                } else {
                    // Per le sezioni di sinistra: partono da sinistra verso destra
                    const indicePrimaBase = boxesNellaRiga.findIndex(b => b.innerText.trim() !== '' && !b.classList.contains('user-allocated'));
                    // Le caselle vuote sono all'inizio o dopo le base
                    const offsetInizio = boxesNellaRiga.findIndex(b => b.innerText.trim() === '');
                    const indiceProssimoDaAggiungere = offsetInizio + puntiAttuali;
                    const indiceUltimoAggiunto = offsetInizio + puntiAttuali - 1;

                    if (box.classList.contains('user-allocated') && indiceBox === indiceUltimoAggiunto) {
                        delta = -1; // Rimozione
                    } else if (!box.classList.contains('user-allocated') && indiceBox === indiceProssimoDaAggiungere) {
                        delta = 1; // Aggiunta
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


// Funzioni di test rapido per verificare il caricamento dei moduli
console.log("Lotus Cup 2k25: Script Main orchestrato correttamente.");
