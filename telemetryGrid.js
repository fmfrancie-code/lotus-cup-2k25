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
 * Attiva la modalità di ispezione scouting) di un avversario in sola lettura.
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


/**
 * Aggiorna la vista della telemetria e la griglia dei piloti in gara.
 * * @param {Array<Object>} elencoPilotiAggiornato - Lista aggiornata ricevuta dal server
 */
export function aggiornaTelemetria(elencoPilotiAggiornato) {
    const containerItems = document.getElementById('opponents-list-items');
    if (!containerItems) return;

    // Formatta la griglia usando la funzione dedicata
    const grigliaFormattata = formattaEOrdinaGrigliaPiloti(elencoPilotiAggiornato);
    
    // Pulisce e ricostruisce la lista visiva degli avversari
    containerItems.innerHTML = '';
    
    grigliaFormattata.forEach(pilota => {
        const elementoDiv = document.createElement('div');
        elementoDiv.className = 'opp-item';
        elementoDiv.innerHTML = `
            <span><strong>${pilota.nomeVisualizzato}</strong></span>
            <span style="font-size: 0.85rem; color: #00f0ff;">${pilota.statoScheda}</span>
        `;
        
        // Se non è il proprio profilo, permette il click per l'ispezione (scouting)
        if (!pilota.eIlProprioProfilo) {
            elementoDiv.style.cursor = 'pointer';
            elementoDiv.onclick = () => inspectPilotBoard(pilota.id);
        }
        
        containerItems.appendChild(elementoDiv);
    });
}
