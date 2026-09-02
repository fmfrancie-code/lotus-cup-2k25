// ==========================================
// MODULO: LAYOUT & TEMI (layout.js)
// Gestione dei temi grafici (Iron-Man / Cyber-Punk)
// ==========================================

import { gameState, updateGameState } from './state.js';

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
    // Verifica se il tema scelto Ã¨ valido, altrimenti usa 'ironman' come default
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
        // Aggiorna l'icona solo se non Ã¨ in stato di errore/danno (X rossa)
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
}
