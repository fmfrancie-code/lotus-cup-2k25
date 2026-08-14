// ==========================================
// MODULO: FASE DI SETUP (setupPhase.js)
// Gestione del budget di 13 punti e validazione iniziale
// ==========================================

import { gameState, updateGameState } from './state.js';

/**
 * Assegna un punto budget dal fondo di setup a uno specifico componente della plancia.
 * 
 * @param {string} tipoComponenteDaPotenziare - Componente scelto ('tyres', 'brakes', 'fuel', 'body', 'engine', 'suspension')
 * @returns {Object} - Stato aggiornato del budget
 */
export function assegnaPuntoBudgetSetup(tipoComponenteDaPotenziare) {
    const budgetDisponibileAttuale = gameState.budget;

    if (budgetDisponibileAttuale <= 0) {
        return {
            operazioneRiuscita: false,
            messaggioDescrittivo: "Budget esaurito! Non puoi assegnare altri punti in fase di setup."
        };
    }

    const nuoveAssegnazioniComponenti = { ...gameState.allocations };
    nuoveAssegnazioniComponenti[tipoComponenteDaPotenziare] += 1;

    const nuovoBudgetRimanente = budgetDisponibileAttuale - 1;

    updateGameState({
        budget: nuovoBudgetRimanente,
        allocations: nuoveAssegnazioniComponenti
    });

    return {
        operazioneRiuscita: true,
        budgetResiduo: nuovoBudgetRimanente,
        assegnazioniAggiornate: nuoveAssegnazioniComponenti,
        messaggioDescrittivo: `Punto assegnato a [${tipoComponenteDaPotenziare}]. Budget rimanente: ${nuovoBudgetRimanente}.`
    };
}

/**
 * Restituisce le mescole abilitabili in fase di setup in base alla condizione meteo fissa o variabile
 * @param {string} condizioneMeteoGara - Stato meteo corrente ('sun', 'rain', 'var_dry', 'var_wet')
 * @returns {Array<string>} - Elenco delle mescole permesse
 */
export function ottieniMescoleAbilitatePerSetupMeteo(condizioneMeteoGara) {
    if (condizioneMeteoGara === 'sun') {
        return ['Prime', 'Option', 'Intermedie'];
    } else if (condizioneMeteoGara === 'rain') {
        return ['Intermedie', 'Pioggia'];
    } else if (condizioneMeteoGara === 'var_dry') {
        return ['Prime', 'Option', 'Intermedie'];
    } else if (condizioneMeteoGara === 'var_wet') {
        return ['Intermedie', 'Pioggia'];
    }
    return ['Prime', 'Option', 'Intermedie'];
}
