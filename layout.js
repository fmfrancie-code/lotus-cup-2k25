// ==========================================
// MODULO: LAYOUT & TEMI (layout.js)
// Gestione dei temi grafici (Iron-Man / Cyber-Punk)
// ==========================================

import { gameState, updateGameState } from './state.js';
import { gestisciAssegnazioneBudget } from './mainSchedaController.js';

/**
 * Icone SVG per il KERS in base al tema attivo
 */
const ICONS = {
    ironman: `
        <svg class="kers-svg arcReactorSvgIcon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f5d061" stroke-width="6"/>
            <circle cx="50" cy="50" r="25" fill="none" stroke="#00f0ff" stroke-width="4" stroke-dasharray="10, 5"/>
            <circle cx="50" cy="50" r="10" fill="#00f0ff"/>
        </svg>
    `,
    cyberpunk: `
        <svg class="kers-svg powerSvgIcon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 15 v35" fill="none" stroke="#00f0ff" stroke-width="10" stroke-linecap="round"/>
            <path d="M32 28 a30 30 0 1 0 36 0" fill="none" stroke="#00f0ff" stroke-width="10" stroke-linecap="round"/>
        </svg>
    `
};

/**
 * Applica il tema grafico selezionato all'interfaccia dell'applicazione.
 * @param {string} themeName - Nome del tema ('ironman' o 'cyberpunk')
 */
export function applyTheme(themeName) {

    // Elenco dei temi attuali e futuri delle scuderie
    const supportedThemes = ['ironman', 'cyberpunk', 'redbull', 'mcdonalds', 'chupachups', 'octan', 'kinder'];
    // Verifica se il tema scelto è valido, altrimenti usa 'ironman' come default
    const validTheme = supportedThemes.includes(themeName) ? themeName : 'ironman';
    
    // Aggiorna lo stato globale
    updateGameState({ theme: validTheme });

    const allThemeClasses = supportedThemes.map(t => `theme-${t}`);
    document.body.classList.remove(...allThemeClasses);
    document.body.classList.add(`theme-${validTheme}`);

    // Sincronizza l'eventuale selettore nel DOM se presente
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect && themeSelect.value !== validTheme) {
        themeSelect.value = validTheme;
    }

    // Aggiorna le icone KERS dinamiche sulla plancia
    updateKersIconsVisual(validTheme);
}

/**
 * Restituisce l'icona SVG del KERS appropriata per il tema corrente.
 * @param {string} themeName 
 * @returns {string} Markup HTML dell'icona
 */
export function getKersIconHtml(themeName) {
    return ICONS[themeName] || ICONS.ironman;
}

/**
 * Aggiorna visivamente tutte le istanze dell'icona KERS presenti nella UI.
 * @param {string} themeName 
 */
function updateKersIconsVisual(themeName) {
    const kersContainers = document.querySelectorAll('.kers-icon-container');
    kersContainers.forEach(container => {
        // Aggiorna l'icona solo se non è in stato di errore/danno (X rossa)
        if (!container.classList.contains('x-red')) {
            container.innerHTML = getKersIconHtml(themeName);
        }
    });
}

/**
 * Inizializza gli elementi visivi del layout all'avvio dell'applicazione
 */
export function inizializzaLayout() {
    if (gameState && gameState.theme) {
        applyTheme(gameState.theme);
    }
}

/**
 * Aggiorna visivamente il contatore del budget residuo e lo stato del pulsante di blocco.
 * 
 * @param {number} budgetResiduo - I punti budget rimasti
 */
export function aggiornaInterfacciaBudget(budgetResiduo) {
    const budgetCount = document.getElementById('budget-count');
    if (budgetCount) budgetCount.innerText = budgetResiduo;

    const btnLock = document.getElementById('btn-lock-setup');
    if (btnLock) {
        btnLock.disabled = (budgetResiduo > 0);
    }

    const setupScreen = document.getElementById('screen-setup');
    if (setupScreen) {
        if (budgetResiduo === 0) {
            setupScreen.classList.add('budget-zero');
        } else {
            setupScreen.classList.remove('budget-zero');
        }
    }
}

/**
 * Inizializza i listener di interazione sulla plancia di setup e gestione punti.
 */
export function inizializzaInterazionePlancia() {
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
        if (container && !container.dataset.listenerAttached) {
            container.dataset.listenerAttached = "true";
            
            container.addEventListener('click', (e) => {
                if (!gameState.isSetupMode) return;
                e.stopImmediatePropagation();
                
                const box = e.target.closest('.box');
                if (!box) return;

                if (box.dataset.base === "true" || box.classList.contains('wing-disabled')) return;

                const tipoComponente = righeComponenti[rowId];
                const boxesNellaRiga = Array.from(container.querySelectorAll('.box'));
                
                const isDaDestra = componentiDaDestra.includes(tipoComponente);

                let delta = 0;
                let targetBox = null;

                const boxesValide = boxesNellaRiga.filter(b => !b.classList.contains('wing-disabled') && b.dataset.base !== "true");
                const caselleAllocate = boxesValide.filter(b => b.classList.contains('user-allocated'));

                if (!isDaDestra) {
                    const primaCasellaVuota = boxesValide.find(b => b.innerText.trim() === '');
                    if (box.classList.contains('user-allocated')) {
                        if (caselleAllocate.length > 0) {
                            delta = -1;
                            // Rimuove l'ultimo punto inserito dall'utente (in ordine da sinistra a destra)
                            targetBox = caselleAllocate[caselleAllocate.length - 1];
                        }
                    } else if (box.innerText.trim() === '' && primaCasellaVuota) {
                        delta = 1;
                        targetBox = primaCasellaVuota;
                    }
                } else {
                    // SEZIONI DI DESTRA (Telaio, Motore, Sospensioni)
                    let targetPool = boxesValide;
                    if (tipoComponente === 'body') {
                        const indiceDisabilitato = boxesNellaRiga.findIndex(b => b.classList.contains('wing-disabled'));
                        if (indiceDisabilitato !== -1) {
                            // Esclude le caselle a sinistra di quella disabilitata dall'alettone
                            targetPool = boxesValide.filter(b => boxesNellaRiga.indexOf(b) > indiceDisabilitato);
                        }
                    }

                    const primeVuoteDaDestra = [...targetPool].reverse();
                    const primaCasellaVuota = primeVuoteDaDestra.find(b => b.innerText.trim() === '');

                    if (box.classList.contains('user-allocated')) {
                        if (caselleAllocate.length > 0) {
                            delta = -1;
                            // Nelle sezioni da destra, rimuove la prima casella allocata incontrata partendo da destra
                            targetBox = caselleAllocate[0];
                        }
                    } else if (box.innerText.trim() === '' && primaCasellaVuota) {
                        delta = 1;
                        targetBox = primaCasellaVuota;
                    }
                }

                if (delta !== 0 && targetBox) {
                    const risultato = gestisciAssegnazioneBudget(tipoComponente, delta);
                    if (risultato.operazioneRiuscita) {
                        if (delta > 0) {
                            targetBox.classList.add('user-allocated');
                            targetBox.innerText = '1';
                        } else {
                            targetBox.classList.remove('user-allocated');
                            targetBox.innerText = '';
                        }
                        // Aggiorna istantaneamente il budget residuo (incrementandolo in caso di rimozione)
                        aggiornaInterfacciaBudget(risultato.budgetResiduo);
                    } else if (risultato.messaggioDescrittivo) {
                        alert(risultato.messaggioDescrittivo);
                    }
                }
            });
        }
    });
}
