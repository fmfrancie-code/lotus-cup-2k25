// ==========================================
// MODULO: TELEMETRIA E PILOTI IN GARA (telemetryGrid.js)
// Gestione griglia avversari, scouting e stati live
// ==========================================

import { gameState } from './state.js';

/**
 * Ordina e prepara la lista dei piloti connessi posizionando in cima il proprio profilo
 * contrassegnato da "(Tu)" e ordinando al anagrafica i restanti partecipanti.
 * 
 * @param {Array<Object>} elencoPilotiConnessiStanza - Lista grezza dei piloti dal server
 * @returns {Array<Object>} - Lista ordinata e formattata per la griglia di telemetria
 */
export function formattaEOrdinaGrigliaPiloti(elencoPilotiConnessiStanza) {
    const idGiocatoreLocale = gameState.playerId;

    // Ordina posizionando il giocatore locale in cima e gli altri in ordine alfabetico per nome
    const elencoOrdinato = [...elencoPilotiConnessiStanza].sort((pilotaA, pilotaB) => {
        if (pilotaA.id === idGiocatoreLocale) return -1;
        if (pilotaB.id === idGiocatoreLocale) return 1;
        return pilotaA.name.localeCompare(pilotaB.name);
    });

    return elencoOrdinato.map(pilotaCorrente => {
        const eIlGiocatoreLocale = (pilotaCorrente.id === idGiocatoreLocale);
        const etichettaNomeVisualizzato = eIlGiocatoreLocale ? `${pilotaCorrente.name} (Tu)` : pilotaCorrente.name;
        
        // Determina lo stato in tempo reale della scheda
        const statoSchedaCorrente = pilotaCorrente.isReady ? "Pronto" : "In Compilazione";

        return {
            id: pilotaCorrente.id,
            nomeVisualizzato: etichettaNomeVisualizzato,
            statoScheda: statoSchedaCorrente,
            eIlProprioProfilo: eIlGiocatoreLocale,
            datiSchedaAvversario: pilotaCorrente.boardData || null
        };
    });
}

/**
 * Attiva la modalità  di ispezione (scouting) di un avversario in sola lettura.
 * 
 * @param {string} idPilotaDaIspezionare - ID del pilota avversario selezionato nella griglia
 * @param {Array<Object>} elencoPilotiConnessiStanza - Lista completa dei partecipanti
 * @returns {Object} - Dati della scheda dell'avversario e banner di avviso
 */
export function attivaModalitaIspezioneAvversario(idPilotaDaIspezionare, elencoPilotiConnessiStanza) {
    const pilotaTarget = elencoPilotiConnessiStanza.find(p => p.id === idPilotaDaIspezionare);

    if (!pilotaTarget) {
        return {
            operazioneRiuscita: false,
            messaggioDescrittivo: "Impossibile trovare il pilota selezionato nella stanza."
        };
    }

    return {
        operazioneRiuscita: true,
        nomeAvversarioIspezionato: pilotaTarget.name,
        schedaInSolaLettura: pilotaTarget.boardData,
        messaggioDescrittivo: `Stai ispezionando la scheda di ${pilotaTarget.name} in modalità  sola lettura.`
    };
}
