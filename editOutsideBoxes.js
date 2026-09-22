// ==========================================
// MODULO: EDIT FUORI DAI BOX (editOutsideBoxes.js)
// Gestione della modalità di modifica in regime di gara
// ==========================================

import { gameState, updateGameState } from './state.js';

export function impostaStatoModalitaEditFuoriBox(statoAbilitazioneEdit) {
    updateGameState({
        isEditingAllowed: statoAbilitazioneEdit
    });

    return {
        operazioneRiuscita: true,
        editConsentito: statoAbilitazioneEdit,
        messaggioDescrittivo: statoAbilitazioneEdit ? "Modale Edit sbloccata." : "Modale Edit bloccata."
    };
}

export function ottieniDirezioneGeometricaComponente(nomeComponente) {
    const componentiSezioneSinistra = ['tyres', 'brakes', 'fuel'];
    const componentiSezioneDestra = ['body', 'engine', 'suspension'];

    if (componentiSezioneSinistra.includes(nomeComponente)) return 'sinistra';
    if (componentiSezioneDestra.includes(nomeComponente)) return 'destra';
    return 'sinistra';
}

export function toggleRaceEdit() {
    if (gameState.isPitStopActive) return;
    const nuovoStato = !gameState.isEditingAllowed;
    const risultato = impostaStatoModalitaEditFuoriBox(nuovoStato);

    const isEditActive = document.body.classList.toggle('edit-mode-active', risultato.editConsentito);
    const btnEdit = document.getElementById('btn-toggle-edit');
    const btnPitStop = document.getElementById('btn-pitstop-action');

    if (btnEdit) {
        if (isEditActive) {
            btnEdit.innerText = "Modalità Edit Sbloccata (Clicca per bloccare)";
            btnEdit.classList.remove('btn-read-mode');
            btnEdit.classList.add('btn-edit-mode');
            if (btnPitStop) btnPitStop.style.display = 'block'; // Mostra il bottone dei box quando l'edit è sbloccato
        } else {
            btnEdit.innerText = "Modalità edit attiva (clicca per sbloccare)";
            btnEdit.classList.remove('btn-edit-mode');
            btnEdit.classList.add('btn-read-mode');
            if (btnPitStop) btnPitStop.style.display = 'none'; // Nasconde il bottone dei box quando l'edit viene bloccato
        }
    }
}
