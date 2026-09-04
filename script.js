// ==========================================
// MODULO: SCRIPT PONTE / ENTRY POINT (script.js)
// Collega l'HTML monolitico ai moduli JavaScript moderni
// ==========================================

import { applyTheme, inizializzaLayout, aggiornaInterfacciaBudget, inizializzaInterazionePlancia } from './layout.js';       // 1. Gestione Tema Grafico
import { gameState, updateGameState } from './state.js';                                                                     // 2. Gestione Stato Globale
import { gestisciMeteo } from './weather.js';                                                                                // 3. Gestione Meteo
import { aggiornaTelemetria } from './telemetryGrid.js';                                                                     // 4. Gestione Telemetria
import { inizializzaSchedaPilota, gestisciAssegnazioneBudget, ufficializzaSchedaPerGara, toggleAlettoneController } from './mainSchedaController.js';



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

    window.showScreen('screen-setup');
    
    document.getElementById('display-circuit').innerText = circuit.toUpperCase();
    document.getElementById('display-meta').innerText = `Data: ${todayFormatted} | Pilota: ${host}`;
    document.getElementById('display-code').innerText = gameState.code;
};

window.startConfiguration = function() {
    updateGameState({
        isSetupMode: true,
        budget: 13 
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

    console.log("Fase di configurazione avviata. Budget disponibile: 13 punti.");
};

window.officializeSetup = function() {
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
    console.log("Gara ufficialmente avviata!");
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

    // Sezioni che riempiono da destra verso sinistra
    const componentiDaDestra = ['body', 'engine', 'suspension'];

    Object.keys(righeComponenti).forEach(rowId => {
        const container = document.getElementById(rowId);
        if (container) {
            container.addEventListener('click', (e) => {
                if (!gameState.isSetupMode) return;
                
                const box = e.target.closest('.box');
                if (!box) return;

                // Ignora caselle base fisse o disabilitate dall'alettone
                if (box.dataset.base === "true" || box.classList.contains('wing-disabled')) return;

                const tipoComponente = righeComponenti[rowId];
                const boxesNellaRiga = Array.from(container.querySelectorAll('.box'));
                const isDaDestra = componentiDaDestra.includes(tipoComponente);
                const indiceBox = boxesNellaRiga.indexOf(box);

                let delta = 0;

                if (isDaDestra) {
                    // SEZIONI DI DESTRA: riempimento da destra a sinistra
                    // Filtra le caselle escludendo quelle disabilitate dall'alettone
                    const boxesValide = boxesNellaRiga.filter(b => !b.classList.contains('wing-disabled'));
                    const primeVuoteDaDestra = boxesValide.reverse();
                    
                    // Trova la prima casella disponibile partendo da destra (la prima vuota)
                    const primaCasellaVuota = primeVuoteDaDestra.find(b => b.innerText.trim() === '');
                    const ultimaAllocata = boxesValide.find(b => b.classList.contains('user-allocated') && boxesValide.indexOf(b) === boxesValide.lastIndexOf(b)); // o l'ultima della serie

                    // Se clicchi sull'ultima casella allocata, la rimuove (-1)
                    if (box.classList.contains('user-allocated')) {
                        // Verifica se è l'ultima casella attiva della sequenza da destra
                        const caselleAllocate = boxesValide.filter(b => b.classList.contains('user-allocated'));
                        if (caselleAllocate.length > 0 && box === caselleAllocate[0]) { // la più a destra tra le allocate
                            delta = -1;
                        } else {
                            return;
                        }
                    } else if (box.innerText.trim() === '' && primaCasellaVuota && box === primaCasellaVuota) {
                        // Cliccando su qualsiasi casella vuota, attiva la prima disponibile da destra
                        delta = 1;
                    } else {
                        // Se clicchi su una casella vuota ma ce n'è una più a destra libera, forza la prima disponibile
                        if (primaCasellaVuota) {
                            delta = 1;
                            // Reindirizza l'azione sulla vera prima casella vuota da destra
                            const risultato = gestisciAssegnazioneBudget(tipoComponente, 1);
                            if (risultato.operazioneRiuscita) {
                                primaCasellaVuota.classList.add('user-allocated');
                                primaCasellaVuota.innerText = '1';
                                aggiornaInterfacciaBudget(risultato.budgetResiduo);
                            } else {
                                alert(risultato.messaggioDescrittivo);
                            }
                        }
                        return;
                    }
                } else {
                    // SEZIONI DI SINISTRA (Pneumatici, Freni, Carburante): riempimento da sinistra a destra
                    const boxesValide = boxesNellaRiga.filter(b => !b.classList.contains('wing-disabled'));
                    const primaCasellaVuota = boxesValide.find(b => b.innerText.trim() === '');
                    
                    // Trova l'ultima casella allocata dall'utente per permetterne la rimozione
                    const caselleAllocate = boxesValide.filter(b => b.classList.contains('user-allocated'));
                    const ultimaAllocataDallUtente = caselleAllocate.length > 0 ? caselleAllocate[caselleAllocate.length - 1] : null;

                    if (box.classList.contains('user-allocated') && box === ultimaAllocataDallUtente) {
                        delta = -1;
                    } else if (box.innerText.trim() === '') {
                        // Indipendentemente da quale casella vuota si clicca, attiva la prima disponibile da sinistra
                        if (primaCasellaVuota) {
                            const risultato = gestisciAssegnazioneBudget(tipoComponente, 1);
                            if (risultato.operazioneRiuscita) {
                                primaCasellaVuota.classList.add('user-allocated');
                                primaCasellaVuota.innerText = '1';
                                aggiornaInterfacciaBudget(risultato.budgetResiduo);
                            } else {
                                alert(risultato.messaggioDescrittivo);
                            }
                        }
                        return;
                    } else {
                        return;
                    }
                }

                // Gestione rimozione punto (-1)
                if (delta < 0) {
                    const risultato = gestisciAssegnazioneBudget(tipoComponente, delta);
                    if (risultato.operazioneRiuscita) {
                        box.classList.remove('user-allocated');
                        box.innerText = '';
                        aggiornaInterfacciaBudget(risultato.budgetResiduo);
                    }
                }
            });
        }
    });
});

// --- GESTIONE DEI ALETTONE SULLA PLANCIA ---
window.toggleWing = function() {
    const boxWing = document.getElementById('box-wing');
    if (!boxWing) return;

    const containerBody = document.getElementById('row-body');
    if (!containerBody) return;
    
    const boxesBody = Array.from(containerBody.querySelectorAll('.box'));
    const isAttivo = boxWing.classList.contains('wing-active');
    
    const wingSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;color:inherit;">
            <path d="M 2 6 L 22 6 L 20 10 L 4 10 Z" fill="currentColor" fill-opacity="0.2"/>
            <path d="M 2 4 L 4 14 L 2 14 Z"/>
            <path d="M 22 4 L 20 14 L 22 14 Z"/>
            <line x1="9" y1="10" x2="9" y2="17"/>
            <line x1="15" y1="10" x2="15" y2="17"/>
        </svg>
    `;
    
    if (!isAttivo) {
        // Trova la casella più a sinistra tra quelle che contengono '1'
        const primaValorizzata = boxesBody.find(b => b.innerText.trim() === '1' && !b.classList.contains('wing-x'));
        if (!primaValorizzata) {
            alert("Devi prima inserire almeno un punto nel telaio per attivare l'alettone!");
            return;
        }

        boxWing.classList.add('wing-active', 'circle-green');
        boxWing.innerHTML = wingSvg;
        
        primaValorizzata.innerText = 'X';
        primaValorizzata.classList.add('wing-x');
        primaValorizzata.dataset.base = "true";
    } else {
        boxWing.classList.remove('wing-active', 'circle-green');
        boxWing.innerHTML = '';

        const markedBox = boxesBody.find(b => b.classList.contains('wing-x'));
        if (markedBox) {
            markedBox.innerText = '1';
            markedBox.classList.remove('wing-x');
            markedBox.dataset.base = "false";
        }
    }
};
console.log("Lotus Cup 2k25: Script Main orchestrato correttamente.");
