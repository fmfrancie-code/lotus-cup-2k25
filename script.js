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
    // Aggiorna lo stato globale per attivare la modalitÃ  setup
    updateGameState({
        isSetupMode: true,
        budget: 13 // Inizializza il budget fisso a 13 punti come da regolamento
    });

    // Modifica la visibilità  dei pulsanti e della barra budget nell'HTML
    const btnStart = document.getElementById('btn-start-config');
    const btnLock = document.getElementById('btn-lock-setup');
    const budgetBar = document.getElementById('budget-bar');
    const budgetCount = document.getElementById('budget-count');

    if (btnStart) btnStart.style.display = 'none';
    if (btnLock) {
        btnLock.style.display = 'block';
        btnLock.disabled = true; // Si sbloccherà  quando arrivi a 0 punti o decidi di ufficializzare
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

    // Componenti che si riempiono da destra verso sinistra (speculari)
    const componentiDaDestra = ['body', 'engine', 'suspension'];

    Object.keys(righeComponenti).forEach(rowId => {
        const container = document.getElementById(rowId);
        if (container) {
            container.addEventListener('click', (e) => {
                if (!gameState.isSetupMode) return;
                
                const box = e.target.closest('.box');
                if (!box) return;

                const tipoComponente = righeComponenti[rowId];
                const boxesNellaRiga = Array.from(container.querySelectorAll('.box'));
                const indiceBox = boxesNellaRiga.indexOf(box);
                
                const puntiAttuali = gameState.allocations[tipoComponente] || 0;
                
                // Determina la direzione e l'indice logico del punto in base al componente
                let delta = 1;
                const isDaDestra = componentiDaDestra.includes(tipoComponente);
                
                // Verifica se la casella cliccata è già attiva/pre-selected
                const eGiaAttiva = box.classList.contains('pre-selected');

                if (eGiaAttiva) {
                    // Se è già attiva, vogliamo rimuoverla (-1)
                    delta = -1;
                } else {
                    // Controllo sequenzialità: l'utente deve riempire/svuotare in modo ordinato
                    // (es. il prossimo box valido deve essere adiacente all'ultimo allocato)
                    const prossimoIndiceValido = isDaDestra 
                        ? boxesNellaRiga.length - 1 - puntiAttuali 
                        : puntiAttuali;

                    if (indiceBox !== prossimoIndiceValido) {
                        // Se clicca una casella fuori sequenza, ignoriamo o gestiamo
                        return;
                    }
                    delta = 1;
                }

                // Interpella il Controller per la logica dei punti budget
                const risultato = gestisciAssegnazioneBudget(tipoComponente, delta);

                if (risultato.operazioneRiuscita) {
                    if (delta > 0) {
                        box.classList.add('pre-selected');
                        box.innerText = '1';
                    } else {
                        box.classList.remove('pre-selected');
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
