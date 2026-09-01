// ==========================================
// MODULO: TEMPO & METEO (weather.js)
// Gestione del meteo, asfalto e dadi con parametri parlanti
// ==========================================

import { gameState, updateGameState } from './state.js';

/**
 * Inizializza o imposta la condizione meteorologica iniziale della gara.
 * 
 * @param {string} condizioneMeteorologicaIniziale - Valori ammessi: 'sun' (Sole Fisso), 'rain' (Pioggia Fissa), 'var_dry' (Variabile Asciutto), 'var_wet' (Variabile Bagnato)
 */
export function inizializzaMeteoGara(condizioneMeteorologicaIniziale) {
    updateGameState({
        weather: condizioneMeteorologicaIniziale,
        weatherLastCheck: null
    });
}

/**
 * Verifica se lo stato corrente dell'asfalto è bagnato in base alle regole di business della gara.
 * 
 * @returns {boolean} - Restituisce 'true' se l'asfalto è bagnato (Pioggia o Variabile Bagnato), 'false' se asciutto.
 */
export function verificaSeAsfaltoBagnato() {
    const condizioneMeteoCorrente = gameState.weather;
    
    const corrispondeABagnatoFissoOVariabileBagnato = (condizioneMeteoCorrente === 'rain' || condizioneMeteoCorrente === 'var_wet');
    const corrispondeAAsciuttoFissoOVariabileAsciutto = (condizioneMeteoCorrente === 'sun' || conditioneMeteoCorrente === 'var_dry');
    
    if (corrispondeABagnatoFissoOVariabileBagnato) {
        return true;
    }
    
    if (corrispondeAAsciuttoFissoOVariabileAsciutto) {
        return false;
    }
    
    return false;
}

/**
 * Esegue il turno di controllo e transizione per il meteo variabile tramite il tiro del dado.
 * 
 * @param {string} esitoTiroDadoMeteo - Risultato del lancio del dado ('sun' oppure 'rain')
 * @returns {Object} - Restituisce un oggetto contenente l'esito dell'operazione, lo stato aggiornato e un messaggio descrittivo per l'utente.
 */
export function eseguiControlloMeteoVariabile(esitoTiroDadoMeteo) {
    const condizioneMeteoCorrente = gameState.weather;
    
    const ilMeteoNonEVariabile = (condizioneMeteoCorrente !== 'var_dry' && condizioneMeteoCorrente !== 'var_wet');
    if (ilMeteoNonEVariabile) {
        return { 
            operazioneRiuscita: false, 
            messaggioDescrittivo: "Il meteo attuale non è di tipo variabile; il controllo meteo non è applicabile." 
        };
    }

    const ultimoEsitoRegistrato = gameState.weatherLastCheck;
    let messaggioRisultato = "";
    let nuovaCondizioneMeteo = condizioneMeteoCorrente;

    const nessunControlloPrecedenteRegistrato = (ultimoEsitoRegistrato === null);
    const esitoTiroCorrenteUgualeAlPrecedente = (ultimoEsitoRegistrato === esitoTiroDadoMeteo);

    if (nessunControlloPrecedenteRegistrato) {
        // Primo tiro di controllo della sessione variabile
        updateGameState({ weatherLastCheck: esitoTiroDadoMeteo });
        
        nuovaCondizioneMeteo = (esitoTiroDadoMeteo === 'rain') ? 'var_wet' : 'var_dry';
        updateGameState({ weather: nuovaCondizioneMeteo });
        
        messaggioRisultato = `Primo controllo meteo eseguito: esito registrato [${esitoTiroDadoMeteo.toUpperCase()}]. Stato dell'asfalto aggiornato transitoriamente.`;
        
    } else if (esitoTiroCorrenteUgualeAlPrecedente) {
        // Tiro consecutivo IDENTICO -> Stabilizzazione definitiva del meteo
        const condizioneMeteoFissaDefinitiva = (esitoTiroDadoMeteo === 'rain') ? 'rain' : 'sun';
        
        updateGameState({
            weather: condizioneMeteoFissaDefinitiva,
            weatherLastCheck: null
        });
        
        const nomeMeteoUmano = (condizioneMeteoFissaDefinitiva === 'rain') ? 'Pioggia Fissa' : 'Sole Fisso';
        messaggioRisultato = `Doppio esito consecutivo [${esitoTiroDadoMeteo.toUpperCase()}]! Il meteo si è STABILIZZATO definitivamente ed è diventato: ${nomeMeteoUmano}.`;
        
    } else {
        // Tiro consecutivo ALTERNATO -> Cambio della perturbazione ma permanenza nello stato variabile
        nuovaCondizioneMeteo = (esitoTiroDadoMeteo === 'rain') ? 'var_wet' : 'var_dry';
        
        updateGameState({
            weather: nuovaCondizioneMeteo,
            weatherLastCheck: esitoTiroDadoMeteo
        });
        
        messaggioRisultato = `Esito alternato rilevato ([${esitoTiroDadoMeteo.toUpperCase()}]): la perturbazione cambia stato dell'asfalto, ma il regime meteo rimane variabile.`;
    }

    return { 
        operazioneRiuscita: true, 
        meteoAggiornato: gameState.weather, 
        ultimoCheckAggiornato: gameState.weatherLastCheck, 
        messaggioDescrittivo: messaggioRisultato 
    };
}

/**
 * Restituisce l'elenco delle mescole di pneumatici che sono legalmente abilitate in base allo stato attuale dell'asfalto.
 * 
 * @returns {Array<string>} - Array contenente i nomi delle mescole permesse (es. ['Prime', 'Option', 'Intermedie'])
 */
export function ottieniMescoleAbilitatePerAsfaltoCorrente() {
    const asfaltoBagnatoAttivo = verificaSeAsfaltoBagnato();
    
    if (asfaltoBagnatoAttivo) {
        // Con asfalto bagnato sono permesse solo Intermedie e Pioggia
        return ['Intermedie', 'Pioggia'];
    } else {
        // Con asfalto asciutto sono permesse Prime, Option e Intermedie
        return ['Prime', 'Option', 'Intermedie'];
    }
}
