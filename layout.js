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
        <svg class="kers-svg arcReactorSvgIcon" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;">
            <circle cx="50" cy="50" r="44" stroke-width="6"/>
            <circle cx="50" cy="50" r="32" stroke-width="4"/>
            <line x1="50" y1="6" x2="50" y2="18" stroke-width="7"/>
            <line x1="50" y1="82" x2="50" y2="94" stroke-width="7"/>
            <line x1="6" y1="50" x2="18" y2="50" stroke-width="7"/>
            <line x1="82" y1="50" x2="94" y2="50" stroke-width="7"/>
            <line x1="19" y1="19" x2="28" y2="28" stroke-width="7"/>
            <line x1="72" y1="72" x2="81" y2="81" stroke-width="7"/>
            <line x1="19" y1="81" x2="28" y2="72" stroke-width="7"/>
            <line x1="72" y1="28" x2="81" y2="19" stroke-width="7"/>
            <circle cx="50" cy="50" r="20" stroke-width="4"/>
            <circle cx="50" cy="50" r="10" fill="currentColor"/>
        </svg>
    `,
    cyberpunk: `
        <svg class="kers-svg powerSvgIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:20px;height:20px;">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
            <line x1="12" y1="2" x2="12" y2="12" />
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

