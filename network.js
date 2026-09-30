// MODULO: network.js
import { aggiornaTelemetria } from './telemetryGrid.js';

let socket = null;

// Variabile globale per memorizzare le stanze ricevute dal server
window.activeRoomsFromServer = [];

export function inizializzaConnessioneServer() {
    socket = io('https://lotus-cup-server.onrender.com');

    socket.on('room_update', (roomData) => {
        if (roomData && roomData.pilots) {
            window.currentRoomPilots = roomData.pilots;
            aggiornaTelemetria(roomData.pilots);
        }
    });

    // Riceve la lista aggiornata di tutte le stanze attive sul server
    socket.on('rooms_list_update', (rooms) => {
        window.activeRoomsFromServer = rooms;
    });

    socket.on('room_closed', (data) => {
        alert(data.message || "La stanza è stata chiusa.");
        window.showScreen('screen-home');
    });

    return socket;
}

export function richiediListaStanze() {
    if (socket) socket.emit('get_rooms');
}

export function inviaCreazioneStanza(datiStanza) {
    if (socket) socket.emit('create_room', datiStanza);
}

export function inviaIngressoStanza(datiJoin) {
    if (socket) socket.emit('join_room', datiJoin);
}

export function inviaAggiornamentoStato(datiStato) {
    if (socket) socket.emit('update_pilot_status', datiStato);
}

export function inviaEliminazioneStanza(datiEliminazione) {
    if (socket) socket.emit('delete_room', datiEliminazione);
}
