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
            <!-- Anello esterno dentato/segmentato -->
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="3"/>
            <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" stroke-width="6" stroke-dasharray="10, 4, 2, 4"/>
            <!-- Anello geometrico interno -->
            <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M50 18 L50 30 M50 70 L50 82 M18 50 L30 50 M70 50 L82 50 M27 27 L36 36 M64 64 L73 73 M27 73 L36 64 M64 36 L73 27" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            <!-- Nucleo centrale del reattore -->
            <circle cx="50" cy="50" r="14" fill="none" stroke="currentColor" stroke-width="3"/>
            <circle cx="50" cy="50" r="6" fill="currentColor"/>
        </svg>
    `,
    cyberpunk: `
        <svg class="kers-svg powerSvgIcon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 15 v35" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>
            <path d="M32 28 a30 30 0 1 0 36 0" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>
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

