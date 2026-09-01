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
    const nuoveAssegnazioniComponenti = { ...gameState.allocations };
    const valoreAttuale = nuoveAssegnazioniComponenti[tipoComponente] || 0;

    // CASO 1: Aggiunta punto (+1)
    if (delta > 0) {
        if (budgetDisponibileAttuale <= 0) {
            return {
                operazioneRiuscita: false,
                messaggioDescrittivo: "Budget esaurito! Non puoi assegnare altri punti in fase di setup."
            };
        }

        nuoveAssegnazioniComponenti[tipoComponente] = valoreAttuale + 1;
        const nuovoBudgetRimanente = budgetDisponibileAttuale - 1;

        updateGameState({
            budget: nuovoBudgetRimanente,
            allocations: nuoveAssegnazioniComponenti
        });

        return {
            operazioneRiuscita: true,
            budgetResiduo: nuovoBudgetRimanente,
            assegnazioniAggiornate: nuoveAssegnazioniComponenti,
            messaggioDescrittivo: `Punto assegnato a [${tipoComponente}]. Budget rimanente: ${nuovoBudgetRimanente}.`
        };
    }

    // CASO 2: Rimozione punto (-1)
    if (delta < 0) {
        if (valoreAttuale <= 0) {
            return {
                operazioneRiuscita: false,
                messaggioDescrittivo: `Non ci sono punti da rimuovere su [${tipoComponente}].`
            };
        }

        nuoveAssegnazioniComponenti[tipoComponente] = valoreAttuale - 1;
        const nuovoBudgetRimanente = budgetDisponibileAttuale + 1;

        updateGameState({
            budget: nuovoBudgetRimanente,
            allocations: nuoveAssegnazioniComponenti
        });

        return {
            operazioneRiuscita: true,
            budgetResiduo: nuovoBudgetRimanente,
            assegnazioniAggiornate: nuoveAssegnazioniComponenti,
            messaggioDescrittivo: `Punto rimosso da [${tipoComponente}]. Budget ripristinato: ${nuovoBudgetRimanente}.`
        };
    }

    return {
        operazioneRiuscita: false,
        messaggioDescrittivo: "Operazione non valida."
    };
}

/**
 * Restituisce le mescole abilitabili in fase di setup in base alla condizione meteo fissa o variabile.
 * 
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
